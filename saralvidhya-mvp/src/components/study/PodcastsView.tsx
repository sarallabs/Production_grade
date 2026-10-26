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
import { getRegistryChapterData } from "@/data/manifestService";
import { cloudStorage } from "@/context/CloudStateContext";

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

// Connected zig-zag waveform geometry matching the exact reference wave
const OSCILLOSCOPE_WAVE = (() => {
  const width = 520;
  const height = 36;
  const cy = height / 2;
  const count = 64;
  // Repeating 8-point motif: medium zig-zag, tall peak/valley, shallow kink, tallest peak/valley
  const motifOffsets = [-4.5, 5.5, -9.5, 9.5, -3.5, 2.5, -11, 11.5];
  const pts: string[] = [];

  for (let i = 0; i <= count; i++) {
    const x = Number(((i / count) * width).toFixed(1));
    if (i === 0) {
      pts.push(`${x},${cy + 1}`);
      continue;
    }
    if (i === count) {
      pts.push(`${x},${cy}`);
      continue;
    }
    const offset = motifOffsets[(i - 1) % motifOffsets.length];
    const y = Number((cy + offset).toFixed(1));
    pts.push(`${x},${y}`);
  }

  return {
    width,
    height,
    cy,
    polylinePoints: pts.join(" "),
  };
})();

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
  subjectName?: string;
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
  subjectName,
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
  const [chapterFiles, setChapterFiles] = useState<Record<string, string>>({});
  const [isRegistryResolved, setIsRegistryResolved] = useState<boolean>(false);
  const [selectedModuleOverride, setSelectedModuleOverride] = useState<number | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;
    setIsRegistryResolved(false);

    Promise.all([
      getManifest().catch(() => null),
      getRegistryChapterData(subjectId, chapterNumber).catch(() => null),
    ]).then(([m, reg]) => {
      if (cancelled) return;
      let ch: Chapter | undefined;
      if (m) {
        const list = getChapters(m, subjectId);
        ch = list.find((c) => c.number === chapterNumber);
        if (ch?.dir) {
          setChapterDir(ch.dir);
        }
        if (ch) {
          setCurrentChapterInfo(ch);
        }
      }
      const nextFiles = reg?.files ? reg.files : {};
      setChapterFiles(nextFiles);

      // Re-validate saved track once registry/manifest have hydrated so "mc" is preserved on refresh
      const hasRegPods = Object.keys(nextFiles).some((k) => k.startsWith("podcasts/"));
      const isMultiTrack =
        hasRegPods ||
        subjectId.startsWith("neb_") ||
        subjectId === "management" ||
        GCS_BACKEND_SUBJECTS.has(subjectId) ||
        Boolean(ch?.topics && ch.topics.length > 0) ||
        Boolean(reg?.chapter?.topics && reg.chapter.topics.length > 0);

      if (resumeTrack === "ql" || resumeTrack === "dl" || resumeTrack === "mc" || resumeTrack === "short" || resumeTrack === "long") {
        setSelectedTrack(resumeTrack);
      } else {
        const saved = cloudStorage.getItem(`last_track_${subjectId}_${chapterNumber}_${persona}`);
        if (isMultiTrack) {
          if (saved === "ql" || saved === "dl" || saved === "mc") {
            setSelectedTrack(saved);
          } else {
            setSelectedTrack((prev) => (prev === "ql" || prev === "dl" || prev === "mc" ? prev : "mc"));
          }
        }
      }

      setIsRegistryResolved(true);
    });

    return () => {
      cancelled = true;
    };
  }, [subjectId, chapterNumber]);

  const isNebBiologyChap6 = subjectId === "neb_xii_biology" && chapterNumber === 6;
  const hasRegistryPodcasts = useMemo(
    () => Object.keys(chapterFiles).some((k) => k.startsWith("podcasts/")),
    [chapterFiles],
  );
  const isNebOrMgmt =
    hasRegistryPodcasts ||
    subjectId.startsWith("neb_") ||
    subjectId === "management" ||
    GCS_BACKEND_SUBJECTS.has(subjectId) ||
    Boolean(currentChapterInfo?.topics && currentChapterInfo.topics.length > 0);

  const getSavedTrack = (): string => {
    if (resumeTrack === "ql" || resumeTrack === "dl" || resumeTrack === "mc" || resumeTrack === "short" || resumeTrack === "long") {
      return resumeTrack;
    }
    const saved = cloudStorage.getItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
    );
    if (saved === "mc" || saved === "ql" || saved === "dl") {
      return saved;
    }
    if (isNebOrMgmt) {
      return "mc";
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

  const completedStorageKey = `sv_listen_done_${subjectId}_ch${chapterNumber}_${selectedTrack}`;
  const [completedEpisodes, setCompletedEpisodes] = useState<Set<number>>(() => {
    try {
      const raw = cloudStorage.getItem(completedStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set();
  });

  useEffect(() => {
    try {
      const raw = cloudStorage.getItem(completedStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCompletedEpisodes(new Set(parsed));
          return;
        }
      }
    } catch {
      // ignore
    }
    setCompletedEpisodes(new Set());
  }, [completedStorageKey]);

  const markEpisodeDone = useCallback(
    (idx: number) => {
      setCompletedEpisodes((prev) => {
        if (prev.has(idx)) return prev;
        const next = new Set(prev);
        next.add(idx);
        try {
          cloudStorage.setItem(completedStorageKey, JSON.stringify(Array.from(next)));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [completedStorageKey],
  );

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
    // 1. Dynamic topic outline from registry/catalog v2
    if (currentChapterInfo?.topics && currentChapterInfo.topics.length > 0) {
      return currentChapterInfo.topics.map((t, i) => ({
        title: `${i + 1}. ${t.label}`,
        audio: `microcast_${String(i + 1).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(i + 1).padStart(2, "0")}.md`,
      }));
    }
    // 2. Fallback to sectionized read sections when manifest topics haven't populated yet
    const validReadSections = (readData?.sections || []).filter((s) => s.sectionNumber > 0);
    if (validReadSections.length > 0 && !isNebBiologyChap6) {
      return validReadSections.map((s, i) => ({
        title: `${i + 1}. ${s.title.replace(/^\d+[\.\)]\s*/, "")}`,
        audio: `microcast_${String(i + 1).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(i + 1).padStart(2, "0")}.md`,
      }));
    }
    // 3. Fallback to discovering microcast keys directly from chapterFiles
    const mcNums = new Set<number>();
    for (const k of Object.keys(chapterFiles)) {
      const m = k.match(/^podcasts\/microcast_(\d+)\./);
      if (m) mcNums.add(parseInt(m[1], 10));
    }
    if (mcNums.size > 0) {
      const sorted = Array.from(mcNums).sort((a, b) => a - b);
      return sorted.map((num, idx) => ({
        title: `${idx + 1}. Topic ${num}`,
        audio: `microcast_${String(num).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(num).padStart(2, "0")}.md`,
      }));
    }
    if (isNebBiologyChap6) {
      return [
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
      ];
    }
    if (hasRegistryPodcasts || GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [
        { title: "1. Topic Overview", audio: "microcast_01.m4a", txt: "microcast_01.md" }
      ];
    }
    return [
      { title: "1. Topic Overview", audio: "MC1.mp3", txt: "MC1.txt" }
    ];
  }, [currentChapterInfo, readData?.sections, chapterFiles, isNebBiologyChap6, hasRegistryPodcasts, subjectId]);

  const DETAILED_LISTENS = useMemo(() => {
    if (hasRegistryPodcasts || GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: `1. ${chapterName || "Chapter"} Complete Coverage`, audio: "long_podcast.m4a", txt: "long_podcast.md" }];
    }
    return isNebBiologyChap6 ? [
      { title: "1. Animal Tissue Complete Coverage", audio: "DL_Animal Tissue Podcast.mp3", txt: "DL_Animal Tissue Podcast.txt" }
    ] : [
      { title: "1. Chapter Complete Coverage", audio: "DL.mp3", txt: "DL.txt" }
    ];
  }, [hasRegistryPodcasts, isNebBiologyChap6, chapterName, subjectId]);

  const QUICK_LISTENS = useMemo(() => {
    if (hasRegistryPodcasts || GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: `1. ${chapterName || "Chapter"} Quick Recap`, audio: "short_podcast.m4a", txt: "short_podcast.md" }];
    }
    return isNebBiologyChap6 ? [
      { title: "1. The Four Pillars of Animal Tissue", audio: "QL_The_Four_Pillars_of_Animal_Tissue.mp3", txt: "QL_The_Four_Pillars_of_Animal_Tissue.txt" }
    ] : [
      { title: "1. Chapter Quick Recap", audio: "QL.mp3", txt: "QL.txt" }
    ];
  }, [hasRegistryPodcasts, isNebBiologyChap6, chapterName, subjectId]);

  useEffect(() => {
    if (!isRegistryResolved) return;
    cloudStorage.setItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
      selectedTrack,
    );
  }, [selectedTrack, subjectId, chapterNumber, persona, isRegistryResolved]);

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
  const userId = cloudStorage.getItem("app_user_id") || "anonymous";

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

    const savedData = cloudStorage.getItem(
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
      console.warn("Failed to restore cloud audio progress:", error);
    }
  }, [available, lessonId, userId]);

  /** Resolve filenames via registry chapterFiles signed URLs first, then fallback */
  const getFileNames = useCallback((track: string): { audio: string; transcript: string; jsonTranscript?: string; fromRegistry?: boolean } => {
    // 1. Registry signed URLs (100% cloud-native contract/v1)
    if (hasRegistryPodcasts) {
      if (track === "dl" || track === "long") {
        const audio = chapterFiles["podcasts/long_podcast.m4a"] || chapterFiles["podcasts/long_podcast.mp3"];
        const transcript = chapterFiles["podcasts/long_podcast.md"] || chapterFiles["podcasts/long_podcast.txt"];
        const jsonTranscript = chapterFiles["podcasts/long_podcast.transcript.json"];
        if (audio || transcript || jsonTranscript) {
          return {
            audio: audio || "",
            transcript: transcript || jsonTranscript || "",
            jsonTranscript,
            fromRegistry: Boolean(audio),
          };
        }
      }
      if (track === "ql" || track === "short") {
        const audio = chapterFiles["podcasts/short_podcast.m4a"] || chapterFiles["podcasts/short_podcast.mp3"];
        const transcript = chapterFiles["podcasts/short_podcast.md"] || chapterFiles["podcasts/short_podcast.txt"];
        const jsonTranscript = chapterFiles["podcasts/short_podcast.transcript.json"];
        if (audio || transcript || jsonTranscript) {
          return {
            audio: audio || "",
            transcript: transcript || jsonTranscript || "",
            jsonTranscript,
            fromRegistry: Boolean(audio),
          };
        }
      }
      if (track === "mc") {
        const pad = String(selectedMc + 1).padStart(2, "0");
        const audio = chapterFiles[`podcasts/microcast_${pad}.m4a`] || chapterFiles[`podcasts/microcast_${pad}.mp3`];
        const transcript = chapterFiles[`podcasts/microcast_${pad}.md`] || chapterFiles[`podcasts/microcast_${pad}.txt`];
        const jsonTranscript = chapterFiles[`podcasts/microcast_${pad}.transcript.json`];
        if (audio || transcript || jsonTranscript) {
          return {
            audio: audio || "",
            transcript: transcript || jsonTranscript || "",
            jsonTranscript,
            fromRegistry: Boolean(audio),
          };
        }
      }
    }

    // 2. Fallback for non-migrated subjects
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
      const fileName = track === "long" ? "long_podcast" : "short_podcast";
      return {
        audio: `${gcsBasePath}/${fileName}.m4a`,
        transcript: `${gcsBasePath}/${fileName}.md`,
      };
    }

    if (subjectId.startsWith("neb_") || subjectId === "management") {
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
      if (chapterNumber <= 3) {
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
      const base = `${basePath}/Science_Chapter_${chapterPad}_${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "english") {
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
      const base = `${basePath}/ch${chapterNumber}-${track}`;
      return { audio: `${base}.m4a`, transcript: `${base}.txt` };
    }
    if (subjectId === "maths") {
      const base = `${basePath}/ch${chapterNumber}-${track}-${persona}`;
      return { audio: `${base}.mp3`, transcript: `${base}.txt` };
    }
    const base = `${basePath}/ch${chapterNumber}-${track}`;
    return { audio: `${base}.m4a`, transcript: `${base}.txt` };
  }, [hasRegistryPodcasts, chapterFiles, selectedMc, selectedDl, selectedQl, subjectId, subjectBaseUrl, chapterDir, DETAILED_LISTENS, QUICK_LISTENS, MICROCASTS, persona, basePath, chapterNumber, chapterPad]);

  const tracks = {
    long: { label: "Long Podcast", desc: "In-depth Chapter Coverage" },
    short: { label: "Short Podcast", desc: "Brief Recap of Key Points" },
  };

  // ── Check availability once per chapter/subject change ──
  useEffect(() => {
    const NEB_TTS_SUBJECTS = [
      "advanced_financial_management",
    ];
    if (NEB_TTS_SUBJECTS.includes(subjectId)) {
      setAvailable(false);
      return;
    }
    if (!isRegistryResolved) {
      setAvailable(null);
      return;
    }
    let cancelled = false;
    const resolved = getFileNames(selectedTrack);
    if (resolved.fromRegistry && resolved.audio) {
      setAvailable(true);
      return;
    }
    if (!resolved.audio) {
      setAvailable(false);
      return;
    }
    setAvailable(null);
    fetch(resolved.audio, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        const ct = res.headers.get("content-type") || "";
        const hasAudio = res.ok && !ct.includes("text/html");
        setAvailable(hasAudio);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId, chapterNumber, persona, selectedTrack, chapterDir, selectedMc, selectedDl, selectedQl, getFileNames, isRegistryResolved]);

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
      progressFillRef.current.style.clipPath = `inset(0 ${Math.max(0, 100 - pct)}% 0 0)`;
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
    if (!subjectId || !isRegistryResolved) return;
    let cancelled = false;
    setTranscript(null);
    setTranscriptSegments(null);
    setTranscriptDuration(null);

    const { transcript: tFile, jsonTranscript } = getFileNames(selectedTrack);

    const tryFetchJson = async (url: string) => {
      const r = await fetch(url);
      const ct = r.headers.get("content-type") || "";
      if (!r.ok || ct.includes("text/html")) throw new Error("not json");
      const txt = await r.text();
      const parsed = JSON.parse(txt);
      if (cancelled) return true;
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
      if (cancelled) return true;
      setTranscript(cleanTranscriptPreamble(txt));
      setTranscriptSegments(null);
      return true;
    };

    const loadTranscript = async () => {
      const allJsonCandidates = [
        ...(jsonTranscript ? [jsonTranscript] : []),
        ...(tFile.endsWith(".json") ? [tFile] : []),
      ];

      for (const cand of allJsonCandidates) {
        try {
          const ok = await tryFetchJson(cand);
          if (ok) return;
        } catch {
          // try next json candidate
        }
      }

      if (tFile) {
        try {
          await tryFetchMd(tFile);
          return;
        } catch {
          // fall through
        }
      }

      // If microcast transcript wasn't found via direct URL, fall back to sectionized read content for that topic
      if (selectedTrack === "mc") {
        const validSecs = (readData?.sections || []).filter((s) => s.sectionNumber > 0);
        const secForMc = validSecs[selectedMc] || validSecs[0];
        if (secForMc?.content && !cancelled) {
          setTranscript(cleanTranscriptPreamble(secForMc.content));
          setTranscriptSegments(null);
          return;
        }
      }

      // Fallback to getResourceContent
      try {
        const script = await getResourceContent(
          subjectId,
          chapterNumber,
          selectedTrack === "long" || selectedTrack === "dl" ? "long_podcast.md" : "short_podcast.md",
          persona as DifficultyLevel,
        );
        if (cancelled) return;
        if (script && !script.includes("Content not available")) {
          setTranscript(cleanTranscriptPreamble(script));
        } else {
          setTranscript("Content not available.");
        }
        setTranscriptSegments(null);
      } catch {
        if (!cancelled) {
          setTranscript("Content not available.");
          setTranscriptSegments(null);
        }
      }
    };

    loadTranscript();
    return () => {
      cancelled = true;
    };
  }, [selectedTrack, selectedMc, selectedDl, selectedQl, subjectId, chapterNumber, persona, chapterDir, getFileNames, isRegistryResolved, readData?.sections]);

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
            label: "Essentials",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9.5" />
                <polyline points="12 6.5 12 12 15.5 14" />
              </svg>
            ),
          },
          {
            key: "dl",
            label: "In-depth",
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
            label: "Essentials",
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9.5" />
                <polyline points="12 6.5 12 12 15.5 14" />
              </svg>
            ),
          },
          {
            key: "long",
            label: "In-depth",
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
          display: "inline-flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexShrink: 0,
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
            background: "#FFFFFF",
            borderRadius: "9999px",
            padding: "4px",
            border: "1px solid #DED8CA",
            boxShadow: "0 1px 3px rgba(30, 40, 34, 0.05)",
            gap: "0px",
            maxWidth: "100%",
            overflowX: "auto",
          }}
        >
          {/* Smooth sliding pill indicator colored with dark forest theme */}
          <div
            className="pod-segmented-indicator"
            style={{
              position: "absolute",
              top: "4px",
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              height: "calc(100% - 8px)",
              borderRadius: "9999px",
              background: "#2D3E36",
              boxShadow: "0 2px 6px rgba(30, 40, 34, 0.22)",
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
                  gap: "6px",
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  border: "none",
                  outline: "none",
                  background: isActive
                    ? isIndicatorSettled
                      ? "transparent"
                      : "#2D3E36"
                    : "transparent",
                  color: isActive ? "#FFFFFF" : "#4A554E",
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 600,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "color 0.22s ease, background 0.15s ease",
                  opacity: isDisabled ? 0.35 : 1,
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
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
    if (selectedTrack === "ql" || selectedTrack === "short") return "Essentials";
    if (selectedTrack === "dl" || selectedTrack === "long") return "In-depth";
    if (selectedTrack === "mc") return "Microcast";
    return "Podcast";
  })();

  const activeEpisodesList = (() => {
    if (selectedTrack === "mc") return MICROCASTS;
    if (selectedTrack === "dl" || selectedTrack === "long") return DETAILED_LISTENS;
    return QUICK_LISTENS;
  })();

  const activeEpisodeIdx = (() => {
    if (selectedTrack === "mc") return selectedMc;
    if (selectedTrack === "dl" || selectedTrack === "long") return selectedDl;
    return selectedQl;
  })();

  const displayTitle = (() => {
    if (selectedTrack === "ql" || selectedTrack === "short") {
      return QUICK_LISTENS[selectedQl]?.title || "1. Chapter Quick Recap";
    }
    if (selectedTrack === "dl" || selectedTrack === "long") {
      return DETAILED_LISTENS[selectedDl]?.title || "1. Chapter Complete Coverage";
    }
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

  const handleSelectEpisode = (idx: number) => {
    if (selectedTrack === "mc") {
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
    } else if (selectedTrack === "dl" || selectedTrack === "long") {
      if (selectedDl !== idx) {
        setSelectedDl(idx);
      } else {
        handlePlayToggle();
      }
    } else {
      if (selectedQl !== idx) {
        setSelectedQl(idx);
      } else {
        handlePlayToggle();
      }
    }
  };

  const totalEpisodes = Math.max(1, activeEpisodesList.length);
  const completedCount = activeEpisodesList.reduce((acc, _, idx) => {
    const isDone = completedEpisodes.has(idx) || (selectedTrack === "mc" && idx < selectedMc);
    return acc + (isDone ? 1 : 0);
  }, 0);
  const activePartialFraction =
    completedEpisodes.has(activeEpisodeIdx) || (selectedTrack === "mc" && activeEpisodeIdx < selectedMc)
      ? 0
      : Math.min(1, Math.max(0, progressPct / 100));
  const listenProgressPercent = Math.min(
    100,
    Math.round(((completedCount + activePartialFraction) / totalEpisodes) * 100),
  );
  const accentColor = "#15803d";

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

  const handleWordClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const tsBtn = (e.target as HTMLElement).closest("[data-seek-sec]") as HTMLElement | null;
    if (tsBtn && audioRef.current) {
      const seekSec = parseFloat(tsBtn.getAttribute("data-seek-sec") || "0");
      if (!isNaN(seekSec) && seekSec >= 0) {
        audioRef.current.currentTime = seekSec;
        setCurrentTime(seekSec);
        updateProgress(seekSec, audioDurationRef.current || audioRef.current.duration || displayDuration || 0);
        if (audioRef.current.paused) {
          audioRef.current.play().then(() => {
            setIsPlaying(true);
            onPlayingChange?.(true);
          }).catch(() => {});
        }
      }
      return;
    }
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
            markEpisodeDone(activeEpisodeIdx);
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

      {/* ── Top Header Bar: Left Breadcrumb + Right Track Toggle (No Personas) ── */}
      <div
        className="podcast-sticky-top"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          paddingBottom: "12px",
          marginBottom: "16px",
          borderBottom: "1px solid #E6E1D6",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13.5px",
            color: "#6E7670",
            fontWeight: 500,
            minWidth: 0,
          }}
        >
          <span style={{ whiteSpace: "nowrap" }}>
            {subjectName || subjectId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span style={{ color: "#ABA59A" }}>›</span>
          <strong
            style={{
              color: "#1E2822",
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Chapter {chapterNumber}: {chapterName}
          </strong>
        </div>

        {renderSegmentedTrackToggle()}
      </div>

      {/* ── Section-Wise 2-Column Layout (Matching New Listen Screen) ── */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          width: "100%",
          margin: 0,
          padding: "0 0 40px",
          boxSizing: "border-box",
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT NAVIGATION SIDEBAR ── */}
        <div
          style={{
            width: "268px",
            flexShrink: 0,
            position: "sticky",
            top: "8px",
            alignSelf: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 10,
          }}
        >
          {/* Dark Forest Listening Guide Pill */}
          <div
            style={{
              background: "#2D3E36",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "9px 16px",
              fontSize: "12.5px",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "0.01em",
              boxShadow: "0 2px 6px rgba(30, 40, 34, 0.12)",
            }}
          >
            {completedCount > 0 || currentTime > 5 ? "Resumed where you left off" : "Listening Guide"}
          </div>

          {/* IN THIS CHAPTER Checklist Card */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E6E1D6",
              padding: "16px 12px",
              boxShadow: "0 4px 14px rgba(30, 40, 34, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#7A827C",
                padding: "0 8px 8px",
                borderBottom: "1px solid #EFECE4",
              }}
            >
              IN THIS CHAPTER
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {activeEpisodesList.map((item, idx) => {
                const isSelected = idx === activeEpisodeIdx;
                const isDone = completedEpisodes.has(idx) || (selectedTrack === "mc" && idx < selectedMc);
                const cleanEpisodeTitle = item.title.replace(/^\d+\.\s*/, "");

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectEpisode(idx)}
                    title={item.title}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: isSelected ? "1.5px solid #B7D3C4" : "1.5px solid transparent",
                      background: isSelected ? "#E5EFE9" : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      {isDone || isSelected ? (
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background: isDone ? "#2D3E36" : "transparent",
                            border: "1.5px solid #2D3E36",
                            color: isDone ? "#FFFFFF" : "#2D3E36",
                            fontSize: "11px",
                            fontWeight: 800,
                          }}
                        >
                          ✓
                        </span>
                      ) : (
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background: "transparent",
                            border: "1.5px solid #C8C2B6",
                          }}
                        />
                      )}

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isSelected ? 700 : isDone ? 600 : 500,
                          color: isSelected ? "#1E2822" : "#4A544E",
                          lineHeight: 1.35,
                        }}
                      >
                        {cleanEpisodeTitle}
                      </span>
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          background: "#B86B3D",
                          color: "#FFFFFF",
                          fontSize: "9px",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          padding: "3px 6px",
                          borderRadius: "5px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        YOU ARE HERE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress Bar Footer */}
            <div
              style={{
                marginTop: "10px",
                paddingTop: "12px",
                borderTop: "1px solid #EFECE4",
                paddingLeft: "6px",
                paddingRight: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6E7670",
                  marginBottom: "6px",
                }}
              >
                <span>Chapter progress</span>
                <span style={{ color: "#1E2822", fontWeight: 700 }}>{listenProgressPercent}%</span>
              </div>
              <div
                style={{
                  height: "6px",
                  width: "100%",
                  background: "#EFECE4",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${listenProgressPercent}%`,
                    background: "#7BAE94",
                    borderRadius: "999px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN CONTENT AREA ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            boxShadow: "none",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Meta Pills Line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                background: "#FFFFFF",
                color: "#2C3530",
                border: "1px solid #E2DDD3",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "12.5px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⏱</span>
              <span>{displayDuration ? `${Math.max(1, Math.round(displayDuration / 60))} min listen` : trackTypeLabel}</span>
            </span>
            <span
              style={{
                background: "#FFFFFF",
                color: "#2C3530",
                border: "1px solid #E2DDD3",
                borderRadius: "999px",
                padding: "4px 12px",
                fontSize: "12.5px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎧</span>
              <span>{totalEpisodes} {totalEpisodes === 1 ? "Podcast" : "Podcasts"}</span>
            </span>
          </div>

          {/* Active Podcast Section Header */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: "#4A7C62",
                  textTransform: "uppercase",
                }}
              >
                PODCAST {activeEpisodeIdx + 1} OF {totalEpisodes}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#1E2822",
                  lineHeight: "1.25",
                  margin: "0",
                }}
              >
                {displayTitle.replace(/^\d+\.\s*/, "")}
              </h2>
              <span
                style={{
                  background: "#FAF2E9",
                  color: "#B46530",
                  border: "1px solid #EBD5C3",
                  borderRadius: "999px",
                  padding: "3px 10px",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {trackTypeLabel} · FORMAT
              </span>
            </div>
          </div>

          {/* Horizontal Player Bar with Connected Oscilloscope Waveform */}
          <div
            className="pod-exact-player-bar"
            style={{
              marginBottom: 0,
              background: "#F9F6F0",
              border: "1px solid #E4DEC9",
              borderRadius: "16px",
              padding: "12px 18px",
              boxShadow: "0 2px 10px rgba(30, 40, 34, 0.04)",
            }}
          >
            {/* Left: Headphone Icon + Title + Episode Subtitle */}
            <div className="pod-player-left">
              <div
                className="pod-player-headphone-badge"
                style={{
                  background: "#EAE4D7",
                  color: "#2D3E36",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div className="pod-player-meta">
                <span className="pod-player-title" style={{ color: "#1E2822" }}>{displayTitle}</span>
                <span className="pod-player-subtitle" style={{ color: "#6E7670" }}>{displaySubtitle}</span>
              </div>
            </div>

            {/* Transport Controls: ↺15, Play/Pause, 30↻, 1x */}
            <div className="pod-player-transport">
              <button
                className="pod-transport-btn"
                onClick={handleRewind15}
                title="Rewind 15 seconds"
                style={{ borderColor: "#DED8CA", background: "#FFFFFF", color: "#2C3530" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <span>15</span>
              </button>

              <button
                className="pod-main-play-btn"
                onClick={handlePlayToggle}
                title={playing ? "Pause" : "Play"}
                style={{
                  background: "#9DC2AD",
                  color: "#182C22",
                  boxShadow: "0 3px 10px rgba(123, 174, 148, 0.35)",
                }}
              >
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

              <button
                className="pod-transport-btn"
                onClick={handleForward30}
                title="Forward 30 seconds"
                style={{ borderColor: "#DED8CA", background: "#FFFFFF", color: "#2C3530" }}
              >
                <span>30</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>

              <button
                className="pod-speed-pill"
                onClick={handleToggleSpeed}
                title="Playback speed"
                style={{ borderColor: "#DED8CA", background: "#FFFFFF", color: "#2C3530" }}
              >
                {playbackRate}x ▾
              </button>
            </div>

            {/* Connected Zig-Zag / Oscilloscope Waveform Scrubber + Timestamp */}
            <div className="pod-player-waveform-wrap" onClick={handleWaveformClick} title="Click anywhere to seek">
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  minWidth: "140px",
                }}
              >
                {/* Unplayed dark slate-charcoal zig-zag stroke */}
                <svg
                  viewBox={`0 0 ${OSCILLOSCOPE_WAVE.width} ${OSCILLOSCOPE_WAVE.height}`}
                  preserveAspectRatio="none"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    overflow: "visible",
                  }}
                >
                  <polyline
                    fill="none"
                    stroke="#59635D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="miter"
                    strokeMiterlimit="3"
                    vectorEffect="non-scaling-stroke"
                    points={OSCILLOSCOPE_WAVE.polylinePoints}
                  />
                </svg>

                {/* Played sage-green zig-zag stroke (clipped to progressPct%) */}
                <div
                  ref={progressFillRef}
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    clipPath: `inset(0 ${Math.max(0, 100 - progressPct)}% 0 0)`,
                  }}
                >
                  <svg
                    viewBox={`0 0 ${OSCILLOSCOPE_WAVE.width} ${OSCILLOSCOPE_WAVE.height}`}
                    preserveAspectRatio="none"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      overflow: "visible",
                    }}
                  >
                    <polyline
                      fill="none"
                      stroke="#98B7A5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                      strokeMiterlimit="3"
                      vectorEffect="non-scaling-stroke"
                      points={OSCILLOSCOPE_WAVE.polylinePoints}
                    />
                  </svg>
                </div>

                {/* Solid sage-green circular playhead dot */}
                <div
                  ref={playheadRef}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: `${progressPct}%`,
                    transform: "translate(-50%, -50%)",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: "#98B7A5",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
              </div>

              <span className="pod-player-time" style={{ color: "#4A544E", fontWeight: 700 }}>
                <span ref={currentTimeDisplayRef}>{fmtTime(currentTime)}</span> / {displayDuration ? fmtTime(displayDuration) : "--:--"}
              </span>
            </div>

            {/* Right Controls: ⏱ Timer + Volume */}
            <div className="pod-player-right">
              <button
                className="pod-timer-btn"
                onClick={handleToggleSleepTimer}
                title={sleepTimerMinutes ? `Timer set for ${sleepTimerMinutes}m` : "Set sleep timer"}
                style={{ borderColor: "#DED8CA", background: "#FFFFFF", color: "#2C3530" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{sleepTimerMinutes ? `${sleepTimerMinutes}m` : "Timer"} ▾</span>
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
                <div className="pod-vol-track" style={{ background: "#DED8CA" }}>
                  <div className="pod-vol-fill" style={{ width: `${(isMutedUi ? 0 : volume) * 100}%`, background: "#7BAE94" }} />
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

          {/* Full-Width Interactive Transcript Card */}
          <div
            className="pod-transcript-card"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #E6E1D6",
              borderRadius: "16px",
              background: "#FFFFFF",
              height: "420px",
              boxShadow: "0 4px 14px rgba(30, 40, 34, 0.03)",
            }}
          >
            <div className="pod-transcript-header" style={{ borderBottom: "1px solid #EFECE4" }}>
              <div className="pod-transcript-title-wrap" style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                <strong className="pod-transcript-title" style={{ color: "#1E2822", fontSize: "15px" }}>Transcript</strong>
                <span className="pod-transcript-subtitle" style={{ color: "#8A8479", fontSize: "12px" }}>
                  Click any timestamp to jump the audio to that point
                </span>
              </div>
              <label className="pod-autofollow-label" style={{ color: "#4A544E" }}>
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
                  {(() => {
                    let wordCounter = 0;
                    const totalWords = Math.max(1, wordTimings.wordIndexes.length);
                    const totalDur = displayDuration || 96;
                    return transcriptTokens.map((token, idx) => {
                      const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);
                      if (!isWord) {
                        return <span key={idx}>{token}</span>;
                      }
                      const curWordIdx = wordCounter++;
                      const prevToken = idx > 0 ? transcriptTokens[idx - 1] : "";
                      const isParagraphStart =
                        curWordIdx === 0 ||
                        prevToken.includes("\n") ||
                        (curWordIdx > 0 && curWordIdx % 52 === 0 && /[.!?]/.test(transcriptTokens[idx - 2] || ""));

                      let badgeEl: React.ReactNode = null;
                      if (isParagraphStart) {
                        const sec =
                          wordTimings.exactTimestamps && wordTimings.exactTimestamps[curWordIdx] !== undefined
                            ? wordTimings.exactTimestamps[curWordIdx]
                            : Math.round((curWordIdx / totalWords) * totalDur);
                        badgeEl = (
                          <span
                            data-seek-sec={sec}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#F5ECE2",
                              color: "#B46530",
                              border: "1px solid #E8D5C4",
                              borderRadius: "6px",
                              padding: "1px 7px",
                              fontSize: "11px",
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                              marginRight: "8px",
                              cursor: "pointer",
                              verticalAlign: "baseline",
                              userSelect: "none",
                            }}
                            title={`Jump to ${fmtTime(sec)}`}
                          >
                            {fmtTime(sec)}
                          </span>
                        );
                      }

                      const cleanWord = token.toLowerCase().replace(/[^a-z0-9]/g, "");
                      const def = getTermDefinition(cleanWord);
                      if (def) {
                        return (
                          <span key={idx} className="transcript-word">
                            {badgeEl}
                            <DottedTerm definition={def} isPurpleTheme={false}>
                              {token}
                            </DottedTerm>
                          </span>
                        );
                      }
                      return (
                        <span key={idx} className="transcript-word">
                          {badgeEl}
                          {token}
                        </span>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading transcript…</p>
              )}
            </div>
          </div>

          {/* Simple Bottom-Right Continuity Button (Just "Next" and the Name) */}
          {(() => {
            const hasNextEpisode = activeEpisodeIdx + 1 < activeEpisodesList.length;
            const nextEpisodeTitle = hasNextEpisode
              ? activeEpisodesList[activeEpisodeIdx + 1].title.replace(/^\d+\.\s*/, "")
              : null;

            if (!hasNextEpisode && !onNavigateToRead) return null;

            return (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2px" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (hasNextEpisode) {
                      handleSelectEpisode(activeEpisodeIdx + 1);
                    } else if (onNavigateToRead) {
                      onNavigateToRead(activeSectionInfo.sectionNumber);
                    }
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "999px",
                    border: "1px solid #88B39B",
                    background: "#9DC2AD",
                    color: "#182C22",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(30, 40, 34, 0.08)",
                    transition: "transform 0.15s ease, background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#8EB7A0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#9DC2AD";
                  }}
                >
                  <span>
                    Next · {hasNextEpisode ? nextEpisodeTitle : "Read Notes"}
                  </span>
                  <span style={{ fontSize: "15px", lineHeight: 1 }}>→</span>
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
