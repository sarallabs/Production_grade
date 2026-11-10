# Section A: Single-Choice Conceptual Assessments

## Question 1

When working in the MongoDB shell, what does the statement `use campusDB` accomplish before any write command is issued?

**Options:**
- A) It selects `campusDB` as the active session context in memory without creating disk files yet
- B) It immediately writes a 1 GB empty database file to the server disk
- C) It drops the previous database from the storage engine
- D) It lists all collections inside `campusDB` on the terminal

<details><summary>Click to view Answer</summary>Correct Answer: A<br>Rationale: `use <databaseName>` switches the current database context for subsequent commands, but MongoDB does not create the database on disk until data is inserted into a collection within it. (Key Takeaway: `use` switches the active database context lazily in memory.)</details>

## Question 2

Which shell command outputs the list of all databases on the connected server together with their gigabyte sizes (`0.000GB`)?

**Options:**
- A) `show collections`
- B) `db.getDatabases()`
- C) `show dbs`
- D) `use dbs`

<details><summary>Click to view Answer</summary>Correct Answer: C<br>Rationale: `show dbs` lists every populated database on the connected MongoDB server along with its storage size (such as `admin 0.000GB` and `schoolDB 0.000GB`). (Key Takeaway: `show dbs` reports all populated databases and their disk sizes.)</details>

## Question 3

What is the irreversible result of invoking `db.dropDatabase()` while `schoolDB` is the active database context?

**Options:**
- A) Only empty collections inside `schoolDB` are removed
- B) `schoolDB` along with all of its collections and documents is permanently deleted
- C) Only the first collection in `schoolDB` is dropped
- D) `schoolDB` is renamed to `local` in `show dbs`

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: `db.dropDatabase()` permanently deletes the currently selected database (`schoolDB`), including all of its collections and documents, and cannot be undone. (Key Takeaway: `db.dropDatabase()` permanently removes the active database and all its contents.)</details>

## Question 4

In `db.createCollection(<name>, <options>)`, what is the purpose of the optional second `<options>` parameter?

**Options:**
- A) To pass an initial array of student documents for bulk insertion
- B) To specify sort order and pagination limits for `find()` queries
- C) To configure collection-level settings such as schema validation rules or a capped collection size
- D) To specify which fields should be excluded from projections

<details><summary>Click to view Answer</summary>Correct Answer: C<br>Rationale: While MongoDB auto-creates collections on first insert, explicit creation with `db.createCollection(name, options)` lets you set collection options such as validation rules or a capped size. (Key Takeaway: The `<options>` parameter in `db.createCollection()` configures validation rules or capped storage.)</details>

## Question 5

How does a developer list all collections currently stored inside the active `schoolDB` database?

**Options:**
- A) Run `show collections` after selecting `schoolDB` with `use schoolDB`
- B) Run `show dbs` with `{ schoolDB: 1 }`
- C) Run `db.createCollection("list")`
- D) Run `db.schoolDB.findOne()`

<details><summary>Click to view Answer</summary>Correct Answer: A<br>Rationale: After switching to `schoolDB` via `use schoolDB`, running `show collections` lists every collection that has been created explicitly or implicitly in that database. (Key Takeaway: `show collections` enumerates all collections in the active database.)</details>

## Question 6

What happens to the indexes of the `students` collection when `db.students.drop()` is executed?

**Options:**
- A) All indexes on `students` are preserved in the database for future collections
- B) Only the `_id` index is deleted while secondary indexes remain active
- C) The `students` collection, all of its documents, and all of its indexes are permanently removed
- D) The command fails unless all indexes are manually dropped first

<details><summary>Click to view Answer</summary>Correct Answer: C<br>Rationale: `db.<collection>.drop()` permanently removes a collection, all of the documents it contains, and any indexes defined on it. (Key Takeaway: `db.<collection>.drop()` deletes the collection, its documents, and its indexes.)</details>

## Question 7

Which command inserts two student documents (`Meera` aged `17` and `Kabir` aged `18`) into `db.students` in a single call?

