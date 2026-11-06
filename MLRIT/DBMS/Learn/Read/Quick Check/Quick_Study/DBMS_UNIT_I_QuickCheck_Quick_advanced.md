## Question 1 (Module 1: Database Fundamentals and Engine Architecture)

**Statement:** Logical Data Independence ensures that changes to the conceptual schema (such as adding a new entity or attribute) do not require changes to existing external schemas or application programs.

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. Logical Data Independence is the capacity to change the conceptual schema without having to alter external schemas or existing application programs that do not reference the modified entities. (Key Takeaway: Logical data independence shields external views against conceptual schema expansion.)

---

## Question 2 (Module 2: Conceptual Database Design & ER Modeling)

**Question:** In formal ER semantics, what structural constraint characterizes a binary relationship set with cardinality ratio 1:1 and partial participation on both entity sets?

- **A)** Each entity in E1 maps to at most one in E2, each in E2 maps to at most one in E1, and entities in either set may exist unassociated
- **B)** Every entity in E1 must associate with every entity in E2 simultaneously
- **C)** Entities on either side are forbidden from possessing primary key attributes

**Correct Answer:** A

**Rationale:** A 1:1 relationship with partial participation on both sides bounds the maximum cardinality to 1 and minimum cardinality to 0 in both directions, meaning relationships are singular and optional for both participating entity sets. (Key Takeaway: 1:1 partial participation bounds associations to at most one and allows unlinked entities.)

---

## Question 3 (Module 3: Advanced ER and Extended ER (EER) Concepts)

**Statement:** In formal EER theory, Total Specialization dictates that the union of all subclass entity sets must equal the entire superclass entity set ($S = \bigcup_{i} C_i$).

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. Total specialization (completeness constraint, denoted by a double line) mandates that every entity in the superclass must be a member of at least one subclass, meaning the subclasses completely partition the superclass domain. (Key Takeaway: Total specialization enforces completeness where the superclass equals the union of its subclasses.)

---

## Question 4 (Module 4: Relational Model Foundations & Integrity Constraints)

**Question:** Is the Tuple Relational Calculus (TRC) expression {t | NOT (t in R)} considered a 'Safe' relational calculus expression?

- **A)** Yes
- **B)** No

**Correct Answer:** B (No)

**Rationale:** No. An expression is unsafe if it can evaluate to an infinite relation. Since the complement of relation R contains an infinite number of tuples outside the active domain of the database, {t | NOT (t in R)} is unsafe and prohibited. (Key Takeaway: Unsafe TRC expressions can produce infinite relations and are rejected.)

---

## Question 5 (Module 5: Logical Database Design (ER-to-Relational Translation))

**Question:** When mapping an N-ary relationship set ($N > 2$) where all participating entity sets have 'Many' cardinality into a relation, what forms the primary key of the resulting junction table?

- **A)** An arbitrarily selected single foreign key from one participating entity
- **B)** The composite combination of foreign keys referencing all N participating entity sets
- **C)** Composite keys are forbidden; a surrogate string column must be generated

**Correct Answer:** B

**Rationale:** When all participating entity sets have Many cardinality in an N-ary relationship, no proper subset of foreign keys can uniquely identify relationship instances. Hence, the primary key must be the composite combination of all N foreign keys. (Key Takeaway: N-ary relationships with Many cardinalities require composite primary keys combining all foreign keys.)

---

## Question 6 (Module 6: Relational Querying, Views & Schema Evolution)

**Statement:** In Relational Algebra, the Division operator (R / S) is the formal algebraic counterpart for queries involving Universal Quantification ('for all').

- **A)** True
- **B)** False

**Correct Answer:** A (True)

**Rationale:** True. The relational division operator $R(X, Y) \div S(Y)$ identifies tuples in $X$ that are associated with ALL tuples in $S(Y)$, expressing canonical universal quantification queries (such as 'find customers who bought ALL products'). (Key Takeaway: Relational division formally computes universal quantification queries.)

---
