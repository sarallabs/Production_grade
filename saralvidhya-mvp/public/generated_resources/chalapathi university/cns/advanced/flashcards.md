# Chapter 1: Flashcards — Security Concepts and Classical Encryption (Advanced Level)

**Subject:** Cryptography and Network Security (CNS) | **Academic Standard:** Advanced / Research Rigor  
**Total Flashcards:** 30 Cards  
**Coverage:** Formal Security Models, Information-Theoretic Bounds, Group-Theoretic Cryptanalysis, Invertibility Theorems, Steganalysis  

---

### Flashcard 1
**Front:** State Claude Shannon's mathematical definition of **Perfect Secrecy (Unconditional Security)**.  
**Bloom's Taxonomy:** Remember (L1) / Understand (L2)  
**Back:**  
A cryptosystem $(\mathcal{M}, \mathcal{C}, \mathcal{K}, \mathcal{E}, \mathcal{D})$ achieves perfect secrecy if and only if the a posteriori probability of a plaintext message $M$ given the ciphertext $C$ is identically equal to the a priori probability of $M$:
$$P(M = m \mid C = c) = P(M = m) \quad \forall m \in \mathcal{M}, \forall c \in \mathcal{C}$$
In information-theoretic terms, the mutual information is zero:
$$I(M; C) = H(M) - H(M \mid C) = 0 \iff H(M \mid C) = H(M)$$

---

### Flashcard 2
**Front:** State **Shannon's Fundamental Theorem** on the minimum key size required for perfect secrecy.  
**Bloom's Taxonomy:** Understand (L2) / Analyze (L4)  
**Back:**  
To achieve perfect secrecy over message space $\mathcal{M}$ with key space $\mathcal{K}$:
$$H(K) \ge H(M) \implies |\mathcal{K}| \ge |\mathcal{M}|$$
If all messages of length $N$ can occur, the secret key must be at least as long as the message ($|K| \ge |M|$) and can only be used once.

---

### Flashcard 3
**Front:** What is the exact algebraic condition for invertibility of an $m \times m$ key matrix $K$ in the **Hill Cipher** over the ring $\mathbb{Z}_{26}$?  
**Bloom's Taxonomy:** Understand (L2) / Apply (L3)  
**Back:**  
$$K \in GL(m, \mathbb{Z}_{26}) \iff \gcd(\det(K), 26) = 1$$
Because $26 = 2 \times 13$, this requires:
$$\det(K) \pmod 2 \neq 0 \quad (\text{det must be odd}) \quad \text{and} \quad \det(K) \pmod{13} \neq 0$$

---

### Flashcard 4
**Front:** Write the explicit formula for the decryption matrix $K^{-1} \pmod{26}$ in the Hill Cipher using the adjugate matrix.  
**Bloom's Taxonomy:** Apply (L3)  
**Back:**  
$$K^{-1} \equiv (\det(K))^{-1} \cdot \text{adj}(K) \pmod{26}$$
where $(\det(K))^{-1}$ is the modular multiplicative inverse of $\det(K)$ in $\mathbb{Z}_{26}$, computed via the Extended Euclidean Algorithm:
$$\det(K) \cdot x + 26 \cdot y = 1 \implies x \equiv (\det(K))^{-1} \pmod{26}$$

---

### Flashcard 5
**Front:** Formulate the **Known-Plaintext Attack (KPA)** against an $m \times m$ Hill Cipher as a matrix linear equation solver.  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
Given $m$ linearly independent column vector pairs $(p_1, c_1), \dots, (p_m, c_m)$ assembled into matrices $X = [p_1 \dots p_m]$ and $Y = [c_1 \dots c_m]$:
$$Y \equiv K \cdot X \pmod{26}$$
If $\gcd(\det(X), 26) = 1$, the secret key matrix $K$ is uniquely recovered in $O(m^3)$ operations via:
$$K \equiv Y \cdot X^{-1} \pmod{26}$$

---

### Flashcard 6
**Front:** Define the **Index of Coincidence ($I_c$)** introduced by William F. Friedman and state its mathematical formula.  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
$I_c$ is the probability that two characters chosen uniformly at random from a ciphertext of length $N$ are identical:
$$I_c = \sum_{i=0}^{25} \frac{f_i(f_i - 1)}{N(N - 1)}$$
where $f_i$ is the observed frequency count of the $i$-th letter of the alphabet.

---