**Options:**
- A) `db.students.insertOne([{ name: "Meera", age: 17 }, { name: "Kabir", age: 18 }])`
- B) `db.students.insertMany([{ name: "Meera", age: 17 }, { name: "Kabir", age: 18 }])`
- C) `db.students.insertMany({ name: "Meera", age: 17 }, { name: "Kabir", age: 18 })`
- D) `db.students.updateMany({}, [{ name: "Meera", age: 17 }, { name: "Kabir", age: 18 }])`

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: `insertMany([doc1, doc2, ...])` inserts multiple documents into a collection in a single call when passed as a JavaScript array `[...]`. (Key Takeaway: Use `insertMany([...])` with an array of document objects for batch insertion.)</details>

## Question 8

How does `db.students.find({ age: 18 })` differ from `db.students.findOne({ age: 18 })` in what it returns to the caller?

**Options:**
- A) `find()` returns a cursor over all matching documents, whereas `findOne()` returns the first matching document object (or `null`)
- B) `find()` returns `null` when multiple matches exist, whereas `findOne()` returns an array
- C) `find()` modifies matching documents, whereas `findOne()` is read-only
- D) `find()` only inspects the first document in the collection, whereas `findOne()` scans all documents

<details><summary>Click to view Answer</summary>Correct Answer: A<br>Rationale: `find(query, projection)` retrieves all matching documents and returns a cursor, whereas `findOne(query, projection)` retrieves only the first matching document (or `null`) instead of a cursor. (Key Takeaway: `find()` returns a multi-document cursor; `findOne()` returns one document or `null`.)</details>

## Question 9

Which query returns only the `name` field (and suppresses `_id`) for the first student whose `grade` is `8` or higher?

**Options:**
- A) `db.students.find({ grade: { $gte: 8 } }, { name: 1, _id: 0 })`
- B) `db.students.findOne({ grade: { $gte: 8 } }, { name: 1, _id: 0 })`
- C) `db.students.findOne({ grade: { $gt: 8 } }, { name: 1, _id: 1 })`
- D) `db.students.findOne({ grade: { $lte: 8 } }, { name: 0, _id: 0 })`

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: `findOne()` returns only the first matching document, `{ grade: { $gte: 8 } }` filters for grade 8 or higher, and `{ name: 1, _id: 0 }` includes `name` while excluding `_id`. (Key Takeaway: `findOne({ grade: { $gte: 8 } }, { name: 1, _id: 0 })` projects a single field from the first match.)</details>

## Question 10

In `db.students.find({}, { name: 1, age: 1, _id: 0 })`, what role does the first empty object `{}` play?

**Options:**
- A) It suppresses all fields except `_id`
- B) It acts as an empty query filter that matches every document in the `students` collection
- C) It sorts the output in ascending order of insertion
- D) It deletes unmatched fields from disk

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: In `find(query, projection)`, the first argument is the query filter; passing an empty filter `{}` matches every document in the collection so the second argument `{ name: 1, age: 1, _id: 0 }` can project fields across all records. (Key Takeaway: An empty query filter `{}` in `find({}, projection)` matches all documents.)</details>

## Question 11

What order is produced by executing `db.students.find().sort({ grade: -1 })`?

**Options:**
- A) Students are ordered from lowest to highest `grade` (ascending)
- B) Students are ordered from highest to lowest `grade` (descending)
- C) All students with negative `grade` values are deleted
- D) Only the last student in the collection is returned

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: `sort({ field: 1 | -1 })` orders query results where `1` denotes ascending order and `-1` denotes descending order; thus `sort({ grade: -1 })` orders students from highest to lowest grade. (Key Takeaway: `sort({ field: -1 })` sorts results in descending order.)</details>

## Question 12

Which operator tests whether a field value is not equal to a specified value inside a MongoDB query filter?

**Options:**
- A) `$nin`
- B) `$lt`
- C) `$ne`
- D) `$pull`

<details><summary>Click to view Answer</summary>Correct Answer: C<br>Rationale: In the comparison operators table, `$ne` represents 'Not equal' for testing inequality against a value, whereas `$nin` tests whether a value is not in an array and `$pull` removes elements from an array during updates. (Key Takeaway: `$ne` is the scalar not-equal comparison operator.)</details>

## Question 13

If a developer wants to update Rahul's `grade` to `10` without altering his `name` or `subjects` fields, which command should be executed?

