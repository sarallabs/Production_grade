## Question 1 (Module 1: Database Operations & Storage Lifecycle)

**Question:** How is a new database created in MongoDB when no dedicated create-database command exists?

- **A)** Switch and first write — select the database name with use and insert data into a collection
- **B)** Catalog registration — run show dbs with the new database name to allocate empty disk files
- **C)** Drop and reinitialize — execute db.dropDatabase() first to initialize a blank database schema

**Correct Answer:** A

**Rationale:** MongoDB has no dedicated command to create a database ahead of time; you switch to a database name with use and MongoDB creates it once you insert data into a collection within it. (Key Takeaway: MongoDB creates a database on first write after switching context with use.)

---

## Question 2 (Module 2: Collection Architecture & Structural Management)

**Question:** Which method explicitly creates an empty collection named "students" in the current database?

- **A)** db.createCollection("students") — explicitly allocates a new empty collection in the active database
- **B)** show collections — enumerates existing collections in the active database without creating new ones
- **C)** db.students.drop() — permanently removes the target collection, its documents, and all of its indexes

**Correct Answer:** A

**Rationale:** Calling db.createCollection("students") explicitly creates a new empty students collection in the currently selected database. (Key Takeaway: db.createCollection(name, options) explicitly creates a collection.)

---

## Question 3 (Module 3: Document Ingestion Mechanics (CRUD Create))

**Question:** What happens if db.students.insertOne({ name: "Rahul", age: 19 }) is run when the students collection does not exist yet?

- **A)** Missing collection exception — MongoDB aborts the write until db.createCollection() is called
- **B)** Automatic collection creation — MongoDB creates the students collection and inserts the document
- **C)** Temporary memory buffer — MongoDB holds the document in RAM and discards it when mongosh exits

**Correct Answer:** B

**Rationale:** If the target collection does not exist yet, MongoDB creates it automatically the first time you insert a document via insertOne() or insertMany(). (Key Takeaway: Inserting a document automatically creates the collection if it does not exist.)

---

## Question 4 (Module 4: Document Retrieval & Query Architecture (CRUD Read))

**Question:** Which method retrieves only the first matching document (or null) instead of returning a cursor?

- **A)** db.students.find() — returns an iterable cursor streaming all documents matching the query filter
- **B)** db.students.findOne() — returns strictly the first matching document object or null if none match
- **C)** db.students.updateOne() — modifies specific fields on the first matching document using operators

**Correct Answer:** B

**Rationale:** The findOne(query, projection) method retrieves just the first matching document (or null if none match) instead of returning a cursor. (Key Takeaway: findOne() returns a single document or null.)

---

## Question 5 (Module 5: Advanced Query Filtering, Projection & Pagination)

**Question:** In db.students.find().sort({ age: 1 }), how do the sort direction values 1 and -1 order the returned documents?

- **A)** Descending vs. ascending — 1 sorts highest to lowest whereas -1 sorts lowest to highest
- **B)** Include vs. exclude — 1 includes the age field in output whereas -1 hides the age field
- **C)** Ascending vs. descending — 1 sorts lowest to highest whereas -1 sorts highest to lowest

**Correct Answer:** C

**Rationale:** In sort({ field: 1 | -1 }), 1 orders results in ascending order (lowest to highest), whereas -1 orders results in descending order (highest to lowest). (Key Takeaway: sort() uses 1 for ascending and -1 for descending order.)

---

## Question 6 (Module 6: Field Modification & In-Place Update Operators (CRUD Update))

**Question:** Which method applies { $set: { promoted: true } } to every document in students where { age: 18 }?

- **A)** db.students.updateOne() — applies the update operators to only the first matching document found
- **B)** db.students.updateMany() — applies the update operators to every document matching the filter
- **C)** db.students.insertMany() — inserts an array of new documents into the target collection container

**Correct Answer:** B

**Rationale:** The updateMany(filter, update) method updates every document that matches the query filter, applying the specified update operators to each match. (Key Takeaway: updateMany() modifies all documents matching the filter.)

---

## Question 7 (Module 7: Document Deletion & Collection Pruning (CRUD Delete))

**Question:** What is the exact deletion scope of calling db.students.deleteMany({ age: 17 }) on the students collection?

- **A)** Every matching document — removes all documents in students where age equals 17
- **B)** Single first match — removes only the first document found where age equals 17
- **C)** Entire collection drop — removes the students collection and all of its indexes

**Correct Answer:** A

**Rationale:** Calling deleteMany({ age: 17 }) deletes every document where age equals 17, whereas deleting only the first match is performed by deleteOne({ age: 17 }). (Key Takeaway: deleteMany() removes all matching documents, whereas deleteOne() removes only the first match.)

---
