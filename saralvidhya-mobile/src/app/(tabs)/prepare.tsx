import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import AssessmentView from '@/components/study/AssessmentView';
import PYQView from '@/components/study/PYQView';
import { BorderRadius, Spacing } from '@/constants/theme';

const PREPARE_SEGMENTS: NavSegment[] = [
  { id: 'high_yield', label: 'High-Yield', vectorIcon: 'star-outline' },
  { id: 'past_papers', label: 'Past Papers', vectorIcon: 'newspaper-outline' },
  { id: 'mock_exam', label: 'Mock Exam', vectorIcon: 'stopwatch-outline' },
];

interface HighYieldTip {
  title: string;
  marks: string;
  focus: string;
  examTip: string;
  keyKeywords: string[];
}

const HIGH_YIELD_DATA: Record<number, HighYieldTip[]> = {
  1: [
    {
      title: 'Stomodaeal Valve & Proventriculus Structure',
      marks: '5 Marks',
      focus: 'Foregut-Midgut junction and cuticular masticatory teeth',
      examTip: 'Always draw the cross-section showing 6 cuticular teeth and circular muscle sphincter.',
      keyKeywords: ['Ectodermal origin', 'Cuticular teeth', 'Intima shedding', 'Sphincter action'],
    },
    {
      title: 'Peritrophic Membrane Synthesis & Function',
      marks: '2 Marks',
      focus: 'Endodermal microvillar protection and enzyme permeability',
      examTip: 'State Type-I (delamination along midgut) vs Type-II (specialized proventricular cardial ring).',
      keyKeywords: ['Chitin-protein mesh', 'Abrasive food barrier', 'Microvilli shielding', 'Ultrafilter'],
    },
    {
      title: 'Malpighian Tubules & Rectal Water Reabsorption',
      marks: '10 Marks (Essay)',
      focus: 'Insect osmoregulatory dynamics and terrestrial water economy',
      examTip: 'Label the Malpighian tubule insertion ring, ileum, colon, and the 6 rectal pads with epithelial cuticular valves.',
      keyKeywords: ['Cryptonephridial system', 'Uric acid excretion', 'Rectal papillae', 'Hypertonic faeces'],
    },
  ],
  2: [
    {
      title: 'Ametabolous vs Hemimetabolous vs Holometabolous Metamorphosis',
      marks: '5 Marks',
      focus: 'Classification of post-embryonic insect development',
      examTip: 'Tabulate nymph vs naiad vs larva-pupa-adult stages with ANGRAU crop pest examples.',
      keyKeywords: ['Ecdysis', 'Exuviae', 'Instar', 'Imaginal discs'],
    },
    {
      title: 'Hormonal Control of Ecdysis and Apolysis',
      marks: '10 Marks (Essay)',
      focus: 'Interplay of PTTH, Ecdysone and Juvenile Hormone (JH)',
      examTip: 'Draw the endocrine pathway: Brain neurosecretory cells -> Prothoracic gland -> Ecdysone -> Apolysis.',
      keyKeywords: ['Corpora allata', 'Corpora cardiaca', '20-hydroxyecdysone', 'Juvenile hormone titer'],
    },
  ],
};