**Options:**
- A) `db.students.updateOne({ name: "Rahul" }, { $set: { grade: 10 } })`
- B) `db.students.updateOne({ name: "Rahul" }, { $inc: { grade: 10 } })`
- C) `db.students.updateOne({ name: "Rahul" }, { $push: { grade: 10 } })`
- D) `db.students.insertOne({ name: "Rahul", grade: 10 })`

<details><summary>Click to view Answer</summary>Correct Answer: A<br>Rationale: `db.students.updateOne({ name: "Rahul" }, { $set: { grade: 10 } })` updates the first document matching `{ name: "Rahul" }` and uses `$set` to set `grade` to `10` without replacing the whole document. (Key Takeaway: `updateOne()` with `$set` updates specific fields in place.)</details>

## Question 14

A school administrator runs `db.students.deleteMany({ age: 17 })` on a collection containing 12 students aged 17 and 30 students aged 18; what remains in `students`?

**Options:**
- A) 11 students aged 17 and 30 students aged 18
- B) 0 students aged 17 and 30 students aged 18
- C) 0 documents because `deleteMany()` always empties the entire collection
- D) The `students` collection is dropped from `schoolDB`

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: `deleteMany({ age: 17 })` deletes every document matching the filter `{ age: 17 }` (all 12 of them) while leaving the 30 documents with `{ age: 18 }` untouched in the collection. (Key Takeaway: `deleteMany(filter)` removes all documents matching the filter and preserves non-matching documents.)</details>

## Question 15

Which query combines logical disjunction and comparison filtering to find students who either have `age` greater than or equal to `19` OR have `name` equal to `"Rahul"`?

**Options:**
- A) `db.students.find({ $and: [{ age: { $gte: 19 } }, { name: "Rahul" }] })`
- B) `db.students.find({ $or: [{ age: { $gte: 19 } }, { name: "Rahul" }] })`
- C) `db.students.find({ $in: [{ age: 19 }, { name: "Rahul" }] })`
- D) `db.students.find({ age: { $gt: 19 }, name: "Rahul" })`

<details><summary>Click to view Answer</summary>Correct Answer: B<br>Rationale: The `$or` logical operator takes an array of condition objects (`[{ age: { $gte: 19 } }, { name: "Rahul" }]`) and matches any document satisfying at least one condition. (Key Takeaway: Use `$or: [cond1, cond2]` to express logical OR across multiple field predicates.)</details>

# Section B: Multi-Variable Analytical Synthesis (MSQ)

## Question 16

Which operational rules govern database creation and visibility in MongoDB (`use <databaseName>` and `show dbs`) (Select all that apply)?

**Options:**
- A) MongoDB does not provide a dedicated command to create an empty database ahead of time
- B) Executing `use schoolDB` immediately creates `schoolDB` on disk before any collection write
- C) `show dbs` lists all databases selected with `use`, even if they contain zero collections
- D) A database only appears in `show dbs` once data has actually been inserted into a collection within it
- E) `use schoolDB` only applies to the single next command and then resets to `admin`

<details><summary>Click to view Answer</summary>Correct Answer: A, D<br>Rationale: MongoDB has no dedicated command to pre-create a database (A); `use <databaseName>` selects the context for all subsequent commands in the session, and the database is created on disk and listed in `show dbs` only once data is written to it (D). (Key Takeaway: Databases are lazily materialized on first collection write.)</details>

## Question 17

Which statements accurately describe explicit and implicit collection lifecycle operations in MongoDB (Select all that apply)?

**Options:**
- A) Inserting into a non-existent collection with `insertOne()` fails unless `db.createCollection()` was called first
- B) `db.createCollection(name, options)` explicitly creates a collection and supports setting validation rules or capped size
- C) `show collections` lists every collection that exists in the currently selected database
- D) `db.students.drop()` removes documents from `students` but leaves its indexes intact
- E) A collection appears in `show collections` once created either explicitly via `db.createCollection()` or implicitly via a first insert

<details><summary>Click to view Answer</summary>Correct Answer: B, C, E<br>Rationale: `db.createCollection(name, options)` explicitly creates a collection for options like validation rules or capped size (B); `show collections` lists all collections in the active database (C); and collections appear in `show collections` once created explicitly or implicitly via first insert (E). (Key Takeaway: Collections can be created explicitly or implicitly and are listed via `show collections`.)</details>

