# CNS: Chapter 1 - Flashcards (Intermediate Level)

---

### Card 1
**Mindmap Location:** 1. Security Concepts & Attacks > Security Disciplines  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** Contrast the scopes of Computer Security, Network Security, and Information Security.  
**A:** Computer Security protects automated standalone processing systems; Network Security protects data in-transit across communication links; Information Security encompasses organizational governance, storage, and processing of data assets.  

---

### Card 2
**Mindmap Location:** 1. Security Concepts & Attacks > Three Aspects  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is the technical interrelationship between Security Attacks, Mechanisms, and Services?  
**A:** Security Services define the high-level policy goals (e.g. confidentiality, authentication); Security Mechanisms are the concrete mathematical algorithms (e.g. encipherment, hashes) deployed to implement services; Security Attacks are the threat vectors attempting to breach them.  

---

### Card 3
**Mindmap Location:** 1. Security Concepts & Attacks > Passive Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Analyzing  

**Q:** How does Traffic Analysis succeed against networks that already employ message encipherment?  
**A:** Even when payloads are unreadable, an adversary can observe packet headers, communication frequency, burst durations, routing paths, and bandwidth volume to infer military or organizational activity.  

---

### Card 4
**Mindmap Location:** 1. Security Concepts & Attacks > Passive vs. Active  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** Why does passive attack mitigation rely solely on prevention, while active attack mitigation relies on detection and recovery?  
**A:** Passive attacks cause zero physical alteration or latency in the data stream, preventing real-time detection; active attacks involve tampering across extensive threat surfaces, making total prevention impossible and requiring integrity checks, logs, and rollback recovery.  

---

### Card 5
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What vulnerability does a Replay Attack exploit, and how is it mitigated?  
**A:** It exploits the validity of authentic captured messages retransmitted at a later time. It is mitigated by incorporating monotonic sequence numbers, timestamps, and cryptographic nonces into message payloads.  

---

### Card 6
**Mindmap Location:** 2. Security Services > Authentication  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** In X.800, why does Data Origin Authentication not protect against message duplication or replay?  
**A:** Because Data Origin Authentication only corroborates the source of single, connectionless data packets independently; session sequence tracking (Peer Entity Authentication) is required to detect duplicates.  

---

### Card 7
**Mindmap Location:** 2. Security Services > Confidentiality  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is Selective-Field Confidentiality, and why is it preferred in certain protocols?  
**A:** It enciphers only designated sensitive fields within a packet (e.g., credit card number) while leaving non-sensitive headers plaintext, reducing encryption computational overhead and enabling intermediate routing.  

---

### Card 8
**Mindmap Location:** 2. Security Services > Integrity  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** Differentiate between Connection Integrity with Recovery and without Recovery in X.800.  
**A:** Connection Integrity with Recovery detects data modification, deletion, or insertion and automatically triggers protocol retransmission or rollback; without Recovery simply detects the anomaly and flags an alert without automated state restoration.  

---

### Card 9
**Mindmap Location:** 2. Security Services > Nonrepudiation  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Applying  

**Q:** Which cryptographic mechanism is essential for implementing Nonrepudiation with Proof of Origin?  
**A:** Asymmetric Digital Signatures, because only the private key holder could have generated the signature, preventing the sender from repudiating origin.  

---

### Card 10
**Mindmap Location:** 3. Security Mechanisms > Specific Mechanisms  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** How does Traffic Padding counter traffic analysis?  
**A:** By continuously transmitting spurious, pseudorandom dummy bitstreams whenever legitimate traffic is idle, preventing an observer from detecting genuine message start/stop intervals and transmission bursts.  

---

### Card 11
**Mindmap Location:** 3. Security Mechanisms > Specific Mechanisms  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What role does Notarization play as an X.800 security mechanism?  
**A:** It employs an impartial, trusted third party to verify and record communication properties (such as origin, destination, timestamp, and content hashes) to guarantee dispute resolution.  

---

### Card 12
**Mindmap Location:** 3. Security Mechanisms > Network Security Model  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** Outline the four essential design tasks when engineering a security service.  
**A:** (1) Design a mathematical transformation algorithm, (2) Generate unpredictable secret keys, (3) Develop secure key distribution protocols, and (4) Formulate an operational multi-party communication protocol.  

---

### Card 13
**Mindmap Location:** 4. Symmetric Cipher Model > Architecture  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** State Kerckhoffs's Principle and its fundamental significance in modern cryptography.  
**A:** The security of a cryptosystem must rest entirely upon the secrecy of the key, not on the secrecy of the algorithm. Open, public algorithms allow global peer scrutiny.  

---

### Card 14
**Mindmap Location:** 4. Symmetric Cipher Model > Dimensions  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is a Product Cipher system?  
**A:** A cryptographic cipher combining multiple successive stages of both substitution (confusion) and transposition (diffusion) to achieve complex overall security.  

---

### Card 15
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptanalysis  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** Why is a Chosen-Plaintext Attack considered more powerful than a Known-Plaintext Attack?  
**A:** Because the cryptanalyst can deliberately engineer specialized plaintext patterns (such as single-bit differentials) that specifically reveal structural properties of the key.  

---

### Card 16
**Mindmap Location:** 4. Symmetric Cipher Model > Security Definitions  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Evaluating  

