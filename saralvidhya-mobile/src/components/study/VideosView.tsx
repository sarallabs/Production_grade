import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

// Thumbnail Assets
const THUMB_01 = require('@/assets/images/video_thumb_01.png');
const THUMB_02 = require('@/assets/images/video_thumb_02.png');
const THUMB_03 = require('@/assets/images/video_thumb_03.png');
const THUMB_04 = require('@/assets/images/video_thumb_04.png');
const THUMB_HERO = require('@/assets/images/video_lecture_thumbnail.png');

interface VideoTopicItem {
  number: string;
  title: string;
  subtitle: string;
}

interface VideoLessonItem {
  id: string;
  lessonNumber: string;
  title: string;
  topic: string;
  duration: string;
  status: string;
  progressPct: number;
  filterStatus: 'in_progress' | 'completed' | 'not_started';
  thumbSource: any;
  ytId: string;
  topicsWhatYouLearn: VideoTopicItem[];
}

const VIDEO_LESSONS_DATA: VideoLessonItem[] = [
  {
    id: 'lesson_01',
    lessonNumber: 'LESSON 01',
    title: 'Insects Digestive System',
    topic: 'Foregut, midgut & hindgut',
    duration: '10:55',
    status: '60% · Resume',
    progressPct: 60,
    filterStatus: 'in_progress',
    thumbSource: THUMB_01,
    ytId: 'Ioa25iYy53g',
    topicsWhatYouLearn: [
      {
        number: '01',
        title: 'Anatomy of the Insect Alimentary Canal',
        subtitle: 'Foregut, midgut & hindgut',
      },
      {
        number: '02',
        title: 'Stomodaeal Specializations',
        subtitle: 'Pharynx, crop & proventriculus',
      },
      {
        number: '03',
        title: 'Mesenteron Physiology',
        subtitle: 'Secretory epithelium & peritrophic membrane',
      },
    ],
  },
  {
    id: 'lesson_02',
    lessonNumber: 'LESSON 02',
    title: 'External Morphology',
    topic: 'Head, thorax & abdomen',
    duration: '12:40',
    status: 'Completed · Watch again',
    progressPct: 100,
    filterStatus: 'completed',
    thumbSource: THUMB_02,
    ytId: 'UMJFfCFFF4M',
    topicsWhatYouLearn: [
      {
        number: '01',
        title: 'Tagmosis & Body Segmentation',
        subtitle: 'Head, thorax & abdomen sclerites',
      },
      {
        number: '02',
        title: 'Sensory Structures & Appendages',
        subtitle: 'Antennae, compound eyes & ocelli',
      },
      {
        number: '03',
        title: 'Locomotory Systems',
        subtitle: 'Leg modifications & wing venation',
      },
    ],
  },
  {
    id: 'lesson_03',
    lessonNumber: 'LESSON 03',
    title: 'Insect Metamorphosis',
    topic: 'From egg to adult',
    duration: '08:25',
    status: 'Not started',
    progressPct: 0,
    filterStatus: 'not_started',
    thumbSource: THUMB_03,
    ytId: 'elWWuKv5b9Q',
    topicsWhatYouLearn: [
      {
        number: '01',
        title: 'Ametabolous & Hemimetabolous Development',
        subtitle: 'Simple versus incomplete metamorphosis',
      },
      {
        number: '02',
        title: 'Holometabolous Life Cycles',
        subtitle: 'Larval, pupal & imaginal stages',
      },
      {
        number: '03',
        title: 'Hormonal Control of Ecdysis',
        subtitle: 'Ecdysone & Juvenile Hormone pathways',
      },
    ],
  },
  {
    id: 'lesson_04',
    lessonNumber: 'LESSON 04',
    title: 'Insect Mouthparts',
    topic: 'Biting, chewing & sucking',
    duration: '09:30',
    status: 'Not started',
    progressPct: 0,
    filterStatus: 'not_started',
    thumbSource: THUMB_04,
    ytId: 'Ioa25iYy53g',
    topicsWhatYouLearn: [
      {
        number: '01',
        title: 'Mandibulate (Chewing) Apparatus',
        subtitle: 'Labrum, mandibles, maxillae & labium',
      },
      {
        number: '02',
        title: 'Haustellate (Piercing-Sucking) Types',
        subtitle: 'Stylet fascicle & salivary pumps in Hemiptera',
      },
      {
        number: '03',
        title: 'Siphoning & Sponging Adaptations',
        subtitle: 'Proboscis galeae & labellar pseudotracheae',
      },
    ],
  },
];

