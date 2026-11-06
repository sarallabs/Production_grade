import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getChapterExamQuestions, getAssessments, getCatalog, getVisibleBoardIds } from '../data/contentRepository';
import type { CatalogSubject } from '../data/contentRepository';
import type { MCQQuestion, MSQQuestion } from '../utils/assessmentTypes';
import MarkdownView from '../components/MarkdownView';

export function cleanLatexString(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x0c\u000c]/g, '\\f')
    .replace(/♠rac/g, '\\frac')
    .replace(/♠/g, '\\f')
    .replace(/(?<!\\)\bfrac\{/g, '\\frac{')
    .replace(/(?<!\\)\bsum_/g, '\\sum_')
    .replace(/(?<!\\)\bint\b/g, '\\int')
    .replace(/(?<!\\)\blangle\b/g, '\\langle')
    .replace(/(?<!\\)\brangle\b/g, '\\rangle');
}

interface MatrixRow {
  unit: string;
  easy: number;
  medium: number;
  hard: number;
}

interface Question {
  id: string;
  number: number;
  unit: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'mcq' | 'msq';
  text: string;
  options: { label: string; text: string }[];
  correctIndices: number[];
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  professorName: string;
  professorTitle: string;
  professorAvatar?: string;
  university: string;
  units: string[];
  fallbackOptions: string[];
  defaultQuestions: string[];
}

export const SUBJECT_METADATA: Record<string, SubjectInfo> = {
  anu_physics: {
    id: 'anu_physics',
    name: 'Quantum Mechanics (M.Sc Physics)',
    code: 'PHY-501',
    professorName: 'Prof R.V.S.S.N. Ravikumar',
    professorTitle: 'Professor & Head, Dept. of Physics',
    university: 'Acharya Nagarjuna University',
    units: [
      'Unit 1: Relativistic QM & Dirac Theory',
      'Unit 2: Quantum Field Theory',
      'Unit 3: Scattering Theory & S-Matrix',
      'Unit 4: Quantum Mechanics & QED',
      'Unit 5: Advanced Quantum Electrodynamics',
    ],
    fallbackOptions: [
      '$\\hbar \\omega / 2$',
      '$\\hbar \\omega$',
      '$0$',
      '$2 \\hbar \\omega$',
    ],
    defaultQuestions: [
      'What is the zero-point energy of a quantized EM field mode of angular frequency $\\omega$?',
      'In Dirac theory, what are the matrix components of the velocity operator $\\vec{v}$?',
      'Which wave equation is relativistic and accounts for spin-1/2 particles?',
      'What physical phenomenon is predicted by the negative energy solutions of the Dirac equation?',
      'Which operator commutes with the Dirac Hamiltonian in a spherical potential?',
    ],
  },
  anu_characterization: {
    id: 'anu_characterization',
    name: 'Material Characterization Techniques',
    code: 'PHY-502',
    professorName: 'Prof R.V.S.S.N. Ravikumar',
    professorTitle: 'Professor & Head, Dept. of Physics',
    university: 'Acharya Nagarjuna University',
    units: [
      'Unit 1: X-Ray Diffraction (XRD)',
      'Unit 2: Electron Microscopy (SEM/TEM)',
      'Unit 3: Spectroscopic Analysis (FTIR/Raman)',
      'Unit 4: Thermal Analysis (TGA/DSC)',
      'Unit 5: Surface Profile Characterization',
    ],
    fallbackOptions: [
      'Rietveld whole-pattern profile fitting',
      'Debye-Scherrer line broadening analysis',
      'Bragg diffraction angle measurement',
      'Laue transmission geometry',
    ],
    defaultQuestions: [
      'What does the profile function $\\phi$ model in Rietveld refinement?',
      'Which electron microscopy technique yields high-resolution 3D surface topography?',
      'What is the primary physical principle behind Fourier Transform Infrared (FTIR) Spectroscopy?',
      'In Differential Scanning Calorimetry (DSC), what does endothermic peak area represent?',
    ],
  },
  management: {
    id: 'management',
    name: 'Management & Marketing Strategies',
    code: 'MBA-101',
    professorName: 'Prof. Sivarama Prasad Ramineni',
    professorTitle: 'Professor & Dean, Dept. of Management',
    university: 'Acharya Nagarjuna University',
    units: [
      'Unit 1: Strategic Management & Leadership',
      'Unit 2: Consumer Behavior & Market Research',
      'Unit 3: Brand Positioning & Equity',
      'Unit 4: Digital Marketing & Analytics',
      'Unit 5: Global Supply Chain & Operations',
    ],
    fallbackOptions: [
      'Demographic factors',
      'Psychographic profiling',
      'Geographic variables',
      'Behavioral characteristics',
    ],
    defaultQuestions: [
      'Which of the following best describes core strategic management principles?',
      'How does psychographic segmentation differ from demographic segmentation?',
      'What is the primary goal of brand equity evaluation in modern marketing?',
    ],
  },
  ento_131: {
    id: 'ento_131',
    name: 'Fundamentals of Entomology',
    code: 'ENTO-131',
    professorName: 'Dr. Cherukuri Sreenivasa Rao',
    professorTitle: 'Dean of Agriculture(I/c)',
    professorAvatar: '/prof-rao.jpg',
    university: 'Acharya N.G. Ranga Agricultural University',
    units: [
      'Unit 1: Insect Digestive System',
      'Unit 2: Insect Physiology & Development',
      'Unit 3: Insect Classification & Taxonomy',
      'Unit 4: Ecology & Behavior of Insects',
      'Unit 5: Economic Entomology & Pest Management',
    ],
    fallbackOptions: [
      'Foregut (Stomodeum)',
      'Midgut (Mesenteron)',
      'Hindgut (Proctodeum)',
      'Malpighian tubules',
    ],
    defaultQuestions: [
      'Which part of the insect digestive system is primarily responsible for nutrient absorption?',
      'What is the function of the peritrophic membrane in the insect midgut?',
      'Which structures are the primary excretory organs in insects?',
    ],
  },
};

