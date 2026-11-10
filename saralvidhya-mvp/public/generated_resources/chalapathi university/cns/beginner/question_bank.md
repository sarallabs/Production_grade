# Question Bank: Security Concepts & Classical Encryption (Beginner Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Total Questions:** 30 Questions (15 Short Answer + 15 Long Answer)  
**Academic Target:** Foundational Knowledge & Concept Mastery  

---

## PART A: SHORT ANSWER QUESTIONS (15 QUESTIONS)

### Question 1
**Mindmap Location:** 1. Security Concepts & Attacks > Security Disciplines  
**Question:** Define Computer Security, Network Security, and Information Security.  
**Solution:**  
* **Computer Security:** Generic name for the collection of tools designed to protect data and to thwart hackers.  
* **Network Security:** Measures to protect data during their transmission across communication networks.  
* **Information Security:** Safeguarding an organization's data assets from unauthorized access, modification, or destruction.  

---

### Question 2
**Mindmap Location:** 1. Security Concepts & Attacks > Three Aspects  
**Question:** What are the three essential aspects of information security?  
**Solution:**  
The three essential aspects are:  
1. **Security Attacks:** Any action that compromises the security of information.  
2. **Security Mechanisms:** Processes and tools designed to detect, prevent, or recover from attacks.  
3. **Security Services:** Capabilities that enforce security policies on systems and data transfers.  

---

### Question 3
**Mindmap Location:** 1. Security Concepts & Attacks > Passive Attacks  
**Question:** Differentiate between Release of Message Contents and Traffic Analysis.  
**Solution:**  
* **Release of Message Contents:** The opponent intercepts and reads confidential messages (e.g. emails, phone conversations, files).  
* **Traffic Analysis:** The message is encrypted, but the opponent observes the frequency, duration, packet length, and communication partners to deduce sensitive information.  

---

### Question 4
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** What is a Masquerade attack? Give a real-world example.  
**Solution:**  
A masquerade takes place when one entity pretends to be a different entity.  
* *Example:* An unauthorized user captures valid login credentials and signs into an online banking portal pretending to be the legitimate account owner to withdraw funds.  

---

### Question 5
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** Explain the concept of a Replay attack in network security.  
**Solution:**  
A replay attack involves the passive capture of an authentic data transmission and its subsequent retransmission to produce an unauthorized effect (e.g., re-sending an authentic "Transfer $1,000" packet multiple times).  

---

### Question 6
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** What is Denial of Service (DoS), and what is its goal?  
**Solution:**  
A Denial of Service attack inhibits or halts normal communications and system usage by flooding resources (e.g., overwhelming a web server with bogus requests so legitimate users cannot access it).  

---

### Question 7
**Mindmap Location:** 2. Security Services > Authentication  
**Question:** What is the primary difference between Peer Entity Authentication and Data Origin Authentication?  
**Solution:**  
* **Peer Entity Authentication:** Confirms the identity of the communicating entity during the initial connection setup phase.  
* **Data Origin Authentication:** Verifies the true sender of an individual, connectionless data packet without managing duplicate packets.  

---

### Question 8
**Mindmap Location:** 2. Security Services > Nonrepudiation  
**Question:** What is Nonrepudiation, and why is it important in electronic commerce?  
**Solution:**  
Nonrepudiation prevents communicating parties from denying a previously sent or received message.  
* **Proof of Origin:** Protects the receiver by proving the sender dispatched the message.  
* **Proof of Destination:** Protects the sender by proving the receiver took delivery. In e-commerce, it prevents buyers from claiming "I never authorized that purchase."  

---

### Question 9
**Mindmap Location:** 4. Symmetric Cipher Model > Five Ingredients  
**Question:** List the five ingredients of a symmetric cipher model.  
**Solution:**  
1. **Plaintext ($X$):** The original readable message.  
2. **Encryption Algorithm ($E$):** Performs transformations on plaintext.  
3. **Secret Key ($K$):** Independent input parameter that dictates transformations.  
4. **Ciphertext ($Y$):** The scrambled output stream ($Y = E_K(X)$).  
5. **Decryption Algorithm ($D$):** Reverse algorithm restoring plaintext ($X = D_K(Y)$).  

---

