import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFocusMode } from '@/context/FocusModeContext';
import MarkdownView from '@/components/MarkdownView';
import { getFallbackTenantId, getCloudUiCopy } from '@/tenant/TenantProvider';
import { registryClient } from '@/data/registryClient';
import { trackCloudEvent } from '@/utils/analytics';

export interface QuestionData {
  id: number;
  text: string;
  shortAnswer: string;
  longAnswer: string;
  chapter: string;
  section: string;
  marks: number;
  subjectId: string;
  chapterNumber: number;
  year?: number;
  frequency?: number;
  repeatedYears?: string;
  yearRange?: string;
  examSession?: string;
}

export const MATH_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'Verify if 4 is a zero of the polynomial p(x) = x² - 3x - 4.',
    shortAnswer: 'Yes. p(4) = 16 − 12 − 4 = 0, so 4 is a zero.',
    longAnswer:
      'A real number k is a zero of p(x) if p(k) = 0. Substituting x = 4 into p(x), we get p(4) = (4)² − 3(4) − 4 = 16 − 12 − 4 = 0. Since p(4) = 0, 4 is indeed a zero of the polynomial.',
    chapter: 'Chp: 2 (Polynomials)',
    section: 'Paper 1 - Section A',
    marks: 3,
    subjectId: 'maths',
    chapterNumber: 2,
    year: 2022,
  },
  {
    id: 2,
    text: 'The graph of y = p(x) intersects the x-axis at exactly two distinct points. What is the number of zeroes of p(x) and what type of polynomial could it be?',
    shortAnswer: '2 zeroes; it is a quadratic polynomial.',
    longAnswer:
      'The zeroes of a polynomial are the x-coordinates of the points where its graph intersects the x-axis. Since the graph intersects the x-axis at 2 distinct points, p(x) has 2 zeroes. This indicates it is a quadratic polynomial (which forms a parabola).',
    chapter: 'Chp: 2 (Polynomials)',
    section: 'Paper 1 - Section B',
    marks: 5,
    subjectId: 'maths',
    chapterNumber: 2,
    year: 2023,
  },
  {
    id: 3,
    text: 'If α and β are two zeroes of a polynomial f(x) = px² - 2x + 3p and α + β = αβ, then value of p is:',
    shortAnswer: 'p = 2/3',
    longAnswer:
      'Sum of zeroes (α + β) = -(-2)/p = 2/p. Product of zeroes (αβ) = 3p/p = 3. Since α + β = αβ, we have 2/p = 3. Therefore, p = 2/3.',
    chapter: 'Chp: 2 (Polynomials)',
    section: 'Section A (MCQ)',
    marks: 1,
    subjectId: 'maths',
    chapterNumber: 2,
    year: 2024,
  },
  {
    id: 4,
    text: 'The graph of y = f(x) is given. It intersects the x-axis at exactly two points. The number of distinct zeroes of y = f(x) is:',
    shortAnswer: '2',
    longAnswer:
      'The zeroes of a polynomial f(x) correspond to the points where the graph y = f(x) intersects the x-axis. Since the given graph intersects the x-axis at exactly 2 distinct points, the number of distinct zeroes is 2.',
    chapter: 'Chp: 2 (Polynomials)',
    section: 'Section A (MCQ)',
    marks: 1,
    subjectId: 'maths',
    chapterNumber: 2,
    year: 2024,
  }
];

