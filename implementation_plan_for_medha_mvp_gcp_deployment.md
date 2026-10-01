# Code Refactoring Plan: Single Codebase → Two GCP Deployments (ANGRAU + ANU)

## Current State

Two nearly-identical repos that are 90%+ shared code:

| Repo | Target University | Key Extras |
|---|---|---|
| `saralvidhya-mvp` | **ANGRAU** | Testing infra (vitest/pytest) |
| `saralvidhya-moocs` | **ANU** | Storefront (CourseCatalog, CourseDetail, CourseRegister, CoursePayment), payment gating, public SiteHeader/SiteFooter, MOOCs mode |

**Goal:** Merge into one codebase in `saralvidhya-mvp`. Two deployments driven by config, not code forks.

> [!IMPORTANT]
> **ANGRAU Board Migration:** The ANGRAU board must be moved from the Medha (MOOCs) repo (`saralvidhya-medha`) to the MVP repo (`saralvidhya-mvp`). This includes all ANGRAU-specific content, board configuration, and subject metadata. The MVP repo becomes the single source of truth for the ANGRAU deployment.

---

## Phase 1: Repository Cleanup (Day 1)

> [!CAUTION]
> The `firebase-service-account.json` file is committed to BOTH repos and is NOT in `.gitignore`. This must be removed from Git history immediately, and the key must be rotated in the Firebase console.

### 1.1 Remove secrets from Git history

#### [MODIFY] [.gitignore](file:///d:/saralvidhya-mvp/.gitignore)
Add these lines:
```
firebase-service-account.json
*.pem
*.key
```

Then purge from history:
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch firebase-service-account.json" \
  --prune-empty -- --all
git push --force
```

### 1.2 Delete junk files from repo root

These files serve no purpose and add ~15MB of dead weight:

```
# Build artifacts / debug dumps (delete all)
out.cjs                    # 1.9MB
out.js                     # 1.9MB
clean_diff.patch           # 6.3MB
diff_backup.txt            # 6.8MB
temp.tsx                   # 205KB
studytable.patch           # 407KB
tsc-output.txt             # 16KB

# One-off fix/patch scripts (delete all)
fix.cjs, fix.js, fix2.cjs, fix3.cjs, fix4.cjs, fix5.cjs, fix6.cjs
fix_math.cjs, fix_multiline_math.cjs
restore.cjs, convert_flashcards.cjs
check_bio_names.py, check_catalog.py
check_manifest.py, check_manifest2.py, check_manifest3.py
modify.py, modify2.py, modify3.py
split_paragraphs.py, update_manifest.py
update_mindmaps.cjs, update_podcasts.cjs
validate_gemini_api_key.py, project_brain.py
test-models.cjs, test-render.jsx
start-vite-local.cmd

# Merge conflict artifacts
src/components/FlashcardsView.tsx.orig   # 50KB
```

### 1.3 Optimize oversized assets

#### [MODIFY] [src/logo.png](file:///d:/saralvidhya-mvp/src/logo.png)
- Current: **4.3MB PNG**
- Target: Convert to WebP, resize to max 512px width → should be <100KB
- Move to `public/` so it's served statically, not bundled into JS

---

## Phase 2: Multi-Tenancy Architecture (Days 2–4)

The goal is to make **every university-specific value** driven by a single `VITE_TENANT_ID` environment variable. No more hardcoded university names anywhere in the source code.

### 2.1 Create a tenant configuration system

#### [NEW] `src/config/tenants.ts`

This is the single source of truth for all tenant-specific configuration. At build time, the correct tenant config is selected based on `VITE_TENANT_ID`.

```typescript
export interface TenantConfig {
  id: string;
  name: string;                    // "ANGRAU" | "Acharya Nagarjuna University"
  appName: string;                 // Display name for the app
  logoPrimary: string;             // Path to logo asset
  defaultVisibleBoards: string[];  // Board IDs to show in catalog
  homeRoute: string;               // "/" for ANGRAU, "/" for ANU (public catalog)
  postLoginRoute: string;          // Where to go after login
  features: {
    moocs: boolean;                // Enable storefront + payment gating
    publicCatalog: boolean;        // Show public course catalog without login
    paymentGating: boolean;        // Require payment before accessing content
    expertPanel: boolean;          // Enable /x expert content editor
    examinerConsole: boolean;      // Enable /examiner
  };
  copyright: string;
  supportEmail: string;
}

