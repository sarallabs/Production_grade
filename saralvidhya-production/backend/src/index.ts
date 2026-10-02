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
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Health check (no auth needed) ───────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── All routes below require a valid Firebase ID token ───────────
app.use('/api', verifyToken);

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/content',    contentRoutes);     // serves from GCS
app.use('/api/gemini',     geminiRoutes);      // Gemini proxy
app.use('/api/users',      userRoutes);        // profile, progress
app.use('/api/assessment', assessmentRoutes);  // quiz results, scoring

// ── Start ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080');
app.listen(PORT, () => {
  console.log(`[SaralVidhya API] Running on port ${PORT}`);
});

export default app;
