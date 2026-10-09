import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { ANGRAU_SUBJECTS, Chapter, manifestService } from '@/api/manifestService';
import { BorderRadius, Spacing } from '@/constants/theme';
import MarkdownReader from '@/components/study/MarkdownReader';
import { SAMPLE_STUDY_CONTENT } from '@/data/sampleStudyContent';
import { speechService } from '@/services/speechService';
import FlashcardDeck from '@/components/flashcards/FlashcardDeck';
import { SAMPLE_FLASHCARDS, Flashcard } from '@/data/sampleFlashcards';
import AssessmentView from '@/components/study/AssessmentView';
import PodcastsView from '@/components/study/PodcastsView';
import AskBotView from '@/components/study/AskBotView';
import PYQView from '@/components/study/PYQView';
import MindmapView from '@/components/study/MindmapView';
import {
  fetchQuickStudyGuide,
  fetchDetailedNotes,
  fetchFlashcards,
  fetchMindmap,
  MindmapData,
} from '@/services/contentService';

export type StudyToolId =
  | 'summary'
  | 'detailed'
  | 'flashcards'
  | 'assessment'
  | 'podcasts'
  | 'videos'
  | 'mindmap'
  | 'pyq'
  | 'ask';

interface StudyTool {
  id: StudyToolId;
  label: string;
  icon: string;
  badge?: string;
}

const STUDY_TOOLS: StudyTool[] = [
  { id: 'summary', label: 'Quick Study', icon: '📖' },
  { id: 'detailed', label: 'Detailed Notes', icon: '📝' },
  { id: 'flashcards', label: 'Flashcards', icon: '🗂️' },
  { id: 'assessment', label: 'Assessments', icon: '🎯' },
  { id: 'podcasts', label: 'Podcasts', icon: '🎙️' },
  { id: 'videos', label: 'Videos', icon: '📺' },
  { id: 'mindmap', label: 'Mindmap', icon: '🧠' },
  { id: 'pyq', label: 'Past PYQs', icon: '📜' },
  { id: 'ask', label: 'Ask AI Bot', icon: '🤖', badge: 'AI' },
];

const GUIDED_FLOW: StudyToolId[] = [
  'summary',
  'flashcards',
  'detailed',
  'podcasts',
  'assessment',
  'mindmap',
  'pyq',
  'ask',
];

