import {
  type AssessmentQuestion,
  type MCQQuestion,
  type MSQQuestion,
} from '../utils/assessmentTypes';
import { MOCK_ASSESSMENT_QUESTIONS } from '../utils/assessmentMock';
import { 
  API_BASE_URL, 
  BACKEND_SUBJECTS,
  DifficultyLevel,
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  getChapterVideos
} from './manifestService';

function mapBackendQuestions(data: any[]): AssessmentQuestion[] {
  return data.map((q: any, index: number) => {
    const optsObj = q.Options || {};
    const keys = ['A', 'B', 'C', 'D', 'E', 'F'].filter(k => optsObj[k]);
    const optionsList = keys.map(k => optsObj[k]);

    let answer: any;
    if (q.QuestionType === 'MSQ') {
      answer = (q.RightAnswers || []).map((ra: string) => keys.indexOf(ra)).filter((idx: number) => idx >= 0);
    } else {
      answer = keys.indexOf((q.RightAnswers || [])[0]);
      if (answer < 0) answer = 0;
    }

    return {
      id: `q${index}`,
      type: q.QuestionType.toLowerCase(),
      q: q.Question,
      options: optionsList,
      answer: answer,
      explanation: q.source_reference || ''
    } as AssessmentQuestion;
  });
}

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Hard',
};

export async function fetchAndParseFirst(
  urls: string[],
  prefix: string,
): Promise<AssessmentQuestion[]> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) continue;
      
      const text = await res.text();
      
      try {
        const parsed = JSON.parse(text);
        let rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
        if (rawQuestions.length > 0) {
          return rawQuestions.map((q: any, i: number) => {
            const rawOptions = Array.isArray(q.options) ? q.options : [];
            const cleanedOptions = rawOptions.map((opt: string) => opt.replace(/^[A-D]\)\s*/, ''));

            const resolveIndex = (ans: string): number => {
              const stripped = ans.replace(/^[A-D]\)\s*/, '').trim().toLowerCase();
              const letterMatch = ans.trim().match(/^([A-D])\b/i);
              if (letterMatch) {
                const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65; 
                if (idx >= 0 && idx < cleanedOptions.length) return idx;
              }
              const textIdx = cleanedOptions.findIndex(
                (opt: string) => opt.trim().toLowerCase() === stripped,
              );
              return textIdx; 
            };

            const isMSQ = Array.isArray(q.answer) || (typeof q.answer === 'string' && q.answer.includes(',') && !q.answer.startsWith('A)'));

            let answerIndices: number | number[];
            if (Array.isArray(q.answer)) {
              const indices = q.answer.map((a: string) => resolveIndex(String(a))).filter((idx: number) => idx !== -1);
              answerIndices = indices.length === 1 ? indices[0] : indices;
            } else {
              const idx = resolveIndex(String(q.answer ?? ''));
              answerIndices = isMSQ ? (idx === -1 ? [] : [idx]) : (idx === -1 ? 0 : idx);
            }

            return {
              id: q.id || `${prefix}${i + 1}`,
              type: isMSQ ? 'msq' : 'mcq',
              q: (q.stem || q.question || '').replace(/^\[.*?\]\s*/, ''),
              options: cleanedOptions,
              answer: answerIndices,
              explanation: q.explanation || '',
              videoTime: 0,
            };
          });
        }
      } catch (e) {
      }
      
      return parseAssessmentMarkdown(text, prefix);
    } catch {
    }
  }
  return [];
}

export async function getAssessments(
  subject: string,
  chapterNumber: number,
  level: DifficultyLevel = 'intermediate',
  videoDir?: string,
): Promise<AssessmentQuestion[]> {
  if (BACKEND_SUBJECTS.has(subject)) {
    try {
      const diff = DIFFICULTY_MAP[level] || 'Medium';
      const apiUrl = `${API_BASE_URL}/folders/${subject}/assessments?difficulty=${diff}`;
      const res = await fetch(apiUrl);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return mapBackendQuestions(data);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch assessments from API", e);
    }
  }

  await getManifest();
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);

  const assessmentLevel = level === 'beginner' ? 'easy' : level === 'advanced' ? 'hard' : 'medium';

  let allQuestions: AssessmentQuestion[] = [];

  const mcqPaths = [
    ...(videoDir ? [`${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`] : []),
    `${subjectBase}/${chDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/unit_1/Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MCQ/mcq_prep_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MCQ/mcq_prep_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/${level}/mcq.md`,
    `${subjectBase}/${chDir}/${level}/assessment.md`,
    `${subjectBase}/${chDir}/assessment.md`,
    `${subjectBase}/${chDir}/${level}/quiz.md`,
    `${subjectBase}/${chDir}/quiz.md`
  ];
  allQuestions = allQuestions.concat(await fetchAndParseFirst(mcqPaths, 'mcq_'));

  const msqPaths = [
    ...(videoDir ? [`${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`] : []),
    `${subjectBase}/${chDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/unit_1/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/${level}/msq.md`
  ];
  allQuestions = allQuestions.concat(await fetchAndParseFirst(msqPaths, 'msq_'));

  return allQuestions.length > 0 ? allQuestions : MOCK_ASSESSMENT_QUESTIONS;
}

