import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getCourseById, getManifest, getChapters, type Course, type Chapter } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';

interface UnitSyllabusDetail {
  title: string;
  objectives: string[];
  outcome: string;
}

const syllabusUnits: Record<string, Record<number, UnitSyllabusDetail>> = {
  management: {
    1: {
      title: 'Nature, Scope & Strategic Foundations of Marketing',
      objectives: [
        'Define core marketing constructs—needs, wants, demands, customer value, satisfaction, and relational exchange—within contemporary market structures.',
        'Compare the five competing company orientations toward the marketplace: Production, Product, Selling, Marketing, and Holistic (Societal & Relationship) concepts.',
        'Evaluate the distinctive characteristics of services (intangibility, inseparability, variability, perishability) and apply the extended 7Ps Services Marketing mix.',
        'Analyze micro- and macro-environmental forces shaping marketing strategy, customer lifetime value (CLV), and customer acquisition economics.',
        'Examine global marketing imperatives, international market-entry modes, and standardization versus adaptation decisions across borders.'
      ],
      outcome:
        'Formulate market-oriented business philosophies and evaluate domestic, service, and international market opportunities using structured strategic frameworks.'
    },
    2: {
      title: 'Marketing Intelligence, Research, Consumer Behaviour & STP',
      objectives: [
        'Design an enterprise Marketing Information System (MIS) integrating internal records, competitive marketing intelligence engines, and decision support systems (MDSS).',
        'Execute the 6-step scientific Marketing Research process spanning problem definition, research design, sampling, instrumentation, field data collection, and analysis.',
        'Evaluate cultural, social, personal, and psychological determinants of consumer behaviour alongside cognitive processing frameworks (Assael Matrix and 5-Stage Buyer Decision Journey).',
        'Differentiate organizational (B2B) buying centers, procurement situations, and institutional vendor-evaluation criteria from B2C markets.',
        'Apply the STP (Segmentation, Targeting, Positioning) framework to partition heterogeneous markets, assess segment attractiveness, and craft defensible value positioning.'
      ],
      outcome:
        'Translate empirical market research and buyer behaviour insights into data-backed market segmentation, target selection, and competitive positioning strategies.'
    },
    3: {
      title: 'Product Strategy, Brand Equity & New Product Development',
      objectives: [
        'Deconstruct market offerings across Kotler’s Five Product Levels (Core Benefit, Basic, Expected, Augmented, and Potential Product) and classify consumer and industrial goods.',
        'Manage multi-line product portfolios across assortment width, length, depth, and consistency, including up-market/down-market line stretching and line-filling decisions.',
        'Build and measure brand equity using Keller’s Customer-Based Brand Equity (CBBE) pyramid and Aaker’s brand identity dimensions, alongside line, brand, and co-branding extensions.',
        'Guide offerings through the 8-stage New Product Development (NPD) pipeline—from idea generation and screening (mitigating GO/DROP errors) to concept testing, business ROI analysis, and commercialization.',
        'Adapt strategic marketing mix priorities across Introduction, Growth, Maturity, and Decline stages of the Product Life Cycle (PLC).'
      ],
      outcome:
        'Architect differentiated product assortments, manage brand equity portfolios, and govern new-product commercialization across the complete product life cycle.'
    },
    4: {
      title: 'Pricing Strategies, Value Networks & Distribution Channels',
      objectives: [
        'Implement Kotler’s 6-Step Pricing Framework aligning survival, current profit, market-share penetration, market skimming, and product-quality leadership objectives.',
        'Quantify demand schedules, price elasticity of demand, fixed/variable cost floors, and Experience Curve cost reductions to bound viable pricing corridors.',
        'Select optimal pricing methodologies using the 3 Cs model (Cost-Plus/Markup, Target-Return, Perceived-Value, Value, and Going-Rate pricing).',
        'Calibrate final price structures using psychological reference anchors, promotional/segmented price adjustments, geographical pricing, and international countertrade (barter, buyback, offset).',
        'Design multi-tier marketing channels and value networks, managing wholesaling/retailing intermediaries, channel power, conflict resolution, and physical logistics.'
      ],
      outcome:
        'Establish profitable, value-aligned pricing architectures and coordinate resilient multi-channel distribution networks from manufacturer to end customer.'
    },
    5: {
      title: 'Integrated Marketing Communications, Sales Force & Strategic Control',
      objectives: [
        'Orchestrate the 8-element Integrated Marketing Communications (IMC) mix across macro communication models and consumer response hierarchies (AIDA and Hierarchy-of-Effects).',
        'Plan and evaluate advertising campaigns using the 5 Ms framework—Mission, Money, Message creative strategy, Media (reach, frequency, impact), and Measurement.',
        'Deploy targeted consumer, trade, and sales-force promotional incentives alongside high-credibility Public Relations (PR), events, and corporate crisis communications.',
        'Structure and manage a consultative sales force across territory design, quota setting, compensation, and the 6-step Personal Selling process (prospecting with MAN criteria to follow-up).',
        'Exercise strategic marketing control through annual-plan analysis, profitability diagnostics, efficiency tracking, and comprehensive marketing audits.'
      ],
      outcome:
        'Integrate multi-channel brand communications with consultative sales execution and institute rigorous performance controls across the marketing organization.'
    }
  },
  mp_ob: {
    1: {
      title: 'Introduction to Management Process & Organizational Behavior',
      objectives: [
        'Compare classical and modern definitions of management (Drucker, Weihrich & Koontz, McFarland, Keith Davis) alongside its dual identity as science, art, and profession.',
        'Differentiate Top, Middle, and First-Line management hierarchies using Robert Katz’s three-skill pyramid (Conceptual, Human, Technical) and authority-responsibility dynamics.',
        'Analyze Henry Mintzberg’s ten managerial roles across Interpersonal, Informational, and Decisional categories.',
        'Trace the POSDC functional cycle and evaluate Corporate Social Responsibility (CSR) arguments and managerial ethics.'
      ],
      outcome:
        'Synthesize classical principles, managerial skill profiles, executive roles, and ethical governance into a coherent management framework.'
    },
    2: {
      title: 'Planning, Decision Making & Organizing',
      objectives: [
        'Formulate strategic, tactical, and operational plans across standing and single-use hierarchies using the systematic planning process.',
        'Execute rational and bounded-rationality decision-making workflows and implement Peter Drucker’s Management by Objectives (MBO) cascade.',
        'Design formal organizational structures, comparing narrow vs. wide spans of management using V.A. Graicunas’s mathematical relationship formula.',
        'Balance centralization, decentralization, line-and-staff authority relationships, and effective delegation without abdicating accountability.'
      ],
      outcome:
        'Translate organizational objectives into structured plans, rigorous executive decisions, and scalable authority architectures.'
    },
    3: {
      title: 'Staffing, Directing, Leadership, Motivation & Controlling',
      objectives: [
        'Manage end-to-end human resource staffing—manpower planning, recruitment, selection, placement, training, appraisal, and career development.',
        'Apply content and process motivation theories (Maslow, Herzberg Two-Factor, McClelland, Vroom Expectancy, and Porter–Lawler) to workplace performance.',
        'Evaluate leadership styles across Rensis Likert’s Systems 1–4, Blake & Mouton’s (9, 9) Managerial Grid, and transformational vs. transactional paradigms.',
        'Close the management loop through feedforward, concurrent, and feedback control systems, break-even analysis, ROI budgeting, and PERT/CPM.'
      ],
      outcome:
        'Build high-capability teams, energize workforce performance through behavioral leadership, and govern execution using quantitative control tools.'
    },
    4: {
      title: 'Organisational Behaviour, Perception & Personality',
      objectives: [
        'Examine the interdisciplinary foundations, socio-technical elements, and four core goals of Organisational Behaviour across Autocratic, Custodial, Supportive, and Collegial models.',
        'Deconstruct the perceptual process—sensation, selection, organization (Gestalt principles), and interpretation—and mitigate attribution errors, halo effects, and stereotyping.',
        'Assess biological, family, cultural, and situational determinants of personality alongside Big Five (OCEAN), MBTI, Type A/B, and locus-of-control traits.',
        'Apply Albert Bandura’s social-cognitive and reciprocal determinism framework to workplace learning and self-efficacy.'
      ],
      outcome:
        'Diagnose individual behavioral drivers, reduce perceptual bias in managerial judgments, and align personality strengths with organizational roles.'
    },
    5: {
      title: 'Group Dynamics, Transactional Analysis & Organizational Change',
      objectives: [
        'Analyze Kurt Lewin’s group dynamics foundations, sociological group classifications, Homans’s interaction theory, Newcomb’s A-B-X balance model, and Tuckman’s five-stage team maturity cycle.',
        'Diagnose interpersonal workplace communication using Eric Berne’s Parent–Adult–Child ego states, complementary vs. crossed/ulterior transactions, life positions, and the Johari Window.',
        'Identify individual and organizational sources of resistance to planned change across structural, technological, and people dimensions.',
        'Lead sustainable transformation using Kurt Lewin’s Unfreezing–Moving–Refreezing force-field model and targeted OD interventions.'
      ],
      outcome:
        'Cultivate cohesive high-performing teams, foster Adult-to-Adult workplace communication, and guide organizations smoothly through strategic change.'
    }
  },
  anu_physics: {
    4: {
      title: 'Advanced Quantum Mechanics — Radiation-Matter Interaction',
      objectives: [
        'Formulate the total Hamiltonian of a charged particle coupled to an electromagnetic field in the Coulomb gauge.',
        'Quantize the electromagnetic radiation field into photon number states and interpret zero-point vacuum energy.',
        'Derive transition rates for absorption, stimulated emission, and spontaneous emission using time-dependent perturbation theory.',
        'Analyze Thomson, Rayleigh, and Compton photon-electron scattering cross-sections and selection rules.'
      ],
      outcome:
        'Model quantized light-matter interactions, radiative transitions, and photon scattering phenomena analytically.'
    },
    5: {
      title: 'Relativistic Quantum Mechanics — Klein-Gordon & Dirac Formalism',
      objectives: [
        'Derive the Klein-Gordon equation from the relativistic energy-momentum relation and evaluate its probability-density limitations.',
        'Construct Dirac’s first-order relativistic wave equation, 4x4 alpha/beta gamma matrices, and four-component bispinor solutions.',
        'Demonstrate positive-definite probability density, conserved four-current continuity, and Lorentz covariance in the Dirac theory.',
        'Interpret intrinsic spin-1/2 angular momentum, magnetic moment, and negative-energy sea / antiparticle states.'
      ],
      outcome:
        'Reconcile quantum mechanics with special relativity to solve spin-1/2 fermion dynamics and relativistic wave equations.'
    }
  },
  ento_131: {
    1: {
      title: 'Insect Digestive & Excretory Physiology',
      objectives: [
        'Examine the structural anatomy and regional differentiation of the Foregut (Stomodeum), Midgut (Mesenteron), and Hindgut (Proctodeum).',
        'Analyze specialized alimentary adaptations including the peritrophic membrane, filter chamber, and microbial endosymbiosis.',
        'Explain nitrogenous waste excretion via Malpighian tubules and cryptonephridial rectal water conservation.'
      ],
      outcome:
        'Relate insect alimentary and excretory physiology to feeding guild adaptations and pest management targets.'
    },
    2: {
      title: 'Insect Development, Molting & Metamorphosis',
      objectives: [
        'Differentiate ametabolous, hemimetabolous, and holometabolous post-embryonic developmental pathways.',
        'Trace endocrine regulation of ecdysis and metamorphosis mediated by PTTH, ecdysteroids, and juvenile hormone (JH).',
        'Evaluate ecological niche partitioning between larval and adult life stages.'
      ],
      outcome:
        'Diagnose developmental stages and hormonal checkpoints governing insect life cycles.'
    }
  },
  entomology: {
    1: {
      title: 'Insect Digestive & Excretory Physiology',
      objectives: [
        'Examine the structural anatomy and regional differentiation of the Foregut, Midgut, and Hindgut.',
        'Analyze specialized alimentary adaptations including the filter chamber and symbiotic digestion.',
        'Explain nitrogenous waste excretion via Malpighian tubules and rectal water conservation.'
      ],
      outcome:
        'Relate insect alimentary and excretory physiology to feeding guild adaptations.'
    },
    11: {
      title: 'Insect Development, Molting & Metamorphosis',
      objectives: [
        'Differentiate ametabolous, hemimetabolous, and holometabolous post-embryonic life cycles.',
        'Trace hormonal control mechanisms regulating insect molting and metamorphosis.',
        'Evaluate ecological advantages of complex insect life cycles.'
      ],
      outcome:
        'Diagnose developmental stages and hormonal checkpoints governing insect life cycles.'
    }
  }
};

