# Multiple Choice Questions (MCQ) — Chapter 1 (Intermediate Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Curriculum Standard:** Chalapathi University (Undergraduate Rigor)  
**Total Questions:** 20 MCQs (Single Correct Answer)  

---

### Question 1
**Mindmap Location:** 1. Security Concepts & Attacks > CIA Triad  
**Question:** Which of the following correctly pairs the CIA triad objective with its specific sub-dimension according to RFC 2828?  
- A) Confidentiality $\rightarrow$ System Integrity; Integrity $\rightarrow$ Availability  
- B) Confidentiality $\rightarrow$ Privacy; Integrity $\rightarrow$ System Integrity  
- C) Availability $\rightarrow$ Data Confidentiality; Integrity $\rightarrow$ Non-repudiation  
- D) Confidentiality $\rightarrow$ Masquerade; Integrity $\rightarrow$ Traffic Analysis  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> RFC 2828 and NIST SP 800-33 decompose Confidentiality into Data Confidentiality and Privacy, and decompose Integrity into Data Integrity and System Integrity.
</details>

---

### Question 2
**Mindmap Location:** 1. Security Concepts & Attacks > Threat vs. Attack  
**Question:** In formal security taxonomy, what is the precise distinction between a **threat** and an **attack**?  
- A) A threat is an active hardware failure, whereas an attack is a passive eavesdropping incident.  
- B) A threat is a potential violation of security that represents a possible danger, whereas an attack is an assault on system security deriving from an intelligent threat.  
- C) A threat is an executed breach, whereas an attack is an unexecuted vulnerability in software.  
- D) A threat is an internal employee error, whereas an attack originates exclusively from external hackers.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> RFC 2828 defines a threat as a potential for violation of security (a possible danger), while an attack is an intelligent, deliberate action or assault aimed at evading security controls and violating security policy.
</details>

---

### Question 3
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Security Services  
**Question:** Under ITU-T Recommendation X.800, which security service provides protection against an entity falsely denying having originated or received a message?  
- A) Peer Entity Authentication  
- B) Access Control  
- C) Non-Repudiation  
- D) Traffic Flow Confidentiality  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Non-Repudiation prevents either sender or receiver from denying a transmitted message. It is divided into Non-Repudiation of Origin and Non-Repudiation of Destination.
</details>

---

### Question 4
**Mindmap Location:** 2. Security Architecture (ITU-T X.800) > Service-Mechanism Matrix  
**Question:** Which of the following X.800 security mechanisms is uniquely utilized to prevent traffic flow analysis by masking message volume and transmission rates?  
- A) Notarization  
- B) Digital Signature  
- C) Traffic Padding  
- D) Authentication Exchange  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Traffic padding generates spurious, encrypted bit streams when no actual traffic is present, preventing an eavesdropper from conducting traffic volume analysis.
</details>

---

### Question 5
**Mindmap Location:** 3. Symmetric Encryption Principles > Fundamental Requirements  
**Question:** According to Kerckhoffs's Principle, a cryptosystem must remain secure even if:  
- A) The secret key is published in public directories.  
- B) The transmission channel is completely unmonitored.  
- C) Everything about the system, including the algorithm, is public knowledge, provided the key remains secret.  
- D) The underlying mathematical modulus is changed with every transmitted block.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Kerckhoffs's Principle dictates that cryptographic security must rely strictly on the secrecy of the key, not on the secrecy of the algorithm (rejection of "security through obscurity").
</details>

---

### Question 6
**Mindmap Location:** 3. Symmetric Encryption Principles > Cryptanalysis Classifications  
**Question:** In which cryptanalytic attack model does the adversary possess both the ciphertext and the corresponding plaintext for several previously transmitted messages, but cannot choose the plaintext messages?  
- A) Ciphertext-Only Attack (COA)  
- B) Known-Plaintext Attack (KPA)  
- C) Chosen-Plaintext Attack (CPA)  
- D) Chosen-Ciphertext Attack (CCA)  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> In a Known-Plaintext Attack (KPA), the cryptanalyst has captured pairs of known plaintext and corresponding ciphertext, but had no role in selecting or generating the plaintext.
</details>

---

### Question 7
**Mindmap Location:** 3. Symmetric Encryption Principles > Security Criteria  
**Question:** A cryptographic encryption scheme is defined as **computationally secure** if:  
- A) The ciphertext contains zero statistical information regarding the underlying plaintext.  
- B) The cost of breaking the cipher exceeds the value of the encrypted information, or the time required exceeds the useful lifetime of the information.  
- C) The key space size is mathematically infinite.  
- D) The decryption algorithm can be computed in non-polynomial time.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Computational security is achieved when breaking the cipher requires computational effort or time exceeding the economic value or lifetime of the protected data.
</details>

