# Backend Developer Content Publishing Guide (SaralVidhya Multi-Tenant)

This guide documents the artifact layout contract and publishing workflow for content generators and backend developers.

---

## 1. Overview

SaralVidhya is 100% **database-driven**:
- No client names, subject codes, paths, or credentials are hardcoded in the frontend or API.
- All client metadata, subjects, topics, and chapter manifests reside in the **Firestore registry**.
- All content files sit in Google Cloud Storage (`saralvidhya-artifacts`) at clear relative paths.
- Content is published through a safe **staging & approval pipeline**: you validate and upload to staging, and the approver promotes the files to live with zero code redeploys.

---

## 2. Canonical Folder Structure

Your Python script or generator should output content into this canonical folder layout:

```text
<tenantId>/                     <- the folder you run sv-publish on
|-- tenant.json                <- Institution ID, branding, features
|-- assets/
|   |-- logo.png
|   `-- favicon.png
`-- <subjectId>/               <- lowercase letters, digits, _ or -
      |-- subject.json         <- Subject name, code, faculty info, units
      `-- chapter_01/          <- must be named chapter_NN
            |-- chapter.json   <- Chapter title, number, topic outline
            |-- read/
            |   |-- quick/
            |   |   |-- beginner.md
            |   |   |-- intermediate.md
            |   |   `-- advanced.md
            |   |-- detailed/
            |   |   |-- beginner.md
            |   |   |-- intermediate.md
            |   |   `-- advanced.md
            |   `-- key_takeaways.md
            |-- learn/
            |   |-- mindmap.json
            |   |-- study_plan.md
            |   `-- topics/
            |         |-- topic_1/
            |         |     |-- quick.md
            |         |     |-- detailed.md
            |         |     `-- podcast.m4a
            |         `-- topic_2/...
            |-- practice/
            |   |-- flashcards/
            |   |   |-- beginner.json
            |   |   |-- intermediate.json
            |   |   `-- advanced.json
            |   |-- mcq/
            |   |   |-- easy.json
            |   |   |-- medium.json
            |   |   `-- hard.json
            |   |-- msq/
            |   |   |-- easy.json
            |   |   `-- medium.json
            |   `-- question_bank.json
            |-- prepare/
            |   |-- previous_year.json
            |   |-- pre_final_exam.json
            |   `-- certification_exam.json
            |-- podcasts/
            |   |-- short_podcast.m4a
            |   |-- long_podcast.m4a
            |   `-- microcast_01.m4a
            `-- media/
                `-- ... (diagrams, images; reference with ABSOLUTE links, see Key Rules)
```

### Key Rules
1. **Personas & Difficulties are filenames, not directories**:
   - `practice/mcq/easy.json`, `practice/mcq/medium.json` (NOT `practice/mcq/easy/quiz.json`).
   - `read/quick/beginner.md` (NOT `beginner/read/quick.md`).
2. **Tool detection**: The platform automatically discovers active tools based on the files present in the chapter directory.
3. **No credentials**: Never put passwords or API keys inside `tenant.json`. Passwords are encrypted as bcrypt hashes and managed via `sv-admin`.
4. **Images in markdown and flashcards must use absolute links.** Relative paths like `media/fig1.png` or `../img/a.png` will NOT load. Use either:
   - a full URL: `https://...`, or
   - the content path: `/api/content/<tenantId>/<subjectId>/chapter_NN/media/fig1.png`
   (the file itself must be published under that chapter's `media/` folder).
5. **Do not inline base64 images** in JSON or markdown files. Files over about 30 MB cannot be served; keep images as separate files.

---

## 3. Configuration Schemas

JSON Schemas defining the exact validation rules are in `saralvidhya-production/tools/schemas/`:
- `tenant.schema.json`
- `subject.schema.json`
- `chapter.schema.json`

### Example `tenant.json`
```json
{
  "id": "mlrit",
  "name": "Marri Laxman Reddy Institute of Technology",
  "shortName": "MLRIT",
  "branding": {
    "appName": "MLRIT Medha",
    "primaryColor": "#1e3a8a",
    "programLabel": "Autonomous Engineering"
  },
  "features": {
    "examinerConsole": true,
    "expertPanel": true,
    "pyq": true,
    "ask": true,
    "toolOrder": ["read.quick", "learn.mindmap", "practice.mcq", "podcasts"]
  },
  "hierarchy": ["department", "semester", "subject"]
}
```

### Example `chapter.json`
```json
{
  "number": 1,
  "title": "Insect Digestive System",
  "topics": [
    { "id": "topic_1", "label": "Three Primary Gut Regions", "order": 1, "topicNum": 1 },
    { "id": "topic_2", "label": "Salivary Glands & Specialised Secretions", "order": 2, "topicNum": 2 }
  ]
}
```

---

## 4. Publishing Workflow with `sv-publish`

### Step 1: Install the CLI tool
From `saralvidhya-production/tools`:
```bash
pip install -e .
```

### Step 2: Validate your output folder (offline check)
```bash
sv-publish validate ./mlrit
```
This validates all JSON schemas, checks for missing required files, and verifies relative link paths. Any errors will be printed with line numbers.

### Step 3: Submit a Publish Request
```bash
sv-publish submit ./mlrit --api-url https://saralvidhya-api-193782571555.asia-south1.run.app
```
What happens under the hood:
1. Files are staged under `gs://saralvidhya-artifacts/staging/{tenantId}/...`.
2. A pending request is recorded in Firestore.
3. The platform approver is notified.
4. **Nothing changes on the live site** until approved.

### Step 4: Check Request Status
```bash
sv-publish status <requestId>
```

---

## 5. Approver Promotion (`sv-admin`)

Only designated administrators have permission to approve publish requests:
```bash
# List all pending requests
sv-admin requests

# Review details and file diff
sv-admin show <requestId>

# Approve request (promotes files to live bucket path + updates Firestore currentVersion)
sv-admin approve <requestId>

# Or reject with feedback
sv-admin reject <requestId> --note "Please add explanation to Chapter 2 hard MSQs"
```

Once approved, the college's subjects, chapters and files are live immediately: the catalog is rebuilt from `subject.json` / `chapter.json` (API cache refreshes within ~60 seconds). **No frontend rebuild or redeploy is needed.**

---

## 6. Onboarding a Brand-New College (end to end)

| # | Who | Command | Notes |
|---|-----|---------|-------|
| 1 | Admin | `sv-admin register-tenant --config-file ./<tenantId>/tenant.json --password <pwd>` | Creates the institution and its shared student password. Needs `ADMIN_API_KEY`. |
| 2 | Admin | `sv-admin set-password <tenantId> --generate` | Optional: rotate the shared password later. |
| 3 | Dev | `sv-publish validate ./<tenantId>` | Offline check of layout + JSON. |
| 4 | Dev | `sv-publish submit ./<tenantId>` | Uploads files to staging, creates a pending request. |
| 5 | Admin | `sv-admin approve <requestId>` | Promotes files to live and builds the catalog. |
| 6 | Students | open `https://<app-domain>/<tenantId>/login` | Content appears automatically. |

For step 4, if the platform has a publisher key configured, set `SV_PUBLISH_KEY` first. Publishing more chapters later is the same: validate, submit, approve.

> The shared multi-tenant frontend picks the college from the first URL segment (`/<tenantId>/...`). ANGRAU runs on its own legacy build and is not affected.
