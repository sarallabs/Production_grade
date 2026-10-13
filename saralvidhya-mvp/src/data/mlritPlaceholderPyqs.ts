import type { QuestionData } from "@/pages/PreviousYearQuestions";

/**
 * High-yield Previous Year Questions (PYQs) for MLRIT B.Tech CSE / IT — Database Management Systems (dbms).
 * Covers Unit 1: Database System Concepts, ER Model & Relational Design.
 */
export const MLRIT_DBMS_PLACEHOLDER_PYQS: QuestionData[] = [
  {
    id: 1,
    text: "Explain the Three-Schema Architecture of a DBMS. How does it achieve Logical and Physical Data Independence?",
    shortAnswer:
      "Divides DBMS into Internal (physical disk structures), Conceptual (enterprise entities and relationships), and External (user-customized views) levels to isolate application programs from storage changes.",
    longAnswer:
      "The Three-Schema Architecture (ANSI/SPARC) divides database systems into three distinct abstraction levels:\n\n1. **Internal (Physical) Level:** Describes low-level physical storage structures, disk blocks, clustering, and access paths (B+ Trees, hashing).\n2. **Conceptual (Logical) Level:** Describes the entire enterprise data structure without physical storage details (entities, relationships, constraints, security).\n3. **External (View) Level:** Provides tailored views for specific user groups, hiding sensitive attributes.\n\n### Data Independence:\n- **Logical Data Independence:** Ability to modify the conceptual schema (adding entities or columns) without modifying existing external schemas or rewriting user application programs.\n- **Physical Data Independence:** Ability to alter internal physical storage structures (re-indexing, SSD migration) without modifying the conceptual schema or application code.",
    chapter: "Unit: 1",
    section: "10M",
    marks: 10,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 4,
    repeatedYears: "2020, 2021, 2023, 2024",
  },
  {
    id: 2,
    text: "Compare and contrast traditional File Processing Systems with Database Management Systems (DBMS).",
    shortAnswer:
      "DBMS eliminates redundant copies, guarantees ACID transaction safety, enforces declarative integrity constraints, and provides high-level SQL querying unlike flat files.",
    longAnswer:
      "| Technical Dimension | Traditional OS File System | Database Management System (DBMS) |\n| :--- | :--- | :--- |\n| **Data Redundancy** | High; duplicated across flat files | Controlled and minimized via normalization |\n| **Data Consistency** | Prone to conflicting update anomalies | Enforced via declarative integrity invariants |\n| **Data Access** | Custom procedural file handling code | High-level declarative SQL querying |\n| **Concurrency** | Coarse file locking; lost updates | Granular row-level locking & ACID transactions |\n| **Crash Recovery** | Manual file copying; data corruption | Automated Write-Ahead Logging (WAL) recovery |\n| **Security** | Coarse OS permissions | Granular Role-Based Access Control (RBAC) |",
    chapter: "Unit: 1",
    section: "5M",
    marks: 5,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 3,
    repeatedYears: "2021, 2022, 2024",
  },
  {
    id: 3,
    text: "What is an Entity-Relationship (ER) Model? Explain Strong vs Weak Entity Sets with suitable examples.",
    shortAnswer:
      "Strong entity sets have their own primary key (single rectangle). Weak entity sets lack a primary key and depend on an identifying owner entity via a discriminator (double rectangle and diamond).",
    longAnswer:
      "An **Entity-Relationship (ER) Model** represents the conceptual schema of an enterprise using entities, relationships, and attributes.\n\n### Strong Entity Set:\n- Possesses a primary key formed strictly from its own attributes.\n- Represented by a single solid rectangle in ER diagrams.\n- *Example:* `EMPLOYEE` with Primary Key `Emp_ID`.\n\n### Weak Entity Set:\n- Lacks sufficient attributes to form its own primary key independently.\n- Depends on an identifying strong entity via an identifying relationship (`Owner_PK`).\n- Uses a **Partial Key (Discriminator)**—represented with a dashed underline—to differentiate rows among entities belonging to the same owner entity.\n- Represented by a **double rectangle** in ER diagrams; its identifying relationship is represented by a **double diamond**.\n- *Example:* `DEPENDENT` entity belonging to an `EMPLOYEE` parent. Primary Key = (`Emp_ID`, `Dependent_Name`).",
    chapter: "Unit: 1",
    section: "10M",
    marks: 10,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2023,
    frequency: 3,
    repeatedYears: "2021, 2022, 2023",
  },
  {
    id: 4,
    text: "Explain the different classifications of attributes in an ER diagram with standard graphical notations.",
    shortAnswer:
      "Attributes are classified into Simple, Composite, Single-valued, Multivalued (double ellipse), Derived (dashed ellipse), and Key (underlined text).",
    longAnswer:
      "1. **Simple (Atomic) Attribute:** Cannot be divided into sub-parts (e.g., `Salary`, `Age`). Drawn as a regular ellipse.\n2. **Composite Attribute:** Can be subdivided into smaller components (e.g., `Name` into `First_Name`, `Last_Name`). Drawn as an ellipse branching into child ellipses.\n3. **Single-valued Attribute:** Has only one value for an entity instance (e.g., `Aadhar_Number`).\n4. **Multivalued Attribute:** Can store multiple values for the same entity (e.g., `Phone_Numbers`, `Skills`). Drawn as a **double ellipse**.\n5. **Derived Attribute:** Its value is computed dynamically from other stored attributes (e.g., `Age` computed from `DOB`). Drawn as a **dashed ellipse**.\n6. **Key Attribute:** Uniquely identifies an entity instance (e.g., `Roll_No`). Drawn as an ellipse with an **underlined attribute name**.",
    chapter: "Unit: 1",
    section: "5M",
    marks: 5,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2023,
    frequency: 2,
    repeatedYears: "2020, 2023",
  },
  {
    id: 5,
    text: "Define and differentiate between Super Key, Candidate Key, Primary Key, and Foreign Key with relational table examples.",
    shortAnswer:
      "Super key uniquely identifies tuples; Candidate key is a minimal super key; Primary key is the chosen candidate key; Foreign key references a primary key in another table.",
    longAnswer:
      "- **Super Key:** Any set of one or more attributes that uniquely identifies a tuple in a relation (e.g., `{Roll_No}`, `{Roll_No, Name}`).\n- **Candidate Key:** A minimal Super Key containing no redundant attributes (e.g., `{Roll_No}` and `{Email}`).\n- **Primary Key:** The single Candidate Key officially chosen by the database designer to identify tuples uniquely throughout the schema (cannot be NULL).\n- **Foreign Key:** An attribute or set of attributes in a referencing table that references the Primary Key of a referenced table, enforcing referential integrity (e.g., `Dept_ID` in `STUDENT` referencing `DEPARTMENT.Dept_ID`).",
    chapter: "Unit: 1",
    section: "5M",
    marks: 5,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 3,
    repeatedYears: "2021, 2022, 2024",
  },
  {
    id: 6,
    text: "Detail the ER-to-Relational mapping algorithms for: (i) Strong Entities, (ii) Weak Entities, (iii) 1:N Relationships, and (iv) M:N Relationships.",
    shortAnswer:
      "Strong entities map to tables with their PK; Weak entities inherit Owner PK; 1:N embeds 1-side PK as FK into N-side; M:N creates a separate junction table combining both FKs.",
    longAnswer:
      "1. **Strong Entity Set:** Create a standalone table with all simple attributes. Choose the entity's primary key as the table primary key.\n   - *Example:* `EMPLOYEE(Emp_ID [PK], Name, Salary)`.\n2. **Weak Entity Set:** Create a table including all weak entity attributes. Add owner entity's Primary Key as a Foreign Key. Primary Key = (`Owner_PK` + `Partial_Key`).\n   - *Example:* `DEPENDENT(Emp_ID [FK], Dependent_Name, Relation)`.\n3. **1:N (One-to-Many) Relationship:** Take the primary key from the '1' side and embed it as a Foreign Key in the table on the 'N' side.\n   - *Example:* Embed `Dept_ID [FK]` in `EMPLOYEE` table.\n4. **M:N (Many-to-Many) Relationship:** Create a separate **Junction Table** containing Foreign Keys referencing both participating entity tables, plus relationship attributes.\n   - *Example:* `ENROLLS(Student_ID [FK], Course_ID [FK], Semester)`.",
    chapter: "Unit: 1",
    section: "10M",
    marks: 10,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 4,
    repeatedYears: "2020, 2022, 2023, 2024",
  },
  {
    id: 7,
    text: "Explain fundamental Relational Algebra operations with notation and examples: Selection, Projection, Union, Set Difference, and Cartesian Product.",
    shortAnswer:
      "Selection σ filters rows; Projection π picks columns; Union ∪ combines union-compatible sets; Difference - subtracts; Cartesian product × produces all tuple combinations.",
    longAnswer:
      "1. **Selection ($\\sigma_p(R)$):** Filters rows from relation $R$ that satisfy predicate condition $p$. *Example:* $\\sigma_{\\text{Salary} > 50000}(\\text{EMPLOYEE})$\n2. **Projection ($\\pi_{A_1, A_2}(R)$):** Selects specified columns while discarding unwanted columns and automatically eliminating duplicate tuples. *Example:* $\\pi_{\\text{Name, Dept}}(\\text{EMPLOYEE})$\n3. **Union ($R \\cup S$):** Returns all tuples present in relation $R$, $S$, or both (requires $R$ and $S$ to be union-compatible).\n4. **Set Difference ($R - S$):** Returns tuples that are in relation $R$ but NOT in relation $S$.\n5. **Cartesian Product ($R \\times S$):** Combines every tuple of $R$ with every tuple of $S$. Output degree = $\\text{deg}(R) + \\text{deg}(S)$; Cardinality = $|R| \\times |S|$.",
    chapter: "Unit: 1",
    section: "10M",
    marks: 10,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 4,
    repeatedYears: "2020, 2021, 2023, 2024",
  },
  {
    id: 8,
    text: "Explain Relational Integrity Constraints with examples: (a) Entity Integrity, (b) Referential Integrity, and (c) Domain Integrity.",
    shortAnswer:
      "Domain limits attribute types/values; Entity integrity ensures Primary Key is never NULL; Referential integrity guarantees Foreign Key points to a valid Primary Key or is NULL.",
    longAnswer:
      "1. **Domain Integrity:** Specifies that the value of each attribute must belong to the predefined domain set (e.g., valid data types, check constraints).\n2. **Entity Integrity:** Mandates that no attribute participating in the **Primary Key** can accept a NULL value, guaranteeing that every row is addressable.\n3. **Referential Integrity:** Mandates that a Foreign Key value in table $R_1$ must either match an existing Primary Key value in referenced table $R_2$ or be completely NULL. Enforced via `ON DELETE CASCADE` or `ON DELETE RESTRICT`.",
    chapter: "Unit: 1",
    section: "5M",
    marks: 5,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 3,
    repeatedYears: "2021, 2023, 2024",
  },
  {
    id: 9,
    text: "What is a SQL View? Differentiate between Dynamic Virtual Views and Materialized Views.",
    shortAnswer:
      "Virtual views execute the query on-the-fly and take 0 storage; Materialized views store query results physically on disk for instant OLAP analytics.",
    longAnswer:
      "A **View** is a virtual table derived dynamically from one or more base tables via a stored SQL `SELECT` query.\n\n### Comparison:\n- **Dynamic Virtual View (`CREATE VIEW`):**\n  - Physical Storage: Takes zero disk space; only query text is stored in Data Dictionary.\n  - Execution: Executes on-the-fly every time queried.\n  - Freshness: 100% real-time reflections of base table mutations.\n- **Materialized View (`CREATE MATERIALIZED VIEW`):**\n  - Physical Storage: Physically stores query results as real disk blocks.\n  - Execution: Instant retrieval without recomputing joins.\n  - Refresh: Requires periodic refresh schedules (On Commit / On Demand).",
    chapter: "Unit: 1",
    section: "5M",
    marks: 5,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 2,
    repeatedYears: "2023, 2024",
  },
  {
    id: 10,
    text: "What is an 'Unsafe Query' in Relational Calculus? Explain with an example.",
    shortAnswer:
      "A query whose result set can be infinite by evaluating values outside the active domain of the database (e.g. { t | NOT (t ∈ R) }).",
    longAnswer:
      "An expression in Tuple Relational Calculus (TRC) is **Unsafe** if it can generate an infinite number of tuples outside the active domain of the database.\n\n*Example:* `{ t | NOT (t ∈ EMPLOYEE) }`\n\nSince the complement contains all possible infinite records that are not in the `EMPLOYEE` relation, the result set is unbounded and mathematically unsafe. Relational engines enforce safety by requiring domain-independent expressions.",
    chapter: "Unit: 1",
    section: "2M",
    marks: 2,
    subjectId: "dbms",
    chapterNumber: 1,
    year: 2024,
    frequency: 2,
    repeatedYears: "2023, 2024",
  }
];