---

### Question 8
**Mindmap Location:** 4. Classical Substitution Ciphers > Caesar Cipher  
**Question:** In the Caesar cipher over the standard 26-letter English alphabet, how many distinct, nontrivial keys exist in the key space?  
- A) 26  
- B) 25  
- C) $26!$  
- D) $2^{26}$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The key $k \in \{0, 1, \dots, 25\}$. However, $k = 0$ corresponds to an identity transformation ($C = P$), leaving exactly $25$ nontrivial encryption keys.
</details>

---

### Question 9
**Mindmap Location:** 4. Classical Substitution Ciphers > Monoalphabetic Substitution  
**Question:** The total key space of an arbitrary monoalphabetic substitution cipher over the 26-letter alphabet is $26! \approx 4 \times 10^{26}$. Why is this cipher considered weak despite its astronomical key space?  
- A) The key can be factored into small primes using Shor's algorithm.  
- B) It preserves the relative unigram, digram, and trigram frequency distribution of the underlying language.  
- C) The decryption function is non-invertible for odd key lengths.  
- D) It generates ciphertext that is four times longer than the original plaintext.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> In monoalphabetic substitution, each plaintext letter always maps to the same ciphertext letter. Hence, natural language letter frequencies (like `E`, `T`, `A`) are directly reflected in the ciphertext.
</details>

---

### Question 10
**Mindmap Location:** 4. Classical Substitution Ciphers > Playfair Cipher  
**Question:** When preparing plaintext for encryption in the Playfair cipher, what is the standard rule if two identical letters fall within the same digraph pair (e.g., `"EE"` in `"MEET"`)?  
- A) Discard the second letter completely.  
- B) Invert the order of the two letters.  
- C) Insert a predetermined filler character (typically `'X'`) between them.  
- D) Replace both letters with the symbol `'Z'`.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Playfair encrypts digraphs. If identical letters appear in a pair, a filler character like `'X'` is inserted (e.g., `"ME ET"` becomes `"ME EX ET"`).
</details>

---

### Question 11
**Mindmap Location:** 4. Classical Substitution Ciphers > Playfair Cipher  
**Question:** In the $5 \times 5$ Playfair cipher matrix, how many unique digraph pairs can theoretically be formed from the 25 matrix characters?  
- A) $25$  
- B) $26 \times 26 = 676$  
- C) $25 \times 25 = 625$  
- D) $25!$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> The Playfair grid contains 25 distinct symbols (combining `I` and `J`). A digraph is a pair of two letters, yielding $25 \times 25 = 625$ possible digraph pairs.
</details>

---

### Question 12
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cipher  
**Question:** A $2 \times 2$ matrix $K$ is proposed as a key for the Hill cipher over $\mathbb{Z}_{26}$. Which determinant value guarantees that $K$ is **NOT** invertible modulo 26?  
- A) $\det(K) = 3$  
- B) $\det(K) = 5$  
- C) $\det(K) = 7$  
- D) $\det(K) = 4$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: D</b><br/>
<b>Rationale:</b> For a matrix to be invertible modulo 26, $\gcd(\det(K), 26)$ must equal $1$. Since $\gcd(4, 26) = 2 \neq 1$, a determinant of $4$ has no modular inverse modulo 26.
</details>

---

### Question 13
**Mindmap Location:** 4. Classical Substitution Ciphers > Hill Cipher  
**Question:** What is the modular multiplicative inverse of $7$ modulo $26$ (i.e., $7^{-1} \pmod{26}$)?  
- A) $11$  
- B) $15$  
- C) $19$  
- D) $23$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> We solve $7 \cdot x \equiv 1 \pmod{26}$. Testing $x = 15$: $7 \times 15 = 105$. Since $105 = 26 \times 4 + 1 \equiv 1 \pmod{26}$, the inverse is $15$.
</details>

---

### Question 14
**Mindmap Location:** 4. Classical Substitution Ciphers > Vigenère Cipher  
**Question:** Why is the Vigenère cipher classified as a **polyalphabetic substitution cipher**?  
- A) It uses multiple substitution keys depending on the position of each letter in the plaintext.  
- B) It encodes characters using non-Latin alphabets like Greek or Cyrillic.  
- C) It scrambles the positions of letters rather than substituting them.  
- D) It requires three separate communicating parties to generate the ciphertext.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> Polyalphabetic ciphers use different monoalphabetic substitution alphabets cyclically across successive positions based on a keyword.
</details>

