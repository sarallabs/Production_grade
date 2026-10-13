## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Question:** How does Physical Data Independence insulate application programs when a database administrator alters physical storage from an unindexed heap file to a clustered B+ tree index?

- **A)** It requires rewriting application SQL queries with explicit pointer arithmetic
- **B)** The conceptual-to-internal schema mapping absorbs the modification, leaving conceptual schemas and application SQL completely unchanged
- **C)** It temporarily downgrades database transaction isolation to Read Uncommitted

**Correct Answer:** B

**Rationale:** Physical Data Independence guarantees that the physical/internal organization of data (file structures, indices, block layouts) can be altered without altering the conceptual schema or existing application queries. (Key Takeaway: Physical data independence decouples storage structures from conceptual queries.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Question:** Can every ternary relationship set $R(E_1, E_2, E_3)$ be losslessly decomposed into three binary relationships $R_{12}$, $R_{23}$, and $R_{13}$ without the risk of generating spurious tuples upon natural join?

- **A)** Yes
- **B)** No

**Correct Answer:** B (No)

**Rationale:** No. A ternary relationship enforces an atomic three-way simultaneous co-occurrence constraint. Decomposing into binary projections destroys this atomic binding, leading to phantom/spurious associations when joined. (Key Takeaway: Ternary relationships cannot in general be decomposed into binary relations without loss of semantic integrity.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Question:** Why must an Aggregation construct be introduced in Extended ER modeling when a relationship set needs to be associated with another relationship set?

- **A)** Because classic ER formalisms prohibit relationships between relationships; aggregation encapsulates a relationship and its entities into a higher-level composite entity
- **B)** To force all attributes of participating entities into Boyce-Codd Normal Form automatically
- **C)** Because weak entities cannot be queried by SQL without recursive table joins

**Correct Answer:** A

**Rationale:** Basic ER modeling only allows relationships between entities. When an association exists between a relationship and an entity, Aggregation treats the relationship and its participants as a single higher-level entity set. (Key Takeaway: Aggregation encapsulates relationships into composite entities to participate in further relationships.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Statement:** In formal relational theory, a Relation is defined as a subset of the Cartesian product of its attribute domains ($R \subseteq D_1 	imes D_2 	imes \dots 	imes D_n$) and is mathematically guaranteed to contain no duplicate tuples.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. In mathematical set theory, a relation is a set of tuples. Since sets by definition contain no duplicate elements, a true mathematical relation cannot contain duplicate rows. (Key Takeaway: Mathematical relations are sets and inherently disallow duplicate tuples.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Statement:** When mapping a weak entity set into a relational table, its primary key is formed solely by its partial key (discriminator), without referencing the identifying owner's primary key.

- **A)** True
- **B)** False

**Correct Answer:** B (False)

**Rationale:** False — reversed_relationship. A partial key alone is not globally unique. The primary key of the weak entity relation MUST be the composite union of the identifying parent's primary key and the weak entity's partial key. (Key Takeaway: A weak entity relation's primary key is the combination of the parent's primary key and its partial key.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Question:** Can an SQL View that is defined with a GROUP BY clause and an aggregate function AVG(salary) be directly updated using an SQL INSERT statement?

- **A)** Yes
- **B)** No

**Correct Answer:** B (No)

**Rationale:** No. Under ISO SQL standards, a view is not directly updatable if its definition includes grouping, aggregate functions, DISTINCT, or set operations, because the engine cannot map an inserted row back to an individual base table tuple without ambiguity. (Key Takeaway: Views defined with grouping or aggregate functions are strictly non-updatable.)

---
