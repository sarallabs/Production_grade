# Chapter 1: Question Bank — Security Concepts and Classical Encryption Techniques (Intermediate Level)

**Course:** Cryptography and Network Security (CNS)  
**Target Audience:** Undergraduate Computer Science & Engineering (B.Tech / B.E.)  
**Total Questions:** 30 (15 Short Answer Questions + 15 Long Answer Questions)  
**Curriculum Standard:** Chalapathi University Academic Framework  

---

## Part A: Short Answer Questions (15 Questions)

### Question 1
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Remember (L1) / Understand (L2)

**Question:**  
State the standard textbook definitions of **Computer Security**, **Network Security**, and **Information Security** according to RFC 2828 / NIST SP 800-33.

**Answer:**  
1. **Computer Security:** The protection afforded to an automated information system in order to attain the applicable objectives of preserving the integrity, availability, and confidentiality of information system resources (includes hardware, software, firmware, information/data, and telecommunications).
2. **Network Security:** Measures taken to protect data during their transmission over networked systems and communication links, preventing unauthorized interception, alteration, or disruption.
3. **Information Security:** The overarching discipline and practices of protecting information and information systems from unauthorized access, use, disclosure, disruption, modification, or destruction in order to provide confidentiality, integrity, and availability.

---

### Question 2
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
Differentiate between **Data Confidentiality** and **Privacy**, and between **Data Integrity** and **System Integrity**.

**Answer:**  
- **Data Confidentiality vs. Privacy:**
  - *Data Confidentiality:* Assures that private or confidential information is not made available or disclosed to unauthorized individuals. It focuses on shielding data content from unauthorized observers.
  - *Privacy:* Assures that individuals control or influence what information related to them may be collected and stored and by whom and to whom that information may be disclosed.
- **Data Integrity vs. System Integrity:**
  - *Data Integrity:* Assures that information and programs are changed only in a specified and authorized manner (preventing unauthorized insertion, modification, or deletion).
  - *System Integrity:* Assures that a system performs its intended function in an unimpaired manner, free from deliberate or inadvertent unauthorized manipulation of the system.

---

### Question 3
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Why are **passive attacks** generally addressed through *prevention* rather than *detection*, whereas **active attacks** are addressed through *detection and recovery* rather than *absolute prevention*?

**Answer:**  
- **Passive Attacks (e.g., eavesdropping, traffic analysis):**
  - They produce no alteration of data and leave no audit trails or transmission logs.
  - Because detection without an observable system state change is practically impossible, security efforts must focus strictly on **prevention** using robust cryptographic encryption.
- **Active Attacks (e.g., masquerade, replay, modification, DoS):**
  - Completely preventing active attacks across diverse physical networks, vulnerable operating systems, and open internet pathways is practically infeasible without disconnecting communication entirely.
  - Therefore, defense mechanisms focus on **detection** (e.g., MACs, hash digests, digital signatures, intrusion detection systems) and subsequent **recovery** (rollback, quarantine, session termination).

---

### Question 4
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
List the **Five Critical Ingredients** of a symmetric cipher system and define the relationship between the plaintext $X$, ciphertext $Y$, and key $K$.

**Answer:**  
The five ingredients are:
1. **Plaintext ($X$):** The original intelligible message or data.
2. **Encryption Algorithm ($E$):** The mathematical process that performs substitutions and transformations on plaintext.
3. **Secret Key ($K$):** Independent input parameter to the algorithm controlling the transformation.
4. **Ciphertext ($Y$):** The scrambled, unreadable output message produced.
5. **Decryption Algorithm ($D$):** The reverse encryption algorithm executing $D_K(Y) = X$.

**Mathematical Relationship:**
$$Y = E_K(X) = E(K, X)$$
$$X = D_K(Y) = D(K, Y)$$

---

### Question 5
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
State **Kerckhoffs's Principle** and explain its paramount importance in modern open cryptographic engineering.

**Answer:**  
**Kerckhoffs's Principle:**  
A cryptosystem should be secure even if everything about the system, except the secret key, is public knowledge.

**Engineering Significance:**
1. **Public Scrutiny:** Open algorithms (e.g., AES, RSA) are subjected to years of intense global cryptanalysis by independent researchers, ensuring flaws are discovered and fixed prior to enterprise deployment.
2. **Key Management Practicality:** If secrecy depended on keeping the algorithm secret (*security through obscurity*), compromising the algorithm would require revoking and redesigning all software and hardware. Changing an exposed key is trivial; redesigning algorithms is economically prohibitive.

---

### Question 6
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Encrypt the plaintext character `'W'` using the Caesar cipher with a shift key of $k = 17$. Then, demonstrate the decryption of the resulting ciphertext character back to plaintext.

**Answer:**  
- Character index mapping: $'A'=0, 'B'=1, \dots, 'W'=22$.
- Shift key $k = 17$.

**Encryption:**
$$C = (P + k) \pmod{26}$$
$$C = (22 + 17) \pmod{26} = 39 \pmod{26} = 13$$
- Index $13$ corresponds to the character **`'N'`**.

**Decryption:**
$$P = (C - k) \pmod{26}$$
$$P = (13 - 17) \pmod{26} = -4 \pmod{26} = (-4 + 26) \pmod{26} = 22$$
- Index $22$ maps back to **`'W'`**.

---

### Question 7
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Using the standard $5 \times 5$ Playfair matrix shown below, encrypt the plaintext digraphs **`"TH"`** and **`"BA"`**:
```
M O N A R
C H Y B D
E F G I K
L P Q S T
U V W X Z
```

