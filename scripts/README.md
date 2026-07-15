# Firebase Question Upload Script

This folder includes a script to upload Verse Quest questions to Firestore:

- Script: uploadQuestions.js
- Script: downloadQuestions.js
- Sample data: questions.sample.json

## 1) Install dependencies

Run this once in this folder:

```bash
npm install
```

## 2) Run the uploader

Required argument:

- --orgId: Firestore organization document id

Default questions file:

- questions/questions.json

Put your new questions in that file, then run:

```bash
node uploadQuestions.js --orgId YOUR_ORG_ID
```

Optional override:

- --file: path to a different JSON file containing an array of questions

Optional argument:

- --userId: fallback Firebase Auth UID used for createdBy when an item does not include createdBy

Command:

```bash
node uploadQuestions.js --orgId YOUR_ORG_ID --userId YOUR_UID
```

Import from exported file format (q/choices/answer):

```bash
node uploadQuestions.js --orgId YOUR_ORG_ID --file questions.export.json
```

## 3) Optional upsert mode

If your JSON entries include an id field and you want merge behavior for those ids:

```bash
node uploadQuestions.js --orgId YOUR_ORG_ID --userId YOUR_UID --file questions.sample.json --mergeById
```

## 4) JSON format

The file must be a JSON array. Each item should include:

- questionText (string)
- options (array of strings, at least 2)
- correctAnswerIndex (integer, zero-based index into options)

The uploader also supports exported schema fields:

- q
- choices
- answer
- createdBy
- createdAt
- updatedAt
- ref
- successMsg
- failMsg
- language
- translations

Optional fields supported:

- id
- category
- difficulty
- verseReference
- explanation
- correctCount
- wrongCount
- answeredUsers

Example item:

```json
{
  "id": "genesis-1-1",
  "questionText": "According to Genesis 1:1, what did God create in the beginning?",
  "options": [
    "Heaven and earth",
    "Only the earth",
    "Only the heavens",
    "The sea"
  ],
  "correctAnswerIndex": 0,
  "category": "Bible Basics",
  "difficulty": "easy",
  "verseReference": "Genesis 1:1",
  "explanation": "Genesis 1:1 states that God created the heavens and the earth."
}
```

## Troubleshooting

If you run node uploadQuestions.js without arguments, the script exits with code 1.

Use at least orgId:

```bash
node uploadQuestions.js --orgId YOUR_ORG_ID
```

## Download questions to JSON

Required argument:

- --orgId: Firestore organization document id

Basic command:

```bash
node downloadQuestions.js --orgId YOUR_ORG_ID
```

This creates a file named questions.export.json in the current folder.

Optional flags:

- --out: custom output filename/path
- --includeIds: include Firestore document ids in each exported item

Example:

```bash
node downloadQuestions.js --orgId YOUR_ORG_ID --out my-questions.json --includeIds
```

## Send push notifications

Sends an Expo push notification to every member in an organization. The script:

1. Reads member uids from `organizations/{orgId}/members`.
2. Looks up each uid in the top-level `users` collection and reads the `expoPushToken` field.
3. Delivers the message in batches of 100 to Expo's push API (`https://exp.host/--/api/v2/push/send`).

Tokens must be in the Expo format `ExponentPushToken[...]`; anything else (e.g. raw FCM tokens) is skipped with a warning.

Required arguments:

- --orgId: Firestore organization document id
- --title: notification title
- --body: notification body

Basic command:

```bash
node sendNotification.js --orgId YOUR_ORG_ID --title "Daily Quiz" --body "A new question is ready!"
```

Optional flags:

- --url: convenience field that adds `url` to the notification data payload
- --data: JSON string of string key/value pairs attached to the message payload (e.g. for deep-linking)
- --dry-run: resolve recipients and print what would be sent, without actually sending

Send with a data payload (values are coerced to strings by FCM):

```bash
node sendNotification.js --orgId YOUR_ORG_ID --title "New quiz" --body "Tap to play" --data '{"screen":"quiz","quizId":"abc123"}'
```

Send with an app-store link in the notification payload:

```bash
node sendNotification.js --orgId YOUR_ORG_ID --title "Update required" --body "Tap to install the latest version" --url "https://play.google.com/store/apps/details?id=com.yourapp"
```

Important: Expo push notifications do not open an external URL by themselves. Tapping the notification opens your app, and your app must read `notification.request.content.data.url` and then open it with `Linking.openURL(...)`.

Example in the app:

```js
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";

Notifications.addNotificationResponseReceivedListener((response) => {
  const url = response.notification.request.content.data?.url;
  if (typeof url === "string" && url.length > 0) {
    Linking.openURL(url);
  }
});
```

For iPhone App Store use a URL like:

```text
https://apps.apple.com/app/idYOUR_APP_ID
```

For Google Play use a URL like:

```text
https://play.google.com/store/apps/details?id=com.yourapp
```

Preview the recipient count and payload without sending:

