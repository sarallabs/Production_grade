/**
 * useContent — unified data-fetching hook for the SaralVidhya study page.
 *
 * Wraps every API client function and returns reactive state objects per section.
 * Components import this hook and destructure what they need — no direct fetch()
 * calls ever appear in component code.
 */
import { useState, useEffect, useRef } from 'react';
import {
  fetchReadContent,
  fetchReadShared,
  fetchLearnContent,
  fetchFlashcards,
  fetchQuestions,
  fetchPracticeShared,
  fetchPrepareContent,
  fetchPodcastTranscript,
  fetchChapterMetadata,
  getPodcastUrl,
  getMicrocastUrls,
  toPersona,
  toDifficulty,
  type Persona,
  type Difficulty,
  type ReadType,
} from '../api/client';

// ── Context params passed from the page ─────────────────────────────────────

export interface ContentContext {
  university: string;   // e.g. 'angrau'
  subject: string;      // e.g. 'entomology'
  chapter: string;      // e.g. 'chapter_01'
  persona: Persona;
  difficulty: Difficulty;
}

// ── Shared fetch state shape ─────────────────────────────────────────────────

export interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initState<T>(): FetchState<T> {
  return { data: null, loading: false, error: null };
}

// ── Chapter metadata ─────────────────────────────────────────────────────────

export interface ChapterMeta {
  title?: string;
  microcastCount?: number;
  hasMindmap?: boolean;
  hasPodcasts?: boolean;
  [key: string]: unknown;
}

export function useChapterMetadata(ctx: ContentContext): FetchState<ChapterMeta> {
  const [state, setState] = useState<FetchState<ChapterMeta>>(initState());
  const key = `${ctx.university}/${ctx.subject}/${ctx.chapter}`;

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    fetchChapterMetadata(ctx.university, ctx.subject, ctx.chapter)
      .then((data) => {
        if (!cancelled) setState({ data: data as ChapterMeta, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: e.message });
      });
    return () => { cancelled = true; };
  }, [key]);

  return state;
}

// ── READ section ─────────────────────────────────────────────────────────────

export interface ReadContent {
  quick: string | null;
  detailed: string | null;
  keyTakeaways: string | null;
  glossary: string | null;
}

export function useReadContent(ctx: ContentContext, active: boolean): FetchState<ReadContent> {
  const [state, setState] = useState<FetchState<ReadContent>>(initState());
  const key = `${ctx.university}/${ctx.subject}/${ctx.chapter}/${ctx.persona}`;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    Promise.allSettled([
      fetchReadContent(ctx.university, ctx.subject, ctx.chapter, 'quick', ctx.persona),
      fetchReadContent(ctx.university, ctx.subject, ctx.chapter, 'detailed', ctx.persona),
      fetchReadShared(ctx.university, ctx.subject, ctx.chapter, 'key_takeaways'),
      fetchReadShared(ctx.university, ctx.subject, ctx.chapter, 'glossary'),
    ]).then(([quick, detailed, kt, glossary]) => {
      if (cancelled) return;
      setState({
        data: {
          quick:       quick.status === 'fulfilled' ? quick.value : null,
          detailed:    detailed.status === 'fulfilled' ? detailed.value : null,
          keyTakeaways: kt.status === 'fulfilled' ? kt.value : null,
          glossary:    glossary.status === 'fulfilled' ? glossary.value : null,
        },
        loading: false,
        error: null,
      });
    });

    return () => { cancelled = true; };
  }, [key, active]);

  return state;
}

// ── LEARN section ─────────────────────────────────────────────────────────────

export interface LearnContent {
  mindmapJson: string | null;
  studyPlan: string | null;
  mindmapPngUrl: string;
}

export function useLearnContent(
  ctx: ContentContext,
  active: boolean,
  apiBase: string,
): FetchState<LearnContent> {
  const [state, setState] = useState<FetchState<LearnContent>>(initState());
  const key = `${ctx.university}/${ctx.subject}/${ctx.chapter}`;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    const pngUrl = `${apiBase}/api/content/${ctx.university}/${ctx.subject}/${ctx.chapter}/learn/mindmap.png`;

    Promise.allSettled([
      fetchLearnContent(ctx.university, ctx.subject, ctx.chapter, 'mindmap'),
      fetchLearnContent(ctx.university, ctx.subject, ctx.chapter, 'study_plan'),
    ]).then(([mindmap, plan]) => {
      if (cancelled) return;
      setState({
        data: {
          mindmapJson: mindmap.status === 'fulfilled' ? mindmap.value : null,
          studyPlan:   plan.status === 'fulfilled' ? plan.value : null,
          mindmapPngUrl: pngUrl,
        },
        loading: false,
        error: null,
      });
    });

    return () => { cancelled = true; };
  }, [key, active, apiBase]);

  return state;
}

// ── PRACTICE section ──────────────────────────────────────────────────────────

export interface PracticeContent {
  flashcards: unknown[];
  mcq: unknown | null;
  msq: unknown | null;
  questionBank: unknown | null;
  mockTest: unknown | null;
}