export const ENGLISH_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'Why did Lencho say the raindrops were like \'new coins\'?',
    shortAnswer: 'Because the rain would bring a good harvest, resulting in prosperity.',
    longAnswer:
      'Lencho compared the raindrops to \'new coins\' because his crops were ready for harvest, and they only needed a good downpour. A good harvest would bring him money and prosperity. Therefore, he saw the raindrops as a sign of forthcoming wealth, likening them to physical coins.',
    chapter: 'Chp: 1 (A Letter to God)',
    section: 'Literature - Short Answer',
    marks: 2,
    subjectId: 'english',
    chapterNumber: 1,
    year: 2024,
  },
  {
    id: 2,
    text: 'How did the postmaster react to Lencho\'s letter, and what did he decide to do?',
    shortAnswer: 'He initially laughed but then admired Lencho\'s faith. He decided to collect money to help him.',
    longAnswer:
      'Initially, the postmaster broke out laughing when he saw the letter addressed to God. However, he quickly became serious and was deeply moved by Lencho\'s unwavering faith. Not wanting to shake this immense faith, he decided to answer the letter. He collected money from his employees, gave a part of his salary, and sent it to Lencho signed as \'God\'.',
    chapter: 'Chp: 1 (A Letter to God)',
    section: 'Literature - Long Answer',
    marks: 5,
    subjectId: 'english',
    chapterNumber: 1,
    year: 2023,
  },
];

export const MANNU_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'نظم و نسق عامہ کا بانی کسے تسلیم کیا جاتا ہے؟ (Who is considered the founder of Public Administration?)',
    shortAnswer: 'ووڈرو ولسن (Woodrow Wilson)',
    longAnswer:
      'ووڈرو ولسن (Woodrow Wilson) کو نظم و نسق عامہ کا بانی (Father) تسلیم کیا جاتا ہے۔ انہوں نے 1887 میں اس موضوع پر پہلا مشہور مضمون لکھا تھا جس نے اسے ایک الگ مضمون کی حیثیت دی۔',
    chapter: 'Chp: 1 (نظم و نسق عامہ)',
    section: 'Section A - Short Answer',
    marks: 2,
    subjectId: 'pubadm_ur',
    chapterNumber: 1,
    year: 2024,
  },
  {
    id: 2,
    text: 'لوتھر گلک کے \'پوسڈ کا رب\' (POSDCORB) نظریے سے کیا مراد ہے؟ (What is meant by Luther Gulick\'s POSDCORB theory?)',
    shortAnswer: 'یہ انتظامی کاموں کی سات حصوں میں تقسیم ہے جیسے منصوبہ بندی، تنظیم وغیرہ۔',
    longAnswer:
      'لوتھر گلک نے انتظامی کاموں کو سات حصوں میں تقسیم کیا ہے جسے POSDCORB کہا جاتا ہے۔ اس میں منصوبہ بنانا (Planning)، تنظیم بنانا (Organising)، عملہ بھرتی کرنا (Staffing)، ہدایت دینا (Directing)، رابطہ قائم کرنا (Co-ordinating)، رپورٹ دینا (Reporting) اور بجٹ بنانا (Budgeting) شامل ہیں۔',
    chapter: 'Chp: 1 (نظم و نسق عامہ)',
    section: 'Section B - Long Answer',
    marks: 5,
    subjectId: 'pubadm_ur',
    chapterNumber: 1,
    year: 2023,
  },
];

export const MANAGEMENT_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'What is Market Segmentation?',
    shortAnswer: 'Dividing a broad target market into subsets of consumers with common needs or characteristics.',
    longAnswer:
      'Market segmentation is the process of dividing a broad consumer or business market into sub-groups (segments) based on shared characteristics like demographics, psychographics, or behavior. Its primary purpose is to identify high-yield segments to target with tailored marketing strategies.',
    chapter: 'Marketing Management',
    section: 'Section A - Short Answer',
    marks: 5,
    subjectId: 'management',
    chapterNumber: 1,
    year: 2018,
  },
  {
    id: 2,
    text: 'Discuss the role of marketing in a developing economy.',
    shortAnswer: 'Marketing connects production to consumption, creates employment, and improves living standards.',
    longAnswer:
      'In a developing economy, marketing acts as an engine of growth. It bridges the gap between producers and consumers, stimulates demand, and encourages mass production. By organizing distribution networks, it creates employment opportunities, enhances the standard of living, and accelerates economic development.',
    chapter: 'Marketing Management',
    section: 'Section B - Long Answer',
    marks: 15,
    subjectId: 'management',
    chapterNumber: 1,
    year: 2018,
  },
  {
    id: 3,
    text: 'Explain the concept of marketing mix in detail.',
    shortAnswer: 'The marketing mix refers to the 4Ps: Product, Price, Place, and Promotion.',
    longAnswer:
      'The marketing mix is a crucial foundational concept in marketing, commonly referred to as the 4Ps. It includes:\n1. Product: What is being sold, including features, branding, and packaging.\n2. Price: How much the product costs and the pricing strategy used.\n3. Place: Where and how the product is distributed to the customer.\n4. Promotion: How the product is communicated to the target audience (advertising, PR, sales promotions).',
    chapter: 'Marketing Mix',
    section: 'Section B - Long Answer',
    marks: 15,
    subjectId: 'management',
    chapterNumber: 2,
    year: 2019,
  },
];

