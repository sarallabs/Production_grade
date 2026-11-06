# Multiple Choice Questions (MCQ) - Chapter 1 (Beginner Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Total Questions:** 20 MCQs (Single Correct Answer)  

---

### Question 1
**Mindmap Location:** 1. Security Concepts & Attacks > Security Disciplines  
**Question:** What is the collection of tools designed to protect automated data systems and thwart hackers called?  
- A) Information Security  
- B) Computer Security  
- C) Network Security  
- D) Physical Security  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Textbook definition: Computer Security is the generic name for the collection of tools designed to protect data and to thwart hackers.
</details>

---

### Question 2
**Mindmap Location:** 1. Security Concepts & Attacks > Passive Attacks  
**Question:** Which of the following is an example of a passive security attack?  
- A) Denial of Service (DoS)  
- B) Masquerade  
- C) Traffic Analysis  
- D) Message Modification  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Traffic analysis is a passive attack because it monitors transmission patterns without modifying or altering the data stream.
</details>

---

### Question 3
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** An attacker intercepts a legitimate banking transaction packet and sends it a second time to duplicate the payment. What type of attack is this?  
- A) Traffic Analysis  
- B) Replay Attack  
- C) Release of Message Contents  
- D) Steganography  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> A replay attack involves the passive capture of an authentic data unit and its subsequent unauthorized retransmission.
</details>

---

### Question 4
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** When an adversary pretends to be an authorized manager to gain elevated system privileges, this is termed:  
- A) Masquerade  
- B) Traffic padding  
- C) Nonrepudiation  
- D) Eavesdropping  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> A masquerade takes place when one entity pretends to be a different entity.
</details>

---

### Question 5
**Mindmap Location:** 2. Security Services > Authentication  
**Question:** What security service guarantees the identity of communicating entities during the connection establishment phase?  
- A) Data Origin Authentication  
- B) Peer Entity Authentication  
- C) Connection Confidentiality  
- D) Traffic Padding  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Peer Entity Authentication corroborates the identity of a peer entity during connection establishment.
</details>

---

### Question 6
**Mindmap Location:** 2. Security Services > Nonrepudiation  
**Question:** Which security service ensures that a sender cannot later falsely deny sending a message?  
- A) Access Control  
- B) Nonrepudiation with Proof of Origin  
- C) Connectionless Confidentiality  
- D) Denial of Service  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Nonrepudiation with Proof of Origin provides the recipient with undeniable proof that the sender originated the message.
</details>

---

### Question 7
**Mindmap Location:** 2. Security Services > X.800 Services  
**Question:** What international recommendation standardizes the Security Architecture for Open Systems Interconnection (OSI)?  
- A) IEEE 802.11  
- B) ITU-T Recommendation X.800  
- C) RFC 1918  
- D) ISO 9001  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> ITU-T Recommendation X.800 defines the formal OSI security architecture.
</details>

---

### Question 8
**Mindmap Location:** 3. Security Mechanisms > Specific Mechanisms  
**Question:** Inserting dummy bit streams into an ongoing network transmission to defeat traffic analysis is called:  
- A) Encipherment  
- B) Traffic Padding  
- C) Routing Control  
- D) Notarization  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Traffic padding involves the insertion of continuous dummy data bits into gaps in traffic streams so an observer cannot detect message bursts.
</details>

---

### Question 9
**Mindmap Location:** 4. Symmetric Cipher Model > Five Ingredients  
**Question:** In the symmetric cipher model, the scrambled unintelligible output is called:  
- A) Plaintext  
- B) Ciphertext  
- C) Hash value  
- D) Digital signature  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Ciphertext ($Y$) is the scrambled, unreadable message produced by the encryption algorithm.
</details>

---

### Question 10
**Mindmap Location:** 4. Symmetric Cipher Model > Formulas  
**Question:** Which mathematical equation represents symmetric decryption of ciphertext $Y$ using secret key $K$?  
- A) $Y = E_K(X)$  
- B) $X = D_K(Y)$  
- C) $K = D_X(Y)$  
- D) $X = E_Y(K)$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> Decryption produces original plaintext $X$ by applying decryption algorithm $D$ with key $K$ to ciphertext $Y$: $X = D_K(Y)$.
</details>

---

