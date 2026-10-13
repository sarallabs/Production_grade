import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import DottedTerm from "./DottedTerm";
import { getTermDefinition } from "@/data/glossaryTerms";
import {
  googleTtsSpeak,
  googleTtsStop,
  googleTtsPause,
  googleTtsResume,
} from "@/services/googleTtsService";
import {
  getManifest,
  getChapters,
  getResourceContent,
  getSubjectBaseUrl,
  DifficultyLevel,
  GCS_BACKEND_SUBJECTS,
  type Chapter,
} from "@/data/contentRepository";
import {
  useAudioProgress,
  saveProgress,
  type AudioProgress,
} from "@/hooks/useAudioProgress";
import {
  getSectionizedReadData,
  type SectionizedChapterData,
  type ReadSection,
  type ReadFigure,
} from "@/data/sectionizedReadService";

// 120 pencil-skinny bars forming a natural audio waveform curve
const PENCIL_WAVEFORM_BARS: number[] = Array.from({ length: 120 }, (_, i) => {
  const t = i / 120;
  // Natural voice cadence: slight rise at start, high variance in middle, gentle taper
  const envelope = Math.sin(t * Math.PI) * 0.72 + 0.28;
  const f1 = Math.sin(i * 0.28) * 0.35;
  const f2 = Math.cos(i * 0.72 + 0.4) * 0.25;
  const f3 = Math.sin(i * 1.45 + 1.2) * 0.2;
  const f4 = Math.cos(i * 2.8) * 0.12;
  const jitter = Math.sin(i * 4.9) * 0.08;
  const raw = Math.abs(f1 + f2 + f3 + f4 + jitter) + 0.15;
  const scaled = Math.min(100, Math.max(14, raw * envelope * 105));
  return Math.round(scaled);
});

/**
 * Cleans transcript preamble, course metadata tables, and headers.
 */