### Question 10
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptographic Dimensions  
**Question:** Distinguish between Block Ciphers and Stream Ciphers.  
**Solution:**  
* **Block Cipher:** Processes input in fixed-size blocks (e.g., 64-bit or 128-bit blocks) producing an output block for each input block.  
* **Stream Cipher:** Processes input elements continuously one element (character or bit) at a time as it goes along.  

---

### Question 11
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptanalysis  
**Question:** What is a Brute-Force attack, and how many keys must be tested on average?  
**Solution:**  
A brute-force attack tries every possible key in the keyspace until the plaintext is recovered. On average, $50\%$ (half) of all possible keys must be tested before success is achieved.  

---

### Question 12
**Mindmap Location:** 5. Classical Substitution Techniques > Caesar Cipher  
**Question:** State the encryption and decryption formulas for the Caesar cipher with a shift of $k=3$.  
**Solution:**  
Let $p$ be plaintext and $c$ be ciphertext ($0 \le p, c \le 25$):  
* **Encryption:** $c = (p + 3) \pmod{26}$  
* **Decryption:** $p = (c - 3) \pmod{26}$  

---

### Question 13
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Question:** In the Playfair cipher, what rule is applied when two plaintext letters fall into the same row of the matrix?  
**Solution:**  
Each letter is replaced by the letter immediately to its right in that row, circularly wrapping around to the first element of the row if a letter is at the end.  

---

### Question 14
**Mindmap Location:** 5. Classical Substitution Techniques > Vernam Cipher  
**Question:** Write the binary mathematical operation used in the Vernam cipher for encryption and decryption.  
**Solution:**  
The Vernam cipher uses the bitwise XOR ($\oplus$) operator:  
* **Encryption:** $C_i = P_i \oplus K_i$  
* **Decryption:** $P_i = C_i \oplus K_i$  

---

### Question 15
**Mindmap Location:** 6. Transposition Techniques > Steganography  
**Question:** Define Steganography and state how it differs from Cryptography.  
**Solution:**  
* **Steganography:** The art and science of hiding the *very existence* of a message (e.g. invisible ink, image LSB replacement).  
* **Difference:** Cryptography scrambles data to conceal its *meaning*, but anyone can see an encrypted transmission exists; Steganography hides the *presence* of the communication so an observer sees nothing suspicious.  

---

## PART B: LONG ANSWER / ESSAY QUESTIONS (15 QUESTIONS)

### Question 16
**Mindmap Location:** 1. Security Concepts & Attacks > Passive vs. Active  
**Question:** Compare and contrast Passive and Active attacks in network security. Explain their goals, detection challenges, and defense strategies.  
**Solution:**  
1. **Nature & Definition:**  
   * *Passive Attacks:* Eavesdropping on transmissions. The attacker's goal is merely to obtain information without modifying the stream.  
   * *Active Attacks:* Active tampering involving modification of data, message replay, or creation of false streams.  
2. **Detection vs. Prevention:**  
   * *Passive:* Cause no damage or delay to the stream, making real-time detection nearly impossible. The primary defense strategy is **prevention** using strong encryption.  
   * *Active:* Absolute prevention is difficult due to broad vulnerability surfaces. The primary defense strategy is **detection, containment, and recovery** (using audit trails, checksums, and message authentication codes).  
3. **Subtypes Breakdown:**  
   * *Passive:* Release of message contents and Traffic analysis.  
   * *Active:* Masquerade, Replay, Modification of messages, and Denial of Service (DoS).  

---

### Question 17
**Mindmap Location:** 2. Security Services > X.800 Categories  
**Question:** Describe the five main categories of security services defined in ITU-T Recommendation X.800.  
**Solution:**  
ITU-T Recommendation X.800 organizes security services into 5 primary groups:  
1. **Authentication:** Guarantees communicating parties are who they claim to be. Comprises *Peer Entity Authentication* (session setup) and *Data Origin Authentication* (single message units).  
2. **Access Control:** Enforces permissions prohibiting unauthorized entities from accessing resources, hosts, or network paths.  
3. **Data Confidentiality:** Protects user data from unauthorized disclosure. Includes connection, connectionless, selective-field, and traffic-flow confidentiality.  
4. **Data Integrity:** Ensures received data is identical to transmitted data without insertion, deletion, or modification. Includes connection integrity with/without recovery, and connectionless integrity.  
5. **Nonrepudiation:** Prevents communicating entities from denying sending (Proof of Origin) or receiving (Proof of Destination) a message.  

