# Chapter 1: Question Bank — Security Concepts and Classical Encryption Techniques (Advanced Level)

**Discipline:** Cryptography and Network Security (CNS)  
**Target Level:** Advanced Undergraduate / Postgraduate Research Rigor  
**Institutional Standard:** Chalapathi University Academic Framework  
**Total Questions:** 30 Questions (15 Short Answer Questions + 15 Long Answer Questions)  

---

## Part A: Short Answer Questions (15 Questions)

### Question 1
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Remember (L1) / Understand (L2)

**Question:**  
State the verbatim definitions of **Computer Security**, **Network Security**, and **Information Security** according to NIST SP 800-33 and RFC 2828.

**Answer:**  
1. **Computer Security:** The protection afforded to an automated information system in order to attain the applicable objectives of preserving the integrity, availability, and confidentiality of information system resources (includes hardware, software, firmware, information/data, and telecommunications).
2. **Network Security:** Measures taken to protect data during their transmission over networked systems and communication links, preventing unauthorized interception, alteration, or disruption.
3. **Information Security:** The overarching discipline and practices of protecting information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction in order to provide confidentiality, integrity, and availability.

---

### Question 2
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Define Claude Shannon's concept of **Perfect Secrecy (Unconditional Security)** and state its mathematical relationship in terms of conditional entropy $H(M \mid C)$.

**Answer:**  
A cryptosystem achieves perfect secrecy if the posterior probability of a plaintext $M$, given ciphertext $C$, equals the prior probability of $M$:
$$P(M = m \mid C = c) = P(M = m) \quad \forall m \in \mathcal{M}, \forall c \in \mathcal{C}$$
In terms of Shannon entropy:
- The mutual information between message $M$ and ciphertext $C$ is zero:
  $$I(M; C) = H(M) - H(M \mid C) = 0$$
- This implies:
  $$H(M \mid C) = H(M)$$
  The intercepted ciphertext yields zero information regarding the plaintext message.

---

### Question 3
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
State the algebraic condition under which a square matrix $K \in \mathbb{Z}_{26}^{m \times m}$ is invertible in the general linear group $GL(m, \mathbb{Z}_{26})$, and explain why $\det(K) = 13$ fails to produce a valid key matrix.

**Answer:**  
- **Invertibility Condition:**
  A matrix $K \in \mathbb{Z}_{26}^{m \times m}$ is invertible if and only if its determinant is coprime to 26:
  $$\gcd(\det(K), 26) = 1$$
- **Why $\det(K) = 13$ Fails:**
  The ring $\mathbb{Z}_{26}$ is not a field. Since $26 = 2 \times 13$, any element sharing a prime factor with 26 is a zero-divisor. The modular congruence:
  $$13 \cdot x \equiv 1 \pmod{26}$$
  requires $13x - 26y = 1 \implies 13(x - 2y) = 1$, which has no integer solution because 13 does not divide 1. Therefore, no modular multiplicative inverse exists for $\det(K) = 13$, making $K$ non-invertible.

---

### Question 4
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Compute the modular multiplicative inverse of $19$ modulo $26$ using the Extended Euclidean Algorithm.

**Answer:**  
We express $\gcd(26, 19) = 1$ as a linear combination $26x + 19y = 1$:
1. $26 = 1 \times 19 + 7$
2. $19 = 2 \times 7 + 5$
3. $7 = 1 \times 5 + 2$
4. $5 = 2 \times 2 + 1$
5. $2 = 2 \times 1 + 0$

Back-substituting for the remainder $1$:
$$1 = 5 - 2 \times 2$$
$$1 = 5 - 2 \times (7 - 1 \times 5) = 3 \times 5 - 2 \times 7$$
$$1 = 3 \times (19 - 2 \times 7) - 2 \times 7 = 3 \times 19 - 8 \times 7$$
$$1 = 3 \times 19 - 8 \times (26 - 1 \times 19) = 11 \times 19 - 8 \times 26$$
Reducing modulo 26:
$$11 \times 19 \equiv 1 \pmod{26}$$
Therefore:
$$19^{-1} \equiv 11 \pmod{26}$$

---

### Question 5
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Explain why the **Two-Time Pad** vulnerability completely destroys the unconditional security of the Vernam cipher.

**Answer:**  
- Suppose two messages $M_1$ and $M_2$ are encrypted using the identical one-time pad key $K$:
  $$C_1 = M_1 \oplus K, \quad C_2 = M_2 \oplus K$$
- An adversary intercepts $C_1$ and $C_2$ and computes their bitwise XOR sum:
  $$C_1 \oplus C_2 = (M_1 \oplus K) \oplus (M_2 \oplus K) = M_1 \oplus M_2$$
- The secret key $K$ is completely eliminated from the expression.
- Because natural language has low entropy and high redundancy, statistical frequency analysis, crib dragging, and n-gram scoring allow the adversary to decompose $M_1 \oplus M_2$ into the individual messages $M_1$ and $M_2$ without the key.

---

### Question 6
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
State the definition and significance of the **Index of Coincidence ($I_c$)** in classical cryptanalysis.

**Answer:**  
- **Definition:** The probability that two letters chosen at random from a given ciphertext string of length $N$ are identical:
  $$I_c = \frac{\sum_{i=0}^{25} f_i(f_i - 1)}{N(N - 1)}$$
- **Significance:** $I_c$ is invariant under monoalphabetic substitution ($I_{\text{English}} \approx 0.068$), but drops toward $1/26 \approx 0.0385$ for polyalphabetic ciphers as the period increases. This allows an analyst to determine whether a cipher is monoalphabetic or polyalphabetic, and to estimate the keyword length $m$.

---

### Question 7
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
In the cryptanalysis of rotor machines, what is the mathematical consequence of the **reflector (Umkehrwalze)** having no fixed points?

**Answer:**  
- The reflector wiring $R$ is constructed such that $\forall x \in \mathbb{Z}_{26}, R(x) \neq x$, and $R = R^{-1}$.
- Because rotor rotations and plugboard connections are permutations that preserve the cycle structure under conjugation, the composite machine transformation $\Pi$ inherits this fixed-point-free property:
  $$\forall x \in \mathbb{Z}_{26}, \quad \Pi(x) \neq x$$
- **Consequence:** A letter can **never encrypt to itself**. In Turing's Bombe cryptanalysis, if a crib word letter matches the ciphertext letter at the same index, that rotor hypothesis is mathematically eliminated with $100\%$ certainty.

---

### Question 8
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
Differentiate between an **Adaptive Chosen-Ciphertext Attack (CCA2)** and a **Non-Adaptive Chosen-Ciphertext Attack (CCA1)**.

**Answer:**  
- **CCA1 (Lunchtime Attack):** The adversary has access to a decryption oracle only *prior* to receiving the target challenge ciphertext $C^*$. Once $C^*$ is issued, oracle access is terminated.
- **CCA2 (Adaptive CCA):** The adversary maintains access to the decryption oracle both *before and after* receiving the challenge ciphertext $C^*$, with the sole restriction that they cannot query the oracle on $C^*$ itself.

---

### Question 9
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Calculate the maximum steganographic payload (in bytes) that can be embedded into an uncompressed $1920 \times 1080$ 24-bit RGB bitmap image using 1-bit LSB substitution per channel.

**Answer:**  
- Total pixels = $1920 \times 1080 = 2,073,600$ pixels.
- Each 24-bit pixel consists of 3 color channels (Red, Green, Blue).
- Total available channels = $2,073,600 \times 3 = 6,220,800$ channel bytes.
- Using 1 LSB bit per channel yields $6,220,800$ secret bits.
- Converting to bytes:
  $$\text{Payload} = \frac{6,220,800 \text{ bits}}{8 \text{ bits/byte}} = 777,600 \text{ bytes} \approx 759.38 \text{ KB}$$

---

### Question 10
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
State the **Strict Avalanche Criterion (SAC)** as a formal measure of Shannon's diffusion property.

**Answer:**  
A cryptographic transformation satisfies the **Strict Avalanche Criterion (SAC)** if, whenever a single input bit is complemented (flipped), every output bit changes with a probability of exactly one half:
$$\Pr\left[C_j(P \oplus e_i) \neq C_j(P)\right] = \frac{1}{2} \quad \forall i, j$$
where $e_i$ is a unit basis vector with a 1 at index $i$.

---

### Question 11
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Why does the **Autokey Cipher** fail to achieve perfect secrecy despite generating a non-periodic key stream?

