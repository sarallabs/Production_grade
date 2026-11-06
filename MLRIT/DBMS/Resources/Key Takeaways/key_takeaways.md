# Key Takeaways: DBMS UNIT - I — Database System Concepts, ER Model & Relational Design
> **Exam Recall Note:** A 5-minute scannable revision sheet compressing all core definitions, formal relational invariants, ER translation algorithms, and exam-critical rules across Unit 1.
## 📌 Database Systems vs. File Processing Systems
- **Core Definition:** A Database Management System (DBMS) is a collection of interrelated data and a set of software programs to access, manipulate, and manage that data securely and efficiently.
- **Four Systemic File System Deficits:** (1) **Data Redundancy & Inconsistency** (isolated duplicated files across departments causing synchronization drift), (2) **Difficulty in Accessing Data** (requires compiling new procedural 3GL code for every ad-hoc query), (3) **Data Isolation & Integrity Problems** (data trapped in incompatible proprietary formats with validation logic buried in application code), and (4) **Atomicity, Concurrency & Security Flaws** (crash vulnerability during partial writes, uncoordinated lost updates, and coarse OS-level file permissions).
- **Centralized Engine Resolution:** DBMS centralizes data definition in an active system catalog (Data Dictionary), provides declarative SQL querying, coordinates multi-user access via lock managers, and enforces ACID transaction guarantees.

## 📌 Three Levels of Abstraction & ANSI-SPARC Architecture
- **Physical Level (Internal Schema):** Lowest level describing *how* data is actually stored on secondary storage; specifies block allocations, page layouts, clustering techniques, and $B^+$-tree/hash index structures.
- **Logical Level (Conceptual Schema):** Middle level describing *what* data is stored across the entire enterprise and the structural relationships among entities; defines tables, data types, and declarative integrity constraints. Governed by the Database Administrator (DBA).
- **View Level (External Schema):** Highest level describing customized, security-restricted subsets of the database tailored to specific user personas; masks sensitive enterprise columns (e.g., hiding `Salary` from general staff).

## 📌 Physical vs. Logical Data Independence Axioms
- **Physical Data Independence:** The capacity to alter internal physical storage structures, index access paths, or disk media without modifying the logical schema or requiring application program rewrites. Enforced at the Conceptual-to-Internal schema boundary.
- **Logical Data Independence:** The capacity to modify the logical schema (e.g., adding/splitting tables, expanding attribute domains) without rewriting existing external views or user queries. Enforced at the External-to-Conceptual schema boundary.
- **Complexity Differential:** Logical data independence is significantly harder to achieve than physical independence because structural changes to base tables often violate view updatability rules.

## 📌 Database Engine Architecture & Query Processing Engine
- **Query Processor Components:** (1) **DDL Interpreter** (parses schema definitions and updates data dictionary metadata), (2) **DML Compiler & Optimizer** (translates declarative SQL into relational algebra, evaluates alternative execution trees, and selects the lowest-cost plan), and (3) **Query Evaluation Engine** (executes low-level algebraic operations against buffer pool pages).
- **Storage Manager Components:** Operates between user queries and raw OS disk; manages (1) **Buffer Manager** (allocates and caches disk pages in RAM frames via LRU/clock policies), (2) **File Manager** (allocates contiguous disk blocks and manages free space maps), and (3) **Authorization & Integrity Manager** (verifies user privileges and validates constraints).
- **Transaction Manager Components:** (1) **Recovery Manager** (maintains Write-Ahead Logging [WAL] with undo/redo logs for crash recovery) and (2) **Concurrency Control Manager** (implements strict two-phase locking [2PL] and MVCC to ensure serializability).

## 📌 Database Schema vs. Database Instance
- **Database Schema:** The overall structural design, metadata, and invariant rules of the database; static in nature and analogous to type definitions and variable declarations in programming languages.
- **Database Instance:** The dynamic collection of actual data tuples stored in the database at a specific snapshot in time; changes constantly as transactions execute `INSERT`, `UPDATE`, and `DELETE` statements.
- **State Invariant:** A database instance is valid if and only if it satisfies all declarative constraints defined in the database schema.

## 📌 Conceptual ER Modeling Notations & Attribute Taxonomies
- **Entity Sets:** Collections of real-world distinguishable objects of the same type; visually denoted as **Rectangles** in Chen's notation.
- **Attribute Taxonomies:** (1) **Simple (Atomic)** (indivisible values like `Age`), (2) **Composite** (hierarchically subdivisible like `Name` into `First_Name`, `Last_Name`; denoted as connected subordinate ovals), (3) **Multivalued** (stores zero or more values like `{Phone_Number}`; denoted as **Double Ovals**), and (4) **Derived** (computed dynamically from stored values like `Age` derived from `DOB`; denoted as **Dashed Ovals**).
- **Relational Key Hierarchy:** **Super Key** (any attribute set uniquely identifying a tuple), **Candidate Key** (a minimal super key with no redundant attributes), and **Primary Key** (the designated candidate key chosen by the DBA; denoted by a **Solid Underline**).

