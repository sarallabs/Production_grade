## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** How does db.dropDatabase() determine which database namespace to delete when invoked in mongosh?

- **A)** String parameter target — deletes whichever database name string is passed inside parentheses
- **B)** Active session context — deletes strictly the currently selected database set via the use command
- **C)** Global server purge — deletes all non-system user databases across the connected MongoDB server

**Correct Answer:** B

**Rationale:** The db.dropDatabase() method takes no database-name argument and operates strictly against the currently selected database context set via use. (Key Takeaway: db.dropDatabase() always deletes the currently active database context.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** What happens to secondary B-tree indexes defined on students when an administrator executes db.students.drop()?

- **A)** Complete index deallocation — all indexes on students are permanently removed with the collection
- **B)** Catalog index caching — index definitions are saved in config and rebuilt on the next insertOne()
- **C)** Primary index preservation — the default _id index is retained while secondary indexes are dropped

**Correct Answer:** A

**Rationale:** Calling db.students.drop() permanently removes the collection, all of the documents it contains, and all indexes defined on it. (Key Takeaway: Dropping a collection permanently destroys all of its indexes.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** How does MongoDB handle primary key allocation when db.students.insertOne({ name: "Aditi", age: 18 }) is executed without an _id property?

- **A)** Automatic ObjectId generation — assigns a unique 12-byte ObjectId to _id before storing BSON
- **B)** Sequential integer counter — assigns an auto-incrementing 32-bit integer starting from 1 to _id
- **C)** Keyless document persistence — writes the BSON document to disk without any _id primary key

**Correct Answer:** A

**Rationale:** Every MongoDB document requires an _id primary key; when omitted by the caller during insertOne() or insertMany(), MongoDB automatically generates a unique 12-byte ObjectId. (Key Takeaway: MongoDB auto-generates a 12-byte ObjectId for _id whenever omitted on insert.)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** Why does chaining .sort({ age: -1 }) or .limit(5) directly onto db.students.findOne({ age: { $gte: 18 } }) fail?

- **A)** Projection lock — findOne() disables cursor modifiers unless a projection document is supplied
- **B)** Direct object return — findOne() returns a single document or null rather than a query cursor
- **C)** Operator conflict — findOne() prohibits sorting whenever comparison operators like $gte are used

**Correct Answer:** B

**Rationale:** The findOne() method returns a single document object (or null) rather than a cursor, so it does not support cursor methods like sort(), limit(), or skip() directly. (Key Takeaway: Cursor methods .sort(), .limit(), and .skip() work on find(), not findOne().)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** When executing db.students.find({}, { name: 1, age: 1 }), which fields appear in each returned document?

- **A)** Only name and age — specifying inclusion fields automatically suppresses the _id primary key
- **B)** All document fields — setting 1 on name and age is ignored unless _id: 1 is also specified
- **C)** Fields _id, name, and age — _id is returned by default unless explicitly excluded with _id: 0

**Correct Answer:** C

**Rationale:** The _id field is included by default in all projections unless explicitly excluded by specifying _id: 0 ({ name: 1, age: 1, _id: 0 }). (Key Takeaway: Explicitly pass _id: 0 in the projection object to suppress _id.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** When db.students.updateOne({ grade: 8 }, { $set: { promoted: true } }) executes against a collection containing five { grade: 8 } documents, what is the mutation scope?

- **A)** First match mutation — modifies strictly the first matching document and leaves the other four intact
- **B)** Batch match mutation — modifies all five matching documents simultaneously across the collection
- **C)** Whole document replacement — erases name and grade so only the promoted field remains on the match

**Correct Answer:** A

**Rationale:** The updateOne(filter, update) method modifies strictly the first document that matches the filter using $set in place, whereas modifying all five requires updateMany(). (Key Takeaway: updateOne() restricts in-place field mutation to the first matched document.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** Which cleanup command removes every collection, document, and index inside schoolDB rather than dropping a single collection?

- **A)** db.students.deleteMany({}) — deletes all documents in students while keeping the collection container
- **B)** db.students.drop() — deletes only the students collection and its indexes inside the active database
- **C)** db.dropDatabase() — permanently deletes the active schoolDB database and all collections inside it

**Correct Answer:** C

**Rationale:** The db.dropDatabase() command operates at the database level, permanently deleting the currently selected database along with all collections and documents inside it. (Key Takeaway: db.dropDatabase() purges the entire database, whereas drop() removes a single collection.)

---
