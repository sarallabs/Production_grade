import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { ANGRAU_SUBJECTS } from '@/api/manifestService';
import TopNavBar, { NavSegment } from '@/components/navigation/TopNavBar';
import AskBotView from '@/components/study/AskBotView';
import { BorderRadius, Spacing } from '@/constants/theme';

const RESOURCE_SEGMENTS: NavSegment[] = [
  { id: 'ask_ai', label: 'Ask AI', vectorIcon: 'sparkles-outline' },
  { id: 'syllabus', label: 'Syllabus', vectorIcon: 'document-text-outline' },
  { id: 'downloads', label: 'Downloads', vectorIcon: 'cloud-download-outline' },
];

const DOWNLOADABLE_RESOURCES = [
  {
    id: 'res_1',
    title: 'ANGRAU Entomology Practical Manual (2024)',
    type: 'PDF Guide',
    size: '14.2 MB',
    icon: 'document-text',
    desc: 'Official laboratory manual covering dissection of insect digestive and nervous systems.',
  },
  {
    id: 'res_2',
    title: 'Insect Mouthparts & Digestive System Color Atlas',
    type: 'Diagram Atlas',
    size: '8.7 MB',
    icon: 'images',
    desc: 'High-resolution histological sections and anatomical diagrams for lab exam viva.',
  },
  {
    id: 'res_3',
    title: 'ENTO 131 Complete High-Yield Formula & Taxa Sheet',
    type: 'Summary Cheatsheet',
    size: '2.1 MB',
    icon: 'bookmarks',
    desc: 'Printable revision sheet containing scientific names, orders, and economic significance.',
  },
  {
    id: 'res_4',
    title: 'ANGRAU Semester III Model Question Bank & Keys',
    type: 'Official Key',
    size: '5.4 MB',
    icon: 'folder-open',
    desc: 'Faculty curated answer keys for 2-mark definitions and 5-mark short questions.',
  },
];