### Flashcard 7
**Front:** Contrast the expected Index of Coincidence ($I_c$) for natural English text versus a uniform random ciphertext.  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
- **Natural English:** $I_{\text{English}} = \sum_{i=0}^{25} p_i^2 \approx 0.068$ (skewed by high-frequency letters like `E`, `T`, `A`).
- **Uniform Random Stream (Maximum Entropy):**
  $$I_{\text{Random}} = \sum_{i=0}^{25} \left(\frac{1}{26}\right)^2 = \frac{1}{26} \approx 0.0385$$

---

### Flashcard 8
**Front:** State the **Friedman Test Formula** for estimating the period length $m$ of a polyalphabetic Vigenère cipher.  
**Bloom's Taxonomy:** Apply (L3)  
**Back:**  
$$m \approx \frac{0.027 \cdot N}{(N - 1) \cdot I_c - 0.038 \cdot N + 0.065}$$
where $N$ is the ciphertext length and $I_c$ is the measured Index of Coincidence.

---

### Flashcard 9
**Front:** Explain the mathematical principle of the **Kasiski Examination** for finding keyword length $m$.  
**Bloom's Taxonomy:** Understand (L2) / Apply (L3)  
**Back:**  
If identical plaintext $n$-grams ($n \ge 3$) are encrypted by the same key segment, they appear at ciphertext positions $pos_1, pos_2, \dots, pos_r$.
The displacement distances $d_j = pos_{j+1} - pos_j$ must be integer multiples of $m$:
$$m \mid \gcd(d_1, d_2, \dots, d_{r-1})$$

---

### Flashcard 10
**Front:** Express the full mathematical permutation mapping of a 3-rotor **Enigma Machine** with reflector $R$ and plugboard $S$.  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
$$\Pi_{\text{Enigma}} = S \circ P_1^{-1} \circ P_2^{-1} \circ P_3^{-1} \circ R \circ P_3 \circ P_2 \circ P_1 \circ S$$
where each dynamic rotor offset $t_i$ defines the conjugated permutation:
$$P_i(t_i) = \rho^{-t_i} \circ \pi_i \circ \rho^{t_i} \quad \text{with cyclic shift } \rho(x) = (x + 1) \pmod{26}$$

---

### Flashcard 11
**Front:** What mathematical property of the Enigma reflector $R$ was exploited as a fundamental vulnerability by cryptanalysts?  
**Bloom's Taxonomy:** Evaluate (L5)  
**Back:**  
The reflector $R$ is an **involution without fixed points** ($R = R^{-1}$ and $\forall x, R(x) \neq x$).
Because conjugation preserves cycle structure, the entire transformation is a derangement:
$$\forall x \in \mathbb{Z}_{26}, \quad \Pi_{\text{Enigma}}(x) \neq x$$
**No letter can ever encrypt to itself**, allowing Turing's Bombe to eliminate trillions of rotor settings instantly.

---

### Flashcard 12
**Front:** Prove the catastrophic failure of the **Two-Time Pad** (reusing a one-time pad key $K$).  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
Let $C_1 = M_1 \oplus K$ and $C_2 = M_2 \oplus K$.
Computing the bitwise difference of the ciphertexts eliminates the secret key completely:
$$C_1 \oplus C_2 = (M_1 \oplus K) \oplus (M_2 \oplus K) = M_1 \oplus M_2$$
The XOR sum of two natural language texts possesses low entropy and can be solved using crib-dragging and statistical bigram analysis.

---

### Flashcard 13
**Front:** Distinguish between **CPA (Chosen-Plaintext Attack)** and **CCA2 (Adaptive Chosen-Ciphertext Attack)**.  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
- **CPA:** Adversary submits arbitrary plaintexts $M$ to an encryption oracle $\mathcal{O}_E: M \mapsto E_K(M)$.
- **CCA2:** Adversary has access to both encryption oracle $\mathcal{O}_E$ and decryption oracle $\mathcal{O}_D: C \mapsto D_K(C)$, and can query $\mathcal{O}_D$ adaptively **before and after** receiving the target challenge ciphertext $C^*$ (for any $C \neq C^*$).

---