export const ANU_PHYSICS_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'Derive the time-independent Schrödinger equation for a particle of mass m moving in a one-dimensional potential V(x).',
    shortAnswer: 'The time-independent Schrödinger equation is -(ħ²/2m)(d²ψ/dx²) + V(x)ψ = Eψ, derived by separating variables in the time-dependent equation Ψ(x,t) = ψ(x)e^(-iEt/ħ).',
    longAnswer:
      'To derive the time-independent Schrödinger equation, we start with the 1D time-dependent Schrödinger equation:\n- (ħ²/2m)(∂²Ψ/∂x²) + V(x)Ψ = iħ(∂Ψ/∂t)\n\nAssuming the potential V(x) is independent of time, we can look for solutions of the form Ψ(x,t) = ψ(x)φ(t) (separation of variables). Substituting this into the equation and dividing by ψ(x)φ(t), we get:\n(1/ψ) [-(ħ²/2m)(d²ψ/dx²) + V(x)ψ] = iħ(1/φ)(dφ/dt)\n\nSince the left-hand side is a function of x only and the right-hand side is a function of t only, both sides must be equal to a constant, which we identify as the total energy E of the particle.\n\nThis gives two separate equations:\n1. iħ(dφ/dt) = Eφ, which has the solution φ(t) = e^(-iEt/ħ).\n2. -(ħ²/2m)(d²ψ/dx²) + V(x)ψ = Eψ, which is the time-independent Schrödinger equation.',
    chapter: 'Quantum Mechanics',
    section: 'Section B - Long Answer',
    marks: 10,
    subjectId: 'anu_physics',
    chapterNumber: 4,
    year: 2023,
  },
  {
    id: 2,
    text: 'State the physical significance of the wave function ψ and its normalization condition.',
    shortAnswer: 'ψ(x) is a probability amplitude; |ψ(x)|² represents the probability density of finding the particle at position x. The normalization condition is ∫|ψ(x)|² dx = 1 from -∞ to +∞.',
    longAnswer:
      'According to Max Born\'s statistical interpretation, the wave function ψ(x, t) itself does not have a direct physical meaning, but its absolute square |ψ(x, t)|² represents the probability density of finding the particle at position x at time t. The probability of finding the particle within a small interval dx is |ψ(x, t)|² dx.\n\nSince the particle must exist somewhere in space, the total probability of finding it in all of space must be equal to 1 (certainty). This leads to the normalization condition:\n∫ |ψ(x, t)|² dx = 1 (integrated from -∞ to +∞)\n\nFor a wave function to be physically acceptable, it must be square-integrable so that it can be normalized by multiplying by an appropriate normalization constant.',
    chapter: 'Quantum Mechanics',
    section: 'Section A - Short Answer',
    marks: 5,
    subjectId: 'anu_physics',
    chapterNumber: 4,
    year: 2024,
  }
];

