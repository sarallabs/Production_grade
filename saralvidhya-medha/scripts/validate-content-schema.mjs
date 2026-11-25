/**
 * Automated ANU MOOCs Content & DB Schema Validator (v1.0)
 *
 * Enforces canonical layout, JSON v1.0 schemas, referential asset integrity,
 * and catalog/courses/manifest/file-index consistency across all active courses.
 *
 * Exits with code 1 on any schema violation so broken or drifted content can
 * never be built, deployed to Firebase Hosting, or synced to Firestore.
 */
import fs from 'node:fs';
import path from 'node:path';

const CWD = process.cwd();
const PUBLIC_ROOT = path.resolve(CWD, 'public');
const RESOURCE_ROOT = path.join(PUBLIC_ROOT, 'generated_resources');
const CATALOG_PATH = path.join(RESOURCE_ROOT, 'catalog.json');
const COURSES_PATH = path.join(RESOURCE_ROOT, 'courses.json');
const MANIFEST_PATH = path.join(RESOURCE_ROOT, 'manifest.json');
const FILE_INDEX_PATH = path.join(RESOURCE_ROOT, 'file-index.json');

const VIDEO_DIR_PATTERN = /^video_\d+(_|$)/;
const VALID_PERSONAS = new Set(['beginner', 'intermediate', 'advanced', 'revise']);
const VALID_CARD_LEVELS = new Set(['beginner', 'intermediate', 'advanced', 'mixed']);
const VALID_ASM_TYPES = new Set([
  'mcq',
  'msq',
  'mock_test',
  'pre_final_exam',
  'certification_exam',
  'question_pool',
]);
const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard', 'mixed']);
const CTRL_CHAR_RX = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

const errors = [];
const summary = {
  subjectsChecked: 0,
  chaptersChecked: 0,
  flashcardDecksChecked: 0,
  flashcardsVerified: 0,
  assessmentFilesChecked: 0,
  questionsVerified: 0,
  assetsVerified: 0,
};

function fail(scope, msg) {
  errors.push(`[${scope}] ${msg}`);
}

function readJson(filePath, scope) {
  if (!fs.existsSync(filePath)) {
    fail(scope, `Missing required file: ${path.relative(CWD, filePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    fail(scope, `Invalid JSON in ${path.relative(CWD, filePath)}: ${err.message}`);
    return null;
  }
}

function verifyPublicAsset(urlPath, scope) {
  if (typeof urlPath !== 'string' || !urlPath.trim()) {
    fail(scope, 'Empty asset URL');
    return;
  }
  if (urlPath.startsWith('data:')) {
    fail(scope, 'Inline base64 data: URI is forbidden in canonical JSON (extract to file)');
    return;
  }
  if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
    summary.assetsVerified++;
    return;
  }
  if (!urlPath.startsWith('/')) {
    fail(scope, `Local asset URL must be root-absolute (/...): "${urlPath}"`);
    return;
  }
  let decoded = urlPath.slice(1);
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw
  }
  const abs = path.join(PUBLIC_ROOT, decoded);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    fail(scope, `Referenced asset does not exist on disk: "${urlPath}"`);
    return;
  }
  summary.assetsVerified++;
}

function validateFlashcardDeck(filePath, expectedSubject, expectedUnit, expectedPersona, fileIndexSet) {
  const relRes = path.relative(RESOURCE_ROOT, filePath).replace(/\\/g, '/');
  const data = readJson(filePath, relRes);
  if (!data) return;

  if (fileIndexSet && !fileIndexSet.has(relRes)) {
    fail(relRes, 'File is missing from file-index.json (re-run generate-manifest.js)');
  }
  if (data.schemaVersion !== '1.0') {
    fail(relRes, `Expected schemaVersion="1.0", got ${JSON.stringify(data.schemaVersion)}`);
  }
  if (data.subject !== expectedSubject) {
    fail(relRes, `Expected subject="${expectedSubject}", got ${JSON.stringify(data.subject)}`);
  }
  if (data.unit !== expectedUnit) {
    fail(relRes, `Expected unit=${expectedUnit}, got ${JSON.stringify(data.unit)}`);
  }
  if (!VALID_PERSONAS.has(data.persona) || (expectedPersona && data.persona !== expectedPersona)) {
    fail(relRes, `Invalid persona=${JSON.stringify(data.persona)} (expected ${expectedPersona})`);
  }
  if (!Array.isArray(data.flashcards) || data.flashcards.length === 0) {
    fail(relRes, 'flashcards must be a non-empty array');
    return;
  }

  data.flashcards.forEach((card, idx) => {
    const tag = `${relRes}#card[${idx}]`;
    if (!card || typeof card !== 'object') {
      fail(tag, 'Card must be an object');
      return;
    }
    if (typeof card.id !== 'string' || !card.id.trim()) fail(tag, 'Missing non-empty id');
    if (typeof card.front !== 'string' || !card.front.trim()) fail(tag, 'Missing non-empty front');
    if (typeof card.back !== 'string' || !card.back.trim()) fail(tag, 'Missing non-empty back');
    if (CTRL_CHAR_RX.test(card.front || '') || CTRL_CHAR_RX.test(card.back || '')) {
      fail(tag, 'Contains stray ASCII control character');
    }
    if (!VALID_CARD_LEVELS.has(card.level)) {
      fail(tag, `Invalid level=${JSON.stringify(card.level)}`);
    }
    if (card.infographicUrl !== undefined) {
      verifyPublicAsset(card.infographicUrl, tag);
    }
  });

  summary.flashcardDecksChecked++;
  summary.flashcardsVerified += data.flashcards.length;
}

