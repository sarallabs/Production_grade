import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { speechService } from '@/services/speechService';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';

interface ReadAloudBarProps {
  title: string;
  content: string;
  onClose?: () => void;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5];

export default function ReadAloudBar({ title, content, onClose }: ReadAloudBarProps) {
  const { isDark } = useAppTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // default 1.0x

  useEffect(() => {
    const unsubscribe = speechService.subscribe((speaking) => {
      setIsPlaying(speaking);
    });
    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      await speechService.stop();
    } else {
      const rate = SPEED_OPTIONS[speedIndex];
      await speechService.speak(content, rate);
    }
  };

  const handleCycleSpeed = async () => {
    Haptics.selectionAsync();
    const nextIndex = (speedIndex + 1) % SPEED_OPTIONS.length;
    setSpeedIndex(nextIndex);
    const newRate = SPEED_OPTIONS[nextIndex];
    if (isPlaying) {
      await speechService.speak(content, newRate);
    }
  };

  const handleStop = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await speechService.stop();
    onClose?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderColor: isDark ? '#1e293b' : '#e2e8f0',
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View style={[styles.speakerBadge, isPlaying && styles.speakerBadgeActive]}>
          <Ionicons
            name={isPlaying ? 'volume-high' : 'volume-medium-outline'}
            size={18}
            color={isPlaying ? '#ffffff' : '#22c55e'}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.preLabel}>READ ALOUD (TTS)</Text>
          <Text
            style={[styles.titleLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        {/* Speed toggle pill */}
        <TouchableOpacity
          style={styles.speedBtn}
          onPress={handleCycleSpeed}
          activeOpacity={0.7}
        >
          <Text style={styles.speedText}>{SPEED_OPTIONS[speedIndex]}x</Text>
        </TouchableOpacity>

        {/* Play / Pause toggle */}
        <TouchableOpacity
          style={styles.playBtn}
          onPress={handleTogglePlay}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* Dismiss / Stop */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleStop}>
          <Ionicons name="close" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  speakerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#064e3b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBadgeActive: {
    backgroundColor: '#22c55e',
  },
  textContainer: {
    flex: 1,
  },
  preLabel: {
    color: '#22c55e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  titleLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  speedText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
});
