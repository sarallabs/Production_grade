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

/** Per-video asset directories inside a segmented chapter (see videos.json). */
const VIDEO_DIR_PATTERN = /^video_\d+(_|$)/;

function videoDirs(chapterDir) {
  if (!fs.existsSync(chapterDir)) return [];
  return fs
    .readdirSync(chapterDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && VIDEO_DIR_PATTERN.test(e.name))
    .map((e) => path.join(chapterDir, e.name));
}

function hasFile(chapterDir, fileName) {
  const rootFile = path.join(chapterDir, fileName);
  if (fs.existsSync(rootFile)) return true;

  if (['beginner', 'intermediate', 'advanced'].some((level) =>
    fs.existsSync(path.join(chapterDir, level, fileName))
  )) return true;

  // New restructured paths support. Segmented chapters hold no chapter-root
  // Learn/ of their own, so each per-video directory counts as well — without
  // this their resourceCount would drop to zero and the chapter would look empty.
  const searchRoots = [chapterDir, ...videoDirs(chapterDir)];
  const existsInAny = (relative) =>
    searchRoots.some((root) => fs.existsSync(path.join(root, relative)));

  const levels = ['beginner', 'intermediate', 'advanced'];
  const easyMedHard = ['easy', 'medium', 'hard'];

  if (fileName === 'summary.md') {
    return levels.some((level) => existsInAny(`Learn/Quick_Summary/quick_summary_${level}.md`));
  }
  if (fileName === 'detailed_view.md') {
    return levels.some((level) => existsInAny(`Learn/Detailed_Summary/detailed_summary_${level}.md`));
  }
  if (fileName === 'flashcards.json' || fileName === 'flashcards.md') {
    return levels.some((level) => existsInAny(`Learn/Flashcards/flashcards_${level}.md`));
  }
  if (fileName === 'quiz.md' || fileName === 'assessment.md') {
    return easyMedHard.some((level) => existsInAny(`Learn/Assessments/MCQ/mcq_${level}.md`));
  }
  if (fileName === 'mindmap.json' || fileName === 'mindmap.md') {
    return (
      fs.existsSync(path.join(chapterDir, 'mindmap.json')) ||
      existsInAny('Learn/Mindmaps/mindmap.json') ||
      existsInAny('Learn/Mindmaps/mindmap.md')
    );
  }

  return false;
}

function readChapterMetadata(chapterDir, chapterNumber) {
  const genManifest = readJson(path.join(chapterDir, 'generation_manifest.json'));
  if (genManifest) {
    return {
      chapter_number: Number(genManifest.chapter_no || chapterNumber),
      chapter_name: genManifest.chapter_name || `Chapter ${chapterNumber}`,
      completed: []
    };
  }

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
  if (entryName.startsWith('.')) return false;
  if (fs.existsSync(path.join(entryPath, 'metadata.json'))) return true;
  if (fs.existsSync(path.join(entryPath, 'metadata_leveled.json'))) return true;
  if (fs.existsSync(path.join(entryPath, 'generation_manifest.json'))) return true;
  if (fs.existsSync(path.join(entryPath, 'Learn'))) return true;
  if (fs.existsSync(path.join(entryPath, 'Prepare'))) return true;
  if (['beginner', 'intermediate', 'advanced'].some((level) =>
    fs.existsSync(path.join(entryPath, level)),
  )) return true;

  const directFiles = ['summary.md', 'flashcards.json', 'flashcards.md', 'quiz.md', 'assessment.md', 'mindmap.json', 'mindmap.md'];
  if (directFiles.some((f) => fs.existsSync(path.join(entryPath, f)))) return true;

  return false;
}

function scanSubject(subject, board, klass) {
  const subjectDir = path.join(RESOURCE_ROOT, subject.path);
  const chapters = [];

  if (fs.existsSync(subjectDir)) {
    let fallbackNumber = 1;
    
    function findContentDirs(currentDir, relativePath = '') {
      const dirs = [];
      if (!fs.existsSync(currentDir)) return dirs;
      for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        // A segmented chapter's video folders each carry a full Learn/ tree, so
        // they would otherwise register as chapters in their own right.
        if (VIDEO_DIR_PATTERN.test(entry.name)) continue;
        const entryPath = path.join(currentDir, entry.name);
        const relName = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        if (isContentDirectory(entry.name, entryPath)) {
          dirs.push({ relName, path: entryPath, baseName: entry.name });
        } else if (entry.name !== 'beginner' && entry.name !== 'intermediate' && entry.name !== 'advanced' && !entry.name.startsWith('.')) {
          dirs.push(...findContentDirs(entryPath, relName));
        }
      }
      return dirs;
    }

    const contentDirs = findContentDirs(subjectDir);

    for (const item of contentDirs) {
      const chapterDir = item.path;
      const entryName = item.baseName;
      const parsedFolder = parseChapterFolderName(entryName);
      const chapterNumber = parsedFolder?.number ?? fallbackNumber;
      const meta = readChapterMetadata(chapterDir, chapterNumber);
      const completed = completedFromMetadata(meta);

      for (const [key, fileName] of resourceFiles) {
        if (hasFile(chapterDir, fileName)) completed.add(key);
      }

      if (subject.chapterNumbers && !subject.chapterNumbers.includes(chapterNumber)) continue;
      if (subject.chapterDirs && !subject.chapterDirs.includes(item.relName)) continue;

      const defaultChapterName = `Chapter ${chapterNumber}`;
      const folderName = parsedFolder?.title || titleFromId(entryName);
      const rawChapterName =
        meta.chapter_name && meta.chapter_name !== defaultChapterName
          ? meta.chapter_name
          : meta.name || folderName || defaultChapterName;
      const chapterName = toSentenceCase(rawChapterName);

      chapters.push({
        number: parsedFolder ? chapterNumber : Number(meta.chapter_number ?? chapterNumber),
        name: chapterName,
        dir: item.relName,
        completed: [...completed],
        resourceCount: completed.size,
      });
      fallbackNumber += 1;
    }
  }

  // Deduplicate by chapter number prioritizing entries with resources
  const chapterMap = new Map();
  for (const ch of chapters) {
    const existing = chapterMap.get(ch.number);
    if (!existing || ch.resourceCount > existing.resourceCount) {
      chapterMap.set(ch.number, ch);
    }
  }
  const deduplicatedChapters = Array.from(chapterMap.values()).sort((a, b) => a.number - b.number);

  return {
    id: subject.id,
    name: subject.name || titleFromId(subject.id),
    path: subject.path,
    boardId: board.id,
    boardName: board.name,
    classId: klass.id,
    className: klass.name,
    chapters: deduplicatedChapters,
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
