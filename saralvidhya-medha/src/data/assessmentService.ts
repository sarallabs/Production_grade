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
  getChapterVideos,
  filterIndexedCandidates,
  fetchCachedText
} from './manifestService';

const assessmentsCache = new Map<string, Promise<AssessmentQuestion[]>>();
const chapterExamsCache = new Map<string, Promise<(MCQQuestion | MSQQuestion)[]>>();

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

function extractRawQuestionsFromJson(parsed: any): any[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== 'object') return [];

  if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    return parsed.questions;
  }
  if (Array.isArray(parsed.items) && parsed.items.length > 0) {
    return parsed.items;
  }

  const collected: any[] = [];
  const pushSection = (sec: any) => {
    if (!sec || typeof sec !== 'object') return;
    const secTitle = sec.section_title || sec.title || sec.section || '';
    const list = Array.isArray(sec.questions)
      ? sec.questions
      : Array.isArray(sec.items)
        ? sec.items
        : Array.isArray(sec)
          ? sec
          : [];
    for (const item of list) {
      if (item && typeof item === 'object') {
        collected.push(secTitle && !item.section ? { ...item, section: secTitle } : item);
      }
    }
  };

  if (Array.isArray(parsed.sections)) {
    for (const sec of parsed.sections) pushSection(sec);
  } else if (parsed.sections && typeof parsed.sections === 'object') {
    for (const sec of Object.values(parsed.sections)) pushSection(sec);
  }

  for (const [k, v] of Object.entries(parsed)) {
    if (k === 'sections' || k === 'questions' || k === 'items') continue;
    if (/section/i.test(k) && v && typeof v === 'object') {
      pushSection(v);
    }
  }

  return collected;
}