**Answer:**  
- In the Autokey cipher, the key stream is formed by concatenating an initial keyword with the **plaintext itself**: $K' = K_{\text{seed}} \parallel P$.
- Perfect secrecy requires that the key stream be independent and uniformly distributed ($H(K) = |K|$).
- Because the key stream consists of natural language text, it possesses the same high redundancy ($D \approx 3.2$ bits/char) and non-uniform n-gram statistics as English.
- The cipher can be solved via crib dragging of common high-frequency English words without needing key repetition.

---

### Question 12
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
Define the **Chi-Square ($\chi^2$) Goodness-of-Fit** statistic as utilized in automated cryptanalysis of monoalphabetic ciphers.

**Answer:**  
$$\chi^2(s) = \sum_{i=0}^{25} \frac{(f_{(i+s) \pmod{26}} - N \cdot p_i)^2}{N \cdot p_i}$$
where $f_j$ is the observed count of letter $j$ in the ciphertext of length $N$, $p_i$ is the expected probability of letter $i$ in standard English, and $s$ is the tested alphabet shift. The candidate shift $s$ that minimizes $\chi^2(s)$ is the true key.

---

### Question 13
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
Under ITU-T Recommendation X.800, which security mechanism is uniquely suited to defend against **Traffic Analysis**, and why must it be implemented at lower network layers?

**Answer:**  
- **Mechanism:** **Traffic Padding**.
- **Reason:** Traffic padding continuously transmits pseudorandom dummy bits when no real traffic is being sent, maintaining a constant transmission rate and packet size.
- **Layer Placement:** Higher protocol layers strip headers and reveal transport activity. Only implementation at the Physical or Data Link / Network layer hides packet origins, destinations, lengths, and burst timings from external passive sniffers.

---

### Question 14
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Express the **Hill Cipher Known-Plaintext Attack** as a matrix equation and specify the condition required for the attack to succeed.

**Answer:**  
- Let $X = [\mathbf{p}_1 \; \dots \; \mathbf{p}_m]$ be an $m \times m$ matrix formed by $m$ known plaintext column vectors, and $Y = [\mathbf{c}_1 \; \dots \; \mathbf{c}_m]$ be the corresponding ciphertext matrix.
- Equation:
  $$Y \equiv K \cdot X \pmod{26}$$
- **Success Condition:** The attack succeeds if and only if $X$ is invertible in $GL(m, \mathbb{Z}_{26})$:
  $$\gcd(\det(X), 26) = 1$$
  When this holds, the key matrix is recovered by $K \equiv Y \cdot X^{-1} \pmod{26}$.

---

### Question 15
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
State **Cachin's Definition of Information-Theoretic Steganographic Security**.

**Answer:**  
A steganographic system is defined as **$\epsilon$-secure** against passive eavesdropping if the relative entropy (Kullback-Leibler divergence) between the cover document probability distribution $P_C$ and the stego document distribution $P_S$ satisfies:
$$D_{\text{KL}}(P_C \parallel P_S) = \sum_{x \in \Omega} P_C(x) \log \frac{P_C(x)}{P_S(x)} \le \epsilon$$
When $\epsilon = 0$, the system is **perfectly secure** (the cover and stego media are statistically indistinguishable).

---

## Part B: Long Answer Questions (15 Questions)

### Question 16
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Evaluate (L5) / Analyze (L4)

**Question:**  
Provide a rigorous mathematical treatment of **Shannon's Theorem of Perfect Secrecy**:
1. Formulate the cryptosystem as a probabilistic experiment over finite random variables $M, C, K$.
2. State the definition of perfect secrecy and prove that $P(M = m \mid C = c) = P(M = m) \iff P(C = c \mid M = m) = P(C = c)$.
3. Prove Shannon's Theorem that perfect secrecy requires the key entropy to be bounded below by the message entropy: $H(K) \ge H(M)$.
4. Discuss the physical and logistical consequences of this bound for modern internet architectures.

**Answer:**  
#### 1. Probabilistic Cryptosystem Formulation:
Let $\mathcal{M}, \mathcal{C}, \mathcal{K}$ be finite sets representing plaintext, ciphertext, and key spaces. Let $M, C, K$ be random variables taking values in these spaces.
- Plaintext distribution: $P(M = m)$ for $m \in \mathcal{M}$.
- Key distribution: $P(K = k)$ for $k \in \mathcal{K}$ (assumed chosen independently of $M$: $P(M = m, K = k) = P(M = m) P(K = k)$).
- Encryption: A deterministic function $c = E(k, m)$.
- Decryption: A deterministic function $m = D(k, c)$ satisfying $D(k, E(k, m)) = m$.

#### 2. Equivalence Proof:
- **Definition:** Perfect secrecy holds if for all $m \in \mathcal{M}$ and all $c \in \mathcal{C}$ with $P(C = c) > 0$:
  $$P(M = m \mid C = c) = P(M = m)$$
- Applying Bayes' Rule:
  $$P(M = m \mid C = c) = \frac{P(C = c \mid M = m) P(M = m)}{P(C = c)}$$
- Substituting $P(M = m \mid C = c) = P(M = m)$:
  $$\frac{P(C = c \mid M = m) P(M = m)}{P(C = c)} = P(M = m)$$
- Dividing both sides by $P(M = m)$ (for $P(M = m) > 0$):
  $$P(C = c \mid M = m) = P(C = c)$$
- This proves that the random variables $M$ and $C$ are mutually independent:
  $$I(M; C) = H(M) - H(M \mid C) = 0 \iff H(M \mid C) = H(M)$$

#### 3. Proof that $H(K) \ge H(M)$:
- From information theory, for any functions $C = E(K, M)$ and $M = D(K, C)$:
  $$H(M \mid C, K) = 0 \quad (\text{since } K \text{ and } C \text{ determine } M \text{ uniquely})$$
- Consider the conditional entropy relation:
  $$H(M \mid C) \le H(M, K \mid C) = H(K \mid C) + H(M \mid C, K) = H(K \mid C)$$
- Because conditioning reduces entropy:
  $$H(K \mid C) \le H(K)$$
- Under perfect secrecy, $H(M \mid C) = H(M)$. Substituting this into the inequality:
  $$H(M) = H(M \mid C) \le H(K \mid C) \le H(K)$$
  $$\therefore H(K) \ge H(M)$$
- If all keys in $\mathcal{K}$ are equiprobable, $H(K) = \log_2 |\mathcal{K}|$. Since $H(M) \le \log_2 |\mathcal{M}|$, if the message space is uniformly distributed, we have:
  $$|\mathcal{K}| \ge |\mathcal{M}|$$
  The key length in bits must be at least as large as the message length.

#### 4. Engineering & Logistical Consequences:
- **Impracticability in Open Networks:** Transmitting gigabytes of streaming video or database transfers under unconditional security requires generating and distributing gigabytes of truly random key bits over a physically secure channel prior to transmission.
- **The Key Distribution Paradox:** If a secure channel exists that can transport a key of size $|M|$, that same channel could have been used to transport $M$ directly, rendering encryption redundant.
- **Modern Resolution:** Practical cryptography abandons unconditional security in favor of **computational security** (e.g., AES-GCM, RSA, ECC), where keys are short (128–256 bits) and security rests on the computational intractability of mathematical problems.

---

### Question 17
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Apply (L3) / Evaluate (L5)

**Question:**  
Examine the linear algebra of the **Hill Cipher** over $\mathbb{Z}_{26}$:
Given the $2 \times 2$ encryption matrix:
$$K = \begin{pmatrix} 9 & 4 \\ 5 & 7 \end{pmatrix}$$
1. Formulate the invertibility criteria in the general linear group $GL(2, \mathbb{Z}_{26})$ and verify whether $K$ is invertible.
2. Calculate the modular multiplicative inverse of the determinant showing all intermediate steps of the Extended Euclidean Algorithm.
3. Derive the exact decryption matrix $K^{-1} \pmod{26}$.
4. Encrypt the plaintext **`"EXAM"`** and show step-by-step decryption of the resulting ciphertext vector to recover the original plaintext.

**Answer:**  
#### 1. Invertibility Verification:
- Compute the scalar determinant:
  $$\det(K) = (ad - bc) = (9 \times 7 - 4 \times 5) = 63 - 20 = 43 \equiv 17 \pmod{26}$$
- Verify coprimality:
  $$\gcd(17, 26) = 1$$
- Since $17$ is odd and not divisible by $13$, $K$ is nonsingular and belongs to $GL(2, \mathbb{Z}_{26})$.

