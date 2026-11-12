import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getCourseById } from '@/data/contentRepository';
import { buildChapterUrl } from '@/utils/courseNavigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function CourseRegister() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!courseId) {
      navigate('/', { replace: true });
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    const targetChapter = searchParams.get('chapter')
      ? parseInt(searchParams.get('chapter') as string, 10)
      : 1;

    getCourseById(courseId)
      .then((data) => {
        if (data) {
          navigate(buildChapterUrl(data, targetChapter), { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        navigate('/', { replace: true });
      });
  }, [courseId, location.search, navigate]);

  return (
    <div className="sv-catalog">
      <SiteHeader />
      <div className="sv-catalog-loading-state" style={{ minHeight: '60vh' }}>
        <div className="sv-catalog-spinner"></div>
        <p>Opening study tools...</p>
      </div>
      <SiteFooter />
    </div>
  );
}