export const ANU_CHARACTERIZATION_MOCKED_QUESTIONS: QuestionData[] = [
  {
    id: 1,
    text: 'State Bragg\'s Law of X-ray diffraction and explain the terms involved.',
    shortAnswer: 'Bragg\'s Law is nλ = 2d sinθ, where n is the order of reflection, λ is the X-ray wavelength, d is the interplanar spacing, and θ is the scattering angle.',
    longAnswer:
      'Bragg\'s Law describes the condition for constructive interference of X-rays diffracted by parallel planes of a crystal lattice. When a beam of monochromatic X-rays of wavelength λ strikes a crystal with interplanar spacing d at an incident angle θ, the rays reflected from adjacent planes travel different path lengths.\n\nThe path difference between waves reflected from two adjacent parallel planes is given by 2d sinθ. For the reflected waves to interfere constructively and produce a diffraction peak, this path difference must be an integer multiple of the wavelength. This yields Bragg\'s Law:\nnλ = 2d sinθ\n\nWhere:\n- n is an integer (1, 2, 3...) representing the order of reflection.\n- λ is the wavelength of the incident X-ray beam.\n- d is the distance between adjacent lattice planes (interplanar spacing).\n- θ is the Bragg angle (angle of incidence/reflection).',
    chapter: 'Characterization Techniques',
    section: 'Section A - Short Answer',
    marks: 5,
    subjectId: 'anu_characterization',
    chapterNumber: 5,
    year: 2023,
  },
  {
    id: 2,
    text: 'Compare Scanning Electron Microscopy (SEM) and Transmission Electron Microscopy (TEM) in terms of working principle, sample preparation, and type of image obtained.',
    shortAnswer: 'SEM scans a beam over the surface to detect secondary/backscattered electrons, showing 3D surface topography. TEM passes electrons through an ultra-thin sample to show internal structural details with higher resolution.',
    longAnswer:
      'Scanning Electron Microscopy (SEM) and Transmission Electron Microscopy (TEM) are powerful electron imaging techniques, but they differ significantly:\n\n1. Working Principle:\n- SEM: A focused electron beam scans the surface of a specimen. The interaction of the beam with the specimen produces secondary electrons, backscattered electrons, and X-rays. Detectors collect these signals to build an image pixel by pixel.\n- TEM: A broad electron beam passes directly through an extremely thin specimen. The transmitted electrons form an image on a fluorescent screen or charge-coupled device (CCD) camera based on density differences.\n\n2. Sample Preparation:\n- SEM: Relatively simple. Samples must be dry and conductive. Non-conductive samples are coated with a thin layer of metal (e.g., gold or carbon).\n- TEM: Extremely complex and laborious. The specimen must be sliced to an ultra-thin thickness (typically less than 100 nm) to allow electrons to pass through.\n\n3. Type of Image & Resolution:\n- SEM: Provides a 3D-like, high-depth-of-field topographical image of the sample surface. Resolution is typically in the range of 1 to 10 nm.\n- TEM: Provides a 2D projection image showing internal structure, defects, and crystallographic details. It has much higher resolution, often down to the atomic level (less than 0.1 nm).',
    chapter: 'Characterization Techniques',
    section: 'Section B - Long Answer',
    marks: 15,
    subjectId: 'anu_characterization',
    chapterNumber: 5,
    year: 2024,
  }
];

export const AVAILABLE_SUBJECTS = [
  { id: 'maths', name: 'Mathematics (CBSE Class 10)' },
  { id: 'english', name: 'English (CBSE Class 10)' },
  { id: 'pubadm_ur', name: 'Public Administration (MANUU B.A.)' },
  { id: 'management', name: 'Management (ANU MBA)' },
  { id: 'anu_physics', name: 'Quantum Mechanics (ANU M.Sc)' },
  { id: 'anu_characterization', name: 'Characterization Techniques (ANU M.Sc)' },
];

