# Glossary: VVIT MongoDB — Databases, Collections & CRUD Operations

## A

### Active Database Pointer
- **Category:** Database Lifecycle
- **Definition:** The in-memory session variable (`db`) maintained by `mongosh` that binds all subsequent shell commands to the currently selected database namespace.
- **Context & Syntax:** `use schoolDB`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Context Switching & Creation`

### Admin Database
- **Category:** System Catalog
- **Definition:** A built-in system database (`admin`) listed by `show dbs` that stores root authentication credentials, authorization roles, and cluster-wide administrative commands.
- **Context & Syntax:** `show dbs // admin 0.000GB`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Catalog Inspection`

### Ascending Sort Order
- **Category:** Cursor Pipeline
- **Definition:** A sorting direction specified by passing `1` as the field value in `sort({ <field>: 1 })`, ordering numeric values from lowest to highest or strings alphabetically.
- **Context & Syntax:** `db.students.find().sort({ age: 1 })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Cursor Pipeline Transformation & Pagination`

### Atomic Update Operator
- **Category:** CRUD Update
- **Definition:** A specialized modifier prefixed with `$` (such as `$set`, `$inc`, `$push`, or `$pull`) that mutates specific fields in place within a document without replacing unreferenced fields.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $set: { age: 20 } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Atomic Field Update Operators`

## B

### Batch Document Ingestion
- **Category:** CRUD Create
- **Definition:** The bulk insertion of an ordered array of BSON documents in a single client-to-server network roundtrip using `insertMany([doc1, doc2, ...])`.
- **Context & Syntax:** `db.students.insertMany([{ name: "Meera", age: 17 }, { name: "Kabir", age: 18 }])`
- **Mindmap Cross-Reference:** `3. Document Ingestion Mechanics (CRUD Create) > Batch Document Ingestion`

### BSON (Binary JSON)
- **Category:** Storage Engine
- **Definition:** The binary-encoded serialization format used internally by MongoDB to store documents on disk and transmit payloads over the wire, adding native support for `ObjectId`, `Date`, and typed numeric widths.
- **Context & Syntax:** `db.students.insertOne({ name: "Aditi", age: 18 })`
- **Mindmap Cross-Reference:** `3. Document Ingestion Mechanics (CRUD Create) > Single Document Insertion`

## C

### Capped Collection
- **Category:** Collection Architecture
- **Definition:** A fixed-size circular collection pre-allocated via `db.createCollection(name, { capped: true, size: <bytes> })` that overwrites its oldest documents automatically in FIFO order once full.
- **Context & Syntax:** `db.createCollection("logs", { capped: true, size: 1048576 })`
- **Mindmap Cross-Reference:** `2. Collection Architecture & Structural Management > Collection Creation Mechanics`

### Collection
- **Category:** Collection Architecture
- **Definition:** A logical container within a MongoDB database that groups BSON documents together, analogous to a table in a relational database but without enforcing a rigid column schema by default.
- **Context & Syntax:** `db.createCollection("students")`
- **Mindmap Cross-Reference:** `2. Collection Architecture & Structural Management`

### Collection Auto-Creation
- **Category:** Collection Architecture
- **Definition:** MongoDB's default just-in-time allocation behavior where a non-existent collection is created automatically the first time `insertOne()` or `insertMany()` writes a document into it.
- **Context & Syntax:** `db.students.insertOne({ name: "Rahul", age: 19 })`
- **Mindmap Cross-Reference:** `2. Collection Architecture & Structural Management > Collection Creation Mechanics`

### Collection Drop
- **Category:** Collection Architecture
- **Definition:** The irreversible operation `db.<collection>.drop()` that permanently deletes a collection container, all of its BSON documents, and all associated secondary B-tree indexes.
- **Context & Syntax:** `db.students.drop()`
- **Mindmap Cross-Reference:** `2. Collection Architecture & Structural Management > Collection Removal & Destruction`

### Comparison Operators
- **Category:** Query Filtering
- **Definition:** Query filter operators (`$gt`, `$gte`, `$lt`, `$lte`, `$ne`) embedded inside a field's filter object to evaluate relational inequalities against document values.
- **Context & Syntax:** `db.students.find({ age: { $gte: 18 } })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Conditional Filter Operators`

### Config Database
- **Category:** System Catalog
- **Definition:** An internal MongoDB system database (`config`) displayed by `show dbs` that tracks shard cluster metadata, chunk distribution, and session catalog state.
- **Context & Syntax:** `show dbs // config 0.000GB`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Catalog Inspection`

