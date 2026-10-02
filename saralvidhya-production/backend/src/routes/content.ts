import { Router, Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';

const router = Router();
const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET_NAME || 'saralvidhya-artifacts';

const VALID_SECTIONS  = ['read', 'learn', 'practice', 'prepare', 'podcasts'];
const VALID_PERSONAS  = ['beginner', 'intermediate', 'advanced'];
const VALID_DIFFS     = ['easy', 'medium', 'hard'];

/**
 * GCS Canonical Schema (mirrors UI tabs):
 *
 *   chapter/metadata.json
 *   chapter/read/quick/{persona}.md
 *   chapter/read/detailed/{persona}.md
 *   chapter/read/key_takeaways.md
 *   chapter/read/glossary.md
 *   chapter/learn/mindmap.json
 *   chapter/learn/mindmap.png
 *   chapter/learn/study_plan.md
 *   chapter/practice/flashcards/{persona}.json
 *   chapter/practice/mcq/{difficulty}.json
 *   chapter/practice/msq/{difficulty}.json
 *   chapter/practice/mock_test.json
 *   chapter/practice/question_bank.json
 *   chapter/prepare/pre_final_exam.json
 *   chapter/prepare/certification_exam.json
 *   chapter/prepare/mock_test.json
 *   chapter/podcasts/microcast_01.m4a
 *   chapter/podcasts/microcast_01.md  (transcript)
 *   chapter/podcasts/short_podcast.m4a
 *   chapter/podcasts/long_podcast.m4a
 *
 * API Routes:
 *   GET /api/content/:uni/:subject/:chapter/metadata
 *   GET /api/content/:uni/:subject/:chapter/read/quick?persona=beginner
 *   GET /api/content/:uni/:subject/:chapter/read/detailed?persona=intermediate
 *   GET /api/content/:uni/:subject/:chapter/read/key_takeaways
 *   GET /api/content/:uni/:subject/:chapter/read/glossary
 *   GET /api/content/:uni/:subject/:chapter/learn/mindmap
 *   GET /api/content/:uni/:subject/:chapter/learn/mindmap.png
 *   GET /api/content/:uni/:subject/:chapter/learn/study_plan
 *   GET /api/content/:uni/:subject/:chapter/practice/flashcards?persona=beginner
 *   GET /api/content/:uni/:subject/:chapter/practice/mcq?difficulty=easy
 *   GET /api/content/:uni/:subject/:chapter/practice/msq?difficulty=hard
 *   GET /api/content/:uni/:subject/:chapter/practice/mock_test
 *   GET /api/content/:uni/:subject/:chapter/practice/question_bank
 *   GET /api/content/:uni/:subject/:chapter/prepare/:file
 *   GET /api/content/:uni/:subject/:chapter/podcasts/:file
 */

// ── Helper: stream audio with byte-range ─────────────────────────────────────
async function streamAudio(req: Request, res: Response, gcsPath: string) {
  const gcsFile = storage.bucket(BUCKET).file(gcsPath);
  const [exists] = await gcsFile.exists();
  if (!exists) return res.status(404).json({ error: 'Audio not found', path: gcsPath });

  const [meta]   = await gcsFile.getMetadata();
  const fileSize = parseInt(meta.size as string, 10);
  const mime     = gcsPath.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4';
  const range    = req.headers.range;

  // CORS and media headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
    'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  };

  // Fast return for HEAD request
  if (req.method === 'HEAD') {
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Length': fileSize,
      'Content-Type': mime,
    });
    return res.end();
  }

  // Cap chunks at 8 MiB to avoid Cloud Run's 32 MiB response size limit
  const MAX_CHUNK = 8 * 1024 * 1024; // 8 MiB

  let start = 0;
  let end = fileSize - 1;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    start = parseInt(parts[0], 10) || 0;
    if (parts[1]) {
      end = parseInt(parts[1], 10);
    } else {
      end = Math.min(start + MAX_CHUNK - 1, fileSize - 1);
    }
  } else {
    // If no Range header, stream first chunk as 206 so client gets seeking capability
    end = Math.min(start + MAX_CHUNK - 1, fileSize - 1);
  }

  // Safety caps
  if (start >= fileSize) {
    res.writeHead(416, {
      ...corsHeaders,
      'Content-Range': `bytes */${fileSize}`,
    });
    return res.end();
  }

  if (end >= fileSize) end = fileSize - 1;
  if (end - start + 1 > MAX_CHUNK) end = start + MAX_CHUNK - 1;

  const chunkLength = end - start + 1;

  res.writeHead(206, {
    ...corsHeaders,
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Content-Length': chunkLength,
    'Content-Type': mime,
  });

  const stream = gcsFile.createReadStream({ start, end });
  res.on('close', () => {
    stream.destroy();
  });
  stream.on('error', (err) => {
    console.error('GCS stream error:', err.message);
    if (!res.headersSent) res.status(500).end();
  });
  stream.pipe(res);
}

