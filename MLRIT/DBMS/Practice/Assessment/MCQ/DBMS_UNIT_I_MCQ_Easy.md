# Multiple Choice Questions: Easy Level

---

## Question 1: Which of the following represents the lowest level of data abstraction that describes how data is actually stored on secondary storage devices?

**Options:**
- **A)** Physical Level
- **B)** Logical Level
- **C)** View Level
- **D)** Conceptual Level

<details>
<summary>View Answer</summary>

**Correct Answer:** A) Physical Level

**Explanation:** The physical level is the lowest level of abstraction, describing complex low-level data structures, block layouts, and record clustering on disk. The logical level describes what data is stored, and the view level provides tailored user perspectives.
</details>

---

## Question 2: What is the primary role of the Data-Definition Language (DDL) in a database system?

**Options:**
- **A)** To retrieve and manipulate tuples stored in table relations
- **B)** To handle network packet routing between client and database server
- **C)** To specify database schemas and store structural metadata in the data dictionary
- **D)** To allocate main memory frames inside the buffer manager

<details>
<summary>View Answer</summary>

**Correct Answer:** C) To specify database schemas and store structural metadata in the data dictionary

**Explanation:** DDL is used by database designers and DBAs to define the database schema, generating system catalog metadata and enforcing integrity constraints.
</details>

---

## Question 3: Which geometric shape standardly represents an Entity Set in Chen's ER diagram notation?

**Options:**
- **A)** Diamond
- **B)** Rectangle
- **C)** Oval
- **D)** Double Line

<details>
<summary>View Answer</summary>

**Correct Answer:** B) Rectangle

**Explanation:** In Chen's ER notation, entity sets are represented by rectangles, relationship sets by diamonds, and attributes by ovals.
</details>

---

## Question 4: How is a Multivalued Attribute visually depicted in an Entity-Relationship diagram?

**Options:**
- **A)** Dashed Oval
- **B)** Underlined Rectangle
- **C)** Double Rectangle
- **D)** Double Oval

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Double Oval

**Explanation:** A multivalued attribute (an attribute that can hold multiple values for a single entity, like phone numbers) is represented by a double oval.
</details>

---

## Question 5: What is a minimal super key called in formal relational database theory?

**Options:**
- **A)** Candidate Key
- **B)** Secondary Key
- **C)** Foreign Key
- **D)** Surrogate Key

<details>
<summary>View Answer</summary>

**Correct Answer:** A) Candidate Key

**Explanation:** A candidate key is a minimal super key—a super key for which no proper subset can uniquely identify an entity tuple.
</details>

---

## Question 6: Which relational integrity constraint strictly mandates that primary key attributes cannot contain NULL values?

**Options:**
- **A)** Referential Integrity Constraint
- **B)** Key Constraint
- **C)** Domain Constraint
- **D)** Entity Integrity Constraint

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Entity Integrity Constraint

**Explanation:** The entity integrity constraint states that no primary key attribute of any base relation may accept a null value, ensuring unambiguous tuple identity.
</details>

---

## Question 7: What is the total number of attributes present in a relation schema formally termed?

**Options:**
- **A)** Cardinality
- **B)** Degree (Arity)
- **C)** Domain Size
- **D)** Tuple Length

<details>
<summary>View Answer</summary>

**Correct Answer:** B) Degree (Arity)

**Explanation:** The degree (or arity) of a relation is the number of attributes (columns) it contains. Cardinality refers to the count of tuples (rows).
</details>

---

## Question 8: Which Relational Algebra operator functions as a horizontal row filter based on a selection predicate?

**Options:**
- **A)** Projection ($\pi$)
- **B)** Cartesian Product ($\times$)
- **C)** Selection ($\sigma$)
- **D)** Join ($\bowtie$)

<details>
<summary>View Answer</summary>

**Correct Answer:** C) Selection ($\sigma$)

**Explanation:** Selection (sigma) is a unary operator that filters tuples horizontally from a relation that satisfy a specified condition.
</details>

---

## Question 9: What type of entity set lacks sufficient attributes to form an independent primary key of its own?

**Options:**
- **A)** Weak Entity Set
- **B)** Composite Entity Set
- **C)** Associative Entity Set
- **D)** Subclass Entity Set

<details>
<summary>View Answer</summary>

**Correct Answer:** A) Weak Entity Set

**Explanation:** A weak entity set is an entity set that does not possess a primary key of its own and depends upon an identifying owner entity set.
</details>

---

## Question 10: Which component of the DBMS Storage Manager manages main-memory caching of disk pages?

**Options:**
- **A)** File Manager
- **B)** Transaction Manager
- **C)** Authorization Manager
- **D)** Buffer Manager

<details>
<summary>View Answer</summary>

**Correct Answer:** D) Buffer Manager

**Explanation:** The Buffer Manager allocates and manages main memory frames (buffer pool), caching disk blocks in RAM and executing page eviction policies.
</details>

---
