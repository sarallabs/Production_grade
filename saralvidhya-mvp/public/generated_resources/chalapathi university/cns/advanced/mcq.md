# Multiple Choice Questions (MCQ) — Chapter 1 (Advanced Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Curriculum Standard:** Chalapathi University (Postgraduate & Advanced Rigor)  
**Total Questions:** 20 MCQs (Single Correct Answer)  

---

### Question 1
**Mindmap Location:** 3. Symmetric Encryption Principles > Shannon Perfect Secrecy  
**Question:** Claude Shannon proved that a symmetric cryptosystem achieves unconditional security (perfect secrecy) if and only if:  
- A) The decryption key space is smaller than the plaintext space.  
- B) Mutual information $I(M; C) = 0$, implying $H(M \mid C) = H(M)$ and requiring $H(K) \ge H(M)$.  
- C) The algorithm applies at least $10$ iterative rounds of substitution-permutation networks.  
- D) The key can be derived dynamically from the ciphertext using a one-way hash function.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Perfect secrecy requires $P(M=m \mid C=c) = P(M=m)$, which is equivalent to mutual information $I(M; C) = 0$ and conditional entropy $H(M \mid C) = H(M)$. Shannon proved this mathematically necessitates key entropy $H(K) \ge H(M)$ and $|\mathcal{K}| \ge |\mathcal{M}|$.
</details>

---

### Question 2
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cipher  
**Question:** In the Hill cipher over the alphabet ring $\mathbb{Z}_{26}$, under what exact algebraic condition does a square key matrix $K \in \mathbb{Z}_{26}^{m \times m}$ belong to the general linear group $GL(m, \mathbb{Z}_{26})$?  
- A) $\det(K) \neq 0$ over the real numbers $\mathbb{R}$.  
- B) $\det(K) \equiv 1 \pmod{26}$.  
- C) $\gcd(\det(K), 26) = 1$, meaning $\det(K)$ is odd and not divisible by $13$.  
- D) The trace of matrix $K$ must equal zero modulo 26.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Over the commutative ring $\mathbb{Z}_{26}$, a matrix is invertible if and only if its determinant is an invertible scalar (a unit in the ring). The units of $\mathbb{Z}_{26}$ are the integers coprime to 26, requiring $\gcd(\det(K), 26) = 1$ (odd and not divisible by 13).
</details>

---

### Question 3
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cryptanalysis  
**Question:** An adversary mounts a Known-Plaintext Attack against an $m \times m$ Hill cipher, possessing $m$ vector pairs $(p_1, c_1), \dots, (p_m, c_m)$ assembled into matrices $X = [p_1 \dots p_m]$ and $Y = [c_1 \dots c_m]$. What is the computational complexity of recovering the secret key matrix $K$?  
- A) $O(26^m)$ exponential brute-force search.  
- B) $O(m!)$ factorial permutation matching.  
- C) $O(m^3)$ arithmetic operations in $\mathbb{Z}_{26}$ via matrix inversion and multiplication: $K = Y X^{-1} \pmod{26}$.  
- D) The attack is mathematically impossible without access to an adaptive chosen-ciphertext oracle.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Because the Hill cipher is purely linear ($Y = K X \pmod{26}$), key recovery reduces to matrix inversion $K = Y X^{-1} \pmod{26}$. Inverting an $m \times m$ matrix over $\mathbb{Z}_{26}$ requires $O(m^3)$ arithmetic operations using Gaussian elimination or the adjugate method.
</details>

---

### Question 4
**Mindmap Location:** 4. Classical Substitution Ciphers > Friedman Index of Coincidence  
**Question:** What is the theoretical expected value of the Index of Coincidence ($I_c$) for natural English text, and why does it exceed the expected value for a uniform random distribution?  
- A) $I_{\text{English}} \approx 0.0385$; it is lower than random text because English grammar enforces diversity.  
- B) $I_{\text{English}} \approx 0.068$; it exceeds the random baseline ($1/26 \approx 0.0385$) due to the non-uniform frequency distribution of letters like `E`, `T`, `A`.  
- C) $I_{\text{English}} = 1.000$; because English text contains no entropy.  
- D) $I_{\text{English}} \approx 0.500$; representing the strict avalanche condition.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> $I_c = \sum p_i^2$. For natural English, the skewed probabilities of letters (e.g., $P('E') \approx 0.127$) result in $\sum p_i^2 \approx 0.068$. For a uniform random distribution, $p_i = 1/26$, yielding $\sum (1/26)^2 = 1/26 \approx 0.0385$.
</details>

---

