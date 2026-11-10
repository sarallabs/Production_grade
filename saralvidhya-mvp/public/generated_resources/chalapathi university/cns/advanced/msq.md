# Multiple Select Questions (MSQ) — Chapter 1 (Advanced Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Curriculum Standard:** Chalapathi University (Postgraduate & Advanced Rigor)  
**Total Questions:** 10 MSQs (Two or More Correct Answers per Question)  

---

### Question 1
**Mindmap Location:** 3. Symmetric Encryption Principles > Shannon Perfect Secrecy  
**Question:** Which of the following statements are mathematically proven properties of **Shannon's Perfect Secrecy (Unconditional Security)**? (Select ALL that apply)  
- [ ] A) The mutual information between message $M$ and ciphertext $C$ satisfies $I(M; C) = 0$.  
- [ ] B) The conditional entropy satisfies $H(M \mid C) = H(M)$.  
- [ ] C) The key entropy must be bounded below by the message entropy: $H(K) \ge H(M)$.  
- [ ] D) The size of the key space must satisfy $|\mathcal{K}| \ge |\mathcal{M}|$.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C, D</b><br/>
<b>Rationale:</b> All four statements are fundamental theorems established by Claude Shannon (1949). Perfect secrecy implies zero mutual information ($I(M; C) = 0$), conditional entropy invariance ($H(M \mid C) = H(M)$), and lower bounds on key entropy ($H(K) \ge H(M)$) and key space cardinality ($|\mathcal{K}| \ge |\mathcal{M}|$).
</details>

---

### Question 2
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cipher  
**Question:** In the Hill cipher over $\mathbb{Z}_{26}$, which of the following scalar determinant values indicate that a square matrix $K$ is **invertible** in $GL(m, \mathbb{Z}_{26})$? (Select ALL that apply)  
- [ ] A) $\det(K) = 3$  
- [ ] B) $\det(K) = 7$  
- [ ] C) $\det(K) = 13$  
- [ ] D) $\det(K) = 17$  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, D</b><br/>
<b>Rationale:</b> Invertibility requires $\gcd(\det(K), 26) = 1$. Since $26 = 2 \times 13$, $\det(K)$ cannot be divisible by 2 or 13. Determinants $3, 7,$ and $17$ are coprime to 26 and invertible. $\det(K) = 13$ shares factor 13 ($\gcd(13, 26) = 13 \neq 1$) and is non-invertible.
</details>

---

### Question 3
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cryptanalysis  
**Question:** Which of the following conditions are required to execute a successful **Known-Plaintext Attack (KPA)** against an $m \times m$ Hill Cipher? (Select ALL that apply)  
- [ ] A) The adversary must capture at least $m$ distinct plaintext-ciphertext vector pairs.  
- [ ] B) The plaintext matrix $X = [p_1 \; p_2 \; \dots \; p_m]$ must satisfy $\gcd(\det(X), 26) = 1$.  
- [ ] C) The adversary must have real-time access to a hardware decryption oracle.  
- [ ] D) The secret key matrix $K$ is uniquely computed via $K \equiv Y \cdot X^{-1} \pmod{26}$.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, D</b><br/>
<b>Rationale:</b> A Known-Plaintext Attack requires $m$ linearly independent vector pairs where $X$ is invertible in $GL(m, \mathbb{Z}_{26})$, allowing key recovery via $K = Y X^{-1} \pmod{26}$. Option C describes a Chosen-Ciphertext Attack (CCA), not a KPA.
</details>

---

### Question 4
**Mindmap Location:** 4. Classical Substitution Ciphers > Vigenère Cryptanalysis  
**Question:** In the cryptanalysis of polyalphabetic Vigenère ciphers, which of the following statements regarding the **Index of Coincidence ($I_c$)** and **Kasiski Examination** are correct? (Select ALL that apply)  
- [ ] A) The expected Index of Coincidence for natural English text ($I_c \approx 0.068$) is substantially higher than for a uniform random distribution ($I_c \approx 0.0385$).  
- [ ] B) In the Kasiski examination, the distances between repeated ciphertext $n$-grams ($n \ge 3$) are integer multiples of the keyword length $m$.  
- [ ] C) Partitioning a Vigenère ciphertext of period $m$ into $m$ streams yields $m$ independent monoalphabetic substitution ciphers.  
- [ ] D) The Index of Coincidence can only be applied if the plaintext length $N$ is less than 26 characters.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Options A, B, and C are foundational principles of polyalphabetic cryptanalysis. Option D is false: $I_c$ requires large sample sizes ($N \ge 100$) for statistical convergence.
</details>

---

### Question 5
**Mindmap Location:** 5. Classical Transposition Techniques > Rotor Machines  
**Question:** Which of the following algebraic and operational properties apply to the German **Enigma Rotor Machine**? (Select ALL that apply)  
- [ ] A) The total machine transformation $\Pi_{\text{Enigma}}$ is a self-inverting permutation (involution: $\Pi = \Pi^{-1}$).  
- [ ] B) No letter can ever encrypt to itself ($\forall x \in \mathbb{Z}_{26}, \Pi(x) \neq x$).  
- [ ] C) Stepping of the fast rotor by offset $t$ conjugates its wiring permutation: $P(t) = \rho^{-t} \circ \pi \circ \rho^t$.  
- [ ] D) The machine encrypts entire 128-bit blocks simultaneously.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Enigma is self-inverting due to the reflector ($R=R^{-1}$), produces fixed-point-free derangements ($\Pi(x) \neq x$), and rotates rotors via conjugation. Option D is false: Enigma is an electro-mechanical stream cipher operating character-by-character.
</details>