function validateAssessmentFile(filePath, expectedSubject, expectedUnit, expectedType, expectedDiff, fileIndexSet) {
  const relRes = path.relative(RESOURCE_ROOT, filePath).replace(/\\/g, '/');
  const data = readJson(filePath, relRes);
  if (!data) return;

  if (fileIndexSet && !fileIndexSet.has(relRes)) {
    fail(relRes, 'File is missing from file-index.json (re-run generate-manifest.js)');
  }
  if (data.schemaVersion !== '1.0') {
    fail(relRes, `Expected schemaVersion="1.0", got ${JSON.stringify(data.schemaVersion)}`);
  }
  if (data.subject !== expectedSubject) {
    fail(relRes, `Expected subject="${expectedSubject}", got ${JSON.stringify(data.subject)}`);
  }
  if (data.unit !== expectedUnit) {
    fail(relRes, `Expected unit=${expectedUnit}, got ${JSON.stringify(data.unit)}`);
  }
  if (!VALID_ASM_TYPES.has(data.type) || (expectedType && data.type !== expectedType)) {
    fail(relRes, `Invalid type=${JSON.stringify(data.type)} (expected ${expectedType})`);
  }
  if (!VALID_DIFFICULTIES.has(data.difficulty) || (expectedDiff && data.difficulty !== expectedDiff)) {
    fail(relRes, `Invalid difficulty=${JSON.stringify(data.difficulty)} (expected ${expectedDiff})`);
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    fail(relRes, 'questions must be a non-empty array');
    return;
  }

  data.questions.forEach((q, idx) => {
    const tag = `${relRes}#q[${idx}]`;
    if (!q || typeof q !== 'object') {
      fail(tag, 'Question must be an object');
      return;
    }
    if (typeof q.id !== 'string' || !q.id.trim()) fail(tag, 'Missing non-empty id');
    if (q.type !== 'mcq' && q.type !== 'msq') fail(tag, `Invalid type=${JSON.stringify(q.type)}`);
    if (typeof q.stem !== 'string' || !q.stem.trim()) fail(tag, 'Missing non-empty stem');
    if (CTRL_CHAR_RX.test(q.stem || '') || CTRL_CHAR_RX.test(q.explanation || '')) {
      fail(tag, 'Contains stray ASCII control character');
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      fail(tag, 'options must be an array with at least 2 choices');
      return;
    }
    for (const opt of q.options) {
      if (typeof opt !== 'string' || !opt.trim() || opt.trim() === '$' || CTRL_CHAR_RX.test(opt)) {
        fail(tag, `Invalid/corrupted option: ${JSON.stringify(opt)}`);
      }
    }
    if (!Array.isArray(q.letters) || q.letters.length !== q.options.length) {
      fail(tag, 'letters array must match options length');
      return;
    }
    const letterSet = new Set(q.letters);
    if (q.type === 'mcq') {
      if (typeof q.answer !== 'string' || !letterSet.has(q.answer)) {
        fail(tag, `MCQ answer must be one of [${q.letters.join(',')}], got ${JSON.stringify(q.answer)}`);
      }
    } else {
      if (!Array.isArray(q.answer) || q.answer.length === 0 || q.answer.some((a) => !letterSet.has(a))) {
        fail(tag, `MSQ answer must be non-empty subset of [${q.letters.join(',')}], got ${JSON.stringify(q.answer)}`);
      }
    }
    if (typeof q.explanation !== 'string') {
      fail(tag, 'explanation must be a string');
    }
  });

  summary.assessmentFilesChecked++;
  summary.questionsVerified += data.questions.length;
}

