# FaithHub

A mobile community app for churches, prayer groups, and faith-based organizations. Built with React Native (Expo), TypeScript, and Firebase.

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo CLI** - installed automatically via npx
- **EAS CLI** - for building and submitting to stores
  ```bash
  npm install -g eas-cli
  ```
- **Git** - [Download](https://git-scm.com/)
- A **Google Play Console** account ($25 one-time fee) - [Register](https://play.google.com/console/signup)
- An **Expo account** (free) - [Sign up](https://expo.dev/signup)

---

## Costs & Pricing Overview

Before you start building, understand what's free and what costs money:

### One-time fees

| Item | Cost | Notes |
|------|------|-------|
| Google Play Console | **$25** (one-time) | Required to publish on Play Store |
| Apple Developer Program | **$99/year** | Only needed if you also want to publish on the App Store |

### EAS Build (Expo Cloud Builds)

EAS Build compiles your app in the cloud. Expo offers a **free tier** but with limits:

| Plan | Price | Builds per month | Build priority | Notes |
|------|-------|-------------------|----------------|-------|
| **Free** | $0 | **30 builds/month** | Low (queued) | Builds may wait 5-30+ min in queue before starting |
| **Production** | $99/month | 1,000 builds/month | Normal | Faster queue times |
| **Enterprise** | Custom | Unlimited | High | Priority builds, dedicated support |

> **Tip:** On the free plan, each build counts against your 30/month limit regardless of profile (development, preview, or production). Plan your builds wisely - don't trigger unnecessary builds.

### Free alternative: Build locally (no EAS cost)

You can build **completely free** on your own machine without using EAS cloud builds. Follow these steps:

#### Requirements

Before you start, install the following:

1. **Android Studio** - [Download](https://developer.android.com/studio)
   - During installation, make sure to install the **Android SDK**
   - After installation, open Android Studio > **Settings > Languages & Frameworks > Android SDK**
   - Note the **Android SDK Location** (e.g., `C:\Users\<you>\AppData\Local\Android\Sdk`)
   - Install **SDK Platform** for Android 15 (API 35) or the latest available

2. **Java JDK 17** - [Download](https://adoptium.net/temurin/releases/?version=17)
   - After installation, verify: `java -version` should show version 17

3. **Set environment variables** (Windows):
   - Add `ANDROID_HOME` pointing to your SDK location
   - Add `JAVA_HOME` pointing to your JDK 17 installation
   - Add `%ANDROID_HOME%\platform-tools` to your `PATH`

   On Windows, open PowerShell as admin:
   ```powershell
   [System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "C:\Users\<you>\AppData\Local\Android\Sdk", "User")
   [System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot", "User")
   ```
   Restart your terminal after setting these.

#### Step 1: Generate the native Android project

```bash
npx expo prebuild --platform android
```

This creates an `android/` folder in your project with the full native Android project (Gradle files, manifests, etc.). You only need to run this once, or again if you change native config in `app.json`.

#### Step 2: Build a debug APK (for testing)

```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Transfer this file to your phone and install it to test.

#### Step 3: Create a signing keystore (one-time, for release builds)

Before building a release version, you need a signing key. Run this once:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore faithhub-release.keystore -alias faithhub -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked to set a password and enter your name/organization. **Save this keystore file and password somewhere safe** - you need the same key for all future updates on the Play Store.

Move the keystore to the android app folder:
```bash
mv faithhub-release.keystore android/app/
```

#### Step 4: Configure signing in Gradle

Edit `android/app/build.gradle` and add the signing config. Find the `android {` block and add:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('faithhub-release.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'faithhub'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            ...
            signingConfig signingConfigs.release
        }
    }
}
```

> **Security tip:** Don't commit passwords to git. Instead, use environment variables or a `local.properties` file (already in `.gitignore`).

#### Step 5: Build the release AAB (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

The signed AAB will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

This is the file you upload to Google Play Console.

#### Step 6: (Optional) Build a release APK for direct sharing

If you want to share a release APK directly (without the Play Store):

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### Common local build errors

| Error | Solution |
|-------|----------|
| `SDK location not found` | Set `ANDROID_HOME` env variable or create `android/local.properties` with `sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk` |
| `Could not determine java version` | Install JDK 17 and set `JAVA_HOME` |
| `Execution failed for task ':app:mergeReleaseResources'` | Run `cd android && ./gradlew clean` then rebuild |
| `Keystore was tampered with, or password was incorrect` | Double-check your keystore password |
| `./gradlew: Permission denied` | Run `chmod +x android/gradlew` (macOS/Linux) |

### EAS Submit

| Feature | Cost |
|---------|------|
| EAS Submit (upload to Play Store) | **Free** (included in all plans) |

### Firebase (Backend)

| Plan | Cost | Limits |
|------|------|--------|
| **Spark (Free)** | $0 | 50K reads/day, 20K writes/day, 1GB storage, 50K auth users |
| **Blaze (Pay as you go)** | Usage-based | Same free tier included, then pay per operation |

> For a small community app like FaithHub, the **free Spark plan** is more than enough.

### Summary: Minimum cost to publish on Play Store

| Method | Total cost |
|--------|-----------|
| EAS Cloud Build (free plan) + Play Store | **$25** (just the Play Console fee) |
| Local build + Play Store | **$25** (just the Play Console fee) |
| EAS Cloud Build + App Store (iOS) | **$25 + $99/year** = $124 first year | See [iOS Publishing Guide](IOS_PUBLISHING.md) |

---

## 1. Local Development Setup

### 1.1 Clone and install

```bash
git clone <your-repo-url>
cd FaithHub
npm install
```

### 1.2 Start the development server

```bash
npx expo start
```

This will open the Expo dev tools. You can run the app on:
- **Physical device**: Scan the QR code with Expo Go (Android) or Camera app (iOS)
- **Android emulator**: Press `a` in the terminal
- **iOS simulator** (macOS only): Press `i` in the terminal

### 1.3 Useful dev commands

```bash
npx expo start --clear    # Start with cache cleared
npx expo start --android  # Start directly on Android
npx expo start --ios      # Start directly on iOS
npx expo lint              # Run linter
```

---

## 2. Configure EAS (Expo Application Services)

EAS is Expo's cloud build service. It compiles your app into an APK/AAB (Android) or IPA (iOS) without needing Android Studio or Xcode locally.

### 2.1 Log in to your Expo account

```bash
eas login
```

Enter your Expo account credentials.

### 2.2 Initialize EAS in your project

```bash
eas build:configure
```

This creates an `eas.json` file in your project root. Replace its contents with the following configuration:

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Build profiles explained:**
- **development** - Debug build with dev tools, for local testing (uses 1 of your 30 free builds/month)
- **preview** - Release APK for sharing with testers, no Play Store needed (uses 1 of your 30 free builds/month)
- **production** - Optimized AAB for Play Store upload (uses 1 of your 30 free builds/month)

> Each EAS cloud build counts against your monthly limit. See [Costs & Pricing Overview](#costs--pricing-overview) for details and free local build alternatives.

### 2.3 Add your Android package name

Add the `package` field to `app.json` under the `android` section:

```json
"android": {
  "package": "com.yourname.faithhub",
  ...
}
```

Replace `com.yourname.faithhub` with your own unique package name (e.g., `com.faithhub.app`).

---

## 3. Build the App

### 3.1 Preview build (for testing)

Generate an APK you can install directly on any Android device:

```bash
eas build --platform android --profile preview
```

Once complete, EAS provides a download link. Send the APK to your device and install it.

### 3.2 Production build (for Play Store)

Generate a signed AAB (Android App Bundle) for the Play Store:

```bash
eas build --platform android --profile production
```

This will:
1. Compile your app in the cloud
2. Automatically sign it with a keystore (EAS manages this for you)
3. Provide a download link for the `.aab` file

The build takes approximately 10-15 minutes. You can monitor progress at [expo.dev](https://expo.dev).

---

## 4. Set Up Google Play Console

### 4.1 Create your app listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in:
   - **App name**: FaithHub
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept the declarations and click **Create app**

### 4.2 Complete the store listing

Navigate to **Grow > Store listing** and fill in:

- **Short description** (max 80 chars): Your faith community in one app - tasks, events, and members.
- **Full description**: Write a longer description of your app features
- **App icon**: Upload your 512x512 icon (use `assets/images/icon/android/play_store_512.png`)
- **Feature graphic**: Create a 1024x500 banner image
- **Screenshots**: Take at least 2 phone screenshots of your app (use the preview build)

### 4.3 Complete the required declarations

Before you can publish, Google requires you to fill out several sections under **Policy > App content**:

1. **Privacy policy** - Provide a URL to your privacy policy
2. **Ads** - Select "No, my app does not contain ads"
3. **App access** - Provide login credentials if the app requires sign-in
4. **Content ratings** - Complete the IARC questionnaire
5. **Target audience** - Select your target age group
6. **News apps** - Select "No"
7. **Data safety** - Declare what data your app collects (email, name, usage data)

### 4.4 Set up internal testing track

1. Go to **Testing > Internal testing**
2. Click **Create new release**
3. Upload the `.aab` file you downloaded from EAS (from step 3.2)
4. Add a release name (e.g., "1.0.0") and release notes
5. Click **Review release** then **Start rollout**

### 4.5 Add testers

1. In **Internal testing**, go to the **Testers** tab
2. Create a new email list
3. Add tester email addresses
4. Share the opt-in link with your testers

---

## 5. Upload to Play Store (Automated)

Instead of uploading the AAB manually, you can use EAS Submit to automate the process.

### 5.1 Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one linked to your Play Console)
3. Navigate to **IAM & Admin > Service Accounts**
4. Click **Create Service Account**
   - Name: `eas-submit`
   - Role: Skip (we'll configure in Play Console)
5. Click **Done**, then click on the new service account
6. Go to **Keys > Add Key > Create new key > JSON**
7. Download the JSON file and save it as `google-service-account.json` in your project root

> **IMPORTANT**: Add `google-service-account.json` to your `.gitignore` file so it is never committed to version control!

```bash
echo "google-service-account.json" >> .gitignore
```

### 5.2 Link the service account to Play Console

1. Go to [Google Play Console](https://play.google.com/console) > **Settings > API access**
2. Link your Google Cloud project
3. Under **Service accounts**, find `eas-submit` and click **Manage Play Console permissions**
4. Grant these permissions:
   - **App access > Admin** (for your app only)
   - Or at minimum: **Release management**, **Store presence**
5. Click **Invite user** and then **Send invite**

### 5.3 Submit the build

```bash
eas submit --platform android --profile production
```

This uploads your latest production build directly to the Play Store's internal testing track.

To build and submit in one command:

```bash
eas build --platform android --profile production --auto-submit
```

---

## 6. Release to Production

Once you've tested your app via internal testing and everything works:

1. Go to **Google Play Console > Production**
2. Click **Create new release**
3. **Promote from internal testing** (or upload the AAB again)
4. Add release notes
5. Click **Review release**
6. Click **Start rollout to Production**

Google will review your app (this can take a few hours to several days for the first submission).

---

## 7. Updating Your App

For future updates:

### 7.1 Bump the version

Update the version in `app.json`:

```json
"version": "1.1.0"
```

The `versionCode` (Android build number) auto-increments via EAS thanks to the `"autoIncrement": true` setting.

### 7.2 Build and submit

```bash
eas build --platform android --profile production --auto-submit
```

### 7.3 Roll out the update

Go to Play Console, create a new production release, and roll it out.

---

## Project Structure

```
FaithHub/
  app/
    _layout.tsx          # Root layout with auth routing & splash screen
    login.tsx            # Login / Sign-up screen
    (tabs)/
      _layout.tsx        # Tab navigation layout
      index.tsx          # Home / Organization dashboard
      tasks.tsx          # Task management
      calendar.tsx       # Calendar & events
      profile.tsx        # User profile & settings
  lib/
    firebase.ts          # Firebase configuration
    auth-context.tsx     # Authentication state provider
    org-context.tsx      # Organization state provider
    language-context.tsx # i18n language provider
    i18n.ts              # Translations (EN, DE, VI)
  assets/
    images/icon/         # App icons (iOS & Android)
  app.json               # Expo app configuration
  eas.json               # EAS build configuration
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with "keystore" error | Run `eas credentials` to manage your Android keystore |
| App crashes on startup | Check Firebase config in `lib/firebase.ts` |
| Icons not showing | Run `npx expo start --clear` to clear cache |
| EAS build is slow | First builds are slower; subsequent builds use cache |
| "Package name already taken" | Change the `android.package` in `app.json` |
| Play Store rejects AAB | Ensure all declarations in App Content are completed |

---

## iOS Publishing

For a complete guide to building, testing, and publishing FaithHub on the **Apple App Store**, see the dedicated iOS documentation:

> **[iOS Publishing Guide (IOS_PUBLISHING.md)](IOS_PUBLISHING.md)** — Covers Apple Developer setup, EAS/local builds, App Store Connect, automated screenshots (Maestro & Fastlane), TestFlight beta testing, and App Store submission.

---

## Useful Links

- [Expo Docs](https://docs.expo.dev/)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs (Android)](https://docs.expo.dev/submit/android/)
- [EAS Submit Docs (iOS)](https://docs.expo.dev/submit/ios/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Firebase Console](https://console.firebase.google.com/)
