import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import FitImage from 'react-native-fit-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';

interface MarkdownReaderProps {
  content: string;
  title: string;
  chapterNumber?: number;
}

// Helper to parse simple Mermaid / flowchart syntax into ordered step cards
interface FlowchartStep {
  id: string;
  stepNum: number;
  title: string;
  details: string;
}

function parseFlowchartSteps(raw: string): FlowchartStep[] {
  const lines = raw.split('\n');
  const stepMap = new Map<string, FlowchartStep>();
  let counter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('flowchart') || trimmed.startsWith('graph') || trimmed.startsWith('```')) {
      continue;
    }

    // Match node declarations: ID["Title<br>Details"] or ID[Title] or ID("Title")
    const nodeRegex = /([A-Za-z0-9_-]+)\[["']?([^\]"']+)["']?\]|([A-Za-z0-9_-]+)\(["']?([^)"']+)["']?\)/g;
    let match: RegExpExecArray | null;
    while ((match = nodeRegex.exec(trimmed)) !== null) {
      const id = match[1] || match[3];
      const rawText = match[2] || match[4];
      if (id && rawText && !stepMap.has(id)) {
        // Split title and details by <br> or - or :
        const parts = rawText.split(/<br\s*\/?>|\s*—\s*|\s*:\s*/i);
        const title = parts[0]?.trim() || `Step ${counter}`;
        const details = parts.slice(1).join(' • ').trim();

        stepMap.set(id, {
          id,
          stepNum: counter++,
          title,
          details,
        });
      }
    }
  }

  return Array.from(stepMap.values());
}

