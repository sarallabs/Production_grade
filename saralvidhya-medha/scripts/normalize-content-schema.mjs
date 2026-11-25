/**
 * Canonical ANU MOOCs Content & Schema Normalizer (v1.0)
 *
 * Normalizes all active catalog courses (mp_ob, management, anu_physics, and any future course)
 * to the single canonical MP OB v1.0 layout and JSON schemas:
 *   - Folder layout: lowercase chapter_<N> (or catalog-declared chapterDirs), Examination/, Prepare/Mock_Test/mock_test.json, Prepare/Revise/flashcards_revise.json
 *   - Flashcards JSON v1.0: { schemaVersion: "1.0", subject, unit, chapter, persona, flashcards: [{ id, front, back, level, infographicUrl? }] }
 *   - Assessments & Exams JSON v1.0: { schemaVersion: "1.0", subject, unit, type, difficulty, questions: [{ id, type, stem, options, letters, answer, explanation }] }
 *   - Chapter metadata.json v1.0
 *
 * Idempotent: safe to re-run at any time.
 */
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_ROOT = path.resolve('public');
const RESOURCE_ROOT = path.join(PUBLIC_ROOT, 'generated_resources');
const CATALOG_PATH = path.join(RESOURCE_ROOT, 'catalog.json');
const COURSES_PATH = path.join(RESOURCE_ROOT, 'courses.json');

const VIDEO_DIR_PATTERN = /^video_\d+(_|$)/;

const stats = {
  dirsRenamed: 0,
  filesMoved: 0,
  backupsRemoved: 0,
  flashcardFilesWritten: 0,
  flashcardsTotal: 0,
  assessmentFilesWritten: 0,
  questionsTotal: 0,
  metadataFilesWritten: 0,
  mindmapsNormalized: 0,
  warnings: [],
};

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function removeIfEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir);
  if (entries.length === 0) {
    fs.rmdirSync(dir);
  }
}

function removeDirRecursive(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function moveFileSafe(src, dst) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dst));
  if (path.resolve(src) === path.resolve(dst)) return false;
  if (fs.existsSync(dst)) {
    fs.rmSync(dst, { force: true });
  }
  fs.renameSync(src, dst);
  stats.filesMoved++;
  return true;
}

function copyDirContents(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(dstDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dst = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      copyDirContents(src, dst);
    } else {
      if (!fs.existsSync(dst)) {
        fs.copyFileSync(src, dst);
      }
    }
  }
}

/** Case-safe NTFS directory rename (e.g. Chapter_3 -> chapter_3) */
function renameCaseSafe(parentDir, oldExactName, newExactName) {
  if (!fs.existsSync(parentDir)) return false;
  const entries = fs.readdirSync(parentDir);
  if (!entries.includes(oldExactName) || oldExactName === newExactName) return false;
  const oldPath = path.join(parentDir, oldExactName);
  const tmpPath = path.join(parentDir, `_tmp_rename_${newExactName}_${Date.now()}`);
  const newPath = path.join(parentDir, newExactName);
  fs.renameSync(oldPath, tmpPath);
  fs.renameSync(tmpPath, newPath);
  stats.dirsRenamed++;
  return true;
}

/** Resolve any asset URL relative to a JSON/MD file and verify it exists under public/. Returns root-absolute `/generated_resources/...` or undefined. */
function resolveVerifiedAssetUrl(rawVal, fileDir, chapterDir) {
  let candidate = '';
  if (typeof rawVal === 'string') {
    candidate = rawVal.trim();
  } else if (rawVal && typeof rawVal === 'object') {
    const nested = rawVal.base64_data_uri ?? rawVal.url ?? rawVal.src ?? rawVal.path;
    if (typeof nested === 'string') candidate = nested.trim();
  }
  if (!candidate) return undefined;
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  if (candidate.startsWith('data:')) return undefined; // Never inline huge data URIs in canonical JSON

  const tryPaths = [];
  if (candidate.startsWith('/')) {
    const decoded = decodeURIComponent(candidate.slice(1));
    tryPaths.push(path.join(PUBLIC_ROOT, decoded));
  } else {
    let decoded = candidate;
    try {
      decoded = decodeURIComponent(candidate);
    } catch {
      // keep raw
    }
    tryPaths.push(path.resolve(fileDir, decoded));
    if (chapterDir) tryPaths.push(path.resolve(chapterDir, decoded));
  }

  for (const abs of tryPaths) {
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
      const rel = path.relative(PUBLIC_ROOT, abs).replace(/\\/g, '/');
      if (!rel.startsWith('..')) {
        return '/' + rel.split('/').map((seg) => encodeURIComponent(seg)).join('/');
      }
    }
  }
  return undefined;
}

/** Repair mangled Python escape sequences in LaTeX formulas (seen in physics/chapter_04 MD files) */
function cleanLatexText(text) {
  if (!text) return '';
  let s = String(text);
  // Repair control characters caused by unescaped \n, \t, \b, \f, \r before LaTeX commands
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/\$\s*\n\s*abla\b/g, '$\\nabla');
  s = s.replace(/\n\s*abla\b/g, '\\nabla');
  s = s.replace(/\t\s*imes\b/g, '\\times');
  s = s.replace(/\t\s*heta\b/g, '\\theta');
  s = s.replace(/\t\s*au\b/g, '\\tau');
  s = s.replace(/\x08eta\b/g, '\\beta');
  s = s.replace(/\s+eta\s+m\s*c\^2/g, ' \\beta m c^2');
  s = s.replace(/\x0crac\{/g, '\\frac{');
  // Fix accidental `$A = $\frac{...}{...}$` -> `$A = \frac{...}{...}$`
  s = s.replace(/\$([^$\n]{1,60})=\s*\$\s*(\\frac\{)/g, '$$$1= $2');
  s = s.replace(/\$hat\{([^}]+)\}/g, '$\\hat{$1}');
  s = s.replace(/\bhat\{([^}]+)\}/g, '\\hat{$1}');
  s = s.replace(/(?<!\\)\bhbar\b/g, '\\hbar');
  s = s.replace(/\$(Phi)\$/g, '$\\Phi$');
  s = s.replace(/(\bscalar potential )\$Phi\$/g, '$1$\\Phi$');
  return s.trim();
}

function cleanRationale(raw) {
  let s = cleanLatexText(raw || '');
  s = s.replace(/^(?:correct|rationale|explanation)\s*:\s*/i, '').trim();
  return s;
}