### Question 5
**Mindmap Location:** 4. Classical Substitution Ciphers > Friedman Test  
**Question:** In William Friedman's formula for estimating the keyword period $m$ of a Vigenère cipher:
$$m \approx \frac{0.027 \cdot N}{(N - 1) \cdot I_c - 0.038 \cdot N + 0.065}$$
what happens to the measured $I_c$ as the keyword length $m$ approaches infinity?  
- A) $I_c$ approaches $0.068$.  
- B) $I_c$ approaches $0.000$.  
- C) $I_c$ asymptotically converges to the uniform random distribution value $1/26 \approx 0.0385$.  
- D) $I_c$ fluctuates between $0$ and $1$ deterministically.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> As the period $m \to \infty$, the polyalphabetic distribution completely flattens letter frequencies across positions, causing the overall coincidence probability to converge to that of a uniform random stream: $1/26 \approx 0.0385$.
</details>

---

### Question 6
**Mindmap Location:** 4. Classical Substitution Ciphers > Kasiski Examination  
**Question:** In a Kasiski examination, an identical 4-character ciphertext sequence appears at byte positions $120, 192,$ and $336$. What are the displacement distances and their Greatest Common Divisor ($\gcd$)?  
- A) Distances: $72$ and $144$; $\gcd(72, 144) = 72$ (candidate periods include factors: $2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72$).  
- B) Distances: $60$ and $120$; $\gcd(60, 120) = 60$.  
- C) Distances: $50$ and $100$; $\gcd(50, 100) = 50$.  
- D) Distances: $72$ and $216$; $\gcd(72, 216) = 24$.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> Distance $d_1 = 192 - 120 = 72$; Distance $d_2 = 336 - 192 = 144$. The greatest common divisor $\gcd(72, 144) = 72$. The keyword length $m$ must divide 72.
</details>

---

### Question 7
**Mindmap Location:** 5. Classical Transposition Techniques > Rotor Machines  
**Question:** Let rotor $i$ in an Enigma machine implement permutation $\pi_i \in S_{26}$. When rotated by offset $t_i \in \mathbb{Z}_{26}$, what is the mathematically exact expression for its conjugate effective permutation $P_i(t_i)$, where $\rho(x) = (x + 1) \pmod{26}$?  
- A) $P_i(t_i) = \pi_i + t_i$  
- B) $P_i(t_i) = \rho^{-t_i} \circ \pi_i \circ \rho^{t_i}$  
- C) $P_i(t_i) = \pi_i \circ \rho^{t_i}$  
- D) $P_i(t_i) = (\pi_i)^{t_i}$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> A physical rotation by $t_i$ shifts incoming current by $+t_i$ before passing through the internal wiring $\pi_i$, and then adjusts outgoing contacts by $-t_i$. This conjugation is algebraically written as $\rho^{-t_i} \circ \pi_i \circ \rho^{t_i}$.
</details>

---

### Question 8
**Mindmap Location:** 5. Classical Transposition Techniques > Enigma Cryptanalysis  
**Question:** Why does the German Enigma machine mathematically satisfy the derangement property $\forall x \in \mathbb{Z}_{26}, \Pi(x) \neq x$?  
- A) Because the battery current is alternating current (AC).  
- B) Because the reflector $R$ is constructed as a product of 13 disjoint 2-cycles with zero fixed points, and conjugation by bijections preserves fixed-point-free structures.  
- C) Because the plugboard swaps every single letter of the alphabet.  
- D) Because the fast rotor steps twice per keystroke.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The reflector $R$ pairs all 26 contacts into 13 pairs with no contact wired to itself ($\forall y, R(y) \neq y$). Conjugation by the rotor permutations $P_1, P_2, P_3$ and plugboard $S$ preserves cycle structure, guaranteeing that the composite map $\Pi$ has zero fixed points.
</details>

---

### Question 9
**Mindmap Location:** 4. Classical Substitution Ciphers > One-Time Pad Vulnerabilities  
**Question:** When an adversary intercepts two ciphertexts $C_1 = M_1 \oplus K$ and $C_2 = M_2 \oplus K$ encrypted with the same One-Time Pad key $K$, what is the result of computing $C_1 \oplus C_2$?  
- A) A pseudo-random bit string with maximum entropy $H = N$.  
- B) $M_1 \oplus M_2$, completely cancelling the key $K$ and exposing the XOR difference of the two plaintexts to statistical crib dragging.  
- C) The secret key $K$ multiplied by 2 modulo 26.  
- D) The ciphertext of $M_1$ re-encrypted under key $M_2$.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Bitwise XOR is commutative, associative, and self-inverting: $(M_1 \oplus K) \oplus (M_2 \oplus K) = M_1 \oplus M_2 \oplus (K \oplus K) = M_1 \oplus M_2$. The key vanishes entirely.
</details>

---

