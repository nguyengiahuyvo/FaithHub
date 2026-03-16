# FaithHub - iOS Publishing Guide

A complete guide to building, testing, and publishing FaithHub on the Apple App Store.

> **Related:** See the main [README.md](README.md) for Android publishing, local development setup, and project overview.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Costs Overview](#costs-overview)
3. [Apple Developer Account Setup](#apple-developer-account-setup)
4. [Configure the Project for iOS](#configure-the-project-for-ios)
5. [Build with EAS (Cloud)](#build-with-eas-cloud)
6. [Build Locally (Free Alternative)](#build-locally-free-alternative)
7. [App Store Connect Setup](#app-store-connect-setup)
8. [Screenshots (Automated)](#screenshots-automated)
9. [Submit to the App Store](#submit-to-the-app-store)
10. [TestFlight (Beta Testing)](#testflight-beta-testing)
11. [Release to Production](#release-to-production)
12. [Updating Your App](#updating-your-app)
13. [Troubleshooting](#troubleshooting)
14. [Useful Links](#useful-links)

---

## Prerequisites

- **macOS** — Xcode and iOS builds require a Mac (no Windows/Linux alternative)
- **Xcode** (latest stable) — [Download from Mac App Store](https://apps.apple.com/app/xcode/id497799835)
- **Xcode Command Line Tools** — install via `xcode-select --install`
- **CocoaPods** — `sudo gem install cocoapods`
- **Apple Developer Account** ($99/year) — [enroll here](https://developer.apple.com/programs/)
- **Node.js** (v18+), **npm**, **EAS CLI** — same as Android setup (see [README.md](README.md#prerequisites))

---

## Costs Overview

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | **$99/year** | Required to publish on the App Store and use TestFlight |
| EAS Build (iOS) | **Free** (30 builds/month) | Same free tier as Android — see [README.md](README.md#eas-build-expo-cloud-builds) |
| EAS Submit (iOS) | **Free** | Included in all plans |
| Local build | **Free** | Requires a Mac with Xcode |

> **Note:** You cannot build iOS apps on Windows or Linux — even with EAS Cloud Build, you'll need a Mac for local testing on simulators. EAS Cloud Build itself runs on Apple silicon in the cloud, so you can create production builds from any OS.

---

## Apple Developer Account Setup

1. Go to [developer.apple.com/programs](https://developer.apple.com/programs/) and click **Enroll**.
2. Sign in with your Apple ID (or create one).
3. Follow the enrollment steps and pay the **$99/year** fee.
4. Wait for approval (usually 24–48 hours).
5. Once approved, sign in to [App Store Connect](https://appstoreconnect.apple.com/).

---

## Configure the Project for iOS

### Update `app.json`

Your `app.json` already contains the iOS configuration:

```json
"ios": {
  "supportsTablet": true,
  "icon": "./assets/images/icon/ios/AppIcon~ios-marketing.png",
  "bundleIdentifier": "com.nguyengiahuy.vo.FaithHub"
}
```

Key fields:
- **bundleIdentifier** — Your unique app ID (already set to `com.nguyengiahuy.vo.FaithHub`). This must match what you register in App Store Connect.
- **icon** — The 1024x1024 App Store icon (already configured).
- **supportsTablet** — Set to `true` to support iPad.

### Update `eas.json` for iOS builds

Add iOS configuration to your existing `eas.json`:

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
      },
      "ios": {
        "simulator": true
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
      },
      "ios": {
        "appleId": "YOUR_APPLE_ID_EMAIL",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

Replace the placeholder values:
- **appleId** — Your Apple ID email address
- **ascAppId** — The numeric App ID from App Store Connect (found under App Information > General > Apple ID)
- **appleTeamId** — Your 10-character Team ID (found at [developer.apple.com/account](https://developer.apple.com/account) > Membership Details)

---

## Build with EAS (Cloud)

### Development build (for simulator testing)

```bash
eas build --platform ios --profile development
```

This creates a `.app` build you can run on the iOS Simulator.

### Preview build (for device testing via TestFlight or ad-hoc)

```bash
eas build --platform ios --profile preview
```

EAS will prompt you to set up an **Ad Hoc provisioning profile**. You'll need to register your test devices' UDIDs.

### Production build (for App Store)

```bash
eas build --platform ios --profile production
```

This creates a signed `.ipa` file ready for App Store submission. EAS automatically manages:
- **Distribution certificate**
- **Provisioning profile**
- **Code signing**

> First iOS build? EAS will walk you through creating credentials. You can also manage them with `eas credentials`.

---

## Build Locally (Free Alternative)

If you want to avoid using EAS cloud build credits, you can build locally on a Mac.

### Step 1: Generate the native iOS project

```bash
npx expo prebuild --platform ios
```

This creates an `ios/` folder with the full native Xcode project.

### Step 2: Install CocoaPods dependencies

```bash
cd ios
pod install
cd ..
```

### Step 3: Open in Xcode

```bash
open ios/FaithHub.xcworkspace
```

> Always open the `.xcworkspace` file, **not** the `.xcodeproj`.

### Step 4: Configure signing in Xcode

1. Select the **FaithHub** target in Xcode.
2. Go to the **Signing & Capabilities** tab.
3. Check **Automatically manage signing**.
4. Select your **Team** (your Apple Developer account).
5. Xcode will automatically create the required provisioning profiles.

### Step 5: Build for testing (Simulator)

1. Select a simulator device (e.g., iPhone 16 Pro) from the toolbar.
2. Press **Cmd + R** (or click the Run button).

### Step 6: Archive for App Store

1. Select **Any iOS Device (arm64)** as the build destination.
2. Go to **Product > Archive**.
3. Once the archive completes, the **Organizer** window opens.
4. Click **Distribute App > App Store Connect > Upload**.
5. Follow the prompts to upload your build.

---

## App Store Connect Setup

### Create your app listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com/).
2. Click **My Apps > + > New App**.
3. Fill in:
   - **Platform**: iOS
   - **Name**: FaithHub
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: Select `com.nguyengiahuy.vo.FaithHub` (must match `app.json`)
   - **SKU**: `faithhub` (any unique string)
4. Click **Create**.

### Complete the app information

Under **App Information**:
- **Category**: Lifestyle (or Social Networking)
- **Content Rights**: Does not contain third-party content
- **Age Rating**: Complete the questionnaire (likely 4+)

Under **Pricing and Availability**:
- **Price**: Free
- **Availability**: Select countries/regions

### Prepare the store listing

Under **App Store > iOS App > Version Information**:

| Field | Value |
|-------|-------|
| **Promotional Text** | (optional) Short text that can be updated without a new version |
| **Description** | Full description of FaithHub features |
| **Keywords** | `faith, church, community, prayer, events, tasks, christian` |
| **Support URL** | Your support website or contact page |
| **Marketing URL** | (optional) Your website |

### Required screenshots

Apple requires screenshots for **each device size** you support:

| Device | Size (pixels) | Required |
|--------|--------------|----------|
| iPhone 6.9" (iPhone 16 Pro Max) | 1320 x 2868 | Yes (covers 6.7" too) |
| iPhone 6.5" (iPhone 14 Plus) | 1284 x 2778 | Yes |
| iPhone 5.5" (iPhone 8 Plus) | 1242 x 2208 | Only if supporting older devices |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | Yes (if `supportsTablet: true`) |
| iPad Pro 13" (M4) | 2064 x 2752 | Yes (if `supportsTablet: true`) |

You need **minimum 2, maximum 10** screenshots per device size.

---

## Screenshots (Automated)

Manually taking screenshots for every device size is tedious. Here are the best tools to automate this:

### Option 1: Maestro (Recommended for Expo apps)

[Maestro](https://maestro.mobile.dev/) is a UI testing framework that can drive your app and capture screenshots without writing native test code.

#### Install Maestro

```bash
# macOS
curl -Ls "https://get.maestro.mobile.dev" | bash
```

#### Create a screenshot flow

Create a file at `screenshots/app-screenshots.yaml`:

```yaml
appId: com.nguyengiahuy.vo.FaithHub
---
- launchApp
- waitForAnimationToEnd

# Login screen
- takeScreenshot: screenshots/01_login

# Sign in (replace with your test credentials)
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "testpassword"
- tapOn: "Sign In"
- waitForAnimationToEnd

# Home screen
- takeScreenshot: screenshots/02_home

# Tasks tab
- tapOn: "Tasks"
- waitForAnimationToEnd
- takeScreenshot: screenshots/03_tasks

# Calendar tab
- tapOn: "Calendar"
- waitForAnimationToEnd
- takeScreenshot: screenshots/04_calendar

# Profile tab
- tapOn: "Profile"
- waitForAnimationToEnd
- takeScreenshot: screenshots/05_profile
```

#### Run on multiple simulators

```bash
# Boot the simulators you need
xcrun simctl boot "iPhone 16 Pro Max"
xcrun simctl boot "iPhone 14 Plus"
xcrun simctl boot "iPad Pro (12.9-inch) (6th generation)"

# Run the flow on each
maestro --device "iPhone 16 Pro Max" test screenshots/app-screenshots.yaml
maestro --device "iPhone 14 Plus" test screenshots/app-screenshots.yaml
maestro --device "iPad Pro (12.9-inch) (6th generation)" test screenshots/app-screenshots.yaml
```

Screenshots are saved to the `screenshots/` folder, ready for upload.

### Option 2: Fastlane Snapshot

[Fastlane](https://fastlane.tools/) is the industry standard for iOS automation. It requires Xcode UI tests but offers the most control.

#### Install Fastlane

```bash
# macOS (via Homebrew)
brew install fastlane
```

#### Initialize in your iOS project

```bash
cd ios
fastlane init
```

Select **"Manual setup"** when prompted.

#### Configure Snapfile

Create `ios/fastlane/Snapfile`:

```ruby
devices([
  "iPhone 16 Pro Max",
  "iPhone 14 Plus",
  "iPad Pro (12.9-inch) (6th generation)"
])

languages(["en-US"])

scheme("FaithHub")
output_directory("./fastlane/screenshots")
clear_previous_screenshots(true)
```

#### Create UI test targets

1. In Xcode, add a **UI Testing Bundle** target to your project.
2. Write test methods that navigate through your app and call `snapshot("screen_name")`.
3. Run:

```bash
cd ios
fastlane snapshot
```

#### Upload screenshots to App Store Connect

```bash
cd ios
fastlane deliver --skip_binary_upload --skip_metadata --overwrite_screenshots
```

### Option 3: Simulator screenshots (manual but quick)

If you just need screenshots for one submission:

```bash
# Take a screenshot of the running simulator
xcrun simctl io booted screenshot ~/Desktop/screenshot.png

# Or press Cmd + S in the Simulator app
```

### Option 4: Online mockup tools (no Mac required)

If you already have a few screenshots from a real device, these tools generate all required sizes:

- **[Screenshots.pro](https://screenshots.pro/)** — Automated from App Store URL
- **[AppMockup](https://app-mockup.com/)** — Free device frame generator
- **[Previewed](https://previewed.app/)** — Animated and static mockups

---

## Submit to the App Store

### Option A: Using EAS Submit (recommended)

```bash
# Submit the latest production build
eas submit --platform ios --profile production
```

EAS will prompt for your Apple ID credentials and an **app-specific password**:

1. Go to [appleid.apple.com](https://appleid.apple.com/) > **Sign-In and Security > App-Specific Passwords**.
2. Generate a new password (e.g., label it `eas-submit`).
3. Enter it when EAS prompts you.

To build and submit in one command:

```bash
eas build --platform ios --profile production --auto-submit
```

### Option B: Using Xcode (local build)

After archiving (see [Build Locally > Step 6](#step-6-archive-for-app-store)):
1. The Organizer window opens automatically.
2. Select your archive and click **Distribute App**.
3. Choose **App Store Connect** > **Upload**.
4. Follow the prompts.

### Option C: Using Fastlane

```bash
cd ios
fastlane deliver
```

This uploads the build, metadata, and screenshots in one step.

---

## TestFlight (Beta Testing)

TestFlight is Apple's built-in beta testing platform. It's free and supports up to 10,000 external testers.

### Internal testing (up to 100 testers)

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) > Your App > **TestFlight**.
2. Your uploaded build appears here automatically.
3. Click the build, then click **Manage** under Internal Group.
4. Add testers by Apple ID email.
5. Testers receive an invite via email and install via the **TestFlight** app.

### External testing (up to 10,000 testers)

1. Under **TestFlight**, click **+ External Group**.
2. Add testers by email or share a **public link**.
3. Submit the build for **Beta App Review** (usually takes ~24 hours for the first build).
4. Once approved, testers can install via the TestFlight app.

### Sharing a public TestFlight link

1. Under your external group, enable **Public Link**.
2. Share the link — anyone with the link can join your beta (up to your tester limit).

---

## Release to Production

Once testing is complete:

1. Go to **App Store Connect > Your App > App Store > iOS App**.
2. Select the build you want to release (from the uploaded builds).
3. Complete all required fields:
   - Version information (description, what's new, screenshots)
   - App Review information (contact info, notes for reviewer)
4. Click **Add for Review**.
5. Click **Submit for Review**.

### App Review timeline

- **First submission**: Typically 24–48 hours (can be up to several days).
- **Updates**: Usually reviewed within 24 hours.
- **Expedited review**: Request via [Apple's expedited review form](https://developer.apple.com/contact/app-store/?topic=expedite) if you have a critical bug fix.

### After approval

Choose when your app goes live:
- **Manually release** — You click "Release" when ready.
- **Automatically after approval** — Goes live as soon as review passes.
- **On a specific date** — Schedule a release date.

---

## Updating Your App

### Bump the version

Update `app.json`:

```json
"version": "1.1.0"
```

The `buildNumber` (iOS equivalent of Android's `versionCode`) auto-increments via EAS with `"autoIncrement": true`.

### Build and submit

```bash
eas build --platform ios --profile production --auto-submit
```

### Create a new version in App Store Connect

1. Go to App Store Connect > Your App.
2. Click **+ Version or Platform** in the sidebar.
3. Enter the new version number (e.g., `1.1.0`).
4. Add **"What's New"** notes.
5. Select the new build.
6. Submit for review.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `No signing certificate found` | Run `eas credentials` or configure signing in Xcode manually |
| `Provisioning profile doesn't match` | Delete old profiles in Xcode > Settings > Accounts > Manage Certificates |
| `CocoaPods install fails` | Run `sudo gem install cocoapods` then `cd ios && pod install --repo-update` |
| `Build fails on M1/M2 Mac` | Open Terminal with Rosetta, or run `arch -x86_64 pod install` |
| `App rejected: missing screenshots` | Provide screenshots for all required device sizes (see [Screenshots section](#screenshots-automated)) |
| `App rejected: missing privacy policy` | Add a Privacy Policy URL in App Store Connect under App Information |
| `EAS credential error` | Run `eas credentials --platform ios` to reset certificates and profiles |
| `"Unable to process request" in ASC` | Wait and retry — App Store Connect sometimes has temporary outages |
| `TestFlight build stuck in "Processing"` | Builds typically process in 5–30 minutes; wait or re-upload if stuck over 1 hour |
| `iPad screenshots required` | Since `supportsTablet: true` is set, you must provide iPad screenshots or set it to `false` |

---

## Useful Links

- [Expo iOS Distribution Docs](https://docs.expo.dev/distribution/introduction/)
- [EAS Build for iOS](https://docs.expo.dev/build/ios/)
- [EAS Submit for iOS](https://docs.expo.dev/submit/ios/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer Account](https://developer.apple.com/account/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [Maestro (Screenshot Automation)](https://maestro.mobile.dev/)
- [Fastlane (iOS Automation)](https://fastlane.tools/)
- [Apple App Store Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/)