### Context Switching
- **Category:** Database Lifecycle
- **Definition:** The shell operation `use <databaseName>` that redirects the active database pointer to a target database name for all subsequent operations in the session.
- **Context & Syntax:** `use schoolDB`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Context Switching & Creation`

### CRUD Operations
- **Category:** Core Architecture
- **Definition:** The four foundational data manipulation categories in MongoDB: Create (`insertOne`, `insertMany`), Read (`find`, `findOne`), Update (`updateOne`, `updateMany`), and Delete (`deleteOne`, `deleteMany`).
- **Context & Syntax:** `db.students.find({ age: 18 })`
- **Mindmap Cross-Reference:** `VVIT MongoDB: Databases, Collections & CRUD Operations`

### Cursor
- **Category:** CRUD Read
- **Definition:** An iterable pointer returned by `db.<collection>.find()` that streams matching documents in batches from the server and supports pipeline modifier chaining (`sort()`, `skip()`, `limit()`) prior to evaluation.
- **Context & Syntax:** `db.students.find({ age: 18 }).sort({ name: 1 })`
- **Mindmap Cross-Reference:** `4. Document Retrieval & Query Architecture (CRUD Read) > Cursor-Based Querying`

## D

### Database Catalog Inspection
- **Category:** Database Lifecycle
- **Definition:** The administrative command `show dbs` that enumerates every database on the connected MongoDB server that physically holds allocated data on disk, alongside its storage size.
- **Context & Syntax:** `show dbs`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Catalog Inspection`

### Database Destruction
- **Category:** Database Lifecycle
- **Definition:** The irreversible command `db.dropDatabase()` that permanently deletes the currently selected database, all of its collections, documents, and underlying disk extents.
- **Context & Syntax:** `db.dropDatabase()`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Destruction & Removal`

### DeleteMany
- **Category:** CRUD Delete
- **Definition:** The collection method `db.<collection>.deleteMany(filter)` that permanently removes every document matching the query filter, or truncates all documents when passed an empty filter `{}`.
- **Context & Syntax:** `db.students.deleteMany({ age: 17 })`
- **Mindmap Cross-Reference:** `7. Document Deletion & Collection Pruning (CRUD Delete) > Document Deletion Execution Methods`

### DeleteOne
- **Category:** CRUD Delete
- **Definition:** The collection method `db.<collection>.deleteOne(filter)` that deletes strictly the first document matching the specified query filter while leaving all other matches intact.
- **Context & Syntax:** `db.students.deleteOne({ name: "Kabir" })`
- **Mindmap Cross-Reference:** `7. Document Deletion & Collection Pruning (CRUD Delete) > Document Deletion Execution Methods`

### Descending Sort Order
- **Category:** Cursor Pipeline
- **Definition:** A sorting direction specified by passing `-1` as the field value in `sort({ <field>: -1 })`, ordering numeric values from highest to lowest or strings in reverse alphabetical order.
- **Context & Syntax:** `db.students.find().sort({ age: -1 })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Cursor Pipeline Transformation & Pagination`

### Document
- **Category:** Core Architecture
- **Definition:** The fundamental unit of data in MongoDB, structured as a set of field-and-value pairs stored in BSON format and uniquely identified by a primary key `_id`.
- **Context & Syntax:** `{ name: "Rahul", grade: 9, subjects: ["Math", "Science"] }`
- **Mindmap Cross-Reference:** `3. Document Ingestion Mechanics (CRUD Create) > Single Document Insertion`

## E

### Empty Filter
- **Category:** Query Filtering
- **Definition:** An empty query predicate object `{}` that matches every document in a collection when passed to `find({})`, `updateMany({}, update)`, or `deleteMany({})`.
- **Context & Syntax:** `db.students.deleteMany({})`
- **Mindmap Cross-Reference:** `4. Document Retrieval & Query Architecture (CRUD Read) > Cursor-Based Querying`

### Explicit Collection Creation
- **Category:** Collection Architecture
- **Definition:** Calling `db.createCollection(name, options)` ahead of document insertion to enforce JSON Schema validation rules or pre-allocate a capped collection.
- **Context & Syntax:** `db.createCollection("students")`
- **Mindmap Cross-Reference:** `2. Collection Architecture & Structural Management > Collection Creation Mechanics`

## F

### Field Exclusion Projection
- **Category:** Field Projection
- **Definition:** Setting `{ <field>: 0 }` in the second argument of `find()` or `findOne()` to suppress specific fields while returning all other fields in matching documents.
- **Context & Syntax:** `db.students.find({}, { _id: 0 })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Field Projection Mechanics`

### Field Inclusion Projection
- **Category:** Field Projection
- **Definition:** Setting `{ <field>: 1 }` in the second argument of `find()` or `findOne()` to return only the specified fields (plus `_id` by default) in matching documents.
- **Context & Syntax:** `db.students.find({}, { name: 1, age: 1, _id: 0 })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Field Projection Mechanics`

### Find
- **Category:** CRUD Read
- **Definition:** The primary read method `db.<collection>.find(query, projection)` that selects all documents matching a query filter and returns an iterable cursor.
- **Context & Syntax:** `db.students.find({ age: 18 })`
- **Mindmap Cross-Reference:** `4. Document Retrieval & Query Architecture (CRUD Read) > Cursor-Based Querying`

### FindOne
- **Category:** CRUD Read
- **Definition:** The single-document read method `db.<collection>.findOne(query, projection)` that returns the first matching document object directly (or `null` if none match) rather than a cursor.
- **Context & Syntax:** `db.students.findOne({ name: "Rahul" })`
- **Mindmap Cross-Reference:** `4. Document Retrieval & Query Architecture (CRUD Read) > Single Document Lookup`

## I

### In-Array Inclusion Operator
- **Category:** Query Filtering
- **Definition:** The query operator `$in` (`{ <field>: { $in: [v1, v2, ...] } }`) that matches any document where the field value equals at least one element in the specified array.
- **Context & Syntax:** `db.students.find({ age: { $in: [17, 18, 19] } })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Conditional Filter Operators`

### Increment Operator
- **Category:** CRUD Update
- **Definition:** The atomic update operator `$inc` (`{ $inc: { <field>: <amount> } }`) that adds a positive or negative numeric delta to an existing numeric field in place.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $inc: { attempts: 1 } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Atomic Field Update Operators`

