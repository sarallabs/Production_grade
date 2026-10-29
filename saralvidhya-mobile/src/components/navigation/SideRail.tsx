import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useCourseContext } from '@/context/CourseContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { BorderRadius } from '@/constants/theme';

/** Minimal shape of the props expo-router's Tabs passes to a custom `tabBar`. */
interface SideRailProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; tabBarIcon?: (props: { color: any; focused: boolean; size: number }) => React.ReactNode; href?: any } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

const ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'home', inactive: 'home-outline' },
  learn: { active: 'sparkles', inactive: 'sparkles-outline' },
  practice: { active: 'create', inactive: 'create-outline' },
  prepare: { active: 'book', inactive: 'book-outline' },
  resources: { active: 'document-text', inactive: 'document-text-outline' },
  study: { active: 'laptop', inactive: 'laptop-outline' },
  leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

/**
 * Tablet-only navigation rail shown on the left instead of the bottom tab bar.
 * Compact (icon over label) in portrait; wide (icon beside label) in landscape.
 */
export default function SideRail({ state, descriptors, navigation }: SideRailProps) {
  const { isDark } = useAppTheme();
  const { selectedChapter } = useCourseContext();
  const insets = useSafeAreaInsets();
  const activeChapterParam = selectedChapter?.number ? String(selectedChapter.number) : undefined;

  const bg = isDark ? '#16231B' : '#FFFFFF';
  const border = isDark ? '#2D4538' : '#E2EBE5';
  const activeTint = isDark ? '#4ADE80' : '#147A43';
  const inactiveTint = isDark ? '#8A9E92' : '#5E7A6B';
  const activePillBg = isDark ? '#23392D' : '#DCECE2';

  // Filter out auxiliary/hidden routes like index, study, leaderboard, profile
  const hiddenRouteNames = new Set(['index', 'study', 'leaderboard', 'profile']);
  const visibleRoutes = state.routes.filter((route) => {
    const opts = (descriptors[route.key]?.options as any) || {};
    return opts.href !== null && !hiddenRouteNames.has(route.name);
  });

  return (
    <View
      style={[
        styles.rail,
        {
          width: 76,
          backgroundColor: bg,
          borderRightColor: border,
          paddingTop: Math.max(insets.top, 14),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* Top Brand Logo: 4-dot leaf in light green squircle */}
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: isDark ? '#23392D' : '#DCECE2' }]}>
          <Ionicons name="apps" size={20} color={activeTint} />
        </View>
      </View>

      {/* Center Nav Items */}
      <View style={styles.items}>
        {visibleRoutes.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const icon = ICONS[route.name] ?? ICONS.index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const color = focused ? activeTint : inactiveTint;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              const defaultParams: Record<string, any> = {
                learn: { segment: 'read', ...(activeChapterParam ? { chapter: activeChapterParam } : {}) },
                practice: { part: 'revise', ...(activeChapterParam ? { chapter: activeChapterParam } : {}) },
                prepare: { segment: 'pyq', ...(activeChapterParam ? { chapter: activeChapterParam } : {}) },
                resources: { segment: 'mindmaps', ...(activeChapterParam ? { chapter: activeChapterParam } : {}) },
              };
              (navigation as any).navigate(route.name, defaultParams[route.name]);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.item,
                focused && { backgroundColor: activePillBg },
                pressed && { opacity: 0.75 },
              ]}
            >
              {descriptors[route.key]?.options?.tabBarIcon ? (
                descriptors[route.key].options.tabBarIcon!({ color, focused, size: 21 })
              ) : (
                <Ionicons name={focused ? icon.active : icon.inactive} size={21} color={color} />
              )}
              <Text
                style={[
                  styles.label,
                  { color, fontWeight: focused ? '700' : '600' },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Profile Button */}
      <View style={styles.bottomSection}>
        <Pressable
          style={[styles.helpBtn, { borderColor: border }]}
          onPress={() => (navigation as any).navigate('profile')}
          accessibilityLabel="My Profile and Themes"
        >
          <Ionicons name="person-outline" size={18} color={isDark ? '#FFFFFF' : '#1C2E24'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  items: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  item: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  helpBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