```bash
node sendNotification.js --orgId YOUR_ORG_ID --title "Test" --body "Test" --dry-run
```

After sending, the script prints success and failure counts. Failed deliveries are listed with the member uid and the FCM error message (useful for detecting stale tokens that should be removed).

## Android push setup (FCM V1 credentials)

Android deliveries go through Firebase Cloud Messaging. Expo's push service needs an FCM V1 service account key uploaded to EAS; without it every Android send fails with:

```
Unable to retrieve the FCM server key for the recipient's app. (InvalidCredentials)
```

iOS is unaffected — it uses APNs credentials which EAS manages separately.

FCM Legacy was shut down by Google in June 2024. Do **not** use the "Push Notifications (Legacy)" menu in `eas credentials`; only FCM V1 works.

### 1) Generate the service account JSON from Firebase

1. Open the [Firebase Console](https://console.firebase.google.com/) and select the FaithHub project (the one tied to `google-services.json`, project id `faithhub-dbdbb`).
2. Click the gear icon next to _Project Overview_ → **Project settings**.
3. Open the **Cloud Messaging** tab and confirm **Firebase Cloud Messaging API (V1)** is **Enabled**. Enable it via the linked Google Cloud Console page if not.
4. Switch to the **Service accounts** tab.
5. Click **Generate new private key** → **Generate key**. A JSON file downloads (e.g. `faithhub-dbdbb-firebase-adminsdk-fbsvc-*.json`).
6. Treat this file like a password. Do not commit it to git and do not leave it in `Downloads/` long-term — anyone with it can send pushes as your app.

### 2) Upload it to EAS

Run from the project root (`d:\Person\FaithHub`):

```bash
eas whoami     # confirm you're signed in as the project owner (nguyengiahuy.vo)
eas credentials
```

Navigate the interactive menu in this order:

1. Platform → **Android**
2. Build profile → **production** (repeat for `preview` if you also send pushes from preview builds)
3. From the Android menu → **Google Service Account** _(not "Push Notifications (Legacy)")_
4. Sub-menu → **Manage your Google Service Account Key for Push Notifications (FCM V1)** _(not the one for Play Store Submissions — that's for uploads, not pushes)_
5. Choose **Upload a new service account key**
6. Paste the absolute path to the JSON file, e.g.:

   ```
   C:\Users\nguye\Downloads\faithhub-dbdbb-firebase-adminsdk-fbsvc-7678518641.json
   ```

7. EAS prints the service account email and project id — confirm the project id matches `google-services.json` (`faithhub-dbdbb`).
8. Back at the top Android menu, the summary should now show **Push Notifications (FCM V1)** as assigned.

No app rebuild is required — the credential lives on Expo's servers, not in the app binary.

### 3) Clean up any wrong upload

If the key was accidentally uploaded under **Push Notifications (Legacy)**, delete it:

1. Top Android menu → **Push Notifications (Legacy): Manage your FCM (Legacy) API Key**
2. **Delete your FCM API Key** → confirm.

Legacy entries are ignored by Expo once V1 is configured, but removing them avoids confusion.

### 4) Verify

Re-run a send and confirm Android recipients succeed:

```bash
node sendNotification.js --orgId YOUR_ORG_ID --title "Ping" --body "FCM V1 test"
node sendNotification.js --orgId E5zdzqfh0zeBxGoXdPa9 --title "Update 1.5.3 verfügbar" --body "Öffne den App Store und aktualisiere FaithHub." --url "https://apps.apple.com/de/app/faithhub-we-celebrate-together/id6760612509"
node sendNotification.js --orgId E5zdzqfh0zeBxGoXdPa9 --title "✞ Gottes Segen für deinen Sonntag" --body "Und der Friede Gottes, der alles Verstehen übersteigt, wird eure Herzen bewahren. (Phil 4,7)" --url "https://apps.apple.com/de/app/faithhub-we-celebrate-together/id6760612509"

node sendNotification.js --orgId TFIjBsn6bklpBJkv1JmI --title "🎉Lieber Đạt, alles Gute zum Geburtstag" --body "Möge Gott dich segnen und dir Frieden und Freude schenken!"

node sendNotification.js --orgId TFIjBsn6bklpBJkv1JmI --title "🎉Chúc mừng sinh nhật Đạt" --body "Xin Chúa luôn ban phước lành, bình an và niềm vui cho bạn!"

```

### Troubleshooting

- **`project_id` mismatch** — the `project_id` field inside the uploaded JSON must equal `project_id` in `android/app/google-services.json`. If you manage multiple Firebase projects, the key came from the wrong one.
- **API disabled** — Google Cloud Console → APIs & Services → enable _Firebase Cloud Messaging API_ for project `faithhub-dbdbb`.
- **Still Legacy errors after upload** — make sure you uploaded via **Google Service Account → FCM V1**, not the Legacy menu. The Legacy option expects a server-key string and won't accept a service-account JSON correctly.
