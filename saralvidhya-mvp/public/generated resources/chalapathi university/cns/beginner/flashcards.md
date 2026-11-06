# CNS: Chapter 1 - Flashcards (Beginner Level)

---

### Card 1
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Security Disciplines  
**Depth Level:** L-1 | **Bloom's Taxonomy:** Remembering  

**Q:** What is the formal textbook definition of Computer Security?  
**A:** The generic name for the collection of tools designed to protect data and to thwart hackers.  
```
[User Data] ──🛡️ Computer Security Tools ──> Thwarts Malicious Hackers
```

---

### Card 2
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Security Disciplines  
**Depth Level:** L-1 | **Bloom's Taxonomy:** Remembering  

**Q:** What is Network Security designed to protect?  
**A:** Measures and communication protocols designed to protect data during their transmission across interconnected networks.  

---

### Card 3
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Security Disciplines  
**Depth Level:** L-1 | **Bloom's Taxonomy:** Remembering  

**Q:** What is the primary mandate of Information Security?  
**A:** Safeguarding an organization's data assets from unauthorized access, modification, or destruction.  

---

### Card 4
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > 3 Aspects  
**Depth Level:** L-1 | **Bloom's Taxonomy:** Remembering  

**Q:** What are the three fundamental aspects of information security architecture?  
**A:** (1) Security Attacks, (2) Security Mechanisms, and (3) Security Services.  
```
1. Attacks (Threats) ──> 2. Mechanisms (Algorithms) ──> 3. Services (Policies)
```

---

### Card 5
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Passive Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is the core nature and goal of a Passive Attack?  
**A:** Passive attacks are in the nature of eavesdropping on or monitoring transmissions. The goal of the opponent is to obtain information without altering the data stream.  

---

### Card 6
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Passive Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** Name the two main types of passive security attacks.  
**A:** (1) Release of message contents, and (2) Traffic analysis.  

---

### Card 7
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Passive Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** Why is prevention, rather than detection, emphasized for passive attacks?  
**A:** Because passive attacks do not alter the data stream or leave physical traces, making them virtually impossible to detect during transit. Strong encryption prevents disclosure.  

---

### Card 8
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Passive Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is Traffic Analysis in passive attacks?  
**A:** Monitoring packet transmission patterns, message lengths, frequency, and communicating locations to deduce sensitive information even when ciphertext is unreadable.  

---

### Card 9
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What distinguishes Active Attacks from Passive Attacks?  
**A:** Active attacks involve some modification of the data stream or the creation of a false stream, whereas passive attacks only observe without alteration.  
```
Passive: A ───────(Eavesdropper Listens)───────> B
Active:  A ───X───> [Attacker Modifies/Fakes] ───> B
```

---

### Card 10
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What are the four categories of active security attacks?  
**A:** (1) Masquerade, (2) Replay, (3) Modification of messages, and (4) Denial of Service (DoS).  

---

### Card 11
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is a Masquerade attack?  
**A:** An attack where one entity pretends to be a different entity (e.g. using stolen authentication credentials to gain unauthorized privileges).  

---

### Card 12
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is a Replay attack?  
**A:** The passive capture of a valid data unit and its subsequent unauthorized retransmission to produce an unauthorized effect (e.g. repeating a money transfer).  

---

### Card 13
**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Active Attacks  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is a Denial of Service (DoS) attack?  
**A:** An attack that prevents or inhibits the normal use or management of communications facilities by overloading servers or network bandwidth.  

---

### Card 14
**Mindmap Location:** Chapter 1 > 2. Security Services > X.800 Services  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What is the ITU-T Recommendation standard for Security Architecture in Open Systems?  
**A:** ITU-T Recommendation X.800.  

---

### Card 15
**Mindmap Location:** Chapter 1 > 2. Security Services > Authentication  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is the difference between Peer Entity Authentication and Data Origin Authentication?  
**A:** Peer Entity Authentication verifies the identity of the communicating partner during connection establishment; Data Origin Authentication verifies the source of single isolated connectionless packets.  

---

### Card 16
**Mindmap Location:** Chapter 1 > 2. Security Services > Nonrepudiation  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What does the Nonrepudiation security service guarantee?  
**A:** It prevents either the sender or receiver from denying a transmitted message (Proof of Origin ensures sender cannot deny sending; Proof of Destination ensures receiver cannot deny receipt).  

---

### Card 17
**Mindmap Location:** Chapter 1 > 3. Security Mechanisms > Network Security Model  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What are the five basic components of the Model for Network Security?  
**A:** Sender, Receiver, Secret Key $K$, Transmission Channel, and Opponent (attacker).  

---

### Card 18
**Mindmap Location:** Chapter 1 > 3. Security Mechanisms > Network Security Model  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What are the 4 basic tasks in designing a particular security service?  
**A:** (1) Design a transformation algorithm, (2) Generate secret keys, (3) Develop key distribution methods, and (4) Specify an operational communication protocol.  

