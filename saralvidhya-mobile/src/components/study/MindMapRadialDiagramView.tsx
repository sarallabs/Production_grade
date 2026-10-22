import React, { useState, useMemo } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MindMapNodeInfo {
  id: string;
  title: string;
  subtitle?: string;
  category: 'ROOT' | 'STRUCTURE' | 'FUNCTION' | 'PROCESS' | 'ADAPTATIONS';
  categoryLabel: string;
  fullDescription: string;
  bulletPoints: string[];
  readTargetSection?: string;
}

const MINDMAP_NODES: Record<string, MindMapNodeInfo> = {
  root: {
    id: 'root',
    title: 'Insect Gut',
    subtitle: 'Digestion & Anatomy',
    category: 'ROOT',
    categoryLabel: 'Core Architecture',
    fullDescription:
      'The insect alimentary canal is a complete tubular organ extending from the preoral cavity to the anus. It is divided into three primary embryological regions: Foregut (Stomodaeum), Midgut (Mesenteron), and Hindgut (Proctodaeum), coordinating food intake, mechanical mastication, enzyme hydrolysis, nutrient assimilation, and water retention.',
    bulletPoints: [
      'Foregut & Hindgut are ectodermal in origin, lined with cuticular intima.',
      'Midgut is endodermal in origin, lacking cuticular lining and protected by the peritrophic membrane.',
      'Critical site for systemic insecticide absorption and Bt Cry endotoxin targeting.',
    ],
    readTargetSection: 'Three Primary Regions',
  },
  structure: {
    id: 'structure',
    title: 'STRUCTURE',
    subtitle: 'Histology & Regional Divisions',
    category: 'STRUCTURE',
    categoryLabel: 'Branch · Anatomy',
    fullDescription:
      'The histological architecture of the insect gut consists of four concentric tissue coats: inner mucosal epithelium, basement membrane, circular muscle layer, and longitudinal muscle layer. Foregut and Hindgut possess a cuticular intima that molts at each ecdysis.',
    bulletPoints: [
      'Mucosal epithelium provides mechanical resilience and selective permeability.',
      'Cuticular intima lines both stomodaeum and proctodaeum to prevent abrasions.',
      'Musculature provides coordinated peristaltic contractions.',
    ],
    readTargetSection: 'Histological Wall Architecture',
  },
  parts_of_gut: {
    id: 'parts_of_gut',
    title: 'Parts of the gut',
    subtitle: 'Foregut, Midgut & Hindgut Progression',
    category: 'STRUCTURE',
    categoryLabel: 'Concept · Structure',
    fullDescription:
      'The alimentary canal progresses through specialized functional regions:\n• Foregut: Pharynx (sucking pump), Esophagus (food conduit), Crop (spacious food storage), Proventriculus (grinding gizzard).\n• Midgut: Cardiac valve, Ventriculus (true stomach), Gastric Caeca (enzyme secreting blind tubules).\n• Hindgut: Pyloric valve, Malpighian tubules insertion, Ileum, Colon, Rectum with rectal pads.',
    bulletPoints: [
      'Crop stores food and permits salivary pre-digestion.',
      'Proventriculus bears 6 cuticular teeth in chewing insects.',
      'Malpighian tubules empty excretory fluid at midgut-hindgut junction.',
    ],
    readTargetSection: 'Regional Divisions',
  },
  function: {
    id: 'function',
    title: 'FUNCTION',
    subtitle: 'Digestive Physiology',
    category: 'FUNCTION',
    categoryLabel: 'Branch · Physiology',
    fullDescription:
      'Coordinates mechanical maceration of diverse agricultural ingestants, secretion of catalytic digestive enzymes, nutrient transport across microvillar membranes, and conservation of vital water and electrolytes to sustain insect survival.',
    bulletPoints: [
      'Maintains stable internal osmotic pressure across fluctuating environmental hydration.',
      'Protects delicate enterocytes from dietary toxins and bacterial pathogens.',
      'Converts macroscopic foliar material into micro-nutrients in hemolymph.',
    ],
    readTargetSection: 'Physiology & Function',
  },
  what_it_does: {
    id: 'what_it_does',
    title: 'What it does',
    subtitle: 'Primary Physiological Roles',
    category: 'FUNCTION',
    categoryLabel: 'Concept · Function',
    fullDescription:
      '1. Ingestion & Storage: Crop holds substantial food volume, enabling intermittent feeding.\n2. Particle Grinding: Mechanical breakdown without damaging delicate midgut tissue.\n3. Biochemical Breakdown: Cleaves proteins, starch, and fats into assimilable monomers.\n4. Nutrient Absorption: Transport across columnar enterocytes into the circulating hemolymph.\n5. Water Reclamation: Over 90% of luminal moisture is conserved before frass voiding.',
    bulletPoints: [
      'Prevents dehydration in arid and terrestrial environments.',
      'Eliminates nitrogenous waste as dry, non-toxic uric acid pellets.',
      'Enables rapid energy release for flight and oviposition.',
    ],
    readTargetSection: 'Functional Mechanics',
  },
  process: {
    id: 'process',
    title: 'PROCESS',
    subtitle: 'Sequential Digestive Flow',
    category: 'PROCESS',
    categoryLabel: 'Branch · Dynamics',
    fullDescription:
      'Digestion in insects is a directional, counter-current physiological process. Ingested foliage is pre-treated with saliva, crushed by proventricular teeth, exposed to midgut enzymes, partitioned by the peritrophic membrane, and filtered through microvilli.',
    bulletPoints: [
      'Counter-current fluid flow maximizes enzyme efficiency and substrate contact.',
      'Peritrophic membrane creates distinct endo- and ecto-peritrophic compartments.',
      'Directional peristalsis moves solid residues smoothly toward the rectum.',
    ],
    readTargetSection: 'Digestive Biochemical Process',
  },
  food_breakdown: {
    id: 'food_breakdown',
    title: 'Food breakdown',
    subtitle: 'Mastication & Particle Size Reduction',
    category: 'PROCESS',
    categoryLabel: 'Concept · Process',
    fullDescription:
      'Food enters the preoral cavity where labial salivary glands secrete saliva rich in amylases and invertases. Solid particles are swallowed into the crop for chemical softening, then forced into the proventriculus where six chitinous teeth pulverize tough plant fibers.',
    bulletPoints: [
      'Saliva lubricates coarse plant foliage to facilitate swallowing.',
      'Proventricular teeth crush cells to liberate soluble cytoplasmic nutrients.',
      'Cuticular filter hairs prevent unground chunks from entering the midgut.',
    ],
    readTargetSection: 'Foregut Mechanics',
  },
  enzymes: {
    id: 'enzymes',
    title: 'Enzymes',
    subtitle: 'Hydrolysis & Biochemical Catabolism',
    category: 'PROCESS',
    categoryLabel: 'Concept · Process',
    fullDescription:
      'Midgut enterocytes and finger-like gastric caeca secrete a potent cocktail of digestive enzymes:\n• Proteases (Trypsin, Chymotrypsin) for peptide hydrolysis.\n• Carbohydrases (Amylase, Maltase, Trehalase, Invertase) for sugar breakdown.\n• Lipases for triglyceride digestion.\n• Cellulase in wood-borers and termites (often synthesized by symbionts).',
    bulletPoints: [
      'Lepidopteran midgut operates at unique alkaline pH (9.0–11.0).',
      'Enzymes are recycled forward in the ectoperitrophic space.',
      'Gastric caeca increase secretory surface area significantly.',
    ],
    readTargetSection: 'Digestive Enzymes',
  },
  absorption: {
    id: 'absorption',
    title: 'Absorption',
    subtitle: 'Cellular Nutrient Assimilation',
    category: 'PROCESS',
    categoryLabel: 'Concept · Process',
    fullDescription:
      'Digested amino acids, monosaccharides, and fatty acids pass through the pores of the peritrophic membrane into the ectoperitrophic space. Dense apical microvilli on columnar enterocytes actively transport these nutrients into hemolymph via ion-coupled transporters.',
    bulletPoints: [
      'Brush border microvilli expand absorption surface area thousands of times.',
      'V-ATPase proton pumps in goblet cells drive potassium-dependent active uptake.',
      'Peritrophic membrane prevents abrasive contact with delicate enterocytes.',
    ],
    readTargetSection: 'Midgut Cytology & Absorption',
  },
  adaptations: {
    id: 'adaptations',
    title: 'ADAPTATIONS',
    subtitle: 'Dietary Specializations',
    category: 'ADAPTATIONS',
    categoryLabel: 'Branch · Ecology',
    fullDescription:
      'Insects have evolved diverse anatomical and biochemical adaptations to exploit varied nutritional niches: liquid plant sap, structural wood cellulose, blood, or arid grains, demonstrating evolutionary versatility.',
    bulletPoints: [
      'Fluid sap feeders bypass excess water to concentrate amino acids.',
      'Xylophagous insects harness symbiotic gut microorganisms to digest lignin and cellulose.',
      'Desert-dwelling insects reabsorb atmospheric and fecal moisture.',
    ],
    readTargetSection: 'Specialized Dietary Adaptations',
  },
  special_features: {
    id: 'special_features',
    title: 'Special features',
    subtitle: 'Peritrophic Sleeve & Nidi Cells',
    category: 'ADAPTATIONS',
    categoryLabel: 'Concept · Adaptations',
    fullDescription:
      '• Peritrophic Membrane: Chitin-protein meshwork sheath surrounding the food bolus, acting as an ultrafilter.\n• Regenerative Nidi: Basal stem cell nests that constantly divide to replace worn columnar cells during abrasive feeding.\n• Goblet Cells: Specialized cells maintaining intense alkaline voltage gradients in larval guts.',
    bulletPoints: [
      'Nidi cells ensure rapid renewal after cellular damage.',
      'Peritrophic membrane protects against microsporidia and viral polyhedra.',
      'Bt Cry toxins insert into midgut cell membranes causing pore formation and lysis.',
    ],
    readTargetSection: 'Peritrophic Membrane & Nidi',
  },
  water_reuse: {
    id: 'water_reuse',
    title: 'Water reuse',
    subtitle: 'Rectal Pads & Osmoregulation',
    category: 'ADAPTATIONS',
    categoryLabel: 'Concept · Adaptations',
    fullDescription:
      'Terrestrial insects prevent fatal desiccation through rectal papillae (rectal pads). These specialized structures actively reabsorb over 90–95% of water and essential sodium and potassium ions from primary urine and frass, producing dry, crystalline uric acid pellets.',
    bulletPoints: [
      'Dense mitochondria in rectal pad cells provide energy for active ion pumps.',
      'Enables mealworms and desert beetles to survive in zero-water conditions.',
      'Cryptonephridial Malpighian systems intimately adhere to rectum for maximum reclamation.',
    ],
    readTargetSection: 'Hindgut Osmoregulation',
  },
  wood_sap: {
    id: 'wood_sap',
    title: 'Wood & sap',
    subtitle: 'Filter Chamber & Termite Paunch',
    category: 'ADAPTATIONS',
    categoryLabel: 'Concept · Adaptations',
    fullDescription:
      '• Filter Chamber (Hemiptera): Anterior midgut loops and fuses intimately with the hindgut, shunting excess fluid and water directly to excretion without diluting midgut digestive enzymes.\n• Termite Hindgut Paunch: Dilated fermentation chamber harboring symbiotic flagellates (hypermastigids) and bacteria that produce cellulase to digest wood cellulose.',
    bulletPoints: [
      'Filter chamber prevents hemolymph dilution from massive phloem sap intake.',
      'Termites pass symbiotic protozoa to offspring via proctodeal trophallaxis.',
      'Aphid honeydew is the sugar-rich liquid bypassed through the filter chamber.',
    ],
    readTargetSection: 'Dietary Adaptations',
  },
};

