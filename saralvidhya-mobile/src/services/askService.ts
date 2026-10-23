/**
 * askService.ts
 *
 * Mobile AI Tutor service for ANGRAU Agriculture curriculum.
 * Replicates the robust web app architecture:
 * 1. Content safety and prompt hygiene checks.
 * 2. Dynamic chapter context fetching (detailed notes or quick study guide from Cloud Run / local).
 * 3. Server-side AI Proxy (https://saralvidhya-api-193782571555.asia-south1.run.app/api/gemini/ask).
 * 4. Client-side Gemini fallback with waterfall model selection (gemini-3.5-flash, gemini-3.6-flash, gemini-flash-latest).
 * 5. Offline curriculum knowledge fallback.
 */

import { fetchDetailedNotes, fetchQuickStudyGuide } from '@/services/contentService';
import type { PersonaType } from '@/context/AuthContext';

export interface AskResult {
  answer: string;
  model: string;
}

const API_BASE = 'https://saralvidhya-api-193782571555.asia-south1.run.app';

// Load Gemini API Key strictly from environment configuration — never hardcode secrets in source code
export const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || '';

// Fallback models in order of speed and stability
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemma-4-26b-a4b-it',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

// Content safety filter (blocks inappropriate or off-topic abuse)
const BLOCKED_WORDS = [
  'kill myself',
  'suicide',
  'hack',
  'porn',
  'sex',
  'nude',
  'cheat on exam',
  'leak paper',
];

export function isCensored(query: string): boolean {
  const lower = query.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

// Clean context to remove huge base64 strings and redundant spacing
function cleanContextForAi(raw: string): string {
  let t = raw;
  // Strip image markdown and base64
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, '');
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, '');
  t = t.replace(/\n{3,}/g, '\n\n');
  if (t.length > 20000) {
    t = t.slice(0, 20000) + '\n\n[Content truncated for context window]';
  }
  return t.trim();
}

// In-memory cache for chapter context
const contextCache = new Map<string, string>();

async function getChapterContext(
  subjectId: string,
  chapterNumber: number,
  persona: PersonaType = 'intermediate',
): Promise<string> {
  const cacheKey = `${subjectId}_${chapterNumber}_${persona}`;
  if (contextCache.has(cacheKey)) {
    return contextCache.get(cacheKey)!;
  }

  try {
    const detailed = await fetchDetailedNotes(subjectId, chapterNumber, persona);
    if (detailed && detailed.trim().length > 100) {
      const cleaned = cleanContextForAi(detailed);
      contextCache.set(cacheKey, cleaned);
      return cleaned;
    }
  } catch (err) {
    console.warn('[AskService] fetchDetailedNotes failed, trying quick study:', err);
  }

  try {
    const quick = await fetchQuickStudyGuide(subjectId, chapterNumber, persona);
    if (quick && quick.trim().length > 100) {
      const cleaned = cleanContextForAi(quick);
      contextCache.set(cacheKey, cleaned);
      return cleaned;
    }
  } catch (err) {
    console.warn('[AskService] fetchQuickStudyGuide failed:', err);
  }

  return '';
}

/**
 * Offline curriculum knowledge fallback for instant offline answers
 */
