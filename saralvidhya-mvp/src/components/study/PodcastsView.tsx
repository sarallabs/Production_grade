import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
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
} from "@/data/contentRepository";
import {
  useAudioProgress,
  saveProgress,
  type AudioProgress,
} from "@/hooks/useAudioProgress";

/**
 * Basic markdown stripper for TTS reading.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  let t = text;
  t = t.replace(/<img\b[^>]*>/gi, "");
  t = t.replace(/<[^>]+>/g, " ");
  t = t.replace(/!\[[\s\S]*?\]\([\s\S]*?\)/g, "");
  t = t.replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "");
  return t
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>*_~`#]/g, "")
    .replace(/⚠️|📖|📚|💙|🚫|🙏|👋/g, "")
    .replace(/---+/g, "")
    .trim();
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
}: PodcastsViewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0); // always up-to-date without triggering re-renders
  const rafRef = useRef<number | null>(null); // rAF handle for throttled UI updates
  const [audioDuration, setAudioDuration] = useState(0);
  const audioDurationRef = useRef(0);
  const [available, setAvailable] = useState<boolean | null>(null); // null = checking
  const [chapterDir, setChapterDir] = useState<string>(`chapter_${String(chapterNumber).padStart(2, "0")}`);

  useEffect(() => {
    if (!subjectId) return;
    getManifest().then((m) => {
      const list = getChapters(m, subjectId);
      const ch = list.find((c) => c.number === chapterNumber);
      if (ch?.dir) {
        setChapterDir(ch.dir);
      }
    });
  }, [subjectId, chapterNumber]);

  const isNebBiologyChap6 = subjectId === "neb_xii_biology" && chapterNumber === 6;
  const isAngrauChap1 = subjectId === "ento_131" && chapterNumber === 1;
  const isAngrauChap2 = subjectId === "ento_131" && chapterNumber === 2;
  const isAngrauChap3 = subjectId === "ento_131" && chapterNumber === 3;
  const isAngrauChap4 = subjectId === "ento_131" && chapterNumber === 4;
  const isAngrauWithPodcasts = subjectId === "ento_131" && [1, 2, 3, 4].includes(chapterNumber);
  const isNebOrMgmt = subjectId.startsWith("neb_") || subjectId === "management" || isAngrauWithPodcasts;

  const getSavedTrack = (): string => {
    const saved = localStorage.getItem(
      `last_track_${subjectId}_${chapterNumber}_${persona}`,
    );
    if (isNebOrMgmt) {
      if (resumeTrack === "dl" || resumeTrack === "ql" || resumeTrack === "mc") return resumeTrack;
      return saved === "dl" || saved === "ql" || saved === "mc" ? saved : "dl";
    } else {
      if (resumeTrack === "long" || resumeTrack === "short") return resumeTrack;
      return saved === "long" || saved === "short" ? saved : "long";
    }
  };

  const [selectedTrack, setSelectedTrack] = useState<string>(
    getSavedTrack(),
  );
  const [selectedDl, setSelectedDl] = useState(0);
  const [selectedQl, setSelectedQl] = useState(0);
  const [selectedMc, setSelectedMc] = useState(initialMcIndex ?? 0);
  // Collapse track grid immediately when an initialMcIndex is supplied (coming from mindmap)
  const [isTrackGridExpanded, setIsTrackGridExpanded] = useState(initialMcIndex == null);

  const MICROCASTS = useMemo(() => {
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
      };
      const titles = gcsTitles[subjectId]?.[chapterNumber] ?? [];
      return titles.map((title, i) => ({
        title: `${i + 1}. ${title}`,
        audio: `microcast_${String(i + 1).padStart(2, "0")}.m4a`,
        txt: `microcast_${String(i + 1).padStart(2, "0")}.md`,
      }));
    }
    return isNebBiologyChap6 ? [
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
  }, [isNebBiologyChap6, chapterNumber, subjectId]);

  const DETAILED_LISTENS = useMemo(() => {
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: "1. Chapter Complete Coverage", audio: "long_podcast.m4a", txt: "long_podcast.md" }];
    }
    return isNebBiologyChap6 ? [
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
  }, [isNebBiologyChap6, chapterNumber, subjectId]);

  const QUICK_LISTENS = useMemo(() => {
    if (GCS_BACKEND_SUBJECTS.has(subjectId)) {
      return [{ title: "1. Chapter Quick Recap", audio: "short_podcast.m4a", txt: "short_podcast.md" }];
    }
    return isNebBiologyChap6 ? [
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
  }, [isNebBiologyChap6, chapterNumber, subjectId]);

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
  const transcriptRef = useRef<HTMLDivElement>(null);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

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
    if (available) return audioDuration;
    return Math.max(1, cleanText.length / 15);
  }, [available, audioDuration, cleanText]);

  const displayCurrent = useMemo(() => {
    if (available) return currentTime;
    return Math.min(displayDuration, ttsCharIndex / 15);
  }, [available, currentTime, ttsCharIndex, displayDuration]);

  const progressPct = displayDuration ? (displayCurrent / displayDuration) * 100 : 0;

  const transcriptTokens = useMemo(() => {
    if (!transcript) return [] as string[];
    return transcript.split(/(\s+|[.,!?;:]+)/g).filter(Boolean);
  }, [transcript]);

  const wordTimings = useMemo(() => {
    if (!transcriptTokens.length)
      return {
        totalWeight: 0,
        wordWeights: [] as number[],
        wordIndexes: [] as number[],
      };

    let cumulativeChars = 0;
    const wordWeights: number[] = [];
    const wordIndexes: number[] = [];

    for (let i = 0; i < transcriptTokens.length; i++) {
      const token = transcriptTokens[i];
      const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);

      if (isWord) {
        // Pure character count makes TTS sync much more accurate since reading speed is roughly constant in chars/sec
        cumulativeChars += token.length;
        wordWeights.push(cumulativeChars);
        wordIndexes.push(i);
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

    return { totalWeight, wordWeights: shiftedWeights, wordIndexes };
  }, [transcriptTokens]);

  const { activeWordIdx, activeTokenIdx } = useMemo(() => {
    if (
      !transcript ||
      !displayDuration ||
      wordTimings.wordIndexes.length === 0 ||
      displayCurrent < 0
    ) {
      return {
        activeWordIdx: -1,
        activeTokenIdx: -1,
      };
    }

    const clampedTime = Math.min(displayCurrent, displayDuration);
    const progress = clampedTime / displayDuration;

    const targetWeight = progress * wordTimings.totalWeight;

    let wordIdx = 0;
    for (let i = 0; i < wordTimings.wordWeights.length; i++) {
      if (wordTimings.wordWeights[i] >= targetWeight) {
        wordIdx = i;
        break;
      }
    }

    const tokenIdx = wordTimings.wordIndexes[wordIdx] ?? -1;

    return {
      activeWordIdx: wordIdx,
      activeTokenIdx: tokenIdx,
    };
  }, [transcript, displayDuration, displayCurrent, wordTimings]);

  // Auto-scroll transcript when active word changes
  // Throttled: only scroll when word changes meaningfully (every ~3 words)
  const lastScrolledWordRef = useRef(-1);
  useEffect(() => {
    // Skip scroll if word changed by less than 3 positions to reduce layout thrashing
    if (Math.abs(activeWordIdx - lastScrolledWordRef.current) < 3) return;
    lastScrolledWordRef.current = activeWordIdx;

    if (!transcriptBoxRef.current || !transcriptRef.current) return;

    const activeElement = transcriptBoxRef.current.querySelector(
      ".transcript-word.active",
    ) as HTMLElement | null;

    if (activeElement) {
      const container = transcriptRef.current;
      const containerTop = container.getBoundingClientRect().top;
      const targetTop = activeElement.getBoundingClientRect().top;
      const relativeTop = targetTop - containerTop;
      const targetHeight = activeElement.offsetHeight;
      const containerHeight = container.offsetHeight;

      // Center the active element in the container
      const newScrollTop =
        container.scrollTop +
        relativeTop -
        containerHeight / 2 +
        targetHeight / 2;

      container.scrollTo({
        top: newScrollTop,
        behavior: "smooth",
      });
    }
  }, [activeTokenIdx, activeWordIdx]);



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
        const dl = DETAILED_LISTENS[selectedDl] || DETAILED_LISTENS[0];
        return {
          audio: `${gcsBasePath}/${dl.audio}`,
          transcript: `${gcsBasePath}/${dl.txt}`,
        };
      }
      if (track === "ql") {
        const ql = QUICK_LISTENS[selectedQl] || QUICK_LISTENS[0];
        return {
          audio: `${gcsBasePath}/${ql.audio}`,
          transcript: `${gcsBasePath}/${ql.txt}`,
        };
      }
      if (track === "mc") {
        const mc = MICROCASTS[selectedMc] || MICROCASTS[0];
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

  // ── Reset NEB Nepal and Nagarjuna University player when track, persona, subject, or chapter changes ──
  useEffect(() => {
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

  // Throttle React state update to ~5fps for transcript sync
  const lastReactUpdateRef = useRef(0);

  const updateProgress = useCallback((time: number, duration: number) => {
    currentTimeRef.current = time;
    const pct = duration > 0 ? (time / duration) * 100 : 0;

    // Update playhead position directly in DOM (zero React overhead)
    if (playheadRef.current) {
      playheadRef.current.style.left = `calc(${pct}% - 7px)`;
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

    // Update time display
    if (currentTimeDisplayRef.current) {
      const m = Math.floor(time / 60);
      const sec = String(Math.floor(time % 60)).padStart(2, "0");
      currentTimeDisplayRef.current.textContent = `${m}:${sec}`;
    }

    // Only trigger React re-render ~5fps for transcript word highlighting
    const now = performance.now();
    if (now - lastReactUpdateRef.current > 200) {
      lastReactUpdateRef.current = now;
      setCurrentTime(time);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (rafRef.current !== null) return; // already scheduled
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (audio) updateProgress(audio.currentTime, audioDurationRef.current || audio.duration || 0);
      });
    };

    const onSeeked = () => {
      if (audio) updateProgress(audio.currentTime, audioDurationRef.current || audio.duration || 0);
    };

    const onLoadedMetadata = () => {
      if (autoPlay) {
        audio.play().catch((e) => console.warn("Auto-play prevented:", e));
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [selectedTrack, autoPlay, available, updateProgress]);

  // ── Load transcript when track, subject, chapter, or level changes ──
  useEffect(() => {
    if (!subjectId) return;
    setTranscript(null);

    const { transcript: tFile } = getFileNames(selectedTrack);
    fetch(tFile)
      .then((r) => {
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || ct.includes("text/html")) throw new Error();
        return r.text();
      })
      .then((t) => setTranscript(t))
      .catch(() => {
        // Fallback to getResourceContent
        getResourceContent(
          subjectId,
          chapterNumber,
          selectedTrack === "long" ? "long_podcast.md" : "short_podcast.md",
          persona as DifficultyLevel,
        ).then((script) => {
          if (script && !script.includes("Content not available")) {
            setTranscript(script);
          } else {
            setTranscript("Content not available.");
          }
        });
      });
  }, [selectedTrack, selectedMc, subjectId, chapterNumber, persona, chapterDir]);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (audio) {
      if (audio.error) {
        audio.load();
      }
      audio.play().catch((e) => console.warn("Play failed:", e));
      // State update handled by the 'play' event listener
    }
  };
  const handlePause = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      // State update handled by the 'pause' event listener
    }
  };

  // Sync playing state to parent when audio events fire
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
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
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("play", onPlay);
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
        },
        (localIndex) => {
          setTtsCharIndex(startChar + localIndex);
        }
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

  // React to external play trigger — only re-run when playTrigger or available changes
  useEffect(() => {
    if (!playTrigger) return;
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
        googleTtsSpeak(
          clean.slice(startChar),
          SUBJECT_LANG[subjectId] ?? "en-IN",
          () => { setTtsPlaybackState("playing"); onPlayingChange?.(true); },
          () => { setTtsPlaybackState("idle"); setTtsCharIndex(0); onPlayingChange?.(false); },
          (localIndex) => { setTtsCharIndex(startChar + localIndex); }
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

  // Clean up TTS on unmount or track/subject change
  useEffect(() => {
    return () => {
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

  const fmtTime = (s: number, fallback = "0:00") => {
    if (s === undefined || s === null || isNaN(s) || !isFinite(s))
      return fallback;
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${m}:${sec}`;
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
        <div className="podcast-track-selector">
          {isNebOrMgmt ? (
            (["dl", "mc", "ql"] as const).map((t) => {
              const labelMap: any = { dl: "Detailed Listen", mc: "Microcast", ql: "Quick Listen" };
              const descMap: any = { dl: "In-depth Chapter Coverage", mc: "Bite-sized topic podcasts", ql: "Brief Recap of Key Points" };
              const pillMap: any = { dl: "Deep dive into every concept", mc: "Short · Focused · Crisp", ql: "Quick · Smart · Effective" };
              const pillBg: any = { dl: "#f5f3ff", mc: "#ecfdf5", ql: "#fff7ed" };
              const pillText: any = { dl: "#7c3aed", mc: "#16a34a", ql: "#ea580c" };
              const pillBorder: any = { dl: "#c4b5fd", mc: "#86efac", ql: "#fdba74" };
              const circleBg: any = { dl: "#f1f0f9", mc: "#ecfdf5", ql: "#fef3c7" };
              const icons: any = {
                dl: (<svg width="30" height="30" viewBox="0 0 48 48" fill="none"><path d="M6 12C6 10.8954 6.89543 10 8 10H20C22.2091 10 24 11.7909 24 14V38C24 36.3431 22.6569 35 21 35H8C6.89543 35 6 34.1046 6 33V12Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" /><path d="M42 12C42 10.8954 41.1046 10 40 10H28C25.7909 10 24 11.7909 24 14V38C24 36.3431 25.3431 35 27 35H40C41.1046 35 42 34.1046 42 33V12Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.5" /><path d="M16 10V20L19 17.5L22 20V10" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.2" strokeLinejoin="round" /></svg>),
                mc: (<svg width="32" height="32" viewBox="0 0 48 48" fill="none"><path d="M10 28V24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24V28" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" /><rect x="6" y="26" width="8" height="12" rx="4" fill="#22c55e" /><rect x="34" y="26" width="8" height="12" rx="4" fill="#22c55e" /><rect x="21" y="32" width="6" height="10" rx="3" fill="#16a34a" stroke="#15803d" strokeWidth="1" /></svg>),
                ql: (<svg width="28" height="28" viewBox="0 0 40 40" fill="none"><path d="M22 3L8 22H18L16 37L32 18H22L22 3Z" fill="url(#qlGrad2)" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" /><defs><linearGradient id="qlGrad2" x1="16" y1="3" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" /></linearGradient></defs></svg>),
              };
              return (
                <div
                  key={t}
                  data-track={t}
                  className={`podcast-track-card card ${selectedTrack === t ? "active" : ""}`}
                  onClick={() => setSelectedTrack(t)}
                >
                  <div className="track-icon-circle" style={{ background: circleBg[t] }}>
                    {icons[t]}
                  </div>
                  <div className="track-info">
                    <strong>{labelMap[t]}</strong>
                    <span className="track-desc">{descMap[t]}</span>
                    <div className="track-pill" style={{ background: pillBg[t], color: pillText[t], border: `1px solid ${pillBorder[t]}` }}>
                      <span>{pillMap[t]}</span>
                      <span className="pill-chevron">›</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            (["long", "short"] as const).map((t) => {
              const labelMap: any = { long: "Long Podcast", short: "Short Podcast" };
              const descMap: any = { long: "In-depth Chapter Coverage", short: "Brief Recap of Key Points" };
              return (
                <div
                  key={t}
                  data-track={t}
                  className={`podcast-track-card card ${selectedTrack === t ? "active" : ""}`}
                  onClick={() => setSelectedTrack(t)}
                >
                  <div className="track-info">
                    <strong>{labelMap[t]}</strong>
                    <span className="track-desc">{descMap[t]}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

  return (
    <div className="podcasts-view">
      {/* ── Fixed top section: track selector + player ── */}
      <div className="podcast-sticky-top">
        {/* Track selector */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          {isNebOrMgmt ? (
            (["dl", "mc", "ql"] as const).map((t) => {
              const isActive = selectedTrack === t;
              const config: any = {
                dl: {
                  label: "Detailed Listen",
                  desc: "In-depth Chapter Coverage",
                  pill: "Deep dive into every concept",
                  borderColor: "#8b5cf6",
                  activeBg: "linear-gradient(135deg, #faf5ff, #f5f3ff)",
                  pillBg: "#f5f3ff", pillText: "#7c3aed", pillBorder: "#c4b5fd",
                  circleBg: "#f1f0f9",
                  icon: (
                    <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
                      <path d="M6 12C6 10.8954 6.89543 10 8 10H20C22.2091 10 24 11.7909 24 14V38C24 36.3431 22.6569 35 21 35H8C6.89543 35 6 34.1046 6 33V12Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" />
                      <path d="M42 12C42 10.8954 41.1046 10 40 10H28C25.7909 10 24 11.7909 24 14V38C24 36.3431 25.3431 35 27 35H40C41.1046 35 42 34.1046 42 33V12Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.5" />
                      <path d="M16 10V20L19 17.5L22 20V10" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.2" strokeLinejoin="round" />
                      <line x1="28" y1="16" x2="38" y2="16" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
                      <line x1="28" y1="20" x2="36" y2="20" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
                      <line x1="28" y1="24" x2="37" y2="24" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                mc: {
                  label: "Microcast",
                  desc: "Bite-sized topic podcasts",
                  pill: "Short · Focused · Crisp",
                  borderColor: "#22c55e",
                  activeBg: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
                  pillBg: "#ecfdf5", pillText: "#16a34a", pillBorder: "#86efac",
                  circleBg: "#ecfdf5",
                  icon: (
                    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
                      <path d="M10 28V24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24V28" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                      <rect x="6" y="26" width="8" height="12" rx="4" fill="#22c55e" />
                      <rect x="34" y="26" width="8" height="12" rx="4" fill="#22c55e" />
                      <rect x="21" y="32" width="6" height="10" rx="3" fill="#16a34a" stroke="#15803d" strokeWidth="1" />
                      <path d="M18 38C18 38 18 42 24 42C30 42 30 38 30 38" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M42 22C43.5 24 43.5 28 42 30" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M45 20C47 23 47 29 45 32" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ),
                },
                ql: {
                  label: "Quick Listen",
                  desc: "Brief Recap of Key Points",
                  pill: "Quick · Smart · Effective",
                  borderColor: "#f97316",
                  activeBg: "linear-gradient(135deg, #fffbeb, #fff7ed)",
                  pillBg: "#fff7ed", pillText: "#ea580c", pillBorder: "#fdba74",
                  circleBg: "#fef3c7",
                  icon: (
                    <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
                      <path d="M22 3L8 22H18L16 37L32 18H22L22 3Z" fill="url(#qlGradMain)" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
                      <defs>
                        <linearGradient id="qlGradMain" x1="16" y1="3" x2="24" y2="37" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#fbbf24" />
                          <stop offset="1" stopColor="#f97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ),
                },
              };
              const c = config[t];

              const isDisabled = mcOnly && t !== 'mc';
              return (
                <div
                  key={t}
                  onClick={() => !isDisabled && setSelectedTrack(t)}
                  title={isDisabled ? 'Not available in topic view — go to Podcasts tab for full access' : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    border: `2px solid ${isActive ? c.borderColor : "#e2e8f0"}`,
                    borderRadius: "16px",
                    background: isActive ? c.activeBg : "#ffffff",
                    boxShadow: isActive ? `0 4px 15px ${c.borderColor}25` : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.3s ease",
                    flex: 1,
                    minHeight: "100px",
                    opacity: isDisabled ? 0.35 : 1,
                    filter: isDisabled ? "grayscale(1)" : "none",
                    pointerEvents: isDisabled ? "none" : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isDisabled) {
                      e.currentTarget.style.borderColor = c.borderColor;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 6px 20px ${c.borderColor}20`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isDisabled) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    }
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: c.circleBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {c.icon}
                  </div>
                  {/* Text + pill */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{c.label}</strong>
                    <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 500 }}>{c.desc}</span>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      marginTop: "8px", padding: "4px 12px", borderRadius: "20px",
                      fontSize: "11px", fontWeight: 600, width: "fit-content",
                      background: c.pillBg, color: c.pillText, border: `1px solid ${c.pillBorder}`,
                    }}>
                      <span>{c.pill}</span>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>›</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            (["long", "short"] as const).map((t) => {
              const isActive = selectedTrack === t;
              const config: any = {
                long: {
                  label: "Long Podcast",
                  desc: "In-depth Chapter Coverage",
                  borderColor: "#3b82f6",
                  activeBg: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                  circleBg: "#dbeafe",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                  ),
                },
                short: {
                  label: "Short Podcast",
                  desc: "Brief Recap of Key Points",
                  borderColor: "#10b981",
                  activeBg: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                  circleBg: "#d1fae5",
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                  ),
                }
              };
              const c = config[t];

              return (
                <div
                  key={t}
                  onClick={() => setSelectedTrack(t)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    cursor: "pointer",
                    border: `2px solid ${isActive ? c.borderColor : "#e2e8f0"}`,
                    borderRadius: "16px",
                    background: isActive ? c.activeBg : "#ffffff",
                    boxShadow: isActive ? `0 4px 15px ${c.borderColor}25` : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.3s ease",
                    flex: 1,
                    minHeight: "100px",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = c.borderColor;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 6px 20px ${c.borderColor}20`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                    }
                  }}
                >
                  {/* Icon circle */}
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: c.circleBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {c.icon}
                  </div>
                  {/* Text */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <strong style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>{c.label}</strong>
                    <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 500 }}>{c.desc}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedTrack === "mc" && (() => {
          const trackConfig = {
            items: MICROCASTS,
            selectedIndex: selectedMc,
            setSelectedIndex: setSelectedMc,
            title: "Select Microcast",
            theme: { bg: "linear-gradient(135deg, #f0fdfa, #ccfbf1)", text: "#0f766e", border: "#2dd4bf", shadow: "rgba(45, 212, 191, 0.15)", colorTitle: "#22c55e" }
          };

          return (
            <div id="microcast-grid-container" style={{ padding: "12px 16px", marginBottom: "12px", background: "#ffffff", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", margin: isTrackGridExpanded ? "0 0 12px 0" : "0" }}
                onClick={() => setIsTrackGridExpanded(!isTrackGridExpanded)}
              >
                <h4 style={{ margin: "0", fontSize: "15px", color: trackConfig.theme.colorTitle, fontWeight: 600 }}>
                  {isTrackGridExpanded ? trackConfig.title : `Playing: ${trackConfig.items[trackConfig.selectedIndex]?.title || ""}`}
                </h4>
                <button style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isTrackGridExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px",
                maxHeight: isTrackGridExpanded ? "1000px" : "0px",
                opacity: isTrackGridExpanded ? 1 : 0,
                overflow: "hidden",
                willChange: "max-height, opacity, margin-top",
                transform: "translateZ(0)",
                transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out, margin-top 0.3s ease-in-out",
                marginTop: isTrackGridExpanded ? "0" : "-8px"
              }}>
                {trackConfig.items.map((item, idx) => {
                  const isItemActive = trackConfig.selectedIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        trackConfig.setSelectedIndex(idx);
                        setIsTrackGridExpanded(false);
                      }}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        background: isItemActive ? trackConfig.theme.bg : "#ffffff",
                        color: isItemActive ? trackConfig.theme.text : "#334155",
                        border: `1.5px solid ${isItemActive ? trackConfig.theme.border : "#e2e8f0"}`,
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: isItemActive ? 600 : 500,
                        transition: "all 0.2s ease",
                        boxShadow: isItemActive ? `0 4px 10px ${trackConfig.theme.shadow}` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isItemActive) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                          e.currentTarget.style.borderColor = "#cbd5e1";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isItemActive) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.borderColor = "#e2e8f0";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          background: isItemActive ? trackConfig.theme.colorTitle : "transparent",
                          border: isItemActive ? "none" : `1.5px solid ${trackConfig.theme.colorTitle}80`
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill={isItemActive ? "#ffffff" : trackConfig.theme.colorTitle}>
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                        <span style={{ lineHeight: "1.3" }}>{item.title}</span>
                      </div>

                      <div style={{ flexShrink: 0, marginLeft: "8px" }}>
                        {isItemActive ? (
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '16px' }}>
                            <div style={{ width: '3px', height: '10px', background: trackConfig.theme.colorTitle, borderRadius: '2px', animation: 'bounce 1s infinite' }} />
                            <div style={{ width: '3px', height: '16px', background: trackConfig.theme.colorTitle, borderRadius: '2px', animation: 'bounce 1.2s infinite' }} />
                            <div style={{ width: '3px', height: '8px', background: trackConfig.theme.colorTitle, borderRadius: '2px', animation: 'bounce 0.8s infinite' }} />
                            <div style={{ width: '3px', height: '12px', background: trackConfig.theme.colorTitle, borderRadius: '2px', animation: 'bounce 1.1s infinite' }} />
                          </div>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Audio Player */}
        <div className="podcast-player-real">
          {available && (
            <audio
              ref={audioRef}
              src={currentFiles.audio}
              crossOrigin="anonymous"
              preload="metadata"
              onLoadedMetadata={(e) => {
                const d = (e.target as HTMLAudioElement).duration;
                if (d && isFinite(d)) { audioDurationRef.current = d; setAudioDuration(d); }
              }}
              onDurationChange={(e) => {
                const d = (e.target as HTMLAudioElement).duration;
                if (d && isFinite(d)) { audioDurationRef.current = d; setAudioDuration(d); }
              }}
            />
          )}

          {/* ── Redesigned Audio Player ── */}
          {(() => {
            const trackTheme: any = {
              long: {
                color: "#3b82f6", light: "#eff6ff", gradient: "linear-gradient(90deg, #93c5fd, #3b82f6)", label: "Long Podcast", shadow: "rgba(59,130,246,0.35)",
                icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>)
              },
              short: {
                color: "#10b981", light: "#ecfdf5", gradient: "linear-gradient(90deg, #6ee7b7, #10b981)", label: "Short Podcast", shadow: "rgba(16,185,129,0.35)",
                icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>)
              },
              dl: {
                color: "#8b5cf6", light: "#f5f3ff", gradient: "linear-gradient(90deg, #c4b5fd, #8b5cf6)", label: "Detailed Listen", shadow: "rgba(139,92,246,0.35)",
                icon: (<svg width="28" height="28" viewBox="0 0 48 48" fill="none"><path d="M6 12C6 10.8954 6.89543 10 8 10H20C22.2091 10 24 11.7909 24 14V38C24 36.3431 22.6569 35 21 35H8C6.89543 35 6 34.1046 6 33V12Z" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.5" /><path d="M42 12C42 10.8954 41.1046 10 40 10H28C25.7909 10 24 11.7909 24 14V38C24 36.3431 25.3431 35 27 35H40C41.1046 35 42 34.1046 42 33V12Z" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1.5" /></svg>)
              },
              mc: {
                color: "#22c55e", light: "#ecfdf5", gradient: "linear-gradient(90deg, #86efac, #22c55e)", label: "Microcast", shadow: "rgba(34,197,94,0.35)",
                icon: (<svg width="28" height="28" viewBox="0 0 48 48" fill="none"><path d="M10 28V24C10 16.268 16.268 10 24 10C31.732 10 38 16.268 38 24V28" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" /><rect x="6" y="26" width="8" height="12" rx="4" fill="#22c55e" /><rect x="34" y="26" width="8" height="12" rx="4" fill="#22c55e" /></svg>)
              },
              ql: {
                color: "#f97316", light: "#fff7ed", gradient: "linear-gradient(90deg, #fdba74, #f97316)", label: "Quick Listen", shadow: "rgba(249,115,22,0.35)",
                icon: (<svg width="26" height="26" viewBox="0 0 40 40" fill="none"><path d="M22 3L8 22H18L16 37L32 18H22L22 3Z" fill="url(#qlGradPlayer)" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" /><defs><linearGradient id="qlGradPlayer" x1="16" y1="3" x2="24" y2="37" gradientUnits="userSpaceOnUse"><stop stopColor="#fbbf24" /><stop offset="1" stopColor="#f97316" /></linearGradient></defs></svg>)
              },
            };
            const th = trackTheme[selectedTrack] || trackTheme.long;
            
            let currentTrackTitle = "Chapter Podcast";
            if (selectedTrack === "mc") currentTrackTitle = MICROCASTS[selectedMc]?.title || currentTrackTitle;
            else if (selectedTrack === "dl") currentTrackTitle = DETAILED_LISTENS[selectedDl]?.title || currentTrackTitle;
            else if (selectedTrack === "ql") currentTrackTitle = QUICK_LISTENS[selectedQl]?.title || currentTrackTitle;
            else if (selectedTrack === "long") currentTrackTitle = "In-depth Chapter Coverage";
            else if (selectedTrack === "short") currentTrackTitle = "Brief Recap of Key Points";

            // Update waveform color ref so direct DOM updates use correct color
            waveformColorRef.current = selectedTrack === 'dl' ? '#CB30E0' : th.color;

            return (
              <div style={{
                display: "flex", alignItems: "center", gap: "20px", width: "100%",
                background: "#ffffff", padding: "12px 20px", borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: `1.5px solid ${th.color}30`,
                marginBottom: "0px"
              }}>
                {/* Track info */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, minWidth: "200px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%",
                    background: th.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    border: `1.5px solid ${th.color}40`
                  }}>
                    {th.icon}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", lineHeight: "1.3", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {currentTrackTitle || "Select a track"}
                    </span>
                    <span style={{ fontSize: "11.5px", fontWeight: 600, color: th.color }}>
                      {th.label}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={() => { if (audioRef.current) { audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0); setCurrentTime(audioRef.current.currentTime); } }}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", transition: "all 0.2s", padding: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = th.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                    title="Rewind 10s"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19" /><polygon points="22 19 13 12 22 5 22 19" /></svg>
                  </button>

                  <button
                    onClick={() => { if (available) { isPlaying ? handlePause() : handlePlay(); } else { ttsPlaybackState === "playing" ? handleTtsPause() : handleTtsPlay(); } }}
                    style={{ width: "50px", height: "50px", borderRadius: "50%", background: selectedTrack === 'dl' ? '#CB30E0' : th.color, color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: `0 4px 15px ${selectedTrack === 'dl' ? 'rgba(203, 48, 224, 0.35)' : th.shadow}`, transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = `0 6px 20px ${selectedTrack === 'dl' ? 'rgba(203, 48, 224, 0.5)' : th.shadow.replace('0.35)', '0.5)')}`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 4px 15px ${selectedTrack === 'dl' ? 'rgba(203, 48, 224, 0.35)' : th.shadow}`; }}
                    title={(available ? isPlaying : ttsPlaybackState === "playing") ? "Pause" : "Play"}
                  >
                    {(available ? isPlaying : ttsPlaybackState === "playing") ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>

                  <button
                    onClick={() => { if (audioRef.current) { audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration || 9999); setCurrentTime(audioRef.current.currentTime); } }}
                    style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", transition: "all 0.2s", padding: 0 }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = th.color; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
                    title="Fast Forward 10s"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19" /><polygon points="2 19 11 12 2 5 2 19" /></svg>
                  </button>
                </div>

                {/* Vertical Bar Waveform Progress — bars rendered once, updated via direct DOM refs */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      height: "36px", cursor: "pointer", position: "relative", width: "100%"
                    }}
                    onClick={(e) => {
                      if (audioRef.current && displayDuration) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        audioRef.current.currentTime = pct * displayDuration;
                        setCurrentTime(audioRef.current.currentTime);
                      }
                    }}
                  >
                    {/* Static waveform bars — DOM-updated, never re-rendered by React */}
                    <StaticWaveformBars waveformRef={waveformRef} />

                    {/* Playhead Circle — position updated directly via ref */}
                    <div ref={playheadRef} style={{
                      position: "absolute",
                      left: `calc(${progressPct}% - 7px)`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      border: `4px solid ${th.color}`,
                      pointerEvents: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span ref={currentTimeDisplayRef} style={{ fontSize: "11px", fontWeight: 600, fontFamily: "ui-monospace, monospace", color: th.color }}>
                      {fmtTime(displayCurrent)}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 600, fontFamily: "ui-monospace, monospace", color: "#94a3b8" }}>
                      {displayDuration ? fmtTime(displayDuration) : "--:--"}
                    </span>
                  </div>
                  {/* Hidden range input for accessibility/seeking */}
                  <input
                    type="range" min={0} max={displayDuration || 0} step={0.5} value={displayCurrent}
                    onChange={handleSeek} className="seek-slider" aria-label="Seek"
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "32px", opacity: 0, cursor: "pointer" }}
                  />
                </div>

                {/* Volume */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                  <input
                    type="range" min={0} max={1} step={0.05}
                    defaultValue={1}
                    onChange={(e) => { if (audioRef.current) audioRef.current.volume = parseFloat(e.target.value); }}
                    style={{ width: "70px", accentColor: th.color, cursor: "pointer" }}
                    aria-label="Volume"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Scrollable transcript ── */}
      <div className="podcast-transcript-scroll" ref={transcriptRef}>
        <div className="transcript-toggle">
          <h4>Transcript</h4>
        </div>
        {transcript ? (
          <div
            className="transcript-box transcript-body"
            ref={transcriptBoxRef}
          >
            {transcriptTokens.map((token, idx) => {
              const isWord = token.trim() !== "" && !/^[.,!?;:]+$/.test(token);
              const isCurrentActive = isWord && idx === activeTokenIdx;
              return (
                <span
                  key={idx}
                  className={
                    isCurrentActive
                      ? "transcript-word active"
                      : isWord
                        ? "transcript-word"
                        : undefined
                  }
                >
                  {token}
                </span>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Loading transcript…
          </p>
        )}
      </div>
    </div>
  );
}