function normalizeJsonQuestion(q: any, i: number, prefix: string): AssessmentQuestion | null {
  if (!q || typeof q !== 'object') return null;
  const inner =
    q.question_data && typeof q.question_data === 'object' ? q.question_data : q;

  const rawText =
    inner.stem ||
    inner.question ||
    inner.question_text ||
    q.stem ||
    q.question ||
    q.question_text ||
    '';
  const questionText = String(rawText).replace(/^\[.*?\]\s*/, '').trim();
  if (!questionText) return null;

  const rawOpts = inner.options ?? q.options;
  const optionEntries: Array<{ letter: string; text: string }> = [];

  if (Array.isArray(rawOpts)) {
    rawOpts.forEach((opt: any, idx: number) => {
      if (typeof opt === 'string') {
        const letterMatch = opt.trim().match(/^([A-F])[).:\]]\s*/i);
        const letter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + idx);
        const text = opt.replace(/^[A-F][).:\]]\s*/i, '').trim();
        if (text) optionEntries.push({ letter, text });
      } else if (opt && typeof opt === 'object') {
        const letter = String(opt.key || opt.letter || opt.label || String.fromCharCode(65 + idx))
          .trim()
          .toUpperCase()
          .replace(/[^A-Z]/g, '') || String.fromCharCode(65 + idx);
        const text = String(opt.text ?? opt.value ?? opt.label ?? '')
          .replace(/^[A-F][).:\]]\s*/i, '')
          .trim();
        if (text) optionEntries.push({ letter, text });
      }
    });
  } else if (rawOpts && typeof rawOpts === 'object') {
    const entries = Object.entries(rawOpts);
    entries.sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([k, v], idx) => {
      const letter = k.trim().toUpperCase().replace(/[^A-Z]/g, '') || String.fromCharCode(65 + idx);
      const text = String(v ?? '').replace(/^[A-F][).:\]]\s*/i, '').trim();
      if (text) optionEntries.push({ letter, text });
    });
  }

  if (optionEntries.length === 0) return null;

  const cleanedOptions = optionEntries.map((o) => o.text);
  const letterToIdx = new Map(optionEntries.map((o, idx) => [o.letter, idx]));

  const resolveIndex = (ans: unknown): number => {
    if (typeof ans === 'number' && Number.isInteger(ans)) {
      return ans >= 0 && ans < cleanedOptions.length ? ans : -1;
    }
    const str = String(ans ?? '').trim();
    if (!str) return -1;
    const stripped = str.replace(/^[A-F][).:\]]\s*/i, '').trim().toLowerCase();
    const letterMatch = str.match(/^([A-F])(?:[).:\]\s]|$)/i);
    if (letterMatch) {
      const L = letterMatch[1].toUpperCase();
      if (letterToIdx.has(L)) return letterToIdx.get(L)!;
      const codeIdx = L.charCodeAt(0) - 65;
      if (codeIdx >= 0 && codeIdx < cleanedOptions.length) return codeIdx;
    }
    return cleanedOptions.findIndex((opt) => opt.trim().toLowerCase() === stripped);
  };

  const rawAnswer =
    inner.answer ??
    inner.correct_answers ??
    inner.correct_answer ??
    inner.correct_answer_string ??
    inner.right_answers ??
    q.answer ??
    q.correct_answers ??
    q.correct_answer ??
    q.correct_answer_string ??
    q.right_answers;

  const explicitType = String(
    inner.type || inner.question_type || q.type || q.question_type || '',
  ).toLowerCase();

  const isCommaLetterList = (val: unknown): boolean =>
    typeof val === 'string' && /^[A-F](\s*,\s*[A-F])+$/i.test(val.trim());

  let resolvedList: number[] = [];
  if (Array.isArray(rawAnswer)) {
    resolvedList = rawAnswer
      .map((a) => resolveIndex(a))
      .filter((idx) => idx !== -1);
  } else if (isCommaLetterList(rawAnswer)) {
    resolvedList = String(rawAnswer)
      .split(',')
      .map((a) => resolveIndex(a.trim()))
      .filter((idx) => idx !== -1);
  } else {
    const idx = resolveIndex(rawAnswer);
    if (idx !== -1) resolvedList = [idx];
  }

  const dedupedIndices = Array.from(new Set(resolvedList));
  const isMSQ =
    explicitType === 'msq' ||
    (explicitType !== 'mcq' &&
      (Array.isArray(rawAnswer) ||
        inner.correct_answers !== undefined ||
        q.correct_answers !== undefined ||
        isCommaLetterList(rawAnswer) ||
        prefix.startsWith('msq') ||
        dedupedIndices.length > 1));

  const answerIndices: number | number[] = isMSQ
    ? dedupedIndices
    : (dedupedIndices[0] ?? 0);

  const explanation = String(
    inner.explanation ||
      inner.rationale ||
      inner.descriptive_answer?.rationale ||
      inner.descriptive_answer?.summary ||
      q.explanation ||
      q.rationale ||
      '',
  ).trim();

  return {
    id: q.id || q.question_id || inner.id || `${prefix}${i + 1}`,
    type: isMSQ ? 'msq' : 'mcq',
    q: questionText,
    options: cleanedOptions,
    answer: answerIndices,
    explanation,
    videoTime: 0,
  } as AssessmentQuestion;
}

