import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCourseById } from '../data/contentRepository';

export default function ManagementMindmap() {
  const navigate = useNavigate();
  const location = useLocation();
  const courseState = location.state?.course;

  useEffect(() => {
    if (courseState) {
      const params = new URLSearchParams({
        boardId: courseState.boardId || 'university',
        boardName: courseState.boardName || 'Nagarjuna University',
        cId: `${courseState.boardId}_${courseState.classId}`,
        className: `${courseState.boardShortName || courseState.boardName || ''} ${courseState.className || ''}`.trim(),
        sId: courseState.id,
        subjectName: courseState.name || ''
      });
      navigate(`/chapters?${params.toString()}`, { replace: true });
    } else {
      getCourseById('management').then(course => {
        if (course) {
          const params = new URLSearchParams({
            boardId: course.boardId || 'university',
            boardName: course.boardName || 'Nagarjuna University',
            cId: `${course.boardId}_${course.classId}`,
            className: `${course.boardShortName || course.boardName || ''} ${course.className || ''}`.trim(),
            sId: course.id,
            subjectName: course.name || ''
          });
          navigate(`/chapters?${params.toString()}`, { replace: true });
        } else {
          navigate('/my-learning', { replace: true });
        }
      });
    }
  }, [courseState, navigate]);

  return null;
}