#### 2. Extended Euclidean Algorithm for $17^{-1} \pmod{26}$:
- Solve $17x + 26y = 1$:
  - $26 = 1 \times 17 + 9$
  - $17 = 1 \times 9 + 8$
  - $9 = 1 \times 8 + 1$
- Back-substitution:
  - $1 = 9 - 1 \times 8$
  - $1 = 9 - 1 \times (17 - 1 \times 9) = 2 \times 9 - 1 \times 17$
  - $1 = 2 \times (26 - 1 \times 17) - 1 \times 17 = 2 \times 26 - 3 \times 17$
- Modulo 26 reduction:
  $$-3 \times 17 \equiv 1 \pmod{26} \implies x \equiv -3 \equiv 23 \pmod{26}$$
- Verification: $17 \times 23 = 391 = 15 \times 26 + 1 \equiv 1 \pmod{26}$.
- Hence: $\det(K)^{-1} \equiv 23 \pmod{26}$.

#### 3. Decryption Matrix $K^{-1} \pmod{26}$:
- Adjugate matrix:
  $$\text{adj}(K) = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = \begin{pmatrix} 7 & -4 \\ -5 & 9 \end{pmatrix} \equiv \begin{pmatrix} 7 & 22 \\ 21 & 9 \end{pmatrix} \pmod{26}$$
- Decryption matrix:
  $$K^{-1} \equiv 23 \cdot \begin{pmatrix} 7 & 22 \\ 21 & 9 \end{pmatrix} \pmod{26}$$
  - $23 \times 7 = 161 = 6 \times 26 + 5 \equiv 5$
  - $23 \times 22 = 23 \times (-4) = -92 \equiv -92 + 104 = 12$
  - $23 \times 21 = 23 \times (-5) = -115 \equiv -115 + 130 = 15$
  - $23 \times 9 = 207 = 7 \times 26 + 25 \equiv 25$
  $$K^{-1} = \begin{pmatrix} 5 & 12 \\ 15 & 25 \end{pmatrix}$$

#### 4. Encryption and Decryption of `"EXAM"`:
- Numerical mappings: `E` = 4, `X` = 23, `A` = 0, `M` = 12.
- **Block 1: `"EX"` = $\begin{pmatrix} 4 \\ 23 \end{pmatrix}$:**
  $$C_1 = \begin{pmatrix} 9 & 4 \\ 5 & 7 \end{pmatrix} \begin{pmatrix} 4 \\ 23 \end{pmatrix} = \begin{pmatrix} 9(4) + 4(23) \\ 5(4) + 7(23) \end{pmatrix} = \begin{pmatrix} 36 + 92 \\ 20 + 161 \end{pmatrix} = \begin{pmatrix} 128 \\ 181 \end{pmatrix} \pmod{26}$$
  - $128 \pmod{26} = 128 - 104 = 24 \rightarrow$ **`Y`**
  - $181 \pmod{26} = 181 - 156 = 25 \rightarrow$ **`Z`**
- **Block 2: `"AM"` = $\begin{pmatrix} 0 \\ 12 \end{pmatrix}$:**
  $$C_2 = \begin{pmatrix} 9 & 4 \\ 5 & 7 \end{pmatrix} \begin{pmatrix} 0 \\ 12 \end{pmatrix} = \begin{pmatrix} 9(0) + 4(12) \\ 5(0) + 7(12) \end{pmatrix} = \begin{pmatrix} 48 \\ 84 \end{pmatrix} \pmod{26}$$
  - $48 \pmod{26} = 22 \rightarrow$ **`W`**
  - $84 \pmod{26} = 84 - 78 = 6 \rightarrow$ **`G`**
- **Ciphertext:** **`"YZWG"`**

- **Decryption of Block 1 $\begin{pmatrix} 24 \\ 25 \end{pmatrix}$:**
  $$P_1 = \begin{pmatrix} 5 & 12 \\ 15 & 25 \end{pmatrix} \begin{pmatrix} 24 \\ 25 \end{pmatrix} = \begin{pmatrix} 5(24) + 12(25) \\ 15(24) + 25(25) \end{pmatrix} = \begin{pmatrix} 120 + 300 \\ 360 + 625 \end{pmatrix} = \begin{pmatrix} 420 \\ 985 \end{pmatrix} \pmod{26}$$
  - $420 \pmod{26} = 420 - 416 = 4 \rightarrow$ **`E`**
  - $985 \pmod{26} = 985 - 962 = 23 \rightarrow$ **`X`**
  - Output: **`"EX"`** (Matched exactly).

---

### Question 18
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Formulate and execute a **Known-Plaintext Attack (KPA)** on a $2 \times 2$ Hill Cipher:
An adversary intercepts the plaintext message **`"FRIDAY"`** and its corresponding ciphertext **`"PQCFKU"`**.
1. Set up the matrix equations representing the linear system over $\mathbb{Z}_{26}$.
2. Verify the invertibility of the plaintext matrix $X$.
3. Compute the inverse matrix $X^{-1} \pmod{26}$.
4. Solve for the secret key matrix $K = Y X^{-1} \pmod{26}$.

**Answer:**  
#### 1. Setup of the Linear System:
- Character values:
  - Plaintext `"FRIDAY"`:
    - `"FR"`: $p_1 = \begin{pmatrix} 5 \\ 17 \end{pmatrix}$
    - `"ID"`: $p_2 = \begin{pmatrix} 8 \\ 3 \end{pmatrix}$
    - `"AY"`: $p_3 = \begin{pmatrix} 0 \\ 24 \end{pmatrix}$
  - Ciphertext `"PQCFKU"`:
    - `"PQ"`: $c_1 = \begin{pmatrix} 15 \\ 16 \end{pmatrix}$
    - `"CF"`: $c_2 = \begin{pmatrix} 2 \\ 5 \end{pmatrix}$
    - `"KU"`: $c_3 = \begin{pmatrix} 10 \\ 20 \end{pmatrix}$
- Form matrices using the first two vector pairs:
  $$X = [p_1 \; p_2] = \begin{pmatrix} 5 & 8 \\ 17 & 3 \end{pmatrix}, \quad Y = [c_1 \; c_2] = \begin{pmatrix} 15 & 2 \\ 16 & 5 \end{pmatrix}$$
- Linear equation:
  $$Y \equiv K \cdot X \pmod{26}$$

#### 2. Invertibility of Plaintext Matrix $X$:
$$\det(X) = (5 \times 3 - 8 \times 17) = 15 - 136 = -121 \equiv -121 + 130 = 9 \pmod{26}$$
$$\gcd(9, 26) = 1$$
Since $9$ is coprime to 26, $X$ is invertible in $GL(2, \mathbb{Z}_{26})$.

#### 3. Inversion of $X$:
- Find $9^{-1} \pmod{26}$:
  - $9 \times 3 = 27 \equiv 1 \pmod{26} \implies 9^{-1} \equiv 3 \pmod{26}$.
- Adjugate matrix:
  $$\text{adj}(X) = \begin{pmatrix} 3 & -8 \\ -17 & 5 \end{pmatrix} \equiv \begin{pmatrix} 3 & 18 \\ 9 & 5 \end{pmatrix} \pmod{26}$$
- Modular inverse:
  $$X^{-1} \equiv 3 \cdot \begin{pmatrix} 3 & 18 \\ 9 & 5 \end{pmatrix} = \begin{pmatrix} 9 & 54 \\ 27 & 15 \end{pmatrix} \equiv \begin{pmatrix} 9 & 2 \\ 1 & 15 \end{pmatrix} \pmod{26}$$

#### 4. Recovering the Secret Key Matrix $K$:
$$K \equiv Y \cdot X^{-1} \pmod{26} = \begin{pmatrix} 15 & 2 \\ 16 & 5 \end{pmatrix} \begin{pmatrix} 9 & 2 \\ 1 & 15 \end{pmatrix} \pmod{26}$$
- Row 1, Col 1: $15(9) + 2(1) = 135 + 2 = 137 \equiv 137 - 130 = 7$
- Row 1, Col 2: $15(2) + 2(15) = 30 + 30 = 60 \equiv 60 - 52 = 8$
- Row 2, Col 1: $16(9) + 5(1) = 144 + 5 = 149 \equiv 149 - 130 = 19$
- Row 2, Col 2: $16(2) + 5(15) = 32 + 75 = 107 \equiv 107 - 104 = 3$
$$K = \begin{pmatrix} 7 & 8 \\ 19 & 3 \end{pmatrix}$$
- **Verification using third block `"AY"` = $\begin{pmatrix} 0 \\ 24 \end{pmatrix}$:**
  $$K \begin{pmatrix} 0 \\ 24 \end{pmatrix} = \begin{pmatrix} 7(0) + 8(24) \\ 19(0) + 3(24) \end{pmatrix} = \begin{pmatrix} 192 \\ 72 \end{pmatrix} \equiv \begin{pmatrix} 10 \\ 20 \end{pmatrix} \pmod{26}$$
  Indices $(10, 20)$ map to **`"KU"`**, confirming exact match.