export default function MarkdownReader({ content, title, chapterNumber = 1 }: MarkdownReaderProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const chDir = `chapter_${chapterNumber < 10 ? '0' : ''}${chapterNumber}`;
  const apiBase = `https://saralvidhya-api-193782571555.asia-south1.run.app/api/content/angrau/entomology/${chDir}`;

  // Clean raw HTML, AI preambles, and resolve relative image paths according to master conventions
  const cleanedMarkdown = content
    .replace(/base64,\s+/g, 'base64,')
    .replace(/^.*Word count:.*Persona:.*$/gmi, '')
    .replace(/!\[([^\]]*)\]\(\.\.\/\.\.\/([^)]+)\)/g, (_, alt, path) => `![${alt}](${apiBase}/${path})`)
    .replace(/!\[([^\]]*)\]\(\.\.\/([^)]+)\)/g, (_, alt, path) => `![${alt}](${apiBase}/${path})`)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();

  const markdownStyles = {
    body: {
      color: isDark ? '#e2e8f0' : '#334155',
      fontSize: isTablet ? 17 : 15,
      lineHeight: isTablet ? 28 : 24,
    },
    heading1: {
      color: isDark ? '#FFFFFF' : '#1C2E24',
      fontSize: isTablet ? 26 : 22,
      fontWeight: '800' as const,
      marginTop: 20,
      marginBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#22c55e',
      paddingBottom: 6,
    },
    heading2: {
      color: isDark ? '#FFFFFF' : '#1C2E24',
      fontSize: isTablet ? 21 : 18,
      fontWeight: '700' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    heading3: {
      color: '#22c55e',
      fontSize: isTablet ? 17 : 15,
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
      color: isDark ? '#FFFFFF' : '#1C2E24',
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
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4',
      borderLeftWidth: 4,
      borderLeftColor: '#22c55e',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 10,
      borderRadius: BorderRadius.sm,
    },
    code_inline: {
      backgroundColor: isDark ? '#374B41' : '#F7EBE3',
      color: '#22c55e',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    table: {
      borderWidth: 1,
      borderColor: isDark ? '#3D5449' : '#E5DDD8',
      borderRadius: BorderRadius.md,
      marginVertical: 12,
    },
    tr: {
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3D5449' : '#E5DDD8',
      flexDirection: 'row' as const,
    },
    th: {
      padding: 8,
      backgroundColor: isDark ? '#23322B' : '#F7EBE3',
      fontWeight: '700' as const,
      color: isDark ? '#FFFFFF' : '#1C2E24',
    },
    td: {
      padding: 8,
      color: isDark ? '#E5DDD8' : '#334155',
    },
  };

  const markdownRules = {
    image: (
      node: any,
      children: any,
      parent: any,
      styles: any,
      allowedImageHandlers: any,
      defaultImageHandler: any
    ) => {
      const { src, alt } = node.attributes || {};
      let imageUri = src;

      // Handle relative paths
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const cleanPath = src.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '');
        imageUri = `${apiBase}/${cleanPath}`;
      }

      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
        return null;
      }

      return (
        <View key={node.key} style={styles.imageCardContainer}>
          <FitImage
            indicator={true}
            style={styles._VIEW_SAFE_image || styles.image}
            source={{ uri: imageUri }}
            accessible={!!alt}
            accessibilityLabel={alt}
          />
          {alt ? <Text style={styles.imageCaption}>{alt}</Text> : null}
        </View>
      );
    },

    // Custom renderer for code fence: transforms flowchart / mermaid diagrams into visual infographics
    fence: (node: any) => {
      const rawContent = node.content || '';
      const isFlowchart =
        rawContent.includes('flowchart') ||
        rawContent.includes('graph') ||
        rawContent.includes('-->') ||
        rawContent.includes('mermaid');

      if (isFlowchart) {
        const steps = parseFlowchartSteps(rawContent);
        if (steps.length > 0) {
          return (
            <View
              key={node.key}
              style={[
                styles.flowchartCard,
                {
                  backgroundColor: isDark ? '#16251D' : '#F0F9F4',
                  borderColor: isDark ? '#234431' : '#C7E6D4',
                },
              ]}
            >
              {/* Infographic Header */}
              <View style={styles.flowchartHeader}>
                <View style={styles.flowchartTitleWrap}>
                  <Ionicons name="git-network-outline" size={17} color="#22c55e" />
                  <Text style={[styles.flowchartHeaderTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
                    PROCESS INFOGRAPHIC FLOW
                  </Text>
                </View>
                <View style={styles.flowchartBadge}>
                  <Text style={styles.flowchartBadgeText}>Visual Sequence</Text>
                </View>
              </View>

              {/* Horizontal Process Steps Flow */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flowchartScrollContent}
              >
                {steps.map((step, idx) => (
                  <React.Fragment key={step.id}>
                    <View
                      style={[
                        styles.flowchartNode,
                        {
                          backgroundColor: isDark ? '#1F3429' : '#FFFFFF',
                          borderColor: isDark ? '#2D513B' : '#BEE3CD',
                        },
                      ]}
                    >
                      <View style={styles.nodeTopRow}>
                        <View style={styles.nodeStepBadge}>
                          <Text style={styles.nodeStepNumber}>{step.stepNum}</Text>
                        </View>
                        <Text
                          style={[
                            styles.nodeTitle,
                            { color: isDark ? '#E2FBE9' : '#166534' },
                          ]}
                          numberOfLines={2}
                        >
                          {step.title}
                        </Text>
                      </View>
                      {step.details ? (
                        <Text
                          style={[
                            styles.nodeDetails,
                            { color: isDark ? '#9EB9A8' : '#4B6354' },
                          ]}
                          numberOfLines={3}
                        >
                          {step.details}
                        </Text>
                      ) : null}
                    </View>

                    {/* Arrow between nodes */}
                    {idx < steps.length - 1 && (
                      <View style={styles.flowchartArrowWrap}>
                        <Ionicons name="arrow-forward" size={16} color="#22c55e" />
                      </View>
                    )}
                  </React.Fragment>
                ))}
              </ScrollView>

              <Text style={styles.flowchartSwipeHint}>
                Swipe horizontally to follow the full biological sequence →
              </Text>
            </View>
          );
        }
      }

      // Default styled code block
      return (
        <View
          key={node.key}
          style={[
            styles.codeBlockCard,
            {
              backgroundColor: isDark ? '#18241D' : '#F1F5F9',
              borderColor: isDark ? '#2A4032' : '#CBD5E1',
            },
          ]}
        >
          <Text
            style={[
              styles.codeBlockText,
              { color: isDark ? '#86EFAC' : '#15803D' },
            ]}
          >
            {rawContent.trim()}
          </Text>
        </View>
      );
    },
  };

  return (
    <View style={[styles.container, isTablet && { width: '100%', maxWidth: 760, alignSelf: 'center' }]}>
      {/* Rendered Markdown Body (without duplicate Read Aloud bar) */}
      <View style={styles.markdownWrapper}>
        <Markdown rules={markdownRules} style={markdownStyles}>
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
  markdownWrapper: {
    paddingTop: Spacing.one,
  },
  imageCardContainer: {
    marginVertical: 12,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  imageCaption: {
    fontSize: 12,
    color: '#829A8C',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  // Visual Flowchart Infographic styles
  flowchartCard: {
    marginVertical: 16,
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  flowchartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  flowchartTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowchartHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  flowchartBadge: {
    backgroundColor: '#22c55e22',
    borderWidth: 1,
    borderColor: '#22c55e55',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  flowchartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22c55e',
  },
  flowchartScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  flowchartNode: {
    width: 220,
    borderRadius: 12,
    borderWidth: 1.2,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nodeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  nodeStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  nodeStepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nodeTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  nodeDetails: {
    fontSize: 12,
    lineHeight: 16,
    paddingLeft: 30,
  },
  flowchartArrowWrap: {
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowchartSwipeHint: {
    fontSize: 11,
    color: '#829A8C',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  codeBlockCard: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  codeBlockText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
});