const TENANTS: Record<string, TenantConfig> = {
  angrau: {
    id: 'angrau',
    name: 'ANGRAU',
    appName: 'Saral Vidhya',
    logoPrimary: '/brand-logo.png',
    defaultVisibleBoards: ['angrau_university'],
    homeRoute: '/',
    postLoginRoute: '/',
    features: {
      moocs: false,
      publicCatalog: false,
      paymentGating: false,
      expertPanel: true,
      examinerConsole: true,
    },
    copyright: '© 2026 Saral Vidhya – ANGRAU',
    supportEmail: 'support@saralvidhya.in',
  },
  anu: {
    id: 'anu',
    name: 'Acharya Nagarjuna University (ANU)',
    appName: 'ANU Learning',
    logoPrimary: '/logo-anu.webp',
    defaultVisibleBoards: ['anu_university'],
    homeRoute: '/',
    postLoginRoute: '/my-learning',
    features: {
      moocs: true,
      publicCatalog: true,
      paymentGating: true,
      expertPanel: true,
      examinerConsole: true,
    },
    copyright: '© 2026 Saral Vidhya – ANU',
    supportEmail: 'anu-support@saralvidhya.in',
  },
};

const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'angrau';

export const tenant: TenantConfig = TENANTS[TENANT_ID] || TENANTS.angrau;
export default tenant;
```

### 2.2 Replace all hardcoded tenant values

Every file that currently hardcodes university names, board IDs, or branding must be refactored to read from `tenant`:

| File | What's hardcoded | Replace with |
|---|---|---|
| [branding.json](file:///d:/saralvidhya-mvp/src/config/branding.json) | `"appName": "Saral Vidhya"` | Delete file. Use `tenant.appName` |
| [university_config.json](file:///d:/saralvidhya-mvp/src/config/university_config.json) | `defaultVisibleBoards: ["angrau_university"]` | Delete file. Use `tenant.defaultVisibleBoards` |
| [public/index.html](file:///d:/saralvidhya-mvp/public/index.html) | `<title>ANGRAU Student Learning</title>` | Use a Vite HTML plugin to inject `tenant.appName` at build time |
| [App.tsx](file:///d:/saralvidhya-mvp/src/App.tsx) | `document.title = branding.appName` | `document.title = tenant.appName` |
| [credentialsStore.ts](file:///d:/saralvidhya-mvp/src/utils/credentialsStore.ts) | `password: 'Ekam@2026'` | Remove entirely (auth moves to Firebase in Phase 4) |
| [ExaminerConsole.tsx](file:///d:/saralvidhya-mvp/src/pages/ExaminerConsole.tsx) | `SUBJECT_METADATA` with hardcoded professor names, unit lists | Move to DB (Phase 5). Short-term: import from `tenant`-scoped config |
| [contentRepository.ts](file:///d:/saralvidhya-mvp/src/data/contentRepository.ts) | `getVisibleBoardIds()` reads from `universityConfig` | Read from `tenant.defaultVisibleBoards` |
| [server/index.js](file:///d:/saralvidhya-mvp/server/index.js) | `process.env.UNIVERSITY_NAME \|\| 'angrau_university'` | `process.env.TENANT_ID \|\| 'angrau'` |

### 2.3 Merge MOOCS-only pages into the MVP repo

Copy these files from `saralvidhya-moocs/src/pages/` into `saralvidhya-mvp/src/pages/`:
- `CourseCatalog.tsx`
- `CourseDetail.tsx`
- `CourseRegister.tsx`
- `CoursePayment.tsx`
- `ManagementMindmap.tsx`

Copy these components from `saralvidhya-moocs/src/components/`:
- `CourseCard.tsx`
- `SiteHeader.tsx`
- `SiteFooter.tsx`

### 2.4 Refactor App.tsx for feature-flagged routing

#### [MODIFY] [App.tsx](file:///d:/saralvidhya-mvp/src/App.tsx)

The router must conditionally render routes based on `tenant.features`:

```tsx
import tenant from './config/tenants';

// ... lazy imports (see Phase 3) ...

