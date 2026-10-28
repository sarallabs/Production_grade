import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchMindmap, MindmapData, MindmapNode } from '@/services/contentService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);

  // Fetch real cloud backend mind map data for this chapter
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const controller = new AbortController();

    fetchMindmap(subjectId, chapterNumber, controller.signal)
      .then((data) => {
        if (isMounted) {
          if (data && (data.rootNode.children.length > 0 || data.rootNode.title)) {
            setMindmapData(data);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[MindMap] Fetch failed:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  // Exact color values derived directly from user's design image
  const colors = useMemo(
    () =>
      isDark
        ? {
            screenBg: '#0F1713',
            topAccentLine: '#4A725D',
            backBtnBg: '#19261E',
            backBtnBorder: '#2E4336',
            headerTitle: '#FEFEFE',
            headerSub: '#A6C5B3',
            mainCardBg: '#192820',
            mainCardBorder: '#365344',
            cardTitle: '#FEFEFE',
            cardSub: '#9EB8A9',
            badgeBg: '#111D17',
            badgeBorder: '#2E4537',
            badgeText: '#C8E4D3',
            centerNodeBg: '#1A3326',
            centerNodeBorder: '#294F3B',
            centerNodeTitle: '#FEFEFE',
            centerNodeSub: '#A6C5B3',
            parentNodeBg: '#2D4F3E',
            parentNodeBorder: '#3A6350',
            parentNodeText: '#FFFFFF',
            childNodeBg: '#1C2C22',
            childNodeBorder: '#2D4536',
            childNodeText: '#D2E6DC',
            connectorStroke: '#5A7E6D',
            earIconLight: '#FFFFFF',
            earIconDark: '#87C29F',
            directoryCardBg: '#15221B',
            directoryCardBorder: '#26382D',
          }
        : {
            screenBg: '#FFF8F3',
            topAccentLine: '#4A725D',
            backBtnBg: '#FFFFFF',
            backBtnBorder: '#E2ECE5',
            headerTitle: '#1A2F25',
            headerSub: '#587465',
            mainCardBg: '#FAF4ED',
            mainCardBorder: '#3B5B4C',
            cardTitle: '#1A2F25',
            cardSub: '#658072',
            badgeBg: '#FFFFFF',
            badgeBorder: '#E1ECE5',
            badgeText: '#1A2F25',
            centerNodeBg: '#2A4839',
            centerNodeBorder: '#20382B',
            centerNodeTitle: '#FEFEFE',
            centerNodeSub: '#D6E5DC',
            parentNodeBg: '#4A725D',
            parentNodeBorder: '#3E614F',
            parentNodeText: '#FFFFFF',
            childNodeBg: '#DDECE3',
            childNodeBorder: '#C4DDD0',
            childNodeText: '#1E3529',
            connectorStroke: '#779C8A',
            earIconLight: '#FFFFFF',
            earIconDark: '#3A5B4C',
            directoryCardBg: '#FFFFFF',
            directoryCardBorder: '#E4DDD4',
          },
    [isDark]
  );

  // 100% DB-driven root title and branches
  const branches = mindmapData?.rootNode?.children || [];
  const rootTitle = mindmapData?.rootNode?.title || chapterTitle || `Chapter ${chapterNumber}`;

  // 4 Parent Quadrants directly from Database
  const b0 = branches[0];
  const b0Title = b0?.title || 'Branch 1';
  const b0Children = b0?.children || [];

  const b1 = branches[1];
  const b1Title = b1?.title || 'Branch 2';
  const b1Children = b1?.children || [];

  const b2 = branches[2];
  const b2Title = b2?.title || 'Branch 3';
  const b2Children = b2?.children || [];

  const b3 = branches[3];
  const b3Title = b3?.title || 'Branch 4';
  const b3Children = b3?.children || [];

  // Extra branches beyond 4 (e.g. Chapter 2 has 6 branches)
  const extraBranches = branches.slice(4);

  // Check if child nodes exist in the DB data
  const hasChildNodes =
    b0Children.length > 0 ||
    b1Children.length > 0 ||
    b2Children.length > 0 ||
    b3Children.length > 0;

  const totalBranchesCount = branches.length;
  const totalConceptsCount = branches.reduce(
    (acc, b) => acc + (b.children?.length || 0),
    0
  );

  // Direct navigation to read that exact topic in Study Guide (NO POP-UP)
  const handleNavigateToRead = (topicTitle: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({
      pathname: '/(tabs)/learn',
      params: {
        segment: 'read',
        chapter: chapterNumber.toString(),
        topic: topicTitle,
      },
    });
  };

  // Direct navigation to microcast audio and start playing immediately
  const handleLessonPress = (topicTitle: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push({
      pathname: '/(tabs)/learn',
      params: {
        segment: 'listen',
        mode: 'microcasts',
        chapter: chapterNumber.toString(),
        topic: topicTitle,
        autoPlay: 'true',
      },
    });
  };

  // Layout Dimensions (matching the user's design image)
  const cardWidth = Math.min(SCREEN_WIDTH - 24, isTablet ? 680 : 440);
  const canvasWidth = cardWidth - 28;
  const cx = canvasWidth / 2;

  // Node dimensions
  const colNodeW = Math.floor((canvasWidth - 32) / 2);
  const leftX = 4;
  const rightX = canvasWidth - colNodeW - 4;
  const leftColCenter = leftX + colNodeW / 2;
  const rightColCenter = rightX + colNodeW / 2;

  // Center and Parent Node dimensions
  const centerNodeW = Math.min(160, Math.floor(canvasWidth * 0.46));
  const centerNodeH = 56;
  const parentH = 46;

  // Only display Parent Nodes on the diagram (matching the web site)
  const topParentY = 24;
  const centerNodeY = 110;
  const bottomParentY = 196;
  const canvasHeight = 270;

  // SVG Connector Paths (Exact curved splines from center to 4 parent nodes)
  // 1. Center to Top-Left Parent
  const pathCenterToB0 = `M ${cx - centerNodeW / 2} ${centerNodeY + 16} C ${cx - centerNodeW / 2 - 28} ${centerNodeY + 16}, ${leftColCenter} ${topParentY + parentH + 28}, ${leftColCenter} ${topParentY + parentH}`;

  // 2. Center to Top-Right Parent
  const pathCenterToB1 = `M ${cx + centerNodeW / 2} ${centerNodeY + 16} C ${cx + centerNodeW / 2 + 28} ${centerNodeY + 16}, ${rightColCenter} ${topParentY + parentH + 28}, ${rightColCenter} ${topParentY + parentH}`;

  // 3. Center to Bottom-Left Parent
  const pathCenterToB2 = `M ${cx - centerNodeW / 2} ${centerNodeY + centerNodeH - 16} C ${cx - centerNodeW / 2 - 28} ${centerNodeY + centerNodeH - 16}, ${leftColCenter} ${bottomParentY - 28}, ${leftColCenter} ${bottomParentY}`;

  // 4. Center to Bottom-Right Parent
  const pathCenterToB3 = `M ${cx + centerNodeW / 2} ${centerNodeY + centerNodeH - 16} C ${cx + centerNodeW / 2 + 28} ${centerNodeY + centerNodeH - 16}, ${rightColCenter} ${bottomParentY - 28}, ${rightColCenter} ${bottomParentY}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg }]}>
      {/* Top Accent Line */}
      <View style={[styles.topAccentLine, { backgroundColor: colors.topAccentLine }]} />

      {/* TOP HEADER (if shown) */}
      {showTopHeader && (
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: colors.backBtnBg, borderColor: colors.backBtnBorder },
            ]}
            onPress={() => {
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
            <Text style={[styles.headerTitleText, { color: colors.headerTitle }]}>
              Mind Map
            </Text>
            <Text style={[styles.headerSubText, { color: colors.headerSub }]} numberOfLines={1}>
              {chapterTitle}
            </Text>
          </View>

          <View style={styles.headerPlaceholder} />
        </View>
      )}

      {/* MAIN SCROLLABLE DIAGRAM CONTAINER */}
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
          {/* Card Header: Title */}
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitleText, { color: colors.cardTitle }]}>
              {rootTitle}
            </Text>
            {isLoading && (
              <ActivityIndicator size="small" color={colors.connectorStroke} />
            )}
          </View>

          {/* Loading View while fetching from DB */}
          {isLoading && !mindmapData ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.parentNodeBg} />
              <Text style={[styles.loadingText, { color: colors.cardSub }]}>
                Loading Chapter Mind Map from Cloud...
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.canvasWrapper,
                {
                  width: canvasWidth,
                  height: canvasHeight,
                },
              ]}
            >
              {/* SVG Connecting Splines matching image */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Svg width={canvasWidth} height={canvasHeight}>
                  {b0 && <Path d={pathCenterToB0} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />}
                  {b1 && <Path d={pathCenterToB1} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />}
                  {b2 && <Path d={pathCenterToB2} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />}
                  {b3 && <Path d={pathCenterToB3} stroke={colors.connectorStroke} strokeWidth={1.8} fill="none" />}
                </Svg>
              </View>

              {/* ── TOP-LEFT PARENT NODE ── */}
              {b0 && (
                <TouchableOpacity
                  style={[
                    styles.parentNodeBox,
                    {
                      top: topParentY,
                      left: leftX,
                      width: colNodeW,
                      height: parentH,
                      backgroundColor: colors.parentNodeBg,
                      borderColor: colors.parentNodeBorder,
                    },
                  ]}
                  onPress={() => handleNavigateToRead(b0Title)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.parentNodeText, { color: colors.parentNodeText }]} numberOfLines={2}>
                    {b0Title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.nodeEarBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLessonPress(b0Title);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Listen"
                  >
                    <Ionicons name="headset" size={13} color={colors.earIconLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* ── TOP-RIGHT PARENT NODE ── */}
              {b1 && (
                <TouchableOpacity
                  style={[
                    styles.parentNodeBox,
                    {
                      top: topParentY,
                      left: rightX,
                      width: colNodeW,
                      height: parentH,
                      backgroundColor: colors.parentNodeBg,
                      borderColor: colors.parentNodeBorder,
                    },
                  ]}
                  onPress={() => handleNavigateToRead(b1Title)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.parentNodeText, { color: colors.parentNodeText }]} numberOfLines={2}>
                    {b1Title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.nodeEarBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLessonPress(b1Title);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Listen"
                  >
                    <Ionicons name="headset" size={13} color={colors.earIconLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* ── MAIN TOPIC (CENTER HUB) ── */}
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
                onPress={() => handleNavigateToRead(rootTitle)}
                activeOpacity={0.85}
                accessibilityLabel={`Read ${rootTitle}`}
              >
                <View style={styles.centerNodeTextCol}>
                  <Text style={[styles.centerNodeTitle, { color: colors.centerNodeTitle }]} numberOfLines={2}>
                    {rootTitle.toUpperCase()}
                  </Text>
                  <Text style={[styles.centerNodeSub, { color: colors.centerNodeSub }]} numberOfLines={1}>
                    CHAPTER {chapterNumber}
                  </Text>
                </View>

                {/* Ear Icon on Center Node */}
                <TouchableOpacity
                  style={[styles.nodeEarBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleLessonPress(rootTitle);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Listen"
                >
                  <Ionicons name="headset" size={14} color={colors.earIconLight} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* ── BOTTOM-LEFT PARENT NODE ── */}
              {b2 && (
                <TouchableOpacity
                  style={[
                    styles.parentNodeBox,
                    {
                      top: bottomParentY,
                      left: leftX,
                      width: colNodeW,
                      height: parentH,
                      backgroundColor: colors.parentNodeBg,
                      borderColor: colors.parentNodeBorder,
                    },
                  ]}
                  onPress={() => handleNavigateToRead(b2Title)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.parentNodeText, { color: colors.parentNodeText }]} numberOfLines={2}>
                    {b2Title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.nodeEarBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLessonPress(b2Title);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Listen"
                  >
                    <Ionicons name="headset" size={13} color={colors.earIconLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}

              {/* ── BOTTOM-RIGHT PARENT NODE ── */}
              {b3 && (
                <TouchableOpacity
                  style={[
                    styles.parentNodeBox,
                    {
                      top: bottomParentY,
                      left: rightX,
                      width: colNodeW,
                      height: parentH,
                      backgroundColor: colors.parentNodeBg,
                      borderColor: colors.parentNodeBorder,
                    },
                  ]}
                  onPress={() => handleNavigateToRead(b3Title)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.parentNodeText, { color: colors.parentNodeText }]} numberOfLines={2}>
                    {b3Title}
                  </Text>
                  <TouchableOpacity
                    style={[styles.nodeEarBtn, { backgroundColor: 'rgba(255,255,255,0.22)' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleLessonPress(b3Title);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Listen"
                  >
                    <Ionicons name="headset" size={13} color={colors.earIconLight} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Extra branches chips for chapters with >4 topics (e.g. Chapter 2 has 6 topics) */}
          {extraBranches.length > 0 && (
            <View style={styles.extraBranchesCard}>
              <Text style={[styles.extraBranchesTitle, { color: colors.cardTitle }]}>
                Additional Topics ({extraBranches.length})
              </Text>
              <View style={styles.extraChipsWrap}>
                {extraBranches.map((eb, idx) => {
                  const title = eb.title.replace(/\s*\[Bloom:.*?\]/i, '').trim();
                  return (
                    <TouchableOpacity
                      key={`eb_${idx}`}
                      style={[styles.extraBranchChip, { backgroundColor: colors.parentNodeBg }]}
                      onPress={() => handleNavigateToRead(title)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.extraBranchChipText, { color: '#FFFFFF' }]} numberOfLines={1}>
                        {title}
                      </Text>
                      <TouchableOpacity
                        style={styles.extraChipEarBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleLessonPress(title);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="headset" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAccentLine: {
    height: 3,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubText: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tabletContainer: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  mainCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58, 91, 76, 0.15)',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  cardSubText: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  badgePill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  canvasWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },

  /* Center Node (Main Topic) */
  centerNodeBox: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  centerNodeTextCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 4,
  },
  centerNodeTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14.5,
  },
  centerNodeSub: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  /* Parent / Branch Node Box */
  parentNodeBox: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  parentNodeText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginRight: 6,
    lineHeight: 14.5,
  },

  /* Child / Concept Node Box */
  childNodeBox: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  childNodeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    marginRight: 6,
    lineHeight: 14,
  },

  /* Ear Icon Button */
  nodeEarBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Extra Branches Section */
  extraBranchesCard: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(58, 91, 76, 0.15)',
  },
  extraBranchesTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  extraChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraBranchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  extraBranchChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginRight: 6,
  },
  extraChipEarBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Directory Section below diagram */
  directorySection: {
    marginTop: 20,
  },
  directoryHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 4,
  },
  branchGroupCard: {
    marginBottom: 12,
  },
  directoryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dirLeftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  topicNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dirTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dirBloomText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  dirActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dirActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  dirActionText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  /* Sub Topics List inside Directory */
  subTopicsContainer: {
    marginTop: 6,
    paddingLeft: 24,
    gap: 4,
  },
  subTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  subTopicText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    marginRight: 8,
  },
  subTopicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subActionIcon: {
    padding: 3,
  },
});