### Question 10
**Mindmap Location:** 3. Symmetric Encryption Principles > Cryptanalysis Classifications  
**Question:** In the formal hierarchy of adversarial capability models, which of the following represents the strongest attack model?  
- A) Ciphertext-Only Attack (COA)  
- B) Known-Plaintext Attack (KPA)  
- C) Chosen-Plaintext Attack (CPA)  
- D) Adaptive Chosen-Ciphertext Attack (CCA2 / IND-CCA2)  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: D</b><br/>
<b>Rationale:</b> Under CCA2, the adversary can query both encryption and decryption oracles adaptively, even after receiving the target challenge ciphertext (restricted only from submitting the challenge itself). This strictly subsumes CPA, KPA, and COA.
</details>

---

### Question 11
**Mindmap Location:** 4. Classical Substitution Ciphers > Chi-Square Cryptanalysis  
**Question:** In automated frequency analysis of an additive shift cipher, what is the mathematical purpose of calculating:
$$\chi^2(s) = \sum_{i=0}^{25} \frac{(f_{(i+s) \pmod{26}} - N \cdot p_i)^2}{N \cdot p_i}$$
across all $s \in \{0, 1, \dots, 25\}$?  
- A) To find the shift $s$ that maximizes $\chi^2(s)$, indicating the most chaotic permutation.  
- B) To find the shift $s$ that minimizes $\chi^2(s)$, identifying the hypothesis that best matches the natural English unigram probability distribution.  
- C) To calculate the determinant of the underlying Hill matrix.  
- D) To determine whether the cipher uses 8-bit or 16-bit blocks.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The Chi-Square statistic measures goodness-of-fit. When the test shift $s$ matches the actual encryption shift, the observed counts align closely with expected English frequencies, driving $\chi^2(s)$ to its global minimum.
</details>

---

### Question 12
**Mindmap Location:** 4. Classical Substitution Ciphers > Playfair Cipher  
**Question:** What is the total cardinality of the digraph space in a Playfair cipher operating on a $5 \times 5$ matrix, and what is its primary cryptanalytic implication?  
- A) $26 \times 26 = 676$; immune to frequency analysis.  
- B) $25 \times 25 = 625$; single-letter frequencies are flattened, but digram frequencies remain non-uniform, allowing matrix reconstruction via digram statistics.  
- C) $5! = 120$; can be solved by exhaustive search of 120 keys.  
- D) $25!$; equivalent to an ideal 128-bit block cipher.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Combining `I` and `J` leaves 25 characters, giving $25 \times 25 = 625$ digraph combinations. While this eliminates 26-letter unigram peaks, high-frequency English digrams (e.g., `TH`, `HE`) preserve distinct statistical signatures across the 625 entries.
</details>

---

### Question 13
**Mindmap Location:** 4. Classical Substitution Ciphers > Autokey Cipher  
**Question:** Why can the Vigenère Autokey cipher ($c_i = (p_i + p_{i-m}) \pmod{26}$ for $i \ge m$) be systematically decrypted using a **known-plaintext crib**?  
- A) Because the key matrix has determinant zero.  
- B) Because guessing a correct word of length $L \ge m$ at index $i$ reveals key material that decrypts index $i+m$, initiating a cascading recovery of subsequent plaintext blocks.  
- C) Because the autokey cipher is a linear feedback shift register (LFSR) with period 31.  
- D) Because the autokey cipher preserves ASCII whitespace markers.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> In an autokey cipher, the plaintext serves as the key stream for later characters. Recovering plaintext at position $i$ reveals the key at position $i+m$, allowing decryption of position $i+m$, which in turn reveals key for $i+2m$, cascading through the text.
</details>

---

### Question 14
**Mindmap Location:** 3. Symmetric Encryption Principles > Security Criteria  
**Question:** What fundamental characteristic distinguishes **Provable (Reductionist) Security** from **Computational Security**?  
- A) Computational security requires quantum computers, whereas provable security requires classical supercomputers.  
- B) Provable security formally proves that breaking the cryptosystem in polynomial time implies a polynomial-time solver for a known computationally hard mathematical problem (e.g., LWE, RSA, Discrete Log).  
- C) Computational security guarantees zero equivocation ($H(M \mid C) = 0$).  
- D) Provable security applies only to ciphers with infinite key length.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Reductionist provable security establishes a formal mathematical reduction: if an adversary exists that can break the cryptosystem with non-negligible advantage, that algorithm can be used as a subroutine to solve an underlying hard problem.
</details>

---