export default function ResourcesScreen() {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const activeSubject = ANGRAU_SUBJECTS[0];

  const [activeSegment, setActiveSegment] = useState<string>('ask_ai');
  const [downloadedIds, setDownloadedIds] = useState<string[]>(['res_3']);

  const handleDownload = (id: string, title: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (downloadedIds.includes(id)) {
      Alert.alert('Resource Ready', `${title} is already available offline in local storage.`);
    } else {
      setDownloadedIds((prev) => [...prev, id]);
      Alert.alert('Download Complete', `${title} cached successfully for offline access.`);
    }
  };

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
        segments={RESOURCE_SEGMENTS}
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        title="Resources"
      />

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {activeSegment === 'ask_ai' ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, isTablet && { alignItems: 'center' }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.toolCardWrap, isTablet && { width: '100%', maxWidth: 860, alignSelf: 'center' }]}>
              <AskBotView
                chapterNumber={1}
                chapterName="Insect Anatomy & ANGRAU Syllabus"
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : activeSegment === 'syllabus' ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, isTablet && { alignItems: 'center' }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.toolCardWrap, isTablet && { width: '100%', maxWidth: 860, alignSelf: 'center' }]}>
              {/* Course Overview Card */}
              <View style={[styles.overviewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.courseHeader}>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{activeSubject.code}</Text>
                  </View>
                  <Text style={styles.creditsText}>{activeSubject.credits} Credits (Theory + Practical)</Text>
                </View>
                <Text style={[styles.courseTitle, { color: textColor }]}>
                  {activeSubject.name} - Official Syllabus
                </Text>
                <Text style={[styles.courseUni, { color: subtextColor }]}>
                  {activeSubject.university} • {activeSubject.semester}
                </Text>
              </View>

              {/* Chapters Syllabus Breakdown */}
              <Text style={[styles.sectionHeading, { color: textColor }]}>Course Units & Theory Schedule</Text>
              {activeSubject.chapters.map((ch) => (
                <View
                  key={ch.number}
                  style={[styles.chapterCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <View style={styles.chHeaderRow}>
                    <View style={styles.chNum}>
                      <Text style={styles.chNumText}>UNIT {ch.number}</Text>
                    </View>
                    <Text style={[styles.chName, { color: textColor }]}>{ch.name}</Text>
                  </View>
                  <Text style={[styles.chDesc, { color: subtextColor }]}>{ch.description}</Text>
                  <View style={styles.chMetaRow}>
                    <View style={[styles.chMetaTag, { backgroundColor: tagBg }]}>
                      <Ionicons name="document-text-outline" size={13} color="#22c55e" />
                      <Text style={[styles.chMetaText, { color: subtextColor }]}>Lecture Notes</Text>
                    </View>
                    <View style={[styles.chMetaTag, { backgroundColor: tagBg }]}>
                      <Ionicons name="videocam-outline" size={13} color="#3b82f6" />
                      <Text style={[styles.chMetaText, { color: subtextColor }]}>Video Demonstrations</Text>
                    </View>
                    <View style={[styles.chMetaTag, { backgroundColor: tagBg }]}>
                      <Ionicons name="school-outline" size={13} color="#f59e0b" />
                      <Text style={[styles.chMetaText, { color: subtextColor }]}>University PYQs</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : activeSegment === 'downloads' ? (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, isTablet && { alignItems: 'center' }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.toolCardWrap, isTablet && { width: '100%', maxWidth: 860, alignSelf: 'center' }]}>
              <View style={[styles.downloadsHeader, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="cloud-download" size={28} color="#22c55e" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.downloadsTitle, { color: textColor }]}>Offline Study Materials</Text>
                  <Text style={[styles.downloadsSub, { color: subtextColor }]}>
                    Download manuals and revision sheets for offline study during agricultural field postings.
                  </Text>
                </View>
              </View>

              {DOWNLOADABLE_RESOURCES.map((item) => {
                const isDownloaded = downloadedIds.includes(item.id);
                return (
                  <View
                    key={item.id}
                    style={[styles.downloadItemCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                  >
                    <View style={[styles.docIconWrap, { backgroundColor: isDownloaded ? '#22c55e22' : tagBg }]}>
                      <Ionicons
                        name={item.icon as any}
                        size={22}
                        color={isDownloaded ? '#22c55e' : '#8A9E92'}
                      />
                    </View>

                    <View style={{ flex: 1, marginHorizontal: 12 }}>
                      <Text style={[styles.docTitle, { color: textColor }]}>{item.title}</Text>
                      <Text style={[styles.docDesc, { color: subtextColor }]}>{item.desc}</Text>
                      <View style={styles.docMeta}>
                        <Text style={[styles.docType, { color: '#22c55e' }]}>{item.type}</Text>
                        <Text style={[styles.docDot, { color: subtextColor }]}>•</Text>
                        <Text style={[styles.docSize, { color: subtextColor }]}>{item.size}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.downloadBtn,
                        isDownloaded && styles.downloadBtnSaved,
                      ]}
                      onPress={() => handleDownload(item.id, item.title)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isDownloaded ? 'checkmark-circle' : 'arrow-down-circle'}
                        size={18}
                        color={isDownloaded ? '#22c55e' : '#FFFFFF'}
                      />
                      <Text style={[styles.downloadBtnText, isDownloaded && styles.downloadBtnTextSaved]}>
                        {isDownloaded ? 'Saved' : 'Get'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  toolCardWrap: {
    width: '100%',
  },
  overviewCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  codeBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
  },
  creditsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  courseUni: {
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  chapterCard: {
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  chHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  chNum: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  chNumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  chName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  chDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  chMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chMetaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  chMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 16,
  },
  downloadsTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  downloadsSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  downloadItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  docDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docType: {
    fontSize: 11,
    fontWeight: '700',
  },
  docDot: {
    fontSize: 11,
  },
  docSize: {
    fontSize: 11,
    fontWeight: '600',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  downloadBtnSaved: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtnTextSaved: {
    color: '#22c55e',
  },
});
