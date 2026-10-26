import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchKeyTakeaways } from '@/services/contentService';
import MarkdownReader from '@/components/study/MarkdownReader';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

interface StudyGuideItem {
  id: string;
  num: string;
  title: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST: StudyGuideItem[] = [
  { id: 'sec_1', num: '01', title: 'Three primary gut regions', checked: true },
  { id: 'sec_2', num: '02', title: 'Histological wall layers', checked: true },
  { id: 'sec_3', num: '03', title: 'Digestive secretions', checked: false },
  { id: 'sec_4', num: '04', title: 'Key physiological formulas', checked: false },
];

function extractChecklistFromMarkdown(md: string): StudyGuideItem[] {
  const items: StudyGuideItem[] = [];
  const lines = md.split('\n');
  let num = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      (trimmed.startsWith('## ') || trimmed.startsWith('### ')) &&
      !trimmed.toLowerCase().includes('scope') &&
      !trimmed.toLowerCase().includes('introduction')
    ) {
      num++;
      const title = trimmed.replace(/^#+\s*(\d+[\.\)]*)?\s*/, '').replace(/[\*\_]/g, '').trim();
      const numFormatted = num < 10 ? `0${num}` : `${num}`;
      items.push({
        id: `sec_${num}`,
        num: numFormatted,
        title: title.length > 35 ? title.slice(0, 32) + '...' : title,
        checked: num <= 2,
      });
      if (items.length >= 5) break;
    }
  }
  return items.length > 0 ? items : DEFAULT_CHECKLIST;
}

interface KeyTakeawaysViewProps {
  subjectId?: string;
  chapterNumber?: number;
  chapterName?: string;
  subjectName?: string;
}

