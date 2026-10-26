import React, { useState, useRef, useMemo, useEffect } from "react";
import MarkdownView from "@/components/MarkdownView";
import { askGemini } from "@/services/askService";
import { googleTtsSpeak, googleTtsStop } from "@/services/googleTtsService";
import {
  startSpeechSession,
  hasWebSpeechSupport,
  type SpeechSession,
} from "@/services/speechService";
import type { DifficultyLevel } from "@/data/contentRepository";
import { cloudStorage } from "@/context/CloudStateContext";
import "./AskBotView.css";

interface StructuredBotAnswer {
  title: string;
  paragraphs: string[];
  examTipPrefix?: string;
  examTipHighlight?: string;
  examTipSuffix?: string;
  groundedTopic: string;
  groundedSection: string;
  groundedNode: string;
  followUps: string[];
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  loading?: boolean;
  structured?: StructuredBotAnswer;
}

interface SeedExchange {
  question: string;
  answerText: string;
  structured: StructuredBotAnswer;
}

function getUnitPrefix(subjectId: string): string {
  if (cloudStorage.getItem("sv_moocs_mode") === "true") return "Unit";
  const id = (subjectId || "").toLowerCase();
  if (
    id.includes("dbms") ||
    id.includes("cs") ||
    id.includes("management") ||
    id.includes("financial") ||
    id.includes("pubadm") ||
    id === "social"
  ) {
    return "Unit";
  }
  return "Chapter";
}

