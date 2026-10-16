const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve('public/generated_resources/mlrit/dbms/chapter_01/Learn/Listen/Transcript'),
  path.resolve('public/generated_resources/mlrit/dbms/chapter_01/podcasts/transcripts'),
  path.resolve('public/generated_resources/mlrit/dbms/chapter_01/Learn/Listen'),
];

targetDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const transcripts = {
  'DBMS_Long_Podcast.txt': `Welcome to the Deep Dive into Database Management Systems Unit 1. Today we are exploring the foundational architecture of modern database engines, from real-world conceptual modeling all the way to relational tables and SQL views.

Host 1: Welcome everyone. When you look at enterprise systems like banking, airline reservations, or social media platforms, they all rely on one foundational piece of software engineering: the Database Management System. But to truly appreciate what a DBMS does, we first have to understand what came before it: traditional operating system file processing.

Host 2: That's right. In the early days of computing, each application stored its data in separate flat files. And that created massive operational headaches. First was data redundancy: the same student address might be duplicated across five different department files. When the student moved, updating one file left old addresses in the other four, leading to data inconsistency.

Host 1: Exactly. Plus, there was no declarative querying. If an administrator wanted to find all students with a GPA above 3.5, a programmer had to write a brand new C or COBOL script just to scan the files. There was no atomic crash recovery, no unified security, and concurrent access could corrupt the files if two users wrote simultaneously.

Host 2: The DBMS solved this by centralizing data under a formal software engine. To organize this complexity, the database community developed the ANSI/SPARC Three-Schema Architecture. This framework splits the database system into three distinct abstraction levels: the Physical Level, the Conceptual or Logical Level, and the External or View Level.

Host 1: Let's break those down. At the lowest tier is the Physical or Internal Schema. This describes how data is actually arranged on storage media: disk blocks, page allocations, B-tree indexes, record clustering, and file organization.

Host 2: Next is the Conceptual or Logical Schema. This is the heart of the database. It describes what data is stored, the entities, attributes, relationships, and business integrity constraints. Crucially, it completely hides how the bits and blocks are structured on disk.

Host 1: And at the top tier is the External Schema, or View Level. Different users and client applications only see the subsets of data relevant to their role. An accountant sees billing information, while a registrar sees academic grades. This brings us to a vital concept for exams: Data Independence.

Host 2: Yes, there are two types. Physical Data Independence means we can modify physical storage structures, like adding an index or moving files to a faster SSD, without needing to rewrite our conceptual schema or application code. Logical Data Independence is even more powerful: it means we can alter the conceptual schema, like adding new attributes or tables, without breaking existing external views and user queries.

Host 1: Now, how do we design this conceptual schema in the first place? We use the Entity-Relationship (ER) model, pioneered by Peter Chen. The ER model starts with Entity Sets: collections of real-world objects of the same type, such as Students or Courses.

Host 2: Each entity has attributes. We have Simple attributes like Age, Composite attributes like Name which splits into First Name and Last Name, Single-valued attributes, and Multi-valued attributes like Phone Numbers, drawn with a double oval. And of course, Key attributes, which uniquely identify each entity and are underlined.

Host 1: What about relationships? A relationship is an association among two or more entities. Relationships have degrees: binary is between two entity sets, ternary between three. Relationships also have structural constraints: Cardinality Ratios and Participation Constraints.

Host 2: Cardinality defines the maximum number of relationship instances an entity can participate in: One-to-One (1:1), One-to-Many (1:N), and Many-to-Many (M:N). Participation constraints define whether an entity must exist in the relationship. Total participation, drawn with a double line, means every entity in the set must participate, like every Employee must belong to a Department. Partial participation means some entities might not participate.

Host 1: A very common exam topic is Weak Entity Sets. A weak entity does not possess sufficient attributes to form a primary key on its own. It depends on an identifying strong entity for existence. For example, a Dependent entity depends on an Employee entity. The weak entity has a partial key, or discriminator, drawn with a dashed underline. In ER diagrams, weak entities are drawn with a double rectangle, their identifying relationship with a double diamond, and their participation is always total.

Host 2: Moving beyond basic ER, we have Extended ER or EER modeling. EER introduces Specialization and Generalization. Specialization is top-down: taking a superclass like Employee and defining specialized subclasses like Salaried Employee and Hourly Employee. Generalization is bottom-up: combining common attributes from Car and Truck into a generalized Vehicle superclass.

Host 1: In EER, constraints are critical. We have Disjointness constraints: Disjoint (d) means an entity can belong to at most one subclass, while Overlapping (o) means an entity can belong to multiple subclasses simultaneously. We also have Completeness constraints: Total completeness means every superclass entity must belong to a subclass, while Partial allows an entity to remain solely in the superclass.

Host 2: Now that we have our diagram, how do we convert it into real SQL tables? We use the Relational Model and the formal 7-Step Mapping Algorithm. In the relational model, a Relation is a table, Tuples are rows, and Attributes are columns.

Host 1: Before mapping, we must respect Relational Integrity Constraints. Domain Constraints ensure attribute values match their permitted data type. The Entity Integrity Constraint states that no attribute of a primary key can ever contain a NULL value. And the Referential Integrity Constraint governs Foreign Keys: a foreign key value in a referencing relation must either match a valid primary key value in the referenced relation, or be entirely NULL.

Host 2: Let's review the 7-Step Mapping Algorithm. Step 1: Map regular strong entity sets into relations with all simple attributes. Step 2: Map weak entity sets into relations, including the primary key of the owner entity as a foreign key, forming a composite primary key with the partial key.

Host 1: Step 3: Map 1:1 binary relationships by either foreign key approach, merged relation, or cross-reference table. Step 4: Map 1:N binary relationships by placing the primary key of the 'one' side as a foreign key into the relation on the 'many' side.

Host 2: Step 5: Map M:N binary relationships by creating a brand new cross-reference relation whose primary key is the combination of foreign keys from both participating entity sets. Step 6: Map multi-valued attributes by creating a separate relation with the attribute and the parent entity's primary key. Step 7: Map n-ary relationships into a dedicated relation.

Host 1: Finally, once the tables exist in the database, we use SQL Views. A view is a virtual table defined by an underlying SQL query. Views provide powerful security by restricting column access, simplify complex multi-table joins for business analysts, and ensure seamless schema evolution without breaking downstream reporting tools.

Host 2: That covers the entire intellectual journey of Unit 1: moving from the problems of flat files to the 3-schema architecture, designing rich ER and EER diagrams, applying integrity constraints, executing the 7-step mapping algorithm, and publishing clean SQL views. Thank you for listening to this comprehensive deep dive!`,

  'DBMS_Short_Podcast.txt': `Welcome to the DBMS Unit 1 Quick Recap. In this session, we review the essential concepts, architectures, and exam checkpoints in under ten minutes.

First: Why do we use a DBMS instead of operating system files? File systems suffer from data redundancy, data inconsistency, lack of declarative query languages, difficulty in data isolation, no unified security, and vulnerability to system crashes. A DBMS centralizes data management with atomic transactions and multi-user concurrency control.

Second: The ANSI/SPARC Three-Schema Architecture. This model provides three layers of abstraction:
1. Physical or Internal Schema: How data is stored on disk, including page layouts and index files.
2. Conceptual or Logical Schema: What data is stored, including entity structures, relationships, and integrity rules.
3. External Schema or Views: Tailored representations customized for individual user roles.
Crucially, this architecture provides Physical Data Independence (changing disk layouts without altering conceptual schemas) and Logical Data Independence (changing conceptual schemas without breaking external views).

Third: Entity-Relationship (ER) Modeling.
- Entity Sets are collections of similar entities, drawn as rectangles.
- Attributes are drawn as ellipses. Simple attributes are atomic. Composite attributes split into sub-parts. Multi-valued attributes are drawn with double ellipses. Derived attributes use dashed ellipses. Primary key attributes are underlined.
- Weak Entity Sets have no independent primary key. They require an identifying relationship (double diamond), an identifying owner entity, and use a partial key or discriminator (dashed underline). Their participation is always total (double line).
- Cardinality Ratios describe relationship mappings: 1:1, 1:N, and M:N. Total participation means every entity must be involved; partial allows non-participating entities.

Fourth: Extended ER (EER) Concepts.
- Specialization: Top-down partitioning into specialized subclasses.
- Generalization: Bottom-up synthesis of shared attributes into a superclass.
- Disjoint (d) vs Overlapping (o) determines if an entity can belong to multiple subclasses. Total vs Partial completeness determines if superclass membership is required.

Fifth: The Relational Model and Integrity Constraints.
- Domain Constraints: Values must belong to the valid domain.
- Entity Integrity Constraint: Primary key attributes can never be NULL.
- Referential Integrity Constraint: Foreign keys must reference a valid primary key in the parent table or be NULL.

Sixth: The 7-Step ER-to-Relational Mapping.
1. Regular Entity: Creates a table with simple attributes.
2. Weak Entity: Creates a table with owner primary key as foreign key + discriminator as composite primary key.
3. 1:1 Relationship: Foreign key placed on the total participation side.
4. 1:N Relationship: Primary key of the 'one' side becomes a foreign key in the 'many' side.
5. M:N Relationship: Dedicated junction table combining primary keys from both sides.
6. Multi-valued Attribute: Separate table combining the attribute and the parent primary key.
7. N-ary Relationship: Separate relation with foreign keys from all participating entity sets.

Seventh: SQL Views.
Views are virtual tables created using CREATE VIEW. They present selected data without duplicating storage, restrict access to sensitive fields, simplify complex SQL queries, and provide logical data independence for client applications.

Keep these core principles, diagram notations, and mapping steps in mind for your exams and real-world database design!`,

  '1.How 3-Schema Architecture Prevents Data Chaos.txt': `Welcome to Microcast 1: How the 3-Schema Architecture Prevents Data Chaos.

In this episode, we explore the core framework of database systems: the ANSI/SPARC Three-Schema Architecture.

Why was the 3-schema architecture created? In early computing, application programs were tightly bound to the exact physical layout of files on storage disks. If a database administrator reordered record fields or added an index, every application reading that file had to be recompiled or rewritten.

The ANSI/SPARC committee solved this by establishing three layers of abstraction:
1. Physical / Internal Level: Describes low-level physical storage, such as block structures, record clustering, and B-tree index files.
2. Conceptual / Logical Level: Represents the community-wide logical view of the database. It models all entities, relationships, attributes, data types, and enterprise constraints, completely free of hardware details.
3. External / View Level: Defines tailored sub-schemas for specific user groups, ensuring privacy and ease of use.

The greatest benefit of this architecture is Data Independence:
- Physical Data Independence: The ability to modify physical storage structures (like adding an index or partitioning disk blocks) without having to alter the conceptual schema or application queries.
- Logical Data Independence: The ability to modify the conceptual schema (such as adding new attributes or tables) without altering existing external views or user programs.

By decoupling what data represents from how data is stored, modern DBMS engines guarantee high performance, security, and long-term maintainability.`,

  '2.ER Diagram Rules for DBMS Exams.txt': `Welcome to Microcast 2: ER Diagram Rules for DBMS Exams.

In this episode, we master the fundamental rules and visual notations of Entity-Relationship modeling.

When creating an ER diagram, you must know the exact standard notations:
1. Entity Sets: Represented by Rectangles. An entity is an object that exists in the real world, such as Student, Instructor, or Course.
2. Attributes: Represented by Ellipses connected to entity sets.
   - Key Attribute: Underlined text inside the ellipse. Uniquely identifies each entity instance.
   - Composite Attribute: An ellipse branching into sub-ellipses (e.g., Name branching into First_Name and Last_Name).
   - Multi-valued Attribute: Represented by a Double Ellipse (e.g., Phone_Numbers or Skill_Set).
   - Derived Attribute: Represented by a Dashed Ellipse (e.g., Age computed from Date_of_Birth).
3. Relationships: Represented by Diamonds. Relationships associate two or more entity sets.
4. Structural Constraints:
   - Cardinality Ratio: Specifies the maximum number of relationship instances an entity can participate in: One-to-One (1:1), One-to-Many (1:N), or Many-to-Many (M:N).
   - Participation Constraint: Specifies whether existence depends on the relationship. Total Participation is represented by a Double Line (meaning every entity must participate). Partial Participation is represented by a Single Line.

Remember these rules and notations to score maximum marks on your conceptual modeling questions!`,

  '3.Weak Entities and Extended ER Mechanics.txt': `Welcome to Microcast 3: Weak Entities and Extended ER Mechanics.

In this episode, we tackle one of the most frequently tested concepts: Weak Entity Sets and Extended ER (EER) modeling.

What is a Weak Entity Set?
A weak entity is an entity set that does not possess sufficient attributes to form a primary key of its own. It depends on an identifying strong entity for existence.
Key characteristics of weak entities:
1. Identifying Relationship: The relationship linking a weak entity to its owner is drawn as a Double Diamond.
2. Visual Representation: The weak entity itself is drawn with a Double Rectangle.
3. Participation: The participation of a weak entity in its identifying relationship is ALWAYS Total (double line).
4. Partial Key or Discriminator: The attribute that distinguishes among weak entities related to the same owner is underlined with a Dashed Line.
Example: An Employee has Dependents. Dependent has no unique ID across the company; its primary key is the Employee_ID plus the Dependent_Name.

Extended ER (EER) Mechanics:
1. Specialization: A top-down process where an entity set is divided into specialized subclasses (e.g., Employee specialized into Engineer, Secretary, and Technician).
2. Generalization: A bottom-up process where shared attributes of multiple entity sets are generalized into a higher-level superclass.
3. Disjointness Constraint: Denoted by (d) for Disjoint (an entity can belong to at most one subclass) or (o) for Overlapping (an entity can belong to multiple subclasses).
4. Completeness Constraint: Total completeness requires every superclass entity to belong to at least one subclass; Partial allows an entity to exist without subclass membership.`,

  '4.Relational Keys and Integrity Constraints.txt': `Welcome to Microcast 4: Relational Keys and Integrity Constraints.

In this episode, we break down relational data integrity and key classifications.

A relation is a two-dimensional table where rows are called tuples and columns are called attributes. To maintain correctness, relational engines enforce strict integrity constraints:

Key Classifications:
1. Superkey: A set of one or more attributes that uniquely identifies a tuple in a relation.
2. Candidate Key: A minimal superkey—a set of attributes that uniquely identifies a tuple, where removing any attribute destroys uniqueness.
3. Primary Key: The specific candidate key chosen by the database designer to identify tuples in the table. Primary keys cannot contain duplicate or NULL values.
4. Foreign Key: An attribute or set of attributes in one relation that references the primary key of another relation, establishing a link between them.

The Three Core Integrity Rules:
1. Domain Constraints: Every attribute value must be an atomic value belonging to the predefined domain and data type.
2. Entity Integrity Constraint: No primary key attribute may be NULL. If a primary key were null, we would lose the ability to uniquely identify and track that row.
3. Referential Integrity Constraint: A foreign key in a referencing relation must either match an existing primary key value in the referenced relation, or be entirely NULL. It prevents 'orphan records' and broken pointers across tables.

Mastering these rules guarantees relational consistency and prevent data corruption in production systems.`,

  '5.How ER Diagrams Become SQL Tables.txt': `Welcome to Microcast 5: How ER Diagrams Become SQL Tables.

In this episode, we examine the formal 7-Step ER-to-Relational Mapping Algorithm that turns conceptual diagrams into normalized SQL tables.

Here is the exact step-by-step algorithm:
Step 1: Map Regular Entity Sets.
Each strong entity set becomes a table containing all simple attributes. Choose one key attribute as the primary key.

Step 2: Map Weak Entity Sets.
Each weak entity set becomes a table. Include all simple attributes plus the primary key of the owner entity as a foreign key. The primary key of the weak table is the composite of the owner primary key and the partial key.

Step 3: Map 1:1 Binary Relationships.
Choose one participating table—preferably the one with total participation—and add the primary key of the other table as a foreign key. Include any relationship attributes.

Step 4: Map 1:N Binary Relationships.
Identify the entity on the 'many' side. Include the primary key of the 'one' side as a foreign key in the 'many' side relation, along with any relationship attributes.

Step 5: Map M:N Binary Relationships.
Create a brand new cross-reference (junction) relation. Its attributes are the primary keys of both participating entity sets, which together form the composite primary key of the new table.

Step 6: Map Multi-valued Attributes.
For each multi-valued attribute, create a new relation containing the attribute and the parent entity's primary key as a foreign key. The composite of both columns forms the primary key.

Step 7: Map N-ary Relationships.
For relationships involving three or more entity sets, create a separate relation containing the primary keys of all participating entity sets as foreign keys.

By systematically applying these 7 steps, any complex ER diagram converts smoothly into clean, reliable relational schemas.`,

  '6.SQL Views and Safe Schema Evolution.txt': `Welcome to Microcast 6: SQL Views and Safe Schema Evolution.

In this episode, we explore SQL Views and their role in database abstraction, security, and schema evolution.

What is a View?
A view is a virtual table whose contents are defined by an underlying SQL SELECT query. Unlike base tables, a standard view stores no data on disk; instead, the query is executed dynamically whenever the view is queried.

Syntax:
CREATE VIEW View_Name AS
SELECT column1, column2 FROM Table_Name WHERE condition;

Why do architects use Views?
1. Data Security and Access Control: Views allow administrators to expose only non-sensitive columns to specific users. For example, an employee view can display Name and Department while concealing Salary and Social Security Number.
2. Query Simplification: Views encapsulate complex multi-table joins, aggregations, and subqueries, allowing reporting tools and business analysts to query the view as if it were a simple table.
3. Logical Data Independence: When base tables are refactored or normalized, creating views with the original table schemas ensures client applications continue operating without code changes.

View Updatability Rules:
Under ISO SQL standards, a view is updatable if:
- It is defined over a single base table without joins.
- It contains the primary key of the underlying table.
- It contains no DISTINCT, GROUP BY, HAVING, or aggregate functions (SUM, AVG, COUNT).
- It contains no set operations (UNION, INTERSECT).

Views are essential tools for maintaining security, modularity, and clean enterprise software architecture.`,
};

targetDirs.forEach((dir) => {
  Object.entries(transcripts).forEach(([filename, content]) => {
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log(`Wrote ${fullPath} (${content.length} chars)`);
  });
});
console.log('All transcripts generated successfully!');