export default function KeyTakeawaysView({
  subjectId = 'entomology',
  chapterNumber = 1,
  chapterName = 'Insect Digestive System',
  subjectName = 'Entomology',
}: KeyTakeawaysViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [checklist, setChecklist] = useState<StudyGuideItem[]>(DEFAULT_CHECKLIST);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchKeyTakeaways(subjectId, chapterNumber, controller.signal)
      .then((text) => {
        if (isMounted) {
          if (text && text.trim().length > 50) {
            setMarkdownText(text);
            const dynamicChecklist = extractChecklistFromMarkdown(text);
            setChecklist(dynamicChecklist);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[KeyTakeawaysView] Error fetching key takeaways:', err);
        }
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        headerSurface: '#1E2B24',
        headerDivider: '#3D5449',
        logoBoxBg: '#273a31',
        brandName: '#f2f7f3',
        breadcrumb: '#b5c9be',
        breadcrumbTitle: '#b5c9be',
        pageTitle: '#f2f7f3',
        topicTitle: '#8dc9a2',
        intro: '#b5c9be',
        timeBadgeBg: '#29483a',
        timeBadgeText: '#8dc9a2',
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        statNumber: '#8dc9a2',
        statLabel: '#f2f7f3',
        studyGuideHeading: '#8dc9a2',
        sectionNumBg: '#29483a',
        sectionNumText: '#8dc9a2',
        sectionLinkTitle: '#f2f7f3',
        separator: '#3D5449',
        checklistLabel: '#b5c9be',
        badge01Bg: '#BE7E57',
        badge01Text: '#ffffff',
        badge02Bg: '#3B2A20',
        badge02Text: '#E09A70',
        subSectionTag: '#E09A70',
        regionCardBg: '#1E2B24',
        regionCardBorder: '#3D5449',
        regionCardActiveBorder: '#BE7E57',
        regionLabel: '#E09A70',
        regionName: '#f2f7f3',
        regionNote: '#b5c9be',
        layerIndex: '#E09A70',
        layerName: '#f2f7f3',
        layerFunction: '#b5c9be',
        routeBannerBg: '#3B2A20',
        routeTitle: '#E09A70',
        routeText: '#f2f7f3',
      }
    : {
        screenBg: '#FFF6F1',
        headerSurface: '#ffffff',
        headerDivider: '#E5DDD8',
        logoBoxBg: 'rgba(190, 126, 87, 0.15)',
        brandName: '#24382f',
        breadcrumb: '#6d8277',
        breadcrumbTitle: '#6d8277',
        pageTitle: '#24382f',
        topicTitle: '#BE7E57',
        intro: '#6d8277',
        timeBadgeBg: '#FAF1EB',
        timeBadgeText: '#8C4F2B',
        cardBg: '#ffffff',
        cardBorder: '#E8D0C3',
        statNumber: '#BE7E57',
        statLabel: '#24382f',
        studyGuideHeading: '#8C4F2B',
        sectionNumBg: '#FAF1EB',
        sectionNumText: '#8C4F2B',
        sectionLinkTitle: '#24382f',
        separator: '#E8D0C3',
        checklistLabel: '#6d8277',
        badge01Bg: '#BE7E57',
        badge01Text: '#ffffff',
        badge02Bg: '#FAF1EB',
        badge02Text: '#8C4F2B',
        subSectionTag: '#8C4F2B',
        regionCardBg: '#FAF1EB',
        regionCardBorder: '#E8D0C3',
        regionCardActiveBorder: '#BE7E57',
        regionLabel: '#8C4F2B',
        regionName: '#24382f',
        regionNote: '#6d8277',
        layerIndex: '#8C4F2B',
        layerName: '#24382f',
        layerFunction: '#6d8277',
        routeBannerBg: '#FAF1EB',
        routeTitle: '#8C4F2B',
        routeText: '#24382f',
      };

  const completedCount = checklist.filter((item) => item.checked).length;

  const toggleChecklistItem = (id: string) => {
    Haptics.selectionAsync();
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb Path & Title Block */}
        <View style={styles.titleSection}>
          <Text style={[styles.breadcrumbTitle, { color: colors.breadcrumbTitle }]}>
            {subjectName} / Chapter {chapterNumber}
          </Text>

          <View style={styles.pageTitleRow}>
            <Text style={[styles.pageTitle, { color: colors.pageTitle }]}>Key Takeaways</Text>
            <View style={[styles.timeBadge, { backgroundColor: colors.timeBadgeBg }]}>
              <Text style={[styles.timeBadgeText, { color: colors.timeBadgeText }]}>5 MIN</Text>
            </View>
          </View>

          <Text style={[styles.topicTitle, { color: colors.topicTitle }]}>{chapterName}</Text>
          <Text style={[styles.intro, { color: colors.intro }]}>
            A focused 5-minute revision sheet.
          </Text>
        </View>

        {/* 3 Quick Stat Cards in Row */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.statNumber }]}>03</Text>
            <Text style={[styles.statLabel, { color: colors.statLabel }]}>Gut regions</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.statNumber }]}>02</Text>
            <Text style={[styles.statLabel, { color: colors.statLabel }]}>Origins</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.statNumber, { color: colors.statNumber }]}>05</Text>
            <Text style={[styles.statLabel, { color: colors.statLabel }]}>Min review</Text>
          </View>
        </View>

        {/* Study Guide & Revision Checklist Card */}
        <View
          style={[
            styles.studyGuideCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.studyGuideHeading, { color: colors.studyGuideHeading }]}>
            STUDY GUIDE
          </Text>

          <View style={styles.studyGuideList}>
            {checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.studyGuideRow}
                onPress={() => toggleChecklistItem(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.sectionNumBadge,
                    {
                      backgroundColor: item.checked ? colors.topicTitle : colors.sectionNumBg,
                    },
                  ]}
                >
                  {item.checked ? (
                    <Ionicons name="checkmark" size={13} color="#ffffff" />
                  ) : (
                    <Text style={[styles.sectionNumText, { color: colors.sectionNumText }]}>
                      {item.num}
                    </Text>
                  )}
                </View>

                <Text
                  style={[
                    styles.sectionLinkTitle,
                    {
                      color: colors.sectionLinkTitle,
                      textDecorationLine: item.checked ? 'line-through' : 'none',
                      opacity: item.checked ? 0.75 : 1,
                    },
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.separatorLine, { backgroundColor: colors.separator }]} />

          <Text style={[styles.revisionChecklistLabel, { color: colors.checklistLabel }]}>
            REVISION CHECKLIST · {completedCount}/{checklist.length}
          </Text>
        </View>

        {/* Dynamic Markdown Content Card */}
        {markdownText ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
                padding: 16,
              },
            ]}
          >
            <MarkdownReader
              content={markdownText}
              title={chapterName}
              chapterNumber={chapterNumber}
            />
          </View>
        ) : chapterNumber === 1 ? (
          <>
            {/* Section 01: Three primary gut regions Card */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionBadgeBig, { backgroundColor: colors.badge01Bg }]}>
                  <Text style={[styles.sectionBadgeBigText, { color: colors.badge01Text }]}>01</Text>
                </View>
                <Text style={[styles.sectionHeadingTitle, { color: colors.brandName }]}>
                  Three primary gut regions
                </Text>
              </View>

              <Text style={[styles.subSectionTag, { color: colors.subSectionTag }]}>
                TRIPARTITE DIVISION
              </Text>
              <Text style={[styles.sectionIntro, { color: colors.intro }]}>
                The alimentary canal has three distinct regions:
              </Text>

              {/* 3 Sub-regions Row */}
              <View style={styles.regionsRow}>
                {/* Foregut */}
                <TouchableOpacity
                  style={[
                    styles.regionCard,
                    {
                      backgroundColor: colors.regionCardBg,
                      borderColor:
                        activeRegion === 'foregut'
                          ? colors.regionCardActiveBorder
                          : colors.regionCardBorder,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveRegion(activeRegion === 'foregut' ? null : 'foregut');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.regionLabel, { color: colors.regionLabel }]}>FOREGUT</Text>
                  <Text style={[styles.regionName, { color: colors.regionName }]}>Stomodaeum</Text>
                  <Text style={[styles.regionNote, { color: colors.regionNote }]}>
                    Ectoderm · cuticular intima
                  </Text>
                </TouchableOpacity>

                {/* Midgut */}
                <TouchableOpacity
                  style={[
                    styles.regionCard,
                    {
                      backgroundColor: colors.regionCardBg,
                      borderColor:
                        activeRegion === 'midgut'
                          ? colors.regionCardActiveBorder
                          : colors.regionCardBorder,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveRegion(activeRegion === 'midgut' ? null : 'midgut');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.regionLabel, { color: colors.regionLabel }]}>MIDGUT</Text>
                  <Text style={[styles.regionName, { color: colors.regionName }]}>Mesenteron</Text>
                  <Text style={[styles.regionNote, { color: colors.regionNote }]}>
                    Endoderm · no intima
                  </Text>
                </TouchableOpacity>

                {/* Hindgut */}
                <TouchableOpacity
                  style={[
                    styles.regionCard,
                    {
                      backgroundColor: colors.regionCardBg,
                      borderColor:
                        activeRegion === 'hindgut'
                          ? colors.regionCardActiveBorder
                          : colors.regionCardBorder,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveRegion(activeRegion === 'hindgut' ? null : 'hindgut');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.regionLabel, { color: colors.regionLabel }]}>HINDGUT</Text>
                  <Text style={[styles.regionName, { color: colors.regionName }]}>Proctodaeum</Text>
                  <Text style={[styles.regionNote, { color: colors.regionNote }]}>
                    Ectoderm · cuticular intima
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 02: Histological wall layers Card */}
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionBadgeBig, { backgroundColor: colors.badge02Bg }]}>
                  <Text style={[styles.sectionBadgeBigText, { color: colors.badge02Text }]}>02</Text>
                </View>
                <Text style={[styles.sectionHeadingTitle, { color: colors.brandName }]}>
                  Histological wall layers
                </Text>
              </View>

              <Text style={[styles.subSectionTag, { color: colors.subSectionTag }]}>LUMEN OUTWARD</Text>

              {/* 4 Layers Table */}
              <View style={styles.layersTable}>
                <View style={styles.layerRow}>
                  <Text style={[styles.layerIndex, { color: colors.layerIndex }]}>01</Text>
                  <Text style={[styles.layerName, { color: colors.layerName }]}>Peritrophic matrix</Text>
                  <Text style={[styles.layerFunction, { color: colors.layerFunction }]}>
                    Protective lining
                  </Text>
                </View>

                <View style={styles.layerRow}>
                  <Text style={[styles.layerIndex, { color: colors.layerIndex }]}>02</Text>
                  <Text style={[styles.layerName, { color: colors.layerName }]}>Epithelium</Text>
                  <Text style={[styles.layerFunction, { color: colors.layerFunction }]}>
                    Secretion & absorption
                  </Text>
                </View>

                <View style={styles.layerRow}>
                  <Text style={[styles.layerIndex, { color: colors.layerIndex }]}>03</Text>
                  <Text style={[styles.layerName, { color: colors.layerName }]}>Basement membrane</Text>
                  <Text style={[styles.layerFunction, { color: colors.layerFunction }]}>
                    Structural support
                  </Text>
                </View>

                <View style={styles.layerRow}>
                  <Text style={[styles.layerIndex, { color: colors.layerIndex }]}>04</Text>
                  <Text style={[styles.layerName, { color: colors.layerName }]}>Muscle layers</Text>
                  <Text style={[styles.layerFunction, { color: colors.layerFunction }]}>
                    Mixing & peristalsis
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, padding: 24, alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={{ marginTop: 12, color: colors.intro }}>Loading key takeaways...</Text>
          </View>
        )}

        {/* 5-Min Revision Route Banner */}
        <View style={[styles.revisionRouteBanner, { backgroundColor: colors.routeBannerBg }]}>
          <Text style={[styles.revisionRouteTitle, { color: colors.routeTitle }]}>
            5-MIN REVISION ROUTE
          </Text>
          <Text style={[styles.revisionRouteText, { color: colors.routeText }]}>
            1  Review regions     ·     2  Compare wall layers
          </Text>
          <Text style={[styles.revisionRouteText2, { color: colors.routeText }]}>
            3  Test key functions
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSurface: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 22,
    height: 28,
  },
  brandTitleWrap: {
    flexDirection: 'column',
    gap: 2,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
  },
  breadcrumb: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  tabletContainer: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  titleSection: {
    marginBottom: 16,
  },
  breadcrumbTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
  },
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
  },
  timeBadge: {
    width: 70,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  intro: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  studyGuideCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  studyGuideHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  studyGuideList: {
    flexDirection: 'column',
    gap: 10,
  },
  studyGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  sectionLinkTitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  separatorLine: {
    height: 1,
    marginVertical: 12,
  },
  revisionChecklistLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionBadgeBig: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeBigText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  sectionHeadingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  subSectionTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionIntro: {
    fontSize: 10.5,
    fontWeight: '500',
    marginBottom: 12,
  },
  regionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionCard: {
    flex: 1,
    height: 76,
    borderRadius: 9,
    borderWidth: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  regionLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  regionName: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  regionNote: {
    fontSize: 8,
    fontWeight: '500',
    lineHeight: 11,
  },
  layersTable: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  layerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerIndex: {
    width: 24,
    fontSize: 9.5,
    fontWeight: '700',
  },
  layerName: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: '600',
  },
  layerFunction: {
    fontSize: 8.5,
    fontWeight: '500',
    textAlign: 'right',
  },
  revisionRouteBanner: {
    borderRadius: 13,
    padding: 14,
    flexDirection: 'column',
    gap: 4,
    marginBottom: 20,
  },
  revisionRouteTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revisionRouteText: {
    fontSize: 10,
    fontWeight: '500',
  },
  revisionRouteText2: {
    fontSize: 10,
    fontWeight: '500',
  },
});