export function usePracticeContent(ctx: ContentContext, active: boolean): FetchState<PracticeContent> {
  const [state, setState] = useState<FetchState<PracticeContent>>(initState());
  const key = `${ctx.university}/${ctx.subject}/${ctx.chapter}/${ctx.persona}/${ctx.difficulty}`;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    Promise.allSettled([
      fetchFlashcards(ctx.university, ctx.subject, ctx.chapter, ctx.persona),
      fetchQuestions(ctx.university, ctx.subject, ctx.chapter, 'mcq', ctx.difficulty),
      fetchQuestions(ctx.university, ctx.subject, ctx.chapter, 'msq', ctx.difficulty),
      fetchPracticeShared(ctx.university, ctx.subject, ctx.chapter, 'question_bank'),
      fetchPracticeShared(ctx.university, ctx.subject, ctx.chapter, 'mock_test'),
    ]).then(([fc, mcq, msq, qb, mt]) => {
      if (cancelled) return;
      setState({
        data: {
          flashcards:  fc.status === 'fulfilled' ? fc.value : [],
          mcq:         mcq.status === 'fulfilled' ? mcq.value : null,
          msq:         msq.status === 'fulfilled' ? msq.value : null,
          questionBank: qb.status === 'fulfilled' ? qb.value : null,
          mockTest:    mt.status === 'fulfilled' ? mt.value : null,
        },
        loading: false,
        error: null,
      });
    });

    return () => { cancelled = true; };
  }, [key, active]);

  return state;
}

// ── PREPARE section ───────────────────────────────────────────────────────────

export interface PrepareContent {
  preFinalExam: unknown | null;
  certificationExam: unknown | null;
  mockTest: unknown | null;
}

export function usePrepareContent(ctx: ContentContext, active: boolean): FetchState<PrepareContent> {
  const [state, setState] = useState<FetchState<PrepareContent>>(initState());
  const key = `${ctx.university}/${ctx.subject}/${ctx.chapter}`;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    Promise.allSettled([
      fetchPrepareContent(ctx.university, ctx.subject, ctx.chapter, 'pre_final_exam'),
      fetchPrepareContent(ctx.university, ctx.subject, ctx.chapter, 'certification_exam'),
      fetchPrepareContent(ctx.university, ctx.subject, ctx.chapter, 'mock_test'),
    ]).then(([pre, cert, mock]) => {
      if (cancelled) return;
      setState({
        data: {
          preFinalExam:     pre.status === 'fulfilled' ? pre.value : null,
          certificationExam: cert.status === 'fulfilled' ? cert.value : null,
          mockTest:         mock.status === 'fulfilled' ? mock.value : null,
        },
        loading: false,
        error: null,
      });
    });

    return () => { cancelled = true; };
  }, [key, active]);

  return state;
}

// ── PODCASTS section ──────────────────────────────────────────────────────────

export interface MicrocastEntry {
  index: number;
  title: string;
  audioUrl: string;
  transcriptUrl: string;    // API path — fetch on demand
  transcript: string | null; // loaded lazily
}

export interface PodcastUrls {
  shortPodcast: string;
  longPodcast: string;
  microcasts: MicrocastEntry[];
}

/**
 * Builds podcast URLs from the canonical schema.
 * Metadata provides the microcast count and titles.
 * Transcripts are loaded lazily via `loadTranscript`.
 */
export function usePodcastUrls(
  ctx: ContentContext,
  meta: ChapterMeta | null,
  apiBase: string,
): PodcastUrls {
  const count = meta?.microcastCount ?? 0;
  const microcastMeta = getMicrocastUrls(ctx.university, ctx.subject, ctx.chapter, count);

  const microcasts: MicrocastEntry[] = microcastMeta.map((m, i) => ({
    index: m.index,
    title: (meta as any)?.[`microcast_${String(m.index).padStart(2, '0')}_title`]
      ?? `Episode ${m.index}`,
    audioUrl:      m.audio,
    transcriptUrl: m.transcript,
    transcript: null,
  }));

  return {
    shortPodcast: getPodcastUrl(ctx.university, ctx.subject, ctx.chapter, 'short_podcast.m4a'),
    longPodcast:  getPodcastUrl(ctx.university, ctx.subject, ctx.chapter, 'long_podcast.m4a'),
    microcasts,
  };
}

/**
 * Lazily loads a single podcast transcript by its API URL.
 * Call `load()` when the user selects that episode.
 */
export function usePodcastTranscript(
  university: string,
  subject: string,
  chapter: string,
  filename: string,
  autoLoad = false,
) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loaded = useRef(false);

  const load = () => {
    if (loaded.current || loading) return;
    loaded.current = true;
    setLoading(true);
    fetchPodcastTranscript(university, subject, chapter, filename)
      .then((text) => { setTranscript(text); setLoading(false); })
      .catch(() => { setTranscript(null); setLoading(false); });
  };

  useEffect(() => {
    if (autoLoad) load();
  }, [university, subject, chapter, filename]);

  return { transcript, loading, load };
}

// ── Convenience re-exports ────────────────────────────────────────────────────

export { toPersona, toDifficulty };
export type { Persona, Difficulty, ReadType };