### Question 15
**Mindmap Location:** 5. Classical Transposition Techniques > Row Transposition  
**Question:** In the automated cryptanalysis of a Row Transposition cipher, what objective function is maximized across candidate column permutations $\pi \in S_m$?  
- A) $\sum \det(M_i) \pmod{26}$  
- B) $\sum_{j=1}^{m-1} \sum_{r=1}^{L} \log P(\text{Col}_{\pi_j}[r] \parallel \text{Col}_{\pi_{j+1}}[r])$, which measures the total bigram transition log-likelihood across adjacent column pairs.  
- C) The Shannon entropy of the individual columns $H(\text{Col}_j)$.  
- D) The Hamming weight of the column permutation vector.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The method of multiple anagramming pairs columns such that adjacent characters across rows form valid English digrams. Summing the log-probabilities of these digrams yields the log-likelihood objective function.
</details>

---

### Question 16
**Mindmap Location:** 6. Steganography > Digital Image Steganography  
**Question:** What is the maximum theoretical payload capacity of an uncompressed $2048 \times 1536$ 24-bit RGB bitmap image when using 1-bit LSB substitution across all color channels?  
- A) $393.216 \text{ KB}$  
- B) $1.179648 \text{ MB}$ ($1,179,648 \text{ bytes}$)  
- C) $9.437184 \text{ MB}$  
- D) $256 \text{ KB}$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Total pixels = $2048 \times 1536 = 3,145,728$. Channels = $3,145,728 \times 3 = 9,437,184$ bytes. At 1 bit/channel: $9,437,184 \text{ bits} / 8 = 1,179,648 \text{ bytes} \approx 1.125 \text{ MB} = 1.179648 \times 10^6 \text{ bytes}$.
</details>

---

### Question 17
**Mindmap Location:** 6. Steganography > Steganalysis  
**Question:** Why does the Chi-Square ($\chi^2$) steganalysis test succeed in detecting LSB substitution in digital cover images?  
- A) It detects abnormal changes in the image file's EXIF metadata timestamps.  
- B) LSB replacement forces the occurrence frequencies of Pairs of Values (PoVs: $2k$ and $2k+1$) toward equality, driving the observed $\chi^2$ statistic toward zero compared to natural images.  
- C) It calculates the discrete cosine transform (DCT) rounding error.  
- D) It proves that the image was compressed using lossy JPEG quantizers.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> In natural images, $n_{2k} \neq n_{2k+1}$. Because LSB substitution toggles between $2k$ and $2k+1$ with equal probability, the counts equalize toward $(n_{2k} + n_{2k+1})/2$. The $\chi^2$ test detects this abnormal symmetry.
</details>

---

### Question 18
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Authentication  
**Question:** Under ITU-T Recommendation X.800, what is the critical operational difference between **Peer Entity Authentication** and **Data Origin Authentication**?  
- A) Peer Entity operates on asymmetric keys, while Data Origin operates on symmetric keys.  
- B) Peer Entity authenticates active participants during a connection-oriented session and guards against masquerade/replay; Data Origin verifies source identity in connectionless independent data units without sequence protection.  
- C) Peer Entity is implemented at Layer 1, while Data Origin is implemented at Layer 7.  
- D) Peer Entity provides non-repudiation, while Data Origin provides access control.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Peer Entity Authentication is a connection-oriented service verifying the communicating entity at association time. Data Origin Authentication verifies the originator of an isolated packet without establishing session state or detecting replay.
</details>

---

### Question 19
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Traffic Flow Confidentiality  
**Question:** Why does ITU-T X.800 mandate that **Traffic Flow Confidentiality** via traffic padding be placed primarily at the Physical or Data Link / Network layers rather than the Application layer?  
- A) Application layer software runs in user space and lacks cryptographic libraries.  
- B) Application layer encryption leaves packet headers (IP addresses, port numbers, packet lengths, and timing bursts) unencrypted, permitting external traffic analysis by intermediate sniffers.  
- C) Physical layer hardware is immune to eavesdropping.  
- D) Application layer traffic padding would corrupt database transactions.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Higher-layer payloads are enclosed within lower-layer routing headers. Only link-layer and physical-layer mechanisms (transmitting continuous dummy bit streams) can conceal transmission rates, packet sizes, and endpoint addresses from network observers.
</details>

---

### Question 20
**Mindmap Location:** 3. Symmetric Encryption Principles > Claude Shannon  
**Question:** A cryptographic primitive satisfies the **Strict Avalanche Criterion (SAC)** if:  
- A) Changing any single plaintext bit or key bit causes each ciphertext bit to change with probability exactly $1/2$.  
- B) The ciphertext length is strictly twice the plaintext length.  
- C) The decryption function requires exactly the same number of clock cycles as encryption.  
- D) The key space size satisfies $|\mathcal{K}| \ge 2^{256}$.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> The Strict Avalanche Criterion (Webster and Tavares, 1985; formalized from Shannon's diffusion concept) requires that complementing any single input bit inverts each output bit with a probability of exactly $0.5$.
</details>

