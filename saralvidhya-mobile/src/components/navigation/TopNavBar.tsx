import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, ToolPillarColors, PillarName } from '@/constants/theme';

export interface NavSegment {
  id: string;
  label: string;
  icon?: string;
  vectorIcon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

interface TopNavBarProps {
  segments: NavSegment[];
  activeSegment: string;
  onSegmentChange: (id: string) => void;
  showProfile?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  chapterTitle?: string;
  onChapterPress?: () => void;
  title?: string;
  pillar?: PillarName;
}

export default function TopNavBar({
  segments,
  activeSegment,
  onSegmentChange,
  showProfile = true,
  showBack = true,
  onBackPress,
  chapterTitle,
  onChapterPress,
  title,
  pillar,
}: TopNavBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  const handleProfilePress = () => {
    try { Haptics.selectionAsync().catch(() => {}); } catch {}
    router.push('/(tabs)/profile');
  };

  const handleBackPress = () => {
    try { Haptics.selectionAsync().catch(() => {}); } catch {}
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleSegmentPress = (id: string) => {
    if (id === activeSegment) return;
    try { Haptics.selectionAsync().catch(() => {}); } catch {}
    onSegmentChange(id);
  };

  // Color tokens matching user reference screenshot:
  // Light mode: cream background #FFF6F1, subtle border, clean dark-green text
  // Dark mode: dark green background #2D3E36, dark translucent pills with subtle light border
  const bg = isDark ? '#2D3E36' : '#FFF6F1';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.22)' : '#DCD3CC';
  const pillInactiveBg = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.85)';
  const pillActiveBg = isDark ? '#2E4438' : '#FFFFFF';
  const textInactive = isDark ? '#B2C7BC' : '#4D6256';
  const textActive = isDark ? '#FFFFFF' : '#1C2E24';
  const activeBorder = (pillar && ToolPillarColors[pillar]?.primary) || (isDark ? '#4ade80' : '#203328');
  const avatarBorder = isDark ? 'rgba(255, 255, 255, 0.5)' : '#4D6256';

  const renderPill = (seg: NavSegment) => {
    const isActive = seg.id === activeSegment;
    const textColor = isActive ? textActive : textInactive;
    return (
      <TouchableOpacity
        key={seg.id}
        style={[
          styles.pillButton,
          {
            backgroundColor: isActive ? pillActiveBg : pillInactiveBg,
            borderColor: isActive ? activeBorder : pillBorder,
            borderWidth: isActive ? 1.5 : 1,
          },
          isActive && styles.activePillElevation,
        ]}
        onPress={() => handleSegmentPress(seg.id)}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        {seg.vectorIcon ? (
          <Ionicons
            name={seg.vectorIcon}
            size={13}
            color={textColor}
          />
        ) : seg.icon ? (
          <Text style={styles.pillIcon}>{seg.icon}</Text>
        ) : null}
        <Text
          style={[
            styles.pillLabel,
            {
              color: textColor,
              fontWeight: isActive ? '700' : '600',
            },
          ]}
        >
          {seg.label}
        </Text>
        {seg.badge ? (
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{seg.badge}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: bg, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
      <View style={styles.topRow}>
        {/* Left Slot: Go Back Arrow Button */}
        <View style={styles.sideSlot}>
          {showBack ? (
            <View style={styles.leftNavRow}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: pillInactiveBg, borderColor: pillBorder }]}
                onPress={handleBackPress}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={17} color={textActive} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.treeNavButton}
                onPress={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
                  router.replace('/courses');
                }}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go to Courses"
              >
                <Image
                  source={require('@/assets/images/saral-tree.png')}
                  style={styles.treeNavImage}
                  contentFit="contain"
                />
              </TouchableOpacity>
            </View>
          ) : chapterTitle ? (
            <TouchableOpacity
              style={[styles.chapterPill, { backgroundColor: pillInactiveBg, borderColor: pillBorder }]}
              onPress={onChapterPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Text style={[styles.chapterPillText, { color: textActive }]} numberOfLines={1}>
                {chapterTitle}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#22c55e" />
            </TouchableOpacity>
          ) : title ? (
            <Text style={[styles.headerTitle, { color: textActive }]} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>

        {/* Center Toggle Pills (Matches User's Screenshots) */}
        <View style={styles.centerSlot}>
          {segments.length <= 4 ? (
            <View style={styles.pillsScrollContent}>
              {segments.map(renderPill)}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.pillsScrollContent}
              style={styles.pillsScroll}
            >
              {segments.map(renderPill)}
            </ScrollView>
          )}
        </View>

        {/* Right Slot: Circular Profile Avatar (Matches Screenshot) */}
        <View style={styles.sideSlotRight}>
          {showProfile ? (
            <TouchableOpacity
              style={[styles.avatarButton, { borderColor: avatarBorder }]}
              onPress={handleProfilePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="My Profile and Rankings"
            >
              <Ionicons name="person-outline" size={17} color={isDark ? '#FFFFFF' : '#1C2E24'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 32 }} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  sideSlot: {
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  sideSlotRight: {
    minWidth: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 10,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsScroll: {
    flexGrow: 0,
    maxWidth: '100%',
  },
  pillsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 34,
    borderRadius: 10,
    gap: 4,
  },
  activePillElevation: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pillIcon: {
    fontSize: 12,
  },
  pillLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  badgeWrap: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 3,
    maxWidth: 95,
  },
  chapterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  leftNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  treeNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  treeNavImage: {
    width: 24,
    height: 30,
  },
});
