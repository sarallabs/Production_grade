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
import { BorderRadius, Spacing } from '@/constants/theme';

interface PYQItem {
  id: number;
  marks: 2 | 5 | 10;
  year: number;
  question: string;
  modelAnswer: string;
  diagramTip?: string;
}

const SAMPLE_PYQS: Record<number, PYQItem[]> = {
  1: [
    {
      id: 1,
      marks: 2,
      year: 2023,
      question: 'Name the three regions of the insect alimentary canal and state the embryonic germ layer from which each originates.',
      modelAnswer:
        '1. Foregut (Stomodaeum) – Arises from embryonic ectoderm; lined with cuticular intima.\n' +
        '2. Midgut (Mesenteron) – Arises from embryonic endoderm; lacks cuticular intima.\n' +
        '3. Hindgut (Proctodaeum) – Arises from embryonic ectoderm; lined with cuticular intima.',
    },
    {
      id: 2,
      marks: 2,
      year: 2022,
      question: 'What is the peritrophic membrane? Mention two vital functions.',
      modelAnswer:
        'A semi-permeable non-cellular sheath made of chitin and protein secreted in the midgut.\n\n' +
        'Key Functions:\n' +
        '- Protects delicate midgut epithelial cells from abrasive food particles.\n' +
        '- Acts as a defensive barrier preventing pathogen and microbial entry into hemolymph.',
    },
    {
      id: 3,
      marks: 5,
      year: 2021,
      question: 'Describe the structure and physiological functions of the proventriculus (gizzard) in insects.',
      modelAnswer:
        'The proventriculus is the posterior region of the foregut, best developed in chewing insects (e.g. Grasshoppers, Cockroaches).\n\n' +
        'Structure:\n' +
        '- Possesses a thick circular muscle coat and inner cuticular intima folded into 6 longitudinal teeth.\n' +
        '- Features fine interdental cushions bearing backwardly-directed spines.\n\n' +
        'Functions:\n' +
        '1. Mechanical grinding of coarse food particles.\n' +
        '2. Straining and filtering slurry before passing to midgut.\n' +
        '3. Houses the stomodaeal cardiac valve to prevent regurgitation.',
      diagramTip: 'Sketch the transverse section showing circular muscle and 6 chitinous teeth.',
    },
    {
      id: 4,
      marks: 5,
      year: 2023,
      question: 'Explain the role of Malpighian tubules and rectal papillae in insect water conservation and excretion.',
      modelAnswer:
        'Insects achieve extreme water economy via coordinated action of Malpighian tubules and rectal papillae:\n\n' +
        '1. Malpighian Tubules:\n' +
        '- Actively pump potassium and potassium urate into tubule lumen from hemolymph.\n' +
        '- Acidic pH in lower tubule precipitates uric acid as insoluble crystals, freeing water.\n\n' +
        '2. Rectal Papillae / Pads:\n' +
        '- Highly specialized columnar cells in the rectum actively reabsorb up to 95% of water and essential ions, yielding dry fecal pellets.',
      diagramTip: 'Illustrate the uric acid precipitation loop between Malpighian tubules and rectum.',
    },
    {
      id: 5,
      marks: 10,
      year: 2020,
      question: 'Give a comprehensive account of the insect digestive system with a neat labeled diagram. Discuss the comparative modifications in chewing vs sucking insects.',
      modelAnswer:
        'I. General Alimentary Canal Organization:\n' +
        '- Foregut (Preoral cavity, pharynx, oesophagus, crop, proventriculus)\n' +
        '- Midgut (Gastric caeca, ventriculus, peritrophic membrane)\n' +
        '- Hindgut (Ileum, colon, rectum, rectal papillae)\n\n' +
        'II. Comparative Modifications:\n' +
        '1. Solid Feeders (Chewing): Massive muscular gizzard with cuticular grinding teeth, well-developed crop, robust peritrophic membrane.\n' +
        '2. Liquid / Sap Feeders (Hemiptera): Greatly reduced gizzard, enlarged muscular pharyngeal suction pump, presence of filter chamber (in homopterans) to rapidly eliminate excess water directly to hindgut.',
      diagramTip: 'Mandatory 10-mark diagram: Full alimentary canal highlighting stomodaeal valve, caeca, and Malpighian tubules.',
    },
  ],
};

type FilterMarks = 'all' | 2 | 5 | 10;