### Flashcard 14
**Front:** Express **Kerckhoffs's Principle** within modern reductionist security definitions.  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
The security parameter $\lambda$ of a scheme $\Pi = (\text{Gen}, \text{Enc}, \text{Dec})$ must hold when the adversary $\mathcal{A}$ has full knowledge of $\text{Enc}$ and $\text{Dec}$:
$$\Pr\left[\text{PrivK}^{\text{eav}}_{\mathcal{A}, \Pi}(\lambda) = 1\right] \le \frac{1}{2} + \text{negl}(\lambda)$$
The security must reside exclusively in the entropy of the sampled key $K \leftarrow \text{Gen}(1^\lambda)$.

---

### Flashcard 15
**Front:** Write the **Chi-Square ($\chi^2$) Goodness-of-Fit** equation used to automate Caesar cipher cryptanalysis.  
**Bloom's Taxonomy:** Apply (L3)  
**Back:**  
$$\chi^2(s) = \sum_{i=0}^{25} \frac{(f_{(i+s) \pmod{26}} - N \cdot p_i)^2}{N \cdot p_i}$$
where $f_j$ is the observed frequency of letter $j$ in ciphertext, $p_i$ is standard English probability, and $N$ is message length. The shift $s$ minimizing $\chi^2(s)$ identifies the key.

---

### Flashcard 16
**Front:** Why does an arbitrary **Monoalphabetic Substitution Cipher** fail against statistical cryptanalysis despite its $26! \approx 2^{88.4}$ key space?  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
Because it is a 1-to-1 deterministic map, it preserves the probability density distribution of the plaintext language:
$$\Pr(C = \pi(\alpha)) = \Pr(M = \alpha) \quad \forall \alpha \in \Sigma$$
Unigram, digram, and trigram relative frequencies are preserved without dispersion or diffusion.

---

### Flashcard 17
**Front:** In the **Playfair Cipher**, what is the size of the digraph permutation space, and why is it still vulnerable?  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
- The 25-letter alphabet forms $25 \times 25 = 625$ digraphs.
- Vulnerability: Digraph occurrences in English remain non-uniform (e.g., `TH`, `HE`, `IN` occur with high frequency). A frequency table of 625 digrams allows reconstruction of the $5 \times 5$ matrix with $N \approx 200\text{--}300$ digraphs.

---

### Flashcard 18
**Front:** State the recurrence relation for the **Autokey Cipher** and identify its cryptanalytic weakness.  
**Bloom's Taxonomy:** Understand (L2) / Analyze (L4)  
**Back:**  
$$c_i = (p_i + k_i) \pmod{26}, \quad \text{where } k_i = \begin{cases} K_{\text{seed}}[i], & i < m \\ p_{i-m}, & i \ge m \end{cases}$$
Weakness: Because the key stream consists of natural language text, it inherits the statistical properties of English. Crib dragging common words (e.g., `THE`, `THAT`) recovers both plaintext and key simultaneously.

---

### Flashcard 19
**Front:** Differentiate between **Computational Security** and **Provable Security (Reductionist Security)**.  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
- **Computational Security:** Practical measure; breaking the cipher requires time/resources exceeding the economic value or lifetime of the data (e.g., $2^{128}$ operations).
- **Provable (Reductionist) Security:** Breaking the cryptosystem is proven mathematically equivalent to solving a known computationally hard problem (e.g., Discrete Logarithm, LWE, Factoring).

---

### Flashcard 20
**Front:** What mathematical objective function is optimized during the **Anagramming Cryptanalysis** of a Row Transposition Cipher?  
**Bloom's Taxonomy:** Apply (L3)  
**Back:**  
$$\text{Score}(\pi) = \sum_{j=1}^{m-1} \sum_{r=1}^{L} \log P(\text{Col}_{\pi(j)}[r] \parallel \text{Col}_{\pi(j+1)}[r])$$
where $P(\alpha \parallel \beta)$ is the bigram transition probability in English. Maximizing this score across column permutations $\pi \in S_m$ reconstructs the correct column ordering.

---

### Flashcard 21
**Front:** State the exact formula for the maximum steganographic capacity in a **24-bit RGB bitmap** image using $b$ LSB bits per channel.  
**Bloom's Taxonomy:** Apply (L3)  
**Back:**  
$$\text{Capacity}_{\text{max}} = \frac{W \times H \times 3 \times b}{8} \text{ bytes}$$
where $W, H$ are image dimensions, $3$ accounts for Red, Green, and Blue channels, and $b$ is the number of LSB bits used per channel (typically $b=1$).

---

