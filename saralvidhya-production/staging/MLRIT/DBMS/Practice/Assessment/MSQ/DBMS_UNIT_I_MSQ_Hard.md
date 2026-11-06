# Multiple Select Questions: Hard Level

---

## Question 1

**Question:** Which of the following conditions correctly characterize why Logical Data Independence is more challenging to achieve than Physical Data Independence (Select all that apply)?

- **A)** Modifying logical schemas often alters the semantic structure of tables (e.g., vertical partitioning)
- **B)** SQL views constructed over modified tables may not support transparent INSERT/UPDATE/DELETE operations due to view updatability rules
- **C)** Relational query compilers cannot optimize queries when views are referenced
- **D)** Application programs embedded with SQL queries may rely on specific columns that are no longer accessible without updating view definitions
- **E)** Physical database engines prohibit adding new tables to existing catalogs

**Correct Answers:** A, B, D

**Rationale:** Logical data independence is harder because restructuring tables alters semantics (A), views over restructured tables often fail updatability rules (B), and applications may require view updates to stay functional (D). C and E are false statements.

---

## Question 2

**Question:** Consider translating an EER specialization hierarchy into relational tables. What are the key properties of the 'Single Flat Table with Type Discriminator' mapping strategy (Select all that apply)?

- **A)** It eliminates the need for expensive relational JOIN operations when querying subclass data
- **B)** It wastes disk storage because attributes belonging to other subclasses must store NULL values
- **C)** It prevents the database designer from enforcing NOT NULL constraints on subclass-specific attributes
- **D)** It creates a separate table for every subclass containing only its primary key
- **E)** It requires one or more type discriminator columns to designate the active subclass for each tuple

**Correct Answers:** A, B, C, E

**Rationale:** The single flat table strategy eliminates joins (A), incurs null storage overhead (B), cannot enforce `NOT NULL` on subclass attributes (C), and uses discriminator flags (E). D describes the multi-table strategy.

---

## Question 3

**Question:** Which of the following execution guarantees are provided by the Write-Ahead Logging (WAL) protocol and the Recovery Manager (Select all that apply)?

- **A)** Log records describing an update must be flushed to stable disk before the corresponding dirty data page is written to disk
- **B)** The transaction log enables an UNDO pass to roll back uncommitted transactions following a system crash
- **C)** The transaction log enables a REDO pass to reapply committed transaction updates that were in memory buffers during a crash
- **D)** The protocol guarantees that all queries execute in sub-millisecond latency regardless of index availability
- **E)** Atomicity and Durability are preserved even if power failure occurs during buffer page writes

**Correct Answers:** A, B, C, E

**Rationale:** WAL requires log flush before page flush (A), supports UNDO for uncommitted transactions (B), supports REDO for committed updates (C), and ensures Atomicity/Durability (E). WAL does not govern query latency (D).

---

## Question 4

**Question:** Consider a relation R(A, B, C, D, E) where {A, B} is a candidate key and {A, C} is also a candidate key. Which of the following statements are mathematically TRUE (Select all that apply)?

- **A)** {A, B} is a super key of R
- **B)** {A, B, D} is a super key of R
- **C)** {B, C, D, E} is guaranteed to be a super key of R
- **D)** {A, C, E} is a super key of R
- **E)** No proper subset of {A, B} can uniquely identify tuples in R

**Correct Answers:** A, B, D, E

**Rationale:** {A, B} is a candidate key, so it is a super key (A) with no proper subset uniquely identifying tuples (E). Any superset of a candidate key is a super key ({A, B, D} in B, {A, C, E} in D). {B, C, D, E} does not contain either candidate key, so it is not a super key (C is false).

---

## Question 5

**Question:** Which of the following database modifications will cause a Referential Integrity violation unless appropriate cascade actions or foreign key adjustments are configured (Select all that apply)?

- **A)** Deleting a Department row that is currently referenced by multiple Employee rows when the foreign key uses ON DELETE RESTRICT
- **B)** Updating the primary key Dept_ID of a Department from 10 to 100 when child Employee rows exist and ON UPDATE NO ACTION is active
- **C)** Inserting a new Employee row with a Dept_ID value that exists in the Department table
- **D)** Inserting an Employee row with a Dept_ID value that does NOT exist in the Department table
- **E)** Deleting an Employee row from the child table

**Correct Answers:** A, B, D

**Rationale:** Deleting a referenced parent under RESTRICT (A), updating a referenced parent PK under NO ACTION (B), and inserting a child with a non-existent parent FK (D) violate referential integrity. Inserting a valid FK (C) and deleting a child row (E) are legal operations.

