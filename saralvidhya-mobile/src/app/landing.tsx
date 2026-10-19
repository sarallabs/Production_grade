import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { TabletFontSize } from '@/constants/theme';

const { width } = Dimensions.get('window');

// Brand Colors matching user specification
const LIGHT_BG = '#FFF6F1';
const DARK_BG = '#2D3E36';

export default function LandingScreen() {
  const router = useRouter();
  const { user, onboardingCompleted } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet, width: layoutWidth, height: layoutHeight } = useDeviceLayout();
  const tabletLogoSize = Math.min(layoutWidth * 0.45, layoutHeight * 0.5, 480);

  // Animation values
  const logoOpacity = useRef(new RNAnimated.Value(0)).current;
  const logoScale = useRef(new RNAnimated.Value(0.92)).current;
  const textOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  const hasNavigatedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    hasNavigatedRef.current = false;

    // 1. Entrance sequence
    const entranceAnim = RNAnimated.parallel([
      RNAnimated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      RNAnimated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);

    entranceAnim.start(() => {
      if (!isMountedRef.current) return;
      RNAnimated.parallel([
        RNAnimated.timing(textOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(buttonOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 2. Auto-transition progress bar (2.5 seconds)
    const progressAnimation = RNAnimated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    });

    progressAnimation.start(({ finished }) => {
      if (finished && isMountedRef.current && !hasNavigatedRef.current) {
        handleProceed();
      }
    });

    return () => {
      isMountedRef.current = false;
      entranceAnim.stop();
      progressAnimation.stop();
    };
  }, []);

  const handleProceed = () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/courses');
  };

  const currentBg = isDark ? DARK_BG : LIGHT_BG;
  const textColor = isDark ? '#FFFFFF' : '#1C2E24';
  const subtextColor = isDark ? '#A6C5B3' : '#557A65';
  const buttonBg = isDark ? '#22c55e' : '#2D3E36';
  const buttonTextColor = '#ffffff';

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: currentBg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentBg}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.badgeText, { color: subtextColor }]}>ANGRAU OFFICIAL</Text>
        </View>
      </View>

      {/* Center Logo Showcase (matching reference PNGs) */}
      <View style={styles.centerSection}>
        <RNAnimated.View
          style={[
            styles.logoWrapper,
            isTablet && { width: tabletLogoSize, height: tabletLogoSize },
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/saral-logo.png')}
            style={styles.logoImage}
            contentFit="contain"
            transition={300}
          />
        </RNAnimated.View>

        {/* Personalized Student Greeting */}
        <RNAnimated.View style={[styles.textWrapper, { opacity: textOpacity }]}>
          <Text style={[styles.welcomeGreeting, { color: textColor }, isTablet && { fontSize: TabletFontSize.title + 4 }]}>
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </Text>
          <Text style={[styles.universityTag, { color: subtextColor }, isTablet && { fontSize: TabletFontSize.subtitle }]}>
            B.Sc. (Hons) Agriculture • Semester 3
          </Text>
        </RNAnimated.View>
      </View>

      {/* Bottom Action Section with Auto-transition Progress */}
      <RNAnimated.View style={[styles.bottomSection, isTablet && { maxWidth: 520 }, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={[styles.continueButton, isTablet && { height: 60, borderRadius: 30 }, { backgroundColor: buttonBg }]}
          onPress={handleProceed}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueText, { color: buttonTextColor }]}>
            Select Courses & Subjects
          </Text>
          <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />
        </TouchableOpacity>

        {/* Subtle timer progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)' }]}>
          <RNAnimated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: isDark ? '#4ade80' : '#22c55e',
              },
            ]}
          />
        </View>
        <Text style={[styles.hintText, { color: subtextColor }]}>
          Loading courses & personalized curriculum...
        </Text>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: Math.min(width * 0.76, 320),
    height: Math.min(width * 0.76, 320),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  welcomeGreeting: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  universityTag: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  continueButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressTrack: {
    width: '60%',
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
