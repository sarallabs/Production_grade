import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MarkdownView from "@/components/MarkdownView";
import {
  DifficultyLevel,
  getMockTest,
  getChapterExamQuestions,
  getResourceContent,
  type Chapter,
} from "@/data/contentRepository";
import { parseQuestionBankMarkdown } from "@/utils/questionBankParser";
import { isChapterComplete } from "@/utils/guidedFlow";
import {
  MANAGEMENT_MOCKED_QUESTIONS,
  ANU_PHYSICS_MOCKED_QUESTIONS,
  ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
} from "@/pages/PreviousYearQuestions";

export interface MockQuestion {
  id: string;
  text: string;
  options?: string[];
  correctAnswers?: number[];
  type?: "mcq" | "msq" | "short_answer" | "long_answer" | "descriptive";
  explanation?: string;
  shortAnswer?: string;
  longAnswer?: string;
  marks: number;
  section?: string;
  sectionName?: string;
  bloomLevel?: string;
  mindmapPath?: string;
  modelAnswer?: string;
  rubric?: { marks: string; desc: string }[];
  keywords?: string[];
  hasAsciiDiagram?: boolean;
  chapter?: string;
  year?: number;
  unitNumber?: number;
}

// TEMPORARY HARDCODED QUESTIONS - WILL NOT BE SHOWN WHEN CONNECTED TO API / DATASTORE QUESTIONS
export function getTemporaryHardcodedQuestions(subjectId: string, unitNumbers: number[], chapterName: string): MockQuestion[] {
  const normSubject = (subjectId || "").toLowerCase();
  const isPhysics = normSubject.includes("physics") || normSubject.includes("characterization");
  const isManagement = normSubject.includes("management");

  const questionsPerUnit = Math.floor(50 / unitNumbers.length);
  const remainder = 50 % unitNumbers.length;

  const result: MockQuestion[] = [];
  let qCount = 1;

  unitNumbers.forEach((unitNum, unitIdx) => {
    const targetCount = questionsPerUnit + (unitIdx < remainder ? 1 : 0);

    const managementUnitTemplates = {
      1: [
        {
          text: "Which of the following are recognized bases for market segmentation?",
          options: ["Demographic factors", "Psychographic profiling", "Geographic variables", "Behavioral characteristics"],
          correctAnswers: [0, 1, 2, 3],
          type: "msq" as const,
          explanation: "Market segmentation bases include demographic, psychographic, geographic, and behavioral variables.",
          marks: 1
        },
        {
          text: "What is the primary focus of the 'marketing concept' as opposed to the 'selling concept'?",
          options: ["Product performance and quality", "Customer needs and value creation", "Aggressive promotion and advertising", "Maximizing production efficiency"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "The marketing concept focuses on satisfying customer needs to achieve profits, whereas the selling concept focuses on existing products and heavy promotion.",
          marks: 1
        },
        {
          text: "Which concepts emphasize societal well-being alongside consumer satisfaction and company profits?",
          options: ["The Production Concept", "The Societal Marketing Concept", "The Product Concept", "The Holistic Marketing Concept"],
          correctAnswers: [1, 3],
          type: "msq" as const,
          explanation: "The Societal Marketing Concept and Holistic Marketing Concept emphasize balancing company profits, consumer wants, and long-term societal interests.",
          marks: 1
        }
      ],
      2: [
        {
          text: "Which of the following constitute the traditional 4Ps of the marketing mix?",
          options: ["Product", "Price", "People", "Place"],
          correctAnswers: [0, 1, 3],
          type: "msq" as const,
          explanation: "The traditional 4Ps are Product, Price, Place, and Promotion. 'People' is one of the extended 3Ps for services.",
          marks: 1
        },
        {
          text: "What is the main purpose of the 'Promotion' element in the marketing mix?",
          options: ["Determining the retail value", "Selecting distribution intermediaries", "Communicating value to the target audience", "Designing physical product features"],
          correctAnswers: [2],
          type: "mcq" as const,
          explanation: "Promotion is focused on communicating the brand message and value proposition through advertising, PR, and sales.",
          marks: 1
        },
        {
          text: "Which of the following are additional elements in the extended 7Ps marketing mix for services?",
          options: ["People", "Process", "Physical Evidence", "Packaging"],
          correctAnswers: [0, 1, 2],
          type: "msq" as const,
          explanation: "The 3 extra Ps for services are People, Process, and Physical Evidence. Packaging is sub-classified under Product.",
          marks: 1
        }
      ],
      3: [
        {
          text: "What is the first step in the consumer decision-making process?",
          options: ["Information search", "Evaluation of alternatives", "Problem or Need recognition", "Purchase decision"],
          correctAnswers: [2],
          type: "mcq" as const,
          explanation: "The process begins when a consumer recognizes a gap between their actual state and a desired state.",
          marks: 1
        },
        {
          text: "Which factors are classified as social influences on consumer behavior?",
          options: ["Reference groups", "Family status", "Perception and memory", "Social roles and status"],
          correctAnswers: [0, 1, 3],
          type: "msq" as const,
          explanation: "Reference groups, family, roles, and status are social factors. Perception and memory are psychological factors.",
          marks: 1
        },
        {
          text: "Product positioning refers to which of the following?",
          options: ["The physical shelf placement in retail stores", "The relative market share of the brand", "Creating a distinct image of the brand in the consumer's mind", "Expanding the product line to new segments"],
          correctAnswers: [2],
          type: "mcq" as const,
          explanation: "Positioning is the act of designing the company's offering so that it occupies a distinctive place in the mind of the target market.",
          marks: 1
        }
      ],
      4: [
        {
          text: "Identify the correct sequence of stages in the Product Life Cycle (PLC).",
          options: ["Introduction -> Growth -> Decline -> Maturity", "Introduction -> Maturity -> Growth -> Decline", "Introduction -> Growth -> Maturity -> Decline", "Growth -> Introduction -> Maturity -> Decline"],
          correctAnswers: [2],
          type: "mcq" as const,
          explanation: "The PLC sequence is Introduction, Growth, Maturity, and Decline.",
          marks: 1
        },
        {
          text: "In which stage of the PLC do sales growth rate peak and competitors begin to enter in large numbers?",
          options: ["Introduction", "Growth", "Maturity", "Decline"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Sales growth accelerates rapidly and competitor entry is highest during the Growth stage.",
          marks: 1
        },
        {
          text: "Which of the following are components of Brand Equity?",
          options: ["Brand Awareness", "Brand Association", "Brand Loyalty", "Perceived Quality"],
          correctAnswers: [0, 1, 2, 3],
          type: "msq" as const,
          explanation: "According to Aaker's model, brand equity assets include brand loyalty, brand awareness, perceived quality, and brand associations.",
          marks: 1
        }
      ],
      5: [
        {
          text: "Which unique service characteristic means that services cannot be saved, stored, or resold?",
          options: ["Intangibility", "Inseparability", "Variability", "Perishability"],
          correctAnswers: [3],
          type: "mcq" as const,
          explanation: "Perishability means services cannot be stored for future use, creating capacity management challenges.",
          marks: 1
        },
        {
          text: "Which of the following are digital marketing channels?",
          options: ["Search Engine Optimization (SEO)", "Pay-Per-Click Advertising (PPC)", "Content Marketing", "Television Commercials"],
          correctAnswers: [0, 1, 2],
          type: "msq" as const,
          explanation: "SEO, PPC, and Content Marketing are digital channels. TV is a traditional broadcast channel.",
          marks: 1
        },
        {
          text: "What does inseparability in service marketing imply?",
          options: ["The service provider is separate from the customer", "Production and consumption occur simultaneously", "Services are highly standardized and uniform", "Services are physical objects that can be touched"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Inseparability means that services are typically produced and consumed at the same time and cannot be separated from the provider.",
          marks: 1
        }
      ]
    };

    const physicsUnitTemplates = {
      1: [
        {
          text: "According to Einstein's photoelectric equation, what is the effect of increasing the frequency of incident light above the threshold frequency?",
          options: ["Increases the number of emitted photoelectrons", "Increases the maximum kinetic energy of emitted photoelectrons", "Decreases the stopping potential", "Emits no electrons"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Kinetic energy (K_max = hf - Φ) depends linearly on frequency f. Intensity determines the number of emitted photoelectrons.",
          marks: 1
        },
        {
          text: "Which of the following particles exhibit wave-particle duality?",
          options: ["Electrons", "Photons", "Neutrons", "Macroscopic tennis balls"],
          correctAnswers: [0, 1, 2, 3],
          type: "msq" as const,
          explanation: "All moving matter has an associated de Broglie wave, although the wavelength is negligibly small for macroscopic objects like tennis balls.",
          marks: 1
        },
        {
          text: "What is the de Broglie wavelength formula for a particle of momentum p?",
          options: ["λ = hp", "λ = h/p", "λ = p/h", "λ = ħ/p"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "The de Broglie wavelength is λ = h/p, where h is Planck's constant.",
          marks: 1
        }
      ],
      2: [
        {
          text: "Heisenberg's Uncertainty Principle states that one cannot measure position and momentum simultaneously with absolute precision. What is the mathematical formulation of this limit?",
          options: ["Δx Δp ≥ h/2", "Δx Δp ≥ ħ/2", "Δx Δp ≤ ħ/2", "Δx Δp = 0"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "The uncertainty principle states that Δx Δp ≥ ħ/2, where ħ = h / 2π.",
          marks: 1
        },
        {
          text: "Uncertainty relations exist between which pairs of conjugate variables in quantum mechanics?",
          options: ["Position and Momentum", "Energy and Time", "Angular Position and Angular Momentum", "Mass and Velocity"],
          correctAnswers: [0, 1, 2],
          type: "msq" as const,
          explanation: "Position-momentum, energy-time, and angular position-angular momentum are canonically conjugate pairs with uncertainty relations.",
          marks: 1
        },
        {
          text: "What is the physical cause of zero-point energy in a potential well?",
          options: ["Thermal fluctuations", "Heisenberg's Uncertainty Principle", "Electrostatic repulsion", "Gravitational decay"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Confinement of a particle (small Δx) implies a minimum momentum uncertainty Δp, which corresponds to a non-zero minimum kinetic energy.",
          marks: 1
        }
      ],
      3: [
        {
          text: "Which of the following are requirements for a wave function ψ(x) to be physically acceptable?",
          options: ["ψ(x) must be continuous", "dψ/dx must be continuous (except at infinite potentials)", "ψ(x) must be single-valued", "ψ(x) must be normalizable"],
          correctAnswers: [0, 1, 2, 3],
          type: "msq" as const,
          explanation: "A wave function must be continuous, single-valued, square-integrable (normalizable), and have continuous first derivatives.",
          marks: 1
        },
        {
          text: "For a particle in an infinite 1D potential well of width L, the energy levels E_n are proportional to:",
          options: ["n", "n²", "1/n", "1/n²"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "The energy eigenvalues are E_n = (n² π² ħ²) / (2m L²), which is proportional to n².",
          marks: 1
        },
        {
          text: "What is the probability of finding a particle in the state ψ(x) between x and x + dx?",
          options: ["ψ(x) dx", "|ψ(x)| dx", "|ψ(x)|² dx", "dψ/dx dx"],
          correctAnswers: [2],
          type: "mcq" as const,
          explanation: "Born's rule states that the probability density is |ψ(x)|², so probability is |ψ(x)|² dx.",
          marks: 1
        }
      ],
      4: [
        {
          text: "What is the ground state energy of a 1D quantum harmonic oscillator of frequency ω?",
          options: ["0", "½ ħω", "ħω", "1.5 ħω"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "The energy eigenvalues are E_n = (n + ½)ħω. For n=0, E_0 = ½ ħω.",
          marks: 1
        },
        {
          text: "Quantum tunneling allows particles to cross a potential barrier even when E < V. Which parameters increase the tunneling probability?",
          options: ["Decreasing barrier height V", "Decreasing barrier width", "Decreasing particle mass m", "Increasing barrier width"],
          correctAnswers: [0, 1, 2],
          type: "msq" as const,
          explanation: "Tunneling transmission coefficient decays exponentially with barrier width, barrier height, and particle mass.",
          marks: 1
        },
        {
          text: "In quantum harmonic oscillator, which states have wave functions with an even parity?",
          options: ["n = 0", "n = 1", "n = 2", "n = 3"],
          correctAnswers: [0, 2],
          type: "msq" as const,
          explanation: "States with even index n (n=0, 2, 4...) have even parity wave functions, and odd n have odd parity.",
          marks: 1
        }
      ],
      5: [
        {
          text: "Which quantum numbers arise when solving the Schrödinger equation for the Hydrogen atom?",
          options: ["Principal quantum number (n)", "Orbital angular momentum (l)", "Magnetic quantum number (m_l)", "Spin quantum number (s)"],
          correctAnswers: [0, 1, 2],
          type: "msq" as const,
          explanation: "n, l, and m_l emerge from the spatial Schrödinger equation. Spin (s) is a relativistic property added later (Dirac equation).",
          marks: 1
        },
        {
          text: "What is the degeneracy of the n-th energy level of the Hydrogen atom (ignoring spin)?",
          options: ["2n", "n²", "2n²", "n - 1"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Degeneracy is n² (including spin it would be 2n²).",
          marks: 1
        },
        {
          text: "What is Bragg's condition for constructive interference of X-rays diffracted by a crystal lattice?",
          options: ["d sin θ = nλ", "2d sin θ = nλ", "2d cos θ = nλ", "d = nλ"],
          correctAnswers: [1],
          type: "mcq" as const,
          explanation: "Bragg's Law is 2d sin θ = nλ, where d is interplanar distance and θ is the angle of incidence.",
          marks: 1
        }
      ]
    };

    const templates = isManagement
      ? (managementUnitTemplates[unitNum as keyof typeof managementUnitTemplates] || managementUnitTemplates[1])
      : isPhysics
        ? (physicsUnitTemplates[unitNum as keyof typeof physicsUnitTemplates] || physicsUnitTemplates[1])
        : [
          {
            text: `Which of the following is a primary model studied in Unit ${unitNum}?`,
            options: ["Linear optimization", "Static equilibrium", "Dynamic feedback loop", "Decentralized control"],
            correctAnswers: [0, 2],
            type: "msq" as const,
            explanation: `Unit ${unitNum} covers basic concepts including linear optimization and feedback loops.`,
            marks: 1
          },
          {
            text: `What is the core objective of the theories presented in Unit ${unitNum}?`,
            options: ["To maximize throughput", "To simplify system complexity", "To explain empirical observations", "To eliminate risk completely"],
            correctAnswers: [2],
            type: "mcq" as const,
            explanation: `The theoretical models in Unit ${unitNum} are developed to explain observed behavior in standard test conditions.`,
            marks: 1
          }
        ];

    for (let i = 0; i < targetCount; i++) {
      const template = templates[i % templates.length];
      const currentQNum = qCount++;
      const qText = targetCount > templates.length
        ? `${template.text} (Set ${Math.floor(i / templates.length) + 1})`
        : template.text;

      result.push({
        id: `temp-${unitNum}-${i}`,
        text: qText,
        options: template.options,
        correctAnswers: template.correctAnswers,
        type: template.type,
        explanation: template.explanation,
        marks: template.marks,
        section: `Unit ${unitNum} · ${template.type === "mcq" ? "MCQ" : "MSQ"}`,
        chapter: `Unit ${unitNum} Content`,
        unitNumber: unitNum
      });
    }
  });

  return result.slice(0, 50);
}

/**
 * DescriptiveQuestionCard Component
 * Renders short-answer, explanatory, and essay questions with uniform Forest/Sage green theme,
 * pre-filled model answer for demo, live word counter, keyword matching, and grading rubric.
 */
function DescriptiveQuestionCard({
  question,
  qIdx,
  textAnswer,
  onAnswerChange,
  isSubmitted,
  expandedRubric,
  onToggleRubric,
}: {
  question: MockQuestion;
  qIdx: number;
  textAnswer: string;
  onAnswerChange: (text: string) => void;
  isSubmitted: boolean;
  expandedRubric: boolean;
  onToggleRubric: () => void;
}) {
  const sectionColors = {
    part_a: { label: "Part A • Short Answer", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
    part_b: { label: "Part B • Analytical & Explanatory", bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
    part_c: { label: "Part C • Comprehensive Essay", bg: "#F4F8F6", text: "#2D3E36", border: "#C6DFD4" },
  };

  const sec = (question.section?.toLowerCase().includes("part_a") || question.sectionName?.toLowerCase().includes("part a"))
    ? sectionColors.part_a
    : (question.section?.toLowerCase().includes("part_b") || question.sectionName?.toLowerCase().includes("part b"))
      ? sectionColors.part_b
      : sectionColors.part_c;

  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;
  const charCount = textAnswer.length;

  const matchedKeywords = useMemo(() => {
    if (!question.keywords || question.keywords.length === 0) return [];
    const lower = textAnswer.toLowerCase();
    return question.keywords.map((kw) => ({
      keyword: kw,
      matched: lower.includes(kw.toLowerCase()),
    }));
  }, [question.keywords, textAnswer]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* Question Metadata Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
          {/* Section Pill */}
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              padding: "4px 10px",
              borderRadius: "6px",
              background: sec.bg,
              color: sec.text,
              border: `1px solid ${sec.border}`,
            }}
          >
            {question.sectionName || sec.label}
          </span>

          {/* Marks Pill */}
          <span
            style={{
              fontSize: "0.8rem",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "6px",
              background: "#2D3E36",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>★</span> {question.marks} {question.marks === 1 ? "Mark" : "Marks"}
          </span>

        </div>
      </div>

      {/* Question Text */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span
          aria-label="Question"
          style={{
            flexShrink: 0,
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "#2D3E36",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "12px",
          }}
        >
          Q
        </span>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: "1.08rem",
            fontWeight: 600,
            color: "#1E2923",
            lineHeight: "1.65",
            background: "#FAFDFB",
            padding: "16px 20px",
            borderRadius: "12px",
            border: "1px solid #E0EDE5",
          }}
        >
          <MarkdownView content={question.text} />
        </div>
      </div>

      {/* Student Answer Box */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <span
          aria-label="Answer"
          style={{
            flexShrink: 0,
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "#467360",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "12px",
          }}
        >
          A
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* Textarea */}
        <textarea
          value={textAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type or format your descriptive answer here..."
          rows={question.marks > 5 ? 12 : question.marks > 2 ? 8 : 5}
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: "12px",
            border: "1.5px solid #C6DFD4",
            background: "#FFFFFF",
            padding: "16px 18px",
            fontSize: "0.95rem",
            lineHeight: "1.65",
            color: "#1E2923",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border 0.2s ease, box-shadow 0.2s ease",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#467360";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(70, 115, 96, 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#C6DFD4";
            e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.02)";
          }}
        />
        </div>
      </div>

      {/* Model Answer Toggle */}
      {question.modelAnswer && (
        <div
          style={{
            borderRadius: "10px",
            border: "1.2px solid #D5DFD9",
            overflow: "hidden",
            background: "#FFFFFF",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRubric();
            }}
            style={{
              width: "100%",
              padding: "10px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: expandedRubric ? "#EDF5F1" : "#FAFAF9",
              border: "none",
              borderBottom: expandedRubric ? "1.2px solid #D5DFD9" : "none",
              color: "#2D3E36",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "background 0.15s ease",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📖</span>
              <span>Model Solution Details</span>
            </span>
            <span
              style={{
                transform: expandedRubric ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
                fontSize: "0.8rem",
                color: "#64748B",
              }}
            >
              ▼
            </span>
          </button>

          {expandedRubric && (
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Model Answer Preview */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1E2923" }}>
                  Official Model Answer Key:
                </div>
                <div
                  style={{
                    background: "#F4F8F6",
                    border: "1px solid #D5DFD9",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    color: "#1E2923",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  <MarkdownView content={question.modelAnswer} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MockTestView Component
 * Displays a mock test for the selected units, allowing users to take a timed exam.
 */
export default function MockTestView({
  subjectId,
  chapterNumber,
  subjectName,
  chapterName,
  persona,
  subjectChapters,
  onQuit,
  onComplete,
  isPreFinalTest = false,
  isPrepExam = false,
}: {
  subjectId: string;
  chapterNumber: number;
  subjectName: string;
  chapterName: string;
  persona: string;
  subjectChapters: Chapter[];
  onQuit: () => void;
  onComplete: () => void;
  isPreFinalTest?: boolean;
  isPrepExam?: boolean;
}) {
  const navigate = useNavigate();

  const examTitle = isPreFinalTest
    ? "Certification Exam"
    : isPrepExam
      ? "Preparation Exam"
      : "Mock Test";
  const isGreenTheme = isPreFinalTest || isPrepExam;

  const fallbackUnits: Chapter[] = [
    { number: 1, name: "Nature and Scope of Marketing" },
    { number: 2, name: "Marketing Environment & Buyer Behavior" },
    { number: 3, name: "Product & Price Decisions" },
    { number: 4, name: "Place & Promotion Decisions" },
    { number: 5, name: "Emerging Trends in Marketing" },
  ];

  const allUnits = useMemo(() => {
    return subjectChapters && subjectChapters.length > 0 ? subjectChapters : fallbackUnits;
  }, [subjectChapters]);

  const completedUnitNumbers = useMemo(() => {
    if (isPreFinalTest || isPrepExam) {
      return allUnits.map(c => c.number);
    }
    const completed = allUnits
      .map((c) => c.number)
      .filter((num) => isChapterComplete(subjectId, num) || num <= chapterNumber);
    return completed.length > 0 ? completed : [1];
  }, [allUnits, subjectId, chapterNumber, isPreFinalTest, isPrepExam]);
  const highestCompletedUnit = useMemo(() => {
    return Math.max(...completedUnitNumbers, 1);
  }, [completedUnitNumbers]);

  const [selectedUnitNumbers, setSelectedUnitNumbers] = useState<number[]>(() => {
    return isPrepExam ? [chapterNumber] : (completedUnitNumbers.length > 0 ? [...completedUnitNumbers] : [1]);
  });
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10);
  const numSelectedUnits = selectedUnitNumbers.length;
  const option1Count = 10;
  const option2Count = 20;
  const [showSetupScreen, setShowSetupScreen] = useState(true);
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [expandedRubrics, setExpandedRubrics] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleRubric = (qId: string) => {
    setExpandedRubrics((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const handleTextAnswerChange = (qId: string, val: string) => {
    if (isSubmitted) return;
    setTextAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const unitHeaderSubtitle = useMemo(() => {
    return selectedUnitNumbers
      .map((uNum) => {
        const found = allUnits.find((u) => u.number === uNum);
        const name = found?.name || (uNum === chapterNumber ? chapterName : "");
        return name ? `Unit ${uNum}: ${name}` : `Unit ${uNum}`;
      })
      .join("  •  ");
  }, [selectedUnitNumbers, allUnits, chapterNumber, chapterName]);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  const questionsScrollRef = useRef<HTMLDivElement>(null);

  const scrollToQuestion = useCallback((idx: number) => {
    setCurrentQuestionIdx(idx);
    const el = document.getElementById(`prep-q-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (showSetupScreen || questions.length === 0) return;
    const container = questionsScrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute("data-qidx");
            if (idxAttr !== null) {
              const idx = parseInt(idxAttr, 10);
              setCurrentQuestionIdx(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.4,
      }
    );

    questions.forEach((_, idx) => {
      const el = document.getElementById(`prep-q-${idx}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [showSetupScreen, questions]);

  const [durationSeconds, setDurationSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const toggleUnitSelection = (unitNum: number) => {
    const isUnlocked = completedUnitNumbers.includes(unitNum) || unitNum <= highestCompletedUnit;
    if (!isUnlocked) return;

    if (selectedUnitNumbers.includes(unitNum)) {
      if (selectedUnitNumbers.length > 1) {
        setSelectedUnitNumbers(prev => prev.filter(n => n !== unitNum));
      }
    } else {
      setSelectedUnitNumbers(prev => [...prev, unitNum].sort((a, b) => a - b));
    }
  };

  const padToCount = (existing: MockQuestion[], subId: string, targetCount: number): MockQuestion[] => {
    if (existing.length >= targetCount) return existing.slice(0, targetCount);
    const padded = [...existing];
    let currentIdx = padded.length;
    const isPhysics = (subId || "").toLowerCase().includes("physics") || (subId || "").toLowerCase().includes("characterization");
    const isManagement = (subId || "").toLowerCase().includes("management");

    while (padded.length < targetCount) {
      const unitNum = ((currentIdx) % (allUnits.length || 1)) + 1;
      const chName = allUnits.find(u => u.number === unitNum)?.name || allUnits.find(u => u.number === unitNum)?.title || `Unit ${unitNum}`;
      padded.push({
        id: `gen-${currentIdx}`,
        text: isPhysics
          ? `Which of the following experimental methods are used for crystal structure and energy quantization in ${chName}?`
          : isManagement
            ? `Which of the following are recognized bases and strategic functions for market segmentation in ${chName}?`
            : `What are the primary definitions and analytical framework concepts in ${chName}?`,
        options: [
          "Demographic factors & structural classification",
          "Psychographic profiling & empirical models",
          "Geographic variables & system boundary analysis",
          "Behavioral characteristics & functional parameters"
        ],
        correctAnswers: [0, 1, 2, 3],
        type: "msq",
        explanation: `All listed options represent fundamental components of ${chName}.`,
        marks: 1,
        section: `Unit ${unitNum}`,
        chapter: chName,
        unitNumber: unitNum
      });
      currentIdx++;
    }
    return padded.slice(0, targetCount);
  };

  const handleStartExam = async () => {
    setLoading(true);

    const unitsToFetch = selectedUnitNumbers.length > 0 ? selectedUnitNumbers : [1];
    let combined: MockQuestion[] = [];

    try {
      if (!isPrepExam && !isPreFinalTest) {
        try {
          const backendMock = await Promise.race([
            getMockTest(subjectId),
            new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500))
          ]);
          if (backendMock && backendMock.length > 0) {
            const mapped: MockQuestion[] = backendMock.map((q, i) => ({
              id: `mock-api-${i}`,
              text: q.q,
              options: (q as any).options,
              correctAnswers: Array.isArray((q as any).answer) ? (q as any).answer : [(q as any).answer],
              type: (q.type === "msq" ? "msq" : "mcq") as "mcq" | "msq",
              explanation: (q as any).explanation || "",
              marks: 1,
              section: examTitle,
              chapter: chapterName,
              unitNumber: chapterNumber,
            }));
            combined = mapped;
          }
        } catch (e) {
          console.warn("Backend mock test unavailable or timed out, falling back to local questions", e);
        }
      }

      if (combined.length === 0) {
        for (const unitNum of unitsToFetch) {
          const baseQuestions =
            subjectId === "management"
              ? MANAGEMENT_MOCKED_QUESTIONS
              : subjectId === "anu_physics"
                ? ANU_PHYSICS_MOCKED_QUESTIONS
                : subjectId === "anu_characterization"
                  ? ANU_CHARACTERIZATION_MOCKED_QUESTIONS
                  : [];

          const filteredMocked = baseQuestions
            .filter((q) => q.chapterNumber === unitNum)
            .map((q) => ({
              id: `mock-${unitNum}-${q.id}`,
              text: q.text,
              options: (q as any).options,
              correctAnswers: (q as any).correctAnswers,
              type: (q as any).type || "mcq",
              explanation: (q as any).explanation || "",
              marks: q.marks || 1,
              section: q.section,
              chapter: q.chapter,
              year: q.year,
            }));

          let mergedExam: MockQuestion[] = [];
          try {
            let pooled = await getChapterExamQuestions(
              subjectId,
              unitNum,
              isPreFinalTest ? "certification" : isPrepExam ? "pre_final" : "mock",
            );
            // For prep/pre-final exams: do NOT fall back to MCQ mock test.
            // These exams are descriptive-only — if nothing loaded keep empty.
            if (!isPrepExam && !isPreFinalTest) {
              if (pooled.length === 0) {
                pooled = await getChapterExamQuestions(subjectId, unitNum, "mock");
              }
            } else if (isPreFinalTest && pooled.length === 0) {
              pooled = await getChapterExamQuestions(subjectId, unitNum, "pre_final");
            }
            mergedExam = pooled.map((q: any, idx) => ({
              id: `exam-${unitNum}-${idx}`,
              text: q.q,
              options: q.options,
              correctAnswers: Array.isArray(q.answer) ? q.answer : (q.answer !== undefined ? [q.answer] : []),
              type: q.type,
              explanation: q.explanation || "",
              marks: q.marks !== undefined ? q.marks : 1,
              section: q.section_name || q.section || examTitle,
              sectionName: q.section_name || q.sectionName,
              bloomLevel: q.bloom_level || q.bloomLevel,
              mindmapPath: q.mindmap_path || q.mindmapPath,
              modelAnswer: q.model_answer || q.modelAnswer,
              rubric: q.rubric,
              keywords: q.keywords,
              hasAsciiDiagram: q.has_ascii_diagram || q.hasAsciiDiagram,
              chapter: chapterName,
              unitNumber: unitNum,
            })) as MockQuestion[];
          } catch (err) {
            console.error(`Failed to load pooled exam for unit ${unitNum}`, err);
          }

          if (isPrepExam || isPreFinalTest) {
            // Descriptive-only: no question bank MCQs, descriptive questions first.
            const descriptive = mergedExam.filter(
              (q) => q.modelAnswer || q.type === "short_answer" || q.type === "long_answer" || q.type === "descriptive"
            );
            const others = mergedExam.filter(
              (q) => !q.modelAnswer && q.type !== "short_answer" && q.type !== "long_answer" && q.type !== "descriptive"
            );
            combined = [...combined, ...descriptive, ...others];
          } else {
            let parsedQBank: MockQuestion[] = [];
            try {
              const markdown = await getResourceContent(subjectId, unitNum, "question_bank.md", persona as any);
              if (markdown && markdown.trim().length > 0 && !markdown.includes("Content not available")) {
                const qbEntries = parseQuestionBankMarkdown(markdown, subjectId, subjectName, unitNum, chapterName);
                parsedQBank = qbEntries.map((q, idx) => ({
                  id: `qbank-${unitNum}-${idx}`,
                  text: q.question,
                  options: (q as any).options,
                  correctAnswers: (q as any).correctAnswers,
                  type: (q as any).type || "mcq",
                  explanation: (q as any).explanation || "",
                  marks: 1,
                  section: "Question Bank",
                  chapter: q.chapterName,
                }));
              }
            } catch (err) {
              console.error(`Failed to load question bank for unit ${unitNum}`, err);
            }
            combined = [...combined, ...mergedExam, ...filteredMocked, ...parsedQBank];
          }
        }

        const hasDescriptive = combined.some(
          (q) => q.modelAnswer || q.type === "short_answer" || q.type === "long_answer" || q.type === "descriptive"
        );
        // Only fall back to MCQ hardcoded questions for regular mock tests,
        // never for prep exam or pre-final which are purely descriptive.
        if (!hasDescriptive && !isPrepExam && !isPreFinalTest) {
          const targetCount = selectedQuestionCount;
          const validDbQuestions = combined.filter((q) => q.options && q.options.length > 0);
          if (validDbQuestions.length > 0) {
            combined = padToCount(validDbQuestions, subjectId, targetCount);
          } else {
            const temp = getTemporaryHardcodedQuestions(subjectId, unitsToFetch, chapterName);
            combined = padToCount(temp, subjectId, targetCount);
          }
        }
      }

      const finalQuestions = combined.map((q) => ({
        ...q,
        section: q.section || examTitle,
      }));

      setQuestions(finalQuestions);

      // Student answer boxes start empty; the official model answer is shown
      // separately in the rubric / model-answer section.
      setTextAnswers({});

      const hasDescriptive = finalQuestions.some(
        (q) => q.modelAnswer || q.type === "short_answer" || q.type === "long_answer" || q.type === "descriptive"
      );
      const totalSeconds = hasDescriptive
        ? 120 * 60 // 2 hours for standard university examination
        : (isPreFinalTest ? 3600 : Math.max(15 * 60, selectedQuestionCount * 120));
      setDurationSeconds(totalSeconds);
      setSecondsLeft(totalSeconds);
      setCurrentQuestionIdx(0);
      setTimerRunning(true);
    } catch (err) {
      console.error("Error starting exam:", err);
      const temp = getTemporaryHardcodedQuestions(subjectId, unitsToFetch, chapterName);
      setQuestions(padToCount(temp, subjectId, isPreFinalTest ? 50 : selectedQuestionCount).map(q => ({ ...q, section: examTitle })));
    } finally {
      setLoading(false);
      setShowSetupScreen(false);
    }
  };

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, secondsLeft]);

  const handleOptionClick = (questionId: string, optionIdx: number, type: "mcq" | "msq") => {
    if (isSubmitted) return;
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (type === "mcq") {
        return { ...prev, [questionId]: [optionIdx] };
      } else {
        if (current.includes(optionIdx)) {
          return { ...prev, [questionId]: current.filter((x) => x !== optionIdx) };
        } else {
          return { ...prev, [questionId]: [...current, optionIdx].sort() };
        }
      }
    });
  };

  const handleClearSelection = (qId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setTextAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };


  const isCorrect = (q: MockQuestion) => {
    if (q.options && q.options.length > 0) {
      const user = answers[q.id] || [];
      const correct = q.correctAnswers || [];
      if (user.length !== correct.length) return false;
      return correct.every((val) => user.includes(val));
    }
    return !!(textAnswers[q.id] && textAnswers[q.id].trim().length > 0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const answeredCount = questions.filter((q) => {
    if (q.options && q.options.length > 0) {
      return (answers[q.id] || []).length > 0;
    }
    return !!(textAnswers[q.id] && textAnswers[q.id].trim().length > 0);
  }).length;
  const timeTakenSecs = durationSeconds - secondsLeft;
  const correctCount = questions.filter((q) => isCorrect(q)).length;

  const handleQuit = () => {
    if (window.confirm(`Are you sure you want to exit ${examTitle}?`)) {
      onQuit();
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#faf8fb" }}>
        <p style={{ color: isGreenTheme ? "#16a34a" : "#c026d3", fontWeight: 600, fontSize: "1.1rem" }}>
          Preparing {examTitle} questions...
        </p>
      </div>
    );
  }

  if (showSetupScreen) {
    if (isPrepExam) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            minHeight: 0,
            background: "#ffffff",
            padding: "16px 24px 28px",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {/* Back to Study Table */}
          <div style={{ width: "100%", maxWidth: "1020px", marginBottom: "12px" }}>
            <button
              onClick={onQuit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                padding: "4px 0",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1e293b")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Study Table
            </button>
          </div>

          {/* Main Card Container with Sage Background matching reference */}
          <div
            style={{
              width: "100%",
              maxWidth: "1020px",
              background: "#cedcd3",
              border: "1.5px solid rgba(79, 123, 100, 0.28)",
              borderRadius: "24px",
              boxShadow: "0 12px 36px rgba(45, 62, 54, 0.08)",
              padding: "28px 32px 34px",
              boxSizing: "border-box",
            }}
          >
            {/* Header: Icon, Title & All the best! Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "26px",
              }}
            >
              {/* Icon & Title */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "#dfece4",
                    border: "1.5px solid #a3c5b5",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 6px rgba(45, 62, 54, 0.06)",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2D473B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="14.5" cy="14.5" r="4.2" fill="#dfece4" stroke="#2D473B" strokeWidth="1.8" />
                    <path d="m13 14.5 1.2 1.2 2.2-2.2" stroke="#2D473B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 style={{ margin: 0, fontSize: "1.85rem", fontWeight: 700, color: "#1e293b", letterSpacing: "-0.015em" }}>
                  Preparation Exam
                </h1>
              </div>

              {/* All the best! Pill */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.78)",
                  border: "1.5px solid rgba(79, 123, 100, 0.3)",
                  color: "#2D473B",
                  borderRadius: "10px",
                  padding: "6px 14px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2D473B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>All the best!</span>
              </div>
            </div>

            {/* 3-Column Grid: Units + Action Controls */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "22px",
              }}
            >
              {allUnits.map((unit) => {
                const isSelected = selectedUnitNumbers.includes(unit.number);

                const unitName = (() => {
                  const raw = (unit.name || unit.title || "").trim();
                  if (!raw || /^unit\s*[-:_]?\s*\d+$/i.test(raw)) {
                    const defaults: Record<number, string> = {
                      1: "Nature and Scope of Marketing",
                      2: "Marketing Environment & Buyer Behavior",
                      3: "Product & Price Decisions",
                      4: "Place & Promotion Decisions",
                      5: "Emerging Trends in Marketing",
                    };
                    return defaults[unit.number] || `Unit ${unit.number} Concepts`;
                  }
                  return raw;
                })();

                return (
                  <div
                    key={unit.number}
                    onClick={() => toggleUnitSelection(unit.number)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px 18px 30px 18px",
                      minHeight: "185px",
                      borderRadius: "18px",
                      position: "relative",
                      cursor: "pointer",
                      userSelect: "none",
                      boxSizing: "border-box",
                      transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
                      // Subtle, refined card styling per request
                      background: isSelected
                        ? "linear-gradient(165deg, rgba(255, 255, 255, 0.96) 0%, rgba(235, 245, 239, 0.92) 100%)"
                        : "linear-gradient(165deg, rgba(255, 255, 255, 0.82) 0%, rgba(242, 248, 244, 0.68) 100%)",
                      border: isSelected
                        ? "2px solid #4F7B64"
                        : "1.5px solid rgba(79, 123, 100, 0.22)",
                      boxShadow: isSelected
                        ? "0 8px 24px rgba(79, 123, 100, 0.12)"
                        : "0 2px 10px rgba(45, 62, 54, 0.04)",
                      backdropFilter: "blur(6px)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 10px 24px rgba(45, 62, 54, 0.10)";
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(79, 123, 100, 0.4)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = isSelected
                        ? "0 8px 24px rgba(79, 123, 100, 0.12)"
                        : "0 2px 10px rgba(45, 62, 54, 0.04)";
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = "rgba(79, 123, 100, 0.22)";
                      }
                    }}
                  >
                    {/* Unit Title */}
                    <div
                      style={{
                        fontSize: "1.65rem",
                        fontWeight: 700,
                        color: "#1e293b",
                        lineHeight: 1.2,
                        marginBottom: "8px",
                      }}
                    >
                      Unit {unit.number}
                    </div>

                    {/* Unit Subtitle */}
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "#475569",
                        textAlign: "center",
                        maxWidth: "88%",
                        lineHeight: 1.35,
                      }}
                    >
                      {unitName}
                    </div>

                    {/* Bottom-Right Checkbox */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.15s ease",
                        border: isSelected ? "2px solid #467360" : "1.8px solid #94a3b8",
                        background: isSelected ? "#467360" : "#ffffff",
                      }}
                    >
                      {isSelected && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 6th Slot: Config Card + Start Exam Button */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "18px",
                  minHeight: "185px",
                  padding: "4px",
                  boxSizing: "border-box",
                }}
              >
                {/* Green Config Box */}
                <div
                  style={{
                    width: "100%",
                    background: "#467360",
                    borderRadius: "14px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    boxShadow: "0 6px 18px rgba(70, 115, 96, 0.22)",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Clipboard Icon */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      <path d="M9 12h6" />
                      <path d="M9 16h6" />
                      <circle cx="9" cy="12" r="0.5" fill="#ffffff" />
                    </svg>
                  </div>

                  {/* Question count radio options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                    <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.92)", fontWeight: 600 }}>
                      No. of questions
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {[option1Count, option2Count].map((count) => {
                        const isChosen = selectedQuestionCount === count;
                        return (
                          <div
                            key={count}
                            onClick={() => setSelectedQuestionCount(count)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                border: isChosen ? "2px solid #ffffff" : "1.8px solid rgba(255, 255, 255, 0.65)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {isChosen && (
                                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#ffffff" }} />
                              )}
                            </div>
                            <div
                              style={{
                                minWidth: "42px",
                                height: "23px",
                                padding: "0 8px",
                                borderRadius: "6px",
                                border: isChosen ? "1.5px solid #ffffff" : "1.5px solid rgba(255, 255, 255, 0.45)",
                                background: isChosen ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.08)",
                                color: "#ffffff",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartExam}
                  style={{
                    background: "#467360",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    padding: "12px 48px",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 4px 16px rgba(70, 115, 96, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#3c6453";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(70, 115, 96, 0.38)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#467360";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(70, 115, 96, 0.3)";
                  }}
                >
                  <span>Start</span>
                  <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const themeColor = isGreenTheme ? "#22c55e" : "#c026d3";
    const themeDarkColor = isGreenTheme ? "#16a34a" : "#c026d3";
    const themeLightBg = isGreenTheme ? "#f0fdf4" : "#fdf4ff";
    const themeBorder = isGreenTheme ? "#86efac" : "#f0abfc";
    const themeShadow = isGreenTheme ? "rgba(34, 197, 94, 0.08)" : "rgba(192, 38, 211, 0.08)";
    const themeBoxShadow = isGreenTheme ? "rgba(34, 197, 94, 0.12)" : "rgba(192, 38, 211, 0.12)";
    const themeButtonGradient = isGreenTheme
      ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
      : "linear-gradient(135deg, #d946ef 0%, #c026d3 100%)";
    const themeButtonShadow = isGreenTheme
      ? "0 4px 16px rgba(34, 197, 94, 0.35)"
      : "0 4px 16px rgba(192, 38, 211, 0.35)";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          background: "#faf8fb",
          padding: "24px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "920px", marginBottom: "16px", marginTop: "24px" }}>
          <button
            onClick={onQuit}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
              padding: "8px 0",
              transition: "color 0.2s ease"
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#334155")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#64748b")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Study Table
          </button>
        </div>
        <div
          style={{
            background: "#ffffff",
            border: `2px solid ${themeBorder}`,
            borderRadius: "20px",
            boxShadow: `0 10px 30px ${themeShadow}`,
            padding: "32px 36px",
            maxWidth: "920px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: themeLightBg,
                  border: `1.5px solid ${themeBorder}`,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 2px 8px ${isPreFinalTest ? "rgba(34, 197, 94, 0.1)" : "rgba(192, 38, 211, 0.1)"}`,
                }}
              >
                {isPreFinalTest ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <circle cx="12" cy="14" r="3" />
                    <polyline points="12 12 12 14 13.5 14" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="m9 15 2 2 4-4" />
                  </svg>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 700, color: "#1e293b" }}>
                {examTitle}
              </h1>
            </div>

            <div
              style={{
                background: themeLightBg,
                border: `1px solid ${themeBorder}`,
                color: themeDarkColor,
                borderRadius: "20px",
                padding: "6px 16px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={themeDarkColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              All the best!
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.35fr 1fr",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {allUnits.map((unit) => {
                const isUnlocked = isPreFinalTest ? true : (completedUnitNumbers.includes(unit.number) || unit.number <= highestCompletedUnit);
                const isSelected = isPreFinalTest ? true : selectedUnitNumbers.includes(unit.number);

                return (
                  <div
                    key={unit.number}
                    onClick={() => !isPreFinalTest && toggleUnitSelection(unit.number)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      transition: "all 0.2s ease",
                      ...(isUnlocked
                        ? {
                          background: themeLightBg,
                          border: isSelected ? `2px solid ${themeColor}` : `1.5px solid ${themeBorder}`,
                          boxShadow: isSelected ? `0 4px 14px ${themeBoxShadow}` : "none",
                          cursor: isPreFinalTest ? "default" : "pointer",
                        }
                        : {
                          background: "#f8fafc",
                          border: "1.5px solid #e2e8f0",
                          opacity: 0.55,
                          cursor: "not-allowed",
                        }),
                    }}
                  >
                    {!isPreFinalTest && (
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                          ...(isUnlocked
                            ? isSelected
                              ? { background: themeColor, border: `2px solid ${themeColor}` }
                              : { background: "#ffffff", border: `2px solid ${themeBorder}` }
                            : { background: "#f1f5f9", border: "2px solid #cbd5e1" }),
                        }}
                      >
                        {isUnlocked && isSelected && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 700,
                          color: isUnlocked ? "#1e293b" : "#94a3b8",
                        }}
                      >
                        Unit {unit.number}
                      </div>
                      <span style={{ color: isUnlocked ? "#94a3b8" : "#cbd5e1", fontWeight: 400 }}>—</span>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: isUnlocked ? themeDarkColor : "#cbd5e1",
                        }}
                      >
                        {(() => {
                          const raw = (unit.name || unit.title || "").trim();
                          if (!raw || /^unit\s*[-:_]?\s*\d+$/i.test(raw)) {
                            const defaults: Record<number, string> = {
                              1: "Nature and Scope of Marketing",
                              2: "Marketing Environment & Buyer Behavior",
                              3: "Product & Price Decisions",
                              4: "Place & Promotion Decisions",
                              5: "Emerging Trends in Marketing",
                            };
                            return defaults[unit.number] || `Unit ${unit.number} Concepts`;
                          }
                          return raw;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {isPreFinalTest ? (
                <>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #86efac",
                      borderRadius: "14px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          background: "#f0fdf4",
                          border: "1.5px solid #86efac",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#16a34a",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Time</div>
                        <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 700 }}>1 hour</div>
                      </div>
                    </div>

                    <div style={{ width: "1px", height: "36px", background: "#e2e8f0", margin: "0 12px" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          background: "#f0fdf4",
                          border: "1.5px solid #86efac",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#16a34a",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>No. of Questions</div>
                        <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 700 }}>50</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #86efac",
                      borderRadius: "14px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#16a34a",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Questions Type</div>
                      <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>MCQ's & MSQ's</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: "1.5px solid #86efac",
                      borderRadius: "14px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#16a34a",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="5" x2="5" y2="19" />
                        <circle cx="6.5" cy="6.5" r="2.5" />
                        <circle cx="17.5" cy="17.5" r="2.5" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Minimum pass %</div>
                      <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>40%</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${themeBorder}`,
                      borderRadius: "14px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: themeLightBg,
                        border: `1.5px solid ${themeBorder}`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: themeDarkColor,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Questions Type</div>
                      <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>MCQ's & MSQ's</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      border: `1.5px solid ${themeBorder}`,
                      borderRadius: "14px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: themeLightBg,
                        border: `1.5px solid ${themeBorder}`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: themeDarkColor,
                        flexShrink: 0,
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <line x1="8" y1="9" x2="16" y2="9" />
                        <line x1="8" y1="13" x2="14" y2="13" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: "4px" }}>
                        No. of questions
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        {[option1Count, option2Count].map((count) => {
                          const isChosen = selectedQuestionCount === count;
                          return (
                            <div
                              key={count}
                              onClick={() => setSelectedQuestionCount(count)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  border: `2px solid ${themeDarkColor}`,
                                  background: isChosen ? themeDarkColor : "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                {isChosen && (
                                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffffff" }} />
                                )}
                              </div>
                              <span style={{ fontSize: "0.9rem", fontWeight: isChosen ? 700 : 500, color: "#0f172a" }}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={handleStartExam}
              style={{
                background: themeButtonGradient,
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 52px",
                fontSize: "1.05rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: themeButtonShadow,
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Start →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPreFinalTest || isPrepExam) {
    const currentQ = questions[currentQuestionIdx] || questions[0];
    const userSelected = currentQ ? (answers[currentQ.id] || []) : [];
    const correct = currentQ ? (currentQ.correctAnswers || []) : [];
    const isQCorrect = isSubmitted && currentQ && isCorrect(currentQ);

    return (
      <div className="mock-test-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f6f5", position: "relative", overflowX: "hidden" }}>
        {/* Top Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 28px",
            background: "#ffffff",
            borderBottom: "1.5px solid #d5dfd9",
            boxShadow: "0 2px 8px rgba(45, 62, 54, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                background: "#2D3E36",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(45, 62, 54, 0.25)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{isSubmitted ? "00:00" : `${formatTime(secondsLeft)} left`}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  background: "#edf5f1",
                  border: "1.5px solid #c6dfd4",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#467360" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="9 15 11 17 15 13" />
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                  {examTitle}
                </h2>
                <div style={{ fontSize: "0.82rem", color: "#467360", fontWeight: 600 }}>
                  {unitHeaderSubtitle}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleQuit}
            title="Quit Exam"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Exam Body (Full Width Layout with Right Screen Edge GPU Hover Navigator) */}
        <div
          style={{
            flex: 1,
            padding: "24px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            height: "calc(100vh - 80px)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Scrollable Questions Column */}
          <div
            ref={questionsScrollRef}
            style={{
              width: isNavigatorOpen ? "calc(100% - 310px)" : "100%",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              height: "100%",
              overflowY: "auto",
              scrollBehavior: "smooth",
              paddingRight: "8px",
              paddingBottom: "120px",
              boxSizing: "border-box",
              transition: "width 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "width",
              transform: "translateZ(0)",
            }}
          >
            {questions.map((q, qIdx) => {
              const userSelected = answers[q.id] || [];
              const correct = q.correctAnswers || [];
              const isActive = qIdx === currentQuestionIdx;
              const isDescriptive = !!(
                q.modelAnswer ||
                q.type === "short_answer" ||
                q.type === "long_answer" ||
                q.type === "descriptive" ||
                (!q.options || q.options.length === 0)
              );

              return (
                <div
                  key={q.id}
                  id={`prep-q-${qIdx}`}
                  data-qidx={qIdx}
                  onClick={() => {
                    if (!isActive) scrollToQuestion(qIdx);
                  }}
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    borderRadius: "20px",
                    border: isActive ? "2px solid #7BA88B" : "1.5px solid #d5dfd9",
                    boxShadow: isActive ? "0 10px 32px rgba(45, 62, 54, 0.08)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                    padding: "32px 40px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                    opacity: isActive ? 1 : 0.7,
                    transform: isActive ? "translate3d(0, 0, 0) scale(1)" : "translate3d(0, 0, 0) scale(0.99)",
                    willChange: "transform, opacity",
                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, border 0.3s ease, box-shadow 0.3s ease",
                    cursor: isActive ? "default" : "pointer",
                    scrollMarginTop: "20px",
                    boxSizing: "border-box",
                  }}
                >
                  {isDescriptive ? (
                    <DescriptiveQuestionCard
                      question={q}
                      qIdx={qIdx}
                      textAnswer={textAnswers[q.id] || ""}
                      onAnswerChange={(val) => handleTextAnswerChange(q.id, val)}
                      isSubmitted={isSubmitted}
                      expandedRubric={!!expandedRubrics[q.id]}
                      onToggleRubric={() => toggleRubric(q.id)}
                    />
                  ) : (
                    <>
                      <div style={{ fontSize: "1.18rem", fontWeight: 700, color: "#0f172a", lineHeight: "1.55", display: "flex", gap: "8px" }}>
                        <span style={{ whiteSpace: "nowrap" }}>{qIdx + 1}.</span>
                        <MarkdownView content={q.text} />
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(q.options || []).map((opt, optIdx) => {
                          const isSelected = userSelected.includes(optIdx);
                          const isOptCorrect = correct.includes(optIdx);

                          let optBg = "#ffffff";
                          let optBorder = "1.5px solid #f1f5f9";
                          let optColor = "#334155";
                          let radioBorder = isSelected ? "#467360" : "#cbd5e1";
                          let radioBg = isSelected ? "#467360" : "#ffffff";
                          let badgeBg = "#f1f5f9";
                          let badgeColor = "#475569";

                          if (isSubmitted) {
                            if (isOptCorrect) {
                              optBg = "#ECFDF5";
                              optBorder = "2px solid #10B981";
                              optColor = "#065F46";
                              radioBorder = "#10B981";
                              radioBg = "#10B981";
                              badgeBg = "#10B981";
                              badgeColor = "#ffffff";
                            } else if (isSelected) {
                              optBg = "#FEF2F2";
                              optBorder = "2px solid #EF4444";
                              optColor = "#991B1B";
                              radioBorder = "#EF4444";
                              radioBg = "#EF4444";
                              badgeBg = "#EF4444";
                              badgeColor = "#ffffff";
                            }
                          } else if (isSelected) {
                            optBg = "#f0fdf4";
                            optBorder = "2px solid #467360";
                            optColor = "#14532d";
                            badgeBg = "#467360";
                            badgeColor = "#ffffff";
                          }

                          return (
                            <div
                              key={optIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionClick(q.id, optIdx, q.type === "msq" ? "msq" : "mcq");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                padding: "14px 20px",
                                borderRadius: "12px",
                                background: optBg,
                                border: optBorder,
                                color: optColor,
                                fontSize: "0.98rem",
                                cursor: isSubmitted ? "default" : "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: q.type === "msq" ? "7px" : "50%",
                                  border: `2.5px solid ${radioBorder}`,
                                  background: radioBg,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isSelected && (
                                  q.type === "msq" ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ffffff" }} />
                                  )
                                )}
                              </div>

                              <div
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  background: badgeBg,
                                  color: badgeColor,
                                  fontWeight: "700",
                                  fontSize: "13px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </div>

                              <div style={{ flex: 1, fontWeight: 500 }}>
                                <MarkdownView content={opt.replace(/[\x0c\u000c]/g, '\\f').replace(/♠rac/g, '\\frac').replace(/♠/g, '\\f')} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Bottom Action Controls */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSelection(q.id);
                      }}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "10px",
                        border: "1.1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#64748b",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear Answer
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (qIdx < questions.length - 1) {
                            scrollToQuestion(qIdx + 1);
                          } else {
                            setTimerRunning(false);
                            setIsSubmitted(true);
                          }
                        }}
                        style={{
                          padding: "8px 24px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#2D3E36",
                          color: "#ffffff",
                          fontSize: "0.9rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(45, 62, 54, 0.25)",
                        }}
                      >
                        {qIdx === questions.length - 1 ? "Submit →" : "Next →"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Edge Fixed Question Navigator Drawer (GPU Hardware Accelerated 60fps) */}
          <div
            onMouseEnter={() => setIsNavigatorOpen(true)}
            onMouseLeave={() => setIsNavigatorOpen(false)}
            style={{
              position: "fixed",
              right: "0px",
              top: "100px",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              transform: isNavigatorOpen ? "translate3d(0, 0, 0)" : "translate3d(calc(100% - 8px), 0, 0)",
              transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {/* Green Vertical Hover Bar Handle (GPU Edge Trigger, disappears when hovered open) */}
            <div
              style={{
                width: "8px",
                height: "160px",
                background: "#467360",
                borderRadius: "4px 0 0 4px",
                boxShadow: "-2px 0 10px rgba(70, 115, 96, 0.4)",
                flexShrink: 0,
                opacity: isNavigatorOpen ? 0 : 1,
                pointerEvents: isNavigatorOpen ? "none" : "auto",
                transition: "opacity 0.2s ease",
                cursor: "pointer",
              }}
              title="Hover to view Question Navigator"
            />

            {/* Question Navigator Card */}
            <div
              style={{
                width: "290px",
                background: "#ffffff",
                border: "1.5px solid #d5dfd9",
                borderRight: "none",
                borderRadius: "18px 0 0 18px",
                boxShadow: "-8px 12px 36px rgba(45, 62, 54, 0.15)",
                padding: "20px 22px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                willChange: "transform",
                maxHeight: "82vh",
                overflowY: "auto",
              }}
            >
              <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#2D3E36" }}>
                Question Navigator
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "0.76rem", color: "#475569" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#e2e8f0" }} />
                  Not Answered
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#467360" }} />
                  Answered
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#2D3E36" }} />
                  Current
                </div>
              </div>

              {/* Questions Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentQuestionIdx;
                  const isAns = (q.options && q.options.length > 0)
                    ? (answers[q.id] || []).length > 0
                    : !!(textAnswers[q.id] && textAnswers[q.id].trim().length > 0);

                  let btnBg = "#f8fafc";
                  let btnColor = "#334155";
                  let btnBorder = "1.5px solid #e2e8f0";

                  if (isCurrent) {
                    btnBg = "#2D3E36";
                    btnColor = "#ffffff";
                    btnBorder = "1.5px solid #1E2923";
                  } else if (isAns) {
                    btnBg = "#467360";
                    btnColor = "#ffffff";
                    btnBorder = "1.5px solid #2D3E36";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => scrollToQuestion(idx)}
                      style={{
                        height: "36px",
                        borderRadius: "8px",
                        background: btnBg,
                        color: btnColor,
                        border: btnBorder,
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setIsSubmitted(true);
                }}
                style={{
                  marginTop: "auto",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #2D3E36",
                  background: "#2D3E36",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(45, 62, 54, 0.2)",
                }}
              >
                <span>Submit & Review</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Bottom Action Bar */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#ffffff",
            borderTop: "1.5px solid #d5dfd9",
            padding: "12px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -4px 16px rgba(45, 62, 54, 0.06)",
            zIndex: 90,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isSubmitted ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
                <span>✓ Exam Completed</span>
                <span style={{ color: "#64748B", fontWeight: 500, fontSize: "0.85rem" }}>• Model solutions unlocked for review</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2D3E36", fontWeight: 600, fontSize: "0.9rem" }}>
                <span
                  style={{
                    background: "#edf5f1",
                    color: "#2D3E36",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                  }}
                >
                  {answeredCount} of {questions.length} Answered
                </span>
                <span style={{ color: "#64748B", fontSize: "0.82rem" }}>
                  (Click any question in Navigator or scroll to inspect)
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isSubmitted ? (
              <button
                onClick={onComplete}
                style={{
                  background: "linear-gradient(135deg, #4F7B64 0%, #2D3E36 100%)",
                  color: "#ffffff",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(45, 62, 54, 0.25)",
                }}
              >
                <span>Finish & Continue</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setIsSubmitted(true);
                }}
                style={{
                  background: "linear-gradient(135deg, #4F7B64 0%, #2D3E36 100%)",
                  color: "#ffffff",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 4px 14px rgba(45, 62, 54, 0.25)",
                }}
              >
                <span>Submit {examTitle}</span>
                <span>✓</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeHeaderBg = isGreenTheme ? "#f0fdf4" : "#fdf4ff";
  const activeHeaderBorder = isGreenTheme ? "1.5px solid #86efac" : "1.5px solid #f0abfc";
  const activeHeaderShadow = isGreenTheme ? "rgba(34, 197, 94, 0.05)" : "rgba(192, 38, 211, 0.05)";
  const activeHeaderColor = isGreenTheme ? "#16a34a" : "#c026d3";
  const activeHeaderBorderColor = isGreenTheme ? "#86efac" : "#f0abfc";
  const activeCardBorderColor = isGreenTheme ? "#86efac" : "#f0abfc";
  const activeCardAccentColor = isGreenTheme ? "#22c55e" : "#d946ef";
  const activeCardShadow = isGreenTheme ? "0 4px 16px rgba(34, 197, 94, 0.08)" : "0 4px 16px rgba(192, 38, 211, 0.05)";
  const activeOptionBg = isGreenTheme ? "#f0fdf4" : "#fdf4ff";
  const activeOptionBorder = isGreenTheme ? "2px solid #22c55e" : "2px solid #d946ef";
  const activeOptionColor = isGreenTheme ? "#14532d" : "#86198f";
  const activeRadioBorder = isGreenTheme ? "#22c55e" : "#d946ef";
  const activePageBg = isGreenTheme ? "#f8fafc" : "#faf8fb";
  const activeFooterBorder = isGreenTheme ? "1px solid #86efac" : "1px solid #f0abfc";
  const activeBtnGradient = isGreenTheme ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)" : "linear-gradient(135deg, #d946ef 0%, #c026d3 100%)";
  const activeBtnShadow = isGreenTheme ? "0 4px 14px rgba(34, 197, 94, 0.35)" : "0 4px 14px rgba(192, 38, 211, 0.3)";

  return (
    <div className="mock-test-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: activePageBg }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 28px",
          background: activeHeaderBg,
          borderBottom: activeHeaderBorder,
          boxShadow: `0 2px 8px ${activeHeaderShadow}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#ffffff",
              border: `1.5px solid ${activeHeaderBorderColor}`,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeHeaderColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
              {examTitle}
            </h2>
            <div style={{ fontSize: "0.82rem", color: activeHeaderColor, fontWeight: 600 }}>
              {unitHeaderSubtitle}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={handleQuit}
            title={`Quit ${examTitle}`}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          padding: "24px 28px",
          background: activePageBg,
          flex: 1,
        }}
      >
        {questions.map((q, idx) => {
          const userSelected = answers[q.id] || [];
          const correct = q.correctAnswers || [];
          const isQCorrect = isSubmitted && isCorrect(q);
          const isDescriptive = !!(
            q.modelAnswer ||
            q.type === "short_answer" ||
            q.type === "long_answer" ||
            q.type === "descriptive" ||
            (!q.options || q.options.length === 0)
          );

          return (
            <div
              key={q.id}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: isSubmitted
                  ? isQCorrect
                    ? "2px solid #10B981"
                    : "2px solid #EF4444"
                  : `1.5px solid ${activeCardBorderColor}`,
                borderLeft: isSubmitted
                  ? isQCorrect
                    ? "8px solid #10B981"
                    : "8px solid #EF4444"
                  : `8px solid ${activeCardAccentColor}`,
                boxShadow: activeCardShadow,
                padding: "24px 28px",
                transition: "all 0.2s ease",
              }}
            >
              {isDescriptive ? (
                <DescriptiveQuestionCard
                  question={q}
                  qIdx={idx}
                  textAnswer={textAnswers[q.id] || ""}
                  onAnswerChange={(val) => handleTextAnswerChange(q.id, val)}
                  isSubmitted={isSubmitted}
                  expandedRubric={!!expandedRubrics[q.id]}
                  onToggleRubric={() => toggleRubric(q.id)}
                />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "18px",
                      lineHeight: "1.55",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <span style={{ whiteSpace: "nowrap" }}>{idx + 1}.</span>
                    <MarkdownView content={q.text} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(q.options || []).map((opt, optIdx) => {
                      const isSelected = userSelected.includes(optIdx);
                      const isOptCorrect = correct.includes(optIdx);

                      let optBg = "#ffffff";
                      let optBorder = "1.5px solid #f1f5f9";
                      let optColor = "#334155";

                      if (isSubmitted) {
                        if (isOptCorrect) {
                          optBg = "#ECFDF5";
                          optBorder = "2px solid #10B981";
                          optColor = "#065F46";
                        } else if (isSelected) {
                          optBg = "#FEF2F2";
                          optBorder = "2px solid #EF4444";
                          optColor = "#991B1B";
                        }
                      } else if (isSelected) {
                        optBg = activeOptionBg;
                        optBorder = activeOptionBorder;
                        optColor = activeOptionColor;
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleOptionClick(q.id, optIdx, (q.type as any) || "mcq")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 18px",
                            borderRadius: "12px",
                            background: optBg,
                            border: optBorder,
                            color: optColor,
                            fontSize: "0.95rem",
                            cursor: isSubmitted ? "default" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: q.type === "msq" ? "4px" : "50%",
                              border: isSubmitted
                                ? isOptCorrect
                                  ? "2px solid #10B981"
                                  : "2px solid #EF4444"
                                : `2px solid ${isSelected ? activeRadioBorder : "#cbd5e1"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isSubmitted
                                ? isOptCorrect
                                  ? "#10B981"
                                  : isSelected
                                    ? "#EF4444"
                                    : "#ffffff"
                                : isSelected
                                  ? activeCardAccentColor
                                  : "#ffffff",
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && (
                              q.type === "msq" ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffffff" }} />
                              )
                            )}
                          </div>

                          <span style={{ fontWeight: 700, marginRight: "4px" }}>
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <div style={{ flex: 1, fontWeight: 500 }}>
                            <MarkdownView content={opt.replace(/[\x0c\u000c]/g, '\\f').replace(/♠rac/g, '\\frac').replace(/♠/g, '\\f')} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {isSubmitted && q.explanation && (
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: "10px",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.9rem",
                    color: "#475569",
                    lineHeight: "1.6",
                    marginTop: "14px",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "#1e293b", display: "block", marginBottom: "4px" }}>
                    💡 Explanation:
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 28px",
          background: "#ffffff",
          borderTop: activeFooterBorder,
          boxShadow: "0 -4px 12px rgba(0,0,0,0.03)",
        }}
      >
        <div>
          {isSubmitted ? (
            <span style={{ color: "#10B981", fontWeight: "bold", fontSize: "0.95rem" }}>
              ✓ Answers submitted!
            </span>
          ) : (
            <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
              {answeredCount} of {questions.length} questions answered
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {isSubmitted ? (
            <button
              onClick={onComplete}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                background: activeBtnGradient,
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "none",
                cursor: "pointer",
                boxShadow: activeBtnShadow,
              }}
            >
              Finish & Continue →
            </button>
          ) : (
            <button
              onClick={() => {
                setTimerRunning(false);
                setIsSubmitted(true);
              }}
              style={{
                padding: "10px 24px",
              }}
              disabled={answeredCount < questions.length}
            >
              {isPreFinalTest ? "Submit Certification Exam" : `Submit ${examTitle}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
