# Multiple Choice Questions: Medium Level

---

## Question 1: How does Physical Data Independence benefit application software maintenance in an enterprise environment?

**Options:**
- **A)** It enables modifying physical storage indexing or block layout without changing the conceptual schema or application code
- **B)** It allows modifying conceptual tables without altering user SQL view definitions
- **C)** It guarantees that concurrent transactions execute in serializable order without deadlock
- **D)** It automatically converts non-relational unstructured data into third normal form

<details>
<summary>View Answer</summary>

**Correct Answer:** A) It enables modifying physical storage indexing or block layout without changing the conceptual schema or application code

**Explanation:** Physical data independence insulates conceptual schemas and application programs from modifications made to physical disk storage structures, indexing methods, or page clustering.
</details>

---

## Question 2: In an Entity-Relationship diagram, when every entity in an entity set must participate in at least one relationship instance, what constraint is established?

**Options:**
- **A)** Partial Participation represented by a single line
- **B)** Disjoint Constraint represented by a circle with 'd'
- **C)** Total Participation represented by a double line
- **D)** Cardinality Constraint represented by an arrow

<details>
<summary>View Answer</summary>

**Correct Answer:** C) Total Participation represented by a double line

**Explanation:** Total participation (existence dependency) mandates that every entity in the entity set must participate in the relationship, visually denoted by a double line.
</details>

---

## Question 3: How is a Many-to-Many (M:N) binary relationship correctly translated into a relational database schema?

**Options:**
- **A)** By embedding the primary key of either entity set as a foreign key in the other table
- **B)** By creating a separate associative table whose composite primary key comprises foreign keys referencing both entity tables
- **C)** By merging both entity tables into a single unified table with nullable columns
- **D)** By adding multivalued array attributes to both entity relations

<details>
<summary>View Answer</summary>

**Correct Answer:** B) By creating a separate associative table whose composite primary key comprises foreign keys referencing both entity tables

**Explanation:** In relational design, an M:N relationship cannot be represented via foreign key embedding without duplicating rows or violating 1NF. It requires an associative table with a composite primary key.
</details>

---

## Question 4: What is the primary key formulation for a Weak Entity Set during relational reduction?

**Options:**
- **A)** The weak entity's partial discriminator key alone
- **B)** A newly generated system surrogate integer column
- **C)** The primary key of the identifying relationship set alone
- **D)** The composite key combining the identifying owner entity's primary key and the weak entity's discriminator

<details>
<summary>View Answer</summary>

**Correct Answer:** D) The composite key combining the identifying owner entity's primary key and the weak entity's discriminator

**Explanation:** A weak entity table's primary key is formed by taking the primary key of its identifying owner entity and concatenating it with the weak entity's discriminator (partial key).
</details>

---

## Question 5: What foreign key action causes all child records to be automatically deleted when the referenced parent primary key row is deleted?

**Options:**
- **A)** ON DELETE CASCADE
- **B)** ON DELETE SET NULL
- **C)** ON DELETE RESTRICT
- **D)** ON DELETE NO ACTION

<details>
<summary>View Answer</summary>

**Correct Answer:** A) ON DELETE CASCADE

**Explanation:** The `ON DELETE CASCADE` referential action instructs the DBMS to automatically propagate deletions from the parent table to all referencing child tuples.
</details>

---

## Question 6: If relation R has degree 4 and cardinality 10, and relation S has degree 3 and cardinality 5, what are the degree and cardinality of the Cartesian Product (R × S)?

**Options:**
- **A)** Degree 12, Cardinality 15
- **B)** Degree 12, Cardinality 50
- **C)** Degree 7, Cardinality 15
- **D)** Degree 7, Cardinality 50

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Degree 7, Cardinality 50

**Explanation:** For Cartesian Product $R \times S$, Degree $= \text{Deg}(R) + \text{Deg}(S) = 4 + 3 = 7$. Cardinality $= \text{Card}(R) \times \text{Card}(S) = 10 \times 5 = 50$.
</details>

---

## Question 7: What requirement must two relations satisfy before Set Union (∪) or Set Difference (-) can be evaluated between them?

**Options:**
- **A)** They must have identical cardinalities
- **B)** They must be Union-Compatible, possessing identical degree and pairwise compatible attribute domains
- **C)** They must share identical primary key column names
- **D)** They must both reside on the same physical storage volume

<details>
<summary>View Answer</summary>

**Correct Answer:** B) They must be Union-Compatible, possessing identical degree and pairwise compatible attribute domains

**Explanation:** Set operations require union compatibility: both relations must have the same number of attributes (same degree), and corresponding attributes must have compatible domains.
</details>

---

## Question 8: In Extended ER (EER) modeling, what does a disjointness constraint labeled 'd' enforce across subclasses?

**Options:**
- **A)** Every superclass entity must belong to at least one subclass
- **B)** Subclasses do not inherit the attributes of the superclass
- **C)** An entity instance can be a member of at most one subclass within the specialization hierarchy
- **D)** Entities in subclasses can exist without an identifying superclass instance

<details>
<summary>View Answer</summary>

**Correct Answer:** C) An entity instance can be a member of at most one subclass within the specialization hierarchy

**Explanation:** The disjoint constraint ($d$) enforces mutual exclusion among subclasses: an entity cannot belong to more than one subclass in that specialization.
</details>

---

## Question 9: How is a Multivalued Attribute resolved during relational schema translation to preserve First Normal Form (1NF)?

**Options:**
- **A)** By creating a dedicated relation containing the multivalued attribute and the owner's primary key as a composite key
- **B)** By allocating five static columns (e.g., Phone1, Phone2, Phone3) in the base relation
- **C)** By storing the values as a comma-delimited string in the base relation
- **D)** By converting the attribute into an external view definition

<details>
<summary>View Answer</summary>

**Correct Answer:** A) By creating a dedicated relation containing the multivalued attribute and the owner's primary key as a composite key

**Explanation:** To satisfy 1NF atomicity, multivalued attributes are extracted into a separate table with a composite primary key consisting of the owner's primary key and the attribute value.
</details>

---

## Question 10: Which of the following database view definitions is inherently NON-UPDATABLE under standard SQL rules?

**Options:**
- **A)** A view selecting three columns from a single table with a WHERE condition
- **B)** A view selecting all columns of a table without any WHERE condition
- **C)** A view created with the WITH CHECK OPTION clause over a single table
- **D)** A view containing an aggregate function (AVG, SUM) and a GROUP BY clause

<details>
<summary>View Answer</summary>

**Correct Answer:** D) A view containing an aggregate function (AVG, SUM) and a GROUP BY clause

**Explanation:** Views containing aggregate functions, `GROUP BY`, `DISTINCT`, or joins cannot be directly updated because modifications cannot be mapped unambiguously to base table tuples.
</details>

---