### Question 11
**Mindmap Location:** 4. Symmetric Cipher Model > Dimensions  
**Question:** What is a cipher called if it processes the input message continuously one element at a time?  
- A) Block cipher  
- B) Stream cipher  
- C) Asymmetric cipher  
- D) Transposition cipher  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> A stream cipher processes input elements continuously, producing output one element at a time as it goes along.
</details>

---

### Question 12
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptanalysis  
**Question:** An attack where the cryptanalyst only has access to the encrypted ciphertext and the encryption algorithm is:  
- A) Known-plaintext attack  
- B) Chosen-plaintext attack  
- C) Ciphertext-only attack  
- D) Chosen-ciphertext attack  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> In a ciphertext-only attack, the opponent possesses only the intercepted ciphertext.
</details>

---

### Question 13
**Mindmap Location:** 5. Classical Substitution Techniques > Caesar Cipher  
**Question:** In the traditional Caesar cipher, each plaintext letter is shifted forward by how many positions in the alphabet?  
- A) 1  
- B) 3  
- C) 5  
- D) 13  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The classic Caesar cipher used by Julius Caesar shifts each letter by 3 positions ($A \to D, B \to E$).
</details>

---

### Question 14
**Mindmap Location:** 5. Classical Substitution Techniques > Caesar Cipher  
**Question:** What is the total size of the keyspace for a Caesar cipher on the English alphabet?  
- A) 25  
- B) 26  
- C) 256  
- D) $26!$  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: A</b><br/>
<b>Rationale:</b> A shift of 0 leaves the text unchanged. Shifts 1 through 25 produce distinct ciphers; a shift of 26 wraps around to 0. Thus, there are only 25 usable keys.
</details>

---

### Question 15
**Mindmap Location:** 5. Classical Substitution Techniques > Monoalphabetic  
**Question:** What is the most frequently occurring letter in standard English text?  
- A) A  
- B) T  
- C) E  
- D) O  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> In English, **E** is the most frequent letter with a relative frequency of approximately $12.7\%$.
</details>

---

### Question 16
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Question:** How many letters does the Playfair cipher encrypt at a single step?  
- A) 1 letter (monograph)  
- B) 2 letters (digraph)  
- C) 3 letters (trigraph)  
- D) 8 letters (block)  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The Playfair cipher is a digraph substitution cipher that encrypts pairs of letters.
</details>

---

### Question 17
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Question:** In a Playfair cipher matrix, which two letters typically share a single cell to fit into the $5 \times 5$ grid?  
- A) X and Z  
- B) I and J  
- C) C and K  
- D) U and V  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> A $5 \times 5$ grid holds 25 letters; the 26-letter English alphabet is accommodated by combining **I** and **J** into one cell.
</details>

---

### Question 18
**Mindmap Location:** 5. Classical Substitution Techniques > One-Time Pad  
**Question:** Which encryption scheme is proven to be unconditionally secure?  
- A) Caesar Cipher  
- B) Hill Cipher  
- C) One-Time Pad (OTP)  
- D) Vigenère Cipher  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> The One-Time Pad is unconditionally secure because its truly random, non-repeating key of message length creates ciphertext with zero statistical relation to the plaintext.
</details>

---

### Question 19
**Mindmap Location:** 6. Transposition Techniques > Rail Fence  
**Question:** How does the Rail Fence cipher rearrange plaintext?  
- A) Replacing letters with numbers  
- B) Writing plaintext in a diagonal zigzag across rails and reading off rows  
- C) Bitwise XOR with a key  
- D) Performing matrix multiplication  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: B</b><br/>
<b>Rationale:</b> The Rail Fence cipher writes plaintext along diagonal rails and reads off rows in sequence.
</details>

---

### Question 20
**Mindmap Location:** 6. Transposition Techniques > Steganography  
**Question:** What is the primary objective of Steganography?  
- A) To make messages harder to decrypt with quantum computers  
- B) To compress multimedia files  
- C) To hide the very existence of a secret message  
- D) To generate asymmetric key pairs  

<details><summary>Click to view Answer</summary>
<b>Correct Answer: C</b><br/>
<b>Rationale:</b> Steganography conceals the presence of communication, whereas cryptography conceals the content/meaning.
</details>