function checkForbiddenDrift(unitRootDir, scope) {
  if (!fs.existsSync(unitRootDir)) return;

  if (fs.existsSync(path.join(unitRootDir, 'Exam'))) {
    fail(scope, 'Legacy Exam/ directory found — must be canonical Examination/');
  }
  if (fs.existsSync(path.join(unitRootDir, 'Prepare', 'Flashcards'))) {
    fail(scope, 'Legacy Prepare/Flashcards/ directory found — must be canonical Prepare/Revise/');
  }
  if (fs.existsSync(path.join(unitRootDir, 'Learn', 'Flashcards', 'flashcards_metadata.json'))) {
    fail(scope, 'Legacy Learn/Flashcards/flashcards_metadata.json found — must be canonical flashcards_{level}.json');
  }

  const mockDir = path.join(unitRootDir, 'Prepare', 'Mock_Test');
  if (fs.existsSync(mockDir)) {
    for (const name of fs.readdirSync(mockDir)) {
      if (/^mock_test_chapter_\d+\.(json|md)$/i.test(name)) {
        fail(scope, `Non-canonical mock test filename "${name}" — must be mock_test.{json,md}`);
      }
    }
  }

  // Recursive check for stray _backups directories
  function scanBackups(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (entry.name === '_backups') {
        fail(scope, `Forbidden _backups directory at ${path.relative(RESOURCE_ROOT, path.join(dir, entry.name))}`);
      } else if (entry.name !== '_inline_assets') {
        scanBackups(path.join(dir, entry.name));
      }
    }
  }
  scanBackups(unitRootDir);
}

