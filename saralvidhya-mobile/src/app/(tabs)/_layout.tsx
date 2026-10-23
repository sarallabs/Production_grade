import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import SideRail from '@/components/navigation/SideRail';
import {
  HomeIcon,
  LearnIcon,
  PracticeIcon,
  PrepareIcon,
  ResourcesIcon,
} from '@/components/navigation/TabIcons';

export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  // Color scheme matching Figma DevMode CSS (.bottomNavigation):
  // Light Mode: Background #FFF6F1, Border #D1E3D9, Active #147A43, Inactive #617269
  // Dark Mode: Background #16231B, Border #2D4538, Active #4ADE80, Inactive #8A9E92
  const tabBg = isDark ? '#16231B' : '#FFF6F1';
  const tabBorder = isDark ? '#2D4538' : '#D1E3D9';
  const activeTint = isDark ? '#4ADE80' : '#147A43';
  const inactiveTint = isDark ? '#8A9E92' : '#617269';

  return (
    <Tabs
      tabBar={isTablet ? (props) => <SideRail {...(props as any)} /> : undefined}
      screenOptions={{
        ...(isTablet ? { tabBarPosition: 'left' as const } : {}),
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 68 : 84,
          paddingBottom: Platform.OS === 'android' ? 10 : 24,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.08 : 0.2,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11.5,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* Hidden index route (Auto-redirects to learn) */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      {/* 2. Learn (Matches media_1791971037380.png) */}
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <LearnIcon color={color} size={22} focused={focused} />
          ),
        }}
      />

      {/* 3. Practice (Matches media_1791971032338.png) */}
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, focused }) => (
            <PracticeIcon color={color} size={22} focused={focused} />
          ),
        }}
      />

      {/* 4. Prepare */}
      <Tabs.Screen
        name="prepare"
        options={{
          title: 'Prepare',
          tabBarIcon: ({ color, focused }) => (
            <PrepareIcon color={color} size={22} focused={focused} />
          ),
        }}
      />

      {/* 5. Resources */}
      <Tabs.Screen
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, focused }) => (
            <ResourcesIcon color={color} size={22} focused={focused} />
          ),
        }}
      />

      {/* Auxiliary Routes (Accessible via router.push or profile avatar, hidden from tab bar) */}
      <Tabs.Screen
        name="study"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
