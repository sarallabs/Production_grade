# Phase 7 Implementation Plan: Offline Caching, Android Optimization & Standalone APK

## Objective
Implement offline caching, network connectivity listeners, brand splash screens & icons, configure Android permissions, and set up the EAS Build pipeline to generate a standalone Android APK.

---

## 1. Offline Caching & Connectivity Listener
- Install NetInfo:
  ```bash
  cd "c:\Users\Aditya\Desktop\Saral Vidhya product Angrau\Production_grade\saralvidhya-mobile"
  npx expo install @react-native-community/netinfo
  ```
- **Offline Banner (`src/components/common/OfflineBanner.tsx`)**:
  - Automatically detects when internet connectivity drops.
  - Displays a subtle amber status bar: "Offline Mode — Viewing downloaded chapter notes".
- **Cache Strategy**:
  - When a student opens a chapter, notes, flashcards, and quizzes are automatically cached in `AsyncStorage`.
  - When offline, app automatically loads from the local cache without displaying errors.

---

## 2. Branding Assets, Icons & Splash Screen
- Copy / adapt logos from `saralvidhya-mvp/src/logo-clean.png` into `saralvidhya-mobile/assets/`:
  - `icon.png` (1024x1024 app icon)
  - `adaptive-icon.png` (Foreground icon for Android round/squircle launcher)
  - `splash-icon.png` (Centered splash logo)
- In `app.json`:
  ```json
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#0f172a"
  }
  ```

---

## 3. Android Build Configuration (`eas.json`)
Create `saralvidhya-mobile/eas.json` for Expo Application Services (EAS):

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 4. Building the Android APK
Commands to generate the standalone installable APK:

```bash
# 1. Install EAS CLI globally (if not already present)
npm install -g eas-cli

# 2. Build preview APK (installable on any Android phone)
eas build -p android --profile preview
```

Or for local building without cloud queues:
```bash
# Generate native Android project directory
npx expo run:android
```

---

## 5. Verification Checklist
- [x] App launches with branded splash screen and icons.
- [x] Previously visited chapters open seamlessly even without an active internet connection.
- [x] `eas.json` is properly configured for APK generation.
- [x] `npx expo-doctor` or `npx expo lint` passes with 0 critical errors.
