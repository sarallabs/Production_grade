import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { GCS_API_BASE } from '@/services/contentService';

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

/**
 * High-performance, responsive infographic renderer with full-screen zoom,
 * aspect ratio auto-calibration, and graceful fallback handling.
 */
interface SmartInfographicCardProps {
  uri: string;
  alt?: string;
  isDark: boolean;
}

function SmartInfographicCard({ uri, alt, isDark }: SmartInfographicCardProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 10);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoading(true);

    if (uri && !uri.startsWith('data:')) {
      Image.getSize(
        uri,
        (w, h) => {
          if (w > 0 && h > 0) {
            setAspectRatio(Math.max(0.7, Math.min(2.4, w / h)));
          }
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  }, [uri]);

  const cardBg = isDark ? '#1C2B23' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#D1E3D9';
  const emeraldPrimary = '#05996B';
  const textDark = isDark ? '#FFFFFF' : '#172933';
  const textMuted = isDark ? '#A6C5B3' : '#637375';

  return (
    <>
      <View style={[styles.infographicCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Card Header: Infographic Badge & Expand Button */}
        <View style={styles.infographicCardHeader}>
          <View style={styles.infographicBadgeWrap}>
            <Ionicons name="sparkles" size={12} color={emeraldPrimary} />
            <Text style={[styles.infographicBadgeLabel, { color: emeraldPrimary }]}>
              SCIENTIFIC INFOGRAPHIC
            </Text>
          </View>
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsZoomed(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.expandButtonText, { color: emeraldPrimary }]}>Expand</Text>
            <Ionicons name="expand-outline" size={13} color={emeraldPrimary} />
          </TouchableOpacity>
        </View>

        {/* Image Touch Area */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsZoomed(true);
          }}
          style={[styles.infographicImageTouch, { aspectRatio }]}
        >
          {!hasError ? (
            <Image
              source={{ uri }}
              style={styles.infographicImage}
              resizeMode="contain"
              onLoad={(e) => {
                setIsLoading(false);
                const { width, height } = e.nativeEvent.source;
                if (width > 0 && height > 0) {
                  setAspectRatio(Math.max(0.7, Math.min(2.4, width / height)));
                }
              }}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            />
          ) : (
            <View style={styles.infographicFallbackBox}>
              <Ionicons name="image-outline" size={38} color={emeraldPrimary} />
              <Text style={[styles.infographicFallbackTitle, { color: textDark }]}>
                {alt || 'Curated Study Infographic'}
              </Text>
              <Text style={[styles.infographicFallbackSubtitle, { color: textMuted }]}>
                Tap to inspect high-resolution visual details
              </Text>
            </View>
          )}

          {isLoading && (
            <View style={styles.infographicLoadingOverlay}>
              <ActivityIndicator size="small" color={emeraldPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Caption */}
        {alt ? (
          <View style={[styles.captionRow, { borderTopColor: cardBorder }]}>
            <Text style={[styles.infographicCaptionText, { color: isDark ? '#E2E8F0' : '#2D3748' }]}>
              {alt}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Fullscreen Zoom Modal */}
      <Modal
        visible={isZoomed}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsZoomed(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#142019' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Ionicons name="pie-chart" size={15} color={emeraldPrimary} />
                <Text style={[styles.modalTitleText, { color: textDark }]} numberOfLines={1}>
                  {alt || 'Scientific Diagram'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsZoomed(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={textDark} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalImageWrap}>
              <Image
                source={{ uri }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function MarkdownReader({ content, title, chapterNumber = 1 }: MarkdownReaderProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const chDir = `chapter_${chapterNumber < 10 ? '0' : ''}${chapterNumber}`;
  const apiBase = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}`;

  // 1. Memoize cleaned markdown processing so heavy regex replacements are never re-run during scrolling or micro-renders
  const cleanedMarkdown = useMemo(() => {
    let cleaned = content
      .replace(/base64,\s+/g, 'base64,')
      .replace(/^.*Word count:.*Persona:.*$/gmi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n');

    // 2. Convert HTML <img> tags to Markdown images (essential for Chapter 3 webp/base64 diagrams)
    cleaned = cleaned.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
      const altMatch = match.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : 'Scientific Infographic';
      return `\n\n![${alt}](${src})\n\n`;
    });

    // 3. Resolve relative image paths and safely encode parentheses so markdown-it never truncates URLs
    cleaned = cleaned.replace(
      /^!\[([^\]]*)\]\((.+)\)$/gm,
      (match, alt, rawUrl) => {
        const trimmedUrl = rawUrl.trim();
        if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('data:')) {
          return `![${alt}](${trimmedUrl})`;
        }
        const cleanPath = trimmedUrl.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '');
        const safePath = cleanPath.replace(/\(/g, '%28').replace(/\)/g, '%29');
        return `![${alt}](${apiBase}/${safePath})`;
      }
    );

    return cleaned.trim();
  }, [content, apiBase]);

  const markdownStyles = useMemo(() => ({
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
  }), [isDark, isTablet]);

  const markdownRules = useMemo(() => ({
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

      // Handle relative paths fallback
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const cleanPath = src.replace(/^(\.\.\/)+/, '').replace(/^(\.\/)+/, '');
        const safePath = cleanPath.replace(/\(/g, '%28').replace(/\)/g, '%29');
        imageUri = `${apiBase}/${safePath}`;
      }

      if (!imageUri || typeof imageUri !== 'string' || imageUri.trim().length === 0) {
        return null;
      }

      return (
        <SmartInfographicCard
          key={node.key}
          uri={imageUri}
          alt={alt}
          isDark={isDark}
        />
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
                          backgroundColor: isDark ? '#1F3528' : '#FFFFFF',
                          borderColor: isDark ? '#2D583D' : '#D1EAD8',
                        },
                      ]}
                    >
                      <View style={styles.nodeTopRow}>
                        <View style={styles.nodeStepBadge}>
                          <Text style={styles.nodeStepNumber}>{step.stepNum}</Text>
                        </View>
                        <Text
                          style={[styles.nodeTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}
                          numberOfLines={2}
                        >
                          {step.title}
                        </Text>
                      </View>
                      {step.details ? (
                        <Text
                          style={[styles.nodeDetails, { color: isDark ? '#A6C5B3' : '#64748B' }]}
                          numberOfLines={3}
                        >
                          {step.details}
                        </Text>
                      ) : null}
                    </View>

                    {idx < steps.length - 1 && (
                      <View style={styles.flowchartArrowWrap}>
                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color={isDark ? '#4ADE80' : '#22c55e'}
                        />
                      </View>
                    )}
                  </React.Fragment>
                ))}
              </ScrollView>

              <Text style={styles.flowchartSwipeHint}>Swipe horizontally to trace process steps →</Text>
            </View>
          );
        }
      }

      return (
        <View
          key={node.key}
          style={[
            styles.codeBlockCard,
            {
              backgroundColor: isDark ? '#1A2920' : '#F8F9FA',
              borderColor: isDark ? '#2C4435' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.codeBlockText, { color: isDark ? '#4ADE80' : '#166534' }]}>
            {rawContent.trim()}
          </Text>
        </View>
      );
    },
  }), [apiBase, isDark]);

  return (
    <View style={[styles.container, isTablet && { width: '100%', maxWidth: 760, alignSelf: 'center' }]}>
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
  // High-end Infographic Card Styles
  infographicCard: {
    marginVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  infographicCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infographicBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infographicBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  expandButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infographicImageTouch: {
    width: '100%',
    backgroundColor: '#00000008',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  infographicImage: {
    width: '100%',
    height: '100%',
  },
  infographicLoadingOverlay: {
    ...(StyleSheet.absoluteFill as any),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  infographicFallbackBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infographicFallbackTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  infographicFallbackSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  captionRow: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infographicCaptionText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  // Zoom Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000015',
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  modalTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalImageWrap: {
    width: '100%',
    height: 440,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000008',
  },
  modalImage: {
    width: '100%',
    height: '100%',
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
