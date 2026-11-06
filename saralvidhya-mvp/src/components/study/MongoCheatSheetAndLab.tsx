import React, { useState, useMemo, useCallback } from "react";
import { cloudStorage } from "@/context/CloudStateContext";
import { GCS_API_BASE } from "@/data/manifestService";

export const MONGO_CLOUD_CHEAT_SHEET_URL = `${GCS_API_BASE}/api/content/vvit/mongodb/chapter_01/media/cheat_sheet.jpg?v=3`;
export const MONGO_CLOUD_LAB_NOTEBOOK_URL = `${GCS_API_BASE}/api/content/vvit/mongodb/chapter_01/media/mongodb_hands_on_lab.ipynb?v=3`;

// ============================================================================
// IN-BROWSER MONGOSH ENGINE & AUTO-GRADER (Ported from mongodb_hands_on_lab.ipynb)
// ============================================================================

type Doc = Record<string, any>;

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function matchCondition(val: any, cond: any): boolean {
  if (cond && typeof cond === "object" && !Array.isArray(cond) && Object.keys(cond).some((k) => k.startsWith("$"))) {
    for (const [op, target] of Object.entries(cond)) {
      if (op === "$gt") {
        if (val === undefined || val === null || !(val > (target as any))) return false;
      } else if (op === "$gte") {
        if (val === undefined || val === null || !(val >= (target as any))) return false;
      } else if (op === "$lt") {
        if (val === undefined || val === null || !(val < (target as any))) return false;
      } else if (op === "$lte") {
        if (val === undefined || val === null || !(val <= (target as any))) return false;
      } else if (op === "$ne") {
        if (val === target) return false;
      } else if (op === "$in") {
        const arr = Array.isArray(target) ? target : [];
        if (Array.isArray(val)) {
          if (!val.some((v) => arr.includes(v))) return false;
        } else {
          if (!arr.includes(val)) return false;
        }
      } else if (op === "$nin") {
        const arr = Array.isArray(target) ? target : [];
        if (Array.isArray(val)) {
          if (val.some((v) => arr.includes(v))) return false;
        } else {
          if (arr.includes(val)) return false;
        }
      } else if (op === "$eq") {
        if (val !== target) return false;
      }
    }
    return true;
  }
  if (Array.isArray(val) && !Array.isArray(cond)) {
    return val.includes(cond);
  }
  return JSON.stringify(val) === JSON.stringify(cond);
}

function matchFilter(doc: Doc, query?: Doc): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  for (const [k, v] of Object.entries(query)) {
    if (k === "$or" && Array.isArray(v)) {
      if (!v.some((sub) => matchFilter(doc, sub))) return false;
    } else if (k === "$and" && Array.isArray(v)) {
      if (!v.every((sub) => matchFilter(doc, sub))) return false;
    } else {
      if (!matchCondition(doc[k], v)) return false;
    }
  }
  return true;
}

function applyProjection(doc: Doc, proj?: Doc): Doc {
  if (!proj || Object.keys(proj).length === 0) return deepClone(doc);
  const incKeys = Object.entries(proj)
    .filter(([k, v]) => k !== "_id" && v === 1)
    .map(([k]) => k);
  const excKeys = Object.entries(proj)
    .filter(([k, v]) => k !== "_id" && v === 0)
    .map(([k]) => k);
  const includeId = proj._id !== 0;

  if (incKeys.length > 0 || (Object.keys(proj).length === 1 && "_id" in proj && !includeId)) {
    if (incKeys.length > 0) {
      const out: Doc = {};
      if (includeId && "_id" in doc) out._id = doc._id;
      for (const k of incKeys) {
        if (k in doc) out[k] = deepClone(doc[k]);
      }
      return out;
    } else {
      const out = deepClone(doc);
      delete out._id;
      return out;
    }
  } else {
    const out = deepClone(doc);
    if (!includeId) delete out._id;
    for (const k of excKeys) delete out[k];
    return out;
  }
}

function applyUpdate(doc: Doc, update: Doc) {
  for (const [op, fields] of Object.entries(update)) {
    if (op === "$set" && fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        doc[k] = deepClone(v);
      }
    } else if (op === "$unset" && fields && typeof fields === "object") {
      for (const k of Object.keys(fields)) {
        delete doc[k];
      }
    } else if (op === "$inc" && fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        doc[k] = (typeof doc[k] === "number" ? doc[k] : 0) + Number(v);
      }
    } else if (op === "$push" && fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        if (!Array.isArray(doc[k])) doc[k] = [];
        doc[k].push(deepClone(v));
      }
    } else if (op === "$pull" && fields && typeof fields === "object") {
      for (const [k, v] of Object.entries(fields)) {
        if (Array.isArray(doc[k])) {
          doc[k] = doc[k].filter((item: any) => item !== v);
        }
      }
    }
  }
}

class MongoCursor {
  private _docs: Doc[];
  private _sortSpec: Record<string, number> | null = null;
  private _skipN = 0;
  private _limitN: number | null = null;

  constructor(docs: Doc[]) {
    this._docs = deepClone(docs);
  }
  sort(spec: Record<string, number>) {
    this._sortSpec = spec;
    return this;
  }
  skip(n: number) {
    this._skipN = Number(n) || 0;
    return this;
  }
  limit(n: number) {
    this._limitN = Number(n);
    return this;
  }
  pretty() {
    return this;
  }
  toList(): Doc[] {
    let res = deepClone(this._docs);
    if (this._sortSpec) {
      const entries = Object.entries(this._sortSpec).reverse();
      for (const [field, dir] of entries) {
        res.sort((a, b) => {
          const va = a[field];
          const vb = b[field];
          if (va === vb) return 0;
          if (va === undefined || va === null) return 1;
          if (vb === undefined || vb === null) return -1;
          return dir === -1 ? (va < vb ? 1 : -1) : va > vb ? 1 : -1;
        });
      }
    }
    if (this._skipN > 0) res = res.slice(this._skipN);
    if (this._limitN !== null) res = res.slice(0, this._limitN);
    return res;
  }
}

class MongoCollection {
  _name: string;
  _docs: Doc[] = [];
  _counter = 1;
  private _db: MongoDatabase;

  constructor(dbRef: MongoDatabase, name: string) {
    this._db = dbRef;
    this._name = name;
  }
  private _ensureCreated() {
    this._db._registerCollection(this._name, this);
  }
  insertOne(doc: Doc) {
    this._ensureCreated();
    const newDoc = deepClone(doc);
    if (!("_id" in newDoc)) {
      const hex = this._counter.toString(16).padStart(24, "0");
      newDoc._id = `ObjectId('${hex}')`;
      this._counter += 1;
    }
    this._docs.push(newDoc);
    return { acknowledged: true, insertedId: newDoc._id };
  }
  insert(doc: Doc | Doc[]) {
    if (Array.isArray(doc)) return this.insertMany(doc);
    return this.insertOne(doc);
  }
  insertMany(docs: Doc[]) {
    this._ensureCreated();
    const insertedIds: Record<string, string> = {};
    docs.forEach((d, idx) => {
      const res = this.insertOne(d);
      insertedIds[String(idx)] = res.insertedId;
    });
    return { acknowledged: true, insertedIds };
  }
  find(query?: Doc, projection?: Doc) {
    const matched = this._docs
      .filter((d) => matchFilter(d, query))
      .map((d) => applyProjection(d, projection));
    return new MongoCursor(matched);
  }
  findOne(query?: Doc, projection?: Doc) {
    for (const d of this._docs) {
      if (matchFilter(d, query)) {
        return applyProjection(d, projection);
      }
    }
    return null;
  }
  updateOne(query: Doc, update: Doc) {
    let matchedCount = 0;
    let modifiedCount = 0;
    for (const d of this._docs) {
      if (matchFilter(d, query)) {
        matchedCount = 1;
        const before = JSON.stringify(d);
        applyUpdate(d, update);
        if (JSON.stringify(d) !== before) modifiedCount = 1;
        break;
      }
    }
    return { acknowledged: true, matchedCount, modifiedCount };
  }
  updateMany(query: Doc, update: Doc) {
    let matchedCount = 0;
    let modifiedCount = 0;
    for (const d of this._docs) {
      if (matchFilter(d, query)) {
        matchedCount += 1;
        const before = JSON.stringify(d);
        applyUpdate(d, update);
        if (JSON.stringify(d) !== before) modifiedCount += 1;
      }
    }
    return { acknowledged: true, matchedCount, modifiedCount };
  }
  deleteOne(query: Doc) {
    const idx = this._docs.findIndex((d) => matchFilter(d, query));
    if (idx !== -1) {
      this._docs.splice(idx, 1);
      return { acknowledged: true, deletedCount: 1 };
    }
    return { acknowledged: true, deletedCount: 0 };
  }
  deleteMany(query: Doc) {
    const before = this._docs.length;
    this._docs = this._docs.filter((d) => !matchFilter(d, query));
    return { acknowledged: true, deletedCount: before - this._docs.length };
  }
  drop() {
    return this._db._dropCollection(this._name);
  }
}

