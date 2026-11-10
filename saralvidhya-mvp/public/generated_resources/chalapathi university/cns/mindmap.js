/**
 * Chapter 1: Introduction to Security & Classical Encryption Techniques
 * Subject: Cryptography and Network Security (CNS)
 * Institution: Chalapathi Institute of Engineering & Technology / Chalapathi University
 *
 * Interactive Mindmap Engine and Hierarchical Data Model
 * Can be loaded via <script src="mindmap.js"></script> and renders into any HTML container,
 * or auto-mounts into #mindmap / #mindmap-container / document.body.
 */

(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. COMPREHENSIVE MINDMAP DATA HIERARCHY
  // ═══════════════════════════════════════════════════════════════════════════
  var mindmapData = {
    id: "root",
    label: "Chapter 1: Security Concepts & Classical Encryption",
    level: 0,
    category: "root",
    details: "Foundational overview of Cryptography and Network Security: Security Attacks, Services (X.800), Mechanisms, Network Security Models, Symmetric Cipher Model, Cryptanalysis, Classical Substitution & Transposition Techniques, Rotor Machines and Steganography.",
    reference: "Notes.pdf Pages 1–15; Syllabus Unit 1",
    children: [
      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 1: SECURITY CONCEPTS & ATTACKS
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b1",
        label: "1. Security Concepts & Attacks",
        level: 1,
        color: "#2D5A43",
        reference: "Notes.pdf Pages 1–4; Section 1.1–1.2",
        details: "Core definitions of security domains, the 3 pillars of info security, and the comprehensive taxonomy of passive and active network attacks.",
        children: [
          {
            id: "b1_1",
            label: "Security Disciplines & Triad",
            level: 2,
            details: "Distinction between automated tools, data in transit, and organizational information assets.",
            children: [
              {
                id: "b1_1_1",
                label: "Computer Security",
                level: 3,
                details: "Generic collection of automated tools designed to protect data and thwart malicious hackers on standalone systems."
              },
              {
                id: "b1_1_2",
                label: "Network Security",
                level: 3,
                details: "Measures and communication protocols engineered to protect data during transmission across interconnected networks."
              },
              {
                id: "b1_1_3",
                label: "Information Security",
                level: 3,
                details: "Comprehensive policies and technologies to safeguard an organization's data assets from unauthorized access, modification, or destruction."
              },
              {
                id: "b1_1_4",
                label: "Three Key Aspects",
                level: 3,
                details: "The three pillars: (1) Security Attacks (threat actions), (2) Security Mechanisms (countermeasure algorithms), (3) Security Services (policy-enforcing capabilities)."
              }
            ]
          },
          {
            id: "b1_2",
            label: "Passive Attacks (Eavesdropping)",
            level: 2,
            details: "Attacks in the nature of monitoring and eavesdropping transmissions without altering data stream. Focus is strictly on PREVENTION through encryption.",
            children: [
              {
                id: "b1_2_1",
                label: "Core Nature",
                level: 3,
                details: "Goal of opponent is solely to obtain transmitted data. No data modification occurs; detection is nearly impossible, hence prevention is paramount."
              },
              {
                id: "b1_2_2",
                label: "Release of Message Contents",
                level: 3,
                details: "Interception and unauthorized reading of confidential phone conversations, electronic mail, or transferred business files."
              },
              {
                id: "b1_2_3",
                label: "Traffic Analysis",
                level: 3,
                details: "Masking ciphertext still allows an opponent to observe packet frequency, message length, source/destination identities, and burst timings."
              }
            ]
          },
          {
            id: "b1_3",
            label: "Active Attacks (Modification)",
            level: 2,
            details: "Involve alteration of the communication stream or creation of false information flows. Prevention is difficult, so DETECTION and RECOVERY are emphasized.",
            children: [
              {
                id: "b1_3_1",
                label: "Masquerade",
                level: 3,
                details: "One entity pretends to be a different entity (e.g. spoofing authentication credentials to gain elevated unauthorized system privileges)."
              },
              {
                id: "b1_3_2",
                label: "Replay Attack",
                level: 3,
                details: "Passive capture of a legitimate transmission sequence and its subsequent unauthorized retransmission to produce illicit unauthorized effects."
              },
              {
                id: "b1_3_3",
                label: "Modification of Messages",
                level: 3,
                details: "Legitimate message stream is altered, delayed, or reordered (e.g., 'Pay Bob $500' changed to 'Pay Alice $5,000')."
              },
              {
                id: "b1_3_4",
                label: "Denial of Service (DoS)",
                level: 3,
                details: "Inhibits normal communication facilities by flooding networks, overloading server request queues, or disrupting core routing services."
              }
            ]
          }
        ]
      },

      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 2: ITU-T X.800 SECURITY SERVICES
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b2",
        label: "2. Security Services (X.800 Framework)",
        level: 1,
        color: "#3F6B52",
        reference: "Notes.pdf Pages 4–6; Section 1.3",
        details: "ITU-T Recommendation X.800 defines a security service as a processing or communication service provided by a protocol layer to ensure adequate system/data security.",
        children: [
          {
            id: "b2_1",
            label: "Authentication Services",
            level: 2,
            details: "Assures the recipient that the communicating partner or data unit is authentically from the claimed source.",
            children: [
              {
                id: "b2_1_1",
                label: "Peer Entity Authentication",
                level: 3,
                details: "Provides corroboration of the identity of a peer entity during connection establishment and data transfer phases."
              },
              {
                id: "b2_1_2",
                label: "Data Origin Authentication",
                level: 3,
                details: "Provides corroboration of the source of any individual isolated data unit (connectionless packet), without protecting against duplicate retransmission."
              }
            ]
          },
          {
            id: "b2_2",
            label: "Access Control Service",
            level: 2,
            details: "Prevention of unauthorized use of a resource (limiting and controlling access to host servers, applications, and transmission lines).",
            children: [
              {
                id: "b2_2_1",
                label: "Policy Enforcement",
                level: 3,
                details: "Regulates each attempting entity against authorization matrices, capability lists, and role-based access policies."
              }
            ]
          },
          {
            id: "b2_3",
            label: "Data Confidentiality Services",
            level: 2,
            details: "Protection of transmitted data from passive disclosure or unauthorized viewing.",
            children: [
              {
                id: "b2_3_1",
                label: "Connection Confidentiality",
                level: 3,
                details: "Protects all user data transferred across an entire connection-oriented session."
              },
              {
                id: "b2_3_2",
                label: "Connectionless Confidentiality",
                level: 3,
                details: "Protects all user data within isolated single data blocks or packets."
              },
              {
                id: "b2_3_3",
                label: "Selective-Field Confidentiality",
                level: 3,
                details: "Enciphers specific sensitive fields (e.g. credit card number) while leaving envelope headers plaintext."
              },
              {
                id: "b2_3_4",
                label: "Traffic-Flow Confidentiality",
                level: 3,
                details: "Obscures traffic volume, packet lengths, and source-destination communication pairs to thwart traffic analysis."
              }
            ]
          },
          {
            id: "b2_4",
            label: "Data Integrity Services",
            level: 2,
            details: "Assures received data matches transmitted data exactly, without alteration, insertion, deletion, or replay.",
            children: [
              {
                id: "b2_4_1",
                label: "Connection with Recovery",
                level: 3,
                details: "Detects any modification in session data and initiates automated protocol retransmission/rollback recovery."
              },
              {
                id: "b2_4_2",
                label: "Connection without Recovery",
                level: 3,
                details: "Detects modification, insertion, deletion, or reordering with an immediate security alert, omitting automated recovery."
              },
              {
                id: "b2_4_3",
                label: "Selective-Field Integrity",
                level: 3,
                details: "Guarantees integrity over specified critical fields in connection or connectionless data units."
              },
              {
                id: "b2_4_4",
                label: "Connectionless Integrity",
                level: 3,
                details: "Detects unauthorized modification of single independent message units."
              }
            ]
          },
          {
            id: "b2_5",
            label: "Nonrepudiation & Availability",
            level: 2,
            details: "Prevents either communicating party from denying prior transmission or receipt; guarantees resource uptime.",
            children: [
              {
                id: "b2_5_1",
                label: "Proof of Origin",
                level: 3,
                details: "Provides recipient with undeniable proof that the sender originated the transmitted message."
              },
              {
                id: "b2_5_2",
                label: "Proof of Destination",
                level: 3,
                details: "Provides sender with undeniable proof that the intended recipient received the delivered message."
              },
              {
                id: "b2_5_3",
                label: "Availability Service",
                level: 3,
                details: "Guarantees systems and communication channels remain operational, responsive, and accessible on demand."
              }
            ]
          }
        ]
      },

      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 3: SECURITY MECHANISMS & NETWORK MODELS
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b3",
        label: "3. Security Mechanisms & Network Models",
        level: 1,
        color: "#4A7A60",
        reference: "Notes.pdf Pages 6–8; Section 1.4–1.5",
        details: "Specific and pervasive mechanisms defined in X.800, the 4 tasks of security service design, and network access defense models.",
        children: [
          {
            id: "b3_1",
            label: "Specific Security Mechanisms (X.800)",
            level: 2,
            details: "Mechanisms incorporated into specific protocol layers to provide X.800 security services.",
            children: [
              {
                id: "b3_1_1",
                label: "Encipherment",
                level: 3,
                details: "Mathematical algorithms transforming data into unintelligible ciphertext (symmetric & asymmetric ciphers)."
              },
              {
                id: "b3_1_2",
                label: "Digital Signature",
                level: 3,
                details: "Data appended to message allowing recipient to verify source, integrity, and non-repudiation."
              },
              {
                id: "b3_1_3",
                label: "Access Control Mechanisms",
                level: 3,
                details: "Authentication credentials, token verifiers, and permission capability lists enforcing authorization policies."
              },
              {
                id: "b3_1_4",
                label: "Data Integrity Mechanisms",
                level: 3,
                details: "Cryptographic check values, checksums, hash functions, and Message Authentication Codes (MAC)."
              },
              {
                id: "b3_1_5",
                label: "Authentication Exchange",
                level: 3,
                details: "Challenge-response protocols, cryptographic handshakes, and mutual entity identity verification."
              },
              {
                id: "b3_1_6",
                label: "Traffic Padding & Routing Control",
                level: 3,
                details: "Padding: inserting dummy bitstreams to defeat traffic analysis. Routing Control: selecting physically secure routes."
              },
              {
                id: "b3_1_7",
                label: "Notarization",
                level: 3,
                details: "Enlisting an impartial trusted third party (notary) to assure validity, timestamps, and origin of data."
              }
            ]
          },
          {
            id: "b3_2",
            label: "Pervasive Security Mechanisms (X.800)",
            level: 2,
            details: "Mechanisms not tied to a single protocol layer or security service; pervasive across architecture.",
            children: [
              {
                id: "b3_2_1",
                label: "Trusted Functionality",
                level: 3,
                details: "Hardware and software mechanisms certified to execute security criteria correctly without subversion."
              },
              {
                id: "b3_2_2",
                label: "Security Label & Event Detection",
                level: 3,
                details: "Explicit sensitivity labels bound to resources. Event Detection monitors security-relevant violations."
              },
              {
                id: "b3_2_3",
                label: "Audit Trail & Recovery",
                level: 3,
                details: "Security Audit Trail: records chronological system events for forensic review. Recovery: restores system state."
              }
            ]
          },
          {
            id: "b3_3",
            label: "Model for Network Security",
            level: 2,
            details: "Abstract model of two communicating parties over an unsecured channel in the presence of an opponent.",
            children: [
              {
                id: "b3_3_1",
                label: "Core Entities",
                level: 3,
                details: "Sender, Receiver, Transmission Channel, Secret Key, Trusted Third Party (key distributor/arbitrator), and Opponent."
              },
              {
                id: "b3_3_2",
                label: "4 Essential Design Tasks",
                level: 3,
                details: "1. Design transformation algorithm. 2. Generate secret keys. 3. Develop distribution mechanisms. 4. Specify operational protocol."
              }
            ]
          },
          {
            id: "b3_4",
            label: "Network Access Security Model",
            level: 2,
            details: "Protects internal corporate information systems from unauthorized external actors and malicious software.",
            children: [
              {
                id: "b3_4_1",
                label: "Gatekeeper Function",
                level: 3,
                details: "User login authenticators, biometrics, stateful inspection firewalls, and perimeter screening."
              },
              {
                id: "b3_4_2",
                label: "Internal Security Controls",
                level: 3,
                details: "Antivirus monitors, privilege separation, memory guards, and automated audit analysis."
              },
              {
                id: "b3_4_3",
                label: "Threat Landscape",
                level: 3,
                details: "Human hackers (privilege escalation, packet sniffing) and Software threats (viruses, self-replicating worms, Trojan logic)."
              }
            ]
          }
        ]
      },

      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 4: SYMMETRIC CIPHER MODEL & CRYPTANALYSIS
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b4",
        label: "4. Symmetric Cipher Model & Cryptanalysis",
        level: 1,
        color: "#5B8B70",
        reference: "Notes.pdf Pages 8–10; Section 2.1–2.4",
        details: "Conventional encryption architecture, mathematical formulas, cryptographic dimensions, cryptanalytic attack types, and security criteria.",
        children: [
          {
            id: "b4_1",
            label: "Five Ingredients of Symmetric Cipher",
            level: 2,
            details: "The five essential functional components required in any conventional/single-key encryption scheme.",
            children: [
              {
                id: "b4_1_1",
                label: "Plaintext (X)",
                level: 3,
                details: "The original intelligible message or data stream fed into the algorithm as input."
              },
              {
                id: "b4_1_2",
                label: "Encryption Algorithm (E)",
                level: 3,
                details: "Mathematical function performing substitutions and transformations on plaintext under key K."
              },
              {
                id: "b4_1_3",
                label: "Secret Key (K)",
                level: 3,
                details: "Independent parameter input to the algorithm; exact substitutions and transpositions depend on K."
              },
              {
                id: "b4_1_4",
                label: "Ciphertext (Y = E_K(X))",
                level: 3,
                details: "Scrambled, unintelligible output message stream depending on both Plaintext X and Secret Key K."
              },
              {
                id: "b4_1_5",
                label: "Decryption Algorithm (X = D_K(Y))",
                level: 3,
                details: "The encryption algorithm run in reverse; takes Ciphertext Y and Secret Key K to reconstruct Plaintext X."
              }
            ]
          },
          {
            id: "b4_2",
            label: "Two Core Security Requirements",
            level: 2,
            details: "1. Strong encryption algorithm (knowing algorithm and ciphertext is insufficient to determine key/plaintext). 2. Secure key distribution & secrecy.",
            children: [
              {
                id: "b4_2_1",
                label: "Kerckhoffs's Principle",
                level: 3,
                details: "Security of a cryptosystem must depend solely on the secrecy of the key, not on the secrecy of the encryption algorithm."
              }
            ]
          },
          {
            id: "b4_3",
            label: "Three Cryptographic Dimensions",
            level: 2,
            details: "Classification axes: 1. Operations (Substitution vs. Transposition vs. Product). 2. Keys (Symmetric vs. Asymmetric). 3. Plaintext processing (Block vs. Stream).",
            children: [
              {
                id: "b4_3_1",
                label: "Operation Types",
                level: 3,
                details: "Substitution (elements mapped to others), Transposition (elements rearranged), Product systems (multiple cascaded stages)."
              },
              {
                id: "b4_3_2",
                label: "Key Multiplicity",
                level: 3,
                details: "Symmetric / Single-key / Conventional (same key used for E and D) vs Asymmetric / Public-key (different keys for E and D)."
              },
              {
                id: "b4_3_3",
                label: "Processing Modes",
                level: 3,
                details: "Block Cipher (processes fixed blocks of input elements at a time) vs Stream Cipher (processes input elements continuously one by one)."
              }
            ]
          },
          {
            id: "b4_4",
            label: "Cryptanalysis & Attack Models",
            level: 2,
            details: "Taxonomy of cryptanalytic attacks based on the amount of information accessible to the cryptanalyst.",
            children: [
              {
                id: "b4_4_1",
                label: "Ciphertext-Only Attack",
                level: 3,
                details: "Analyst possesses only ciphertext and algorithm; must deduce key and plaintext through statistical analysis."
              },
              {
                id: "b4_4_2",
                label: "Known-Plaintext Attack",
                level: 3,
                details: "Analyst has access to one or more plaintext-ciphertext pairs encrypted under the target key."
              },
              {
                id: "b4_4_3",
                label: "Chosen-Plaintext Attack",
                level: 3,
                details: "Analyst can select arbitrary plaintext strings and obtain corresponding ciphertexts from target encryption engine."
              },
              {
                id: "b4_4_4",
                label: "Chosen-Ciphertext Attack",
                level: 3,
                details: "Analyst can select arbitrary ciphertexts and obtain their decrypted plaintext equivalents."
              },
              {
                id: "b4_4_5",
                label: "Brute-Force Search",
                level: 3,
                details: "Exhaustive trial of every possible key in keyspace. On average, half the keyspace must be searched."
              }
            ]
          },
          {
            id: "b4_5",
            label: "Security Criteria Notions",
            level: 2,
            details: "Mathematical definitions distinguishing theoretical perfection from practical computing limits.",
            children: [
              {
                id: "b4_5_1",
                label: "Unconditionally Secure",
                level: 3,
                details: "Ciphertext contains insufficient statistical information to uniquely determine plaintext, regardless of computation power (e.g. One-Time Pad)."
              },
              {
                id: "b4_5_2",
                label: "Computationally Secure",
                level: 3,
                details: "Cost of breaking cipher exceeds the value of encrypted data, OR time required to break exceeds the useful lifetime of the information."
              }
            ]
          }
        ]
      },

      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 5: CLASSICAL SUBSTITUTION TECHNIQUES
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b5",
        label: "5. Classical Substitution Techniques",
        level: 1,
        color: "#7A9E89",
        reference: "Notes.pdf Pages 10–13; Section 2.5",
        details: "Substitution replaces plaintext letters, bits, or groups with ciphertext letters, bits, or symbols. Covers Caesar, Monoalphabetic, Playfair, Hill, Polyalphabetic, Vernam, and One-Time Pad.",
        children: [
          {
            id: "b5_1",
            label: "Caesar Cipher (Shift k = 3)",
            level: 2,
            details: "Oldest known substitution cipher. Replaces each letter with the letter 3 positions down the alphabet.",
            children: [
              {
                id: "b5_1_1",
                label: "Formulas & Modular Arithmetic",
                level: 3,
                details: "Encryption: c = (p + k) mod 26. Decryption: p = (c - k) mod 26. Key k = 3."
              },
              {
                id: "b5_1_2",
                label: "Vulnerabilities",
                level: 3,
                details: "Trivial keyspace of only 25 keys; brute force tests all shifts instantly; letter frequency distribution is unchanged."
              }
            ]
          },
          {
            id: "b5_2",
            label: "Monoalphabetic Substitution",
            level: 2,
            details: "Permutes all 26 alphabetic characters arbitrarily, expanding keyspace to 26! ≈ 4.03 × 10^26 keys.",
            children: [
              {
                id: "b5_2_1",
                label: "Keyspace Expansion",
                level: 3,
                details: "26! keys completely eliminates brute-force attack feasibility."
              },
              {
                id: "b5_2_2",
                label: "Frequency Analysis Vulnerability",
                level: 3,
                details: "Does not conceal natural language statistics. Single letter frequencies in English: E (12.7%), T (9.1%), A (8.2%), O, I, N."
              },
              {
                id: "b5_2_3",
                label: "Digraph & Trigraph Patterns",
                level: 3,
                details: "Digraphs (th, he, in, er, an) and trigraphs (the, and, tha) allow rapid cryptanalytic reconstruction of the mapping."
              }
            ]
          },
          {
            id: "b5_3",
            label: "Playfair Digraph Cipher",
            level: 2,
            details: "Enciphers two letters (digraph) at a time using a 5×5 key matrix based on a keyword (invented by Wheatstone 1854, championed by Lord Playfair).",
            children: [
              {
                id: "b5_3_1",
                label: "5x5 Key Matrix Setup",
                level: 3,
                details: "Keyword letters filled first without duplicates; remaining alphabet fills remaining cells. 'I' and 'J' share a cell."
              },
              {
                id: "b5_3_2",
                label: "4 Geometric Rules",
                level: 3,
                details: "1. Duplicate letters in pair separated by filler 'x' ('balloon' -> 'ba lx lo on'). 2. Same row: shift right circularly. 3. Same column: shift down circularly. 4. Rectangle: opposite corners in own row."
              },
              {
                id: "b5_3_3",
                label: "Cryptanalysis",
                level: 3,
                details: "25x25 = 650 digraphs. Eliminates single-letter frequencies, but vulnerable to relative frequency analysis of digraphs."
              }
            ]
          },
          {
            id: "b5_4",
            label: "Hill Cipher (Linear Algebra Block)",
            level: 2,
            details: "Polygraphic block cipher developed by Lester Hill (1929). Enciphers blocks of n letters via matrix multiplication mod 26.",
            children: [
              {
                id: "b5_4_1",
                label: "Mathematical Formulation",
                level: 3,
                details: "Encipher: C = K · P (mod 26). Decipher: P = K⁻¹ · C (mod 26). Vector matrix operations mod 26."
              },
              {
                id: "b5_4_2",
                label: "Key Invertibility Condition",
                level: 3,
                details: "The key matrix K must be invertible mod 26, requiring gcd(det(K), 26) = 1 (det(K) not divisible by 2 or 13)."
              },
              {
                id: "b5_4_3",
                label: "Strengths & Weaknesses",
                level: 3,
                details: "Completely hides single-letter and digraph frequencies for larger block sizes, but easily broken by known-plaintext attack using n pairs."
              }
            ]
          },
          {
            id: "b5_5",
            label: "Polyalphabetic Ciphers",
            level: 2,
            details: "Uses different monoalphabetic substitutions as one proceeds through the message, flattening frequency distributions.",
            children: [
              {
                id: "b5_5_1",
                label: "Vigenère Cipher",
                level: 3,
                details: "26 Caesar ciphers indexed by a repeating keyword. Key letter identifies row, plaintext letter identifies column."
              },
              {
                id: "b5_5_2",
                label: "Kasiski Examination",
                level: 3,
                details: "Vigenère's periodic keyword causes repeated ciphertext blocks at distances that are multiples of key length, breaking the cipher."
              },
              {
                id: "b5_5_3",
                label: "Autokey System",
                level: 3,
                details: "Eliminates periodic keyword by concatenating keyword with the plaintext itself to form a non-repeating running key."
              }
            ]
          },
          {
            id: "b5_6",
            label: "Vernam Cipher & One-Time Pad",
            level: 2,
            details: "Ultimate classical encryption security using binary XOR and message-length non-repeating keys.",
            children: [
              {
                id: "b5_6_1",
                label: "Vernam Cipher (Gilbert Vernam 1918)",
                level: 3,
                details: "Bitwise XOR on binary data: C_i = P_i ⊕ K_i and P_i = C_i ⊕ K_i. Historically implemented with repeating paper tape loops."
              },
              {
                id: "b5_6_2",
                label: "One-Time Pad (Joseph Mauborgne)",
                level: 3,
                details: "Improvement using truly random key as long as message, used exactly once and destroyed. Unconditionally secure / unbreakable."
              },
              {
                id: "b5_6_3",
                label: "Practical Limitations",
                level: 3,
                details: "Enormous cost of generating truly random keys of immense size, plus the insurmountable problem of secure key distribution and synchronization."
              }
            ]
          }
        ]
      },

      // ───────────────────────────────────────────────────────────────────────
      // BRANCH 6: TRANSPOSITION, ROTORS & STEGANOGRAPHY
      // ───────────────────────────────────────────────────────────────────────
      {
        id: "b6",
        label: "6. Transposition, Rotors & Steganography",
        level: 1,
        color: "#9C835F",
        reference: "Notes.pdf Pages 13–15; Section 2.6–2.7",
        details: "Transposition rearranges letter positions without altering their identity. Rotor machines mechanize polyalphabetic substitutions. Steganography conceals the presence of communication.",
        children: [
          {
            id: "b6_1",
            label: "Rail Fence Cipher",
            level: 2,
            details: "Plaintext is written down diagonally as a sequence on d rails and read off row by row.",
            children: [
              {
                id: "b6_1_1",
                label: "Mechanism & Vulnerability",
                level: 3,
                details: "Zigzag diagonal write across rails (depth 2 or higher), horizontal read. Easily broken by checking small rail depths."
              }
            ]
          },
          {
            id: "b6_2",
            label: "Rectangular Columnar Transposition",
            level: 2,
            details: "Plaintext written in rectangle row-by-row; columns read off in permutation order dictated by key.",
            children: [
              {
                id: "b6_2_1",
                label: "Mechanism",
                level: 3,
                details: "Key word or sequence numbers define column permutation order. Text written in rows and extracted column-by-column."
              },
              {
                id: "b6_2_2",
                label: "Cryptanalysis",
                level: 3,
                details: "Letter frequencies are 100% identical to plaintext; anagramming and column digraph reconstruction easily breaks single stage."
              }
            ]
          },
          {
            id: "b6_3",
            label: "Multiple Transposition",
            level: 2,
            details: "Re-encrypting ciphertext through two or more successive columnar transposition stages.",
            children: [
              {
                id: "b6_3_1",
                label: "Diffusion & Complexity",
                level: 3,
                details: "Produces a much more complex non-periodic permutation that cannot be easily factored or reconstructed by single-column anagramming."
              }
            ]
          },
          {
            id: "b6_4",
            label: "Rotor Machines",
            level: 2,
            details: "Hardware machines consisting of independently rotating cylinders/rotors through which electrical pulses flow.",
            children: [
              {
                id: "b6_4_1",
                label: "Internal Wiring Architecture",
                level: 3,
                details: "Each cylinder has 26 input pins and 26 output pins connected by complex internal wiring representing a monoalphabetic substitution."
              },
              {
                id: "b6_4_2",
                label: "Stepping Mechanism & Period",
                level: 3,
                details: "With each key stroke, fast rotor rotates one position; after 26 steps, middle rotor rotates. 3 rotors provide period of 26³ = 17,576 substitution alphabets."
              },
              {
                id: "b6_4_3",
                label: "Historical Example: Enigma",
                level: 3,
                details: "German WWII Enigma machine used multi-rotor cascades with plugboards; cracked by Polish Cipher Bureau and Turing at Bletchley Park."
              }
            ]
          },
          {
            id: "b6_5",
            label: "Steganography",
            level: 2,
            details: "Hiding the very existence of the message, in contrast to cryptography which obscures message meaning.",
            children: [
              {
                id: "b6_5_1",
                label: "Classical Techniques",
                level: 3,
                details: "Invisible inks (lemon juice, heat-activated), pin punctures in typewriter characters, deliberate character spacing/misspellings."
              },
              {
                id: "b6_5_2",
                label: "Digital Media LSB Embedding",
                level: 3,
                details: "Overwriting the Least Significant Bit (LSB) of 24-bit color pixels in JPEG/PNG images or audio samples, imperceptible to human eye/ear."
              },
              {
                id: "b6_5_3",
                label: "Trade-offs",
                level: 3,
                details: "Advantage: does not attract suspicion like encrypted ciphertext. Drawback: high data overhead and once algorithm is discovered, all data is exposed."
              }
            ]
          }
        ]
      }
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INTERACTIVE RENDERER (SVG + D3-style Balanced Tree Engine)
  // ═══════════════════════════════════════════════════════════════════════════
  function MindmapRenderer(container, data, options) {
    this.container = typeof container === 'string' ? document.getElementById(container) : container;
    if (!this.container) {
      console.error("[MindmapRenderer] Container not found:", container);
      return;
    }
    this.data = data || mindmapData;
    this.options = Object.assign({
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      nodeWidth: 230,
      nodeHeight: 46,
      hGap: 140,
      vGap: 24,
      initialZoom: 0.85
    }, options);

    this.collapsedNodes = new Set();
    this.zoom = this.options.initialZoom;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.searchTerm = "";

    this.initDOM();
    this.layoutAndRender();
    this.centerView();
  }

  MindmapRenderer.prototype.initDOM = function () {
    var self = this;
    this.container.innerHTML = "";
    this.container.style.position = "relative";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.minHeight = "650px";
    this.container.style.overflow = "hidden";
    this.container.style.background = "#F9FBF9";
    this.container.style.fontFamily = this.options.fontFamily;
    this.container.style.userSelect = "none";

    // SVG Canvas
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.style.position = "absolute";
    this.svg.style.top = "0";
    this.svg.style.left = "0";
    this.svg.style.cursor = "grab";

    // Defs for gradients & shadow filters
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#14261C" flood-opacity="0.12"/>
      </filter>
      <filter id="rootShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0B1A12" flood-opacity="0.22"/>
      </filter>
    `;
    this.svg.appendChild(defs);

    // Canvas Group (affected by pan & zoom)
    this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.svg.appendChild(this.g);
    this.container.appendChild(this.svg);

    // Toolbar Controls
    this.toolbar = document.createElement("div");
    this.toolbar.style.position = "absolute";
    this.toolbar.style.top = "16px";
    this.toolbar.style.right = "16px";
    this.toolbar.style.display = "flex";
    this.toolbar.style.gap = "8px";
    this.toolbar.style.background = "rgba(255, 255, 255, 0.95)";
    this.toolbar.style.backdropFilter = "blur(8px)";
    this.toolbar.style.padding = "6px 10px";
    this.toolbar.style.borderRadius = "8px";
    this.toolbar.style.boxShadow = "0 2px 10px rgba(0,0,0,0.08)";
    this.toolbar.style.zIndex = "10";

    var btnZoomIn = this.createButton("+", "Zoom In", function () { self.setZoom(self.zoom * 1.2); });
    var btnZoomOut = this.createButton("−", "Zoom Out", function () { self.setZoom(self.zoom / 1.2); });
    var btnFit = this.createButton("Fit", "Fit to Screen", function () { self.centerView(); });
    var btnExpandAll = this.createButton("Expand All", "Expand All Nodes", function () {
      self.collapsedNodes.clear();
      self.layoutAndRender();
    });
    var btnCollapseAll = this.createButton("Collapse", "Collapse to L1", function () {
      self.collapsedNodes.clear();
      function coll(n) {
        if (n.level >= 1 && n.children && n.children.length) self.collapsedNodes.add(n.id);
        if (n.children) n.children.forEach(coll);
      }
      self.data.children.forEach(coll);
      self.layoutAndRender();
      self.centerView();
    });

    this.toolbar.appendChild(btnZoomIn);
    this.toolbar.appendChild(btnZoomOut);
    this.toolbar.appendChild(btnFit);
    this.toolbar.appendChild(btnExpandAll);
    this.toolbar.appendChild(btnCollapseAll);
    this.container.appendChild(this.toolbar);

    // Search bar
    this.searchContainer = document.createElement("div");
    this.searchContainer.style.position = "absolute";
    this.searchContainer.style.top = "16px";
    this.searchContainer.style.left = "16px";
    this.searchContainer.style.zIndex = "10";
    this.searchContainer.innerHTML = `
      <input type="text" placeholder="Search mindmap concepts..." style="
        padding: 8px 14px;
        width: 250px;
        border-radius: 8px;
        border: 1px solid #CBD5E1;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        outline: none;
      "/>
    `;
    var searchInput = this.searchContainer.querySelector("input");
    searchInput.addEventListener("input", function (e) {
      self.searchTerm = e.target.value.trim().toLowerCase();
      self.layoutAndRender();
    });
    this.container.appendChild(this.searchContainer);

    // Detail Panel Drawer (Slide in from right)
    this.drawer = document.createElement("div");
    this.drawer.style.position = "absolute";
    this.drawer.style.top = "0";
    this.drawer.style.right = "-420px";
    this.drawer.style.width = "400px";
    this.drawer.style.height = "100%";
    this.drawer.style.background = "#FFFFFF";
    this.drawer.style.boxShadow = "-4px 0 20px rgba(0,0,0,0.15)";
    this.drawer.style.transition = "right 0.3s ease";
    this.drawer.style.zIndex = "20";
    this.drawer.style.padding = "24px";
    this.drawer.style.boxSizing = "border-box";
    this.drawer.style.overflowY = "auto";
    this.container.appendChild(this.drawer);

    // Event Listeners for Pan & Zoom
    this.svg.addEventListener("mousedown", function (e) {
      if (e.target.closest(".node-group") || e.target.closest(".toggle-btn")) return;
      self.isDragging = true;
      self.startX = e.clientX - self.panX;
      self.startY = e.clientY - self.panY;
      self.svg.style.cursor = "grabbing";
    });

    window.addEventListener("mousemove", function (e) {
      if (!self.isDragging) return;
      self.panX = e.clientX - self.startX;
      self.panY = e.clientY - self.startY;
      self.updateTransform();
    });

    window.addEventListener("mouseup", function () {
      self.isDragging = false;
      self.svg.style.cursor = "grab";
    });

    this.svg.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = self.container.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      var mouseY = e.clientY - rect.top;
      var factor = e.deltaY < 0 ? 1.12 : 0.88;
      var newZoom = Math.max(0.2, Math.min(3.0, self.zoom * factor));

      // Zoom towards mouse pointer
      self.panX = mouseX - (mouseX - self.panX) * (newZoom / self.zoom);
      self.panY = mouseY - (mouseY - self.panY) * (newZoom / self.zoom);
      self.zoom = newZoom;
      self.updateTransform();
    }, { passive: false });
  };

  MindmapRenderer.prototype.createButton = function (label, title, onClick) {
    var btn = document.createElement("button");
    btn.innerText = label;
    btn.title = title;
    btn.style.border = "1px solid #E2E8F0";
    btn.style.background = "#FFFFFF";
    btn.style.color = "#1E293B";
    btn.style.padding = "5px 10px";
    btn.style.borderRadius = "6px";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "600";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.15s ease";
    btn.onmouseover = function () { btn.style.background = "#F1F5F9"; };
    btn.onmouseout = function () { btn.style.background = "#FFFFFF"; };
    btn.onclick = onClick;
    return btn;
  };

  MindmapRenderer.prototype.setZoom = function (z) {
    var rect = this.container.getBoundingClientRect();
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var newZoom = Math.max(0.2, Math.min(3.0, z));
    this.panX = cx - (cx - this.panX) * (newZoom / this.zoom);
    this.panY = cy - (cy - this.panY) * (newZoom / this.zoom);
    this.zoom = newZoom;
    this.updateTransform();
  };

  MindmapRenderer.prototype.updateTransform = function () {
    this.g.setAttribute("transform", "translate(" + this.panX + "," + this.panY + ") scale(" + this.zoom + ")");
  };

  MindmapRenderer.prototype.centerView = function () {
    var rect = this.container.getBoundingClientRect();
    this.zoom = this.options.initialZoom;
    this.panX = rect.width / 2;
    this.panY = rect.height / 2;
    this.updateTransform();
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TREE LAYOUT ALGORITHM (Left-Right Balanced Two-Sided Tree)
  // ═══════════════════════════════════════════════════════════════════════════
  MindmapRenderer.prototype.layoutAndRender = function () {
    var self = this;
    this.g.innerHTML = "";

    // Step 1: Assign left/right side to top-level branches
    var rightBranches = [];
    var leftBranches = [];
    var totalKids = this.data.children ? this.data.children.length : 0;
    var half = Math.ceil(totalKids / 2);

    if (this.data.children) {
      this.data.children.forEach(function (c, idx) {
        if (idx < half) {
          c.side = "r";
          rightBranches.push(c);
        } else {
          c.side = "l";
          leftBranches.push(c);
        }
      });
    }

    // Step 2: Recursive leaf-count height measurement
    function countWeight(node) {
      if (self.collapsedNodes.has(node.id) || !node.children || node.children.length === 0) {
        node.weight = 1;
        return 1;
      }
      var sum = 0;
      node.children.forEach(function (ch) {
        ch.side = node.side;
        sum += countWeight(ch);
      });
      node.weight = sum;
      return sum;
    }

    rightBranches.forEach(countWeight);
    leftBranches.forEach(countWeight);

    // Step 3: Compute positions
    var nodes = [];
    var links = [];

    // Root node at (0, 0)
    var rootNode = {
      data: this.data,
      x: 0,
      y: 0,
      width: 270,
      height: 54,
      level: 0,
      side: "root"
    };
    nodes.push(rootNode);

    function layoutSubtree(nodeList, side) {
      var totalWeight = 0;
      nodeList.forEach(function (n) { totalWeight += n.weight; });
      var startY = - (totalWeight * (self.options.nodeHeight + self.options.vGap)) / 2;
      var curY = startY;

      function place(n, parentX, parentY, depth) {
        var h = n.weight * (self.options.nodeHeight + self.options.vGap);
        var y = curY + h / 2;
        var dir = side === "r" ? 1 : -1;
        var nodeW = depth === 1 ? 230 : 200;
        var x = parentX + dir * (self.options.nodeWidth + self.options.hGap);

        var placedNode = {
          data: n,
          x: x,
          y: y,
          width: nodeW,
          height: self.options.nodeHeight,
          level: depth,
          side: side
        };
        nodes.push(placedNode);
        links.push({
          x1: parentX,
          y1: parentY,
          x2: x,
          y2: y,
          side: side,
          color: n.color || "#4F7B64",
          depth: depth
        });

        if (!self.collapsedNodes.has(n.id) && n.children && n.children.length > 0) {
          var savedCurY = curY;
          n.children.forEach(function (ch) {
            place(ch, x, y, depth + 1);
          });
        } else {
          curY += h;
        }
      }

      nodeList.forEach(function (n) {
        place(n, rootNode.x, rootNode.y, 1);
      });
    }

    layoutSubtree(rightBranches, "r");
    layoutSubtree(leftBranches, "l");

    // Step 4: Draw Bezier Curve Links
    links.forEach(function (lk) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      var dx = (lk.x2 - lk.x1) / 2;
      var d = "M " + lk.x1 + " " + lk.y1 + " C " + (lk.x1 + dx) + " " + lk.y1 + " " + (lk.x2 - dx) + " " + lk.y2 + " " + lk.x2 + " " + lk.y2;
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", lk.color || "#7BA88B");
      path.setAttribute("stroke-width", Math.max(1.5, 3.5 - lk.depth * 0.7));
      path.setAttribute("stroke-opacity", "0.75");
      self.g.appendChild(path);
    });

    // Step 5: Draw Nodes
    nodes.forEach(function (nd) {
      self.drawNode(nd);
    });

    this.updateTransform();
  };

  MindmapRenderer.prototype.drawNode = function (nd) {
    var self = this;
    var d = nd.data;
    var isRoot = nd.level === 0;
    var isCollapsed = this.collapsedNodes.has(d.id);
    var hasChildren = d.children && d.children.length > 0;

    var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", "node-group");
    group.style.cursor = "pointer";

    // Matching query highlight
    var isMatch = this.searchTerm && (
      (d.label && d.label.toLowerCase().includes(this.searchTerm)) ||
      (d.details && d.details.toLowerCase().includes(this.searchTerm))
    );

    // Styling according to level
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", nd.x - nd.width / 2);
    rect.setAttribute("y", nd.y - nd.height / 2);
    rect.setAttribute("width", nd.width);
    rect.setAttribute("height", nd.height);
    rect.setAttribute("rx", isRoot ? 14 : 9);
    rect.setAttribute("filter", isRoot ? "url(#rootShadow)" : "url(#nodeShadow)");

    var bgFill = isRoot ? "#25352C" : nd.level === 1 ? (d.color || "#375545") : nd.level === 2 ? "#4F7B64" : "#FFFFFF";
    var strokeColor = isRoot ? "#1B2822" : nd.level <= 2 ? "transparent" : "#CBD5E1";
    var textColor = (nd.level <= 2 || isRoot) ? "#FFFFFF" : "#1E293B";

    if (isMatch) {
      bgFill = "#F59E0B";
      textColor = "#FFFFFF";
      strokeColor = "#D97706";
    }

    rect.setAttribute("fill", bgFill);
    rect.setAttribute("stroke", strokeColor);
    rect.setAttribute("stroke-width", isMatch ? "2.5" : "1");
    group.appendChild(rect);

    // Node Label Text
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", nd.x);
    text.setAttribute("y", nd.y + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", textColor);
    text.setAttribute("font-size", isRoot ? "14px" : nd.level === 1 ? "12.5px" : "11.5px");
    text.setAttribute("font-weight", isRoot || nd.level === 1 ? "700" : "500");
    text.setAttribute("pointer-events", "none");

    // Truncate text if it overflows node width
    var maxChars = Math.floor(nd.width / 7.5);
    var labelStr = d.label;
    if (labelStr.length > maxChars) {
      labelStr = labelStr.substring(0, maxChars - 2) + "…";
    }
    text.textContent = labelStr;
    group.appendChild(text);

    // Expand/Collapse Badge on nodes that have children
    if (hasChildren && !isRoot) {
      var badgeX = nd.side === "r" ? (nd.x + nd.width / 2 + 10) : (nd.x - nd.width / 2 - 10);
      var toggleBtn = document.createElementNS("http://www.w3.org/2000/svg", "g");
      toggleBtn.setAttribute("class", "toggle-btn");
      toggleBtn.style.cursor = "pointer";

      var badgeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      badgeCircle.setAttribute("cx", badgeX);
      badgeCircle.setAttribute("cy", nd.y);
      badgeCircle.setAttribute("r", 8);
      badgeCircle.setAttribute("fill", isCollapsed ? "#BD7D52" : "#E2E8F0");
      badgeCircle.setAttribute("stroke", isCollapsed ? "#9C623C" : "#94A3B8");
      badgeCircle.setAttribute("stroke-width", "1");
      toggleBtn.appendChild(badgeCircle);

      var badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      badgeText.setAttribute("x", badgeX);
      badgeText.setAttribute("y", nd.y + 3.5);
      badgeText.setAttribute("text-anchor", "middle");
      badgeText.setAttribute("fill", isCollapsed ? "#FFFFFF" : "#475569");
      badgeText.setAttribute("font-size", "10px");
      badgeText.setAttribute("font-weight", "bold");
      badgeText.textContent = isCollapsed ? "+" : "−";
      toggleBtn.appendChild(badgeText);

      toggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (self.collapsedNodes.has(d.id)) {
          self.collapsedNodes.delete(d.id);
        } else {
          self.collapsedNodes.add(d.id);
        }
        self.layoutAndRender();
      });

      group.appendChild(toggleBtn);
    }

    // Node Click Handlers -> Open Details Drawer
    group.addEventListener("click", function (e) {
      e.stopPropagation();
      self.showDetails(d);
    });

    this.g.appendChild(group);
  };

  MindmapRenderer.prototype.showDetails = function (nodeData) {
    var self = this;
    var html = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
        <span style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; color:#BD7D52; background:#FDF8F5; padding:3px 8px; border-radius:4px;">
          Level ${nodeData.level} • ${nodeData.category || "Concept"}
        </span>
        <button id="closeDrawer" style="border:none; background:transparent; font-size:20px; cursor:pointer; color:#64748B;">✕</button>
      </div>
      <h2 style="font-size:18px; font-weight:700; color:#1E293B; margin:0 0 12px 0; line-height:1.35;">
        ${nodeData.label}
      </h2>
      ${nodeData.reference ? `<div style="font-size:12px; color:#64748B; margin-bottom:14px; font-weight:500;">📖 Reference: <strong>${nodeData.reference}</strong></div>` : ""}
      <div style="font-size:13.5px; color:#334155; line-height:1.6; margin-bottom:20px; background:#F8FAFC; padding:14px; border-radius:8px; border-left:4px solid #4F7B64;">
        ${nodeData.details || "No further details available for this topic."}
      </div>
      ${nodeData.children && nodeData.children.length > 0 ? `
        <h4 style="font-size:13px; font-weight:700; color:#475569; text-transform:uppercase; margin:16px 0 8px 0;">Sub-Topics (${nodeData.children.length})</h4>
        <ul style="margin:0; padding-left:20px; font-size:13px; color:#334155; line-height:1.6;">
          ${nodeData.children.map(function(c) { return `<li style="margin-bottom:6px;"><strong>${c.label}</strong></li>`; }).join('')}
        </ul>
      ` : ""}
    `;
    this.drawer.innerHTML = html;
    this.drawer.style.right = "0";

    document.getElementById("closeDrawer").onclick = function () {
      self.drawer.style.right = "-420px";
    };
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. AUTO-INITIALIZATION & EXPORT
  // ═══════════════════════════════════════════════════════════════════════════
  function autoInit() {
    var targets = ["mindmap", "mindmap-container", "cns-mindmap"];
    for (var i = 0; i < targets.length; i++) {
      var el = document.getElementById(targets[i]);
      if (el) {
        new MindmapRenderer(el, mindmapData);
        return;
      }
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }
  }

  // Global exports
  global.CNS_CHAPTER_1_MINDMAP = mindmapData;
  global.MindmapRenderer = MindmapRenderer;
  global.renderCNSMindmap = function (containerId, options) {
    return new MindmapRenderer(containerId, mindmapData, options);
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      mindmapData: mindmapData,
      MindmapRenderer: MindmapRenderer
    };
  }

})(typeof window !== 'undefined' ? window : this);

