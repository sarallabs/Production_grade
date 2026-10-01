import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFocusMode } from '@/context/FocusModeContext';

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
}



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
  { id: 'management', name: 'Management (ANU MBA)' },
  { id: 'anu_physics', name: 'Quantum Mechanics (ANU M.Sc)' },
  { id: 'anu_characterization', name: 'Characterization Techniques (ANU M.Sc)' },
];

export const SUBJECT_META: Record<string, { title: string; subtitle: string }> = {
  management: {
    title: 'Management',
    subtitle: 'Acharya Nagarjuna University · MBA · Marketing Management',
  },
  anu_physics: {
    title: 'Quantum Mechanics',
    subtitle: 'Acharya Nagarjuna University · M.Sc · Chapter 4 — Quantum Mechanics',
  },
  anu_characterization: {
    title: 'Characterization Techniques',
    subtitle: 'Acharya Nagarjuna University · M.Sc · Chapter 5 — Characterization Techniques',
  },
};

export const QUESTIONS_MAP: Record<string, QuestionData[]> = {
  management: MANAGEMENT_MOCKED_QUESTIONS,
  anu_physics: ANU_PHYSICS_MOCKED_QUESTIONS,
  anu_characterization: ANU_CHARACTERIZATION_MOCKED_QUESTIONS,
};

export function QuestionCard({ question, onSOS }: { question: QuestionData; onSOS: () => void }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLongAnswer, setIsLongAnswer] = useState(true);

  return (
    <div style={{ flexShrink: 0, display: 'flex', gap: '16px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>

      {/* Left red accent bar */}
      <div style={{ width: '4px', background: '#fca5a5', position: 'absolute', left: 0, top: 0, bottom: 0 }} />

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', paddingLeft: '24px', display: 'flex', flexDirection: 'column' }}>

        {/* Question Row (Inline Q1) + Marks) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flex: 1 }}>
            <h2 style={{ fontSize: '16px', margin: 0, color: '#1e293b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Q{question.id})</h2>
            <div style={{ fontSize: '16px', color: '#0f172a', lineHeight: '1.5', fontWeight: 500 }}>
              {question.text}
            </div>
          </div>
          <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', color: '#334155', fontSize: '13px', marginLeft: '16px', flexShrink: 0 }}>
            {question.marks}M
          </span>
        </div>

        {/* Hashtags and Actions Row (Directly under question) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>#{question.section}</span>
            <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>#{question.chapter}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsCompleted(!isCompleted)}
              style={{
                background: isCompleted ? '#f0fdf4' : '#f8fafc',
                color: isCompleted ? '#15803d' : '#475569',
                border: `1px solid ${isCompleted ? '#86efac' : '#cbd5e1'}`,
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              {isCompleted ? '✓ Completed' : '○ Mark Completed'}
            </button>
            <button
              onClick={onSOS}
              title="Enter Focus Mode for this chapter"
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', letterSpacing: '0.5px' }}>SOS</span>
            </button>
          </div>
        </div>

        {/* Answer Box */}
        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Answer</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', background: '#e2e8f0', padding: '3px 6px', borderRadius: '20px' }}>
              <span
                onClick={() => setIsLongAnswer(false)}
                style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: '16px', background: !isLongAnswer ? '#fff' : 'transparent', fontWeight: !isLongAnswer ? 'bold' : 'normal', color: !isLongAnswer ? '#1e293b' : '#64748b', transition: 'all 0.2s', boxShadow: !isLongAnswer ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
              >
                Short
              </span>
              <span
                onClick={() => setIsLongAnswer(true)}
                style={{ cursor: 'pointer', padding: '3px 10px', borderRadius: '16px', background: isLongAnswer ? '#fff' : 'transparent', fontWeight: isLongAnswer ? 'bold' : 'normal', color: isLongAnswer ? '#1e293b' : '#64748b', transition: 'all 0.2s', boxShadow: isLongAnswer ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
              >
                Long
              </span>
            </div>
          </div>
          <div style={{ fontSize: '15px', color: '#334155', lineHeight: '1.6' }}>
            {isLongAnswer ? question.longAnswer : question.shortAnswer}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function PreviousYearQuestions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { startFocusMode } = useFocusMode();
  const [year, setYear] = useState('');

  const subjectIdFromUrl = searchParams.get('sId') || searchParams.get('subjectId') || 'management';
  const [selectedSubject, setSelectedSubject] = useState(subjectIdFromUrl);

  useEffect(() => {
    // Check if the user has paid for the current subject
    const hasPaid = localStorage.getItem(`registered_${selectedSubject}`) === 'true';
    if (!hasPaid) {
      navigate(`/course/${selectedSubject}`);
    }
  }, [selectedSubject, navigate]);

  useEffect(() => {
    const sId = searchParams.get('sId') || searchParams.get('subjectId');
    if (sId && sId !== selectedSubject) {
      setSelectedSubject(sId);
    }
  }, [searchParams, selectedSubject]);

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
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

  const baseQuestions = QUESTIONS_MAP[selectedSubject] || [];

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
  const meta = SUBJECT_META[selectedSubject] || { title: 'Previous Year Questions', subtitle: '' };

  return (
    <div className="page pyq-page" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
      <button
        className="back-link"
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '16px', fontSize: '16px', padding: 0 }}
      >
        ← Back
      </button>

      <div style={{ background: '#d0e1f9', padding: '24px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1e3a8a', fontSize: '28px' }}>{meta.title} PYQs</h1>
        <p style={{ margin: '8px 0 0', color: '#1e40af', fontSize: '14px' }}>{meta.subtitle}</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Subject Dropdown */}
        <div style={{ flex: '1 1 200px', maxWidth: '300px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: 'white' }}
          >
            {AVAILABLE_SUBJECTS.map((sub) => (
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
            No previous year questions found for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}