export default function App() {
  return (
    <Routes>
      {/* Public storefront (ANU only) */}
      {tenant.features.publicCatalog && (
        <>
          <Route path="/" element={<CourseCatalog />} />
          <Route path="/course/:courseId" element={<CourseDetail />} />
          <Route path="/course/:courseId/register" element={<CourseRegister />} />
          <Route path="/course/:courseId/payment" element={<CoursePayment />} />
        </>
      )}

      {/* Admin routes (feature-flagged) */}
      {tenant.features.expertPanel && (
        <Route path="/x" element={<ExpertPanel />} />
      )}
      {tenant.features.examinerConsole && (
        <Route path="/examiner" element={<ExaminerConsole />} />
      )}

      {/* Core learning routes (always present) */}
      <Route element={<Layout />}>
        <Route path={tenant.features.publicCatalog ? "/my-learning" : "/"} element={...} />
        {/* ... rest of routes ... */}
      </Route>
    </Routes>
  );
}
```

### 2.5 Refactor payment gating to be feature-driven

Currently, MOOCS hardcodes `localStorage.getItem('registered_${sId}')` checks in `ChapterList.tsx`, `ClassSubjectSelection.tsx`, and `PreviousYearQuestions.tsx`.

Wrap all payment checks in a utility:

#### [NEW] `src/utils/accessControl.ts`

```typescript
import tenant from '@/config/tenants';

export function hasContentAccess(subjectId: string): boolean {
  if (!tenant.features.paymentGating) return true;
  return localStorage.getItem(`registered_${subjectId}`) === 'true';
}

export function getAccessDeniedRedirect(subjectId: string): string {
  return `/course/${subjectId}`;
}
```

Then in `ChapterList.tsx`, `ClassSubjectSelection.tsx`, etc., replace the inline `localStorage` checks with `hasContentAccess(subjectId)`.

---

## Phase 3: Code Splitting & Component Decomposition (Days 5–8)

### 3.1 Add React.lazy to all page imports in App.tsx

#### [MODIFY] [App.tsx](file:///d:/saralvidhya-mvp/src/App.tsx)

Replace all static imports with dynamic ones:

```tsx
import { lazy, Suspense } from 'react';

const StudyTable = lazy(() => import('./pages/StudyTable'));
const ExaminerConsole = lazy(() => import('./pages/ExaminerConsole'));
const ExpertPanel = lazy(() => import('./pages/ExpertPanel'));
const CourseCatalog = lazy(() => import('./pages/CourseCatalog'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Profile = lazy(() => import('./pages/Profile'));
// ... all other pages ...

// Wrap routes in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

**Impact:** The initial bundle drops from ~2MB+ to probably ~200-300KB. Each page loads on-demand.

### 3.2 Break down StudyTable.tsx (481KB)

This is the most critical decomposition. `StudyTable.tsx` is a single 481KB file that likely contains:
- The main study layout/shell
- Markdown content viewer
- Flashcard viewer
- Question bank / quiz UI
- Podcast player
- Ask Bot (Gemini chat)
- Mindmap viewer
- YouTube video embed
- Tool switching logic

#### Target structure:
```
src/features/study-table/
├── StudyTable.tsx              # Shell/orchestrator only (~50 lines)
├── components/
│   ├── StudyToolSwitcher.tsx   # Tab bar for switching tools
│   ├── ContentViewer.tsx       # Markdown content renderer
│   ├── PodcastPlayer.tsx       # Audio player + progress
│   ├── AskBot.tsx              # Gemini chat widget
│   └── VideoEmbed.tsx          # YouTube player
├── hooks/
│   ├── useStudySession.ts     # Session state management
│   └── useToolAccess.ts       # Tool locking/unlocking (guided flow)
└── index.ts                   # Re-export
```

### 3.3 Break down ExaminerConsole.tsx (67KB) and ExpertPanel.tsx (43KB)

Similar decomposition into `src/features/examiner/` and `src/features/expert-panel/`.

### 3.4 Split the CSS monoliths

| File | Size | Action |
|---|---|---|
| `src/index.css` | 103KB | Extract into per-feature CSS modules |
| `src/app-flow.css` | 100KB | Extract guided-flow-specific styles |

Move to CSS Modules (`.module.css`) scoped to each component/feature. This also enables tree-shaking of unused styles.

### 3.5 Add React Error Boundaries

#### [NEW] `src/components/ErrorBoundary.tsx`

Wrap major route groups to prevent white-screen crashes:

```tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>...</Routes>
  </Suspense>
</ErrorBoundary>
```

---

## Phase 4: Authentication Overhaul (Days 9–11)

### 4.1 Replace localStorage auth with Firebase Auth

#### [DELETE] `src/utils/credentialsStore.ts`

This file stores plaintext passwords in localStorage and must be completely removed.

#### [NEW] `src/context/AuthContext.tsx`

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/services/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'student' | 'expert' | 'admin' | null;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, role: null });