const INITIAL_AUTO_MATRIX: MatrixRow[] = [
  { unit: 'Unit 1', easy: 4, medium: 4, hard: 4 },
  { unit: 'Unit 2', easy: 4, medium: 4, hard: 4 },
  { unit: 'Unit 3', easy: 4, medium: 4, hard: 4 },
  { unit: 'Unit 4', easy: 4, medium: 4, hard: 4 },
  { unit: 'Unit 5', easy: 4, medium: 4, hard: 4 },
];

const INITIAL_MANUAL_MATRIX: MatrixRow[] = [
  { unit: 'Unit 1', easy: 0, medium: 0, hard: 0 },
  { unit: 'Unit 2', easy: 0, medium: 0, hard: 0 },
  { unit: 'Unit 3', easy: 0, medium: 0, hard: 0 },
  { unit: 'Unit 4', easy: 0, medium: 0, hard: 0 },
  { unit: 'Unit 5', easy: 0, medium: 0, hard: 0 },
];

const INITIAL_QUESTIONS: Question[] = [];

// Algorithm to divide total questions across 5 Units and 3 Difficulty levels (15 matrix slots)
const calculateAutoMatrix = (total: number | string): MatrixRow[] => {
  const num = Math.max(0, parseInt(String(total)) || 0);
  const units = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

  if (num === 0) {
    return units.map((u) => ({ unit: u, easy: 4, medium: 4, hard: 4 }));
  }

  const base = Math.floor(num / 15);
  let remainder = num % 15;

  const matrix: MatrixRow[] = units.map((u) => ({
    unit: u,
    easy: base,
    medium: base,
    hard: base,
  }));

  const diffs: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  let diffIdx = 0;
  let unitIdx = 0;

  while (remainder > 0) {
    matrix[unitIdx][diffs[diffIdx]] += 1;
    remainder--;

    unitIdx++;
    if (unitIdx >= units.length) {
      unitIdx = 0;
      diffIdx = (diffIdx + 1) % 3;
    }
  }

  return matrix;
};