---

## Question 6

**Question:** Which of the following statements are correct regarding the evaluation of Relational Algebra operations (Select all that apply)?

- **A)** Selection operations distribute over Set Intersection: $\sigma_p(R \cap S) = \sigma_p(R) \cap \sigma_p(S)$
- **B)** Projection operations distribute over Set Difference: $\pi_L(R - S) = \pi_L(R) - \pi_L(S)$
- **C)** Selection operations distribute over Set Union: $\sigma_p(R \cup S) = \sigma_p(R) \cup \sigma_p(S)$
- **D)** Consecutive Selections can be cascaded: $\sigma_{p_1}(\sigma_{p_2}(R)) = \sigma_{p_1 \land p_2}(R)$
- **E)** Projection operations can be cascaded: $\pi_{L_1}(\pi_{L_2}(R)) = \pi_{L_1}(R)$ provided $L_1 \subseteq L_2$

**Correct Answers:** A, C, D, E

**Rationale:** Selection distributes over intersection (A) and union (C), and cascades with conjunction (D). Projection cascades when $L_1 \subseteq L_2$ (E). Projection does NOT distribute over set difference (B is false: projecting first can introduce equal attributes that alter set difference).

---

## Question 7

**Question:** When mapping a 1:1 relationship between entity sets S and T into a relational database schema, which design strategies can be employed (Select all that apply)?

- **A)** Embed the primary key of S as a foreign key in relation T, marking it UNIQUE
- **B)** Embed the primary key of T as a foreign key in relation S, marking it UNIQUE
- **C)** Merge both S and T into a single table, which is especially optimal when both have Total Participation
- **D)** Create a separate associative table with a composite primary key
- **E)** Embed the foreign key in the relation that exhibits Total Participation to eliminate NULL values

**Correct Answers:** A, B, C, E

**Rationale:** 1:1 relationships can be mapped by embedding PK(S) into T (A), embedding PK(T) into S (B), merging tables on bidirectional total participation (C), or placing the FK on the total participation side to avoid nulls (E). Creating an associative table (D) is unnecessary and inefficient for 1:1 relationships.

---

## Question 8

**Question:** Which of the following statements regarding the SQL WITH CHECK OPTION clause on database views are TRUE (Select all that apply)?

- **A)** It ensures that any row inserted through the view satisfies the view's WHERE predicate
- **B)** It ensures that any row updated through the view continues to satisfy the view's WHERE predicate
- **C)** It automatically converts an un-updatable view with aggregate functions into an updatable view
- **D)** If an UPDATE through the view causes a row to fail the WHERE predicate, the DBMS rejects the update
- **E)** It can be applied to both simple views and cascaded nested views

**Correct Answers:** A, B, D, E

**Rationale:** `WITH CHECK OPTION` validates that inserts (A) and updates (B, D) satisfy the view predicate, and can be applied to simple or cascaded views (E). It cannot make an aggregate view updatable (C is false).

---

## Question 9

**Question:** In ER modeling, what implications arise when an entity set is specified with Total Participation in a relationship set (Select all that apply)?

- **A)** The entity set has an existence dependency on the relationship set
- **B)** Every entity instance in that entity set must participate in at least one relationship instance
- **C)** It is visually depicted using a double line connecting the entity rectangle to the relationship diamond
- **D)** In the corresponding relational schema, the foreign key embedded for this relationship can enforce a NOT NULL constraint
- **E)** The entity set cannot have any primary key attributes

**Correct Answers:** A, B, C, D

**Rationale:** Total participation implies existence dependency (A), mandatory participation of every entity (B), double line notation (C), and allows enforcing `NOT NULL` on the embedded foreign key (D). Total participation does not prevent an entity set from having a primary key (E is false).

---

## Question 10

**Question:** Which of the following database architectural components reside within the boundary of the DBMS Engine (inside the database software) (Select all that apply)?

- **A)** DML Compiler and Cost-Based Query Optimizer
- **B)** Buffer Pool Manager and Page Cache
- **C)** Data Dictionary / System Catalog
- **D)** Concurrency Control Lock Manager and Transaction Log Manager
- **E)** Web Browser Presentation Client

**Correct Answers:** A, B, C, D

**Rationale:** The Query Optimizer (A), Buffer Manager (B), Data Dictionary (C), and Lock/Log Managers (D) are core DBMS engine components. The Web Browser (E) is an external client machine application.

---
