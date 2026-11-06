# SaralVidhya Multi-Tenant Platform Contract (v1)

This document is the **single specification** governing canonical content layout, configuration schemas, tool classification, and dynamic institution hierarchies. All sub-systems (Publisher CLI, Platform Admin CLI, Cloud Run Backend, and Frontend) adhere strictly to this contract.

---

## 1. Specification Artifacts

All machine-readable schemas and rules reside in:
`saralvidhya-production/contract/v1/`

- **`tenant.schema.json`**: Rules for `tenant.json` (branding, features, hierarchy, and optional groupings).
- **`subject.schema.json`**: Rules for `<subjectId>/subject.json` (subject code, order, parent node).
- **`chapter.schema.json`**: Rules for `<subjectId>/chapter_NN/chapter.json` (chapter number, title, topics).
- **`tools.json`**: The sole mapping of file glob patterns to educational tools (Read, Learn, Practice, Prepare, Podcasts).

---

## 2. Directory Layout Contract

Content generators or build adapters must produce this layout:

```text
<tenantId>/
|-- tenant.json                     <- Required: validated against tenant.schema.json
|-- assets/                         <- Optional: logo.png, favicon.png
`-- <subjectId>/
      |-- subject.json              <- Required: validated against subject.schema.json
      `-- chapter_NN/               <- Must be chapter_01, chapter_02, ...
            |-- chapter.json        <- Required: validated against chapter.schema.json
            |-- read/
            |   |-- quick/{beginner,intermediate,advanced}.md
            |   |-- detailed/{beginner,intermediate,advanced}.md
            |   `-- key_takeaways.md
            |-- learn/
            |   |-- mindmap.json / mindmap.md
            |   |-- study_plan.md / study_plan.json
            |   `-- topics/{topicId}/{level}.md
            |-- practice/
            |   |-- flashcards/{persona}.json
            |   |-- mcq/{easy,medium,hard}.json
            |   |-- msq/{easy,medium,hard}.json
            |   `-- question_bank.json
            |-- prepare/
            |   |-- previous_year.json
            |   |-- pre_final_exam.json / .md
            |   |-- certification_exam.json / .md
            |   |-- final_exam.json / .md
            |   `-- exam_rubric_and_keys.json
            |-- podcasts/
            |   |-- {short_podcast,long_podcast,microcast_NN}.{m4a,mp3}
            |   |-- {short_podcast,long_podcast,microcast_NN}.md
            |   `-- {short_podcast,long_podcast,microcast_NN}.transcript.json
            `-- media/              <- Diagrams, charts, images
```

---

## 3. Dynamic Hierarchies (`nodes`)

Institutions vary in their organizational structure:
- **ANGRAU**: `["program", "subject"]`
- **MLRIT**: `["department", "semester", "subject"]`
- **Other universities**: `["faculty", "degree", "term", "subject"]`

### Rules
1. `hierarchy` in `tenant.json` lists the ordered levels. The terminal level **must always be `"subject"`**.
2. Intermediate groupings are defined in `nodes`:
   ```json
   "nodes": [
     { "id": "cse", "type": "department", "name": "Computer Science & Engineering", "order": 1 },
     { "id": "sem_3", "type": "semester", "name": "Semester III", "parentId": "cse", "order": 1 }
   ]
   ```
3. Each `<subjectId>/subject.json` links to its container via `"parentNodeId"` (e.g. `"parentNodeId": "sem_3"`).
4. No directory nesting depth represents hierarchy. All subjects are immediate children of `<tenantId>/`.

---

## 4. Tool Discovery Engine

The platform automatically infers available tools for a chapter by matching files against `tools.json`.
No developer or approver maintains manual tool availability flags. If `practice/mcq/easy.json` exists, the **MCQ Practice** tool becomes visible for that chapter.
