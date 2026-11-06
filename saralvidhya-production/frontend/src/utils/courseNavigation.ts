import { setStudentPersona } from './credentialsStore';

export interface NavigationCourseInput {
  id: string; // sId
  name: string; // subjectName
  boardId: string;
  boardName: string;
  boardShortName?: string;
  classId: string;
  className: string;
}

export function buildChapterUrl(course: NavigationCourseInput, chapterNumber: number = 1): string {
  const boardShortName = course.boardShortName || course.boardName;
  const params = new URLSearchParams({
    boardId: course.boardId,
    boardName: boardShortName,
    cId: `${course.boardId}_${course.classId}`,
    className: `${boardShortName} ${course.className}`,
    sId: course.id,
    subjectName: course.name,
  });

  const userPersona = (localStorage.getItem('user_persona') || 'beginner').toLowerCase();
  
  const cId = `${course.boardId}_${course.classId}`;
  const sId = course.id;
  localStorage.setItem(`persona_${cId}_${sId}`, userPersona);
  
  const username = localStorage.getItem('username') || '';
  if (username) {
    setStudentPersona(username, userPersona);
  }

  params.set('persona', userPersona);
  params.set('chapter', String(chapterNumber));
  params.set('video', '1');
  params.set('tool', 'videos');
  return `/study-table?${params.toString()}`;
}