---

### Question 19
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Analyze (L4) / Evaluate (L5)

**Question:**  
Derive the **Friedman Test** for estimating the period length of a polyalphabetic Vigenère cipher:
1. Define the Index of Coincidence ($I_c$) and express its expected value for a monoalphabetic distribution versus a uniform random distribution.
2. Model the probability of character collision in a ciphertext of length $N$ encrypted with period $m$.
3. Complete the algebraic derivation solving for $m$ in terms of $N$ and $I_c$.
4. Explain how this analysis combines with the Kasiski examination in automated cryptanalysis pipelines.

**Answer:**  
#### 1. Expected Index of Coincidence:
The Index of Coincidence $I_c$ of a text $C$ of length $N$ with letter frequencies $f_0, \dots, f_{25}$ is:
$$I_c = \sum_{i=0}^{25} \frac{f_i(f_i - 1)}{N(N - 1)}$$
- **For natural language (English):** Let $p_i$ be the population probability of letter $i$:
  $$E[I_{\text{English}}] = \sum_{i=0}^{25} p_i^2 \approx 0.068$$
- **For uniform random text (flat distribution $p_i = 1/26$):**
  $$E[I_{\text{Random}}] = \sum_{i=0}^{25} \left(\frac{1}{26}\right)^2 = \frac{26}{676} = \frac{1}{26} \approx 0.0385$$

#### 2. Probabilistic Collision Model:
Assume a ciphertext of length $N$ is produced by a Vigenère cipher with keyword length $m$.
Divide the ciphertext into $m$ columns, each of length approximately $n \approx N/m$.
When two characters are selected uniformly at random from the total ciphertext:
- The probability that both characters come from the **same column** is:
  $$P(\text{same}) = \frac{m \cdot \binom{N/m}{2}}{\binom{N}{2}} = \frac{m \cdot \frac{N/m(N/m - 1)}{2}}{\frac{N(N - 1)}{2}} = \frac{N - m}{m(N - 1)}$$
- The probability that they come from **different columns** is:
  $$P(\text{diff}) = 1 - P(\text{same}) = 1 - \frac{N - m}{m(N - 1)} = \frac{m(N - 1) - (N - m)}{m(N - 1)} = \frac{(m - 1)N}{m(N - 1)}$$

If two characters are from the same column, they were encrypted by the same key letter; thus, their collision probability is $I_{\text{English}} \approx 0.068$.
If they are from different columns, they were encrypted by different, independent shifts; thus, their collision probability is $I_{\text{Random}} \approx 0.0385$.

#### 3. Derivation of Period $m$:
The overall expected index of coincidence $I_c$ is the weighted sum:
$$I_c = P(\text{same}) \cdot I_{\text{English}} + P(\text{diff}) \cdot I_{\text{Random}}$$
$$I_c = \frac{N - m}{m(N - 1)} (0.068) + \frac{(m - 1)N}{m(N - 1)} (0.0385)$$
Multiply both sides by $m(N - 1)$:
$$m(N - 1) I_c = (N - m)(0.068) + (m - 1)N (0.0385)$$
Expand terms:
$$m(N - 1) I_c = 0.068 N - 0.068 m + 0.0385 m N - 0.0385 N$$
$$m(N - 1) I_c = (0.068 - 0.0385) N + m(0.0385 N - 0.068)$$
$$m(N - 1) I_c = 0.0295 N + m(0.0385 N - 0.068)$$
Group terms involving $m$ on the left:
$$m \left[ (N - 1) I_c - 0.0385 N + 0.068 \right] = 0.0295 N$$
Solving for $m$:
$$m \approx \frac{0.027 N}{(N - 1) I_c - 0.038 N + 0.065}$$
(using empirical coefficient adjustments for finite sample bias).

#### 4. Pipeline Integration with Kasiski Examination:
- **Phase 1 (Kasiski):** Identifies exact candidate divisors by finding $\gcd$ of repeated trigram distances.
- **Phase 2 (Friedman):** Provides a continuous statistical estimate of $m$. The analyst cross-references the Friedman estimate with the Kasiski divisor candidates to pinpoint $m$ with near $100\%$ confidence.
- **Phase 3 (Slice Resolution):** Slices $S_0, \dots, S_{m-1}$ are generated and individual keys are found via mutual index of coincidence or Chi-Square tests.

---

### Question 20
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Provide a group-theoretic and cryptanalytic dissection of the **Enigma Rotor Machine**:
1. Formulate the composite permutation mapping through the plugboard, three rotating cylinders, and the reflector.
2. Prove that the machine operation is an involution ($\Pi = \Pi^{-1}$).
3. Prove that the machine produces derangements ($\forall x, \Pi(x) \neq x$).
4. Explain how Marian Rejewski and Alan Turing exploited these properties in the design of the cryptanalytic Bombe.

**Answer:**  
#### 1. Mathematical Formulation:
Let the alphabet be $\mathbb{Z}_{26}$.
- Let $\rho(x) = (x + 1) \pmod{26}$ be the cyclic shift permutation.
- Rotor $i$ has internal permutation $\pi_i \in S_{26}$. When rotated by offset $t_i \in \mathbb{Z}_{26}$, the effective permutation is the conjugate:
  $$P_i(t_i) = \rho^{-t_i} \circ \pi_i \circ \rho^{t_i}$$
- Plugboard $S$ is a permutation composed of disjoint transpositions (swaps) and fixed points, hence an involution: $S = S^{-1}$.
- Reflector $R$ is a wired disc pairing all 26 contacts into 13 disjoint 2-cycles with no fixed points:
  $$R = (\alpha_1 \; \beta_1)(\alpha_2 \; \beta_2) \dots (\alpha_{13} \; \beta_{13})$$
  Thus, $R = R^{-1}$ and $\forall x \in \mathbb{Z}_{26}, R(x) \neq x$.
- The total transformation for a 3-rotor machine is:
  $$\Pi_{\text{Enigma}} = S \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R \circ P_3 \circ P_2 \circ P_1 \circ S$$

#### 2. Proof of Involution ($\Pi = \Pi^{-1}$):
Compute the inverse of $\Pi_{\text{Enigma}}$:
$$\Pi^{-1} = (S \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R \circ P_3 \circ P_2 \circ P_1 \circ S)^{-1}$$
Using the anti-homomorphism property of composition $(f \circ g)^{-1} = g^{-1} \circ f^{-1}$:
$$\Pi^{-1} = S^{-1} \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R^{-1} \circ (P_3^{-1})^{-1} \circ (P_2^{-1})^{-1} \circ (P_1^{-1})^{-1} \circ S^{-1}$$
Since $S^{-1} = S$, $R^{-1} = R$, and $(P_i^{-1})^{-1} = P_i$:
$$\Pi^{-1} = S \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R \circ P_3 \circ P_2 \circ P_1 \circ S = \Pi$$
**Conclusion:** $\Pi = \Pi^{-1}$. Encryption and decryption are mathematically identical operations.

#### 3. Proof of Derangement ($\Pi(x) \neq x$):
- Suppose for contradiction that there exists some $x \in \mathbb{Z}_{26}$ such that $\Pi(x) = x$.
- Let $y = (P_3 \circ P_2 \circ P_1 \circ S)(x)$. Since all rotor maps and plugboards are bijections, $y$ is uniquely defined.
- Then:
  $$\Pi(x) = x \implies (S \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R)(y) = x$$
- Applying the inverse mapping $(P_3 \circ P_2 \circ P_1 \circ S)$ to both sides:
  $$R(y) = (P_3 \circ P_2 \circ P_1 \circ S)(x) = y$$
- This implies $R(y) = y$, meaning $y$ is a fixed point of $R$.
- However, by construction, the reflector $R$ contains only 2-cycles and has **zero fixed points** ($\forall z, R(z) \neq z$).
- This is a direct contradiction. Hence:
  $$\forall x \in \mathbb{Z}_{26}, \quad \Pi_{\text{Enigma}}(x) \neq x$$
  No character can ever encrypt to itself.