export default function PrepareScreen() {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const activeSubject = ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>('high_yield');
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  const tips = HIGH_YIELD_DATA[selectedChapterNum] || HIGH_YIELD_DATA[1];

  const screenBg = isDark ? '#23322B' : '#FFF6F1';
  const cardBg = isDark ? '#1E2B24' : '#FFFFFF';
  const cardBorder = isDark ? '#3D5449' : '#E5DDD8';
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const tagBg = isDark ? '#1C2822' : '#F7EBE3';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* Top Navigation Bar with Toggle Pills & Profile Avatar */}
      <TopNavBar
        segments={PREPARE_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        chapterTitle={`Ch ${currentChapter.number}`}
        onChapterPress={() => setShowChapterModal(true)}
      />

      {/* Sub Header */}
      <View style={[styles.subBar, { backgroundColor: screenBg, borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          style={[styles.chapterPickerBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={() => setShowChapterModal(true)}
          activeOpacity={0.8}
        >
          <View style={styles.chNumBadge}>
            <Text style={styles.chNumText}>{currentChapter.number}</Text>
          </View>
          <Text style={[styles.chapterPickerName, { color: textColor }]} numberOfLines={1}>
            {currentChapter.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#22c55e" />
        </TouchableOpacity>

        <View style={styles.examTag}>
          <Text style={styles.examTagText}>ANGRAU Sem Exam Focus</Text>
        </View>
      </View>

      {/* Main Prepare Content */}
      <ScrollView
        style={styles.workspace}
        contentContainerStyle={[styles.workspaceContent, isTablet && { alignItems: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrap, isTablet && { width: '100%', maxWidth: 860, alignSelf: 'center' }]}>
          {activeSegment === 'high_yield' ? (
            <View>
              {/* Revision Intro Card */}
              <View style={[styles.introCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.introHeaderRow}>
                  <Ionicons name="flash" size={20} color="#f59e0b" />
                  <Text style={styles.introBadge}>MUST-KNOW EXAM CONCEPTS</Text>
                </View>
                <Text style={[styles.introTitle, { color: textColor }]}>
                  High-Yield Blueprint: {currentChapter.name}
                </Text>
                <Text style={[styles.introSubtitle, { color: subtextColor }]}>
                  Curated specifically from previous 5 years ANGRAU semester examination marking keys.
                </Text>
              </View>

              {/* High Yield Tips */}
              {tips.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tipCard,
                    { backgroundColor: cardBg, borderColor: cardBorder },
                  ]}
                >
                  <View style={styles.tipHeader}>
                    <View style={[styles.marksBadge, { backgroundColor: item.marks.includes('10') ? '#ef444422' : '#22c55e22' }]}>
                      <Text style={[styles.marksText, { color: item.marks.includes('10') ? '#ef4444' : '#22c55e' }]}>
                        {item.marks}
                      </Text>
                    </View>
                    <Text style={[styles.tipTitle, { color: textColor }]}>
                      {item.title}
                    </Text>
                  </View>

                  <Text style={[styles.focusText, { color: subtextColor }]}>
                    <Text style={{ fontWeight: '700', color: textColor }}>Examiner Focus: </Text>
                    {item.focus}
                  </Text>

                  <View style={[styles.examTipBox, { backgroundColor: tagBg }]}>
                    <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                    <Text style={[styles.examTipText, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                      {item.examTip}
                    </Text>
                  </View>

                  <View style={styles.keywordWrap}>
                    {item.keyKeywords.map((kw, kwIdx) => (
                      <View key={kwIdx} style={[styles.keywordPill, { backgroundColor: tagBg }]}>
                        <Text style={[styles.keywordText, { color: subtextColor }]}>
                          ✓ {kw}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : activeSegment === 'past_papers' ? (
            <PYQView
              chapterNumber={currentChapter.number}
              chapterName={currentChapter.name}
            />
          ) : activeSegment === 'mock_exam' ? (
            <AssessmentView chapterNumber={currentChapter.number} />
          ) : null}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Chapter Selection Modal */}
      <Modal
        visible={showChapterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowChapterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChapterModal(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#23322B' : '#FFF6F1' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                Select Chapter ({activeSubject.code})
              </Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Ionicons name="close" size={24} color={subtextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              {activeSubject.chapters.map((ch) => {
                const isCur = ch.number === selectedChapterNum;
                return (
                  <TouchableOpacity
                    key={ch.number}
                    style={[styles.modalChapterRow, isCur && styles.modalChapterRowActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedChapterNum(ch.number);
                      setShowChapterModal(false);
                    }}
                  >
                    <View style={[styles.modalNumBadge, isCur && styles.modalNumBadgeActive]}>
                      <Text style={[styles.modalNumText, isCur && styles.modalNumTextActive]}>
                        {ch.number}
                      </Text>
                    </View>
                    <Text style={[styles.modalChapterText, isCur && styles.modalChapterTextActive, { color: textColor }]}>
                      {ch.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  subBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  chapterPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 8,
    flex: 1,
  },
  chNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  chapterPickerName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  examTag: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  examTagText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  workspace: {
    flex: 1,
  },
  workspaceContent: {
    padding: Spacing.four,
  },
  contentWrap: {
    width: '100%',
  },
  introCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  introBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  tipCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  marksBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  marksText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  focusText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  examTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginBottom: 10,
  },
  examTipText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontWeight: '600',
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  keywordText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.four,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalChapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    gap: 12,
  },
  modalChapterRowActive: {
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  modalNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(128,128,128,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNumBadgeActive: {
    backgroundColor: '#22c55e',
  },
  modalNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
  },
  modalNumTextActive: {
    color: '#FFFFFF',
  },
  modalChapterText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  modalChapterTextActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
});