function getSeedExchange(
  subjectId: string,
  chapterNumber: number,
  chapterName: string,
): SeedExchange {
  const id = (subjectId || "").toLowerCase();
  const unitPrefix = getUnitPrefix(subjectId);

  if (id.includes("dbms")) {
    return {
      question: "What's the difference between physical and logical data independence?",
      answerText:
        "Physical data independence is the ability to change the physical schema — storage structures, indexes, file organization — without altering the logical schema. It is the easier of the two to achieve.\n\nLogical data independence is the ability to change the logical (conceptual) schema — adding entities or attributes — without modifying external views or application code. It is harder to achieve, because applications depend directly on the logical structure.",
      structured: {
        title: "Physical vs. Logical Data Independence",
        paragraphs: [
          "**Physical data independence** is the ability to change the **physical schema** — storage structures, indexes, file organization — without altering the logical schema. It is the easier of the two to achieve.",
          "**Logical data independence** is the ability to change the **logical (conceptual) schema** — adding entities or attributes — without modifying external views or application code. It is harder to achieve, because applications depend directly on the logical structure.",
        ],
        examTipPrefix: "A frequent 2-mark question — always state ",
        examTipHighlight: "which is harder and why",
        examTipSuffix:
          " (logical, since application code depends on it). One line each plus the \"harder\" line earns full marks.",
        groundedTopic: `${unitPrefix} ${chapterNumber} · Three Levels of Abstraction`,
        groundedSection: "§1.2",
        groundedNode: "node 1.3",
        followUps: [
          "Which one is harder to achieve?",
          "Show me a 2-mark answer version",
          "Quiz me on this",
          "Where does this appear in PYQs?",
        ],
      },
    };
  }

  if (id.includes("ento")) {
    if (chapterNumber === 1) {
      return {
        question: "Who was the first Imperial Entomologist of India and what were the key early milestones?",
        answerText:
          "Lionel de Niceville was appointed as the first Imperial Entomologist of India in 1901 at Pusa. He was succeeded in 1903 by H. Maxwell-Lefroy, who authored the classic reference books Indian Insect Pests (1906) and Indian Insect Life (1909).\n\nIn South India, T.V. Ramakrishna Ayyar served as the first Government Entomologist of Madras and authored the landmark Handbook of Economic Entomology for South India (1940).",
        structured: {
          title: "Imperial Entomologists & Early Milestones in India",
          paragraphs: [
            "**Lionel de Niceville (1901)** was appointed as the **first Imperial Entomologist of India**, establishing scientific entomological research under the Government of India. He was succeeded by **H. Maxwell-Lefroy (1903)**, who authored *Indian Insect Pests* (1906) and *Indian Insect Life* (1909).",
            "**T.B. Fletcher** succeeded Lefroy at IARI Pusa, while **T.V. Ramakrishna Ayyar** pioneered agricultural entomology in South India and published the *Handbook of Economic Entomology for South India* (1940).",
          ],
          examTipPrefix: "A high-yield objective & 2-mark question — never confuse ",
          examTipHighlight: "Lionel de Niceville (1st Imperial Entomologist, 1901) with H. Maxwell-Lefroy (2nd Imperial Entomologist, 1903)",
          examTipSuffix:
            ". Always mention Indian Insect Life (1909) and T.V. Ramakrishna Ayyar (1940) for full credit.",
          groundedTopic: "Chapter 1 · Imperial Entomologists",
          groundedSection: "§1.3",
          groundedNode: "node 1.3",
          followUps: [
            "List the key entomological institutions & years",
            "Show me a 2-mark answer version",
            "Quiz me on this",
            "Where does this appear in PYQs?",
          ],
        },
      };
    }
    if (chapterNumber === 2) {
      return {
        question: "Why are insects the most abundant and successful group of animals on Earth?",
        answerText:
          "Insects account for over 70% of all known animal species due to four primary evolutionary advantages: a chitinous exoskeleton with an epicuticular wax layer that prevents desiccation, functional wings enabling rapid dispersal, small body size requiring minimal resources, and complete metamorphosis (holometaboly) that eliminates competition between larvae and adults.",
        structured: {
          title: "Structural & Reproductive Factors Driving Insect Abundance",
          paragraphs: [
            "**Structural perfections** — the **chitinous exoskeleton** (sclerotin + epicuticular wax layer preventing water loss), **functional wings** (only winged invertebrates), and **hexapod locomotion** allow insects to colonize nearly every terrestrial habitat.",
            "**Developmental & reproductive advantages** — **complete metamorphosis (holometaboly)** separates larval feeding niches from adult reproductive niches, while **high fecundity**, short life cycles, and **parthenogenesis/polyembryony** drive rapid population growth.",
          ],
          examTipPrefix: "In 4-mark & short-note exams — group your points under ",
          examTipHighlight: "Structural (Exoskeleton, Wings, Small Size) vs. Developmental/Reproductive (Holometaboly, High Fecundity)",
          examTipSuffix:
            " and cite the epicuticular wax layer for desiccation resistance.",
          groundedTopic: "Chapter 2 · Structural Perfections",
          groundedSection: "§2.1",
          groundedNode: "node 2.1",
          followUps: [
            "How does the exoskeleton prevent water loss?",
            "Show me a 2-mark answer version",
            "Quiz me on this",
            "Where does this appear in PYQs?",
          ],
        },
      };
    }
    if (chapterNumber === 3) {
      return {
        question: "What is entomophily and what floral adaptations attract insect pollinators?",
        answerText:
          "Entomophily is cross-pollination mediated by insects, primarily Hymenoptera (honeybees, bumblebees, fig wasps), Diptera, Lepidoptera, and Coleoptera. Entomophilous flowers evolve sticky/spiny pollen grains, vibrant petals with UV nectar guides, nectaries, and specific floral scents.",
        structured: {
          title: "Entomophily & Co-Adapted Pollination Mechanisms",
          paragraphs: [
            "**Entomophily** refers to pollination by insects — led by **Hymenoptera (honeybees accounting for ~80% of crop pollination)**, Diptera (hoverflies), Lepidoptera, and Coleoptera. Entomophilous flowers feature brightly colored corollas, ultraviolet nectar guides, osmophores, and sticky or spiny **pollenkitt-coated pollen**.",
            "**Specialized syndromes** include **melittophily** (bees), **psychophily** (butterflies), **phalaenophily** (moths), **myophily** (flies), and **cantharophily** (beetles, e.g. oil palm weevil *Elaeidobius kamerunicus*), alongside obligate mutualisms such as **Fig (*Ficus*) and *Blastophaga psenes***.",
          ],
          examTipPrefix: "Frequently tested in matching & 2-mark questions — always pair ",
          examTipHighlight: "Oil Palm with Elaeidobius kamerunicus (Cantharophily) and Fig with Blastophaga psenes",
          examTipSuffix:
            " alongside the 5 pollination syndromes to secure full marks.",
          groundedTopic: "Chapter 3 · Mechanism of Pollination",
          groundedSection: "§3.2",
          groundedNode: "node 3.2",
          followUps: [
            "Explain Fig and Blastophaga wasp mutualism",
            "Show me a 2-mark answer version",
            "Quiz me on this",
            "Where does this appear in PYQs?",
          ],
        },
      };
    }
    // Chapter 4 default (Apiculture)
    return {
      question: "How do honeybees communicate the distance and direction of floral sources?",
      answerText:
        "Scout worker bees communicate floral location using Karl von Frisch's dance language on the vertical comb. The Round Dance indicates food within 50 meters without direction, whereas the Waggle Dance (figure-of-8) communicates food beyond 50 meters — where the angle of the straight waggle run relative to gravity equals the angle of the food source relative to the sun.",
      structured: {
        title: "Honeybee Dance Language & Foraging Communication",
        paragraphs: [
          "**Round Dance** is performed by returning forager bees when the nectar or pollen source is **less than 50 meters** from the hive; it excites nestmates to search nearby and conveys floral scent, but does not specify direction.",
          "**Waggle Dance (Figure-of-8)** is performed when the food source is **more than 50 meters** away. Distance is encoded by the duration/number of waggle runs, while **direction relative to the sun** is encoded by the angle of the straight waggle run relative to vertical gravity on the comb.",
        ],
        examTipPrefix: "A classic 2-mark & viva question — clearly contrast ",
        examTipHighlight: "Round Dance (< 50 m, no direction) vs. Waggle Dance (> 50 m, angle to vertical = angle to Sun)",
        examTipSuffix:
          " discovered by Nobel laureate Karl von Frisch.",
        groundedTopic: "Chapter 4 · Foraging Behaviour & Communication",
        groundedSection: "§4.4",
        groundedNode: "node 4.4",
        followUps: [
          "Compare Apis cerana indica and Apis mellifera",
          "Show me a 2-mark answer version",
          "Quiz me on this",
          "Where does this appear in PYQs?",
        ],
      },
    };
  }

  const cleanCh = (chapterName || "Core Concepts").replace(/^(Chapter|Unit)\s*\d+\s*[:·\-–—]\s*/i, "").trim();
  return {
    question: `What are the most important exam concepts in ${cleanCh}?`,
    answerText: `In ${cleanCh}, focus on the foundational definitions, structural classifications, and applied mechanisms covered in ${unitPrefix} ${chapterNumber}. Understanding both theoretical principles and their practical distinctions is key for scoring full marks in short and long answer questions.`,
    structured: {
      title: `Core Concepts & Exam Focus — ${cleanCh}`,
      paragraphs: [
        `**Foundational Principles**: ${cleanCh} establishes the core terminology, classification frameworks, and structural relationships that underpin the rest of ${unitPrefix} ${chapterNumber}.`,
        `**Applied Mechanisms**: Pay close attention to comparative distinctions, cause-and-effect pathways, and standard examples highlighted in your university syllabus notes.`,
      ],
      examTipPrefix: "Frequent exam question — always structure your response with ",
      examTipHighlight: "a crisp 1-line definition, a 2-point comparison, and one canonical example",
      examTipSuffix: " to earn full marks.",
      groundedTopic: `${unitPrefix} ${chapterNumber} · ${cleanCh}`,
      groundedSection: `§${chapterNumber}.1`,
      groundedNode: `node ${chapterNumber}.1`,
      followUps: [
        "Show me a 2-mark answer version",
        "Give me a quick comparison table",
        "Quiz me on this",
        "Where does this appear in PYQs?",
      ],
    },
  };
}

