import React from 'react';
import { useNavigate } from 'react-router-dom';
import { type Course, type Chapter } from '@/data/contentRepository';
import {
  GUIDED_FLOW,
  getCompletedTools,
  isChapterComplete,
  getChapterVideoCount,
  isVideoWatched,
} from '@/utils/guidedFlow';

interface CourseCardProps {
  course: Course;
  chapters?: Chapter[];
  index: number;
}

function formatUnitTooltip(rawName: string | undefined, idx: number): string {
  const cleaned = (rawName || '').trim();
  if (!cleaned || /^(unit|chapter)\s*[-–:]?\s*\d+$/i.test(cleaned)) {
    return `Unit ${idx + 1}`;
  }
  return `Unit ${idx + 1}: ${cleaned}`;
}

function getUnitProgressPercent(subjectId: string, chapterNumber: number): { isDone: boolean; percent: number } {
  const done = isChapterComplete(subjectId, chapterNumber);
  if (done) return { isDone: true, percent: 100 };

  const videoCount = getChapterVideoCount(subjectId, chapterNumber);
  if (videoCount > 0) {
    let watched = 0;
    for (let i = 1; i <= videoCount; i++) {
      if (isVideoWatched(subjectId, chapterNumber, i)) watched++;
    }
    const completedRoot = getCompletedTools(subjectId, chapterNumber).length;
    const pct = Math.min(95, Math.round(((watched + Math.min(1, completedRoot * 0.25)) / (videoCount + 0.25)) * 100));
    return { isDone: false, percent: pct };
  }

  const completed = getCompletedTools(subjectId, chapterNumber);
  if (completed.length === 0) return { isDone: false, percent: 0 };
  const pct = Math.min(95, Math.round((completed.length / GUIDED_FLOW.length) * 100));
  return { isDone: false, percent: pct };
}

export default function CourseCard({ course, chapters = [], index }: CourseCardProps) {
  const navigate = useNavigate();
  const { id, name, className, chapterCount, meta } = course;
  const { subtitle, discipline, durationHours, credits, instructor, thumbnail } = meta;

  const bgImage = thumbnail || '/management_banner.png';
  const unitCount = chapters.length || chapterCount || 0;
  const hours = durationHours || (unitCount ? unitCount * 4 : 30);
  const creditCount = credits || 3;

  const unitStats = chapters.map((ch, idx) => {
    const { isDone, percent } = getUnitProgressPercent(id, ch.number);
    return {
      chapterNumber: ch.number,
      displayIndex: idx + 1,
      tooltip: formatUnitTooltip(ch.name, idx),
      isDone,
      percent,
    };
  });

  const coursePercent =
    unitStats.length > 0
      ? Math.round(unitStats.reduce((sum, u) => sum + u.percent, 0) / unitStats.length)
      : 0;

  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (coursePercent / 100) * circumference;

  const handleCardClick = () => {
    navigate(`/course/${id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/course/${id}`);
    }
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="sv-course-card fade-in"
      style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}
    >
      <div className="sv-course-card-main">
        {/* Left: Crisp White Squircle Artwork */}
        <div className="sv-course-art-squircle">
          <img
            src={bgImage}
            alt={name}
            className="sv-course-art-img"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = '/management_banner.png';
            }}
          />
          {className && <span className="sv-course-prog-pill">{className}</span>}
        </div>

        {/* Right: Title, Faculty, Progress Ring & Stat Pills */}
        <div className="sv-course-card-info">
          <div className="sv-course-title-row">
            <div className="sv-course-heading-group">
              {discipline && <span className="sv-course-discipline">{discipline}</span>}
              <h3 className="sv-course-title">{name}</h3>
              <p className="sv-course-subtitle">{subtitle || `Structured university curriculum in ${name}`}</p>
            </div>

            {/* Saral Vidhya Circular Progress Ring */}
            <div
              className={`sv-course-progress-ring ${coursePercent === 100 ? 'is-complete' : ''}`}
              title={`${coursePercent}% course progress`}
            >
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle
                  className="sv-ring-track"
                  cx="22"
                  cy="22"
                  r={radius}
                  fill="none"
                  strokeWidth="3.4"
                />
                <circle
                  className="sv-ring-fill"
                  cx="22"
                  cy="22"
                  r={radius}
                  fill="none"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 22 22)"
                />
              </svg>
              <span className="sv-ring-label">{coursePercent}%</span>
            </div>
          </div>

          {instructor?.name && (
            <div className="sv-course-faculty-line">
              <span className="sv-course-faculty-dot" aria-hidden="true">
                {instructor.name.replace(/^Prof\.?\s*|^Dr\.?\s*/i, '').charAt(0) || 'F'}
              </span>
              <span className="sv-course-faculty-name">{instructor.name}</span>
            </div>
          )}
          {/* Inline Course Metrics */}
          <div className="sv-course-stat-pills">
            <span className="sv-course-stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              {unitCount} {unitCount === 1 ? 'Unit' : 'Units'}
            </span>

            <span className="sv-course-stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {hours} Hours
            </span>

            <span className="sv-course-stat-pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="7" y1="9" x2="17" y2="9" />
                <line x1="7" y1="13" x2="13" y2="13" />
              </svg>
              {creditCount} {creditCount === 1 ? 'Credit' : 'Credits'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Unit Quick-Jump Bar */}
      <div className="sv-course-units-bar">
        <div className="sv-course-units-list">
          <span className="sv-course-units-label">Units</span>
          {unitStats.length > 0 ? (
            <div className="sv-course-unit-pills">
              {unitStats.map((u) => {
                const stateClass = u.isDone
                  ? 'is-done'
                  : u.percent > 0
                    ? 'is-progress'
                    : '';
                return (
                  <div key={u.chapterNumber} className="sv-unit-pill-wrap">
                    <button
                      type="button"
                      className={`sv-unit-circle ${stateClass}`}
                      aria-label={u.tooltip}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/course/${id}?unit=${u.chapterNumber}`);
                      }}
                    >
                      {u.displayIndex}
                    </button>
                    <span className="sv-unit-tooltip">{u.tooltip}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="sv-course-units-empty">Structured syllabus</span>
          )}
        </div>

        <span className="sv-course-open-cta">
          Open Course
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </article>
  );
}