export const SUBJECT_META: Record<string, { title: string; subtitle: string }> = {
  maths: {
    title: 'Mathematics',
    subtitle: 'CBSE Class 10 · Chapter 2 — Polynomials',
  },
  english: {
    title: 'English',
    subtitle: 'CBSE Class 10 · Chapter 1 — A Letter to God',
  },
  pubadm_ur: {
    title: 'Public Administration (Urdu)',
    subtitle: 'MANUU · B.A. · Chapter 1 — Public Administration',
  },
  management: {
    title: 'Management',
    subtitle: 'Saral Vidhya · MBA · Marketing Management',
  },
  anu_physics: {
    title: 'Quantum Mechanics',
    subtitle: 'Saral Vidhya · M.Sc · Chapter 4 — Quantum Mechanics',
  },
  anu_characterization: {
    title: 'Characterization Techniques',
    subtitle: 'Saral Vidhya · M.Sc · Chapter 5 — Characterization Techniques',
  },
};

export const QUESTIONS_MAP: Record<string, QuestionData[]> = {
  maths: MATH_MOCKED_QUESTIONS,
  english: ENGLISH_MOCKED_QUESTIONS,
  pubadm_ur: MANNU_MOCKED_QUESTIONS,
  management: MANAGEMENT_MOCKED_QUESTIONS,
  anu_physics: ANU_PHYSICS_MOCKED_QUESTIONS,
  anu_characterization: ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
};