### InsertOne
- **Category:** CRUD Create
- **Definition:** The collection method `db.<collection>.insertOne(document)` that inserts a single BSON document into a collection and automatically assigns a 12-byte `ObjectId` to `_id` if omitted.
- **Context & Syntax:** `db.students.insertOne({ name: "Aditi", age: 18 })`
- **Mindmap Cross-Reference:** `3. Document Ingestion Mechanics (CRUD Create) > Single Document Insertion`

## L

### Lazy Database Allocation
- **Category:** Database Lifecycle
- **Definition:** MongoDB's storage allocation model in which `use <databaseName>` selects a namespace in memory only, deferring physical disk file creation until the first document is written.
- **Context & Syntax:** `use schoolDB // created on disk only after first insert`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Context Switching & Creation`

### Limit Modifier
- **Category:** Cursor Pipeline
- **Definition:** The cursor method `limit(n)` that caps the maximum number of documents emitted by a `find()` query to `n` documents.
- **Context & Syntax:** `db.students.find().sort({ age: 1 }).skip(10).limit(5)`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Cursor Pipeline Transformation & Pagination`

### Local Database
- **Category:** System Catalog
- **Definition:** A non-replicated built-in system database (`local`) listed by `show dbs` that stores instance-specific startup logs and replication oplog metadata.
- **Context & Syntax:** `show dbs // local 0.000GB`
- **Mindmap Cross-Reference:** `1. Database Operations & Storage Lifecycle > Database Catalog Inspection`

### Logical Disjunction Operator
- **Category:** Query Filtering
- **Definition:** The compound operator `$or` (`{ $or: [cond1, cond2, ...] }`) that takes an array of filter objects and matches any document satisfying at least one condition.
- **Context & Syntax:** `db.students.find({ $or: [{ age: { $gte: 19 } }, { name: "Rahul" }] })`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Conditional Filter Operators`

## O

### ObjectId
- **Category:** Storage Engine
- **Definition:** A 12-byte BSON identifier (`4-byte timestamp + 5-byte random value + 3-byte incrementing counter`) automatically generated for the `_id` primary key of every inserted document when omitted by the client.
- **Context & Syntax:** `ObjectId("6543210abcdef0123456789a")`
- **Mindmap Cross-Reference:** `3. Document Ingestion Mechanics (CRUD Create) > Single Document Insertion`

## P

### Pull Operator
- **Category:** CRUD Update
- **Definition:** The atomic array operator `$pull` (`{ $pull: { <arrayField>: <value> } }`) that removes all instances of a specified value from an array field.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $pull: { subjects: "Science" } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Atomic Field Update Operators`

### Push Operator
- **Category:** CRUD Update
- **Definition:** The atomic array operator `$push` (`{ $push: { <arrayField>: <value> } }`) that appends a specified value to the end of an array field.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $push: { subjects: "History" } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Atomic Field Update Operators`

## S

### Set Operator
- **Category:** CRUD Update
- **Definition:** The atomic update operator `$set` (`{ $set: { <field>: <value> } }`) that replaces the value of a specific field (or creates the field if missing) without overwriting the rest of the document.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $set: { age: 20 } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Atomic Field Update Operators`

### Skip Modifier
- **Category:** Cursor Pipeline
- **Definition:** The cursor method `skip(n)` that instructs the query engine to omit the first `n` matching documents before emitting results, commonly paired with `sort()` and `limit()` for pagination.
- **Context & Syntax:** `db.students.find().sort({ age: 1 }).skip(10).limit(5)`
- **Mindmap Cross-Reference:** `5. Advanced Query Filtering, Projection & Pagination > Cursor Pipeline Transformation & Pagination`

## U

### UpdateMany
- **Category:** CRUD Update
- **Definition:** The collection method `db.<collection>.updateMany(filter, update)` that applies atomic update operators to every document in the collection matching the query filter.
- **Context & Syntax:** `db.students.updateMany({ age: 18 }, { $set: { promoted: true } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Update Scope & Execution Methods`

### UpdateOne
- **Category:** CRUD Update
- **Definition:** The collection method `db.<collection>.updateOne(filter, update)` that applies atomic update operators strictly to the first document matching the query filter.
- **Context & Syntax:** `db.students.updateOne({ name: "Rahul" }, { $set: { age: 20 } })`
- **Mindmap Cross-Reference:** `6. Field Modification & In-Place Update Operators (CRUD Update) > Update Scope & Execution Methods`