const CANONICAL_FOLLOWUP_ANSWERS: Record<string, StructuredBotAnswer> = {
  "which one is harder to achieve?": {
    title: "Why Logical Data Independence Is Harder to Achieve",
    paragraphs: [
      "**Logical data independence is significantly harder to achieve** than physical data independence because **application programs and user queries are written directly against the logical schema** (table names, columns, constraints, and relationships).",
      "When you modify the physical storage (e.g., moving from a B+ Tree index to a hash index or changing disk block layout), the DBMS storage engine absorbs the change transparently. However, changing the logical structure (splitting a table or altering entity attributes) requires rewriting view mappings and application-level SQL unless external views completely insulate them.",
    ],
    examTipPrefix: "Key 2-mark takeaway — state explicitly that ",
    examTipHighlight: "application code and queries reference logical tables/attributes directly, not physical disk blocks",
    examTipSuffix: ", making logical schema changes much harder to mask.",
    groundedTopic: "Unit 1 · Three Levels of Abstraction",
    groundedSection: "§1.2",
    groundedNode: "node 1.2",
    followUps: [
      "Explain the ANSI-SPARC 3-schema architecture",
      "Show me a 2-mark answer version",
      "Quiz me on this",
      "Where does this appear in PYQs?",
    ],
  },
  "show me a 2-mark answer version": {
    title: "Exam-Ready 2-Mark Answer (Full-Credit Format)",
    paragraphs: [
      "**1. Physical Data Independence:** The capacity to modify the **internal/physical schema** (file organization, indexing, storage devices) without having to alter the conceptual/logical schema. *(1 Mark)*",
      "**2. Logical Data Independence:** The capacity to modify the **conceptual/logical schema** (adding/splitting relations or attributes) without having to alter external views or application programs. **Logical data independence is harder to achieve** because application programs are tightly coupled to the logical structure. *(1 Mark)*",
    ],
    examTipPrefix: "Write these exact ",
    examTipHighlight: "two numbered points + the bold concluding sentence",
    examTipSuffix: " in your university exam booklet — evaluators award 2/2 immediately.",
    groundedTopic: "Unit 1 · Exam Answer Blueprint",
    groundedSection: "§1.2",
    groundedNode: "node 1.3",
    followUps: [
      "Give me a 5-mark answer with diagram steps",
      "Quiz me on this",
      "Where does this appear in PYQs?",
    ],
  },
  "quiz me on this": {
    title: "Quick Check — Test Your Understanding",
    paragraphs: [
      "**Q1 (Multiple Choice):** A database administrator replaces a B+ Tree index on the `Student` table with a Hash index to speed up equality searches. Which property ensures that existing SQL queries and application code continue to work without modification?\n- **A)** Logical Data Independence\n- **B)** Physical Data Independence ✓\n- **C)** View Serializability\n- **D)** Referential Integrity",
      "**Why B is correct:** Index structures belong to the **internal (physical) schema**. Insulating the conceptual schema and applications from storage/indexing changes is the exact definition of **Physical Data Independence**.",
    ],
    examTipPrefix: "In university MCQs — any mention of ",
    examTipHighlight: "B+ trees, hash files, disk blocks, or compression",
    examTipSuffix: " always maps to Physical Data Independence.",
    groundedTopic: "Unit 1 · Self-Check Practice",
    groundedSection: "§1.2",
    groundedNode: "node 1.3",
    followUps: [
      "Give me another tougher question",
      "Show me a 2-mark answer version",
      "Where does this appear in PYQs?",
    ],
  },
  "where does this appear in pyqs?": {
    title: "Previous Year Questions (PYQ) Appearance & Weightage",
    paragraphs: [
      "**High-Frequency University PYQ Topic:** This concept appears in **Part-A (Short Answer, 2 Marks)** and **Part-B (Essay/Analytical, 5–7 Marks)** across almost every semester exam.",
      "**Typical PYQ Prompts:**\n1. *\"Differentiate between physical and logical data independence with suitable examples. Which one is more difficult to achieve?\"* *(2M / 5M)*\n2. *\"Explain the Three-Schema Architecture of a DBMS and illustrate how data independence is achieved at two levels.\"* *(7M)*",
    ],
    examTipPrefix: "In 7-mark Part-B questions — always draw the ",
    examTipHighlight: "External View ↔ Conceptual Schema ↔ Internal Schema 3-layer diagram",
    examTipSuffix: " and label both independence levels on the arrows between layers.",
    groundedTopic: "Unit 1 · University PYQ Bank",
    groundedSection: "§1.2",
    groundedNode: "node 1.2",
    followUps: [
      "Show me the 3-schema architecture diagram steps",
      "Show me a 2-mark answer version",
      "Quiz me on this",
    ],
  },
};

