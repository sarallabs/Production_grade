import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  const [isPaused, setIsPaused] = useState(false);
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [speedIndex, setSpeedIndex] = useState(1); // default 1.0x

  useEffect(() => {
    const unsubscribe = speechService.subscribe((speaking, paused, currentChunk, totalChunks) => {
      setIsPlaying(speaking);
      setIsPaused(paused);
      if (totalChunks && totalChunks > 0) {
        setChunkProgress({ current: (currentChunk || 0) + 1, total: totalChunks });
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying && !isPaused) {
      await speechService.pause();
    } else if (isPlaying && isPaused) {
      await speechService.resume();
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
    await speechService.setRate(newRate);
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
          backgroundColor: isDark ? '#1E2B24' : '#ffffff',
          borderColor: isDark ? '#3D5449' : '#D0E3D7',
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View style={[styles.speakerBadge, isPlaying && !isPaused && styles.speakerBadgeActive]}>
          <Ionicons
            name={isPlaying && !isPaused ? 'volume-high' : isPaused ? 'pause' : 'volume-medium-outline'}
            size={18}
            color={isPlaying && !isPaused ? '#ffffff' : '#22c55e'}
          />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.badgeRow}>
            <Text style={styles.preLabel}>VOICE OVER</Text>
            {chunkProgress.total > 1 && isPlaying && (
              <Text style={[styles.progressTag, { color: isDark ? '#A6C5B3' : '#476355' }]}>
                · Section {chunkProgress.current}/{chunkProgress.total}
              </Text>
            )}
          </View>
          <Text
            style={[styles.titleLabel, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        {/* Speed toggle pill */}
        <TouchableOpacity
          style={[styles.speedBtn, { backgroundColor: isDark ? '#2D3E36' : '#E8F3EC' }]}
          onPress={handleCycleSpeed}
          activeOpacity={0.7}
        >
          <Text style={[styles.speedText, { color: isDark ? '#A6C5B3' : '#2D6A4F' }]}>
            {SPEED_OPTIONS[speedIndex]}x
          </Text>
        </TouchableOpacity>

        {/* Play / Pause toggle */}
        <TouchableOpacity
          style={[styles.playBtn, { backgroundColor: '#22c55e' }]}
          onPress={handleTogglePlay}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying && !isPaused ? 'pause' : 'play'}
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* Dismiss / Stop */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleStop}>
          <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
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
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  preLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 0.8,
  },
  progressTag: {
    fontSize: 10,
    fontWeight: '600',
  },
  titleLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
});