export async function fetchAndParseFirst(
  urls: string[],
  prefix: string,
): Promise<AssessmentQuestion[]> {
  const indexed = filterIndexedCandidates(urls);
  const candidateUrls = indexed.length > 0 ? indexed : urls;

  for (const url of candidateUrls) {
    try {
      const text = await fetchCachedText(url);
      if (!text) continue;

      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          const rawQuestions = extractRawQuestionsFromJson(parsed);
          const normalized = rawQuestions
            .map((q: any, i: number) => normalizeJsonQuestion(q, i, prefix))
            .filter((q): q is AssessmentQuestion => q !== null);
          if (normalized.length > 0) {
            return normalized;
          }
        } catch {
          // fall through to next candidate
        }
        continue;
      }

      const mdQuestions = parseAssessmentMarkdown(text, prefix);
      if (mdQuestions.length > 0) {
        return mdQuestions;
      }
    } catch {
      // try next candidate
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
  const cacheKey = `${subject}:${chapterNumber}:${level}:${videoDir || ''}`;
  const cached = assessmentsCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
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

    const mcqPaths = [
      ...(videoDir
        ? [
            `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.json`,
            `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
          ]
        : []),
      `${subjectBase}/${chDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.json`,
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

    const msqPaths = [
      ...(videoDir
        ? [
            `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.json`,
            `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
          ]
        : []),
      `${subjectBase}/${chDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
      `${subjectBase}/${chDir}/unit_1/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
      `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.md`,
      `${subjectBase}/${chDir}/${level}/msq.md`
    ];

    const [mcqQuestions, msqQuestions] = await Promise.all([
      fetchAndParseFirst(mcqPaths, 'mcq_'),
      fetchAndParseFirst(msqPaths, 'msq_'),
    ]);

    const allQuestions = [...mcqQuestions, ...msqQuestions];
    return allQuestions.length > 0 ? allQuestions : MOCK_ASSESSMENT_QUESTIONS;
  })();

  assessmentsCache.set(cacheKey, task);
  return task;
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
  const cacheKey = `${subject}:${chapterNumber}:${kind}`;
  const cached = chapterExamsCache.get(cacheKey);
  if (cached) return cached;

  const task = (async () => {
    const videos = await getChapterVideos(subject, chapterNumber);
    const chDir = getChapterDir(subject, chapterNumber);
    const subjectBase = getSubjectBaseUrl(subject);
    const fileName = CHAPTER_EXAM_FILES[kind];

    let rawQuestions: AssessmentQuestion[] = [];

    if (videos.length > 0) {
      const jsonFileName = fileName.replace(/\.md$/i, '.json');
      const perVideo = await Promise.all(
        videos.map((video) =>
          fetchAndParseFirst(
            [
              `${subjectBase}/${chDir}/${video.dir}/${jsonFileName}`,
              `${subjectBase}/${chDir}/${video.dir}/${fileName}`,
            ],
            `${kind}_v${video.index}_`,
          ),
        ),
      );
      rawQuestions = perVideo.flat();
    }

    if (rawQuestions.length === 0) {
      const baseName = fileName.split('/').pop() || fileName;
      const jsonFileName = fileName.replace(/\.md$/i, '.json');
      const jsonBaseName = baseName.replace(/\.md$/i, '.json');
      const candidates = [
        `${subjectBase}/${chDir}/${jsonFileName}`,
        `${subjectBase}/${chDir}/${fileName}`,
        `${subjectBase}/${chDir}/Examination/${jsonBaseName}`,
        `${subjectBase}/${chDir}/Examination/${baseName}`,
        `${subjectBase}/${chDir}/Exam/${jsonBaseName}`,
        `${subjectBase}/${chDir}/Exam/${baseName}`,
        ...(kind === 'pre_final'
          ? [
              `${subjectBase}/${chDir}/Exam/Pre_Final_Exam/${jsonBaseName}`,
              `${subjectBase}/${chDir}/Exam/Pre_Final_Exam/${baseName}`,
            ]
          : []),
        ...(kind === 'certification'
          ? [
              `${subjectBase}/${chDir}/Exam/Certification_Exam/${jsonBaseName}`,
              `${subjectBase}/${chDir}/Exam/Certification_Exam/${baseName}`,
            ]
          : []),
        `${subjectBase}/${chDir}/Prepare/${jsonBaseName}`,
        `${subjectBase}/${chDir}/Prepare/${baseName}`,
        `${subjectBase}/${chDir}/Prepare/Mock_Test/${jsonBaseName}`,
        `${subjectBase}/${chDir}/Prepare/Mock_Test/${baseName}`,
        ...(kind === 'mock'
          ? [
              `${subjectBase}/${chDir}/Prepare/Mock_Test/mock_test_chapter_${chapterNumber}.json`,
              `${subjectBase}/${chDir}/Prepare/Mock_Test/mock_test_chapter_${chapterNumber}.md`,
            ]
          : []),
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
  })();

  chapterExamsCache.set(cacheKey, task);
  return task;
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