---

### Question 18
**Mindmap Location:** 3. Security Mechanisms > Network Security Model  
**Question:** Draw and explain the Model for Network Security. What are the four basic tasks in designing any security service?  
**Solution:**  
```
    Plaintext X ──> [ Transform E ] ──> Ciphertext Y ──> [ Transform D ] ──> Plaintext X
                          ▲                                    ▲
                          │                                    │
                    Secret Key K                         Secret Key K
                          └──────────[ Trusted Third Party ]───┘
```
1. **Core Components:**  
   * *Sender & Receiver:* Communicating principals.  
   * *Secret Information ($K$):* Keys shared securely between principals.  
   * *Information Channel:* An insecure transmission medium.  
   * *Opponent:* Attacker on the channel attempting to break the security.  
   * *Trusted Third Party:* Distributes keys or arbitrates disputes.  
2. **Four Basic Design Tasks:**  
   * *Task 1:* Design an algorithm for the security transformation.  
   * *Task 2:* Generate the secret keys required by the algorithm.  
   * *Task 3:* Develop secure distribution methods for sharing the secret keys.  
   * *Task 4:* Specify a communication protocol for the principals to interact securely.  

---

### Question 19
**Mindmap Location:** 4. Symmetric Cipher Model > Architecture & Math  
**Question:** Explain the Symmetric Cipher Model with its five ingredients, mathematical equations, and two fundamental requirements for secure use.  
**Solution:**  
1. **The 5 Ingredients:**  
   * *Plaintext ($X$):* Original intelligible message.  
   * *Encryption Algorithm ($E$):* Performs transformations on $X$.  
   * *Secret Key ($K$):* Independent parameter governing algorithm behavior.  
   * *Ciphertext ($Y$):* Scrambled output stream.  
   * *Decryption Algorithm ($D$):* Reverse transformation function.  
2. **Mathematical Formulations:**  
   * Encryption: $Y = E_K(X)$  
   * Decryption: $X = D_K(Y)$  
3. **Two Fundamental Requirements:**  
   * *Strong Encryption Algorithm:* Knowing the algorithm and ciphertext must be insufficient to deduce the plaintext or the key.  
   * *Secure Key Distribution:* The secret key must be distributed securely and kept confidential by sender and receiver.  

---

### Question 20
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptanalytic Attacks  
**Question:** Explain the four primary types of cryptanalytic attacks categorized by the information available to the cryptanalyst.  
**Solution:**  
1. **Ciphertext Only:** The analyst has only the encrypted ciphertext and the encryption algorithm. Least advantageous; requires statistical and frequency analysis.  
2. **Known Plaintext:** The analyst has one or more plaintext-ciphertext pairs encrypted with the target key, helping to discover key mappings.  
3. **Chosen Plaintext:** The analyst can choose arbitrary plaintexts and pass them through the encryption engine to inspect the resulting ciphertexts.  
4. **Chosen Ciphertext:** The analyst can choose arbitrary ciphertexts and have them decrypted to observe the resulting plaintexts.  

---

### Question 21
**Mindmap Location:** 5. Classical Substitution Techniques > Caesar Cipher  
**Question:** Explain the Caesar cipher. Using a shift of $k=3$, encrypt the message `SECURITY` and decrypt `VHFXULWB`. Show step-by-step calculations.  
**Solution:**  
1. **Mapping ($A=0, B=1, \dots, Z=25$):**  
   * Formula: $c = (p + 3) \pmod{26}$  
2. **Encrypting `SECURITY`:**  
   * S ($18$) $\to (18+3) \pmod{26} = 21 \to \mathbf{V}$  
   * E ($4$) $\to (4+3) \pmod{26} = 7 \to \mathbf{H}$  
   * C ($2$) $\to (2+3) \pmod{26} = 5 \to \mathbf{F}$  
   * U ($20$) $\to (20+3) \pmod{26} = 23 \to \mathbf{X}$  
   * R ($17$) $\to (17+3) \pmod{26} = 20 \to \mathbf{U}$  
   * I ($8$) $\to (8+3) \pmod{26} = 11 \to \mathbf{L}$  
   * T ($19$) $\to (19+3) \pmod{26} = 22 \to \mathbf{W}$  
   * Y ($24$) $\to (24+3) \pmod{26} = 1 \to \mathbf{B}$  
   * Result: **VHFXULWB**  