export function AuthProvider({ children }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, role: null });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role from Firestore user profile or custom claims
        const role = await getUserRole(user.uid);
        setState({ user, loading: false, role });
      } else {
        setState({ user: null, loading: false, role: null });
      }
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

#### [MODIFY] [App.tsx](file:///d:/saralvidhya-mvp/src/App.tsx)

Replace `isAuthenticated()` (localStorage check) and the `AuthGuard`/`ProtectedRoute` wrappers with the new `useAuth()` hook:

```tsx
function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

#### [MODIFY] [Login.tsx](file:///d:/saralvidhya-mvp/src/pages/Login.tsx)

Remove the `loadCredentials()` / plaintext password matching. Replace with Firebase `signInWithEmailAndPassword` or `signInWithPopup(googleProvider)`.

#### [MODIFY] [ExpertPanel.tsx](file:///d:/saralvidhya-mvp/src/pages/ExpertPanel.tsx)

Remove the hardcoded `Ekam@2026` password check. Replace with:
```tsx
const { user, role } = useAuth();
if (role !== 'expert' && role !== 'admin') return <AccessDenied />;
```

### 4.2 Move Firebase config to environment variables

#### [MODIFY] [firebase.ts](file:///d:/saralvidhya-mvp/src/services/firebase.ts)

Replace hardcoded config with env vars:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
};
```

---

## Phase 5: Data Layer Migration (Days 12–16)

> [!IMPORTANT]
> This phase requires coordination with your DB team. You need to agree on schema before writing any code.

### 5.1 Move subject/course metadata to the database

Currently hardcoded in `SUBJECT_METADATA` (ExaminerConsole.tsx) and `contentRepository.ts`.

#### Proposed DB schema (Firestore collections):

```
tenants/{tenantId}
  ├── name: "ANGRAU"
  ├── config: { features: {...}, branding: {...} }

subjects/{subjectId}
  ├── tenantId: "angrau"
  ├── name: "Fundamentals of Entomology"
  ├── code: "ENTO-131"
  ├── boardId: "angrau_university"
  ├── professorName: "Dr. Cherukuri Sreenivasa Rao"
  ├── units: ["Unit 1: ...", "Unit 2: ..."]

chapters/{chapterId}
  ├── subjectId: "ento_131"
  ├── number: 1
  ├── name: "Insect Digestive System"
  ├── resourceBasePath: "gs://saralvidhya-content/angrau/ento_131/chapter_01/"
```

### 5.2 Create a data service layer

#### [NEW] `src/services/dataService.ts`

Abstract all data fetching behind a clean interface that can switch between static files (dev/fallback) and the database (production):

```typescript
import tenant from '@/config/tenants';

export async function getSubjects(): Promise<Subject[]> {
  // Production: fetch from Cloud Run API
  // Dev fallback: read from local manifest.json
}

export async function getChapters(subjectId: string): Promise<Chapter[]> { ... }
export async function getResourceContent(subjectId: string, chapterId: string, resourceName: string): Promise<string> { ... }
```

This replaces the current monolithic `contentRepository.ts` (50KB) with a clean service that the DB team can wire up to the actual database.

### 5.3 Move static content to GCS

All files currently in `public/generated_resources/` move to a GCS bucket:
```
gs://saralvidhya-content/
  ├── angrau/
  │   ├── ento_131/chapter_01/summary.md
  │   └── ...
  └── anu/
      ├── anu_physics/chapter_04/summary.md
      └── ...
```

The `contentRepository.ts` base URL changes from `/generated_resources` to `https://storage.googleapis.com/saralvidhya-content`.

---

## Phase 6: Backend API (Days 17–20)

### 6.1 Create a proper Cloud Run backend

#### [NEW] `backend/` directory (separate from frontend)

```
backend/
├── Dockerfile
├── package.json
├── src/
│   ├── index.ts              # Express app entry
│   ├── middleware/
│   │   ├── auth.ts           # Firebase JWT verification
│   │   ├── cors.ts           # Locked-down CORS
│   │   ├── rateLimit.ts      # Rate limiting
│   │   └── tenantResolver.ts # Read X-Tenant-ID header
│   ├── routes/
│   │   ├── content.ts        # GET /api/v1/subjects, /chapters, /resources
│   │   ├── admin.ts          # POST /api/v1/resources/save (expert panel)
│   │   └── health.ts         # GET /healthz
│   └── services/
│       ├── storageService.ts # GCS read/write
│       └── dbService.ts      # Firestore queries
```

