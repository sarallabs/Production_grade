import {
  type AssessmentQuestion,
  type MCQQuestion,
  type MSQQuestion,
} from '../utils/assessmentTypes';
import { MOCK_ASSESSMENT_QUESTIONS } from '../utils/assessmentMock';
import { 
  BASE,
  API_BASE_URL, 
  BACKEND_SUBJECTS,
  DifficultyLevel,
  getManifest,
  getChapterDir,
  getSubjectBaseUrl,
  getSubjectResourcePath,
  getChapterVideos,
  GCS_BACKEND_SUBJECTS,
  GCS_API_BASE,
  GCS_SUBJECT_MAP,
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(url, { cache: 'no-cache', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('text/html')) continue;
      
      const text = await res.text();
      
      try {
        const parsed = JSON.parse(text);
        let rawQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.items || []);
        if (rawQuestions.length > 0) {
          const mapped = rawQuestions.map((q: any, i: number) => {
            const isDescriptive = !!(
              q.model_answer !== undefined ||
              q.rubric !== undefined ||
              q.keywords !== undefined ||
              q.section_name !== undefined ||
              (!q.options && (q.question || q.stem || q.q))
            );

            if (isDescriptive) {
              const stem = q.question || q.stem || q.q || '';
              const section = q.section || '';
              const type = section === 'part_a' ? 'short_answer' : section === 'part_b' ? 'long_answer' : 'descriptive';
              return {
                id: q.question_id || q.id || `${prefix}${i + 1}`,
                type: type,
                q: stem.replace(/^\[.*?\]\s*/, ''),
                explanation: q.explanation || q.rationale || q.source_reference || '',
                options: [],
                answer: 0,
                section: q.section,
                sectionName: q.section_name,
                marks: q.marks !== undefined ? q.marks : (section === 'part_a' ? 2 : section === 'part_b' ? 5 : 9),
                bloomLevel: q.bloom_level,
                mindmapPath: q.mindmap_path,
                modelAnswer: q.model_answer,
                rubric: q.rubric,
                keywords: q.keywords,
                hasAsciiDiagram: q.has_ascii_diagram,
                videoTime: 0,
              } as AssessmentQuestion;
            }

            let rawOptions: string[] = [];
            let optionKeyMap: string[] = [];
            if (Array.isArray(q.options)) {
              rawOptions = q.options;
              optionKeyMap = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].slice(0, rawOptions.length);
            } else if (q.options && typeof q.options === 'object') {
              const keys = Object.keys(q.options).sort();
              optionKeyMap = keys;
              rawOptions = keys.map(k => q.options[k]);
            }
            const cleanedOptions = rawOptions.map((opt: any) => String(opt).replace(/^[A-G]\)\s*/, ''));

            const resolveIndex = (ans: string): number => {
              const trimmed = String(ans).trim();
              const stripped = trimmed.replace(/^[A-G]\)\s*/, '').toLowerCase();
              const letterMatch = trimmed.match(/^([A-G])\b/i);
              if (letterMatch) {
                const letter = letterMatch[1].toUpperCase();
                const keyIdx = optionKeyMap.indexOf(letter);
                if (keyIdx >= 0 && keyIdx < cleanedOptions.length) return keyIdx;
                const charIdx = letter.charCodeAt(0) - 65;
                if (charIdx >= 0 && charIdx < cleanedOptions.length) return charIdx;
              }
              const textIdx = cleanedOptions.findIndex(
                (opt: string) => opt.trim().toLowerCase() === stripped,
              );
              return textIdx;
            };

            const rawAnswer = q.answer ?? q.correct_answer ?? q.correct_answers ?? q.RightAnswers;
            const isMSQ = Array.isArray(rawAnswer) || (typeof rawAnswer === 'string' && rawAnswer.includes(',') && !rawAnswer.startsWith('A)')) || prefix.startsWith('msq');

            let answerIndices: number | number[];
            if (Array.isArray(rawAnswer)) {
              const indices = rawAnswer.map((a: any) => resolveIndex(String(a))).filter((idx: number) => idx !== -1);
              answerIndices = isMSQ ? indices : (indices[0] ?? 0);
            } else {
              const idx = resolveIndex(String(rawAnswer ?? ''));
              answerIndices = isMSQ ? (idx === -1 ? [] : [idx]) : (idx === -1 ? 0 : idx);
            }

            const stemText = (q.stem || q.question || q.question_stem || q.q || '').replace(/^\[.*?\]\s*/, '');
            const explanationText = q.explanation || q.rationale || q.source_reference || '';

            return {
              id: q.question_id || q.id || `${prefix}${i + 1}`,
              type: isMSQ ? 'msq' : 'mcq',
              q: stemText,
              options: cleanedOptions,
              answer: answerIndices,
              explanation: explanationText,
              videoTime: 0,
            };
          }).filter((q: AssessmentQuestion) => q.q && (
            q.type === 'short_answer' ||
            q.type === 'long_answer' ||
            q.type === 'descriptive' ||
            ((q as any).options && (q as any).options.length > 0)
          ));

          if (mapped.length > 0) return mapped;
        }
      } catch (e) {
      }
      
      const parsedMd = parseAssessmentMarkdown(text, prefix);
      if (parsedMd.length > 0) return parsedMd;
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

  // ── GCS Cloud Run subjects ──
  if (GCS_BACKEND_SUBJECTS.has(subject)) {
    const subjectPath = GCS_SUBJECT_MAP[subject];
    const chDir = getChapterDir(subject, chapterNumber);
    const difficulty = level === 'beginner' ? 'easy' : level === 'advanced' ? 'hard' : 'medium';
    const base = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}`;

    const mcqRes = await fetchAndParseFirst(
      [`${base}/practice/mcq?difficulty=${difficulty}`], 'mcq_');
    const msqRes = await fetchAndParseFirst(
      [`${base}/practice/msq?difficulty=${difficulty}`], 'msq_');
    const combined = [...mcqRes, ...msqRes];
    if (combined.length > 0) return combined;

    const GCS_LOCAL_PATH: Record<string, string> = {
      'angrau/entomology': 'angrau',
    };
    const localSubjectPath = GCS_LOCAL_PATH[subjectPath] ?? subjectPath;
    const chDirs = Array.from(new Set([chDir, `chapter_${String(chapterNumber).padStart(2, '0')}`, `chapter_${chapterNumber}`]));
    const mcqCandidates: string[] = [];
    const msqCandidates: string[] = [];
    for (const c of chDirs) {
      const b = `${BASE}/${localSubjectPath}/${c}`;
      mcqCandidates.push(
        `${b}/${level}/mcq.md`,
        `${b}/${level}/assessment.md`,
        `${b}/${level}/quiz.md`,
        `${b}/assessment.md`,
        `${b}/quiz.md`,
      );
      msqCandidates.push(
        `${b}/${level}/msq.md`,
        `${b}/msq.md`,
      );
    }
    const localMcq = await fetchAndParseFirst(mcqCandidates, 'mcq_');
    const localMsq = await fetchAndParseFirst(msqCandidates, 'msq_');
    return [...localMcq, ...localMsq];
  }

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
    ...(videoDir ? [
      `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.md`,
      `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MCQ/mcq_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MCQ/${assessmentLevel}_mcq_10.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MCQ/${assessmentLevel}_mcq_10.md`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MCQ/mcq_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MCQ/mcq_${assessmentLevel}.md`,
    ] : []),
    `${subjectBase}/${chDir}/Practice/Assessments/MCQ/${assessmentLevel}_mcq_10.json`,
    `${subjectBase}/${chDir}/Practice/Assessments/MCQ/${assessmentLevel}_mcq_10.md`,
    `${subjectBase}/${chDir}/Practice/Assessments/MCQ/mcq_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Practice/Assessments/MCQ/mcq_${assessmentLevel}.md`,
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
  allQuestions = allQuestions.concat(await fetchAndParseFirst(mcqPaths, 'mcq_'));

  const msqPaths = [
    ...(videoDir ? [
      `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
      `${subjectBase}/${chDir}/${videoDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MSQ/${assessmentLevel}_msq_10.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MSQ/${assessmentLevel}_msq_10.md`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MSQ/msq_${assessmentLevel}.json`,
      `${subjectBase}/${chDir}/${videoDir}/Practice/Assessments/MSQ/msq_${assessmentLevel}.md`,
    ] : []),
    `${subjectBase}/${chDir}/Practice/Assessments/MSQ/${assessmentLevel}_msq_10.json`,
    `${subjectBase}/${chDir}/Practice/Assessments/MSQ/${assessmentLevel}_msq_10.md`,
    `${subjectBase}/${chDir}/Practice/Assessments/MSQ/msq_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Practice/Assessments/MSQ/msq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/unit_1/Learn/Assessments/MSQ/msq_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.json`,
    `${subjectBase}/${chDir}/Prepare/Question_Bank/MSQ/msq_prep_${assessmentLevel}.md`,
    `${subjectBase}/${chDir}/${level}/msq.md`
  ];
  allQuestions = allQuestions.concat(await fetchAndParseFirst(msqPaths, 'msq_'));

  return allQuestions;
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
): Promise<AssessmentQuestion[]> {

  // ── GCS Cloud Run subjects ──
  if (GCS_BACKEND_SUBJECTS.has(subject)) {
    const subjectPath = GCS_SUBJECT_MAP[subject];
    const chDir = getChapterDir(subject, chapterNumber);
    const kindPath = kind === 'mock' ? 'practice/mock_test'
      : kind === 'pre_final' ? 'prepare/pre_final_exam'
      : 'prepare/certification_exam';
    const url = `${GCS_API_BASE}/api/content/${subjectPath}/${chDir}/${kindPath}`;
    try {
      const questions = await fetchAndParseFirst([url], `${kind}_`);
      if (questions.length > 0) {
        // For pre_final / certification: only accept if the remote API actually
        // returned descriptive questions. If GCS has stale MCQ data for what
        // should be a structured descriptive exam, fall through to local files.
        const isDescriptiveExam = kind === 'pre_final' || kind === 'certification';
        const hasDescriptive = questions.some(
          (q) => (q as any).modelAnswer || q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'descriptive'
        );
        if (!isDescriptiveExam || hasDescriptive) {
          return questions;
        }
        // else: GCS returned MCQs for a descriptive exam → fall through to local files
      }
    } catch {
      // Fall through to local resources if GCS returns error or empty
    }
  }

  const videos = await getChapterVideos(subject, chapterNumber);
  const chDir = getChapterDir(subject, chapterNumber);
  // For GCS subjects the cloud API is canonical but for dev we fall back to
  // /generated_resources so files placed under public/ are found before they
  // are uploaded to Cloud Run.  getSubjectResourcePath returns the manifest
  // path (e.g. "angrau"), so the base becomes /generated_resources/angrau.
  const subjectBase = GCS_BACKEND_SUBJECTS.has(subject)
    ? `${BASE}/${getSubjectResourcePath(subject)}`
    : getSubjectBaseUrl(subject);
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
    const baseWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    const candidates = [
      `${subjectBase}/${chDir}/${baseWithoutExt}.json`,
      `${subjectBase}/${chDir}/${fileName}`,
      `${subjectBase}/${chDir}/Examination/${baseWithoutExt}.json`,
      `${subjectBase}/${chDir}/Examination/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/${baseWithoutExt}.json`,
      `${subjectBase}/${chDir}/Prepare/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/Mock_Test/${baseName}`,
      `${subjectBase}/${chDir}/Prepare/Mock_Test/mock_test_chapter_${chapterNumber}.md`,
      `${subjectBase}/${chDir}/Prepare/Practice_Exam/practice_exam_50_questions.json`,
      `${subjectBase}/${chDir}/Prepare/Practice_Exam/practice_exam_50_questions.md`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${baseWithoutExt}.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${baseName}`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_exam_80.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_exam_80.md`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_50.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_50.md`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_exam_40.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/${kind}_exam_40.md`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/mock_test_50.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/certification_exam_80.json`,
      `${subjectBase}/${chDir}/Preparation/Prep. Exam/pre_final_exam_40.json`,
      `${subjectBase}/${chDir}/${baseName}`,
    ];
    rawQuestions = await fetchAndParseFirst(candidates, `${kind}_ch_`);
  }

  const seen = new Set<string>();
  const merged: AssessmentQuestion[] = [];
  for (const question of rawQuestions) {
    const key = question.q.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(question);
  }

  // Preserve ordered syllabus structure for descriptive exams (Part A -> Part B -> Part C)
  const isStructuredExam = merged.some(q => (q as any).section || (q as any).modelAnswer);
  if (isStructuredExam) {
    return merged;
  }

  return seededShuffle(merged, `${subject}_${chapterNumber}_${kind}`);
}

const OPTION_LINE = /^[ \t]*[-*]?[ \t]*(?:\[[ xX]\][ \t]*)?(?:\*\*\([ \t]*|\(\*\*[ \t]*|\([ \t]*|\*\*[ \t]*)?([A-G])(?:\)[ \t]*\*\*|\*\*[ \t]*\)|\)[ \t]*|\.[ \t]*\*\*|\.[ \t]*|\*\*[ \t]*)[ \t]+(.+)$/gm;

function splitQuestionBlocks(md: string): string[] {
  const byHeading = md.split(/(?=^#{1,6}[ \t]+Question[ \t]+\d+)/gim).filter(b => b.trim());
  if (byHeading.length > 0) return byHeading;
  return md.split(/(?=\*\*Question:|\*\*Q:)/i).filter((b) => /\*\*(?:Question|Q):\*\*/i.test(b));
}

export function parseAssessmentMarkdown(mdRaw: string, prefix: string): AssessmentQuestion[] {
  const md = mdRaw.replace(/\r\n/g, '\n');
  const questions: AssessmentQuestion[] = [];

  for (const [i, block] of splitQuestionBlocks(md).entries()) {
    const opts = [...block.matchAll(OPTION_LINE)]
      .map((m) => ({ letter: m[1].toUpperCase(), text: m[2].replace(/^\*\*/, '').trim() }))
      .filter((o) => o.text.length > 0 && !o.text.startsWith('Correct Answer'));
    if (opts.length === 0) {
      const modelAnswerMatch = block.match(/<summary>[\s\S]*?Model Answer[\s\S]*?<\/summary>\s*([\s\S]*?)<\/details>/i);
      if (modelAnswerMatch) {
        const questionText = block
          .replace(/^#{1,6}[ \t]+Question[ \t]+\d+.*?\n/i, '')
          .replace(/<details>[\s\S]*?<\/details>/i, '')
          .replace(/---/g, '')
          .trim();
        if (questionText) {
          questions.push({
            id: `${prefix}${i + 1}`,
            type: 'descriptive',
            q: questionText,
            explanation: '',
            options: [],
            answer: 0,
            modelAnswer: modelAnswerMatch[1].trim(),
          } as any);
        }
      }
      continue;
    }

    let qText = '';
    const qMatch = block.match(
      /\*{0,2}(?:Question|Q):\*{0,2}\s*([\s\S]*?)(?=\n[ \t]*[-*]|\n<details>|\n\*\*Options|\n\*\*Correct)/i,
    );
    if (qMatch) {
      qText = qMatch[1].trim();
    } else {
      const firstOptMatch = block.match(OPTION_LINE);
      if (firstOptMatch) {
        const idx = block.indexOf(firstOptMatch[0]);
        qText = block.slice(0, idx).trim();
      }
    }

    const correctMatch = block.match(/\*{0,2}Correct (?:Answers?|Options?):\*{0,2}\s*[\s\S]*?\b([A-G](?:,\s*[A-G])*)\b/i);
    if (!correctMatch) continue;

    const rationaleMatch = block.match(
      /(?:\*{0,2}(?:Rationale|Explanation):\*{0,2}|(?:Rationale|Explanation):)\s*([\s\S]*?)(?=\*\*Source Reference:\*\*|<\/details>|\n---|\n#{1,6}[ \t]|$)/i,
    );

    const options = opts.map((o) => o.text);
    const letterToIndex = new Map(opts.map((o, idx) => [o.letter, idx]));
    const rawAnswers = correctMatch[1].replace(/[*()]/g, '');
    const answers = rawAnswers
      .split(',')
      .map((a) => letterToIndex.get(a.trim().charAt(0)))
      .filter((idx): idx is number => idx !== undefined);
    if (answers.length === 0) continue;

    const isMSQ =
      prefix.startsWith('msq') ||
      answers.length > 1 ||
      /select all that apply/i.test(block);

    questions.push({
      id: `${prefix}${i + 1}`,
      type: isMSQ ? 'msq' : 'mcq',
      q: qText.replace(/^\[.*?\]\s*/, ''),
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
