import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

import contentRoutes from './routes/content.js';
import geminiRoutes from './routes/gemini.js';
import userRoutes from './routes/users.js';
import assessmentRoutes from './routes/assessment.js';
import { verifyToken } from './middleware/auth.js';

const app = express();

// ── Security & Parsing ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // allow audio/image loading from other origins
  crossOriginOpenerPolicy: false,  // needed for audio element
}));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Health check (no auth needed) ───────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Public routes (no auth needed) ──────────────────────────────
app.use('/api/content',    contentRoutes);     // serves from GCS — public

// ── All routes below require a valid Firebase ID token ───────────
app.use('/api', verifyToken);

// ── Authenticated routes ────────────────────────────────────────
app.use('/api/gemini',     geminiRoutes);      // Gemini proxy
app.use('/api/users',      userRoutes);        // profile, progress
app.use('/api/assessment', assessmentRoutes);  // quiz results, scoring

// ── Start ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080');
app.listen(PORT, () => {
  console.log(`[SaralVidhya API] Running on port ${PORT}`);
});

export default app;