class MongoDatabase {
  _name: string;
  _collections: Record<string, MongoCollection> = {};
  private _server: MongoServer;

  constructor(server: MongoServer, name: string) {
    this._server = server;
    this._name = name;
  }
  _registerCollection(name: string, col: MongoCollection) {
    this._collections[name] = col;
    this._server._databases[this._name] = this;
  }
  _dropCollection(name: string) {
    if (name in this._collections) {
      delete this._collections[name];
      if (Object.keys(this._collections).length === 0) {
        delete this._server._databases[this._name];
      }
      return true;
    }
    return false;
  }
  createCollection(name: string, _options?: Doc) {
    if (!(name in this._collections)) {
      this._collections[name] = new MongoCollection(this, name);
    }
    this._server._databases[this._name] = this;
    return { ok: 1 };
  }
  dropDatabase() {
    this._collections = {};
    delete this._server._databases[this._name];
    return { ok: 1, dropped: this._name };
  }
  getCollection(name: string): MongoCollection {
    if (!(name in this._collections)) {
      return new MongoCollection(this, name);
    }
    return this._collections[name];
  }
}

class MongoServer {
  _databases: Record<string, MongoDatabase> = {};
  currentDbName = "test";
  _pendingDbs: Record<string, MongoDatabase> = {};
  lastOutput: any = null;
  lastBatchOutputs: any[] = [];

  constructor() {
    this._pendingDbs["test"] = new MongoDatabase(this, "test");
  }
  get currentDb(): MongoDatabase {
    if (this.currentDbName in this._databases) {
      return this._databases[this.currentDbName];
    }
    if (!(this.currentDbName in this._pendingDbs)) {
      this._pendingDbs[this.currentDbName] = new MongoDatabase(this, this.currentDbName);
    }
    return this._pendingDbs[this.currentDbName];
  }
  useDb(dbName: string) {
    this.currentDbName = dbName;
    if (!(dbName in this._databases) && !(dbName in this._pendingDbs)) {
      this._pendingDbs[dbName] = new MongoDatabase(this, dbName);
    }
    return `switched to db ${dbName}`;
  }
  showDbs() {
    const lines = ["admin      0.000GB", "config     0.000GB", "local      0.000GB"];
    for (const dbName of Object.keys(this._databases).sort()) {
      const dbObj = this._databases[dbName];
      if (Object.keys(dbObj._collections).length > 0 && !["admin", "config", "local"].includes(dbName)) {
        lines.push(`${dbName.padEnd(10, " ")} 0.000GB`);
      }
    }
    return lines.join("\n");
  }
  showCollections() {
    const dbObj = this._databases[this.currentDbName];
    if (!dbObj || Object.keys(dbObj._collections).length === 0) {
      return "(empty - no collections exist yet)";
    }
    return Object.keys(dbObj._collections).sort().join("\n");
  }
}

function createDbProxy(server: MongoServer) {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        const cur = server.currentDb;
        if (prop === "createCollection") return cur.createCollection.bind(cur);
        if (prop === "dropDatabase") return cur.dropDatabase.bind(cur);
        if (prop === "toString" || prop === "valueOf") return () => cur._name;
        return cur.getCollection(prop);
      },
    }
  );
}

function splitStatements(scriptText: string): string[] {
  const cleanedLines: string[] = [];
  for (const rawLine of scriptText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("%%mongosh")) continue;
    const noComment = rawLine.replace(/(?<!:)\/\/.*$/, "").trim();
    if (!noComment) continue;
    cleanedLines.push(noComment);
  }

  const statements: string[] = [];
  let buf: string[] = [];
  let depth = 0;

  for (const line of cleanedLines) {
    if (depth === 0 && /^(use\s+\w+|show\s+dbs|show\s+collections|db)\s*;?$/.test(line)) {
      statements.push(line.replace(/;$/, "").trim());
      continue;
    }
    for (const ch of line) {
      if ("([{".includes(ch)) depth += 1;
      else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
    }
    buf.push(line);
    if (depth === 0) {
      const joined = buf.join(" ").trim();
      let subBuf = "";
      let subDepth = 0;
      let inStr: string | null = null;
      for (let i = 0; i < joined.length; i++) {
        const ch = joined[i];
        if (inStr) {
          subBuf += ch;
          if (ch === inStr && joined[i - 1] !== "\\") inStr = null;
        } else {
          if (ch === '"' || ch === "'") {
            inStr = ch;
            subBuf += ch;
          } else if ("([{".includes(ch)) {
            subDepth += 1;
            subBuf += ch;
          } else if (")]}".includes(ch)) {
            subDepth = Math.max(0, subDepth - 1);
            subBuf += ch;
          } else if (ch === ";" && subDepth === 0) {
            if (subBuf.trim()) statements.push(subBuf.trim());
            subBuf = "";
          } else {
            subBuf += ch;
          }
        }
      }
      if (subBuf.trim()) statements.push(subBuf.trim());
      buf = [];
    }
  }
  if (buf.length > 0 && buf.join(" ").trim()) {
    statements.push(buf.join(" ").trim());
  }
  return statements;
}

function executeMongosh(server: MongoServer, scriptText: string): { logs: string; outputs: any[]; error?: string } {
  const statements = splitStatements(scriptText);
  const outputs: any[] = [];
  const logLines: string[] = [];
  const dbProxy = createDbProxy(server);

  try {
    for (const st of statements) {
      const mUse = st.match(/^use\s+([a-zA-Z0-9_]+)$/);
      if (mUse) {
        const out = server.useDb(mUse[1]);
        logLines.push(`${server.currentDbName}> ${st}\n${out}\n`);
        outputs.push(out);
        continue;
      }
      if (st === "show dbs") {
        const out = server.showDbs();
        logLines.push(`${server.currentDbName}> ${st}\n${out}\n`);
        outputs.push(out);
        continue;
      }
      if (st === "show collections") {
        const out = server.showCollections();
        logLines.push(`${server.currentDbName}> ${st}\n${out}\n`);
        outputs.push(out);
        continue;
      }
      if (st === "db") {
        const out = server.currentDbName;
        logLines.push(`${server.currentDbName}> db\n${out}\n`);
        outputs.push(out);
        continue;
      }

      // Evaluate JS expression against dbProxy
      const fn = new Function("db", `return (${st});`);
      const rawRes = fn(dbProxy);
      const val = rawRes instanceof MongoCursor ? rawRes.toList() : rawRes;
      server.lastOutput = val;
      outputs.push(val);
      const formatted = val !== undefined ? JSON.stringify(val, null, 2) : "null";
      logLines.push(`${server.currentDbName}> ${st}\n${formatted}\n`);
    }
    server.lastBatchOutputs = outputs;
    return { logs: logLines.join("\n"), outputs };
  } catch (err: any) {
    const msg = err?.message || String(err);
    logLines.push(`MongoServerError: ${msg}`);
    return { logs: logLines.join("\n"), outputs, error: msg };
  }
}

// ============================================================================
// LAB CURRICULUM DATA (All 7 Labs & 13 Tasks from mongodb_hands_on_lab.ipynb)
// ============================================================================

interface LabTaskSpec {
  id: string;
  taskCode: string;
  title: string;
  instructions: string[];
  starterCode: string;
  verify: (server: MongoServer) => { passed: boolean; message: string };
}

