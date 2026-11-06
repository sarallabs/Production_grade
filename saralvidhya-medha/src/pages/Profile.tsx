import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAnalytics } from '@/utils/analytics';
import { googleTtsSpeak } from '@/services/googleTtsService';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface StudentProfile {
  studentDetailId: string;
  userTypeId: number;
  userId: number;
  userModuleId: number;
  moduleId: number;
  courseTypeId: number;
  courseId: number;
  branchId: number;
  description: string;
  status: number;
  firstName: string;
  middleName: string;
  lastName: string;
  programme: string;
  course: string;
  previousAcademicStudy: string;
  prevMediumOfStudy: string;
  location: string;
  state: string;
  emailId: string;
  mobile: string;
}

const INITIAL_PROFILE: StudentProfile = {
  studentDetailId: '',
  userTypeId: 2,
  userId: 101,
  userModuleId: 501,
  moduleId: 301,
  courseTypeId: 401,
  courseId: 201,
  branchId: 601,
  description: 'Enrolled Student',
  status: 1,
  firstName: '',
  middleName: '',
  lastName: '',
  programme: '',
  course: '',
  previousAcademicStudy: '',
  prevMediumOfStudy: '',
  location: '',
  state: '',
  emailId: '',
  mobile: ''
};

const PERSONA_NAMES: Record<string, string> = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate',
  'advanced': 'Advanced'
};

// ─── Programme → Course mapping ──────────────────────────────────────────────
const COURSE_MAP: Record<string, string[]> = {
  'Post Graduate': [
    'M.A. (History)',
    'M.A. (Urdu)',
    'M.A. (English)',
    'M.A. (Islamic Studies)',
    'M.A. (Political Science)',
    'M.Com.',
    'M.Sc. (Mathematics)',
    'M.Sc. (Computer Science)',
  ],
  'Undergraduate': [
    'B.A. (History)',
    'B.A. (Urdu)',
    'B.A. (English)',
    'B.A. (Political Science)',
    'B.Com.',
    'B.Sc. (Mathematics)',
    'B.Sc. (Computer Science)',
    'B.Sc. (Physics)',
  ],
  'Diploma': [
    'Diploma in Computer Applications (DCA)',
    'Diploma in Business Management (DBM)',
    'Diploma in Urdu Language',
    'Diploma in Islamic Studies',
    'Diploma in Library Science',
    'Post Graduate Diploma in Computer Science (PGDCS)',
  ],
};

