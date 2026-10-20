import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import { fetchQuickStudyGuide, fetchDetailedNotes } from '@/services/contentService';

const { width } = Dimensions.get('window');

export type ListenMode = 'quick' | 'detailed' | 'microcasts';

interface ListenScreenProps {
  chapterNumber?: number;
  chapterTitle?: string;
  initialMode?: ListenMode;
  onNavigateToRead?: (moduleNumber?: number) => void;
  onBackPress?: () => void;
  onChapterPress?: () => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

const GLOSSARY_TOOLTIPS: Record<string, string> = {
  digestion: 'The biological breakdown of food into nutrient molecules absorbed by gut cells.',
  'elementary canal': 'Alimentary canal: the specialized tube from mouth to anus (foregut, midgut, hindgut).',
  'alimentary canal': 'The continuous muscular digestive tract extending from mouth to anus.',
  foregut: 'Stomodaeum: anterior region (pharynx, crop, proventriculus) lined with shed cuticle.',
  midgut: 'Mesenteron: central digestive chamber lined with columnar microvilli, lacking cuticle.',
  hindgut: 'Proctodaeum: posterior chamber (ileum, colon, rectum) responsible for water reabsorption.',
  Ferrari: 'Metaphor for high metabolic energy throughput in flying insects.',
  metamorphosis: 'Post-embryonic structural changes occurring between egg hatching and adult sexual maturity.',
  ecdysis: 'The process of shedding the old cuticular exoskeleton (moulting).',
  poikilothermic: 'Cold-blooded organisms whose body temperature tracks ambient microclimates.',
  'degree-day': 'Unit of heat accumulation used to predict insect development timing.',
  photoperiod: 'The duration of daily light exposure regulating diapause and seasonal cycles.',
  diapause: 'Hormonally regulated dormancy enabling survival during harsh climatic conditions.',
  pollination: 'Transfer of pollen grains from anther to stigma facilitating fertilization.',
  apiculture: 'The scientific management and rearing of honey bees for pollination and honey.',
  weathering: 'Physical disintegration and chemical decomposition of minerals and agro-substrates.',
};

export interface TokenizedWord {
  index: number;
  raw: string;
  clean: string;
  isGlossary: boolean;
  glossaryKey?: string;
}

function tokenizeParagraph(text: string): TokenizedWord[] {
  const words: TokenizedWord[] = [];
  const tokens = text.split(/\s+/).filter(Boolean);
  const glossaryKeys = Object.keys(GLOSSARY_TOOLTIPS);

  tokens.forEach((raw, idx) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = glossaryKeys.find(
      (k) => k.toLowerCase() === clean || clean === k.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    words.push({
      index: idx,
      raw,
      clean,
      isGlossary: !!matchedKey,
      glossaryKey: matchedKey,
    });
  });

  return words;
}

function markdownToAudioParagraphs(markdown: string, chapterNum: number, chapterTitle: string): string[] {
  if (!markdown || markdown.trim().length === 0) {
    return [
      `Welcome to the audio study session for Chapter ${chapterNum}: ${chapterTitle}.`,
      `Focus on the structural concepts, biological definitions, and faculty exam pointers covered in your lecture guides.`,
      `Review each section carefully, and follow along with the transcript to master the subject material for your upcoming assessments.`,
    ];
  }

  // 1. Remove markdown images & links [text](url) -> text
  let text = markdown
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1');

  // 2. Remove math formulas $$...$$ or $...$ -> clean spoken text
  text = text
    .replace(/\$\$(.*?)\$\$/gs, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\text\{(.*?)\}/g, '$1')
    .replace(/\\longrightarrow/g, 'yields')
    .replace(/\\approx/g, 'approximately')
    .replace(/\\circ\s*C/g, ' degrees Celsius');

  // 3. Remove tables (lines with |)
  text = text.replace(/^\|.*\|$/gm, '');

  // 4. Convert headers: e.g. "### 1. Three Primary Gut Regions" -> "Three Primary Gut Regions."
  text = text.replace(/^#{1,6}\s*(?:[\d.]+\s*)?/gm, '');

  // 5. Remove horizontal rules
  text = text.replace(/^---$/gm, '');

  // 6. Remove blockquotes and formatting symbols (*, _, `, >)
  text = text.replace(/^[>]\s*/gm, '');
  text = text.replace(/[*_`]/g, '');

  // 7. Clean bullet points: e.g. "- Pharynx:" -> "Pharynx:"
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+\.\s+/gm, '');

  // 8. Split by double newlines or single newlines with content into paragraphs
  const rawParagraphs = text.split(/\n+/);
  const cleaned: string[] = [];

  for (const raw of rawParagraphs) {
    const trimmed = raw.replace(/\s+/g, ' ').trim();
    if (trimmed.length > 25 && !trimmed.startsWith('|')) {
      cleaned.push(trimmed);
    }
  }

  if (cleaned.length > 0) {
    return cleaned;
  }

  return [
    `Welcome to the audio study session for Chapter ${chapterNum}: ${chapterTitle}.`,
    `Focus on the structural concepts, definitions, and faculty pointers covered in your lecture guides.`,
    `Follow along with the transcript to master the material for your upcoming assessments.`,
  ];
}

interface MicrocastEpisode {
  id: number;
  title: string;
  status: string;
  durationSec: number;
  durationLabel: string;
  recap: string;
}

const CHAPTER_MICROCASTS: Record<number, { episodes: { id: number; title: string; recap: string }[]; transcripts: Record<number, string[]> }> = {
  1: {
    episodes: [
      { id: 1, title: 'Anatomy of the Three-Part Insect Gut', recap: 'Foregut, midgut & hindgut' },
      { id: 2, title: 'Inside the Insect Foregut and Gizzard', recap: 'Crop & proventricular teeth' },
      { id: 3, title: 'How Insect Digestion Activates Bt Toxins', recap: 'Alkaline pH & receptor binding' },
      { id: 4, title: 'How Insects Recycle Water from Waste', recap: 'Malpighian tubules & rectal pads' },
      { id: 5, title: 'Peritrophic Membrane & Bt Toxin Defense', recap: 'Chitin sheath & barrier defense' },
    ],
    transcripts: {
      1: [
        'The insect gut is divided into three distinct embryological zones: the foregut for ingestion, the midgut for enzymatic absorption, and the hindgut for water recycling.',
        'Notice that the foregut and hindgut arise from ectoderm, retaining a cuticular intima shed during each larval molt, whereas the midgut is of endodermal origin.',
        'This fundamental anatomical distinction explains why digestion and nutrient uptake take place almost exclusively across the midgut microvillar epithelium.',
      ],
      2: [
        'In the foregut, the thin-walled crop functions as an expandable storage reservoir for food particles and floral nectar.',
        'Just behind the crop, the proventriculus or gizzard is armed with six powerful chitinous teeth and backward-facing spines that mechanically grind solid food particles.',
        'In sucking insects such as aphids and bugs, the muscular pharynx acts as a powerful cibarial suction pump to draw plant sap upwards into the digestive tract.',
      ],
      3: [
        'Bacillus thuringiensis crystal endotoxins are ingested as inactive protoxins by susceptible agricultural caterpillars in field crops.',
        'The highly alkaline pH of the insect midgut solubilizes these crystals, allowing specific gut proteases to cleave them into pore-forming toxins.',
        'These activated endotoxins bind to cadherin receptors on midgut epithelial columnar cells, creating osmotic pores that disrupt cell integrity and lead to insect mortality.',
      ],
      4: [
        'Malpighian tubules float freely in the abdominal hemolymph to filter out nitrogenous wastes as insoluble potassium and uric acid crystals.',
        'As metabolic waste passes into the hindgut, specialized rectal pads actively reabsorb over ninety-five percent of water, sodium, and potassium ions.',
        'This hyper-efficient water conservation mechanism allows terrestrial insects and stored-grain pests to thrive in extremely arid agricultural environments.',
      ],
      5: [
        'The peritrophic membrane is a semi-permeable sheath composed of chitin and proteins that envelops food bolus within the insect midgut.',
        'It shields delicate single-cell microvillar midgut epithelial cells from mechanical abrasion caused by rough plant fibers and mineral particles.',
        'Additionally, it acts as a selective ultrafiltration barrier preventing entomopathogenic bacteria, viruses, and fungi from penetrating the hemocoel.',
      ],
    },
  },
  2: {
    episodes: [
      { id: 1, title: 'Ametabolous & Hemimetabolous Development', recap: 'Direct vs incomplete metamorphosis' },
      { id: 2, title: 'Holometabolous Life Cycles & Imaginal Discs', recap: 'Larval, pupal & adult stages' },
      { id: 3, title: 'Larval Classifications & Field Adaptations', recap: 'Eruciform, scarabaeiform & vermiform' },
      { id: 4, title: 'The Neuroendocrine Regulatory Cascade', recap: 'PTTH, ecdysone & juvenile hormone' },
      { id: 5, title: 'Diapause vs Quiescence in Insect Dormancy', recap: 'Hormonal arrest vs direct slowdown' },
    ],
    transcripts: {
      1: [
        'Metamorphosis begins with the basic evolutionary division between ametabolous and hemimetabolous insects.',
        'Ametabolous species like silverfish undergo no true metamorphosis, emerging as miniature adults that continue molting throughout their reproductive lives.',
        'Hemimetabolous insects like grasshoppers and cockroaches develop external wing pads over successive nymphal instars without an intervening pupal phase.',
      ],
      2: [
        'Complete metamorphosis or holometaboly represents an evolutionary breakthrough separating larval feeding niches from adult reproductive dispersal.',
        'During the pupal stage, larval organ systems undergo histolysis while adult organs develop from dormant clusters of stem cells called imaginal discs.',
        'This developmental architecture prevents caterpillars and butterflies from competing with one another for the same agricultural food resources.',
      ],
      3: [
        'Insect larvae exhibit distinct body forms tailored to their specific agro-ecological feeding habits.',
        'Caterpillars display an eruciform shape with thoracic legs and abdominal prolegs, while white grubs in sugarcane exhibit a fleshy C-shaped scarabaeiform body.',
        'In contrast, predatory ground beetles possess agile campodeiform bodies, and housefly maggots possess legless vermiform bodies adapted for decaying substrates.',
      ],
      4: [
        'The insect endocrine axis orchestrates every molt through a quantitative balance between juvenile hormone and ecdysone.',
        'Brain neurosecretory cells release prothoracicotropic hormone PTTH, which signals the prothoracic glands to synthesize ecdysone for cuticular renewal.',
        'When juvenile hormone titer drops to zero in the final instar, ecdysone triggers pupal-to-adult metamorphosis rather than another larval molt.',
      ],
      5: [
        'Insects survive adverse seasonal extremes through two distinct biological dormancy strategies.',
        'Quiescence is a direct, immediate arrest of growth caused by acute unfavorable cold or drought, resuming immediately once conditions improve.',
        'Diapause, however, is a genetically programmed neuroendocrine arrest triggered in advance by token environmental stimuli such as photoperiod.',
      ],
    },
  },
  3: {
    episodes: [
      { id: 1, title: 'How weathering transforms bedrock into regolith', recap: 'Bedrock disintegration & saprolite dynamics' },
      { id: 2, title: 'Mechanical forces breaking down Indian landscapes', recap: 'Exfoliation, thermal expansion & V6 wind law' },
      { id: 3, title: 'How life turns solid rock into soil', recap: 'Tree roots, rhizosphere acids & termite pedoturbation' },
      { id: 4, title: 'Mathematical Forces Turning Rock into Soil', recap: 'Hydraulic thresholds, frost wedging & surface area loop' },
    ],
    transcripts: {
      1: [
        'Across the deeply weathered regolith of the Deccan Plateau, vast agricultural soils are formed as solid bedrock transforms over time to sustain plant life.',
        'Mechanical disintegration causes physical fragmentation without chemical change, while chemical decomposition dissolves mineral matrices into simpler oxides.',
        'This continuous synergistic reaction chain between physical fracturing and chemical weathering produces the loose fertile mantle known as regolith.',
      ],
      2: [
        'In physical weathering, mineral permeability and diurnal temperature swings dictate the rate of mechanical rock breakdown.',
        'Quartz expands at double the rate of feldspar, baking stones under the Indian sun until curved outer layers exfoliate like onion skins.',
        'In mountain streams, rushing water speed dictates sediment carrying power, while freezing hydraulic wedges exert over fourteen hundred tons of bursting pressure.',
      ],
      3: [
        'Living organisms, from towering peepal trees to subterranean termites, actively dismantle solid rock to manufacture fertile agricultural soil.',
        'Expanding plant root tips act as slow-motion crowbars in rock joints, while rhizosphere microbial acids solubilize insoluble soil minerals.',
        'Subterranean termites continuously burrow galleries, excavating subsoil minerals and transporting lower horizon nutrients directly to the surface.',
      ],
      4: [
        'The soil genesis feedback loop demonstrates that physical fracturing exponentially multiplies reactive surface area for chemical and biological reactions.',
        'Hydraulic velocity rules govern river sediment transport, where steep mountain sources cause dramatically greater mechanical disintegration.',
        'According to the velocity sixth power law, a marginal increase in wind speed produces an exponential surge in erosive sandblasting power.',
      ],
    },
  },
  4: {
    episodes: [
      { id: 1, title: 'Floral Reproductive Anatomy & Pollen Dehiscence', recap: 'Anther locules & microsporangia' },
      { id: 2, title: 'Cross-Pollination Enforcements & Dichogamy', recap: 'Protandry vs protogyny & herkogamy' },
      { id: 3, title: 'Apiculture & Honey Bee Pollinator Vectors', recap: 'Apis mellifera & corbicular loading' },
      { id: 4, title: 'Floral Constancy & Nectar Guide Signaling', recap: 'UV reflectance & scent attractants' },
      { id: 5, title: 'Commercial Colony Management in Orchards', recap: 'Stocking density & pesticide safety' },
    ],
    transcripts: {
      1: [
        'Pollination constitutes the vital biological gateway to double fertilization, seed formation, and commercial fruit set in angiosperm crops.',
        'Each anther contains four microsporangial locules lined by nutritive tapetum cells which synthesize resistant sporopollenin coats around pollen grains.',
        'Hygroscopic contraction of endothecial cells causes longitudinal dehiscence along the stomium line as ambient relative humidity falls during morning sunlight.',
      ],
      2: [
        'Angiosperms possess evolutionary floral adaptations designed to enforce cross-pollination and prevent inbreeding depression.',
        'Dichogamy separates anther dehiscence and stigma receptivity temporally, either through protandry in sunflowers or protogyny in pearl millet.',
        'Herkogamy and heterostyly impose physical spatial separations, while multi-allelic self-incompatibility systems biochemically abort self-pollen tube germination.',
      ],
      3: [
        'Honey bees of the genus Apis represent the premier managed insect pollinators across global horticultural and oilseed agro-ecosystems.',
        'Worker bees gather pollen using specialized tibial corbiculae or pollen baskets, transferring tens of thousands of viable pollen grains per foraging flight.',
        'Systematic bee pollination enhances seed yields in sunflower, mustard, alfalfa, and apple by fifty to over two hundred percent.',
      ],
      4: [
        'Entomophilous flowers deploy multisensory attractants to guide insect pollinators directly toward reproductive organs.',
        'Petals exhibit ultraviolet-reflective nectar guides visible to the trichromatic visual spectrum of bees but invisible to human vision.',
        'Floral constancy ensures individual bees repeatedly visit flowers of the identical plant taxon, minimizing wasteful heterospecific pollen transfer.',
      ],
      5: [
        'Optimal crop pollination demands calculated commercial honey bee colony stocking rates ranging between two and four hives per hectare.',
        'Colonies should be introduced only after ten to twenty percent crop bloom has commenced to discourage foragers from orienting toward competing weed species.',
        'Pesticide sprays must be scheduled strictly at dusk when bee flight has ceased, and toxic neonicotinoids must be avoided during anthesis.',
      ],
    },
  },
};

export default function ListenScreen({
  chapterNumber = 1,
  chapterTitle,
  initialMode = 'quick',
  onNavigateToRead,
  onBackPress,
  onChapterPress,
}: ListenScreenProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  // Dynamically compute the chapter title if not explicitly provided
  const defaultTitle =
    chapterNumber === 1
      ? 'Insect Digestive System & Anatomy'
      : chapterNumber === 2
      ? 'Insect Metamorphosis & Life Cycles'
      : chapterNumber === 3
      ? 'Weathering of Rocks & Minerals'
      : chapterNumber === 4
      ? 'Insect Pollination & Floral Biology'
      : 'Study Guide';
  const effectiveChapterTitle = chapterTitle || defaultTitle;

  const [mode, setMode] = useState<ListenMode>(initialMode);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [currentSec, setCurrentSec] = useState<number>(0);
  const [speedIndex, setSpeedIndex] = useState<number>(0);
  const [selectedMicrocastId, setSelectedMicrocastId] = useState<number>(1);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; text: string } | null>(null);

  // Quick vs Detailed durations & metadata
  const isQuick = mode === 'quick';
  const isDetailed = mode === 'detailed';
  const isMicro = mode === 'microcasts';

  // Dynamic Microcasts for Current Chapter
  const currentChapterMicro = useMemo(() => {
    if (CHAPTER_MICROCASTS[chapterNumber]) {
      return CHAPTER_MICROCASTS[chapterNumber];
    }
    const fallbackSummary = SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '';
    const audioParas = markdownToAudioParagraphs(fallbackSummary, chapterNumber, effectiveChapterTitle);
    const episodes = [
      { id: 1, title: `${effectiveChapterTitle} — Core Principles`, recap: 'Foundational concepts' },
      { id: 2, title: `${effectiveChapterTitle} — Key Morphological Features`, recap: 'Structural analysis' },
      { id: 3, title: `${effectiveChapterTitle} — Physiological Mechanisms`, recap: 'Biological pathways' },
      { id: 4, title: `${effectiveChapterTitle} — Agro-Ecological Impact`, recap: 'Crop & field dynamics' },
      { id: 5, title: `${effectiveChapterTitle} — Exam & Viva Master Notes`, recap: 'High-yield pointers' },
    ];
    const transcripts: Record<number, string[]> = {
      1: audioParas.slice(0, 3),
      2: audioParas.slice(1, 4),
      3: audioParas.slice(2, 5),
      4: audioParas.slice(0, 2),
      5: audioParas.slice(1, 3),
    };
    return { episodes, transcripts };
  }, [chapterNumber, effectiveChapterTitle]);

  const microcastEpisodes: MicrocastEpisode[] = useMemo(() => {
    return currentChapterMicro.episodes.map((item) => {
      const paras = currentChapterMicro.transcripts[item.id] || [];
      const words = paras.join(' ').split(/\s+/).filter(Boolean);
      const durationSec = Math.max(25, Math.round(words.length / 3.4));
      const m = Math.floor(durationSec / 60);
      const s = durationSec % 60;
      const durationLabel = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      return {
        id: item.id,
        title: item.title,
        recap: item.recap,
        durationSec,
        durationLabel,
        status: `${durationLabel} · ${item.recap}`,
      };
    });
  }, [currentChapterMicro]);

  // Active microcast item
  const activeMicrocast = useMemo(() => {
    return (
      microcastEpisodes.find((e) => e.id === selectedMicrocastId) || microcastEpisodes[0]
    );
  }, [microcastEpisodes, selectedMicrocastId]);

  // Dynamic chapter content from DB / Service
  const [chapterContent, setChapterContent] = useState<{
    quickText: string;
    detailedText: string;
  }>({
    quickText: SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '',
    detailedText: SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '',
  });

  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      try {
        const [quickRes, detailedRes] = await Promise.all([
          fetchQuickStudyGuide('entomology', chapterNumber),
          fetchDetailedNotes('entomology', chapterNumber),
        ]);
        if (isMounted) {
          setChapterContent({
            quickText: quickRes,
            detailedText: detailedRes,
          });
        }
      } catch {
        if (isMounted) {
          setChapterContent({
            quickText: SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '',
            detailedText: SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '',
          });
        }
      }
    };
    loadContent();
    return () => {
      isMounted = false;
    };
  }, [chapterNumber]);

  // Derived audio paragraphs
  const quickParagraphs = useMemo(() => {
    const md = chapterContent.quickText || SAMPLE_STUDY_CONTENT[chapterNumber]?.summary || '';
    return markdownToAudioParagraphs(md, chapterNumber, effectiveChapterTitle);
  }, [chapterContent.quickText, chapterNumber, effectiveChapterTitle]);

  const detailedParagraphs = useMemo(() => {
    const md = chapterContent.detailedText || SAMPLE_STUDY_CONTENT[chapterNumber]?.detailed || '';
    return markdownToAudioParagraphs(md, chapterNumber, effectiveChapterTitle);
  }, [chapterContent.detailedText, chapterNumber, effectiveChapterTitle]);

  const activeParagraphs: string[] = useMemo(() => {
    if (isMicro) {
      return (
        currentChapterMicro.transcripts[selectedMicrocastId] ||
        currentChapterMicro.transcripts[1] ||
        []
      );
    }
    return isDetailed ? detailedParagraphs : quickParagraphs;
  }, [isMicro, isDetailed, selectedMicrocastId, detailedParagraphs, quickParagraphs, currentChapterMicro]);

  // Tokenized paragraphs for word-level karaoke
  const tokenizedParagraphs = useMemo(() => {
    return activeParagraphs.map((p) => tokenizeParagraph(p));
  }, [activeParagraphs]);

  // Total word count
  const totalWordCount = useMemo(() => {
    return tokenizedParagraphs.reduce((acc, words) => acc + words.length, 0);
  }, [tokenizedParagraphs]);

  // Dynamic duration calculated from actual words (~135 words per minute)
  const totalDurationSec = useMemo(() => {
    if (isMicro) return activeMicrocast.durationSec;
    return Math.max(30, Math.round((totalWordCount / 135) * 60));
  }, [isMicro, activeMicrocast.durationSec, totalWordCount]);

  const totalDurationLabel = useMemo(() => {
    const m = Math.floor(totalDurationSec / 60);
    const s = totalDurationSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }, [totalDurationSec]);

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const speedRef = useRef<number>(SPEED_OPTIONS[speedIndex]);
  const tokenizedRef = useRef<TokenizedWord[][]>(tokenizedParagraphs);
  const startTimeRef = useRef<number>(0);
  const lastBoundaryTimeRef = useRef<number>(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    tokenizedRef.current = tokenizedParagraphs;
  }, [tokenizedParagraphs]);

  useEffect(() => {
    speedRef.current = SPEED_OPTIONS[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    };
  }, []);

  // Reset playback if chapter changes
  useEffect(() => {
    Speech.stop();
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
  }, [chapterNumber]);

  const startTicker = () => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setCurrentSec((prev) => {
        const next = prev + 1;
        if (next >= totalDurationSec) {
          setIsPlaying(false);
          isPlayingRef.current = false;
          Speech.stop();
          if (tickerRef.current) clearInterval(tickerRef.current);
          if (wordTickerRef.current) clearInterval(wordTickerRef.current);
          return 0;
        }
        return next;
      });
    }, 1000 / speedRef.current);
  };

  const speakFromWord = (paraIdx: number, wordIdx: number = 0) => {
    const paras = tokenizedRef.current;
    if (paraIdx >= paras.length) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveParagraphIndex(0);
      setActiveWordIndex(-1);
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      return;
    }

    setActiveParagraphIndex(paraIdx);
    setActiveWordIndex(wordIdx);
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (wordTickerRef.current) clearInterval(wordTickerRef.current);

    const paraWords = paras[paraIdx];
    const wordsToSpeak = paraWords.slice(wordIdx);
    const textToSpeak = wordsToSpeak.map((w) => w.raw).join(' ');

    Speech.stop();
    startTimeRef.current = Date.now();
    lastBoundaryTimeRef.current = Date.now();

    // Precompute character offsets for wordsToSpeak:
    const wordCharOffsets: number[] = [];
    let accChar = 0;
    for (let i = 0; i < wordsToSpeak.length; i++) {
      wordCharOffsets.push(accChar);
      accChar += wordsToSpeak[i].raw.length + 1;
    }

    // Natural English TTS speaking tempo: ~22.0 characters per second at 1.0x rate on mobile.
    const charsPerSec = 22.0 * speedRef.current;

    wordTickerRef.current = setInterval(() => {
      if (!isPlayingRef.current) {
        if (wordTickerRef.current) clearInterval(wordTickerRef.current);
        return;
      }
      if (Date.now() - lastBoundaryTimeRef.current > 120) {
        const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
        const currentTargetChar = elapsedSec * charsPerSec;

        let foundIdx = 0;
        for (let i = 0; i < wordCharOffsets.length; i++) {
          if (currentTargetChar >= wordCharOffsets[i]) {
            foundIdx = i;
          } else {
            break;
          }
        }
        setActiveWordIndex(wordIdx + foundIdx);
      }
    }, 35);

    Speech.speak(textToSpeak, {
      rate: speedRef.current,
      onBoundary: (ev: any) => {
        if (ev && typeof ev.charIndex === 'number' && ev.charIndex > 0) {
          lastBoundaryTimeRef.current = Date.now();
          const charIdx = ev.charIndex;
          for (let i = 0; i < wordCharOffsets.length; i++) {
            const nextOffset = i + 1 < wordCharOffsets.length ? wordCharOffsets[i + 1] : Infinity;
            if (charIdx >= wordCharOffsets[i] && charIdx < nextOffset) {
              setActiveWordIndex(wordIdx + i);
              break;
            }
          }
        }
      },
      onDone: () => {
        if (!isPlayingRef.current) return;
        if (wordTickerRef.current) clearInterval(wordTickerRef.current);

        if (paraIdx + 1 < paras.length) {
          speakFromWord(paraIdx + 1, 0);
        } else {
          setIsPlaying(false);
          isPlayingRef.current = false;
          setActiveParagraphIndex(0);
          setActiveWordIndex(-1);
          setCurrentSec(totalDurationSec);
          if (tickerRef.current) clearInterval(tickerRef.current);
        }
      },
      onError: () => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        if (tickerRef.current) clearInterval(tickerRef.current);
        if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      },
    });
  };

  const handleSelectMode = (newMode: ListenMode) => {
    Haptics.selectionAsync();
    Speech.stop();
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (wordTickerRef.current) clearInterval(wordTickerRef.current);
    setIsPlaying(false);
    isPlayingRef.current = false;
    setCurrentSec(0);
    setActiveParagraphIndex(0);
    setActiveWordIndex(-1);
    setMode(newMode);
  };

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (wordTickerRef.current) clearInterval(wordTickerRef.current);
      Speech.stop();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      const pIdx =
        activeParagraphIndex < tokenizedParagraphs.length ? activeParagraphIndex : 0;
      const wIdx =
        activeWordIndex >= 0 && activeWordIndex < (tokenizedParagraphs[pIdx]?.length || 0)
          ? activeWordIndex
          : 0;
      speakFromWord(pIdx, wIdx);
      startTicker();
    }
  };

  const handleWordPress = (pIdx: number, w: TokenizedWord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (w.isGlossary && w.glossaryKey) {
      setActiveTooltip({
        term: w.glossaryKey,
        text: GLOSSARY_TOOLTIPS[w.glossaryKey] || 'Glossary definition',
      });
    }

    let wordsBefore = 0;
    for (let i = 0; i < pIdx; i++) {
      wordsBefore += tokenizedParagraphs[i].length;
    }
    wordsBefore += w.index;

    const targetSec = Math.min(
      totalDurationSec,
      Math.floor((wordsBefore / (totalWordCount || 1)) * totalDurationSec)
    );
    setCurrentSec(targetSec);

    speakFromWord(pIdx, w.index);
    startTicker();
  };

  const handleSkip = (deltaSeconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSec = Math.max(0, Math.min(totalDurationSec, currentSec + deltaSeconds));
    setCurrentSec(newSec);

    const targetGlobalWord = Math.floor((newSec / (totalDurationSec || 1)) * totalWordCount);
    let accumulated = 0;
    let targetPIdx = 0;
    let targetWIdx = 0;

    for (let i = 0; i < tokenizedParagraphs.length; i++) {
      const len = tokenizedParagraphs[i].length;
      if (targetGlobalWord >= accumulated && targetGlobalWord < accumulated + len) {
        targetPIdx = i;
        targetWIdx = targetGlobalWord - accumulated;
        break;
      }
      accumulated += len;
      if (i === tokenizedParagraphs.length - 1) {
        targetPIdx = i;
        targetWIdx = Math.max(0, len - 1);
      }
    }

    if (isPlaying) {
      speakFromWord(targetPIdx, targetWIdx);
      startTicker();
    } else {
      setActiveParagraphIndex(targetPIdx);
      setActiveWordIndex(targetWIdx);
    }
  };

  const handleCycleSpeed = () => {
    Haptics.selectionAsync();
    const nextIdx = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIdx);
    speedRef.current = SPEED_OPTIONS[nextIdx];
    if (isPlaying) {
      speakFromWord(activeParagraphIndex, activeWordIndex >= 0 ? activeWordIndex : 0);
      startTicker();
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, (currentSec / totalDurationSec) * 100);

  // DevMode CSS Color Tokens (.quickListenMobile412918)
  // Background: #f6faf6
  // Brand title: #265945, Tagline: #576b6e
  // Active pill / buttons: #05996b, Selected chip: #1f4d40
  // Card borders: #d1e3d9, Light green containers: #e8f5ed
  const bg = isDark ? '#121E17' : '#F6FAF6';
  const cardBg = isDark ? '#1C2B23' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#D1E3D9';
  const brandColor = isDark ? '#4ADE80' : '#265945';
  const textDark = isDark ? '#FFFFFF' : '#172933';
  const textMuted = isDark ? '#A6C5B3' : '#576B6E';
  const emeraldPrimary = '#05996B';
  const mintPillBg = isDark ? 'rgba(5, 153, 107, 0.15)' : '#E8F5ED';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. BRANDING HEADER OR MICROCASTS HEADER */}
        {isMicro ? (
          /* Microcasts Header */
          <View style={styles.listenChapterHeader}>
            <Text style={[styles.listenChapterTitle, { color: textDark }]}>Microcasts</Text>
            <Text style={[styles.pageSubtitle, { color: isDark ? '#A6C5B3' : '#637375', marginTop: 2 }]}>
              Short audio lessons for focused learning
            </Text>
          </View>
        ) : (
          /* Chapter Title Header */
          <View style={styles.listenChapterHeader}>
            <Text style={[styles.listenChapterTitle, { color: textDark }]}>
              {effectiveChapterTitle}
            </Text>
          </View>
        )}

        {/* 2. THREE LISTEN MODE TABS (.listenModeTabs) */}
        <View style={[styles.listenModeTabs, { backgroundColor: cardBg, borderColor: isMicro ? '#DBE5E0' : cardBorder }]}>
          {/* Quick Listen Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'quick' && [styles.listenTabSelected, { backgroundColor: emeraldPrimary }],
            ]}
            onPress={() => handleSelectMode('quick')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'quick' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text style={[styles.listenTabText, { color: mode === 'quick' ? '#FFFFFF' : textDark }]}>
              Quick Listen
            </Text>
          </TouchableOpacity>

          {/* Detailed Listen Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'detailed' && [styles.listenTabSelected, { backgroundColor: emeraldPrimary }],
            ]}
            onPress={() => handleSelectMode('detailed')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'detailed' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text style={[styles.listenTabText, { color: mode === 'detailed' ? '#FFFFFF' : textDark }]}>
              Detailed Listen
            </Text>
          </TouchableOpacity>

          {/* Microcasts Tab */}
          <TouchableOpacity
            style={[
              styles.listenTab,
              mode === 'microcasts' && [styles.microcastsActiveTab, { backgroundColor: '#00996E' }],
            ]}
            onPress={() => handleSelectMode('microcasts')}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.tabDot,
                { backgroundColor: mode === 'microcasts' ? '#FFFFFF' : (isDark ? '#A6C5B3' : '#172933') },
              ]}
            />
            <Text
              style={[
                styles.listenTabText,
                {
                  color: mode === 'microcasts' ? '#FFFFFF' : textDark,
                  fontWeight: mode === 'microcasts' ? '600' : '500',
                },
              ]}
            >
              Microcasts
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* VIEW A & B: QUICK LISTEN & DETAILED LISTEN                                 */}
        {/* ========================================================================= */}
        {!isMicro ? (
          <>
            {/* 3. Section Label & Chapter Switcher */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { color: textMuted }]}>
                {isQuick ? 'QUICK LISTEN · STANDARD DEPTH' : 'DETAILED LISTEN · 1 OF 1 MATCH'}
              </Text>
              {onChapterPress && (
                <TouchableOpacity
                  style={[styles.chapterPillBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  onPress={onChapterPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="book-outline" size={13} color={emeraldPrimary} />
                  <Text style={[styles.chapterPillBtnText, { color: textDark }]}>
                    Ch {chapterNumber}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* 4. Single Main Player Header */}
            <View style={styles.playerHeader}>
              <TouchableOpacity
                onPress={onChapterPress}
                activeOpacity={onChapterPress ? 0.7 : 1}
                style={styles.playerTitleRow}
              >
                <Text style={[styles.playerTitle, { color: textDark }]}>
                  {isQuick ? `${chapterNumber}. Chapter Quick Recap` : `${chapterNumber}. Chapter Complete Coverage`}
                </Text>
                {onChapterPress && (
                  <Ionicons name="chevron-forward" size={15} color={emeraldPrimary} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
              <Text style={[styles.playerSubtitle, { color: textMuted }]}>
                {effectiveChapterTitle}
              </Text>
            </View>

            {/* 5. Audio Player Controls Card (.audioPlayerControls) */}
            <View style={[styles.audioPlayerControls, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Skip Back 15s */}
              <TouchableOpacity
                style={[styles.back15Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(-15)}
                activeOpacity={0.75}
              >
                <Text style={[styles.backLabel, { color: textDark }]}>↶15</Text>
              </TouchableOpacity>

              {/* Main Play / Pause Circle (44x44) */}
              <TouchableOpacity
                style={[styles.playAudio, { backgroundColor: emeraldPrimary }]}
                onPress={handleTogglePlay}
                activeOpacity={0.85}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Skip Forward 15s */}
              <TouchableOpacity
                style={[styles.forward30Seconds, { backgroundColor: mintPillBg }]}
                onPress={() => handleSkip(15)}
                activeOpacity={0.75}
              >
                <Text style={[styles.forwardLabel, { color: textDark }]}>15↷</Text>
              </TouchableOpacity>

              {/* Speed Button */}
              <TouchableOpacity
                style={styles.speedBtn}
                onPress={handleCycleSpeed}
                activeOpacity={0.75}
              >
                <Text style={[styles.speedText, { color: textDark }]}>
                  {SPEED_OPTIONS[speedIndex]}×
                </Text>
              </TouchableOpacity>

              {/* Duration Timestamp */}
              <Text style={[styles.durationText, { color: textMuted }]}>
                {formatSeconds(currentSec)} / {totalDurationLabel}
              </Text>
            </View>

            {/* 6. Audio Progress Track (.audioProgressTrack) */}
            <View style={[styles.audioProgressTrack, { backgroundColor: isDark ? '#263B30' : '#D1E3D9' }]}>
              <View
                style={[
                  styles.audioProgress,
                  { width: `${progressPercent}%`, backgroundColor: emeraldPrimary },
                ]}
              />
            </View>

            {/* 7. Transcript Section (.transcriptHeading & .transcriptReadingCard) */}
            <View style={styles.transcriptSection}>
              <Text style={[styles.transcriptHeading, { color: textDark }]}>Transcript</Text>
              <Text style={[styles.transcriptHint, { color: textMuted }]}>
                Karaoke sync · Tap any word to jump · Dotted terms to define
              </Text>

              <View style={[styles.transcriptReadingCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {tokenizedParagraphs.map((paraWords, pIdx) => {
                  return (
                    <View
                      key={pIdx}
                      style={styles.transcriptParagraphCard}
                    >
                      <Text style={[styles.transcriptParagraph, { color: textDark }]}>
                        {paraWords.map((w) => {
                          const isWordActive =
                            activeParagraphIndex === pIdx &&
                            activeWordIndex === w.index;
                          const isWordPast =
                            pIdx < activeParagraphIndex ||
                            (pIdx === activeParagraphIndex && w.index < activeWordIndex);

                          return (
                            <Text
                              key={w.index}
                              onPress={() => handleWordPress(pIdx, w)}
                              style={[
                                styles.wordInline,
                                isWordActive && [
                                  styles.wordInlineActive,
                                  { backgroundColor: emeraldPrimary },
                                ],
                                w.isGlossary && styles.wordInlineGlossary,
                                {
                                  color: isWordActive
                                    ? '#FFFFFF'
                                    : isPlaying && !isWordPast
                                    ? (isDark ? '#8DA297' : '#687D72')
                                    : textDark,
                                  fontWeight: isWordActive
                                    ? '700'
                                    : w.isGlossary
                                    ? '600'
                                    : '400',
                                },
                              ]}
                            >
                              {w.raw}{' '}
                            </Text>
                          );
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW C: MICROCASTS VIEW (Figma DevMode .microcastsMobile412918)            */
          /* ========================================================================= */
          <View style={styles.microcastsView}>
            {/* Header row: MICROCASTS · STANDARD DEPTH / 5 lessons matched / See all */}
            <View style={styles.microSectionRow}>
              <View>
                <Text style={[styles.sectionEyebrow, { color: '#175945' }]}>
                  MICROCASTS · STANDARD DEPTH
                </Text>
                <Text style={[styles.filterSummary, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                  5 lessons matched
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.seeAll, { color: '#00996E' }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* List of Microcast Lesson Cards */}
            <View style={styles.microList}>
              {microcastEpisodes.map((ep) => {
                const isSelected = selectedMicrocastId === ep.id;
                return (
                  <TouchableOpacity
                    key={ep.id}
                    style={[
                      styles.microLessonCard,
                      isSelected
                        ? {
                            backgroundColor: isDark ? 'rgba(0, 153, 110, 0.15)' : '#E8F7ED',
                            borderColor: '#00996E',
                          }
                        : {
                            backgroundColor: cardBg,
                            borderColor: isDark ? '#2D4538' : '#DBE5E0',
                          },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMicrocastId(ep.id);
                      if (!isSelected) {
                        Speech.stop();
                        if (tickerRef.current) clearInterval(tickerRef.current);
                        setCurrentSec(0);
                        setIsPlaying(false);
                        isPlayingRef.current = false;
                        setActiveParagraphIndex(0);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    {/* Circle badge: active = green with play/pause or number; inactive = white with gray border & dark text */}
                    {isSelected ? (
                      <View style={[styles.microEpisodeNumberActive, { backgroundColor: '#00996E' }]}>
                        {isPlaying ? (
                          <Ionicons name="pause" size={13} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.microEpisodeNumberActiveText}>{ep.id}</Text>
                        )}
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.microEpisodeNumberInactive,
                          {
                            backgroundColor: cardBg,
                            borderColor: isDark ? '#2D4538' : '#DBE5E0',
                          },
                        ]}
                      >
                        <Text style={[styles.microEpisodeNumberInactiveText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                          {ep.id}
                        </Text>
                      </View>
                    )}

                    {/* Lesson Info: Title & Metadata */}
                    <View style={styles.microLessonInfo}>
                      <Text
                        style={[styles.microEpisodeTitle, { color: isDark ? '#FFFFFF' : '#1A282D' }]}
                        numberOfLines={1}
                      >
                        {ep.title}
                      </Text>
                      <Text style={[styles.microEpisodeMetadata, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                        {ep.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Microcast Compact Audio Player Card (.audioPlayer) */}
            <View
              style={[
                styles.audioPlayerCard,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? '#2D4538' : '#DBE5E0',
                },
              ]}
            >
              {/* Top Row: Headphones Icon, Title, Episode progress, and Track */}
              <View style={styles.audioPlayerTopRow}>
                <View style={[styles.headphonesIconBg, { backgroundColor: isDark ? '#1C2B23' : '#E8F7ED' }]}>
                  <Ionicons name="headset" size={17} color="#175945" />
                </View>
                <View style={styles.audioPlayerTitleWrap}>
                  <Text
                    style={[styles.nowPlayingTitle, { color: isDark ? '#FFFFFF' : '#1A282D' }]}
                    numberOfLines={1}
                  >
                    {activeMicrocast.title}
                  </Text>
                  <Text style={[styles.episodeProgress, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                    Episode {activeMicrocast.id} of {microcastEpisodes.length} · {isPlaying ? 'Playing' : 'Paused'}
                  </Text>
                </View>
              </View>

              {/* Middle Row: Thin 3px Playback Track (.playbackTrack) */}
              <View style={[styles.playbackTrack, { backgroundColor: isDark ? '#263B30' : '#DBE5E0' }]}>
                <View
                  style={[
                    styles.playbackTrackProgress,
                    { width: `${progressPercent}%`, backgroundColor: '#00996E' },
                  ]}
                />
              </View>

              {/* Bottom Row: Replay 15s, Play/Pause Button, Speed Control, Playback Time */}
              <View style={styles.audioPlayerBottomRow}>
                <View style={styles.audioControlsLeft}>
                  {/* Replay 15s (.replay15Seconds) */}
                  <TouchableOpacity
                    style={[
                      styles.replay15Seconds,
                      {
                        backgroundColor: cardBg,
                        borderColor: isDark ? '#2D4538' : '#DBE5E0',
                      },
                    ]}
                    onPress={() => handleSkip(-15)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="refresh" size={11} color={isDark ? '#FFFFFF' : '#1A282D'} />
                  </TouchableOpacity>

                  {/* Play Button (.playButton) */}
                  <TouchableOpacity
                    style={[styles.playButton, { backgroundColor: '#00996E' }]}
                    onPress={handleTogglePlay}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={14} color="#FFFFFF" />
                  </TouchableOpacity>

                  {/* Speed Control (.speedControl) */}
                  <TouchableOpacity
                    style={styles.speedControlBtn}
                    onPress={handleCycleSpeed}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.speedControlText}>
                      {SPEED_OPTIONS[speedIndex]}x
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Playback Time (.playbackTime) */}
                <Text style={[styles.playbackTime, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                  {formatSeconds(currentSec)} / {activeMicrocast.durationLabel}
                </Text>
              </View>
            </View>

            {/* Microcast Transcript Panel (.transcriptPanel) */}
            <View
              style={[
                styles.transcriptPanel,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? '#2D4538' : '#DBE5E0',
                },
              ]}
            >
              <Text style={[styles.transcriptHeadingText, { color: isDark ? '#FFFFFF' : '#1A282D' }]}>
                Transcript
              </Text>
              <Text style={[styles.transcriptHelper, { color: isDark ? '#A6C5B3' : '#637375' }]}>
                Karaoke sync · tap any word to jump · dotted terms to define
              </Text>

              {/* Transcript Divider (.transcriptDivider) */}
              <View style={[styles.transcriptDivider, { backgroundColor: isDark ? '#2D4538' : '#DBE5E0' }]} />

              <View style={styles.transcriptParagraphsWrap}>
                {tokenizedParagraphs.map((paraWords, pIdx) => {
                  return (
                    <View
                      key={pIdx}
                      style={styles.microTranscriptCard}
                    >
                      <Text
                        style={[
                          styles.transcriptParagraphText,
                          { color: isDark ? '#FFFFFF' : '#1A282D' },
                        ]}
                      >
                        {paraWords.map((w) => {
                          const isWordActive =
                            activeParagraphIndex === pIdx &&
                            activeWordIndex === w.index;
                          const isWordPast =
                            pIdx < activeParagraphIndex ||
                            (pIdx === activeParagraphIndex && w.index < activeWordIndex);

                          return (
                            <Text
                              key={w.index}
                              onPress={() => handleWordPress(pIdx, w)}
                              style={[
                                styles.wordInline,
                                isWordActive && [
                                  styles.wordInlineActive,
                                  { backgroundColor: '#00996E' },
                                ],
                                w.isGlossary && styles.wordInlineGlossary,
                                {
                                  color: isWordActive
                                    ? '#FFFFFF'
                                    : isPlaying && !isWordPast
                                    ? (isDark ? '#8DA297' : '#687D72')
                                    : (isDark ? '#FFFFFF' : '#1A282D'),
                                  fontWeight: isWordActive
                                    ? '700'
                                    : w.isGlossary
                                    ? '600'
                                    : '400',
                                },
                              ]}
                            >
                              {w.raw}{' '}
                            </Text>
                          );
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Dotted Term Tooltip Modal */}
      <Modal
        visible={activeTooltip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTooltip(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveTooltip(null)}
        >
          <View style={[styles.tooltipCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.tooltipHeader}>
              <Ionicons name="information-circle" size={20} color={emeraldPrimary} />
              <Text style={[styles.tooltipTitle, { color: textDark }]}>
                {activeTooltip?.term}
              </Text>
            </View>
            <Text style={[styles.tooltipBody, { color: isDark ? '#D8E5DC' : '#2D3E36' }]}>
              {activeTooltip?.text}
            </Text>
            <TouchableOpacity
              style={[styles.tooltipCloseBtn, { backgroundColor: emeraldPrimary }]}
              onPress={() => setActiveTooltip(null)}
            >
              <Text style={styles.tooltipCloseText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  /* Brand Header (.brand, .tagline) */
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  tagline: {
    fontSize: 11,
    lineHeight: 16,
  },
  /* Microcasts Header (.header, .brandMark, .pageTitle, .pageSubtitle, .profileAvatar, .headerDivider) */
  microHeaderContainer: {
    marginBottom: 12,
  },
  microcastsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  microHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtnSmall: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  pageSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  profileAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 11,
    fontWeight: '600',
  },
  headerDivider: {
    height: 1,
    width: '100%',
    marginTop: 12,
  },
  /* Mode Tabs (.listenModeTabs) */
  listenModeTabs: {
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    marginBottom: 16,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  microcastsActiveTab: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  listenTab: {
    flex: 1,
    height: 34,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  listenTabSelected: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  listenTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Section Labels (.sectionLabel) */
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  /* Chapter Audio Summary Card (.chapterAudioSummary) */
  chapterAudioSummary: {
    height: 65,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playChapter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterAudioInfo: {
    flex: 1,
    gap: 2,
  },
  chapterTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  /* Section Header Row with Chapter Switcher */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chapterPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  chapterPillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  /* Player Header (.playerTitle, .playerSubtitle) */
  playerHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  playerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  playerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  /* Controls Card (.audioPlayerControls) */
  audioPlayerControls: {
    height: 67,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  back15Seconds: {
    width: 42,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  playAudio: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forward30Seconds: {
    width: 43,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forwardLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  speedBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
  },
  /* Progress Track (.audioProgressTrack) */
  audioProgressTrack: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 16,
  },
  audioProgress: {
    height: 5,
    borderRadius: 3,
  },
  /* Transcript (.transcriptHeading, .transcriptReadingCard) */
  transcriptSection: {
    marginBottom: 24,
  },
  transcriptHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transcriptHint: {
    fontSize: 9.5,
    marginBottom: 8,
  },
  transcriptReadingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  transcriptParagraphCard: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  transcriptParagraphActive: {
    borderRadius: 6,
  },
  activeSpeakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  activeSpeakerText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  transcriptParagraph: {
    fontSize: 12.5,
    lineHeight: 22,
  },
  wordInline: {
    fontSize: 12.5,
    lineHeight: 22,
  },
  wordInlineActive: {
    borderRadius: 4,
    paddingHorizontal: 3,
  },
  wordInlineGlossary: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  /* Microcasts Layout (.microcastsMobile412918) */
  microcastsView: {
    gap: 12,
  },
  microSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  sectionEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filterSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 11,
    fontWeight: '600',
  },
  microList: {
    gap: 8,
  },
  microLessonCard: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  microEpisodeNumberActive: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microEpisodeNumberActiveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  microEpisodeNumberInactive: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microEpisodeNumberInactiveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  microLessonInfo: {
    flex: 1,
    gap: 2,
  },
  microEpisodeTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  microEpisodeMetadata: {
    fontSize: 9,
  },
  /* Compact Audio Player Card (.audioPlayer) */
  audioPlayerCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 4,
  },
  audioPlayerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headphonesIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioPlayerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  nowPlayingTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  episodeProgress: {
    fontSize: 9,
  },
  playbackTrack: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  playbackTrackProgress: {
    height: 3,
    borderRadius: 1.5,
  },
  audioPlayerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  replay15Seconds: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 31,
    height: 31,
    borderRadius: 15.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedControlBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  speedControlText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#175945',
  },
  playbackTime: {
    fontSize: 8,
    fontWeight: '500',
  },
  /* Microcasts Transcript Panel (.transcriptPanel) */
  transcriptPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  transcriptHeadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  transcriptHelper: {
    fontSize: 9,
    marginTop: 2,
  },
  transcriptDivider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  transcriptParagraphsWrap: {
    gap: 6,
  },
  microTranscriptCard: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  transcriptParagraphText: {
    fontSize: 11.5,
    lineHeight: 18,
  },
  /* Tooltip Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tooltipCard: {
    width: '100%',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  tooltipBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  tooltipCloseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listenChapterHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  listenChapterTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