## Question 18

When comparing `db.students.insertOne()` and `db.students.insertMany()` for document ingestion, which statements are valid (Select all that apply)?

**Options:**
- A) `insertOne()` accepts an array of multiple documents `[doc1, doc2]` to insert them individually
- B) `insertOne(document)` inserts a single document object into the target collection
- C) `insertMany()` requires the target collection to be pre-created with `db.createCollection()`
- D) `insertMany()` accepts multiple documents as comma-separated arguments without square brackets
- E) `insertMany([doc1, doc2, ...])` inserts multiple documents in a single call when passed as an array

<details><summary>Click to view Answer</summary>Correct Answer: B, E<br>Rationale: `insertOne(document)` inserts a single document (B), and `insertMany([doc1, doc2, ...])` inserts multiple documents in a single call passed as an array (E). Both auto-create the collection if it does not exist yet. (Key Takeaway: Use `insertOne(doc)` for one document and `insertMany([doc1, doc2])` for an array of documents.)</details>

## Question 19

Which characteristics distinguish `db.students.find()` from `db.students.findOne()` during read operations (Select all that apply)?

**Options:**
- A) `find(query, projection)` returns a cursor over all matching documents
- B) `findOne(query, projection)` supports chaining `.sort()`, `.skip()`, and `.limit()` directly
- C) `findOne(query, projection)` returns the first matching document object or `null` if none match
- D) Both `find()` and `findOne()` accept a query filter as their first argument and a projection as their second argument
- E) `find()` with no arguments returns `null`

<details><summary>Click to view Answer</summary>Correct Answer: A, C, D<br>Rationale: `find()` returns a cursor over all matching documents (A), `findOne()` returns a single document or `null` without supporting cursor methods like `.sort()` or `.limit()` (C), and both accept `(query, projection)` arguments (D). (Key Takeaway: Both `find()` and `findOne()` accept `(query, projection)`, returning a cursor vs. a single document/null.)</details>

## Question 20

In `db.students.find({}, { name: 1, grade: 1, _id: 0 })`, which projection rules are demonstrated (Select all that apply)?

**Options:**
- A) Setting a field to `1` excludes that field from the returned documents
- B) Setting `_id: 0` deletes the `_id` primary key from the collection on disk
- C) Setting `name: 1` and `grade: 1` includes those fields in the returned documents
- D) Omitting `_id: 0` would still exclude `_id` automatically whenever `name: 1` is specified
- E) Setting `_id: 0` explicitly excludes the `_id` field from the returned documents

<details><summary>Click to view Answer</summary>Correct Answer: C, E<br>Rationale: In a projection object, `1` includes a field (`name: 1, grade: 1`, C) and `0` excludes a field (`_id: 0`, E). Without `_id: 0`, MongoDB includes `_id` by default even when other fields are set to `1`. (Key Takeaway: Projections use `1` to include fields and `_id: 0` to suppress the default `_id` field.)</details>

## Question 21

How does the chained query `db.students.find().sort({ grade: 1 }).skip(10).limit(5)` process documents in `students` (Select all that apply)?

**Options:**
- A) `sort({ grade: 1 })` orders the matched documents in ascending order of `grade`
- B) `skip(10)` omits the first 10 documents from the sorted result set
- C) `sort({ grade: 1 })` restricts output to students in grade 1 only
- D) `limit(5)` caps the number of returned documents to at most 5 after skipping 10
- E) `limit(5)` permanently deletes all documents beyond the 5th record

<details><summary>Click to view Answer</summary>Correct Answer: A, B, D<br>Rationale: `sort({ grade: 1 })` sorts results in ascending order of `grade` (A), `skip(10)` skips the first 10 results (B), and `limit(5)` returns at most the next 5 documents (D). (Key Takeaway: Combining `sort()`, `skip()`, and `limit()` implements deterministic result pagination.)</details>

## Question 22

Which filter expressions accurately match their stated query semantics in MongoDB (Select all that apply)?

