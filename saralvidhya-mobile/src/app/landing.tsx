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

const { width } = Dimensions.get('window');

// Brand Colors matching user reference images
const LIGHT_BG = '#FFF6F1';
const DARK_BG = '#6E997E'; // Muted Sage Green from user 2nd image

export default function LandingScreen() {
  const router = useRouter();
  const { user, onboardingCompleted } = useAuth();
  const { isDark, setThemeMode } = useAppTheme();

  // Animation values
  const logoOpacity = useRef(new RNAnimated.Value(0)).current;
  const logoScale = useRef(new RNAnimated.Value(0.92)).current;
  const textOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // 1. Entrance sequence
    RNAnimated.parallel([
      RNAnimated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      RNAnimated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in greeting and button
      RNAnimated.parallel([
        RNAnimated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        RNAnimated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // 2. Auto-transition progress bar (2.5 seconds)
    RNAnimated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !hasNavigated) {
        handleProceed();
      }
    });
  }, []);

  const handleProceed = () => {
    if (hasNavigated) return;
    setHasNavigated(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onboardingCompleted) {
      router.replace('/(tabs)/index');
    } else {
      router.replace('/(tabs)/index');
    }
  };

  const toggleTheme = () => {
    Haptics.selectionAsync();
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const currentBg = isDark ? DARK_BG : LIGHT_BG;
  const textColor = isDark ? '#143323' : '#1e3a2b';
  const subtextColor = isDark ? '#234d36' : '#4b6354';
  const buttonBg = isDark ? '#1a3a28' : '#22c55e';
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

      {/* Top Bar with Theme Toggle */}
      <View style={styles.topBar}>
        <View style={styles.badgeContainer}>
          <Text style={[styles.badgeText, { color: subtextColor }]}>ANGRAU OFFICIAL</Text>
        </View>

        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)' }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={textColor}
          />
        </TouchableOpacity>
      </View>

      {/* Center Logo Showcase (matching reference PNGs) */}
      <View style={styles.centerSection}>
        <RNAnimated.View
          style={[
            styles.logoWrapper,
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
          <Text style={[styles.welcomeGreeting, { color: textColor }]}>
            Welcome, {user?.name ? user.name.split(' ')[0] : 'Student'}! 👋
          </Text>
          <Text style={[styles.universityTag, { color: subtextColor }]}>
            B.Sc. (Hons) Agriculture • Semester 3
          </Text>
        </RNAnimated.View>
      </View>

      {/* Bottom Action Section with Auto-transition Progress */}
      <RNAnimated.View style={[styles.bottomSection, { opacity: buttonOpacity }]}>
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: buttonBg }]}
          onPress={handleProceed}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueText, { color: buttonTextColor }]}>
            Continue to Dashboard
          </Text>
          <Ionicons name="arrow-forward" size={18} color={buttonTextColor} />
        </TouchableOpacity>

        {/* Subtle timer progress bar */}
        <View style={styles.progressTrack}>
          <RNAnimated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
                backgroundColor: isDark ? '#143323' : '#22c55e',
              },
            ]}
          />
        </View>
        <Text style={[styles.hintText, { color: subtextColor }]}>
          Loading your personalized study material...
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
