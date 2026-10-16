## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Statement:** The Database Administrator (DBA) is primarily responsible for designing the database schema, granting user permissions, managing security, and monitoring database performance.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. The DBA has central control over the system, managing security authorizations, physical storage, schema design, and operational backups. (Key Takeaway: The DBA controls database access, schema definition, and maintenance.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Question:** Which geometric shape represents an Entity Set in standard Peter Chen ER notation?

- **A)** Rectangle — represents an Entity Set
- **B)** Diamond — represents an individual attribute
- **C)** Ellipse — represents an active relational table

**Correct Answer:** A

**Rationale:** In Chen ER notation, Rectangles represent Entity Sets, Diamonds represent Relationship Sets, and Ellipses represent Attributes. (Key Takeaway: In ER diagrams, rectangles represent entity sets.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Statement:** In an ER diagram, the Partial Key (Discriminator) of a weak entity set is indicated by a solid underline.

- **A)** True
- **B)** False

**Correct Answer:** B (False)

**Rationale:** False — swapped_term. A solid underline indicates a Primary Key of a strong entity set. A partial key (discriminator) of a weak entity set is indicated by a dashed (dotted) underline. (Key Takeaway: Partial keys are marked with dashed underlines; primary keys with solid underlines.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Question:** What is the primary role of a Foreign Key in a relational database?

- **A)** An auto-incrementing integer used solely to number rows sequentially
- **B)** An attribute in one table that references the primary key of another table to maintain referential integrity
- **C)** A special security password required to connect to international servers

**Correct Answer:** B

**Rationale:** A Foreign Key is an attribute or set of attributes in a referencing table that matches the primary key of a referenced table, enforcing referential integrity across relations. (Key Takeaway: Foreign keys link tables and enforce referential integrity.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Question:** During ER-to-relational schema mapping, does a Multivalued Attribute (such as multiple skills for an employee) map into a brand new, separate table?

- **A)** Yes
- **B)** No

**Correct Answer:** A (Yes)

**Rationale:** Yes. Relational 1NF forbids non-atomic or multi-valued fields in a single row. Therefore, every multivalued attribute maps into a separate table containing the attribute and the parent primary key as a foreign key. (Key Takeaway: Multivalued attributes always map to a separate table to satisfy 1NF.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Question:** Which SQL command is used to add a new column to an existing table without erasing or dropping the existing table?

- **A)** CREATE TABLE — it recreates the table structure from scratch
- **B)** ALTER TABLE ... ADD — it adds new column definitions while preserving existing rows
- **C)** UPDATE TABLE — it writes new schema metadata into temporary memory buffers

**Correct Answer:** B

**Rationale:** ALTER TABLE is a DDL command that modifies the schema definition of an existing table (e.g., adding or dropping columns) without data loss. (Key Takeaway: ALTER TABLE modifies existing table schemas without deleting stored data.)

---
