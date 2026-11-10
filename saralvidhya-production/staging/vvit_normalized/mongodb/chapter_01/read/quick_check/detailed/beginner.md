## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** Which shell command displays every database physically stored on the connected MongoDB server alongside its disk size?

- **A)** use schoolDB — switches the active database pointer in session memory
- **B)** show dbs — lists all populated server databases and their storage size
- **C)** db.dropDatabase() — permanently deletes the active database and its data

**Correct Answer:** B

**Rationale:** The show dbs command lists every database on the connected MongoDB server along with its storage size (such as admin 0.000GB), provided the database actually holds data on disk. (Key Takeaway: show dbs enumerates all populated databases on the MongoDB server.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** What happens to the students collection and its indexes when an administrator executes db.students.drop()?

- **A)** Complete collection removal — deletes the collection, its documents, and all indexes
- **B)** Document-only truncation — removes documents while preserving the collection and indexes
- **C)** Index-only rebuild — drops secondary indexes while keeping all stored BSON documents

**Correct Answer:** A

**Rationale:** Running db.students.drop() permanently removes the collection container, all of its documents, and all indexes defined on it; preserving indexes while emptying documents requires db.students.deleteMany({}). (Key Takeaway: Dropping a collection destroys the collection, its documents, and all associated indexes.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** Which method inserts a single document object such as { name: "Rahul", age: 19 } into the students collection?

- **A)** db.students.insertOne() — writes one BSON document object into the target collection
- **B)** db.students.insertMany() — requires an array of documents to perform batch insertion
- **C)** db.students.findOne() — reads and returns the first matching document without writing

**Correct Answer:** A

**Rationale:** The insertOne(document) method inserts a single document into a collection and automatically creates the collection if it does not yet exist. (Key Takeaway: insertOne() inserts a single document into a collection.)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** What is returned when db.students.find() is called with zero arguments on the students collection?

- **A)** Single first document — returns only the earliest inserted BSON document object
- **B)** Unfiltered result cursor — returns a cursor yielding every document in students
- **C)** Empty collection error — throws a syntax exception when no filter object is given

**Correct Answer:** B

**Rationale:** Calling find() with no arguments (or with an empty filter {}) matches every document in the collection and returns a cursor over the full result set. (Key Takeaway: find() with no arguments returns all documents in a collection.)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** Which comparison operator inside a query filter selects documents whose numeric field is strictly below a target number?

- **A)** Less than or equal ($lte) — matches values below or equal to the specified threshold
- **B)** Strict less than ($lt) — matches values strictly smaller than the specified threshold
- **C)** Strict greater than ($gt) — matches values strictly larger than the specified threshold

**Correct Answer:** B

**Rationale:** The $lt operator tests whether a field's value is strictly less than the specified value, whereas $lte includes equality and $gt tests strictly greater than. (Key Takeaway: $lt represents the strict less-than comparison operator.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** Which atomic update operator appends a new element such as "History" to an existing subjects array field?

- **A)** Array pull ($pull) — removes all matching occurrences of a value from an array field
- **B)** Field set ($set) — overwrites the entire target field with a new scalar or array value
- **C)** Array push ($push) — appends the specified value to the end of an existing array field

**Correct Answer:** C

**Rationale:** The $push operator adds (appends) a value to an array field, whereas $pull removes matching values from an array field and $set replaces the field value. (Key Takeaway: $push appends to an array; $pull removes from an array.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** Which method deletes strictly the first document that satisfies { name: "Kabir" } while leaving any other matches untouched?

- **A)** db.students.deleteMany() — removes every document matching the specified query filter
- **B)** db.students.drop() — removes the entire collection container and all of its indexes
- **C)** db.students.deleteOne() — removes only the first document matching the query filter

**Correct Answer:** C

**Rationale:** The deleteOne(filter) method deletes strictly the first document that matches the filter condition, leaving all other documents in the collection intact. (Key Takeaway: deleteOne() deletes only the first matching document.)

---
