import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const getGenAI = () => {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY is not set on the server.');
  return new GoogleGenerativeAI(key);
};

router.post('/ai/ask', async (req, res) => {
  try {
    const { model, prompt, systemInstruction } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const genAI = getGenAI();
    const aiModel = genAI.getGenerativeModel({
      model: model || 'gemini-1.5-flash',
      systemInstruction: systemInstruction || undefined,
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('[API Proxy] Gemini Error:', error);
    res.status(500).json({ error: error.message || 'Internal AI Error' });
  }
});

router.post('/tts/synthesize', async (req, res) => {
  try {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY is not set on the server.');

    const response = await fetch(https://texttospeech.googleapis.com/v1/text:synthesize?key=, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(TTS API Error:  );
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[API Proxy] TTS Error:', error);
    res.status(500).json({ error: error.message || 'Internal TTS Error' });
  }
});

router.post('/stt/recognize', async (req, res) => {
  try {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY is not set on the server.');

    const response = await fetch(https://speech.googleapis.com/v1/speech:recognize?key=, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(STT API Error:  );
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[API Proxy] STT Error:', error);
    res.status(500).json({ error: error.message || 'Internal STT Error' });
  }
});

export default router;

