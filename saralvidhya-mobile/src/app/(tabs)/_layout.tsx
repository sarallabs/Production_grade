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

      {/* 2. Learn (Matches Mint #A4C6B5) */}
      <Tabs.Screen
        name="learn"
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('learn', { segment: 'read' });
          },
        })}
        options={{
          title: 'Learn',
          tabBarActiveTintColor: isDark ? '#A4C6B5' : '#3C7359',
          tabBarIcon: ({ focused }) => (
            <LearnIcon color={focused ? '#A4C6B5' : inactiveTint} size={22} focused={focused} />
          ),
        }}
      />

      {/* 3. Practice (Matches Amber #D9A55C) */}
      <Tabs.Screen
        name="practice"
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('practice', { part: 'revise' });
          },
        })}
        options={{
          title: 'Practice',
          tabBarActiveTintColor: '#D9A55C',
          tabBarIcon: ({ color, focused }) => (
            <PracticeIcon color={focused ? '#D9A55C' : color} size={22} focused={focused} />
          ),
        }}
      />

      {/* 4. Prepare (Matches Terra #BE7E57) */}
      <Tabs.Screen
        name="prepare"
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('prepare', { segment: 'pyq' });
          },
        })}
        options={{
          title: 'Prepare',
          tabBarActiveTintColor: '#BE7E57',
          tabBarIcon: ({ color, focused }) => (
            <PrepareIcon color={focused ? '#BE7E57' : color} size={22} focused={focused} />
          ),
        }}
      />

      {/* 5. Resources (Matches Terra #BE7E57) */}
      <Tabs.Screen
        name="resources"
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('resources', { segment: 'mindmaps' });
          },
        })}
        options={{
          title: 'Resources',
          tabBarActiveTintColor: '#BE7E57',
          tabBarIcon: ({ color, focused }) => (
            <ResourcesIcon color={focused ? '#BE7E57' : color} size={22} focused={focused} />
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
