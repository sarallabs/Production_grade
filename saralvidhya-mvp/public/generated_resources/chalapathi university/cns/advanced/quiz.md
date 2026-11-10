# Pop Quiz: Chapter 1 — Security Concepts & Classical Encryption (Advanced Level)

---

### Pop Quiz Question

**Mindmap Location:** Chapter 1 > 3. Symmetric Encryption Principles > Fundamental Requirements > Shannon Perfect Secrecy  
**Depth Level:** L-3 / Advanced Academic Rigor  
**Bloom's Taxonomy:** Evaluate / Analyze  
**Difficulty:** Advanced (Postgraduate Rigor)  

**Question:**  
In Shannon's information-theoretic formulation of cryptography, let $\mathcal{M}$ be the plaintext space, $\mathcal{C}$ the ciphertext space, and $\mathcal{K}$ the key space, with associated discrete random variables $M, C, K$. A cipher achieves **unconditional security (perfect secrecy)** if and only if:
$$P(M = m \mid C = c) = P(M = m) \quad \forall m \in \mathcal{M}, \forall c \in \mathcal{C}$$
Which of the following statements provides the **most mathematically accurate and complete characterization** of the entropy and cardinality conditions required to satisfy Shannon's theorem, along with its practical consequence?

- **A)** Perfect secrecy requires conditional entropy $H(M \mid C) = 0$, which implies that the message space size $|\mathcal{M}|$ must exceed the key space size $|\mathcal{K}|$, allowing multiple messages to map to the same ciphertext to confuse an attacker.
- **B)** Perfect secrecy requires mutual information $I(M; C) = 0$, which fundamentally implies that the key entropy satisfies $H(K) \ge H(M)$ and the key space cardinality satisfies $|\mathcal{K}| \ge |\mathcal{M}|$; consequently, a key cannot be shorter than the uncompressed message and must never be reused.
- **C)** Perfect secrecy can be achieved with a short 128-bit key if the encryption algorithm applies at least 16 rounds of alternating non-linear substitutions and maximal distance separable (MDS) matrix multiplications.
- **D)** Perfect secrecy requires that the decryption function $D_K(C)$ be non-deterministic, ensuring that a single ciphertext $C$ decrypts into every possible English word with equal probability, independent of key size.

---

### Detailed Answer & Analysis

<details open>
<summary><b>Click to View Solution & Complete Mathematical Analysis</b></summary>

<br/>

**Correct Answer:** **Option B**

#### 💡 Why Option B is CORRECT:
* **Information-Theoretic Proof:**
  By definition, perfect secrecy means $P(M = m \mid C = c) = P(M = m)$.
  The mutual information between message $M$ and ciphertext $C$ is:
  $$I(M; C) = H(M) - H(M \mid C)$$
  Since $P(M \mid C) = P(M)$, the conditional entropy satisfies $H(M \mid C) = H(M)$, which yields:
  $$I(M; C) = H(M) - H(M) = 0$$
* **Key Entropy Bound:**
  Because the key $K$ and ciphertext $C$ uniquely determine message $M$, we have $H(M \mid C, K) = 0$.
  Using the chain rule of entropy:
  $$H(M \mid C) \le H(M, K \mid C) = H(K \mid C) + H(M \mid C, K) = H(K \mid C) \le H(K)$$
  Substituting $H(M \mid C) = H(M)$ into this inequality yields Shannon's fundamental inequality:
  $$H(K) \ge H(M)$$
* **Cardinality Condition:**
  If every message $m \in \mathcal{M}$ has non-zero probability, then for any fixed ciphertext $c \in \mathcal{C}$, each candidate message $m$ requires a distinct key $k \in \mathcal{K}$ such that $E_k(m) = c$. Therefore:
  $$|\mathcal{K}| \ge |\mathcal{M}|$$
* **Engineering Consequence:**
  This mathematically proves that no cipher can achieve unconditional security unless the secret key contains at least as much entropy (and bits) as the plaintext itself ($|K| \ge |M|$) and is sampled from a uniform physical distribution without reuse. This is the exact reason why the Vernam One-Time Pad is the only known perfectly secure cipher.

---

#### ❌ Why the Other Options are INCORRECT:
* **Option A is False:** The assertion $H(M \mid C) = 0$ is the exact **opposite** of perfect secrecy—$H(M \mid C) = 0$ means that observing the ciphertext reveals the plaintext with $100\%$ certainty (zero equivocation). Furthermore, perfect secrecy requires $|\mathcal{K}| \ge |\mathcal{M}|$, not $|\mathcal{M}| > |\mathcal{K}|$.
* **Option C is False:** This describes **computational security** (such as the round design of AES), not unconditional/perfect secrecy. No matter how many rounds of non-linear S-boxes or MDS matrices are evaluated, an adversary with infinite computational resources can perform exhaustive key search over the $2^{128}$ key space, reducing $H(M \mid C)$ to 0 when ciphertext length exceeds the unicity distance ($N > 128 / 3.2 \approx 40$ characters).
* **Option D is False:** Standard symmetric ciphers are strictly deterministic mappings: for a given key $K$ and ciphertext $C$, decryption must produce a single, unambiguous plaintext $M = D_K(C)$ to preserve communication correctness ($\mathcal{D}_K(\mathcal{E}_K(M)) = M$). Decryption cannot be non-deterministic. The property that all plaintexts are equally likely arises because across the ensemble of *all possible keys* $K \in \mathcal{K}$, each message $M'$ is produced with equal probability.

</details>

