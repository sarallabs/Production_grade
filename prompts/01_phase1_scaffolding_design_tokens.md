# Phase 1 Implementation Plan: Scaffolding, Design Tokens & Core Setup

## Objective
Establish the foundational design system, theme tokens, branding assets, and install core React Native & Expo packages inside `Production_grade/saralvidhya-mobile`.

---

## 1. Required Dependencies
Navigate to `Production_grade/saralvidhya-mobile` and install the necessary mobile utility and UI packages:

```bash
cd "c:\Users\Aditya\Desktop\Saral Vidhya product Angrau\Production_grade\saralvidhya-mobile"

# Core storage, audio, speech & UI packages
npx expo install @react-native-async-storage/async-storage expo-av expo-speech expo-haptics @expo/vector-icons
```

---

## 2. Design System & Theme Tokens

Create `src/constants/theme.ts` representing the Saral Vidhya visual identity:
- **Primary Brand**: Emerald Green (`#22c55e` / `#16a34a`)
- **Accent Brand**: Soft Mint (`#ecfdf5`), Forest Green (`#15803d`)
- **Dark Elements**: Dark Slate (`#0f172a`), Slate Blue (`#1e293b`)
- **Light Backgrounds**: Pure White (`#ffffff`), Slate Surface (`#f8fafc`), Border Gray (`#e2e8f0`)
- **Typography Scale**: Display (28px), Title (22px), Subtitle (17px), Body (14px), Caption (12px)
- **Border Radius**: Small (6px), Medium (12px), Large (20px), Full (9999px)

```typescript
// src/constants/theme.ts
export const Colors = {
  light: {
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#ecfdf5',
    background: '#f8fafc',
    surface: '#ffffff',
    card: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    tint: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  dark: {
    primary: '#22c55e',
    primaryDark: '#16a34a',
    primaryLight: '#064e3b',
    background: '#090d16',
    surface: '#111827',
    card: '#1e293b',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
    tint: '#4ade80',
    danger: '#f87171',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
};
```

---

## 3. Global Theme & Focus Mode Context

Create `src/context/ThemeContext.tsx` allowing students to toggle between Light mode, Night mode, and Focus mode (minimal distractions with dimmed UI).

---

## 4. App Configuration (`app.json`)
Update `saralvidhya-mobile/app.json`:
- `name`: "Saral Vidhya"
- `slug`: "saralvidhya-mobile"
- `version`: "1.0.0"
- `orientation`: "portrait"
- `android`:
  - `package`: "com.sarallabs.saralvidhya"
  - `adaptiveIcon`: background `#0f172a`
  - `permissions`: `["INTERNET", "RECORD_AUDIO", "WAKE_LOCK", "MODIFY_AUDIO_SETTINGS"]`

---

## 5. Verification Checklist
- [x] Dependencies installed cleanly without version conflicts.
- [x] `src/constants/theme.ts` exists and exports color tokens.
- [x] `npx tsc --noEmit` succeeds in `saralvidhya-mobile`.
- [x] `app.json` has the correct app name and package ID.