function parseBotResponseToStructured(
  question: string,
  rawAnswer: string,
  subjectId: string,
  chapterNumber: number,
  chapterName: string,
): StructuredBotAnswer {
  const unitPrefix = getUnitPrefix(subjectId);
  const cleanCh = (chapterName || "Course Material")
    .replace(/^(Chapter|Unit)\s*\d+\s*[:·\-–—]\s*/i, "")
    .trim();

  const lowerQ = question.toLowerCase().trim();
  if (CANONICAL_FOLLOWUP_ANSWERS[lowerQ]) {
    const preset = CANONICAL_FOLLOWUP_ANSWERS[lowerQ];
    return {
      ...preset,
      groundedTopic: preset.groundedTopic.replace(/^Unit \d+/, `${unitPrefix} ${chapterNumber}`),
    };
  }

  const lines = rawAnswer
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = question.replace(/\?+$/, "").trim();
  if (title.length > 68) {
    title = title.slice(0, 65).trim() + "…";
  }

  const bodyLines: string[] = [];
  let customTip = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && /^#{1,3}\s+/.test(line)) {
      title = line.replace(/^#{1,3}\s+/, "").replace(/\*+/g, "").trim();
      continue;
    }
    if (/^(exam\s*tip|tip|note)\s*[:·\-]/i.test(line)) {
      customTip = line.replace(/^(exam\s*tip|tip|note)\s*[:·\-]\s*/i, "").trim();
      continue;
    }
    bodyLines.push(line);
  }

  const paragraphs =
    bodyLines.length > 0
      ? bodyLines
      : [rawAnswer.trim() || `Here is a concise explanation from ${unitPrefix} ${chapterNumber}.`];

  return {
    title,
    paragraphs,
    examTipPrefix: customTip ? "" : "High-yield university exam point — always emphasize ",
    examTipHighlight: customTip
      ? customTip
      : "key definitions, contrasting properties, and a concrete syllabus example",
    examTipSuffix: customTip ? "" : " to secure full marks in 2-mark and 5-mark questions.",
    groundedTopic: `${unitPrefix} ${chapterNumber} · ${cleanCh}`,
    groundedSection: `§${chapterNumber}.1`,
    groundedNode: `node ${chapterNumber}.2`,
    followUps: [
      "Show me a 2-mark answer version",
      "Quiz me on this",
      "Where does this appear in PYQs?",
      `Give me a real-world example from ${unitPrefix} ${chapterNumber}`,
    ],
  };
}

