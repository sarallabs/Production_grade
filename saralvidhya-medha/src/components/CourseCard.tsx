import React from 'react';
import { Link } from 'react-router-dom';
import { type Course } from '@/data/contentRepository';

interface CourseCardProps {
  course: Course;
  index: number;
}

export default function CourseCard({ course, index }: CourseCardProps) {
  const { id, name, className, chapterCount, meta } = course;
  const { subtitle, durationHours, instructor, thumbnail, tags } = meta;

  const bgImage = thumbnail || '/management_banner.png';

  return (
    <Link 
      to={`/course/${id}`} 
      className="sv-catalog-card sv-catalog-card--modern fade-in"
      style={{
        animationDelay: `${index * 0.07}s`,
        backgroundImage: `url(${bgImage})`,
      } as React.CSSProperties}
    >
      <div className="sv-catalog-card-overlay">
        {/* Top/badges - visible initially */}
        <div className="sv-catalog-card-badges">
          <span className="sv-catalog-badge sv-catalog-badge--duration">
            {durationHours || (chapterCount ? chapterCount * 4 : 30)} Hours
          </span>
        </div>

        <div className="sv-catalog-card-content">
          <div className="sv-catalog-card-meta-line">{className}</div>
          <h3 className="sv-catalog-card-title">{name}</h3>
          
          <div className="sv-catalog-card-hover-content">
            <p className="sv-catalog-card-subtitle">{subtitle || `Learn ${name}`}</p>
            
            {tags && tags.length > 0 && (
              <div className="sv-catalog-card-tags">
                {tags.map((tag) => (
                  <span key={tag} className="sv-catalog-card-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="sv-catalog-card-instructor">
              <div className="sv-catalog-instructor-avatar">
                {instructor?.avatar ? (
                  <img src={instructor.avatar} alt={instructor.name} />
                ) : (
                  <div className="sv-catalog-instructor-initial">
                    {instructor?.name ? instructor.name.charAt(0) : 'F'}
                  </div>
                )}
              </div>
              <div className="sv-catalog-instructor-info">
                <span className="sv-catalog-instructor-name">{instructor?.name || 'Faculty Member'}</span>
                <span className="sv-catalog-instructor-title">{instructor?.title || 'Instructor'}</span>
              </div>
            </div>
            
            <div className="sv-catalog-card-footer">
               <div className="sv-catalog-card-stats">
                 <span className="sv-catalog-stat-chapters">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                   </svg>
                   {chapterCount} {chapterCount === 1 ? 'Unit' : 'Units'}
                 </span>
                 {meta.enrolled !== undefined && meta.enrolled > 0 && (
                   <span className="sv-catalog-stat-enrolled">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     </svg>
                     {meta.enrolled.toLocaleString()}
                   </span>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
