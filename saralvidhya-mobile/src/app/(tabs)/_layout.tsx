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

  // Inverted color scheme exactly matching the user's screenshots:
  // Light Mode (Screen: #FFF6F1) -> Bottom Bar: Dark Forest Green (#203328), Active: #FFFFFF, Inactive: #9DB4A6
  // Dark Mode (Screen: #23322B)  -> Bottom Bar: Light Cream (#FFF6F1), Active: #1C2E24, Inactive: #7D8D84
  const tabBg = isDark ? '#FFF6F1' : '#203328';
  const tabBorder = isDark ? '#E8DDD5' : '#18271F';
  const activeTint = isDark ? '#1C2E24' : '#FFFFFF';
  const inactiveTint = isDark ? '#7D8D84' : '#9DB4A6';

  return (
    <Tabs
      tabBar={isTablet ? (props) => <SideRail {...(props as any)} /> : undefined}
      screenOptions={{
        ...(isTablet ? { tabBarPosition: 'left' as const } : {}),
        headerShown: false,
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
      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} size={22} focused={focused} />
          ),
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