export default function AskBotView({
  chapterName,
  subjectId,
  chapterNumber: _chapterNumber,
  difficulty: _difficulty,
  className: _className,
  subjectName,
  onNavigateTool,
  isCompactDrawer = false,
}: {
  chapterName: string;
  subjectId: string;
  chapterNumber: number;
  difficulty: DifficultyLevel;
  className: string;
  subjectName: string;
  onNavigateTool?: (tool: string) => void;
  isCompactDrawer?: boolean;
}) {
  const unitPrefix = getUnitPrefix(subjectId);
  const cleanChapterTitle = useMemo(
    () =>
      (chapterName || "")
        .replace(/^(Chapter|Unit)\s*\d+\s*[:·\-–—]\s*/i, "")
        .trim() || chapterName,
    [chapterName],
  );

  const seedExchange = useMemo(
    () => getSeedExchange(subjectId, _chapterNumber, chapterName),
    [subjectId, _chapterNumber, chapterName],
  );

  const chatStorageKey = useMemo(
    () => `ask_chat_v3_${subjectId}_${_chapterNumber}_${_difficulty}`,
    [subjectId, _chapterNumber, _difficulty],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = cloudStorage.getItem(chatStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(-20);
        }
      }
    } catch {
      // ignore storage parse error
    }
    return [];
  });

  // Load saved conversation or start empty when subject or chapter changes
  useEffect(() => {
    try {
      const raw = cloudStorage.getItem(chatStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-20));
          return;
        }
      }
    } catch {
      // ignore
    }
    setMessages([]);
  }, [chatStorageKey]);

  // Persist conversation
  useEffect(() => {
    if (messages.some((m) => m.loading)) return;
    try {
      if (messages.length === 0) {
        cloudStorage.removeItem(chatStorageKey);
      } else {
        cloudStorage.setItem(chatStorageKey, JSON.stringify(messages.slice(-20)));
      }
    } catch {
      // ignore
    }
  }, [messages, chatStorageKey]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<number, "up" | "down">>({});
  const [savedTakeawayMap, setSavedTakeawayMap] = useState<Record<number, boolean>>({});
  const [micError, setMicError] = useState<string | null>(null);
  const selectedLang = subjectId === "pubadm_ur" ? "ur-PK" : "en-IN";

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechSessionRef = useRef<SpeechSession | null>(null);
  const sessionStartingPromiseRef = useRef<Promise<SpeechSession> | null>(null);
  const isListeningRef = useRef(false);
  const askedViaMicRef = useRef(false);
  const pointerDownTimeRef = useRef<number>(0);
  const isHoldingMicRef = useRef<boolean>(false);
  const currentInputRef = useRef<string>("");

  // Stop TTS and mic on unmount
  useEffect(() => {
    return () => {
      googleTtsStop();
      if (speechSessionRef.current) {
        speechSessionRef.current.stop().catch(() => {});
        speechSessionRef.current = null;
      }
    };
  }, []);

  const cleanForSpeech = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[>*_~`#]/g, "")
      .trim();
  };

  const speakText = (text: string, msgIndex: number) => {
    const cleanText = cleanForSpeech(text);
    if (!cleanText) return;

    if (speakingIdx === msgIndex) {
      googleTtsStop();
      setSpeakingIdx(null);
      return;
    }

    googleTtsSpeak(
      cleanText,
      selectedLang,
      () => setSpeakingIdx(msgIndex),
      () => setSpeakingIdx(null),
    );
  };

  // Auto-speak answer if user asked via mic
  useEffect(() => {
    if (!askedViaMicRef.current) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "bot" && !lastMsg.loading && lastMsg.text) {
      askedViaMicRef.current = false;
      const idx = messages.length - 1;
      setTimeout(() => speakText(lastMsg.text, idx), 300);
    }
  }, [messages]);

  const startMic = async () => {
    if (isSending || isTranscribing || isListeningRef.current) return;
    googleTtsStop();
    setSpeakingIdx(null);
    setMicError(null);
    isListeningRef.current = true;
    setIsListening(true);
    currentInputRef.current = "";
    setInput("");

    try {
      const sessionPromise = startSpeechSession({
        language: selectedLang,
        onInterim: (text) => {
          currentInputRef.current = text;
          setInput(text);
        },
        onError: (err) => {
          console.warn("Speech recognition error:", err);
          if (err === "not-allowed" || err === "permission-denied") {
            setMicError("Microphone access denied. Please allow microphone permissions.");
          } else {
            setMicError(`Voice input error: ${err}`);
          }
          isListeningRef.current = false;
          setIsListening(false);
          setIsTranscribing(false);
          speechSessionRef.current = null;
          sessionStartingPromiseRef.current = null;
        },
        onEnd: () => {},
      });

      sessionStartingPromiseRef.current = sessionPromise;
      const session = await sessionPromise;
      sessionStartingPromiseRef.current = null;

      if (!isListeningRef.current) {
        await session.stop().catch(() => {});
        return;
      }
      speechSessionRef.current = session;
    } catch (err: any) {
      sessionStartingPromiseRef.current = null;
      isListeningRef.current = false;
      setIsListening(false);
      setIsTranscribing(false);
      setMicError(err?.message || "Could not start microphone.");
    }
  };

  const stopMic = async (autoSend = true) => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;
    setIsListening(false);

    let session = speechSessionRef.current;
    speechSessionRef.current = null;

    if (!session && sessionStartingPromiseRef.current) {
      try {
        session = await sessionStartingPromiseRef.current;
      } catch {
        return;
      }
    }
    if (!session) return;

    if (!hasWebSpeechSupport()) {
      setIsTranscribing(true);
    }

    try {
      const finalTranscript = await session.stop();
      setIsTranscribing(false);
      const finalQuestion = (finalTranscript || currentInputRef.current).trim();
      if (finalQuestion) {
        setInput(finalQuestion);
        if (autoSend) {
          askedViaMicRef.current = true;
          handleSend(finalQuestion);
        }
      }
    } catch {
      setIsTranscribing(false);
    }
  };

  const handleMicPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isSending || isTranscribing) return;
    e.preventDefault();
    if (isListeningRef.current) {
      isHoldingMicRef.current = false;
      stopMic(true);
      return;
    }
    pointerDownTimeRef.current = Date.now();
    isHoldingMicRef.current = true;
    startMic();
  };

  const handleMicPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isSending || isTranscribing) return;
    e.preventDefault();
    if (isHoldingMicRef.current) {
      isHoldingMicRef.current = false;
      const elapsed = Date.now() - pointerDownTimeRef.current;
      if (elapsed > 450) {
        stopMic(true);
      }
    }
  };

  const handleMicPointerLeave = () => {
    if (isHoldingMicRef.current) {
      isHoldingMicRef.current = false;
      const elapsed = Date.now() - pointerDownTimeRef.current;
      if (elapsed > 450) {
        stopMic(true);
      }
    }
  };

  const handleSend = async (questionText: string) => {
    const textToSend = questionText.trim();
    if (!textToSend || isSending) return;

    if (isListening && speechSessionRef.current) {
      speechSessionRef.current.stop().catch(() => {});
      speechSessionRef.current = null;
      setIsListening(false);
    }

    setIsSending(true);
    setInput("");

    // Build contextual prompt if user clicked a follow-up pill (e.g. "Show me a 2-mark answer version", "Quiz me on this")
    const lastBotMsg = [...messages].reverse().find((m) => m.role === "bot" && m.text);
    const isFollowUpPill =
      /^(show me a \d+-mark|quiz me|where does this appear in pyq|give me a \d+-mark|give me another)/i.test(
        textToSend.trim(),
      );
    const promptForAi =
      isFollowUpPill && lastBotMsg?.structured?.title
        ? `${textToSend} (regarding "${lastBotMsg.structured.title}" in ${unitPrefix} ${_chapterNumber}: ${cleanChapterTitle})`
        : textToSend;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: textToSend },
      { role: "bot", text: "", loading: true },
    ]);

    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 60);

    try {
      const result = await askGemini(
        promptForAi,
        subjectId,
        chapterName,
        _chapterNumber,
        _difficulty,
        selectedLang,
        _className,
      );
      const structured = parseBotResponseToStructured(
        textToSend,
        result.answer,
        subjectId,
        _chapterNumber,
        chapterName,
      );
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: result.answer,
          structured,
        };
        return updated;
      });
    } catch {
      const lowerQ = textToSend.toLowerCase().trim();
      const isSeedMatch = lowerQ === seedExchange.question.toLowerCase().trim();
      if (isSeedMatch) {
        const structured: StructuredBotAnswer = {
          ...seedExchange.structured,
          groundedTopic: seedExchange.structured.groundedTopic.replace(
            /^Unit \d+/,
            `${unitPrefix} ${_chapterNumber}`,
          ),
        };
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: seedExchange.answerText,
            structured,
          };
          return updated;
        });
      } else {
        const fallbackText = `**${textToSend.replace(/\?+$/, "")}** is a core concept in **${unitPrefix} ${_chapterNumber} (${cleanChapterTitle})**.\n\nIt connects the foundational definitions in your course syllabus with practical application scenarios. Review the key structural properties and standard examples in the In-depth Read notes for complete exam coverage.`;
        const structured = parseBotResponseToStructured(
          textToSend,
          fallbackText,
          subjectId,
          _chapterNumber,
          chapterName,
        );
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: fallbackText,
            structured,
          };
          return updated;
        });
      }
    } finally {
      setIsSending(false);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  };

  const handleResetToSeed = () => {
    googleTtsStop();
    setSpeakingIdx(null);
    setMessages([]);
    cloudStorage.removeItem(chatStorageKey);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div
      className="saral-ask-v2-root"
      role="region"
      aria-label="Saral 24/7 Learning Assistant"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: 'radial-gradient(ellipse at 50% 0%, #EFF3EC 0%, #E6ECE3 55%, #F2EFE6 100%)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        .saral-ask-v2-md p { margin: 0 !important; line-height: 1.62 !important; color: #2C3530 !important; font-size: 13.8px !important; }
        .saral-ask-v2-md strong { color: #1E2822 !important; font-weight: 700 !important; }
        .saral-ask-v2-md ul, .saral-ask-v2-md ol { margin: 6px 0 0 18px !important; padding: 0 !important; }
        .saral-ask-v2-md li { margin: 3px 0 !important; }
      `}</style>
      {/* ── Top Sub-Header Bar (Breadcrumb + Grounded Badge) ── */}
      {!isCompactDrawer && (
        <div
          style={{
            height: "50px",
            padding: "0 24px",
            background: "#FAF8F3",
            borderBottom: "1px solid #EAE4D7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            gap: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "13.5px",
              color: "#7A827C",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span style={{ color: "#1E2822", fontWeight: 700 }}>Ask me</span>
            <span style={{ margin: "0 9px", color: "#B4B8B2" }}>›</span>
            <span>{subjectName}</span>
            <span style={{ margin: "0 9px", color: "#B4B8B2" }}>›</span>
            <span>
              {unitPrefix} {_chapterNumber} · {cleanChapterTitle}
            </span>
          </div>

          {/* Grounded in your university course material pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 14px",
              borderRadius: "999px",
              background: "#FBF4EE",
              border: "1px solid #EBD5C3",
              color: "#4A453E",
              fontSize: "12.5px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "13px", lineHeight: 1 }}>📕</span>
            <span>Grounded in your university course material</span>
          </div>
        </div>
      )}

      {/* ── Main Scrollable Conversation Area ── */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isCompactDrawer ? "16px 14px" : "26px 24px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "790px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                width: "100%",
                marginTop: isCompactDrawer ? "8px" : "24px",
              }}
            >
              {/* Welcome Card matching Editorial Botanical + Terracotta Palette */}
              <div
                style={{
                  width: "100%",
                  background: "#FFFFFF",
                  border: "1px solid #E8E2D7",
                  borderLeft: '4px solid #D9A382',
                  borderRadius: "16px",
                  padding: isCompactDrawer ? "20px 18px" : "26px 30px",
                  boxShadow: "0 6px 24px rgba(30, 40, 34, 0.05)",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: "#E8F0EB",
                    color: "#365343",
                    fontSize: "10.5px",
                    fontWeight: 800,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>SARAL · 24/7 LEARNING ASSISTANT</span>
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontFamily: "'Fraunces', 'Georgia', serif",
                    fontSize: isCompactDrawer ? "18px" : "22px",
                    fontWeight: 600,
                    color: "#1E2822",
                    lineHeight: 1.28,
                    letterSpacing: "-0.01em",
                  }}
                >
                  What would you like to explore in {unitPrefix} {_chapterNumber} ·{" "}
                  {cleanChapterTitle}?
                </h2>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    color: "#4A544E",
                  }}
                >
                  Every answer is grounded in your university syllabus material —
                  complete with <strong style={{ color: "#BD7D52" }}>Exam Tips</strong>,{" "}
                  <strong style={{ color: "#1E2822" }}>In-depth Read § citations</strong>,
                  and direct <strong style={{ color: "#1E2822" }}>Mindmap node links</strong>.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#7A827C",
                      fontWeight: 600,
                    }}
                  >
                    Connected to ·
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "#F6F4EE",
                      border: "1px solid #E5DFD3",
                      fontSize: "12px",
                      color: "#1E2822",
                      fontWeight: 600,
                    }}
                  >
                    {unitPrefix} {_chapterNumber} Syllabus Notes
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "#F6F4EE",
                      border: "1px solid #E5DFD3",
                      fontSize: "12px",
                      color: "#1E2822",
                      fontWeight: 600,
                    }}
                  >
                    In-depth Read &amp; Mindmaps
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "999px",
                      background: "#FBF4EE",
                      border: "1px solid #EBD5C3",
                      fontSize: "12px",
                      color: "#B86B35",
                      fontWeight: 700,
                    }}
                  >
                    University PYQ Patterns
                  </span>
                </div>
              </div>

              {/* Starter Prompt Pills */}
              <div>
                <div
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "#6E7771",
                    textTransform: "uppercase",
                    marginBottom: "10px",
                  }}
                >
                  SUGGESTED QUESTIONS FOR {unitPrefix.toUpperCase()} {_chapterNumber}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {[
                    seedExchange.question,
                    ...seedExchange.structured.followUps,
                  ].map((qText, qIdx) => (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => handleSend(qText)}
                      disabled={isSending}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "999px",
                        background: "#FFFFFF",
                        border: "1px solid #E5CFC0",
                        color: "#1E2822",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        cursor: isSending ? "default" : "pointer",
                        boxShadow: "0 1px 4px rgba(30, 40, 34, 0.03)",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSending) {
                          e.currentTarget.style.background = "#FBF5EE";
                          e.currentTarget.style.borderColor = "#BD7D52";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FFFFFF";
                        e.currentTarget.style.borderColor = "#E5CFC0";
                      }}
                    >
                      {qText}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {messages.map((m, idx) => {
            if (m.role === "user") {
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: "flex-end",
                    maxWidth: "85%",
                    background: "#FFFFFF",
                    border: "1px solid #E6D2C3",
                    borderRadius: "18px 18px 4px 18px",
                    padding: "12px 22px",
                    color: "#1E2822",
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: 1.4,
                    boxShadow: "0 2px 8px rgba(30, 40, 34, 0.04)",
                  }}
                >
                  {m.text}
                </div>
              );
            }

            if (m.loading) {
              return (
                <div
                  key={idx}
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    border: "1px solid #E8E2D7",
                    borderLeft: '4px solid #D9A382',
                    borderRadius: "16px",
                    padding: "22px 26px",
                    boxShadow: "0 6px 24px rgba(30, 40, 34, 0.05)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12.5px",
                      marginBottom: "10px",
                    }}
                  >
                    <strong style={{ color: "#1E2822" }}>Saral</strong>
                    <span style={{ color: "#BD7D52", fontWeight: 600 }}>
                      {" "}
                      · 24/7 Learning Assistant — checking your {unitPrefix}{" "}
                      {_chapterNumber} material…
                    </span>
                  </div>
                  <div className="saral-loading-bubble" aria-label="Thinking">
                    <div className="saral-loading-dot"></div>
                    <div className="saral-loading-dot"></div>
                    <div className="saral-loading-dot"></div>
                  </div>
                </div>
              );
            }

            const st =
              m.structured ||
              parseBotResponseToStructured(
                messages[idx - 1]?.text || seedExchange.question,
                m.text,
                subjectId,
                _chapterNumber,
                chapterName,
              );
            const isLastBot = idx === messages.length - 1;
            const fb = feedbackMap[idx];
            const isSaved = Boolean(savedTakeawayMap[idx]);

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                {/* ── Saral Grounded Answer Card ── */}
                <div
                  style={{
                    width: "100%",
                    background: "#FFFFFF",
                    border: "1px solid #E8E2D7",
                    borderLeft: '4px solid #D9A382',
                    borderRadius: "16px",
                    padding: isCompactDrawer ? "18px 18px" : "24px 28px 22px",
                    boxShadow: "0 6px 24px rgba(30, 40, 34, 0.05)",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header attribution */}
                  <div
                    style={{
                      fontSize: "12.5px",
                      lineHeight: 1.4,
                      marginBottom: "6px",
                    }}
                  >
                    <strong style={{ color: "#1E2822", fontWeight: 800 }}>
                      Saral
                    </strong>
                    <span style={{ color: "#BD7D52", fontWeight: 600 }}>
                      {" "}
                      · 24/7 Learning Assistant — answered from your {unitPrefix}{" "}
                      {_chapterNumber} material
                    </span>
                  </div>

                  {/* Answer Heading */}
                  <h2
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: isCompactDrawer ? "16.5px" : "18.5px",
                      fontWeight: 800,
                      color: "#1E2822",
                      lineHeight: 1.3,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {st.title}
                  </h2>

                  {/* Answer Body Paragraphs */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "13.8px",
                      lineHeight: 1.62,
                      color: "#2C3530",
                    }}
                  >
                    {st.paragraphs.map((p, pIdx) => (
                      <div key={pIdx} className="saral-ask-v2-md">
                        <MarkdownView content={p} isPurpleTheme={false} />
                      </div>
                    ))}
                  </div>

                  {/* EXAM TIP Callout Box */}
                  <div
                    style={{
                      marginTop: "14px",
                      marginBottom: "16px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "#FDF7F0",
                      border: "1px solid #F0D9C2",
                      fontSize: "13px",
                      lineHeight: 1.55,
                      color: "#3A322B",
                    }}
                  >
                    <span
                      style={{
                        color: "#C27A38",
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                      }}
                    >
                      EXAM TIP ·{" "}
                    </span>
                    {st.examTipPrefix && <span>{st.examTipPrefix}</span>}
                    {st.examTipHighlight && (
                      <strong style={{ color: "#B86B35", fontWeight: 700 }}>
                        {st.examTipHighlight}
                      </strong>
                    )}
                    {st.examTipSuffix && <span>{st.examTipSuffix}</span>}
                  </div>

                  {/* Grounded in · chips + Thumbs Up / Down */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7A827C",
                          fontWeight: 600,
                        }}
                      >
                        Grounded in ·
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          background: "#F6F4EE",
                          border: "1px solid #E5DFD3",
                          fontSize: "12px",
                          color: "#4A544E",
                        }}
                      >
                        {st.groundedTopic.includes("·") ? (
                          <>
                            <span>
                              {st.groundedTopic.split("·")[0].trim()} ·{" "}
                            </span>
                            <strong
                              style={{
                                color: "#1E2822",
                                fontWeight: 700,
                                marginLeft: "3px",
                              }}
                            >
                              {st.groundedTopic
                                .split("·")
                                .slice(1)
                                .join("·")
                                .trim()}
                            </strong>
                          </>
                        ) : (
                          <strong style={{ color: "#1E2822", fontWeight: 700 }}>
                            {st.groundedTopic}
                          </strong>
                        )}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          background: "#F6F4EE",
                          border: "1px solid #E5DFD3",
                          fontSize: "12px",
                          color: "#4A544E",
                        }}
                      >
                        <span>In-depth Read · </span>
                        <strong
                          style={{
                            color: "#1E2822",
                            fontWeight: 700,
                            marginLeft: "3px",
                          }}
                        >
                          {st.groundedSection}
                        </strong>
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          background: "#F6F4EE",
                          border: "1px solid #E5DFD3",
                          fontSize: "12px",
                          color: "#4A544E",
                        }}
                      >
                        <span>Mindmap · </span>
                        <strong
                          style={{
                            color: "#1E2822",
                            fontWeight: 700,
                            marginLeft: "3px",
                          }}
                        >
                          {st.groundedNode}
                        </strong>
                      </span>
                    </div>

                    {/* Thumbs Up / Down */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMap((prev) => ({
                            ...prev,
                            [idx]: prev[idx] === "up" ? undefined! : "up",
                          }))
                        }
                        title="Helpful answer"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "7px",
                          border:
                            fb === "up"
                              ? "1px solid #BD7D52"
                              : "1px solid #EAE2D6",
                          background: fb === "up" ? "#FBF4EE" : "#FAF8F3",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "13px",
                          padding: 0,
                        }}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackMap((prev) => ({
                            ...prev,
                            [idx]: prev[idx] === "down" ? undefined! : "down",
                          }))
                        }
                        title="Needs improvement"
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "7px",
                          border:
                            fb === "down"
                              ? "1px solid #BD7D52"
                              : "1px solid #EAE2D6",
                          background: fb === "down" ? "#FBF4EE" : "#FAF8F3",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "13px",
                          padding: 0,
                        }}
                      >
                        👎
                      </button>
                    </div>
                  </div>

                  {/* 4-Column Action Bar: Open in Read | View in Mindmap | Save to Key Takeaways | Listen to this */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isCompactDrawer
                        ? "repeat(2, 1fr)"
                        : "repeat(4, 1fr)",
                      gap: "10px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onNavigateTool?.("detailed")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "999px",
                        background: "#FAF7F2",
                        border: "1px solid #E5D5C5",
                        color: "#2C3530",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F3ECE2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FAF7F2";
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>📖</span>
                      <span>Open in Read</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigateTool?.("mindmap")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "999px",
                        background: "#FAF7F2",
                        border: "1px solid #E5D5C5",
                        color: "#2C3530",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#F3ECE2";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#FAF7F2";
                      }}
                    >
                      <span style={{ fontSize: "13px", color: "#5A7D68" }}>✺</span>
                      <span>View in Mindmap</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const nextSaved = !savedTakeawayMap[idx];
                        setSavedTakeawayMap((prev) => ({
                          ...prev,
                          [idx]: nextSaved,
                        }));
                        try {
                          const savedKey = `sv_kt_saved_from_ask_${subjectId}_ch${_chapterNumber}`;
                          const existingRaw = cloudStorage.getItem(savedKey);
                          const existing: Array<{ id: string; lead: string; body: string }> =
                            existingRaw ? JSON.parse(existingRaw) : [];
                          const itemId = `ask-saved-${idx}-${st.title.slice(0, 24).replace(/\W+/g, "_")}`;
                          if (nextSaved) {
                            const updated = [
                              ...existing.filter((x) => x.id !== itemId),
                              {
                                id: itemId,
                                lead: st.title,
                                body: st.paragraphs.join(" "),
                              },
                            ];
                            cloudStorage.setItem(savedKey, JSON.stringify(updated));
                          } else {
                            cloudStorage.setItem(
                              savedKey,
                              JSON.stringify(existing.filter((x) => x.id !== itemId)),
                            );
                          }
                        } catch {
                          // ignore storage error
                        }
                      }}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "999px",
                        background: isSaved ? "#EEF5F0" : "#FAF7F2",
                        border: isSaved
                          ? "1px solid #86B398"
                          : "1px solid #E5D5C5",
                        color: isSaved ? "#284B37" : "#2C3530",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>
                        {isSaved ? "✓" : "🔑"}
                      </span>
                      <span>
                        {isSaved ? "Saved to Takeaways" : "Save to Key Takeaways"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => speakText(m.text, idx)}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "999px",
                        background:
                          speakingIdx === idx ? "#FBF4EE" : "#FAF7F2",
                        border:
                          speakingIdx === idx
                            ? "1px solid #BD7D52"
                            : "1px solid #E5D5C5",
                        color: speakingIdx === idx ? "#BD7D52" : "#2C3530",
                        fontSize: "12.5px",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "13px" }}>
                        {speakingIdx === idx ? "⏹" : "🎧"}
                      </span>
                      <span>
                        {speakingIdx === idx ? "Stop listening" : "Listen to this"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ── Suggested Follow-Ups (shown below the latest bot card) ── */}
                {isLastBot && st.followUps && st.followUps.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#6E7771",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                      }}
                    >
                      SUGGESTED FOLLOW-UPS
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      {st.followUps.map((fText, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => handleSend(fText)}
                          disabled={isSending}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "999px",
                            background: "#FFFFFF",
                            border: "1px solid #E5CFC0",
                            color: "#1E2822",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            cursor: isSending ? "default" : "pointer",
                            boxShadow: "0 1px 4px rgba(30, 40, 34, 0.03)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSending) {
                              e.currentTarget.style.background = "#FBF5EE";
                              e.currentTarget.style.borderColor = "#BD7D52";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#FFFFFF";
                            e.currentTarget.style.borderColor = "#E5CFC0";
                          }}
                        >
                          {fText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Bottom Floating Input Bar ── */}
      <div
        style={{
          padding: isCompactDrawer ? "10px 12px 14px" : "10px 28px 18px",
          flexShrink: 0,
        }}
      >
        {micError && (
          <div
            style={{
              maxWidth: "1100px",
              margin: "0 auto 8px",
              padding: "8px 14px",
              background: "#FEF2F2",
              border: "1px solid #F87171",
              borderRadius: "10px",
              color: "#991B1B",
              fontSize: "12.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>⚠️ {micError}</span>
            <button
              type="button"
              onClick={() => setMicError(null)}
              style={{
                background: "none",
                border: "none",
                color: "#991B1B",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            background: "#FFFFFF",
            border: "1px solid #E4DEC3",
            borderRadius: "999px",
            padding: "6px 8px 6px 8px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 4px 18px rgba(30, 40, 34, 0.06)",
          }}
        >
          {/* Left '+' New Question / Reset Button */}
          <button
            type="button"
            onClick={handleResetToSeed}
            title="Start a new question"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: '#D9A382',
              color: '#18221D',
              border: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "19px",
              fontWeight: 500,
              cursor: "pointer",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            +
          </button>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            disabled={isSending}
            placeholder={
              isTranscribing
                ? "Transcribing your voice…"
                : isListening
                ? "Listening… speak now (click ⏹ to stop & send)"
                : `Ask Saral anything about ${unitPrefix} ${_chapterNumber}...`
            }
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#1E2822",
              minWidth: 0,
            }}
          />

          {/* Right Mic + Send Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <button
              type="button"
              onPointerDown={handleMicPointerDown}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={handleMicPointerLeave}
              disabled={isSending || isTranscribing}
              title={isListening ? "Stop listening & send" : "Voice input"}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: isListening ? "#DC2626" : "#F4F1EA",
                color: isListening ? "#FFFFFF" : "#3A443E",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {isListening ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="4" width="16" height="16" rx="3" ry="3" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSend(input)}
              disabled={isSending || !input.trim()}
              title="Send question"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: '#D9A382',
                color: '#18221D',
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSending || !input.trim() ? "default" : "pointer",
                opacity: isSending || !input.trim() ? 0.82 : 1,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
