# Phase 2 Implementation Plan: Auth, Onboarding & Student Persona Engine

## Objective
Implement native authentication, persistent onboarding, student persona selection (Beginner, Intermediate, Advanced), and learning style questionnaire using React Native and AsyncStorage.

---

## 1. Storage Utility Layer (`src/utils/storage.ts`)
Create a type-safe AsyncStorage wrapper replacing browser `localStorage`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  AUTH_TOKEN: 'saral_auth_token',
  USER_PROFILE: 'saral_student_profile',
  STUDENT_PERSONA: 'saral_user_persona',
  QUESTIONNAIRE_DONE: 'saral_questionnaire_completed',
  ACTIVE_BOARD: 'saral_active_board',
  THEME_MODE: 'saral_theme_mode',
};

export const storage = {
  async getItem<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
```

---

## 2. Authentication & Student Profile Context (`src/context/AuthContext.tsx`)
Create `AuthContext` to expose:
- `user`: `{ id: string; name: string; rollNumber?: string; university: string }`
- `persona`: `'beginner' | 'intermediate' | 'advanced'`
- `isAuthenticated`: `boolean`
- `questionnaireCompleted`: `boolean`
- `login(credentials)` & `logout()`
- `updatePersona(persona)`
- `completeQuestionnaire(results)`

---

## 3. Screens Implementation
Create the following screens inside `src/app/(auth)/`:

### A. Login Screen (`src/app/(auth)/login.tsx`)
- Sleek green & dark slate branded card interface.
- Fields: Student ID / Roll Number, Password.
- Quick demo login button: "Continue as ANGRAU Agriculture Student".
- Error alerts and loading indicators.

### B. Onboarding & Board Selection (`src/app/(auth)/onboarding.tsx`)
- University selector: ANGRAU (Acharya N.G. Ranga Agricultural University).
- Degree program: B.Sc (Hons) Agriculture.
- Semester / Year selector.

### C. Persona Selection (`src/app/(auth)/persona.tsx`)
- 3 interactive selectable cards:
  1. **Beginner**: Focus on fundamental concepts, simplified summaries, extra glossary.
  2. **Intermediate**: Balanced depth, standard syllabus speed, standard quizzes.
  3. **Advanced**: Deep-dive questions, high-difficulty assessments, university PYQ emphasis.
- Saves persona to `AsyncStorage` and updates study tool defaults.

### D. Learning Style Questionnaire (`src/app/(auth)/questionnaire.tsx`)
- Port question set from `saralvidhya-mvp/src/data/questionnaireData.ts`.
- Animated progress bar showing step `X of Y`.
- Multi-choice options with haptic feedback on selection.
- Computes recommended study paths upon submission and redirects to main tabs.

---

## 4. Verification Checklist
- [x] Student can log in and session persists after closing and reopening the app.
- [x] Onboarding enforces profile setup and persona selection.
- [x] Questionnaire calculates persona recommendations accurately.
- [x] Root layout automatically directs unauthenticated users to `/login`.