// ── Helper: serve text/json file from GCS ────────────────────────────────────
async function serveFile(res: Response, gcsPath: string) {
  const gcsFile = storage.bucket(BUCKET).file(gcsPath);
  const [exists] = await gcsFile.exists();
  if (!exists) return res.status(404).json({ error: 'Content not found', path: gcsPath });

  const [content] = await gcsFile.download();

  // Determine MIME type from extension
  const ext = gcsPath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
    json: 'application/json', md: 'text/plain; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  const isBinary = mime.startsWith('image/');

  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(isBinary ? content : content.toString('utf-8'));
}

// ── Base path helper ──────────────────────────────────────────────────────────
const gcsBase = (uni: string, subj: string, ch: string) =>
  `${uni}/${subj}/${ch}`;

// ── GET metadata ──────────────────────────────────────────────────────────────
router.get('/:uni/:subj/:chapter/metadata', async (req: Request, res: Response) => {
  const { uni, subj, chapter } = req.params;
  try {
    await serveFile(res, `${gcsBase(uni, subj, chapter)}/metadata.json`);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET read/quick?persona=beginner ──────────────────────────────────────────
// ── GET read/detailed?persona=intermediate ────────────────────────────────────
router.get('/:uni/:subj/:chapter/read/:type', async (req: Request, res: Response) => {
  const { uni, subj, chapter, type } = req.params;
  const persona = (req.query.persona as string) || 'beginner';

  if (['quick', 'detailed'].includes(type)) {
    if (!VALID_PERSONAS.includes(persona))
      return res.status(400).json({ error: `Invalid persona. Use: ${VALID_PERSONAS.join(', ')}` });
    const path = `${gcsBase(uni, subj, chapter)}/read/${type}/${persona}.md`;
    try { await serveFile(res, path); } catch (e: any) { res.status(500).json({ error: e.message }); }
  } else if (['key_takeaways', 'glossary', 'study_plan'].includes(type)) {
    const path = `${gcsBase(uni, subj, chapter)}/read/${type}.md`;
    try { await serveFile(res, path); } catch (e: any) { res.status(500).json({ error: e.message }); }
  } else {
    res.status(400).json({ error: 'Invalid read type. Use: quick, detailed, key_takeaways, glossary, study_plan' });
  }
});

// ── GET learn/mindmap | learn/mindmap.png | learn/study_plan ─────────────────
router.get('/:uni/:subj/:chapter/learn/:asset', async (req: Request, res: Response) => {
  const { uni, subj, chapter, asset } = req.params;
  const assetMap: Record<string, string> = {
    'mindmap':     'mindmap.json',
    'mindmap.png': 'mindmap.png',
    'study_plan':  'study_plan.md',
  };
  const filename = assetMap[asset];
  if (!filename) return res.status(400).json({ error: 'Invalid learn asset. Use: mindmap, mindmap.png, study_plan' });
  try {
    await serveFile(res, `${gcsBase(uni, subj, chapter)}/learn/${filename}`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET practice/flashcards?persona=beginner ──────────────────────────────────
// ── GET practice/mcq?difficulty=easy ─────────────────────────────────────────
// ── GET practice/msq?difficulty=hard ─────────────────────────────────────────
// ── GET practice/mock_test ────────────────────────────────────────────────────
// ── GET practice/question_bank ────────────────────────────────────────────────
router.get('/:uni/:subj/:chapter/practice/:tool', async (req: Request, res: Response) => {
  const { uni, subj, chapter, tool } = req.params;
  const base = gcsBase(uni, subj, chapter);

  try {
    if (tool === 'flashcards') {
      const persona = (req.query.persona as string) || 'beginner';
      if (!VALID_PERSONAS.includes(persona))
        return res.status(400).json({ error: `Invalid persona. Use: ${VALID_PERSONAS.join(', ')}` });

      const gcsPath = `${base}/practice/flashcards/${persona}.json`;
      const gcsFile = storage.bucket(BUCKET).file(gcsPath);
      const [exists] = await gcsFile.exists();
      if (!exists) return res.status(404).json({ error: 'Flashcards not found', path: gcsPath });

      const [content] = await gcsFile.download();
      const text = content.toString('utf-8').trim();

      // If content is valid JSON, serve as-is
      if (text.startsWith('[') || text.startsWith('{')) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(text);
      }

      // Otherwise parse markdown flashcards: **Q:** ... **A:** ...
      const cards: { front: string; back: string; infographicUrl?: string }[] = [];
      const cardBlocks = text.split(/###\s+Card\s+\d+/i).filter(b => b.trim());
      for (const block of cardBlocks) {
        const qMatch = block.match(/\*\*Q:\*\*\s*(.+?)(?:\n|$)/);
        const aMatch = block.match(/\*\*A:\*\*\s*(.+?)(?:\n|$)/);
        if (qMatch && aMatch) {
          let infoUrl: string | undefined;
          const imgMatch = block.match(/!\[.*?\]\((.+?)\)/);
          if (imgMatch) {
            let rawPath = imgMatch[1].trim();
            if (rawPath.startsWith('../Mindmaps/')) {
              rawPath = rawPath.replace('../Mindmaps/', 'Mindmaps/');
              infoUrl = `/api/content/${uni}/${subj}/${chapter}/${rawPath}`;
            } else if (!rawPath.startsWith('http') && !rawPath.startsWith('data:')) {
              infoUrl = `/api/content/${uni}/${subj}/${chapter}/${rawPath.replace(/^\.\.\//, '')}`;
            } else {
              infoUrl = rawPath;
            }
          }
          cards.push({
            front: qMatch[1].trim(),
            back: aMatch[1].trim(),
            ...(infoUrl ? { infographicUrl: infoUrl } : {}),
          });
        }
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.json(cards);

    } else if (tool === 'mcq' || tool === 'msq') {
      const diff = (req.query.difficulty as string) || 'medium';
      if (!VALID_DIFFS.includes(diff))
        return res.status(400).json({ error: `Invalid difficulty. Use: ${VALID_DIFFS.join(', ')}` });
      await serveFile(res, `${base}/practice/${tool}/${diff}.json`);

    } else if (tool === 'mock_test' || tool === 'question_bank') {
      await serveFile(res, `${base}/practice/${tool}.json`);

    } else {
      res.status(400).json({ error: 'Invalid practice tool. Use: flashcards, mcq, msq, mock_test, question_bank' });
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET prepare/:file (pre_final_exam, certification_exam, mock_test) ─────────
router.get('/:uni/:subj/:chapter/prepare/:file', async (req: Request, res: Response) => {
  const { uni, subj, chapter, file } = req.params;
  const allowed = ['pre_final_exam', 'certification_exam', 'mock_test', 'previous_year'];
  if (!allowed.includes(file))
    return res.status(400).json({ error: `Invalid prepare file. Use: ${allowed.join(', ')}` });
  try {
    await serveFile(res, `${gcsBase(uni, subj, chapter)}/prepare/${file}.json`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET podcasts/:file (microcast_01.m4a, short_podcast.m4a, etc.) ─────────────
router.get('/:uni/:subj/:chapter/podcasts/:file', async (req: Request, res: Response) => {
  const { uni, subj, chapter, file } = req.params;
  const gcsPath = `${gcsBase(uni, subj, chapter)}/podcasts/${file}`;
  try {
    if (file.endsWith('.m4a') || file.endsWith('.mp3')) {
      await streamAudio(req, res, gcsPath);
    } else {
      // Transcript files: strip metadata header
      const gcsFile = storage.bucket(BUCKET).file(gcsPath);
      const [exists] = await gcsFile.exists();
      if (!exists) return res.status(404).json({ error: 'Transcript not found', path: gcsPath });

      const [content] = await gcsFile.download();
      let text = content.toString('utf-8');

      // Strip metadata header: everything before "## Timestamped" or first "---" separator
      const timestampedIdx = text.indexOf('## Timestamped');
      if (timestampedIdx > 0) {
        // Get just the transcript body after the heading line
        const afterHeading = text.substring(timestampedIdx);
        const newlineIdx = afterHeading.indexOf('\n');
        text = newlineIdx > 0 ? afterHeading.substring(newlineIdx + 1).trim() : afterHeading;
      } else {
        // Fallback: strip everything before first "---"
        const hrIdx = text.indexOf('\n---\n');
        if (hrIdx > 0) {
          text = text.substring(hrIdx + 5).trim();
        }
      }

      // Remove timestamp markers like [00:00:00] for cleaner display
      text = text.replace(/\*\*\[\d{2}:\d{2}:\d{2}\]\*\*\s*/g, '');

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(text);
    }
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── GET any static file (images, etc.) under a chapter ────────────────────────
// Catches paths like /angrau/entomology/chapter_01/Mindmaps/Digestive%20System%20Infographics/foo.png
router.get('/:uni/:subj/:chapter/*', async (req: Request, res: Response) => {
  const { uni, subj, chapter } = req.params;
  const wildcard = req.params[0]; // everything after chapter/
  const gcsPath = `${gcsBase(uni, subj, chapter)}/${wildcard}`;
  try {
    await serveFile(res, gcsPath);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