## 📌 Relationship Sets, Mapping Cardinalities & Participation
- **Relationship Sets:** Associations among two or more entities; visually represented as **Diamonds** connecting entity rectangles.
- **Mapping Cardinality Ratios:** (1) **1:1 (One-to-One)**, (2) **1:N (One-to-Many)**, and (3) **M:N (Many-to-Many)**. In Chen's notation, directed arrows denote cardinality of 1, while undirected edges denote many.
- **Participation Constraints:** (1) **Total Participation (Existence Dependency)**: Every entity in the set must participate in at least one relationship instance; visually denoted by a **Double Line**. (2) **Partial Participation**: Some entities may not participate; denoted by a **Single Line**.

## 📌 Weak Entity Sets & Identifying Relationships
- **Weak Entity Set:** An entity set lacking a sufficient primary key of its own; existence-dependent on a strong identifying owner entity set; visually denoted as a **Double Rectangle**.
- **Identifying Relationship:** Connects a weak entity to its owner; visually denoted as a **Double Diamond** with total participation (double line) from the weak entity.
- **Discriminator (Partial Key):** An attribute set that uniquely distinguishes weak entities sharing the same identifying owner; visually denoted by a **Dashed Underline**.
- **Primary Key Formulation:** Formed by the composite concatenation: `[Owner_Primary_Key + Weak_Entity_Discriminator]`.

## 📌 Extended ER (EER): Specialization, Generalization & Constraints
- **Specialization & Generalization:** Top-down subdivision of an entity set into distinctive subclasses vs. bottom-up synthesis of generalized superclasses; linked via **IS-A Triangles** with mandatory **Attribute and Relationship Inheritance**.
- **Disjointness Constraints:** (1) **Disjoint (`d`)**: An entity can belong to at most one subclass (e.g., an employee is *either* Salaried *or* Hourly). (2) **Overlapping (`o`)**: An entity can concurrently belong to multiple subclasses (e.g., a person is *both* Employee and Student).
- **Completeness Constraints:** (1) **Total Completeness (Double Line)**: Every superclass entity must belong to at least one subclass. (2) **Partial Completeness (Single Line)**: A superclass entity may exist without belonging to any subclass.

## 📌 Relational Model Invariants & Integrity Constraints
- **Formal Invariants:** Relations are sets of unordered tuples; attributes are unordered and strictly atomic (First Normal Form requirement).
- **Domain Constraints:** Every attribute value must be an atomic element drawn from its predefined domain specification (`CHECK` constraints).
- **Entity Integrity Constraint:** No attribute participating in the primary key of a base table may accept a `NULL` value, ensuring unique tuple locatability.
- **Referential Integrity Constraint:** A foreign key in a referencing relation must either match a valid candidate key value in the referenced relation or be entirely `NULL`. Enforced via `ON DELETE/UPDATE CASCADE`, `SET NULL`, or `RESTRICT`.

## 📌 Algorithmic ER-to-Relational Logical Design Reduction
- **Strong Entity Translation:** Creates a table containing all simple attributes; composite attributes are flattened into their leaf sub-attributes.
- **Weak Entity Translation:** Creates a table containing all weak simple attributes plus the primary key of the owner entity as a foreign key (`ON DELETE CASCADE`). Primary key is `(Owner_PK, Discriminator)`.
- **1:N Relationship Translation:** Avoids creating an extra table; embeds the primary key of the '1'-side entity as a foreign key inside the 'N'-side relation.
- **M:N Relationship Translation:** Must create a separate cross-reference junction table whose primary key is the composite union of foreign keys referencing both participating tables.
- **Multivalued Attribute Translation:** Creates an independent table containing the multivalued attribute plus the parent entity's primary key as a foreign key. Primary key is `(Parent_PK, Multivalued_Attribute)`.

## 📌 Relational Querying, Views & Schema Evolution
- **Relational Algebra Primaries:** Fundamental operators comprise Selection ($\sigma$), Projection ($\pi$), Cartesian Product ($	imes$), Union ($\cup$), Set Difference ($-$), and Rename ($
ho$).
- **Relational View Semantics:** A view is a virtual table defined as a stored query expression; does not store tuples physically (unless materialized). Evaluated dynamically at query execution time via query tree substitution.
- **View Updatability Invariant:** A view is updatable (`INSERT`/`UPDATE`/`DELETE`) if and only if it is defined over a single base table without `DISTINCT`, aggregate functions (`SUM`, `AVG`), `GROUP BY`, `HAVING`, or `UNION`, and includes all `NOT NULL` columns of the underlying relation.
- **`WITH CHECK OPTION`:** Rejects any `INSERT` or `UPDATE` through the view that violates the defining `WHERE` predicate of the view.

