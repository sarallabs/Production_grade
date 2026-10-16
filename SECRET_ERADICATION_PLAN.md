# Production Plan: Complete Secret Eradication, Git History Purge, and Prevention

> **Target Repository**: `sarallabs/Production_grade` (`https://github.com/sarallabs/Production_grade.git`)  
> **Affected Branches**: `main`, `master`, `feature/read`, `Aditya-UI`, `Android-App`, `Bhanu`  
> **Target Outcome**: Zero secrets in any commit or branch on GitHub, compromised keys revoked, and automated push protection active.

---

## 1. Executive Overview & Scope

### Identified Leaked Secrets
1. **Google AI Studio / Gemini API Key** (`AIzaSyDFgFGvM3mGWyz8K7MX7ct11w2LOKqcHIA`):
   * Committed in `saralvidhya-medha/public/api-test.html` and `saralvidhya-mvp/public/api-test.html`.
   * Present since initial root commit `e0307a7` across all branches.
2. **Firebase Web API Key & Production Config** (`AIzaSyABrvUpwTyWMzHh0tipdUQylWVPMapbmOo`, Project `ekam-expert-prod`):
   * Committed in `saralvidhya-production/frontend/src/services/firebase.ts`.
   * Pushed to `origin/feature/read` in commit `fb8ff81`.
3. **Hardcoded Internal Credentials** (`Ekam@2026`, `expert@123`):
   * Committed in multiple `credentialsStore.ts` and auth views across branches.

---

## Phase 1: Pre-Flight Safety & Key Revocation

### Step 1.1: Create an Isolated Mirror Backup
Before modifying any git history, create an exact copy of the repository and its git objects outside the working tree:
```powershell
# Run from PowerShell in a directory outside the repository
git clone --mirror "c:\Users\hulkh\Downloads\Saral Vidhya\Production_grade" "c:\Users\hulkh\Downloads\Saral Vidhya\Production_grade_BACKUP.git"
```

### Step 1.2: Declare a Code Freeze
Notify the active contributors (`Aditya-624`, `Johanabhishek`, `hynko431`):
> *"Attention team: Performing a git history security purge to remove leaked keys across all branches. Please do not push any commits to GitHub until the purge is complete and you receive the updated clone instructions."*

### Step 1.3: Revoke & Restrict Keys at Cloud Providers (Mandatory)
History rewriting removes code from GitHub, but public commits may have already been archived by external scrapers.
1. **Google AI Studio Key**:
   * Open [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
   * Delete / Revoke key `AIzaSyDFgFGvM3mGWyz8K7MX7ct11w2LOKqcHIA`.
   * Generate a replacement key and save it strictly in your local `.env.local` (never commit it).
2. **Firebase Production Key**:
   * Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials) for project `ekam-expert-prod`.
   * Select `AIzaSyABrvUpwTyWMzHh0tipdUQylWVPMapbmOo`.
   * Under **Application restrictions**, choose **Websites** and restrict referrers to your authorized production and local testing domains:
     * `https://saralvidhya.com/*`
     * `http://localhost:*`
   * Under **API restrictions**, restrict key to:
     * Firebase Authentication API
     * Cloud Firestore API
     * Cloud Storage for Firebase API

---

## Phase 2: Working Tree Sanitization & Git History Purge

### Step 2.1: Clean Working Tree Files on Active Branch
Ensure current source files no longer contain hardcoded keys or passwords.

1. **Sanitize `api-test.html`**:
   In `saralvidhya-medha/public/api-test.html` and `saralvidhya-mvp/public/api-test.html`, replace line 209:
   ```javascript
   // Query parameter or empty fallback (no hardcoded credentials)
   const API_KEY = new URLSearchParams(window.location.search).get('key') || '';
   ```
2. **Sanitize `firebase.ts`**:
   Verify `saralvidhya-production/frontend/src/services/firebase.ts` has no hardcoded fallback strings:
   ```typescript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
     appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
     measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
   };
   ```
3. **Update `.gitignore`**:
   Add test harness exclusions to `.gitignore`:
   ```gitignore
   # Test harnesses
   **/api-test.html
   **/test_keys*
   ```
