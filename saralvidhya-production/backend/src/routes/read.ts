import { Router, Request, Response } from 'express';
import { ReadSectionParser } from '../services/readSectionParser.js';
import { QuickCheckService } from '../services/quickCheckService.js';
import { ReadMode, Persona, ReadManifest } from '../types/read.js';
import { getFirestore } from '../config/firebase.js';

const router = Router({ mergeParams: true });

const VALID_MODES: ReadMode[] = ['essentials', 'indepth'];
const VALID_PERSONAS: Persona[] = ['beginner', 'intermediate', 'advanced'];

// ── GET /api/content/:uni/:subj/:chapter/read/manifest ──────────────────────────
router.get('/manifest', async (req: Request, res: Response) => {
  const { uni, subj, chapter } = req.params;
  const mode = (req.query.mode as ReadMode) || 'essentials';
  const persona = (req.query.persona as Persona) || 'beginner';

  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: `Invalid mode. Use: ${VALID_MODES.join(', ')}` });
  }
  if (!VALID_PERSONAS.includes(persona)) {
    return res.status(400).json({ error: `Invalid persona. Use: ${VALID_PERSONAS.join(', ')}` });
  }

  try {
    const { summaries } = await ReadSectionParser.getParsedSections(uni, subj, chapter, mode, persona);

    let progressPercent = 20;
    let resumedSectionId = 'section_01';
    let resumedTimestamp = '2h ago';

    // Optional user progress overlay from Firestore
    const uid = (req as any).user?.uid;
    if (uid) {
      try {
        const snap = await getFirestore()
          .collection('users')
          .doc(uid)
          .collection('read_progress')
          .doc(`${uni}__${subj}__${chapter}`)
          .get();

        if (snap.exists) {
          const data = snap.data() || {};
          progressPercent = data.progressPercent ?? progressPercent;
          resumedSectionId = data.nextUnlockedSection || data.lastCompletedSection || resumedSectionId;
          resumedTimestamp = 'Just now';
        }
      } catch (err: any) {
        console.warn('[ReadRoute] Progress overlay warning:', err.message);
      }
    }

    const manifest: ReadManifest = {
      chapter: chapter.toUpperCase().replace('_', ' '),
      subject: subj.toUpperCase(),
      mode,
      persona,
      totalSections: summaries.length,
      chapterProgressPercent: progressPercent,
      resumedSectionId,
      resumedTimestamp,
      sections: summaries,
    };

    res.setHeader('Cache-Control', 'public, max-age=600');
    return res.json(manifest);
  } catch (err: any) {
    console.error('[ReadRoute] Error generating manifest:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/content/:uni/:subj/:chapter/read/sections/:sectionId ──────────────
router.get('/sections/:sectionId', async (req: Request, res: Response) => {
  const { uni, subj, chapter, sectionId } = req.params;
  const mode = (req.query.mode as ReadMode) || 'essentials';
  const persona = (req.query.persona as Persona) || 'beginner';

  try {
    const { sections } = await ReadSectionParser.getParsedSections(uni, subj, chapter, mode, persona);
    const section = sections.find(s => s.sectionId === sectionId || s.moduleId.toLowerCase() === sectionId.toLowerCase());

    if (!section) {
      return res.status(404).json({ error: `Section ${sectionId} not found in chapter ${chapter}` });
    }

    // Attach sanitized Quick Check question if available
    const quickCheck = await QuickCheckService.getSanitizedQuestionForModule(subj, section.moduleId, mode, persona);

    // Audio stream URL
    const audioUrl = `/api/content/${uni}/${subj}/${chapter}/podcasts/1.How 3-Schema Architecture Prevents Data Chaos.mp3`;

    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.json({
      ...section,
      markdownContent: section.contentMarkdown,
      audio: {
        duration: '3:42',
        streamUrl: audioUrl,
      },
      quickCheck,
    });
  } catch (err: any) {
    console.error('[ReadRoute] Error fetching section:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/content/:uni/:subj/:chapter/read/sections/:sectionId/quick-check ──
router.post('/sections/:sectionId/quick-check', async (req: Request, res: Response) => {
  const { uni, subj, chapter, sectionId } = req.params;
  const { selectedKey, moduleId, mode = 'essentials', persona = 'beginner' } = req.body;

  if (!selectedKey) {
    return res.status(400).json({ error: 'Missing selectedKey in request body' });
  }

  const uid = (req as any).user?.uid;

  try {
    const result = await QuickCheckService.evaluateSubmission(
      uni,
      subj,
      chapter,
      sectionId,
      moduleId || 'M1',
      selectedKey,
      mode as ReadMode,
      persona as Persona,
      uid
    );

    return res.json(result);
  } catch (err: any) {
    console.error('[ReadRoute] Quick Check evaluation error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/content/:uni/:subj/:chapter/read/progress/bookmark ────────────────
router.post('/progress/bookmark', async (req: Request, res: Response) => {
  const { uni, subj, chapter } = req.params;
  const { lastActiveSectionId, scrollOffsetRatio = 0 } = req.body;
  const uid = (req as any).user?.uid;

  if (!uid) {
    return res.json({ success: true, guest: true });
  }

  try {
    await getFirestore()
      .collection('users')
      .doc(uid)
      .collection('read_progress')
      .doc(`${uni}__${subj}__${chapter}`)
      .set(
        {
          lastActiveSectionId,
          scrollOffsetRatio,
          lastReadAt: new Date(),
        },
        { merge: true }
      );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
