import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getCourseById, getManifest, getChapters, type Course, type Chapter } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';

function getCleanUnitTitle(ch: Chapter, idx: number): string {
  const preferred = (ch.title || ch.name || '').trim();
  if (!preferred || /^(unit|chapter)\s*[-–:]?\s*\d+$/i.test(preferred)) {
    return `Unit ${idx + 1}`;
  }
  return preferred;
}

function toYoutubeEmbedUrl(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{11}/i.test(trimmed)) {
    return trimmed;
  }
  const m = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
  );
  if (m?.[1]) {
    return `https://www.youtube.com/embed/${m[1]}`;
  }
  return trimmed;
}

function resolveUnitPreviewVideoUrl(ch?: Chapter): string {
  if (!ch) return '';
  if (ch.previewVideoUrl && ch.previewVideoUrl.trim()) {
    return toYoutubeEmbedUrl(ch.previewVideoUrl);
  }
  const firstVideo = ch.videos?.find((v) => v?.ytId || (v as any)?.videoUrl || (v as any)?.url);
  if (firstVideo?.ytId) {
    return `https://www.youtube.com/embed/${firstVideo.ytId}`;
  }
  const rawUrl = (firstVideo as any)?.videoUrl || (firstVideo as any)?.url;
  if (rawUrl) {
    return toYoutubeEmbedUrl(rawUrl);
  }
  return '';
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
          const syllabus = getChapters(manifestData, courseData.id);
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
  const {
    subtitle,
    discipline,
    instructor,
    durationHours,
    hoursPerWeek,
    credits,
    language,
    code,
    regulation,
    semester,
    structureCode,
    structureLabel,
    evaluation,
    courseOutcomes,
    prerequisites,
    textbooks,
  } = meta;
  const unitCount = chapters.length || chapterCount || 0;
  const hours = durationHours || (unitCount ? unitCount * 4 : 30);
  const creditCount = credits ?? 3;
  const formattedCode = code ? (regulation ? `${code} (${regulation})` : code) : undefined;
  const structureText =
    structureLabel && structureCode
      ? `${structureLabel} (${structureCode})`
      : structureLabel || structureCode;

  const activeChapterIndex = chapters.findIndex((ch) => `unit-${ch.number}` === activeSection);
  const resolvedIndex = activeChapterIndex !== -1 ? activeChapterIndex : 0;
  const activeChapter = chapters[resolvedIndex];
  const unitTitle = activeChapter ? getCleanUnitTitle(activeChapter, resolvedIndex) : '';
  const unitObjectives = activeChapter?.objectives || [];
  const unitOutcome = activeChapter?.outcome;
  const videoUrl = resolveUnitPreviewVideoUrl(activeChapter);

  const evalTotal = evaluation?.totalMarks || (evaluation ? evaluation.internalMarks + evaluation.externalMarks : 0);
  const internalPct = evalTotal > 0 && evaluation ? Math.round((evaluation.internalMarks / evalTotal) * 100) : 0;
  const externalPct = evalTotal > 0 && evaluation ? 100 - internalPct : 0;

  return (
    <div className="sv-catalog sv-catalog--detail">
      <SiteHeader backToCourses />

      {/* Compact Course Header + Integrated Unit Toggle Band */}
      <section className="sv-detail-header-band">
        <div className="sv-detail-header-inner">
          <div className="sv-detail-header-top">
            <div className="sv-detail-title-block">
              {(formattedCode || structureText) && (
                <div className="sv-detail-academic-chips">
                  {formattedCode && <span className="sv-course-code-badge">{formattedCode}</span>}
                  {semester && <span className="sv-course-meta-tag">{semester}</span>}
                  {structureText && (
                    <span className="sv-course-meta-tag sv-course-meta-tag--structure">
                      {structureText}
                    </span>
                  )}
                </div>
              )}
              <div className="sv-detail-eyebrow">
                {[className, !formattedCode ? semester : undefined, discipline, instructor?.name]
                  .filter(Boolean)
                  .join(' · ')}
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
                {hoursPerWeek ? (
                  <div className="sv-detail-metric">
                    <dt>Duration</dt>
                    <dd>{hoursPerWeek} hr / week</dd>
                  </div>
                ) : (
                  <div className="sv-detail-metric">
                    <dt>Duration</dt>
                    <dd>{hours}h</dd>
                  </div>
                )}
                <div className="sv-detail-metric">
                  <dt>Credits</dt>
                  <dd>{creditCount}</dd>
                </div>
                {evaluation && (
                  <div className="sv-detail-metric">
                    <dt>Max Marks</dt>
                    <dd>{evalTotal}</dd>
                  </div>
                )}
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
                  {evaluation && evalTotal > 0 && (
                    <div className="sv-detail-eval-card">
                      <div className="sv-detail-eval-header">
                        <h2 className="sv-detail-label">
                          Evaluation Scheme{regulation ? ` (${regulation})` : ''}
                        </h2>
                        <span className="sv-detail-eval-total">
                          Max. Marks: {evalTotal}
                        </span>
                      </div>
                      <div className="sv-detail-eval-bar" aria-hidden="true">
                        <div
                          className="sv-detail-eval-seg--ie"
                          style={{ width: `${internalPct}%` }}
                        />
                        <div
                          className="sv-detail-eval-seg--see"
                          style={{ width: `${externalPct}%` }}
                        />
                      </div>
                      <div className="sv-detail-eval-legend">
                        <span className="sv-detail-eval-legend-item">
                          <span className="sv-detail-eval-dot sv-detail-eval-dot--ie" />
                          <strong>{evaluation.internalLabel || 'IE'}:</strong> {evaluation.internalMarks} Marks
                        </span>
                        <span className="sv-detail-eval-legend-item">
                          <span className="sv-detail-eval-dot sv-detail-eval-dot--see" />
                          <strong>{evaluation.externalLabel || 'SEE'}:</strong> {evaluation.externalMarks} Marks
                        </span>
                      </div>
                    </div>
                  )}

                  {courseOutcomes && courseOutcomes.length > 0 && (
                    <div className="sv-detail-brief-block">
                      <h2 className="sv-detail-label">Course Outcomes</h2>
                      <ul className="sv-detail-extra-list">
                        {courseOutcomes.map((co, idx) => (
                          <li key={idx}>{co}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prerequisites && prerequisites.length > 0 && (
                    <div className="sv-detail-brief-block">
                      <h2 className="sv-detail-label">Prerequisites</h2>
                      <ul className="sv-detail-extra-list">
                        {prerequisites.map((pre, idx) => (
                          <li key={idx}>{pre}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {textbooks && textbooks.length > 0 && (
                    <div className="sv-detail-brief-block">
                      <h2 className="sv-detail-label">Recommended References</h2>
                      <ul className="sv-detail-extra-list">
                        {textbooks.map((book, idx) => (
                          <li key={idx}>{book}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {instructor?.name && (
                    <div className="sv-detail-faculty-row">
                      <span className="sv-detail-label">Faculty</span>
                      <div className="sv-detail-faculty-meta">
                        <strong>{instructor.name}</strong>
                        {instructor.title && <span>{instructor.title}</span>}
                        {instructor.department && <span>{instructor.department}</span>}
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
                  {unitObjectives.length > 0 ? (
                    <ul className="sv-detail-objectives-list">
                      {unitObjectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="sv-detail-muted">
                      Structured study notes, flashcards, and assessments are available inside the learning workspace for this unit.
                    </p>
                  )}
                </div>

                {unitOutcome && (
                  <div className="sv-detail-outcome-box">
                    <span className="sv-detail-label">Learning Outcome</span>
                    <p>{unitOutcome}</p>
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
