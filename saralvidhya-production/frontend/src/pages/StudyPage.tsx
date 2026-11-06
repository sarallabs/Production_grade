/**
 * StudyPage — Production SaralVidhya study interface.
 *
 * URL params (read from react-router search params):
 *   ?university=angrau
 *   ?subject=entomology
 *   ?chapter=chapter_01
 *   ?persona=beginner          (beginner | intermediate | advanced)
 *   ?difficulty=easy           (easy | medium | hard)
 *   ?section=read              (read | learn | practice | prepare | podcasts)
 *   ?readTab=quick             (quick | detailed | key_takeaways | glossary)
 *
 * Data flow:
 *   URL params → ContentContext → useContent hooks → section view components
 *
 * Auth: skipped until Firebase is wired. All content is public-readable for now.
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useChapterMetadata,
  useReadContent,
  useLearnContent,
  usePracticeContent,
  usePrepareContent,
  usePodcastUrls,
  toPersona,
  toDifficulty,
  type ContentContext,
  type Persona,
  type Difficulty,
} from '../hooks/useContent';

// ── Types ─────────────────────────────────────────────────────────────────────

type Section = 'read' | 'learn' | 'practice' | 'prepare' | 'podcasts';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'read',     label: 'Read',     icon: '📖' },
  { id: 'learn',    label: 'Learn',    icon: '🧠' },
  { id: 'practice', label: 'Practice', icon: '✏️' },
  { id: 'prepare',  label: 'Prepare',  icon: '🎓' },
  { id: 'podcasts', label: 'Listen',   icon: '🎧' },
];

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'https://saralvidhya-api-193782571555.asia-south1.run.app';

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            height: i === 1 ? '32px' : '16px',
            marginBottom: i === 1 ? '24px' : '12px',
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            width: i === 3 ? '60%' : '100%',
          }}
        />
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

// ── Markdown renderer (simple inline version) ─────────────────────────────────

function MarkdownContent({ text }: { text: string }) {
  // In production, swap this for react-markdown or the full MarkdownView from MVP.
  return (
    <div
      style={{ lineHeight: 1.8, color: '#334155', fontSize: '16px', maxWidth: '720px' }}
      dangerouslySetInnerHTML={{ __html: simpleMarkdown(text) }}
    />
  );
}

function simpleMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="margin:24px 0 8px;color:#0f172a">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="margin:28px 0 12px;color:#0f172a">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="margin:0 0 16px;color:#0f172a">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0">$1</li>')
    .replace(/(<li[\s\S]*?<\/li>)/g, '<ul style="padding-left:20px;margin:8px 0">$1</ul>')
    .replace(/\n\n/g, '</p><p style="margin:12px 0">')
    .replace(/^(.+)$/gm, (line) =>
      line.startsWith('<') ? line : `<p style="margin:8px 0">${line}</p>`,
    );
}

// ── READ section ──────────────────────────────────────────────────────────────

type ReadTab = 'quick' | 'detailed' | 'key_takeaways' | 'glossary';
const READ_TABS: { id: ReadTab; label: string }[] = [
  { id: 'quick',        label: 'Quick Study' },
  { id: 'detailed',     label: 'In-Depth' },
  { id: 'key_takeaways', label: 'Key Takeaways' },
  { id: 'glossary',     label: 'Glossary' },
];

function ReadSection({ ctx }: { ctx: ContentContext }) {
  const [activeTab, setActiveTab] = useState<ReadTab>('quick');
  const { data, loading } = useReadContent(ctx, true);

  const content = data
    ? ({ quick: data.quick, detailed: data.detailed, key_takeaways: data.keyTakeaways, glossary: data.glossary })[activeTab]
    : null;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
        {READ_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? '700' : '500',
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : content ? (
        <MarkdownContent text={content} />
      ) : (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          Content not available yet for this chapter.
        </p>
      )}
    </div>
  );
}

// ── LEARN section ─────────────────────────────────────────────────────────────

type LearnTab = 'mindmap' | 'study_plan';

function LearnSection({ ctx }: { ctx: ContentContext }) {
  const [activeTab, setActiveTab] = useState<LearnTab>('mindmap');
  const { data, loading } = useLearnContent(ctx, true, API_BASE);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['mindmap', 'study_plan'] as LearnTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: `2px solid ${activeTab === tab ? '#6366f1' : '#e2e8f0'}`,
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {tab === 'mindmap' ? '🗺️ Mindmap' : '📅 Study Plan'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : activeTab === 'mindmap' ? (
        data?.mindmapJson ? (
          <div>
            {/* In production: wire up JsMindView or MermaidView from the MVP */}
            <img
              src={data.mindmapPngUrl}
              alt="Chapter Mindmap"
              style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', color: '#6366f1', fontWeight: '600' }}>
                View raw mindmap data
              </summary>
              <pre style={{ fontSize: '12px', overflowX: 'auto', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                {data.mindmapJson.slice(0, 2000)}
              </pre>
            </details>
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Mindmap not available.</p>
        )
      ) : data?.studyPlan ? (
        <MarkdownContent text={data.studyPlan} />
      ) : (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Study plan not available.</p>
      )}
    </div>
  );
}

