### Question 1
What is the primary operational role of the Buffer Manager in a database storage engine?

<details>
<summary>Click to view Model Answer</summary>

**1. Operational Role:** The Buffer Manager manages the allocation and eviction of in-memory RAM page frames, serving as an intermediary between user query execution and physical disk I/O.

**2. Core Mechanism:** It intercepts page requests; if the requested disk page resides in the buffer pool, it provides a pointer immediately (cache hit); otherwise, it fetches the page from disk into an available frame, utilizing page replacement policies (LRU, clock).
</details>

---

### Question 2
Define a Foreign Key and explain its role in enforcing referential integrity?

<details>
<summary>Click to view Model Answer</summary>

**1. Foreign Key:** An attribute or set of attributes in a referencing relation whose values are required to match the primary key or candidate key values of a referenced relation, or be `NULL`.

**2. Referential Role:** It establishes and enforces cross-table relational links, preventing dangling references and ensuring that relationships between entities remain valid and synchronized.
</details>

---

### Question 3
What is Attribute Inheritance in Extended ER (EER) specialization hierarchies?

<details>
<summary>Click to view Model Answer</summary>

**1. Attribute Inheritance:** The semantic property whereby entities belonging to a subclass automatically inherit all attributes and relationship participations defined on their parent superclass.

**2. Design Benefit:** Eliminates schema redundancy by defining common attributes once at the superclass level, allowing subclasses to define only their unique, specialized attributes.
</details>

---

### Question 4
What is a Domain Constraint in relational databases and how is it declared in SQL DDL?

<details>
<summary>Click to view Model Answer</summary>

**1. Domain Constraint:** Mandates that every value appearing under a given attribute column must be an atomic element belonging to the predefined physical data type and permitted value set of that domain.

**2. SQL DDL Declaration:** Enforced using standard data type specifications (`INT`, `VARCHAR(50)`, `DATE`) and explicit conditional check clauses (e.g., `CHECK (Age >= 18 AND Age <= 100)`).
</details>

---

### Question 5
What is a Materialized View and how does it differ from a standard Relational View?

<details>
<summary>Click to view Model Answer</summary>

**1. Standard View:** A virtual table defined as a stored query expression; does not store tuples physically. Evaluated dynamically by query substitution each time it is referenced.

**2. Materialized View:** Physically stores the computed query result tuples on disk. Provides instantaneous read access for complex analytical aggregates, but requires periodic refresh maintenance when base tables change.
</details>

---

### Question 6
Define the Atomicity and Durability properties of transactions in DBMS engine theory?

<details>
<summary>Click to view Model Answer</summary>

**1. Atomicity:** The all-or-nothing guarantee that all operations comprising a transaction execute to successful completion and commit, or all partial updates are completely aborted and undone.

**2. Durability:** The guarantee that once a transaction commits successfully, its database modifications persist permanently in non-volatile storage, surviving even subsequent system crashes.
</details>

---

### Question 7
Explain the role of the Cost-Based Query Optimizer in converting declarative SQL queries into efficient relational execution plans?

<details>
<summary>Click to view Model Answer</summary>

**1. Role of Cost-Based Optimizer (CBO):** Declarative SQL specifies *what* data is required, not *how* to retrieve it. The CBO analyzes alternative physical execution plans and selects the plan with the lowest estimated execution cost (measured in disk I/O operations and CPU cycles).

**2. Optimization Pipeline:**
- **Parsing & Translation:** Parses the SQL text into an internal Relational Algebra query tree.
- **Plan Space Enumeration:** Uses equivalence rules (pushing selections down, reordering joins) to generate logically equivalent execution trees.
- **Catalog Cost Estimation:** Evaluates candidate plans against system catalog statistics (table cardinality, index depths, attribute histograms).
- **Access Path Selection:** Determines optimal physical access paths (e.g., choosing a $B^+$-tree index scan vs. a sequential table scan).

**3. Significance:** Prevents naive, catastrophic full-table Cartesian scans on multi-million row enterprise relations.
</details>

---

### Question 8
Explain the concept of Aggregation in ER modeling and analyze a scenario where it is required to resolve relationship limitations?

<details>
<summary>Click to view Model Answer</summary>

**1. Limitation of Basic ER Modeling:** Traditional ER modeling permits relationships to exist only among entity sets. It cannot directly model a relationship between an entity set and another relationship set.

**2. Aggregation Mechanism:** An abstraction through which a relationship set and its participating entity sets are treated as a higher-level composite entity set, allowing other relationships to connect to it.

**3. Practical Scenario:**
- Consider an employee working on a project: `Works_On(Employee, Project)`. Now suppose the enterprise requires tracking the evaluation of that work by a manager: `Evaluates(Manager, [Works_On(Employee, Project)])`.
- Basic ER diagrams cannot connect `Manager` to the diamond `Works_On`.
- **Resolution via Aggregation:** Enclose `Employee`, `Project`, and `Works_On` inside an **aggregation box**, treating it as a single higher-level entity set that connects to `Manager` via the relationship `Evaluates`.
</details>

---

### Question 9
Analyze the formal semantics and operational pitfalls of NULL values in relational databases across arithmetic and logical evaluations?

<details>
<summary>Click to view Model Answer</summary>

**1. Formal Semantics of NULL:** In relational theory, `NULL` represents missing, unknown, or inapplicable attribute values. It is not equivalent to zero (`0`) or an empty string (`''`).

**2. Three-Valued Logic (3VL):**
- Logical comparisons involving `NULL` evaluate to `UNKNOWN` rather than `TRUE` or `FALSE`.
- Truth table results: `TRUE AND UNKNOWN = UNKNOWN`, `FALSE AND UNKNOWN = FALSE`, `TRUE OR UNKNOWN = TRUE`, `NOT UNKNOWN = UNKNOWN`.
- WHERE predicates select tuples only if the condition evaluates strictly to `TRUE`; tuples evaluating to `UNKNOWN` are rejected.

