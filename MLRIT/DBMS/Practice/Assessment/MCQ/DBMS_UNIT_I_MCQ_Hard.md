# Multiple Choice Questions: Hard Level

---

## Question 1: Why does a relational Natural Join (R ⋈ S) produce an output schema with degree strictly less than Deg(R) + Deg(S) when shared attribute names exist?

**Options:**
- **A)** Because Natural Join projects out duplicate join attribute columns after equating them
- **B)** Because the query optimizer compresses null-valued attributes into binary masks
- **C)** Because relational engines discard non-primary key attributes from the right table
- **D)** Because Natural Join computes the Cartesian product only on foreign key columns

<details>
<summary>View Answer</summary>

**Correct Answer:** A) Because Natural Join projects out duplicate join attribute columns after equating them

**Explanation:** Natural Join is algebraically defined as a Cartesian product followed by selection on equality of all shared attributes, followed by projection that retains only one copy of each shared attribute.
</details>

---

## Question 2: In the Three-Schema Architecture, why is Logical Data Independence significantly harder to achieve than Physical Data Independence?

**Options:**
- **A)** Because physical disk storage devices evolve faster than application code
- **B)** Because the SQL standard does not support external view definitions
- **C)** Because altering conceptual schemas often changes the semantic structure of tables, making view reconstruction and view updatability difficult or impossible
- **D)** Because operating system file managers prohibit column additions on live databases

<details>
<summary>View Answer</summary>

**Correct Answer:** C) Because altering conceptual schemas often changes the semantic structure of tables, making view reconstruction and view updatability difficult or impossible

**Explanation:** Physical independence only requires updating internal pointers/indexes. Logical independence requires altering table structures (splitting, restructuring) while preserving external views, which is constrained by view updatability and complex semantic mappings.
</details>

---

## Question 3: When mapping a 1:1 relationship between entity set A and entity set B where A has Total Participation and B has Partial Participation, where should the foreign key be placed to minimize NULL values?

**Options:**
- **A)** In relation B, declared with a NOT NULL constraint
- **B)** In relation A, declared with a NOT NULL and UNIQUE constraint
- **C)** In a separate associative table containing both primary keys
- **D)** In both relations simultaneously to enforce bidirectional referential integrity

<details>
<summary>View Answer</summary>

**Correct Answer:** B) In relation A, declared with a NOT NULL and UNIQUE constraint

**Explanation:** Placing the foreign key in table A (total participation) ensures every row in A references a B instance, allowing a `NOT NULL` constraint and completely eliminating null foreign keys.
</details>

---

## Question 4: What critical anomaly occurs if the Write-Ahead Logging (WAL) protocol is violated by writing a modified buffer pool page to disk before its corresponding transaction log record is persisted?

**Options:**
- **A)** The query optimizer will select a sub-optimal sequential scan plan
- **B)** The buffer manager will trigger a deadlock in the concurrency control manager
- **C)** The database catalog will lose track of primary key constraints
- **D)** A system crash can leave uncommitted dirty data on disk with no log record to UNDO the changes, permanently violating Atomicity

<details>
<summary>View Answer</summary>

**Correct Answer:** D) A system crash can leave uncommitted dirty data on disk with no log record to UNDO the changes, permanently violating Atomicity

**Explanation:** WAL mandates that log records must reach non-volatile disk before dirty data pages are flushed. If violated, a crash leaves uncommitted updates on disk without undo records, violating atomicity.
</details>

---

## Question 5: Consider a relation R(A, B, C, D) with candidate keys {A, B} and {A, C}. Which of the following attribute sets is NOT a super key of R?

**Options:**
- **A)** {B, C, D}
- **B)** {A, C}
- **C)** {A, B, D}
- **D)** {A, B, C, D}

<details>
<summary>View Answer</summary>

**Correct Answer:** A) {B, C, D}

**Explanation:** Any superset of a candidate key is a super key. {A, B, D} contains {A, B}; {A, C} is a candidate key; {A, B, C, D} contains both. {B, C, D} contains neither {A, B} nor {A, C}, so it is not a super key.
</details>

---

## Question 6: Which of the following scenarios illustrates a violation of Referential Integrity during a database modification?

**Options:**
- **A)** Inserting a new department row into the Department table with a unique Dept_ID
- **B)** Deleting a child row from an associative table
- **C)** Updating an employee's salary to a value within the allowable domain
- **D)** Inserting an employee row into the Employee table with a Dept_ID value that does not exist in the Department table

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Inserting an employee row into the Employee table with a Dept_ID value that does not exist in the Department table

**Explanation:** Referential integrity requires foreign key values to match an existing primary key in the referenced table. Inserting an employee with a non-existent Dept_ID creates an orphan record, violating referential integrity.
</details>

---

## Question 7: What is the result of evaluating the Relational Algebra expression R - (R - S) when R and S are union-compatible relations?

**Options:**
- **A)** R ∪ S
- **B)** R ∩ S (Set Intersection of R and S)
- **C)** S - R
- **D)** Empty relation (∅)

<details>
<summary>View Answer</summary>

**Correct Answer:** B) R ∩ S (Set Intersection of R and S)

**Explanation:** $R - S$ contains tuples in $R$ but not in $S$. Subtracting those tuples from $R$ leaves only tuples that belong to both $R$ and $S$, which is the set intersection $R \cap S$.
</details>

---

## Question 8: When mapping an EER specialization hierarchy using the Single Flat Table method, what major database constraint CANNOT be enforced on subclass-specific attributes?

**Options:**
- **A)** CHECK constraint predicates
- **B)** Foreign key references pointing to external tables
- **C)** NOT NULL constraints on subclass-specific attributes
- **D)** Index creation on search columns

<details>
<summary>View Answer</summary>

**Correct Answer:** C) NOT NULL constraints on subclass-specific attributes

**Explanation:** In a single flat table containing attributes of all subclasses, any row belonging to subclass A must store NULL for attributes belonging to subclass B. Therefore, subclass-specific attributes cannot enforce `NOT NULL`.
</details>

---

## Question 9: In ER modeling, under what condition can a binary relationship set be completely eliminated by collapsing it into an entity relation without creating redundant or null data?

**Options:**
- **A)** When the relationship is One-to-One and both participating entity sets have Total Participation
- **B)** When the relationship is Many-to-Many with descriptive attributes
- **C)** When both entity sets are weak entity sets
- **D)** When the relationship has partial participation on both sides

<details>
<summary>View Answer</summary>

**Correct Answer:** A) When the relationship is One-to-One and both participating entity sets have Total Participation

**Explanation:** When a 1:1 relationship has total participation on both participating entity sets, every entity in A matches exactly one in B and vice versa. Merging them into a single table introduces zero nulls and zero redundancy.
</details>

---

## Question 10: Why does executing an UPDATE statement on an SQL view defined with a JOIN across two base tables fail to guarantee deterministic execution?

**Options:**
- **A)** Because relational storage managers do not support index lookups on views
- **B)** Because the query optimizer cannot generate execution trees for views
- **C)** Because the SQL standard limits view definitions to a maximum of 256 characters
- **D)** Because an update on a join view can lead to ambiguous side-effects on base tables, potentially modifying unintended parent tuples or violating foreign keys

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Because an update on a join view can lead to ambiguous side-effects on base tables, potentially modifying unintended parent tuples or violating foreign keys

**Explanation:** Updating a join view can cause unpredictable side effects—such as updating shared parent attributes across multiple child rows or creating orphaned records—making unambiguous translation to base tables impossible.
</details>

---