// ── PRACTICE section ──────────────────────────────────────────────────────────

type PracticeTab = 'flashcards' | 'mcq' | 'msq' | 'question_bank' | 'mock_test';

function PracticeSection({ ctx }: { ctx: ContentContext }) {
  const [activeTab, setActiveTab] = useState<PracticeTab>('flashcards');
  const { data, loading } = usePracticeContent(ctx, true);
  const [cardIdx, setCardIdx] = useState(0);

  const tabs = [
    { id: 'flashcards' as PracticeTab, label: '🃏 Flashcards' },
    { id: 'mcq' as PracticeTab, label: '✅ MCQ' },
    { id: 'msq' as PracticeTab, label: '☑️ MSQ' },
    { id: 'question_bank' as PracticeTab, label: '📚 Q-Bank' },
    { id: 'mock_test' as PracticeTab, label: '📝 Mock Test' },
  ];

  return (
    <div>
      {/* Tab strip */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCardIdx(0); }}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `2px solid ${activeTab === tab.id ? '#10b981' : '#e2e8f0'}`,
              background: activeTab === tab.id ? '#10b981' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : activeTab === 'flashcards' ? (
        <FlashcardPlayer cards={data?.flashcards ?? []} persona={ctx.persona} />
      ) : (
        <pre style={{ fontSize: '13px', overflowX: 'auto', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
          {JSON.stringify(
            activeTab === 'mcq' ? data?.mcq
            : activeTab === 'msq' ? data?.msq
            : activeTab === 'question_bank' ? data?.questionBank
            : data?.mockTest,
            null, 2
          ) ?? 'Not available'}
        </pre>
      )}
    </div>
  );
}

// ── Flashcard player (inline, lightweight version) ────────────────────────────

interface Card { front?: string; back?: string; question?: string; answer?: string }

function FlashcardPlayer({ cards, persona }: { cards: unknown[]; persona: Persona }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setIdx(0); setFlipped(false); }, [cards]);
  useEffect(() => { setFlipped(false); }, [idx]);

  if (!cards || cards.length === 0) {
    return <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No flashcards available.</p>;
  }

  const card = cards[idx] as Card;
  const front = card?.front ?? card?.question ?? '';
  const back  = card?.back  ?? card?.answer  ?? '';
  const personaColor = persona === 'beginner' ? '#3b82f6' : persona === 'advanced' ? '#8b5cf6' : '#0ea5e9';

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
        <span>{idx + 1} / {cards.length}</span>
        <span style={{ textTransform: 'capitalize', color: personaColor, fontWeight: '600' }}>{persona}</span>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped((f) => !f)}
        style={{
          minHeight: '280px',
          borderRadius: '20px',
          border: `2px solid ${personaColor}40`,
          background: `${personaColor}10`,
          padding: '32px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: `0 8px 32px ${personaColor}20`,
          transition: 'all 0.3s ease',
          userSelect: 'none',
        }}
      >
        {!flipped ? (
          <>
            <div style={{ fontSize: '12px', fontWeight: '700', color: personaColor, letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              Question — click to reveal answer
            </div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', lineHeight: 1.5 }}>{front}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>
              Answer
            </div>
            <div style={{ fontSize: '16px', color: '#334155', lineHeight: 1.7 }}>{back}</div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            padding: '10px 24px', borderRadius: '12px', border: 'none',
            background: idx === 0 ? '#e2e8f0' : personaColor, color: idx === 0 ? '#94a3b8' : '#fff',
            fontWeight: '700', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '15px',
          }}
        >← Prev</button>
        <button
          onClick={() => setFlipped((f) => !f)}
          style={{
            padding: '10px 24px', borderRadius: '12px', border: `2px solid ${personaColor}`,
            background: 'transparent', color: personaColor, fontWeight: '700', cursor: 'pointer', fontSize: '15px',
          }}
        >Flip</button>
        <button
          onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
          disabled={idx === cards.length - 1}
          style={{
            padding: '10px 24px', borderRadius: '12px', border: 'none',
            background: idx === cards.length - 1 ? '#e2e8f0' : personaColor,
            color: idx === cards.length - 1 ? '#94a3b8' : '#fff',
            fontWeight: '700', cursor: idx === cards.length - 1 ? 'default' : 'pointer', fontSize: '15px',
          }}
        >Next →</button>
      </div>
    </div>
  );
}