### 6.2 Proxy sensitive API calls through the backend

The Gemini API key and Google TTS API key must **never** reach the browser:

#### [MODIFY] `askService.ts` and `googleTtsService.ts`

Instead of calling `https://texttospeech.googleapis.com/v1/text:synthesize?key=YOUR_KEY` directly from the browser, call your own backend:

```typescript
// Before (INSECURE - key in browser):
fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`)

// After (SECURE - key on server only):
fetch(`${BACKEND_URL}/api/v1/tts/synthesize`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${firebaseIdToken}` },
  body: JSON.stringify({ text, voice, lang })
})
```

The backend receives this, adds the real API key from its own environment, calls Google's TTS API, and returns the audio to the frontend.

---

## Phase 7: Deployment Setup (Days 21–23)

### 7.1 Environment files per tenant

```
.env.angrau.production
  VITE_TENANT_ID=angrau
  VITE_FIREBASE_API_KEY=...
  VITE_BACKEND_URL=https://api.saralvidhya.in

.env.anu.production
  VITE_TENANT_ID=anu
  VITE_FIREBASE_API_KEY=...
  VITE_BACKEND_URL=https://api.saralvidhya.in
```

### 7.2 Build scripts

#### [MODIFY] [package.json](file:///d:/saralvidhya-mvp/package.json)

```json
{
  "scripts": {
    "build:angrau": "vite build --mode angrau.production",
    "build:anu": "vite build --mode anu.production",
    "deploy:angrau": "npm run build:angrau && firebase deploy --only hosting:angrau",
    "deploy:anu": "npm run build:anu && firebase deploy --only hosting:anu"
  }
}
```

### 7.3 Firebase Hosting multi-site

#### [MODIFY] [firebase.json](file:///d:/saralvidhya-mvp/firebase.json)

```json
{
  "hosting": [
    {
      "target": "angrau",
      "public": "dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "anu",
      "public": "dist",
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

### 7.4 Cloud Build CI/CD

#### [NEW] `cloudbuild.yaml`

```yaml
steps:
  # Build ANGRAU
  - name: 'node:20'
    args: ['npm', 'run', 'build:angrau']
  - name: 'gcr.io/projectid/firebase'
    args: ['deploy', '--only', 'hosting:angrau']

  # Build ANU
  - name: 'node:20'
    args: ['npm', 'run', 'build:anu']
  - name: 'gcr.io/projectid/firebase'
    args: ['deploy', '--only', 'hosting:anu']
```

---

## Verification Plan

### Automated Tests
- `npm run test:vitest` — Existing vitest suite must pass after refactoring
- Add integration tests for tenant config resolution (angrau vs anu)
- Add tests for `accessControl.ts` (payment gating logic)
- Add tests for `AuthContext` (Firebase auth state handling)

### Manual Verification
1. Build with `VITE_TENANT_ID=angrau` → verify ANGRAU branding, no storefront routes, direct login
2. Build with `VITE_TENANT_ID=anu` → verify ANU branding, public catalog at `/`, payment gating works
3. Verify that Expert Panel and Examiner Console are accessible only to authenticated admin/expert users
4. Verify that Gemini API key is NOT present in the browser's JS bundle (check via DevTools → Sources)

---

## Open Questions

> [!IMPORTANT]
> **Database choice:** Is the DB team using Firestore or Cloud SQL? This affects the backend service layer significantly. Firestore is simpler for document-based content; Cloud SQL (Postgres) is better if you need relational queries and joins.

> [!IMPORTANT]
> **Domain names:** What domains will ANGRAU and ANU deployments use? (e.g., `angrau.saralvidhya.in` and `anu.saralvidhya.in`?) This is needed for CORS config and Firebase Hosting setup.

> [!IMPORTANT]
> **Payment integration:** The current `CoursePayment.tsx` is a mock (fake credit card form, stores a flag in localStorage). For ANU production, do you need real payment gateway integration (Razorpay, Stripe, etc.)?

> [!IMPORTANT]
> **Content migration:** Who will handle uploading the `generated_resources` content from the Git repo to GCS? Is this the DB team's responsibility, or should we script it as part of this refactoring?