3. **Decrypting `VHFXULWB`:**  
   * Formula: $p = (c - 3) \pmod{26}$  
   * V ($21$) $\to 21-3 = 18 \to \mathbf{S}$, H ($7$) $\to 4 \to \mathbf{E}$, etc.  
   * Result: **SECURITY**  

---

### Question 22
**Mindmap Location:** 5. Classical Substitution Techniques > Monoalphabetic  
**Question:** Discuss how frequency analysis breaks Monoalphabetic Substitution ciphers despite their immense keyspace of $26!$ keys.  
**Solution:**  
1. **Keyspace Size:** A random permutation of 26 letters yields $26! \approx 4.03 \times 10^{26}$ possible keys. Brute-force searching all keys is impossible.  
2. **The Flaw:** Natural languages exhibit non-uniform letter distributions. In English:  
   * High-frequency vowels: **E** ($12.7\%$), **T** ($9.1\%$), **A** ($8.2\%$), **O** ($7.5\%$), **I** ($7.0\%$), **N** ($6.7\%$).  
   * Low-frequency letters: **Z**, **Q**, **X**, **J** ($< 0.2\%$).  
3. **Cryptanalytic Procedure:**  
   * The cryptanalyst counts letter occurrences in the ciphertext.  
   * The most frequent symbol is tentatively assigned to **E**, the second most to **T**, etc.  
   * Common digraphs (e.g. `th`, `he`, `in`) and trigraphs (`the`, `and`) confirm and complete the remaining letter assignments.  

---

### Question 23
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Question:** Describe the Playfair cipher matrix construction and its four encryption rules with examples.  
**Solution:**  
1. **Matrix Setup:** A $5 \times 5$ grid populated with a keyword without duplicate letters. Remaining empty cells are filled with the unused alphabet. `I` and `J` share a single cell.  
2. **Rule 1 (Repeated letters):** If both letters in a pair are identical, separate them with a filler letter ('x'). Example: `balloon` becomes `ba lx lo on`.  
3. **Rule 2 (Same Row):** If letters lie in the same row, replace each with the letter to its immediate right (wrapping around).  
4. **Rule 3 (Same Column):** If letters lie in the same column, replace each with the letter immediately beneath (wrapping around).  
5. **Rule 4 (Rectangle):** If letters are in different rows and columns, replace each with the letter in its own row and the other letter's column.  

---

### Question 24
**Mindmap Location:** 5. Classical Substitution Techniques > Hill Cipher  
**Question:** Explain the operation of the Hill cipher. What condition must the key matrix satisfy to allow decryption?  
**Solution:**  
1. **Mechanism:** The Hill cipher is a polygraphic block cipher that uses matrix multiplication modulo 26.  
2. **Formulas:**  
   * Encryption: $C = K \cdot P \pmod{26}$  
   * Decryption: $P = K^{-1} \cdot C \pmod{26}$  
3. **Key Invertibility Condition:**  
   * The inverse matrix $K^{-1}$ exists modulo 26 if and only if:  
     $$\gcd(\det(K), 26) = 1$$  
   * This means $\det(K)$ must not be divisible by 2 or 13.  

---

### Question 25
**Mindmap Location:** 5. Classical Substitution Techniques > Vigenère Cipher  
**Question:** Explain the Vigenère cipher and how the Kasiski examination is used to break it.  
**Solution:**  
1. **Operation:** The Vigenère cipher uses a repeating keyword. Each key letter selects one of 26 Caesar ciphers to encipher the corresponding plaintext letter.  
2. **Periodicity:** If the keyword has length $m$, the same key letter enciphers every $m$-th plaintext letter.  
3. **Kasiski Examination:**  
   * Identical words or letter sequences separated by multiples of $m$ will produce identical ciphertext segments.  
   * By finding the distance between repeated ciphertext words and calculating their greatest common divisor (GCD), the attacker deduces the keyword length $m$.  
   * Once $m$ is known, the ciphertext is split into $m$ monoalphabetic ciphers and solved via frequency analysis.  

