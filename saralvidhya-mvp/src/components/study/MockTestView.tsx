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
import { getFallbackTenantId } from '@/tenant/TenantProvider';
import { registryClient } from '@/data/registryClient';
import { trackCloudEvent } from '@/utils/analytics';

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

interface ScannedPageItem {
  id: string;
  label: string;
  dataUrl?: string;
  timestamp: string;
}

const DEFAULT_SCANNED_PAGES: ScannedPageItem[] = [];

/**
 * DescriptiveQuestionCard Component
 * Renders short-answer, explanatory, and essay questions with the warm cream and terracotta
 * academic theme matching the Exam Prep mockup.
 */
function DescriptiveQuestionCard({
  question,
  qIdx,
  textAnswer,
  onAnswerChange,
  onClearAnswer,
  onNextQuestion,
  onPrevQuestion,
  hasPrev,
  isLastQuestion,
  isSubmitted,
  expandedRubric,
  onToggleRubric,
}: {
  question: MockQuestion;
  qIdx: number;
  textAnswer: string;
  onAnswerChange: (text: string) => void;
  onClearAnswer?: () => void;
  onNextQuestion?: () => void;
  onPrevQuestion?: () => void;
  hasPrev?: boolean;
  isLastQuestion?: boolean;
  isSubmitted: boolean;
  expandedRubric: boolean;
  onToggleRubric: () => void;
}) {
  const [inputMode, setInputMode] = useState<"type" | "scan" | "draw" | "image">("type");
  const [scannedPages, setScannedPages] = useState<ScannedPageItem[]>(DEFAULT_SCANNED_PAGES);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const wordCount = textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0;
  const marks = question.marks || 2;
  const targetWordRange =
    marks <= 2 ? "40–60" : marks <= 5 ? "120–180" : "250–350";

  const matchedKeywords = useMemo(() => {
    if (!question.keywords || question.keywords.length === 0) return [];
    const lower = textAnswer.toLowerCase();
    return question.keywords.map((kw) => ({
      keyword: kw,
      matched: lower.includes(kw.toLowerCase()),
    }));
  }, [question.keywords, textAnswer]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        setScannedPages((prev) => [
          ...prev,
          {
            id: `scan-${Date.now()}-${idx}`,
            label: file.name || `Page ${prev.length + 1}`,
            dataUrl: typeof reader.result === "string" ? reader.result : undefined,
            timestamp: "just now",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleAddSimulatedOrFilePage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setScannedPages((prev) => [
        ...prev,
        {
          id: `scan-${Date.now()}`,
          label: `Page ${prev.length + 1}`,
          timestamp: "just now",
        },
      ]);
    }
  };

  const handleRemovePage = (id: string) => {
    setScannedPages((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />

      {/* Question Header Row: Q Badge + Question Text + Marks on Right */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            aria-label={`Question ${qIdx + 1}`}
            style={{
              flexShrink: 0,
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "#546C60",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1px",
            }}
          >
            Q{qIdx + 1}
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: "16px",
              fontWeight: 700,
              color: "#1E2822",
              lineHeight: 1.45,
            }}
          >
            <MarkdownView content={question.text} disableGlossary={true} />
          </div>
        </div>

        <span
          style={{
            flexShrink: 0,
            fontSize: "12px",
            fontWeight: 600,
            color: "#7A807A",
            marginTop: "4px",
            whiteSpace: "nowrap",
          }}
        >
          {marks} {marks === 1 ? "mark" : "marks"}
        </span>
      </div>

      {/* 4 Answer Mode Pill Tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "2px",
        }}
      >
        {([
          { id: 'type', label: 'Type and Draw', icon: '⌨' },
          { id: 'scan', label: 'Scan/Upload', icon: '📷' },
        ] as const).map((tab) => {
          const isActive = inputMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setInputMode(tab.id);
                if (tab.id === "scan" || tab.id === "image") {
                  fileInputRef.current?.click();
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "999px",
                background: isActive ? "#EBF1EA" : "#FFFFFF",
                border: isActive ? "1.5px solid #546C60" : "1px solid #E2DDD3",
                color: isActive ? "#2D4438" : "#38423B",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "12px", lineHeight: 1 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Textarea Input */}
      <div>
        <textarea
          value={textAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={isSubmitted}
          placeholder="Type your answer here..."
          rows={marks > 5 ? 6 : marks > 2 ? 4 : 3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: "12px",
            border: "1px solid #DFD9CE",
            background: "#FFFFFF",
            padding: "14px 16px",
            fontSize: "13.5px",
            lineHeight: 1.6,
            color: "#1E2822",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.18s ease, box-shadow 0.18s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#546C60";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(84, 108, 96, 0.14)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#DFD9CE";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {/* Handwritten / Scanned Pages Strip */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: "2px",
          }}
        >
          {scannedPages.map((page) => (
            <div
              key={page.id}
              onClick={() => !isSubmitted && handleRemovePage(page.id)}
              title="Tap to remove or re-take page"
              style={{
                width: "76px",
                height: "96px",
                borderRadius: "10px",
                border: "1px solid #E2DDD3",
                background: "#FCFBF9",
                position: "relative",
                cursor: isSubmitted ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "10px 8px",
                boxSizing: "border-box",
                boxShadow: "0 1px 3px rgba(30, 40, 34, 0.04)",
              }}
            >
              {!isSubmitted && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#1E2822",
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  ✕
                </span>
              )}
              {page.dataUrl ? (
                <img
                  src={page.dataUrl}
                  alt={page.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
              ) : (
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 60 76"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line x1="4" y1="12" x2="56" y2="12" stroke="#ECE7DF" strokeWidth="1" />
                  <line x1="4" y1="24" x2="56" y2="24" stroke="#ECE7DF" strokeWidth="1" />
                  <line x1="4" y1="36" x2="56" y2="36" stroke="#ECE7DF" strokeWidth="1" />
                  <line x1="4" y1="48" x2="56" y2="48" stroke="#ECE7DF" strokeWidth="1" />
                  <line x1="4" y1="60" x2="56" y2="60" stroke="#ECE7DF" strokeWidth="1" />
                  <path
                    d="M6 10 Q 11 7, 16 10 T 26 10 T 36 10 T 48 10"
                    stroke="#8C96AA"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 21 Q 12 18, 18 21 T 30 21 T 44 21"
                    stroke="#8C96AA"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 33 Q 10 30, 15 33 T 25 33 T 38 33 T 50 33"
                    stroke="#8C96AA"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 45 Q 11 42, 16 45 T 28 45 T 40 45"
                    stroke="#8C96AA"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 57 Q 11 54, 16 57 T 26 57 T 35 57"
                    stroke="#8C96AA"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
          ))}

          {!isSubmitted && (
            <button
              type="button"
              onClick={handleAddSimulatedOrFilePage}
              style={{
                width: "76px",
                height: "96px",
                borderRadius: "10px",
                border: "1.5px dashed #C8C1B4",
                background: "#F7F4EE",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                cursor: "pointer",
                color: "#6E766E",
                fontSize: "11px",
                fontWeight: 600,
                padding: "6px",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: "18px", lineHeight: 1, color: "#7A807A" }}>+</span>
              <span>Add page</span>
            </button>
          )}
        </div>

        {/* Status & Word Count Helper Lines */}
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
          {scannedPages.length > 0 && (
            <div style={{ fontSize: "12px", color: "#6E766E" }}>
              <strong style={{ color: "#A86334", fontWeight: 700 }}>
                {scannedPages.length} handwritten{" "}
                {scannedPages.length === 1 ? "page" : "pages"}
              </strong>{" "}
              scanned with your device camera · just now · tap a page to re-take or remove
            </div>
          )}
          <div style={{ fontSize: "12px", color: "#6E766E" }}>
            <strong style={{ color: "#A86334", fontWeight: 700 }}>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </strong>{" "}
            · aim {targetWordRange} words for a {marks}-mark answer
          </div>
        </div>
      </div>

      {/* Submitted Model Answer & Rubric Collapsible */}
      {isSubmitted && (question.modelAnswer || (question.rubric && question.rubric.length > 0)) && (
        <div
          style={{
            marginTop: "6px",
            background: "#F4F7F3",
            border: "1px solid #C5D6CC",
            borderRadius: "12px",
            padding: "14px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: expandedRubric ? "10px" : 0,
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#2D4438" }}>
              {"Official Model Answer & Evaluation Rubric"}
            </span>
            <button
              type="button"
              onClick={onToggleRubric}
              style={{
                background: "none",
                border: "none",
                color: "#435D50",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {expandedRubric ? "Hide Rubric ▲" : "View Model Answer ▼"}
            </button>
          </div>
          {expandedRubric && (
            <div style={{ fontSize: "13px", color: "#1E2822", lineHeight: 1.6 }}>
              {question.modelAnswer && <MarkdownView content={question.modelAnswer} disableGlossary={true} />}
              {matchedKeywords.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                  {matchedKeywords.map((k, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: k.matched ? "#E6F4EA" : "#F3EFE8",
                        color: k.matched ? "#1E6F43" : "#6E766E",
                      }}
                    >
                      {k.matched ? "✓ " : ""}
                      {k.keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Card Footer Row: Clear Answer (left) + Draft saved & Next (right) */}
      {onNextQuestion && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "6px",
            marginTop: "2px",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearAnswer?.();
            }}
            style={{
              padding: "7px 16px",
              borderRadius: "999px",
              border: "1px solid #DFD9CE",
              background: "#FFFFFF",
              color: "#38423B",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear Answer
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#6E766E",
              }}
            >
              ✓ Draft saved
            </span>

            {hasPrev && onPrevQuestion && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevQuestion();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  border: "1px solid #DFD9CE",
                  background: "#FAF8F4",
                  color: "#38423B",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Prev
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNextQuestion();
              }}
              style={{
                padding: "8px 22px",
                borderRadius: "999px",
                border: "none",
                background: "#546C60",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(84, 108, 96, 0.24)",
              }}
            >
              {isLastQuestion ? "Submit →" : "Next →"}
            </button>
          </div>
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
      ? "Exam Prep."
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
    return isPrepExam ? [chapterNumber || 1] : (completedUnitNumbers.length > 0 ? [...completedUnitNumbers] : [1]);
  });
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10);
  const [isTimedMode, setIsTimedMode] = useState<boolean>(true);
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

    const unitsToFetch = isPrepExam ? [chapterNumber || 1] : (selectedUnitNumbers.length > 0 ? selectedUnitNumbers : [1]);
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
              modelAnswer: isPrepExam ? "" : (q.model_answer || q.modelAnswer),
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
            const descriptive = mergedExam.filter(
              (q) => q.modelAnswer || q.type === "short_answer" || q.type === "long_answer" || q.type === "descriptive"
            );
            const others = mergedExam.filter(
              (q) => !q.modelAnswer && q.type !== "short_answer" && q.type !== "long_answer" && q.type !== "descriptive"
            );
            let unitPool = [...descriptive, ...others];
            if (unitPool.length === 0) {
              try {
                const markdown = await getResourceContent(subjectId, unitNum, "question_bank.md", persona as any);
                if (markdown && markdown.trim().length > 0 && !markdown.includes("Content not available")) {
                  const qbEntries = parseQuestionBankMarkdown(markdown, subjectId, subjectName, unitNum, chapterName);
                  unitPool = qbEntries.map((q, idx) => {
                    const marks = idx < 4 ? 2 : idx < 8 ? 5 : 10;
                    const secName =
                      marks <= 2
                        ? "PART A · SHORT ANSWER QUESTIONS"
                        : marks <= 5
                        ? "PART B · ANALYTICAL QUESTIONS"
                        : "PART C · LONG ANSWER QUESTIONS";
                    return {
                      id: `prep-qb-${unitNum}-${idx}`,
                      text: q.question,
                      type: marks <= 2 ? "short_answer" : "long_answer",
                      marks,
                      section: secName,
                      sectionName: secName,
                      modelAnswer: "",
                      chapter: q.chapterName || chapterName,
                      unitNumber: unitNum,
                    } as MockQuestion;
                  });
                }
              } catch (err) {
                console.error(`Failed to load fallback question bank for unit ${unitNum}`, err);
              }
            }
            combined = [...combined, ...unitPool];
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
            let cloudGenerated: MockQuestion[] = [];
            try {
              const bank = await registryClient.getPracticeFallback(
                getFallbackTenantId(),
                subjectId
              );
              const tplMap = bank?.mockTestTemplates || {};
              const normSub = (subjectId || '').toLowerCase();
              const catKey =
                normSub.includes('physics') || normSub.includes('characterization')
                  ? 'physics'
                  : normSub.includes('management')
                  ? 'management'
                  : 'default';
              const catObj = tplMap[catKey] || tplMap.default || {};
              let qIdx = 1;
              for (const uNum of unitsToFetch) {
                const uList = catObj[String(uNum)] || catObj['1'] || [];
                for (let i = 0; i < uList.length; i++) {
                  const t = uList[i];
                  cloudGenerated.push({
                    id: `cloud-mt-${uNum}-${qIdx++}`,
                    text: t.text,
                    options: t.options || [],
                    correctAnswers: t.correctAnswers || [0],
                    type: t.type === 'msq' ? 'msq' : 'mcq',
                    explanation: t.explanation || '',
                    marks: t.marks || 1,
                    section: `Unit ${uNum} · ${t.type === 'msq' ? 'MSQ' : 'MCQ'}`,
                    chapter: `Unit ${uNum} Content`,
                    unitNumber: uNum,
                  });
                }
              }
            } catch {
              // fallback below if offline
            }
            const temp =
              cloudGenerated.length > 0
                ? cloudGenerated
                : getTemporaryHardcodedQuestions(subjectId, unitsToFetch, chapterName);
            combined = padToCount(temp, subjectId, targetCount);
          }
        }
      }

      const slicedQuestions = combined;

      const finalQuestions = slicedQuestions.map((q) => ({
        ...q,
        section: q.section || examTitle,
      }));

      setQuestions(finalQuestions);
      setTextAnswers({});

      const hasDescriptive = finalQuestions.some(
        (q) => q.modelAnswer || q.type === "short_answer" || q.type === "long_answer" || q.type === "descriptive"
      );
      const prepSeconds =
        finalQuestions.length <= 10
          ? 25 * 60
          : finalQuestions.length <= 12
          ? 40 * 60
          : 60 * 60;
      const totalSeconds = isPrepExam
        ? prepSeconds
        : hasDescriptive
        ? 120 * 60
        : (isPreFinalTest ? 3600 : Math.max(15 * 60, selectedQuestionCount * 120));
      setDurationSeconds(totalSeconds);
      setSecondsLeft(totalSeconds);
      setCurrentQuestionIdx(0);
      setTimerRunning(isPrepExam ? isTimedMode : true);
      trackCloudEvent(
        'mock_test.start',
        {
          category: 'assessment',
          subjectId,
          chapterId: `chapter_${String(chapterNumber || 1).padStart(2, '0')}`,
          chapterNumber,
          toolId: isPreFinalTest ? 'certification_exam' : isPrepExam ? 'prep_exam' : 'mock_test',
          persona,
          total: finalQuestions.length,
          status: 'started',
          label: examTitle,
        },
        true
      );
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
    if (isPrepExam) {
      setSelectedUnitNumbers([chapterNumber || 1]);
      setShowSetupScreen(true);
    }
  }, [isPrepExam, subjectId, chapterNumber]);
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100%",
          height: "100%",
          background: "#F8F5EE",
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        }}
      >
        <p style={{ color: "#9A542A", fontWeight: 700, fontSize: "1rem" }}>
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
            width: "100%",
            height: "100%",
            minHeight: 0,
            background: '#F8F5EE',
            fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
            boxSizing: "border-box",
            overflowY: "auto",
            color: "#1E2822",
          }}
        >
          {/* Top Sub-Header Bar: "{Subject Name} › Exam Prep" */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 26px",
              background: "#FFFFFF",
              borderBottom: "1px solid #E6E0D4",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem" }}>
              <span style={{ fontWeight: 700, color: "#1E2822" }} title={chapterName}>
                {chapterName}
              </span>
            </div>
          </div>

          {/* Centered Main Container */}
          {/* Centered Main Container — wider & single-screen fit */}
          <div
            style={{
              width: "100%",
              maxWidth: "1060px",
              margin: "10px auto 14px",
              padding: "0 24px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                background: "#EFECE4",
                border: "1px solid #E2DDD3",
                borderRadius: "18px",
                padding: "16px 24px 18px",
                boxSizing: "border-box",
              }}
            >
              {/* Header: Icon + "Exam Prep" & "All the best!" Pill */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      background: "#FFFFFF",
                      border: "1px solid #E2DDD3",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 1px 3px rgba(30, 40, 34, 0.04)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="3" fill="#FFFFFF" stroke="#546C60" strokeWidth="1.8" />
                      <path d="M4 8.5H20" stroke="#546C60" strokeWidth="1.8" />
                      <line x1="8" y1="13" x2="16" y2="13" stroke="#6E766E" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="8" y1="16.5" x2="13" y2="16.5" stroke="#6E766E" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "19.5px",
                      fontWeight: 800,
                      color: "#1E2822",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    Exam Prep.
                  </h1>
                </div>

              </div>

              {/* Two-Column Grid: Left (Unit Card) + Right (Config Cards + Start Button) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.08fr 1fr",
                  gap: "16px",
                  alignItems: "stretch",
                }}
              >
                {/* Left Column: Selectable Unit Card(s) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {allUnits.map((unit) => {
                    const isSelected = selectedUnitNumbers.includes(unit.number);
                    const rawTitle = (unit.name || unit.title || "").trim();
                    const cleanUnitTitle =
                      !rawTitle || /^unit\s*[-:_]?\s*\d+$/i.test(rawTitle)
                        ? chapterName && unit.number === chapterNumber
                          ? chapterName
                          : `Unit ${unit.number} Concepts`
                        : rawTitle.replace(/^unit\s*\d+\s*[-:—:]\s*/i, "");

                    return (
                      <div
                        key={unit.number}
                        onClick={() => toggleUnitSelection(unit.number)}
                        style={{
                          flex: allUnits.length === 1 ? 1 : undefined,
                          background: "#FFFFFF",
                          border: isSelected ? "1.5px solid #546C60" : "1px solid #E2DDD3",
                          borderRadius: "14px",
                          padding: "20px 22px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          boxSizing: "border-box",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "17px",
                                fontWeight: 800,
                                color: "#1E2822",
                                lineHeight: 1.25,
                              }}
                            >
                              Unit {unit.number}
                            </div>
                            <div
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 500,
                                color: "#5A625C",
                                marginTop: "5px",
                                lineHeight: 1.4,
                              }}
                            >
                              {cleanUnitTitle}
                            </div>
                          </div>

                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: isSelected ? "#546C60" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #546C60" : "1.5px solid #C8C1B4",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Configuration Cards + Start Button */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* 2. MODE Card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2DDD3",
                      borderRadius: "13px",
                      padding: "11px 15px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#6E766E",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      MODE
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setIsTimedMode(true)}
                        style={{
                          padding: "7px 8px",
                          borderRadius: "9px",
                          border: isTimedMode ? "1.5px solid #546C60" : "1px solid #E2DDD3",
                          background: isTimedMode ? "#F2F6F3" : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: isTimedMode ? "#2D4438" : "#1E2822",
                          }}
                        >
                          ◷ Timed
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: isTimedMode ? "#435D50" : "#6E766E",
                          }}
                        >
                          clock runs — trains pacing
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsTimedMode(false)}
                        style={{
                          padding: "7px 8px",
                          borderRadius: "9px",
                          border: !isTimedMode ? "1.5px solid #546C60" : "1px solid #E2DDD3",
                          background: !isTimedMode ? "#F2F6F3" : "#FFFFFF",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: !isTimedMode ? "#2D4438" : "#1E2822",
                          }}
                        >
                          Untimed
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 500,
                            color: !isTimedMode ? "#435D50" : "#6E766E",
                          }}
                        >
                          practice at your pace
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 3. ANSWER IN ANY FORMAT Card */}
                  <div
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2DDD3",
                      borderRadius: "13px",
                      padding: "11px 15px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        color: "#6E766E",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      ANSWER IN ANY FORMAT
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {[
                        { label: 'Type and Draw', icon: '⌨', highlight: false },
                        { label: 'Scan/Upload', icon: '📷', highlight: true },
                      ].map((fmt) => (
                        <span
                          key={fmt.label}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            background: fmt.highlight ? "#EBF1EA" : "#FFFFFF",
                            border: fmt.highlight ? "1px solid #C2D4C0" : "1px solid #E2DDD3",
                            color: fmt.highlight ? "#2D4438" : "#38423B",
                          }}
                        >
                          <span style={{ fontSize: "10.5px" }}>{fmt.icon}</span>
                          <span>{fmt.label}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 4. Start Button */}
                  <button
                    type="button"
                    onClick={handleStartExam}
                    style={{
                      width: "100%",
                      background: "#546C60",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "11px",
                      padding: "11px 22px",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 3px 10px rgba(84, 108, 96, 0.24)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "#43584D")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "#546C60")}
                  >
                    <span>Start →</span>
                  </button>
                </div>
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
                      <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>{"MCQ's & MSQ's"}</div>
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
                      <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 700 }}>{"MCQ's & MSQ's"}</div>
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

    const unitLabel =
      selectedUnitNumbers.length === 1
        ? `Unit ${selectedUnitNumbers[0]}`
        : `Units ${selectedUnitNumbers.join(", ")}`;

    const currentMarks = currentQ?.marks || 2;
    const rawSectionText = (currentQ?.sectionName || currentQ?.section || "").trim();
    const formattedPartLabel = (() => {
      const upper = rawSectionText.toUpperCase();
      if (upper.includes("PART A") || upper.includes("SHORT")) {
        return "PART A · SHORT ANSWER QUESTIONS";
      }
      if (upper.includes("PART B") || upper.includes("ANALYTICAL") || upper.includes("EXPLANATORY")) {
        return "PART B · ANALYTICAL QUESTIONS";
      }
      if (upper.includes("PART C") || upper.includes("ESSAY") || upper.includes("LONG")) {
        return "PART C · LONG ANSWER QUESTIONS";
      }
      if (currentMarks <= 2) return "PART A · SHORT ANSWER QUESTIONS";
      if (currentMarks <= 5) return "PART B · ANALYTICAL QUESTIONS";
      return "PART C · LONG ANSWER QUESTIONS";
    })();

    const isDescriptive = !!(
      currentQ &&
      (currentQ.modelAnswer ||
        currentQ.type === "short_answer" ||
        currentQ.type === "long_answer" ||
        currentQ.type === "descriptive" ||
        !currentQ.options ||
        currentQ.options.length === 0)
    );

    return (
      <div
        className="mock-test-container"
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          height: "100%",
          background: '#F8F5EE',
          position: "relative",
          overflowX: "hidden",
          overflowY: "auto",
          fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
          color: "#1E2822",
        }}
      >
        {/* Top Sub-Header Bar matching Mockup: "Exam Prep › Unit 1 · Timed · 12 questions" + Dark Pill Timer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 26px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E6E0D4",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <span style={{ fontWeight: 800, color: "#1E2822" }}>
              {isPreFinalTest ? "Certification Exam" : "Exam Prep."}
            </span>
            <span style={{ color: "#949A94" }}>›</span>
            <span style={{ color: "#6E766E", fontWeight: 500 }}>
              {unitLabel} · {isPrepExam && !isTimedMode ? "Untimed" : "Timed"} · {questions.length} questions
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Dark Forest Pill Timer */}
            <div
              style={{
                background: "#2D3E36",
                color: "#FFFFFF",
                padding: "5px 14px",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "12.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>
                {isSubmitted
                  ? "00:00"
                  : isPrepExam && !isTimedMode
                  ? "Untimed"
                  : formatTime(secondsLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Main Centered Content Area */}
        <div
          ref={questionsScrollRef}
          style={{
            flex: 1,
            width: "100%",
            maxWidth: "880px",
            margin: "0 auto",
            padding: "24px 24px 56px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Submitted Summary Banner */}
          {isSubmitted && (
            <div
              style={{
                background: "#F2F6F3",
                border: "1.5px solid #546C60",
                borderRadius: "14px",
                padding: "14px 20px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#2D4438" }}>
                  ✓ Exam Submitted — Review Your Answers
                </div>
                <div style={{ fontSize: "12px", color: "#6E766E", marginTop: "2px" }}>
                  You answered {answeredCount} of {questions.length} questions. Inspect model answers below or finish.
                </div>
              </div>
              <button
                type="button"
                onClick={onComplete}
                style={{
                  background: "#546C60",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "999px",
                  padding: "8px 20px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {"Finish & Continue →"}
              </button>
            </div>
          )}

          {/* Section / Part Pill above the Card */}
          {currentQ && (
            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#EBF1EA",
                  border: "1px solid #C5D6CC",
                  borderRadius: "10px",
                  padding: "6px 12px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    color: "#2D4438",
                    textTransform: "uppercase",
                  }}
                >
                  {formattedPartLabel}
                </span>
                <span
                  style={{
                    background: "#546C60",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {currentMarks} {currentMarks === 1 ? "mark" : "marks"}
                </span>
              </div>

              {/* Subtle Question Dots / Quick Switcher */}
              {questions.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                  {questions.map((qItem, idx) => {
                    const isCurr = idx === currentQuestionIdx;
                    const hasAns =
                      qItem.options && qItem.options.length > 0
                        ? (answers[qItem.id] || []).length > 0
                        : !!(textAnswers[qItem.id] && textAnswers[qItem.id].trim().length > 0);
                    return (
                      <button
                        key={qItem.id}
                        type="button"
                        onClick={() => setCurrentQuestionIdx(idx)}
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "7px",
                          border: isCurr
                            ? "1.5px solid #546C60"
                            : hasAns
                            ? "1px solid #7C8F6A"
                            : "1px solid #E2DDD3",
                          background: isCurr
                            ? "#546C60"
                            : hasAns
                            ? "#EBF1EA"
                            : "#FFFFFF",
                          color: isCurr
                            ? "#FFFFFF"
                            : hasAns
                            ? "#2D4438"
                            : "#6E766E",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Active Question Card */}
          {currentQ && (
            <div
              key={currentQ.id}
              id={`prep-q-${currentQuestionIdx}`}
              style={{
                width: "100%",
                background: "#FFFFFF",
                borderRadius: "18px",
                border: "1px solid #E6E0D4",
                boxShadow: "0 2px 10px rgba(30, 40, 34, 0.03)",
                padding: "26px 30px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                boxSizing: "border-box",
              }}
            >
              {isDescriptive ? (
                <DescriptiveQuestionCard
                  question={currentQ}
                  qIdx={currentQuestionIdx}
                  textAnswer={textAnswers[currentQ.id] || ""}
                  onAnswerChange={(val) => handleTextAnswerChange(currentQ.id, val)}
                  onClearAnswer={() => handleClearSelection(currentQ.id)}
                  hasPrev={currentQuestionIdx > 0}
                  onPrevQuestion={() => {
                    if (currentQuestionIdx > 0) {
                      setCurrentQuestionIdx((prev) => prev - 1);
                    }
                  }}
                  isLastQuestion={currentQuestionIdx === questions.length - 1}
                  onNextQuestion={() => {
                    if (currentQuestionIdx < questions.length - 1) {
                      setCurrentQuestionIdx((prev) => prev + 1);
                    } else {
                      setTimerRunning(false);
                      setIsSubmitted(true);
                    }
                  }}
                  isSubmitted={isSubmitted}
                  expandedRubric={!!expandedRubrics[currentQ.id]}
                  onToggleRubric={() => toggleRubric(currentQ.id)}
                />
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", flex: 1 }}>
                      <span
                        style={{
                          flexShrink: 0,
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background: "#546C60",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Q{currentQuestionIdx + 1}
                      </span>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#1E2822", lineHeight: 1.45 }}>
                        <MarkdownView content={currentQ.text} disableGlossary={true} />
                      </div>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#7A807A", whiteSpace: "nowrap" }}>
                      {currentMarks} {currentMarks === 1 ? "mark" : "marks"}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(currentQ.options || []).map((opt, optIdx) => {
                      const isSelected = userSelected.includes(optIdx);
                      const isOptCorrect = correct.includes(optIdx);

                      let optBg = isSelected ? "#F2F6F3" : "#FFFFFF";
                      let optBorder = isSelected ? "1.5px solid #546C60" : "1px solid #E6E0D4";
                      let optColor = "#1E2822";
                      let badgeBg = isSelected ? "#546C60" : "#F3EFE8";
                      let badgeColor = isSelected ? "#FFFFFF" : "#49524C";

                      if (isSubmitted) {
                        if (isOptCorrect) {
                          optBg = "#ECFDF5";
                          optBorder = "1.5px solid #10B981";
                          optColor = "#065F46";
                          badgeBg = "#10B981";
                          badgeColor = "#FFFFFF";
                        } else if (isSelected) {
                          optBg = "#FEF2F2";
                          optBorder = "1.5px solid #EF4444";
                          optColor = "#991B1B";
                          badgeBg = "#EF4444";
                          badgeColor = "#FFFFFF";
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleOptionClick(currentQ.id, optIdx, currentQ.type === "msq" ? "msq" : "mcq")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "12px 16px",
                            borderRadius: "12px",
                            background: optBg,
                            border: optBorder,
                            color: optColor,
                            fontSize: "13.5px",
                            cursor: isSubmitted ? "default" : "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "7px",
                              background: badgeBg,
                              color: badgeColor,
                              fontWeight: 700,
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <div style={{ flex: 1, fontWeight: 500 }}>
                            <MarkdownView content={opt.replace(/[\x0c\u000c]/g, "\\f").replace(/♠rac/g, "\\frac").replace(/♠/g, "\\f")} disableGlossary={true} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleClearSelection(currentQ.id)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "999px",
                        border: "1px solid #DFD9CE",
                        background: "#FFFFFF",
                        color: "#38423B",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear Answer
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#6E766E" }}>
                        ✓ Draft saved
                      </span>
                      {currentQuestionIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentQuestionIdx((prev) => prev - 1)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "999px",
                            border: "1px solid #DFD9CE",
                            background: "#FAF8F4",
                            color: "#38423B",
                            fontSize: "12.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ← Prev
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (currentQuestionIdx < questions.length - 1) {
                            setCurrentQuestionIdx((prev) => prev + 1);
                          } else {
                            setTimerRunning(false);
                            setIsSubmitted(true);
                          }
                        }}
                        style={{
                          padding: "8px 22px",
                          borderRadius: "999px",
                          border: "none",
                          background: "#546C60",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(84, 108, 96, 0.24)",
                        }}
                      >
                        {currentQuestionIdx === questions.length - 1 ? "Submit →" : "Next →"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
                    <MarkdownView content={q.text} disableGlossary={true} />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(q.options || []).map((opt, optIdx) => {
                      const isSelected = userSelected.includes(optIdx);
                      const isOptCorrect = correct.includes(optIdx);
                      const isEven = optIdx % 2 === 0;

                      // Alternating lighter (#ffffff) and darker (#f1f6f3) shades:
                      let optBg = isEven ? "#ffffff" : "#f1f6f3";
                      let optBorder = isEven ? "1.5px solid #e2e8f0" : "1.5px solid #cad9cf";
                      let optColor = "#1e293b";

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
                            <MarkdownView content={opt.replace(/[\x0c\u000c]/g, '\\f').replace(/♠rac/g, '\\frac').replace(/♠/g, '\\f')} disableGlossary={true} />
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
              {"Finish & Continue →"}
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
