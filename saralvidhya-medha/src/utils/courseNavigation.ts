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

export interface MoocsStudySession {
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

export const TOOL_ID_TO_SLUG: Record<string, string> = {
  videos: 'watch',
  summary: 'essentials',
  detailed: 'in-depth',
  flashcards: 'flashcards',
  assessment: 'assessments',
  revision_flashcards: 'revise',
  mocktest: 'mock-test',
  prep_exam: 'exam-prep',
  pre_final_test: 'certification-exam',
  ask: 'ask',
  mindmap: 'mindmap',
  podcasts: 'podcasts',
  pyq: 'pyq',
  qbank: 'question-bank',
  deep_dive: 'deep-dive',
};

export const SLUG_TO_TOOL_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TOOL_ID_TO_SLUG).map(([toolId, slug]) => [slug, toolId]),
);

export function getPathForTool(toolId?: string | null): string {
  const slug = (toolId && TOOL_ID_TO_SLUG[toolId]) || 'watch';
  return `/${slug}`;
}

export function getToolFromPath(pathname: string): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!slug) return null;
  return SLUG_TO_TOOL_ID[slug] || null;
}

const STUDY_SESSION_KEY = 'sv_moocs_study_session';
const LEGACY_STUDY_SESSION_KEY = 'sv_medha_study_session';

export function getMoocsStudySession(): Partial<MoocsStudySession> {
  try {
    const raw =
      sessionStorage.getItem(STUDY_SESSION_KEY) ||
      localStorage.getItem(STUDY_SESSION_KEY) ||
      sessionStorage.getItem(LEGACY_STUDY_SESSION_KEY) ||
      localStorage.getItem(LEGACY_STUDY_SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateMoocsStudySession(patch: Partial<MoocsStudySession>): void {
  try {
    const current = getMoocsStudySession();
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

  updateMoocsStudySession({
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

  return getPathForTool('videos');
}
