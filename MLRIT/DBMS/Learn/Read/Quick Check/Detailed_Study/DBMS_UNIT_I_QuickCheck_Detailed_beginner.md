## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Question:** Why does an enterprise use a Database Management System (DBMS) instead of storing transactional records in standard operating system files?

- **A)** Operating System Files — they allow multiple users to edit the same file concurrently without data corruption
- **B)** Database Management System (DBMS) — it coordinates multi-user concurrent access safely and prevents update anomalies
- **C)** Spreadsheet Formulas — they automatically translate conversational English into machine instructions without an engine

**Correct Answer:** B

**Rationale:** A DBMS coordinates multi-user access through transaction isolation (ACID properties) and schema integrity constraints. Standard operating system files lack concurrency control; simultaneous writes result in race conditions, lost updates, and inconsistent data. (Key Takeaway: A DBMS provides robust concurrency control and prevents update anomalies in multi-user environments.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Question:** In an Entity-Relationship (ER) diagram, how should an attribute that can have multiple values for a single entity (such as multiple phone numbers for a student) be represented?

- **A)** Single-Valued Attribute — drawn with a single regular ellipse
- **B)** Multivalued Attribute — drawn with a double ellipse
- **C)** Derived Attribute — drawn with a dashed ellipse

**Correct Answer:** B

**Rationale:** In standard Peter Chen ER notation, multivalued attributes (which can store multiple distinct values for an entity instance) are drawn using double ellipses. Single ellipses represent single-valued attributes, and dashed ellipses represent derived attributes. (Key Takeaway: Multivalued attributes are denoted by double ellipses in ER diagrams.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Statement:** In an Entity-Relationship diagram, a Weak Entity Set possesses its own independent primary key and can exist in the database without any identifying parent entity.

- **A)** True
- **B)** False

**Correct Answer:** B (False)

**Rationale:** False — reversed_relationship. A weak entity set does NOT possess sufficient attributes to form a primary key of its own; it depends existentially on an identifying owner entity set and forms its primary key by combining the owner's primary key with its own partial key (discriminator). (Key Takeaway: Weak entities lack existential autonomy and depend on an identifying owner's primary key.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Statement:** The Entity Integrity Constraint states that no primary key attribute in a base relation can have a NULL value.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. Entity Integrity is a fundamental constraint in the relational model requiring that primary key values must be non-null. If nulls were permitted, individual tuples could not be uniquely identified or referenced by foreign keys. (Key Takeaway: Entity Integrity guarantees that primary keys are unique and non-null.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Question:** When mapping a Binary Many-to-Many (M:N) Relationship Set from an ER diagram into SQL tables, which relational mapping rule must be applied?

- **A)** Embed foreign keys into both participating entity tables without creating new relations
- **B)** Create a separate relationship table whose primary key is the composite union of foreign keys referencing both participating entities
- **C)** Merge both participating entities into a single flat table containing repeating null columns

**Correct Answer:** B

**Rationale:** Under relational mapping Rule 5, a binary M:N relationship set must map into a separate cross-reference (junction) relation. Its primary key consists of the combination of the foreign keys referencing the primary keys of the participating entity sets. (Key Takeaway: Binary M:N relationships always map into a separate junction table.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Question:** Can an SQL table's schema structure be modified to add a new column using the ALTER TABLE command without deleting existing rows in the table?

- **A)** Yes
- **B)** No

**Correct Answer:** A (Yes)

**Rationale:** Yes. The ALTER TABLE ... ADD column statement is a DDL command specifically designed to evolve the schema dynamically by appending new attributes without deleting or invalidating existing rows. (Key Takeaway: ALTER TABLE evolves schemas safely preserving existing data.)

---