**Answer:**  
1. **Digraph `"TH"`:**
   - Position of `T`: Row 3, Column 4 (0-indexed).
   - Position of `H`: Row 1, Column 1.
   - Rule applied: **Rectangle Rule** (replace each with the letter in its own row and the other's column).
   - Replacement for `T` (Row 3, Col 1) = **`P`**.
   - Replacement for `H` (Row 1, Col 4) = **`D`**.
   - Result: `"TH"` $\rightarrow$ **`"PD"`**.

2. **Digraph `"BA"`:**
   - Position of `B`: Row 1, Column 3.
   - Position of `A`: Row 0, Column 3.
   - Rule applied: **Same Column Rule** (shift circular down $+1$).
   - `B` (Row 1) shifts to Row 2, Col 3 $\rightarrow$ **`I`** (or `J`).
   - `A` (Row 0) shifts to Row 1, Col 3 $\rightarrow$ **`B`**.
   - Result: `"BA"` $\rightarrow$ **`"IB"`**.

---

### Question 8
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
In the Playfair cipher, why is the raw frequency distribution of single letters significantly flattened compared to a monoalphabetic substitution cipher?

**Answer:**  
- Monoalphabetic ciphers substitute each individual letter deterministically, preserving the unigram frequency profile (e.g., `'E'` always encrypts to the same ciphertext letter).
- The Playfair cipher encrypts **digraphs** (pairs of letters) as single units.
- In a 25-letter alphabet, there are $25 \times 25 = 625$ possible digraphs. Because the statistical variation across 625 digraphs is substantially more uniform and diffuse than across 26 individual letters, single-letter frequency analysis is neutralized.

---

### Question 9
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
What mathematical condition must a square key matrix $K$ satisfy in the Hill cipher to ensure that the decryption matrix $K^{-1} \pmod{26}$ exists?

**Answer:**  
For a matrix $K \in \mathbb{Z}_{26}^{m \times m}$ to be invertible modulo 26:
1. The determinant $\det(K)$ must be nonzero modulo 26.
2. The determinant must be **coprime to 26**:
   $$\gcd(\det(K), 26) = 1$$
3. This implies that $\det(K)$ cannot be divisible by the prime factors of 26 ($2$ and $13$). Namely, $\det(K)$ must be odd and not equal to $13$ or a multiple of $13$.

---

### Question 10
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
Define the **Vigenère Cipher** algebraic rule and explain how the key stream is formed when encrypting a message $P = p_0 p_1 \dots p_{n-1}$ with a keyword $K = k_0 k_1 \dots k_{m-1}$ where $m < n$.

**Answer:**  
- The keyword $K$ of length $m$ is repeated cyclically to form a running key stream $K' = k'_0 k'_1 \dots k'_{n-1}$ where $k'_i = K[i \pmod m]$.
- Each ciphertext character $c_i$ is computed via modular addition:
  $$c_i = (p_i + k'_i) \pmod{26}$$
- Decryption reverses the operation:
  $$p_i = (c_i - k'_i) \pmod{26}$$

---

### Question 11
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Why does the **Vigenère Autokey Cipher** fail to achieve unconditional security despite using non-repeating key material?

**Answer:**  
- The Autokey cipher concatenates a short initial keyword with the **plaintext itself** to generate the key stream (e.g., $K' = \text{KEY} \parallel P$).
- Although this eliminates strict periodic repetition of the keyword, both the key and the plaintext share the same statistical distribution of natural language.
- A cryptanalyst can exploit common high-frequency English words, n-gram patterns, and trial word combinations (crib dragging) to recover both the key stream and the message simultaneously.

---

### Question 12
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
State the two necessary conditions established by Claude Shannon for the **One-Time Pad (Vernam Cipher)** to achieve **Perfect Secrecy (Unconditional Security)**.

**Answer:**  
1. **Truly Random and Uniform Key:** The key stream must be generated by a truly nondeterministic physical random process, with length equal to or greater than the plaintext ($|K| \ge |P|$).
2. **Single-Use and Strict Secrecy:** The key must be used **exactly once** and destroyed immediately; it must never be reused in whole or in part, and must be known only to sender and recipient.

---

### Question 13
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Encrypt the message `"DEFEND THE EAST WALL"` using the **Rail Fence Cipher** with a depth of $d = 3$ (ignore spaces).

**Answer:**  
- Cleaned plaintext: `DEFENDTHEEASTWALL` (17 letters).
- Zig-zag pattern with 3 rails:
  - Rail 1 (indices 0, 4, 8, 12, 16): `D . . . N . . . E . . . T . . . L` $\rightarrow$ `D N E T L`
  - Rail 2 (indices 1, 3, 5, 7, 9, 11, 13, 15): `. E . E . D . H . E . S . W . L .` $\rightarrow$ `E E D H E S W L`
  - Rail 3 (indices 2, 6, 10, 14): `. . F . . . T . . . A . . . A . .` $\rightarrow$ `F T A A`
- Reading row by row gives ciphertext:
  $$\mathbf{\text{Ciphertext}} = \text{"DNETL EEDHE SWLFT AA"}$$

---

### Question 14
**Category:** Short Answer | **Marks:** 2 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
What fundamental vulnerability makes the **Row Transposition Cipher** vulnerable to multiple anagramming techniques?

**Answer:**  
- A transposition cipher only rearranges the positions of letters without changing their identities.
- Therefore, the single-letter frequency distribution of the ciphertext is completely identical to that of the plaintext.
- The cryptanalyst knows the exact letter counts and can use vowel-consonant ratios, common digram pairs (e.g., `TH`, `ER`, `ON`), and column length divisors to reorder the columns systematically.

---

### Question 15
**Category:** Short Answer | **Marks:** 3 | **Bloom's Taxonomy:** Understand (L2)

**Question:**  
Explain how **Least Significant Bit (LSB) Steganography** embeds hidden secret data inside a 24-bit RGB bitmap digital image without alerting a human observer.

**Answer:**  
- A 24-bit RGB pixel consists of 8 bits each for Red, Green, and Blue channels ($256$ intensity levels per channel).
- The least significant bit (bit 0) contributes only $2^0 = 1$ out of $255$ intensity levels ($\approx 0.39\%$ change in luminescence).
- By overwriting the LSB of consecutive color bytes with the bits of the secret message, the visual change is far below the threshold of human visual perception (Just Noticeable Difference), while allowing an automated receiver to read the LSB sequence directly.

---

## Part B: Long Answer Questions (15 Questions)

### Question 16
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Provide a comprehensive architectural breakdown of the **CIA Triad** and the **Three Aspects of Information Security** according to ITU-T Recommendation X.800. In your answer:
1. Define Confidentiality, Integrity, and Availability with appropriate enterprise examples.
2. Define the three facets: Security Attacks, Security Mechanisms, and Security Services.
3. Construct a clear table mapping three key X.800 Security Services to their implementing Security Mechanisms.

**Answer:**  
#### 1. The Core CIA Triad:
- **Confidentiality:**
  - *Definition:* Preserving authorized restrictions on information access and disclosure, including means for protecting personal privacy and proprietary information.
  - *Components:* Data Confidentiality (shielding message content) and Privacy (individual control over personal data collection/sharing).
  - *Enterprise Example:* Encrypting patient medical history records in an electronic healthcare database to comply with HIPAA regulations.
- **Integrity:**
  - *Definition:* Guarding against improper information modification or destruction, including ensuring information non-repudiation and authenticity.
  - *Components:* Data Integrity (content unchanged) and System Integrity (processes operating without unauthorized manipulation).
  - *Enterprise Example:* Financial ledger transactions where an unauthorized modification of an account balance is prevented and detected using cryptographic checksums.
- **Availability:**
  - *Definition:* Ensuring timely and reliable access to and use of information and system resources.
  - *Enterprise Example:* Maintaining high-availability DNS infrastructure with automatic failover and anti-DDoS scrubbing to guarantee uninterrupted e-commerce checkout.

#### 2. The Three Aspects of Security (X.800 / RFC 2828):
- **Security Attack:** Any action that compromises the security of information owned by an organization. Categorized broadly into Passive (traffic observation) and Active (modification/fabrication).
- **Security Mechanism:** A process (or device incorporating such a process) that is designed to detect, prevent, or recover from a security attack (e.g., encipherment, digital signature, access control).
- **Security Service:** A processing or communication service provided by a protocol layer of open systems to ensure adequate security of systems or data transfers.

#### 3. Mapping Matrix: Services to Mechanisms
| X.800 Security Service | Primary Defining Purpose | Implementing Security Mechanisms |
| :--- | :--- | :--- |
| **Peer Entity Authentication** | Confirms identity of communication endpoint | Digital Signatures, Cryptographic Challenge-Response tokens |
| **Data Confidentiality (Connectionless)** | Shields all user data across individual packets | Symmetric / Asymmetric Encipherment, Routing Control |
| **Data Integrity with Recovery** | Detects tampering and restores original data stream | Cryptographic Hash (MAC), Sequence numbering, ARQ retransmission |
| **Non-Repudiation (Origin)** | Proves sender identity to third parties | Digital Signatures, Notarization mechanisms |

---

### Question 17
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Classify and contrast **Passive Attacks** and **Active Attacks**. In your answer:
1. Detail the two types of passive attacks: *Release of Message Contents* and *Traffic Analysis*.
2. Detail the four types of active attacks: *Masquerade*, *Replay*, *Modification of Messages*, and *Denial of Service*.
3. Contrast them across the following parameters: Detection capability, Prevention feasibility, System state impact, and Primary defense technique.

**Answer:**  
#### 1. Passive Attacks:
- **Release of Message Contents:** The unauthorized reading of sensitive communications (e.g., intercepting an unencrypted email, wiretapping a telephone conversation).
- **Traffic Analysis:** Observing communication patterns (frequency, length, source, destination IP, timing) when contents are encrypted, enabling adversaries to deduce organizational relationships or impending corporate actions.

#### 2. Active Attacks:
- **Masquerade:** An entity pretends to be a different entity (e.g., using stolen credentials to access administrative APIs).
- **Replay:** The passive capture of a legitimate data unit and its subsequent retransmission to produce an unauthorized effect (e.g., resending a signed funds-transfer request).
- **Modification of Messages:** Altering, delaying, or reordering legitimate data stream segments (e.g., changing `"Transfer $1,000 to Account A"` to `"Transfer $100,000 to Account B"`).
- **Denial of Service (DoS):** Inhibiting or preventing the normal use or management of communications facilities (e.g., flooding a server with SYN packets or suppressing error reporting).

#### 3. Comparative Taxonomy Table:
| Parameter | Passive Attacks | Active Attacks |
| :--- | :--- | :--- |
| **Nature of Threat** | Eavesdropping / monitoring transmission channels | Tampering with data stream / system operations |
| **System State Impact** | Zero alteration; leaves no operational footprint | Direct modification of system state, data, or availability |
| **Detection Feasibility** | Extremely difficult or impossible on open transmission media | Readily detectable via checksums, sequence numbers, intrusion logs |
| **Prevention Feasibility** | Highly feasible using standard cryptographic encryption | Absolute prevention is impossible; focus is on detection & mitigation |
| **Primary Defense** | Symmetric & Asymmetric Encipherment | MACs, Hashes, Nonces, Access Controls, Firewalls |

---

### Question 18
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
Describe the **Model for Network Security** and the **Network Access Security Model**. Draw ASCII or conceptual workflow diagrams for both, and outline the four essential components required in designing any secure transmission service.

**Answer:**  
#### 1. Model for Network Security:
```
+----------------------------------------------------------------------------+
|                             SENDER (Source)                                |
|   [ Plaintext Message (X) ] ----> [ Transformation (Encryption with K) ]   |
+----------------------------------------------------------------------------+
                                     |
                                     v Ciphertext Message (Y)
                     ===================================
                     [     UNSECURE TRANSIT CHANNEL    ] <--- Opponent /
                     ===================================      Attacker
                                     |
                                     v Ciphertext Message (Y)
+----------------------------------------------------------------------------+
|                            RECEIVER (Destination)                          |
|   [ Inverse Transform (Decryption with K) ] ----> [ Plaintext Message (X) ]|
+----------------------------------------------------------------------------+
                                     ^
                                     | Secret Key (K)
                         +-----------------------+
                         | Trusted Third Party   |
                         | (Key Distribution KDC)|
                         +-----------------------+
```

#### 2. Network Access Security Model:
Used to protect internal IT assets and data stores against unauthorized remote access or malicious software:
```
                        [ Opponent / Intruder / Malicious Hacker ]
                                         |
                                         v
                         +-------------------------------+
                         |   Gatekeeper Subsystem        |
                         | (Firewall, Auth, IDS/IPS)     |
                         +-------------------------------+
                                         |
                                         v (Authorized Access Only)
                         +-------------------------------+
                         |   Protected Internal Assets   |
                         | (Databases, File Servers, OS) |
                         +-------------------------------+
                                         ^
                                         | Internal Security Controls
                         +-------------------------------+
                         | Security Guards & Monitored   |
                         | Antivirus / Audit Logs        |
                         +-------------------------------+
```

#### 3. Four Essential Design Components:
1. **Design a Security Algorithm:** Formulate a cryptographic algorithm that performs the security-related transformation (resistant to known cryptanalytic attacks).
2. **Generate Secret Information:** Establish processes to generate strong cryptographic keys used in conjunction with the algorithm.
3. **Develop Key Distribution Protocols:** Create secure channels and protocols to distribute and share the secret keys without compromise.
4. **Specify Communication Protocol:** Integrate the algorithm and keys into an end-to-end communication protocol (e.g., TLS, IPsec) to govern message transfer.

---

### Question 19
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Analyze the **Cryptanalytic Attack Classifications** based on the adversary's available knowledge:
1. Ciphertext-Only Attack (COA)
2. Known-Plaintext Attack (KPA)
3. Chosen-Plaintext Attack (CPA)
4. Chosen-Ciphertext Attack (CCA)  
For each attack class, explain the adversary's capabilities, their primary objective, and provide a real-world scenario illustrating how the attack is mounted.

**Answer:**  
#### 1. Ciphertext-Only Attack (COA):
- **Adversary Knowledge:** Only one or more intercepted ciphertext strings $Y_1, Y_2, \dots, Y_k$.
- **Objective:** Recover plaintexts $X_i$ or determine the underlying secret key $K$.
- **Methodology:** Statistical language analysis (letter frequencies, digrams, trigrams), exhaustive brute-force key search, or recognizing structured headers.
- **Scenario:** Intercepting encrypted radio packets sent over satellite links where the adversary has no control over or prior access to the underlying messages.

#### 2. Known-Plaintext Attack (KPA):
- **Adversary Knowledge:** One or more pairs of plaintext and their corresponding ciphertext: $(X_1, Y_1), (X_2, Y_2), \dots, (X_k, Y_k)$ encrypted under the same key $K$.
- **Objective:** Deduce the key $K$ or develop an algorithm to decrypt subsequent ciphertexts.
- **Methodology:** Linear algebra equation solving (e.g., Hill cipher), algebraic state tracking.
- **Scenario:** A standardized protocol always starts with a predictable header like `"HTTP/1.1 200 OK"` or `"\xFF\xD8\xFF"` (JPEG header). The adversary pairs the known header with the captured ciphertext.

#### 3. Chosen-Plaintext Attack (CPA):
- **Adversary Knowledge:** The adversary can submit arbitrary plaintexts of their choosing to an encryption oracle and obtain the corresponding ciphertexts: $X \mapsto Y = E_K(X)$.
- **Objective:** Exploit differential bit patterns or linear approximations to recover the key $K$.
- **Methodology:** Differential cryptanalysis; injecting specific plaintext vectors (e.g., all zeros, single-bit differences) to isolate key bits.
- **Scenario:** An adversary tricks a corporate email server into encrypting an externally submitted auto-forwarded message, observing the resulting encrypted outbound traffic.

#### 4. Chosen-Ciphertext Attack (CCA):
- **Adversary Knowledge:** The adversary has access to a decryption oracle; they can present arbitrary ciphertext strings $Y$ and obtain decrypted plaintexts $X = D_K(Y)$, except the target ciphertext $Y^*$.
- **Objective:** Derive key $K$ or decrypt $Y^*$.
- **Methodology:** Malleability attacks; manipulating ciphertext bits to deduce internal state or trigger informative error messages (e.g., padding oracle attacks).
- **Scenario:** An automated smart card authentication token that decrypts input challenges sent over an exposed interface.

---

### Question 20
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Apply (L3) / Analyze (L4)

**Question:**  
Examine the **Monoalphabetic Substitution Cipher**:
1. Calculate the total key space size and show why brute-force exhaustive search is computationally infeasible.
2. Explain in detail how **Frequency Analysis** breaks monoalphabetic ciphers. Include unigram frequency patterns of the English language (e.g., `E`, `T`, `A`, `O`, `I`, `N`), digram analysis (`TH`, `HE`), and word boundary techniques.

**Answer:**  
#### 1. Key Space Calculation & Brute Force Infeasibility:
- In a monoalphabetic substitution cipher, each of the 26 letters of the alphabet is mapped to a unique permutation of the alphabet.
- Total possible permutations:
  $$\text{Key Space} = 26! \approx 4.0329 \times 10^{26}$$
- If a high-performance supercomputer tests $10^{12}$ (one trillion) keys per second:
  $$\text{Time Required} = \frac{4.0329 \times 10^{26}}{10^{12}} \text{ seconds} \approx 4.03 \times 10^{14} \text{ s} \approx 1.28 \times 10^7 \text{ years}$$
- Thus, pure exhaustive brute-force search is impossible.

#### 2. Frequency Analysis Methodology:
Despite the vast key space, the cipher preserves the statistical signature of natural language:
- **Unigram Frequency Profiling:**
  - In standard English text, character frequencies are non-uniform:
    - High-frequency: `E` ($\approx 12.7\%$), `T` ($\approx 9.1\%$), `A` ($\approx 8.2\%$), `O` ($\approx 7.5\%$), `I` ($\approx 7.0\%$), `N` ($\approx 6.7\%$).
    - Low-frequency: `J`, `K`, `Q`, `X`, `Z` (all $< 0.5\%$).
  - A cryptanalyst counts letter occurrences in the ciphertext; the most frequent character is hypothesized as `E`, the second as `T`, etc.
- **Digram and Trigram Analysis:**
  - Common English digrams (`TH`, `HE`, `IN`, `ER`, `AN`, `RE`) and trigrams (`THE`, `AND`, `ING`, `ENT`) confirm or refute single-letter hypotheses.
  - If ciphertext character $\alpha$ appears frequently before $\beta$, and $\alpha$ is suspected to be `T`, $\beta$ is very likely `H`.
- **Structural and Word Boundary Clues:**
  - Single-letter words in English are restricted to `"a"` and `"I"`.
  - Double letters (e.g., `LL`, `EE`, `SS`, `OO`, `TT`) narrow down candidates.
  - Through iterative substitution and context deduction, the cipher is broken rapidly with only 50–100 characters of ciphertext.

---

### Question 21
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
The **Playfair Cipher** was the first practical digraph substitution cipher.
1. Formulate the matrix construction rules using the keyword **`"GUIDANCE"`**.
2. State the four fundamental operational rules for encrypting plaintext digraph pairs.
3. Encrypt the plaintext message: **`"MEET ME AT NOON"`** using your constructed matrix.

**Answer:**  
#### 1. Matrix Construction with Keyword `"GUIDANCE"`:
- Remove duplicate letters from keyword: `G - U - I - D - A - N - C - E` (all 8 letters unique).
- Fill remaining cells with unused alphabet letters in order, combining `I` and `J` into one cell:
```
Row 0:  G   U  I/J  D   A
Row 1:  N   C   E   B   F
Row 2:  H   K   L   M   O
Row 3:  P   Q   R   S   T
Row 4:  V   W   X   Y   Z
```

#### 2. The Four Playfair Encryption Rules:
1. **Repeated Letter Handling:** If both letters in a pair are identical (or if an odd letter remains at the end), insert a filler letter (typically `'X'`).
2. **Same Row Rule:** If both letters fall in the same row, replace each with the letter immediately to its right (circularly wrapping from column 4 to 0).
3. **Same Column Rule:** If both letters fall in the same column, replace each with the letter immediately below it (circularly wrapping from row 4 to 0).
4. **Rectangle Rule:** If letters are in different rows and columns, each letter is replaced by the letter in its own row and the other letter's column.

#### 3. Step-by-Step Encryption of `"MEET ME AT NOON"`:
- Prepare digraph pairs (insert `'X'` between repeated `'EE'`):
  - `M E` $\rightarrow$ different row/col $\rightarrow$ Rect: `M` (Row 2, Col 3) and `E` (Row 1, Col 2) $\rightarrow$ `M` becomes Row 2, Col 2 (**`L`**), `E` becomes Row 1, Col 3 (**`B`**) $\rightarrow$ **`LB`**
  - `E T` $\rightarrow$ different row/col: `E` (1,2), `T` (3,4) $\rightarrow$ `E` becomes (1,4)=**`F`**, `T` becomes (3,2)=**`R`** $\rightarrow$ **`FR`**
  - `M E` $\rightarrow$ same as above $\rightarrow$ **`LB`**
  - `A T` $\rightarrow$ same column (Col 4: Row 0 `A`, Row 3 `T`): Shift down $\rightarrow$ `A` becomes Row 1 (**`F`**), `T` becomes Row 4 (**`Z`**) $\rightarrow$ **`FZ`**
  - `N O` $\rightarrow$ different row/col: `N` (1,0), `O` (2,4) $\rightarrow$ `N` becomes (1,4)=**`F`**, `O` becomes (2,0)=**`H`** $\rightarrow$ **`FH`**
  - `O N` $\rightarrow$ `O` (2,4), `N` (1,0) $\rightarrow$ `O` becomes (2,0)=**`H`**, `N` becomes (1,4)=**`F`** $\rightarrow$ **`HF`**
- **Final Ciphertext:**
  $$\mathbf{\text{Ciphertext}} = \text{"LB FR LB FZ FH HF"}$$

---

### Question 22
**Category:** Long Answer | **Marks:** 12 | **Bloom's Taxonomy:** Apply (L3) / Evaluate (L5)

**Question:**  
Consider the **Hill Cipher** operating over $\mathbb{Z}_{26}$:
Given the key matrix:
$$K = \begin{pmatrix} 3 & 2 \\ 5 & 7 \end{pmatrix}$$
1. Verify mathematically whether $K$ is invertible modulo 26.
2. Derive the explicit decryption matrix $K^{-1} \pmod{26}$ showing all steps (determinant, modular multiplicative inverse, adjugate matrix).
3. Encrypt the plaintext **`"HELP"`** into ciphertext.
4. Decrypt the first two ciphertext letters to prove mathematical correctness.

**Answer:**  
#### 1. Invertibility Verification:
$$\det(K) = (ad - bc) = (3 \times 7 - 2 \times 5) = (21 - 10) = 11$$
$$\gcd(11, 26) = 1$$
Since $\det(K) = 11$ is coprime to 26, the inverse matrix $K^{-1} \pmod{26}$ exists.

#### 2. Derivation of Decryption Matrix $K^{-1} \pmod{26}$:
- **Step 2a: Find Modular Multiplicative Inverse of $\det(K) = 11 \pmod{26}$:**
  We solve $11 \cdot x \equiv 1 \pmod{26}$:
  - $11 \times 1 = 11$
  - $11 \times 7 = 77 = 26 \times 2 + 25 \equiv -1$
  - $11 \times 19 = 209 = 26 \times 8 + 1 \equiv 1 \pmod{26}$
  - Thus, $\det(K)^{-1} \equiv 19 \pmod{26}$.
- **Step 2b: Compute the Adjugate Matrix:**
  $$\text{adj}(K) = \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = \begin{pmatrix} 7 & -2 \\ -5 & 3 \end{pmatrix} \equiv \begin{pmatrix} 7 & 24 \\ 21 & 3 \end{pmatrix} \pmod{26}$$
- **Step 2c: Multiply by $\det(K)^{-1}$ modulo 26:**
  $$K^{-1} \equiv 19 \cdot \begin{pmatrix} 7 & 24 \\ 21 & 3 \end{pmatrix} \pmod{26}$$
  - $19 \times 7 = 133 = 26 \times 5 + 3 \equiv 3$
  - $19 \times 24 = 19 \times (-2) = -38 \equiv -38 + 52 = 14$
  - $19 \times 21 = 19 \times (-5) = -95 \equiv -95 + 104 = 9$
  - $19 \times 3 = 57 = 26 \times 2 + 5 \equiv 5$
  $$K^{-1} = \begin{pmatrix} 3 & 14 \\ 9 & 5 \end{pmatrix}$$

#### 3. Encryption of `"HELP"`:
- Plaintext mapping: `H` = 7, `E` = 4, `L` = 11, `P` = 15.
- **Block 1: `"HE"` = $\begin{pmatrix} 7 \\ 4 \end{pmatrix}$:**
  $$C_1 = \begin{pmatrix} 3 & 2 \\ 5 & 7 \end{pmatrix} \begin{pmatrix} 7 \\ 4 \end{pmatrix} = \begin{pmatrix} 3(7) + 2(4) \\ 5(7) + 7(4) \end{pmatrix} = \begin{pmatrix} 21 + 8 \\ 35 + 28 \end{pmatrix} = \begin{pmatrix} 29 \\ 63 \end{pmatrix} \equiv \begin{pmatrix} 3 \\ 11 \end{pmatrix} \pmod{26}$$
  - $3 \rightarrow$ **`D`**, $11 \rightarrow$ **`L`**.
- **Block 2: `"LP"` = $\begin{pmatrix} 11 \\ 15 \end{pmatrix}$:**
  $$C_2 = \begin{pmatrix} 3 & 2 \\ 5 & 7 \end{pmatrix} \begin{pmatrix} 11 \\ 15 \end{pmatrix} = \begin{pmatrix} 3(11) + 2(15) \\ 5(11) + 7(15) \end{pmatrix} = \begin{pmatrix} 33 + 30 \\ 55 + 105 \end{pmatrix} = \begin{pmatrix} 63 \\ 160 \end{pmatrix} \equiv \begin{pmatrix} 11 \\ 4 \end{pmatrix} \pmod{26}$$
  - $11 \rightarrow$ **`L`**, $4 \rightarrow$ **`E`**.
- **Ciphertext:** **`"DLLE"`**.

#### 4. Decryption of First Block `"DL"`:
$$P_1 = K^{-1} C_1 = \begin{pmatrix} 3 & 14 \\ 9 & 5 \end{pmatrix} \begin{pmatrix} 3 \\ 11 \end{pmatrix} = \begin{pmatrix} 3(3) + 14(11) \\ 9(3) + 5(11) \end{pmatrix} = \begin{pmatrix} 9 + 154 \\ 27 + 55 \end{pmatrix} = \begin{pmatrix} 163 \\ 82 \end{pmatrix} \pmod{26}$$
- $163 \pmod{26} = 163 - 156 = 7 \rightarrow$ **`H`**.
- $82 \pmod{26} = 82 - 78 = 4 \rightarrow$ **`E`**.
- Recovered: **`"HE"`** (Exact match).

---

### Question 23
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4)

**Question:**  
Explain the cryptanalysis of the **Vigenère Cipher**:
1. Detail how the **Kasiski Examination** discovers the length of the secret keyword $m$.
2. Explain how the ciphertext is divided into $m$ independent monoalphabetic streams.
3. Describe how frequency analysis or mutual index of coincidence is applied to each stream to determine the exact key letters.

**Answer:**  
#### 1. Kasiski Examination for Keyword Length $m$:
- The Vigenère cipher encrypts identical plaintext letter groups with the same key letters if they occur at intervals that are exact multiples of the keyword length $m$.
- **Procedure:**
  1. Scan the ciphertext for repeated sequences of three or more characters (e.g., trigrams like `"VCS"`).
  2. Record the distances (differences in character indices) between repeated occurrences: $d_1, d_2, \dots, d_r$.
  3. Compute the Greatest Common Divisor (GCD) of these displacement distances:
     $$m \approx \gcd(d_1, d_2, \dots, d_r)$$
  4. The most prominent common factors represent the most probable candidate values for keyword length $m$.

#### 2. Decomposition into Monoalphabetic Streams:
- Once the period $m$ is established, the ciphertext $C = c_0 c_1 c_2 \dots c_{N-1}$ is partitioned into $m$ disjoint subsets:
  $$S_j = \{ c_i \mid i \equiv j \pmod m \} \quad \text{for } j = 0, 1, \dots, m-1$$
- Because every character within subset $S_j$ was encrypted using the exact same key letter $k_j$, each subset $S_j$ is a pure **Caesar cipher** (monoalphabetic shift).

#### 3. Key Letter Recovery:
- For each slice $S_j$:
  - Calculate the unigram frequency distribution of the characters in $S_j$.
  - Correlate the observed frequencies against standard English letter frequencies by testing all 26 possible shifts $s \in \{0, 1, \dots, 25\}$:
    $$A(s) = \sum_{i=0}^{25} f_i \cdot p_{(i - s) \pmod{26}}$$
  - The shift $s$ that maximizes this correlation corresponds to key character $k_j$.
- Concatenating $k_0, k_1, \dots, k_{m-1}$ yields the full keyword.

---

### Question 24
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Examine the **Rotor Machines** (e.g., the German Enigma machine):
1. Explain the mechanical and electrical principles of rotating wired cylinders (rotors).
2. Explain the role of the **reflector** and the **stepped odometer movement**.
3. Why did rotor machines represent a major leap over manual polyalphabetic ciphers, and what was their cryptographic Achilles' heel?

**Answer:**  
#### 1. Mechanical & Electrical Working Principles:
- A rotor is a cylinder with 26 electrical contacts on each face, connected internally by a complex labyrinth of insulated wires.
- The internal wiring defines an arbitrary monoalphabetic permutation $\pi: \{0,\dots,25\} \to \{0,\dots,25\}$.
- When multiple rotors are placed in series (e.g., 3 to 5 rotors), the composite electrical path through the bank is the composition of their permutations:
  $$\Pi_{\text{total}} = \pi_3 \circ \pi_2 \circ \pi_1$$
- With each keystroke, the fast rotor steps forward by $1/26$th of a revolution, changing its input-output alignment:
  $$\pi_{1, t}(x) = (\pi_1(x + t) - t) \pmod{26}$$

#### 2. The Odometer Stepping Mechanism and Reflector:
- **Odometer Stepping:** Similar to an automobile odometer, when the fast rotor completes 26 steps, a mechanical notch engages the middle rotor to step once; when the middle rotor completes 26 steps, the slow rotor steps. For a 3-rotor bank, the period before the substitution sequence repeats is $26 \times 26 \times 26 = 17,576$.
- **Reflector (Umkehrwalze):** A fixed wired disc at the end of the rotor bank that pairs contacts and sends the current back through the rotors in reverse order along a different path.
  - *Advantage:* Makes encryption and decryption symmetrical (pressing key `'A'` yielding `'Q'` means pressing `'Q'` yields `'A'`).
  - *Fatal Flaw:* The reflector guarantees that **no letter can ever encrypt to itself** ($\pi(x) \neq x$).

#### 3. Significance and Vulnerabilities:
- **Major Leap:** Provided polyalphabetic substitution with an astronomical period ($17,576$ to millions with stepping rings and plugboards), rendering manual Kasiski methods useless.
- **Vulnerabilities:**
  - The property $\Pi(x) \neq x$ drastically pruned the search space for cryptanalysts (used extensively by Marian Rejewski and Alan Turing in the Bombe machines).
  - Operator mistakes (e.g., stereotyped daily weather reports, repeated message indicators) provided known-plaintext cribs.

---

### Question 25
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Apply (L3)

**Question:**  
Explain and contrast the **Rail Fence Cipher** and the **Row Transposition Cipher**:
1. Encrypt the plaintext **`"CRYPTOGRAPHY AND NETWORK SECURITY"`** using a Row Transposition Cipher with the numerical key **`4 2 1 6 3 5`** (pad trailing spaces with `'X'`).
2. Show the detailed grid arrangement and output ciphertext.
3. Compare both ciphers regarding diffusion, key space, and vulnerability to frequency cryptanalysis.

**Answer:**  
#### 1 & 2. Row Transposition Encryption:
- Cleaned message: `CRYPTOGRAPHYANDNETWORKSECURITY` (30 letters).
- Key length $m = 6$. Number of rows required = $30 / 6 = 5$ rows. No padding required.
- Construct the $5 \times 6$ table:
```
Key Order:   4   2   1   6   3   5
----------------------------------
Row 1:       C   R   Y   P   T   O
Row 2:       G   R   A   P   H   Y
Row 3:       A   N   D   N   E   T
Row 4:       W   O   R   K   S   E
Row 5:       C   U   R   I   T   Y
```
- Read columns out in the numerical ascending order of key digits ($1, 2, 3, 4, 5, 6$):
  - **Col with Key '1' (Col index 2):** `Y A D R R`
  - **Col with Key '2' (Col index 1):** `R R N O U`
  - **Col with Key '3' (Col index 4):** `T H E S T`
  - **Col with Key '4' (Col index 0):** `C G A W C`
  - **Col with Key '5' (Col index 5):** `O Y T E Y`
  - **Col with Key '6' (Col index 3):** `P P N K I`
- **Output Ciphertext:**
  $$\mathbf{\text{Ciphertext}} = \text{"YADRR RRNOU THEST CGAWC OYTEY PPNKI"}$$

#### 3. Comparison Between Rail Fence and Row Transposition:
| Parameter | Rail Fence Cipher | Row Transposition Cipher |
| :--- | :--- | :--- |
| **Permutation Geometry** | Fixed diagonal zig-zag across $d$ rails | Arbitrary rectangular column permutation |
| **Key Space** | Trivial: bounded by message length ($2 \le d \le N$) | Factorial growth: $m!$ for key length $m$ (e.g., $6! = 720$) |
| **Diffusion Quality** | Poor; adjacent letters are separated by fixed steps | Moderate; shuffles characters across rectangular blocks |
| **Frequency Vulnerability** | Unaltered single-letter frequencies; trivial brute force | Identical unigrams; solved via anagramming and digram frequency tables |

---

### Question 26
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Compare and contrast **Cryptography** and **Steganography**:
1. Detail their fundamental security objectives, operational mechanisms, and detection criteria.
2. Describe three classic steganographic techniques: Character spacing / invisible ink, Digital LSB substitution, and TCP/IP header covert channels.
3. Discuss how cryptography and steganography can be combined in modern high-assurance secure communications.

**Answer:**  
#### 1. Core Comparison:
| Dimension | Cryptography | Steganography |
| :--- | :--- | :--- |
| **Core Objective** | Conceals the **meaning** of the message | Conceals the **existence** of the communication |
| **Ciphertext Appearance** | Obvious gibberish; alerts interceptor to secret data | Completely innocuous host media (photo, audio, cover text) |
| **Security Failure** | Decryption by adversary without the key | Detection / discovery of the hidden carrier by adversary |
| **Attacker Goal** | Recover plaintext or secret key $K$ | Prove that secret data exists (Steganalysis) |

#### 2. Three Steganographic Techniques:
1. **Character Spacing / Formatter Encoding:**
   - Modifying white spaces at the ends of lines, adding invisible zero-width Unicode spaces (`\u200B`), or altering kerning between characters in PDF/HTML files to encode binary bits ($0$ = single space, $1$ = double space).
2. **Digital Image LSB Substitution:**
   - In 24-bit bitmap or uncompressed audio files, overwriting the least significant bit of successive samples with secret message bits. The amplitude variations are well beneath human sensory thresholds.
3. **TCP/IP Header Covert Channels:**
   - Embedding data within unused, optional, or pseudo-random fields of protocol headers (e.g., the 32-bit Initial Sequence Number (ISN) field in TCP SYN packets or the IP Identification field).

#### 3. Integrated Cryptographic-Steganographic System:
- **Layered Security Architecture:**
  1. *Step 1 (Encryption):* Plaintext message $P$ is first encrypted using AES-256 with key $K_1$ to produce ciphertext $C = E_{K_1}(P)$. The ciphertext appears indistinguishable from pure white noise.
  2. *Step 2 (Embedding):* $C$ is embedded into a high-resolution carrier image using a pseudorandom LSB scattering sequence seeded by key $K_2$.
- **Security Resilience:** If a steganalyst detects anomalous statistical artifacts in the image, they obtain only high-entropy encrypted ciphertext $C$, which remains mathematically unbreakable without $K_1$.

---

### Question 27
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Analyze (L4) / Apply (L3)

**Question:**  
Explain why the Hill Cipher is completely vulnerable to a **Known-Plaintext Attack (KPA)**:
1. Formulate the matrix equation relating $m$ known plaintext-ciphertext pairs of dimension $m$.
2. State the condition under which the known plaintext matrix $X$ is invertible modulo 26.
3. Show how the key matrix $K$ is directly recovered by solving the linear algebraic system.

**Answer:**  
#### 1. Formulation of the Linear System:
- Suppose a Hill cipher uses an $m \times m$ key matrix $K$.
- An adversary obtains at least $m$ plaintext-ciphertext vector pairs $(p_1, c_1), (p_2, c_2), \dots, (p_m, c_m)$ where:
  $$c_j = K p_j \pmod{26}$$
- We arrange the column vectors into two $m \times m$ matrices:
  $$X = [p_1 \; p_2 \; \dots \; p_m] \quad \text{and} \quad Y = [c_1 \; c_2 \; \dots \; c_m]$$
- The entire system can be written as a single matrix multiplication:
  $$Y \equiv K \cdot X \pmod{26}$$

#### 2. Invertibility Condition for $X$:
- The adversary must select $m$ plaintext vectors such that the matrix $X$ is nonsingular modulo 26:
  $$\gcd(\det(X), 26) = 1$$
- If $\det(X)$ shares a common factor with 2 or 13, the adversary simply collects additional known plaintext-ciphertext pairs until an invertible $m \times m$ block $X$ is formed.

#### 3. Key Recovery:
- Once an invertible matrix $X$ is obtained, multiply both sides of the matrix equation from the right by $X^{-1} \pmod{26}$:
  $$Y \cdot X^{-1} \equiv K \cdot X \cdot X^{-1} \pmod{26}$$
  $$K \equiv Y \cdot X^{-1} \pmod{26}$$
- **Computational Complexity:** Solving this requires calculating $X^{-1} \pmod{26}$ and performing one matrix multiplication—taking $O(m^3)$ operations, which executes in milliseconds for typical matrix dimensions ($m=2, 3, 4$).
- Thus, the Hill cipher provides **zero security** against an attacker with known plaintext.

---

### Question 28
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Evaluate (L5)

**Question:**  
Critically evaluate the **Vernam Cipher (One-Time Pad)**:
1. Prove why the One-Time Pad provides **unconditional security (perfect secrecy)** from an information-theoretic viewpoint.
2. Explain the fundamental distinction between **Computational Security** and **Unconditional Security**.
3. Identify the three severe practical limitations that prevent the One-Time Pad from being universally deployed in internet protocols.

**Answer:**  
#### 1. Information-Theoretic Proof of Perfect Secrecy:
- Let plaintext $X$, key $K$, and ciphertext $Y$ be binary strings of length $N$, with $Y = X \oplus K$.
- If $K$ is chosen uniformly at random from $\{0, 1\}^N$, then for every possible plaintext $X'$ of length $N$, there exists a unique key $K' = X' \oplus Y$ that produces the observed ciphertext $Y$.
- Since all keys are equally likely with probability $P(K = K') = 2^{-N}$:
  $$P(Y \mid X = X') = P(K = X' \oplus Y) = 2^{-N}$$
- By Bayes' theorem, the posterior probability of the plaintext given the ciphertext equals the prior probability:
  $$P(X = X' \mid Y) = P(X = X')$$
- Observing the ciphertext provides **zero additional information** about the plaintext. An interceptor with infinite computing power could decrypt $Y$ into every valid English sentence of length $N$, with no mathematical way to determine which was the original message.

#### 2. Computational vs. Unconditional Security:
- **Unconditional Security:** The cipher cannot be broken, even with infinite computational power and unlimited time, because the ciphertext simply lacks sufficient information to determine the plaintext uniquely.
- **Computational Security:** The cipher can theoretically be broken, but the computational cost to do so exceeds the value of the protected information, or the time required exceeds the lifetime of the information's sensitivity (e.g., breaking AES-128 requires billions of years).

#### 3. Practical Limitations of the One-Time Pad:
1. **Key Distribution Problem:** Generating and securely delivering a truly random key that is as long as the entire data volume to be transmitted requires an already secure channel of equivalent capacity.
2. **Key Generation and Storage:** Generating gigabytes or terabytes of truly random physical bits (not pseudorandom PRNG output) and storing them securely on endpoints is technically challenging and expensive.
3. **Vulnerability to Key Reuse:** If a one-time pad key is accidentally reused even once ($Y_1 = X_1 \oplus K$ and $Y_2 = X_2 \oplus K$), then $Y_1 \oplus Y_2 = X_1 \oplus X_2$. The two plaintexts can then be separated and broken easily using statistical language techniques (Two-Time Pad attack).

---

### Question 29
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Apply (L3)

**Question:**  
Discuss the **X.800 Security Architecture for OSI**:
1. Enumerate the five primary categories of **Security Services** defined by X.800.
2. Enumerate the eight specific **Security Mechanisms** that implement these services.
3. Provide a matrix detailing which security mechanisms are capable of providing each of the five security service categories.

**Answer:**  
#### 1. Five Major X.800 Security Services:
1. **Authentication:** Assures that communicating entities are who they claim to be (Peer Entity Authentication and Data Origin Authentication).
2. **Access Control:** Prevention of unauthorized use of a resource (limiting access based on identity and privileges).
3. **Data Confidentiality:** Protection of data from unauthorized disclosure (Connection, Connectionless, Selective-Field, and Traffic Flow Confidentiality).
4. **Data Integrity:** Assurance that data received is exactly as sent by an authorized entity without modification, insertion, deletion, or replay.
5. **Non-Repudiation:** Protection against denial by one of the entities involved in a communication (Non-repudiation of Origin and Destination).

#### 2. Eight Specific Security Mechanisms:
1. **Encipherment:** Mathematical encryption algorithms (symmetric or asymmetric).
2. **Digital Signatures:** Cryptographic transformation of data allowing verification of source and integrity.
3. **Access Control Mechanisms:** Verification of credentials and access rights.
4. **Data Integrity Mechanisms:** Cryptographic checksums, MACs, and hash codes.
5. **Authentication Exchanges:** Interactive challenge-response protocol handshakes.
6. **Traffic Padding:** Insertion of spurious bits into data streams to thwart traffic analysis.
7. **Routing Control:** Selection of physically or logically secure routes for sensitive transmissions.
8. **Notarization:** Use of trusted third parties to assure communication properties.

#### 3. Service-Mechanism Mapping Matrix:
| Security Service | Encipherment | Digital Signature | Access Control | Data Integrity | Auth Exchange | Traffic Padding | Routing Control | Notarization |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication** | $\checkmark$ | $\checkmark$ | | | $\checkmark$ | | | |
| **Access Control** | | | $\checkmark$ | | | | | |
| **Data Confidentiality** | $\checkmark$ | | | | | $\checkmark$ | $\checkmark$ | |
| **Data Integrity** | $\checkmark$ | $\checkmark$ | | $\checkmark$ | | | | |
| **Non-Repudiation** | | $\checkmark$ | | $\checkmark$ | | | | $\checkmark$ |

---

### Question 30
**Category:** Long Answer | **Marks:** 10 | **Bloom's Taxonomy:** Understand (L2) / Analyze (L4)

**Question:**  
Analyze the role of **Substitution** and **Transposition** in classical cryptosystems and their modern evolution:
1. Define the fundamental differences between substitution techniques and transposition techniques.
2. Give two classical examples of each type and explain their internal cryptographic operations.
3. Explain how Claude Shannon's dual concepts of **Diffusion** and **Confusion** build upon these classical techniques to form modern product ciphers (e.g., DES and AES).

**Answer:**  
#### 1. Fundamental Differences:
- **Substitution Techniques:**
  - The letters or bit-patterns of the plaintext are replaced by other letters, numbers, or symbols.
  - The spatial locations/ordering of characters remain unchanged, but their identities are altered.
- **Transposition (Permutation) Techniques:**
  - The original characters are preserved without modification, but their sequence/ordering is scrambled.
  - Unigram character frequencies remain 100% identical to the plaintext, but n-gram structures are dispersed.

#### 2. Classical Examples:
- **Substitution Examples:**
  - *Caesar Cipher:* Shifts each letter by a fixed displacement modulo 26 ($c = (p + k) \pmod{26}$).
  - *Playfair Cipher:* Encrypts letter pairs (digraphs) simultaneously using a $5 \times 5$ grid, dispersing letter frequencies across 625 combinations.
- **Transposition Examples:**
  - *Rail Fence Cipher:* Writes plaintext diagonally in a zig-zag across multiple rails and reads out row by row.
  - *Row Transposition Cipher:* Writes plaintext into a rectangular matrix of fixed width $m$ and reads columns out according to a numerical permutation key.

#### 3. Shannon's Principles of Confusion and Diffusion in Modern Product Ciphers:
Claude Shannon observed that neither substitution nor transposition alone provides sufficient cryptographic security against statistical analysis. He proposed **Product Ciphers**, which alternate substitution and transposition in successive rounds:
- **Confusion (Realized via Substitution):**
  - Seeks to make the mathematical relationship between the statistics of the ciphertext and the value of the encryption key as complex and involved as possible.
  - Modern ciphers implement this through non-linear **S-Boxes** (Substitution Boxes in DES and SubBytes in AES).
- **Diffusion (Realized via Transposition / Permutation):**
  - Seeks to spread the statistical influence of individual plaintext digits over many ciphertext digits, so that each plaintext bit affects many ciphertext bits.
  - Modern ciphers implement this via **P-Boxes**, ShiftRows, and MixColumns transformations in AES.
- **Result:** Combining repeated rounds of Substitution (Confusion) and Transposition (Diffusion) creates an **Avalanche Effect**, rendering statistical cryptanalysis computationally intractable.

