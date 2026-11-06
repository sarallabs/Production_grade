import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById, getManifest, getChapters, type Course, type Chapter } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

// navSections removed - generated dynamically from chapters now

const syllabusTopics: Record<string, Record<number, string[]>> = {
  management: {
    1: [
      'Core concepts of marketing and the exchange process',
      'Marketing philosophies: Production, Product, Selling, Marketing, and Societal concepts',
      'Scope, functions, and importance of marketing in modern business',
      'Understanding customer needs, wants, and demands',
      'Evolution of marketing eras'
    ],
    2: [
      'E-Commerce and Digital Marketing strategies',
      'Customer Relationship Management (CRM) tools and best practices',
      'Social media marketing and influencer campaigns',
      'Green marketing and sustainable business practices'
    ]
  },
  anu_physics: {
    1: [
      'Relativistic Quantum Mechanics & Energy-Momentum Relation',
      'Derivation and Operator Interpretation of Klein-Gordon Equation',
      'Squaring Approach & Negative Energy Solutions',
      'Dirac Equation Formulation & Gamma Matrices',
      'Spinors, Probability Current & Lorentz Covariance',
      'S-Matrix, Scattering Processes & QED Foundations'
    ],
    4: [
      'General formulation of wave mechanics and operators',
      'The Schrödinger wave equation and its eigenvalues',
      'Quantum mechanical tunneling and potential barriers',
      'Angular momentum operators and spin states'
    ]
  },
  anu_characterization: {
    5: [
      'X-ray Diffraction (XRD) theory and applications',
      'Electron microscopy: SEM (Scanning) and TEM (Transmission)',
      'Spectroscopy techniques: UV-Vis, FTIR, and Raman Spectroscopy',
      'Thermal analysis methods: TGA and DSC'
    ]
  },
  ento_131: {
    1: [
      'Understand the structural anatomy and physiological functions of the insect digestive system',
      'Differentiate between the Foregut (Stomodeum), Midgut (Mesenteron), and Hindgut (Proctodeum)',
      'Analyze specialized physiological adaptations such as the Filter Chamber and Symbiotic Digestion',
      'Explain the integration of excretion via Malpighian Tubules and rectal water conservation'
    ],
    2: [
      'Define metamorphosis and understand its significance in insect development',
      'Differentiate between ametabolous, hemimetabolous, and holometabolous life cycles',
      'Identify the hormonal control mechanisms regulating insect molting and metamorphosis',
      'Describe the ecological and evolutionary advantages of complex insect life cycles'
    ]
  },
  entomology: {
    1: [
      'Understand the structural anatomy and physiological functions of the insect digestive system',
      'Differentiate between the Foregut (Stomodeum), Midgut (Mesenteron), and Hindgut (Proctodeum)',
      'Analyze specialized physiological adaptations such as the Filter Chamber and Symbiotic Digestion',
      'Explain the integration of excretion via Malpighian Tubules and rectal water conservation'
    ],
    11: [
      'Define metamorphosis and understand its significance in insect development',
      'Differentiate between ametabolous, hemimetabolous, and holometabolous life cycles',
      'Identify the hormonal control mechanisms regulating insect molting and metamorphosis',
      'Describe the ecological and evolutionary advantages of complex insect life cycles'
    ]
  }
};

const syllabusVideos: Record<string, Record<number, string>> = {
  management: {
    1: 'https://www.youtube.com/embed/SwcmRNZhlyo',
    2: 'https://www.youtube.com/embed/SwcmRNZhlyo'
  },
  anu_physics: {
    1: 'https://www.youtube.com/embed/wla3hcd1S68',
    4: 'https://www.youtube.com/embed/wla3hcd1S68'
  },
  anu_characterization: {
    5: 'https://www.youtube.com/embed/7V-MizG48iI'
  },
  ento_131: {
    1: 'https://www.youtube.com/embed/K6TcM8Q-V3w'
  },
  entomology: {
    1: 'https://www.youtube.com/embed/K6TcM8Q-V3w'
  }
};

function getYoutubeThumbnailUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
  }
  return '';
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDetails, setHasDetails] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const isAuthenticated = localStorage.getItem('app_authenticated') === 'true';

  useEffect(() => {
    if (!courseId) return;
    setHasDetails(localStorage.getItem(`registered_details_${courseId}`) === 'true');
    setHasPaid(localStorage.getItem(`registered_${courseId}`) === 'true');

    Promise.all([
      getCourseById(courseId),
      getManifest()
    ]).then(([courseData, manifestData]) => {
      if (courseData) {
        setCourse(courseData);
        const syllabus = getChapters(manifestData, courseId);
        setChapters(syllabus);
        if (syllabus.length > 0) {
          setActiveSection(`unit-${syllabus[0].number}`);
        }
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [courseId]);

  // Navigation sections list dynamically generated from chapters (Unit 1, Unit 2, etc)
  const visibleNavSections = chapters.map((ch, idx) => ({
    id: `unit-${ch.number}`,
    label: `Unit ${idx + 1}`
  }));

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    setActiveVideoIndex(0);
  };

  const handleStartLearning = () => {
    if (!course) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/course/${course.id}` } });
    } else {
      const activeChapter = chapters.find(ch => `unit-${ch.number}` === activeSection) || chapters[0];
      const url = buildChapterUrl({
        id: course.id,
        name: course.name,
        boardId: course.boardId,
        boardName: course.boardName,
        boardShortName: course.boardShortName,
        classId: course.classId,
        className: course.className,
      }, activeChapter?.number || 1);
      navigate(url);
    }
  };

  const handleCtaClick = () => {
    if (!course) return;
    const activeChapter = chapters.find(ch => `unit-${ch.number}` === activeSection) || chapters[0];
    const chapterParams = activeChapter ? `?chapter=${activeChapter.number}` : '';
    navigate(`/course/${course.id}/register${chapterParams}`);
  };

  const getButtonLabel = () => {
    if (!hasPaid) return 'Register for Course';
    return isAuthenticated ? 'Go to My Learning' : 'Start Learning';
  };

  if (loading) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-loading-state" style={{ minHeight: '60vh' }}>
          <div className="sv-catalog-spinner"></div>
          <p>Loading course details...</p>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="sv-catalog">
        <SiteHeader />
        <div className="sv-catalog-empty-state" style={{ minHeight: '60vh' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3>Course Not Found</h3>
          <p>The course you are looking for does not exist or has been removed.</p>
          <Link to="/" className="sv-catalog-primary-btn" style={{ textDecoration: 'none' }}>
            Back to Catalog
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const { name, boardShortName, className, chapterCount, meta } = course;
  const { subtitle, description, discipline, instructor, durationHours, credits, language, accent } = meta;

  return (
    <div className="sv-catalog">
      <SiteHeader />

      {/* Hero Band */}
      <section className="sv-catalog-detail-hero" style={{ background: accent || 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
        <div className="sv-catalog-detail-hero-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1 className="sv-catalog-detail-title">{name}</h1>
            <p className="sv-catalog-detail-subtitle" style={{ margin: 0 }}>{subtitle}</p>
          </div>

          <div className="sv-catalog-detail-hero-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flexShrink: 0 }}>
            <span className="sv-catalog-detail-meta-pill">
              <strong>Duration:</strong> {durationHours || (chapterCount ? chapterCount * 4 : 30)} Hours
            </span>
            <span className="sv-catalog-detail-meta-pill">
              <strong>Credits:</strong> {credits || 3}
            </span>
            <span className="sv-catalog-detail-meta-pill">
              <strong>Language:</strong> {language || 'English'}
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="sv-catalog-detail-layout" style={{ display: 'block', padding: '0 24px' }}>
        
        {/* Top Bar for Navigation Units */}
        <div style={{
          display: 'flex',
          gap: '16px',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '24px',
          overflowX: 'auto',
          maxWidth: '1200px',
          margin: '24px auto'
        }}>
          {chapters.map((ch, idx) => {
            const hasAssets = Boolean(ch && (ch.resourceCount ?? 0) > 0);
            const isSelected = `unit-${ch.number}` === activeSection;
            return (
              <button
                key={ch.number}
                disabled={!hasAssets}
                onClick={() => {
                  if (hasAssets) {
                    handleNavClick(`unit-${ch.number}`);
                  }
                }}
                title={hasAssets ? `Unit ${idx + 1}` : `Unit ${idx + 1} (Coming Soon)`}
                style={{
                  background: isSelected ? '#E6F0FF' : 'none',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px 8px 0 0',
                  color: isSelected ? '#1E40AF' : hasAssets ? '#64748b' : '#94a3b8',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '1rem',
                  cursor: hasAssets ? 'pointer' : 'not-allowed',
                  opacity: hasAssets ? 1 : 0.45,
                  borderBottom: isSelected ? '3px solid #2563EB' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Unit {idx + 1} {!hasAssets && <span style={{ fontSize: '0.75rem', marginLeft: '4px', opacity: 0.8 }}>(Coming Soon)</span>}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="sv-catalog-detail-main" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', borderLeft: 'none', paddingLeft: 0 }}>
          {(() => {


            const activeChapterIndex = chapters.findIndex(ch => `unit-${ch.number}` === activeSection);
            const activeChapter = activeChapterIndex !== -1 ? chapters[activeChapterIndex] : chapters[0];

            if (!activeChapter) {
              return <p className="sv-catalog-detail-empty">Syllabus details are currently being finalized.</p>;
            }

            const topics = syllabusTopics[course.id]?.[activeChapter.number] || [];
            const defaultVideos = [
              syllabusVideos[course.id]?.[activeChapter.number] || 'https://www.youtube.com/embed/SwcmRNZhlyo',
              'https://www.youtube.com/embed/L_LUpnjgPso',
              'https://www.youtube.com/embed/3JZ_D3ELwOQ',
              'https://www.youtube.com/embed/fJ9rUzIMcZQ'
            ];
            const videoUrl = defaultVideos[activeVideoIndex] || defaultVideos[0];

            return (
              <section className="sv-catalog-detail-section" style={{ minHeight: '320px', padding: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--svc-ink)', margin: '0 0 16px 0', borderBottom: 'none', paddingBottom: 0, fontFamily: '"Lora", Georgia, serif' }}>
                  Unit {activeChapterIndex !== -1 ? activeChapterIndex + 1 : 1} Overview
                </h3>

                <div className="sv-catalog-unit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'flex-start' }}>
                  {/* Left Column: Video Player (50% Width) */}
                  <div className="sv-catalog-syllabus-video" style={{ width: '100%', margin: 0 }}>
                    {videoUrl ? (
                      <div className="sv-video-wrapper" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <iframe
                          src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}cc_load_policy=0&rel=0`}
                          title={`Preview Video - ${activeChapter.name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                        {/* Top-Left University Logo Overlay */}
                        <div
                          style={{
                            position: "absolute",
                            top: "12px",
                            left: "12px",
                            zIndex: 10,
                            pointerEvents: "none",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={sessionStorage.getItem('sv_logo') || '/brand-logo.png'}
                            alt="University Logo"
                            style={{
                              width: "44px",
                              height: "44px",
                              objectFit: "contain",
                              filter: "drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35))",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        paddingBottom: '56.25%',
                        height: 0,
                        position: 'relative',
                        background: 'linear-gradient(135deg, var(--svc-brand-light), rgba(124, 58, 237, 0.08))',
                        borderRadius: '12px',
                        border: '1.5px dashed rgba(124, 58, 237, 0.25)'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--svc-brand)" strokeWidth="2" style={{ marginBottom: '8px' }}>
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <line x1="2" y1="7" x2="7" y2="7" />
                            <line x1="2" y1="17" x2="7" y2="17" />
                            <line x1="17" y1="17" x2="22" y2="17" />
                            <line x1="17" y1="7" x2="22" y2="7" />
                          </svg>
                          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--svc-brand)' }}>Preview Video Coming Soon</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Topics, Key Takeaways & Navigation (50% Width) */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px', height: '100%' }}>
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--svc-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                        Unit Objectives
                      </h4>
                      {topics.length > 0 ? (
                        <ul style={{ margin: '0 0 16px 0', paddingLeft: '16px', listStyleType: 'disc' }}>
                          {topics.map((topic, tIdx) => (
                            <li key={tIdx} style={{ marginBottom: '6px', color: '#334155', fontSize: '0.9rem', lineHeight: '1.4' }}>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--svc-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                          Objectives details are currently being finalized.
                        </p>
                      )}

                      {/* Key Takeaways Card */}
                      <div style={{
                        background: '#E6F0FF',
                        border: '1px solid rgba(37, 99, 235, 0.15)',
                        borderRadius: '8px',
                        padding: '12px 14px'
                      }}>
                        <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E40AF', margin: '0 0 4px 0' }}>
                          Key Takeaways
                        </h5>
                        <p style={{ fontSize: '0.82rem', color: '#1e293b', margin: 0, lineHeight: '1.4' }}>
                          {topics.length > 0
                            ? `Master the fundamental concepts of ${activeChapter.name.toLowerCase()} to build dynamic professional competencies and strategic methodologies.`
                            : `Understand unit essentials and core themes to advance your understanding of this subject.`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Dynamic Action Bar: Video Selection Circles (1 2 3 4) on Left, Register Button on Right */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      {/* Video Number Selector Circles (1 2 3 4) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {[1, 2, 3, 4].map((num, idx) => {
                          const isActive = activeVideoIndex === idx;
                          return (
                            <button
                              key={num}
                              onClick={() => setActiveVideoIndex(idx)}
                              title={`Watch Video ${num}`}
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '2px solid #2563EB',
                                background: isActive ? '#2563EB' : '#E6F0FF',
                                color: isActive ? '#FFFFFF' : '#2563EB',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.35)' : 'none'
                              }}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>

                      {/* Register Button in Right Corner */}
                      <button
                        onClick={handleCtaClick}
                        style={{
                          background: '#1e293b',
                          color: '#ffffff',
                          border: 'none',
                          padding: '9px 24px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          transition: 'background-color 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}
        </main>

      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 16px', gap: '16px' }}>
        <button
          onClick={() => {
            localStorage.removeItem(`registered_${course.id}`);
            localStorage.removeItem(`registered_details_${course.id}`);
            setHasDetails(false);
            setHasPaid(false);
            alert('Registration state reset successfully! You can now test the checkout flow.');
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            padding: '6px 14px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 500,
            transition: 'all 0.2s ease'
          }}
          className="sv-dev-reset-btn"
        >
          Cancel Registration / Reset Enrollment (Dev Utility)
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}
