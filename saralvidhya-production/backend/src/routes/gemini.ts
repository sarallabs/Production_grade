import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

function getGenAI(): GoogleGenerativeAI {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is not configured on the backend server.');
  }
  return new GoogleGenerativeAI(apiKey);
}

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
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ answer: text, model: 'gemini-1.5-flash' });
  } catch (err: any) {
    console.error('[Gemini] Error:', err.message);
    const status = err.message?.includes('not configured') ? 503 : 500;
    res.status(status).json({ error: err.message || 'Failed to get answer from Gemini' });
  }
});

export default router;
