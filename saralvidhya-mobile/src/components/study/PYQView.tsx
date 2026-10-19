import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

export type MarkType = '2M' | '5M' | '10M';

export interface QuestionBankItem {
  id: number;
  numberFormatted: string;
  question: string;
  chapter: string;
  answers: Record<MarkType, string>;
  rememberTip: string;
}

const QUESTION_BANK_DATA: QuestionBankItem[] = [
  {
    id: 1,
    numberFormatted: '01',
    question:
      'Describe the tripartite division and embryological origin of the insect alimentary canal?',
    chapter: 'Chapter 1  ·  Insect Digestive System',
    answers: {
      '2M':
        'The insect alimentary canal is divided into three regions: the foregut (stomodaeum), midgut (mesenteron), and hindgut (proctodaeum). The foregut and hindgut develop from ectoderm and have a cuticular lining that is shed during moulting. The midgut is endodermal and lacks cuticular intima, allowing digestion and nutrient absorption.',
      '5M':
        'The insect alimentary canal comprises three morphologically and embryologically distinct regions:\n\n' +
        '1. Foregut (Stomodaeum):\n' +
        '• Formed by anterior ectodermal invagination.\n' +
        '• Subdivided into preoral cavity, pharynx, oesophagus, crop (food storage), and proventriculus (grinding gizzard).\n' +
        '• Lined by cuticular intima shed at each moult.\n\n' +
        '2. Midgut (Mesenteron / Ventriculus):\n' +
        '• Arises from embryonic endoderm.\n' +
        '• Devoid of cuticular lining; actively secretes digestive enzymes and absorbs nutrients.\n' +
        '• Features anterior gastric caeca and secretes the protective semi-permeable peritrophic membrane.\n\n' +
        '3. Hindgut (Proctodaeum):\n' +
        '• Formed by posterior ectodermal invagination.\n' +
        '• Subdivided into ileum, colon, and muscular rectum.\n' +
        '• Houses rectal papillae for active water, ion, and organic acid reabsorption.',
      '10M':
        'I. Comprehensive Alimentary Canal Tripartite Division & Embryological Origins:\n\n' +
        '1. Stomodaeum (Foregut - Ectodermal Origin):\n' +
        '• Ingestion, salivary blending, and mechanical processing zone.\n' +
        '• Comprises preoral cibarium/salivarium, muscular pharynx suction pump, slender tubular oesophagus, dilated storage crop (ingluvies), and sclerotized proventricular gizzard.\n' +
        '• Employs an internal chitinous intima continuous with the exoskeleton, preventing abrasive food injury.\n\n' +
        '2. Mesenteron (Midgut - Endodermal Origin):\n' +
        '• Primary biochemical digestion and nutrient absorption site.\n' +
        '• Ventricular tube with 2–8 blind-ending gastric (hepatic) caeca providing surface area and housing microflora.\n' +
        '• Devoid of cuticle; midgut epithelial columnar cells secrete the peritrophic matrix separating food bolus from vulnerable enterocytes (endo-ectoperitrophic flow).\n\n' +
        '3. Proctodaeum (Hindgut - Ectodermal Origin):\n' +
        '• Excretion junction, osmoregulation, and final fecal compaction.\n' +
        '• Receives Malpighian tubules at pyloric sphincter; subdivided into ileum, coiled colon, and bulbous rectum.\n' +
        '• Features specialized rectal pads/papillae with Na+/K+ pumps extracting 90–95% water to generate dry uric acid pellets.',
    },
    rememberTip: 'Foregut + hindgut = ectoderm; midgut = endoderm.',
  },
  {
    id: 2,
    numberFormatted: '02',
    question:
      'Explain the histological wall layers of the insect alimentary canal from the lumen outward?',
    chapter: 'Chapter 1  ·  Insect Digestive System',
    answers: {
      '2M':
        'From the lumen outward, the gut wall comprises: (1) Cuticular intima (in foregut & hindgut only), (2) Single-layered columnar epithelium on a basement membrane, (3) Circular muscle layer, (4) Longitudinal muscle layer, and (5) Outer peritoneal membrane.',
      '5M':
        'Histological Wall Architecture of the Alimentary Canal (Lumen Outward):\n\n' +
        '1. Cuticular Intima: Secreted by epithelial cells; present in stomodaeum and proctodaeum, absent in mesenteron.\n' +
        '2. Epithelial Layer: Single sheet of columnar or cuboidal cells resting upon an amorphous basal lamina (basement membrane).\n' +
        '3. Longitudinal Muscles: Disposed either internal or external to circular muscles depending on the gut zone.\n' +
        '4. Circular Muscles: Strong contractile bands responsible for peristaltic propulsion.\n' +
        '5. Peritoneal Membrane: Thin connective tissue sheath housing tracheae and nerves supplying the visceral musculature.',
      '10M':
        'I. Detailed Histological Organization:\n\n' +
        '1. Intima & Peritrophic Matrix: In the foregut and hindgut, the lumen is protected by a tough chitinous cuticular intima. In the midgut, this is replaced by the peritrophic membrane.\n' +
        '2. Epithelial Cell Types: Columnar digestive cells with microvillar apical brush borders, goblet cells for potassium transport, and regenerative nidi / crypts.\n' +
        '3. Muscularis Layering Discrepancies:\n' +
        '• Foregut: Inner longitudinal and outer circular muscle fibres.\n' +
        '• Midgut: Outer longitudinal and inner circular muscles.\n' +
        '• Hindgut: Heavily reinforced circular sphincters at pylorus and rectal valves.\n' +
        '4. Peritoneal Connective Sheath: Richly arborized with tracheoles supplying oxygen for active transport and autonomic nerve plexuses.',
    },
    rememberTip:
      'Foregut muscles: inner longitudinal, outer circular. Midgut muscles: inner circular, outer longitudinal.',
  },
  {
    id: 3,
    numberFormatted: '03',
    question:
      'Describe the structure and grinding function of the insect proventricular gizzard.',
    chapter: 'Chapter 1  ·  Insect Digestive System',
    answers: {
      '2M':
        'The proventriculus is the posterior region of the foregut. It possesses a heavy circular muscle coat and internal cuticular teeth that mechanically pulverize coarse food before passing it through the stomodaeal cardiac valve.',
      '5M':
        'Structure & Function of the Proventricular Gizzard:\n\n' +
        '1. Structure:\n' +
        '• Strongly muscularized organ with thick circular muscle bands.\n' +
        '• Internal cuticular intima produced into 6 longitudinal primary dental folds bearing sharp sclerotized teeth.\n' +
        '• Interdental cushions with backwardly-directed hair-like setae.\n\n' +
        '2. Function:\n' +
        '• Mechanical mastication of coarse plant matter (vital in Orthoptera and Blattodea).\n' +
        '• Straining mechanism preventing unground solids from damaging the delicate midgut.\n' +
        '• Contains cardiac valve controlling directional food flow into the midgut.',
      '10M':
        'I. Morpho-Functional Anatomy of the Insect Gizzard:\n\n' +
        '1. Adaptations in Chewing vs Sucking Insects:\n' +
        '• Fully expressed in solid feeders (e.g. Locusts, Cockroaches) with heavily sclerotized grinding armatures.\n' +
        '• Rudimentary or modified into a simple valve in liquid feeders (e.g. Hemiptera, Lepidoptera).\n' +
        '2. Tripartite Microstructure:\n' +
        '• Dental Zone: 6 radially symmetrical cuticular plates.\n' +
        '• Pulvillar Zone: Micro-trichia forming a sieve plate.\n' +
        '• Stomodaeal Valvular Funnel: Infolding projecting into the ventriculus to block regurgitation.\n' +
        '3. Biomechanical Mechanics:\n' +
        '• Rhythmic circular contractions exert opposing grinding pressure between opposing dental folds, reducing particles below 100 μm.',
    },
    rememberTip: 'Gizzard teeth = 6 longitudinal cuticular folds with sclerotized denticles.',
  },
  {
    id: 4,
    numberFormatted: '04',
    question:
      'Explain the role of the peritrophic membrane in digestion and pathogen defense.',
    chapter: 'Chapter 1  ·  Insect Digestive System',
    answers: {
      '2M':
        'The peritrophic membrane is a non-cellular chitin-protein sleeve secreted by midgut cells. It envelops the food bolus, protecting microvilli from abrasive friction and preventing gut microbial pathogens from invading the hemolymph.',
      '5M':
        'Peritrophic Membrane (PM) Formation and Physiological Functions:\n\n' +
        '1. Formation Modes:\n' +
        '• Type I PM: Delaminated continuously along the entire ventricular epithelium (most common).\n' +
        '• Type II PM: Produced by a specialized annular ring of cells at the cardiac valve (Diptera, Dermaptera).\n\n' +
        '2. Primary Functions:\n' +
        '• Mechanical protection against abrasive silica/phytoliths in ingested foliage.\n' +
        '• Compartmentalization: Divides midgut into endoperitrophic (digestion) and ectoperitrophic (absorption) spaces.\n' +
        '• Immunological shield against viruses, bacteria, and spore penetration.',
      '10M':
        'I. Detailed Physiological Significance of the Peritrophic Matrix:\n\n' +
        '1. Biochemical Composition: Hexagonal crystalline meshwork composed of Chitin fibrils cross-linked with peritrophins and glycoproteins.\n' +
        '2. Enzymatic Recirculation Mechanism:\n' +
        '• Primary digestive enzymes (amylases, proteases) enter the endoperitrophic space.\n' +
        '• Intermediate oligomers filter outward through 2–10 nm pores into the ectoperitrophic fluid for terminal digestion and microvillar uptake.\n' +
        '3. Defense Dynamics: Blocks baculovirus virions and Bacillus thuringiensis (Bt) delta-endotoxins until breached by entomopathogenic chitinases.',
    },
    rememberTip: 'Type I = delaminated throughout midgut. Type II = produced by anterior cardiac ring.',
  },
  {
    id: 5,
    numberFormatted: '05',
    question:
      'Discuss water conservation mechanisms involving Malpighian tubules and rectal papillae.',
    chapter: 'Chapter 1  ·  Insect Digestive System',
    answers: {
      '2M':
        'Malpighian tubules precipitate toxic nitrogen as insoluble, non-toxic uric acid with minimal water loss, while rectal papillae actively reabsorb up to 95% of water and electrolytes, producing dry fecal pellets.',
      '5M':
        'Coordination Between Malpighian Tubules and Rectal Papillae:\n\n' +
        '1. Malpighian Tubules:\n' +
        '• Actively pump K+ and H+ into the lumen, drawing water and urate salts isotonically.\n' +
        '• Acidification in lower tubule precipitates uric acid crystals, releasing free water.\n\n' +
        '2. Rectal Papillae / Pads:\n' +
        '• Specialized columnar epithelial cells with extensive intercellular canal systems.\n' +
        '• Sub-cuticular Na+/K+ ATPases drive hyperosmotic fluid recycling, recovering 95% water before egestion.',
      '10M':
        'I. Comprehensive Excretory & Osmoregulatory Physiology:\n\n' +
        '1. The Uric Acid Precipitation Cycle:\n' +
        '• Uricotelic adaptation converts ammonium to uric acid (needs only 1 mL water per gram nitrogen vs 500 mL for ammonia).\n' +
        '2. Rectal Epithelial Countercurrent System (Wall & Oschman Model):\n' +
        '• Lateral intercellular spaces maintain steep osmotic gradients, pulling water from fecal slurry even against 2000 mOsm/kg hyperosmotic rectal contents.\n' +
        '3. Endocrine Control:\n' +
        '• Diuretic hormones accelerate tubule filtration during feeding; antidiuretic hormones (e.g. neuroparsins) promote rectal water conservation during desiccation.',
    },
    rememberTip: 'Rectal papillae recover up to 95% of water via local hyperosmotic recycling.',
  },
];