// ── PREPARE section ───────────────────────────────────────────────────────────

function PrepareSection({ ctx }: { ctx: ContentContext }) {
  const [activeTab, setActiveTab] = useState<'pre_final' | 'certification' | 'mock'>('pre_final');
  const { data, loading } = usePrepareContent(ctx, true);

  const content = activeTab === 'pre_final' ? data?.preFinalExam
    : activeTab === 'certification' ? data?.certificationExam
    : data?.mockTest;

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {([
          { id: 'pre_final', label: '📋 Pre-Final Exam' },
          { id: 'certification', label: '🏆 Certification' },
          { id: 'mock', label: '📝 Mock Test' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', borderRadius: '20px',
              border: `2px solid ${activeTab === tab.id ? '#f59e0b' : '#e2e8f0'}`,
              background: activeTab === tab.id ? '#f59e0b' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              fontWeight: '600', cursor: 'pointer', fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : content ? (
        <pre style={{ fontSize: '13px', overflowX: 'auto', background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          {JSON.stringify(content, null, 2)}
        </pre>
      ) : (
        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Content not yet available.</p>
      )}
    </div>
  );
}

// ── PODCASTS section ──────────────────────────────────────────────────────────

function PodcastsSection({ ctx, meta }: { ctx: ContentContext; meta: ReturnType<typeof useChapterMetadata>['data'] }) {
  const urls = usePodcastUrls(ctx, meta, API_BASE);
  const [activeTrack, setActiveTrack] = useState<'short' | 'long' | number>('short');
  const [transcript, setTranscript] = useState<string | null>(null);

  const audioUrl = typeof activeTrack === 'number'
    ? urls.microcasts[activeTrack]?.audioUrl
    : activeTrack === 'short' ? urls.shortPodcast : urls.longPodcast;

  const transcriptFile = typeof activeTrack === 'number'
    ? urls.microcasts[activeTrack]?.transcriptUrl.split('/').pop() ?? ''
    : activeTrack === 'short' ? 'short_podcast.md' : 'long_podcast.md';

  useEffect(() => {
    if (!transcriptFile) return;
    setTranscript(null);
    import('../api/client').then(({ fetchPodcastTranscript }) => {
      fetchPodcastTranscript(ctx.university, ctx.subject, ctx.chapter, transcriptFile)
        .then(setTranscript)
        .catch(() => setTranscript(null));
    });
  }, [ctx.university, ctx.subject, ctx.chapter, transcriptFile]);

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Track selection */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTrack('short')}
          style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${activeTrack === 'short' ? '#ec4899' : '#e2e8f0'}`, background: activeTrack === 'short' ? '#ec4899' : 'transparent', color: activeTrack === 'short' ? '#fff' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
        >
          ⚡ Short Podcast
        </button>
        <button
          onClick={() => setActiveTrack('long')}
          style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${activeTrack === 'long' ? '#ec4899' : '#e2e8f0'}`, background: activeTrack === 'long' ? '#ec4899' : 'transparent', color: activeTrack === 'long' ? '#fff' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
        >
          🎙️ Long Podcast
        </button>
        {urls.microcasts.map((mc, i) => (
          <button
            key={i}
            onClick={() => setActiveTrack(i)}
            style={{ padding: '8px 16px', borderRadius: '20px', border: `2px solid ${activeTrack === i ? '#8b5cf6' : '#e2e8f0'}`, background: activeTrack === i ? '#8b5cf6' : 'transparent', color: activeTrack === i ? '#fff' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
          >
            🎵 {mc.title}
          </button>
        ))}
      </div>

      {/* Audio player */}
      {audioUrl ? (
        <div style={{ background: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)', borderRadius: '20px', padding: '24px', marginBottom: '24px', border: '1px solid #e9d5ff' }}>
          <audio
            key={audioUrl}
            controls
            style={{ width: '100%', borderRadius: '8px' }}
            preload="metadata"
          >
            <source src={audioUrl} />
            Your browser does not support audio.
          </audio>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            {audioUrl.split('/').pop()}
          </p>
        </div>
      ) : (
        <p style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: '24px' }}>
          No audio available for this chapter.
        </p>
      )}

      {/* Transcript */}
      {transcript && (
        <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#374151' }}>
            📄 Transcript
          </h3>
          <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151', maxHeight: '400px', overflowY: 'auto' }}>
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main StudyPage ─────────────────────────────────────────────────────────────

export default function StudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const university  = searchParams.get('university')  ?? 'angrau';
  const subject     = searchParams.get('subject')     ?? 'entomology';
  const chapter     = searchParams.get('chapter')     ?? 'chapter_01';
  const personaRaw  = searchParams.get('persona')     ?? 'intermediate';
  const diffRaw     = searchParams.get('difficulty')  ?? 'medium';
  const sectionRaw  = (searchParams.get('section')   ?? 'read') as Section;

  const persona    = toPersona(personaRaw);
  const difficulty = toDifficulty(diffRaw);
  const section    = SECTIONS.find((s) => s.id === sectionRaw) ? sectionRaw : 'read';

  const ctx: ContentContext = { university, subject, chapter, persona, difficulty };

  const metaState = useChapterMetadata(ctx);

  const setSection = (s: Section) => {
    setSearchParams((prev) => { prev.set('section', s); return prev; }, { replace: true });
  };

  const setPersona = (p: Persona) => {
    setSearchParams((prev) => { prev.set('persona', p); return prev; }, { replace: true });
  };

  const setDifficulty = (d: Difficulty) => {
    setSearchParams((prev) => { prev.set('difficulty', d); return prev; }, { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Top bar */}
      <header style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 24px', height: '60px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: '#0f172a' }}>
            🌿 SaralVidhya
          </div>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>
            {university} / {subject} / {chapter}
          </div>
        </div>

        {/* Persona + Difficulty controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: '#f8fafc' }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: '#f8fafc' }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </header>

      {/* Chapter title */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)', color: '#fff', padding: '24px 32px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>
          {metaState.data?.title ?? chapter.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </h1>
        <p style={{ margin: '4px 0 0', opacity: 0.75, fontSize: '14px' }}>
          {subject} · {university.toUpperCase()}
        </p>
      </div>

      {/* Section tabs */}
      <nav style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', display: 'flex', gap: '0', overflowX: 'auto',
      }}>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              padding: '14px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontWeight: section === s.id ? '700' : '500',
              color: section === s.id ? '#3b82f6' : '#64748b',
              borderBottom: section === s.id ? '3px solid #3b82f6' : '3px solid transparent',
              fontSize: '14px', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </nav>

      {/* Section content */}
      <main style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
        {section === 'read'     && <ReadSection ctx={ctx} />}
        {section === 'learn'    && <LearnSection ctx={ctx} />}
        {section === 'practice' && <PracticeSection ctx={ctx} />}
        {section === 'prepare'  && <PrepareSection ctx={ctx} />}
        {section === 'podcasts' && <PodcastsSection ctx={ctx} meta={metaState.data} />}
      </main>
    </div>
  );
}
