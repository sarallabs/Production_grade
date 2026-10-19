import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export type MarkType = '2M' | '5M' | '10M';

export interface TeacherQuestion {
  id: number;
  numberFormatted: string;
  question: string;
  assignedBy: string;
  chapter: string;
  answers: Record<MarkType, string>;
  teacherTip: string;
}

const TEACHER_QUESTIONS: TeacherQuestion[] = [
  {
    id: 1,
    numberFormatted: '01',
    question:
      'Describe the tripartite division and embryological origin of the insect alimentary canal.',
    assignedBy: 'Prof. C. Srinivasa Rao (Dept. of Entomology)',
    chapter: 'Chapter 1 · Insect Digestive System',
    answers: {
      '2M':
        'The insect alimentary canal is divided into three regions: the foregut (stomodaeum), midgut (mesenteron), and hindgut (proctodaeum). Foregut and hindgut originate from embryonic ectoderm with cuticular intima; midgut originates from endoderm with no cuticular intima.',
      '5M':
        'The insect alimentary canal comprises three distinct morphogenetic sections:\n\n' +
        '1. Foregut (Stomodaeum - Ectoderm):\n' +
        '• Formed by anterior ectodermal invagination.\n' +
        '• Subdivided into preoral cavity, pharynx, esophagus, crop, and proventriculus.\n' +
        '• Lined with cuticular intima shed at each moult.\n\n' +
        '2. Midgut (Mesenteron - Endoderm):\n' +
        '• Arises from embryonic endoderm.\n' +
        '• Site of primary chemical enzyme digestion and nutrient absorption.\n' +
        '• Secretes peritrophic membrane; features anterior gastric caeca.\n\n' +
        '3. Hindgut (Proctodaeum - Ectoderm):\n' +
        '• Posterior ectodermal invagination lined with cuticular intima.\n' +
        '• Subdivided into ileum, colon, and rectum (with 6 rectal papillae for water absorption).',
      '10M':
        'I. Comprehensive Tripartite Division & Embryological Origins:\n\n' +
        '1. Stomodaeum (Foregut):\n' +
        '• Ingestion, storage, and mechanical maceration zone.\n' +
        '• Lined by cuticular intima continuous with exoskeleton.\n\n' +
        '2. Mesenteron (Midgut):\n' +
        '• Secretory and absorptive zone devoid of cuticular intima.\n' +
        '• Columnar enterocytes produce digestive hydrolases; basal nidi regenerate lining.\n\n' +
        '3. Proctodaeum (Hindgut):\n' +
        '• Excretion and osmoregulation; receives Malpighian tubules.\n' +
        '• Rectal pads reabsorb up to 95% water to generate dry uric acid pellets.',
    },
    teacherTip: 'Vital 10M ANGRAU question: Always draw a neat labeled diagram showing ectodermal vs endodermal zones.',
  },
  {
    id: 2,
    numberFormatted: '02',
    question:
      'Explain the histological wall layers of the insect alimentary canal from the lumen outward.',
    assignedBy: 'Dr. V. K. Sharma (Senior Faculty)',
    chapter: 'Chapter 1 · Insect Digestive System',
    answers: {
      '2M':
        'From lumen outward: (1) Cuticular intima (fore/hindgut only), (2) Columnar epithelium on basement membrane, (3) Circular muscle layer, (4) Longitudinal muscle layer, and (5) Peritoneal membrane.',
      '5M':
        'Histological Layers of the Gut Wall:\n\n' +
        '1. Cuticular Intima: Secreted by epithelial cells; covers foregut & hindgut.\n' +
        '2. Epithelial Layer: Single layer of columnar enterocytes.\n' +
        '3. Muscle Coats: Foregut has inner longitudinal and outer circular; Midgut has inner circular and outer longitudinal.\n' +
        '4. Peritoneal Sheath: Connective tissue with extensive tracheolar network.',
      '10M':
        'I. Detailed Histology & Functional Correlation:\n\n' +
        '1. Intima & Microvilli: Cuticular armor in anterior and posterior zones; apical brush borders in ventriculus.\n' +
        '2. Regenerative Nidi: Basal crypts maintaining rapid cell turnover during active larval feeding.\n' +
        '3. Muscularis Organization: Peristaltic rings propel food bolus unidirectionally.\n' +
        '4. Visceral Innervation: Stomatogastric nervous system controls sphincter dilation.',
    },
    teacherTip: 'Remember the muscle inversion rule: Foregut is Inner Longitudinal/Outer Circular; Midgut is reversed.',
  },
  {
    id: 3,
    numberFormatted: '03',
    question:
      'Describe the structure and grinding function of the insect proventricular gizzard.',
    assignedBy: 'Dr. K. N. Reddy (ANGRAU)',
    chapter: 'Chapter 1 · Insect Digestive System',
    answers: {
      '2M':
        'The proventriculus has heavy circular muscles and 6 longitudinal cuticular folds with sclerotized teeth for mechanical pulverization of coarse foliage.',
      '5M':
        'Structure & Mechanism of the Gizzard:\n\n' +
        '• 6 heavily sclerotized longitudinal teeth.\n' +
        '• Interdental pulvilli covered in dense hairs acting as a sieve.\n' +
        '• Cardiac valve projecting into ventriculus to prevent regurgitation.',
      '10M':
        'I. Biomechanics and Comparative Anatomy:\n\n' +
        '• Chewing Orthopterans & Blattodeans: Highly developed dental armature crushing particles to <100μm.\n' +
        '• Fluid Feeders (Hemiptera/Lepidoptera): Reduced to a simple muscular valve.',
    },
    teacherTip: 'Highlight the 6 cuticular teeth and the cardiac valve preventing regurgitation.',
  },
  {
    id: 4,
    numberFormatted: '04',
    question:
      'Explain the role of the peritrophic membrane in digestion and pathogen defense.',
    assignedBy: 'Prof. C. Srinivasa Rao (Dept. of Entomology)',
    chapter: 'Chapter 1 · Insect Digestive System',
    answers: {
      '2M':
        'A non-cellular chitin-protein sleeve secreted by midgut cells that protects microvilli from abrasive friction and blocks pathogens from entering hemolymph.',
      '5M':
        'Formation & Significance:\n\n' +
        '• Type I (delaminated from entire midgut) vs Type II (anterior cardiac ring).\n' +
        '• Protects fragile enterocytes from sharp silica phytoliths.\n' +
        '• Compartmentalizes digestion into endo- and ecto-peritrophic spaces.',
      '10M':
        'I. Detailed Physiological Dynamics:\n\n' +
        '• Meshwork lattice of chitin microfibrils cross-linked with peritrophins.\n' +
        '• Allows enzyme circulation while blocking viral occlusion bodies and Bt delta-endotoxins.',
    },
    teacherTip: 'Contrast Type I (Orthoptera/Coleoptera) vs Type II (Diptera) formation.',
  },
  {
    id: 5,
    numberFormatted: '05',
    question:
      'Discuss water conservation mechanisms involving Malpighian tubules and rectal papillae.',
    assignedBy: 'Dr. V. K. Sharma (Senior Faculty)',
    chapter: 'Chapter 1 · Insect Digestive System',
    answers: {
      '2M':
        'Malpighian tubules precipitate nitrogen as insoluble uric acid crystals, while 6 rectal papillae actively recover up to 95% of water to produce dry fecal pellets.',
      '5M':
        'Excretory & Osmoregulatory Coordination:\n\n' +
        '• Tubules pump K+/Na+ isotonically, dropping pH to precipitate uric acid.\n' +
        '• Rectal papillae use lateral intercellular ionic pumps (Wall & Oschman model) to pull water back into hemolymph.',
      '10M':
        'I. Terrestrial Water Economy:\n\n' +
        '• Uricotelic nitrogen metabolism requiring only 1 mL water per gram nitrogen.\n' +
        '• Cryptonephridial complexes in arid tenebrionid beetles extracting atmospheric water vapor.',
    },
    teacherTip: 'State the Wall & Oschman local osmotic gradient model for full 5 marks.',
  },
];

