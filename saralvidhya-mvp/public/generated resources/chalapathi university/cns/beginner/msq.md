# Multiple Select Questions (MSQ) - Chapter 1 (Beginner Level)

**Subject:** Cryptography and Network Security (CNS) | **Unit:** Chapter 1  
**Total Questions:** 10 MSQs (One or More Correct Answers)  

---

### Question 1
**Mindmap Location:** 1. Security Concepts & Attacks > Passive Attacks  
**Question:** Which of the following are classified as **Passive Attacks**? (Select ALL that apply)  
- [ ] A) Release of message contents  
- [ ] B) Denial of Service (DoS)  
- [ ] C) Traffic analysis  
- [ ] D) Masquerade  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, C</b><br/>
<b>Rationale:</b> Release of message contents and Traffic analysis are passive attacks (they monitor without altering the stream). Denial of Service and Masquerade are active attacks.
</details>

---

### Question 2
**Mindmap Location:** 1. Security Concepts & Attacks > Active Attacks  
**Question:** Which of the following are categorized as **Active Attacks**? (Select ALL that apply)  
- [ ] A) Replay attack  
- [ ] B) Modification of messages  
- [ ] C) Traffic analysis  
- [ ] D) Masquerade  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, D</b><br/>
<b>Rationale:</b> Replay, message modification, and masquerade are active attacks because they alter data or forge transmissions. Traffic analysis is passive.
</details>

---

### Question 3
**Mindmap Location:** 2. Security Services > X.800 Categories  
**Question:** Which of the following are primary security service categories defined in ITU-T Recommendation X.800? (Select ALL that apply)  
- [ ] A) Authentication  
- [ ] B) Access Control  
- [ ] C) Data Confidentiality  
- [ ] D) CPU Clock Throttling  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> X.800 defines Authentication, Access Control, Data Confidentiality, Data Integrity, and Nonrepudiation. Clock throttling is an unrelated hardware function.
</details>

---

### Question 4
**Mindmap Location:** 4. Symmetric Cipher Model > Five Ingredients  
**Question:** Which of the following are among the **five essential ingredients** of a symmetric encryption scheme? (Select ALL that apply)  
- [ ] A) Plaintext  
- [ ] B) Secret Key  
- [ ] C) Ciphertext  
- [ ] D) Quantum Teleporter  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> The five ingredients are Plaintext, Encryption Algorithm, Secret Key, Ciphertext, and Decryption Algorithm.
</details>

---

### Question 5
**Mindmap Location:** 4. Symmetric Cipher Model > Requirements  
**Question:** What are the **two basic requirements** for the secure use of symmetric encryption? (Select ALL that apply)  
- [ ] A) A strong encryption algorithm  
- [ ] B) Secure distribution and secrecy of the secret key  
- [ ] C) Using only Roman numerals for plaintexts  
- [ ] D) Publishing the secret key in a public ledger  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B</b><br/>
<b>Rationale:</b> Symmetric encryption strictly requires a strong algorithm (opponent cannot decrypt ciphertext even knowing algorithm) and secure, secret key distribution.
</details>

---

### Question 6
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptographic Dimensions  
**Question:** What are the primary types of operations used in encryption algorithms to transform plaintext into ciphertext? (Select ALL that apply)  
- [ ] A) Substitution  
- [ ] B) Transposition  
- [ ] C) Product systems (combining substitution and transposition)  
- [ ] D) Physical destruction  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> All encryption algorithms rely on substitution (mapping elements), transposition (rearranging elements), or product systems (multiple stages of both).
</details>

---

### Question 7
**Mindmap Location:** 4. Symmetric Cipher Model > Cryptanalysis  
**Question:** Which attack types assume the cryptanalyst has access to corresponding plaintext-ciphertext pairs? (Select ALL that apply)  
- [ ] A) Known-plaintext attack  
- [ ] B) Chosen-plaintext attack  
- [ ] C) Ciphertext-only attack  
- [ ] D) Brute-force guessing without any ciphertext  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B</b><br/>
<b>Rationale:</b> In a known-plaintext attack, the attacker possesses pairs; in a chosen-plaintext attack, the attacker selects plaintexts and obtains matching ciphertexts. Ciphertext-only has no plaintext pairs.
</details>

---

### Question 8
**Mindmap Location:** 5. Classical Substitution Techniques > Playfair Cipher  
**Question:** In the Playfair cipher, which of the following statements are TRUE? (Select ALL that apply)  
- [ ] A) It encrypts letters in pairs (digraphs)  
- [ ] B) It uses a $5 \times 5$ matrix of letters based on a keyword  
- [ ] C) If letters fall in the same row, each is replaced by the letter to its right  
- [ ] D) It was invented by Julius Caesar in 50 BC  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Playfair encrypts digraphs using a $5 \times 5$ matrix with circular row-right and column-down rules. It was invented in 1854 by Charles Wheatstone (not Julius Caesar).
</details>

---

### Question 9
**Mindmap Location:** 5. Classical Substitution Techniques > One-Time Pad  
**Question:** Which conditions must be met for a One-Time Pad (OTP) to be unbreakable? (Select ALL that apply)  
- [ ] A) The key must be truly random  
- [ ] B) The key must be as long as the plaintext message  
- [ ] C) The key must be used only once and never repeated  
- [ ] D) The key must be reused every 24 hours  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> An OTP is unconditionally secure if and only if the key is truly random, equal in length to the message, used only once, and kept completely secret.
</details>

---

### Question 10
**Mindmap Location:** 6. Transposition Techniques > Steganography  
**Question:** Which of the following are recognized techniques of **Steganography**? (Select ALL that apply)  
- [ ] A) Writing messages using invisible ink  
- [ ] B) Pin punctures on typewritten text above secret letters  
- [ ] C) Overwriting the Least Significant Bits (LSB) of color image pixels  
- [ ] D) Running the Caesar cipher on ASCII text  

<details><summary>Click to view Answer</summary>
<b>Correct Options: A, B, C</b><br/>
<b>Rationale:</b> Invisible ink, pin punctures, and LSB image embedding all hide the presence of the message (steganography). The Caesar cipher scrambles message content (cryptography).
</details>

