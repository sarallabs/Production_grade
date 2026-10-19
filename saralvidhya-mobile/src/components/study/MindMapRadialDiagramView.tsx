import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BranchData {
  id: number;
  title: string;
  subtitle: string;
  detail: string;
}

const BRANCHES: BranchData[] = [
  {
    id: 1,
    title: 'STRUCTURE',
    subtitle: 'Parts of the gut',
    detail:
      'Composed of three primary regions: Foregut (Stomodaeum for ingestion & proventriculus mastication), Midgut (Mesenteron for enzymatic secretion & microvilli absorption), and Hindgut (Proctodaeum for osmoregulation & water reabsorption).',
  },
  {
    id: 2,
    title: 'FUNCTION',
    subtitle: 'What it does',
    detail:
      'Performs physical digestion (cuticular teeth in proventriculus), biochemical catabolism of macromolecules via midgut enzymes, and nutrient transport directly to hemolymph without a closed vascular loop.',
  },
  {
    id: 3,
    title: 'PROCESS',
    subtitle: 'Food breakdown',
    detail:
      'Food ingestion -> Crop storage -> Proventriculus filtration -> Gastric caeca enzyme release -> Peritrophic membrane ultrafiltration -> Rectal pad water reabsorption.',
  },
  {
    id: 4,
    title: 'ADAPTATIONS',
    subtitle: 'Special features',
    detail:
      'Evolutionary specializations: Filter chamber in sap-sucking Hemiptera, symbiotic protozoa for cellulose in wood-feeding Isoptera (termites), and high-capacity rectal papillae for extreme terrestrial water economy.',
  },
];

interface ConceptData {
  id: string;
  symbol: string;
  label: string;
  detail: string;
}

const CONCEPTS: ConceptData[] = [
  {
    id: 'enzymes',
    symbol: '✦',
    label: 'Enzymes',
    detail:
      'Amylases, lipases, proteases, and invertases synthesized primarily in gastric caeca and ventriculus microvilli.',
  },
  {
    id: 'absorption',
    symbol: '↓',
    label: 'Absorption',
    detail:
      'Nutrient uptake across naked endodermal midgut epithelial cells protected by the porous chitinous peritrophic membrane.',
  },
  {
    id: 'water_reuse',
    symbol: '↻',
    label: 'Water reuse',
    detail:
      'Over 90% of luminal moisture is reclaimed through specialized rectal papillae/pads before uric acid pellets are eliminated.',
  },
  {
    id: 'wood_sap',
    symbol: '✧',
    label: 'Wood & sap',
    detail:
      'Symbiotic gut flagellates break down wood lignocellulose in termites; filter chambers shunt excess sap water in plant-sucking insects.',
  },
];

interface MindMapRadialDiagramViewProps {
  onNavigateBack?: () => void;
  chapterTitle?: string;
  subjectName?: string;
}

