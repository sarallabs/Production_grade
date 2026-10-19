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

/**
 * POST /api/gemini/tts
 * Body: { ssml?: string, text?: string, languageCode?: string, voiceName?: string, ssmlGender?: string, speakingRate?: number, enableTimePointing?: boolean }
 *
 * Proxies Google Cloud TTS calls server-side — API key never exposed to browser.
 */
router.post('/tts', async (req: Request, res: Response) => {
  const {
    ssml,
    text,
    languageCode = 'en-IN',
    voiceName = 'en-IN-Wavenet-D',
    ssmlGender = 'FEMALE',
    speakingRate = 1.0,
    enableTimePointing = true,
  } = req.body || {};

  if (!ssml && !text) {
    return res.status(400).json({ error: 'Either ssml or text is required' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(503).json({ error: 'Cloud TTS API key is not configured on the server' });
  }

  const ttsBody: Record<string, any> = {
    input: ssml ? { ssml } : { text },
    voice: {
      languageCode,
      name: voiceName,
      ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate,
      pitch: 0,
    },
  };
  if (enableTimePointing && ssml) {
    ttsBody.enableTimePointing = ['SSML_MARK'];
  }

  const endpoint = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ttsBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return res.status(upstream.status).json({ error: `Cloud TTS upstream error: ${errText}` });
    }

    const data = await upstream.json();
    res.json({
      audioContent: data.audioContent,
      timepoints: data.timepoints || [],
    });
  } catch (err: any) {
    console.error('[Gemini TTS] Error:', err.message);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

export default router;