interface LabModuleSpec {
  id: string;
  badge: string;
  title: string;
  commandsCovered: string;
  walkthrough: { heading: string; points: string[] }[];
  demoTitle?: string;
  demoCode?: string;
  seedTitle?: string;
  seedCode?: string;
  tasks: LabTaskSpec[];
}

const LAB_MODULES: LabModuleSpec[] = [
  {
    id: "lab_1",
    badge: "Lab 1",
    title: "Database Operations (use, show dbs, db.dropDatabase())",
    commandsCovered: "use <db>, lazy database creation on first insert, show dbs, db.dropDatabase()",
    walkthrough: [
      {
        heading: "1. Create & Switch Database (use <databaseName>)",
        points: [
          "Switches the current database context for all subsequent commands in the session.",
          "MongoDB has no dedicated command to create a database ahead of time. Switching to a non-existent database selects it in memory, but it is only created on disk once you insert data into a collection within it.",
        ],
      },
      {
        heading: "2. List Databases (show dbs) & Delete Database (db.dropDatabase())",
        points: [
          "show dbs lists every database on the connected MongoDB server along with its storage size (only appears after data is written).",
          "db.dropDatabase() permanently deletes the currently selected database, including all of its collections and documents.",
        ],
      },
    ],
    demoTitle: "Guided Demo 1: See How Lazy Database Creation Works",
    demoCode: `%%mongosh
// 1. Switch to demoDB (selected, but not yet on disk)
use demoDB
show dbs

// 2. Insert a document so demoDB is created on disk
db.items.insertOne({ item: "Notebook", qty: 5 });
show dbs

// 3. Clean up demoDB using dropDatabase()
db.dropDatabase();
show dbs`,
    tasks: [
      {
        id: "task_1_1",
        taskCode: "Task 1.1",
        title: "Select & Materialize schoolDB",
        instructions: [
          "Switch the current database context to schoolDB using use.",
          'Insert a single document { name: "Aditi", age: 18, grade: 8 } into the students collection using db.students.insertOne(...) so schoolDB is created on disk.',
          "Run show dbs to verify that schoolDB now appears in the server's database list.",
        ],
        starterCode: `%%mongosh
// Step 1: Switch to schoolDB
use schoolDB

// Step 2: Insert Aditi's document into the students collection
db.students.insertOne({ name: "Aditi", age: 18, grade: 8 });

// Step 3: List all databases to confirm schoolDB exists
show dbs`,
        verify: (server) => {
          const hasSchool = "schoolDB" in server._databases;
          const aditi = hasSchool ? server._databases["schoolDB"].getCollection("students").findOne({ name: "Aditi" }) : null;
          const ok = Boolean(hasSchool && aditi && aditi.age === 18);
          return {
            passed: ok,
            message: ok
              ? "schoolDB is active on disk and contains Aditi's student record!"
              : "Make sure you switched to schoolDB and inserted { name: 'Aditi', age: 18, grade: 8 } into db.students.",
          };
        },
      },
      {
        id: "task_1_2",
        taskCode: "Task 1.2",
        title: "Create and Drop a Temporary Database (sandboxDB)",
        instructions: [
          "Switch to a temporary database named sandboxDB.",
          "Insert { temp: true } into db.logs so sandboxDB is created.",
          "Permanently delete sandboxDB using db.dropDatabase().",
          "Switch back to schoolDB and run show dbs to confirm sandboxDB is gone while schoolDB remains intact.",
        ],
        starterCode: `%%mongosh
// Step 1: Switch to sandboxDB and insert a dummy document
use sandboxDB
db.logs.insertOne({ temp: true });

// Step 2: Permanently drop sandboxDB
db.dropDatabase();

// Step 3: Switch back to schoolDB and verify with show dbs
use schoolDB
show dbs`,
        verify: (server) => {
          const sandboxGone = !("sandboxDB" in server._databases);
          const currIsSchool = server.currentDbName === "schoolDB";
          const ok = sandboxGone && currIsSchool;
          return {
            passed: ok,
            message: ok
              ? "sandboxDB was permanently deleted and current context is back on schoolDB!"
              : "Ensure sandboxDB was dropped via db.dropDatabase() and you switched back to schoolDB.",
          };
        },
      },
    ],
  },
  {
    id: "lab_2",
    badge: "Lab 2",
    title: "Collection Operations (createCollection, show collections, drop)",
    commandsCovered: "db.createCollection(), show collections, db.<collection>.drop()",
    walkthrough: [
      {
        heading: "Explicit Creation, Listing & Dropping Collections",
        points: [
          "db.createCollection(name, options): Explicitly creates a new collection in the current database (useful for validation rules or capped collections).",
          "show collections: Lists every collection that exists in the currently selected database.",
          "db.<collection>.drop(): Permanently removes a collection, all of its documents, and its indexes.",
        ],
      },
    ],
    tasks: [
      {
        id: "task_2_1",
        taskCode: "Task 2.1",
        title: "Explicitly Create & List Collections",
        instructions: [
          "Ensure you are in schoolDB.",
          'Explicitly create a collection named "courses" and another temporary collection named "old_records" using db.createCollection().',
          "Run show collections to see all collections in schoolDB (courses, old_records, and students).",
        ],
        starterCode: `%%mongosh
// Step 1: Ensure schoolDB is selected
use schoolDB

// Step 2: Explicitly create "courses" and "old_records" collections
db.createCollection("courses");
db.createCollection("old_records");

// Step 3: List all collections in schoolDB
show collections`,
        verify: (server) => {
          const cols = Object.keys(server._databases["schoolDB"]?._collections || {});
          const ok = ["courses", "old_records"].every((c) => cols.includes(c));
          return {
            passed: ok,
            message: ok
              ? `Collections present in schoolDB: [${cols.sort().join(", ")}]`
              : "Make sure both 'courses' and 'old_records' were created in schoolDB.",
          };
        },
      },
      {
        id: "task_2_2",
        taskCode: "Task 2.2",
        title: "Drop an Unused Collection (db.<collection>.drop())",
        instructions: [
          "Permanently delete both the old_records and courses collections using .drop() so we have a clean workspace focusing on students.",
          "Run show collections to confirm only students remains in schoolDB.",
        ],
        starterCode: `%%mongosh
// Step 1: Drop the old_records and courses collections
db.old_records.drop();
db.courses.drop();

// Step 2: List remaining collections
show collections`,
        verify: (server) => {
          const cols = Object.keys(server._databases["schoolDB"]?._collections || {});
          const ok = !cols.includes("old_records") && !cols.includes("courses") && cols.includes("students");
          return {
            passed: ok,
            message: ok
              ? "old_records and courses were dropped; only 'students' remains in schoolDB!"
              : `Expected only 'students' collection, but found: [${cols.join(", ")}]`,
          };
        },
      },
    ],
  },
  {
    id: "lab_3",
    badge: "Lab 3",
    title: "CRUD: Create (insertOne, insertMany) & Read (find, findOne)",
    commandsCovered: "insertOne(), insertMany(), find(), findOne()",
    walkthrough: [
      {
        heading: "Document Ingestion & Retrieval",
        points: [
          "db.<collection>.insertOne(document): Inserts a single document into a collection (auto-creates 12-byte _id: ObjectId).",
          "db.<collection>.insertMany([doc1, doc2, ...]): Inserts multiple documents in a single call, passed as an array [...].",
          "db.<collection>.find(query, projection): Retrieves all matching documents and returns a cursor.",
          "db.<collection>.findOne(query, projection): Retrieves only the first matching document (or null if none match).",
        ],
      },
    ],
    tasks: [
      {
        id: "task_3_1",
        taskCode: "Task 3.1",
        title: "Populate students Using insertOne() and insertMany()",
        instructions: [
          'Use db.students.insertOne() to insert Rahul\'s document: { name: "Rahul", age: 19, grade: 9, subjects: ["Math", "Science"] }',
          'Use db.students.insertMany() to insert Meera ({ name: "Meera", age: 17, grade: 7, subjects: ["English", "Science"] }) and Kabir ({ name: "Kabir", age: 18, grade: 8, subjects: ["Math", "History"] }).',
        ],
        starterCode: `%%mongosh
// Step 1: Insert Rahul using insertOne()
db.students.insertOne({
  name: "Rahul",
  age: 19,
  grade: 9,
  subjects: ["Math", "Science"]
});

// Step 2: Insert Meera and Kabir using insertMany()
db.students.insertMany([
  { name: "Meera", age: 17, grade: 7, subjects: ["English", "Science"] },
  { name: "Kabir", age: 18, grade: 8, subjects: ["Math", "History"] }
]);`,
        verify: (server) => {
          const col = server._databases["schoolDB"]?.getCollection("students");
          const all = col ? col.find().toList() : [];
          const names = new Set(all.map((d) => d.name));
          const rahul = col?.findOne({ name: "Rahul" });
          const ok = ["Rahul", "Meera", "Kabir"].every((n) => names.has(n)) && rahul?.age === 19;
          return {
            passed: ok,
            message: ok
              ? `Successfully inserted documents! Total students in collection: ${all.length}`
              : "Verify Rahul, Meera, and Kabir were inserted with the exact fields requested.",
          };
        },
      },
      {
        id: "task_3_2",
        taskCode: "Task 3.2",
        title: "Query Documents Using find() and findOne()",
        instructions: [
          "Retrieve all documents in the students collection using db.students.find().",
          "Retrieve all students whose age is 18 using db.students.find({ age: 18 }).",
          'Retrieve the single document where name is "Rahul" using db.students.findOne({ name: "Rahul" }).',
        ],
        starterCode: `%%mongosh
// Step 1: Retrieve all students
db.students.find();

// Step 2: Retrieve all students where age equals 18
db.students.find({ age: 18 });

// Step 3: Retrieve the first matching document where name is "Rahul"
db.students.findOne({ name: "Rahul" });`,
        verify: (server) => {
          const batch = server.lastBatchOutputs;
          const last = batch[batch.length - 1];
          const secondLast = batch[batch.length - 2];
          const ok =
            batch.length >= 3 &&
            Array.isArray(secondLast) &&
            secondLast.length >= 1 &&
            last &&
            last.name === "Rahul";
          return {
            passed: ok,
            message: ok
              ? "find() returned the matching age-18 students and findOne() returned Rahul's document!"
              : "Make sure you executed all three queries: find(), find({ age: 18 }), and findOne({ name: 'Rahul' }).",
          };
        },
      },
    ],
  },
  {
    id: "lab_4",
    badge: "Lab 4",
    title: "CRUD: Update (updateOne, updateMany) & Delete (deleteOne, deleteMany)",
    commandsCovered: "updateOne(), updateMany(), deleteOne(), deleteMany()",
    walkthrough: [
      {
        heading: "Targeted Modification & Removal",
        points: [
          "db.<collection>.updateOne(filter, update): Updates the first document matching the filter using atomic operators like $set.",
          "db.<collection>.updateMany(filter, update): Applies update operators to every matching document.",
          "db.<collection>.deleteOne(filter): Deletes the first matching document.",
          "db.<collection>.deleteMany(filter): Deletes every matching document (passing {} removes all documents while keeping the collection and indexes).",
        ],
      },
    ],
    tasks: [
      {
        id: "task_4_1",
        taskCode: "Task 4.1",
        title: "Update Documents with updateOne() and updateMany()",
        instructions: [
          'Update "Rahul"\'s document using updateOne() and $set so his age becomes 20 and his grade becomes 10.',
          "Update all students whose age is 18 using updateMany() and $set to add a new field promoted: true.",
          "Run db.students.find() to inspect the updated documents.",
        ],
        starterCode: `%%mongosh
// Step 1: Update Rahul's age to 20 and grade to 10 using updateOne()
db.students.updateOne(
  { name: "Rahul" },
  { $set: { age: 20, grade: 10 } }
);

// Step 2: Mark all students with age 18 as promoted: true using updateMany()
db.students.updateMany(
  { age: 18 },
  { $set: { promoted: true } }
);

// Step 3: Verify the updates
db.students.find();`,
        verify: (server) => {
          const col = server._databases["schoolDB"]?.getCollection("students");
          const rahul = col?.findOne({ name: "Rahul" });
          const age18 = col ? col.find({ age: 18 }).toList() : [];
          const ok = Boolean(
            rahul &&
              rahul.age === 20 &&
              rahul.grade === 10 &&
              age18.length >= 1 &&
              age18.every((d) => d.promoted === true)
          );
          return {
            passed: ok,
            message: ok
              ? "Rahul's age/grade were updated, and all age-18 students now have promoted: true!"
              : "Check that Rahul has age: 20, grade: 10 and age-18 students have promoted: true.",
          };
        },
      },
      {
        id: "task_4_2",
        taskCode: "Task 4.2",
        title: "Delete Documents with deleteOne() and deleteMany()",
        instructions: [
          'Delete the document where name is "Kabir" using db.students.deleteOne({ name: "Kabir" }).',
          "Delete all documents where age is 17 using db.students.deleteMany({ age: 17 }).",
          'Run db.students.find() to verify that "Kabir" and age-17 records are removed.',
        ],
        starterCode: `%%mongosh
// Step 1: Delete Kabir using deleteOne()
db.students.deleteOne({ name: "Kabir" });

// Step 2: Delete all students with age 17 using deleteMany()
db.students.deleteMany({ age: 17 });

// Step 3: Check remaining students
db.students.find();`,
        verify: (server) => {
          const col = server._databases["schoolDB"]?.getCollection("students");
          const all = col ? col.find().toList() : [];
          const names = all.map((d) => d.name);
          const ok = !names.includes("Kabir") && !all.some((d) => d.age === 17);
          return {
            passed: ok,
            message: ok
              ? `Kabir and age-17 records were removed. Remaining students: [${names.join(", ")}]`
              : `Make sure Kabir and age-17 documents were deleted.`,
          };
        },
      },
    ],
  },
  {
    id: "lab_5",
    badge: "Lab 5",
    title: "More About find() — Filter, Projection, sort(), limit(), skip()",
    commandsCovered: "Query Filters, Projections (1/0), sort(), skip(), limit(), findOne() Revisited",
    walkthrough: [
      {
        heading: "Projections & Cursor Modifiers",
        points: [
          "Projection (2nd argument): Controls which fields are returned — 1 to include, 0 to exclude (_id is included by default unless _id: 0 is specified).",
          "sort({ field: 1 | -1 }): Orders results (1 = ascending, -1 = descending).",
          "skip(n) & limit(n): skip(n) omits the first n documents; limit(n) caps the number of returned documents.",
        ],
      },
    ],
    seedTitle: "Seed Additional Student Records for Lab 5",
    seedCode: `%%mongosh
use schoolDB
db.students.deleteMany({});
db.students.insertMany([
  { name: "Aditi", age: 18, grade: 8, promoted: true },
  { name: "Rahul", age: 20, grade: 10, subjects: ["Math", "Science"] },
  { name: "Meera", age: 17, grade: 7, subjects: ["English", "Art"], attempts: 1 },
  { name: "Kabir", age: 18, grade: 8, subjects: ["Math", "Science"], attempts: 2 },
  { name: "Zoya",  age: 19, grade: 9, subjects: ["History", "Math"], attempts: 1 },
  { name: "Dev",   age: 21, grade: 11, subjects: ["Physics", "Math"], attempts: 3 }
]);
db.students.find();`,
    tasks: [
      {
        id: "task_5_1",
        taskCode: "Task 5.1",
        title: "Filter, Projection & findOne() Revisited",
        instructions: [
          "Find all students with age greater than or equal to 18 ({ age: { $gte: 18 } }).",
          "Find all students ({}), returning only their name and age fields while excluding _id ({ name: 1, age: 1, _id: 0 }).",
          "Use findOne() to return only the name field (excluding _id) of the first student whose age is >= 18.",
        ],
        starterCode: `%%mongosh
// Step 1: Find students with age >= 18
db.students.find({ age: { $gte: 18 } });

// Step 2: Return only name and age (exclude _id) for every student
db.students.find({}, { name: 1, age: 1, _id: 0 });

// Step 3: Use findOne() with filter (age >= 18) and projection (name only, exclude _id)
db.students.findOne(
  { age: { $gte: 18 } },
  { name: 1, _id: 0 }
);`,
        verify: (server) => {
          const outs = server.lastBatchOutputs;
          const projList = outs[outs.length - 2];
          const oneDoc = outs[outs.length - 1];
          const ok =
            outs.length >= 3 &&
            Array.isArray(projList) &&
            projList.length > 0 &&
            !("_id" in projList[0]) &&
            "name" in projList[0] &&
            "age" in projList[0] &&
            oneDoc &&
            !("_id" in oneDoc) &&
            Boolean(oneDoc.name);
          return {
            passed: ok,
            message: ok
              ? "Projection cleanly excluded _id and returned exact requested fields!"
              : "Verify your projection arguments use { name: 1, age: 1, _id: 0 } and { name: 1, _id: 0 }.",
          };
        },
      },
      {
        id: "task_5_2",
        taskCode: "Task 5.2",
        title: "Sorting & Pagination (sort(), skip(), limit())",
        instructions: [
          "Retrieve all students sorted by age from highest to lowest (sort({ age: -1 })).",
          "Paginate the student list: sort students by age in ascending order (1), skip the first 2 documents (skip(2)), and limit the result to 3 documents (limit(3)).",
        ],
        starterCode: `%%mongosh
// Step 1: Sort students from highest to lowest age (-1)
db.students.find().sort({ age: -1 });

// Step 2: Sort by age ascending (1), skip first 2 results, and return the next 3
db.students.find().sort({ age: 1 }).skip(2).limit(3);`,
        verify: (server) => {
          const outs = server.lastBatchOutputs;
          const descList = outs[outs.length - 2];
          const pageList = outs[outs.length - 1];
          const descAges = Array.isArray(descList) ? descList.map((d) => d.age) : [];
          const pageAges = Array.isArray(pageList) ? pageList.map((d) => d.age) : [];
          const isSortedDesc = descAges.length > 0 && descAges.every((v, i, a) => i === 0 || a[i - 1] >= v);
          const ok = isSortedDesc && pageAges.length === 3;
          return {
            passed: ok,
            message: ok
              ? `Descending sort ages: [${descAges.join(", ")}] | Paginated slice (skip 2, limit 3) ages: [${pageAges.join(", ")}]`
              : "Check your .sort({ age: -1 }) and .sort({ age: 1 }).skip(2).limit(3) commands.",
          };
        },
      },
    ],
  },
  {
    id: "lab_6",
    badge: "Lab 6",
    title: "Query & Update Operators in Action",
    commandsCovered: "Comparison ($gt, $gte, $lt, $lte, $ne, $in, $nin), Logical ($or, $and), Update ($set, $inc, $push, $pull)",
    walkthrough: [
      {
        heading: "Query & Atomic Update Operators",
        points: [
          "Comparison & Set: $gt, $gte, $lt, $lte, $ne, $in, $nin.",
          "Logical: $or and $and join condition arrays.",
          "Update Modifiers: $set sets a field, $inc increments a number, $push appends to an array, $pull removes from an array.",
        ],
      },
    ],
    tasks: [
      {
        id: "task_6_1",
        taskCode: "Task 6.1",
        title: "Comparison, Array & Logical Query Operators",
        instructions: [
          "Find students whose age is strictly greater than 17 and strictly less than 21 ({ age: { $gt: 17, $lt: 21 } }).",
          "Find students whose age is in [17, 18, 19] using $in.",
          'Find students where age >= 20 OR name is "Meera" using $or.',
        ],
        starterCode: `%%mongosh
// Step 1: Find students with age strictly between 17 and 21 ($gt: 17, $lt: 21)
db.students.find({ age: { $gt: 17, $lt: 21 } });

// Step 2: Find students where age is in [17, 18, 19] using $in
db.students.find({ age: { $in: [17, 18, 19] } });

// Step 3: Find students where age >= 20 OR name is "Meera" using $or
db.students.find({
  $or: [{ age: { $gte: 20 } }, { name: "Meera" }]
});`,
        verify: (server) => {
          const outs = server.lastBatchOutputs;
          const q1 = outs[outs.length - 3];
          const q2 = outs[outs.length - 2];
          const q3 = outs[outs.length - 1];
          const ok =
            Array.isArray(q1) &&
            q1.every((d) => d.age > 17 && d.age < 21) &&
            Array.isArray(q2) &&
            q2.every((d) => [17, 18, 19].includes(d.age)) &&
            Array.isArray(q3) &&
            q3.every((d) => d.age >= 20 || d.name === "Meera");
          return {
            passed: ok,
            message: ok
              ? "All comparison, array ($in), and logical ($or) operator queries returned exact matches!"
              : "Double-check the filter conditions for $gt/$lt, $in, and $or.",
          };
        },
      },
      {
        id: "task_6_2",
        taskCode: "Task 6.2",
        title: "Update Operators ($set, $inc, $push, $pull)",
        instructions: [
          'In a single db.students.updateOne() call for { name: "Rahul" }: set age to 21 ($set), increment attempts by 1 ($inc), and add "History" to subjects ($push).',
          'In a second db.students.updateOne() call for { name: "Rahul" }: remove "Science" from subjects ($pull).',
          'Retrieve "Rahul"\'s updated document with db.students.findOne({ name: "Rahul" }).',
        ],
        starterCode: `%%mongosh
// Step 1: Update Rahul using $set, $inc, and $push together
db.students.updateOne(
  { name: "Rahul" },
  {
    $set: { age: 21 },
    $inc: { attempts: 1 },
    $push: { subjects: "History" }
  }
);

// Step 2: Remove "Science" from Rahul's subjects array using $pull
db.students.updateOne(
  { name: "Rahul" },
  { $pull: { subjects: "Science" } }
);

// Step 3: Inspect Rahul's final document
db.students.findOne({ name: "Rahul" });`,
        verify: (server) => {
          const col = server._databases["schoolDB"]?.getCollection("students");
          const rahul = col?.findOne({ name: "Rahul" });
          const ok = Boolean(
            rahul &&
              rahul.age === 21 &&
              rahul.attempts >= 1 &&
              Array.isArray(rahul.subjects) &&
              rahul.subjects.includes("History") &&
              !rahul.subjects.includes("Science")
          );
          return {
            passed: ok,
            message: ok
              ? `Rahul's updated profile -> age: ${rahul?.age}, attempts: ${rahul?.attempts}, subjects: [${rahul?.subjects?.join(", ")}]`
              : "Ensure $set, $inc, $push, and $pull were all applied to Rahul's document.",
          };
        },
      },
    ],
  },
  {
    id: "lab_7",
    badge: "Lab 7 · Capstone",
    title: "Capstone Real-World Lab Challenge (libraryDB)",
    commandsCovered: "End-to-End Multi-Step Database Workflow & Final Scoreboard",
    walkthrough: [
      {
        heading: "University Library Database End-to-End Workflow",
        points: [
          "Combine database switching (use libraryDB), explicit collection creation, batch insertMany(), atomic $inc & $push updates, deleteOne(), and filtered + projected + sorted + limited cursor queries.",
        ],
      },
    ],
    tasks: [
      {
        id: "task_7_1",
        taskCode: "Task 7.1",
        title: "University Library Database Workflow",
        instructions: [
          'Switch to libraryDB and explicitly create a collection named "books".',
          "Insert 4 books using insertMany(): MongoDB Basics (copies: 4, checkouts: 10), System Design (copies: 2, checkouts: 25), Data Structures (copies: 6, checkouts: 40), and Legacy SQL (copies: 0, checkouts: 5).",
          'Use updateOne() on { title: "MongoDB Basics" } to increment checkouts by 1 ($inc) and push "Bestseller" into tags ($push).',
          "Use deleteOne() to delete books where copies equals 0 ({ copies: 0 }).",
          "Query db.books.find() for books with copies >= 2, projecting { title: 1, checkouts: 1, _id: 0 }, sorted by checkouts descending (-1), limited to top 2.",
        ],
        starterCode: `%%mongosh
// 1. Switch to libraryDB and explicitly create the "books" collection
use libraryDB
db.createCollection("books");

// 2. Insert the 4 books using insertMany()
db.books.insertMany([
  { title: "MongoDB Basics", copies: 4, tags: ["NoSQL", "Database"], checkouts: 10 },
  { title: "System Design", copies: 2, tags: ["Architecture", "Backend"], checkouts: 25 },
  { title: "Data Structures", copies: 6, tags: ["CS", "Algorithms"], checkouts: 40 },
  { title: "Legacy SQL", copies: 0, tags: ["SQL", "Archive"], checkouts: 5 }
]);

// 3. Increment checkouts by 1 and push "Bestseller" tag for "MongoDB Basics"
db.books.updateOne(
  { title: "MongoDB Basics" },
  {
    $inc: { checkouts: 1 },
    $push: { tags: "Bestseller" }
  }
);

// 4. Delete out-of-stock book where copies == 0
db.books.deleteOne({ copies: 0 });

// 5. Return top 2 books with copies >= 2, projecting title & checkouts (no _id), sorted by checkouts descending
db.books.find(
  { copies: { $gte: 2 } },
  { title: 1, checkouts: 1, _id: 0 }
).sort({ checkouts: -1 }).limit(2);`,
        verify: (server) => {
          const libDb = server._databases["libraryDB"];
          const top2 = server.lastOutput;
          const mbBook = libDb?.getCollection("books").findOne({ title: "MongoDB Basics" });
          const totalBooks = libDb ? libDb.getCollection("books").find().toList().length : 0;
          const ok = Boolean(
            libDb &&
              totalBooks === 3 &&
              mbBook &&
              mbBook.checkouts >= 11 &&
              Array.isArray(mbBook.tags) &&
              mbBook.tags.includes("Bestseller") &&
              Array.isArray(top2) &&
              top2.length === 2 &&
              top2[0].title === "Data Structures" &&
              top2[1].title === "System Design"
          );
          return {
            passed: ok,
            message: ok
              ? "Capstone completed! libraryDB created, books inserted, updated, cleaned, and top 2 queried!"
              : "Verify all 5 steps in Task 7.1 were executed accurately.",
          };
        },
      },
    ],
  },
];