export function QuestionCard({
  question,
  onSOS,
  defaultExpanded = true,
}: {
  question: QuestionData;
  onSOS: () => void;
  defaultExpanded?: boolean;
}) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLongAnswer, setIsLongAnswer] = useState(false);
  const [isAnswerHidden, setIsAnswerHidden] = useState(!defaultExpanded);

  const plainPreview = useMemo(() => {
    const raw = (question.shortAnswer || question.longAnswer || "").trim();
    const cleaned = raw
      .replace(/[#>*_`~-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.length > 165 ? `${cleaned.slice(0, 165)}...` : cleaned;
  }, [question.shortAnswer, question.longAnswer]);

  const budgetMinutes =
    question.marks >= 10 ? "12–15" : question.marks >= 5 ? "6–8" : "2–3";

  const yearRangeText = useMemo(() => {
    if (question.yearRange) return question.yearRange;
    if (question.repeatedYears) {
      const yrs = question.repeatedYears
        .split(",")
        .map((s) => parseInt(s.trim().replace(/[^0-9]/g, "").slice(0, 4)))
        .filter((n) => !isNaN(n));
      if (yrs.length >= 2) {
        const minY = Math.min(...yrs);
        const maxY = Math.max(...yrs);
        return minY === maxY ? `${maxY}` : `${minY}–${maxY}`;
      }
    }
    return question.year ? `2020–${question.year}` : "2020–2024";
  }, [question.yearRange, question.repeatedYears, question.year]);

  return (
    <div
      onClick={() => {
        if (isAnswerHidden) setIsAnswerHidden(false);
      }}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(30, 40, 34, 0.03)",
        border: "1px solid #E6E0D4",
        padding: "20px 24px",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#1E2822",
        cursor: isAnswerHidden ? "pointer" : "default",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Top Question Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "baseline", flex: 1 }}>
          <span
            style={{
              fontSize: "15.5px",
              color: "#B46530",
              fontWeight: 800,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Q{question.id}
          </span>
          <div
            style={{
              fontSize: "15.5px",
              color: "#1E2822",
              lineHeight: 1.45,
              fontWeight: 700,
            }}
          >
            {question.text}
          </div>
        </div>

        {/* Right Metadata Badges + Mark Completed */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span
              style={{
                background: "#F2EFE9",
                color: "#49524C",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {question.chapter}
            </span>

            {typeof question.frequency === "number" && question.frequency > 1 && (
              <span
                title={question.repeatedYears ? `Asked in: ${question.repeatedYears}` : undefined}
                style={{
                  background: "#C27D4E",
                  color: "#FFFFFF",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Asked {question.frequency}x · {yearRangeText}
              </span>
            )}

            {!isAnswerHidden && question.year && (
              <span
                style={{
                  background: "#F2EFE9",
                  color: "#49524C",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {question.examSession || `End-Sem · Dec ${question.year}`}
              </span>
            )}

            <span
              style={{
                background: "#F5EDE3",
                color: "#8C5228",
                padding: "4px 9px",
                borderRadius: "6px",
                fontWeight: 800,
                fontSize: "11px",
              }}
            >
              {question.marks}M
            </span>
          </div>

          {!isAnswerHidden && (
            <button
              type="button"
              onClick={() => setIsCompleted(!isCompleted)}
              style={{
                background: isCompleted ? "#FAF2E9" : "#FFFFFF",
                color: isCompleted ? "#9A542A" : "#38423B",
                border: isCompleted ? "1.5px solid #C88A5A" : "1px solid #DFD9CE",
                padding: "5px 14px",
                borderRadius: "999px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "11.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                transition: "all 0.15s ease",
              }}
            >
              <span>✓</span>
              <span>{isCompleted ? "Completed" : "Mark completed"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsed 1-Line Preview vs Expanded Callout + Model Answer */}
      {isAnswerHidden ? (
        <div
          style={{
            marginTop: "12px",
            paddingLeft: "12px",
            borderLeft: "3px solid #C8C1B4",
            fontSize: "12.5px",
            color: "#5A625C",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {plainPreview || "Click to view model answer..."}
        </div>
      ) : (
        <>
          {/* Dashed Callout Banner: "Attempt before you read" */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: "14px",
              background: "#FCF9F4",
              border: "1.5px dashed #DEC6B0",
              borderRadius: "12px",
              padding: "11px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "15px" }}>✍️</span>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#1E2822" }}>
                  Attempt before you read
                </div>
                <div style={{ fontSize: "11px", color: "#6E766E", marginTop: "1px" }}>
                  {question.frequency && question.frequency > 1
                    ? `This appeared ${question.frequency} times in 5 years — treat it as a mock-exam question.`
                    : "High-yield university exam question — try outlining your answer before reading."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAnswerHidden(true)}
              style={{
                background: "#BD7D52",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "999px",
                padding: "7px 16px",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {"Hide answer & try first"}
            </button>
          </div>

          {/* Model Answer Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: "14px",
              background: "#FAF8F3",
              border: "1px solid #EFECE4",
              borderRadius: "12px",
              padding: "18px 22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 800,
                  color: "#6E766E",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                MODEL ANSWER
              </span>

              <div
                style={{
                  display: "inline-flex",
                  borderRadius: "8px",
                  border: "1px solid #DFD9CE",
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsLongAnswer(false)}
                  style={{
                    cursor: "pointer",
                    padding: "4px 12px",
                    border: "none",
                    background: !isLongAnswer ? "#BD7D52" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "11.5px",
                    color: !isLongAnswer ? "#FFFFFF" : "#49524C",
                    transition: "all 0.15s ease",
                  }}
                >
                  Short
                </button>
                <button
                  type="button"
                  onClick={() => setIsLongAnswer(true)}
                  style={{
                    cursor: "pointer",
                    padding: "4px 12px",
                    border: "none",
                    background: isLongAnswer ? "#BD7D52" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "11.5px",
                    color: isLongAnswer ? "#FFFFFF" : "#49524C",
                    transition: "all 0.15s ease",
                  }}
                >
                  Long
                </button>
              </div>
            </div>

            <div style={{ fontSize: "14px", color: "#1E2822", lineHeight: 1.65 }}>
              <MarkdownView
                content={isLongAnswer ? question.longAnswer : question.shortAnswer}
                isPurpleTheme={false}
              />
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "11.5px",
                fontWeight: 700,
                color: "#B46530",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>◷</span>
              <span>
                Exam budget · {budgetMinutes} minutes of writing time for this question
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function PreviousYearQuestions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { startFocusMode } = useFocusMode();
  const [year, setYear] = useState('');

  const subjectIdFromUrl = searchParams.get('sId') || searchParams.get('subjectId') || 'maths';
  const [selectedSubject, setSelectedSubject] = useState(subjectIdFromUrl);

  const [cloudPyqBySubject, setCloudPyqBySubject] = useState<Record<string, QuestionData[]>>({});
  const [cloudAvailableSubjects, setCloudAvailableSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [cloudSubjectMeta, setCloudSubjectMeta] = useState<Record<string, { title: string; subtitle: string }>>({});
  const uiCopy = getCloudUiCopy();

  useEffect(() => {
    const tId = getFallbackTenantId();
    registryClient
      .getPracticeFallback(tId, selectedSubject)
      .then((bank) => {
        if (bank?.pyqQuestionsBySubject && typeof bank.pyqQuestionsBySubject === 'object') {
          setCloudPyqBySubject((prev) => ({ ...prev, ...bank.pyqQuestionsBySubject }));
        }
        if (Array.isArray(bank?.availableSubjects) && bank.availableSubjects.length > 0) {
          setCloudAvailableSubjects(bank.availableSubjects);
        }
        if (bank?.subjectMeta && typeof bank.subjectMeta === 'object') {
          setCloudSubjectMeta((prev) => ({ ...prev, ...bank.subjectMeta }));
        }
      })
      .catch(() => {});
  }, [selectedSubject]);
  useEffect(() => {
    const sId = searchParams.get('sId') || searchParams.get('subjectId');
    if (sId && sId !== selectedSubject) {
      setSelectedSubject(sId);
    }
  }, [searchParams, selectedSubject]);

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    trackCloudEvent(
      'pyq.subject_select',
      {
        category: 'assessment',
        subjectId: newSubject,
        toolId: 'pyq',
        label: newSubject,
      },
      true
    );
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('sId', newSubject);
        return next;
      },
      { replace: true }
    );
  };

  const handleSOS = (subjectId: string, chapterNumber: number) => {
    startFocusMode(subjectId, chapterNumber, '/previous-year-questions');
    navigate(`/subjects/${subjectId}/chapter/${chapterNumber}`);
  };

  const baseQuestions =
    cloudPyqBySubject[selectedSubject] || QUESTIONS_MAP[selectedSubject] || [];
  const activeSubjectsList =
    cloudAvailableSubjects.length > 0 ? cloudAvailableSubjects : AVAILABLE_SUBJECTS;

  const availableYearsForSubject = useMemo(() => {
    const years = baseQuestions
      .map(q => q.year)
      .filter((y): y is number => typeof y === 'number');
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [baseQuestions]);

  useEffect(() => {
    if (year && !availableYearsForSubject.includes(parseInt(year))) {
      setYear('');
    }
  }, [selectedSubject, availableYearsForSubject, year]);

  const displayQuestions = baseQuestions.filter(q => !year || q.year === parseInt(year));
  const meta =
    cloudSubjectMeta[selectedSubject] ||
    SUBJECT_META[selectedSubject] || { title: 'Previous Year Questions', subtitle: '' };

  return (
    <div className="page pyq-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
      <button
        className="back-link"
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '16px', fontSize: '16px', padding: 0 }}
      >
        {uiCopy.pyqBackButton || '← Back'}
      </button>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Subject Dropdown */}
        <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
          >
            {activeSubjectsList.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Dropdown */}
        <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
          >
            <option value="">All Years</option>
            {availableYearsForSubject.map(y => (
              <option key={y} value={y.toString()}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
        {displayQuestions.length > 0 ? (
          displayQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onSOS={() => handleSOS(q.subjectId, q.chapterNumber)}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {uiCopy.pyqEmptyState || 'No previous year questions found for the selected criteria.'}
          </div>
        )}
      </div>
    </div>
  );
}