**Q:** What formal criteria must a cipher satisfy to be deemed Computationally Secure?  
**A:** (1) The cost of breaking the cipher exceeds the commercial or strategic value of the encrypted data, and (2) The time required to break the cipher exceeds the useful lifetime of the information.  

---

### Card 17
**Mindmap Location:** 5. Classical Substitution Techniques > Caesar Cipher  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** Why is modular arithmetic modulo 26 used in the Caesar Cipher?  
**A:** Modulo 26 operations form a finite cyclic algebraic group over the 26 English letters ($0 \dots 25$), ensuring that shifts cleanly wrap around from Z to A: $c = (p + k) \pmod{26}$.  

---

### Card 18
**Mindmap Location:** 5. Classical Substitution Techniques > Monoalphabetic  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** What property of human language is exploited to cryptanalyze a Monoalphabetic Substitution cipher?  
**A:** Redundancy and non-uniform letter frequency distributions. In English, single-letter frequencies ($E \approx 12.7\%$), digraphs (`th`, `he`), and trigraphs (`the`) remain identical under 1-to-1 letter replacement.  

---

### Card 19
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** In the Playfair cipher, what is the maximum number of distinct digraph encipherment transformations?  
**A:** $25 \times 25 = 650$ possible digraph pairs (since I and J share one cell in the $5 \times 5$ matrix).  

---

### Card 20
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** State the Playfair cipher encryption rule when two letters form a rectangle in the key matrix.  
**A:** Each plaintext letter is replaced by the letter that lies in its own row and the column occupied by the other plaintext letter.  

---

### Card 21
**Mindmap Location:** 5. Classical Substitution Techniques > Hill Cipher  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** What algebraic condition must the key matrix $K$ satisfy in the Hill cipher to allow decryption?  
**A:** $\gcd(\det(K), 26) = 1$. The determinant $\det(K)$ must be relatively prime to 26 (i.e. not divisible by 2 or 13).  

---

### Card 22
**Mindmap Location:** 5. Classical Substitution Techniques > Hill Cipher  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** Why is the Hill cipher vulnerable to a Known-Plaintext Attack?  
**A:** Because it is entirely linear. If an attacker possesses $n$ distinct plaintext-ciphertext vector pairs, they can set up a system of linear equations: $C = K P \pmod{26}$, and compute $K = C P^{-1} \pmod{26}$.  

---

### Card 23
**Mindmap Location:** 5. Classical Substitution Techniques > Polyalphabetic  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** How does the Kasiski examination determine the keyword length $m$ in a Vigenère cipher?  
**A:** It identifies repeated sequences of ciphertext letters, records the distance between occurrences, and calculates the greatest common divisor (GCD) of those distances.  

---

### Card 24
**Mindmap Location:** 5. Classical Substitution Techniques > Autokey  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** How does the Autokey cipher eliminate the periodic key vulnerability of the Vigenère cipher?  
**A:** By using the keyword only for the initial characters, and then concatenating the plaintext itself to form a non-repeating, continuous running key stream.  

---

### Card 25
**Mindmap Location:** 5. Classical Substitution Techniques > Vernam Cipher  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Applying  

**Q:** What mathematical property of the XOR operator enables symmetric encryption and decryption in the Vernam cipher?  
**A:** Self-inversion: $A \oplus B \oplus B = A$. Applying the key twice restores the original plaintext: $C = P \oplus K \implies P = C \oplus K$.  

---

### Card 26
**Mindmap Location:** 5. Classical Substitution Techniques > One-Time Pad  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Evaluating  

**Q:** From an information-theoretic perspective, why is the One-Time Pad (OTP) unbreakable?  
**A:** Because given a ciphertext of length $N$, every possible plaintext of length $N$ is equally likely under some random key. The ciphertext gives zero statistical information about the plaintext.  

---

### Card 27
**Mindmap Location:** 6. Transposition Techniques > Columnar Transposition  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** What characteristic of the ciphertext reveals that a transposition cipher was used rather than a substitution cipher?  
**A:** The frequency distribution of individual letters in the ciphertext is 100% identical to the natural frequency distribution of the plaintext language.  

---

### Card 28
**Mindmap Location:** 6. Transposition Techniques > Multiple Transposition  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Analyzing  

**Q:** Why does applying two successive stages of columnar transposition significantly increase cipher security?  
**A:** It breaks simple column-pair correlations and anagramming structures, producing a highly complex non-periodic permutation that spreads adjacent characters widely apart.  

---

### Card 29
**Mindmap Location:** 6. Transposition Techniques > Rotor Machines  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Understanding  

**Q:** In a three-rotor machine, what determines when the middle and slow rotors step?  
**A:** The fast rotor steps once per keystroke. After it completes 26 steps (one full rotation), a mechanical notch advances the middle rotor by one position. After 676 steps, the slow rotor advances.  

---

### Card 30
**Mindmap Location:** 6. Transposition Techniques > Steganography  
**Depth Level:** L-3 | **Bloom's Taxonomy:** Applying  

**Q:** Explain how Least Significant Bit (LSB) steganography embeds data into 24-bit true-color images.  
**A:** Each pixel consists of 3 bytes (RGB). Overwriting the lowest-order bit (bit 0) of each byte changes its color value by $\pm 1$ out of 256 ($< 0.4\%$), which is undetectable to human eyes, allowing 3 bits per pixel of payload.  