function validateUnitDir(unitRootDir, subjectId, unitNum, fileIndexSet) {
  const scope = path.relative(RESOURCE_ROOT, unitRootDir).replace(/\\/g, '/');
  checkForbiddenDrift(unitRootDir, scope);

  // Flashcards (Learn)
  for (const persona of ['beginner', 'intermediate', 'advanced']) {
    const fcPath = path.join(unitRootDir, 'Learn', 'Flashcards', `flashcards_${persona}.json`);
    if (fs.existsSync(fcPath)) {
      validateFlashcardDeck(fcPath, subjectId, unitNum, persona, fileIndexSet);
    } else if (fs.existsSync(path.join(unitRootDir, 'Learn', 'Flashcards', `flashcards_${persona}.md`))) {
      fail(scope, `Missing canonical JSON companion for Learn/Flashcards/flashcards_${persona}.md`);
    }
  }

  // Flashcards (Prepare/Revise)
  const revPath = path.join(unitRootDir, 'Prepare', 'Revise', 'flashcards_revise.json');
  if (fs.existsSync(revPath)) {
    validateFlashcardDeck(revPath, subjectId, unitNum, 'revise', fileIndexSet);
  } else if (fs.existsSync(path.join(unitRootDir, 'Prepare', 'Revise', 'flashcards_revise.md'))) {
    fail(scope, 'Missing canonical JSON companion for Prepare/Revise/flashcards_revise.md');
  }

  // Assessments (MCQ & MSQ)
  for (const kind of ['MCQ', 'MSQ']) {
    const qType = kind.toLowerCase();
    for (const diff of ['easy', 'medium', 'hard']) {
      const aPath = path.join(unitRootDir, 'Learn', 'Assessments', kind, `${qType}_${diff}.json`);
      if (fs.existsSync(aPath)) {
        validateAssessmentFile(aPath, subjectId, unitNum, qType, diff, fileIndexSet);
      } else if (fs.existsSync(path.join(unitRootDir, 'Learn', 'Assessments', kind, `${qType}_${diff}.md`))) {
        fail(scope, `Missing canonical JSON companion for Learn/Assessments/${kind}/${qType}_${diff}.md`);
      }
    }
  }

  // Mock Test
  const mockPath = path.join(unitRootDir, 'Prepare', 'Mock_Test', 'mock_test.json');
  if (fs.existsSync(mockPath)) {
    validateAssessmentFile(mockPath, subjectId, unitNum, 'mock_test', 'mixed', fileIndexSet);
  } else if (fs.existsSync(path.join(unitRootDir, 'Prepare', 'Mock_Test', 'mock_test.md'))) {
    fail(scope, 'Missing canonical JSON companion for Prepare/Mock_Test/mock_test.md');
  }

  // Examination
  for (const [base, type] of [
    ['pre_final_exam', 'pre_final_exam'],
    ['certification_exam', 'certification_exam'],
    ['question_pool_100', 'question_pool'],
  ]) {
    const ePath = path.join(unitRootDir, 'Examination', `${base}.json`);
    if (fs.existsSync(ePath)) {
      validateAssessmentFile(ePath, subjectId, unitNum, type, 'mixed', fileIndexSet);
    } else if (fs.existsSync(path.join(unitRootDir, 'Examination', `${base}.md`))) {
      fail(scope, `Missing canonical JSON companion for Examination/${base}.md`);
    }
  }
}

