import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { QuickCheckQuestion } from '@/data/quickCheckData';

interface QuickCheckCardProps {
  questions: QuickCheckQuestion[];
  sectionNumber: number;
  totalSections: number;
  sectionTitle?: string;
  nextSectionTitle?: string;
  onNextSection?: () => void;
  onAnswerSubmitted?: (isCorrect: boolean, selectedKey: string, questionIndex: number) => void;
}

export default function QuickCheckCard({
  questions,
  sectionNumber,
  totalSections,
  sectionTitle,
  nextSectionTitle,
  onNextSection,
  onAnswerSubmitted,
}: QuickCheckCardProps) {
  const { isDark } = useAppTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [retriesUsedByQ, setRetriesUsedByQ] = useState<Record<number, number>>({});
  const [pendingWrongByQ, setPendingWrongByQ] = useState<Record<number, string | null>>({});

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  const selectedKey = selectedAnswers[currentQuestionIndex] || null;
  const pendingWrongKey = pendingWrongByQ[currentQuestionIndex] || null;
  const isPendingRetry = Boolean(pendingWrongKey);
  const isSubmitted = Boolean(selectedKey);

  const totalQuestions = questions.length;
  const canGoPrev = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < totalQuestions - 1;

  const handlePrev = () => {
    if (canGoPrev) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSelectOption = (key: string, isCorrect: boolean) => {
    if (isSubmitted || isPendingRetry) return;

    const usedRetries = retriesUsedByQ[currentQuestionIndex] || 0;
    if (!isCorrect && usedRetries < 1) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } catch {}
      setPendingWrongByQ((prev) => ({ ...prev, [currentQuestionIndex]: key }));
      return;
    }

    setPendingWrongByQ((prev) => ({ ...prev, [currentQuestionIndex]: null }));

    try {
      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } catch {}

    const updated = { ...selectedAnswers, [currentQuestionIndex]: key };
    setSelectedAnswers(updated);
    onAnswerSubmitted?.(isCorrect, key, currentQuestionIndex);
  };

  const handleTryAgain = () => {
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {}
    setRetriesUsedByQ((prev) => ({
      ...prev,
      [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + 1,
    }));
    setPendingWrongByQ((prev) => ({ ...prev, [currentQuestionIndex]: null }));
  };

  // Theme colors
  const cardBg = isDark ? '#1A2920' : '#FFFFFF';
  const cardBorder = isDark ? '#2E4738' : '#CFDFD5';
  const titleColor = isDark ? '#FFFFFF' : '#0F172A';
  const textMuted = isDark ? '#A6C5B3' : '#64748B';
  const optionDefaultBg = isDark ? '#14221A' : '#FAFCFA';
  const optionDefaultBorder = isDark ? '#273D30' : '#E2E8F0';
  const optionTextColor = isDark ? '#E2E8F0' : '#1E293B';
  const headerPillBg = isDark ? '#1E3B2C' : '#DCFCE7';
  const headerPillText = isDark ? '#4ADE80' : '#2D473B';

  const answeredCount = Object.keys(selectedAnswers).length;
  const allAnswered = answeredCount >= totalQuestions;

  // Normalized correct key
  const cleanCorrectKey = (
    currentQuestion.correct_answer ||
    currentQuestion.options.find((o) => o.is_correct)?.key ||
    'A'
  ).trim().toUpperCase();

  const isUserCorrect = selectedKey === cleanCorrectKey;
  const hasNextSection = sectionNumber < totalSections && Boolean(onNextSection);

  // Shorten section title for pill display
  const displaySectionTitle = (sectionTitle || `SECTION ${sectionNumber}`)
    .replace(/^Module\s*\d+\s*:\s*/i, '')
    .replace(/^#+\s*/, '')
    .toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* 1. Header: Badge & Counter */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.headerPill, { backgroundColor: headerPillBg }]}>
            <Ionicons name="flash" size={13} color={headerPillText} />
            <Text style={[styles.headerPillText, { color: headerPillText }]}>
              Quick Check
            </Text>
          </View>

          <View style={[styles.counterPill, { backgroundColor: isDark ? '#22382B' : '#F1F5F9' }]}>
            <Text style={[styles.counterText, { color: textMuted }]}>
              {currentQuestionIndex + 1}/{totalQuestions}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Question Stem */}
      <View style={styles.stemContainer}>
        <Text style={[styles.questionNumberText, { color: isDark ? '#4ADE80' : '#2D473B' }]}>
          {currentQuestionIndex + 1}.{' '}
        </Text>
        <Text style={[styles.stemText, { color: titleColor }]}>
          {currentQuestion.stem}
        </Text>
      </View>

      {/* 3. Options List */}
      <View style={styles.optionsList}>
        {currentQuestion.options.map((opt, optIdx) => {
          const optKey = (opt.key || String.fromCharCode(65 + optIdx)).toUpperCase();
          const isSelected = selectedKey === optKey;
          const isPendingWrong = pendingWrongKey === optKey;
          const isCorrect = optKey === cleanCorrectKey;

          let optBorder = optionDefaultBorder;
          let optBg = optionDefaultBg;
          let optBadgeBg = isDark ? '#22382B' : '#EDF2F0';
          let optBadgeText = isDark ? '#A6C5B3' : '#475569';
          let textColor = optionTextColor;

          if (isSubmitted) {
            if (isCorrect) {
              optBorder = '#16A34A';
              optBg = isDark ? '#143322' : '#F0FDF4';
              optBadgeBg = '#16A34A';
              optBadgeText = '#FFFFFF';
              textColor = isDark ? '#86EFAC' : '#15803D';
            } else if (isSelected && !isCorrect) {
              optBorder = '#EF4444';
              optBg = isDark ? '#331717' : '#FEF2F2';
              optBadgeBg = '#EF4444';
              optBadgeText = '#FFFFFF';
              textColor = isDark ? '#FCA5A5' : '#B91C1C';
            }
          } else if (isPendingRetry && isPendingWrong) {
            optBorder = '#EF4444';
            optBg = isDark ? '#331717' : '#FEF2F2';
            optBadgeBg = '#EF4444';
            optBadgeText = '#FFFFFF';
            textColor = isDark ? '#FCA5A5' : '#B91C1C';
          }

          return (
            <TouchableOpacity
              key={optKey}
              style={[
                styles.optionRow,
                {
                  backgroundColor: optBg,
                  borderColor: optBorder,
                  borderWidth:
                    (isSubmitted && (isCorrect || isSelected)) || (isPendingRetry && isPendingWrong)
                      ? 2
                      : 1.5,
                },
              ]}
              onPress={() => handleSelectOption(optKey, isCorrect)}
              disabled={isSubmitted || isPendingRetry}
              activeOpacity={0.8}
            >
              {/* Option Letter Badge (A, B, C, D) */}
              <View
                style={[
                  styles.optionLetterBadge,
                  {
                    backgroundColor: optBadgeBg,
                  },
                ]}
              >
                <Text style={[styles.optionLetterText, { color: optBadgeText }]}>
                  {optKey}
                </Text>
              </View>

              <Text style={[styles.optionBodyText, { color: textColor }]}>
                {opt.text}
              </Text>

              {/* Status Icon Indicator when submitted or pending retry */}
              {isSubmitted && isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              )}
              {isSubmitted && isSelected && !isCorrect && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
              {isPendingRetry && isPendingWrong && (
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pending Retry Banner (shown on 1st wrong attempt only) */}
      {isPendingRetry && (
        <View
          style={[
            styles.retryBanner,
            {
              backgroundColor: isDark ? 'rgba(254, 243, 199, 0.12)' : '#FEF3C7',
              borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : '#FCD34D',
            },
          ]}
        >
          <View style={styles.retryBannerTextWrap}>
            <Text style={[styles.retryBannerText, { color: isDark ? '#FDE68A' : '#78350F' }]}>
              ✕ Not quite right — you have 1 retry attempt remaining.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.tryAgainButton,
              {
                backgroundColor: isDark ? '#FDE68A' : '#FFFFFF',
                borderColor: isDark ? '#FDE68A' : '#F59E0B',
              },
            ]}
            onPress={handleTryAgain}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={13} color={isDark ? '#78350F' : '#92400E'} />
            <Text style={[styles.tryAgainButtonText, { color: isDark ? '#78350F' : '#92400E' }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Diagnostic Rationale / Explanation Box */}
      {isSubmitted && (
        <View
          style={[
            styles.rationaleBox,
            {
              backgroundColor: isDark ? '#14221A' : '#F8FAFC',
              borderColor: isDark ? '#22382B' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.rationaleHeader}>
            <Ionicons
              name={isUserCorrect ? 'checkmark-circle' : 'information-circle'}
              size={18}
              color={isUserCorrect ? '#16A34A' : '#EAB308'}
            />
            <Text
              style={[
                styles.rationaleTitle,
                { color: isUserCorrect ? '#16A34A' : isDark ? '#FDE047' : '#B45309' },
              ]}
            >
              Explanation
            </Text>
          </View>
          <Text style={[styles.rationaleText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
            {currentQuestion.rationale}
          </Text>
        </View>
      )}

      {/* Bottom Question Navigation Controls (< Question 2 of 4 >) */}
      {totalQuestions > 1 && (
        <View style={styles.bottomNavRow}>
          <TouchableOpacity
            style={[
              styles.navArrowBtn,
              {
                borderColor: isDark ? '#2E4738' : '#E2E8F0',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                opacity: canGoPrev ? 1 : 0.35,
              },
            ]}
            onPress={handlePrev}
            disabled={!canGoPrev}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Previous Question"
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={isDark ? '#E2E8F0' : '#475569'}
            />
          </TouchableOpacity>

          <Text style={[styles.bottomCounterText, { color: textMuted }]}>
            Question {currentQuestionIndex + 1}/{totalQuestions}
          </Text>

          <TouchableOpacity
            style={[
              styles.navArrowBtn,
              {
                borderColor: isDark ? '#2E4738' : '#E2E8F0',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                opacity: canGoNext ? 1 : 0.35,
              },
            ]}
            onPress={handleNext}
            disabled={!canGoNext}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
            accessibilityLabel="Next Question"
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={isDark ? '#E2E8F0' : '#475569'}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Navigation Footer: Next Section Button */}
      {hasNextSection && (
        <View style={styles.footerRow}>
          <TouchableOpacity
            style={[styles.nextSectionBtn, { backgroundColor: '#147A43' }]}
            onPress={onNextSection}
            activeOpacity={0.85}
          >
            <View style={styles.nextSectionContent}>
              <Text style={styles.nextSectionSub}>
                NEXT · SECTION {sectionNumber + 1}/{totalSections}
              </Text>
              <Text style={styles.nextSectionTitle} numberOfLines={1}>
                {nextSectionTitle ? `${nextSectionTitle} →` : 'Continue Reading →'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    marginVertical: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    gap: 6,
    maxWidth: '82%',
  },
  headerPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  counterPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  counterText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  navButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  bottomCounterText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  stemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '800',
  },
  stemText: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 22,
  },
  optionsList: {
    gap: 10,
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
  },
  optionLetterBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetterText: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionBodyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  rationaleBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
    gap: 6,
  },
  retryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 2,
    marginBottom: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  retryBannerTextWrap: {
    flex: 1,
    minWidth: 180,
  },
  retryBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    lineHeight: 18,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  tryAgainButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rationaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rationaleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rationaleText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  nextSectionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    shadowColor: '#147A43',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  nextSectionContent: {
    alignItems: 'flex-end',
  },
  nextSectionSub: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#BBF7D0',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nextSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
});