export const CHAPTER_EXAM_FILES = {
  mock: 'Prepare/Mock_Test/mock_test.md',
  pre_final: 'Examination/pre_final_exam.md',
  certification: 'Examination/certification_exam.md',
} as const;

export type ChapterExamKind = keyof typeof CHAPTER_EXAM_FILES;

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  let state = hashString(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function getChapterExamQuestions(
  subject: string,
  chapterNumber: number,
  kind: ChapterExamKind,
): Promise<(MCQQuestion | MSQQuestion)[]> {
  const videos = await getChapterVideos(subject, chapterNumber);
  const chDir = getChapterDir(subject, chapterNumber);
  const subjectBase = getSubjectBaseUrl(subject);
  const fileName = CHAPTER_EXAM_FILES[kind];

  let rawQuestions: AssessmentQuestion[] = [];

  if (videos.length > 0) {
    const perVideo = await Promise.all(
      videos.map((video) =>
        fetchAndParseFirst([`${subjectBase}/${chDir}/${video.dir}/${fileName}`], `${kind}_v${video.index}_`),
      ),
    );
    rawQuestions = perVideo.flat();
  }

  if (rawQuestions.length === 0) {
    const baseName = fileName.split('/').pop() || fileName;
    const candidates = [
      `${subjectBase}/${chDir}/${fileName}`,
      `${subjectBase}/${chDir}/Examination/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/Mock_Test/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/Mock_Test/mock_test_chapter_${chapterNumber}.md`,
      `${subjectBase}/${chDir}/Prepare/Practice_Exam/practice_exam_50_questions.json`,
      `${subjectBase}/${chDir}/Prepare/Practice_Exam/practice_exam_50_questions.md`,
      `${subjectBase}/${chDir}/${baseName}`,
    ];
    rawQuestions = await fetchAndParseFirst(candidates, `${kind}_ch_`);
  }

  const seen = new Set<string>();
  const merged: (MCQQuestion | MSQQuestion)[] = [];
  for (const question of rawQuestions) {
    if (question.type !== 'mcq' && question.type !== 'msq') continue;
    const key = question.q.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
  }

  return seededShuffle(merged, `${subject}_${chapterNumber}_${kind}`);
}

const OPTION_LINE = /^[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?([A-Z])\)[ \t]*(.+)$/gm;

function splitQuestionBlocks(md: string): string[] {
  const byHeading = md.split(/^#{1,6}[ \t]+Question[ \t]+\d+.*$/gm).slice(1);
  if (byHeading.length > 0) return byHeading;
  return md.split(/(?=\*\*Question:\*\*)/).filter((b) => b.includes('**Question:**'));
}

export function parseAssessmentMarkdown(mdRaw: string, prefix: string): AssessmentQuestion[] {
  const md = mdRaw.replace(/\r\n/g, '\n');
  const questions: AssessmentQuestion[] = [];

  for (const [i, block] of splitQuestionBlocks(md).entries()) {
    if (!block.includes('**Question:**')) continue;

    const opts = [...block.matchAll(OPTION_LINE)]
      .map((m) => ({ letter: m[1], text: m[2].trim() }))
      .filter((o) => o.text.length > 0);
    if (opts.length === 0) continue;

    const qMatch = block.match(
      /\*{0,2}Question:\*{0,2}\s*([\s\S]*?)(?=\*\*Options:\*\*|^[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?[A-Z]\))/m,
    );
    const correctMatch = block.match(/\*{0,2}Correct (?:Answers?|Options?):\*{0,2}\s*([A-Z][A-Z,\s]*)/i);
    if (!qMatch || !correctMatch) continue;

    const rationaleMatch = block.match(
      /(?:\*{0,2}Rationale:\*{0,2}|Rationale:)\s*([\s\S]*?)(?=\*\*Source Reference:\*\*|<\/details>|\n---|\n#{1,6}[ \t]|$)/i,
    );

    const options = opts.map((o) => o.text);
    const letterToIndex = new Map(opts.map((o, idx) => [o.letter, idx]));
    const answers = correctMatch[1]
      .split(',')
      .map((a) => letterToIndex.get(a.trim().charAt(0)))
      .filter((idx): idx is number => idx !== undefined);
    if (answers.length === 0) continue;

    const isMSQ =
      prefix.startsWith('msq') ||
      answers.length > 1 ||
      /select all that apply/i.test(block);

    questions.push({
      id: `${prefix}${i}`,
      type: isMSQ ? 'msq' : 'mcq',
      q: qMatch[1].trim().replace(/^\[.*?\]\s*/, ''),
      options,
      answer: isMSQ ? answers : answers[0],
      explanation: rationaleMatch ? rationaleMatch[1].trim() : '',
    } as AssessmentQuestion);
  }
  return questions;
}

export async function getMockTest(subject: string): Promise<AssessmentQuestion[]> {
  if (!BACKEND_SUBJECTS.has(subject)) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/folders/${subject}/mock-test`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return mapBackendQuestions(data);
      }
    }
  } catch (e) {
    console.warn("Failed to fetch mock test from API", e);
  }
  return [];
}