4. **Commit the working tree cleanups**:
   ```powershell
   git add .gitignore saralvidhya-medha/public/api-test.html saralvidhya-mvp/public/api-test.html saralvidhya-production/frontend/src/services/firebase.ts
   git commit -m "security: sanitize hardcoded API keys and add test harnesses to gitignore"
   ```

---

### Step 2.2: Setup `git-filter-repo`

Install the official Git-recommended history rewriting tool:
```powershell
pip install git-filter-repo
```

Create a replacements dictionary file `C:\Users\hulkh\Downloads\Saral Vidhya\replace_secrets.txt`:
```text
AIzaSyDFgFGvM3mGWyz8K7MX7ct11w2LOKqcHIA==>[REDACTED_GEMINI_API_KEY]
AIzaSyABrvUpwTyWMzHh0tipdUQylWVPMapbmOo==>[REDACTED_FIREBASE_API_KEY]
```

### Step 2.3: Execute History Rewrite Across All Branches and Commits

```powershell
cd "c:\Users\hulkh\Downloads\Saral Vidhya\Production_grade"

# Fetch all remote branches into local tracking refs first
git fetch --all

# Run git-filter-repo replacing the sensitive values everywhere
git-filter-repo --replace-text "C:\Users\hulkh\Downloads\Saral Vidhya\replace_secrets.txt" --force
```

### Step 2.4: Re-Link Origin Remote
`git-filter-repo` intentionally removes the `origin` remote to prevent accidental immediate push:
```powershell
git remote add origin https://github.com/sarallabs/Production_grade.git
```

---

## Phase 3: Audit, Verification & Force Push

### Step 3.1: Automated Verification
Run deep grep queries across **all** rewritten commits to verify 0 occurrences remain:
```powershell
# 1. Verify Gemini Key is gone
git log --all -G"AIzaSyDFgFGvM3mGWyz8K7MX7ct11w2LOKqcHIA" --oneline

# 2. Verify Firebase Key is gone
git log --all -G"AIzaSyABrvUpwTyWMzHh0tipdUQylWVPMapbmOo" --oneline

# 3. Verify general AIza pattern in test files
git log --all -G"const API_KEY = 'AIza" --oneline
```
*(All commands must output zero lines).*

### Step 3.2: Synchronize with GitHub Remote

Push all rewritten branch refs and tags to GitHub:
```powershell
# Force push all rewritten branches
git push origin --force --all

# Force push tags (if any)
git push origin --force --tags
```

---

## Phase 4: Team Runbook & Contributor Re-Sync

All team members must update their local clones so they do not accidentally re-push old commit histories:

```powershell
# Option A (Safest & Recommended): Fresh Clone
cd path\to\workspace
Rename-Item Production_grade Production_grade_old
git clone https://github.com/sarallabs/Production_grade.git Production_grade

# Option B: Hard Reset Existing Clone to Rewritten Remote
cd Production_grade
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd
```

---

## Phase 5: Preventative Guardrails (Permanent Protection)

### Step 5.1: Enable GitHub Secret Scanning & Push Protection
1. Open repository settings: `https://github.com/sarallabs/Production_grade/settings/security_analysis`
2. Enable **Secret scanning**.
3. Enable **Push protection** (Blocks any git push immediately if a token matching regex patterns is detected).

### Step 5.2: Install Pre-Commit Secret Scanner Hook
Add a client-side hook in `.githooks/pre-commit` to prevent local commits of API keys:

Create file `.githooks/pre-commit`:
```bash
#!/bin/sh
# Check staged changes for API key signatures
STAGED_DIFF=$(git diff --cached)

if echo "$STAGED_DIFF" | grep -E "AIzaSy[0-9A-Za-z_-]{33}|sk-[0-9A-Za-z_-]{20,}"; then
    echo "\n❌ [SECURITY REJECTED] You are attempting to commit an active API key!"
    echo "Remove the hardcoded secret from the staged file and use .env.local.\n"
    exit 1
fi

exit 0
```

Activate the hooks directory for the repository:
```powershell
git config core.hooksPath .githooks
```