---

### Question 15
**Mindmap Location:** 4. Classical Substitution Ciphers > Vigenère Cryptanalysis  
**Question:** In the Kasiski examination, identical 3-letter ciphertext strings are observed at positions $45, 93,$ and $157$. The distances between them are $48$ and $64$. What is the most likely keyword length $m$?  
- A) 5  
- B) 7  
- C) 16  
- D) 26  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> The distances are $d_1 = 93 - 45 = 48$ and $d_2 = 157 - 93 = 64$. The greatest common divisor $\gcd(48, 64) = 16$ (factors: 2, 4, 8, 16). Hence, $16$ (or a factor of 16) is the most likely keyword length.
</details>

---

### Question 16
**Mindmap Location:** 4. Classical Substitution Ciphers > Vigenère Autokey Cipher  
**Question:** How does the Vigenère Autokey cipher construct its key stream after exhausting the initial keyword?  
- A) It fills the remaining positions with pseudorandom numbers.  
- B) It appends the plaintext characters themselves as the subsequent key stream.  
- C) It loops the keyword in reverse alphabetical order.  
- D) It repeatedly doubles the keyword characters.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The Autokey cipher uses the keyword initially, followed by the plaintext itself ($K' = \text{keyword} \parallel P$) to generate the key stream.
</details>

---

### Question 17
**Mindmap Location:** 4. Classical Substitution Ciphers > Vernam Cipher (OTP)  
**Question:** The One-Time Pad (OTP) cipher achieves unconditional security (perfect secrecy). Which of the following describes an fatal error that completely compromises this security?  
- A) Using a key consisting of uppercase letters rather than binary digits.  
- B) Using the same key stream to encrypt two different plaintext messages.  
- C) Transmitting the ciphertext over an unencrypted physical cable.  
- D) Using a key whose length is exactly equal to the plaintext length.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Key reuse (Two-Time Pad) allows an attacker to compute $C_1 \oplus C_2 = P_1 \oplus P_2$, eliminating the key and enabling statistical text recovery.
</details>

---

### Question 18
**Mindmap Location:** 5. Classical Transposition Techniques > Rail Fence Cipher  
**Question:** What is the ciphertext generated by encrypting `"MEET ME"` (spaces ignored: `"MEETME"`) using a Rail Fence cipher with depth $d = 2$?  
- A) `"MEMETE"`  
- B) `"MTEMEE"`  
- C) `"MEM ETE"`  
- D) `"EMETEM"`  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> With depth $d = 2$:
- Rail 1 (even indices: 0, 2, 4): `M`, `E`, `M` $\rightarrow$ `MEM`
- Rail 2 (odd indices: 1, 3, 5): `E`, `T`, `E` $\rightarrow$ `ETE`
- Concatenating Rail 1 and Rail 2 yields: `MEMETE`.
</details>

---

### Question 19
**Mindmap Location:** 5. Classical Transposition Techniques > Rotor Machines  
**Question:** In the German Enigma rotor machine, what was the primary architectural consequence of incorporating a **reflector (Umkehrwalze)**?  
- A) It increased the mechanical stepping speed by a factor of 26.  
- B) It ensured encryption and decryption were reciprocal operations, but made it impossible for any character to encrypt to itself.  
- C) It eliminated the need for an electrical power supply.  
- D) It transformed the polyalphabetic substitution into a monoalphabetic substitution.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The reflector turned current back through the rotor stack, ensuring that if key `'A'` produced `'G'`, key `'G'` would produce `'A'`. However, this hardware design mathematically prevented any letter from ever encrypting to itself ($\pi(x) \neq x$).
</details>

---

### Question 20
**Mindmap Location:** 6. Steganography > LSB Image Steganography  
**Question:** Why does Least Significant Bit (LSB) steganography in 24-bit RGB bitmap images avoid human visual detection?  
- A) The human eye cannot detect light wavelengths in digital computer monitors.  
- B) Modifying the least significant bit alters the color channel luminescence by only $1/256 \approx 0.39\%$, which is below the human visual threshold.  
- C) The image is encrypted using AES before display.  
- D) The image file header strips the altered bits prior to rendering.  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Changing the LSB alters pixel channel intensity by at most $\pm 1$ level out of 256 ($0.39\%$), which is undetectable to the human eye under normal viewing conditions.
</details>
