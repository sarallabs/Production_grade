# Multiple Select Questions: Medium Level

---

## Question 1

**Question:** Which of the following database schema modifications can be executed under Physical Data Independence without altering application queries (Select all that apply)?

- **A)** Creating a new B+ tree secondary index on a customer search column
- **B)** Migrating a table space from hard disks to an SSD partition
- **C)** Changing disk block size allocations from 4KB to 16KB
- **D)** Dropping a non-null column from an active table schema
- **E)** Altering physical record placement from a heap file to a clustered hash file

**Correct Answers:** A, B, C, E

**Rationale:** Physical data independence allows altering indexes (A), storage media (B), block sizes (C), and physical file clustering (E) without impacting logical schemas. Dropping an active table column (D) is a logical schema modification that can break application queries.

---

## Question 2

**Question:** Which of the following statements accurately characterize Weak Entities and their relational reduction (Select all that apply)?

- **A)** The weak entity relation includes the primary key of the identifying owner as a foreign key
- **B)** The primary key of the weak entity relation is composite: (Owner_PK, Discriminator)
- **C)** Foreign key referential actions on the identifying relationship typically specify ON DELETE CASCADE
- **D)** The weak entity relation never requires a foreign key because it is an independent entity
- **E)** The identifying relationship set is visually drawn as a double diamond

**Correct Answers:** A, B, C, E

**Rationale:** Weak entities require the owner's primary key as a foreign key (A), have composite primary key `(Owner_PK, Discriminator)` (B), use `ON DELETE CASCADE` due to existence dependency (C), and use double diamonds for identifying relationships (E). D is false.

---

## Question 3

**Question:** Which of the following conditions prevent an SQL view from being directly updatable (Select all that apply)?

- **A)** The view definition contains a GROUP BY clause
- **B)** The view definition contains aggregate functions such as SUM() or AVG()
- **C)** The view definition is derived from an INNER JOIN across two base tables
- **D)** The view definition includes a WHERE clause filtering rows from a single table
- **E)** The view definition contains the DISTINCT keyword

**Correct Answers:** A, B, C, E

**Rationale:** Under the SQL standard, views containing `GROUP BY` (A), aggregates (B), joins (C), or `DISTINCT` (E) are not directly updatable because updates cannot be unambiguously mapped to base tables. A simple `WHERE` clause on a single table (D) does not prevent updatability.

---

## Question 4

**Question:** Which of the following are valid foreign key referential actions in SQL DDL (Select all that apply)?

- **A)** ON DELETE CASCADE
- **B)** ON UPDATE CASCADE
- **C)** ON DELETE SET NULL
- **D)** ON DELETE RESTRICT
- **E)** ON UPDATE SET DEFAULT

**Correct Answers:** A, B, C, D, E

**Rationale:** All five options are valid SQL standard referential action clauses that govern how the DBMS maintains consistency during parent key modifications or deletions.

---

## Question 5

**Question:** Which of the following statements are correct regarding Specialization and Generalization in EER modeling (Select all that apply)?

- **A)** Specialization is a top-down process of identifying distinct subgroups within an entity set
- **B)** Generalization is a bottom-up process of synthesizing multiple entity sets into a generalized superclass
- **C)** Subclasses inherit all attributes and relationship participations of their superclass
- **D)** In total specialization, an entity in the superclass can exist without belonging to any subclass
- **E)** In overlapping specialization, an entity can belong to multiple subclasses simultaneously

**Correct Answers:** A, B, C, E

**Rationale:** Specialization is top-down (A), generalization is bottom-up (B), subclasses inherit all superclass attributes (C), and overlapping allows multiple subclass memberships (E). In total specialization, an entity MUST belong to a subclass, so D is false.

---

## Question 6

**Question:** Which of the following relational algebra expressions are mathematically equivalent to the Natural Join R ⋈ S, assuming R and S share attribute A (Select all that apply)?

- **A)** $\pi_{\text{unique attributes}}(\sigma_{R.A = S.A}(R \times S))$
- **B)** $\sigma_{R.A = S.A}(R \times S)$
- **C)** $R \bowtie_{R.A = S.A} S$ followed by duplicate attribute projection
- **D)** $R \cup S$
- **E)** $R \times S$

**Correct Answers:** A, C

**Rationale:** Natural Join is formally defined as Cartesian product followed by selection on shared attribute equality, followed by projection of unique attributes (A and C). B is an equi-join retaining duplicate columns; D is union; E is Cartesian product.

---

## Question 7

**Question:** When mapping a Many-to-Many (M:N) relationship between Student and Course into SQL tables, which elements must be included in the associative table (Select all that apply)?

- **A)** A foreign key referencing the primary key of the Student table
- **B)** A foreign key referencing the primary key of the Course table
- **C)** A composite primary key comprising (Student_ID, Course_ID)
- **D)** Any descriptive attributes belonging to the relationship (e.g., Grade)
- **E)** The entire demographic profile of the student duplicated for each course

**Correct Answers:** A, B, C, D

**Rationale:** The associative table must include foreign keys to both tables (A, B), a composite primary key (C), and relationship descriptive attributes (D). Duplicating demographic profiles (E) violates normalization.

---

## Question 8

**Question:** Which of the following integrity constraints are enforced by a relational DBMS (Select all that apply)?

- **A)** Domain Constraints (restricting values to declared atomic data types)
- **B)** Entity Integrity Constraint (prohibiting NULL in primary keys)
- **C)** Referential Integrity Constraint (requiring foreign keys to match valid primary keys or be NULL)
- **D)** Key Constraint (requiring candidate key values to be unique across all tuples)
- **E)** Network Bandwidth Constraint (limiting TCP packet size)

**Correct Answers:** A, B, C, D

**Rationale:** Domain (A), Entity Integrity (B), Referential Integrity (C), and Key constraints (D) are core relational constraints enforced by a DBMS engine. Bandwidth constraints (E) belong to network hardware, not DBMS relational integrity.

---

## Question 9

**Question:** Which relational algebra operations are commutative (Select all that apply)?

- **A)** Set Union ($R \cup S = S \cup R$)
- **B)** Natural Join ($R \bowtie S = S \bowtie R$)
- **C)** Set Difference ($R - S = S - R$)
- **D)** Cartesian Product ($R \times S \equiv S \times R$ in tuple pairing content)
- **E)** Projection ($\pi$)

**Correct Answers:** A, B, D

**Rationale:** Set union (A), Natural join (B), and Cartesian product (D) are commutative. Set difference (C) is non-commutative ($R - S \neq S - R$). Projection (E) is a unary operator.

---

## Question 10

**Question:** Which components belong to the DBMS Query Processing Engine (Select all that apply)?

- **A)** DDL Interpreter
- **B)** DML Compiler and Query Optimizer
- **C)** Query Evaluation Engine
- **D)** Buffer Pool Frame Manager
- **E)** Parser and Lexical Analyzer

**Correct Answers:** A, B, C, E

**Rationale:** The Query Processor includes the DDL Interpreter (A), DML Compiler and Optimizer (B), Query Evaluation Engine (C), and Parser (E). The Buffer Pool Manager (D) is part of the Storage Manager.

---
