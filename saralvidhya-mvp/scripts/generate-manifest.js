import fs from 'node:fs';
import path from 'node:path';

const RESOURCE_ROOT = path.resolve('public/generated_resources');
const CATALOG_PATH = path.join(RESOURCE_ROOT, 'catalog.json');
const MANIFEST_PATH = path.join(RESOURCE_ROOT, 'manifest.json');

const resourceTabs = [
  ['summary.md', 'Summary'],
  ['study_guide.md', 'Study Guide'],
  ['question_bank.md', 'Question Bank'],
  ['flashcards', 'Flashcards'],
  ['mindmap.md', 'Mindmap'],
  ['learning_path.md', 'Learning Path'],
  ['detailed_view.md', 'Detailed Notes'],
  ['podcast_script.md', 'Podcast Script'],
  ['youtube_links.md', 'YouTube Links'],
  ['course_offerings.md', 'Course Info'],
];

const resourceFiles = [
  ['summary', 'summary.md'],
  ['study_guide', 'study_guide.md'],
  ['question_bank', 'question_bank.md'],
  ['quiz', 'assessment.md'],
  ['quiz', 'quiz.md'],
  ['learning_path', 'learning_path.md'],
  ['detailed_view', 'detailed_view.md'],
  ['podcast_script', 'podcast_script.md'],
  ['short_podcast', 'short_podcast.md'],
  ['long_podcast', 'long_podcast.md'],
  ['youtube_links', 'youtube_links.md'],
  ['video_script', 'video_script.md'],
  ['course_offerings', 'course_offerings.md'],
  ['mindmap', 'mindmap.md'],
  ['mindmap', 'mindmap.json'],
  ['flashcards', 'flashcards.json'],
  ['flashcards', 'flashcards.md'],
  ['flashcards', 'Practice/Revise/Flashcards_Chapter/flashcards_revise_main.json'],
  ['quiz', 'Prepare/Assessments/MCQ/mcq_test_beginner.json'],
  ['quiz', 'Prepare/Assessments/MCQ/mcq_test_intermediate.json'],
  ['quiz', 'Prepare/Assessments/MCQ/mcq_test_advanced.json'],
  ['quiz', 'Practice/Assessments/MCQ/mcq_easy.json'],
  ['quiz', 'Practice/Assessments/MCQ/mcq_medium.json'],
  ['quiz', 'Practice/Assessments/MCQ/mcq_hard.json'],
  ['question_bank', 'Prepare/Question_Bank/MCQ/mcq_prep_beginner.json'],
  ['question_bank', 'Prepare/Question_Bank/MCQ/mcq_prep_intermediate.json'],
  ['question_bank', 'Prepare/Question_Bank/MCQ/mcq_prep_advanced.json'],
  ['question_bank', 'Practice/Question_Bank/v1/02_Epithelial_Tissue.json'],
];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function titleFromId(id) {
  return id
    .replace(/^chapter_\d+\s*\((.+)\)$/i, '$1')
    .replace(/^chapter_\d+[-_\s]*/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toSentenceCase(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function parseChapterFolderName(entryName) {
  const match = /^chapter_(\d+)(?:\s*\((.+)\))?$/i.exec(entryName);
  if (!match) return null;

  return {
    number: Number(match[1]),
    title: match[2] ? titleFromId(match[2]) : '',
  };
}

function hasFile(chapterDir, fileName) {
  const rootFile = path.join(chapterDir, fileName);
  if (fs.existsSync(rootFile)) return true;
  return ['beginner', 'intermediate', 'advanced'].some((level) =>
    fs.existsSync(path.join(chapterDir, level, fileName)),
  );
}

function readChapterMetadata(chapterDir, chapterNumber) {
  const rootMeta = readJson(path.join(chapterDir, 'metadata.json'));
  if (rootMeta) return rootMeta;

  const leveledMeta = readJson(path.join(chapterDir, 'metadata_leveled.json'));
  if (leveledMeta) return leveledMeta;

  for (const level of ['intermediate', 'beginner', 'advanced']) {
    const levelMeta = readJson(path.join(chapterDir, level, 'gen_meta.json'));
    if (levelMeta) return levelMeta;
  }

  return {
    chapter_number: chapterNumber,
    chapter_name: `Chapter ${chapterNumber}`,
    completed: [],
  };
}

function completedFromMetadata(meta) {
  const completed = new Set();

  if (Array.isArray(meta.completed)) {
    meta.completed.forEach((key) => completed.add(key));
  } else if (meta.completed && typeof meta.completed === 'object') {
    for (const list of Object.values(meta.completed)) {
      if (Array.isArray(list)) list.forEach((key) => completed.add(key));
    }
  }

  if (Array.isArray(meta.shared_completed)) {
    meta.shared_completed.forEach((key) => completed.add(key));
  }

  return completed;
}

function isContentDirectory(entryName, entryPath) {
  if (parseChapterFolderName(entryName)) return true;
  if (entryName.startsWith('.')) return false;
  if (fs.existsSync(path.join(entryPath, 'metadata.json'))) return true;
  if (fs.existsSync(path.join(entryPath, 'metadata_leveled.json'))) return true;
  return ['beginner', 'intermediate', 'advanced'].some((level) =>
    fs.existsSync(path.join(entryPath, level)),
  );
}

function scanSubject(subject, board, klass) {
  const subjectDir = path.join(RESOURCE_ROOT, subject.path);
  const chapters = [];

  if (fs.existsSync(subjectDir)) {
    let fallbackNumber = 1;
    for (const entry of fs.readdirSync(subjectDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const chapterDir = path.join(subjectDir, entry.name);
      if (!isContentDirectory(entry.name, chapterDir)) continue;

      const parsedFolder = parseChapterFolderName(entry.name);
      const chapterNumber = parsedFolder?.number ?? fallbackNumber;
      const meta = readChapterMetadata(chapterDir, chapterNumber);
      const completed = completedFromMetadata(meta);

      const paddedChapterNumber = String(chapterNumber).padStart(2, '0');
      const dynamicResourceFiles = [
        ...resourceFiles,
        ['pyq', `Prepare/PYQs/Chapter_Level/pyq_chapter_${paddedChapterNumber}.json`],
        ['pyq', `Prepare/PYQs/Chapter_Level/pyq_chapter_${chapterNumber}.json`],
        ['pyq', `Prepare/PYQs/Topic_Level/pyq_topic1.json`],
        ['podcast_script', 'Podcasts'],
        ['long_podcast', 'Podcasts'],
        ['short_podcast', 'Podcasts']
      ];

      for (const [key, fileName] of dynamicResourceFiles) {
        if (hasFile(chapterDir, fileName)) completed.add(key);
      }

      if (subject.chapterNumbers && !subject.chapterNumbers.includes(chapterNumber)) continue;

      const defaultChapterName = `Chapter ${chapterNumber}`;
      const folderName = parsedFolder?.title || titleFromId(entry.name);
      const rawChapterName =
        (meta.chapter_name && meta.chapter_name !== defaultChapterName ? meta.chapter_name : null) ||
        (meta.chapterTitle && meta.chapterTitle !== defaultChapterName ? meta.chapterTitle : null) ||
        (meta.title && meta.title !== defaultChapterName ? meta.title : null) ||
        meta.name || folderName || defaultChapterName;
      const chapterName = rawChapterName.startsWith('Chapter ') ? rawChapterName : toSentenceCase(rawChapterName);

      chapters.push({
        number: parsedFolder ? chapterNumber : Number(meta.chapter_number ?? chapterNumber),
        name: chapterName,
        dir: entry.name,
        completed: [...completed],
        resourceCount: completed.size,
      });
      fallbackNumber += 1;
    }
  }

  chapters.sort((a, b) => a.number - b.number);

  return {
    id: subject.id,
    name: subject.name || titleFromId(subject.id),
    path: subject.path,
    boardId: board.id,
    boardName: board.name,
    classId: klass.id,
    className: klass.name,
    chapters,
  };
}

const catalog = readJson(CATALOG_PATH);
if (!catalog?.boards) {
  throw new Error(`Missing or invalid catalog at ${CATALOG_PATH}`);
}

const subjects = [];
for (const board of catalog.boards) {
  for (const klass of board.classes ?? []) {
    for (const subject of klass.subjects ?? []) {
      subjects.push(scanSubject(subject, board, klass));
    }
  }
}

fs.writeFileSync(
  MANIFEST_PATH,
  JSON.stringify({ subjects, resourceTabs }, null, 2),
  'utf8',
);

console.log(`Generated ${MANIFEST_PATH} with ${subjects.length} subjects.`);

// Write to dist directory if it exists
const distManifestPath = path.resolve('dist/generated_resources/manifest.json');
if (fs.existsSync(path.dirname(distManifestPath))) {
  fs.writeFileSync(
    distManifestPath,
    JSON.stringify({ subjects, resourceTabs }, null, 2),
    'utf8',
  );
  console.log(`Also saved to ${distManifestPath}`);
}