#### 4. Cryptanalytic Exploitation in Turing's Bombe:
- **Crib Placement:** The British cryptanalysts aligned probable German plaintext cribs (e.g., `"WETTERVORHERSAGE"` — weather forecast) against ciphertext. If any letter in the crib aligned with the exact same letter in the ciphertext, that entire relative alignment was discarded immediately due to the derangement property.
- **Turing Bombe Loops:** Turing constructed electrical circuits matching loops of letters in the crib (e.g., $A \to B \to C \to A$ at different offsets). The Bombe tested all 17,576 rotor positions simultaneously. A contradiction in the electrical logic eliminated an incorrect rotor setting in milliseconds, reducing search time from years to hours.

---

### Question 21
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4) / Apply (L3)

**Question:**  
Examine **Least Significant Bit (LSB) Steganography and Steganalysis**:
1. Formulate the mathematical model of 1-bit LSB substitution in digital cover images.
2. Explain the phenomenon of **Pairs of Values (PoVs)** induced by LSB replacement.
3. Derive the **Chi-Square ($\chi^2$) Steganalysis Test** used to detect the presence and estimate the length of an embedded secret payload.

**Answer:**  
#### 1. Mathematical Model of LSB Embedding:
Let the cover image $C$ consist of spatial pixel intensities $x_i \in \{0, 1, \dots, 255\}$.
Each byte is expressed in binary: $x_i = \sum_{b=0}^7 x_{i,b} 2^b$.
The secret bit stream is $s_k \in \{0, 1\}$.
The stego pixel $y_i$ is obtained by overwriting the least significant bit:
$$y_i = 2 \left\lfloor \frac{x_i}{2} \right\rfloor + s_k = (x_i \ \& \ \text{0xFE}) \ | \ s_k$$
Notice that if $x_i$ is even ($2k$), it either stays $2k$ (if $s=0$) or becomes $2k+1$ (if $s=1$).
If $x_i$ is odd ($2k+1$), it either becomes $2k$ (if $s=0$) or stays $2k+1$ (if $s=1$).

#### 2. Pairs of Values (PoVs):
LSB replacement creates mutually exclusive pairs of values:
$$\text{PoV}_k = \{2k, 2k+1\} \quad \text{for } k \in \{0, 1, \dots, 127\}$$
- In natural uncompressed images, the counts $n_{2k}$ and $n_{2k+1}$ are typically unequal due to natural image textures and gradients.
- Assuming the secret payload is encrypted and has maximum Shannon entropy ($P(s_k=0) = P(s_k=1) = 0.5$), embedding causes equal transitions between $2k$ and $2k+1$.
- As embedding approaches $100\%$ capacity, the empirical counts $n_{2k}$ and $n_{2k+1}$ asymptotically converge to their arithmetic mean:
  $$n_{2k}^* = \frac{n_{2k} + n_{2k+1}}{2}$$

#### 3. Chi-Square ($\chi^2$) Steganalysis:
The Chi-Square test tests the null hypothesis $H_0$: *The image contains a hidden payload embedded via LSB substitution.*
- **Expected Frequency:** For each pair $k$, the expected count under $H_0$ is $n_{2k}^* = (n_{2k} + n_{2k+1}) / 2$.
- **Test Statistic:**
  $$\chi^2 = \sum_{k=0}^{127} \frac{(n_{2k} - n_{2k}^*)^2}{n_{2k}^*} = \sum_{k=0}^{127} \frac{\left(n_{2k} - \frac{n_{2k}+n_{2k+1}}{2}\right)^2}{\frac{n_{2k}+n_{2k+1}}{2}} = \sum_{k=0}^{127} \frac{(n_{2k} - n_{2k+1})^2}{2(n_{2k} + n_{2k+1})}$$
- **Degrees of Freedom:** $\nu = 127$.
- **Decision Rule:**
  - In a natural cover image with no hidden data, $n_{2k} \neq n_{2k+1}$, yielding a large $\chi^2$ value with $p$-value $P(\chi^2 \ge \chi_{\text{obs}}^2) \approx 0$.
  - In a fully embedded stego image, $n_{2k} \approx n_{2k+1}$, causing $\chi^2 \to 0$ and $p \to 1$.
  - When plotted across sequential pixel blocks, the drop in $\chi^2$ precisely reveals the start, length, and termination offset of the hidden data payload.

---

### Question 22
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Provide an exhaustive analysis of **Active vs. Passive Attacks** under RFC 2828:
1. Contrast their formal definitions, operational threat profiles, and impacts on the CIA triad.
2. Analyze the four active attack classes: Masquerade, Replay, Message Modification, and Denial of Service.
3. Formulate the technical and mathematical reasons why passive attacks are defended via *prevention* whereas active attacks rely on *detection and recovery*.

**Answer:**  
#### 1. Definitions and Threat Profiles:
- **Passive Attacks:** Attacks that monitor, observe, or eavesdrop on transmissions without altering data or system state.
  - *Threat Profile:* Silent interceptors on communication lines.
  - *CIA Impact:* Directly violates **Confidentiality** (and Privacy); has zero impact on Integrity or Availability.
- **Active Attacks:** Attacks that involve the alteration of the data stream or the creation of a false stream.
  - *Threat Profile:* Invasive tampering, unauthorized access, resource saturation.
  - *CIA Impact:* Violates **Integrity** (data tampering, masquerade) and **Availability** (Denial of Service).

#### 2. The Four Active Attack Classes:
1. **Masquerade:** An entity pretends to be a different entity (e.g., an unauthorized node injects packets using a stolen IP or forged authorization token). Violates entity authentication.
2. **Replay:** The passive capture of an authentic data unit and its subsequent retransmission to produce an unauthorized effect (e.g., resending an authentic cryptographic funds transfer request).
3. **Modification of Messages:** Portions of a message are altered, delayed, or reordered (e.g., modifying an account number in an encrypted transaction block or tampering with routing tables).
4. **Denial of Service (DoS):** Prevents or inhibits the normal use or management of communications facilities (e.g., saturating bandwidth, exhausting TCP connection state tables, or disrupting DNS resolution).

#### 3. Prevention vs. Detection Rationale:
- **Passive Attacks $\implies$ Focus on Prevention:**
  - Because passive eavesdropping involves reading electromagnetic radiation or copying packets from fiber/copper taps, the communication stream undergoes **zero physical alteration**.
  - The sender and receiver receive normal responses with standard latencies; no error logs, packet drops, or state corruption occur.
  - Because detection is practically impossible without physical inspection of every foot of transmission cable, the security strategy must focus exclusively on **prevention** through end-to-end cryptographic encipherment (AES-GCM, TLS).
- **Active Attacks $\implies$ Focus on Detection & Recovery:**
  - Completely preventing active attacks across open, decentralized networks requires defending every operating system interface, physical switch port, and protocol parser against all possible software vulnerabilities.
  - Total prevention would require disconnecting systems from public networks.
  - Instead, systems deploy cryptographic signatures, MACs, timestamps, sequence numbers, and anomaly monitors to **detect** active modifications immediately, drop malicious payloads, log incident evidence, and initiate automated protocol **recovery** (ARQ retransmission, failover).

---

### Question 23
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
Examine the **Playfair Cipher**:
1. Detail the algorithm for generating the $5 \times 5$ matrix from a keyword.
2. State the four transformation rules governing digraph encryption.
3. Encrypt the plaintext **`"COMMUNICATION"`** using the keyword **`"MONARCHY"`**.
4. Analyze the cryptanalytic vulnerabilities of the Playfair cipher that allow recovery of the key matrix.

**Answer:**  
#### 1. Matrix Generation with Keyword `"MONARCHY"`:
- Unique letters of keyword: `M - O - N - A - R - C - H - Y` (8 letters).
- Fill remainder of $5 \times 5$ grid with unused alphabet letters in order (combining `I` and `J`):
```
Row 0:  M   O   N   A   R
Row 1:  C   H   Y   B   D
Row 2:  E   F   G  I/J  K
Row 3:  L   P   Q   S   T
Row 4:  U   V   W   X   Z
```

#### 2. Digraph Encryption Rules:
1. **Preprocessing:** Split plaintext into pairs. If both letters in a pair are identical, insert `'X'`. If total length is odd, append `'Z'`.
2. **Same Row:** Replace each letter with the letter to its immediate right (wrap around to start of row).
3. **Same Column:** Replace each letter with the letter immediately below it (wrap around to top of column).
4. **Rectangle Rule:** Each letter is replaced by the letter in its own row and the other letter's column.

