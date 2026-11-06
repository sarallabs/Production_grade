# Multiple Select Questions (MSQ) — Chapter 1 (Intermediate Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Curriculum Standard:** Chalapathi University (Undergraduate Rigor)  
**Total Questions:** 10 MSQs (Two or More Correct Answers per Question)  

---

### Question 1
**Mindmap Location:** 1. Security Concepts & Attacks > CIA Triad  
**Question:** According to RFC 2828 and NIST SP 800-33, which of the following statements correctly describe the extended components of the CIA Triad? (Select ALL that apply)  
- [ ] A) Data Confidentiality assures that private or confidential information is not made available or disclosed to unauthorized individuals.  
- [ ] B) Privacy assures that individuals control or influence what information related to them may be collected and stored and to whom it may be disclosed.  
- [ ] C) System Integrity assures that information and programs are changed only in a specified and authorized manner.  
- [ ] D) Data Integrity assures that a system performs its intended function in an unimpaired manner, free from deliberate or inadvertent unauthorized manipulation.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B</b><br/>
<b>Rationale:</b> Options A and B are verbatim RFC 2828 definitions. Options C and D are inverted: Option C describes <i>Data Integrity</i>, while Option D describes <i>System Integrity</i>.
</details>

---

### Question 2
**Mindmap Location:** 1. Security Concepts & Attacks > Active vs. Passive Attacks  
**Question:** Which of the following statements accurately characterize **Active Attacks** in network communications? (Select ALL that apply)  
- [ ] A) They typically involve the physical alteration, insertion, deletion, or delay of data units.  
- [ ] B) They leave no audit trail and produce no detectable system state modifications.  
- [ ] C) Their prevention is practically impossible in open networks; hence defense focuses on detection and recovery.  
- [ ] D) Examples include masquerade, replay, modification of messages, and denial of service.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, C, D</b><br/>
<b>Rationale:</b> Active attacks modify the data stream, cannot be 100% prevented, and include masquerade, replay, modification, and DoS. Option B describes <i>passive</i> attacks.
</details>

---

### Question 3
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Security Services  
**Question:** Which of the following are recognized sub-categories of **Data Integrity** services defined in ITU-T Recommendation X.800? (Select ALL that apply)  
- [ ] A) Connection Integrity with Recovery  
- [ ] B) Connectionless Integrity  
- [ ] C) Selective-Field Connection Integrity  
- [ ] D) Traffic Flow Confidentiality  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> X.800 defines five integrity services: Connection Integrity with Recovery, Connection Integrity without Recovery, Selective-Field Connection Integrity, Connectionless Integrity, and Selective-Field Connectionless Integrity. Traffic Flow Confidentiality is a confidentiality service.
</details>

---

### Question 4
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Security Mechanisms  
**Question:** Which of the following security mechanisms can be used to implement the **Data Integrity** service according to X.800? (Select ALL that apply)  
- [ ] A) Encipherment  
- [ ] B) Digital Signature  
- [ ] C) Data Integrity Mechanism (e.g., Cryptographic Checksums / MACs)  
- [ ] D) Traffic Padding  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> According to the X.800 mapping matrix, Data Integrity can be provided by Encipherment, Digital Signatures, and Data Integrity mechanisms. Traffic padding is strictly used for confidentiality to prevent traffic analysis.
</details>

---

### Question 5
**Mindmap Location:** 3. Symmetric Encryption Principles > Cryptanalysis Classifications  
**Question:** In which of the following cryptanalytic attack models does the adversary have the capability to choose the specific inputs presented to the cryptographic oracle? (Select ALL that apply)  
- [ ] A) Ciphertext-Only Attack (COA)  
- [ ] B) Known-Plaintext Attack (KPA)  
- [ ] C) Chosen-Plaintext Attack (CPA)  
- [ ] D) Chosen-Ciphertext Attack (CCA)  

<details><summary>Click to view Answer</summary>
<b>Correct Options: C, D</b><br/>
<b>Rationale:</b> In a Chosen-Plaintext Attack (CPA), the adversary chooses plaintexts to be encrypted. In a Chosen-Ciphertext Attack (CCA), the adversary chooses ciphertexts to be decrypted. In COA and KPA, the adversary cannot actively choose the inputs.
</details>

---