export default function MindMapRadialDiagramView({
  onNavigateBack,
  chapterTitle = 'Insect Digestive System & Anatomy',
  subjectName = 'Insect Gut',
}: MindMapRadialDiagramViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [zoomScale, setZoomScale] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<{
    title: string;
    subtitle?: string;
    detail: string;
  } | null>(null);

  // Exact theme token mappings from user's Figma React & CSS files
  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        topAccentBar: '#ddb669', // Rich gold
        headerText: '#fefefe',
        subText: '#7ba88b',
        backBtnBg: '#1E2B24',
        backBtnBorder: '#3D5449',
        toolbarBg: '#1E2B24',
        toolbarBorder: '#3D5449',
        toolbarText: '#fefefe',
        toolbarSub: '#7ba88b',
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        cardTitle: '#fefefe',
        cardSubtitle: '#7ba88b',
        headerPillBg: '#1E2B24',
        headerPillBorder: '#3D5449',
        headerPillText: '#fefefe',
        mapCanvasBg: '#23322B',
        outerCircleBg: '#2b4a3e',
        outerCircleBorder: '#3D5449',
        innerCircleBg: '#1E2B24',
        centerIconColor: '#fefefe',
        centerTitle: '#fefefe',
        centerSubtitle: '#7ba88b',
        branchCardBg: '#1E2B24',
        branchCardBorder: '#3D5449',
        branchBadgeBg: '#ddb669',
        branchBadgeText: '#070707',
        branchTitle: '#fefefe',
        branchSub: '#7ba88b',
        connectorLine: '#3D5449',
        connectorLineSub: '#3D5449',
        conceptCardBg: '#1E2B24',
        conceptCardBorder: '#3D5449',
        conceptIconOuterBg: '#1E2B24',
        conceptIconOuterBorder: '#3D5449',
        conceptIconInnerBg: '#ddb669',
        conceptIconSymbol: '#070707',
        conceptLabel: '#fefefe',
        legendPillBg: '#1E2B24',
        legendPillBorder: '#3D5449',
        legendPillText: '#fefefe',
      }
    : {
        screenBg: '#FFF6F1',
        topAccentBar: '#459d5c', // Botanical green
        headerText: '#263b31',
        subText: '#718177',
        backBtnBg: '#ffffff',
        backBtnBorder: '#e1e8e2',
        toolbarBg: '#ffffff',
        toolbarBorder: '#459d5c',
        toolbarText: '#263b31',
        toolbarSub: '#718177',
        cardBg: '#fff4ea',
        cardBorder: '#459d5c',
        cardTitle: '#263b31',
        cardSubtitle: '#718177',
        headerPillBg: '#ffffff',
        headerPillBorder: '#e1e8e2',
        headerPillText: '#263b31',
        mapCanvasBg: '#fff4ea',
        outerCircleBg: '#ddefe3',
        outerCircleBorder: '#459d5c',
        innerCircleBg: '#284d3d',
        centerIconColor: '#ffffff',
        centerTitle: '#ffffff',
        centerSubtitle: '#ddefe3',
        branchCardBg: '#ffffff',
        branchCardBorder: '#e1e8e2',
        branchBadgeBg: '#459d5c',
        branchBadgeText: '#ffffff',
        branchTitle: '#263b31',
        branchSub: '#718177',
        connectorLine: '#2d3e36',
        connectorLineSub: '#2d3e36',
        conceptCardBg: '#ffffff',
        conceptCardBorder: '#e1e8e2',
        conceptIconOuterBg: '#ffffff',
        conceptIconOuterBorder: '#459d5c',
        conceptIconInnerBg: '#459d5c',
        conceptIconSymbol: '#ffffff',
        conceptLabel: '#263b31',
        legendPillBg: '#ffffff',
        legendPillBorder: '#e1e8e2',
        legendPillText: '#263b31',
      };

  const handleZoom = (action: 'in' | 'out' | 'fit') => {
    Haptics.selectionAsync();
    if (action === 'in') setZoomScale((prev) => Math.min(prev + 0.1, 1.25));
    else if (action === 'out') setZoomScale((prev) => Math.max(prev - 0.1, 0.8));
    else setZoomScale(1);
  };

  const cardWidth = Math.min(SCREEN_WIDTH - 32, 420);
  const canvasWidth = cardWidth - 28;
  const canvasHeight = 490;
  const cx = canvasWidth / 2;
  const cy = 205; // Center of the concentric circle hub

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Top green/gold progress accent bar */}
      <View
        style={[
          styles.topAccentBar,
          {
            backgroundColor: colors.topAccentBar,
            marginTop: insets.top > 0 ? insets.top + 6 : 14,
          },
        ]}
      />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: colors.backBtnBg,
              borderColor: colors.backBtnBorder,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            if (onNavigateBack) onNavigateBack();
          }}
          activeOpacity={0.75}
          accessibilityLabel="Back"
        >
          <Text style={[styles.backArrowText, { color: colors.headerText }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.titleBlock}>
          <Text style={[styles.headerTitle, { color: colors.headerText }]}>Mind Map</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]} numberOfLines={1}>
            {chapterTitle}
          </Text>
        </View>

        {/* Symmetry spacer */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Scrollable Diagram Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Toolbar */}
        <View
          style={[
            styles.toolbarPill,
            {
              backgroundColor: colors.toolbarBg,
              borderColor: colors.toolbarBorder,
            },
          ]}
        >
          <Text style={[styles.toolbarLeftText, { color: colors.toolbarText }]}>
            ✦  Explore the connections
          </Text>

          <View style={styles.zoomControlsRow}>
            <TouchableOpacity onPress={() => handleZoom('out')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.zoomBtnText, { color: colors.toolbarSub }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleZoom('fit')} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Text style={[styles.zoomFitText, { color: colors.toolbarSub }]}>Fit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleZoom('in')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.zoomBtnText, { color: colors.toolbarSub }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Mind Map Radial Card */}
        <View
          style={[
            styles.mindMapCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              transform: [{ scale: zoomScale }],
            },
          ]}
        >
          {/* Card Header */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitle, { color: colors.cardTitle }]}>{subjectName}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.cardSubtitle }]}>
                Digestion & Anatomy
              </Text>
            </View>

            <View
              style={[
                styles.headerPillBadge,
                {
                  backgroundColor: colors.headerPillBg,
                  borderColor: colors.headerPillBorder,
                },
              ]}
            >
              <Text style={[styles.headerPillText, { color: colors.headerPillText }]}>
                4 branches  ·  8 concepts
              </Text>
            </View>
          </View>

          {/* Map Canvas with Concentric Hub, Branches, and Connectors */}
          <View style={[styles.canvasContainer, { width: canvasWidth, height: canvasHeight }]}>
            {/* SVG Connector Lines */}
            <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
              {/* Radial diagonal lines from center hub */}
              {/* Line to Branch 1 (top left) */}
              <Line
                x1={cx - 45}
                y1={cy - 45}
                x2={cx - 95}
                y2={cy - 110}
                stroke={colors.connectorLine}
                strokeWidth={1.6}
                strokeOpacity={0.65}
              />
              {/* Line to Branch 2 (top right) */}
              <Line
                x1={cx + 45}
                y1={cy - 45}
                x2={cx + 95}
                y2={cy - 110}
                stroke={colors.connectorLine}
                strokeWidth={1.6}
                strokeOpacity={0.65}
              />
              {/* Line to Branch 3 (bottom left) */}
              <Line
                x1={cx - 45}
                y1={cy + 45}
                x2={cx - 88}
                y2={cy + 105}
                stroke={colors.connectorLine}
                strokeWidth={1.6}
                strokeOpacity={0.65}
              />
              {/* Line to Branch 4 (bottom right) */}
              <Line
                x1={cx + 45}
                y1={cy + 45}
                x2={cx + 88}
                y2={cy + 105}
                stroke={colors.connectorLine}
                strokeWidth={1.6}
                strokeOpacity={0.65}
              />

              {/* Vertical connector lines from Branch 3 to Concepts 1 & 2 */}
              <Line
                x1={cx - 130}
                y1={cy + 155}
                x2={cx - 130}
                y2={cy + 185}
                stroke={colors.connectorLineSub}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
              <Line
                x1={cx - 50}
                y1={cy + 155}
                x2={cx - 50}
                y2={cy + 185}
                stroke={colors.connectorLineSub}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />

              {/* Vertical connector lines from Branch 4 to Concepts 3 & 4 */}
              <Line
                x1={cx + 50}
                y1={cy + 155}
                x2={cx + 50}
                y2={cy + 185}
                stroke={colors.connectorLineSub}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
              <Line
                x1={cx + 130}
                y1={cy + 155}
                x2={cx + 130}
                y2={cy + 185}
                stroke={colors.connectorLineSub}
                strokeWidth={1.5}
                strokeOpacity={0.65}
              />
            </Svg>

            {/* Central Concentric Circles */}
            <View
              style={[
                styles.outerCircle,
                {
                  top: cy - 110,
                  left: cx - 110,
                  backgroundColor: colors.outerCircleBg,
                  borderColor: colors.outerCircleBorder,
                },
              ]}
            />
            <View
              style={[
                styles.innerCircle,
                {
                  top: cy - 66,
                  left: cx - 66,
                  backgroundColor: colors.innerCircleBg,
                },
              ]}
            >
              {/* Flower / Botanical icon */}
              <Text style={[styles.centerFlowerIcon, { color: colors.centerIconColor }]}>✿</Text>
              <Text style={[styles.centerTitleText, { color: colors.centerTitle }]}>
                INSECT GUT
              </Text>
              <Text style={[styles.centerSubtitleText, { color: colors.centerSubtitle }]}>
                DIGESTION
              </Text>
            </View>

            {/* Branch Card 1: STRUCTURE (Top Left) */}
            <TouchableOpacity
              style={[
                styles.branchCard,
                {
                  top: cy - 180,
                  left: 0,
                  backgroundColor: colors.branchCardBg,
                  borderColor: colors.branchCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: '1. STRUCTURE: Parts of the gut',
                  detail: BRANCHES[0].detail,
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.branchHeaderRow}>
                <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                  <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>1</Text>
                </View>
                <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]}>STRUCTURE</Text>
              </View>
              <Text style={[styles.branchCardSub, { color: colors.branchSub }]}>Parts of the gut</Text>
            </TouchableOpacity>

            {/* Branch Card 2: FUNCTION (Top Right) */}
            <TouchableOpacity
              style={[
                styles.branchCard,
                {
                  top: cy - 180,
                  right: 0,
                  backgroundColor: colors.branchCardBg,
                  borderColor: colors.branchCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: '2. FUNCTION: What it does',
                  detail: BRANCHES[1].detail,
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.branchHeaderRow}>
                <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                  <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>2</Text>
                </View>
                <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]}>FUNCTION</Text>
              </View>
              <Text style={[styles.branchCardSub, { color: colors.branchSub }]}>What it does</Text>
            </TouchableOpacity>

            {/* Branch Card 3: PROCESS (Bottom Left) */}
            <TouchableOpacity
              style={[
                styles.branchCard,
                {
                  top: cy + 95,
                  left: 0,
                  backgroundColor: colors.branchCardBg,
                  borderColor: colors.branchCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: '3. PROCESS: Food breakdown',
                  detail: BRANCHES[2].detail,
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.branchHeaderRow}>
                <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                  <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>3</Text>
                </View>
                <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]}>PROCESS</Text>
              </View>
              <Text style={[styles.branchCardSub, { color: colors.branchSub }]}>Food breakdown</Text>
            </TouchableOpacity>

            {/* Branch Card 4: ADAPTATIONS (Bottom Right) */}
            <TouchableOpacity
              style={[
                styles.branchCard,
                {
                  top: cy + 95,
                  right: 0,
                  backgroundColor: colors.branchCardBg,
                  borderColor: colors.branchCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: '4. ADAPTATIONS: Special features',
                  detail: BRANCHES[3].detail,
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.branchHeaderRow}>
                <View style={[styles.branchNumberBadge, { backgroundColor: colors.branchBadgeBg }]}>
                  <Text style={[styles.branchNumberText, { color: colors.branchBadgeText }]}>4</Text>
                </View>
                <Text style={[styles.branchCardTitle, { color: colors.branchTitle }]}>ADAPTATIONS</Text>
              </View>
              <Text style={[styles.branchCardSub, { color: colors.branchSub }]}>Special features</Text>
            </TouchableOpacity>

            {/* Sub-Concept Card 1: Enzymes */}
            <TouchableOpacity
              style={[
                styles.conceptCard,
                {
                  top: cy + 185,
                  left: cx - 165,
                  backgroundColor: colors.conceptCardBg,
                  borderColor: colors.conceptCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: 'Enzymes',
                  subtitle: 'Digestive Physiology',
                  detail: CONCEPTS[0].detail,
                });
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.conceptIconOuter,
                  {
                    backgroundColor: colors.conceptIconOuterBg,
                    borderColor: colors.conceptIconOuterBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.conceptIconInner,
                    { backgroundColor: colors.conceptIconInnerBg },
                  ]}
                >
                  <Text style={[styles.conceptIconSymbol, { color: colors.conceptIconSymbol }]}>✦</Text>
                </View>
              </View>
              <Text style={[styles.conceptLabelText, { color: colors.conceptLabel }]}>Enzymes</Text>
            </TouchableOpacity>

            {/* Sub-Concept Card 2: Absorption */}
            <TouchableOpacity
              style={[
                styles.conceptCard,
                {
                  top: cy + 185,
                  left: cx - 85,
                  backgroundColor: colors.conceptCardBg,
                  borderColor: colors.conceptCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: 'Absorption',
                  subtitle: 'Midgut Microvilli',
                  detail: CONCEPTS[1].detail,
                });
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.conceptIconOuter,
                  {
                    backgroundColor: colors.conceptIconOuterBg,
                    borderColor: colors.conceptIconOuterBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.conceptIconInner,
                    { backgroundColor: colors.conceptIconInnerBg },
                  ]}
                >
                  <Text style={[styles.conceptIconSymbol, { color: colors.conceptIconSymbol }]}>↓</Text>
                </View>
              </View>
              <Text style={[styles.conceptLabelText, { color: colors.conceptLabel }]}>Absorption</Text>
            </TouchableOpacity>

            {/* Sub-Concept Card 3: Water reuse */}
            <TouchableOpacity
              style={[
                styles.conceptCard,
                {
                  top: cy + 185,
                  left: cx + 15,
                  backgroundColor: colors.conceptCardBg,
                  borderColor: colors.conceptCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: 'Water reuse',
                  subtitle: 'Hindgut Papillae',
                  detail: CONCEPTS[2].detail,
                });
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.conceptIconOuter,
                  {
                    backgroundColor: colors.conceptIconOuterBg,
                    borderColor: colors.conceptIconOuterBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.conceptIconInner,
                    { backgroundColor: colors.conceptIconInnerBg },
                  ]}
                >
                  <Text style={[styles.conceptIconSymbol, { color: colors.conceptIconSymbol }]}>↻</Text>
                </View>
              </View>
              <Text style={[styles.conceptLabelText, { color: colors.conceptLabel }]}>Water reuse</Text>
            </TouchableOpacity>

            {/* Sub-Concept Card 4: Wood & sap */}
            <TouchableOpacity
              style={[
                styles.conceptCard,
                {
                  top: cy + 185,
                  left: cx + 95,
                  backgroundColor: colors.conceptCardBg,
                  borderColor: colors.conceptCardBorder,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedNode({
                  title: 'Wood & sap',
                  subtitle: 'Ecological Adaptations',
                  detail: CONCEPTS[3].detail,
                });
              }}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.conceptIconOuter,
                  {
                    backgroundColor: colors.conceptIconOuterBg,
                    borderColor: colors.conceptIconOuterBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.conceptIconInner,
                    { backgroundColor: colors.conceptIconInnerBg },
                  ]}
                >
                  <Text style={[styles.conceptIconSymbol, { color: colors.conceptIconSymbol }]}>✧</Text>
                </View>
              </View>
              <Text style={[styles.conceptLabelText, { color: colors.conceptLabel }]}>Wood & sap</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Legend Pills */}
          <View style={styles.legendContainer}>
            <View
              style={[
                styles.legendPill,
                {
                  backgroundColor: colors.legendPillBg,
                  borderColor: colors.legendPillBorder,
                },
              ]}
            >
              <Text style={[styles.legendPillText, { color: colors.legendPillText }]}>4 branches</Text>
            </View>

            <View
              style={[
                styles.legendPill,
                {
                  backgroundColor: colors.legendPillBg,
                  borderColor: colors.legendPillBorder,
                },
              ]}
            >
              <Text style={[styles.legendPillText, { color: colors.legendPillText }]}>
                8 related concepts
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Interactive Concept Detail Modal */}
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
                backgroundColor: colors.toolbarBg,
                borderColor: colors.toolbarBorder,
              },
            ]}
          >
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalBodyText, { color: colors.headerText }]}>
              {selectedNode?.detail}
            </Text>

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
  topAccentBar: {
    marginHorizontal: 16,
    height: 5,
    borderRadius: 2.5,
  },
  headerBar: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrowText: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 26,
    marginTop: -2,
  },
  titleBlock: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },
  tabletContainer: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  toolbarPill: {
    width: '100%',
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  toolbarLeftText: {
    fontSize: 11,
    fontWeight: '600',
  },
  zoomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoomBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  zoomFitText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  mindMapCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'column',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingTop: 4,
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 10,
    fontWeight: '500',
  },
  headerPillBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  canvasContainer: {
    position: 'relative',
    marginVertical: 4,
  },
  outerCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
  },
  innerCircle: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  centerFlowerIcon: {
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },
  centerTitleText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  centerSubtitleText: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  branchCard: {
    position: 'absolute',
    width: 148,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'column',
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  branchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  branchNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  branchCardTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  branchCardSub: {
    fontSize: 9.5,
    fontWeight: '500',
    lineHeight: 13,
  },
  conceptCard: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  conceptIconOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptIconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptIconSymbol: {
    fontSize: 11,
    fontWeight: '800',
  },
  conceptLabelText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  legendPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  legendPillText: {
    fontSize: 10,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'column',
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBodyText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '400',
  },
  modalActionBtn: {
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
