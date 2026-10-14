import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
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
  const { isLandscape } = useDeviceLayout();
  const insets = useSafeAreaInsets();

  const bg = isDark ? '#23322B' : '#FFF6F1';
  const border = isDark ? '#35483E' : '#EED9CE';
  const active = isDark ? '#4ade80' : '#22c55e';
  const inactive = isDark ? '#7E998B' : '#8A7A70';
  const activeBg = isDark ? '#2F4A3C' : '#ECFDF5';
  const wide = isLandscape;

  // Filter out auxiliary/hidden routes like study, leaderboard, profile with href: null
  const visibleRoutes = state.routes.filter((route) => {
    const opts = (descriptors[route.key]?.options as any) || {};
    return opts.href !== null;
  });

  return (
    <View
      style={[
        styles.rail,
        {
          width: wide ? 190 : 84,
          backgroundColor: bg,
          borderRightColor: border,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={[styles.brand, wide && styles.brandWide]}>
        <View style={[styles.logo, { backgroundColor: active }]}>
          <Ionicons name="school" size={22} color="#FFFFFF" />
        </View>
        {wide && (
          <Text style={[styles.brandText, { color: isDark ? '#FFFFFF' : '#1C2E24' }]} numberOfLines={1}>
            Saral Vidhya
          </Text>
        )}
      </View>

      <View style={styles.items}>
        {visibleRoutes.map((route) => {
          const focused = state.routes[state.index]?.key === route.key;
          const icon = ICONS[route.name] ?? ICONS.index;
          const label = descriptors[route.key]?.options.title ?? route.name;
          const color = focused ? active : inactive;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
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
                wide ? styles.itemWide : styles.itemCompact,
                focused && { backgroundColor: activeBg },
                pressed && { opacity: 0.7 },
              ]}
            >
              {descriptors[route.key]?.options?.tabBarIcon ? (
                descriptors[route.key].options.tabBarIcon!({ color, focused, size: 24 })
              ) : (
                <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />
              )}
              <Text
                style={[
                  styles.label,
                  wide ? styles.labelWide : styles.labelCompact,
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
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    borderRightWidth: 1,
    paddingHorizontal: 10,
  },
  brand: { alignItems: 'center', marginBottom: 24 },
  brandWide: { flexDirection: 'row', paddingHorizontal: 8, gap: 10 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { fontSize: 18, fontWeight: '800', flexShrink: 1 },
  items: { gap: 6 },
  item: { borderRadius: BorderRadius.md, minHeight: 56 },
  itemCompact: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  itemWide: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 14 },
  label: { fontSize: 13 },
  labelCompact: { marginTop: 4, fontSize: 12 },
  labelWide: { fontSize: 16 },
});
