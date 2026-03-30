# Push Notification System - Architecture & Design

This document describes how the push notification system should work in FaithHub.

---

## Overview

FaithHub uses **Expo Notifications** + **Firebase Cloud Messaging (FCM)** to deliver push notifications to iOS and Android devices. Notifications keep community members informed about new tasks, upcoming events, and organization activity.

---

## Architecture

```
+------------------+       +------------------------+       +------------------+
|   FaithHub App   | ----> |   Firestore Database   | ----> | Cloud Functions  |
| (Expo/React      |       | (stores push tokens,   |       | (triggered on    |
|  Native)         |       |  tasks, events, etc.)  |       |  data changes)   |
+------------------+       +------------------------+       +------------------+
        ^                                                          |
        |                                                          v
        |                                                  +------------------+
        +<------------------------------------------------ |  FCM / APNs     |
                      push notification                    | (delivers to     |
                                                           |  device)         |
                                                           +------------------+
```

**Flow:**
1. App registers for push notifications and stores the device token in Firestore
2. A Firestore write (new task, new event, etc.) triggers a Cloud Function
3. The Cloud Function reads the relevant push tokens from Firestore
4. The Cloud Function sends the notification via FCM (which routes to APNs for iOS)
5. The device receives and displays the notification

---

## 1. Device Token Registration

### When it happens
- On app startup (after user is authenticated)
- On token refresh (Expo emits an event when the token changes)

### How it works
1. Request notification permissions from the user (`Notifications.requestPermissionsAsync()`)
2. Get the Expo push token (`Notifications.getExpoPushTokenAsync()`) or FCM token
3. Store the token in Firestore under the user's document

### Firestore structure
```
users/{uid}
  ├── displayName: "John"
  ├── email: "john@example.com"
  ├── ...existing fields...
  └── pushTokens: ["ExponentPushToken[xxxx]"]   // array to support multiple devices
```

> Using an array allows the same user to receive notifications on multiple devices (e.g., phone + tablet).

### Required package
```bash
npx expo install expo-notifications
```

### app.json plugin config
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/images/notification-icon.png",
        "color": "#1F3B2E"
      }
    ]
  ]
}
```

---

## 2. Notification Types

| Type | Trigger | Recipients | Priority |
|---|---|---|---|
| **New Task** | Task created in organization | All org members (except creator) | Normal |
| **Task Completed** | Task marked as done | Task creator | Normal |
| **New Event** | Event created in organization | All org members (except creator) | Normal |
| **Event Reminder** | Scheduled (1 hour before event) | Members who marked "Attending" | High |
| **New Member Joined** | User joins organization | All existing org members | Low |

### Notification payload format
```json
{
  "to": "ExponentPushToken[xxxx]",
  "title": "New Task",
  "body": "John created: Prepare Sunday worship",
  "data": {
    "type": "new_task",
    "orgId": "org123",
    "taskId": "task456",
    "screen": "tasks"
  }
}
```

The `data.screen` field is used for deep linking — tapping the notification navigates to the correct tab.

---

## 3. Cloud Functions (Backend)

Cloud Functions run on Firebase and are triggered by Firestore document changes.

### Location
```
functions/
  ├── index.ts
  ├── notifications/
  │   ├── onTaskCreated.ts
  │   ├── onTaskCompleted.ts
  │   ├── onEventCreated.ts
  │   ├── onMemberJoined.ts
  │   └── sendPush.ts          // shared helper
  └── package.json
```

### Example: onTaskCreated trigger
```typescript
// Pseudocode
export const onTaskCreated = onDocumentCreated(
  "organizations/{orgId}/tasks/{taskId}",
  async (event) => {
    const task = event.data?.data();
    const orgId = event.params.orgId;
    const creatorId = task.createdBy;

    // 1. Get all org members (except creator)
    const members = await getOrgMembers(orgId, excludeUid: creatorId);

    // 2. Collect their push tokens
    const tokens = await getPushTokens(members);

    // 3. Send notification
    await sendPushNotifications(tokens, {
      title: "New Task",
      body: `${task.creatorName} created: ${task.title}`,
      data: { type: "new_task", orgId, taskId: event.params.taskId, screen: "tasks" }
    });
  }
);
```

### Shared helper: sendPush.ts
```typescript
import { getMessaging } from "firebase-admin/messaging";