interface TeacherQuestionBankViewProps {
  chapterNumber?: number;
  chapterName?: string;
}

export default function TeacherQuestionBankView({
  chapterNumber = 1,
  chapterName = 'Insect Digestive System',
}: TeacherQuestionBankViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedMark, setSelectedMark] = useState<MarkType>('2M');

  // Color tokens
  const bg = isDark ? '#1A2921' : '#F0F7F4';
  const titleColor = isDark ? '#F0F7F0' : '#1A2924';
  const subtitleColor = isDark ? '#BAD1BF' : '#4F7D66';
  const cardBg = isDark ? '#21362B' : '#FEFEFE';
  const cardBorder = isDark ? '#4D6E57' : '#D1E0D6';
  const activeBorder = isDark ? '#59B87A' : '#2D3E36';
  const numberColor = isDark ? '#B2E0C2' : '#2B634A';
  const questionTextColor = isDark ? '#F0F7F0' : '#1A2924';
  const assignedByColor = isDark ? '#A6C5B3' : '#5E7066';
  const answerBg = isDark ? '#18271F' : '#F4FAF6';
  const answerBorder = isDark ? '#3D5C48' : '#C7DECFA';
  const answerTextColor = isDark ? '#F0F7F0' : '#1F2E26';
  const tipBg = isDark ? 'rgba(74, 222, 128, 0.1)' : '#E8F5EE';
  const tipBorder = isDark ? '#3D7A54' : '#B8DFC7';
  const tipText = isDark ? '#86EFAC' : '#1B6B40';

  const MARK_OPTIONS: MarkType[] = ['2M', '5M', '10M'];

  const selectedQuestion =
    selectedQuestionId !== null
      ? TEACHER_QUESTIONS.find((q) => q.id === selectedQuestionId) || TEACHER_QUESTIONS[0]
      : null;

  const handleSelectQuestion = (id: number) => {
    Haptics.selectionAsync();
    setSelectedQuestionId(selectedQuestionId === id ? null : id);
  };

  const handleSelectMark = (mark: MarkType) => {
    Haptics.selectionAsync();
    setSelectedMark(mark);
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Block */}
        <View style={styles.headerBlock}>
          <Text style={[styles.pageTitle, { color: titleColor }]}>Question Bank</Text>
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            Questions assigned by faculty & teachers · 2M, 5M & 10M Model Answers
          </Text>
        </View>

        {/* Question Cards */}
        <View style={styles.cardsList}>
          {TEACHER_QUESTIONS.map((item) => {
            const isExpanded = selectedQuestionId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.questionCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isExpanded ? activeBorder : cardBorder,
                  },
                ]}
              >
                {/* Header Row of the Card */}
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => handleSelectQuestion(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardNumBadge}>
                    <Text style={[styles.cardNumText, { color: numberColor }]}>
                      {item.numberFormatted}
                    </Text>
                  </View>
                  <View style={styles.cardQuestionInfo}>
                    <Text style={[styles.questionText, { color: questionTextColor }]}>
                      {item.question}
                    </Text>
                    <Text style={[styles.assignedByText, { color: assignedByColor }]}>
                      Assigned by: {item.assignedBy}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={assignedByColor}
                  />
                </TouchableOpacity>

                {/* Expanded Answer Area */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Mark Selector Chips: 2M | 5M | 10M */}
                    <View style={styles.marksRow}>
                      <Text style={[styles.marksLabel, { color: assignedByColor }]}>
                        Model Answer:
                      </Text>
                      {MARK_OPTIONS.map((mark) => {
                        const isMarkActive = selectedMark === mark;
                        return (
                          <TouchableOpacity
                            key={mark}
                            style={[
                              styles.markChip,
                              {
                                backgroundColor: isMarkActive
                                  ? (isDark ? '#2D3E36' : '#2D3E36')
                                  : (isDark ? '#263B30' : '#FFFFFF'),
                                borderColor: isMarkActive
                                  ? (isDark ? '#4ADE80' : '#2D3E36')
                                  : cardBorder,
                              },
                            ]}
                            onPress={() => handleSelectMark(mark)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.markChipText,
                                {
                                  color: isMarkActive ? '#FFFFFF' : assignedByColor,
                                  fontWeight: isMarkActive ? '700' : '500',
                                },
                              ]}
                            >
                              {mark}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Answer Card */}
                    <View
                      style={[
                        styles.answerCard,
                        { backgroundColor: answerBg, borderColor: answerBorder },
                      ]}
                    >
                      <View style={styles.answerHeaderRow}>
                        <View style={styles.answerBadge}>
                          <Text style={styles.answerBadgeText}>FACULTY ANSWER ({selectedMark})</Text>
                        </View>
                      </View>
                      <Text style={[styles.answerText, { color: answerTextColor }]}>
                        {item.answers[selectedMark]}
                      </Text>
                    </View>

                    {/* Teacher Exam Tip */}
                    <View style={[styles.tipCard, { backgroundColor: tipBg, borderColor: tipBorder }]}>
                      <Ionicons name="bulb-outline" size={15} color={tipText} />
                      <Text style={[styles.tipText, { color: tipText }]}>
                        <Text style={{ fontWeight: '700' }}>Teacher Tip: </Text>
                        {item.teacherTip}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  headerBlock: {
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  cardsList: {
    gap: 12,
  },
  questionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  cardNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardNumText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardQuestionInfo: {
    flex: 1,
    gap: 4,
  },
  questionText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  assignedByText: {
    fontSize: 10,
    fontWeight: '500',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  marksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marksLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  markChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  markChipText: {
    fontSize: 10,
  },
  answerCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerBadge: {
    backgroundColor: '#2D3E36',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  answerBadgeText: {
    color: '#4ADE80',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  tipText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});