type FilterType = 'all' | 'in_progress' | 'completed';

interface VideosViewProps {
  subjectId?: string;
  subjectName?: string;
  chapterNumber?: number;
  chapterName?: string;
  onContinueLearning?: () => void;
}

export default function VideosView({
  subjectName = 'ENTOMOLOGY',
  chapterNumber = 1,
  onContinueLearning,
}: VideosViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  // Mode: null = Multi-Video Library List; string = Single Lesson Player/Details
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Selected Lesson Item (defaults to Lesson 01)
  const currentLesson =
    VIDEO_LESSONS_DATA.find((l) => l.id === selectedLessonId) || VIDEO_LESSONS_DATA[0];

  // Filtering for library list
  const filteredLessons = VIDEO_LESSONS_DATA.filter((lesson) => {
    if (filter === 'all') return true;
    return lesson.filterStatus === filter;
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    Haptics.selectionAsync();
    setSelectedLessonId(lessonId);
    setIsPlayingVideo(false);
  };

  const handleBackToLibrary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLessonId(null);
    setIsPlayingVideo(false);
  };

  // Color Tokens from Figma DevMode
  // Background: #f1f6f2
  // Brand color: #265945
  // Card bg: #fefefe / #ffffff
  // Active card border: #8dae9b, Inactive card border: #e0e3d9
  // Text dark: #1a2924, Text muted: #596b66
  // Progress fill: #4f7b64, Progress track: #dce7de
  const bg = isDark ? '#121E17' : '#F1F6F2';
  const cardBg = isDark ? '#1C2B23' : '#FEFEFE';
  const cardBorder = isDark ? '#2D4538' : '#E0E3D9';
  const activeCardBorder = isDark ? '#4ADE80' : '#8DAE9B';
  const brandGreen = isDark ? '#4ADE80' : '#265945';
  const textDark = isDark ? '#FFFFFF' : '#1A2924';
  const textMuted = isDark ? '#A6C5B3' : '#596B66';
  const progressBg = isDark ? '#263B30' : '#DCE7DE';
  const progressFill = isDark ? '#4ADE80' : '#4F7B64';
  const iconTileBg = isDark ? 'rgba(38, 89, 69, 0.25)' : '#E8F0E8';

  const playerHeight = Math.round((containerWidth * 9) / 16) || 206;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* VIEW 1: MULTI-VIDEO LESSONS LIBRARY (EntomologyVideoLessonsMobile)        */}
        {/* ========================================================================= */}
        {selectedLessonId === null ? (
          <>
            {/* 1. PAGE TITLE */}
            <View style={styles.introduction}>
              <Text style={[styles.pageTitle, { color: textDark }]}>
                Video Lessons
              </Text>
            </View>

            {/* 3. LEARNING PROGRESS CARD (.learningProgress) */}
            <View style={[styles.learningProgress, { backgroundColor: isDark ? '#1C2B23' : '#E8F0E8' }]}>
              <View style={styles.progressSummary}>
                <Text style={[styles.completionCount, { color: brandGreen }]}>
                  1 of 4 lessons completed
                </Text>
                <Text style={[styles.progressPctText, { color: brandGreen }]}>40%</Text>
              </View>
              <View style={[styles.courseProgressTrack, { backgroundColor: progressBg }]}>
                <View style={[styles.courseProgressFill, { backgroundColor: progressFill, width: '40%' }]} />
              </View>
            </View>

            {/* 4. LESSON FILTERS (.lessonFilters) */}
            <View style={styles.lessonFilters}>
              {/* All videos */}
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'all'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('all');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: filter === 'all' ? '#FFFFFF' : textMuted, fontWeight: filter === 'all' ? '600' : '500' },
                  ]}
                >
                  All videos (4)
                </Text>
              </TouchableOpacity>

              {/* In progress */}
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'in_progress'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('in_progress');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: filter === 'in_progress' ? '#FFFFFF' : textMuted,
                      fontWeight: filter === 'in_progress' ? '600' : '500',
                    },
                  ]}
                >
                  In progress (1)
                </Text>
              </TouchableOpacity>

              {/* Completed */}
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filter === 'completed'
                    ? { backgroundColor: '#265945', borderColor: '#265945' }
                    : { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter('completed');
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: filter === 'completed' ? '#FFFFFF' : textMuted,
                      fontWeight: filter === 'completed' ? '600' : '500',
                    },
                  ]}
                >
                  Completed (1)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5. LESSON LIST HEADING (.lessonListHeading) */}
            <View style={styles.lessonListHeading}>
              <Text style={[styles.listHeadingText, { color: brandGreen }]}>YOUR VIDEO LESSONS</Text>
              <Text style={[styles.totalDuration, { color: textMuted }]}>4 videos · 41 min</Text>
            </View>

            {/* 6. VIDEO LESSONS LIST (.videoLessons) */}
            <View style={styles.videoLessonsList}>
              {filteredLessons.map((item) => {
                const isInProgress = item.filterStatus === 'in_progress';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.videoLessonCard,
                      {
                        backgroundColor: cardBg,
                        borderColor: isInProgress ? activeCardBorder : cardBorder,
                      },
                    ]}
                    onPress={() => handleSelectLesson(item.id)}
                    activeOpacity={0.88}
                  >
                    {/* Thumbnail (.videoThumbnail) */}
                    <View style={styles.videoThumbnail}>
                      <Image source={item.thumbSource} style={styles.lessonImageIcon} resizeMode="cover" />
                      <View style={styles.playLessonBtn}>
                        <Ionicons name="play" size={11} color="#265945" style={{ marginLeft: 2 }} />
                      </View>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationBadgeText}>{item.duration}</Text>
                      </View>
                    </View>

                    {/* Lesson Details (.lessonDetails) */}
                    <View style={styles.lessonDetails}>
                      <Text style={[styles.lessonNumber, { color: textMuted }]}>
                        {item.lessonNumber}
                      </Text>
                      <Text style={[styles.lessonTitleText, { color: textDark }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.lessonTopicText, { color: textMuted }]} numberOfLines={1}>
                        {item.topic}
                      </Text>

                      {/* Watch Progress (.watchProgress) */}
                      <View style={styles.watchProgress}>
                        <Text
                          style={[
                            styles.progressStatusText,
                            {
                              color: item.filterStatus === 'not_started' ? textMuted : brandGreen,
                              fontWeight: item.filterStatus === 'not_started' ? '400' : '600',
                            },
                          ]}
                        >
                          {item.status}
                        </Text>
                        <View style={[styles.progressTrack, { backgroundColor: progressBg }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: progressFill,
                                width: `${item.progressPct}%`,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 7. SAVED PROGRESS NOTE (.savedProgressNote) */}
            <View style={styles.savedProgressNote}>
              <Ionicons name="checkmark-circle-outline" size={14} color={textMuted} />
              <Text style={[styles.savedProgressText, { color: textMuted }]}>
                Your lesson progress is saved automatically.
              </Text>
            </View>
          </>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED SINGLE LESSON PLAYER (EntomologyVideoLessonMobile412918) */
          /* ========================================================================= */
          <>
            {/* 1. SINGLE LESSON HEADER WITH BACK BUTTON */}
            <View style={styles.singleLessonHeaderRow}>
              <TouchableOpacity
                style={[styles.backToLibraryBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={handleBackToLibrary}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color={textDark} />
              </TouchableOpacity>
              <Text style={[styles.singleLessonHeaderTitle, { color: textDark }]} numberOfLines={1}>
                {currentLesson.title}
              </Text>
            </View>

            {/* 2. VIDEO THUMBNAIL / PLAYER CARD (.image103Parent) */}
            <View onLayout={onLayout} style={[styles.heroVideoCard, { borderColor: cardBorder }]}>
              {isPlayingVideo ? (
                /* Live YouTube Player */
                <View style={[styles.playerWrap, { height: playerHeight }]}>
                  {Platform.OS === 'web' ? (
                    React.createElement('iframe', {
                      key: currentLesson.ytId,
                      src: `https://www.youtube.com/embed/${currentLesson.ytId}?autoplay=1&rel=0&modestbranding=1`,
                      width: '100%',
                      height: '100%',
                      style: { border: 0, display: 'block' },
                      allow:
                        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
                      allowFullScreen: true,
                      title: currentLesson.title,
                    })
                  ) : (
                    <YoutubePlayer
                      height={playerHeight}
                      width={containerWidth || 366}
                      videoId={currentLesson.ytId}
                      play={true}
                      initialPlayerParams={{ rel: false, modestbranding: true }}
                    />
                  )}
                </View>
              ) : (
                /* Interactive Lecture Video Poster */
                <TouchableOpacity
                  style={styles.heroPosterTouch}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsPlayingVideo(true);
                  }}
                  activeOpacity={0.92}
                >
                  <Image source={THUMB_HERO} style={styles.heroPosterImage} resizeMode="cover" />
                  <View style={styles.heroPosterOverlay} />
                  <View style={styles.heroPlayCircle}>
                    <Ionicons name="play" size={20} color="#265945" style={{ marginLeft: 3 }} />
                  </View>
                  <View style={styles.heroMinBadge}>
                    <Text style={styles.heroMinText}>{`${currentLesson.duration} min`}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. LESSON TITLE & SUBTITLE */}
            <View style={styles.lessonTitleSection}>
              <Text style={[styles.heroLessonTitle, { color: textDark }]}>{currentLesson.title}</Text>
              <Text style={[styles.heroLessonSubtitle, { color: textMuted }]}>
                Video lecture · Chapter {chapterNumber}
              </Text>

              {/* Meta Pills */}
              <View style={styles.metaPillsRow}>
                <View style={[styles.metaPill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Ionicons name="time-outline" size={13} color={textMuted} />
                  <Text style={[styles.metaPillText, { color: textDark }]}>
                    {`${currentLesson.duration} min`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.metaPill,
                    { backgroundColor: cardBg, borderColor: isSaved ? '#265945' : cardBorder },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setIsSaved((s) => !s);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSaved ? 'star' : 'star-outline'}
                    size={13}
                    color={isSaved ? '#EAB308' : textMuted}
                  />
                  <Text style={[styles.metaPillText, { color: isSaved ? '#265945' : textDark }]}>
                    {isSaved ? 'Saved' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. WHAT YOU'LL LEARN HEADING */}
            <View style={styles.topicsHeadingParent}>
              <Text style={[styles.topicsHeading, { color: brandGreen }]}>WHAT YOU’LL LEARN</Text>
              <Text style={[styles.topicsCount, { color: textMuted }]}>
                {`${currentLesson.topicsWhatYouLearn.length} TOPICS`}
              </Text>
            </View>

            {/* 5. TOPIC CARDS (01, 02, 03) */}
            <View style={styles.topicCardsList}>
              {currentLesson.topicsWhatYouLearn.map((topic) => (
                <View
                  key={topic.number}
                  style={[styles.topicCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={[styles.topicIconTile, { backgroundColor: iconTileBg }]}>
                    <Ionicons name="pencil" size={16} color={brandGreen} />
                  </View>
                  <View style={styles.topicInfoWrap}>
                    <Text style={[styles.topicTitle, { color: textDark }]} numberOfLines={2}>
                      {topic.title}
                    </Text>
                    <Text style={[styles.topicSubtitle, { color: textMuted }]} numberOfLines={2}>
                      {topic.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.topicNumber, { color: brandGreen }]}>{topic.number}</Text>
                </View>
              ))}
            </View>

            {/* 6. CONTINUE LEARNING BUTTON */}
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: '#265945' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsPlayingVideo(true);
                onContinueLearning?.();
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.continueButtonText}>Continue learning  →</Text>
            </TouchableOpacity>

            <Text style={[styles.lessonNote, { color: textMuted }]}>
              Your lesson progress is saved automatically.
            </Text>
          </>
        )}

        <View style={{ height: 60 }} />
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
  /* 1. Brand Header (.brandHeader) */
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
    gap: 10,
  },
  backToLibraryBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleLessonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  singleLessonHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkLetter: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  brandIdentity: {
    flex: 1,
    gap: 2,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  section: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  /* 2. Introduction / Page Title (.introduction, .pageTitle) */
  introduction: {
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  pageTitle: {
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  /* 3. Learning Progress Card (.learningProgress) */
  learningProgress: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 9,
    marginBottom: 14,
  },
  progressSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '700',
  },
  courseProgressTrack: {
    height: 5,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: 5,
    borderRadius: 4,
  },
  /* 4. Lesson Filters (.lessonFilters) */
  lessonFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  filterPillText: {
    fontSize: 11,
  },
  /* 5. Lesson List Heading (.lessonListHeading) */
  lessonListHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeadingText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalDuration: {
    fontSize: 10,
    fontWeight: '500',
  },
  /* 6. Video Lessons List (.videoLessons) */
  videoLessonsList: {
    gap: 10,
    marginBottom: 16,
  },
  videoLessonCard: {
    minHeight: 112,
    borderRadius: 13,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  videoThumbnail: {
    width: 124,
    height: 86,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  lessonImageIcon: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  playLessonBtn: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 4,
    backgroundColor: 'rgba(23, 42, 35, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 2,
  },
  durationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
  },
  lessonDetails: {
    flex: 1,
    gap: 3,
  },
  lessonNumber: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  lessonTitleText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  lessonTopicText: {
    fontSize: 11,
    lineHeight: 14,
  },
  watchProgress: {
    marginTop: 4,
    gap: 4,
  },
  progressStatusText: {
    fontSize: 9.5,
  },
  progressTrack: {
    height: 3,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 3,
  },
  /* 7. Saved Progress Note (.savedProgressNote) */
  savedProgressNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  savedProgressText: {
    fontSize: 11,
  },

  /* ========================================================================= */
  /* DETAIL / PLAYER VIEW STYLES                                               */
  /* ========================================================================= */
  heroVideoCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  playerWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  heroPosterTouch: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPosterImage: {
    width: '100%',
    height: '100%',
  },
  heroPosterOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  heroPlayCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  heroMinBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(7, 7, 7, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroMinText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '600',
  },
  lessonTitleSection: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  heroLessonTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  heroLessonSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 16,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  topicsHeadingParent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  topicsHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topicsCount: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  topicCardsList: {
    gap: 10,
    marginBottom: 20,
  },
  topicCard: {
    minHeight: 88,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  topicIconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfoWrap: {
    flex: 1,
    gap: 3,
  },
  topicTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 18,
  },
  topicSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
  topicNumber: {
    fontSize: 11,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  continueButton: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  lessonNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
});