export default function PYQView({
  chapterNumber,
  chapterName,
}: {
  chapterNumber: number;
  chapterName: string;
}) {
  const { isDark } = useAppTheme();
  const [filter, setFilter] = useState<FilterMarks>('all');
  const [expandedIds, setExpandedIds] = useState<number[]>([1]); // first expanded by default

  const questions = SAMPLE_PYQS[chapterNumber] || SAMPLE_PYQS[1];

  const filtered = questions.filter((q) => {
    if (filter === 'all') return true;
    return q.marks === filter;
  });

  const toggleExpand = (id: number) => {
    Haptics.selectionAsync();
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter((i) => i !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const getMarksBadgeColor = (marks: number) => {
    if (marks === 2) return '#3b82f6';
    if (marks === 5) return '#f59e0b';
    return '#8b5cf6';
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <Text style={styles.uniBadge}>OFFICIAL PAST PAPERS</Text>
        <Text style={[styles.heading, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
          Previous Year Questions (PYQs)
        </Text>
        <Text style={[styles.subheading, { color: isDark ? '#A6C5B3' : '#688875' }]}>
          Model answers with marking schemes and diagram requirements for Chapter {chapterNumber}.
        </Text>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 2, 5, 10] as FilterMarks[]).map((f) => {
            const isSelected = filter === f;
            return (
              <TouchableOpacity
                key={String(f)}
                style={[
                  styles.filterPill,
                  { backgroundColor: isDark ? '#1C2822' : '#F7EBE3' },
                  isSelected && styles.filterPillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(f);
                }}
              >
                <Text style={[styles.filterText, { color: isDark ? '#A6C5B3' : '#688875' }, isSelected && styles.filterTextActive]}>
                  {f === 'all' ? 'All Questions' : `${f} Marks`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Questions Accordion List */}
      <View style={styles.questionsList}>
        {filtered.map((item) => {
          const isExpanded = expandedIds.includes(item.id);
          const badgeColor = getMarksBadgeColor(item.marks);

          return (
            <View
              key={item.id}
              style={[
                styles.questionCard,
                {
                  backgroundColor: isDark ? '#23322B' : '#ffffff',
                  borderColor: isExpanded ? '#22c55e66' : (isDark ? '#3D5449' : '#E5DDD8'),
                },
              ]}
            >
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.badgeRow}>
                  <View style={[styles.markBadge, { backgroundColor: `${badgeColor}22`, borderColor: badgeColor }]}>
                    <Text style={[styles.markBadgeText, { color: badgeColor }]}>
                      {item.marks} MARKS
                    </Text>
                  </View>
                  <Text style={styles.yearTag}>ANGRAU {item.year}</Text>
                </View>

                <Text
                  style={[styles.questionStem, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                >
                  {item.question}
                </Text>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleHint}>
                    {isExpanded ? 'Hide Model Answer' : 'View Model Answer'}
                  </Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#22c55e"
                  />
                </View>
              </TouchableOpacity>

              {/* Collapsible Model Answer */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.answerHeaderRow}>
                    <Ionicons name="ribbon-outline" size={16} color="#22c55e" />
                    <Text style={styles.answerHeaderTitle}>OFFICIAL MODEL ANSWER</Text>
                  </View>

                  <Text
                    style={[styles.answerText, { color: isDark ? '#cbd5e1' : '#334155' }]}
                  >
                    {item.modelAnswer}
                  </Text>

                  {item.diagramTip ? (
                    <View style={styles.diagramBox}>
                      <Ionicons name="pencil" size={14} color="#f59e0b" />
                      <Text style={styles.diagramText}>
                        <Text style={{ fontWeight: '700' }}>Diagram Recommendation: </Text>
                        {item.diagramTip}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  uniBadge: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  filterPillActive: {
    backgroundColor: '#22c55e',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  questionsList: {
    gap: 12,
  },
  questionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    elevation: 2,
  },
  cardHeader: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  markBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  markBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  yearTag: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  questionStem: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  toggleHint: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: Spacing.three,
    marginTop: Spacing.two,
    gap: 8,
  },
  answerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerHeaderTitle: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 13,
    lineHeight: 20,
  },
  diagramBox: {
    flexDirection: 'row',
    backgroundColor: '#f59e0b11',
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    borderRadius: BorderRadius.sm,
    padding: 8,
    gap: 6,
    marginTop: 4,
  },
  diagramText: {
    color: '#f59e0b',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