### Flashcard 22
**Front:** How does **Chi-Square ($\chi^2$) Steganalysis** detect Least Significant Bit (LSB) image modification?  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
LSB replacement maps adjacent pixel values into Pairs of Values (PoVs: $2k \leftrightarrow 2k+1$). As embedding increases, their counts equalize toward the arithmetic mean:
$$n_{2k}^* = \frac{n_{2k} + n_{2k+1}}{2}$$
The $\chi^2$ statistic measures this abnormal equalization across all pairs:
$$\chi^2 = \sum_{k=0}^{127} \frac{(n_{2k} - n_{2k}^*)^2}{n_{2k}^*}$$

---

### Flashcard 23
**Front:** Define **Security Service** according to ITU-T Recommendation X.800.  
**Bloom's Taxonomy:** Remember (L1)  
**Back:**  
A processing or communication service that is provided by a protocol layer of open systems to ensure adequate security of the systems or of data transfers.

---

### Flashcard 24
**Front:** Contrast **Peer Entity Authentication** and **Data Origin Authentication** under X.800.  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
- **Peer Entity Authentication:** Dynamic verification of the identity of a peer entity during connection establishment in a connection-oriented session; prevents masquerade.
- **Data Origin Authentication:** Verification of the source identity of an individual data unit in a connectionless transfer; provides no sequencing or replay protection.

---

### Flashcard 25
**Front:** Why must **Traffic Flow Confidentiality** be deployed at lower protocol layers (Physical / Network)?  
**Bloom's Taxonomy:** Analyze (L4)  
**Back:**  
Higher layers expose routing headers and packet timings. Only lower-layer mechanisms (e.g., continuous link-layer encryption and constant-rate **Traffic Padding**) can mask packet existence, size, burst intervals, and source-destination paths.

---

### Flashcard 26
**Front:** Formulate Claude Shannon's concept of **Confusion** in terms of mutual information.  
**Bloom's Taxonomy:** Understand (L2) / Analyze (L4)  
**Back:**  
Confusion seeks to minimize the linear and non-linear correlation between the secret key $K$ and ciphertext $C$:
$$I(K; C) \approx 0 \quad \text{and} \quad \text{Corr}(K_i, C_j) \approx 0$$
Implemented in modern ciphers via non-linear Substitution Boxes (S-Boxes).

---

### Flashcard 27
**Front:** Formulate Claude Shannon's concept of **Diffusion** in terms of the **Strict Avalanche Criterion (SAC)**.  
**Bloom's Taxonomy:** Understand (L2) / Analyze (L4)  
**Back:**  
Diffusion requires that each plaintext bit and key bit influences as many ciphertext bits as possible:
$$\Pr\left[C_j(P \oplus e_i) \neq C_j(P)\right] = \frac{1}{2} \quad \forall i, j$$
A 1-bit flip in plaintext $P$ inverts each ciphertext bit $C_j$ with probability exactly $0.5$ (achieved via P-boxes and linear mixing layers).

---

### Flashcard 28
**Front:** Why does partitioning a Vigenère ciphertext of period $m$ yield $m$ independent Caesar ciphers?  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
Because the $i$-th ciphertext character satisfies:
$$c_i = (p_i + k_{i \pmod m}) \pmod{26}$$
For any sub-stream $S_j = \{c_{k \cdot m + j} \mid k \in \mathbb{N}\}$, the key character is constant: $k_{i \pmod m} = k_j$. Hence, each $S_j$ is a pure additive shift.

---

### Flashcard 29
**Front:** State Christian Cachin's information-theoretic criterion for **Perfect Steganographic Security**.  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
A steganographic system is $\epsilon$-secure against passive adversaries if the Relative Entropy (Kullback-Leibler divergence) between the cover distribution $P_C$ and the stego distribution $P_S$ satisfies:
$$D_{\text{KL}}(P_C \parallel P_S) = \sum_{x} P_C(x) \log \frac{P_C(x)}{P_S(x)} \le \epsilon$$
If $\epsilon = 0$, the system achieves **perfect steganographic secrecy**.

---

### Flashcard 30
**Front:** Which X.800 mechanisms are uniquely capable of providing **Non-Repudiation with Proof of Origin**?  
**Bloom's Taxonomy:** Understand (L2)  
**Back:**  
- **Digital Signatures:** Asymmetric cryptographic signature uniquely tied to the private key of the sender.
- **Notarization:** An impartial trusted third party (TTP) records cryptographic timestamps, hashes, and identity tokens.

