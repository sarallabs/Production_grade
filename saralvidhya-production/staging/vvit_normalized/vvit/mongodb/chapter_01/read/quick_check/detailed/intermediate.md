## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** If a session runs use analyticsDB and stops before writing any collection data, how does MongoDB treat analyticsDB?

- **A)** Immediate disk allocation — creates empty storage files and lists analyticsDB in show dbs
- **B)** In-memory context selection — binds the session pointer but omits analyticsDB from show dbs
- **C)** Catalog error rejection — aborts the use command because analyticsDB does not exist on disk

**Correct Answer:** B

**Rationale:** Running use analyticsDB selects the database name in memory, but MongoDB only creates the database on disk and lists it in show dbs after data is inserted into a collection within it. (Key Takeaway: use alone does not materialize a database in show dbs.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** Under what condition does a collection name become visible when executing show collections inside the active database?

- **A)** Materialized namespace — once created via db.createCollection() or a first document insert
- **B)** Context switch alone — immediately after running use schoolDB before any write operation
- **C)** Empty read query — immediately after running db.students.find() on an unwritten database

**Correct Answer:** A

**Rationale:** A collection appears in show collections only after it has been created on disk — either explicitly via db.createCollection() or implicitly via a first document insert. (Key Takeaway: Collections appear in show collections after explicit creation or first write.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** How does MongoDB handle field structure when inserting multiple documents in one call via db.students.insertMany()?

- **A)** Rigid column enforcement — rejects the batch if any document omits a field from the first item
- **B)** Homogeneous type lock — forces every document in the array to share identical key names
- **C)** Flexible schema support — allows documents in the same array to contain different field sets

**Correct Answer:** C

**Rationale:** MongoDB collections support flexible, polymorphic schemas; documents passed inside an insertMany() array can contain different fields unless restricted by explicit validation rules. (Key Takeaway: insertMany() supports heterogeneous document schemas within the same batch array.)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** What is the primary architectural difference between the return values of db.students.find() and db.students.findOne()?

- **A)** Cursor vs. single document — find() returns a cursor whereas findOne() returns one document or null
- **B)** Projection support — find() supports field projection whereas findOne() rejects projection arguments
- **C)** Filter support — find() accepts comparison operators whereas findOne() accepts only empty filters

**Correct Answer:** A

**Rationale:** The find(query, projection) method returns a cursor over all matching documents, whereas findOne(query, projection) returns the first matching document object directly (or null if none match). Both accept filters and projections. (Key Takeaway: find() returns a cursor; findOne() returns a single document or null.)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** In the cursor pipeline db.students.find().sort({ age: -1 }).skip(10).limit(5), what are the exact roles of skip(10) and limit(5)?

- **A)** Offset then cap — skip(10) omits the first 10 matches and limit(5) returns at most 5 documents
- **B)** Cap then offset — skip(10) caps output at 10 matches and limit(5) omits the first 5 documents
- **C)** Page multiplier — skip(10) and limit(5) multiply to return 50 sorted documents from the cursor

**Correct Answer:** A

**Rationale:** The skip(10) method omits the first 10 matching documents from the start of the results, whereas limit(5) caps the maximum number of documents returned at 5. (Key Takeaway: skip(n) omits the first n results; limit(n) caps the number of returned documents at n.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** Which update operator adds a positive or negative numeric delta to an existing numeric field such as attempts?

- **A)** Field replacement ($set) — overwrites the target field with a new static constant value
- **B)** Numeric increment ($inc) — adds the specified positive or negative delta to a number
- **C)** Array append ($push) — appends a new element to the tail of an existing array field

**Correct Answer:** B

**Rationale:** The $inc update operator increments or decrements a numeric field by a given value (for example, { $inc: { attempts: 1 } }), whereas $set replaces the field value and $push appends to an array. (Key Takeaway: $inc modifies numeric fields by adding the specified increment.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** What is the operational outcome of executing db.students.deleteMany({}) with an empty filter object on students?

- **A)** Namespace destruction — drops the students collection container and all secondary indexes
- **B)** No-op filter rejection — deletes zero documents because no field criteria were specified
- **C)** Collection truncation — deletes all documents while keeping the students container intact

**Correct Answer:** C

**Rationale:** Passing an empty filter {} to deleteMany({}) matches and deletes all documents in the collection without dropping the collection itself or its indexes. (Key Takeaway: deleteMany({}) truncates all documents while preserving the collection container.)

---