function getCurriculumFallback(
  question: string,
  chapterNumber: number,
  chapterName: string,
  persona: PersonaType,
): string {
  const q = question.toLowerCase();

  if (q.includes('digestion') || q.includes('digestive') || q.includes('simply')) {
    return (
      `**Insect Digestion Simplified (${chapterName}):**\n\n` +
      `1. **Foregut (Stomodaeum)**: Ingestion & mechanical chewing (Proventriculus gizzard with 6 cuticular teeth).\n` +
      `2. **Midgut (Mesenteron)**: True enzymatic digestion & nutrient absorption across naked endodermal microvilli protected by the peritrophic membrane.\n` +
      `3. **Hindgut (Proctodaeum)**: Waste excretion and 90%+ water reabsorption through specialized rectal pads (papillae).\n\n` +
      `*Key Exam Rule: Foregut & Hindgut shed cuticles during moults; Midgut does not!*`
    );
  }

  if (q.includes('peritrophic') || q.includes('membrane')) {
    return (
      `**The Peritrophic Membrane (Key Exam Concept):**\n\n` +
      `1. **Origin**: Secreted by the midgut epithelial cells or specialized cells at the stomodaeal cardiac valve.\n` +
      `2. **Composition**: A meshwork of chitin fibrils embedded in a protein-carbohydrate matrix.\n` +
      `3. **Functions**:\n` +
      `   - Protects naked midgut microvilli from mechanical abrasion by rough food particles.\n` +
      `   - Barrier preventing bacteria, viruses, and parasites from invading the hemolymph.\n` +
      `   - Allows free diffusion of digestive enzymes into the food bolus and digested nutrients out into the epithelial cells.`
    );
  }

  if (q.includes('proventriculus') || q.includes('gizzard')) {
    return (
      `**Proventriculus / Gizzard (Foregut):**\n\n` +
      `- **Structure**: Muscular posterior portion of the foregut lined with heavy cuticular teeth.\n` +
      `- **Function**: Mechanically grinds and masticates solid food particles into a fine slurry in chewing insects (e.g. Grasshoppers, Cockroaches).\n` +
      `- **Valve**: Contains the stomodaeal (cardiac) valve that regulates food flow into the midgut and prevents backflow.`
    );
  }

  if (q.includes('question') || q.includes('practice') || q.includes('5-mark') || q.includes('exam')) {
    return (
      `**Top 5 ANGRAU Semester Exam Questions for Ch ${chapterNumber}:**\n\n` +
      `1. **[2 Marks]** Name the three embryonic divisions of the insect alimentary canal and their germ layer origins.\n` +
      `2. **[2 Marks]** What is the function of the gastric caeca?\n` +
      `3. **[5 Marks]** Draw and label the histological cross-section of the insect proventriculus.\n` +
      `4. **[5 Marks]** Distinguish between Type-I and Type-II peritrophic membranes.\n` +
      `5. **[10 Marks]** Describe the complete anatomy, histology, and physiological mechanism of insect digestion with a neat diagram.`
    );
  }

  if (q.includes('intima') || q.includes('midgut') || q.includes('cuticular')) {
    return (
      `**Why the Midgut lacks cuticular intima:**\n\n` +
      `The foregut and hindgut arise from embryonic **ectoderm** and are lined with an impermeable cuticular intima that sheds during molting.\n\n` +
      `The midgut (Mesenteron) arises from embryonic **endoderm**. It must remain free of cuticular intima so its microvillar columnar cells can actively secrete digestive enzymes and absorb digested nutrients into the hemolymph.`
    );
  }

  return (
    `**Saral AI Tutor (${persona.toUpperCase()} Mode):**\n\n` +
    `Regarding "${question}" in Chapter ${chapterNumber} (${chapterName}):\n\n` +
    `In ANGRAU Entomology, physiological and anatomical structures operate in an integrated survival pipeline. Ingestion and mechanical grinding occur in the foregut, true chemical enzymatic breakdown occurs in the mesenteron, and moisture conservation is governed by the rectal pads in the proctodaeum.\n\n` +
    `*Exam Tip: Always provide clear labeled anatomical diagrams with germ layer origins to secure maximum marks!*`
  );
}

/**
 * Main dynamic Ask function
 */
export async function askGemini(
  question: string,
  subjectId: string = 'ento101',
  chapterName: string = 'Insect Digestive System & Anatomy',
  chapterNumber: number = 1,
  persona: PersonaType = 'intermediate',
  languageCode: string = 'en-IN',
): Promise<AskResult> {
  const trimmedQ = question.trim();
  if (!trimmedQ) {
    return { answer: 'Please enter a study question.', model: 'none' };
  }

  // 1. Content censoring
  if (isCensored(trimmedQ)) {
    return {
      answer: `🚫 Your question contains sensitive or off-topic language. Please ask questions related to your ANGRAU B.Sc Agriculture curriculum.`,
      model: 'filter',
    };
  }

  // 2. Load chapter context
  const chapterContext = await getChapterContext(subjectId, chapterNumber, persona);

  // 3. Try Cloud Run Server-Side Proxy First
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const proxyRes = await fetch(`${API_BASE}/api/gemini/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: trimmedQ,
        context: chapterContext,
        level: persona,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data?.answer && !data?.error) {
        return {
          answer: data.answer,
          model: data.model || 'cloud-run-proxy',
        };
      }
    }
  } catch (proxyErr) {
    console.log('[AskService] Cloud proxy unavailable, proceeding to direct Gemini API:', proxyErr);
  }

  // 4. Client-side Gemini API Waterfall
  const systemPrompt =
    `You are Saral Vidhya, an expert AI tutor for ANGRAU (Acharya N.G. Ranga Agricultural University) B.Sc (Hons) Agriculture.\n` +
    `You are tutoring: Chapter ${chapterNumber} - "${chapterName}" in Entomology for a student at the "${persona.toUpperCase()}" level.\n\n` +
    `Instructions:\n` +
    `1. Base your answer strictly on the ANGRAU curriculum context provided below.\n` +
    `2. Directly answer the question with high educational clarity. Keep paragraphs concise.\n` +
    `3. Highlight key biological terms, scientific names in italics, and exam tips where relevant.\n` +
    `4. Use clean standard markdown (bold with **term**, bullet points with clean • or -).\n\n` +
    `CHAPTER CONTEXT:\n${chapterContext || 'ANGRAU Entomology Chapter: ' + chapterName}`;

  for (const model of FALLBACK_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nStudent Question: ${trimmedQ}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const parts = json?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          const textPart = parts.find((p: any) => typeof p?.text === 'string' && p.text.trim().length > 0);
          if (textPart && textPart.text.trim().length > 0) {
            return {
              answer: textPart.text.trim(),
              model: model,
            };
          }
        }
      } else {
        const errText = await res.text();
        console.log(`[AskService] Model ${model} returned ${res.status}:`, errText);
      }
    } catch (modelErr) {
      console.log(`[AskService] Model ${model} attempt skipped:`, modelErr);
    }
  }

  // 5. Offline curriculum fallback if network failed or quota exceeded
  const fallbackAnswer = getCurriculumFallback(trimmedQ, chapterNumber, chapterName, persona);
  return {
    answer: fallbackAnswer,
    model: 'curriculum-knowledge-base',
  };
}