function main() {
  const catalog = readJson(CATALOG_PATH, 'catalog.json');
  const coursesDoc = readJson(COURSES_PATH, 'courses.json');
  const manifest = readJson(MANIFEST_PATH, 'manifest.json');
  const fileIndex = readJson(FILE_INDEX_PATH, 'file-index.json');

  if (!catalog || !coursesDoc || !manifest || !fileIndex) {
    reportAndExit();
    return;
  }

  const fileIndexSet = new Set(Array.isArray(fileIndex.files) ? fileIndex.files : []);
  if (fileIndexSet.size === 0) {
    fail('file-index.json', 'file-index.json contains 0 files');
  }

  const coursesMap = coursesDoc.courses || {};
  const manifestById = new Map((manifest.subjects || []).map((s) => [s.id, s]));

  for (const board of catalog.boards || []) {
    for (const klass of board.classes || []) {
      for (const subject of klass.subjects || []) {
        summary.subjectsChecked++;
        const subScope = `subject:${subject.id}`;
        const subjectDir = path.join(RESOURCE_ROOT, subject.path);
        if (!fs.existsSync(subjectDir)) {
          fail(subScope, `Subject directory does not exist: ${subject.path}`);
          continue;
        }

        // Enforce lowercase chapter_* folders at subject root
        for (const entry of fs.readdirSync(subjectDir, { withFileTypes: true })) {
          if (entry.isDirectory() && /^Chapter_\d+$/i.test(entry.name) && entry.name !== entry.name.toLowerCase()) {
            fail(subScope, `Non-lowercase chapter directory "${entry.name}" — must be "${entry.name.toLowerCase()}"`);
          }
        }

        // Validate courses.json entry
        const cMeta = coursesMap[subject.id];
        if (!cMeta) {
          fail(subScope, 'Missing matching course entry in courses.json');
        } else {
          for (const field of ['subtitle', 'description', 'discipline', 'level', 'language', 'thumbnail']) {
            if (typeof cMeta[field] !== 'string' || !cMeta[field].trim()) {
              fail(`courses.json:${subject.id}`, `Missing required string field "${field}"`);
            }
          }
          if (!cMeta.instructor?.name) {
            fail(`courses.json:${subject.id}`, 'Missing instructor.name');
          }
          if (typeof cMeta.durationHours !== 'number' || cMeta.durationHours <= 0) {
            fail(`courses.json:${subject.id}`, 'Invalid durationHours');
          }
          if (typeof cMeta.credits !== 'number' || cMeta.credits <= 0) {
            fail(`courses.json:${subject.id}`, 'Invalid credits');
          }
          if (cMeta.thumbnail) verifyPublicAsset(cMeta.thumbnail, `courses.json:${subject.id}.thumbnail`);

          // Verify all video/clip local thumbnails referenced in courses.json
          for (const [uKey, uVal] of Object.entries(cMeta.units || {})) {
            if (Array.isArray(uVal.videos)) {
              for (const vid of uVal.videos) {
                if (vid.thumbnailUrl) {
                  verifyPublicAsset(vid.thumbnailUrl, `courses.json:${subject.id}.units.${uKey}.video.${vid.id}`);
                }
                if (Array.isArray(vid.clips)) {
                  for (const clip of vid.clips) {
                    if (clip.thumbnailUrl) {
                      verifyPublicAsset(clip.thumbnailUrl, `courses.json:${subject.id}.units.${uKey}.clip.${clip.id}`);
                    }
                  }
                }
              }
            }
          }
        }

        const mSub = manifestById.get(subject.id);
        if (!mSub || !Array.isArray(mSub.chapters) || mSub.chapters.length === 0) {
          fail(subScope, 'Missing or empty chapters list in manifest.json');
          continue;
        }

        for (const ch of mSub.chapters) {
          summary.chaptersChecked++;
          const chDir = path.join(subjectDir, ch.dir);
          const chScope = `${subject.id}:${ch.dir}`;
          if (!fs.existsSync(chDir)) {
            fail(chScope, 'Manifest chapter directory does not exist on disk');
            continue;
          }

          // Validate canonical chapter metadata.json
          const metaPath = path.join(chDir, 'metadata.json');
          const meta = readJson(metaPath, `${chScope}/metadata.json`);
          if (meta) {
            if (meta.schemaVersion !== '1.0') {
              fail(`${chScope}/metadata.json`, `Expected schemaVersion="1.0", got ${JSON.stringify(meta.schemaVersion)}`);
            }
            if (meta.subject !== subject.id) {
              fail(`${chScope}/metadata.json`, `Expected subject="${subject.id}", got ${JSON.stringify(meta.subject)}`);
            }
            if (meta.chapter_number !== ch.number) {
              fail(`${chScope}/metadata.json`, `Expected chapter_number=${ch.number}, got ${JSON.stringify(meta.chapter_number)}`);
            }
            if (typeof meta.chapter_name !== 'string' || !meta.chapter_name.trim()) {
              fail(`${chScope}/metadata.json`, 'Missing non-empty chapter_name');
            }
          }

          // Validate segmented video subdirs or chapter root
          const videoSubdirs = fs
            .readdirSync(chDir, { withFileTypes: true })
            .filter((e) => e.isDirectory() && VIDEO_DIR_PATTERN.test(e.name))
            .map((e) => e.name)
            .sort();

          if (videoSubdirs.length > 0) {
            for (const vDir of videoSubdirs) {
              validateUnitDir(path.join(chDir, vDir), subject.id, ch.number, fileIndexSet);
            }
          } else {
            validateUnitDir(chDir, subject.id, ch.number, fileIndexSet);
          }
        }
      }
    }
  }

  reportAndExit();
}

function reportAndExit() {
  if (errors.length > 0) {
    console.error(`\n[SCHEMA VALIDATION FAILED] ${errors.length} error(s) detected:`);
    for (const err of errors.slice(0, 50)) {
      console.error(`  - ${err}`);
    }
    if (errors.length > 50) {
      console.error(`  ... and ${errors.length - 50} more error(s).`);
    }
    process.exit(1);
  }

  console.log(
    `[SCHEMA VALIDATION PASSED] v1.0 | subjects=${summary.subjectsChecked} chapters=${summary.chaptersChecked} ` +
      `flashcardDecks=${summary.flashcardDecksChecked} (${summary.flashcardsVerified} cards) ` +
      `assessmentFiles=${summary.assessmentFilesChecked} (${summary.questionsVerified} questions) ` +
      `assetsVerified=${summary.assetsVerified} errors=0`,
  );
}

main();
