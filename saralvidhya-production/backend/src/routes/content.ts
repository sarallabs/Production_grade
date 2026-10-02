import { Router, Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';

const router = Router();
const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET_NAME || 'saralvidhya-content';

/**
 * GET /api/content/:university/:subject/chapter_:chapter/:level/:file
 *
 * Serves a content file from GCS.
 * e.g. GET /api/content/angrau/entomology/chapter_01/beginner/summary.md
 *
 * For podcast.mp3 — streams with byte-range support for large files.
 */
router.get('/:university/:subject/:chapter/:level/:file', async (req: Request, res: Response) => {
  const { university, subject, chapter, level, file } = req.params;

  // Validate level
  if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
    return res.status(400).json({ error: 'Invalid level' });
  }

  const gcsPath = `${university}/${subject}/${chapter}/${level}/${file}`;
  const gcsFile = storage.bucket(BUCKET).file(gcsPath);

  try {
    const [exists] = await gcsFile.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Stream MP3 with range support (critical for podcast scrubbing)
    if (file.endsWith('.mp3')) {
      const [metadata] = await gcsFile.getMetadata();
      const fileSize = parseInt(metadata.size as string);
      const rangeHeader = req.headers.range;

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0]);
        const end = parts[1] ? parseInt(parts[1]) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': 'audio/mpeg',
        });
        gcsFile.createReadStream({ start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
        });
        gcsFile.createReadStream().pipe(res);
      }
      return;
    }

    // For text files — return content directly
    const [content] = await gcsFile.download();
    const contentType = file.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8';
    res.setHeader('Content-Type', contentType);
    res.send(content.toString('utf-8'));

  } catch (err: any) {
    console.error(`[Content] Error serving ${gcsPath}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

/**
 * GET /api/content/:university/:subject/:chapter/metadata
 * Returns chapter metadata (title, topics, available levels etc.)
 */
router.get('/:university/:subject/:chapter/metadata', async (req: Request, res: Response) => {
  const { university, subject, chapter } = req.params;
  const gcsPath = `${university}/${subject}/${chapter}/metadata.json`;

  try {
    const [content] = await storage.bucket(BUCKET).file(gcsPath).download();
    res.json(JSON.parse(content.toString('utf-8')));
  } catch {
    res.status(404).json({ error: 'Metadata not found' });
  }
});

export default router;
