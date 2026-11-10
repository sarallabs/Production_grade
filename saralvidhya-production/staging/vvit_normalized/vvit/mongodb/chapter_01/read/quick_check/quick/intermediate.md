## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** What is the immediate effect of executing use schoolDB followed by db.dropDatabase()?

- **A)** Permanent database deletion — schoolDB and all of its collections and documents are removed
- **B)** Session connection closure — disconnects the shell session while leaving schoolDB on disk
- **C)** Collection data truncation — empties all documents while preserving every collection container

**Correct Answer:** A

**Rationale:** Running use schoolDB selects schoolDB as the active database, and db.dropDatabase() permanently deletes schoolDB along with all of its collections and documents. (Key Takeaway: Switching database context followed by db.dropDatabase() permanently deletes that database.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** Why would a developer call db.createCollection("students", options) explicitly instead of relying on automatic creation during insertOne()?

- **A)** Index key generation — required whenever creating the default _id index on new documents
- **B)** Custom collection options — enables setting schema validation rules or a capped collection size
- **C)** Mandatory shell prerequisite — required before insertMany() can write an array of documents

**Correct Answer:** B

**Rationale:** Calling db.createCollection() is optional for most use cases since MongoDB automatically creates a collection on first insert, but explicit creation lets you set options like validation rules or a capped size. (Key Takeaway: Explicit createCollection() is used when configuring validation rules or capped collections.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** How must multiple student document objects be passed when calling db.students.insertMany()?

- **A)** Separate comma arguments — passed directly as insertMany(doc1, doc2) without array brackets
- **B)** Nested $set wrapper — passed inside a single object as insertMany({ $set: [doc1, doc2] })
- **C)** Square-bracketed array — enclosed inside a single array argument as insertMany([doc1, doc2])

**Correct Answer:** C

**Rationale:** The insertMany([doc1, doc2, ...]) method strictly requires multiple documents to be passed as an array enclosed in square brackets. (Key Takeaway: Always wrap multiple documents in an array when calling insertMany().)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** What does db.students.find({ grade: 8 }) return when executed against the students collection?

- **A)** Filtered result cursor — an iterable cursor yielding all documents where grade equals 8
- **B)** Single document object — strictly the first matched document where grade equals 8 or null
- **C)** Integer match count — a numeric scalar representing how many documents have grade equal to 8

**Correct Answer:** A

**Rationale:** Executing db.students.find({ grade: 8 }) retrieves all documents matching the query filter { grade: 8 } and returns them as an iterable cursor. (Key Takeaway: find(filter) returns a cursor over all matching documents.)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** Which operator matches documents whose field value does NOT match any element inside a specified array?

- **A)** In-array inclusion ($in) — matches when the field value equals any element in the target array
- **B)** Not-in-array exclusion ($nin) — matches when the field value is absent from the target array
- **C)** Scalar inequality ($ne) — compares a field against a single constant rather than an array list

**Correct Answer:** B

**Rationale:** The $nin (not in array) operator matches documents where the field value does not exist in the specified array, whereas $in matches values present in the array. (Key Takeaway: $nin excludes documents whose field value appears in the given array.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** What happens when { $set: { age: 20 }, $inc: { attempts: 1 }, $push: { subjects: "History" } } is passed in one updateOne() call?

- **A)** Combined atomic mutation — sets age, increments attempts, and appends "History" in one update
- **B)** Multi-operator syntax error — MongoDB allows only one update operator per updateOne() call
- **C)** Last-operator precedence — executes only $push while ignoring the preceding $set and $inc keys

**Correct Answer:** A

**Rationale:** As shown in Slide 16 ({ $set: { age: 20 }, $inc: { attempts: 1 }, $push: { subjects: "History" } }), multiple atomic update operators can be combined in a single updateOne() or updateMany() call. (Key Takeaway: Multiple update operators ($set, $inc, $push) can execute together in one update document.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** How does db.students.deleteMany({}) differ from db.students.drop() with respect to show collections?

- **A)** Identical catalog removal — both commands remove students from the show collections list
- **B)** Container preservation vs. removal — deleteMany({}) keeps students in show collections whereas drop() removes it
- **C)** Index-only removal — deleteMany({}) drops all indexes whereas drop() preserves the _id index

**Correct Answer:** B

**Rationale:** Calling db.students.deleteMany({}) deletes all documents inside students without dropping the collection itself, whereas removing the collection from show collections requires db.students.drop(). (Key Takeaway: deleteMany({}) empties documents but keeps the collection in show collections.)

---
