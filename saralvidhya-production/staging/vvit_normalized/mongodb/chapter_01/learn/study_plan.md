# Study Plan: MongoDB — Databases, Collections & CRUD Operations

## 1. 5-Day Standard Undergraduate Track (60 Mins / Day)

### Day 1: Topics 1 & 2 — Database Lazy Instantiation & Collection Lifecycle
- **Interactive 2-Level Mindmap (Topics 1 & 2, Sub-Topics 1.1–2.3)** (10 mins) — Explore L1 core nodes and L2 sub-topic read summaries (`use <db>`, `show dbs`, `db.createCollection()`, capped collections, and `drop()`).
- **Level-1 Microcasts 1 & 2** (15 mins) — Listen to *How MongoDB Creates Databases on First Write* and *How MongoDB Creates and Drops Collections*.
- **Quick & Detailed Study + Quick Check (Topics 1 & 2)** (20 mins) — Memory-only namespace switch, 3 default system databases (`admin`, `config`, `local`), capped byte/doc ceilings (`capped`, `size`, `max`), and index metadata cleanup.
- **Easy MCQ Quiz** (15 mins) — Formative baseline assessment on database and collection lifecycle commands.

### Day 2: Topic 3 — Document Ingestion & 12-Byte `ObjectId` Architecture
- **Interactive 2-Level Mindmap (Topic 3, Sub-Topics 3.1–3.2)** (10 mins) — Single-document vs. batch array ingestion (`insertOne`, `insert`, `insertMany`).
- **Level-1 Microcast 3** (10 mins) — Listen to *How MongoDB Ingests Single and Batch Documents*.
- **Question Bank & Sub-Topic Read (Sub-Topics 3.1 & 3.2)** (25 mins) — Ordered vs. unordered `insertMany()` execution and the 12-byte hexadecimal `ObjectId` structure (4B timestamp + 5B random process/machine value + 3B counter).
- **Flashcards (Beginner & Intermediate)** (15 mins) — Active recall on BSON ingestion and primary key invariants.

### Day 3: Topics 4 & 5 — Document Retrieval, Query Operators, Projection & Pagination
- **Interactive 2-Level Mindmap (Topics 4 & 5, Sub-Topics 4.1–5.3)** (10 mins) — Cursor mechanics (`find` vs `findOne`), comparison/logical operators, projection (`1`/`0`), and pagination pipeline.
- **Level-1 Microcasts 4 & 5** (15 mins) — Listen to *MongoDB Find Versus FindOne Queries* and *MongoDB Query Filtering, Projection, and Pagination*.
- **Detailed Study & Question Bank Drills (Topics 4 & 5)** (25 mins) — Master `$gt`/`$lte`/`$in`/`$nin`, `$and`/`$or`/`$nor`, the projection mixing prohibition (and `_id: 0` exception), and deterministic `sort() -> skip() -> limit()` server execution order.
- **Medium MCQ Quiz** (10 mins) — Query syntax and projection disambiguation drill.

### Day 4: Topic 6 — In-Place Document Updates & Atomic Modifiers
- **Interactive 2-Level Mindmap (Topic 6, Sub-Topics 6.1–6.2)** (10 mins) — `updateOne()`, `updateMany()`, `replaceOne()`, atomic operators, and `upsert: true`.
- **Level-1 Microcast 6** (10 mins) — Listen to *MongoDB In-Place Updates and Atomic Operators*.
- **Sub-Topic Read & Question Bank Practice (Sub-Topics 6.1 & 6.2)** (25 mins) — Whole-document overwrite hazard when omitting `$` operators, atomic field mutations (`$set`, `$unset`, `$inc`, `$push`, `$pull`), and `matchedCount` vs `modifiedCount` vs `upsertedId`.
- **Easy & Medium MSQ Quizzes** (15 mins) — Multi-select validation on atomic update behaviors and edge cases.

### Day 5: Topic 7 — Three-Tier Deletion Hierarchy & Full Examination Simulation
- **Interactive 2-Level Mindmap & Microcast 7 (Topic 7, Sub-Topics 7.1–7.2)** (15 mins) — Document deletion (`deleteOne`, `deleteMany({})`), collection removal (`db.collection.drop()`), and database destruction (`db.dropDatabase()`).
- **Key Takeaways & Points to Remember** (10 mins) — High-density revision of index preservation in `deleteMany({})` vs complete namespace destruction in `drop()`.
- **PYQ Suite (`VVIT_MongoDB_PYQ_Saralvidhya`)** (15 mins) — University past examination patterns and shell query writing.
- **Preparation Exam (`VVIT_MongoDB_Mock_Test` & Hard MCQ/MSQ)** (20 mins) — Timed model examination simulation.

---

## 2. 2-Day Fast-Track Sprint (90 Mins / Day)

### Day 1: Databases, Collections, Ingestion & Query Retrieval (Topics 1–5)
- **Short Podcast + Key Takeaways (Topics 1–5)** (25 mins) — High-density audio and cheat-sheet reactivation of lazy DB creation, capped collections, `ObjectId`, and query cursors.
- **2-Level Mindmap L1 & L2 Read Sweep (Sub-Topics 1.1–5.3)** (40 mins) — Rapid review of comparison/logical operators (`$in`, `$or`, `$nor`), projection rules, and `sort() -> skip() -> limit()` pipeline order.
- **Easy & Medium MCQ + MSQ Quizzes** (25 mins) — Fast-paced active recall and syntax verification.

### Day 2: Atomic Updates, 3-Tier Deletion, PYQs & Mock Examination (Topics 6–7)
- **Long Podcast / Microcasts 6 & 7 + Points to Remember** (25 mins) — Deep-dive into `$set`/`$inc`/`$push`, `upsert: true`, and the 3-level deletion comparison matrix (`deleteMany({})` vs `drop()` vs `dropDatabase()`).
- **Question Bank & PYQ Master Answers** (35 mins) — Practice 5M and 10M university descriptive shell problems.
- **Preparation Exam (Mock Test) & Flashcards (`Revise`)** (30 mins) — Timed final exam simulation and rapid card drill.