**Options:**
- A) `{ age: { $gt: 18 } }` matches students whose `age` is `18` or higher
- B) `{ age: { $in: [17, 18, 19] } }` matches students whose `age` equals `17`, `18`, or `19`
- C) `{ age: { $lte: 18 } }` matches students whose `age` is less than or equal to `18`
- D) `{ age: { $nin: [17, 18] } }` matches only students whose `age` is `17` or `18`
- E) `{ $and: [{ age: { $gte: 18 } }, { promoted: true }] }` matches students who satisfy both conditions simultaneously

<details><summary>Click to view Answer</summary>Correct Answer: B, C, E<br>Rationale: `$in: [17, 18, 19]` matches any value in the array (B), `$lte: 18` matches values less than or equal to 18 (C), and `$and: [...]` matches documents satisfying all sub-conditions (E). Option A requires `$gte: 18`, and Option D describes `$in` rather than `$nin`. (Key Takeaway: Verify inclusive vs. strict bounds (`$gte` vs. `$gt`) and array inclusion vs. exclusion (`$in` vs. `$nin`).)</details>

## Question 23

When mutating documents with `db.students.updateOne()` and `db.students.updateMany()`, which execution rules apply (Select all that apply)?

**Options:**
- A) `updateOne(filter, update)` updates only the first document that matches the query filter
- B) `updateOne(filter, update)` replaces the entire document and deletes any field not listed in `$set`
- C) `updateMany(filter, update)` applies the update operators to every document matching the query filter
- D) `updateMany(filter, update)` can only modify a maximum of two documents per call
- E) Neither `updateOne()` nor `updateMany()` supports the `$set` operator

<details><summary>Click to view Answer</summary>Correct Answer: A, C<br>Rationale: `updateOne(filter, update)` modifies the first matching document using operators like `$set` without replacing the whole document (A), while `updateMany(filter, update)` applies the same update to every matching document in the collection (C). (Key Takeaway: `updateOne()` updates the first match in place; `updateMany()` updates all matches in place.)</details>

## Question 24

Examine the update operators `$set`, `$inc`, `$push`, and `$pull`; which descriptions accurately match their behavior on a student document (Select all that apply)?

**Options:**
- A) `{ $set: { age: 20 } }` sets or replaces the `age` field value with `20`
- B) `{ $inc: { attempts: 1 } }` overwrites `attempts` with `1` regardless of its previous numeric value
- C) `{ $push: { subjects: "History" } }` removes `"History"` from the `subjects` array
- D) `{ $inc: { attempts: 1 } }` adds `1` to the existing numeric value of `attempts`
- E) `{ $pull: { subjects: "Science" } }` removes `"Science"` from the `subjects` array

<details><summary>Click to view Answer</summary>Correct Answer: A, D, E<br>Rationale: `$set` replaces a field's value (A), `$inc` adds to a numeric field (D), `$push` adds an element to an array, and `$pull` removes matching elements from an array (E). (Key Takeaway: `$set` assigns values, `$inc` increments numbers, `$push` appends to arrays, and `$pull` removes from arrays.)</details>

## Question 25

An engineer is deciding between `db.students.deleteOne({ age: 17 })`, `db.students.deleteMany({ age: 17 })`, and `db.students.deleteMany({})`; which statements are true (Select all that apply)?

**Options:**
- A) `db.students.deleteOne({ age: 17 })` deletes all documents where `age` equals `17`
- B) `db.students.deleteMany({ age: 17 })` deletes every document in `students` where `age` equals `17`
- C) `db.students.deleteMany({})` drops the `students` collection and all of its indexes from `schoolDB`
- D) `db.students.deleteMany({})` deletes all documents in `students` without dropping the collection itself
- E) `db.students.deleteOne({ age: 17 })` deletes the `age` field from the document while keeping the document in `students`

<details><summary>Click to view Answer</summary>Correct Answer: B, D<br>Rationale: `deleteMany({ age: 17 })` removes every document where `age` equals `17` (B), and `deleteMany({})` with an empty filter deletes all documents in the collection without dropping the collection itself (D). `deleteOne({ age: 17 })` deletes the entire first matching document. (Key Takeaway: `deleteMany(filter)` removes all matching documents, and `deleteMany({})` empties the collection without dropping it.)</details>