export default function StudyTableScreen() {
  const params = useLocalSearchParams<{ subjectId?: string; chapter?: string }>();
  const { persona, updatePersona } = useAuth();
  const { isDark } = useAppTheme();

  const activeSubject = ANGRAU_SUBJECTS[0]; // ENTO 131
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(
    params.chapter ? parseInt(params.chapter, 10) : 1
  );
  const [activeTool, setActiveTool] = useState<StudyToolId>('summary');
  const [showChapterModal, setShowChapterModal] = useState(false);

  const [quickStudyText, setQuickStudyText] = useState<string>('');
  const [detailedNotesText, setDetailedNotesText] = useState<string>('');
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>([]);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(true);

  useEffect(() => {
    if (params.chapter) {
      setSelectedChapterNum(parseInt(params.chapter, 10));
    }
  }, [params.chapter]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingContent(true);

    Promise.all([
      fetchQuickStudyGuide(activeSubject.id, selectedChapterNum, persona),
      fetchDetailedNotes(activeSubject.id, selectedChapterNum, persona),
      fetchFlashcards(activeSubject.id, selectedChapterNum, persona),
      fetchMindmap(activeSubject.id, selectedChapterNum),
    ])
      .then(([quick, detailed, fCards, mMap]) => {
        if (isMounted) {
          setQuickStudyText(quick);
          setDetailedNotesText(detailed);
          setFlashcardsList(fCards);
          setMindmapData(mMap);
          setIsLoadingContent(false);
        }
      })
      .catch((err) => {
        console.warn('Content loading error:', err);
        if (isMounted) setIsLoadingContent(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChapterNum, persona]);

  const currentChapter =
    activeSubject.chapters.find((c) => c.number === selectedChapterNum) ||
    activeSubject.chapters[0];

  // Up Next calculation
  const currentFlowIndex = GUIDED_FLOW.indexOf(activeTool);
  const nextToolId: StudyToolId | null =
    currentFlowIndex !== -1 && currentFlowIndex < GUIDED_FLOW.length - 1
      ? GUIDED_FLOW[currentFlowIndex + 1]
      : null;
  const nextTool = STUDY_TOOLS.find((t) => t.id === nextToolId);

  const handleToolSelect = (toolId: StudyToolId) => {
    Haptics.selectionAsync();
    setActiveTool(toolId);
  };

  const handleUpNext = () => {
    if (nextToolId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setActiveTool(nextToolId);
    }
  };

  const handleLevelChange = (lvl: PersonaType) => {
    Haptics.selectionAsync();
    updatePersona(lvl);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#090d16' : '#f8fafc' }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.courseHeaderRow}>
          <View>
            <Text style={styles.courseCodeBadge}>{activeSubject.code} • ANGRAU</Text>
            <TouchableOpacity
              style={styles.chapterSelector}
              onPress={() => setShowChapterModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chapterTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
                Ch {currentChapter.number}: {currentChapter.name}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#22c55e" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Level Switcher */}
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Reading Depth:</Text>
          <View style={styles.levelPills}>
            {(['beginner', 'intermediate', 'advanced'] as PersonaType[]).map((lvl) => {
              const isSelected = persona === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.levelPill, isSelected && styles.levelPillActive]}
                  onPress={() => handleLevelChange(lvl)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.levelText, isSelected && styles.levelTextActive]}>
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Horizontal Tool Ribbon */}
      <View style={styles.ribbonContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ribbonScroll}
        >
          {STUDY_TOOLS.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolTab,
                  isActive && styles.toolTabActive,
                  { backgroundColor: isDark ? '#111827' : '#ffffff' },
                ]}
                onPress={() => handleToolSelect(tool.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <Text style={[styles.toolLabel, isActive && styles.toolLabelActive]}>
                  {tool.label}
                </Text>
                {tool.badge && (
                  <View style={styles.toolBadge}>
                    <Text style={styles.toolBadgeText}>{tool.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Study Workspace Area */}
      <ScrollView
        style={styles.workspace}
        contentContainerStyle={styles.workspaceContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.activeToolCard, { backgroundColor: isDark ? '#111827' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <View style={styles.toolHeader}>
            <View style={styles.toolHeaderIcon}>
              <Text style={{ fontSize: 24 }}>
                {STUDY_TOOLS.find((t) => t.id === activeTool)?.icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toolHeading, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {STUDY_TOOLS.find((t) => t.id === activeTool)?.label}
              </Text>
              <Text style={styles.toolSubheading}>
                Chapter {currentChapter.number} • {persona.toUpperCase()} Depth
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Active Tool Content */}
          {isLoadingContent ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text
                style={{
                  marginTop: 14,
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                Loading canonical ANGRAU study content...
              </Text>
            </View>
          ) : activeTool === 'summary' ? (
            <MarkdownReader
              title={`Ch ${currentChapter.number}: ${currentChapter.name}`}
              content={
                quickStudyText ||
                SAMPLE_STUDY_CONTENT[currentChapter.number]?.summary ||
                `# Chapter ${currentChapter.number}: ${currentChapter.name}\n\nLoading syllabus notes...`
              }
            />
          ) : activeTool === 'detailed' ? (
            <MarkdownReader
              title={`Ch ${currentChapter.number}: ${currentChapter.name}`}
              content={
                detailedNotesText ||
                SAMPLE_STUDY_CONTENT[currentChapter.number]?.detailed ||
                `# Chapter ${currentChapter.number}: ${currentChapter.name}\n\nLoading detailed lecture notes...`
              }
            />
          ) : activeTool === 'flashcards' ? (
            <FlashcardDeck
              cards={
                flashcardsList.length > 0
                  ? flashcardsList
                  : SAMPLE_FLASHCARDS[currentChapter.number] || SAMPLE_FLASHCARDS[1]
              }
              chapterNumber={currentChapter.number}
            />
          ) : activeTool === 'mindmap' ? (
            mindmapData ? (
              <MindmapView data={mindmapData} chapterNumber={currentChapter.number} />
            ) : (
              <ActivityIndicator size="large" color="#22c55e" />
            )
          ) : activeTool === 'assessment' ? (
            <AssessmentView chapterNumber={currentChapter.number} />
          ) : activeTool === 'podcasts' ? (
            <PodcastsView
              chapterNumber={currentChapter.number}
              chapterName={currentChapter.name}
            />
          ) : activeTool === 'ask' ? (
            <AskBotView
              chapterNumber={currentChapter.number}
              chapterName={currentChapter.name}
            />
          ) : activeTool === 'pyq' ? (
            <PYQView
              chapterNumber={currentChapter.number}
              chapterName={currentChapter.name}
            />
          ) : (
            <View style={styles.toolContentPreview}>
              <Text style={[styles.previewTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {currentChapter.name}
              </Text>
              <Text style={styles.previewDescription}>
                {currentChapter.description}
              </Text>

              <View style={styles.featureHighlights}>
                <View style={styles.highlightItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.highlightLabel}>Official ANGRAU Agriculture Syllabus verified</Text>
                </View>
                <View style={styles.highlightItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.highlightLabel}>Synced with Cloud Run Backend & GCS</Text>
                </View>
                <View style={styles.highlightItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.highlightLabel}>Offline caching available on this device</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Spacing for floating up next button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating "Up Next" Button */}
      {nextTool && (
        <View style={styles.floatingUpNextContainer}>
          <TouchableOpacity
            style={styles.floatingUpNextBtn}
            onPress={handleUpNext}
            activeOpacity={0.85}
          >
            <View style={styles.upNextIconCircle}>
              <Text style={{ fontSize: 16 }}>{nextTool.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upNextPreText}>UP NEXT</Text>
              <Text style={styles.upNextTitleText}>{nextTool.label}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

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
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#111827' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Select Chapter ({activeSubject.code})
              </Text>
              <TouchableOpacity onPress={() => setShowChapterModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
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
                    <Text
                      style={[
                        styles.modalChapterText,
                        isCur && styles.modalChapterTextActive,
                        { color: isDark ? '#f8fafc' : '#0f172a' },
                      ]}
                    >
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
  topBar: {
    paddingTop: Platform.OS === 'android' ? 45 : 30,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  courseHeaderRow: {
    marginBottom: Spacing.two,
  },
  courseCodeBadge: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chapterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '800',
    maxWidth: '90%',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  levelLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  levelPills: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  levelPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  levelPillActive: {
    backgroundColor: '#22c55e',
  },
  levelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  levelTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ribbonContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingVertical: 8,
  },
  ribbonScroll: {
    paddingHorizontal: Spacing.four,
    gap: 8,
  },
  toolTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  toolTabActive: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b33',
  },
  toolIcon: {
    fontSize: 14,
  },
  toolLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  toolLabelActive: {
    color: '#22c55e',
    fontWeight: '700',
  },
  toolBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  toolBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  workspace: {
    flex: 1,
  },
  workspaceContent: {
    padding: Spacing.four,
  },
  activeToolCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#064e3b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  toolSubheading: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: Spacing.three,
  },
  toolContentPreview: {
    gap: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  previewDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
  },
  featureHighlights: {
    marginTop: 10,
    gap: 8,
    backgroundColor: '#064e3b11',
    padding: Spacing.three,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  floatingUpNextContainer: {
    position: 'absolute',
    bottom: 12,
    left: Spacing.four,
    right: Spacing.four,
  },
  floatingUpNextBtn: {
    backgroundColor: '#16a34a',
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  upNextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upNextPreText: {
    color: '#dcfce7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upNextTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
    borderBottomColor: '#1e293b',
    gap: 12,
  },
  modalChapterRowActive: {
    backgroundColor: '#22c55e11',
  },
  modalNumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNumBadgeActive: {
    backgroundColor: '#22c55e',
  },
  modalNumText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalNumTextActive: {
    color: '#ffffff',
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