---

### Question 26
**Mindmap Location:** 5. Classical Substitution Techniques > One-Time Pad  
**Question:** Why is the One-Time Pad considered the ultimate cipher? What practical constraints prevent its widespread commercial use?  
**Solution:**  
1. **Unconditional Security:** Invented by Joseph Mauborgne, it uses a truly random key that is as long as the plaintext, used only once, and destroyed. The ciphertext contains zero statistical relationship to the plaintext, making it mathematically unbreakable.  
2. **Practical Constraints:**  
   * *Key Generation:* Generating truly random keys of immense size in real-time is difficult and computationally expensive.  
   * *Key Distribution:* Securely delivering a random key of equal length to every recipient is as hard as delivering the secret message itself.  
   * *Key Synchronization:* If keys get out of sync, communication fails completely.  

---

### Question 27
**Mindmap Location:** 6. Transposition Techniques > Columnar Transposition  
**Question:** Explain Rectangular Columnar Transposition. Encrypt the plaintext `ATTACKPOSTPONED` using the key `3 1 4 2`.  
**Solution:**  
1. **Grid Setup (Key width = 4):**  
   Plaintext has 15 letters. Pad with 'X' to 16 letters:  

   | Col 3 | Col 1 | Col 4 | Col 2 |
   |:---:|:---:|:---:|:---:|
   | A | T | T | A |
   | C | K | P | O |
   | S | T | P | O |
   | N | E | D | X |

2. **Column Readout Order (1, 2, 3, 4):**  
   * Column 1: `T K T E`  
   * Column 2: `A O O X`  
   * Column 3: `A C S N`  
   * Column 4: `T P P D`  
3. **Ciphertext Output:** `TKTEAOOXACSNTPPD`  

---

### Question 28
**Mindmap Location:** 6. Transposition Techniques > Rotor Machines  
**Question:** Describe the architecture and working principle of a multi-rotor machine (such as the German Enigma).  
**Solution:**  
1. **Hardware Structure:** A rotor machine contains a series of independently rotating mechanical cylinders (rotors) between electrical input and output pins (26 pins each).  
2. **Operation:**  
   * Pressing a keyboard key sends an electrical signal through the internal cross-wiring of the first rotor to the second, third, and reflector.  
   * With each keystroke, the first rotor advances one position.  
   * After 26 steps, the first rotor triggers a notch that steps the second rotor.  
3. **Polyalphabetic Period:** Three rotors yield a period of $26^3 = 17,576$ different substitution alphabets before repeating, defeating simple frequency analysis.  

---

### Question 29
**Mindmap Location:** 6. Transposition Techniques > Steganography  
**Question:** What is digital steganography? Explain the Least Significant Bit (LSB) technique with an example.  
**Solution:**  
1. **Concept:** Digital steganography embeds secret data into multimedia carrier files (images, audio, video) without creating noticeable distortion.  
2. **LSB Technique:**  
   * In a 24-bit color image, each pixel consists of 3 bytes: Red, Green, and Blue (RGB).  
   * Replacing the 8th bit (LSB) of each byte alters the color intensity by at most $1/256$, which is imperceptible to the human eye.  
   * *Example:* To hide the character `A` (ASCII binary `01000001`), the bits are distributed across the LSBs of 8 consecutive pixel color bytes.  

---

### Question 30
**Mindmap Location:** 3. Security Mechanisms > Pervasive Mechanisms  
**Question:** List and describe the five Pervasive Security Mechanisms defined in X.800.  
**Solution:**  
Pervasive security mechanisms are not dedicated to any single service or protocol layer:  
1. **Trusted Functionality:** Certified software and hardware routines that run critical security functions reliably without bypass.  
2. **Security Labels:** Explicit sensitivity markings attached to data objects to guide access control decisions.  
3. **Event Detection:** Real-time monitoring systems detecting security-relevant violations or suspicious anomalies.  
4. **Security Audit Trail:** Chronological record of system activities stored in tamper-evident logs for post-incident analysis.  
5. **Security Recovery:** Automated rollback, error isolation, and recovery protocols that restore secure system operations after an incident.  

