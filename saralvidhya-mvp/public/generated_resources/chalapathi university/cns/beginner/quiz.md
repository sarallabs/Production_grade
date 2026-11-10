# Pop Quiz: Chapter 1 - Security Concepts & Classical Encryption (Beginner Level)

---

### Pop Quiz Question

**Mindmap Location:** Chapter 1 > 1. Security Concepts & Attacks > Passive vs. Active Attacks  
**Depth Level:** L-1 / L-2  
**Bloom's Taxonomy:** Understanding  
**Difficulty:** Beginner  

**Question:**  
Why is **prevention** the primary security defense strategy for **passive attacks**, whereas **detection and recovery** are emphasized for **active attacks**?

- **A)** Passive attacks destroy hardware, while active attacks only steal passwords.
- **B)** Passive attacks do not alter or disrupt the transmitted data stream and leave no trace, making real-time detection nearly impossible; active attacks modify or halt the data stream, making them detectable and requiring immediate recovery.
- **C)** Passive attacks are illegal, whereas active attacks are sanctioned diagnostic tests conducted by network administrators.
- **D)** Passive attacks can only occur over wireless networks, while active attacks only happen on physical Ethernet cables.

---

### Detailed Answer & Analysis

<details open>
<summary><b>Click to View Solution & Answer Breakdown</b></summary>

<br/>

**Correct Answer:** **Option B**

#### 💡 Why Option B is CORRECT:
* By textbook definition, **passive attacks** (such as release of message contents and traffic analysis) involve silent eavesdropping and monitoring of data in transit. Because the attacker does not change, delay, or damage the packets, the legitimate sender and receiver have no physical way to detect that someone intercepted the data. Therefore, the only viable defense is **prevention**—using strong mathematical encryption so that even if intercepted, the message remains unintelligible.
* In contrast, **active attacks** (such as message modification, replay, masquerade, and Denial of Service) physically manipulate the data stream or disrupt network services. Because there are practically endless ways an attacker can attempt unauthorized modification, total prevention is virtually impossible. Security architects therefore deploy integrity checksums, authentication checks, and tamper-evident audit logs to **detect** the active attack, prevent unauthorized transactions, and **recover** system state.

---

#### ❌ Why the Other Options are INCORRECT:
* **Option A is False:** Passive attacks do *not* destroy hardware—they are completely non-invasive and silent. Active attacks are what damage services and steal access privileges.
* **Option C is False:** Both passive eavesdropping and active malicious tampering conducted by an adversary are illegal and unauthorized cyber attacks. Diagnostic penetration testing is entirely different.
* **Option D is False:** The passive/active classification has nothing to do with the physical medium; both passive eavesdropping (packet sniffing) and active tampering (man-in-the-middle, DoS) can take place over wired fiber, copper, or wireless networks.

</details>