---

### Card 19
**Mindmap Location:** Chapter 1 > 4. Symmetric Cipher Model > Five Ingredients  
**Depth Level:** L-1 | **Bloom's Taxonomy:** Remembering  

**Q:** What are the 5 ingredients of a Symmetric Encryption scheme?  
**A:** (1) Plaintext ($X$), (2) Encryption Algorithm ($E$), (3) Secret Key ($K$), (4) Ciphertext ($Y$), and (5) Decryption Algorithm ($D$).  
```
X ──[ E_K ]──> Y ──[ D_K ]──> X
```

---

### Card 20
**Mindmap Location:** Chapter 1 > 4. Symmetric Cipher Model > Formulations  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What are the mathematical equations for symmetric encryption and decryption?  
**A:** Encryption: $Y = E_K(X)$  
Decryption: $X = D_K(Y)$  

---

### Card 21
**Mindmap Location:** Chapter 1 > 4. Symmetric Cipher Model > Cryptographic Dimensions  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What are the three independent dimensions characterizing cryptographic systems?  
**A:** (1) Type of operations (Substitution vs. Transposition vs. Product), (2) Number of keys used (Symmetric vs. Asymmetric), (3) Processing mode (Block cipher vs. Stream cipher).  

---

### Card 22
**Mindmap Location:** Chapter 1 > 4. Symmetric Cipher Model > Cryptanalysis  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What is a Brute-Force attack on a cipher?  
**A:** Trying every possible key in the keyspace until intelligible plaintext is obtained. On average, 50% of all possible keys must be tried.  

---

### Card 23
**Mindmap Location:** Chapter 1 > 4. Symmetric Cipher Model > Security Definitions  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is the difference between an Unconditionally Secure and a Computationally Secure cipher?  
**A:** An unconditionally secure cipher cannot be broken even with infinite computing power (e.g. One-Time Pad); a computationally secure cipher is unbreakable only because the cost or time to crack it exceeds the value or useful lifetime of the data.  

---

### Card 24
**Mindmap Location:** Chapter 1 > 5. Classical Substitution Techniques > Caesar Cipher  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Applying  

**Q:** How does the Caesar Cipher encrypt messages, and what are its formulas?  
**A:** It shifts each letter forward by $k=3$ places.  
Encryption: $c = (p + k) \pmod{26}$  
Decryption: $p = (c - k) \pmod{26}$  

---

### Card 25
**Mindmap Location:** Chapter 1 > 5. Classical Substitution Techniques > Monoalphabetic  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** Why is a Monoalphabetic cipher easy to crack despite having $26! \approx 4 \times 10^{26}$ keys?  
**A:** Because it does not change the relative letter frequencies of human language. In English, the letter **E** occurs $12.7\%$ of the time, allowing frequency analysis to easily reveal the alphabet mapping.  

---

### Card 26
**Mindmap Location:** Chapter 1 > 5. Classical Substitution Techniques > Playfair Cipher  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** What size matrix is used in the Playfair Cipher, and how many letters are enciphered at a time?  
**A:** A $5 \times 5$ grid based on a secret keyword (with I and J sharing a cell), encrypting two letters (a digraph) at a time.  

---

### Card 27
**Mindmap Location:** Chapter 1 > 5. Classical Substitution Techniques > Hill Cipher  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What mathematical branch forms the foundation of the Hill Cipher?  
**A:** Linear algebra (matrix multiplication and modular arithmetic modulo 26): $C = K \cdot P \pmod{26}$.  

---

### Card 28
**Mindmap Location:** Chapter 1 > 5. Classical Substitution Techniques > One-Time Pad  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Remembering  

**Q:** Why is the One-Time Pad (OTP) unconditionally secure?  
**A:** Because its key is truly random, as long as the message, used only once, and destroyed. The ciphertext bears zero statistical relationship to the plaintext.  

---

### Card 29
**Mindmap Location:** Chapter 1 > 6. Transposition Techniques > Rail Fence  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Applying  

**Q:** How does the Rail Fence Cipher encipher plaintext?  
**A:** The message is written along a diagonal zigzag pattern across a chosen depth of rails, then read off row by row.  
```
m . . . e . . . t
. e . m . a . f .
```

---

### Card 30
**Mindmap Location:** Chapter 1 > 6. Transposition Techniques > Steganography  
**Depth Level:** L-2 | **Bloom's Taxonomy:** Understanding  

**Q:** What is the fundamental difference between Cryptography and Steganography?  
**A:** Cryptography scrambles data to make the message **unreadable** (hiding content); Steganography hides the **very existence** of the communication (e.g. invisible ink, image LSB replacement).  

