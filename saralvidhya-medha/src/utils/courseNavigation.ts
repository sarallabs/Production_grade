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

export interface MedhaStudySession {
  boardId: string;
  boardName: string;
  cId: string;
  className: string;
  sId: string;
  subjectName: string;
  semesterName?: string;
  persona: string;
  chapter: number;
  chapterName?: string;
  video: number;
  tool: string;
}

const STUDY_SESSION_KEY = 'sv_medha_study_session';

export function getMedhaStudySession(): Partial<MedhaStudySession> {
  try {
    const raw = sessionStorage.getItem(STUDY_SESSION_KEY) || localStorage.getItem(STUDY_SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateMedhaStudySession(patch: Partial<MedhaStudySession>): void {
  try {
    const current = getMedhaStudySession();
    const next = { ...current, ...patch };
    const serialized = JSON.stringify(next);
    sessionStorage.setItem(STUDY_SESSION_KEY, serialized);
    localStorage.setItem(STUDY_SESSION_KEY, serialized);
  } catch {
    // ignore storage errors
  }
}

export function buildChapterUrl(course: NavigationCourseInput, chapterNumber: number = 1): string {
  const boardShortName = course.boardShortName || course.boardName;

  // Bypass registration, payment, and onboarding gates so user goes straight to study tools
  localStorage.setItem(`registered_${course.id}`, 'true');
  localStorage.setItem(`registered_details_${course.id}`, 'true');
  if (!localStorage.getItem('username')) {
    localStorage.setItem('username', 'ANU Student');
  }
  if (!localStorage.getItem('saral_student_profile')) {
    localStorage.setItem('saral_student_profile', JSON.stringify({
      firstName: localStorage.getItem('username') || 'ANU Student',
      lastName: '',
      email: 'student@saralvidhya.com',
      phone: '9999999999',
      university: boardShortName || 'University',
      bypassed: true,
    }));
  }
  if (localStorage.getItem('questionnaire_completed') !== 'true') {
    localStorage.setItem('questionnaire_completed', 'true');
  }

  const userPersona = (localStorage.getItem('user_persona') || 'beginner').toLowerCase();

  const cId = `${course.boardId}_${course.classId}`;
  const sId = course.id;
  localStorage.setItem(`persona_${cId}_${sId}`, userPersona);

  const username = localStorage.getItem('username') || '';
  if (username) {
    setStudentPersona(username, userPersona);
  }

  updateMedhaStudySession({
    boardId: course.boardId,
    boardName: boardShortName,
    cId,
    className: `${boardShortName} ${course.className}`,
    sId: course.id,
    subjectName: course.name,
    persona: userPersona,
    chapter: chapterNumber,
    video: 1,
    tool: 'videos',
  });

  return '/study-table';
}
