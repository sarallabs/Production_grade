import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchMindmap, MindmapData, MindmapNode } from '@/services/contentService';
import { BorderRadius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface BranchData {
  id: number;
  rawId?: string;
  title: string;
  subtitle: string;
  detail: string;
  bloomLevel?: string;
  subtopics: Array<{ title: string; details: string[] }>;
}

export interface ConceptItem {
  id: string;
  symbol: string;
  label: string;
  detail: string;
  branchTitle?: string;
}

const DEFAULT_BRANCHES: BranchData[] = [
  {
    id: 1,
    rawId: 'b_1',
    title: 'FOREGUT (STOMODAEUM)',
    subtitle: 'Ingestion, storage & maceration',
    detail:
      'Ectodermal origin lined with cuticular intima that sheds during molting. Key components: Pharynx (suction pump), Esophagus (conduit), Crop (distensible food storage), and Proventriculus (6 cuticular chitinous teeth for mechanical grinding).',
    bloomLevel: 'L-1 Remembering',
    subtopics: [
      {
        title: 'Embryology & Cuticle',
        details: [
          'Ectodermal origin with cuticular intima',
          'Intima sheds during each nymphal/larval ecdysis',
        ],
      },
      {
        title: 'Key Organs',
        details: [
          'Pharynx: Muscle-powered sucking pump',
          'Esophagus: Straight transport conduit to crop',
          'Crop: Distensible food reservoir for ingestion',
          'Proventriculus: 6 cuticular teeth for mastication',
        ],
      },
    ],
  },
  {
    id: 2,
    rawId: 'b_2',
    title: 'MIDGUT (MESENTERON)',
    subtitle: 'Chemical digestion & absorption',
    detail:
      'Endodermal origin with naked microvillar epithelium. Protected by the porous chitinous peritrophic membrane sleeve. Gastric caeca release digestive enzymes (amylases, proteases, lipases) for active biochemical catabolism.',
    bloomLevel: 'L-2 Understanding',
    subtopics: [
      {
        title: 'Cellular Architecture',
        details: [
          'Endodermal embryonic origin (naked epithelium)',
          'Columnar epithelial cells with microvilli for absorption',
          'Regenerative nidi cells replace worn epithelium',
        ],
      },
      {
        title: 'Peritrophic Membrane',
        details: [
          'Chitin-protein porous meshwork envelope',
          'Protects microvilli from abrasive food particles',
          'Permeable ultrafilter for enzymes & nutrients',
        ],
      },
    ],
  },
  {
    id: 3,
    rawId: 'b_3',
    title: 'HINDGUT (PROCTODAEUM)',
    subtitle: 'Osmoregulation & excretion',
    detail:
      'Ectodermal origin lined with permeable cuticular intima. Subdivided into Ileum, Colon, and Rectum. Malpighian tubules empty excretory waste at the junction; rectal papillae/pads reabsorb over 90% of water and essential salts.',
    bloomLevel: 'L-3 Application',
    subtopics: [
      {
        title: 'Regional Anatomy',
        details: [
          'Ectodermal origin lined with thin cuticular intima',
          'Subdivided into Ileum, Colon, and Rectum',
        ],
      },
      {
        title: 'Osmoregulation & Excretion',
        details: [
          'Malpighian tubules insert at midgut-hindgut junction',
          'Rectal pads/papillae reabsorb water and electrolytes',
          'Compacts dry frass/pellets to avoid desiccation',
        ],
      },
    ],
  },
  {
    id: 4,
    rawId: 'b_4',
    title: 'PHYSIOLOGICAL ADAPTATIONS',
    subtitle: 'Special feeding adaptations',
    detail:
      'Specialized evolutionary modifications: Filter chamber in fluid-sucking Hemiptera to bypass excess water, symbiotic gut flagellates in termites to digest wood cellulose, and cryptonephridial systems in mealworms for desert water conservation.',
    bloomLevel: 'L-4 Analyzing',
    subtopics: [
      {
        title: 'Filter Chamber',
        details: ['Shunts excess fluid in fluid-feeding Hemiptera directly to hindgut'],
      },
      {
        title: 'Symbiotic Digestion',
        details: ['Gut protozoa & bacteria digest wood lignocellulose in termites'],
      },
      {
        title: 'Crypts & Nidi Cells',
        details: ['Stem cell nests regenerate worn midgut epithelium under stress'],
      },
    ],
  },
];

const DEFAULT_CONCEPTS: ConceptItem[] = [
  {
    id: 'c_1',
    symbol: '✦',
    label: 'Enzymes',
    detail:
      'Amylases, lipases, proteases, and invertases synthesized primarily in gastric caeca and ventriculus microvilli.',
    branchTitle: 'MIDGUT',
  },
  {
    id: 'c_2',
    symbol: '↓',
    label: 'Absorption',
    detail:
      'Nutrient uptake across naked endodermal midgut epithelial cells protected by the porous chitinous peritrophic membrane.',
    branchTitle: 'MIDGUT',
  },
  {
    id: 'c_3',
    symbol: '↻',
    label: 'Water Reuse',
    detail:
      'Over 90% of luminal moisture is reclaimed through specialized rectal papillae/pads before uric acid pellets are eliminated.',
    branchTitle: 'HINDGUT',
  },
  {
    id: 'c_4',
    symbol: '⚙',
    label: 'Mastication',
    detail:
      'Six chitinous proventricular cuticular teeth grind solid foliage and food particles before reaching the delicate midgut.',
    branchTitle: 'FOREGUT',
  },
];

interface MindMapRadialDiagramViewProps {
  onNavigateBack?: () => void;
  chapterNumber?: number;
  chapterTitle?: string;
  subjectId?: string;
  subjectName?: string;
  showTopBar?: boolean;
}

export default function MindMapRadialDiagramView({
  onNavigateBack,
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  subjectId = 'entomology',
  subjectName = 'Insect Gut',
  showTopBar = false,
}: MindMapRadialDiagramViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [viewMode, setViewMode] = useState<'diagram' | 'outline'>('diagram');
  const [selectedNode, setSelectedNode] = useState<{
    title: string;
    subtitle?: string;
    detail: string;
    bloomLevel?: string;
    subtopics?: Array<{ title: string; details: string[] }>;
  } | null>(null);

  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
  const [branches, setBranches] = useState<BranchData[]>(DEFAULT_BRANCHES);
  const [concepts, setConcepts] = useState<ConceptItem[]>(DEFAULT_CONCEPTS);
  const [centerTitle, setCenterTitle] = useState<string>('INSECT GUT');
  const [centerSubtitle, setCenterSubtitle] = useState<string>('DIGESTION');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch mind map data from API with fallback
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchMindmap(subjectId, chapterNumber, controller.signal)
      .then((data) => {
        if (!isMounted) return;
        setIsLoading(false);

        if (data && data.rootNode && data.rootNode.children && data.rootNode.children.length > 0) {
          const rootChildren = data.rootNode.children;

          const mappedBranches: BranchData[] = rootChildren.map((child, idx) => {
            const rawSub =
              child.details?.[0] ||
              (child.children?.length ? `${child.children.length} subtopics` : 'Core Concept');

            const subtopicsList =
              child.children?.map((sub) => ({
                title: sub.title,
                details: sub.details || [],
              })) || [];

            const detailText =
              [
                child.details?.join('\n\n'),
                child.children
                  ?.map(
                    (sub) =>
                      `• ${sub.title}${sub.details?.length ? ': ' + sub.details.join('; ') : ''}`
                  )
                  .join('\n\n'),
              ]
                .filter(Boolean)
                .join('\n\n') || child.title;

            return {
              id: idx + 1,
              rawId: child.id,
              title: child.title.toUpperCase(),
              subtitle: rawSub.length > 32 ? rawSub.slice(0, 30) + '...' : rawSub,
              detail: detailText,
              bloomLevel: child.bloomLevel,
              subtopics: subtopicsList,
            };
          });

          // Ensure at least 4 branches for symmetry in the 4-quadrant diagram
          while (mappedBranches.length < 4) {
            const idx = mappedBranches.length;
            const fallback = DEFAULT_BRANCHES[idx] || DEFAULT_BRANCHES[0];
            mappedBranches.push({
              ...fallback,
              id: idx + 1,
            });
          }

          setBranches(mappedBranches);

          // Extract concept pills from subtopics
          const allSubs: ConceptItem[] = [];
          const symbols = ['✦', '↓', '↻', '⚙', '✧', '★'];
          let symIdx = 0;

          rootChildren.forEach((child) => {
            if (child.children) {
              child.children.forEach((sub) => {
                allSubs.push({
                  id: `sub_${sub.id || Math.random().toString(36).slice(2, 7)}`,
                  symbol: symbols[symIdx % symbols.length],
                  label: sub.title,
                  detail: sub.details?.join('\n\n') || sub.title,
                  branchTitle: child.title,
                });
                symIdx++;
              });
            }
          });

          if (allSubs.length > 0) {
            setConcepts(allSubs.slice(0, 6));
          } else {
            setConcepts(DEFAULT_CONCEPTS);
          }

          // Format center hub title
          const rawTitle = data.title || chapterTitle;
          const words = rawTitle
            .replace(/Chapter \d+[:\s]*/i, '')
            .split(/[\s:·—-]+/)
            .filter(Boolean);
          if (words.length >= 2) {
            setCenterTitle(words.slice(0, 2).join(' ').toUpperCase());
            setCenterSubtitle(words.slice(2, 4).join(' ').toUpperCase() || 'FRAMEWORK');
          } else {
            setCenterTitle(rawTitle.slice(0, 14).toUpperCase());
            setCenterSubtitle('FRAMEWORK');
          }
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[MindMapRadial] Error loading mindmap:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber, chapterTitle]);

  const toggleCollapse = (branchKey: string) => {
    Haptics.selectionAsync();
    setCollapsedBranches((prev) => ({
      ...prev,
      [branchKey]: !prev[branchKey],
    }));
  };

  // Color tokens tailored to Figma design system
  const colors = useMemo(
    () =>
      isDark
        ? {
            screenBg: '#2D3E36',
            headerText: '#FEFEFE',
            subText: '#A6C5B3',
            cardBg: '#1E2B24',
            cardBorder: '#3D5449',
            cardActiveBorder: '#E5C07B',
            accentGold: '#E5C07B',
            hubOuterBg: 'rgba(45, 62, 54, 0.95)',
            hubOuterBorder: '#52796F',
            hubInnerBg: '#16231D',
            hubIcon: '#E5C07B',
            hubTitle: '#FEFEFE',
            hubSubtitle: '#A6C5B3',
            branchCardBg: '#1B2620',
            branchCardBorder: '#374C40',
            branchBadgeBg: '#E5C07B',
            branchBadgeText: '#101B15',
            branchTitle: '#FEFEFE',
            branchSub: '#A6C5B3',
            connectorStroke: '#52796F',
            connectorStrokeActive: '#E5C07B',
            pillBg: '#16231D',
            pillBorder: '#374C40',
            pillActiveBg: '#2A3C32',
            pillActiveBorder: '#E5C07B',
            pillText: '#FEFEFE',
            pillSub: '#A6C5B3',
            pillBadgeBg: '#2A3C32',
            pillBadgeText: '#E5C07B',
            pillIconBg: '#E5C07B',
            pillIconText: '#101B15',
            toolbarBg: '#1A2620',
            toolbarBorder: '#374C40',
          }
        : {
            screenBg: '#FFF6F1',
            headerText: '#1C2E24',
            subText: '#597063',
            cardBg: '#FFFFFF',
            cardBorder: '#CCE0D4',
            cardActiveBorder: '#2E7D32',
            accentGold: '#2E7D32',
            hubOuterBg: 'rgba(235, 247, 240, 0.95)',
            hubOuterBorder: '#81C784',
            hubInnerBg: '#204634',
            hubIcon: '#FFFFFF',
            hubTitle: '#FFFFFF',
            hubSubtitle: '#D0EBD8',
            branchCardBg: '#FFFFFF',
            branchCardBorder: '#CCE0D4',
            branchBadgeBg: '#2E7D32',
            branchBadgeText: '#FFFFFF',
            branchTitle: '#1C2E24',
            branchSub: '#597063',
            connectorStroke: '#81C784',
            connectorStrokeActive: '#2E7D32',
            pillBg: '#FFFFFF',
            pillBorder: '#CCE0D4',
            pillActiveBg: '#E8F5E9',
            pillActiveBorder: '#2E7D32',
            pillText: '#1C2E24',
            pillSub: '#597063',
            pillBadgeBg: '#E8F5E9',
            pillBadgeText: '#2E7D32',
            pillIconBg: '#2E7D32',
            pillIconText: '#FFFFFF',
            toolbarBg: '#FFFFFF',
            toolbarBorder: '#DCE7E1',
          },
    [isDark]
  );

  // Exact, collision-free geometry calculations
  const cardWidth = Math.min(SCREEN_WIDTH - 24, 420);
  const canvasWidth = cardWidth - 16;
  const canvasHeight = 490;
  const cx = canvasWidth / 2;
  const cy = 190; // Center Y of the hub

  // Quadrant card dimensions (Guaranteed ZERO overlap)
  const branchCardWidth = Math.floor((canvasWidth - 14) / 2);
  const branchCardHeight = 84;

  // Active subtopics for the bottom interactive strip
  const displayedConcepts = useMemo(() => {
    if (activeBranchId !== null) {
      const activeBranch = branches.find((b) => b.id === activeBranchId);
      if (activeBranch && activeBranch.subtopics && activeBranch.subtopics.length > 0) {
        return activeBranch.subtopics.map((sub, idx) => ({
          id: `active_sub_${idx}`,
          symbol: ['✦', '↓', '↻', '⚙'][idx % 4],
          label: sub.title,
          detail: sub.details?.join('\n\n') || sub.title,
          branchTitle: activeBranch.title,
        }));
      }
    }
    return concepts;
  }, [activeBranchId, branches, concepts]);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Optional Top Bar (only if showTopBar is explicitly requested) */}
      {showTopBar && (
        <View style={styles.headerBar}>
          {onNavigateBack && (
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              onPress={() => {
                Haptics.selectionAsync();
                onNavigateBack();
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="chevron-back" size={20} color={colors.headerText} />
            </TouchableOpacity>
          )}
          <View style={styles.titleBlock}>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>Mind Map</Text>
            <Text style={[styles.headerSubtitle, { color: colors.subText }]} numberOfLines={1}>
              {chapterTitle}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      )}

      {/* Chapter & Subject Ribbon */}
      <View style={styles.ribbonRow}>
        <View style={styles.ribbonLeft}>
          <View style={[styles.subjectBadge, { backgroundColor: colors.pillBadgeBg }]}>
            <Text style={[styles.subjectBadgeText, { color: colors.pillBadgeText }]}>
              {subjectName.toUpperCase()} · CH {chapterNumber}
            </Text>
          </View>
          <Text style={[styles.ribbonTitle, { color: colors.headerText }]} numberOfLines={1}>
            {chapterTitle}
          </Text>
        </View>

        {/* View Mode Switcher: Radial Map vs Topic Breakdown */}
        <View style={[styles.viewModeContainer, { backgroundColor: colors.toolbarBg, borderColor: colors.toolbarBorder }]}>
          <TouchableOpacity
            style={[
              styles.viewModePill,
              viewMode === 'diagram' && [styles.viewModePillActive, { backgroundColor: colors.branchBadgeBg }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode('diagram');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="git-network-outline"
              size={13}
              color={viewMode === 'diagram' ? colors.branchBadgeText : colors.subText}
            />
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'diagram' ? colors.branchBadgeText : colors.subText },
                viewMode === 'diagram' && styles.viewModeTextActive,
              ]}
            >
              Diagram
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModePill,
              viewMode === 'outline' && [styles.viewModePillActive, { backgroundColor: colors.branchBadgeBg }],
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode('outline');
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="list-outline"
              size={13}
              color={viewMode === 'outline' ? colors.branchBadgeText : colors.subText}
            />
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'outline' ? colors.branchBadgeText : colors.subText },
                viewMode === 'outline' && styles.viewModeTextActive,
              ]}
            >
              Outline
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentGold} />
          <Text style={[styles.loadingText, { color: colors.subText }]}>
            Loading interactive mind map...
          </Text>
        </View>
      ) : viewMode === 'diagram' ? (
        /* ─────────────────────────────────────────────────────────────
           1. VISUAL RADIAL DIAGRAM VIEW (100% Non-Colliding & Clickable)
           ───────────────────────────────────────────────────────────── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainer]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.mindMapCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                width: cardWidth,
              },
            ]}
          >
            {/* Header Hint */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Text style={[styles.cardTitle, { color: colors.headerText }]}>
                  {branches.length} Core Branches
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.subText }]}>
                  Tap any branch to highlight subtopics · Tap center for overview
                </Text>
              </View>

              {activeBranchId !== null && (
                <TouchableOpacity
                  style={[styles.resetPill, { backgroundColor: colors.pillBadgeBg }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveBranchId(null);
                  }}
                >
                  <Text style={[styles.resetPillText, { color: colors.pillBadgeText }]}>Reset View</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Canvas Container with Safe Absolute Positioning */}
            <View style={[styles.canvasContainer, { width: canvasWidth, height: canvasHeight }]}>
              {/* SVG Connectors WRAPPED IN POINTER-EVENTS NONE TO GUARANTEE NO TOUCH BLOCKING */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width={canvasWidth} height={canvasHeight}>
                  {/* Subtle Concentric Orbital Ring */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={68}
                    stroke={colors.hubOuterBorder}
                    strokeWidth={1.5}
                    strokeDasharray="4, 4"
                    fill="none"
                    opacity={0.4}
                  />

                  {/* Branch 1 Line (Top Left) */}
                  <Path
                    d={`M ${cx - 28} ${cy - 28} Q ${branchCardWidth * 0.5} ${cy - 40} ${branchCardWidth * 0.5} 94`}
                    stroke={activeBranchId === 1 ? colors.connectorStrokeActive : colors.connectorStroke}
                    strokeWidth={activeBranchId === 1 ? 2.5 : 1.8}
                    strokeOpacity={activeBranchId === 1 ? 1 : 0.6}
                    fill="none"
                  />
                  {/* Branch 2 Line (Top Right) */}
                  <Path
                    d={`M ${cx + 28} ${cy - 28} Q ${canvasWidth - branchCardWidth * 0.5} ${cy - 40} ${canvasWidth - branchCardWidth * 0.5} 94`}
                    stroke={activeBranchId === 2 ? colors.connectorStrokeActive : colors.connectorStroke}
                    strokeWidth={activeBranchId === 2 ? 2.5 : 1.8}
                    strokeOpacity={activeBranchId === 2 ? 1 : 0.6}
                    fill="none"
                  />
                  {/* Branch 3 Line (Bottom Left) */}
                  <Path
                    d={`M ${cx - 28} ${cy + 28} Q ${branchCardWidth * 0.5} ${cy + 40} ${branchCardWidth * 0.5} 290`}
                    stroke={activeBranchId === 3 ? colors.connectorStrokeActive : colors.connectorStroke}
                    strokeWidth={activeBranchId === 3 ? 2.5 : 1.8}
                    strokeOpacity={activeBranchId === 3 ? 1 : 0.6}
                    fill="none"
                  />
                  {/* Branch 4 Line (Bottom Right) */}
                  <Path
                    d={`M ${cx + 28} ${cy + 28} Q ${canvasWidth - branchCardWidth * 0.5} ${cy + 40} ${canvasWidth - branchCardWidth * 0.5} 290`}
                    stroke={activeBranchId === 4 ? colors.connectorStrokeActive : colors.connectorStroke}
                    strokeWidth={activeBranchId === 4 ? 2.5 : 1.8}
                    strokeOpacity={activeBranchId === 4 ? 1 : 0.6}
                    fill="none"
                  />

                  {/* Node Connector Anchor Dots */}
                  <Circle cx={branchCardWidth * 0.5} cy={94} r={3} fill={colors.accentGold} />
                  <Circle cx={canvasWidth - branchCardWidth * 0.5} cy={94} r={3} fill={colors.accentGold} />
                  <Circle cx={branchCardWidth * 0.5} cy={290} r={3} fill={colors.accentGold} />
                  <Circle cx={canvasWidth - branchCardWidth * 0.5} cy={290} r={3} fill={colors.accentGold} />
                </Svg>
              </View>

              {/* ─────────────────────────────────────────────────────────
                  BAND 1: TOP ROW (Branch 1 & Branch 2)
                  y: 10 .. 94 (Height: 84px) - Zero overlap with hub at 144
                  ───────────────────────────────────────────────────────── */}
              {/* Branch Card 1: Top Left */}
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  {
                    top: 10,
                    left: 2,
                    width: branchCardWidth,
                    height: branchCardHeight,
                    backgroundColor: activeBranchId === 1 ? colors.pillActiveBg : colors.branchCardBg,
                    borderColor: activeBranchId === 1 ? colors.cardActiveBorder : colors.branchCardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveBranchId(activeBranchId === 1 ? null : 1);
                  setSelectedNode({
                    title: `1. ${branches[0]?.title}`,
                    subtitle: branches[0]?.subtitle,
                    detail: branches[0]?.detail,
                    bloomLevel: branches[0]?.bloomLevel,
                    subtopics: branches[0]?.subtopics,
                  });
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.branchHeaderRow}>
                  <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                    <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>1</Text>
                  </View>
                  <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]} numberOfLines={1}>
                    {branches[0]?.title || 'FOREGUT'}
                  </Text>
                </View>
                <Text style={[styles.branchCardSub, { color: colors.branchSub }]} numberOfLines={2}>
                  {branches[0]?.subtitle || 'Ingestion & temporary storage'}
                </Text>
                <View style={styles.branchSubCountRow}>
                  <Text style={[styles.branchSubCountText, { color: colors.accentGold }]}>
                    {branches[0]?.subtopics?.length || 2} Subtopics · Tap to view
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Branch Card 2: Top Right */}
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  {
                    top: 10,
                    right: 2,
                    width: branchCardWidth,
                    height: branchCardHeight,
                    backgroundColor: activeBranchId === 2 ? colors.pillActiveBg : colors.branchCardBg,
                    borderColor: activeBranchId === 2 ? colors.cardActiveBorder : colors.branchCardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveBranchId(activeBranchId === 2 ? null : 2);
                  setSelectedNode({
                    title: `2. ${branches[1]?.title}`,
                    subtitle: branches[1]?.subtitle,
                    detail: branches[1]?.detail,
                    bloomLevel: branches[1]?.bloomLevel,
                    subtopics: branches[1]?.subtopics,
                  });
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.branchHeaderRow}>
                  <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                    <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>2</Text>
                  </View>
                  <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]} numberOfLines={1}>
                    {branches[1]?.title || 'MIDGUT'}
                  </Text>
                </View>
                <Text style={[styles.branchCardSub, { color: colors.branchSub }]} numberOfLines={2}>
                  {branches[1]?.subtitle || 'Chemical digestion & absorption'}
                </Text>
                <View style={styles.branchSubCountRow}>
                  <Text style={[styles.branchSubCountText, { color: colors.accentGold }]}>
                    {branches[1]?.subtopics?.length || 2} Subtopics · Tap to view
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ─────────────────────────────────────────────────────────
                  BAND 2: CENTRAL HUB (cy = 190)
                  y: 144 .. 236 (Size: 92px)
                  Clearance from Band 1 (ends at 94) = 50px
                  Clearance to Band 3 (starts at 290) = 54px
                  ───────────────────────────────────────────────────────── */}
              <TouchableOpacity
                style={[
                  styles.outerCircle,
                  {
                    top: cy - 46,
                    left: cx - 46,
                    backgroundColor: colors.hubOuterBg,
                    borderColor: colors.hubOuterBorder,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSelectedNode({
                    title: `${centerTitle} ${centerSubtitle}`,
                    subtitle: `Chapter ${chapterNumber} · ${chapterTitle}`,
                    detail:
                      'The central physiological system responsible for insect nutrient assimilation, mechanical maceration, chemical catabolism, water economy, and waste excretion.\n\nTap each of the surrounding branch nodes (1: Foregut, 2: Midgut, 3: Hindgut, 4: Adaptations) for anatomical partitions, histology, enzymes, and examination takeaways.',
                    bloomLevel: 'Core Syllabus Architecture',
                    subtopics: branches.map((b) => ({
                      title: b.title,
                      details: [b.subtitle],
                    })),
                  });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.innerCircle,
                    {
                      backgroundColor: colors.hubInnerBg,
                    },
                  ]}
                >
                  <Text style={[styles.centerFlowerIcon, { color: colors.hubIcon }]}>✿</Text>
                  <Text style={[styles.centerTitleText, { color: colors.hubTitle }]} numberOfLines={1}>
                    {centerTitle}
                  </Text>
                  <Text
                    style={[styles.centerSubtitleText, { color: colors.hubSubtitle }]}
                    numberOfLines={1}
                  >
                    {centerSubtitle}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ─────────────────────────────────────────────────────────
                  BAND 3: BOTTOM ROW (Branch 3 & Branch 4)
                  y: 290 .. 374 (Height: 84px) - Zero overlap with hub at 236
                  ───────────────────────────────────────────────────────── */}
              {/* Branch Card 3: Bottom Left */}
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  {
                    top: 290,
                    left: 2,
                    width: branchCardWidth,
                    height: branchCardHeight,
                    backgroundColor: activeBranchId === 3 ? colors.pillActiveBg : colors.branchCardBg,
                    borderColor: activeBranchId === 3 ? colors.cardActiveBorder : colors.branchCardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveBranchId(activeBranchId === 3 ? null : 3);
                  setSelectedNode({
                    title: `3. ${branches[2]?.title}`,
                    subtitle: branches[2]?.subtitle,
                    detail: branches[2]?.detail,
                    bloomLevel: branches[2]?.bloomLevel,
                    subtopics: branches[2]?.subtopics,
                  });
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.branchHeaderRow}>
                  <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                    <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>3</Text>
                  </View>
                  <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]} numberOfLines={1}>
                    {branches[2]?.title || 'HINDGUT'}
                  </Text>
                </View>
                <Text style={[styles.branchCardSub, { color: colors.branchSub }]} numberOfLines={2}>
                  {branches[2]?.subtitle || 'Osmoregulation & water reabsorption'}
                </Text>
                <View style={styles.branchSubCountRow}>
                  <Text style={[styles.branchSubCountText, { color: colors.accentGold }]}>
                    {branches[2]?.subtopics?.length || 2} Subtopics · Tap to view
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Branch Card 4: Bottom Right */}
              <TouchableOpacity
                style={[
                  styles.branchCard,
                  {
                    top: 290,
                    right: 2,
                    width: branchCardWidth,
                    height: branchCardHeight,
                    backgroundColor: activeBranchId === 4 ? colors.pillActiveBg : colors.branchCardBg,
                    borderColor: activeBranchId === 4 ? colors.cardActiveBorder : colors.branchCardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveBranchId(activeBranchId === 4 ? null : 4);
                  setSelectedNode({
                    title: `4. ${branches[3]?.title}`,
                    subtitle: branches[3]?.subtitle,
                    detail: branches[3]?.detail,
                    bloomLevel: branches[3]?.bloomLevel,
                    subtopics: branches[3]?.subtopics,
                  });
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View style={styles.branchHeaderRow}>
                  <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                    <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>4</Text>
                  </View>
                  <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]} numberOfLines={1}>
                    {branches[3]?.title || 'ADAPTATIONS'}
                  </Text>
                </View>
                <Text style={[styles.branchCardSub, { color: colors.branchSub }]} numberOfLines={2}>
                  {branches[3]?.subtitle || 'Special feeding adaptations'}
                </Text>
                <View style={styles.branchSubCountRow}>
                  <Text style={[styles.branchSubCountText, { color: colors.accentGold }]}>
                    {branches[3]?.subtopics?.length || 2} Subtopics · Tap to view
                  </Text>
                </View>
              </TouchableOpacity>

              {/* ─────────────────────────────────────────────────────────
                  BAND 4: KEY SUBTOPICS / CONCEPTS STRIP
                  y: 405 .. 475 (Clearance from Band 3 = 31px)
                  Horizontal scrollable carousel so NO TEXT EVER OVERFLOWS!
                  ───────────────────────────────────────────────────────── */}
              <View style={[styles.conceptsStripContainer, { top: 405, width: canvasWidth }]}>
                <View style={styles.conceptsStripHeader}>
                  <Text style={[styles.conceptsStripTitle, { color: colors.accentGold }]}>
                    {activeBranchId !== null
                      ? `✦ BRANCH ${activeBranchId} SUBTOPICS`
                      : '✦ KEY ANATOMICAL CONCEPTS'}
                  </Text>
                  <Text style={[styles.conceptsStripHint, { color: colors.subText }]}>
                    Swipe & tap to inspect
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.conceptsScrollContent}
                >
                  {displayedConcepts.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      style={[
                        styles.conceptCardPill,
                        {
                          backgroundColor: colors.pillBg,
                          borderColor: colors.pillBorder,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedNode({
                          title: item.label,
                          subtitle: item.branchTitle || 'Key Anatomical Concept',
                          detail: item.detail,
                        });
                      }}
                      activeOpacity={0.75}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <View style={[styles.conceptSymbolBadge, { backgroundColor: colors.pillIconBg }]}>
                        <Text style={[styles.conceptSymbolText, { color: colors.pillIconText }]}>
                          {item.symbol}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.conceptLabelText, { color: colors.pillText }]} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text style={[styles.conceptSubText, { color: colors.pillSub }]} numberOfLines={1}>
                          {item.detail.slice(0, 32)}...
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.subText} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Footer Hint */}
            <View style={styles.footerHintRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.subText} />
              <Text style={[styles.footerHintText, { color: colors.subText }]}>
                Every node is clickable. Tap any card or concept to open detailed exam notes.
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           2. OUTLINE / TOPIC BREAKDOWN TREE VIEW (Searchable & Hierarchical)
           ───────────────────────────────────────────────────────────── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainer]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="search-outline" size={17} color={colors.subText} />
            <TextInput
              style={[styles.searchInput, { color: colors.headerText }]}
              placeholder="Search organs, enzymes, histology..."
              placeholderTextColor={colors.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color={colors.subText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Hierarchical Accordion Branches */}
          <View style={styles.treeBranchesContainer}>
            {branches
              .filter((b) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const inTitle = b.title.toLowerCase().includes(q);
                const inSub = b.subtitle.toLowerCase().includes(q);
                const inDet = b.detail.toLowerCase().includes(q);
                const inSubs = b.subtopics?.some(
                  (s) =>
                    s.title.toLowerCase().includes(q) ||
                    s.details?.some((d) => d.toLowerCase().includes(q))
                );
                return inTitle || inSub || inDet || inSubs;
              })
              .map((branch, bIdx) => {
                const branchKey = String(branch.rawId || branch.id || bIdx);
                const isCollapsed = !!collapsedBranches[branchKey];

                return (
                  <View
                    key={branchKey}
                    style={[
                      styles.treeBranchCard,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {/* Branch Header */}
                    <TouchableOpacity
                      style={styles.treeBranchHeader}
                      onPress={() => toggleCollapse(branchKey)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.treeBranchTitleRow}>
                        <View
                          style={[
                            styles.treeBranchBadge,
                            { backgroundColor: colors.branchBadgeBg },
                          ]}
                        >
                          <Text style={[styles.treeBranchBadgeText, { color: colors.branchBadgeText }]}>
                            {bIdx + 1}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.treeBranchTitle, { color: colors.headerText }]}>
                            {branch.title}
                          </Text>
                          <Text style={[styles.treeBranchSubtitle, { color: colors.subText }]}>
                            {branch.subtitle}
                          </Text>
                        </View>
                      </View>

                      {branch.bloomLevel && (
                        <View style={[styles.bloomBadge, { backgroundColor: colors.pillBadgeBg }]}>
                          <Text style={[styles.bloomBadgeText, { color: colors.pillBadgeText }]}>
                            {branch.bloomLevel}
                          </Text>
                        </View>
                      )}

                      <Ionicons
                        name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                        size={18}
                        color={colors.subText}
                      />
                    </TouchableOpacity>

                    {/* Collapsible Content */}
                    {!isCollapsed && (
                      <View style={styles.treeBranchBody}>
                        {/* Summary description */}
                        <Text style={[styles.treeBranchSummary, { color: colors.headerText }]}>
                          {branch.detail.split('\n\n•')[0]}
                        </Text>

                        {/* Subtopics List */}
                        {branch.subtopics && branch.subtopics.length > 0 && (
                          <View style={styles.subtopicsContainer}>
                            {branch.subtopics.map((sub, sIdx) => (
                              <TouchableOpacity
                                key={sIdx}
                                style={[
                                  styles.subtopicPillRow,
                                  {
                                    backgroundColor: colors.pillBg,
                                    borderColor: colors.pillBorder,
                                  },
                                ]}
                                onPress={() => {
                                  Haptics.selectionAsync();
                                  setSelectedNode({
                                    title: sub.title,
                                    subtitle: `${branch.title} Subtopic`,
                                    detail:
                                      sub.details && sub.details.length > 0
                                        ? sub.details.map((d) => `• ${d}`).join('\n\n')
                                        : 'Detailed anatomical concept for examination preparation.',
                                    bloomLevel: branch.bloomLevel,
                                  });
                                }}
                                activeOpacity={0.8}
                              >
                                <View style={styles.subtopicLeft}>
                                  <View style={[styles.subtopicBullet, { backgroundColor: colors.accentGold }]} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.subtopicTitle, { color: colors.headerText }]}>
                                      {sub.title}
                                    </Text>
                                    {sub.details && sub.details.length > 0 && (
                                      <Text
                                        style={[styles.subtopicSnippet, { color: colors.subText }]}
                                        numberOfLines={1}
                                      >
                                        {sub.details[0]}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                <Ionicons name="information-circle-outline" size={17} color={colors.subText} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        </ScrollView>
      )}

      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE CONCEPT DETAIL INSPECTOR MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={!!selectedNode}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNode(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedNode(null)}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <Text style={[styles.modalTitle, { color: colors.headerText }]}>
                  {selectedNode?.title}
                </Text>
                {selectedNode?.subtitle && (
                  <Text style={[styles.modalSubtitle, { color: colors.subText }]}>
                    {selectedNode.subtitle}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setSelectedNode(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>

            {/* Depth / Bloom's Tag */}
            {selectedNode?.bloomLevel && (
              <View style={[styles.modalBloomPill, { backgroundColor: colors.pillBadgeBg }]}>
                <Ionicons name="school-outline" size={13} color={colors.pillBadgeText} />
                <Text style={[styles.modalBloomText, { color: colors.pillBadgeText }]}>
                  {selectedNode.bloomLevel}
                </Text>
              </View>
            )}

            {/* Modal Body */}
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalBodyText, { color: colors.headerText }]}>
                {selectedNode?.detail}
              </Text>

              {/* Sub-divisions list */}
              {selectedNode?.subtopics && selectedNode.subtopics.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.modalSectionLabel, { color: colors.accentGold }]}>
                    Key Sub-Divisions & Histology:
                  </Text>
                  {selectedNode.subtopics.map((sub, idx) => (
                    <View key={idx} style={styles.modalSubtopicBox}>
                      <Text style={[styles.modalSubtopicTitle, { color: colors.headerText }]}>
                        ▸ {sub.title}
                      </Text>
                      {sub.details?.map((d, dIdx) => (
                        <Text key={dIdx} style={[styles.modalSubtopicDetail, { color: colors.subText }]}>
                          • {d}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: colors.branchBadgeBg }]}
              onPress={() => setSelectedNode(null)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalActionBtnText, { color: colors.branchBadgeText }]}>
                Got it
              </Text>
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
  headerBar: {
    marginHorizontal: Spacing.four,
    marginTop: 8,
    marginBottom: 6,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 34,
    height: 34,
  },
  /* Ribbon */
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  ribbonLeft: {
    flex: 1,
    gap: 2,
  },
  subjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  subjectBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ribbonTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  /* View Switcher */
  viewModeContainer: {
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 2,
  },
  viewModePill: {
    paddingHorizontal: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewModePillActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  viewModeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  viewModeTextActive: {
    fontWeight: '800',
  },
  /* Scroll & Card */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 28,
    alignItems: 'center',
  },
  tabletContainer: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  mindMapCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'column',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
    gap: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  resetPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  resetPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  /* Canvas Layout */
  canvasContainer: {
    position: 'relative',
    marginVertical: 2,
  },
  /* Central Concentric Hub */
  outerCircle: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: 4,
  },
  centerFlowerIcon: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
  centerTitleText: {
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: 1,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  centerSubtitleText: {
    fontSize: 7.5,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  /* Branch Quadrant Cards */
  branchCard: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 7,
    paddingHorizontal: 9,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  branchNumberBadge: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchNumberText: {
    fontSize: 10,
    fontWeight: '800',
  },
  branchCardTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    flex: 1,
    letterSpacing: 0.3,
  },
  branchCardSub: {
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 12.5,
  },
  branchSubCountRow: {
    marginTop: 2,
  },
  branchSubCountText: {
    fontSize: 8.5,
    fontWeight: '700',
  },
  /* Concepts Strip */
  conceptsStripContainer: {
    position: 'absolute',
    zIndex: 20,
    gap: 4,
  },
  conceptsStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  conceptsStripTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  conceptsStripHint: {
    fontSize: 9,
    fontWeight: '500',
  },
  conceptsScrollContent: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  conceptCardPill: {
    width: 148,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  conceptSymbolBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptSymbolText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  conceptLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  conceptSubText: {
    fontSize: 8.5,
    fontWeight: '500',
    marginTop: 1,
  },
  footerHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  footerHintText: {
    fontSize: 9.5,
    fontWeight: '500',
  },
  /* Outline / Tree View Styles */
  searchBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 2,
  },
  treeBranchesContainer: {
    width: '100%',
    gap: 10,
  },
  treeBranchCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  treeBranchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    gap: 8,
  },
  treeBranchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  treeBranchBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeBranchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  treeBranchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  treeBranchSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  bloomBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  bloomBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  treeBranchBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
  },
  treeBranchSummary: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  subtopicsContainer: {
    gap: 8,
  },
  subtopicPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  subtopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  subtopicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subtopicTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  subtopicSnippet: {
    fontSize: 9.5,
    marginTop: 1,
  },
  /* Loading */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  modalBloomPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
  },
  modalBloomText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 2,
  },
  modalBodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalSubtopicBox: {
    marginTop: 6,
    paddingLeft: 6,
  },
  modalSubtopicTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalSubtopicDetail: {
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: '500',
    paddingLeft: 10,
    marginTop: 1,
  },
  modalActionBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
