# Multiple Select Questions: Easy Level

---

## Question 1

**Question:** Which of the following are major structural drawbacks of traditional operating system file processing systems (Select all that apply)?

- **A)** Data redundancy and inconsistency across decentralized departmental files
- **B)** Difficulty in accessing ad-hoc data without writing custom programs
- **C)** Automatic conversion of queries into optimal relational algebra trees
- **D)** Data isolation caused by disparate, incompatible file formats
- **E)** Lack of fine-grained access control and atomicity guarantees during power crashes

**Correct Answers:** A, B, D, E

**Rationale:** File processing systems suffer from redundancy (A), difficulty accessing data (B), isolation across formats (D), and atomicity/security deficits (E). Converting queries to relational algebra (C) is a feature of modern DBMS query optimizers, not a drawback of file systems.

---

## Question 2

**Question:** Which of the following levels are formal tiers within the ANSI-SPARC Three-Schema Architecture (Select all that apply)?

- **A)** Physical (Internal) Level
- **B)** Conceptual (Logical) Level
- **C)** External (View) Level
- **D)** Network Protocol Level
- **E)** Application Operating Level

**Correct Answers:** A, B, C

**Rationale:** The Three-Schema Architecture defines exactly three abstraction levels: Physical (A), Conceptual/Logical (B), and External/View (C). Network Protocol (D) and Application Operating (E) are not schema abstraction levels.

---

## Question 3

**Question:** Which of the following attributes are correctly classified as Composite Attributes (Select all that apply)?

- **A)** Aadhar_Number (Indivisible 12-digit national identifier)
- **B)** Customer_Name (Decomposed into First_Name, Middle_Name, Last_Name)
- **C)** Mailing_Address (Decomposed into Street, City, State, Pincode)
- **D)** Employee_Age (Dynamically computed from Current_Date - DOB)
- **E)** GPS_Coordinates (Decomposed into Latitude and Longitude)

**Correct Answers:** B, C, E

**Rationale:** Composite attributes can be divided into smaller sub-parts with independent meanings, such as Name (B), Address (C), and GPS Coordinates (E). Aadhar Number (A) is an atomic/simple attribute, and Age (D) is a derived attribute.

---

## Question 4

**Question:** Which geometric symbols represent components of an Entity-Relationship (ER) diagram in standard Chen notation (Select all that apply)?

- **A)** Rectangle representing an Entity Set
- **B)** Diamond representing a Relationship Set
- **C)** Oval representing an Attribute
- **D)** Hexagon representing a Primary Key
- **E)** Double Oval representing a Multivalued Attribute

**Correct Answers:** A, B, C, E

**Rationale:** In Chen notation: Entity sets are rectangles (A), relationships are diamonds (B), attributes are ovals (C), and multivalued attributes are double ovals (E). Primary keys are indicated by underlined attribute text inside ovals, never hexagons (D).

---

## Question 5

**Question:** Which of the following properties are guaranteed for transactions by the ACID model in a DBMS (Select all that apply)?

- **A)** Atomicity (all operations complete successfully or none are applied)
- **B)** Consistency (preserves database schema invariants)
- **C)** Isolation (concurrent execution yields states equivalent to serial execution)
- **D)** Durability (committed data persists across system crashes)
- **E)** Elasticity (automatic cloud instance replication)

**Correct Answers:** A, B, C, D

**Rationale:** ACID stands for Atomicity (A), Consistency (B), Isolation (C), and Durability (D). Elasticity (E) is a cloud computing infrastructure metric, not a core ACID transaction invariant.

---

## Question 6

**Question:** Which of the following statements regarding the Relational Model are formally true (Select all that apply)?

- **A)** A relation is mathematically defined as a subset of the Cartesian product of attribute domains
- **B)** A tuple represents an individual row in a relation table
- **C)** The order of tuples in a relation instance is strictly guaranteed by disk track sector order
- **D)** Degree refers to the total number of attributes (columns) in a relation
- **E)** All attribute values in First Normal Form (1NF) must be atomic

**Correct Answers:** A, B, D, E

**Rationale:** Relations are mathematical sets of tuples (A), rows are tuples (B), degree is column count (D), and 1NF requires atomic values (E). Under formal set theory, tuple order is unordered (C is false).

---

## Question 7

**Question:** Which of the following are recognized mapping cardinality ratios for binary relationships (Select all that apply)?

- **A)** One-to-One (1:1)
- **B)** One-to-Many (1:N)
- **C)** Many-to-One (N:1)
- **D)** Many-to-Many (M:N)
- **E)** Zero-to-Zero (0:0)

**Correct Answers:** A, B, C, D

**Rationale:** The four standard binary mapping cardinality ratios are 1:1 (A), 1:N (B), N:1 (C), and M:N (D). Zero-to-zero (E) is not a defined cardinality ratio in database modeling.

---

## Question 8

**Question:** Which of the following are fundamental (primitive) operators in formal Relational Algebra (Select all that apply)?

- **A)** Selection ($\sigma$)
- **B)** Projection ($\pi$)
- **C)** Cartesian Product ($\times$)
- **D)** Set Union ($\cup$)
- **E)** Natural Join ($\bowtie$)

**Correct Answers:** A, B, C, D

**Rationale:** Selection (A), Projection (B), Cartesian Product (C), and Set Union (D) are fundamental operators (along with Set Difference and Rename). Natural Join (E) is a derived operator synthesized from Cartesian product, selection, and projection.

---

## Question 9

**Question:** Which components are direct functional modules of the DBMS Storage Manager (Select all that apply)?

- **A)** Buffer Manager
- **B)** File Manager
- **C)** Authorization and Integrity Manager
- **D)** DML Compiler and Optimizer
- **E)** Index Manager

**Correct Answers:** A, B, C, E

**Rationale:** The Storage Manager comprises the Buffer Manager (A), File Manager (B), Authorization/Integrity Manager (C), and Index Manager (E). The DML Compiler (D) belongs to the Query Processor.

---

## Question 10

**Question:** Which conditions are mandatory characteristics of a Weak Entity Set (Select all that apply)?

- **A)** It lacks a primary key of its own
- **B)** It must have total participation in its identifying relationship
- **C)** It is visually depicted using a double rectangle in ER diagrams
- **D)** It can exist in the database without an identifying owner entity
- **E)** Its discriminator attribute is denoted with a dashed underline

**Correct Answers:** A, B, C, E

**Rationale:** A weak entity set lacks a primary key (A), has total participation in its identifying relationship (B), uses a double rectangle (C), and has a discriminator with a dashed underline (E). It is existence-dependent and cannot exist without an owner (D is false).

---