// ============================================================================
// CHEAT SHEET STRUCTURED REFERENCE CARDS
// ============================================================================

const CHEAT_SHEET_COLUMNS = [
  {
    title: "1. Database & Collection Operations",
    accent: "#16A34A",
    items: [
      {
        cmd: "use <dbName>",
        desc: "Switch/select database context (DB created lazily on first insert).",
        code: `use schoolDB\ndb.students.insertOne({ name: "Aditi", age: 18 })\nshow dbs\ndb.dropDatabase()`,
      },
      {
        cmd: 'db.createCollection("students")',
        desc: "Explicitly create a collection; show collections lists all; drop() removes collection & indexes.",
        code: `db.createCollection("students")\nshow collections\ndb.students.drop()`,
      },
    ],
  },
  {
    title: "2. CRUD — Create & Read",
    accent: "#0D9488",
    items: [
      {
        cmd: "insertOne(doc) / insertMany([docs])",
        desc: "Inserts single document or array of documents with auto-generated 12-byte ObjectId.",
        code: `db.students.insertOne({ name: "Rahul", age: 19 })\ndb.students.insertMany([\n  { name: "Meera", age: 17 },\n  { name: "Kabir", age: 18 }\n])`,
      },
      {
        cmd: "find(query, projection) / findOne()",
        desc: "find() returns a cursor of all matches; findOne() returns the first matching document object.",
        code: `db.students.find({ age: 18 })\ndb.students.findOne({ name: "Rahul" })`,
      },
    ],
  },
  {
    title: "3. CRUD — Update & Delete",
    accent: "#2563EB",
    items: [
      {
        cmd: "updateOne(filter, update) / updateMany()",
        desc: "Modifies first matching or all matching documents in-place using atomic update operators.",
        code: `db.students.updateOne(\n  { name: "Rahul" },\n  { $set: { age: 20 } }\n)\ndb.students.updateMany(\n  { age: 18 },\n  { $set: { promoted: true } }\n)`,
      },
      {
        cmd: "deleteOne(filter) / deleteMany(filter)",
        desc: "Deletes first matching or all matching documents (empty {} deletes all docs, keeps indexes).",
        code: `db.students.deleteOne({ name: "Kabir" })\ndb.students.deleteMany({ age: 17 })`,
      },
    ],
  },
  {
    title: "4. More About find() (Advanced Querying)",
    accent: "#7C3AED",
    items: [
      {
        cmd: "Projection & Cursor Chaining (.sort().skip().limit())",
        desc: "1 = include field, 0 = exclude field. Sort: 1 = asc, -1 = desc. Canonical execution order: sort → skip → limit.",
        code: `// Return only name & age (exclude _id)\ndb.students.find({}, { name: 1, age: 1, _id: 0 })\n\n// Paging: sort asc, skip 10, limit 5\ndb.students.find().sort({ age: 1 }).skip(10).limit(5)`,
      },
    ],
  },
  {
    title: "5. Query & Update Operators",
    accent: "#D97706",
    items: [
      {
        cmd: "Comparison ($gt, $gte, $lt, $lte, $ne, $in, $nin) & Logical ($or, $and)",
        desc: "Filter ranges, set memberships, and compound boolean conditions.",
        code: `db.students.find({ age: { $gt: 16, $lte: 20 } })\ndb.students.find({\n  $or: [{ age: 18 }, { name: "Meera" }]\n})`,
      },
      {
        cmd: "Atomic Update Operators ($set, $inc, $push, $pull)",
        desc: "$set updates field, $inc increments numeric field, $push appends to array, $pull removes from array.",
        code: `db.students.updateOne(\n  { name: "Rahul" },\n  { $inc: { attempts: 1 }, $push: { subjects: "History" } }\n)`,
      },
    ],
  },
];

