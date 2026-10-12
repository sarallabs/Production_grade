import React, { useState, useEffect } from 'react';
import { GlobalLearningNav } from './GlobalLearningNav';
import { ReadSidebar } from './ReadSidebar';
import { ReadingCanvas } from './ReadingCanvas';
import { QuickCheckModal } from './QuickCheckModal';
import {
  fetchReadManifest,
  fetchSectionContent,
  submitQuickCheck,
  saveReadBookmark,
  ReadManifest,
  SectionPayload,
  ReadMode,
  Persona,
} from '../../api/client';
import './SectionalReadWorkspace.css';

interface SectionalReadWorkspaceProps {
  university?: string;
  subject?: string;
  chapter?: string;
  onExit?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SectionalReadWorkspace: React.FC<SectionalReadWorkspaceProps> = ({
  university = 'mlrit',
  subject = 'dbms',
  chapter = 'unit_1',
  onExit,
  onNavigateTab,
}) => {
  const [mode, setMode] = useState<ReadMode>('essentials');
  const [persona, setPersona] = useState<Persona>('beginner');
  const [manifest, setManifest] = useState<ReadManifest | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('section_01');
  const [activeSection, setActiveSection] = useState<SectionPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isQuickCheckOpen, setIsQuickCheckOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // ── Load Chapter Manifest ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchReadManifest(university, subject, chapter, mode, persona)
      .then((data) => {
        if (!isMounted) return;
        setManifest(data);
        if (data.resumedSectionId) {
          setActiveSectionId(data.resumedSectionId);
        } else if (data.sections.length > 1) {
          setActiveSectionId(data.sections[1].sectionId);
        }
      })
      .catch((err) => {
        console.warn('[Workspace] Manifest API fallback to local defaults:', err);
        // Resilient fallback for demonstration
        if (isMounted) {
          setManifest({
            chapter: 'DBMS UNIT - I',
            subject: 'Database Management Systems',
            mode,
            persona,
            totalSections: 6,
            chapterProgressPercent: 20,
            resumedSectionId: 'section_01',
            resumedTimestamp: '2h ago',
            sections: [
              { sectionId: 'section_00', moduleId: 'M0', order: 0, title: 'Overview', subtitle: 'Course overview', estimatedMinutes: 2, status: 'completed', hasQuickCheck: false, isLocked: false, subtopics: [] },
              { sectionId: 'section_01', moduleId: 'M1', order: 1, title: 'Architectural Blueprint', subtitle: 'One tube, three chambers — each with its own job', estimatedMinutes: 4, status: 'active', hasQuickCheck: true, isLocked: false, subtopics: [{ anchorId: '1-1', title: '1.1 Three-Schema Model' }, { anchorId: '1-2', title: '1.2 Storage Manager' }] },
              { sectionId: 'section_02', moduleId: 'M2', order: 2, title: 'Chamber by Chamber', subtitle: 'Foregut, midgut, hindgut mechanics', estimatedMinutes: 5, status: 'locked', hasQuickCheck: true, isLocked: true, subtopics: [] },
              { sectionId: 'section_03', moduleId: 'M3', order: 3, title: 'Filter Chamber & Water', subtitle: 'Osmotic regulation', estimatedMinutes: 3, status: 'locked', hasQuickCheck: true, isLocked: true, subtopics: [] },
              { sectionId: 'section_04', moduleId: 'M4', order: 4, title: 'Symbiotic Digestion', subtitle: 'Microbial fermentation', estimatedMinutes: 4, status: 'locked', hasQuickCheck: true, isLocked: true, subtopics: [] },
              { sectionId: 'section_05', moduleId: 'M5', order: 5, title: 'Chapter Summary', subtitle: 'High yield checklist', estimatedMinutes: 3, status: 'locked', hasQuickCheck: false, isLocked: true, subtopics: [] },
            ],
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [university, subject, chapter, mode, persona]);

  // ── Load Active Section Content ────────────────────────────────────────────
  useEffect(() => {
    if (!activeSectionId) return;
    let isMounted = true;

    fetchSectionContent(university, subject, chapter, activeSectionId, mode, persona)
      .then((data) => {
        if (!isMounted) return;
        setActiveSection(data);
        saveReadBookmark(university, subject, chapter, activeSectionId).catch(() => {});
      })
      .catch((err) => {
        console.warn('[Workspace] Section API fallback:', err);
        if (isMounted) {
          setActiveSection({
            sectionId: activeSectionId,
            moduleId: 'M1',
            title: 'Architectural Blueprint & Regional Partitioning',
            subtitle: 'One tube, three chambers — each with its own job.',
            mode,
            persona,
            estimatedMinutes: 4,
            contentMarkdown: `The insect alimentary canal is a specialised muscular tube extending from the mouth to the anus. It is divided into three distinct anatomical chambers: the Foregut (Stomodaeum), the Midgut (Mesenteron), and the Hindgut (Proctodaeum). This division reflects fundamental embryonic origins that govern how food is processed and eliminated.`,
            dottedTerms: [
              { term: 'Foregut (Stomodaeum)', definition: 'Anterior portion of digestive tract of ectodermal origin lined with cuticular intima.', examTip: 'Frequently tested definition.' },
              { term: 'Midgut (Mesenteron)', definition: 'Middle portion of endodermal origin without cuticle, responsible for enzyme secretion and absorption.' },
              { term: 'Hindgut (Proctodaeum)', definition: 'Posterior portion of ectodermal origin lined with thin permeable cuticle, absorbs water and electrolytes.' },
            ],
            figures: [
              {
                figureNo: 'Fig 1.1',
                title: 'The tripartite alimentary canal',
                imageUrl: '/api/content/figures/1.0.webp',
                zoomable: true,
                caption: 'The tripartite alimentary canal. Colours mark the three embryonic regions; numbers mark exam-favourite details. Diagram simplified for clarity — the full version appears in In-depth mode.',
                hotspots: [
                  { id: 1, label: 'Foregut', description: 'Stomodaeum · ingest' },
                  { id: 2, label: 'Midgut', description: 'Mesenteron · digest + absorb' },
                  { id: 3, label: 'Hindgut', description: 'Proctodaeum · reclaim + eliminate' },
                ],
              },
            ],
            quickCheck: {
              questionId: 'QC_01',
              moduleId: 'M1',
              type: 'mcq_3_option',
              promptType: 'Question',
              stem: 'Most digestion and nutrient absorption happens in which chamber?',
              options: [
                { key: 'A', text: 'Foregut — it receives and stores food' },
                { key: 'B', text: 'Midgut — its cells secrete enzymes and absorb nutrients' },
                { key: 'C', text: 'Hindgut — it recovers water and salts' },
              ],
            },
          });
        }
      });

    return () => { isMounted = false; };
  }, [university, subject, chapter, activeSectionId, mode, persona]);

  // ── Audio Handler ──────────────────────────────────────────────────────────
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      audioElement?.pause();
      setIsPlayingAudio(false);
    } else {
      const audioUrl = activeSection?.audio?.streamUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      const audio = new Audio(audioUrl);
      audio.play().catch(console.warn);
      audio.onended = () => setIsPlayingAudio(false);
      setAudioElement(audio);
      setIsPlayingAudio(true);
    }
  };

  // ── Section Navigation ─────────────────────────────────────────────────────
  const handleSelectSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubtopic = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // ── Quick Check Evaluation ─────────────────────────────────────────────────
  const handleSubmitQuickCheck = async (selectedKey: string) => {
    try {
      const result = await submitQuickCheck(
        university,
        subject,
        chapter,
        activeSectionId,
        selectedKey,
        activeSection?.moduleId || 'M1',
        mode,
        persona
      );

      // If correct, update manifest to unlock next section
      if (result.isCorrect && manifest) {
        setManifest((prev) => {
          if (!prev) return prev;
          const nextIndex = prev.sections.findIndex((s) => s.sectionId === activeSectionId) + 1;
          const updated = prev.sections.map((s, idx) => {
            if (s.sectionId === activeSectionId) {
              return { ...s, status: 'completed' as const };
            }
            if (idx === nextIndex) {
              return { ...s, status: 'active' as const, isLocked: false };
            }
            return s;
          });
          return {
            ...prev,
            chapterProgressPercent: result.chapterProgressPercent || prev.chapterProgressPercent + 15,
            sections: updated,
          };
        });
      }

      return result;
    } catch {
      // Local fallback simulation if server is offline
      const isCorrect = selectedKey === 'B';
      return {
        isCorrect,
        correctKey: 'B',
        rationale: 'Midgut cells secrete digestive enzymes and absorb broken-down nutrients.',
        keyTakeaway: 'The midgut is the primary organ of chemical digestion and nutrient absorption.',
        unlockedNextSectionId: 'section_02',
        nextSectionTitle: 'Chamber by Chamber',
        chapterProgressPercent: 40,
      };
    }
  };

  const handleAdvanceToNextSection = () => {
    if (!manifest) return;
    const currentIndex = manifest.sections.findIndex((s) => s.sectionId === activeSectionId);
    if (currentIndex >= 0 && currentIndex + 1 < manifest.sections.length) {
      const nextSection = manifest.sections[currentIndex + 1];
      setActiveSectionId(nextSection.sectionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Compute next section metadata for modal
  const currentIndex = manifest?.sections.findIndex((s) => s.sectionId === activeSectionId) ?? 0;
  const nextSection = manifest && currentIndex + 1 < manifest.sections.length
    ? manifest.sections[currentIndex + 1]
    : undefined;

  return (
    <div className="sectional-read-workspace">
      {/* ── Global 4-Cluster Learning Header ───────────────────────────────── */}
      <GlobalLearningNav
        activePillar="read"
        onNavigate={onNavigateTab}
        onExit={onExit}
      />

      {/* ── Main Workspace Body ────────────────────────────────────────────── */}
      <div className="workspace-main-container">
        {/* Left Progressive Outline Sidebar */}
        <ReadSidebar
          sections={manifest?.sections || []}
          activeSectionId={activeSectionId}
          resumedText={manifest?.resumedTimestamp ? `Resumed where you left off · ${manifest.resumedTimestamp}` : undefined}
          chapterProgressPercent={manifest?.chapterProgressPercent || 20}
          onSelectSection={handleSelectSection}
          onSelectSubtopic={handleSelectSubtopic}
        />

        {/* Center/Right Section Reading Canvas */}
        {isLoading && !activeSection ? (
          <div className="workspace-loading-state">
            <div className="loading-spinner-ring" />
            <p>Loading section content...</p>
          </div>
        ) : activeSection ? (
          <ReadingCanvas
            section={activeSection}
            sectionNumber={currentIndex + 1}
            totalSections={manifest?.totalSections || 5}
            activeMode={mode}
            activePersona={persona}
            onChangeMode={setMode}
            onChangePersona={setPersona}
            onOpenQuickCheck={() => setIsQuickCheckOpen(true)}
            onPlayAudio={handleToggleAudio}
            isPlayingAudio={isPlayingAudio}
          />
        ) : null}
      </div>

      {/* ── Frosted Glass Quick Check Modal ────────────────────────────────── */}
      <QuickCheckModal
        isOpen={isQuickCheckOpen}
        question={activeSection?.quickCheck}
        nextSectionTitle={nextSection?.title || 'Next Section'}
        nextSectionNumber={currentIndex + 2}
        totalSections={manifest?.totalSections || 5}
        subjectName={subject.toUpperCase()}
        onClose={() => setIsQuickCheckOpen(false)}
        onSubmitAnswer={handleSubmitQuickCheck}
        onAdvanceToNextSection={handleAdvanceToNextSection}
      />
    </div>
  );
};

export default SectionalReadWorkspace;