const VOICES = [
  { id: 'female', name: 'Female Voice', icon: '👩' },
  { id: 'male', name: 'Male Voice', icon: '👨' }
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const treeLogoSrc = `${import.meta.env.BASE_URL}brand-logo.png`;
  const containerRef = useRef<HTMLDivElement>(null);

  const savedRaw = localStorage.getItem('saral_student_profile');
  const isProfileSaved = !!savedRaw;

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const requestedMode = searchParams.get('mode');

  // Mode: 'view' = original profile page, 'wizard' = setup/edit form
  const [mode, setMode] = useState<'view' | 'wizard'>(() => {
    if (requestedMode === 'setup') return 'wizard';
    return isProfileSaved ? 'view' : 'wizard';
  });

  useEffect(() => {
    if (requestedMode === 'setup') {
      setMode('wizard');
    }
  }, [requestedMode]);

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState<StudentProfile>(() => {
    if (savedRaw) {
      try { return JSON.parse(savedRaw); } catch { /* fall through */ }
    }
    return { ...INITIAL_PROFILE, studentDetailId: `STU-${Math.floor(10000 + Math.random() * 90000)}` };
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [academicSubStep, setAcademicSubStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [backupData, setBackupData] = useState<StudentProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Profile-view state (original page) ───────────────────────────────────
  const [username, setUsername] = useState('');
  const [persona, setPersona] = useState('');
  const [activeVoice, setActiveVoice] = useState(() => {
    const saved = localStorage.getItem('user_voice');
    return saved === 'male' ? 'male' : 'female';
  });
  const [stats, setStats] = useState({ summaries: 0, detailed: 0, quizzes: 0 });
  const [swot, setSwot] = useState({ s: [] as string[], w: [] as string[], o: [] as string[], t: [] as string[] });
  const [rank, setRank] = useState(42);
  const [animate, setAnimate] = useState(false);

  // ── Scroll to top on step change ──────────────────────────────────────────
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, mode]);

  // ── Load original profile view data ───────────────────────────────────────
  useEffect(() => {
    if (mode !== 'view') return;

    setTimeout(() => setAnimate(true), 100);

    setUsername(localStorage.getItem('username') || 'Student');
    const pId = localStorage.getItem('persona') || localStorage.getItem('global_persona') || 'intermediate';
    setPersona(PERSONA_NAMES[pId] || 'Intermediate');

    const data = getAnalytics();

    const summaries = data.chapterVisits.length;
    const detailed = data.toolEvents.filter((e: { tool: string }) => e.tool === 'detailed').length;
    const quizzes = data.quizRecords.length;
    setStats({ summaries, detailed, quizzes });

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    for (const r of data.quizRecords) {
      const pct = (r.score / r.total) * 100;
      const name = `${r.subjectName || r.subjectId} Ch.${r.chapterNumber}`;
      if (pct >= 80) {
        if (!strengths.includes(name)) strengths.push(name);
      } else if (pct < 60) {
        if (!weaknesses.includes(name)) weaknesses.push(name);
      } else {
        if (!opportunities.includes(name)) opportunities.push(name);
      }
    }

    if (strengths.length === 0) strengths.push('Consistent reading habits');
    if (weaknesses.length === 0) weaknesses.push('None detected yet!');
    if (opportunities.length === 0) opportunities.push('Take more quizzes to discover opportunities');
    if (threats.length === 0) threats.push('Irregular study sessions might affect retention.');

    setSwot({ s: strengths, w: weaknesses, o: opportunities, t: threats });

    const dummyUsers = [
      { points: 8500 }, { points: 9200 }, { points: 6400 }, { points: 7100 }, { points: 5300 },
    ];
    let myTotalPoints = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ekam_quiz_score_')) {
        myTotalPoints += parseInt(localStorage.getItem(key) || '0', 10);
      }
    }
    myTotalPoints = myTotalPoints * 5;
    const all = [...dummyUsers, { points: myTotalPoints }];
    all.sort((a, b) => b.points - a.points);
    const myRank = all.findIndex(u => u.points === myTotalPoints) + 1;
    setRank(myRank);
  }, [mode]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const changeVoice = (voiceId: string) => {
    setActiveVoice(voiceId);
    localStorage.setItem('user_voice', voiceId);
    const sampleText = voiceId === 'male' ? 'This is the male voice.' : 'This is the female voice.';
    googleTtsSpeak(sampleText, 'en-IN');
  };

  // ── Wizard logic ──────────────────────────────────────────────────────────
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!profileData.firstName.trim()) newErrors.firstName = 'First Name is required';
      if (!profileData.lastName.trim()) newErrors.lastName = 'Last Name is required';
    } else if (step === 2) {
      if (!profileData.programme) newErrors.programme = 'Programme selection is required';
      if (!profileData.course) newErrors.course = 'Course selection is required';
      if (!profileData.previousAcademicStudy.trim()) newErrors.previousAcademicStudy = 'Previous academic study is required';
      if (!profileData.prevMediumOfStudy.trim()) newErrors.prevMediumOfStudy = 'Medium of study is required';
    } else if (step === 3) {
      if (!profileData.location.trim()) newErrors.location = 'Location is required';
      if (!profileData.state.trim()) newErrors.state = 'State is required';
      if (!profileData.emailId.trim()) {
        newErrors.emailId = 'Email ID is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.emailId)) {
        newErrors.emailId = 'Invalid email address format';
      }
      if (!profileData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(profileData.mobile.trim())) {
        newErrors.mobile = 'Mobile number must be exactly 10 digits';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleCompleteWizard = () => {
    localStorage.setItem('saral_student_profile', JSON.stringify(profileData));
    const fullName = `${profileData.firstName} ${profileData.lastName}`;
    localStorage.setItem('username', fullName);
    
    const isSetupFlow = requestedMode === 'setup' || !isProfileSaved;

    if (isSetupFlow) {
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_role', 'student');
      // For demo flow: Always route from Student Details -> Questionnaire
      navigate('/questionnaire', { replace: true });
    } else {
      // User is editing an existing profile from inside the app
      setAnimate(false);
      setMode('view');
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ORIGINAL PROFILE VIEW (with SWOT, Activity, Voice)
  // ══════════════════════════════════════════════════════════════════════════
  if (mode === 'view') {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          inset: 0,
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          padding: '40px 20px',
          fontFamily: 'Inter, sans-serif',
          zIndex: 9999,
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

          {/* Header Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <img src={treeLogoSrc} alt="Saral Vidhya" className="sv-persona-tree-logo" style={{ flexShrink: 0 }} />
              <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 2.8vw, 2.5rem)', fontWeight: 800, background: 'linear-gradient(135deg, #6B21A8, #9333EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Student Profile
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => { setBackupData({ ...profileData }); setCurrentStep(1); setIsEditing(false); setAnimate(false); setMode('wizard'); }}
                style={{ background: '#F3E8FF', border: '2px solid #A855F7', borderRadius: '16px', padding: '10px 20px', cursor: 'pointer', color: '#7E22CE', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s ease' }}
                onMouseOver={e => { e.currentTarget.style.background = '#E9D5FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#F3E8FF'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                ✏️ Edit Details
              </button>
              <button
                onClick={() => navigate('/')}
                style={{ background: '#fff', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(107, 33, 168, 0.15)', color: '#6B21A8', transition: 'all 0.3s ease' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1) rotate(-5deg)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
                title="Back to Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '30px' }}>

            {/* Identity Card */}
            <div style={{ gridColumn: 'span 8', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(107,33,168,0.05)', display: 'flex', alignItems: 'center', gap: '30px', transition: 'transform 0.3s ease' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #A855F7, #EC4899)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, boxShadow: '0 8px 20px rgba(236,72,153,0.3)', flexShrink: 0 }}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 800, color: '#1E1B4B' }}>{username}</h2>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: '#F3E8FF', color: '#7E22CE', borderRadius: '30px', fontSize: '0.95rem', fontWeight: 700 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333EA', display: 'inline-block' }}></span>
                  Persona: {persona}
                </div>
              </div>
            </div>

            {/* Global Rank Card */}
            <div onClick={() => navigate('/leaderboard')}
              style={{ gridColumn: 'span 4', background: 'linear-gradient(135deg, #FDF2F8 0%, #FFF5F8 100%)', borderRadius: '24px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #FBCFE8', boxShadow: '0 8px 32px rgba(236,72,153,0.08)', transition: 'all 0.3s ease' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(236,72,153,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(236,72,153,0.08)'; }}
            >
              <div style={{ fontSize: '0.9rem', color: '#BE185D', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>Global Rank</div>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: '#DB2777', lineHeight: 1, textShadow: '2px 4px 12px rgba(219,39,119,0.2)' }}>#{rank}</div>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#DB2777', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                View Leaderboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>
            </div>

            {/* Learning Activity */}
            <div style={{ gridColumn: 'span 4', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span> Activity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Summaries Read', value: stats.summaries, color: '#3B82F6', bg: '#EFF6FF' },
                  { label: 'Detailed Views', value: stats.detailed, color: '#8B5CF6', bg: '#F5F3FF' },
                  { label: 'Quizzes Taken', value: stats.quizzes, color: '#EC4899', bg: '#FDF2F8' },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: stat.bg, borderRadius: '16px', border: `1px solid ${stat.color}20` }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>{stat.label}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SWOT Analysis */}
            <div style={{ gridColumn: 'span 8', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🎯</span> SWOT Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {[
                  { title: 'Strengths', items: swot.s, color: '#10B981', bg: '#F0FDF4', border: '#bbf7d0', icon: '💪' },
                  { title: 'Weaknesses', items: swot.w, color: '#EF4444', bg: '#FEF2F2', border: '#fecaca', icon: '⚠️' },
                  { title: 'Opportunities', items: swot.o, color: '#3B82F6', bg: '#EFF6FF', border: '#bfdbfe', icon: '🚀' },
                  { title: 'Threats', items: swot.t, color: '#F59E0B', bg: '#FFFBEB', border: '#fde68a', icon: '⚡' },
                ].map((section, i) => (
                  <div key={i} style={{ background: section.bg, borderRadius: '16px', padding: '20px', border: `1px solid ${section.border}`, transition: 'transform 0.2s ease' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
                      <h4 style={{ margin: 0, color: section.color, fontSize: '1.05rem', fontWeight: 700 }}>{section.title}</h4>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '24px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500 }}>
                      {section.items.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences */}
            <div style={{ gridColumn: 'span 12', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '32px', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 8px 32px rgba(107,33,168,0.05)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', fontWeight: 700, color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>⚙️</span> Preferences
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice Style</h4>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {VOICES.map(voice => (
                      <button
                        key={voice.id}
                        onClick={() => changeVoice(voice.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 24px',
                          background: activeVoice === voice.id ? '#F3E8FF' : '#fff',
                          border: `2px solid ${activeVoice === voice.id ? '#A855F7' : '#E2E8F0'}`,
                          borderRadius: '16px', cursor: 'pointer',
                          fontWeight: activeVoice === voice.id ? 700 : 500,
                          color: activeVoice === voice.id ? '#7E22CE' : '#475569',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxShadow: activeVoice === voice.id ? '0 4px 12px rgba(168,85,247,0.15)' : 'none'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{voice.icon}</span>
                        {voice.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WIZARD MODE (First-time setup OR Edit Details)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F1F5F9',
        fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif",
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ── Inputs ── */
        .profile-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background-color: #F8FAFC;
          font-size: 15px;
          color: #0F172A;
          outline: none;
          transition: all 0.25s ease;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }
        .profile-input:hover { background-color: #fff; border-color: #CBD5E1; }
        .profile-input:focus {
          background-color: #fff;
          border-color: #0EA5E9;
          box-shadow: 0 0 0 4px rgba(14,165,233,0.12);
        }
        .profile-input::placeholder { color: #94A3B8; }

        /* ── Option Cards (radio style) ── */
        .wz-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
        }
        .wz-option:hover {
          border-color: #7DD3FC;
          background: #F0F9FF;
        }
        .wz-option.selected {
          border-color: #0284C7;
          background: #EFF8FF;
          color: #0C4A6E;
        }

        /* ── Radio indicator ── */
        .wz-radio {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid #CBD5E1;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease;
          background: #fff;
          font-size: 13px;
          color: transparent;
        }
        .wz-option:hover .wz-radio { border-color: #7DD3FC; }
        .wz-option.selected .wz-radio {
          border-color: #0284C7;
          background: #fff;
          color: #0284C7;
          font-weight: 900;
        }
        .wz-option.selected .wz-radio::after { content: '✓'; }

        /* ── Buttons ── */
        .wz-next-btn {
          background: linear-gradient(135deg, #0EA5E9, #0284C7);
          color: #fff; border: none;
          border-radius: 10px; padding: 13px 36px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 14px rgba(2,132,199,0.25);
        }
        .wz-next-btn:hover {
          background: linear-gradient(135deg, #0284C7, #0369A1);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(2,132,199,0.35);
        }
        .wz-back-btn {
          background: transparent; color: #64748B; border: none;
          font-size: 15px; font-weight: 600; cursor: pointer;
          transition: color 0.2s ease; font-family: 'Inter', sans-serif; padding: 0;
        }
        .wz-back-btn:hover { color: #0F172A; }

        /* ── Misc ── */
        .wz-err { font-size: 13px; color: #EF4444; font-weight: 500; margin-top: 6px; animation: wz-slide 0.3s ease forwards; }
        @keyframes wz-slide { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:translateX(0); } }
        .wz-form-anim { animation: wz-fade-up 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes wz-fade-up { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .wz-left-anim { animation: wz-scale-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes wz-scale-in { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        .wz-label {
          display: block; font-size: 12px; font-weight: 700;
          color: #64748B; text-transform: uppercase; letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
      `}</style>

      {/* ── Top Progress Bar ─────────────────────────────────────────── */}
      <div style={{ padding: '28px 40px 0', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B', letterSpacing: '0.01em' }}>
            Step {currentStep} of 3
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
            {Math.round((currentStep / 3) * 100)}% Complete
          </span>
        </div>
        <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(currentStep / 3) * 100}%`, background: 'linear-gradient(90deg, #38BDF8, #0284C7)', borderRadius: '999px', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      </div>

      {/* ── Card Body ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 20px 40px', minHeight: 'calc(100vh - 100px)' }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: '960px', background: '#FFFFFF', borderRadius: '20px', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', overflow: 'hidden', alignItems: 'stretch' }}>

          {/* LEFT PANEL */}
          {(() => {
            const panels = [
              { icon: '👤', title: 'Your Identity', desc: 'Let us know who you are. Your name helps us personalise your experience.' },
              { icon: '🎓', title: 'Academic Background', desc: 'Tell us about your programme and courses so we can tailor your content.' },
              { icon: '📬', title: 'Stay Connected', desc: 'Your contact details help us send updates and important notifications.' },
            ];
            const p = panels[(currentStep - 1) % panels.length];
            return (
              <div
                className="wz-left-anim"
                key={currentStep}
                style={{
                  width: '42%',
                  flexShrink: 0,
                  background: 'linear-gradient(160deg, #38BDF8 0%, #2563EB 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 30px',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle blob highlights */}
                <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '240px', height: '240px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-80px', right: '-60px', width: '280px', height: '280px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%', pointerEvents: 'none' }} />

                {/* Icon box */}
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255,255,255,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  zIndex: 1,
                }}>
                  {p.icon}
                </div>

                <div style={{ textAlign: 'center', color: '#fff', zIndex: 1 }}>
                  <h2 style={{ margin: '0 0 14px', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{p.title}</h2>
                  <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.75)', maxWidth: '260px' }}>{p.desc}</p>
                </div>
              </div>
            );
          })()}

          {/* RIGHT PANEL */}
          <div style={{ flex: 1, background: '#FFFFFF', display: 'flex', flexDirection: 'column', padding: '36px 40px' }}>
            <div className="wz-form-anim" key={`form-${currentStep}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

            {/* ── STEP 1: Personal ── */}
            {currentStep === 1 && (<>
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Personal Details</h2>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748B', lineHeight: 1.55 }}>Please enter your name as it appears on official documents.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="wz-label">First Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="profile-input" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} />
                    {errors.firstName && <div className="wz-err">{errors.firstName}</div>}
                  </div>
                  <div>
                    <label className="wz-label">Middle Name</label>
                    <input type="text" className="profile-input" value={profileData.middleName} onChange={(e) => setProfileData({ ...profileData, middleName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="wz-label">Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" className="profile-input" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} />
                  {errors.lastName && <div className="wz-err">{errors.lastName}</div>}
                </div>
              </div>
            </>)}

            {/* ── STEP 2: Academic ── */}
            {currentStep === 2 && (<>
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Academic Information</h2>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748B', lineHeight: 1.55 }}>Select your current academic details.</p>
              </div>
              <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingBottom: '10px' }}>
                  {/* Card 1: Programme */}
                  <div style={{
                    position: academicSubStep === 0 ? 'relative' : 'absolute',
                    top: 0, left: 0, width: '100%',
                    opacity: academicSubStep === 0 ? 1 : 0,
                    pointerEvents: academicSubStep === 0 ? 'auto' : 'none',
                    transform: `translateX(${(0 - academicSubStep) * 100}%)`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    visibility: Math.abs(0 - academicSubStep) > 1 ? 'hidden' : 'visible'
                  }}>
                    <label className="wz-label">Programme <span style={{ color: '#EF4444' }}>*</span></label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {['Post Graduate', 'Undergraduate', 'Diploma'].map((p) => {
                        const isSelected = profileData.programme === p;
                        const icon = p === 'Post Graduate' ? '🎓' : p === 'Undergraduate' ? '🎒' : '📜';
                        return (
                          <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <button
                              onClick={() => {
                                setProfileData({ ...profileData, programme: p, course: '' });
                                setTimeout(() => setAcademicSubStep(1), 300);
                              }}
                              style={{
                                width: '100%',
                                aspectRatio: '1 / 1',
                                background: isSelected ? '#F0F9FF' : '#F8FAFC',
                                border: `2px solid ${isSelected ? '#38BDF8' : '#E2E8F0'}`,
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                padding: 0
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#CBD5E1';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.borderColor = '#E2E8F0';
                              }}
                            >
                              <span style={{ fontSize: '56px', lineHeight: 1 }}>{icon}</span>
                            </button>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: 600, 
                              color: isSelected ? '#0F172A' : '#64748B', 
                              textAlign: 'center',
                              lineHeight: 1.3
                            }}>
                              {p}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {errors.programme && <div className="wz-err">{errors.programme}</div>}
                  </div>

                  {/* Card 2: Course */}
                  <div style={{
                    position: academicSubStep === 1 ? 'relative' : 'absolute',
                    top: 0, left: 0, width: '100%',
                    opacity: academicSubStep === 1 ? 1 : 0,
                    pointerEvents: academicSubStep === 1 ? 'auto' : 'none',
                    transform: `translateX(${(1 - academicSubStep) * 100}%)`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    visibility: Math.abs(1 - academicSubStep) > 1 ? 'hidden' : 'visible'
                  }}>
                    <label className="wz-label">Course <span style={{ color: '#EF4444' }}>*</span></label>
                    {!profileData.programme ? (
                      <div style={{
                        padding: '18px 20px',
                        borderRadius: '12px',
                        border: '1.5px dashed #CBD5E1',
                        background: '#F8FAFC',
                        color: '#94A3B8',
                        fontSize: '14px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>☝️</span>
                        Select a programme first
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                        {(COURSE_MAP[profileData.programme] ?? []).map((c) => {
                          const isSelected = profileData.course === c;
                          return (
                            <button
                              key={c}
                              onClick={() => {
                                setProfileData({ ...profileData, course: c });
                                setTimeout(() => setAcademicSubStep(2), 300);
                              }}
                              style={{
                                background: isSelected ? '#F0F9FF' : '#FFFFFF',
                                border: `2px solid ${isSelected ? '#38BDF8' : '#E2E8F0'}`,
                                borderRadius: '16px',
                                padding: '16px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                minHeight: '110px'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#CBD5E1';
                                  e.currentTarget.style.background = '#F8FAFC';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = '#E2E8F0';
                                  e.currentTarget.style.background = '#FFFFFF';
                                }
                              }}
                            >
                              <span style={{ fontSize: '28px', lineHeight: 1 }}>📘</span>
                              <span style={{ 
                                fontSize: '13px', 
                                fontWeight: 600, 
                                color: isSelected ? '#0F172A' : '#64748B', 
                                textAlign: 'center', 
                                lineHeight: 1.3 
                              }}>
                                {c}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.course && <div className="wz-err">{errors.course}</div>}
                  </div>

                  {/* Card 3: Previous Academic Study */}
                  <div style={{
                    position: academicSubStep === 2 ? 'relative' : 'absolute',
                    top: 0, left: 0, width: '100%',
                    opacity: academicSubStep === 2 ? 1 : 0,
                    pointerEvents: academicSubStep === 2 ? 'auto' : 'none',
                    transform: `translateX(${(2 - academicSubStep) * 100}%)`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    visibility: Math.abs(2 - academicSubStep) > 1 ? 'hidden' : 'visible'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label className="wz-label">Previous Academic Study <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="text" className="profile-input" value={profileData.previousAcademicStudy} onChange={(e) => setProfileData({ ...profileData, previousAcademicStudy: e.target.value })} />
                        {errors.previousAcademicStudy && <div className="wz-err">{errors.previousAcademicStudy}</div>}
                      </div>
                      <div>
                        <label className="wz-label">Medium of Study <span style={{ color: '#EF4444' }}>*</span></label>
                        <input type="text" className="profile-input" value={profileData.prevMediumOfStudy} onChange={(e) => setProfileData({ ...profileData, prevMediumOfStudy: e.target.value })} />
                        {errors.prevMediumOfStudy && <div className="wz-err">{errors.prevMediumOfStudy}</div>}
                      </div>
                    </div>
                  </div>
              </div>

              {/* Internal navigation arrows for academic sub-steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setAcademicSubStep(prev => Math.max(0, prev - 1))}
                  disabled={academicSubStep === 0}
                  style={{
                    padding: '0', borderRadius: '50%', border: 'none', 
                    background: academicSubStep === 0 ? '#F8FAFC' : '#F1F5F9', color: academicSubStep === 0 ? '#CBD5E1' : '#475569', 
                    cursor: academicSubStep === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px'
                  }}
                  title="Back"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
                <button
                  type="button"
                  onClick={() => setAcademicSubStep(prev => Math.min(2, prev + 1))}
                  disabled={academicSubStep === 2 || (academicSubStep === 0 && !profileData.programme) || (academicSubStep === 1 && !profileData.course)}
                  style={{
                    padding: '0', borderRadius: '50%', border: 'none', 
                    background: (academicSubStep === 2 || (academicSubStep === 0 && !profileData.programme) || (academicSubStep === 1 && !profileData.course)) ? '#F8FAFC' : '#3B82F6', color: (academicSubStep === 2 || (academicSubStep === 0 && !profileData.programme) || (academicSubStep === 1 && !profileData.course)) ? '#CBD5E1' : '#FFF', 
                    cursor: (academicSubStep === 2 || (academicSubStep === 0 && !profileData.programme) || (academicSubStep === 1 && !profileData.course)) ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px',
                    boxShadow: (academicSubStep === 2 || (academicSubStep === 0 && !profileData.programme) || (academicSubStep === 1 && !profileData.course)) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  title="Next"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </>)}

            {/* ── STEP 3: Contact ── */}
            {currentStep === 3 && (<>
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Contact Information</h2>
                <p style={{ margin: 0, fontSize: '15px', color: '#64748B', lineHeight: 1.55 }}>Provide details so we can stay in touch.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div>
                  <label className="wz-label">Location <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" className="profile-input" value={profileData.location} onChange={(e) => setProfileData({ ...profileData, location: e.target.value })} />
                  {errors.location && <div className="wz-err">{errors.location}</div>}
                </div>
                <div>
                  <label className="wz-label">State <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="text" className="profile-input" value={profileData.state} onChange={(e) => setProfileData({ ...profileData, state: e.target.value })} />
                  {errors.state && <div className="wz-err">{errors.state}</div>}
                </div>
                <div>
                  <label className="wz-label">Email ID <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="email" className="profile-input" value={profileData.emailId} onChange={(e) => setProfileData({ ...profileData, emailId: e.target.value })} />
                  {errors.emailId && <div className="wz-err">{errors.emailId}</div>}
                </div>
                <div>
                  <label className="wz-label">Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                  <input type="tel" className="profile-input" value={profileData.mobile} onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value.replace(/\D/g, '') })} />
                  {errors.mobile && <div className="wz-err">{errors.mobile}</div>}
                </div>
              </div>
            </>)}

          </div>

            {/* ── Footer Buttons ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '28px' }}>
              <div>
                {/* Back button removed per user request */}
              </div>
              {currentStep <= 2 ? (
                (currentStep === 2 && academicSubStep < 2) ? (
                  <div />
                ) : (
                  <button className="wz-next-btn" onClick={handleNext}>
                    {isEditing ? 'Save & Return' : 'Next Step'}
                  </button>
                )
              ) : (
                <button className="wz-next-btn" onClick={handleCompleteWizard}>
                  {(requestedMode === 'setup' || !isProfileSaved) ? '🎉 Complete Setup' : '💾 Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