// ============================================================================
// EXPORTED UI COMPONENTS
// ============================================================================

export const MongoCheatSheetPanel: React.FC = () => {
  const [zoom, setZoom] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1600);
  };

  return (
    <div style={{ padding: "22px 28px 48px", maxWidth: "1360px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Top Action Card */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DEC9",
          borderRadius: "14px",
          padding: "14px 20px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 2px 8px rgba(30, 40, 34, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "#E8F5E9",
                color: "#1B5E20",
                fontWeight: 700,
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "999px",
                border: "1px solid #A5D6A7",
              }}
            >
              VVIT · NoSQL Database Systems
            </span>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1E2822" }}>
              MongoDB Quick Reference Cheat Sheet (Cloud Edition)
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#5C645E" }}>
            High-yield command syntax across Database, Collection, CRUD, Cursor Chaining, and Atomic Operators. Click the sheet to inspect full-screen.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#F7F3EB",
              border: "1px solid #E3DDD1",
              borderRadius: "9px",
              padding: "2px 4px",
            }}
          >
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 9px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#375545",
              }}
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                color: "#1E2822",
              }}
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
              style={{
                border: "none",
                background: "transparent",
                padding: "4px 9px",
                cursor: "pointer",
                fontWeight: 700,
                color: "#375545",
              }}
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              border: "1px solid #D9A382",
              background: "#FFF8F3",
              color: "#7C4322",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⛶ Full Screen
          </button>

          <a
            href={MONGO_CLOUD_CHEAT_SHEET_URL} target="_blank" rel="noopener noreferrer"
            download="VVIT_MongoDB_Cheat_Sheet.jpg"
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid #2E5A44",
              background: "#2E5A44",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⬇ Download Cheat Sheet
          </a>
        </div>
      </div>

      {/* Visual Cheat Sheet Poster */}
      <div
        style={{
          background: "#F4F7F5",
          borderRadius: "16px",
          border: "2px solid #CBE0D3",
          overflow: "auto",
          boxShadow: "0 10px 28px rgba(15, 23, 42, 0.16)",
          marginBottom: "26px",
          textAlign: "center",
          padding: "12px",
        }}
      >
        <img
          src={MONGO_CLOUD_CHEAT_SHEET_URL}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith("/mongodb-cheat-sheet.jpg")) {
              target.src = "/mongodb-cheat-sheet.jpg";
            }
          }}
          alt="VVIT MongoDB Cheat Sheet"
          onClick={() => setLightboxOpen(true)}
          style={{
            width: `${Math.round(zoom * 100)}%`,
            maxWidth: zoom === 1 ? "100%" : "none",
            height: "auto",
            borderRadius: "10px",
            cursor: "zoom-in",
            display: "block",
            margin: "0 auto",
            transition: "width 0.18s ease",
          }}
        />
      </div>

      {/* Copyable Quick-Reference Syntax Cards */}
      <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 800, color: "#1E2822" }}>
        📋 Copyable Command Snippets from the Cheat Sheet
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "14px",
        }}
      >
        {CHEAT_SHEET_COLUMNS.map((col) => (
          <div
            key={col.title}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5DEC9",
              borderRadius: "13px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            }}
          >
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 800,
                color: "#1E2822",
                borderLeft: `4px solid ${col.accent}`,
                paddingLeft: "10px",
              }}
            >
              {col.title}
            </div>
            {col.items.map((it) => (
              <div
                key={it.cmd}
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #EAE3D5",
                  borderRadius: "10px",
                  padding: "11px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <code style={{ fontSize: "12.5px", fontWeight: 700, color: "#1B5E20" }}>{it.cmd}</code>
                  <button
                    type="button"
                    onClick={() => handleCopy(it.code)}
                    style={{
                      border: "1px solid #D5CEC0",
                      background: copiedCode === it.code ? "#2E5A44" : "#FFFFFF",
                      color: copiedCode === it.code ? "#FFFFFF" : "#375545",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {copiedCode === it.code ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p style={{ margin: "5px 0 8px", fontSize: "12px", color: "#5A625C", lineHeight: 1.45 }}>{it.desc}</p>
                <pre
                  style={{
                    margin: 0,
                    padding: "9px 11px",
                    background: "#13221C",
                    color: "#D7F5E3",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overflowX: "auto",
                    lineHeight: 1.5,
                  }}
                >
                  {it.code}
                </pre>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 18, 15, 0.88)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              maxWidth: "1400px",
              marginBottom: "10px",
              color: "#FFFFFF",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "14px" }}>
              VVIT MongoDB Cheat Sheet — Full Screen View (Click outside to close)
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "6px 14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
          <img
            src={MONGO_CLOUD_CHEAT_SHEET_URL}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.endsWith("/mongodb-cheat-sheet.jpg")) {
                target.src = "/mongodb-cheat-sheet.jpg";
              }
            }}
            alt="VVIT MongoDB Cheat Sheet Fullscreen"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "96vw",
              maxHeight: "86vh",
              borderRadius: "12px",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
};

