## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Question:** Which component of the DBMS Storage Manager is responsible for loading disk blocks into main memory frames and implementing cache eviction policies?

- **A)** Query Compiler — it generates optimized relational algebra execution plans
- **B)** Buffer Manager — it allocates RAM frames and flushes dirty pages using algorithms like LRU
- **C)** Data Dictionary — it computes mathematical joins across non-indexed attributes

**Correct Answer:** B

**Rationale:** The Buffer Manager is the core subsystem of the storage manager that interfaces with secondary storage to cache disk blocks in main memory and maintain page replacement policies. (Key Takeaway: The Buffer Manager controls memory caching and page replacement.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Statement:** In an ER diagram, Total Participation of an entity set in a relationship set is visually denoted by a double line, indicating that every entity in the set must participate in at least one relationship instance.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. Total participation (existence dependency) enforces a minimum cardinality of 1 and is drawn with a double line connecting the entity set rectangle to the relationship diamond. (Key Takeaway: Total participation is represented by a double line and indicates existence dependency.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Question:** In Extended ER (EER) modeling, what does the Disjoint constraint ('d') specify regarding subclass membership?

- **A)** An entity instance can belong to multiple subclasses within the specialization simultaneously
- **B)** An entity instance can be a member of at most one subclass within the specialization
- **C)** Subclasses are forbidden from inheriting attributes from the parent superclass

**Correct Answer:** B

**Rationale:** The disjoint constraint ('d') enforces mutual exclusivity among subclasses: an entity can belong to at most one subclass. In contrast, overlapping ('o') permits simultaneous membership in multiple subclasses. (Key Takeaway: Disjoint specialization enforces mutual exclusivity among subclasses.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Question:** When a foreign key is declared with ON DELETE CASCADE, will deleting a record in the parent table automatically delete all matching referencing records in the child table?

- **A)** Yes
- **B)** No

**Correct Answer:** A (Yes)

**Rationale:** Yes. ON DELETE CASCADE ensures referential integrity by automatically propagating parent record deletions down to referencing child records, preventing orphaned foreign key references. (Key Takeaway: ON DELETE CASCADE automatically deletes associated child records.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Question:** When mapping a 1:N Binary Relationship Set into relations, where should the Foreign Key be placed to ensure single-valued attributes without creating unnecessary extra tables?

- **A)** In the '1'-side relation — embed an array of primary keys from the 'N'-side relation
- **B)** In the 'N'-side relation — embed the primary key of the '1'-side relation as a foreign key attribute
- **C)** In an auxiliary bridge table — a separate third relation is mandatory for every binary relationship

**Correct Answer:** B

**Rationale:** In a 1:N relationship (e.g., Department to Employee), each entity on the 'N'-side is associated with at most one entity on the '1'-side. Embedding Dept_ID inside Employee guarantees an atomic single-valued foreign key without null proliferation. (Key Takeaway: In 1:N mappings, embed the foreign key on the 'N'-side relation.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Statement:** In Relational Algebra, the Selection operator ($\sigma$) filters columns vertically, while the Projection operator ($\pi$) filters tuples horizontally.

- **A)** True
- **B)** False

**Correct Answer:** B (False)

**Rationale:** False — swapped_term. Selection ($\sigma$) filters tuples (rows) horizontally based on a condition, whereas Projection ($\pi$) selects specified attributes (columns) vertically and eliminates duplicates. (Key Takeaway: Selection filters rows horizontally; Projection filters columns vertically.)

---