interface MindMapRadialDiagramViewProps {
  onNavigateBack?: () => void;
  chapterNumber?: number;
  chapterTitle?: string;
  subjectId?: string;
  subjectName?: string;
  showTopHeader?: boolean;
}

export default function MindMapRadialDiagramView({
  onNavigateBack,
  chapterNumber = 1,
  chapterTitle = 'Insect Digestive System & Anatomy',
  subjectId = 'entomology',
  subjectName = 'Insect Gut',
  showTopHeader = false,
}: MindMapRadialDiagramViewProps) {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [activeNode, setActiveNode] = useState<MindMapNodeInfo | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  // Exact color values derived directly from the provided PNGs
  const colors = useMemo(
    () =>
      isDark
        ? {
            screenBg: '#0F1713',
            topAccentLine: '#3F8259',
            backBtnBg: '#19261E',
            backBtnBorder: '#2E4336',
            headerTitle: '#FEFEFE',
            headerSub: '#A6C5B3',
            pillBarBg: '#15221B',
            pillBarBorder: '#2E4839',
            pillBarText: '#FEFEFE',
            pillBarControls: '#8CAAA0',
            mainCardBg: '#2A3F35',
            mainCardBorder: '#426852',
            cardTitle: '#FEFEFE',
            cardSub: '#9EB8A9',
            badgeBg: '#1B2C23',
            badgeBorder: '#395745',
            badgeText: '#FEFEFE',
            centerNodeBg: '#173426',
            centerNodeBorder: '#2F5943',
            centerNodeTitle: '#FEFEFE',
            centerNodeSub: '#A0CEB5',
            branchNodeBg: '#3E6A52',
            branchNodeText: '#FFFFFF',
            conceptNodeBg: '#253E31',
            conceptNodeBorder: '#3E614D',
            conceptNodeText: '#E1EFE6',
            connectorStroke: '#5E8B72',
            modalBg: '#1C2B23',
            modalBorder: '#3A5445',
          }
        : {
            screenBg: '#FFF8F3',
            topAccentLine: '#3C7F57',
            backBtnBg: '#FFFFFF',
            backBtnBorder: '#E2ECE5',
            headerTitle: '#1C2E24',
            headerSub: '#587465',
            pillBarBg: '#FFFFFF',
            pillBarBorder: '#6C9A80',
            pillBarText: '#1C2E24',
            pillBarControls: '#587465',
            mainCardBg: '#FAF5EE',
            mainCardBorder: '#64977B',
            cardTitle: '#1C2E24',
            cardSub: '#5A7567',
            badgeBg: '#FFFFFF',
            badgeBorder: '#D2E2D7',
            badgeText: '#1C2E24',
            centerNodeBg: '#224436',
            centerNodeBorder: '#224436',
            centerNodeTitle: '#FEFEFE',
            centerNodeSub: '#A4CFB7',
            branchNodeBg: '#47745B',
            branchNodeText: '#FFFFFF',
            conceptNodeBg: '#DAEBDE',
            conceptNodeBorder: '#B5D4C0',
            conceptNodeText: '#1A3628',
            connectorStroke: '#659078',
            modalBg: '#FFFFFF',
            modalBorder: '#CFE0D6',
          },
    [isDark]
  );

  const handleNodePress = (nodeKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const node = MINDMAP_NODES[nodeKey];
    if (node) {
      setActiveNode(node);
    }
  };

  const handleRedirectToRead = () => {
    Haptics.selectionAsync();
    const targetTopic = activeNode?.readTargetSection || activeNode?.title || '';
    setActiveNode(null);

    router.push({
      pathname: '/(tabs)/learn',
      params: {
        segment: 'read',
        chapter: chapterNumber.toString(),
        topic: targetTopic,
      },
    });
  };

  const handleZoomIn = () => {
    Haptics.selectionAsync();
    setZoomScale((prev) => Math.min(1.25, parseFloat((prev + 0.1).toFixed(1))));
  };

  const handleZoomOut = () => {
    Haptics.selectionAsync();
    setZoomScale((prev) => Math.max(0.75, parseFloat((prev - 0.1).toFixed(1))));
  };

  const handleFit = () => {
    Haptics.selectionAsync();
    setZoomScale(1.0);
  };

  // Dimensions for geometry
  const cardWidth = Math.min(SCREEN_WIDTH - 24, 440);
  const canvasWidth = cardWidth - 28;
  const canvasHeight = 490;
  const cx = canvasWidth / 2;

  // Node dimensions
  const colNodeW = Math.floor((canvasWidth - 36) / 2);
  const leftX = 4;
  const rightX = canvasWidth - colNodeW - 4;
  const leftColCenter = leftX + colNodeW / 2;
  const rightColCenter = rightX + colNodeW / 2;

  // Row Y positions
  const r1Y = 12; // Leaf Top
  const r1H = 40;
  const r2Y = 78; // Branch Top
  const r2H = 42;
  const centerNodeY = 175;
  const centerNodeW = 122;
  const centerNodeH = 54;
  const r3Y = 270; // Branch Bottom
  const r3H = 42;
  const r4Y = 340; // Leaf 1
  const r4H = 38;
  const r5Y = 390; // Leaf 2
  const r5H = 38;
  const r6Y = 440; // Leaf 3
  const r6H = 38;

  // Tree Spine X coordinates for bottom branches
  const leftTreeSpineX = leftX - 1;
  const rightTreeSpineX = rightX + colNodeW + 1;

  // SVG Paths matching the exact smooth curved splines and tree forks in the PNG
  const pathCenterToStructure = `M ${cx - 24} ${centerNodeY + 8} Q ${cx - 45} ${r2Y + r2H + 22} ${leftColCenter} ${r2Y + r2H}`;
  const pathStructureToParts = `M ${leftColCenter} ${r2Y} L ${leftColCenter} ${r1Y + r1H}`;

  const pathCenterToFunction = `M ${cx + 24} ${centerNodeY + 8} Q ${cx + 45} ${r2Y + r2H + 22} ${rightColCenter} ${r2Y + r2H}`;
  const pathFunctionToWhat = `M ${rightColCenter} ${r2Y} L ${rightColCenter} ${r1Y + r1H}`;

  const pathCenterToProcess = `M ${cx - 24} ${centerNodeY + centerNodeH - 8} Q ${cx - 45} ${r3Y - 22} ${leftColCenter} ${r3Y}`;

  // Process Tree Fork: Curves from bottom of PROCESS out to the left spine, extends down, hooks into rows 4, 5, 6
  const pathProcessTree = `
    M ${leftColCenter} ${r3Y + r3H}
    Q ${leftColCenter - 10} ${r3Y + r3H + 18} ${leftTreeSpineX} ${r4Y + r4H / 2}
    L ${leftTreeSpineX} ${r6Y + r6H / 2}
    M ${leftTreeSpineX} ${r4Y + r4H / 2} L ${leftX} ${r4Y + r4H / 2}
    M ${leftTreeSpineX} ${r5Y + r5H / 2} L ${leftX} ${r5Y + r5H / 2}
    M ${leftTreeSpineX} ${r6Y + r6H / 2} L ${leftX} ${r6Y + r6H / 2}
  `;

  const pathCenterToAdaptations = `M ${cx + 24} ${centerNodeY + centerNodeH - 8} Q ${cx + 45} ${r3Y - 22} ${rightColCenter} ${r3Y}`;

  // Adaptations Tree Fork: Curves from bottom of ADAPTATIONS out to the right spine, extends down, hooks into rows 4, 5, 6
  const pathAdaptationsTree = `
    M ${rightColCenter} ${r3Y + r3H}
    Q ${rightColCenter + 10} ${r3Y + r3H + 18} ${rightTreeSpineX} ${r4Y + r4H / 2}
    L ${rightTreeSpineX} ${r6Y + r6H / 2}
    M ${rightTreeSpineX} ${r4Y + r4H / 2} L ${rightX + colNodeW} ${r4Y + r4H / 2}
    M ${rightTreeSpineX} ${r5Y + r5H / 2} L ${rightX + colNodeW} ${r5Y + r5H / 2}
    M ${rightTreeSpineX} ${r6Y + r6H / 2} L ${rightX + colNodeW} ${r6Y + r6H / 2}
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Optional Top Green Line & Header Row (Only shown if showTopHeader is true) */}
      {showTopHeader && (
        <>
          <View style={[styles.topGreenLine, { backgroundColor: colors.topAccentLine }]} />
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              style={[styles.backSquareBtn, { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder }]}
              onPress={() => {
                Haptics.selectionAsync();
                if (onNavigateBack) {
                  onNavigateBack();
                } else if (router.canGoBack()) {
                  router.back();
                } else {
                  router.push('/(tabs)');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.headerTitle} />
            </TouchableOpacity>

            <View style={styles.headerTextCol}>
              <Text style={[styles.headerTitleText, { color: colors.headerTitle }]}>Mind Map</Text>
              <Text style={[styles.headerSubText, { color: colors.headerSub }]} numberOfLines={1}>
                {chapterTitle}
              </Text>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>
        </>
      )}

      {/* 3. PILL CONTROL BAR: ✦ Explore the connections  ·  - Fit + */}
      <View style={styles.pillBarWrap}>
        <View style={[styles.pillBarContainer, { backgroundColor: colors.pillBarBg, borderColor: colors.pillBarBorder }]}>
          <View style={styles.pillBarLeft}>
            <Text style={[styles.sparkleIcon, { color: colors.pillBarText }]}>✦</Text>
            <Text style={[styles.pillBarLeftText, { color: colors.pillBarText }]}>
              Explore the connections
            </Text>
          </View>

          <View style={styles.zoomControlsRow}>
            <TouchableOpacity onPress={handleZoomOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }} activeOpacity={0.6}>
              <Text style={[styles.zoomBtnText, { color: colors.pillBarControls }]}>−</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleFit} activeOpacity={0.6}>
              <Text style={[styles.fitBtnText, { color: colors.pillBarControls }]}>Fit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleZoomIn} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }} activeOpacity={0.6}>
              <Text style={[styles.zoomBtnText, { color: colors.pillBarControls }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. MAIN SCROLLABLE DIAGRAM CONTAINER */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainer]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: colors.mainCardBg,
              borderColor: colors.mainCardBorder,
              width: cardWidth,
            },
          ]}
        >
          {/* Card Header: Insect Gut / Digestion & Anatomy + 4 branches · 8 concepts badge */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Text style={[styles.cardTitleText, { color: colors.cardTitle }]}>
                {chapterNumber === 1 ? 'Insect Gut' : subjectName}
              </Text>
              <Text style={[styles.cardSubText, { color: colors.cardSub }]}>
                {chapterNumber === 1 ? 'Digestion & Anatomy' : chapterTitle}
              </Text>
            </View>

            <View style={[styles.badgePill, { backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }]}>
              <Text style={[styles.badgePillText, { color: colors.badgeText }]}>
                4 branches  ·  8 concepts
              </Text>
            </View>
          </View>

          {/* Scalable Mind Map Canvas */}
          <View
            style={[
              styles.canvasWrapper,
              {
                width: canvasWidth,
                height: canvasHeight,
                transform: [{ scale: zoomScale }],
              },
            ]}
          >
            {/* SVG Connecting Splines */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg width={canvasWidth} height={canvasHeight}>
                <Path d={pathCenterToStructure} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />
                <Path d={pathStructureToParts} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />

                <Path d={pathCenterToFunction} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />
                <Path d={pathFunctionToWhat} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />

                <Path d={pathCenterToProcess} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />
                <Path d={pathProcessTree} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />

                <Path d={pathCenterToAdaptations} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />
                <Path d={pathAdaptationsTree} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />
              </Svg>
            </View>

            {/* ── TOP-LEFT BRANCH & CONCEPT ── */}
            {/* Concept: Parts of the gut */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r1Y,
                  left: leftX,
                  width: colNodeW,
                  height: r1H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('parts_of_gut')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Parts of the gut</Text>
            </TouchableOpacity>

            {/* Branch: STRUCTURE */}
            <TouchableOpacity
              style={[
                styles.branchNodeBox,
                {
                  top: r2Y,
                  left: leftX,
                  width: colNodeW,
                  height: r2H,
                  backgroundColor: colors.branchNodeBg,
                },
              ]}
              onPress={() => handleNodePress('structure')}
              activeOpacity={0.8}
            >
              <Text style={[styles.branchNodeText, { color: colors.branchNodeText }]}>STRUCTURE</Text>
            </TouchableOpacity>

            {/* ── TOP-RIGHT BRANCH & CONCEPT ── */}
            {/* Concept: What it does */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r1Y,
                  left: rightX,
                  width: colNodeW,
                  height: r1H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('what_it_does')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>What it does</Text>
            </TouchableOpacity>

            {/* Branch: FUNCTION */}
            <TouchableOpacity
              style={[
                styles.branchNodeBox,
                {
                  top: r2Y,
                  left: rightX,
                  width: colNodeW,
                  height: r2H,
                  backgroundColor: colors.branchNodeBg,
                },
              ]}
              onPress={() => handleNodePress('function')}
              activeOpacity={0.8}
            >
              <Text style={[styles.branchNodeText, { color: colors.branchNodeText }]}>FUNCTION</Text>
            </TouchableOpacity>

            {/* ── CENTER ROOT NODE: INSECT GUT / DIGESTION ── */}
            <TouchableOpacity
              style={[
                styles.centerNodeBox,
                {
                  top: centerNodeY,
                  left: cx - centerNodeW / 2,
                  width: centerNodeW,
                  height: centerNodeH,
                  backgroundColor: colors.centerNodeBg,
                  borderColor: colors.centerNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('root')}
              activeOpacity={0.85}
            >
              <Text style={[styles.centerNodeTitleText, { color: colors.centerNodeTitle }]}>
                {chapterNumber === 1 ? 'INSECT GUT' : subjectName.toUpperCase()}
              </Text>
              <Text style={[styles.centerNodeSubText, { color: colors.centerNodeSub }]}>
                {chapterNumber === 1 ? 'DIGESTION' : 'ANATOMY'}
              </Text>
            </TouchableOpacity>

            {/* ── BOTTOM-LEFT BRANCH & 3 CONCEPTS ── */}
            {/* Branch: PROCESS */}
            <TouchableOpacity
              style={[
                styles.branchNodeBox,
                {
                  top: r3Y,
                  left: leftX,
                  width: colNodeW,
                  height: r3H,
                  backgroundColor: colors.branchNodeBg,
                },
              ]}
              onPress={() => handleNodePress('process')}
              activeOpacity={0.8}
            >
              <Text style={[styles.branchNodeText, { color: colors.branchNodeText }]}>PROCESS</Text>
            </TouchableOpacity>

            {/* Concept: Food breakdown */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r4Y,
                  left: leftX,
                  width: colNodeW,
                  height: r4H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('food_breakdown')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Food breakdown</Text>
            </TouchableOpacity>

            {/* Concept: Enzymes */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r5Y,
                  left: leftX,
                  width: colNodeW,
                  height: r5H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('enzymes')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Enzymes</Text>
            </TouchableOpacity>

            {/* Concept: Absorption */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r6Y,
                  left: leftX,
                  width: colNodeW,
                  height: r6H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('absorption')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Absorption</Text>
            </TouchableOpacity>

            {/* ── BOTTOM-RIGHT BRANCH & 3 CONCEPTS ── */}
            {/* Branch: ADAPTATIONS */}
            <TouchableOpacity
              style={[
                styles.branchNodeBox,
                {
                  top: r3Y,
                  left: rightX,
                  width: colNodeW,
                  height: r3H,
                  backgroundColor: colors.branchNodeBg,
                },
              ]}
              onPress={() => handleNodePress('adaptations')}
              activeOpacity={0.8}
            >
              <Text style={[styles.branchNodeText, { color: colors.branchNodeText }]}>ADAPTATIONS</Text>
            </TouchableOpacity>

            {/* Concept: Special features */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r4Y,
                  left: rightX,
                  width: colNodeW,
                  height: r4H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('special_features')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Special features</Text>
            </TouchableOpacity>

            {/* Concept: Water reuse */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r5Y,
                  left: rightX,
                  width: colNodeW,
                  height: r5H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('water_reuse')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Water reuse</Text>
            </TouchableOpacity>

            {/* Concept: Wood & sap */}
            <TouchableOpacity
              style={[
                styles.conceptNodeBox,
                {
                  top: r6Y,
                  left: rightX,
                  width: colNodeW,
                  height: r6H,
                  backgroundColor: colors.conceptNodeBg,
                  borderColor: colors.conceptNodeBorder,
                },
              ]}
              onPress={() => handleNodePress('wood_sap')}
              activeOpacity={0.8}
            >
              <Text style={[styles.conceptNodeText, { color: colors.conceptNodeText }]}>Wood & sap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 5. INTERACTIVE NODE CONTENT MODAL (REDIECTION TO LEARN -> READ) */}
      <Modal
        visible={activeNode !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveNode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBg, borderColor: colors.modalBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalBadge, { backgroundColor: isDark ? '#2B4438' : '#E8F3EC' }]}>
                <Text style={[styles.modalBadgeText, { color: isDark ? '#A0CEB5' : '#22523B' }]}>
                  {activeNode?.categoryLabel || 'CONCEPT'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveNode(null);
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={22} color={colors.headerTitle} />
              </TouchableOpacity>
            </View>

            {/* Modal Title & Subtitle */}
            <Text style={[styles.modalTitleText, { color: colors.headerTitle }]}>
              {activeNode?.title}
            </Text>
            {activeNode?.subtitle && (
              <Text style={[styles.modalSubText, { color: colors.headerSub }]}>
                {activeNode.subtitle}
              </Text>
            )}

            {/* Full Concept Description */}
            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalDescText, { color: isDark ? '#D5E5DC' : '#2C4437' }]}>
                {activeNode?.fullDescription}
              </Text>

              {/* Bullet Points */}
              {activeNode?.bulletPoints && activeNode.bulletPoints.length > 0 && (
                <View style={styles.bulletsWrap}>
                  <Text style={[styles.bulletsHeading, { color: isDark ? '#A0CEB5' : '#336148' }]}>
                    EXAM INVARIANTS & KEY MECHANISMS:
                  </Text>
                  {activeNode.bulletPoints.map((pt, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={[styles.bulletDot, { color: isDark ? '#A0CEB5' : '#336148' }]}>•</Text>
                      <Text style={[styles.bulletItemText, { color: isDark ? '#D5E5DC' : '#3B5547' }]}>
                        {pt}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons: Read Full Topic in Learn vs Close */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={[styles.primaryReadBtn, { backgroundColor: isDark ? '#3D6A52' : '#254E3A' }]}
                onPress={handleRedirectToRead}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryReadBtnText}>Read in Chapter Notes →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGreenLine: {
    width: '100%',
    height: 3.5,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 10,
  },
  backSquareBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 38,
  },
  pillBarWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pillBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pillBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillBarLeftText: {
    fontSize: 13,
    fontWeight: '700',
  },
  zoomControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  zoomBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  fitBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  tabletContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  mainCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    alignItems: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardTitleText: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubText: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 2,
  },
  badgePill: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  canvasWrapper: {
    position: 'relative',
    marginTop: 6,
  },
  centerNodeBox: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  centerNodeTitleText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  centerNodeSubText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  branchNodeBox: {
    position: 'absolute',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  branchNodeText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conceptNodeBox: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  conceptNodeText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '78%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  modalBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalSubText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalScrollBody: {
    maxHeight: 280,
    marginBottom: 16,
  },
  modalDescText: {
    fontSize: 13.5,
    lineHeight: 21,
    fontWeight: '500',
  },
  bulletsWrap: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 150, 120, 0.2)',
  },
  bulletsHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  bulletItemText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  modalActionButtonsRow: {
    width: '100%',
  },
  primaryReadBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryReadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
