import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import ReadAloudBar from './ReadAloudBar';
import { BorderRadius, Spacing } from '@/constants/theme';

interface MarkdownReaderProps {
  content: string;
  title: string;
}

export default function MarkdownReader({ content, title }: MarkdownReaderProps) {
  const { isDark } = useAppTheme();
  const [showReadAloud, setShowReadAloud] = useState(false);

  // Clean raw HTML or comments from markdown
  const cleanedMarkdown = content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .trim();

  const markdownStyles = {
    body: {
      color: isDark ? '#e2e8f0' : '#334155',
      fontSize: 15,
      lineHeight: 24,
    },
    heading1: {
      color: isDark ? '#f8fafc' : '#0f172a',
      fontSize: 22,
      fontWeight: '800' as const,
      marginTop: 20,
      marginBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#22c55e',
      paddingBottom: 6,
    },
    heading2: {
      color: isDark ? '#f1f5f9' : '#1e293b',
      fontSize: 18,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    heading3: {
      color: '#22c55e',
      fontSize: 15,
      fontWeight: '700' as const,
      marginTop: 14,
      marginBottom: 6,
    },
    paragraph: {
      marginTop: 6,
      marginBottom: 10,
    },
    strong: {
      fontWeight: '700' as const,
      color: isDark ? '#ffffff' : '#0f172a',
    },
    bullet_list: {
      marginTop: 6,
      marginBottom: 10,
    },
    ordered_list: {
      marginTop: 6,
      marginBottom: 10,
    },
    list_item: {
      flexDirection: 'row' as const,
      marginBottom: 6,
    },
    blockquote: {
      backgroundColor: isDark ? '#064e3b18' : '#f0fdf4',
      borderLeftWidth: 4,
      borderLeftColor: '#22c55e',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 10,
      borderRadius: BorderRadius.sm,
    },
    code_inline: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      color: '#22c55e',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    table: {
      borderWidth: 1,
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      borderRadius: BorderRadius.md,
      marginVertical: 12,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
      flexDirection: 'row' as const,
    },
    th: {
      padding: 8,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      fontWeight: '700' as const,
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    td: {
      padding: 8,
      color: isDark ? '#cbd5e1' : '#334155',
    },
  };

  return (
    <View style={styles.container}>
      {/* Top Reading Actions Bar */}
      <View style={styles.actionBar}>
        <View style={styles.readingTimeBadge}>
          <Ionicons name="time-outline" size={14} color="#22c55e" />
          <Text style={styles.readingTimeText}>~4 min read</Text>
        </View>

        <TouchableOpacity
          style={[styles.ttsButton, showReadAloud && styles.ttsButtonActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowReadAloud(!showReadAloud);
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showReadAloud ? 'volume-high' : 'volume-medium-outline'}
            size={16}
            color={showReadAloud ? '#ffffff' : '#22c55e'}
          />
          <Text style={[styles.ttsButtonText, showReadAloud && styles.ttsButtonTextActive]}>
            {showReadAloud ? 'Active Voice' : 'Read Aloud'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating / Docked Read Aloud Bar */}
      {showReadAloud && (
        <ReadAloudBar
          title={title}
          content={cleanedMarkdown}
          onClose={() => setShowReadAloud(false)}
        />
      )}

      {/* Rendered Markdown Body */}
      <View style={styles.markdownWrapper}>
        <Markdown style={markdownStyles}>
          {cleanedMarkdown}
        </Markdown>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b22',
  },
  readingTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readingTimeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064e3b22',
    borderWidth: 1,
    borderColor: '#22c55e44',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  ttsButtonActive: {
    backgroundColor: '#22c55e',
  },
  ttsButtonText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  ttsButtonTextActive: {
    color: '#ffffff',
  },
  markdownWrapper: {
    paddingTop: Spacing.one,
  },
});