// ---------------------------------------------------------------------------
// 1. Assessment / Exam Parsing & Normalization
// ---------------------------------------------------------------------------

function extractRawQuestionsFromJson(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== 'object') return [];

  if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    return parsed.questions;
  }
  if (Array.isArray(parsed.items) && parsed.items.length > 0) {
    return parsed.items;
  }

  const collected = [];
  const pushSection = (sec, fallbackTitle = '') => {
    if (!sec || typeof sec !== 'object') return;
    const secTitle = sec.section_title || sec.title || sec.section || fallbackTitle || '';
    const inferredType = /msq|multiple/i.test(secTitle) ? 'msq' : /mcq|single/i.test(secTitle) ? 'mcq' : '';
    const list = Array.isArray(sec.questions)
      ? sec.questions
      : Array.isArray(sec.items)
        ? sec.items
        : Array.isArray(sec)
          ? sec
          : [];
    for (const item of list) {
      if (item && typeof item === 'object') {
        const copy = { ...item };
        if (secTitle && !copy.section) copy.section = secTitle;
        if (inferredType && !copy.type && !copy.question_type && !(copy.question_data && copy.question_data.question_type)) {
          copy._sectionType = inferredType;
        }
        collected.push(copy);
      }
    }
  };

  if (Array.isArray(parsed.sections)) {
    for (const sec of parsed.sections) pushSection(sec);
  } else if (parsed.sections && typeof parsed.sections === 'object') {
    for (const [k, sec] of Object.entries(parsed.sections)) pushSection(sec, k);
  }

  for (const [k, v] of Object.entries(parsed)) {
    if (k === 'sections' || k === 'questions' || k === 'items') continue;
    if (/section|^mcqs$|^msqs$/i.test(k) && v && typeof v === 'object') {
      pushSection(v, k);
    }
  }

  return collected;
}

function normalizeQuestionObject(q, idx, defaultIdPrefix, defaultType = '') {
  if (!q || typeof q !== 'object') return null;
  const inner = q.question_data && typeof q.question_data === 'object' ? q.question_data : q;

  const rawStem =
    inner.stem ||
    inner.question ||
    inner.question_text ||
    inner.q ||
    q.stem ||
    q.question ||
    q.question_text ||
    '';
  const stem = cleanLatexText(String(rawStem).replace(/^\[.*?\]\s*/, '').trim());
  if (!stem) return null;

  const rawOpts = inner.options ?? q.options;
  const optionEntries = [];

  if (Array.isArray(rawOpts)) {
    rawOpts.forEach((opt, i) => {
      if (typeof opt === 'string') {
        const m = opt.trim().match(/^([A-F])[).:\]]\s*/i);
        const letter = m ? m[1].toUpperCase() : String.fromCharCode(65 + i);
        const text = cleanLatexText(opt.replace(/^[A-F][).:\]]\s*/i, '').trim());
        if (text) optionEntries.push({ letter, text });
      } else if (opt && typeof opt === 'object') {
        const letter =
          String(opt.key || opt.letter || opt.label || String.fromCharCode(65 + i))
            .trim()
            .toUpperCase()
            .replace(/[^A-Z]/g, '') || String.fromCharCode(65 + i);
        const text = cleanLatexText(
          String(opt.text ?? opt.value ?? opt.label ?? '')
            .replace(/^[A-F][).:\]]\s*/i, '')
            .trim(),
        );
        if (text) optionEntries.push({ letter, text });
      }
    });
  } else if (rawOpts && typeof rawOpts === 'object') {
    const entries = Object.entries(rawOpts).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([k, v], i) => {
      const letter = k.trim().toUpperCase().replace(/[^A-Z]/g, '') || String.fromCharCode(65 + i);
      const text = cleanLatexText(String(v ?? '').replace(/^[A-F][).:\]]\s*/i, '').trim());
      if (text) optionEntries.push({ letter, text });
    });
  }

  if (optionEntries.length < 2) return null;

  const letters = optionEntries.map((_, i) => String.fromCharCode(65 + i));
  const options = optionEntries.map((o) => o.text);
  const origLetterToCanon = new Map(optionEntries.map((o, i) => [o.letter, letters[i]]));

  const resolveLetter = (ans) => {
    if (typeof ans === 'number' && Number.isInteger(ans)) {
      return ans >= 0 && ans < letters.length ? letters[ans] : null;
    }
    const str = String(ans ?? '').trim();
    if (!str) return null;
    const stripped = str.replace(/^[A-F][).:\]]\s*/i, '').trim().toLowerCase();
    const letterMatch = str.match(/^([A-F])(?:[).:\]\s]|$)/i);
    if (letterMatch) {
      const L = letterMatch[1].toUpperCase();
      if (origLetterToCanon.has(L)) return origLetterToCanon.get(L);
      const codeIdx = L.charCodeAt(0) - 65;
      if (codeIdx >= 0 && codeIdx < letters.length) return letters[codeIdx];
    }
    const textIdx = options.findIndex((opt) => opt.trim().toLowerCase() === stripped);
    return textIdx >= 0 ? letters[textIdx] : null;
  };

  const rawAnswer =
    inner.answer ??
    inner.correct_answers ??
    inner.correct_answer ??
    inner.correct_option ??
    inner.correct_options ??
    q.answer ??
    q.correct_answers ??
    q.correct_answer ??
    q.correct_option ??
    q.correct_options;

  const isCommaLetterList = (val) =>
    typeof val === 'string' && /^[A-F](?:\s*[,&]\s*[A-F])+$/i.test(val.trim());

  let resolvedLetters = [];
  if (Array.isArray(rawAnswer)) {
    resolvedLetters = rawAnswer.map(resolveLetter).filter(Boolean);
  } else if (isCommaLetterList(rawAnswer)) {
    resolvedLetters = rawAnswer
      .split(/[,&]/)
      .map((a) => resolveLetter(a.trim()))
      .filter(Boolean);
  } else {
    const one = resolveLetter(rawAnswer);
    if (one) resolvedLetters = [one];
  }
  resolvedLetters = [...new Set(resolvedLetters)];
  if (resolvedLetters.length === 0) return null;

  const rawType = String(
    inner.type || inner.question_type || q.type || q.question_type || q._sectionType || defaultType || '',
  ).toLowerCase();
  const isMSQ =
    rawType.includes('msq') ||
    rawType.includes('multi') ||
    Array.isArray(rawAnswer) ||
    isCommaLetterList(rawAnswer) ||
    resolvedLetters.length > 1 ||
    stem.toLowerCase().includes('select all that apply');

  const type = isMSQ ? 'msq' : 'mcq';
  const answer = isMSQ ? resolvedLetters : resolvedLetters[0];

  const explanation = cleanRationale(
    inner.explanation ||
      inner.rationale ||
      inner.answer_explanation ||
      q.explanation ||
      q.rationale ||
      '',
  );

  const id = String(q.id || q.question_id || inner.id || `${defaultIdPrefix}_q${String(idx + 1).padStart(2, '0')}`);

  const out = {
    id,
    type,
    stem,
    options,
    letters,
    answer,
    explanation,
  };

  const topic = q.topic || inner.topic;
  if (topic && typeof topic === 'string') out.topic = topic.trim();
  const section = q.section || inner.section;
  if (section && typeof section === 'string') out.section = section.trim();
  const bloom = q.bloom_level || q.cognitive_level || q.bloomLevel;
  if (bloom && typeof bloom === 'string') out.bloomLevel = bloom.trim();

  return out;
}

