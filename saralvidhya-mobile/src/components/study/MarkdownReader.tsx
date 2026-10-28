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
import { Image as ExpoImage } from 'expo-image';
import { useDynamicImageLoad } from '@/services/imageConcurrencyService';
import { getTermDefinition, COMPILED_GLOSSARY_REGEX } from '@/data/glossaryTerms';
import ZoomableImageModal from './ZoomableImageModal';

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
  index?: number;
  onExpand?: (uri: string, alt?: string) => void;
}

const SmartInfographicCard = React.memo(function SmartInfographicCard({
  uri,
  alt,
  isDark,
  index = 0,
  onExpand,
}: SmartInfographicCardProps) {
  const { shouldLoad, onLoaded, onError } = useDynamicImageLoad(uri, index);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cardBg = isDark ? '#1C2B23' : '#FFFFFF';
  const cardBorder = isDark ? '#2D4538' : '#D1E3D9';
  const emeraldPrimary = '#05996B';
  const textDark = isDark ? '#FFFFFF' : '#172933';
  const textMuted = isDark ? '#A6C5B3' : '#637375';

  const handleExpand = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    onExpand?.(uri, alt);
  };

  return (
    <View style={[styles.infographicCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Image Touch Area with Dynamic Concurrency Loading */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handleExpand}
        style={[styles.infographicImageTouch, { aspectRatio: 16 / 10 }]}
      >
        {!shouldLoad ? (
          // Waiting in concurrency queue: lightweight skeleton placeholder, zero network load
          <View style={styles.infographicSkeletonBox}>
            <ActivityIndicator size="small" color={emeraldPrimary} />
          </View>
        ) : !hasError ? (
          // Active slot granted: hardware accelerated Glide/SDWebImage load with memory-disk caching
          <ExpoImage
            source={{ uri }}
            style={styles.infographicImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority={index < 3 ? 'high' : 'normal'}
            recyclingKey={uri}
            transition={200}
            onLoad={() => {
              setIsLoading(false);
              onLoaded();
            }}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
              onError();
            }}
          />
        ) : (
          <View style={styles.infographicFallbackBox}>
            <Ionicons name="image-outline" size={38} color={emeraldPrimary} />
          </View>
        )}

        {shouldLoad && isLoading && !hasError && (
          <View style={styles.infographicLoadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={emeraldPrimary} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

interface ContentSegment {
  type: 'markdown' | 'image';
  content?: string;
  uri?: string;
  alt?: string;
  index?: number;
}

export default function MarkdownReader({ content, title, chapterNumber = 1 }: MarkdownReaderProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const [zoomedImage, setZoomedImage] = useState<{ uri: string; alt?: string } | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ term: string; definition: string } | null>(null);

  const handleTermPress = React.useCallback((term: string, definition: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
    setActiveTooltip({ term, definition });
  }, []);

  const chDir = `chapter_${chapterNumber < 10 ? '0' : ''}${chapterNumber}`;
  const apiBase = `${GCS_API_BASE}/api/content/angrau/entomology/${chDir}`;

  // 1. Memoize cleaned markdown processing so heavy regex replacements are never re-run during scrolling
  const cleanedMarkdown = useMemo(() => {
    let cleaned = content;

    // A. Strip duplicate top headers & metadata lines (since chapter number & name are already prominently shown in the app header)
    cleaned = cleaned
      .replace(/^#\s*Quick Study Guide:?.*$/gmi, '')
      .replace(/^#\s*Detailed (Study )?Notes:?.*$/gmi, '')
      .replace(/^#\s*Chapter\s*\d+:?.*$/gmi, '')
      .replace(/^\*\*Subject:\*\*.*$/gmi, '')
      .replace(/^\*\*Audience Level:\*\*.*$/gmi, '')
      .replace(/^\*\*Target Bloom.*$/gmi, '')
      .replace(/^.*Word count:.*Persona:.*$/gmi, '');

    // A2. Strip leading section heading if it repeats the section title passed into MarkdownReader
    if (title && title.trim()) {
      const cleanT = title.trim();
      const escaped = cleanT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(
        new RegExp(`^\\s*(?:#{1,4}\\s+|\\*\\*\\s*)?${escaped}(?:\\s*\\*\\*)?\\s*(?:\\r?\\n)+`, 'i'),
        ''
      );
    }

    // B. Fix base64 padding & strip comments
    cleaned = cleaned
      .replace(/base64,\s+/g, 'base64,')
      .replace(/<!--[\s\S]*?-->/g, '');

    // C. Normalize unicode smart/curly quotes often used in HTML attributes: <div align=“center” style=“margin: 24px 0;”>
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    // D. Convert HTML <img> tags to Markdown images before stripping container tags
    cleaned = cleaned.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
      const altMatch = match.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : 'Scientific Infographic';
      return `\n\n![${alt}](${src})\n\n`;
    });

    // E. Convert inline formatting HTML tags into standard Markdown
    cleaned = cleaned
      .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/gi, '\n*$1*\n')
      .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

    // F. Strip all container and structural HTML tags (e.g. <div align="center" ...>, </div>, <center>, <span>, etc.)
    cleaned = cleaned.replace(/<\/?(div|center|span|figure|section|font|header|footer)\b[^>]*>/gi, '\n');
    cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

    // G. Strip any residual raw HTML tags (ensures no <div ...> or <p ...> can ever leak into rendered text)
    cleaned = cleaned.replace(/<\/?[a-z][a-z0-9_-]*(\s+[^>]*)?\/?>/gi, '');

    // H. Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // I. Resolve relative image paths and safely encode parentheses so markdown URLs are well-formed
    cleaned = cleaned.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
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

    // J. Strip leading horizontal rules or blank lines left after stripping the top title
    cleaned = cleaned.replace(/^\s*(---|___|\*\*\*)\s*/, '');

    return cleaned.trim();
  }, [content, apiBase]);

  // 2. Segment document into alternating pure Markdown text blocks and standalone Infographic Cards
  // This completely eliminates nesting View/TouchableOpacity inside react-native-markdown-display's <Text>
  const segments = useMemo(() => {
    const list: ContentSegment[] = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let imgIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = imageRegex.exec(cleanedMarkdown)) !== null) {
      const textChunk = cleanedMarkdown.substring(lastIndex, match.index).trim();
      if (textChunk.length > 0) {
        list.push({
          type: 'markdown',
          content: textChunk,
        });
      }

      list.push({
        type: 'image',
        alt: match[1] || 'Scientific Infographic',
        uri: match[2].trim(),
        index: imgIdx++,
      });

      lastIndex = match.index + match[0].length;
    }

    const tail = cleanedMarkdown.substring(lastIndex).trim();
    if (tail.length > 0) {
      list.push({
        type: 'markdown',
        content: tail,
      });
    }

    return list;
  }, [cleanedMarkdown]);

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
    // Interactive Glossary Terms Highlight (Green dotted underline with tap-to-define popover)
    text: (node: any, children: any, parent: any, styles: any, inheritedStyles = {}) => {
      const rawText = node.content;
      if (!rawText || typeof rawText !== 'string' || rawText.length < 3) {
        return (
          <Text key={node.key} style={[inheritedStyles, styles.text]}>
            {rawText}
          </Text>
        );
      }

      const parts = rawText.split(COMPILED_GLOSSARY_REGEX);
      if (parts.length <= 1) {
        return (
          <Text key={node.key} style={[inheritedStyles, styles.text]}>
            {rawText}
          </Text>
        );
      }

      return (
        <Text key={node.key} style={[inheritedStyles, styles.text]}>
          {parts.map((part, idx) => {
            const def = getTermDefinition(part);
            if (def) {
              return (
                <Text
                  key={`${node.key}_term_${idx}`}
                  style={[
                    styles.text,
                    inheritedStyles,
                    {
                      textDecorationLine: 'underline',
                      textDecorationStyle: 'dotted',
                      textDecorationColor: isDark ? '#4ADE80' : '#16A34A',
                      color: isDark ? '#FFFFFF' : '#111827',
                      fontWeight: (inheritedStyles as any)?.fontWeight || '600',
                    },
                  ]}
                  onPress={() => handleTermPress(part, def)}
                  suppressHighlighting={false}
                >
                  {part}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    },

    // Safe textgroup rule prevents any nested Views from being forced inside Text
    textgroup: (node: any, children: any, parent: any, styles: any) => {
      const hasBlockChild = node.children?.some(
        (c: any) => c.type === 'image' || c.type === 'fence' || c.type === 'blocklink'
      );
      if (hasBlockChild) {
        return (
          <View key={node.key} style={{ width: '100%' }}>
            {children}
          </View>
        );
      }
      return (
        <Text key={node.key} style={styles.textgroup}>
          {children}
        </Text>
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
                nestedScrollEnabled={true}
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
  }), [isDark, handleTermPress]);

  return (
    <View style={[styles.container, isTablet && { width: '100%', maxWidth: 760, alignSelf: 'center' }]}>
      <View style={styles.markdownWrapper}>
        {segments.map((seg, idx) => {
          if (seg.type === 'image' && seg.uri) {
            return (
              <SmartInfographicCard
                key={`infographic_${idx}_${seg.uri}`}
                uri={seg.uri}
                alt={seg.alt}
                isDark={isDark}
                index={seg.index ?? 0}
                onExpand={(u, a) => setZoomedImage({ uri: u, alt: a })}
              />
            );
          }
          if (seg.type === 'markdown' && seg.content) {
            return (
              <Markdown
                key={`md_${idx}`}
                rules={markdownRules}
                style={markdownStyles}
              >
                {seg.content}
              </Markdown>
            );
          }
          return null;
        })}
      </View>

      {/* Single On-Demand Fullscreen Interactive Zoom Modal for Infographics */}
      <ZoomableImageModal
        visible={Boolean(zoomedImage)}
        imageSource={{ uri: zoomedImage?.uri || '' }}
        title={zoomedImage?.alt || 'Scientific Infographic'}
        subtitle="Pinch, pan, or double-tap to zoom into fine details"
        onClose={() => setZoomedImage(null)}
      />

      {/* Interactive Glossary Concept Definition Tooltip Popover */}
      {activeTooltip && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveTooltip(null)}
        >
          <TouchableOpacity
            style={styles.tooltipBackdrop}
            activeOpacity={1}
            onPress={() => setActiveTooltip(null)}
          >
            <View
              style={[
                styles.tooltipCard,
                {
                  backgroundColor: isDark ? '#172B20' : '#FFFFFF',
                  borderColor: isDark ? '#2B4A37' : '#D1E6DA',
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {/* Header with Key Concept Badge & Close Icon */}
              <View style={styles.tooltipHeader}>
                <View
                  style={[
                    styles.tooltipBadge,
                    { backgroundColor: isDark ? 'rgba(74, 222, 128, 0.16)' : '#E8F5EE' },
                  ]}
                >
                  <Ionicons name="sparkles" size={13} color={isDark ? '#4ADE80' : '#16A34A'} />
                  <Text
                    style={[
                      styles.tooltipBadgeText,
                      { color: isDark ? '#4ADE80' : '#16A34A' },
                    ]}
                  >
                    KEY CONCEPT
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setActiveTooltip(null)}
                  style={styles.tooltipCloseBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={18} color={isDark ? '#A6C5B3' : '#64748B'} />
                </TouchableOpacity>
              </View>

              {/* Term Title */}
              <Text
                style={[
                  styles.tooltipTermTitle,
                  { color: isDark ? '#4ADE80' : '#15803D' },
                ]}
              >
                {activeTooltip.term.charAt(0).toUpperCase() + activeTooltip.term.slice(1)}
              </Text>

              {/* Definition Text */}
              <Text
                style={[
                  styles.tooltipDefinition,
                  { color: isDark ? '#E2E8F0' : '#334155' },
                ]}
              >
                {activeTooltip.definition}
              </Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  infographicSkeletonBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00000005',
    width: '100%',
    height: '100%',
  },
  infographicQueuedText: {
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
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
  // Glossary Definition Tooltip Popover Styles
  tooltipBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tooltipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tooltipBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tooltipCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipTermTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  tooltipDefinition: {
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 4,
  },
});
