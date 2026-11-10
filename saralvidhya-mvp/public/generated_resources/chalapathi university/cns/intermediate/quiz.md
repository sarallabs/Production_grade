# Pop Quiz: Chapter 1 — Security Concepts & Classical Encryption (Intermediate Level)

---

### Pop Quiz Question

**Mindmap Location:** Chapter 1 > 4. Classical Substitution Ciphers > Polygraphic Substitution > Hill Cipher  
**Depth Level:** L-2 / L-3  
**Bloom's Taxonomy:** Analyze / Apply  
**Difficulty:** Intermediate (Undergraduate Rigor)  

**Question:**  
In a Hill cipher operating on the English alphabet modulo 26, an engineer designs a $2 \times 2$ encryption key matrix:
$$K = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$$
Which of the following conditions is **both necessary and sufficient** to guarantee that the key matrix is valid (i.e., that a unique decryption matrix $K^{-1} \pmod{26}$ exists), and what is the underlying algebraic reason?

- **A)** $\det(K) = (ad - bc) \neq 0$ in the real numbers $\mathbb{R}$, because any non-zero real matrix has an inverse in matrix algebra.
- **B)** $\gcd(\det(K), 26) = 1$, because an integer element in modular arithmetic $\mathbb{Z}_{26}$ possesses a multiplicative inverse if and only if it is coprime to the modulus 26.
- **C)** $\det(K) \equiv 1 \pmod{26}$, because modular matrix inverses can only be computed when the matrix determinant is normalized to unity.
- **D)** Both $a, d$ must be odd primes and $b, c$ must be even integers, because the diagonal elements must dominate the off-diagonal elements under modulo 26 reduction.

---

### Detailed Answer & Analysis

<details open>
<summary><b>Click to View Solution & Complete Option Analysis</b></summary>

<br/>

**Correct Answer:** **Option B**

#### 💡 Why Option B is CORRECT:
* In classical linear algebra over the integers modulo 26 ($\mathbb{Z}_{26}$), the formula for the inverse of an invertible $2 \times 2$ matrix $K$ is:
  $$K^{-1} \equiv (\det(K))^{-1} \cdot \text{adj}(K) \pmod{26}$$
  where $\text{adj}(K) = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.
* For $K^{-1}$ to exist as an integer matrix modulo 26, the scalar determinant $\det(K) = (ad - bc) \pmod{26}$ must have a modular multiplicative inverse $x \in \mathbb{Z}_{26}$ satisfying:
  $$\det(K) \cdot x \equiv 1 \pmod{26}$$
* By Bézout's identity and the fundamental theorem of modular arithmetic, this modular inverse exists **if and only if** $\gcd(\det(K), 26) = 1$.
* Since $26 = 2 \times 13$, this means $\det(K)$ must **not be divisible by 2** (i.e., it must be odd) and **must not be divisible by 13** (i.e., $\det(K) \not\equiv 0, 13 \pmod{26}$).
* If $\gcd(\det(K), 26) = 1$, then $K^{-1}$ is guaranteed to exist and is uniquely determined. Hence, this condition is both necessary and sufficient.

---

#### ❌ Why the Other Options are INCORRECT:
* **Option A is False:** While $\det(K) \neq 0$ is the invertibility condition over the field of real numbers $\mathbb{R}$ or complex numbers $\mathbb{C}$, the ring $\mathbb{Z}_{26}$ is **not a field** because 26 is composite. For example, if $\det(K) = 2, 4, 13$, then $\det(K) \neq 0$, yet no multiplicative inverse exists modulo 26 (e.g., $2 \cdot x \equiv 1 \pmod{26}$ has no integer solution because $2x$ is always even while $26k+1$ is always odd).
* **Option C is False:** While $\det(K) \equiv 1 \pmod{26}$ is a sufficient condition (special linear group $SL(2, \mathbb{Z}_{26})$), it is **not necessary**. Any determinant coprime to 26 (such as $3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25$) yields a fully invertible key matrix. For example, a key matrix with $\det(K) = 3$ has inverse scalar $3^{-1} \equiv 9 \pmod{26}$ (since $3 \times 9 = 27 \equiv 1 \pmod{26}$).
* **Option D is False:** The parity of individual matrix entries ($a, b, c, d$) does not directly dictate invertibility; only the composite scalar value $\det(K) = ad - bc \pmod{26}$ determines invertibility. For example, if $a=3, d=1$ (both odd) and $b=1, c=1$ (both odd), $\det(K) = 3(1) - 1(1) = 2$, which is NOT invertible modulo 26 because $\gcd(2, 26) = 2 \neq 1$. Diagonal dominance is a property relevant to numerical convergence in linear systems, not algebraic invertibility in modular finite rings.

</details>

