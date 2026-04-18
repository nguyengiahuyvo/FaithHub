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
  "options": ["Heaven and earth", "Only the earth", "Only the heavens", "The sea"],
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
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

Notifications.addNotificationResponseReceivedListener((response) => {
  const url = response.notification.request.content.data?.url;
  if (typeof url === 'string' && url.length > 0) {
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