#### 3. Step-by-Step Encryption of `"COMMUNICATION"`:
- Preprocessing:
  - Letters: `C O M M U N I C A T I O N`
  - Split: `CO`, `MM` $\implies$ insert `'X'` $\implies$ `MX`, `MU`, `NI`, `CA`, `TI`, `ON`
  - Cleaned pairs: `CO`, `MX`, `MU`, `NI`, `CA`, `TI`, `ON` (14 characters = 7 pairs).
- **Pair 1: `CO`**
  - `C` is at (1, 0), `O` is at (0, 1).
  - Rectangle rule: `C` becomes (1, 1) = **`H`**; `O` becomes (0, 0) = **`M`**.
  - Result: **`HM`**
- **Pair 2: `MX`**
  - `M` is at (0, 0), `X` is at (4, 3).
  - Rectangle rule: `M` becomes (0, 3) = **`A`**; `X` becomes (4, 0) = **`U`**.
  - Result: **`AU`**
- **Pair 3: `MU`**
  - `M` is at (0, 0), `U` is at (4, 0). Same column (Col 0).
  - Column rule (shift down): `M` becomes (1, 0) = **`C`**; `U` becomes (0, 0) = **`M`**.
  - Result: **`CM`**
- **Pair 4: `NI`**
  - `N` is at (0, 2), `I` is at (2, 3).
  - Rectangle rule: `N` becomes (0, 3) = **`A`**; `I` becomes (2, 2) = **`G`**.
  - Result: **`AG`**
- **Pair 5: `CA`**
  - `C` is at (1, 0), `A` is at (0, 3).
  - Rectangle rule: `C` becomes (1, 3) = **`B`**; `A` becomes (0, 0) = **`M`**.
  - Result: **`BM`**
- **Pair 6: `TI`**
  - `T` is at (3, 4), `I` is at (2, 3).
  - Rectangle rule: `T` becomes (3, 3) = **`S`**; `I` becomes (2, 4) = **`K`**.
  - Result: **`SK`**
- **Pair 7: `ON`**
  - `O` is at (0, 1), `N` is at (0, 2). Same row (Row 0).
  - Row rule (shift right): `O` becomes (0, 2) = **`N`**; `N` becomes (0, 3) = **`A`**.
  - Result: **`NA`**
- **Final Ciphertext:**
  $$\mathbf{\text{Ciphertext}} = \text{"HM AU CM AG BM SK NA"}$$

#### 4. Cryptanalysis of Playfair:
- **Digraph Invariants:** A digraph $AB$ and its reverse $BA$ encrypt to ciphertext digraphs whose letters share geometric symmetry in the grid.
- **Digram Frequency Analysis:** With $625$ possible digraphs, high-frequency English digraphs (`TH`, `HE`, `IN`, `ER`, `RE`, `ED`) correlate directly with the most common ciphertext digraphs.
- **Reconstruction:** An analyst uses known digram frequencies to construct partial relative row/column relationships, solving the entire $5 \times 5$ matrix with approximately 300 characters of ciphertext.

---

### Question 24
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Explain Claude Shannon's dual principles of **Confusion** and **Diffusion**:
1. Define both principles using rigorous mathematical and statistical terminology.
2. Explain how classical ciphers partially implement or fail to implement these principles.
3. Show how modern iterated product block ciphers (e.g., AES) combine substitution and transposition layers to achieve full confusion and diffusion.

**Answer:**  
#### 1. Mathematical Definitions:
- **Confusion:**
  - *Definition:* Seeks to make the mathematical relationship between the statistics of the ciphertext and the value of the encryption key as complex, non-linear, and involved as possible.
  - *Mathematical Formulation:* Minimizing linear and non-linear correlation between individual key bits $k_i$ and ciphertext bits $c_j$:
    $$\left| \Pr[k_i \oplus c_j = 0] - \frac{1}{2} \right| \le \epsilon \quad \text{for negligible } \epsilon$$
  - It ensures that an adversary cannot set up systems of linear equations to solve for key bits.
- **Diffusion:**
  - *Definition:* Seeks to spread the statistical influence of individual plaintext symbols over many ciphertext symbols, and to spread the influence of individual key bits over all ciphertext bits.
  - *Mathematical Formulation (Strict Avalanche Criterion):*
    $$\Pr[C_j(P \oplus e_i) \neq C_j(P)] = \frac{1}{2} \quad \forall i, j$$
    Flipping a single plaintext bit $p_i$ results in each ciphertext bit changing with probability $1/2$, preventing differential cryptanalysis.

#### 2. Limitations in Classical Ciphers:
- **Caesar / Monoalphabetic Ciphers:** Provide primitive substitution (limited confusion), but **zero diffusion**. Each plaintext character affects exactly one ciphertext character.
- **Rail Fence / Row Transposition:** Provide permutation (primitive diffusion), but **zero confusion**. Character identities are unaltered; frequency profiles remain identical.
- **Polyalphabetic (Vigenère):** Introduces non-linear shifts across periods, but lacks inter-character diffusion within blocks.

#### 3. Modern Realization in Product Ciphers (AES Architecture):
Modern block ciphers iterate alternating rounds of Substitution (Confusion) and Permutation/Mixing (Diffusion):
- **AES Round Structure:**
  1. **SubBytes (Confusion):** Non-linear byte substitution using an S-Box based on multiplicative inversion in the Galois Field $GF(2^8)$ followed by an affine transformation. This maximizes algebraic complexity and destroys linear relationships.
  2. **ShiftRows (Diffusion):** Cyclically shifts the rows of the $4 \times 4$ state matrix by different offsets, diffusing bytes horizontally across columns.
  3. **MixColumns (Diffusion):** Treats each column as a polynomial over $GF(2^8)$ and multiplies it by a maximum distance separable (MDS) fixed matrix, ensuring that a single input byte change diffuses to all 4 output bytes in that column.
  4. **AddRoundKey:** XORs the state with the round subkey.
- **Result:** After just 2 rounds of AES, every single bit of the state depends on every bit of the plaintext and key, achieving complete confusion and diffusion.

---

### Question 25
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Evaluate (L5)

**Question:**  
Examine the **ITU-T Recommendation X.800 Security Architecture**:
1. Detail the relationship between the 5 Security Services, 8 Security Mechanisms, and OSI Reference Model protocol layers.
2. Explain why certain security services cannot be effectively implemented at the Application Layer, and why others cannot be implemented at the Physical Layer.
3. Illustrate how modern protocol suites (e.g., TLS, IPsec, MACsec) map to the X.800 architectural framework.

**Answer:**  
#### 1. Architecture and Layer Placement:
ITU-T X.800 establishes that security must be designed into open systems at distinct protocol layers:
- **Physical Layer (Layer 1):** Total data stream encipherment and traffic padding (link encryption).
- **Network Layer (Layer 3 - e.g., IPsec):** Connectionless confidentiality, data origin authentication, connectionless integrity, and access control. Transparent to applications.
- **Transport Layer (Layer 4 - e.g., TLS):** End-to-end peer entity authentication, connection confidentiality, and connection integrity.
- **Application Layer (Layer 7 - e.g., S/MIME, PGP, Kerberos):** User authentication, selective-field confidentiality, non-repudiation, and application access control.

#### 2. Layer Constraints:
- **Why Non-Repudiation Cannot Be Implemented at Physical / Network Layers:**
  - Non-repudiation requires proving to a third party that a specific human user or application process authored a specific message payload.
  - Physical and Network layers operate on transient packets and hops. They lack knowledge of user identities, application semantics, and persistent digital signatures. Hence, non-repudiation is strictly an **Application Layer service**.
- **Why Traffic Flow Confidentiality Cannot Be Implemented at the Application Layer:**
  - An application can encrypt its payload, but operating systems and network stacks must still append readable source/destination IP addresses, port numbers, and transport headers to route packets across intermediate routers.
  - Observers can still record transmission times, packet sizes, and communicating IP pairs.
  - Therefore, true traffic flow confidentiality requires continuous **traffic padding and link encryption at Layer 1 or Layer 2/3**.

