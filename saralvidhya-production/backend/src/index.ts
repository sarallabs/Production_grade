import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import contentRoutes from './routes/content.js';
import geminiRoutes from './routes/gemini.js';
import userRoutes from './routes/users.js';
import assessmentRoutes from './routes/assessment.js';
import v2PublicRoutes from './routes/v2/public.js';
import v2ContentRoutes from './routes/v2/content.js';
import v2AiRoutes from './routes/v2/ai.js';
import v2PublishRoutes from './routes/v2/publish.js';
import { verifyToken } from './middleware/auth.js';

const app = express();

// ── Security & Parsing ──────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // allow audio/image loading from other origins
  crossOriginOpenerPolicy: false,  // needed for audio element
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// ── Health check (no auth needed) ───────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Public routes (no auth needed) ──────────────────────────────
app.use('/api/content',    contentRoutes);     // serves from GCS — legacy public

// ── v2 Multi-Tenant Architecture ────────────────────────────────
// v2 Public (branding, shared password login)
app.use('/v2/t', v2PublicRoutes);
app.use('/api/v2/t', v2PublicRoutes);

// v2 Authenticated Content, Cloud User State & Student Progress (requires v2 session JWT or HttpOnly cookie)
app.use('/v2/t', v2ContentRoutes);
app.use('/api/v2/t', v2ContentRoutes);

// v2 Authenticated Server-Side AI Ask & Cloud TTS Proxy
app.use('/v2/t', v2AiRoutes);
app.use('/api/v2/t', v2AiRoutes);

// v2 Publishing & Approvals
app.use('/v2/publish', v2PublishRoutes);
app.use('/api/v2/publish', v2PublishRoutes);

// ── Rate-limited Server-side AI Ask & Cloud TTS Proxies (Zero browser secrets) ──
const geminiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please try again in a minute.' },
});
app.use('/api/gemini', geminiLimiter, geminiRoutes);

// ── All legacy routes below require a valid Firebase ID token ───
app.use('/api', verifyToken);

// ── Authenticated legacy routes ─────────────────────────────────
app.use('/api/users',      userRoutes);        // profile, progress
app.use('/api/assessment', assessmentRoutes);  // quiz results, scoring

// ── Start ────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '8080');
app.listen(PORT, () => {
  console.log(`[SaralVidhya API] Running on port ${PORT}`);
});

export default app;