const syllabusVideos: Record<string, Record<number, string>> = {
  management: {
    1: 'https://www.youtube.com/embed/SwcmRNZhlyo',
    2: 'https://www.youtube.com/embed/SwcmRNZhlyo',
    3: 'https://www.youtube.com/embed/SwcmRNZhlyo',
    4: 'https://www.youtube.com/embed/SwcmRNZhlyo',
    5: 'https://www.youtube.com/embed/SwcmRNZhlyo'
  },
  anu_physics: {
    4: 'https://www.youtube.com/embed/wla3hcd1S68',
    5: 'https://www.youtube.com/embed/wla3hcd1S68'
  },
  ento_131: {
    1: 'https://www.youtube.com/embed/K6TcM8Q-V3w'
  },
  entomology: {
    1: 'https://www.youtube.com/embed/K6TcM8Q-V3w'
  }
};

function getCleanUnitTitle(ch: Chapter, idx: number, detail?: UnitSyllabusDetail): string {
  if (detail?.title) return detail.title;
  const raw = (ch.name || '').trim();
  if (!raw || /^(unit|chapter)\s*[-–:]?\s*\d+$/i.test(raw)) {
    return `Unit ${idx + 1}`;
  }
  return raw;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    if (!courseId) return;

    Promise.all([getCourseById(courseId), getManifest()])
      .then(([courseData, manifestData]) => {
        if (courseData) {
          setCourse(courseData);
          const syllabus = getChapters(manifestData, courseId);
          setChapters(syllabus);
          if (syllabus.length > 0) {
            const requestedUnit = Number(searchParams.get('unit'));
            const matched = syllabus.find((ch) => ch.number === requestedUnit);
            setActiveSection(`unit-${(matched || syllabus[0]).number}`);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [courseId, searchParams]);

  const handleStartLearning = () => {
    if (!course) return;
    const activeChapter =
      chapters.find((ch) => `unit-${ch.number}` === activeSection) || chapters[0];
    const url = buildChapterUrl(
      {
        id: course.id,
        name: course.name,
        boardId: course.boardId,
        boardName: course.boardName,
        boardShortName: course.boardShortName,
        classId: course.classId,
        className: course.className
      },
      activeChapter?.number || 1
    );
    navigate(url);
  };

  if (loading) {
    return (
      <div className="sv-catalog">
        <SiteHeader backToCourses />
        <div className="sv-catalog-loading-state" style={{ minHeight: '60vh' }}>
          <div className="sv-catalog-spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="sv-catalog">
        <SiteHeader backToCourses />
        <div className="sv-catalog-empty-state" style={{ minHeight: '60vh' }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3>Course Not Found</h3>
          <p>The course you are looking for does not exist or has been removed.</p>
          <Link to="/" className="sv-catalog-primary-btn" style={{ textDecoration: 'none' }}>
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const { name, className, chapterCount, meta } = course;
  const { subtitle, description, discipline, instructor, durationHours, credits, language } = meta;
  const unitCount = chapters.length || chapterCount || 0;
  const hours = durationHours || (unitCount ? unitCount * 4 : 30);
  const creditCount = credits || 3;

  const activeChapterIndex = chapters.findIndex((ch) => `unit-${ch.number}` === activeSection);
  const resolvedIndex = activeChapterIndex !== -1 ? activeChapterIndex : 0;
  const activeChapter = chapters[resolvedIndex];
  const unitDetail = activeChapter ? syllabusUnits[course.id]?.[activeChapter.number] : undefined;
  const unitTitle = activeChapter ? getCleanUnitTitle(activeChapter, resolvedIndex, unitDetail) : '';
  const videoUrl = activeChapter
    ? syllabusVideos[course.id]?.[activeChapter.number] || 'https://www.youtube.com/embed/SwcmRNZhlyo'
    : '';

  return (
    <div className="sv-catalog sv-catalog--detail">
      <SiteHeader backToCourses />

      {/* Compact Course Header + Integrated Unit Toggle Band */}
      <section className="sv-detail-header-band">
        <div className="sv-detail-header-inner">
          <div className="sv-detail-header-top">
            <div className="sv-detail-title-block">
              <div className="sv-detail-eyebrow">
                {[className, discipline, instructor?.name].filter(Boolean).join(' · ')}
              </div>
              <h1 className="sv-detail-title">{name}</h1>
              {subtitle && <p className="sv-detail-subtitle">{subtitle}</p>}
            </div>

            <div className="sv-detail-header-right">
              <dl className="sv-detail-metrics">
                <div className="sv-detail-metric">
                  <dt>Units</dt>
                  <dd>{unitCount}</dd>
                </div>
                <div className="sv-detail-metric">
                  <dt>Duration</dt>
                  <dd>{hours}h</dd>
                </div>
                <div className="sv-detail-metric">
                  <dt>Credits</dt>
                  <dd>{creditCount}</dd>
                </div>
                <div className="sv-detail-metric">
                  <dt>Language</dt>
                  <dd>{language || 'English'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {chapters.length > 0 && (
            <nav className="sv-detail-unit-tabs" aria-label="Course Units">
              {chapters.map((ch, idx) => {
                const hasAssets = Boolean(ch && (ch.resourceCount ?? 0) > 0);
                const isSelected = `unit-${ch.number}` === activeSection;
                return (
                  <button
                    key={ch.number}
                    type="button"
                    disabled={!hasAssets}
                    onClick={() => {
                      if (hasAssets) setActiveSection(`unit-${ch.number}`);
                    }}
                    className={`sv-detail-unit-tab ${isSelected ? 'is-active' : ''}`}
                    title={hasAssets ? `Unit ${idx + 1}` : `Unit ${idx + 1} (Unavailable)`}
                  >
                    Unit {idx + 1}
                    {!hasAssets && <span className="sv-detail-tab-muted">(Soon)</span>}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </section>

      {/* Above-the-Fold Main Workspace */}
      <main className="sv-detail-workspace">
        {!activeChapter ? (
          <div className="sv-detail-panel">
            <p className="sv-detail-muted">Syllabus details are being finalized.</p>
          </div>
        ) : (
          <div className="sv-detail-panel">
            <div className="sv-detail-grid">
              {/* Left Column: Lecture Preview + Compact Course & Faculty Context */}
              <div className="sv-detail-left-col">
                <div className="sv-detail-video-frame">
                  {videoUrl ? (
                    <div className="sv-video-wrapper">
                      <iframe
                        src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}cc_load_policy=0&rel=0`}
                        title={`Lecture Preview — Unit ${resolvedIndex + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div className="sv-detail-video-watermark">
                        <img
                          src={sessionStorage.getItem('sv_logo') || '/brand-logo.png'}
                          alt=""
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="sv-detail-video-placeholder">
                      <span>Preview lecture unavailable</span>
                    </div>
                  )}
                </div>

                <div className="sv-detail-course-brief">
                  {description && (
                    <div className="sv-detail-brief-block">
                      <h2 className="sv-detail-label">About This Course</h2>
                      <p className="sv-detail-brief-text">{description}</p>
                    </div>
                  )}

                  {instructor?.name && (
                    <div className="sv-detail-faculty-row">
                      <span className="sv-detail-label">Faculty</span>
                      <div className="sv-detail-faculty-meta">
                        <strong>{instructor.name}</strong>
                        {instructor.title && <span>{instructor.title}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Unit Title, Detailed Objectives & Outcome */}
              <div className="sv-detail-right-col">
                <div className="sv-detail-unit-header">
                  <span className="sv-detail-unit-kicker">Unit {resolvedIndex + 1} Syllabus</span>
                  <h2 className="sv-detail-unit-heading">{unitTitle}</h2>
                </div>

                <div className="sv-detail-objectives-block">
                  <h3 className="sv-detail-label">Unit Objectives</h3>
                  {unitDetail && unitDetail.objectives.length > 0 ? (
                    <ul className="sv-detail-objectives-list">
                      {unitDetail.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="sv-detail-muted">
                      Structured study notes, flashcards, and assessments are available inside the learning workspace for this unit.
                    </p>
                  )}
                </div>

                {unitDetail?.outcome && (
                  <div className="sv-detail-outcome-box">
                    <span className="sv-detail-label">Learning Outcome</span>
                    <p>{unitDetail.outcome}</p>
                  </div>
                )}

                <div className="sv-detail-unit-footer">
                  <span className="sv-detail-resource-note">
                    Includes guided lectures, study notes, flashcards, and unit assessments
                  </span>
                  <button
                    type="button"
                    className="sv-detail-start-btn"
                    onClick={handleStartLearning}
                  >
                    Open Unit {resolvedIndex + 1}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