#### 3. Modern Protocol Suite Mapping:
- **MACsec (IEEE 802.1AE - Layer 2):** Provides hop-by-hop connectionless confidentiality and data integrity on physical LANs.
- **IPsec (RFC 4301 - Layer 3):**
  - *ESP (Encapsulating Security Payload):* Implements X.800 Connectionless Confidentiality and Data Integrity.
  - *AH (Authentication Header):* Implements Data Origin Authentication and Connectionless Integrity.
- **TLS (RFC 8446 - Layer 4):**
  - *TLS Handshake:* Implements Peer Entity Authentication and Authentication Exchange (using X.509 certificates).
  - *TLS Record Protocol:* Implements Connection Confidentiality (AES-GCM) and Connection Integrity.

---

### Question 26
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Apply (L3) / Analyze (L4)

**Question:**  
Analyze the cryptanalysis of a **Row Transposition Cipher**:
1. Formulate the mathematical model of a single row transposition cipher of width $m$.
2. Explain the **Method of Multiple Anagramming** and define the bigram log-likelihood objective function.
3. Given a ciphertext where single-letter frequencies match English text, explain step-by-step how an analyst determines the column count $m$ and reconstructs the column permutation.

**Answer:**  
#### 1. Mathematical Model:
- Plaintext $P = p_1 p_2 \dots p_N$ is written row by row into an $L \times m$ matrix (where $L = \lceil N/m \rceil$).
- A permutation $\pi \in S_m$ defines the read-out order of the columns.
- The ciphertext is formed by concatenating column $\pi(1)$, then column $\pi(2)$, up to column $\pi(m)$.
- The letter positions satisfy:
  $$c_k = p_{\sigma(k)} \quad \text{for a deterministic permutation } \sigma \in S_N$$
- **Invariant:** Unigram character frequencies are completely preserved: $\forall \alpha \in \Sigma, \text{count}_C(\alpha) = \text{count}_P(\alpha)$.

#### 2. Anagramming & Bigram Log-Likelihood Metric:
- Because the columns represent parallel vertical slices of the original text, placing the correct two columns adjacent to each other restores valid English digrams across every row.
- **Objective Function:** For a candidate permutation $\pi = (\pi_1, \pi_2, \dots, \pi_m)$, the total plausibility score is:
  $$\text{Score}(\pi) = \sum_{j=1}^{m-1} \sum_{r=1}^{L} \log P(\text{Col}_{\pi_j}[r] \parallel \text{Col}_{\pi_{j+1}}[r])$$
  where $P(\alpha \parallel \beta)$ is the standard transition probability of English digram $\alpha\beta$ (derived from large corpora).
- The permutation $\pi^*$ that maximizes $\text{Score}(\pi)$ corresponds to the correct decryption key.

#### 3. Step-by-Step Cryptanalytic Walkthrough:
1. **Identify Cipher Type:** Compute the Index of Coincidence $I_c$ of the ciphertext. If $I_c \approx 0.068$ and letter frequencies match standard English, the cipher is confirmed to be a transposition cipher.
2. **Determine Matrix Width $m$:**
   - Factorize the message length $N$: divisors of $N$ represent candidate values for $m$.
   - If padded, test typical key widths $m \in \{4, 5, \dots, 15\}$.
   - Cut the ciphertext into $m$ equal segments of length $L = N/m$, forming candidate columns $C_1, C_2, \dots, C_m$.
3. **Column Pairing (Scoring Adjacent Digrams):**
   - For every unordered pair of columns $(C_u, C_v)$, compute the pairwise digram score:
     $$S(u, v) = \sum_{r=1}^{L} \log P(C_u[r] \parallel C_v[r])$$
   - Pairs yielding impossible English digrams (e.g., `QK`, `ZX`, `WJ`) are eliminated immediately.
   - Pairs producing high-frequency digrams (e.g., `TH`, `HE`, `IN`, `ER`) are linked as adjacent columns.
4. **Assembly and Text Recovery:**
   - Connect column pairs into chains of length $m$.
   - Read the matrix row-wise to reveal the recovered plaintext.

---

### Question 27
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Evaluate (L5) / Analyze (L4)

**Question:**  
Critically evaluate the **Vigenère Cipher and its Variants**:
1. Contrast the standard Vigenère cipher, the Vigenère Autokey cipher, and the Running Key cipher.
2. Formulate the mathematical conditions under which each variant is broken.
3. Why did cryptographers consider the Vigenère cipher *"le chiffre indéchiffrable"* (the unbreakable cipher) for over three centuries, and what conceptual breakthrough by Babbage and Kasiski shattered this belief?

**Answer:**  
#### 1. Comparison of Vigenère Variants:
- **Standard Vigenère Cipher:** Uses a short keyword $K = (k_0, \dots, k_{m-1})$ repeated cyclically:
  $$c_i = (p_i + k_{i \pmod m}) \pmod{26}$$
  Periodic key stream with period $m$.
- **Autokey Cipher:** Uses an initial keyword $K$, followed by the plaintext itself to generate the key stream:
  $$k_i = \begin{cases} K[i], & i < m \\ p_{i-m}, & i \ge m \end{cases}, \quad c_i = (p_i + k_i) \pmod{26}$$
  Non-periodic, but key stream has natural language redundancy.
- **Running Key Cipher:** Uses text from an agreed-upon book or document as the key stream:
  $$c_i = (p_i + k_{\text{book}, i}) \pmod{26}$$
  Non-periodic, but both plaintext and key stream are natural language text.

#### 2. Cryptanalytic Conditions for Breaking Each:
- **Standard Vigenère:** Broken when ciphertext length $N \gg m$. Solved via Kasiski examination and Friedman Index of Coincidence to find $m$, followed by unigram frequency correlation on individual slices.
- **Autokey Cipher:** Broken via known-plaintext cribs or crib dragging. Guessing a common 3-letter word (e.g., `"THE"`) at position $i$ reveals plaintext at position $i+m$, triggering a cascading chain reaction that reconstructs the entire text.
- **Running Key Cipher:** Broken because the sum of two English distributions modulo 26 is highly non-uniform. High-frequency letters (`E`, `T`, `A`) combining produce non-random peaks that can be resolved using tabular polyalphabetic relaxation or M-gram language models.

#### 3. Historical Analysis:
- **Why Considered Unbreakable for 300 Years:**
  - Classical cryptanalysts relied solely on single-alphabet unigram frequency tables.
  - In Vigenère, a single plaintext letter (e.g., `'E'`) can encrypt to any of the 26 ciphertext letters depending on its position, and a single ciphertext letter can represent multiple plaintext letters.
  - This appeared to completely destroy the frequency signature of the underlying language.
- **The Breakthrough by Babbage (1854) and Kasiski (1863):**
  - Charles Babbage and Friedrich Kasiski realized that the keyword repeats periodically.
  - When common words in the plaintext occur at distances that are multiples of the keyword length $m$, they are encrypted by the **exact same key letters**, generating identical ciphertext fragments.
  - By finding the Greatest Common Divisor (GCD) of the intervals between repeated fragments, the periodicity $m$ was exposed, reducing the "unbreakable" polyalphabetic cipher into $m$ trivial Caesar ciphers.

---

### Question 28
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
Examine the **Rail Fence Cipher**:
1. Formulate the mathematical permutation mapping for a Rail Fence cipher of depth $d$ on a message of length $N$.
2. State the cycle period of the zig-zag wave.
3. Encrypt the plaintext **`"INFORMATIONSECURITY"`** using depth $d = 3$.
4. Describe an algorithm for decrypting an arbitrary rail fence ciphertext of depth $d$.

**Answer:**  
#### 1. Mathematical Formulation:
- Plaintext characters $p_0, p_1, \dots, p_{N-1}$ are written along a zig-zag trajectory across $d$ rails (rows $0, 1, \dots, d-1$).
- The row index $r(t)$ for the character at index $t$ is given by a triangle wave:
  $$r(t) = (d - 1) - |(t \pmod{2d - 2}) - (d - 1)|$$
- Characters belonging to row $0$ are concatenated first, followed by row $1$, up to row $d-1$.

#### 2. Period of the Zig-Zag Wave:
The zig-zag path descends from rail $0$ to rail $d-1$ ($d-1$ steps) and ascends back to rail $0$ ($d-1$ steps).
$$\text{Period } T = 2(d - 1)$$