**3. Operational Pitfalls:**
- **Arithmetic:** Any arithmetic operation with `NULL` yields `NULL` (`100 + NULL = NULL`).
- **Equality Paradox:** The expression `x = NULL` always yields `UNKNOWN`; developers must use `IS NULL` or `IS NOT NULL`.
- **Aggregate Functions:** Aggregates (`SUM`, `AVG`, `COUNT(col)`) ignore `NULL` values, whereas `COUNT(*)` counts all rows, causing subtle calculation discrepancies.
</details>

---

### Question 10
Evaluate the formal criteria that determine whether an SQL view is theoretically and operationally updatable?

<details>
<summary>Click to view Model Answer</summary>

**1. View Updatability Invariant:** A view is updatable (`INSERT`, `UPDATE`, `DELETE` operations executed on the view are deterministically translated to the underlying base tables) if and only if every view tuple maps to exactly one unambiguous base table tuple.

**2. Formal Criteria for Updatable Views (SQL:1999 Standard):**
- **Single Base Table:** The view must be derived from exactly one base relation (no `JOIN` operations).
- **No Duplicate Elimination:** The `SELECT` clause must not contain the `DISTINCT` keyword.
- **No Aggregation or Grouping:** Must contain zero aggregate functions (`SUM`, `AVG`, `COUNT`), and no `GROUP BY` or `HAVING` clauses.
- **Primary Key & NOT NULL Preservation:** For `INSERT` operations, the view must include all columns of the base table that have `NOT NULL` constraints and no default values.
- **Simple Column Expressions:** Attributes in the select list must be direct column references, not calculated expressions (e.g., `Salary * 1.1`).

**3. Deterministic Mapping Principle:** If an update could correspond to multiple different base table states, the DBMS engine rejects the modification.
</details>

---

### Question 11
Critically analyze the four ACID properties of transactions in relational database systems, explaining the specific engine subsystems and algorithms responsible for guaranteeing each property?

<details>
<summary>Click to view Model Answer</summary>

**1. Atomicity (All-or-Nothing Guarantee):**
- **Subsystem:** Recovery Manager.
- **Mechanism:** Implements **Write-Ahead Logging (WAL)**. Every data modification writes an `undo` log record containing the pre-image before dirty pages are flushed to disk. If a transaction aborts or the server crashes, the Recovery Manager executes an `UNDO` pass, rolling back all partial writes.

**2. Consistency (State Invariant Preservation):**
- **Subsystem:** Authorization & Integrity Manager + Application Logic.
- **Mechanism:** Guarantees that the database transitions from one valid state satisfying all declarative schema constraints (`CHECK`, foreign key referential integrity, domain types) to another valid state.

**3. Isolation (Independent Concurrent Execution):**
- **Subsystem:** Concurrency Control Manager.
- **Mechanism:** Implements **Strict Two-Phase Locking (Strict 2PL)** or **Multi-Version Concurrency Control (MVCC)**. Strict 2PL acquires shared locks ($S$) for reads and exclusive locks ($X$) for writes, holding all exclusive locks until `COMMIT` to prevent dirty reads ($G_1$), lost updates ($G_0$), and unrepeatable reads.

**4. Durability (Persistent Commitment Guarantee):**
- **Subsystem:** Recovery Manager & OS File Subsystem.
- **Mechanism:** Mandates that a transaction cannot signal success to the client until its `COMMIT` log record has been synchronously flushed (`fsync`) to non-volatile storage. Subsequent power failures cannot erase committed updates; the recovery engine performs a forward `REDO` pass using log records.
</details>

---

### Question 12
Formulate a comprehensive theoretical and operational treatise on Relational Algebra, contrasting procedural algebraic query trees with declarative SQL expressions and evaluating algebraic optimization equivalence rules?

<details>
<summary>Click to view Model Answer</summary>

**1. Theoretical Foundations of Relational Algebra:**
Relational algebra is a formal procedural query language comprising operators that take one or two relations as input and produce a new relation as output (closure property). Operators include Selection ($\sigma$), Projection ($\pi$), Cartesian Product ($\times$), Union ($\cup$), Set Difference ($-$), and Rename ($\rho$).

**2. Procedural Query Trees vs. Declarative SQL:**
- SQL is declarative; it specifies *what* data is required without specifying the order of operations.
- Relational Algebra is procedural; an algebraic expression specifies an explicit evaluation sequence represented as a **Query Tree**, where leaf nodes represent base relations and internal nodes represent relational operators.

**3. Algebraic Optimization Equivalence Rules:**
Query optimizers transform inefficient canonical query trees into optimized physical execution plans using algebraic equivalence rules:
- **Rule 1: Pushing Selections Down:** $\sigma_{p}(R \times S) \equiv \sigma_{p_1}(R) \times \sigma_{p_2}(S)$. Performing selections as early as possible dramatically reduces intermediate relation cardinalities before expensive joins.
- **Rule 2: Pushing Projections Down:** $\pi_{A}(R \times S) \equiv \pi_{A}(\pi_{A_1}(R) \times \pi_{A_2}(S))$. Eliminates unnecessary attributes early to minimize memory footprint in buffer pool frames.
- **Rule 3: Associativity and Commutativity of Joins:** $(R \bowtie S) \bowtie T \equiv R \bowtie (S \bowtie T)$. Allows the optimizer to join the smallest tables first, minimizing intermediate hash table sizes.

**4. Synthesis:** Relational algebra provides the formal theoretical bedrock that allows database compilers to prove equivalence and guarantee that optimized execution plans return identical results to declarative user queries.
</details>

---

