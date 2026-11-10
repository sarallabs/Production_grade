# Key Takeaways: VVIT MongoDB — Databases, Collections & CRUD Operations

> **Rapid 5-Minute Pre-Exam Reactivation Sheet:** High-density synthesis of every prerequisite definition, command signature, operator rule, and architectural invariant across all 7 Mindmap pillars (`L1`–`L4`).

---

## 📌 1. Database Operations & Storage Lifecycle

> "MongoDB does not have a dedicated command to create a database ahead of time. Switching to a database name that doesn't exist yet (with the use statement) selects it, but the database is only actually created once you insert data into a collection within it."

- **Context Switching (`use <databaseName>`)**: Redirects the session's active `db` pointer immediately in memory; all subsequent commands execute against that selected namespace.
- **Lazy Disk Allocation (`First-Write Materialization`)**: Selecting a non-existent database via `use schoolDB` allocates **zero disk files** until the first document write (`insertOne` / `insertMany`) or explicit `createCollection()` call occurs.
- **Server Catalog Inspection (`show dbs`)**: Lists only databases that physically hold data on disk alongside storage footprints (`admin 0.000GB`, `config 0.000GB`, `local 0.000GB`, `schoolDB 0.000GB`); unwritten `use` contexts remain hidden.
- **Permanent Database Destruction (`db.dropDatabase()`)**: Irreversibly deletes the currently active database, all of its collections, documents, and disk extents.

---

## 📌 2. Collection Architecture & Structural Management

> "`db.createCollection()` explicitly creates a new collection within the current database. This is optional for most use cases, since MongoDB automatically creates a collection the first time you insert a document into it — but explicit creation lets you set options like validation rules or a capped size."

- **Implicit Just-In-Time Creation**: Inserting a document into a missing collection (`db.students.insertOne(...)`) creates the collection automatically with zero schema migration overhead.
- **Explicit Creation (`db.createCollection(name, options)`)**: Used ahead of time only when enforcing JSON Schema validation rules (`validator`) or fixed-capacity circular ring buffers (`capped: true, size: <bytes>`).
- **Namespace Enumeration (`show collections`)**: Lists every collection materialized inside the currently selected database.
- **Permanent Collection Drop (`db.<collection>.drop()`)**: Irreversibly removes the target collection, all BSON documents, and all secondary B-tree indexes (returning `true` if dropped, `false` if missing).

---

## 📌 3. Document Ingestion Mechanics (CRUD Create)

> "`insertOne(document)` inserts a single document into a collection. `insertMany([doc1, doc2, ...])` inserts multiple documents in a single call, passed as an array. If the collection doesn't exist yet, MongoDB creates it automatically."

- **Single Document Write (`db.<collection>.insertOne(<doc>)`)**: Serializes one JSON object into BSON and automatically generates a unique 12-byte `ObjectId` primary key (`_id`) if omitted.
- **Batch Array Write (`db.<collection>.insertMany([<doc1>, <doc2>, ...])`)**: Takes an array of documents (`[...]`) and transmits the entire batch in a **single network roundtrip**, supporting heterogeneous fields across documents in the same array.

---

## 📌 4. Document Retrieval & Query Architecture (CRUD Read)

> "`find(query, projection)` retrieves all documents matching a filter, returning a cursor. No arguments returns every document. `findOne(query, projection)` retrieves just the first matching document (or null), instead of a cursor."

- **Cursor-Based Streaming (`find(query, projection)`)**: Returns an iterable cursor object (`find()` or `find({})` matches all documents) that supports chaining `.sort()`, `.skip()`, and `.limit()`.
- **Immediate Single Object Lookup (`findOne(query, projection)`)**: Returns the **first matching document object** directly (or `null` if no match exists) and **cannot** chain `.sort()`, `.skip()`, or `.limit()`.

---

## 📌 5. Advanced Query Filtering, Projection & Pagination

> "A query filter narrows results to documents matching specific field values or query operators (e.g. `$gt`, `$lt`, `$in`). An empty filter (`{}`) matches every document. The second argument to `find()` is a projection, which controls which fields are included or excluded in the returned documents. Use `1` to include a field and `0` to exclude it."

- **Comparison & Membership Operators**: Placed inside a field object: `{ age: { $gt: 16, $lt: 20 } }`, `{ age: { $gte: 18 } }`, `{ age: { $in: [17, 18, 19] } }`, `{ age: { $nin: [15, 16] } }`, `{ age: { $ne: 20 } }`.
- **Compound Logical Operators**: Top-level array syntax: `{ $or: [{ age: { $gte: 19 } }, { name: "Rahul" }] }` and `{ $and: [cond1, cond2] }`.
- **The `_id` Projection Exception**: `_id` is always returned by default (`_id: 1`) even during inclusion projections; you must explicitly pass `{ _id: 0 }` (e.g., `db.students.find({}, { name: 1, age: 1, _id: 0 })`) to suppress it.
- **Deterministic Cursor Pipeline Order**: Regardless of call order in `mongosh`, the server executes cursor modifiers in strict canonical order: **`sort({ field: 1 | -1 })` $\rightarrow$ `skip(n)` $\rightarrow$ `limit(n)`**.

---

## 📌 6. Field Modification & In-Place Update Operators (CRUD Update)

> "`updateOne(filter, update)` updates the first document that matches a query filter, using update operators such as `$set` to modify specific fields without replacing the whole document. `updateMany(filter, update)` updates every document that matches a query filter, applying the same update operators to each matching document."

- **Cardinality Scope**: `updateOne(filter, update)` mutates only the first matching document; `updateMany(filter, update)` mutates every matching document.
- **Atomic Scalar & Array Operators**:
  - `$set`: Replaces a field's value or creates the field if missing (`{ $set: { age: 20 } }`).
  - `$inc`: Increments/decrements a numeric field in place (`{ $inc: { attempts: 1 } }`).
  - `$push`: Appends an element to an array field (`{ $push: { subjects: "History" } }`).
  - `$pull`: Removes all matching instances from an array field (`{ $pull: { subjects: "Science" } }`).

---

## 📌 7. Document Deletion & Collection Pruning (CRUD Delete)

> "`deleteOne(filter)` deletes the first document that matches a query filter. `deleteMany(filter)` deletes every document that matches a query filter. Passing an empty filter (`{}`) deletes all documents in the collection, without dropping the collection itself."

| Cleanup Operation | Target Scope | Documents Removed? | Collection & Indexes Retained? | Database Retained? |
| :--- | :--- | :---: | :---: | :---: |
| `db.students.deleteOne(filter)` | First matching document | First match only | **Yes** (Retained) | **Yes** |
| `db.students.deleteMany({})` | All documents in collection | All documents (`100%`) | **Yes** (Container & B-tree indexes kept) | **Yes** |
| `db.students.drop()` | Entire collection namespace | All documents (`100%`) | **No** (Container & all indexes destroyed) | **Yes** |
| `db.dropDatabase()` | Entire active database | All documents (`100%`) | **No** (All collections destroyed) | **No** (Purged) |