---

### Question 6
**Mindmap Location:** 4. Classical Substitution Ciphers > One-Time Pad  
**Question:** Which of the following statements accurately describe vulnerabilities or operational limits of the **Vernam One-Time Pad (OTP)**? (Select ALL that apply)  
- [ ] A) Reusing key material across two messages ($C_1 \oplus C_2$) completely eliminates the key, leaving $M_1 \oplus M_2$ vulnerable to statistical recovery.  
- [ ] B) If the key is generated by a deterministic pseudorandom number generator (PRNG), the cipher ceases to achieve unconditional security and provides only computational security.  
- [ ] C) The cipher is vulnerable to differential linear cryptanalysis after 16 blocks.  
- [ ] D) The logistical requirement $|K| \ge |M|$ creates a key distribution problem of equivalent capacity to the original message.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, D</b><br/>
<b>Rationale:</b> Two-time pad key reuse exposes $M_1 \oplus M_2$, using PRNGs reduces security to computational complexity, and the requirement $|K| \ge |M|$ creates the classical key distribution dilemma. Option C is false: OTP has no round structure or S-boxes.
</details>

---

### Question 7
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Services and Mechanisms  
**Question:** According to the ITU-T Recommendation X.800 architectural framework, which of the following security mechanisms can be used to realize the **Peer Entity Authentication** service? (Select ALL that apply)  
- [ ] A) Encipherment (Symmetric or Asymmetric)  
- [ ] B) Digital Signatures  
- [ ] C) Authentication Exchange (e.g., Cryptographic Handshakes / Nonces)  
- [ ] D) Traffic Padding  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Under the X.800 service-mechanism matrix, Peer Entity Authentication is implemented via Encipherment, Digital Signatures, and Authentication Exchange mechanisms. Traffic padding is strictly reserved for confidentiality.
</details>

---

### Question 8
**Mindmap Location:** 3. Symmetric Encryption Principles > Claude Shannon  
**Question:** Which of the following statements correctly characterize Claude Shannon's concepts of **Confusion** and **Diffusion**? (Select ALL that apply)  
- [ ] A) Confusion aims to make the statistical relationship between the ciphertext and key as complex and non-linear as possible.  
- [ ] B) Diffusion spreads the statistical influence of single plaintext bits across the entire ciphertext block (Strict Avalanche Criterion).  
- [ ] C) In the Advanced Encryption Standard (AES), the SubBytes step primarily implements Confusion, while ShiftRows and MixColumns implement Diffusion.  
- [ ] D) Classical monoalphabetic substitution ciphers provide high diffusion and zero confusion.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Confusion targets key-ciphertext complexity (SubBytes in AES); Diffusion targets plaintext-ciphertext dispersion (ShiftRows/MixColumns in AES). Option D is false: monoalphabetic ciphers provide zero diffusion (1 plaintext char affects exactly 1 ciphertext char).
</details>

---

### Question 9
**Mindmap Location:** 5. Classical Transposition Techniques > Transposition Principles  
**Question:** Which of the following statements regarding **Transposition (Permutation) Ciphers** are mathematically and operationally valid? (Select ALL that apply)  
- [ ] A) The single-letter frequency distribution of the ciphertext is completely identical to that of the plaintext.  
- [ ] B) The Index of Coincidence ($I_c$) of a transposition ciphertext over natural English remains approximately $0.068$.  
- [ ] C) In a Row Transposition cipher of width $m$, the theoretical key space of column permutations is $m!$.  
- [ ] D) The cipher can be solved via the Method of Multiple Anagramming by maximizing the bigram transition log-likelihood across adjacent columns.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C, D</b><br/>
<b>Rationale:</b> Transposition rearranges positions without altering character identities. Thus, unigram counts and $I_c$ ($\approx 0.068$) are preserved, the column key space is $m!$, and adjacent column pairs can be reconstructed by maximizing bigram log-likelihoods.
</details>

---

### Question 10
**Mindmap Location:** 6. Steganography > Steganalysis  
**Question:** Which of the following statements regarding **Digital Image Steganography and Steganalysis** are correct? (Select ALL that apply)  
- [ ] A) In 24-bit RGB bitmap images, 1-bit LSB substitution provides a maximum theoretical payload capacity of $\frac{W \times H \times 3}{8}$ bytes.  
- [ ] B) LSB replacement forces the frequencies of Pairs of Values (PoVs: $2k$ and $2k+1$) toward equality ($n_{2k} \approx n_{2k+1}$).  
- [ ] C) The Chi-Square ($\chi^2$) steganalysis test measures deviation from the equalized PoV distribution to detect hidden payloads and estimate payload length.  
- [ ] D) Steganography and Cryptography have identical security failure criteria.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Options A, B, and C are mathematically correct principles of LSB steganography and Chi-Square steganalysis. Option D is false: Cryptography fails when the ciphertext is decrypted; Steganography fails when the presence of hidden communication is detected.
</details>