/** Parse Markdown assessments/exams supporting all repo variants (`A)` and `A.`, `<details>`, `**Correct Answer(s):**`) */
function parseAssessmentMarkdown(md, defaultIdPrefix, defaultType = '') {
  // Repair broken newline-escaped LaTeX (e.g. "$\nabla" mangled to "$\n abla") BEFORE line-based option parsing
  const norm = cleanLatexText(md.replace(/\r\n/g, '\n'));
  const questions = [];

  // Track current section type (MCQ vs MSQ) as we scan headings
  const chunks = norm.split(/(?=^#{1,6}[ \t]+(?:Section[ \t]+|Question[ \t]+\d+))/gm);
  let currentSectionType = defaultType;

  // If no heading-based Question blocks, fall back to splitting on **Question:**
  const hasQuestionHeadings = /^#{1,6}[ \t]+Question[ \t]+\d+/m.test(norm);
  const blocks = hasQuestionHeadings
    ? chunks
    : norm.split(/(?=\*\*Question:\*\*)/).filter((b) => b.includes('**Question:**'));

  const OPT_RX = /^[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?([A-F])[).][ \t]*(.+)$/gm;

  for (const block of blocks) {
    if (/^#{1,6}[ \t]+Section[ \t]+/i.test(block.trim())) {
      const firstLine = block.trim().split('\n')[0];
      if (/msq|multiple/i.test(firstLine)) currentSectionType = 'msq';
      else if (/mcq|single/i.test(firstLine)) currentSectionType = 'mcq';
      if (!block.includes('**Question:**')) continue;
    }

    if (!block.includes('**Question:**')) continue;

    const opts = [];
    for (const m of block.matchAll(OPT_RX)) {
      const text = cleanLatexText(m[2].trim());
      if (text) opts.push({ letter: m[1].toUpperCase(), text });
    }
    if (opts.length < 2) continue;

    const qMatch = block.match(
      /\*\*Question:\*\*[ \t]*(?:\*\*\s*)?([\s\S]*?)(?=\n[ \t]*\*\*Options:\*\*|\n[ \t]*[-*][ \t]*(?:\[[ xX]\][ \t]*)?[A-F][).])/,
    );
    const stem = cleanLatexText(
      (qMatch ? qMatch[1] : '')
        .replace(/^\*\*|\*\*$/g, '')
        .replace(/^\[.*?\]\s*/, '')
        .trim(),
    );
    if (!stem) continue;

    const tagMatch = block.match(/^#{1,6}[ \t]+Question[ \t]+\d+[ \t]*\[([^\]]+)\]/m);
    const id = tagMatch
      ? tagMatch[1].trim()
      : `${defaultIdPrefix}_q${String(questions.length + 1).padStart(2, '0')}`;

    const ansMatch = block.match(
      /(?:\*\*Correct Answers?:\*\*|Correct Answers?:)[ \t]*([A-F](?:[ \t]*[.,&][ \t]*[A-F])*|[A-F])\.?/i,
    );
    const rawAnsLetters = ansMatch
      ? (ansMatch[1].match(/[A-F]/gi) || []).map((c) => c.toUpperCase())
      : [];

    const validSet = new Set(opts.map((o) => o.letter));
    const filteredLetters = [...new Set(rawAnsLetters.filter((l) => validSet.has(l)))];
    if (filteredLetters.length === 0) continue;

    const ratMatch = block.match(
      /(?:\*\*Rationale:\*\*|Rationale:)[ \t]*([\s\S]*?)(?=<\/details>|\n\*\*Source|\n---|\n#{1,6}[ \t]+|$)/i,
    );
    const explanation = cleanRationale(ratMatch ? ratMatch[1] : '');

    const letters = opts.map((_, i) => String.fromCharCode(65 + i));
    const letterRemap = new Map(opts.map((o, i) => [o.letter, letters[i]]));
    const mappedAns = filteredLetters.map((l) => letterRemap.get(l)).filter(Boolean);

    const isMSQ =
      defaultType === 'msq' ||
      currentSectionType === 'msq' ||
      mappedAns.length > 1 ||
      /\*\*Correct Answers:\*\*/i.test(block) ||
      stem.toLowerCase().includes('select all that apply');

    const topicMatch = block.match(/\*\*Topic(?:\s*\/\s*Sub-topic)?:\*\*[ \t]*([^\n]+)/i);

    const qObj = {
      id,
      type: isMSQ ? 'msq' : 'mcq',
      stem,
      options: opts.map((o) => o.text),
      letters,
      answer: isMSQ ? mappedAns : mappedAns[0],
      explanation,
    };
    if (topicMatch) qObj.topic = topicMatch[1].trim();
    questions.push(qObj);
  }

  return questions;
}

function buildCanonicalAssessmentPayload({ subject, unit, type, difficulty, questions }) {
  return {
    schemaVersion: '1.0',
    subject,
    unit,
    type,
    difficulty,
    questions,
  };
}

// ---------------------------------------------------------------------------
// 2. Flashcards Parsing & Normalization
// ---------------------------------------------------------------------------

/** Extract map of card images from a sibling markdown file (handles <img src="..."> and ![alt](url)) */
function extractMarkdownCardImages(mdPath) {
  if (!fs.existsSync(mdPath)) return { byIndex: [], byAlt: new Map(), byFront: new Map() };
  const md = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const byIndex = [];
  const byAlt = new Map();
  const byFront = new Map();

  // Split into cards by ### Q or **Q:** or # Card
  const cardBlocks = md.split(/(?=^#{1,4}[ \t]+(?:Q\d*|Card\s+\d+|CardPREP-\d+)|\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*)/gm);
  for (const blk of cardBlocks) {
    const imgMatch =
      blk.match(/<img[^>]+src="([^"]+)"(?:[^>]+alt="([^"]*)")?/i) ||
      blk.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    let src = '';
    let alt = '';
    if (imgMatch) {
      if (imgMatch[0].startsWith('<img')) {
        src = imgMatch[1].trim();
        alt = (imgMatch[2] || '').trim();
      } else {
        alt = (imgMatch[1] || '').trim();
        src = imgMatch[2].trim();
      }
    }
    const qLine =
      blk.match(/\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*\s*([^\n]+)/)?.[1] ||
      blk.match(/^#{2,4}[ \t]+Q\d*:?\s*([^\n]*)\n([^\n]*)/m)?.slice(1).join(' ');
    const frontKey = (qLine || '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

    if (src) {
      byIndex.push(src);
      if (alt) byAlt.set(alt.toLowerCase().replace(/\.png$|\.jpg$|\.webp$/i, '').trim(), src);
      if (frontKey) byFront.set(frontKey.slice(0, 80), src);
    } else if (frontKey) {
      byIndex.push(null);
    }
  }
  return { byIndex, byAlt, byFront };
}

function parseFlashcardsMarkdown(mdPath, fileDir, chapterDir, defaultLevel) {
  if (!fs.existsSync(mdPath)) return [];
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const cards = [];

  const cleanBack = (rawBack) => {
    let imgSrc;
    const htmlImg = rawBack.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    if (htmlImg) {
      imgSrc = htmlImg[1].trim();
      rawBack = rawBack.replace(htmlImg[0], '');
    }
    const mdImg = rawBack.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (mdImg) {
      if (!imgSrc) imgSrc = mdImg[1].trim();
      rawBack = rawBack.replace(mdImg[0], '');
    }
    rawBack = rawBack.replace(/<div[^>]*>\s*<\/div>/gi, '');
    rawBack = rawBack
      .replace(
        /(?:^|\n)\s*>?\s*\*\*(?:Infographic Prompt|Difficulty|Type|Source|Source Reference|Bloom['’]s Level|Mindmap Depth|Mindmap Node|Mindmap Location|Node Depth|Sub-Topic|Topic):\*\*[^\n]*/gm,
        '',
      )
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const verifiedImg = imgSrc ? resolveVerifiedAssetUrl(imgSrc, fileDir, chapterDir) : undefined;
    return { back: cleanLatexText(rawBack), infographicUrl: verifiedImg };
  };

  // Pattern 1: **Q:** / **A:** or **Front:** / **Back:**
  const p1 =
    /\*\*(?:Q(?:\s*\(Front\))?|Front):\*\*\s*([\s\S]*?)\s*\*\*(?:A(?:\s*\(Back\))?|Back):\*\*\s*([\s\S]*?)(?=\n#{1,6}[ \t]+\S|\n---[ \t]*\n|\n\*\*(?:Q(?:\s*\(Front\))?|Front):|$)/g;
  let matches = [...raw.matchAll(p1)];

  if (matches.length === 0) {
    // Pattern 2: ### Q1 \n ... \n ### Ans \n ...
    const p2 =
      /^#{2,4}[ \t]+Q\d*[^\n]*\n([\s\S]*?)\n#{2,4}[ \t]+Ans(?:wer)?[^\n]*\n([\s\S]*?)(?=\n#{2,4}[ \t]+Q\d*|\n---[ \t]*\n|$)/gm;
    matches = [...raw.matchAll(p2)];
  }

  if (matches.length === 0) {
    // Pattern 3: ### Q: ... \n ### Ans: ...
    const p3 =
      /^#{2,4}[ \t]+Q:\s*([\s\S]*?)\n#{2,4}[ \t]+Ans(?:wer)?:\s*([\s\S]*?)(?=\n#{2,4}[ \t]+Q:|\n---[ \t]*\n|$)/gm;
    matches = [...raw.matchAll(p3)];
  }

  matches.forEach((m, i) => {
    const front = cleanLatexText(m[1].trim());
    const { back, infographicUrl } = cleanBack(m[2]);
    if (!front || !back) return;
    const card = {
      id: `fc_${defaultLevel}_${String(i + 1).padStart(2, '0')}`,
      front,
      back,
      level: defaultLevel,
    };
    if (infographicUrl) card.infographicUrl = infographicUrl;
    cards.push(card);
  });

  return cards;
}

function normalizeFlashcardArray(rawCards, { fileDir, chapterDir, defaultLevel, idPrefix, siblingMdPath }) {
  const mdImgs = siblingMdPath ? extractMarkdownCardImages(siblingMdPath) : { byIndex: [], byAlt: new Map(), byFront: new Map() };
  const out = [];

  rawCards.forEach((c, idx) => {
    if (!c || typeof c !== 'object') return;
    const front = cleanLatexText(String(c.front ?? c.term ?? c.question ?? c.q ?? '').trim());
    let back = cleanLatexText(String(c.back ?? c.definition ?? c.answer ?? c.a ?? '').trim());
    if (!front || !back) return;

    const keyTakeaway = typeof c.key_takeaway === 'string' ? c.key_takeaway.trim() : typeof c.keyTakeaway === 'string' ? c.keyTakeaway.trim() : '';
    if (keyTakeaway && !back.includes('Key Takeaway:')) {
      back = `${back}\n\n💡 **Key Takeaway:** ${keyTakeaway}`;
    }

    // Resolve existing image reference
    let infographicUrl =
      resolveVerifiedAssetUrl(c.infographicUrl, fileDir, chapterDir) ||
      resolveVerifiedAssetUrl(c.image, fileDir, chapterDir) ||
      resolveVerifiedAssetUrl(c.imageUrl, fileDir, chapterDir) ||
      resolveVerifiedAssetUrl(c.infographic, fileDir, chapterDir) ||
      resolveVerifiedAssetUrl(c.visual_base64, fileDir, chapterDir) ||
      resolveVerifiedAssetUrl(c.visual_url, fileDir, chapterDir);

    // Fallback: recover verified image from sibling .md (e.g. MBA Ch3 Revise or Ch5 Flashcards)
    if (!infographicUrl) {
      const infoKey = String(c.infographic_key || '').toLowerCase().replace(/\.png$|\.jpg$|\.webp$/i, '').trim();
      const frontKey = front.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80);
      const mdCandidate =
        (infoKey && mdImgs.byAlt.get(infoKey)) ||
        mdImgs.byFront.get(frontKey) ||
        (c.infographic_key ? mdImgs.byIndex[idx] : null);
      if (mdCandidate) {
        infographicUrl = resolveVerifiedAssetUrl(mdCandidate, fileDir, chapterDir);
      }
    }

    const rawLvl = String(c.level || c.persona || c.persona_section || c.difficulty || defaultLevel || '').toLowerCase();
    let level = defaultLevel;
    if (rawLvl.includes('begin') || rawLvl === 'easy') level = 'beginner';
    else if (rawLvl.includes('inter') || rawLvl === 'medium') level = 'intermediate';
    else if (rawLvl.includes('adv') || rawLvl === 'hard') level = 'advanced';
    else if (rawLvl.includes('mix') || defaultLevel === 'mixed') level = 'mixed';

    const id = String(c.id || c.card_id || c.revision_id || `${idPrefix}_${String(idx + 1).padStart(2, '0')}`);
    const card = { id, front, back, level };
    if (infographicUrl) card.infographicUrl = infographicUrl;
    if (typeof c.topic === 'string' && c.topic.trim()) card.topic = c.topic.trim();
    if (typeof c.category === 'string' && c.category.trim()) card.category = c.category.trim();
    out.push(card);
  });

  return out;
}

function buildCanonicalFlashcardsPayload({ subject, unit, chapterTitle, persona, flashcards }) {
  return {
    schemaVersion: '1.0',
    subject,
    unit,
    chapter: chapterTitle,
    persona,
    flashcards,
  };
}

// ---------------------------------------------------------------------------
// 3. Mindmap Normalization Helper (MBA Chapter 3 txt -> Mermaid mindmap.md)
// ---------------------------------------------------------------------------

function convertTxtTreeToMermaidMindmap(txtContent, fallbackTitle) {
  const lines = txtContent.replace(/\r\n/g, '\n').split('\n').filter((l) => l.trim().length > 0);
  const rootText = (lines[0] || fallbackTitle).replace(/[⭐★]/g, '').replace(/["()[\]]/g, '').trim();
  const out = [`# ${rootText}`, '', '```mermaid', 'mindmap', `  root(("${rootText}"))`];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    if (/^[│\s]*$/.test(raw)) continue;
    const match = raw.match(/^([│\s]*)[├└]──\s*(.+)$/);
    if (!match) continue;
    const prefix = match[1];
    const depth = Math.floor(prefix.length / 4) + 1; // 1, 2, 3...
    const label = match[2]
      .replace(/[⭐★]/g, '')
      .replace(/[()[\]{}"]/g, '')
      .replace(/:/g, ' -')
      .replace(/\s+/g, ' ')
      .trim();
    if (!label) continue;
    const indent = '  '.repeat(depth + 1);
    out.push(`${indent}${label}`);
  }
  out.push('```', '');
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// 4. Per-Unit Normalization Driver
// ---------------------------------------------------------------------------

function normalizeUnitContent({ subjectId, unitNum, chapterTitle, unitRootDir, chapterRootDir, scopeTag = '' }) {
  const prefixTag = scopeTag ? `${subjectId}_u${unitNum}_${scopeTag}` : `${subjectId}_u${unitNum}`;

  // 4A. Remove stray _backups anywhere under unitRootDir
  function pruneBackups(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '_backups') {
          removeDirRecursive(full);
          stats.backupsRemoved++;
        } else if (entry.name !== '_inline_assets') {
          pruneBackups(full);
        }
      }
    }
  }
  pruneBackups(unitRootDir);

  // 4B. Standardize Exam/ -> Examination/ (including nested Pre_Final_Exam / Certification_Exam)
  const legacyExamDir = path.join(unitRootDir, 'Exam');
  const canonExamDir = path.join(unitRootDir, 'Examination');
  if (fs.existsSync(legacyExamDir)) {
    ensureDir(canonExamDir);
    const moveExamTree = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const src = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          moveExamTree(src);
          removeIfEmpty(src);
        } else {
          moveFileSafe(src, path.join(canonExamDir, entry.name));
        }
      }
    };
    moveExamTree(legacyExamDir);
    removeDirRecursive(legacyExamDir);
  }

  // 4C. Standardize Prepare/Mock_Test/mock_test_chapter_<N>.{json,md} -> mock_test.{json,md}
  const mockDir = path.join(unitRootDir, 'Prepare', 'Mock_Test');
  if (fs.existsSync(mockDir)) {
    for (const ext of ['json', 'md']) {
      const canon = path.join(mockDir, `mock_test.${ext}`);
      const named = path.join(mockDir, `mock_test_chapter_${unitNum}.${ext}`);
      const namedPad = path.join(mockDir, `mock_test_chapter_${String(unitNum).padStart(2, '0')}.${ext}`);
      if (fs.existsSync(named)) {
        if (!fs.existsSync(canon)) moveFileSafe(named, canon);
        else fs.rmSync(named, { force: true });
      }
      if (fs.existsSync(namedPad)) {
        if (!fs.existsSync(canon)) moveFileSafe(namedPad, canon);
        else fs.rmSync(namedPad, { force: true });
      }
    }
  }

  // 4D. Standardize Prepare/Flashcards -> Prepare/Revise
  const legacyPrepFcDir = path.join(unitRootDir, 'Prepare', 'Flashcards');
  const canonReviseDir = path.join(unitRootDir, 'Prepare', 'Revise');
  if (fs.existsSync(legacyPrepFcDir)) {
    ensureDir(canonReviseDir);
    // Preserve _inline_assets or generated_infographics before moving files
    for (const assetDirName of ['_inline_assets', 'generated_infographics']) {
      const srcAsset = path.join(legacyPrepFcDir, assetDirName);
      if (fs.existsSync(srcAsset)) {
        copyDirContents(srcAsset, path.join(canonReviseDir, assetDirName));
      }
    }
    const legacyMd = path.join(legacyPrepFcDir, 'prep_flashcards.md');
    const canonMd = path.join(canonReviseDir, 'flashcards_revise.md');
    if (fs.existsSync(legacyMd) && !fs.existsSync(canonMd)) {
      moveFileSafe(legacyMd, canonMd);
    }
    const legacyMetaJson = path.join(legacyPrepFcDir, 'prep_flashcards_metadata.json');
    const canonJson = path.join(canonReviseDir, 'flashcards_revise.json');
    if (fs.existsSync(legacyMetaJson) && !fs.existsSync(canonJson)) {
      moveFileSafe(legacyMetaJson, canonJson);
    }
    removeDirRecursive(legacyPrepFcDir);
  }

  // 4E. Standardize Learn/Mindmaps non-canonical names
  const mindmapsDir = path.join(unitRootDir, 'Learn', 'Mindmaps');
  if (fs.existsSync(mindmapsDir)) {
    const unit5Mm = path.join(mindmapsDir, 'MM_UNIT_5_Mindmap.md');
    const canonMmMd = path.join(mindmapsDir, 'mindmap.md');
    if (fs.existsSync(unit5Mm) && !fs.existsSync(canonMmMd)) {
      moveFileSafe(unit5Mm, canonMmMd);
      stats.mindmapsNormalized++;
    }
    const unit3Txt = path.join(mindmapsDir, 'MM_UNIT_3_Mindmap.txt');
    if (fs.existsSync(unit3Txt) && !fs.existsSync(canonMmMd)) {
      const txt = fs.readFileSync(unit3Txt, 'utf8');
      fs.writeFileSync(canonMmMd, convertTxtTreeToMermaidMindmap(txt, chapterTitle), 'utf8');
      stats.mindmapsNormalized++;
    }
  }

  // 4F. Normalize Learn/Flashcards/flashcards_{beginner,intermediate,advanced}.json
  const learnFcDir = path.join(unitRootDir, 'Learn', 'Flashcards');
  const legacyFcMetaPath = path.join(learnFcDir, 'flashcards_metadata.json');
  const legacyFcMeta = fs.existsSync(legacyFcMetaPath) ? readJsonSafe(legacyFcMetaPath) : null;

  if (fs.existsSync(learnFcDir)) {
    for (const persona of ['beginner', 'intermediate', 'advanced']) {
      const jsonPath = path.join(learnFcDir, `flashcards_${persona}.json`);
      const mdPath = path.join(learnFcDir, `flashcards_${persona}.md`);

      let cards = [];
      if (fs.existsSync(jsonPath)) {
        const parsed = readJsonSafe(jsonPath);
        const rawArr = Array.isArray(parsed)
          ? parsed
          : parsed?.flashcards || parsed?.cards || parsed?.items || [];
        cards = normalizeFlashcardArray(rawArr, {
          fileDir: learnFcDir,
          chapterDir: chapterRootDir,
          defaultLevel: persona,
          idPrefix: `${prefixTag}_fc_${persona}`,
          siblingMdPath: mdPath,
        });
      } else if (legacyFcMeta && Array.isArray(legacyFcMeta.cards)) {
        const filtered = legacyFcMeta.cards.filter(
          (c) => String(c.persona || c.difficulty || '').toLowerCase().startsWith(persona.slice(0, 4)),
        );
        cards = normalizeFlashcardArray(filtered, {
          fileDir: learnFcDir,
          chapterDir: chapterRootDir,
          defaultLevel: persona,
          idPrefix: `${prefixTag}_fc_${persona}`,
          siblingMdPath: mdPath,
        });
      }

      if (cards.length === 0 && fs.existsSync(mdPath)) {
        cards = parseFlashcardsMarkdown(mdPath, learnFcDir, chapterRootDir, persona);
      }

      if (cards.length > 0) {
        writeJson(
          jsonPath,
          buildCanonicalFlashcardsPayload({
            subject: subjectId,
            unit: unitNum,
            chapterTitle,
            persona,
            flashcards: cards,
          }),
        );
        stats.flashcardFilesWritten++;
        stats.flashcardsTotal += cards.length;
      }
    }

    // Remove legacy combined metadata file once split into canonical per-level JSONs
    if (fs.existsSync(legacyFcMetaPath)) {
      fs.rmSync(legacyFcMetaPath, { force: true });
    }
  }

  // 4G. Normalize Prepare/Revise/flashcards_revise.json
  if (fs.existsSync(canonReviseDir)) {
    const reviseJsonPath = path.join(canonReviseDir, 'flashcards_revise.json');
    const reviseMdPath = path.join(canonReviseDir, 'flashcards_revise.md');
    let cards = [];
    if (fs.existsSync(reviseJsonPath)) {
      const parsed = readJsonSafe(reviseJsonPath);
      const rawArr = Array.isArray(parsed)
        ? parsed
        : parsed?.flashcards || parsed?.cards || parsed?.items || [];
      cards = normalizeFlashcardArray(rawArr, {
        fileDir: canonReviseDir,
        chapterDir: chapterRootDir,
        defaultLevel: 'mixed',
        idPrefix: `${prefixTag}_revise`,
        siblingMdPath: reviseMdPath,
      });
    } else if (fs.existsSync(reviseMdPath)) {
      cards = parseFlashcardsMarkdown(reviseMdPath, canonReviseDir, chapterRootDir, 'mixed');
    }

    if (cards.length > 0) {
      writeJson(
        reviseJsonPath,
        buildCanonicalFlashcardsPayload({
          subject: subjectId,
          unit: unitNum,
          chapterTitle,
          persona: 'revise',
          flashcards: cards,
        }),
      );
      stats.flashcardFilesWritten++;
      stats.flashcardsTotal += cards.length;
    }
  }

  // 4H. Normalize Learn/Assessments/{MCQ,MSQ}/*.json
  for (const kind of ['MCQ', 'MSQ']) {
    const qType = kind.toLowerCase();
    const asmDir = path.join(unitRootDir, 'Learn', 'Assessments', kind);
    if (!fs.existsSync(asmDir)) continue;

    for (const diff of ['easy', 'medium', 'hard']) {
      const jsonPath = path.join(asmDir, `${qType}_${diff}.json`);
      const mdPath = path.join(asmDir, `${qType}_${diff}.md`);
      let questions = [];

      if (fs.existsSync(jsonPath)) {
        const parsed = readJsonSafe(jsonPath);
        const raw = extractRawQuestionsFromJson(parsed);
        questions = raw
          .map((q, idx) => normalizeQuestionObject(q, idx, `${prefixTag}_${qType}_${diff}`, qType))
          .filter(Boolean);
      } else if (fs.existsSync(mdPath)) {
        const md = fs.readFileSync(mdPath, 'utf8');
        questions = parseAssessmentMarkdown(md, `${prefixTag}_${qType}_${diff}`, qType);
      }

      if (questions.length > 0) {
        writeJson(
          jsonPath,
          buildCanonicalAssessmentPayload({
            subject: subjectId,
            unit: unitNum,
            type: qType,
            difficulty: diff,
            questions,
          }),
        );
        stats.assessmentFilesWritten++;
        stats.questionsTotal += questions.length;
      } else if (fs.existsSync(jsonPath) || fs.existsSync(mdPath)) {
        stats.warnings.push(`0 questions parsed for ${path.relative(RESOURCE_ROOT, jsonPath)}`);
      }
    }
  }

  // 4I. Normalize Prepare/Mock_Test/mock_test.json
  if (fs.existsSync(mockDir)) {
    const mockJson = path.join(mockDir, 'mock_test.json');
    const mockMd = path.join(mockDir, 'mock_test.md');
    let questions = [];
    if (fs.existsSync(mockJson)) {
      const parsed = readJsonSafe(mockJson);
      questions = extractRawQuestionsFromJson(parsed)
        .map((q, idx) => normalizeQuestionObject(q, idx, `${prefixTag}_mock`))
        .filter(Boolean);
    } else if (fs.existsSync(mockMd)) {
      questions = parseAssessmentMarkdown(fs.readFileSync(mockMd, 'utf8'), `${prefixTag}_mock`);
    }

    if (questions.length > 0) {
      writeJson(
        mockJson,
        buildCanonicalAssessmentPayload({
          subject: subjectId,
          unit: unitNum,
          type: 'mock_test',
          difficulty: 'mixed',
          questions,
        }),
      );
      stats.assessmentFilesWritten++;
      stats.questionsTotal += questions.length;
    } else if (fs.existsSync(mockJson) || fs.existsSync(mockMd)) {
      stats.warnings.push(`0 questions parsed for ${path.relative(RESOURCE_ROOT, mockJson)}`);
    }
  }

  // 4J. Normalize Examination/{pre_final_exam,certification_exam,question_pool_100}.json
  if (fs.existsSync(canonExamDir)) {
    const examSpecs = [
      { base: 'pre_final_exam', type: 'pre_final_exam' },
      { base: 'certification_exam', type: 'certification_exam' },
      { base: 'question_pool_100', type: 'question_pool' },
    ];
    for (const spec of examSpecs) {
      const jPath = path.join(canonExamDir, `${spec.base}.json`);
      const mPath = path.join(canonExamDir, `${spec.base}.md`);
      if (!fs.existsSync(jPath) && !fs.existsSync(mPath)) continue;

      let questions = [];
      if (fs.existsSync(jPath)) {
        const parsed = readJsonSafe(jPath);
        questions = extractRawQuestionsFromJson(parsed)
          .map((q, idx) => normalizeQuestionObject(q, idx, `${prefixTag}_${spec.base}`))
          .filter(Boolean);
      } else if (fs.existsSync(mPath)) {
        questions = parseAssessmentMarkdown(fs.readFileSync(mPath, 'utf8'), `${prefixTag}_${spec.base}`);
      }

      if (questions.length > 0) {
        writeJson(
          jPath,
          buildCanonicalAssessmentPayload({
            subject: subjectId,
            unit: unitNum,
            type: spec.type,
            difficulty: 'mixed',
            questions,
          }),
        );
        stats.assessmentFilesWritten++;
        stats.questionsTotal += questions.length;
      } else {
        stats.warnings.push(`0 questions parsed for ${path.relative(RESOURCE_ROOT, jPath)}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Targeted Subject Pre-Migrations (Physics Unit 5 & MBA Chapter_3 casing)
// ---------------------------------------------------------------------------

function runPreMigrations() {
  // 5A. Case-safe NTFS rename: MBA/Chapter_3 -> MBA/chapter_3
  const mbaRoot = path.join(RESOURCE_ROOT, 'Nagarjuna_University', 'MBA');
  renameCaseSafe(mbaRoot, 'Chapter_3', 'chapter_3');

  // 5B. Physics anu/chapter_05 (Relativistic Quantum Mechanics) cleanup & backfill:
  //   - Remove leaked Material Characterization mock_test_chapter_5.md & {level}/flashcards.json
  //   - Promote Relativistic QM mock_test_chapter_01.md -> mock_test.md
  //   - Backfill missing Examination/pre_final_exam.md from physics/chapter_01 (Relativistic QM)
  //   - Enrich Learn/Flashcards/flashcards_{level}.json by merging chapter_01 Relativistic QM cards if helpful
  const physRoot = path.join(RESOURCE_ROOT, 'Nagarjuna_University', 'physics');
  const physCh5 = path.join(physRoot, 'anu', 'chapter_05');
  const physCh1 = path.join(physRoot, 'chapter_01');

  if (fs.existsSync(physCh5)) {
    const ch5MockDir = path.join(physCh5, 'Prepare', 'Mock_Test');
    const leakedCharMock = path.join(ch5MockDir, 'mock_test_chapter_5.md');
    const realRqmMock = path.join(ch5MockDir, 'mock_test_chapter_01.md');
    const canonRqmMock = path.join(ch5MockDir, 'mock_test.md');

    if (fs.existsSync(realRqmMock)) {
      if (fs.existsSync(leakedCharMock)) {
        const content = fs.readFileSync(leakedCharMock, 'utf8');
        if (/material characterization|powder x-ray/i.test(content)) {
          fs.rmSync(leakedCharMock, { force: true });
        }
      }
      if (!fs.existsSync(canonRqmMock)) {
        moveFileSafe(realRqmMock, canonRqmMock);
      } else {
        fs.rmSync(realRqmMock, { force: true });
      }
    }

    // Backfill missing pre_final_exam.md for Relativistic QM
    const ch5PreFinal = path.join(physCh5, 'Examination', 'pre_final_exam.md');
    const ch1PreFinal = path.join(physCh1, 'Examination', 'pre_final_exam.md');
    if (!fs.existsSync(ch5PreFinal) && fs.existsSync(ch1PreFinal)) {
      ensureDir(path.dirname(ch5PreFinal));
      fs.copyFileSync(ch1PreFinal, ch5PreFinal);
      stats.filesMoved++;
    }

    // Remove leaked Material Characterization (PXRD) flashcards.json in anu/chapter_05/{level}/
    for (const lvl of ['beginner', 'intermediate', 'advanced']) {
      const strayJson = path.join(physCh5, lvl, 'flashcards.json');
      if (fs.existsSync(strayJson)) {
        const raw = fs.readFileSync(strayJson, 'utf8');
        if (/pxrd|x-ray diffraction|powder x-ray/i.test(raw)) {
          fs.rmSync(strayJson, { force: true });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Main Runner across all Active Catalog Subjects
// ---------------------------------------------------------------------------

function main() {
  runPreMigrations();

  const catalog = readJsonSafe(CATALOG_PATH);
  const coursesDoc = readJsonSafe(COURSES_PATH);
  if (!catalog?.boards) throw new Error(`Invalid catalog at ${CATALOG_PATH}`);

  const coursesMap = coursesDoc?.courses || {};

  for (const board of catalog.boards) {
    for (const klass of board.classes || []) {
      for (const subject of klass.subjects || []) {
        const subjectDir = path.join(RESOURCE_ROOT, subject.path);
        if (!fs.existsSync(subjectDir)) continue;
        const courseMeta = coursesMap[subject.id] || {};
        const unitsMeta = courseMeta.units || {};

        // Discover chapter dirs matching manifest/catalog rules
        const chapterDirs = [];
        if (Array.isArray(subject.chapterDirs) && subject.chapterDirs.length > 0) {
          for (const rel of subject.chapterDirs) {
            const full = path.join(subjectDir, rel);
            if (fs.existsSync(full)) {
              const m = /chapter_0*(\d+)/i.exec(path.basename(rel));
              chapterDirs.push({ rel, full, num: m ? Number(m[1]) : 1 });
            }
          }
        } else {
          for (const entry of fs.readdirSync(subjectDir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            const m = /^chapter_0*(\d+)$/i.exec(entry.name);
            if (!m) continue;
            // Enforce lowercase chapter_<N>
            const lowerName = `chapter_${Number(m[1])}`;
            if (entry.name !== lowerName) {
              renameCaseSafe(subjectDir, entry.name, lowerName);
            }
            chapterDirs.push({
              rel: lowerName,
              full: path.join(subjectDir, lowerName),
              num: Number(m[1]),
            });
          }
        }

        chapterDirs.sort((a, b) => a.num - b.num);

        for (const ch of chapterDirs) {
          const uMeta = unitsMeta[String(ch.num)] || {};
          const chapterTitle = uMeta.title || `Unit ${ch.num}`;

          // Check if segmented multi-video chapter (e.g. MBA/chapter_1)
          const videoSubdirs = fs
            .readdirSync(ch.full, { withFileTypes: true })
            .filter((e) => e.isDirectory() && VIDEO_DIR_PATTERN.test(e.name))
            .map((e) => e.name)
            .sort();

          if (videoSubdirs.length > 0) {
            for (const vDir of videoSubdirs) {
              const vIdxMatch = /^video_(\d+)/.exec(vDir);
              const vTag = vIdxMatch ? `v${vIdxMatch[1]}` : vDir;
              normalizeUnitContent({
                subjectId: subject.id,
                unitNum: ch.num,
                chapterTitle,
                unitRootDir: path.join(ch.full, vDir),
                chapterRootDir: ch.full,
                scopeTag: vTag,
              });
            }
          } else {
            normalizeUnitContent({
              subjectId: subject.id,
              unitNum: ch.num,
              chapterTitle,
              unitRootDir: ch.full,
              chapterRootDir: ch.full,
            });
          }

          // Special enrichment for physics/anu/chapter_05: merge extra Relativistic QM flashcards from physics/chapter_01
          if (subject.id === 'anu_physics' && ch.num === 5) {
            const ch1Dir = path.join(RESOURCE_ROOT, 'Nagarjuna_University', 'physics', 'chapter_01');
            if (fs.existsSync(ch1Dir)) {
              for (const persona of ['beginner', 'intermediate', 'advanced']) {
                const targetJson = path.join(ch.full, 'Learn', 'Flashcards', `flashcards_${persona}.json`);
                const ch1Md = path.join(ch1Dir, 'Learn', 'Flashcards', `flashcards_${persona}.md`);
                if (fs.existsSync(targetJson) && fs.existsSync(ch1Md)) {
                  const existing = readJsonSafe(targetJson);
                  const extra = parseFlashcardsMarkdown(ch1Md, path.dirname(ch1Md), ch1Dir, persona);
                  const seen = new Set(existing.flashcards.map((c) => c.front.toLowerCase()));
                  let added = 0;
                  for (const c of extra) {
                    if (!seen.has(c.front.toLowerCase())) {
                      seen.add(c.front.toLowerCase());
                      existing.flashcards.push({
                        ...c,
                        id: `anu_physics_u5_fc_${persona}_${String(existing.flashcards.length + 1).padStart(2, '0')}`,
                      });
                      added++;
                    }
                  }
                  if (added > 0) {
                    writeJson(targetJson, existing);
                    stats.flashcardsTotal += added;
                  }
                }
              }
            }
          }

          // Write canonical chapter metadata.json (preserving any existing audio map)
          const metaPath = path.join(ch.full, 'metadata.json');
          const existingMeta = readJsonSafe(metaPath) || {};
          const completed = new Set();
          const checkRoots = videoSubdirs.length > 0 ? videoSubdirs.map((v) => path.join(ch.full, v)) : [ch.full];
          const existsAny = (rel) => checkRoots.some((r) => fs.existsSync(path.join(r, rel)));
          if (existsAny('Learn/Quick_Summary/quick_summary_beginner.md')) completed.add('summary');
          if (existsAny('Learn/Detailed_Summary/detailed_summary_beginner.md')) completed.add('detailed_view');
          if (existsAny('Learn/Flashcards/flashcards_beginner.json')) completed.add('flashcards');
          if (existsAny('Learn/Assessments/MCQ/mcq_easy.json')) completed.add('quiz');
          if (
            fs.existsSync(path.join(ch.full, 'mindmap.json')) ||
            existsAny('Learn/Mindmaps/mindmap.json') ||
            existsAny('Learn/Mindmaps/mindmap.md')
          ) {
            completed.add('mindmap');
          }
          if (fs.existsSync(path.join(ch.full, 'youtube_links.md')) || fs.existsSync(path.join(ch.full, 'videos.json'))) {
            completed.add('youtube_links');
          }

          const newMeta = {
            schemaVersion: '1.0',
            subject: subject.id,
            chapter_number: ch.num,
            chapter_name: chapterTitle,
            completed: [...completed],
          };
          if (existingMeta.audio) newMeta.audio = existingMeta.audio;
          writeJson(metaPath, newMeta);
          stats.metadataFilesWritten++;
        }
      }
    }
  }

  console.log('\n[NORMALIZE COMPLETE]');
  console.log(JSON.stringify(stats, null, 2));
}

main();
