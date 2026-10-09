# Phase 3 Implementation Plan: Bottom Navigation, Manifest Loader & Study Table

## Objective
Establish the primary mobile navigation hierarchy using Expo Router Tabs, port the ANGRAU Cloud Run manifest service, and build the central interactive Study Table screen.

---

## 1. Porting the Manifest Service (`src/api/manifestService.ts`)
Port logic from `saralvidhya-mvp/src/data/manifestService.ts`:
- **API Base URL**: `https://saralvidhya-api-193782571555.asia-south1.run.app`
- **Supported Subjects**: `ento_131` (Fundamentals of Entomology - ANGRAU), with fallbacks.
- Methods:
  - `fetchSubjectManifest(subjectId: string)`: Retrieves chapters, titles, and available tools.
  - `fetchChapterResource(subjectId: string, chapterNum: number, resourceType: string, level: string)`: Loads Markdown, JSON flashcards, or podcast audio URLs.
  - Cache responses in `AsyncStorage` for instant loading and offline fallback.

---

## 2. Bottom Tab Navigation (`src/app/(tabs)/_layout.tsx`)
Setup 4 primary tabs with `@expo/vector-icons` (Ionicons / MaterialCommunityIcons):
1. **Subjects** (`index.tsx`): Grid and list of enrolled subjects with syllabus progress indicators.
2. **Study Table** (`study.tsx`): Direct access to the active chapter's learning dashboard.
3. **Leaderboard** (`leaderboard.tsx`): Class rankings, weekly quiz points, and study streaks.
4. **Profile** (`profile.tsx`): Student information, persona badge, completed chapters, and settings.

Tab styling must feature:
- Active tint: Emerald Green (`#22c55e`).
- Inactive tint: Muted Gray (`#94a3b8`).
- Elevation/shadow with curved top corners and safe area padding.

---

## 3. Subject & Chapter Selection Flow
Create `src/app/subjects/[subjectId].tsx`:
- Header showing Subject Title (e.g., "ENTO 131: Fundamentals of Entomology").
- Chapter accordion cards displaying:
  - Chapter number, title, and topic count.
  - Completion status badge (Completed, In Progress, Not Started).
  - Tap navigates directly to the Study Table for that chapter.

---

## 4. Mobile Study Table Screen (`src/app/(tabs)/study.tsx` or `src/app/study/[subjectId]/[chapter].tsx`)
Port the rich functionality of `saralvidhya-mvp/src/pages/StudyTable.tsx`:
- **Top Chapter Bar**:
  - Chapter selector dropdown/modal to switch chapters quickly.
  - Difficulty Level Pill Switcher (`Beginner` | `Intermediate` | `Advanced`).
- **Tool Selector Ribbon**:
  - Horizontal scrolling tab bar with icons:
    - 📖 Quick Study
    - 📝 Detailed Notes
    - 🗂️ Flashcards
    - 🎯 Assessments
    - 🎙️ Podcasts
    - 📺 Videos
    - 🧠 Mindmap
    - 📜 Previous Year Questions (PYQs)
    - 🤖 Ask AI Bot
- **Floating "Up Next" Action Button**:
  - Floats at the bottom right/center with a gentle pulse animation.
  - Displays the next recommended step (e.g., "Up Next: Flashcards 🗂️").
  - On tap, switches the active tool smoothly.

---

## 5. Verification Checklist
- [x] Bottom tabs switch between screens without lag.
- [x] ANGRAU chapters and metadata fetch correctly from the Cloud Run API.
- [x] Tool switcher switches between study views smoothly.
- [x] Floating "Up Next" button dynamically updates based on the current tool.