export async function sendPushNotifications(
  tokens: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
) {
  if (tokens.length === 0) return;

  const message = {
    notification: { title: notification.title, body: notification.body },
    data: notification.data,
    tokens,
  };

  const response = await getMessaging().sendEachForMulticast(message);

  // Clean up invalid tokens
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
      // Remove invalid token from Firestore
      removeInvalidToken(tokens[idx]);
    }
  });
}
```

---

## 4. Client-Side Notification Handling

### Notification listeners (in app/_layout.tsx)

```typescript
import * as Notifications from "expo-notifications";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Inside the root layout component:
useEffect(() => {
  // When user taps a notification
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    // Navigate to the relevant screen
    if (data.screen === "tasks") router.push("/(tabs)/tasks");
    if (data.screen === "calendar") router.push("/(tabs)/calendar");
  });

  return () => subscription.remove();
}, []);
```

### Behavior by app state

| App State | Behavior |
|---|---|
| **Foreground** | Show in-app banner (configurable via `setNotificationHandler`) |
| **Background** | System notification in notification center |
| **Killed/Closed** | System notification in notification center |
| **Tapped** | Open app and navigate to relevant screen via deep link |

---

## 5. User Preferences

Users can control their notification preferences in **Profile > Preferences**.

### Firestore structure
```
users/{uid}
  └── notificationPreferences: {
        tasks: true,
        events: true,
        reminders: true,
        memberJoined: false
      }
```

Cloud Functions should check these preferences before sending a notification. If `tasks: false`, skip that user for task notifications.

---

## 6. Event Reminders (Scheduled)

Event reminders require a scheduled Cloud Function (cron) or a Firestore-triggered approach:

**Option A: Firebase Scheduled Function**
- Runs every 15 minutes
- Queries events starting within the next hour
- Sends reminders to attendees who haven't been reminded yet
- Marks events as "reminded" to avoid duplicates

**Option B: Local Scheduling**
- When a user marks "Attending", schedule a local notification on their device
- Uses `Notifications.scheduleNotificationAsync()` with a date trigger
- No backend needed, but only works for the local device

> **Recommendation:** Use Option A (server-side) for reliability. Local notifications can fail if the app is uninstalled or the device restarts.

---

## 7. Required Setup Checklist

- [ ] Install `expo-notifications`
- [ ] Add `expo-notifications` plugin to `app.json`
- [ ] Create notification permission request flow in app
- [ ] Store push tokens in Firestore `users/{uid}.pushTokens`
- [ ] Handle token refresh
- [ ] Set up Firebase Cloud Functions project (`functions/` directory)
- [ ] Implement Cloud Function triggers for each notification type
- [ ] Add notification listeners in `_layout.tsx` for deep linking
- [ ] Add notification preferences UI in profile screen
- [ ] Test on physical devices (push notifications do not work in simulators)

---

## 8. iOS-Specific Requirements

- **APNs Key**: Upload your Apple Push Notification service (APNs) key to Firebase Console > Project Settings > Cloud Messaging
- **Capability**: Push Notifications capability must be enabled in Apple Developer portal
- **Provisioning Profile**: Must include push notification entitlement
- **Permission Prompt**: iOS requires explicit user permission — show a pre-prompt explaining why notifications are useful before the system dialog

---

## 9. Testing

- Push notifications **do not work** on iOS Simulator or Android Emulator
- Use a **physical device** for all notification testing
- Use the [Expo Push Notification Tool](https://expo.dev/notifications) to send test notifications manually
- Test all app states: foreground, background, and killed
