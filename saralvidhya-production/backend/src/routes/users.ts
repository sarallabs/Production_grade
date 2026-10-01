import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase.js';

const router = Router();

/**
 * GET /api/users/profile
 * Returns the authenticated user's profile from Firestore.
 */
router.get('/profile', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  try {
    const doc = await getFirestore().collection('users').doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
    res.json(doc.data());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/profile
 * Creates or updates the user's profile.
 */
router.post('/profile', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const { name, university, subject, level } = req.body;
  try {
    await getFirestore().collection('users').doc(uid).set(
      { name, university, subject, level, updatedAt: new Date() },
      { merge: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/users/progress
 * Records chapter/tool completion progress.
 * Body: { university, subject, chapter, level, tool, completed: boolean }
 */
router.post('/progress', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const { university, subject, chapter, level, tool, completed } = req.body;
  const key = `${university}__${subject}__${chapter}__${level}__${tool}`;
  try {
    await getFirestore().collection('users').doc(uid)
      .collection('progress').doc(key)
      .set({ university, subject, chapter, level, tool, completed, updatedAt: new Date() }, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
