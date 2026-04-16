import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const BIBLE_NOTIF_PREFIX = "daily-bible-reminder";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if permissions are denied or the device is a simulator.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#5B7553",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

/**
 * Save the push token to the user's Firestore document.
 */
export async function savePushToken(userId: string, token: string) {
  await setDoc(
    doc(db, "users", userId),
    { expoPushToken: token, pushTokenUpdatedAt: new Date().toISOString() },
    { merge: true },
  );
}

/**
 * Hook that registers for push notifications when a user is authenticated,
 * saves the token to Firestore, and sets up notification listeners.
 */
export function useNotifications(userId: string | undefined) {
  const notificationListener = useRef<ReturnType<typeof Notifications.addNotificationReceivedListener> | null>(null);
  const responseListener = useRef<ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Register and save token
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        savePushToken(userId, token);
      }
    });

    // Restore daily Bible reminders if user had them enabled
    getDoc(doc(db, "users", userId)).then((snap) => {
      const prefs = snap.exists() ? snap.data().notifPrefs : null;
      if (prefs?.bible === true) {
        scheduleBibleReminders(true, prefs.bibleReminders ?? [{ hour: 9, minute: 0 }]);
      }
    }).catch(() => {});

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Listen for user interaction with notifications — deep-link to the
    // relevant tab so tapping a "new event" push opens the Calendar.
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | { screen?: string }
          | undefined;
        if (data?.screen === "calendar") {
          router.push("/(tabs)/calendar");
        } else if (data?.screen === "tasks") {
          router.push("/(tabs)/calendar");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);
}

// ==========================================================================
// Sending push notifications from the client
//
// Until a Cloud Functions backend is in place, the device that creates
// an event / task / etc. also triggers the push by calling Expo's push
// service directly. Expo tokens are opaque and safe to use from the
// client; the service rate-limits and chunks for us.
// ==========================================================================

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export type NotifType = "events" | "tasks" | "quest" | "bible";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
// Expo accepts up to 100 messages per request.
const EXPO_BATCH = 100;

function isExpoToken(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("ExponentPushToken[");
}

/**
 * Collect all push tokens for members of an organization, optionally
 * excluding a specific user (e.g. the creator of the event).
 * When `notifType` is provided, only returns tokens for users who have
 * that notification type enabled in their preferences.
 */
export async function getOrgMemberPushTokens(
  orgId: string,
  excludeUid?: string,
  notifType?: NotifType,
): Promise<string[]> {
  const membersSnap = await getDocs(
    collection(db, "organizations", orgId, "members"),
  );
  const uids = membersSnap.docs
    .map((m) => m.id)
    .filter((uid) => uid !== excludeUid);
  if (uids.length === 0) return [];

  const tokens: string[] = [];
  await Promise.all(
    uids.map(async (uid) => {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        const data = userSnap.data();
        const tok = data?.expoPushToken;
        if (!isExpoToken(tok)) return;
        // Check notification preference if a type is specified
        if (notifType && data?.notifPrefs?.[notifType] === false) return;
        tokens.push(tok);
      } catch {
        // ignore per-user failures
      }
    }),
  );
  return tokens;
}

/**
 * Send a push notification to a list of Expo push tokens.
 * Batches at 100 messages per request (Expo's limit) and fails silently
 * on network errors so UI flows aren't blocked.
 */
export async function sendPushNotifications(
  tokens: string[],
  payload: PushPayload,
): Promise<void> {
  const valid = tokens.filter(isExpoToken);
  if (valid.length === 0) return;

  for (let i = 0; i < valid.length; i += EXPO_BATCH) {
    const slice = valid.slice(i, i + EXPO_BATCH);
    const messages = slice.map((to) => ({
      to,
      sound: "default",
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    }));
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
    } catch {
      // Fail silently — push is a best-effort side effect.
    }
  }
}

/**
 * Convenience: notify every org member except the creator about a new
 * calendar event. Never throws — safe to fire-and-forget.
 */
export async function notifyOrgOfNewEvent(params: {
  orgId: string;
  creatorUid: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  notifType?: NotifType;
}): Promise<void> {
  try {
    const tokens = await getOrgMemberPushTokens(
      params.orgId,
      params.creatorUid,
      params.notifType,
    );
    if (tokens.length === 0) return;
    await sendPushNotifications(tokens, {
      title: params.title,
      body: params.body,
      data: params.data,
    });
  } catch {
    // swallow — do not block the caller's flow
  }
}

/**
 * Send a push notification to a single user by UID. Never throws.
 */
export async function notifyUser(
  uid: string,
  payload: PushPayload,
): Promise<void> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const tok = snap.data()?.expoPushToken;
    if (typeof tok === "string" && tok.startsWith("ExponentPushToken[")) {
      await sendPushNotifications([tok], payload);
    }
  } catch {}
}

/**
 * Detect @mentions in a comment and send push notifications to mentioned users.
 * Matches `@DisplayName` against org members. Never throws.
 */
export async function notifyMentionedUsers(params: {
  orgId: string;
  senderUid: string;
  senderName: string | null;
  text: string;
  screen?: string;
}): Promise<void> {
  try {
    // Extract all @mentions from text — match @Name or @"Name With Spaces"
    const mentionPattern = /@"([^"]+)"|@(\S+)/g;
    const mentions: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionPattern.exec(params.text)) !== null) {
      mentions.push((match[1] || match[2]).toLowerCase());
    }
    if (mentions.length === 0) return;

    // Load org members and match by displayName
    const membersSnap = await getDocs(
      collection(db, "organizations", params.orgId, "members"),
    );
    const matchedUids: string[] = [];
    for (const m of membersSnap.docs) {
      if (m.id === params.senderUid) continue;
      const name = (m.data().displayName || "").toLowerCase();
      if (name && mentions.some((mention) => name === mention || name.startsWith(mention))) {
        matchedUids.push(m.id);
      }
    }
    if (matchedUids.length === 0) return;

    // Get push tokens for matched users
    const tokens: string[] = [];
    await Promise.all(
      matchedUids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "users", uid));
          const tok = snap.data()?.expoPushToken;
          if (isExpoToken(tok)) tokens.push(tok);
        } catch {}
      }),
    );
    if (tokens.length === 0) return;

    const sender = params.senderName || "Someone";
    await sendPushNotifications(tokens, {
      title: `${sender} mentioned you`,
      body: params.text.length > 100 ? params.text.slice(0, 100) + "…" : params.text,
      data: params.screen ? { screen: params.screen } : {},
    });
  } catch {
    // swallow — never block the caller
  }
}

type BibleTime = { hour: number; minute: number };

/**
 * Schedule (or cancel) daily local notifications reminding the user to
 * read the Bible. Supports multiple reminder times.
 */
export async function scheduleBibleReminders(
  enabled: boolean,
  reminders: BibleTime[] = [{ hour: 9, minute: 0 }],
) {
  // Cancel all existing bible reminders first
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  for (const n of scheduled) {
    if (n.identifier.startsWith(BIBLE_NOTIF_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }
  if (!enabled) return;
  for (let i = 0; i < reminders.length; i++) {
    const { hour, minute } = reminders[i];
    await Notifications.scheduleNotificationAsync({
      identifier: `${BIBLE_NOTIF_PREFIX}-${i}`,
      content: {
        title: "✞ FaithHub",
        body: "Time to read the Bible today!",
        sound: "default",
        data: { screen: "home" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}
