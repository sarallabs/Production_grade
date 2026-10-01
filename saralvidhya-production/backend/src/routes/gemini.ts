import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * POST /api/gemini/ask
 * Body: { question: string, context: string, level: string }
 *
 * Proxies Gemini calls server-side — API key never exposed to browser.
 */
router.post('/ask', async (req: Request, res: Response) => {
  const { question, context, level } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  const prompt = `
You are a helpful tutor for ${level || 'intermediate'} level students.
Use the following chapter content as context:

${context || '(No context provided)'}

Student question: ${question}

Answer clearly and concisely.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ answer: text });
  } catch (err: any) {
    console.error('[Gemini] Error:', err.message);
    res.status(500).json({ error: 'Failed to get answer from Gemini' });
  }
});

export default router;