const LAB_SCORES_STORAGE_KEY = "sv_vvit_mongo_lab_scores_v1";

export const MongoHandsOnLabPanel: React.FC = () => {
  const serverRef = React.useRef<MongoServer>(new MongoServer());
  const [activeLabId, setActiveLabId] = useState<string>("lab_1");

  const [scores, setScores] = useState<Record<string, boolean>>(() => {
    try {
      const saved = cloudStorage.getItem(LAB_SCORES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [taskCodeMap, setTaskCodeMap] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const mod of LAB_MODULES) {
      for (const t of mod.tasks) {
        init[t.id] = t.starterCode;
      }
    }
    return init;
  });

  const [taskOutputMap, setTaskOutputMap] = useState<
    Record<string, { logs: string; passed?: boolean; verifyMsg?: string }>
  >({});
  const [demoOutputMap, setDemoOutputMap] = useState<Record<string, string>>({});
  const [sandboxCode, setSandboxCode] = useState<string>(
    `%%mongosh\nuse schoolDB\ndb.students.find().sort({ age: -1 })`
  );
  const [sandboxOutput, setSandboxOutput] = useState<string>("");

  const allTasks = useMemo(() => LAB_MODULES.flatMap((m) => m.tasks), []);
  const passedCount = useMemo(
    () => allTasks.filter((t) => scores[t.id]).length,
    [allTasks, scores]
  );

  const saveScores = useCallback((next: Record<string, boolean>) => {
    setScores(next);
    try {
      cloudStorage.setItem(LAB_SCORES_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const handleRunDemoOrSeed = (modId: string, code: string) => {
    const res = executeMongosh(serverRef.current, code);
    setDemoOutputMap((prev) => ({ ...prev, [modId]: res.logs }));
  };

  const handleRunTask = (task: LabTaskSpec, mod: LabModuleSpec) => {
    // If running Lab 5 or Lab 6 and schoolDB has fewer than 4 students, auto-run Lab 5 seed first
    if ((mod.id === "lab_5" || mod.id === "lab_6") && mod.seedCode) {
      const curCount = serverRef.current._databases["schoolDB"]?.getCollection("students").find().toList().length || 0;
      if (curCount < 4) {
        executeMongosh(serverRef.current, mod.seedCode);
      }
    }
    const code = taskCodeMap[task.id] ?? task.starterCode;
    const execRes = executeMongosh(serverRef.current, code);
    const ver = task.verify(serverRef.current);
    setTaskOutputMap((prev) => ({
      ...prev,
      [task.id]: {
        logs: execRes.logs,
        passed: ver.passed,
        verifyMsg: ver.message,
      },
    }));
    const nextScores = { ...scores, [task.id]: ver.passed };
    saveScores(nextScores);
  };

  const handleRunAllTasks = () => {
    const freshServer = new MongoServer();
    serverRef.current = freshServer;
    const nextOutputs: Record<string, { logs: string; passed?: boolean; verifyMsg?: string }> = {};
    const nextScores: Record<string, boolean> = {};

    for (const mod of LAB_MODULES) {
      if (mod.seedCode) {
        executeMongosh(freshServer, mod.seedCode);
      }
      for (const t of mod.tasks) {
        const code = taskCodeMap[t.id] ?? t.starterCode;
        const execRes = executeMongosh(freshServer, code);
        const ver = t.verify(freshServer);
        nextOutputs[t.id] = {
          logs: execRes.logs,
          passed: ver.passed,
          verifyMsg: ver.message,
        };
        nextScores[t.id] = ver.passed;
      }
    }
    setTaskOutputMap(nextOutputs);
    saveScores(nextScores);
  };

  const handleResetServer = () => {
    serverRef.current = new MongoServer();
    setTaskOutputMap({});
    setDemoOutputMap({});
    saveScores({});
  };

  const activeModule = useMemo(
    () => LAB_MODULES.find((m) => m.id === activeLabId) || LAB_MODULES[0],
    [activeLabId]
  );

  return (
    <div style={{ padding: "20px 28px 48px", maxWidth: "1380px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Top Banner: Title + Scoreboard + Run All + Download .ipynb */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5DEC9",
          borderRadius: "14px",
          padding: "16px 20px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          boxShadow: "0 2px 8px rgba(30, 40, 34, 0.04)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "#E8F5E9",
                color: "#1B5E20",
                fontWeight: 800,
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "999px",
                border: "1px solid #A5D6A7",
              }}
            >
              %%mongosh Interactive Engine
            </span>
            <h2 style={{ margin: 0, fontSize: "16.5px", fontWeight: 800, color: "#1E2822" }}>
              🧪 MongoDB NoSQL Database Systems — Interactive Hands-On Lab
            </h2>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#5C645E" }}>
            Run live <code>mongosh</code> commands right in your browser with automated grading across all 7 Labs (13 Tasks), or download the Jupyter Notebook.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div
            style={{
              background: passedCount === allTasks.length ? "#E8F5E9" : "#FAF7F2",
              border: passedCount === allTasks.length ? "1.5px solid #2E7D32" : "1px solid #DFD7C8",
              borderRadius: "10px",
              padding: "6px 13px",
              fontSize: "12.5px",
              fontWeight: 800,
              color: passedCount === allTasks.length ? "#1B5E20" : "#1E2822",
            }}
          >
            🏆 Lab Scoreboard: {passedCount} / {allTasks.length} Tasks Passed
          </div>

          <button
            type="button"
            onClick={handleRunAllTasks}
            style={{
              padding: "7px 13px",
              borderRadius: "9px",
              border: "1px solid #2E5A44",
              background: "#EDF7F1",
              color: "#1E4631",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ▶ Run &amp; Verify All 13 Tasks
          </button>

          <button
            type="button"
            onClick={handleResetServer}
            style={{
              padding: "7px 11px",
              borderRadius: "9px",
              border: "1px solid #E2D9C8",
              background: "#FFFFFF",
              color: "#5A625C",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ↺ Reset Lab DB
          </button>

          <a
            href={MONGO_CLOUD_LAB_NOTEBOOK_URL} target="_blank" rel="noopener noreferrer"
            download="mongodb_hands_on_lab.ipynb"
            style={{
              padding: "7px 14px",
              borderRadius: "9px",
              border: "1px solid #2E5A44",
              background: "#2E5A44",
              color: "#FFFFFF",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ⬇ Download .ipynb Notebook
          </a>
        </div>
      </div>

      {/* Main Two-Column Lab Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: "18px", alignItems: "start" }}>
        {/* Left Sidebar: Lab Modules & Task Checklist */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5DEC9",
            borderRadius: "14px",
            padding: "12px",
            position: "sticky",
            top: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#6C736D", padding: "4px 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Lab Curriculum (7 Modules)
          </div>
          {LAB_MODULES.map((mod) => {
            const isActive = mod.id === activeLabId;
            const modPassed = mod.tasks.every((t) => scores[t.id]);
            const modDoneCount = mod.tasks.filter((t) => scores[t.id]).length;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveLabId(mod.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: isActive ? "1.5px solid #2E5A44" : "1px solid transparent",
                  background: isActive ? "#EEF6F1" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: isActive ? "#1B5E20" : "#5A625C",
                      background: isActive ? "#D7EFE0" : "#F3EFE6",
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {mod.badge}
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: modPassed ? "#16A34A" : "#7A827C" }}>
                    {modPassed ? "✅ Complete" : `${modDoneCount}/${mod.tasks.length}`}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: isActive ? 800 : 600, color: "#1E2822", lineHeight: 1.35 }}>
                  {mod.title.replace(/\s*\(.*\)$/, "")}
                </div>
              </button>
            );
          })}

          {/* Free Mongosh Sandbox Quick Box */}
          <div
            style={{
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid #EAE3D5",
            }}
          >
            <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#1E2822", marginBottom: "6px" }}>
              ⚡ Quick mongosh Scratchpad
            </div>
            <textarea
              value={sandboxCode}
              onChange={(e) => setSandboxCode(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#13221C",
                color: "#D7F5E3",
                border: "1px solid #26463B",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "11.5px",
                fontFamily: "'JetBrains Mono', monospace",
                resize: "vertical",
              }}
            />
            <button
              type="button"
              onClick={() => {
                const res = executeMongosh(serverRef.current, sandboxCode);
                setSandboxOutput(res.logs);
              }}
              style={{
                marginTop: "6px",
                width: "100%",
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                background: "#2E5A44",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ▶ Run Scratchpad
            </button>
            {sandboxOutput && (
              <pre
                style={{
                  marginTop: "6px",
                  marginBottom: 0,
                  padding: "8px",
                  background: "#0B161A",
                  color: "#A7F3D0",
                  borderRadius: "8px",
                  fontSize: "11px",
                  maxHeight: "150px",
                  overflow: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {sandboxOutput}
              </pre>
            )}
          </div>
        </div>

        {/* Right Main Column: Active Lab Module */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Module Header & Concept Walkthrough */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E5DEC9",
              borderRadius: "14px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <span
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 800,
                    color: "#1B5E20",
                    background: "#E8F5E9",
                    padding: "3px 10px",
                    borderRadius: "999px",
                  }}
                >
                  {activeModule.badge}
                </span>
                <h3 style={{ margin: "8px 0 4px", fontSize: "18px", fontWeight: 800, color: "#1E2822" }}>
                  {activeModule.title}
                </h3>
                <div style={{ fontSize: "12.5px", color: "#5C645E" }}>
                  <strong>Commands &amp; Operators:</strong> <code>{activeModule.commandsCovered}</code>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeModule.walkthrough.map((w) => (
                <div
                  key={w.heading}
                  style={{
                    background: "#FAF7F2",
                    border: "1px solid #EAE3D5",
                    borderRadius: "10px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1E2822", marginBottom: "6px" }}>
                    📖 {w.heading}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#3F4741", lineHeight: 1.55 }}>
                    {w.points.map((pt, i) => (
                      <li key={i} style={{ marginBottom: "3px" }}>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Optional Guided Demo or Seed Data Cell */}
            {(activeModule.demoCode || activeModule.seedCode) && (
              <div
                style={{
                  marginTop: "14px",
                  background: "#F4F8F5",
                  border: "1px solid #CBE0D3",
                  borderRadius: "11px",
                  padding: "14px 16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#1E4631" }}>
                    {activeModule.demoTitle || activeModule.seedTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunDemoOrSeed(activeModule.id, (activeModule.demoCode || activeModule.seedCode)!)
                    }
                    style={{
                      padding: "5px 12px",
                      borderRadius: "8px",
                      border: "1px solid #2E5A44",
                      background: "#2E5A44",
                      color: "#FFFFFF",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ▶ Run Cell
                  </button>
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    background: "#13221C",
                    color: "#D7F5E3",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: "auto",
                  }}
                >
                  {activeModule.demoCode || activeModule.seedCode}
                </pre>
                {demoOutputMap[activeModule.id] && (
                  <pre
                    style={{
                      marginTop: "8px",
                      marginBottom: 0,
                      padding: "10px 12px",
                      background: "#0B161A",
                      color: "#A7F3D0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontFamily: "'JetBrains Mono', monospace",
                      overflowX: "auto",
                    }}
                  >
                    {demoOutputMap[activeModule.id]}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Interactive Hands-On Tasks for Active Module */}
          {activeModule.tasks.map((task) => {
            const out = taskOutputMap[task.id];
            const isPassed = scores[task.id];
            return (
              <div
                key={task.id}
                style={{
                  background: "#FFFFFF",
                  border: isPassed ? "1.5px solid #4CAF50" : "1px solid #E5DEC9",
                  borderRadius: "14px",
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        background: isPassed ? "#E8F5E9" : "#FFF3E0",
                        color: isPassed ? "#1B5E20" : "#E65100",
                        border: isPassed ? "1px solid #A5D6A7" : "1px solid #FFCC80",
                      }}
                    >
                      {isPassed ? `✅ ${task.taskCode} PASSED` : `🎯 ${task.taskCode}`}
                    </span>
                    <h4 style={{ margin: 0, fontSize: "15.5px", fontWeight: 800, color: "#1E2822" }}>
                      {task.title}
                    </h4>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setTaskCodeMap((prev) => ({
                          ...prev,
                          [task.id]: task.starterCode,
                        }))
                      }
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px",
                        border: "1px solid #DFD7C8",
                        background: "#FAF7F2",
                        color: "#5A625C",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Reset Cell
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRunTask(task, activeModule)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#2E5A44",
                        color: "#FFFFFF",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      ▶ Run &amp; Verify {task.taskCode}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <ol style={{ margin: "12px 0", paddingLeft: "20px", fontSize: "12.5px", color: "#37413B", lineHeight: 1.55 }}>
                  {task.instructions.map((inst, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      {inst}
                    </li>
                  ))}
                </ol>

                {/* Editable %%mongosh Code Cell */}
                <textarea
                  value={taskCodeMap[task.id] ?? task.starterCode}
                  onChange={(e) =>
                    setTaskCodeMap((prev) => ({
                      ...prev,
                      [task.id]: e.target.value,
                    }))
                  }
                  rows={Math.max(5, (taskCodeMap[task.id] ?? task.starterCode).split("\n").length)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    background: "#13221C",
                    color: "#E2F7EC",
                    border: "1.5px solid #284A3C",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    fontSize: "12.5px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 1.55,
                    outline: "none",
                    resize: "vertical",
                  }}
                />

                {/* Shell Output & Automated Verification Result */}
                {out && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <pre
                      style={{
                        margin: 0,
                        padding: "11px 14px",
                        background: "#0B161A",
                        color: "#A7F3D0",
                        borderRadius: "9px",
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        maxHeight: "260px",
                        overflow: "auto",
                        lineHeight: 1.5,
                      }}
                    >
                      {out.logs || "(No output)"}
                    </pre>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "9px",
                        background: out.passed ? "#E8F5E9" : "#FFEBEE",
                        border: out.passed ? "1px solid #A5D6A7" : "1px solid #FFCDD2",
                        color: out.passed ? "#1B5E20" : "#B71C1C",
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      {out.passed ? `✅ [PASS] ${task.taskCode}: ` : `❌ [FAIL] ${task.taskCode}: `}
                      {out.verifyMsg}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
