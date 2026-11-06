## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Question:** Which level of the ANSI-SPARC Three-Schema Architecture describes how data is physically stored on disk storage media and file structures?

- **A)** External Level — customized views for individual user roles
- **B)** Internal (Physical) Level — low-level data structures, block layouts, and access paths
- **C)** Conceptual Level — logical entities and enterprise-wide constraints

**Correct Answer:** B

**Rationale:** The Internal Level describes the physical storage structure of the database, including block allocation, record formats, and indexing paths. (Key Takeaway: The Internal Level describes physical storage and access mechanisms.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Statement:** In an ER diagram, an attribute whose value can be calculated dynamically from another stored attribute (such as calculating Age from Date of Birth) is called a Composite Attribute.

- **A)** True
- **B)** False

**Correct Answer:** B (False)

**Rationale:** False — swapped_term. An attribute computed from another attribute is a Derived Attribute (drawn with a dashed ellipse). A Composite Attribute is an attribute that can be divided into smaller sub-parts (like Name into First_Name, Last_Name). (Key Takeaway: Derived attributes are computed; composite attributes are subdivided.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Question:** In an Extended ER (EER) model with an Overlapping constraint ('o'), can a single entity instance be a member of more than one subclass simultaneously?

- **A)** Yes
- **B)** No

**Correct Answer:** A (Yes)

**Rationale:** Yes. Overlapping specialization ('o') explicitly permits an entity instance in the superclass to belong to multiple subclasses at the same time (e.g., an Employee can be both a Teacher and a Researcher). (Key Takeaway: Overlapping specialization allows simultaneous membership in multiple subclasses.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Question:** How is a Candidate Key defined in the Relational Data Model?

- **A)** Any set of attributes that contains extra optional columns in addition to the primary key
- **B)** A minimal Super Key from which no attribute can be removed without losing uniqueness
- **C)** An attribute that must contain at least 50% null values across all tuples

**Correct Answer:** B

**Rationale:** A Candidate Key is a minimal super key: it possesses the uniqueness property (no two distinct tuples have identical values) and minimality (removing any attribute destroys uniqueness). (Key Takeaway: A candidate key is a minimal super key.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Statement:** When mapping a 1:1 relationship set with Total Participation on one side into relations, embedding the foreign key on the total participation side minimizes NULL values.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. In a 1:1 relationship with total participation on one side, placing the foreign key in the table with total participation ensures that every single row will have a non-null foreign key reference, eliminating null proliferation. (Key Takeaway: Embedding the foreign key on the total participation side prevents null values.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Question:** What is the total number of tuples in the Cartesian Product ($R 	imes S$) if relation $R$ contains 5 tuples and relation $S$ contains 4 tuples?

- **A)** 9 tuples ($5 + 4$) — the rows of S are appended beneath R
- **B)** 20 tuples ($5 	imes 4$) — every tuple in R is combined with every tuple in S
- **C)** 1 tuple ($5 - 4$) — common matching rows are subtracted

**Correct Answer:** B

**Rationale:** The cardinality of the Cartesian Product $|R 	imes S| = |R| 	imes |S| = 5 	imes 4 = 20$ tuples. Summation ($5 + 4$) describes a UNION operation, not Cartesian product. (Key Takeaway: Cartesian product cardinality is the product of individual table cardinalities.)

---