export default function ExaminerConsole() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Subject and Chapter selection
  const initialSub = searchParams.get('sId') || searchParams.get('subjectId') || 'anu_physics';
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    SUBJECT_METADATA[initialSub] ? initialSub : 'anu_physics'
  );
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(4);

  const activeSubjectInfo = SUBJECT_METADATA[selectedSubjectId] || SUBJECT_METADATA.anu_physics;

  // Mode Selection: 'auto' | 'manual' | null (No default selection; hidden until user picks)
  const [mode, setMode] = useState<'auto' | 'manual' | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Exam Details
  const [examName, setExamName] = useState('Certification Exam');
  const [totalQuestions, setTotalQuestions] = useState<number | string>('');
  const [durationMinutes, setDurationMinutes] = useState<number | string>('');

  // Question Matrix Data (Auto Mode matrix dynamically updates based on totalQuestions)
  const [autoMatrix, setAutoMatrix] = useState<MatrixRow[]>(INITIAL_AUTO_MATRIX);
  const [manualMatrix, setManualMatrix] = useState<MatrixRow[]>(INITIAL_MANUAL_MATRIX);

  // Re-calculate autoMatrix whenever totalQuestions input changes
  useEffect(() => {
    if (totalQuestions !== '') {
      setAutoMatrix(calculateAutoMatrix(totalQuestions));
    }
  }, [totalQuestions]);

  const [availableSubjects, setAvailableSubjects] = useState<CatalogSubject[]>([]);

  useEffect(() => {
    getCatalog().then(catalog => {
      const visibleIds = getVisibleBoardIds();
      const visibleBoards = catalog.boards.filter(b => visibleIds.includes(b.id));
      const subjects: CatalogSubject[] = [];
      visibleBoards.forEach(b => {
        b.classes.forEach(c => {
          c.subjects.forEach(s => subjects.push(s));
        });
      });
      setAvailableSubjects(subjects);
      
      // If the current selectedSubjectId is not in the list, set it to the first available one
      if (subjects.length > 0 && !subjects.find(s => s.id === selectedSubjectId)) {
        setSelectedSubjectId(subjects[0].id);
      }
    });
  }, []);

  // Questions List (Initially empty, populated when user clicks "Generate")
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [showPublishSuccess, setShowPublishSuccess] = useState(false);

  // Helper to load pooled questions from folder assets
  const fetchRealFolderPool = async (sub: string, ch: number) => {
    let pool: (MCQQuestion | MSQQuestion)[] = [];
    let chaptersToFetch = [ch];
    if (sub === 'anu_physics') chaptersToFetch = [4, 1];
    else if (sub === 'anu_characterization') chaptersToFetch = [5];
    else if (sub === 'management') chaptersToFetch = [1, 2];
    else if (sub === 'ento_131') chaptersToFetch = [1, 2];
    for (const cNum of chaptersToFetch) {
      const cert = await getChapterExamQuestions(sub, cNum, 'certification');
      const preFinal = await getChapterExamQuestions(sub, cNum, 'pre_final');
      const mock = await getChapterExamQuestions(sub, cNum, 'mock');
      const assessEasy = await getAssessments(sub, cNum, 'beginner');
      const assessMed = await getAssessments(sub, cNum, 'intermediate');
      const assessHard = await getAssessments(sub, cNum, 'advanced');

      pool = [...pool, ...cert, ...preFinal, ...mock, ...(assessEasy as any), ...(assessMed as any), ...(assessHard as any)];
    }

    const seen = new Set<string>();
    const cleanedPool: (MCQQuestion | MSQQuestion)[] = [];
    for (const q of pool) {
      if (!q || !q.q || (q.type !== 'mcq' && q.type !== 'msq')) continue;
      const key = q.q.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        cleanedPool.push(q as MCQQuestion | MSQQuestion);
      }
    }
    return cleanedPool;
  };

  // Handle Publish Action
  const handlePublish = () => {
    setShowPublishSuccess(true);
    setNotification('Certification Exam Paper Published Successfully!');
  };

  // Current Matrix depending on selected Mode
  const activeMatrix = mode === 'auto' ? autoMatrix : manualMatrix;

  // Compute Column Sums
  const totalEasy = activeMatrix.reduce((sum, r) => sum + r.easy, 0);
  const totalMedium = activeMatrix.reduce((sum, r) => sum + r.medium, 0);
  const totalHard = activeMatrix.reduce((sum, r) => sum + r.hard, 0);
  const computedTotal = totalEasy + totalMedium + totalHard;

  // Compute Difficulty Percentages
  const easyPercent = computedTotal > 0 ? Math.round((totalEasy / computedTotal) * 100) : 0;
  const mediumPercent = computedTotal > 0 ? Math.round((totalMedium / computedTotal) * 100) : 0;
  const hardPercent = computedTotal > 0 ? Math.round((totalHard / computedTotal) * 100) : 0;

  // Handle Manual Matrix Input Change
  const handleMatrixChange = (index: number, field: 'easy' | 'medium' | 'hard', value: number) => {
    const newVal = Math.max(0, isNaN(value) ? 0 : value);
    const updated = [...manualMatrix];
    updated[index] = { ...updated[index], [field]: newVal };
    setManualMatrix(updated);
  };

  // Generate / Assemble Questions Action using real folder data
  const handleGenerate = async () => {
    const targetNum = parseInt(String(totalQuestions)) || 0;

    // Validation for Manual Mode: Verify matrix total matches expected totalQuestions input
    if (mode === 'manual' && targetNum > 0 && computedTotal !== targetNum) {
      if (computedTotal < targetNum) {
        const diff = targetNum - computedTotal;
        setNotification(
          `You are short by ${diff} question${diff > 1 ? 's' : ''}! Expected ${targetNum} questions, but matrix has ${computedTotal}. Please add ${diff} more question${diff > 1 ? 's' : ''}.`
        );
      } else {
        const diff = computedTotal - targetNum;
        setNotification(
          `You are over target by ${diff} question${diff > 1 ? 's' : ''}! Expected ${targetNum} questions, but matrix has ${computedTotal}. Please remove ${diff} question${diff > 1 ? 's' : ''}.`
        );
      }
      return;
    }

    setIsGenerating(true);
    setNotification(mode === 'auto' ? `AI is pulling real questions from folder data & balancing ${targetNum || 60} questions...` : `Assembling question paper from folder data (${computedTotal} questions)...`);

    try {
      const folderPool = await fetchRealFolderPool(selectedSubjectId, selectedChapterNum);
      const generatedList: Question[] = [];
      let qNum = 1;
      let poolIdx = 0;

      activeMatrix.forEach((r) => {
        const uName = r.unit;
        const difficulties: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];
        const counts = [r.easy, r.medium, r.hard];

        difficulties.forEach((diff, dIdx) => {
          const count = counts[dIdx];
          for (let i = 0; i < count; i++) {
            const rawQ = folderPool.length > 0 ? folderPool[poolIdx % folderPool.length] : null;
            poolIdx++;

            const optionsText = rawQ && rawQ.options && rawQ.options.length > 0
              ? rawQ.options
              : activeSubjectInfo.fallbackOptions;

            const isMsq = rawQ?.type === 'msq' || (rawQ && Array.isArray(rawQ.answer) && rawQ.answer.length > 1);
            const type: 'mcq' | 'msq' = isMsq ? 'msq' : 'mcq';

            let correctIndices: number[] = [0];
            if (rawQ) {
              if (Array.isArray(rawQ.answer)) {
                correctIndices = rawQ.answer.map((a: number) => Math.min(Math.max(0, a), optionsText.length - 1));
              } else if (typeof rawQ.answer === 'number') {
                correctIndices = [Math.min(Math.max(0, rawQ.answer), optionsText.length - 1)];
              }
            }

            const fallbackText = activeSubjectInfo.defaultQuestions[(qNum - 1) % activeSubjectInfo.defaultQuestions.length];

            generatedList.push({
              id: `gen-${qNum}`,
              number: qNum,
              unit: uName,
              difficulty: diff,
              type,
              text: rawQ?.q || `[${uName} - ${diff}] ${fallbackText}`,
              options: optionsText.map((opt, oIdx) => ({
                label: String.fromCharCode(65 + oIdx),
                text: opt,
              })),
              correctIndices,
            });
            qNum++;
          }
        });
      });

      setQuestions(generatedList);
      setTotalQuestions(generatedList.length);
      setHasGenerated(true);
      setIsGenerating(false);
      setNotification(`Exam paper successfully generated from ${activeSubjectInfo.name} folder assets! ${generatedList.length} questions ready for review.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error("Failed to generate exam from folder data", err);
      setIsGenerating(false);
      setNotification('Failed to load question paper from folder assets.');
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const [swappingId, setSwappingId] = useState<string | null>(null);

  // Swap / Regenerate single question with real folder item bank
  const handleSwapQuestion = async (qId: string) => {
    setSwappingId(qId);
    setNotification('Swapping question with folder item bank...');

    try {
      const folderPool = await fetchRealFolderPool(selectedSubjectId, selectedChapterNum);
      const usedTexts = new Set(questions.map((q) => q.text.toLowerCase()));
      const available = folderPool.filter((q) => !usedTexts.has(q.q.toLowerCase()));
      const replacement = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : (folderPool.length > 0 ? folderPool[Math.floor(Math.random() * folderPool.length)] : null);

      if (replacement) {
        const optionsText = replacement.options && replacement.options.length > 0
          ? replacement.options
          : activeSubjectInfo.fallbackOptions;

        const isMsq = replacement.type === 'msq' || (Array.isArray(replacement.answer) && replacement.answer.length > 1);
        const type: 'mcq' | 'msq' = isMsq ? 'msq' : 'mcq';

        let correctIndices: number[] = [0];
        if (Array.isArray(replacement.answer)) {
          correctIndices = replacement.answer.map((a: number) => Math.min(Math.max(0, a), optionsText.length - 1));
        } else if (typeof replacement.answer === 'number') {
          correctIndices = [Math.min(Math.max(0, replacement.answer), optionsText.length - 1)];
        }

        setQuestions((prev) =>
          prev.map((q) => {
            if (q.id === qId) {
              return {
                ...q,
                type,
                text: replacement.q,
                options: optionsText.map((opt, oIdx) => ({
                  label: String.fromCharCode(65 + oIdx),
                  text: opt,
                })),
                correctIndices,
              };
            }
            return q;
          })
        );
      }
    } catch (e) {
      console.error("Swap failed", e);
    } finally {
      setSwappingId(null);
      setNotification('Question successfully swapped with folder alternative!');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a',
        paddingBottom: '80px',
      }}
    >
      {/* Global CSS to disable spin buttons & define question animations */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        @keyframes swapCardPulse {
          0% { transform: scale(1); opacity: 0.6; border-color: #e2e8f0; background-color: #f8fafc; }
          50% { transform: scale(0.985); opacity: 0.25; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59,130,246,0.15); background-color: #f1f5f9; }
          100% { transform: scale(1); opacity: 0.6; border-color: #e2e8f0; background-color: #f8fafc; }
        }

        @keyframes rotateSwapIcon {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes fadeInUpCard {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .question-card-animated {
          animation: fadeInUpCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .question-card-swapping {
          animation: swapCardPulse 2s ease-in-out infinite !important;
          pointer-events: none;
        }

        .swap-btn-spinning svg {
          animation: rotateSwapIcon 0.8s linear infinite !important;
        }

        .questions-list-generating {
          opacity: 0.5;
          pointer-events: none;
          filter: grayscale(0.2);
          transition: all 0.3s ease;
        }
      `}</style>

      {/* ── Top Header Navigation Bar ── */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1.5px solid #e2e8f0',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
          <button
            onClick={() => navigate('/config')}
            title="Back to Config"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              transition: 'all 0.2s ease',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Graduation Cap Badge Icon */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              Examiner Console
            </h1>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', margin: 0 }}>
              Create, Review & Publish Exams
            </p>
          </div>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            {/* Examiner User Badge (Dynamic Professor Name & Title) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '10px 18px',
                borderRadius: '20px',
                background: '#ffffff',
                border: '1.5px solid #f1f5f9',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: activeSubjectInfo.professorAvatar ? 'transparent' : (selectedSubjectId.includes('physics') ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #c026d3 0%, #9333ea 100%)'),
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {activeSubjectInfo.professorAvatar ? (
                  <img src={activeSubjectInfo.professorAvatar} alt={activeSubjectInfo.professorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  selectedSubjectId.includes('physics') ? 'RR' : 'SP'
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600, lineHeight: '1.2' }}>
                  {activeSubjectInfo.professorTitle}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: '1.2', marginTop: '2px' }}>
                  {activeSubjectInfo.professorName}
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
                  {activeSubjectInfo.university}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            maxWidth: '1120px',
            margin: '16px auto 0',
            padding: '12px 20px',
            background: notification.startsWith('⚠️') ? '#fef2f2' : '#eff6ff',
            border: notification.startsWith('⚠️') ? '1.5px solid #fca5a5' : '1.5px solid #93c5fd',
            borderRadius: '12px',
            color: notification.startsWith('⚠️') ? '#dc2626' : '#1d4ed8',
            fontWeight: 700,
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: notification.startsWith('⚠️') ? '0 4px 12px rgba(220,38,38,0.1)' : '0 4px 12px rgba(59,130,246,0.1)',
          }}
        >
          {notification}
        </div>
      )}

      {/* Main Console Wrapper (Sleek 1120px Max-Width Layout with 40px Side Padding) */}
      <main style={{ maxWidth: '1120px', margin: '28px auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── CARD 1: EXAM SETUP ── */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            padding: '24px 28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
          }}
        >
          {/* Section Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Exam Setup
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Configure the basic details of your exam
              </p>
            </div>
          </div>

          {/* Inputs + Mode Selectors Grid */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Input 0: Course / Subject Selector */}
            <div style={{ flex: 1, minWidth: '260px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Course / Subject
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  const newSub = e.target.value;
                  setSelectedSubjectId(newSub);
                  setHasGenerated(false);
                  setQuestions([]);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {availableSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {SUBJECT_METADATA[sub.id]?.name || sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input 1: Exam Name */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Input 2: Total Questions */}
            <div style={{ width: '180px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Total Questions
              </label>
              <input
                type="number"
                value={totalQuestions || ''}
                onChange={(e) => setTotalQuestions(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Input 3: Duration (Minutes) */}
            <div style={{ width: '200px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Duration (Minutes)
              </label>
              <input
                type="text"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                }}
              />
            </div>

            {/* Mode Selection Pills: Auto vs Manual */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              {/* Auto Mode Pill */}
              <button
                onClick={() => {
                  setMode('auto');
                  setHasGenerated(false);
                  setQuestions([]);
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  border: mode === 'auto' ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                  background: mode === 'auto' ? '#eff6ff' : '#f8fafc',
                  color: mode === 'auto' ? '#1d4ed8' : '#64748b',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'auto' ? '0 2px 8px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                <span>Auto</span>
                {mode === 'auto' && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      boxShadow: '0 0 6px #3b82f6',
                    }}
                  />
                )}
              </button>

              {/* Manual Mode Pill */}
              <button
                onClick={() => {
                  setMode('manual');
                  setHasGenerated(false);
                  setQuestions([]);
                }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  border: mode === 'manual' ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                  background: mode === 'manual' ? '#eff6ff' : '#f8fafc',
                  color: mode === 'manual' ? '#1d4ed8' : '#64748b',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: mode === 'manual' ? '0 2px 8px rgba(59,130,246,0.15)' : 'none',
                }}
              >
                <span>Manual</span>
                {mode === 'manual' && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      boxShadow: '0 0 6px #3b82f6',
                    }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── CARD 2 & 3: MATRIX & ACTION SECTION (Shown ONLY when mode is selected) ── */}
        {mode !== null && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'stretch' }}>

            {/* Left Column: Question Distribution Matrix */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1.5px solid #e2e8f0',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px 10px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      Unit Name
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      Easy
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      Medium
                    </th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      Hard
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeMatrix.map((row, idx) => (
                    <tr key={row.unit}>
                      {/* Unit Name Label */}
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '12.5px', fontWeight: 700, color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', whiteSpace: 'nowrap' }}>
                        {activeSubjectInfo.units[idx] || row.unit}
                      </td>

                      {/* Easy Cell */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={mode === 'manual' && row.easy === 0 ? '' : row.easy}
                          disabled={mode === 'auto'}
                          onChange={(e) => handleMatrixChange(idx, 'easy', parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '8px',
                            borderRadius: '10px',
                            border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0',
                            background: mode === 'manual' ? '#ffffff' : '#f8fafc',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: mode === 'manual' ? '#1d4ed8' : '#475569',
                            outline: 'none',
                          }}
                        />
                      </td>

                      {/* Medium Cell */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={mode === 'manual' && row.medium === 0 ? '' : row.medium}
                          disabled={mode === 'auto'}
                          onChange={(e) => handleMatrixChange(idx, 'medium', parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '8px',
                            borderRadius: '10px',
                            border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0',
                            background: mode === 'manual' ? '#ffffff' : '#f8fafc',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: mode === 'manual' ? '#1d4ed8' : '#475569',
                            outline: 'none',
                          }}
                        />
                      </td>

                      {/* Hard Cell */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={mode === 'manual' && row.hard === 0 ? '' : row.hard}
                          disabled={mode === 'auto'}
                          onChange={(e) => handleMatrixChange(idx, 'hard', parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '8px',
                            borderRadius: '10px',
                            border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0',
                            background: mode === 'manual' ? '#ffffff' : '#f8fafc',
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: mode === 'manual' ? '#1d4ed8' : '#475569',
                            outline: 'none',
                          }}
                        />
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#0f172a', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                      Total
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '13.5px', fontWeight: 800, color: mode === 'manual' ? '#1d4ed8' : '#475569', border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0', borderRadius: '10px', background: mode === 'manual' ? '#eff6ff' : '#f8fafc' }}>
                      {mode === 'manual' && totalEasy === 0 ? '' : totalEasy}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '13.5px', fontWeight: 800, color: mode === 'manual' ? '#1d4ed8' : '#475569', border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0', borderRadius: '10px', background: mode === 'manual' ? '#eff6ff' : '#f8fafc' }}>
                      {mode === 'manual' && totalMedium === 0 ? '' : totalMedium}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '13.5px', fontWeight: 800, color: mode === 'manual' ? '#1d4ed8' : '#475569', border: mode === 'manual' ? '1.5px solid #93c5fd' : '1.5px solid #e2e8f0', borderRadius: '10px', background: mode === 'manual' ? '#eff6ff' : '#f8fafc' }}>
                      {mode === 'manual' && totalHard === 0 ? '' : totalHard}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column: Generation Action & Summary Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                borderRadius: '20px',
                border: '1.5px solid #93c5fd',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                gap: '20px',
                boxShadow: '0 4px 16px rgba(59,130,246,0.06)',
              }}
            >
              {/* Mode Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {mode === 'auto' ? '🤖' : '✋'}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {mode === 'auto' ? 'Auto Generate Questions' : 'Manual Questions'}
                </h3>
              </div>

              {/* Summary Statistics Card */}
              <div
                style={{
                  width: '100%',
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}
              >
                {/* Row 1: Total Questions + Duration */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        {totalQuestions || (computedTotal > 0 ? computedTotal : 60)}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Total Questions</div>
                    </div>
                  </div>

                  <div style={{ height: '30px', width: '1px', background: '#e2e8f0' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                        {durationMinutes || 60}<span style={{ fontSize: '12px' }}>min</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>Duration</div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Percentage Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{easyPercent}%</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Easy</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{mediumPercent}%</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Medium</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{hardPercent}%</span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Hard</span>
                  </div>
                </div>

                {/* Row 3: Manual Mode Live Validation Status Badge */}
                {mode === 'manual' && totalQuestions !== '' && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: computedTotal === Number(totalQuestions) ? '#f0fdf4' : (computedTotal < Number(totalQuestions) ? '#fef2f2' : '#fffbeb'),
                      border: computedTotal === Number(totalQuestions) ? '1.5px solid #86efac' : (computedTotal < Number(totalQuestions) ? '1.5px solid #fca5a5' : '1.5px solid #fde68a'),
                      color: computedTotal === Number(totalQuestions) ? '#15803d' : (computedTotal < Number(totalQuestions) ? '#dc2626' : '#b45309'),
                      fontSize: '12px',
                      fontWeight: 800,
                      textAlign: 'center',
                    }}
                  >
                    {computedTotal === Number(totalQuestions)
                      ? `✅ Matrix total matches target (${computedTotal} / ${totalQuestions})`
                      : computedTotal < Number(totalQuestions)
                      ? `⚠️ Short by ${Number(totalQuestions) - computedTotal} question(s) (${computedTotal} / ${totalQuestions})`
                      : `⚠️ Over target by ${computedTotal - Number(totalQuestions)} question(s) (${computedTotal} / ${totalQuestions})`}
                  </div>
                )}
              </div>

              {/* Primary Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  maxWidth: '220px',
                  padding: '14px',
                  borderRadius: '14px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)',
                  transition: 'transform 0.2s ease, background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isGenerating ? (
                  <>
                    <svg style={{ animation: 'rotateSwapIcon 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Generating...
                  </>
                ) : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {/* ── CARD 4: GENERATED QUESTIONS LIST (Shown ONLY after clicking Generate button) ── */}
        {hasGenerated && (
          <div className={isGenerating ? 'questions-list-generating' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Generated Exam Questions ({questions.length})
            </h3>

            {questions.map((q) => (
              <div
                key={q.id}
                className={`question-card-animated ${swappingId === q.id ? 'question-card-swapping' : ''}`}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #93c5fd',
                  padding: '24px',
                  boxShadow: '0 4px 18px rgba(59,130,246,0.06)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                }}
              >
                {/* Question Header Row + Tags */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: '1.4', flex: 1, display: 'flex', gap: '8px' }}>
                    <span style={{ flexShrink: 0 }}>{q.number}.</span>
                    <div style={{ flex: 1 }}>
                      <MarkdownView content={cleanLatexString(q.text)} />
                    </div>
                  </div>

                  {/* Unit, Difficulty & Question Type Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                      #{q.unit.replace(/\s+/g, '')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                      #{q.difficulty}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: q.type === 'msq' ? '#f3e8ff' : '#eff6ff',
                        color: q.type === 'msq' ? '#7e22ce' : '#1d4ed8',
                        border: q.type === 'msq' ? '1px solid #d8b4fe' : '1px solid #bfdbfe',
                      }}
                    >
                      {q.type === 'msq' ? 'MSQ (Multiple Select)' : 'MCQ (Single Choice)'}
                    </span>
                  </div>
                </div>

                {/* Options List A, B, C, D (Markdown & KaTeX Rendered) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt) => (
                    <div
                      key={opt.label}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      {/* Option Indicator: Square Checkbox for MSQ, Round Radio Circle for MCQ */}
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: q.type === 'msq' ? '4px' : '50%',
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <strong style={{ flexShrink: 0 }}>{opt.label}.</strong>
                        <div style={{ flex: 1 }}>
                          <MarkdownView content={cleanLatexString(opt.text)} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom Row: Green Highlighted Correct Answer + Blue Swap Button */}
                  <div
                    style={{
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    {/* Green Correct Answer Box */}
                    <div
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1.5px solid #22c55e',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 8px rgba(34,197,94,0.12)',
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          background: '#22c55e',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {q.type === 'msq' ? 'Correct Answers (Multiple Select):' : 'Correct Answer:'}
                        </span>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                          {q.correctIndices.map((idx) => (
                            <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <strong style={{ flexShrink: 0 }}>{q.options[idx]?.label}.</strong>
                              <MarkdownView content={cleanLatexString(q.options[idx]?.text || '')} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Swap Single Question Action Button */}
                    <button
                      onClick={() => handleSwapQuestion(q.id)}
                      title="Swap / Regenerate this question with AI"
                      className={swappingId === q.id ? 'swap-btn-spinning' : ''}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#3b82f6',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#3b82f6';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 11A8 8 0 0 0 4.5 9M4.5 9H9M4.5 9V4.5" />
                        <path d="M4 13a8 8 0 0 0 15.5 2m0 0H15m0.5 0V19.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* ── PUBLISH EXAM BUTTON (Single Button at end of all questions) ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingBottom: '8px' }}>
              <button
                onClick={handlePublish}
                style={{
                  padding: '14px 36px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                  transition: 'transform 0.2s ease, boxShadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(34, 197, 94, 0.4)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                Publish
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── PUBLISH SUCCESS OVERLAY MODAL ── */}
      {showPublishSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '36px 32px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 10px #f0fdf4',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>

            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Exam Published Successfully!
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                <strong>{examName || 'Certification Exam'}</strong> ({questions.length} questions in {mode === 'auto' ? 'Auto' : 'Manual'} mode) is now live and published.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
              <button
                onClick={() => setShowPublishSuccess(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Keep Editing
              </button>
              <button
                onClick={() => navigate('/config')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                }}
              >
                Go to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