#### 3. Step-by-Step Encryption of `"INFORMATIONSECURITY"` ($N = 19$, $d = 3$):
- Period $T = 2(3 - 1) = 4$.
- Plotting characters across 3 rails:
  - **Rail 0 (indices where $t \equiv 0 \pmod 4$):**
    - Indices: 0, 4, 8, 12, 16
    - Characters: `I` (0), `R` (4), `I` (8), `E` (12), `I` (16)
    - Content: `I R I E I`
  - **Rail 1 (indices where $t \equiv 1, 3 \pmod 4$):**
    - Indices: 1, 3, 5, 7, 9, 11, 13, 15, 17
    - Characters: `N` (1), `O` (3), `M` (5), `T` (7), `O` (9), `S` (11), `C` (13), `R` (15), `T` (17)
    - Content: `N O M T O S C R T`
  - **Rail 2 (indices where $t \equiv 2 \pmod 4$):**
    - Indices: 2, 6, 10, 14, 18
    - Characters: `F` (2), `A` (6), `N` (10), `U` (14), `Y` (18)
    - Content: `F A N U Y`
- Concatenating row by row gives the ciphertext:
  $$\mathbf{\text{Ciphertext}} = \text{"IRIEI NOMTO SCRTF ANUY"}$$

#### 4. General Decryption Algorithm:
1. Initialize an empty grid of dimensions $d \times N$.
2. Trace the zig-zag path for $t = 0, \dots, N-1$ using $r(t) = (d-1) - |(t \pmod{2d-2}) - (d-1)|$, placing a placeholder marker `*` at each active coordinate $(r(t), t)$.
3. Iterate through the grid row-wise from row $0$ to $d-1$. Replace each placeholder marker `*` with the next character from the ciphertext string.
4. Read the grid column by column following the original zig-zag path $t = 0, \dots, N-1$ to recover the original plaintext string.

---

### Question 29
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Evaluate (L5)

**Question:**  
Examine the **Model for Network Security** and the **Network Access Security Model**:
1. Draw detailed architectural diagrams for both models.
2. Outline the four design tasks essential to creating any secure communication service.
3. Compare the threats addressed by the Network Security Model (in-transit threats) against those addressed by the Network Access Model (endpoint/gatekeeper threats).

**Answer:**  
#### 1. Architectural Diagrams:
- **Model for Network Security (In-Transit Protection):**
```
+-------------------+                                               +-------------------+
|      SENDER       |                                               |     RECEIVER      |
|  Plaintext M      |                                               |  Plaintext M      |
|        |          |                                               |        ^          |
|        v          |                                               |        |          |
|  [Transformation] |                                               |  [Transformation] |
|   (Encrypt E_K)   |                                               |   (Decrypt D_K)   |
+--------+----------+                                               +--------+----------+
         |                                                                   ^
         | Ciphertext C                                       Ciphertext C   |
         +-------------------> [ INSECURE CHANNEL ] -------------------------+
                                        ^
                                        | Intercept / Modify
                               +--------+--------+
                               |    OPPONENT     |
                               +-----------------+
                                        ^
                                        | Key Distribution
                              +---------+---------+
                              | TRUSTED THIRD     |
                              | PARTY (KDC / CA)  |
                              +-------------------+
```

- **Network Access Security Model (Endpoint & Asset Protection):**
```
                        [ OPPONENT / INTRUDER / MALWARE ]
                                        |
                                        v
                        +-------------------------------+
                        |     GATEKEEPER SUBSYSTEM      |
                        | (Firewalls, IDS/IPS, MFA Gate)|
                        +---------------+---------------+
                                        |
                             Authorized | Access Only
                                        v
                        +-------------------------------+
                        |   PROTECTED INTERNAL ASSETS   |
                        | (Databases, OS Files, Servers)|
                        +---------------+---------------+
                                        ^
                                        | Internal Monitoring
                        +---------------+---------------+
                        |   INTERNAL SECURITY CONTROLS  |
                        | (Audit Logs, Anti-malware, DLP)|
                        +-------------------------------+
```

#### 2. The Four Design Tasks:
1. **Design a Cryptographic Algorithm:** Develop a robust transformation algorithm (e.g., symmetric/asymmetric cipher, hash) that performs the security mapping such that an opponent cannot defeat it without the key.
2. **Generate Secret Parameters:** Establish algorithms to generate strong, unpredictable keys used in conjunction with the cryptographic algorithm.
3. **Develop Key Distribution Protocols:** Create secure channels and protocols to distribute and share the secret keys without intermediate interception.
4. **Specify Communication Protocol:** Integrate the algorithm and keys into an end-to-end communication protocol (e.g., TLS, IPsec) to govern message transfer.

#### 3. Comparison of Threat Domains:
| Dimension | Network Security Model | Network Access Security Model |
| :--- | :--- | :--- |
| **Location of Threat** | In-transit across public/untrusted communication channels | Endpoint perimeter, servers, and internal system resources |
| **Threat Agents** | Wiretappers, man-in-the-middle sniffers, packet injectors | Hackers, unauthorized remote users, malicious software (viruses, worms) |
| **Primary Defenses** | Cryptographic ciphers, MACs, digital signatures, nonces | Firewalls, bastion hosts, biometric authentication, host IDS, antivirus |
| **Security Goals** | Confidentiality, data integrity, non-repudiation in transit | Access control, user accountability, system availability, system integrity |

---

### Question 30
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4) / Evaluate (L5)

**Question:**  
Synthesize the evolution from **Classical Cryptosystems** to **Modern Cryptographic Engineering**:
1. Contrast classical ciphers and modern ciphers across key space size, algebraic primitives, unit of processing, and reliance on Kerckhoffs's principle.
2. Explain how classical attacks (frequency profiling, linear system solving, Kasiski periodicity) informed the design requirements of modern standards like the Advanced Encryption Standard (AES).
3. Conclude with an analysis of why classical ciphers remain vital educational tools in undergraduate and graduate curricula.

**Answer:**  
#### 1. Evolutionary Paradigm Comparison:
| Parameter | Classical Cryptosystems | Modern Cryptosystems (e.g., AES, RSA) |
| :--- | :--- | :--- |
| **Processing Unit** | Characters (alphabetic letters in $\mathbb{Z}_{26}$) | Raw binary bits and bytes ($\{0, 1\}^n$, blocks of 128 bits) |
| **Algebraic Primitives** | Simple modular shifts, matrix multiplication over $\mathbb{Z}_{26}$ | Galois Fields ($GF(2^8)$), elliptic curves, non-linear S-Boxes |
| **Key Space ($|\mathcal{K}|$)** | Small to medium ($25$ to $2^{88}$ bits; often vulnerable to heuristics) | Astronomically large ($2^{128}, 2^{256}$ bits; immune to brute force) |
| **Kerckhoffs's Principle** | Frequently violated (relied on algorithm secrecy / obscurity) | Strictly enforced; algorithms are open public standards (FIPS 197) |
| **Computational Basis** | Manual pencil-and-paper or mechanical rotors | Microprocessors, hardware cryptographic acceleration (AES-NI) |

#### 2. How Classical Attacks Shaped Modern Cipher Design:
- **Defeating Frequency Analysis:** Classical monoalphabetic ciphers failed because unigram frequencies leaked. Modern ciphers operate on 128-bit blocks, creating an alphabet of $2^{128} \approx 3.4 \times 10^{38}$ symbols, making frequency tables impossible to construct.
- **Defeating Linear Algebraic Attacks (Hill Cipher KPA):** The Hill cipher was broken via $Y = K X \pmod{26}$ because it was purely linear. Modern ciphers incorporate highly non-linear Substitution Boxes (S-Boxes) designed specifically to minimize linear and differential probabilities ($\mathbf{Max}_{\Delta X, \Delta Y} \Pr[\Delta X \to \Delta Y]$), defeating linear and differential cryptanalysis.
- **Defeating Periodic Attacks (Vigenère Kasiski / Friedman):** Periodic key reuse allowed stream decomposition. Modern stream ciphers (e.g., ChaCha20) and block cipher modes (e.g., AES-CTR, AES-GCM) utilize 96-bit unique nonces with pseudorandom key expansion functions, ensuring that the cipher stream never repeats within the lifetime of a key.

#### 3. Educational Value of Classical Cryptography:
- **Conceptual Clarity:** Classical ciphers isolate fundamental concepts—substitution, transposition, key spaces, modular arithmetic, and statistical cryptanalysis—in an accessible 26-letter format without the cognitive overhead of byte-level Galois field arithmetic.
- **Foundations of Cryptanalysis:** Studying the historical breakthroughs of Babbage, Kasiski, Friedman, and Turing instills the adversarial mindset necessary for evaluating modern cryptographic protocol vulnerabilities, side-channel attacks, and information assurance architectures.

