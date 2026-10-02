import { Router, Request, Response } from 'express';
import { getFirestore } from '../config/firebase.js';

const router = Router();

/**
 * POST /api/assessment/submit
 * Saves quiz/assessment results to Firestore.
 * Body: { university, subject, chapter, level, score, total, answers }
 */
router.post('/submit', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const { university, subject, chapter, level, score, total, answers } = req.body;

  try {
    await getFirestore().collection('assessments').add({
      uid,
      university,
      subject,
      chapter,
      level,
      score,
      total,
      percentage: Math.round((score / total) * 100),
      answers,
      submittedAt: new Date(),
    });
    res.json({ success: true, percentage: Math.round((score / total) * 100) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/assessment/history
 * Returns past assessment results for the authenticated user.
 */
router.get('/history', async (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  try {
    const snapshot = await getFirestore().collection('assessments')
      .where('uid', '==', uid)
      .orderBy('submittedAt', 'desc')
      .limit(50)
      .get();

    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