interface PYQViewProps {
  chapterNumber?: number;
  chapterName?: string;
}

export default function PYQView({
  chapterNumber = 1,
  chapterName = 'Insect Digestive System',
}: PYQViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  // State: selectedQuestionId (null = full list mode, number = model answer revealed mode)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedMark, setSelectedMark] = useState<MarkType>('2M');

  const questions = QUESTION_BANK_DATA;
  const selectedQuestion =
    selectedQuestionId !== null
      ? questions.find((q) => q.id === selectedQuestionId) || questions[0]
      : null;

  const handleCardPress = (qId: number) => {
    Haptics.selectionAsync();
    setSelectedQuestionId(qId);
  };

  const handleMarkChipPress = (qId: number, mark: MarkType) => {
    Haptics.selectionAsync();
    setSelectedQuestionId(qId);
    setSelectedMark(mark);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuestionId(null);
  };

  const handlePrevQuestion = () => {
    if (!selectedQuestion) return;
    Haptics.selectionAsync();
    const curIdx = questions.findIndex((q) => q.id === selectedQuestion.id);
    if (curIdx > 0) {
      setSelectedQuestionId(questions[curIdx - 1].id);
    } else {
      setSelectedQuestionId(questions[questions.length - 1].id);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedQuestion) return;
    Haptics.selectionAsync();
    const curIdx = questions.findIndex((q) => q.id === selectedQuestion.id);
    if (curIdx < questions.length - 1) {
      setSelectedQuestionId(questions[curIdx + 1].id);
    } else {
      setSelectedQuestionId(questions[0].id);
    }
  };

  // Color Tokens based on Figma DevMode CSS (.questionBankMobile3 & .questionBankMobile4)
  // Light Theme:
  // - Background: #f0f7f4
  // - Badge: #273a31
  // - Title: #1a2924
  // - Subtitle: #4f7d66
  // - Divider: #b2d1c2
  // - Instruction: #596e66
  // - Card: #f6fbf8, border #b2d1c2
  // - Card number: #4f7d66
  // - Active chip: #335c4a, text #ffffff
  // - Inactive chip: #f6fbf8, text #4f7d66
  // - Answer badge: #4f7d66, text #ffffff
  // - Study tip card: #e8f2eb, border #b2d1c2
  // - Nav buttons: #2d3e36, icon #ffffff
  // Dark Theme:
  // - Background: #1a2921
  // - Badge: #ffffff
  // - Title: #f0f7f0
  // - Subtitle: #bad1bf
  // - Divider: #4d6e57
  // - Instruction: #bad1bf
  // - Card: #21362b, border #4d6e57
  // - Card number: #b2e0c2
  // - Active chip: #b2e0c2, text #1a2921
  // - Inactive chip: #304d3b, text #bad1bf
  // - Answer badge: #59b87a, text #1a2921
  // - Study tip card: #214730, border #59b87a
  // - Nav buttons: #b2e0c2, icon #1a2921
  const bg = isDark ? '#1A2921' : '#F0F7F4';
  const badgeBg = isDark ? '#FFFFFF' : '#273A31';
  const titleColor = isDark ? '#F0F7F0' : '#1A2924';
  const subtitleColor = isDark ? '#BAD1BF' : '#4F7D66';
  const dividerColor = isDark ? '#4D6E57' : '#B2D1C2';
  const instructionColor = isDark ? '#BAD1BF' : '#596E66';
  const cardBg = isDark ? '#21362B' : '#F6FBF8';
  const cardBorder = isDark ? '#4D6E57' : '#B2D1C2';
  const numberColor = isDark ? '#B2E0C2' : '#4F7D66';
  const questionTextColor = isDark ? '#F0F7F0' : '#1A2924';
  const chapterTextColor = isDark ? '#BAD1BF' : '#596E66';

  const MARK_OPTIONS: MarkType[] = ['2M', '5M', '10M'];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HEADER ROW (.rectangleParent & .screenTitle) */}
        <View style={styles.headerRow}>
          <View style={[styles.badgeSquare, { backgroundColor: badgeBg }]}>
            <Image source={PLANT_BADGE} style={styles.badgeImage} resizeMode="contain" />
          </View>
          <Text style={[styles.screenTitle, { color: titleColor }]}>Question Bank</Text>
        </View>

        {/* 2. SUBTITLE (.questionCount) */}
        <Text style={[styles.questionCount, { color: subtitleColor }]}>
          {selectedQuestion
            ? `Question ${selectedQuestion.numberFormatted} · Model answer`
            : `${questions.length} questions available · 2M, 5M & 10M model answers`}
        </Text>

        {/* 3. HEADER DIVIDER (.headerDivider) */}
        <View style={[styles.headerDivider, { backgroundColor: dividerColor }]} />

        {/* 4. TOP ACTION: Instruction or Back Button */}
        {selectedQuestion ? (
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? '#21362B' : '#FFFFFF',
                borderColor: dividerColor,
              },
            ]}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.backLabel, { color: isDark ? '#B2E0C2' : '#335C4A' }]}>
              ‹  Back
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.instruction, { color: instructionColor }]}>
            Choose a question and answer length.
          </Text>
        )}

        {/* 5. QUESTION CARDS LIST */}
        <View style={styles.cardsList}>
          {questions.map((item) => {
            const isThisSelected = selectedQuestion?.id === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isThisSelected ? (isDark ? '#59B87A' : '#335C4A') : cardBorder,
                  },
                ]}
                onPress={() => handleCardPress(item.id)}
                activeOpacity={0.9}
              >
                {/* Top Section: Number & Question Text */}
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.questionNumber, { color: numberColor }]}>
                    {item.numberFormatted}
                  </Text>
                  <Text style={[styles.questionText, { color: questionTextColor }]}>
                    {item.question}
                  </Text>
                </View>

                {/* Mark Length Chips: 2M | 5M | 10M */}
                <View style={styles.marksChipsRow}>
                  {MARK_OPTIONS.map((m) => {
                    const isActive = isThisSelected && selectedMark === m;

                    return (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.markChip,
                          {
                            backgroundColor: isActive
                              ? isDark
                                ? '#B2E0C2'
                                : '#335C4A'
                              : isDark
                              ? '#304D3B'
                              : '#F6FBF8',
                            borderColor: isActive
                              ? isDark
                                ? '#B2E0C2'
                                : '#335C4A'
                              : dividerColor,
                          },
                        ]}
                        onPress={() => handleMarkChipPress(item.id, m)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.markChipText,
                            {
                              color: isActive
                                ? isDark
                                  ? '#1A2921'
                                  : '#FFFFFF'
                                : isDark
                                ? '#BAD1BF'
                                : '#4F7D66',
                            },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Chapter Label */}
                <Text style={[styles.chapterLabel, { color: chapterTextColor }]}>
                  {item.chapter}
                </Text>

                {/* EXPANDED MODEL ANSWER SECTION (.modelAnswer) */}
                {isThisSelected && (
                  <View style={styles.expandedAnswerSection}>
                    <View style={[styles.answerDivider, { backgroundColor: dividerColor }]} />
                    <View style={styles.answerContentRow}>
                      <View
                        style={[
                          styles.answerBadge,
                          { backgroundColor: isDark ? '#59B87A' : '#4F7D66' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.answerBadgeLabel,
                            { color: isDark ? '#1A2921' : '#FFFFFF' },
                          ]}
                        >
                          A
                        </Text>
                      </View>
                      <Text style={[styles.modelAnswerText, { color: questionTextColor }]}>
                        {item.answers[selectedMark]}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 6. REMEMBER STUDY TIP CARD (when answer is revealed) */}
        {selectedQuestion && (
          <View
            style={[
              styles.studyTipCard,
              {
                backgroundColor: isDark ? '#214730' : '#E8F2EB',
                borderColor: isDark ? '#59B87A' : dividerColor,
              },
            ]}
          >
            <Text style={[styles.studyTipTitle, { color: isDark ? '#59B87A' : '#335C4A' }]}>
              Remember
            </Text>
            <Text style={[styles.studyTipBody, { color: isDark ? '#F0F7F0' : '#1A2924' }]}>
              {selectedQuestion.rememberTip}
            </Text>
          </View>
        )}

        {/* 7. BOTTOM NAVIGATION ARROWS (when answer is revealed) */}
        {selectedQuestion && (
          <View style={styles.navArrowsRow}>
            <TouchableOpacity
              style={[
                styles.navArrowButton,
                { backgroundColor: isDark ? '#B2E0C2' : '#2D3E36' },
              ]}
              onPress={handlePrevQuestion}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isDark ? '#1A2921' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navArrowButton,
                { backgroundColor: isDark ? '#B2E0C2' : '#2D3E36' },
              ]}
              onPress={handleNextQuestion}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-forward"
                size={20}
                color={isDark ? '#1A2921' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* 8. FOOTER HINT / NOTE */}
        <Text style={[styles.footerHint, { color: instructionColor }]}>
          {selectedQuestion
            ? `Model answer · ${selectedMark.toLowerCase()}-mark format`
            : 'Select a question to view its model answer.'}
        </Text>

        <View style={{ height: 80 }} />
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  badgeSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: 28,
    height: 28,
  },
  screenTitle: {
    flex: 1,
    fontSize: 25,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* 2. Subtitle */
  questionCount: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },

  /* 3. Divider */
  headerDivider: {
    height: 1,
    width: '100%',
    marginBottom: 14,
  },

  /* 4. Top Action */
  instruction: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
  },
  backButton: {
    width: 76,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  backLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* 5. Cards List */
  cardsList: {
    gap: 14,
    marginBottom: 16,
  },
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  questionNumber: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    width: 32,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },

  /* Marks Chips */
  marksChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 42,
    marginBottom: 8,
  },
  markChip: {
    width: 55,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chapterLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 42,
  },

  /* Expanded Answer Area */
  expandedAnswerSection: {
    marginTop: 10,
  },
  answerDivider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  answerContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  answerBadge: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  answerBadgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modelAnswerText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 19,
    fontWeight: '500',
  },

  /* 6. Study Tip Card */
  studyTipCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 6,
  },
  studyTipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  studyTipBody: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },

  /* 7. Nav Arrows */
  navArrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  navArrowButton: {
    width: 50,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  /* 8. Footer */
  footerHint: {
    fontSize: 11,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
});