export function cleanTranscriptPreamble(text: string): string {
  if (!text) return "";
  let t = text.replace(/\r\n/g, "\n");

  // If text is valid JSON string, parse full_text
  if (t.trim().startsWith("{")) {
    try {
      const p = JSON.parse(t);
      if (p.full_text) return cleanTranscriptPreamble(p.full_text);
    } catch {}
  }

  // 1. If structured transcript with "Transcript Flow", skip all preamble (Course, Unit, Table)
  const flowMatch = t.match(/##\s*\d*\.?\s*[^#\n]*Transcript Flow[^\n]*\n([\s\S]*)/i);
  if (flowMatch) {
    t = flowMatch[1];
    // Strip optional italic preamble note
    t = t.replace(/^\*[^*]+\*\s*\n*/m, "");
  } else {
    // Fallback for "## Timestamped..."
    const tsIdx = t.indexOf("## Timestamped");
    if (tsIdx >= 0) {
      t = t.substring(tsIdx);
      const nl = t.indexOf("\n");
      t = nl > 0 ? t.substring(nl + 1) : t;
    }
  }

  // 2. If there's an end section like "## 3. Key Takeaways" or "## 3." cut it off
  const endMatch = t.search(/\n##\s*\d/);
  if (endMatch > 0) {
    t = t.substring(0, endMatch);
  }

  // 3. Strip table blocks if any remain
  t = t.replace(/\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)*/g, "");

  // 4. Strip timestamp segment headers: ### `[00:00 - 00:36]` • **Lecture Segment** (100 words)
  t = t.replace(/###\s*`\[\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\]`[^\n]*/gi, "");
  t = t.replace(/`\[\d{2}:\d{2}\s*-\s*\d{2}:\d{2}\]`[^\n]*/gi, "");

  // 5. Strip speaker cues: "> **Prof. AI / Host**:" or "**Host**:" but preserve spoken words
  t = t.replace(/>?\s*\*\*[^*]+\*\*:\s*/gi, "");

  // 6. Strip leading blockquote chevrons (>)
  t = t.replace(/^>\s*/gm, "");

  // 7. Strip horizontal rules
  t = t.replace(/^---\s*$/gm, "");

  // 8. Collapse whitespace
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/**
 * Basic markdown stripper for TTS reading.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  let t = text;
  // Remove multiline base64 data URLs
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[\s\S]*?(?=["'\s>)]|$)/gi, "");
  // Remove markdown images
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, "");
  // Remove html img tags
  t = t.replace(/<img\b[^>]*>/gi, "");
  // Remove html tags
  t = t.replace(/<[^>]+>/g, " ");
  // Remove code blocks (including mermaid)
  t = t.replace(/```[\s\S]*?```/g, "");
  // Remove inline code
  t = t.replace(/`([^`]+)`/g, "$1");
  // Remove markdown headers
  t = t.replace(/#{1,6}\s*/g, "");
  // Remove bold and italics
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  // Remove markdown links
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Remove blockquotes and symbols
  t = t.replace(/[>*_~`#]/g, "");
  t = t.replace(/⚠️|📖|📚|💙|🚫|🙏|👋|💡/g, "");
  t = t.replace(/---+/g, "");
  // Normalize whitespace
  return t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export const SUBJECT_LANG: Record<string, string> = {
  hindi: "hi-IN",
  telugu: "te-IN",
  sanskrit: "hi-IN",
  pubadm_ur: "ur-IN",
};

// ── Static waveform bars ─────────────────────────────────────────────────────
// Rendered exactly ONCE (React.memo). Bar colors and playhead are updated
// directly via DOM refs in updateProgress() — zero React re-renders during
// audio playback, which is the main cause of podcast player freezing.
const BAR_COUNT = 80;
const BAR_HEIGHTS: number[] = Array.from({ length: BAR_COUNT }, (_, i) => {
  const base = Math.sin(i * 0.4) * 0.3 + 0.4;
  const jitter = Math.sin(i * 2.3 + 1.7) * 0.4;
  return Math.max(0.15, Math.min(1, base + jitter));
});

interface StaticWaveformBarsProps {
  waveformRef: React.RefObject<HTMLDivElement>;
}

const StaticWaveformBars = React.memo(function StaticWaveformBars({
  waveformRef,
}: StaticWaveformBarsProps) {
  return (
    <div
      ref={waveformRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
      }}
    >
      {BAR_HEIGHTS.map((h, i) => (
        <div
          key={i}
          data-played="0"
          style={{
            width: "3px",
            height: `${h * 100}%`,
            borderRadius: "2px",
            background: "#cbd5e1",
          }}
        />
      ))}
    </div>
  );
});
// ─────────────────────────────────────────────────────────────────────────────

export interface PodcastsViewProps {
  chapterName: string;
  subjectId: string;
  chapterNumber: number;
  persona: string;
  autoPlay?: boolean;
  resumeTrack?: string;
  /** When set, jump straight to this MC episode index (0-based) on mount */
  initialMcIndex?: number;
  /** When true, only Microcasts are usable; Detailed/Quick Listen are grayed out */
  mcOnly?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  playTrigger?: number;
  pauseTrigger?: number;
  stopTrigger?: number;
  onNavigateToRead?: (sectionIndex?: number) => void;
}

/**
 * PodcastsView Component
 * Renders the podcast audio player and transcript for a chapter.
 */
export default function PodcastsView({
  chapterName,
  subjectId,
  chapterNumber,
  persona,
  autoPlay,
  resumeTrack,
  initialMcIndex,
  mcOnly,
  onPlayingChange,
  playTrigger,
  pauseTrigger,
  stopTrigger,
  onNavigateToRead,
}: PodcastsViewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0); // always up-to-date without triggering re-renders
  const rafRef = useRef<number | null>(null); // rAF handle for throttled UI updates
  const [audioDuration, setAudioDuration] = useState(0);
  const audioDurationRef = useRef(0);
  const [available, setAvailable] = useState<boolean | null>(null); // null = checking
  const [chapterDir, setChapterDir] = useState<string>(`chapter_${String(chapterNumber).padStart(2, "0")}`);

  // Auto-follow and Sleep Timer states
  const [autoFollow, setAutoFollow] = useState(true);
  const autoFollowRef = useRef(true);
  useEffect(() => {
    autoFollowRef.current = autoFollow;
  }, [autoFollow]);

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [currentChapterInfo, setCurrentChapterInfo] = useState<Chapter | null>(null);
  const [selectedModuleOverride, setSelectedModuleOverride] = useState<number | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      const ch = list.find((c) => c.number === chapterNumber);
      if (ch?.dir) {
        setChapterDir(ch.dir);
      }
      if (ch) {
        setCurrentChapterInfo(ch);
      }
    });
  }, [subjectId, chapterNumber]);

  const isNebBiologyChap6 = subjectId === "neb_xii_biology" && chapterNumber === 6;
  const isAngrau = subjectId === "ento_131" || subjectId === "entomology" || subjectId.includes("ento") || subjectId.includes("angrau");
  const isAngrauChap1 = isAngrau && chapterNumber === 1;
  const isAngrauChap2 = isAngrau && chapterNumber === 2;
  const isAngrauChap3 = isAngrau && chapterNumber === 3;
  const isAngrauChap4 = isAngrau && chapterNumber === 4;
  const isAngrauWithPodcasts = isAngrau && [1, 2, 3, 4].includes(chapterNumber);
  const isDbmsChap1 = subjectId === "dbms" && chapterNumber === 1;
  const isDbmsWithPodcasts = subjectId === "dbms" && chapterNumber === 1;
  const isNebOrMgmt =
    subjectId.startsWith("neb_") ||
    subjectId === "management" ||
    isAngrauWithPodcasts ||
    isDbmsWithPodcasts ||
    GCS_BACKEND_SUBJECTS.has(subjectId) ||
    Boolean(currentChapterInfo?.topics && currentChapterInfo.topics.length > 0);

  const getSavedTrack = (): string => {
    if (resumeTrack === "ql" || resumeTrack === "dl" || resumeTrack === "mc" || resumeTrack === "short" || resumeTrack === "long") {
      return resumeTrack;
    }
    const saved = localStorage.getItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
    );
    if (isNebOrMgmt) {
      return saved === "ql" || saved === "dl" || saved === "mc" ? saved : "ql";
    } else {
      return saved === "short" || saved === "long" ? saved : "short";
    }
  };

  const [selectedTrack, setSelectedTrack] = useState<string>(
    getSavedTrack(),
  );
  const [selectedDl, setSelectedDl] = useState(0);
  const [selectedQl, setSelectedQl] = useState(0);
  const [selectedMc, setSelectedMc] = useState(initialMcIndex ?? 0);

  const [readData, setReadData] = useState<SectionizedChapterData | null>(null);

  useEffect(() => {
    let isMounted = true;
    const trackParam = (selectedTrack === "dl" || selectedTrack === "long") ? "detailed" : "quick";
    getSectionizedReadData(subjectId, chapterNumber, trackParam, persona as any)
      .then((data) => {
        if (!isMounted) return;
        setReadData(data);
      })
      .catch(() => {
        if (isMounted) setReadData(null);
      });
    return () => {
      isMounted = false;
    };
  }, [subjectId, chapterNumber, selectedTrack, persona]);
  // Collapse track grid immediately when an initialMcIndex is supplied (coming from mindmap)
  const [isTrackGridExpanded, setIsTrackGridExpanded] = useState(initialMcIndex == null);

  // Smooth sliding pill indicator state and refs
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });
  const toggleBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const toggleContainerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeEl = toggleBtnRefs.current[selectedTrack];
      const containerEl = toggleContainerRef.current;
      if (activeEl && containerEl && activeEl.offsetWidth > 0) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          ready: true,
        });
      }
    };

    updateIndicator();
    const frameId = requestAnimationFrame(updateIndicator);
    const timer1 = setTimeout(updateIndicator, 40);
    const timer2 = setTimeout(updateIndicator, 150);
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [selectedTrack, isNebOrMgmt]);

  useEffect(() => {
    if (initialMcIndex !== undefined && initialMcIndex !== null) {
      setSelectedMc(initialMcIndex);
      setIsTrackGridExpanded(false);
    }
  }, [initialMcIndex]);

  useEffect(() => {
    if (resumeTrack) {
      setSelectedTrack(resumeTrack);
    }
  }, [resumeTrack]);

  const MICROCASTS = useMemo(() => {
    // Dynamic topic outline from registry/catalog v2
    if (currentChapterInfo?.topics && currentChapterInfo.topics.length > 0) {
      return currentChapterInfo.topics.map((t, i) => ({
        title: `${i + 1}. ${t.label}`,
        audio: `microcast_${String(i + 1).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(i + 1).padStart(2, "0")}.md`,
      }));
    }
    // GCS subjects use canonical microcast naming
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      // Use hardcoded titles from the original MVP but canonical filenames
      const gcsTitles: Record<string, Record<number, string[]>> = {
        ento_131: {
          1: ["Anatomy of the three-part insect gut", "Inside the Insect Foregut and Gizzard", "How Insect Digestion Activates Bt Toxins", "How insects recycle water from waste", "How insects digest wood and sap"],
          2: ["Three Categories of Insect Metamorphosis", "Identify Insect Larvae to Protect Crops", "Insect pupal structures and escape tactics", "Blister beetles live multiple larval lives", "Controlling Pests with Hormones and Diapause", "Predicting insect diapause for crop protection"],
          3: ["How weathering transforms bedrock into regolith", "Mechanical forces breaking down Indian landscapes", "How life turns solid rock into soil", "Mathematical Forces Turning Rock into Soil"],
          4: ["Floral architecture and double fertilization", "Self-Pollination Mechanisms in Indian Crops", "How Indian crops force cross pollination", "How nature pollinates India's crops", "Choosing and Arranging Orchard Pollinizers", "How Parthenocarpy Creates Seedless Fruit"],
        },
        dbms: {
          1: [
            "How 3-Schema Architecture Prevents Data Chaos",
            "ER Diagram Rules for DBMS Exams",
            "Weak Entities and Extended ER Mechanics",
            "Relational Keys and Integrity Constraints",
            "How ER Diagrams Become SQL Tables",
            "SQL Views and Safe Schema Evolution",
          ],
        },
      };
      const titles = (gcsTitles[subjectId] || (subjectId.includes('ento') ? gcsTitles.ento_131 : undefined))?.[chapterNumber] ?? [];
      return titles.map((title, i) => ({
        title: `${i + 1}. ${title}`,
        audio: `microcast_${String(i + 1).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(i + 1).padStart(2, "0")}.md`,
      }));

    }
    return isDbmsChap1 ? [
      { title: "1. How 3-Schema Architecture Prevents Data Chaos", audio: "1.How 3-Schema Architecture Prevents Data Chaos.m4a", txt: "1.How 3-Schema Architecture Prevents Data Chaos_transcript.json" },
      { title: "2. ER Diagram Rules for DBMS Exams", audio: "2.ER Diagram Rules for DBMS Exams.m4a", txt: "2.ER Diagram Rules for DBMS Exams_transcript.json" },
      { title: "3. Weak Entities and Extended ER Mechanics", audio: "3.Weak Entities and Extended ER Mechanics.m4a", txt: "3.Weak Entities and Extended ER Mechanics_transcript.json" },
      { title: "4. Relational Keys and Integrity Constraints", audio: "4.Relational Keys and Integrity Constraints.m4a", txt: "4.Relational Keys and Integrity Constraints_transcript.json" },
      { title: "5. How ER Diagrams Become SQL Tables", audio: "5.How ER Diagrams Become SQL Tables.m4a", txt: "5.How ER Diagrams Become SQL Tables_transcript.json" },
      { title: "6. SQL Views and Safe Schema Evolution", audio: "6.SQL Views and Safe Schema Evolution.m4a", txt: "6.SQL Views and Safe Schema Evolution_transcript.json" },
    ] : isNebBiologyChap6 ? [
    { title: "1. Histology pioneers and the first tissues", audio: "MC1_Histology_pioneers_and_the_first_tissues.mp3", txt: "MC1_Histology_pioneers_and_the_first_tissues.txt" },
    { title: "2. How Avascular Epithelium Survives and Stays Intact", audio: "MC2_How_Avascular_Epithelium_Survives_and_Stays_Intact.mp3", txt: "MC2_How_Avascular_Epithelium_Survives_and_Stays_Intact.txt" },
    { title: "3. Simple Epithelium Types and Functions", audio: "MC3_Simple_Epithelium_Types_and_Functions.mp3", txt: "MC3_Simple_Epithelium_Types_and_Functions.txt" },
    { title: "4. Body armor and shape shifting bladders", audio: "MC4_Body_armor_and_shape_shifting_bladders.mp3", txt: "MC4_Body_armor_and_shape_shifting_bladders.txt" },
    { title: "5. Modified Epithelia and Glandular Secretion Methods", audio: "MC5_Modified_Epithelia_and_Glandular_Secretion_Methods.mp3", txt: "MC5_Modified_Epithelia_and_Glandular_Secretion_Methods.txt" },
    { title: "6. Connective Tissue Proper Cells and Fibers", audio: "MC6_Connective_Tissue_Proper_Cells_and_Fibers.mp3", txt: "MC6_Connective_Tissue_Proper_Cells_and_Fibers.txt" },
    { title: "7. Why tendons anchor and ligaments stretch", audio: "MC7_Why_tendons_anchor_and_ligaments_stretch.mp3", txt: "MC7_Why_tendons_anchor_and_ligaments_stretch.txt" },
    { title: "8. Four unique types of body cartilage", audio: "MC8_Four_unique_types_of_body_cartilage.mp3", txt: "MC8_Four_unique_types_of_body_cartilage.txt" },
    { title: "9. The microscopic plumbing of mammalian bones", audio: "MC9_The_microscopic_plumbing_of_mammalian_bones.mp3", txt: "MC9_The_microscopic_plumbing_of_mammalian_bones.txt" },
    { title: "10. How Blood and Lymph Fuel and Protect", audio: "MC10_How_Blood_and_Lymph_Fuel_and_Protect.mp3", txt: "MC10_How_Blood_and_Lymph_Fuel_and_Protect.txt" },
    { title: "11. Why Some Muscles Never Get Tired", audio: "MC11_Why_Some_Muscles_Never_Get_Tired.mp3", txt: "MC11_Why_Some_Muscles_Never_Get_Tired.txt" },
    { title: "12. How Myelin Speeds Up Nerve Signals", audio: "MC12_How_Myelin_Speeds_Up_Nerve_Signals.mp3", txt: "MC12_How_Myelin_Speeds_Up_Nerve_Signals.txt" }
  ] : isAngrauChap1 ? [
    { title: "1. Anatomy of the three-part insect gut", audio: "1. Anatomy of the three-part insect gut.m4a", txt: "1. Anatomy of the three-part insect gut.txt" },
    { title: "2. Inside the Insect Foregut and Gizzard", audio: "2. Inside the Insect Foregut and Gizzard.m4a", txt: "2. Inside the Insect Foregut and Gizzard.txt" },
    { title: "3. How Insect Digestion Activates Bt Toxins", audio: "3. How Insect Digestion Activates Bt Toxins.m4a", txt: "3. How Insect Digestion Activates Bt Toxins.txt" },
    { title: "4. How insects recycle water from waste", audio: "4. How insects recycle water from waste.m4a", txt: "4. How insects recycle water from waste.txt" },
    { title: "5. How insects digest wood and sap", audio: "5. How insects digest wood and sap.m4a", txt: "5. How insects digest wood and sap.txt" }
  ] : isAngrauChap2 ? [
    { title: "1. Three Categories of Insect Metamorphosis", audio: "1.Three Categories of Insect Metamorphosis.m4a", txt: "1.Three Categories of Insect Metamorphosis.txt" },
    { title: "2. Identify Insect Larvae to Protect Crops", audio: "2.Identify Insect Larvae to Protect Crops.m4a", txt: "2.Identify Insect Larvae to Protect Crops.txt" },
    { title: "3. Insect pupal structures and escape tactics", audio: "3.Insect pupal structures and escape tactics.m4a", txt: "3.Insect pupal structures and escape tactics.txt" },
    { title: "4. Blister beetles live multiple larval lives", audio: "4.Blister beetles live multiple larval lives.m4a", txt: "4.Blister beetles live multiple larval lives.txt" },
    { title: "5. Controlling Pests with Hormones and Diapause", audio: "5.Controlling Pests with Hormones and Diapause.m4a", txt: "5.Controlling Pests with Hormones and Diapause.txt" },
    { title: "6. Predicting insect diapause for crop protection", audio: "6.Predicting insect diapause for crop protection.m4a", txt: "6.Predicting insect diapause for crop protection.txt" }
  ] : isAngrauChap3 ? [
    { title: "1. How weathering transforms bedrock into regolith", audio: "1. How weathering transforms bedrock into regolith.m4a", txt: "1. How weathering transforms bedrock into regolith.txt" },
    { title: "2. Mechanical forces breaking down Indian landscapes", audio: "2. Mechanical forces breaking down Indian landscapes.m4a", txt: "2. Mechanical forces breaking down Indian landscapes.txt" },
    { title: "3. How life turns solid rock into soil", audio: "3. How life turns solid rock into soil.m4a", txt: "3. How life turns solid rock into soil.txt" },
    { title: "4. Mathematical Forces Turning Rock into Soil", audio: "4. Mathematical Forces Turning Rock into Soil.m4a", txt: "4. Mathematical Forces Turning Rock into Soil.txt" }
  ] : isAngrauChap4 ? [
    { title: "1. Floral architecture and double fertilization", audio: "1. Floral architecture and double fertilization.m4a", txt: "1. Floral architecture and double fertilization.txt" },
    { title: "2. Self-Pollination Mechanisms in Indian Crops", audio: "2. Self-Pollination Mechanisms in Indian Crops.m4a", txt: "2. Self-Pollination Mechanisms in Indian Crops.txt" },
    { title: "3. How Indian crops force cross pollination", audio: "3.How Indian crops force cross pollination.m4a", txt: "3.How Indian crops force cross pollination.txt" },
    { title: "4. How nature pollinates India's crops", audio: "4.How nature pollinates India_s crops.m4a", txt: "4.How nature pollinates India_s crops.txt" },
    { title: "5. Choosing and Arranging Orchard Pollinizers", audio: "5. Choosing and Arranging Orchard Pollinizers.m4a", txt: "5. Choosing and Arranging Orchard Pollinizers.txt" },
    { title: "6. How Parthenocarpy Creates Seedless Fruit", audio: "6. How Parthenocarpy Creates Seedless Fruit.m4a", txt: "6. How Parthenocarpy Creates Seedless Fruit.txt" }
  ] : [
    { title: "1. Topic Overview", audio: "MC1.mp3", txt: "MC1.txt" }
  ];
  }, [isDbmsChap1, isNebBiologyChap6, isAngrauChap1, isAngrauChap2, isAngrauChap3, isAngrauChap4, chapterNumber, subjectId]);

  const DETAILED_LISTENS = useMemo(() => {
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: "1. Chapter Complete Coverage", audio: "long_podcast.m4a", txt: "long_podcast.md" }];
    }
    return isDbmsChap1 ? [
      { title: "1. DBMS Unit 1 Complete Coverage", audio: "DBMS_Long_Podcast.m4a", txt: "DBMS_Long_Podcast_transcript.json" }
    ] : isNebBiologyChap6 ? [
    { title: "1. Animal Tissue Complete Coverage", audio: "DL_Animal Tissue Podcast.mp3", txt: "DL_Animal Tissue Podcast.txt" }
  ] : isAngrauChap1 ? [
    { title: "1. Digestive System Complete Coverage", audio: "Digestive system Long Podcast.m4a", txt: "Digestive system Long Podcast.txt" }
  ] : isAngrauChap2 ? [
    { title: "1. Metamorphosis Complete Coverage", audio: "Metamorphosis Long Podcast.m4a", txt: "Metamorphosis Long Podcast.txt" }
  ] : isAngrauChap3 ? [
    { title: "1. Weathering Complete Coverage", audio: "Long Podcast Weathering.m4a", txt: "Long Podcast Weathering.txt" }
  ] : isAngrauChap4 ? [
    { title: "1. Pollination Complete Coverage", audio: "Long Podcast Pollination.m4a", txt: "Long Podcast Pollination.txt" }
  ] : [
    { title: "1. Chapter Complete Coverage", audio: "DL.mp3", txt: "DL.txt" }
  ];
  }, [isDbmsChap1, isNebBiologyChap6, isAngrauChap1, isAngrauChap2, isAngrauChap3, isAngrauChap4, chapterNumber, subjectId]);

  const QUICK_LISTENS = useMemo(() => {
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: "1. Chapter Quick Recap", audio: "short_podcast.m4a", txt: "short_podcast.md" }];
    }
    return isDbmsChap1 ? [
      { title: "1. DBMS Unit 1 Quick Recap", audio: "DBMS_Short_Podcast.m4a", txt: "DBMS_Short_Podcast_transcript.json" }
    ] : isNebBiologyChap6 ? [
    { title: "1. The Four Pillars of Animal Tissue", audio: "QL_The_Four_Pillars_of_Animal_Tissue.mp3", txt: "QL_The_Four_Pillars_of_Animal_Tissue.txt" }
  ] : isAngrauChap1 ? [
    { title: "1. Digestive System Quick Recap", audio: "Digestive system Short Podcast.m4a", txt: "Digestive system Short Podcast.txt" }
  ] : isAngrauChap2 ? [
    { title: "1. Metamorphosis Quick Recap", audio: "Metamorphosis short Podcast.m4a", txt: "Metamorphosis short Podcast.txt" }
  ] : isAngrauChap3 ? [
    { title: "1. Weathering Quick Recap", audio: "Short Podcast Weathering.m4a", txt: "Short Podcast Weathering.txt" }
  ] : isAngrauChap4 ? [
    { title: "1. Pollination Quick Recap", audio: "Short Podcast Pollination.m4a", txt: "Short Podcast Pollination.txt" }
  ] : [
    { title: "1. Chapter Quick Recap", audio: "QL.mp3", txt: "QL.txt" }
  ];
  }, [isDbmsChap1, isNebBiologyChap6, isAngrauChap1, isAngrauChap2, isAngrauChap3, isAngrauChap4, chapterNumber, subjectId]);

  useEffect(() => {
    localStorage.setItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
      selectedTrack,
    );
  }, [selectedTrack, subjectId, chapterNumber, persona]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const [showClickWave, setShowClickWave] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<Array<{
    start_sec: number;
    end_sec: number;
    transcript: string;
  }> | null>(null);
  const [transcriptDuration, setTranscriptDuration] = useState<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);

  const handleToggleSpeed = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const muted = newVol === 0;
    setIsMutedUi(muted);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = muted;
    }
  };

  useEffect(() => {
    if (isPlaying && selectedTrack === "mc") {
      setIsTrackGridExpanded(false);
    }
  }, [isPlaying, selectedTrack]);

  // ── TTS Playback State ──
  const [ttsPlaybackState, setTtsPlaybackState] = useState<"idle" | "playing" | "paused">("idle");
  const [ttsCharIndex, setTtsCharIndex] = useState(0);

  const cleanText = useMemo(() => stripMarkdown(transcript || ""), [transcript]);

  const displayDuration = useMemo(() => {
    if (available && audioDuration > 0) return audioDuration;
    if (transcriptDuration && transcriptDuration > 0) return transcriptDuration;
    return Math.max(1, cleanText.length / 15);
  }, [available, audioDuration, transcriptDuration, cleanText]);

  const displayCurrent = useMemo(() => {
    if (available) return currentTime;
    return Math.min(displayDuration, ttsCharIndex / 15);
  }, [available, currentTime, ttsCharIndex, displayDuration]);

  const progressPct = displayDuration ? (displayCurrent / displayDuration) * 100 : 0;

  const transcriptTokens = useMemo(() => {
    if (!cleanText) return [] as string[];
    return cleanText.split(/(\s+|[.,!?;:]+)/g).filter(Boolean);
  }, [cleanText]);

  const wordTimings = useMemo(() => {
    if (!transcriptTokens.length)
      return {
        totalWeight: 0,
        wordWeights: [] as number[],
        wordIndexes: [] as number[],
        exactTimestamps: null as number[] | null,
      };

    const wordIndexes: number[] = [];
    for (let i = 0; i < transcriptTokens.length; i++) {
      const token = transcriptTokens[i];
      const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);
      if (isWord) {
        wordIndexes.push(i);
      }
    }

    // High-precision Whisper/Groq segment timestamps
    if (transcriptSegments && transcriptSegments.length > 0) {
      const exactTimestamps: number[] = [];
      transcriptSegments.forEach((seg) => {
        const segTokens = (seg.transcript || "").split(/(\s+|[.,!?;:]+)/g).filter(Boolean);
        const segWords: string[] = [];
        segTokens.forEach((t) => {
          if (t.trim() !== "" && !/^[.,!?;:]+$/.test(t)) {
            segWords.push(t);
          }
        });
        const segDur = Math.max(0.05, seg.end_sec - seg.start_sec);
        const totalChars = segWords.reduce((acc, w) => acc + w.length, 0) || 1;
        let runningChars = 0;
        segWords.forEach((w) => {
          const frac = runningChars / totalChars;
          const wordTime = seg.start_sec + frac * segDur;
          exactTimestamps.push(wordTime);
          runningChars += w.length;
        });
      });

      if (exactTimestamps.length === wordIndexes.length) {
        return {
          totalWeight: 0,
          wordWeights: [] as number[],
          wordIndexes,
          exactTimestamps,
        };
      }

      // If tokenization differs slightly, align wordIndexes proportionally to exact segment timestamps
      if (exactTimestamps.length > 0 && wordIndexes.length > 0) {
        const alignedTimestamps: number[] = [];
        const exactLen = exactTimestamps.length;
        const targetLen = wordIndexes.length;
        for (let i = 0; i < targetLen; i++) {
          const mappedIdx = Math.min(exactLen - 1, Math.floor((i / targetLen) * exactLen));
          alignedTimestamps.push(exactTimestamps[mappedIdx]);
        }
        return {
          totalWeight: 0,
          wordWeights: [] as number[],
          wordIndexes,
          exactTimestamps: alignedTimestamps,
        };
      }
    }

    let cumulativeChars = 0;
    const wordWeights: number[] = [];

    for (let i = 0; i < transcriptTokens.length; i++) {
      const token = transcriptTokens[i];
      const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);

      if (isWord) {
        // Pure character count makes TTS sync much more accurate since reading speed is roughly constant in chars/sec
        cumulativeChars += token.length;
        wordWeights.push(cumulativeChars);
      } else {
        // Equivalent pause lengths in "characters" (assuming ~15 chars/sec reading speed)
        if (token.includes(".")) cumulativeChars += 12;
        else if (token.includes("?")) cumulativeChars += 12;
        else if (token.includes("!")) cumulativeChars += 12;
        else if (token.includes(",")) cumulativeChars += 6;
        else if (token.includes(";")) cumulativeChars += 8;
        else if (token.includes(":")) cumulativeChars += 8;
        else if (token.includes("\n\n"))
          cumulativeChars += 20; // paragraph pause
        else if (token.includes("\n")) cumulativeChars += 10;
        else cumulativeChars += token.length; // standard spaces
      }
    }

    // Add start and end silence buffer (TTS usually has a brief pause at start/end)
    const START_SILENCE_CHARS = 10;
    const totalWeight = cumulativeChars + START_SILENCE_CHARS + 15;

    const shiftedWeights = wordWeights.map((w) => w + START_SILENCE_CHARS);

    return { totalWeight, wordWeights: shiftedWeights, wordIndexes, exactTimestamps: null };
  }, [transcriptTokens, transcriptSegments]);

  const wordTimingsRef = useRef(wordTimings);
  useEffect(() => {
    wordTimingsRef.current = wordTimings;
    activeTokenIdxRef.current = -1;
    if (activeWordElRef.current) {
      activeWordElRef.current.classList.remove("active");
      activeWordElRef.current = null;
    }
  }, [wordTimings]);

  const activeTokenIdxRef = useRef<number>(-1);
  const activeWordElRef = useRef<HTMLElement | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const currentTrackTitle = useMemo(() => {
    if (selectedTrack === "ql" || selectedTrack === "short") {
      return QUICK_LISTENS[selectedQl]?.title || "Quick Recap";
    }
    if (selectedTrack === "dl" || selectedTrack === "long") {
      return DETAILED_LISTENS[selectedDl]?.title || "Detailed Coverage";
    }
    if (selectedTrack === "mc") {
      return MICROCASTS[selectedMc]?.title || "Microcasts Episode";
    }
    return chapterName;
  }, [selectedTrack, selectedQl, selectedDl, selectedMc, QUICK_LISTENS, DETAILED_LISTENS, MICROCASTS, chapterName]);



  const chapterPad = String(chapterNumber).padStart(2, "0");
  const subjectBaseUrl = getSubjectBaseUrl(subjectId);
  const basePath = `${subjectBaseUrl}/${chapterDir}/podcasts`;
  const lessonId = `${subjectId}_ch${chapterNumber}_${persona}_${selectedTrack}${selectedTrack === "mc" ? "_" + selectedMc : selectedTrack === "dl" ? "_" + selectedDl : selectedTrack === "ql" ? "_" + selectedQl : ""}`;
  const userId = localStorage.getItem("app_user_id") || "anonymous";

  // Memoize metadata so it doesn't trigger useEffect on every timeupdate re-render
  const metadata = useMemo(
    () => ({
      subjectId,
      chapterNumber,
      chapterName,
      persona,
      track: selectedTrack,
      mcIndex: selectedMc,
      dlIndex: selectedDl,
      qlIndex: selectedQl,
    }),
    [subjectId, chapterNumber, chapterName, persona, selectedTrack, selectedMc, selectedDl, selectedQl],
  );

  const sections = readData?.sections || [];
  const figures = readData?.figures || [];
  const definitions = readData?.definitions || [];

  const modulesList = useMemo(() => {
    if (readData?.modules && readData.modules.length > 0) {
      return readData.modules;
    }
    const derived = sections
      .filter((s) => s.sectionNumber > 0)
      .map((s) => ({
        module: s.sectionNumber,
        title: s.title,
        shortTitle: s.shortTitle,
        sectionNumber: s.sectionNumber,
      }));
    if (derived.length > 0) return derived;
    if (selectedTrack === "mc" && MICROCASTS.length > 0) {
      return MICROCASTS.map((item, idx) => ({
        module: idx + 1,
        title: item.title.replace(/^\d+\.\s*/, ''),
        shortTitle: item.title.replace(/^\d+\.\s*/, '').slice(0, 24),
        sectionNumber: idx + 1,
      }));
    }
    return [
      { module: 1, title: chapterName, shortTitle: "Overview", sectionNumber: 1 }
    ];
  }, [readData?.modules, sections, selectedTrack, MICROCASTS, chapterName]);

  const effectiveModuleNumber = useMemo(() => {
    if (selectedModuleOverride !== null) {
      return selectedModuleOverride;
    }
    if (selectedTrack === "mc") {
      return selectedMc + 1;
    }
    const dur = audioDurationRef.current || displayDuration || 1;
    const progressFraction = dur > 0 ? currentTime / dur : 0;
    const count = Math.max(1, modulesList.length);
    const activeIdx = Math.min(count - 1, Math.max(0, Math.floor(progressFraction * count)));
    const activeMod = modulesList[activeIdx];
    return activeMod ? activeMod.module : activeIdx + 1;
  }, [selectedModuleOverride, selectedTrack, selectedMc, displayDuration, currentTime, modulesList]);

  const activeSectionInfo = useMemo(() => {
    const mod = modulesList.find((m) => m.module === effectiveModuleNumber) || modulesList[0];
    const targetSecNum = mod ? mod.sectionNumber : effectiveModuleNumber;
    const sec = sections.find((s) => s.sectionNumber === targetSecNum) || sections[targetSecNum - 1] || sections[0];
    const fig = figures.find((f) => f.module === `Module ${effectiveModuleNumber}` || f.figure_no.startsWith(`Fig ${effectiveModuleNumber}.`)) || figures[effectiveModuleNumber - 1] || figures[0];

    const fallbackTitle = selectedTrack === "mc"
      ? (MICROCASTS[selectedMc]?.title.replace(/^\d+\.\s*/, '') || `Module ${effectiveModuleNumber}`)
      : (mod?.title || currentChapterInfo?.name || chapterName);

    const title = mod?.title || sec?.title || fallbackTitle;
    const shortTitle = mod?.shortTitle || sec?.shortTitle || title;

    let termsCount = 6;
    if (definitions.length > 0) {
      if (sec?.content) {
        const found = definitions.filter((d) => sec.content.toLowerCase().includes(d.toLowerCase())).length;
        termsCount = found > 0 ? found : Math.min(definitions.length, 6);
      } else {
        termsCount = Math.min(definitions.length, 6);
      }
    }

    const upcoming = modulesList.filter((m) => m.module !== effectiveModuleNumber).slice(0, 3);

    return {
      moduleNumber: effectiveModuleNumber,
      sectionNumber: targetSecNum,
      shortTitle,
      title,
      figureTitle: fig?.title || `${shortTitle} Visual Diagram`,
      figureNo: fig?.figure_no || `Fig ${effectiveModuleNumber}.1`,
      termsCount,
      quickCheck: sec?.quickCheck,
      upcomingModules: upcoming,
    };
  }, [modulesList, effectiveModuleNumber, sections, figures, definitions, selectedTrack, selectedMc, MICROCASTS, currentChapterInfo, chapterName]);

  // Re-expand the grid whenever the user switches tracks
  useEffect(() => {
    setIsTrackGridExpanded(true);
  }, [selectedTrack]);

  useAudioProgress(
    userId,
    lessonId,
    audioRef,
    available === true,
    metadata,
    setCurrentTime,
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || available !== true) return;

    const savedData = localStorage.getItem(
      `audio_progress_${userId}_${lessonId}`,
    );
    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData) as AudioProgress;
      if (parsed.currentTime > 0) {
        const seekAudio = () => {
          if (!audio) return;
          audio.currentTime = parsed.currentTime;
          setCurrentTime(parsed.currentTime);
        };

        if (audio.readyState >= 1) {
          seekAudio();
        } else {
          audio.addEventListener("loadedmetadata", seekAudio, { once: true });
        }
      }
    } catch (error) {
      console.warn("Failed to restore local audio progress:", error);
    }
  }, [available, lessonId, userId]);

  /** Resolve filenames per subject naming convention */
  const getFileNames = (track: string) => {
    // ── GCS Cloud Run subjects: canonical naming ──
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      const gcsBasePath = `${subjectBaseUrl}/${chapterDir}/podcasts`;
      if (track === "dl") {
        const dl = DETAILED_LISTENS[selectedDl] || DETAILED_LISTENS[0] || { audio: "long_podcast.m4a", txt: "long_podcast.md" };
        return {
          audio: `${gcsBasePath}/${dl.audio}`,
          transcript: `${gcsBasePath}/${dl.txt}`,
        };
      }
      if (track === "ql") {
        const ql = QUICK_LISTENS[selectedQl] || QUICK_LISTENS[0] || { audio: "short_podcast.m4a", txt: "short_podcast.md" };
        return {
          audio: `${gcsBasePath}/${ql.audio}`,
          transcript: `${gcsBasePath}/${ql.txt}`,
        };
      }
      if (track === "mc") {
        const mc = MICROCASTS[selectedMc] || MICROCASTS[0] || { audio: "microcast_01.m4a", txt: "microcast_01.md" };
        return {
          audio: `${gcsBasePath}/${mc.audio}`,
          transcript: `${gcsBasePath}/${mc.txt}`,
        };
      }
      // Fallback for old "long"/"short" track keys
      const fileName = track === "long" ? "long_podcast" : "short_podcast";
      return {
        audio: `${gcsBasePath}/${fileName}.m4a`,
        transcript: `${gcsBasePath}/${fileName}.md`,
      };
    }

    if (subjectId === "dbms") {
      const dbmsAudioPath = `${subjectBaseUrl}/${chapterDir}/Learn/Listen`;
      const dbmsTranscriptPath = `${subjectBaseUrl}/${chapterDir}/Learn/Listen/Transcript`;
      if (track === "dl") {
        const dl = DETAILED_LISTENS[selectedDl] || DETAILED_LISTENS[0];
        const tFile = dl.txt || `${dl.audio.replace(/\.m4a$/i, '')}_transcript.json`;
        return {
          audio: `${dbmsAudioPath}/${encodeURIComponent(dl.audio)}`,
          transcript: `${dbmsTranscriptPath}/${encodeURIComponent(tFile)}`,
        };
      }
      if (track === "ql") {
        const ql = QUICK_LISTENS[selectedQl] || QUICK_LISTENS[0];
        const tFile = ql.txt || `${ql.audio.replace(/\.m4a$/i, '')}_transcript.json`;
        return {
          audio: `${dbmsAudioPath}/${encodeURIComponent(ql.audio)}`,
          transcript: `${dbmsTranscriptPath}/${encodeURIComponent(tFile)}`,
        };
      }
      if (track === "mc") {
        const mc = MICROCASTS[selectedMc] || MICROCASTS[0];
        const tFile = mc.txt || `${mc.audio.replace(/\.m4a$/i, '')}_transcript.json`;
        return {
          audio: `${dbmsAudioPath}/${encodeURIComponent(mc.audio)}`,
          transcript: `${dbmsTranscriptPath}/${encodeURIComponent(tFile)}`,
        };
      }
      return {
        audio: `${dbmsAudioPath}/DBMS_Short_Podcast.m4a`,
        transcript: `${dbmsTranscriptPath}/DBMS_Short_Podcast_transcript.json`,
      };
    }

    if (subjectId.startsWith("neb_") || subjectId === "management" || isAngrauWithPodcasts) {
      const nebBasePath = `${subjectBaseUrl}/${chapterDir}/Podcasts`;
      if (track === "dl") {
        const dl = DETAILED_LISTENS[selectedDl] || DETAILED_LISTENS[0];
        return {
          audio: `${nebBasePath}/${encodeURIComponent(dl.audio)}`,
          transcript: `${nebBasePath}/transcripts/${encodeURIComponent(dl.txt)}`
        };
      }
      if (track === "ql") {
        const ql = QUICK_LISTENS[selectedQl] || QUICK_LISTENS[0];
        return {
          audio: `${nebBasePath}/${encodeURIComponent(ql.audio)}`,
          transcript: `${nebBasePath}/transcripts/${encodeURIComponent(ql.txt)}`
        };
      }
      if (track === "mc") {
        const mc = MICROCASTS[selectedMc] || MICROCASTS[0];
        return {
          audio: `${nebBasePath}/${encodeURIComponent(mc.audio)}`,
          transcript: `${nebBasePath}/transcripts/${encodeURIComponent(mc.txt)}`
        };
      }
      const base = `${subjectBaseUrl}/${chapterDir}/${persona}/${track}_podcast`;
      return { audio: `${base}.mp3`, transcript: `${base}.md` };
    }
    if (subjectId === "advanced_financial_management") {
      const trackLabel = track === "long" ? "long" : "short";
      // e.g. chapter_01 (derivatives_futures)/beginner/short_podcast.md
      const base = `${subjectBaseUrl}/${chapterDir}/${persona}/${trackLabel}_podcast`;
      return { audio: `${base}.mp3`, transcript: `${base}.md` };
    }
    if (subjectId === "pubadm_ur") {
      return {
        audio:
          track === "long"
            ? `${basePath}/podcast_long.m4a`
            : `${basePath}/podcast_short.mp3`,
        transcript: `${basePath}/transcript_${track}.md`,
      };
    }
    if (subjectId === "science") {
      // Chapters 1–3 have persona-aware subfolders with .mp3 files
      if (chapterNumber <= 3) {
        // Map persona key → label used in filename
        // Note: intermediate files use "Moderate" not "Intermediate"
        const personaLabel: Record<string, string> = {
          beginner: "Beginner",
          intermediate: "Moderate",
          advanced: "Advanced",
        };
        const label = personaLabel[persona] ?? "Moderate";
        const trackLabel = track === "long" ? "Long" : "Short";
        const base = `${basePath}/${persona}/Science_Chapter${chapterNumber}_${label}_${trackLabel}`;
        return { audio: `${base}.mp3`, transcript: `${base}.txt` };
      }
      // Chapters 4+ use the older flat naming (no persona, .m4a)
      const base = `${basePath}/Science_Chapter_${chapterPad}_${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "english") {
      // Chapters 1–3 have persona-aware subfolders with .mp3 files
      if (chapterNumber <= 3) {
        const personaLabel: Record<string, string> = {
          beginner: "Beginner",
          intermediate: "Moderate",
          advanced: "Advanced",
        };
        const label = personaLabel[persona] ?? "Moderate";
        const trackLabel = track === "long" ? "Long" : "Short";
        const base = `${basePath}/${persona}/English_Chapter_${chapterNumber}_${label}_${trackLabel}`;
        return { audio: `${base}.mp3`, transcript: `${base}.txt` };
      }
      // Chapters 4+ use the older flat naming (no persona, .m4a)
      const base = `${basePath}/ch${chapterNumber}-${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "maths") {
      const base = `${basePath}/ch${chapterNumber}-${track}-${persona}`;
      return { audio: `${base}.mp3`, transcript: `${base}.txt` };
    }
    // any other subject
    const base = `${basePath}/ch${chapterNumber}-${track}`;
    return { audio: `${base}.m4a`, transcript: `${base}.txt` };
  };

  const tracks = {
    long: { label: "Long Podcast", desc: "In-depth Chapter Coverage" },
    short: { label: "Short Podcast", desc: "Brief Recap of Key Points" },
  };

  // ── Check availability once per chapter/subject change ──
  useEffect(() => {
    // NEB Nepal subjects now have pre-generated MP3 files, so check availability.
    // Only advanced_financial_management always uses TTS.
    const NEB_TTS_SUBJECTS = [
      "advanced_financial_management",
    ];
    if (NEB_TTS_SUBJECTS.includes(subjectId)) {
      setAvailable(false);
      return;
    }
    setAvailable(null);
    const { audio } = getFileNames(selectedTrack);
    fetch(audio, { method: "HEAD" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        const hasAudio = res.ok && !ct.includes("text/html");
        setAvailable(hasAudio);
      })
      .catch(() => {
        setAvailable(false);
      });
  }, [subjectId, chapterNumber, persona, selectedTrack, chapterDir, selectedMc, selectedDl, selectedQl]);

  const isTrackMount = useRef(true);
  // ── Reset player when track selection changes ──
  useEffect(() => {
    if (isTrackMount.current) {
      isTrackMount.current = false;
      return;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
      setAudioDuration(0);
      audio.load();
    }
    setSelectedModuleOverride(null);
  }, [selectedTrack, selectedMc, selectedDl, selectedQl]);

  // ── Reset player when persona changes ──
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
      setCurrentTime(0);
      setAudioDuration(0);
    }
  }, [persona]);

  const isNebMount = useRef(true);
  // ── Reset NEB Nepal and Nagarjuna University player when track, persona, subject, or chapter changes ──
  useEffect(() => {
    if (isNebMount.current) {
      isNebMount.current = false;
      return;
    }
    if (!subjectId || (!subjectId.startsWith("neb_") && subjectId !== "management")) return;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    onPlayingChange?.(false);
    setCurrentTime(0);
    setAudioDuration(0);
  }, [subjectId, chapterNumber, persona, selectedTrack, selectedMc]);

  // ── Audio event listeners ──
  // Progress is updated via rAF to avoid 4Hz React re-renders freezing the UI.
  // We update the DOM directly for the waveform and only call setCurrentTime
  // at a much lower rate (for transcript word highlighting).
  const waveformRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const currentTimeDisplayRef = useRef<HTMLSpanElement>(null);
  const waveformColorRef = useRef<string>("#3b82f6");
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [isMutedUi, setIsMutedUi] = useState(false);

  const updateProgress = useCallback((time: number, duration: number) => {
    const lastSec = Math.floor(currentTimeRef.current);
    const newSec = Math.floor(time);
    currentTimeRef.current = time;
    if (newSec !== lastSec) {
      setCurrentTime(time);
    }

    const pct = duration > 0 ? (time / duration) * 100 : 0;

    // Update playhead position directly in DOM (zero React overhead)
    if (playheadRef.current) {
      playheadRef.current.style.left = `${pct}%`;
    }
    if (progressFillRef.current) {
      progressFillRef.current.style.width = `${pct}%`;
    }

    // Update bar colors directly in DOM
    if (waveformRef.current) {
      const bars = waveformRef.current.children;
      const color = waveformColorRef.current;
      const barCount = bars.length;
      const playedCount = Math.floor((pct / 100) * barCount);
      for (let i = 0; i < barCount; i++) {
        const bar = bars[i] as HTMLElement;
        const shouldBePlayed = i < playedCount;
        const currentlyPlayed = bar.dataset.played === "1";
        if (shouldBePlayed !== currentlyPlayed) {
          bar.style.background = shouldBePlayed ? color : "#cbd5e1";
          bar.dataset.played = shouldBePlayed ? "1" : "0";
        }
      }
    }

    // Update time display directly
    if (currentTimeDisplayRef.current) {
      const m = String(Math.floor(time / 60)).padStart(2, "0");
      const sec = String(Math.floor(time % 60)).padStart(2, "0");
      currentTimeDisplayRef.current.textContent = `${m}:${sec}`;
    }

    // Direct DOM transcript word highlighting (zero React virtual-DOM diffing)
    const wt = wordTimingsRef.current;
    if (wt && wt.wordIndexes.length > 0 && duration > 0) {
      let wordIdx = 0;
      if (wt.exactTimestamps && wt.exactTimestamps.length > 0) {
        // High-precision segment timestamps binary search
        const ts = wt.exactTimestamps;
        let lo = 0, hi = ts.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (ts[mid] <= time) {
            wordIdx = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
      } else if (wt.totalWeight > 0) {
        const clamped = Math.min(time, duration);
        const targetWeight = (clamped / duration) * wt.totalWeight;
        const weights = wt.wordWeights;
        let lo = 0, hi = weights.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (weights[mid] >= targetWeight) {
            wordIdx = mid;
            hi = mid - 1;
          } else {
            lo = mid + 1;
          }
        }
      }
      const tokenIdx = wt.wordIndexes[wordIdx] ?? -1;
      if (tokenIdx !== activeTokenIdxRef.current) {
        activeTokenIdxRef.current = tokenIdx;
        if (activeWordElRef.current) {
          activeWordElRef.current.classList.remove("active");
          activeWordElRef.current = null;
        }
        const box = transcriptBoxRef.current;
        if (box && tokenIdx >= 0) {
          const el = box.children[tokenIdx] as HTMLElement | undefined;
          if (el) {
            el.classList.add("active");
            activeWordElRef.current = el;

            // Smooth scroll throttled to prevent layout thrashing (when Auto-follow is enabled)
            const now = performance.now();
            if (autoFollowRef.current && now - lastScrollTimeRef.current > 250 && transcriptRef.current) {
              lastScrollTimeRef.current = now;
              const container = transcriptRef.current;
              const containerRect = container.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const relY = elRect.top - containerRect.top;
              if (relY < containerRect.height * 0.15 || relY > containerRect.height * 0.65) {
                const targetScroll = container.scrollTop + relY - containerRect.height * 0.35;
                container.scrollTo({ top: targetScroll, behavior: "smooth" });
              }
            }
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio && !audio.paused && !isPlaying) {
        setIsPlaying(true);
        onPlayingChange?.(true);
      }
      if (rafRef.current !== null) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!audio) return;
        let dur = audioDurationRef.current;
        if (!dur || !isFinite(dur) || dur <= 0) {
          if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
            dur = audio.duration;
            audioDurationRef.current = dur;
            setAudioDuration(dur);
          } else if (audio.seekable && audio.seekable.length > 0) {
            const seekEnd = audio.seekable.end(audio.seekable.length - 1);
            if (isFinite(seekEnd) && seekEnd > 0) {
              dur = seekEnd;
              audioDurationRef.current = dur;
              setAudioDuration(dur);
            }
          }
        }
        if (!dur || !isFinite(dur) || dur <= 0) {
          dur = displayDuration || (cleanText.length ? cleanText.length / 15 : 60);
        }
        updateProgress(audio.currentTime, dur);
      });
    };

    const handleDurationDetect = () => {
      if (!audio) return;
      let dur = 0;
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        dur = audio.duration;
      } else if (audio.seekable && audio.seekable.length > 0) {
        const seekEnd = audio.seekable.end(audio.seekable.length - 1);
        if (isFinite(seekEnd) && seekEnd > 0) dur = seekEnd;
      }
      if (dur > 0 && dur !== audioDurationRef.current) {
        audioDurationRef.current = dur;
        setAudioDuration(dur);
        updateProgress(audio.currentTime, dur);
      }
    };

    const onSeeked = () => {
      if (audio) {
        const dur = audioDurationRef.current || audio.duration || displayDuration || 0;
        updateProgress(audio.currentTime, dur);
      }
    };

    const onLoadedMetadata = () => {
      handleDurationDetect();
      if (autoPlay && audio.paused) {
        setIsPlaying(true);
        onPlayingChange?.(true);
        audio.play().catch((e) => {
          console.warn("Auto-play prevented on loadedmetadata:", e);
          setIsPlaying(false);
          onPlayingChange?.(false);
        });
      }
    };

    const onCanPlay = () => {
      handleDurationDetect();
      if (autoPlay && audio.paused) {
        setIsPlaying(true);
        onPlayingChange?.(true);
        audio.play().catch((e) => {
          console.warn("Auto-play prevented on canplay:", e);
          setIsPlaying(false);
          onPlayingChange?.(false);
        });
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationDetect);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", handleDurationDetect);

    // Initial check in case audio already loaded
    handleDurationDetect();
    if (autoPlay && audio.paused) {
      setIsPlaying(true);
      onPlayingChange?.(true);
      audio.play().catch((e) => {
        console.warn("Auto-play initial check prevented:", e);
        setIsPlaying(false);
        onPlayingChange?.(false);
      });
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationDetect);
      audio.removeEventListener("canplay", handleDurationDetect);
      audio.removeEventListener("playing", handleDurationDetect);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [selectedTrack, autoPlay, available, displayDuration, cleanText.length, updateProgress]);

  // Synchronize playhead, waveform, and active word when user returns to tab after leaving
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const audio = audioRef.current;
        if (audio && !audio.paused) {
          updateProgress(audio.currentTime, audioDurationRef.current || audio.duration || 0);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [updateProgress]);

  // 60fps continuous RAF loop while audio is actively playing for smooth word-by-word tracking
  useEffect(() => {
    let animId: number | null = null;
    const loop = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused && isPlaying) {
        const dur = audioDurationRef.current || audio.duration || displayDuration || 0;
        updateProgress(audio.currentTime, dur);
        animId = requestAnimationFrame(loop);
      }
    };
    if (isPlaying) {
      animId = requestAnimationFrame(loop);
    }
    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [isPlaying, displayDuration, updateProgress]);

  // ── Load transcript when track, subject, chapter, or level changes ──
  useEffect(() => {
    if (!subjectId) return;
    setTranscript(null);
    setTranscriptSegments(null);
    setTranscriptDuration(null);

    const { transcript: tFile } = getFileNames(selectedTrack);
    const isAngrauSubject = isAngrau || isAngrauWithPodcasts || subjectId.includes("ento") || subjectId.includes("angrau");
    const hasJsonTranscript = subjectId === "dbms" || subjectId.includes("dbms") || isAngrauSubject;
    const jsonCandidate = hasJsonTranscript && tFile.endsWith('.md')
      ? tFile.replace(/\.md$/i, '.transcript.json')
      : null;

    const chDirName = chapterDir || `chapter_${String(chapterNumber).padStart(2, '0')}`;
    const fileBase = tFile.split('/').pop()?.replace(/\.(md|txt|transcript\.json)$/i, '') || '';
    const localCandidates: string[] = [];
    if (hasJsonTranscript) {
      if (isAngrauSubject) {
        localCandidates.push(`/generated_resources/angrau/entomology/${chDirName}/podcasts/${fileBase}.transcript.json`);
        localCandidates.push(`/generated_resources/angrau/${chDirName}/Podcasts/transcripts/${fileBase}.transcript.json`);
        localCandidates.push(`/generated_resources/angrau/${chDirName}/podcasts/${fileBase}.transcript.json`);
        if (selectedTrack === "ql" && QUICK_LISTENS[selectedQl]?.txt) {
          const qlRaw = QUICK_LISTENS[selectedQl].txt.replace(/\.(txt|md)$/i, '.json');
          localCandidates.push(`/generated_resources/angrau/${chDirName}/Podcasts/transcripts/${encodeURIComponent(qlRaw)}`);
        }
        if (selectedTrack === "dl" && DETAILED_LISTENS[selectedDl]?.txt) {
          const dlRaw = DETAILED_LISTENS[selectedDl].txt.replace(/\.(txt|md)$/i, '.json');
          localCandidates.push(`/generated_resources/angrau/${chDirName}/Podcasts/transcripts/${encodeURIComponent(dlRaw)}`);
        }
      }
    }

    const tryFetchJson = async (url: string) => {
      const r = await fetch(url);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || ct.includes("text/html")) throw new Error("not json");
      const txt = await r.text();
      const parsed = JSON.parse(txt);
      if (parsed && (typeof parsed.full_text === "string" || Array.isArray(parsed.segments))) {
        const fullText = parsed.full_text || parsed.transcript || (Array.isArray(parsed.segments) ? parsed.segments.map((s: any) => s.transcript || s.text || '').join(' ') : '');
        setTranscript(cleanTranscriptPreamble(fullText));
        if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
          const normalized = parsed.segments.map((s: any) => ({
            start_sec: typeof s.start_sec === "number" ? s.start_sec : (typeof s.start === "number" ? s.start : 0),
            end_sec: typeof s.end_sec === "number" ? s.end_sec : (typeof s.end === "number" ? s.end : 0),
            transcript: s.transcript || s.text || "",
          }));
          setTranscriptSegments(normalized);
        } else {
          setTranscriptSegments(null);
        }
        const runtime = parsed.total_runtime_seconds || parsed.metadata?.duration_seconds || null;
        if (typeof runtime === "number" && runtime > 0) {
          setTranscriptDuration(runtime);
        }
        return true;
      }
      return false;
    };

    const tryFetchMd = async (url: string) => {
      const r = await fetch(url);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || ct.includes("text/html")) throw new Error("not md");
      const txt = await r.text();
      setTranscript(cleanTranscriptPreamble(txt));
      setTranscriptSegments(null);
      return true;
    };

    const loadTranscript = async () => {
      const allJsonCandidates = [
        ...(jsonCandidate ? [jsonCandidate] : []),
        ...localCandidates,
      ];

      for (const cand of allJsonCandidates) {
        try {
          const ok = await tryFetchJson(cand);
          if (ok) return;
        } catch {
          // try next json candidate
        }
      }

      try {
        await tryFetchMd(tFile);
      } catch {
        // Fallback: try .txt version if .json failed
        const txtUrl = tFile.replace(/_transcript\.json$/i, '.txt');
        if (txtUrl !== tFile) {
          try {
            await tryFetchMd(txtUrl);
            return;
          } catch {
            // fall through
          }
        }
        // Fallback to getResourceContent
        try {
          const script = await getResourceContent(
            subjectId,
            chapterNumber,
            selectedTrack === "long" ? "long_podcast.md" : "short_podcast.md",
            persona as DifficultyLevel,
          );
          if (script && !script.includes("Content not available")) {
            setTranscript(cleanTranscriptPreamble(script));
          } else {
            setTranscript("Content not available.");
          }
          setTranscriptSegments(null);
        } catch {
          setTranscript("Content not available.");
          setTranscriptSegments(null);
        }
      }
    };

    loadTranscript();
  }, [selectedTrack, selectedMc, selectedDl, selectedQl, subjectId, chapterNumber, persona, chapterDir]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      setIsPlaying(true);
      onPlayingChange?.(true);
      if (audio.error) {
        audio.load();
      }
      audio.play().catch((e) => {
        console.warn("Play failed:", e);
        setIsPlaying(false);
        onPlayingChange?.(false);
      });
    }
  };
  const handlePause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
      onPlayingChange?.(false);
    }
  };

  // Sync playing state to parent when audio events fire
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      setIsPlaying(true);
      onPlayingChange?.(true);
    }
    const onPlay = () => {
      setIsPlaying(true);
      onPlayingChange?.(true);
    };
    const onPause = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayingChange?.(false);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onPlayingChange, available]);

  // ── TTS Transport Actions ──
  const handleTtsPlay = () => {
    if (subjectId === "management") return;
    if (ttsPlaybackState === "paused") {
      googleTtsResume();
      setTtsPlaybackState("playing");
      onPlayingChange?.(true);
    } else {
      const clean = cleanText;
      if (!clean) return;
      const startChar = ttsCharIndex;
      const dur = displayDuration || Math.max(1, clean.length / 15);
      googleTtsSpeak(
        clean.slice(startChar),
        SUBJECT_LANG[subjectId] ?? "en-IN",
        () => {
          setTtsPlaybackState("playing");
          onPlayingChange?.(true);
        },
        () => {
          setTtsPlaybackState("idle");
          setTtsCharIndex(0);
          onPlayingChange?.(false);
          updateProgress(0, dur);
        },
        (localIndex) => {
          const globalChar = startChar + localIndex;
          setTtsCharIndex(globalChar);
          const tSec = Math.min(dur, globalChar / 15);
          updateProgress(tSec, dur);
        },
        { raw: true }
      );
    }
  };

  const handleTtsPause = () => {
    if (subjectId === "management") return;
    googleTtsPause();
    setTtsPlaybackState("paused");
    onPlayingChange?.(false);
  };

  const handleTtsStop = () => {
    if (subjectId === "management") return;
    googleTtsStop();
    setTtsPlaybackState("idle");
    setTtsCharIndex(0);
    onPlayingChange?.(false);
  };

  // Use refs to access latest TTS state without causing re-triggers
  const cleanTextRef2 = useRef(cleanText);
  const ttsCharIndexRef = useRef(ttsCharIndex);
  const ttsPlaybackStateRef = useRef(ttsPlaybackState);
  useEffect(() => { cleanTextRef2.current = cleanText; }, [cleanText]);
  useEffect(() => { ttsCharIndexRef.current = ttsCharIndex; }, [ttsCharIndex]);
  useEffect(() => { ttsPlaybackStateRef.current = ttsPlaybackState; }, [ttsPlaybackState]);

  // Dedicated effect for autoPlay prop
  const hasAutoPlayedRef = useRef(false);
  useEffect(() => {
    if (!autoPlay || hasAutoPlayedRef.current) return;
    if (available === null) return; // Wait until HEAD check completes

    hasAutoPlayedRef.current = true;
    if (available) {
      handlePlay();
    } else {
      if (subjectId === "management") return;
      handleTtsPlay();
    }
  }, [autoPlay, available]);

  // React to external play trigger — only re-run when playTrigger or available changes
  useEffect(() => {
    if (!playTrigger) return;
    if (available === null) return; // Wait until HEAD check completes
    if (available) {
      handlePlay();
    } else {
      if (subjectId === "management") return;
      // Read latest TTS state via refs to avoid stale closure loops
      const state = ttsPlaybackStateRef.current;
      const clean = cleanTextRef2.current;
      const startChar = ttsCharIndexRef.current;
      if (state === "paused") {
        googleTtsResume();
        setTtsPlaybackState("playing");
        onPlayingChange?.(true);
      } else {
        if (!clean) return;
        const dur = displayDuration || Math.max(1, clean.length / 15);
        googleTtsSpeak(
          clean.slice(startChar),
          SUBJECT_LANG[subjectId] ?? "en-IN",
          () => { setTtsPlaybackState("playing"); onPlayingChange?.(true); },
          () => { setTtsPlaybackState("idle"); setTtsCharIndex(0); onPlayingChange?.(false); updateProgress(0, dur); },
          (localIndex) => {
            const globalChar = startChar + localIndex;
            setTtsCharIndex(globalChar);
            const tSec = Math.min(dur, globalChar / 15);
            updateProgress(tSec, dur);
          },
          { raw: true }
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playTrigger, available]);

  // React to external pause trigger
  useEffect(() => {
    if (!pauseTrigger) return;
    if (available) {
      handlePause();
    } else {
      if (subjectId === "management") return;
      handleTtsPause();
    }
  }, [pauseTrigger, available]);

  // React to external stop trigger
  useEffect(() => {
    if (!stopTrigger) return;
    if (available) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);

        // For NEB Nepal and Nagarjuna University subjects, reset saved progress in local storage and Firestore to 0
        if (subjectId.startsWith("neb_") || subjectId === "management") {
          saveProgress(userId, lessonId, 0, audio.duration || 0, false, metadata);
        }
      }
    } else {
      if (subjectId === "management") return;
      handleTtsStop();
    }
  }, [stopTrigger, available, subjectId, lessonId, userId, metadata]);

  // Clean up audio and TTS on unmount or track/subject change
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      googleTtsStop();
    };
  }, [selectedTrack, persona, subjectId, chapterNumber]);

  // Reset TTS playback state on track/persona switch
  useEffect(() => {
    setTtsPlaybackState("idle");
    setTtsCharIndex(0);
  }, [selectedTrack, persona, subjectId, chapterNumber]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (available) {
      if (audioRef.current) {
        audioRef.current.currentTime = t;
        setCurrentTime(t);
      }
    } else {
      if (subjectId === "management") return;
      const newCharIdx = Math.floor(t * 15);
      setTtsCharIndex(newCharIdx);
      if (ttsPlaybackState === "playing") {
        const clean = cleanText;
        googleTtsSpeak(
          clean.slice(newCharIdx),
          SUBJECT_LANG[subjectId] ?? "en-IN",
          () => {
            setTtsPlaybackState("playing");
            onPlayingChange?.(true);
          },
          () => {
            setTtsPlaybackState("idle");
            setTtsCharIndex(0);
            onPlayingChange?.(false);
          },
          (localIndex) => {
            setTtsCharIndex(newCharIdx + localIndex);
          }
        );
      }
    }
  };

  const fmtTime = (s: number, fallback = "00:00") => {
    if (s === undefined || s === null || isNaN(s) || !isFinite(s))
      return fallback;
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${m}:${sec}`;
  };

  const renderSegmentedTrackToggle = () => {
    const tracksList = isNebOrMgmt
      ? [
          {
            key: "ql",
            label: "Quick Listen",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9.5" />
                <polyline points="12 6.5 12 12 15.5 14" />
              </svg>
            ),
          },
          {
            key: "dl",
            label: "Detailed Listen",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <path d="M12 3 A9 9 0 0 0 12 21 Z" fill="currentColor" />
              </svg>
            ),
          },
          {
            key: "mc",
            label: "Microcasts",
            icon: (isActive: boolean) => (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9.5" fill="currentColor" />
                <circle cx="8.5" cy="8.5" r="2.3" fill={isActive ? "var(--primary-color, var(--primary, #365345))" : "#ffffff"} opacity={0.9} />
              </svg>
            ),
          },
        ]
      : [
          {
            key: "short",
            label: "Quick Listen",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9.5" />
                <polyline points="12 6.5 12 12 15.5 14" />
              </svg>
            ),
          },
          {
            key: "long",
            label: "Detailed Listen",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.2" />
                <path d="M12 3 A9 9 0 0 0 12 21 Z" fill="currentColor" />
              </svg>
            ),
          },
        ];

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "2px auto 16px auto",
          width: "100%",
        }}
      >
        <div
          ref={toggleContainerRef}
          role="tablist"
          aria-label="Podcast track selector"
          className="pod-segmented-container"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            background: "#edf3ee",
            borderRadius: "9999px",
            padding: "4px",
            border: "1.5px solid #d5e2d9",
            boxShadow: "inset 0 1px 2px rgba(54, 83, 69, 0.05)",
            gap: "0px",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          {/* Smooth sliding pill indicator colored with SV app theme */}
          <div
            className="pod-segmented-indicator"
            style={{
              position: "absolute",
              top: "4px",
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              height: "calc(100% - 8px)",
              borderRadius: "9999px",
              background: "var(--primary-color, var(--primary, #365345))",
              boxShadow: "0 2px 10px rgba(54, 83, 69, 0.28), 0 1px 3px rgba(54, 83, 69, 0.16)",
              transition: indicatorStyle.ready
                ? "left 0.26s cubic-bezier(0.25, 1, 0.5, 1), width 0.26s cubic-bezier(0.25, 1, 0.5, 1)"
                : "none",
              pointerEvents: "none",
              zIndex: 1,
              opacity: indicatorStyle.ready && indicatorStyle.width > 0 ? 1 : 0,
            }}
          />

          {tracksList.map(({ key, label, icon }) => {
            const isActive = selectedTrack === key;
            const isDisabled = mcOnly && key !== "mc";
            const renderedIcon = typeof icon === "function" ? icon(isActive) : icon;
            const isIndicatorSettled = indicatorStyle.ready && indicatorStyle.width > 0;

            return (
              <button
                key={key}
                ref={(el) => {
                  toggleBtnRefs.current[key] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isDisabled}
                onClick={() => !isDisabled && setSelectedTrack(key)}
                title={isDisabled ? "Not available in topic view — go to Podcasts tab for full access" : undefined}
                className={`pod-segmented-btn ${isActive ? "active" : ""}`}
                style={{
                  position: "relative",
                  zIndex: 2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "7px 20px",
                  borderRadius: "9999px",
                  border: "none",
                  outline: "none",
                  background: isActive
                    ? isIndicatorSettled
                      ? "transparent"
                      : "var(--primary-color, var(--primary, #365345))"
                    : "transparent",
                  color: isActive ? "#ffffff" : "#4b6354",
                  fontSize: "13.5px",
                  fontWeight: isActive ? 700 : 550,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "color 0.22s ease, background 0.15s ease",
                  opacity: isDisabled ? 0.35 : 1,
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !isDisabled) {
                    e.currentTarget.style.color = "#1e3328";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive && !isDisabled) {
                    e.currentTarget.style.color = "#4b6354";
                  }
                }}
              >
                {renderedIcon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Loading state ──
  if (available === null || transcript === null) {
    return (
      <div className="podcasts-view">
        <p className="loading-state">Checking podcast availability…</p>
      </div>
    );
  }

  // ── Coming Soon ──
  if (available === false && (transcript === "Content not available." || subjectId === "management")) {
    return (
      <div className="podcasts-view">
        {renderSegmentedTrackToggle()}
        <div
          className="card"
          style={{ padding: "48px", textAlign: "center", marginTop: "20px" }}
        >
          <span style={{ fontSize: "3.5rem" }}>🎧</span>
          <h3 style={{ margin: "16px 0 8px", color: "var(--text)" }}>
            Coming Soon
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Podcasts for <strong>{chapterName}</strong> haven't been uploaded
            yet.
            <br />
            Check back soon!
          </p>
        </div>
      </div>
    );
  }

  const currentFiles = getFileNames(selectedTrack);

  const isAudioActive = audioRef.current ? !audioRef.current.paused : false;
  const playing = available ? (isAudioActive || isPlaying) : ttsPlaybackState === "playing";

  const trackTypeLabel = (() => {
    if (selectedTrack === "ql" || selectedTrack === "short") return "Quick Listen";
    if (selectedTrack === "dl" || selectedTrack === "long") return "Detailed Listen";
    if (selectedTrack === "mc") return "Microcast";
    return "Podcast";
  })();

  const displayTitle = (() => {
    if (selectedTrack === "ql" || selectedTrack === "short") return "1. Chapter Quick Recap";
    if (selectedTrack === "dl" || selectedTrack === "long") return "1. Chapter Complete Coverage";
    if (selectedTrack === "mc") {
      const item = MICROCASTS[selectedMc];
      return item?.title || `Microcast Episode ${selectedMc + 1}`;
    }
    return "1. Chapter Audio";
  })();

  const displaySubtitle = (() => {
    if (selectedTrack === "mc") {
      return `Microcast · Episode ${selectedMc + 1} of ${MICROCASTS.length}`;
    }
    return `${chapterName} · ${trackTypeLabel}`;
  })();

  const handleRewind15 = () => {
    if (audioRef.current) {
      const dur = audioDurationRef.current || audioRef.current.duration || displayDuration;
      const target = Math.max(0, audioRef.current.currentTime - 15);
      audioRef.current.currentTime = target;
      setCurrentTime(target);
      updateProgress(target, dur);
    }
  };

  const handleForward30 = () => {
    if (audioRef.current) {
      const dur = audioDurationRef.current || audioRef.current.duration || displayDuration;
      const target = Math.min(dur || 999999, audioRef.current.currentTime + 30);
      audioRef.current.currentTime = target;
      setCurrentTime(target);
      updateProgress(target, dur);
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const dur = audioDurationRef.current || audioRef.current?.duration || displayDuration;
    if (dur > 0 && audioRef.current) {
      const seekTime = pct * dur;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      updateProgress(seekTime, dur);
    }
  };

  const handleToggleSleepTimer = () => {
    const steps = [null, 5, 15, 30];
    const cur = steps.indexOf(sleepTimerMinutes);
    const next = steps[(cur + 1) % steps.length];
    setSleepTimerMinutes(next);
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (next) {
      sleepTimerRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          onPlayingChange?.(false);
        }
        setSleepTimerMinutes(null);
      }, next * 60 * 1000);
    }
  };

  const handlePlayToggle = () => {
    if (available) {
      const audio = audioRef.current;
      if (audio) {
        if (!audio.paused) {
          handlePause();
        } else {
          handlePlay();
        }
      } else {
        isPlaying ? handlePause() : handlePlay();
      }
    } else {
      ttsPlaybackState === "playing" ? handleTtsPause() : handleTtsPlay();
    }
  };

  const handleNavigateToRead = (secIdx: number) => {
    onNavigateToRead?.(secIdx);
  };

  const handleWordClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest(".transcript-word") as HTMLElement | null;
    if (!target || !audioRef.current) return;
    const index = Array.from(target.parentElement?.children || []).indexOf(target);
    if (index < 0) return;
    const wt = wordTimingsRef.current;
    if (!wt) return;
    const wordIdx = wt.wordIndexes.indexOf(index);
    if (wordIdx < 0) return;
    let seekTime = 0;
    if (wt.exactTimestamps && wt.exactTimestamps[wordIdx] !== undefined) {
      seekTime = wt.exactTimestamps[wordIdx];
    } else if (wt.totalWeight > 0) {
      const dur = audioDurationRef.current || audioRef.current.duration || displayDuration;
      if (dur > 0) {
        seekTime = (wt.wordWeights[wordIdx] / wt.totalWeight) * dur;
      }
    }
    if (seekTime >= 0) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      updateProgress(seekTime, audioDurationRef.current || audioRef.current.duration || 0);
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          onPlayingChange?.(true);
        }).catch(() => {});
      }
    }
  };

  return (
    <div className="podcasts-view">
      {available && (
        <audio
          ref={audioRef}
          src={currentFiles.audio}
          crossOrigin="anonymous"
          preload="auto"
          onPlay={() => {
            setIsPlaying(true);
            onPlayingChange?.(true);
          }}
          onPlaying={() => {
            setIsPlaying(true);
            onPlayingChange?.(true);
          }}
          onPause={() => {
            setIsPlaying(false);
            onPlayingChange?.(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            onPlayingChange?.(false);
          }}
          onLoadedMetadata={(e) => {
            const a = e.target as HTMLAudioElement;
            const d = a.duration;
            if (d && isFinite(d) && d > 0) {
              audioDurationRef.current = d;
              setAudioDuration(d);
              updateProgress(a.currentTime, d);
            }
            if (autoPlay && a.paused) {
              handlePlay();
            }
          }}
          onDurationChange={(e) => {
            const a = e.target as HTMLAudioElement;
            const d = a.duration;
            if (d && isFinite(d) && d > 0) {
              audioDurationRef.current = d;
              setAudioDuration(d);
              updateProgress(a.currentTime, d);
            }
          }}
          onCanPlay={(e) => {
            const a = e.target as HTMLAudioElement;
            const d = a.duration;
            if (d && isFinite(d) && d > 0) {
              audioDurationRef.current = d;
              setAudioDuration(d);
              updateProgress(a.currentTime, d);
            }
            if (autoPlay && a.paused) {
              handlePlay();
            }
          }}
        />
      )}

      {/* ── Fixed top section: track selector toggle ── */}
      <div className="podcast-sticky-top">
        {renderSegmentedTrackToggle()}
      </div>

      {/* ── 1. Top Section: Episode Playlist (Microcasts list stack or Single podcast card) ── */}
      {selectedTrack === "mc" ? (
        <div className="pod-episode-list-wrap">
          <div className="pod-episode-list-header">
            MICROCASTS · STANDARD DEPTH (auto-filtered — {MICROCASTS.length} of {MICROCASTS.length} match)
          </div>
          <div className="pod-episode-list-stack">
            {MICROCASTS.map((item, idx) => {
              const isItemActive = selectedMc === idx;
              const isItemHeard = idx < selectedMc;
              const isPlayingItem = isItemActive && playing;

              return (
                <div
                  key={idx}
                  className={`pod-episode-card ${isItemActive ? "active" : ""}`}
                  onClick={() => {
                    if (selectedMc !== idx) {
                      setSelectedMc(idx);
                      setTimeout(() => {
                        if (audioRef.current) {
                          audioRef.current.play().then(() => {
                            setIsPlaying(true);
                            onPlayingChange?.(true);
                          }).catch(() => {});
                        }
                      }, 50);
                    } else {
                      handlePlayToggle();
                    }
                  }}
                >
                  <div className="pod-episode-left">
                    <button
                      type="button"
                      className="pod-episode-play-circle"
                      aria-label={isPlayingItem ? "Pause" : "Play"}
                    >
                      {isPlayingItem ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                          <rect x="1" y="1" width="3" height="8" rx="1" />
                          <rect x="6" y="1" width="3" height="8" rx="1" />
                        </svg>
                      ) : isItemActive ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: "1px" }}>
                          <polygon points="2,1 8,5 2,9" />
                        </svg>
                      ) : (
                        <span className="pod-episode-index-num">{idx + 1}</span>
                      )}
                    </button>

                    <div className="pod-episode-info">
                      <span className="pod-episode-title">{item.title}</span>
                      <div className="pod-episode-meta">
                        {isItemActive ? (
                          <>
                            <span style={{ fontWeight: 600 }}>
                              {playing ? "Playing" : "Paused"} · {fmtTime(currentTime)} of {displayDuration ? fmtTime(displayDuration) : "--:--"}
                            </span>
                            <span>·</span>
                            <span>Recap: 3 questions</span>
                            <span>·</span>
                            <span>Links to Read §{idx + 1}</span>
                          </>
                        ) : isItemHeard ? (
                          <>
                            <span className="pod-episode-badge-heard">✓ Heard</span>
                            <span>·</span>
                            <span>Recap done ✓</span>
                            <span>·</span>
                            <span>Links to Read §{idx + 1}</span>
                          </>
                        ) : (
                          <>
                            {idx === 1 && <span className="pod-episode-badge-resume">Resume at 0:48</span>}
                            <span>{idx === 1 ? "2:10" : idx === 3 ? "2:44" : idx === 4 ? "3:35" : "1:36"}</span>
                            <span>·</span>
                            <span>Links to Read §{idx + 1}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pod-episode-right">
                    {isItemHeard && (
                      <div className="pod-episode-check-icon" title="Completed">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pod-episode-list-wrap">
          <div className="pod-episode-list-header">
            {selectedTrack === "dl" || selectedTrack === "long" ? "DETAILED LISTEN · IN-DEPTH" : "QUICK LISTEN · STANDARD DEPTH"} (1 of 1 match)
          </div>
          <div className="pod-episode-list-stack">
            <div className="pod-episode-card active" onClick={handlePlayToggle}>
              <div className="pod-episode-left">
                <button
                  type="button"
                  className="pod-episode-play-circle"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <rect x="1" y="1" width="3" height="8" rx="1" />
                      <rect x="6" y="1" width="3" height="8" rx="1" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ marginLeft: "1px" }}>
                      <polygon points="2,1 8,5 2,9" />
                    </svg>
                  )}
                </button>

                <div className="pod-episode-info">
                  <span className="pod-episode-title">{displayTitle}</span>
                  <div className="pod-episode-meta">
                    <span style={{ fontWeight: 600 }}>
                      {playing ? "Playing" : "Paused"} · {fmtTime(currentTime)} of {displayDuration ? fmtTime(displayDuration) : "--:--"}
                    </span>
                    <span>·</span>
                    <span>Complete chapter coverage</span>
                    <span>·</span>
                    <span>Links to Read §1-§5</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* ── 2. Middle Section: The Exact Horizontal Player Bar ── */}
      <div className="pod-exact-player-bar">
        {/* Left: Headphone Icon + Title + Episode Subtitle */}
        <div className="pod-player-left">
          <div className="pod-player-headphone-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <div className="pod-player-meta">
            <span className="pod-player-title">{displayTitle}</span>
            <span className="pod-player-subtitle">{displaySubtitle}</span>
          </div>
        </div>

        {/* Transport Controls: ↺15, Play/Pause, 30↻, 1x */}
        <div className="pod-player-transport">
          <button className="pod-transport-btn" onClick={handleRewind15} title="Rewind 15 seconds">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span>15</span>
          </button>

          <button className="pod-main-play-btn" onClick={handlePlayToggle} title={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="5" y="4" width="4.5" height="16" rx="1.5" />
                <rect x="14.5" y="4" width="4.5" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button className="pod-transport-btn" onClick={handleForward30} title="Forward 30 seconds">
            <span>30</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>

          <button className="pod-speed-pill" onClick={handleToggleSpeed} title="Playback speed">
            {playbackRate}x
          </button>
        </div>

        {/* Waveform Scrubber + Timestamp */}
        <div className="pod-player-waveform-wrap" onClick={handleWaveformClick} title="Click anywhere to seek">
          <div className="pod-player-waveform-bars">
            {PENCIL_WAVEFORM_BARS.map((h, i) => {
              const barPct = (i / PENCIL_WAVEFORM_BARS.length) * 100;
              const isBarActive = barPct <= progressPct;
              return (
                <div
                  key={i}
                  className={`pod-waveform-bar ${isBarActive ? "active" : ""}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
          <span className="pod-player-time">
            {fmtTime(currentTime)} / {displayDuration ? fmtTime(displayDuration) : "--:--"}
          </span>
        </div>

        {/* Right Controls: ⏱ Timer + Volume */}
        <div className="pod-player-right">
          <button className="pod-timer-btn" onClick={handleToggleSleepTimer} title={sleepTimerMinutes ? `Timer set for ${sleepTimerMinutes}m` : "Set sleep timer"}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{sleepTimerMinutes ? `${sleepTimerMinutes}m` : "Timer"}</span>
          </button>

          <div className="pod-player-volume">
            <button className="pod-vol-icon-btn" onClick={() => {
              const next = !isMutedUi;
              setIsMutedUi(next);
              if (audioRef.current) audioRef.current.muted = next;
            }}>
              {isMutedUi || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>
            <div className="pod-vol-track">
              <div className="pod-vol-fill" style={{ width: `${(isMutedUi ? 0 : volume) * 100}%` }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMutedUi ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="pod-vol-input"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Bottom Section: Split 2-Column Layout ── */}
      <div className="pod-split-layout">
        {/* Left Column: Interactive Transcript */}
        <div className="pod-transcript-card">
          <div className="pod-transcript-header">
            <div className="pod-transcript-title-wrap">
              <strong className="pod-transcript-title">Transcript</strong>
              <span className="pod-transcript-subtitle">karaoke sync · click any word to jump · dotted terms tap-to-define</span>
            </div>
            <label className="pod-autofollow-label">
              <input
                type="checkbox"
                checked={autoFollow}
                onChange={(e) => setAutoFollow(e.target.checked)}
              />
              <span>Auto-follow</span>
            </label>
          </div>

          <div className="pod-transcript-body" ref={transcriptRef}>
            {transcript ? (
              <div className="transcript-box transcript-body" ref={transcriptBoxRef} onClick={handleWordClick}>
                {transcriptTokens.map((token, idx) => {
                  const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);
                  if (!isWord) {
                    return <span key={idx}>{token}</span>;
                  }
                  const cleanWord = token.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const def = getTermDefinition(cleanWord);
                  if (def) {
                    return (
                      <span key={idx} className="transcript-word">
                        <DottedTerm definition={def} isPurpleTheme={false}>
                          {token}
                        </DottedTerm>
                      </span>
                    );
                  }
                  return (
                    <span key={idx} className="transcript-word">
                      {token}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading transcript…</p>
            )}
          </div>
        </div>

        {/* Right Column: Contextual Sidebar Panel */}
        <div className="pod-sidebar-panel">
          {/* Card 1: FOLLOW ALONG IN READ (Relate to Topics / Modules) */}
          <div className="pod-follow-card">
            <div className="pod-sidebar-card-header">
              <span>Follow Along In Read</span>
              <span style={{ fontSize: "10.5px", color: "var(--primary, #365345)", fontWeight: 700, letterSpacing: "0.02em" }}>
                Topic {activeSectionInfo.moduleNumber} of {Math.max(1, modulesList.length)}
              </span>
            </div>

            {/* Module Switcher Pills */}
            {modulesList.length > 1 && (
              <div className="pod-module-switcher">
                {modulesList.map((mod) => {
                  const isModActive = mod.module === activeSectionInfo.moduleNumber;
                  return (
                    <button
                      key={mod.module}
                      type="button"
                      className={`pod-mod-btn ${isModActive ? "active" : ""}`}
                      onClick={() => {
                        if (selectedModuleOverride === mod.module) {
                          setSelectedModuleOverride(null);
                        } else {
                          setSelectedModuleOverride(mod.module);
                          if (selectedTrack === "mc" && mod.module - 1 < MICROCASTS.length) {
                            setSelectedMc(mod.module - 1);
                          }
                        }
                      }}
                      title={isModActive && selectedModuleOverride !== null ? "Click again to resume auto-following" : `Focus Module ${mod.module}: ${mod.title}`}
                    >
                      M{mod.module}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active Topic Banner */}
            <div className="pod-topic-banner">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="pod-topic-badge">
                  Module {activeSectionInfo.moduleNumber} · Topic Focus
                </span>
                {selectedModuleOverride !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedModuleOverride(null)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#166534",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                    title="Resume auto-following playback"
                  >
                    Auto-follow ↺
                  </button>
                )}
              </div>
              <div className="pod-topic-title">
                {activeSectionInfo.title}
              </div>
            </div>

            {/* Topic-Specific Action Cards */}
            <div className="pod-follow-items">
              {/* 1. Core Module Study Guide */}
              <div
                className="pod-follow-item active"
                onClick={() => handleNavigateToRead(activeSectionInfo.sectionNumber)}
                title={`Jump directly to Module ${activeSectionInfo.moduleNumber} in Read`}
              >
                <div className="pod-follow-item-info">
                  <span className="pod-follow-kind">Module Study Guide</span>
                  <span className="pod-follow-title">
                    §{activeSectionInfo.sectionNumber} {activeSectionInfo.shortTitle}
                  </span>
                </div>
                <span className="pod-follow-badge">Read Module {activeSectionInfo.moduleNumber} →</span>
              </div>

              {/* 2. Visual Architecture Diagram */}
              <div
                className="pod-follow-item"
                onClick={() => handleNavigateToRead(activeSectionInfo.sectionNumber)}
                title={`Open diagram for Module ${activeSectionInfo.moduleNumber} in Read`}
              >
                <div className="pod-follow-item-info">
                  <span className="pod-follow-kind">Visual Architecture</span>
                  <span className="pod-follow-title">
                    {activeSectionInfo.figureNo}: {activeSectionInfo.figureTitle}
                  </span>
                </div>
                <span className="pod-follow-badge">Inspect Diagram →</span>
              </div>

              {/* 4. Quick Check Concept Question */}
              {activeSectionInfo.quickCheck && (
                <div
                  className="pod-follow-item"
                  onClick={() => handleNavigateToRead(activeSectionInfo.sectionNumber)}
                  title={`Practice Module ${activeSectionInfo.moduleNumber} concept check in Read`}
                >
                  <div className="pod-follow-item-info">
                    <span className="pod-follow-kind">Knowledge Check</span>
                    <span className="pod-follow-title">
                      Quick Check · Module {activeSectionInfo.moduleNumber} Test
                    </span>
                  </div>
                  <span className="pod-follow-badge">Practice Check →</span>
                </div>
              )}

              {/* Other Chapter Topics Quick Switch */}
              {activeSectionInfo.upcomingModules.map((upMod) => (
                <div
                  key={upMod.module}
                  className="pod-follow-item"
                  onClick={() => {
                    setSelectedModuleOverride(upMod.module);
                    if (selectedTrack === "mc" && upMod.module - 1 < MICROCASTS.length) {
                      setSelectedMc(upMod.module - 1);
                    }
                  }}
                  title={`Focus Topic ${upMod.module}: ${upMod.title}`}
                >
                  <div className="pod-follow-item-info">
                    <span className="pod-follow-kind">Curriculum Topic</span>
                    <span className="pod-follow-title">
                      §{upMod.sectionNumber} {upMod.shortTitle}
                    </span>
                  </div>
                  <span className="pod-follow-badge-muted">Topic {upMod.module} →</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: THIS EPISODE */}
          <div className="pod-episode-meta-card">
            <div className="pod-sidebar-card-header">THIS EPISODE</div>
            <div className="pod-episode-meta-rows">
              <div className="pod-episode-meta-row main">
                {displayDuration ? fmtTime(displayDuration) : "--:--"} · {selectedTrack === "dl" || selectedTrack === "long" ? "Detailed Study" : selectedTrack === "mc" ? "Focused Microcast" : "Standard Depth"}
              </div>
              <div className="pod-episode-meta-row muted">
                {selectedTrack === "mc"
                  ? "Heard 2× by most students"
                  : selectedTrack === "dl" || selectedTrack === "long"
                  ? "Complete curriculum breakdown"
                  : `High-yield exam recap · ${sections.length > 0 ? `${sections.length} modules` : "All topics"}`}
              </div>
              <div className="pod-episode-meta-row muted">
                {activeSectionInfo.quickCheck
                  ? `Quick Check: "${activeSectionInfo.quickCheck.stem.length > 38 ? activeSectionInfo.quickCheck.stem.slice(0, 36) + "…" : activeSectionInfo.quickCheck.stem}"`
                  : "3 recap questions attached"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
