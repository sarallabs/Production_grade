## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** Why does show dbs display admin, config, and local on a fresh server but omit a newly selected use testLabDB database?

- **A)** Lazy disk materialization — show dbs lists only databases holding physical data written on disk
- **B)** Projection access masking — show dbs hides user databases unless an explicit filter is supplied
- **C)** Deferred catalog flush — show dbs updates its list only after db.dropDatabase() is executed

**Correct Answer:** A

**Rationale:** The show dbs command lists only databases that physically hold data on the server (admin, config, local), whereas use testLabDB only selects the name in memory until a collection write materializes it on disk. (Key Takeaway: show dbs excludes unwritten in-memory database contexts.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** What is the return value and recoverability when db.students.drop() executes on an existing students collection?

- **A)** Reversible soft delete — returns the dropped document count and allows undo via db.undoDrop()
- **B)** Irreversible removal — returns true and permanently deletes the collection, documents, and indexes
- **C)** Deferred archive — moves students to the local database and returns an archive cursor object

**Correct Answer:** B

**Rationale:** Executing db.students.drop() returns true (or false if the collection did not exist) and permanently removes the collection, its documents, and its indexes; this action cannot be undone. (Key Takeaway: Dropping a collection via drop() returns true and is permanent and irreversible.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** Which payload structure is valid when inserting a student record with an embedded array of subjects via insertOne()?

- **A)** Single BSON document object — passes key-value pairs including subjects: ["Math", "Science"]
- **B)** Unkeyed flat value array — passes ["Rahul", 9, "Math", "Science"] without any field names
- **C)** Update operator wrapper — passes { $push: { subjects: "Math" } } directly inside insertOne()

**Correct Answer:** A

**Rationale:** The insertOne() method accepts a single BSON document object whose fields can hold strings, numbers, and arrays such as subjects: ["Math", "Science"]. (Key Takeaway: insertOne() accepts a rich BSON document with nested arrays.)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** What does the query db.students.findOne({ age: { $gte: 18 } }, { name: 1, _id: 0 }) return?

- **A)** Multi-document cursor — streams every student aged 18 or older containing only the name field
- **B)** Full unprojected document — returns the first match with all fields because findOne() ignores projection
- **C)** Single projected document — returns only the first matching student object containing just the name field

**Correct Answer:** C

**Rationale:** The findOne(query, projection) method returns a single document (the first match, or null) shaped by the projection { name: 1, _id: 0 } rather than a cursor over every match. (Key Takeaway: findOne() with a projection returns only the first matching projected document.)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** How does the filter { $or: [{ age: { $gte: 19 } }, { name: "Rahul" }] } evaluate a document { name: "Rahul", age: 16 }?

- **A)** Document matches — $or succeeds whenever at least one sub-condition in its array is satisfied
- **B)** Document is excluded — $or requires every sub-condition in its array to evaluate to true
- **C)** Query throws error — $or cannot combine a numeric comparison with a string equality check

**Correct Answer:** A

**Rationale:** The logical $or operator matches a document whenever at least one condition in its array is satisfied; since name: "Rahul" is true, the document matches regardless of age. (Key Takeaway: $or requires only one sub-condition in its array to evaluate to true.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** What is the exact effect of running db.students.updateOne({ name: "Rahul" }, { $pull: { subjects: "Science" } })?

- **A)** Targeted element removal — removes "Science" from subjects while keeping other elements intact
- **B)** Whole array field deletion — deletes the entire subjects array property from Rahul's document
- **C)** Whole document deletion — deletes Rahul's entire student document because "Science" matched

**Correct Answer:** A

**Rationale:** The $pull operator removes matching values ("Science") from an array field (subjects) on the first matched document without deleting other array elements or the document itself. (Key Takeaway: $pull removes specified elements from an array field.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** If a developer wants to remove all students in grade: 7 while leaving students in grades 8, 9, and 10 untouched, which command is required?

- **A)** db.students.deleteOne({ grade: 7 }) — removes only the first matching student in grade 7
- **B)** db.students.deleteMany({ grade: 7 }) — removes every student document where grade equals 7
- **C)** db.students.deleteMany({}) — removes all student documents across every grade in students

**Correct Answer:** B

**Rationale:** Calling db.students.deleteMany({ grade: 7 }) deletes every document that matches the filter { grade: 7 } while preserving documents with other grades. (Key Takeaway: Filtered deleteMany(filter) removes all documents matching the specified criteria.)

---