### Question 6
**Mindmap Location:** 4. Classical Substitution Ciphers > Playfair Cipher  
**Question:** Which of the following statements regarding the **Playfair Cipher** are mathematically and operationally correct? (Select ALL that apply)  
- [ ] A) It utilizes a $5 \times 5$ matrix generated from a keyword, traditionally combining `'I'` and `'J'` in a single cell.  
- [ ] B) It encrypts individual letters independently using a Caesar shift.  
- [ ] C) If two letters of a digraph fall in the same row, each is replaced by the letter immediately to its right (with circular wrap-around).  
- [ ] D) The total number of possible digraphs in the Playfair alphabet is $25 \times 25 = 625$, which flattens the frequency distribution compared to monoalphabetic ciphers.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, C, D</b><br/>
<b>Rationale:</b> Playfair is a digraph substitution cipher operating on a $5 \times 5$ matrix (combining I/J, yielding 625 digraphs) and shifts right for letters in the same row. Option B is incorrect because Playfair encrypts pairs of letters (digraphs), not independent letters.
</details>

---

### Question 7
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cipher  
**Question:** For an $m \times m$ key matrix $K$ in the Hill cipher over $\mathbb{Z}_{26}$, which of the following conditions must hold for $K$ to be a valid encryption key? (Select ALL that apply)  
- [ ] A) $\det(K) \pmod{26} \neq 0$  
- [ ] B) $\det(K)$ must be an odd integer  
- [ ] C) $\det(K)$ must not be divisible by 13  
- [ ] D) $\det(K)$ must be prime  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> The key matrix $K$ is invertible modulo 26 if and only if $\gcd(\det(K), 26) = 1$. Since $26 = 2 \times 13$, $\det(K)$ must not be divisible by 2 (must be odd) and must not be divisible by 13, and nonzero. It does not need to be prime (e.g., $\det(K) = 9$ or $25$ are coprime to 26 and valid).
</details>

---

### Question 8
**Mindmap Location:** 4. Classical Substitution Ciphers > Vigenère Cryptanalysis  
**Question:** Which of the following techniques or principles are utilized in the systematic cryptanalysis of the polyalphabetic **Vigenère Cipher**? (Select ALL that apply)  
- [ ] A) Kasiski examination to find common divisors of distances between repeated n-grams.  
- [ ] B) Index of Coincidence ($I_c$) to estimate the keyword length based on letter repetition probability.  
- [ ] C) Partitioning the ciphertext into $m$ independent streams and solving each as a monoalphabetic Caesar cipher.  
- [ ] D) Linear matrix inversion using Gaussian elimination modulo 26.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Kasiski examination, Index of Coincidence, and stream decomposition into $m$ Caesar ciphers are the foundational tools for breaking Vigenère. Matrix inversion is used for Hill cipher, not Vigenère.
</details>

---

### Question 9
**Mindmap Location:** 5. Classical Transposition Techniques > Transposition Principles  
**Question:** Which of the following statements correctly distinguish **Transposition Ciphers** from **Substitution Ciphers**? (Select ALL that apply)  
- [ ] A) Transposition ciphers preserve the identity of characters but rearrange their spatial positions.  
- [ ] B) Transposition ciphers completely change the unigram frequency distribution of characters.  
- [ ] C) In a transposition cipher, the unigram letter counts in the ciphertext are identical to those in the plaintext.  
- [ ] D) Rail Fence and Row Transposition are classical examples of transposition ciphers.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, C, D</b><br/>
<b>Rationale:</b> Transposition rearranges positions without altering letter identities, preserving single-letter frequencies exactly (Option B is false). Rail Fence and Row Transposition are classic examples.
</details>

---

### Question 10
**Mindmap Location:** 4. Classical Substitution Ciphers > Vernam Cipher (OTP)  
**Question:** Under Claude Shannon's mathematical formulation of Information Theory, which of the following conditions are mandatory for the **One-Time Pad** to achieve **Unconditional Security (Perfect Secrecy)**? (Select ALL that apply)  
- [ ] A) The key length must be equal to or greater than the message length.  
- [ ] B) The key bits must be generated by a truly random physical process with uniform probability.  
- [ ] C) The key must never be reused in whole or in part for any subsequent transmission.  
- [ ] D) The encryption algorithm must utilize at least 16 rounds of substitution and permutation.  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Perfect secrecy requires $|K| \ge |P|$, uniform physical randomness, and strict single-use (OTP). Option D refers to Feistel/AES round structures; OTP simply uses bitwise XOR ($C = P \oplus K$) in a single step.
</details>

