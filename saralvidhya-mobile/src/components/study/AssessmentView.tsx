import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { AssessmentQuestion } from '@/services/assessmentService';
import { fetchMockTest } from '@/services/contentService';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

interface AssessmentViewProps {
  subjectId?: string;
  chapterNumber?: number;
  subjectName?: string;
  onFinish?: () => void;
  onBackPress?: () => void;
}

export default function AssessmentView({
  subjectId = 'entomology',
  chapterNumber = 1,
  subjectName = 'Entomology',
  onFinish,
  onBackPress,
}: AssessmentViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [retriesUsedRecord, setRetriesUsedRecord] = useState<Record<string | number, number>>({});
  const [disabledOptionsRecord, setDisabledOptionsRecord] = useState<Record<string | number, number[]>>({});
  const [isAwaitingRetry, setIsAwaitingRetry] = useState(false);
  const [userAnswersRecord, setUserAnswersRecord] = useState<Record<string, number[]>>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [measuredMaxHeight, setMeasuredMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);
    setMeasuredMaxHeight(null);

    fetchMockTest(subjectId, chapterNumber, controller.signal)
      .then((data) => {
        if (isMounted) {
          setQuestions(data?.assessmentQuestions || []);
          setCurrentIndex(0);
          setSelectedOptions([]);
          setIsEvaluated(false);
          setRetriesUsedRecord({});
          setDisabledOptionsRecord({});
          setIsAwaitingRetry(false);
          setUserAnswersRecord({});
          setIsQuizComplete(false);
          setMeasuredMaxHeight(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[AssessmentView] Error fetching mock test:', err);
        }
        if (isMounted) {
          setQuestions([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [subjectId, chapterNumber]);

  const currentQ = questions[currentIndex] || questions[0];
  const questionNumberFormatted = currentIndex + 1 < 10 ? `0${currentIndex + 1}` : `${currentIndex + 1}`;
  const totalQuestions = questions.length;

  // Find the question with the largest text in this chapter's assessment
  const maxQuestionText = useMemo(() => {
    if (!questions || questions.length === 0) return '';
    let longest = '';
    for (const q of questions) {
      if (q.question && q.question.length > longest.length) {
        longest = q.question;
      }
    }
    return longest;
  }, [questions]);

  // Compute initial minimum height proportional to the biggest question
  const dynamicFallbackHeight = useMemo(() => {
    if (!maxQuestionText) return 120;
    // Average line on mobile fits ~36 characters
    const estimatedLines = Math.max(2, Math.ceil(maxQuestionText.length / 36));
    // 36px vertical padding + 26px eyebrow + estimated lines * 25px line height
    return Math.max(110, 64 + estimatedLines * 25);
  }, [maxQuestionText]);

  const dynamicQuestionPanelHeight = measuredMaxHeight || dynamicFallbackHeight;

  const isMultiple = Boolean(
    currentQ?.isMultipleSelect ||
    (Array.isArray(currentQ?.correctAnswers) && currentQ.correctAnswers.length > 1)
  );

  const qKey = currentQ?.id ?? currentIndex;
  const disabledOptionsForCurrentQ = disabledOptionsRecord[qKey] || [];

  const handleSelectOption = (idx: number) => {
    if (isEvaluated) return; // Do not allow changing answers after evaluation
    if (disabledOptionsForCurrentQ.includes(idx)) return; // Do not allow re-selecting a previously wrong option
    Haptics.selectionAsync();

    if (isMultiple) {
      // Toggle selection for Multiple Select (MSQ)
      setSelectedOptions((prev) => {
        if (prev.includes(idx)) {
          return prev.filter((i) => i !== idx);
        } else {
          return [...prev, idx].sort((a, b) => a - b);
        }
      });
    } else {
      // Single Choice (MCQ): select option & check correctness
      const newSelection = [idx];
      setSelectedOptions(newSelection);

      const isCorrect =
        Array.isArray(currentQ?.correctAnswers) &&
        currentQ.correctAnswers.length === 1 &&
        currentQ.correctAnswers.includes(idx);

      const usedRetries = retriesUsedRecord[qKey] || 0;

      if (!isCorrect && usedRetries < 1) {
        // 1st wrong attempt: record this wrong option as disabled & enter retry state
        setDisabledOptionsRecord((prev) => ({
          ...prev,
          [qKey]: Array.from(new Set([...(prev[qKey] || []), idx])),
        }));
        setIsEvaluated(true);
        setIsAwaitingRetry(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Final evaluation (correct on 1st/2nd try or 2nd wrong attempt)
      setIsAwaitingRetry(false);
      setIsEvaluated(true);

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setUserAnswersRecord((prev) => ({
        ...prev,
        [currentQ.id]: newSelection,
      }));
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOptions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Selection Required',
        isMultiple
          ? 'Please select at least one option before submitting.'
          : 'Please select an option before submitting.'
      );
      return;
    }

    const isCorrect =
      Array.isArray(currentQ.correctAnswers) &&
      selectedOptions.length === currentQ.correctAnswers.length &&
      selectedOptions.every((val) => currentQ.correctAnswers.includes(val));

    const usedRetries = retriesUsedRecord[qKey] || 0;

    if (!isCorrect && usedRetries < 1) {
      // 1st wrong attempt for MSQ: disable wrong selected options
      const wrongPicked = selectedOptions.filter(
        (optIdx) => !currentQ.correctAnswers.includes(optIdx)
      );
      if (wrongPicked.length > 0) {
        setDisabledOptionsRecord((prev) => ({
          ...prev,
          [qKey]: Array.from(new Set([...(prev[qKey] || []), ...wrongPicked])),
        }));
      }
      setIsEvaluated(true);
      setIsAwaitingRetry(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsAwaitingRetry(false);
    setIsEvaluated(true);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setUserAnswersRecord((prev) => ({
      ...prev,
      [currentQ.id]: selectedOptions,
    }));
  };

  const handleTryAgainAssessment = () => {
    Haptics.selectionAsync();
    setRetriesUsedRecord((prev) => ({
      ...prev,
      [qKey]: (prev[qKey] || 0) + 1,
    }));
    setIsAwaitingRetry(false);
    setIsEvaluated(false);
    setSelectedOptions([]);
  };

  const goToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;
    Haptics.selectionAsync();
    const targetQ = questions[targetIndex];
    setCurrentIndex(targetIndex);
    const recordedAns = userAnswersRecord[targetQ.id];
    if (recordedAns !== undefined) {
      setSelectedOptions(recordedAns);
      setIsEvaluated(true);
      setIsAwaitingRetry(false);
    } else {
      setSelectedOptions([]);
      setIsEvaluated(false);
      setIsAwaitingRetry(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      setIsQuizComplete(true);
      onFinish?.();
    }
  };

  const handleActionButton = () => {
    if (isAwaitingRetry) {
      handleTryAgainAssessment();
      return;
    }

    if (!isEvaluated) {
      if (isMultiple) {
        handleSubmitAnswer();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Selection Required', 'Please select an option before proceeding.');
      }
    } else {
      handleNext();
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setIsEvaluated(false);
    setRetriesUsedRecord({});
    setDisabledOptionsRecord({});
    setIsAwaitingRetry(false);
    setUserAnswersRecord({});
    setIsQuizComplete(false);
  };

  // DevMode CSS Color Tokens (.mcqFeedbackDarkCorrect & .mcqFeedbackDarkIncorrect)
  // Light Theme:
  // - Background: #f0f7f2
  // - Rectangle badge: #273a31
  // - Breadcrumb: #1f2e29
  // - Header divider: #c7dbcf
  // - Card border: #c7dbcf
  // - Next button: #2b634a, text #ffffff
  // - Footer: #576e61
  // Dark Theme:
  // - Background: #1a2921
  // - Rectangle badge: #ffffff
  // - Breadcrumb: #f0f7f0
  // - Header divider: #4d6e57
  // - Card border: #4d6e57
  // - Card bg: #21362b
  // - Next button: #b2e0c2, text #1a2921
  // - Footer: #bad1bf
  const bg = isDark ? '#2D3E36' : '#FFF6F1';
  const badgeBg = isDark ? '#FFFFFF' : '#273A31';
  const headerTextColor = isDark ? '#F0F7F0' : '#1F2E29';
  const headerRuleColor = isDark ? '#4D6E57' : '#C7DBCF';
  const cardBorder = isDark ? '#4D6E57' : '#C7DBCF';
  const textDark = isDark ? '#F0F7F0' : '#1F2E29';
  const eyebrowColor = isDark ? '#B2E0C2' : '#2B634A';
  const footerTextColor = isDark ? '#BAD1BF' : '#576E61';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ marginTop: 12, color: isDark ? '#BAD1BF' : '#4F7D66', fontSize: 14, fontWeight: '500' }}>
          Loading assessment questions for Chapter {chapterNumber}...
        </Text>
      </View>
    );
  }

  if (!currentQ || questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="document-text-outline" size={48} color={isDark ? '#4ade80' : '#22c55e'} />
        <Text style={{ marginTop: 16, color: textDark, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          No Assessment Questions Available
        </Text>
        <Text style={{ marginTop: 8, color: footerTextColor, fontSize: 13, textAlign: 'center' }}>
          Assessment bank is being compiled for Chapter {chapterNumber}. Please check back soon or try another chapter.
        </Text>
        {onBackPress && (
          <TouchableOpacity
            style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#22c55e', borderRadius: 12 }}
            onPress={onBackPress}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const correctLetterString = Array.isArray(currentQ.correctAnswers)
    ? currentQ.correctAnswers.map((ansIdx) => OPTION_LETTERS[ansIdx] || `${ansIdx + 1}`).join(', ')
    : '';

  const isQuestionCorrect =
    selectedOptions.length > 0 &&
    Array.isArray(currentQ.correctAnswers) &&
    selectedOptions.length === currentQ.correctAnswers.length &&
    selectedOptions.every((val) => currentQ.correctAnswers.includes(val));

  if (isQuizComplete) {
    // Score calculation
    let correctCount = 0;
    questions.forEach((q) => {
      const userAns = userAnswersRecord[q.id] || [];
      const expected = q.correctAnswers;
      if (
        userAns.length === expected.length &&
        userAns.every((val) => expected.includes(val))
      ) {
        correctCount += 1;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);

    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.resultsWrap}>
          <View style={[styles.resultsCard, { borderColor: cardBorder }]}>
            <View style={styles.scoreIconCircle}>
              <Ionicons name="trophy" size={38} color="#265945" />
            </View>
            <Text style={[styles.resultTitle, { color: textDark }]}>Assessment Complete!</Text>
            <Text style={styles.resultScoreText}>
              {correctCount} / {questions.length} Correct ({scorePct}%)
            </Text>
            <Text style={styles.resultSub}>
              {scorePct >= 70
                ? 'Outstanding mastery of insect digestive anatomy!'
                : 'Good attempt. Review the reading guide and try again!'}
            </Text>

            <TouchableOpacity
              style={[styles.retakeButton, { backgroundColor: '#265945' }]}
              onPress={handleRetake}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Retake Assessment</Text>
            </TouchableOpacity>

            {onBackPress && (
              <TouchableOpacity
                style={[styles.backToOverviewBtn, { borderColor: cardBorder }]}
                onPress={onBackPress}
                activeOpacity={0.8}
              >
                <Text style={[styles.backToOverviewText, { color: '#265945' }]}>Back to Practice</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Hidden offscreen layout measurer for the chapter's biggest question */}
      {maxQuestionText ? (
        <View
          style={[
            styles.questionPanel,
            styles.hiddenMeasurePanel,
            {
              width: isTablet
                ? Math.min(Dimensions.get('window').width - 48, 640)
                : Dimensions.get('window').width - 32,
            },
          ]}
          pointerEvents="none"
          onLayout={(e) => {
            const h = Math.ceil(e.nativeEvent.layout.height);
            if (h > 0 && Math.abs(h - (measuredMaxHeight || 0)) > 2) {
              setMeasuredMaxHeight(h);
            }
          }}
        >
          <Text style={styles.questionEyebrow}>QUESTION 01</Text>
          <Text style={styles.questionText}>{maxQuestionText}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* PILLS ROW: Progress Counter */}
        <View style={styles.pillsRow}>
          {/* Progress Pill (.progressChip) */}
          <View
            style={[
              styles.progressPill,
              {
                backgroundColor: isDark ? '#21362B' : '#FFFFFF',
                borderColor: cardBorder,
              },
            ]}
          >
            <Text style={[styles.progressPillText, { color: isDark ? '#F0F7F0' : '#2D3E36' }]}>
              {`${currentIndex + 1} / ${totalQuestions}`}
            </Text>
          </View>
        </View>

        {/* 3. QUESTION CARD (.questionCard) */}
        <View
          style={[
            styles.questionPanel,
            {
              backgroundColor: isDark ? '#21362B' : '#FFFFFF',
              borderColor: cardBorder,
              minHeight: dynamicQuestionPanelHeight,
            },
          ]}
        >
          <Text style={[styles.questionEyebrow, { color: eyebrowColor }]}>
            {`QUESTION ${questionNumberFormatted}`}
          </Text>
          <Text style={[styles.questionText, { color: textDark }]}>
            {currentQ.question}
          </Text>
        </View>

        {/* 4. OPTIONS LIST (A, B, C, D) (.optionA, .optionB, etc.) */}
        <View style={styles.optionsList}>
          {currentQ.options.map((optionText, idx) => {
            const isSelected = selectedOptions.includes(idx);
            const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
            const isCorrectAnswer = currentQ.correctAnswers.includes(idx);
            const isDisabledWrongOption = disabledOptionsForCurrentQ.includes(idx);

            // Feedback states
            const showAsCorrect = isEvaluated && !isAwaitingRetry && isCorrectAnswer;
            const showAsWrong = (isEvaluated && isSelected && !isCorrectAnswer) || isDisabledWrongOption;

            let cardBg = isDark ? '#21362B' : '#FFFFFF';
            let cardBorderColor = isDark ? '#4D6E57' : '#C7DBCF';
            let radioBorderColor = isDark ? '#BAD1BF' : '#576E61';
            let radioInnerColor = 'transparent';
            let letterBg = isDark ? '#304D3B' : '#E3F2E8';
            let letterBorder = isDark ? '#4D6E57' : '#C7DBCF';
            let letterColor = isDark ? '#F0F7F0' : '#1F2E29';

            if (showAsCorrect) {
              cardBg = isDark ? '#214730' : '#E5F7EB';
              cardBorderColor = isDark ? '#59B87A' : '#337A52';
              radioBorderColor = isDark ? '#59B87A' : '#337A52';
              radioInnerColor = isSelected ? (isDark ? '#59B87A' : '#337A52') : 'transparent';
              letterBg = isDark ? '#304D3B' : '#E3F2E8';
              letterBorder = isDark ? '#59B87A' : '#337A52';
              letterColor = isDark ? '#F0F7F0' : '#1F2E29';
            } else if (showAsWrong) {
              cardBg = isDark ? '#4F2B2B' : '#FDF2F0';
              cardBorderColor = isDark ? '#F04A45' : '#D33C30';
              radioBorderColor = isDark ? '#F04A45' : '#D33C30';
              radioInnerColor = isDark ? '#F04A45' : '#D33C30';
              letterBg = isDark ? '#4F2B2B' : '#FCE8E6';
              letterBorder = isDark ? '#F04A45' : '#D33C30';
              letterColor = isDark ? '#FFB8B0' : '#1F2E29';
            } else if (isSelected) {
              cardBorderColor = '#D9A55C';
              radioBorderColor = '#D9A55C';
              radioInnerColor = '#D9A55C';
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorderColor,
                  },
                  isDisabledWrongOption && !isAwaitingRetry && { opacity: 0.5 },
                ]}
                onPress={() => handleSelectOption(idx)}
                disabled={isDisabledWrongOption || isEvaluated}
                activeOpacity={0.85}
              >
                {/* Option Selector: Checkbox for MSQ, Radio Circle for MCQ */}
                {isMultiple ? (
                  <View
                    style={[
                      styles.checkboxBox,
                      {
                        borderColor: radioBorderColor,
                        backgroundColor:
                          showAsCorrect && isSelected
                            ? isDark
                              ? '#214730'
                              : '#E5F7EB'
                            : showAsWrong
                            ? isDark
                              ? '#4F2B2B'
                              : '#FDF2F0'
                            : isSelected
                            ? radioBorderColor
                            : isDark
                            ? '#21362B'
                            : '#FFFFFF',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color={
                          showAsCorrect
                            ? isDark
                              ? '#59B87A'
                              : '#337A52'
                            : showAsWrong
                            ? isDark
                              ? '#F04A45'
                              : '#D33C30'
                            : isDark
                            ? '#1F2E29'
                            : '#FFFFFF'
                        }
                      />
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: radioBorderColor,
                        backgroundColor:
                          showAsCorrect && isSelected
                            ? isDark
                              ? '#214730'
                              : '#E5F7EB'
                            : showAsWrong
                            ? isDark
                              ? '#4F2B2B'
                              : '#FDF2F0'
                            : isDark
                            ? '#21362B'
                            : '#FFFFFF',
                      },
                    ]}
                  >
                    {radioInnerColor !== 'transparent' && (
                      <View
                        style={[
                          styles.radioInnerDot,
                          { backgroundColor: radioInnerColor },
                        ]}
                      />
                    )}
                  </View>
                )}

                {/* Letter Box (.letterBadgeA, .letterBadgeB) */}
                <View
                  style={[
                    styles.letterBox,
                    {
                      backgroundColor: letterBg,
                      borderColor: letterBorder,
                    },
                  ]}
                >
                  <Text style={[styles.letterText, { color: letterColor }]}>{letter}</Text>
                </View>

                {/* Option Text (.optionTextA, .optionTextB) */}
                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? '#F0F7F0' : '#1F2E29' },
                  ]}
                  numberOfLines={2}
                >
                  {optionText}
                </Text>

                {/* Right Status Indicator: Checkmark (✓) or Cross (✕) */}
                {showAsCorrect && (
                  <Text style={[styles.correctCheckIcon, { color: isDark ? '#59B87A' : '#337A52' }]}>
                    ✓
                  </Text>
                )}
                {showAsWrong && (
                  <Text style={[styles.wrongCrossIcon, { color: isDark ? '#F04A45' : '#D33C30' }]}>
                    ✕
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 5. ANSWER FEEDBACK PANEL (.answerFeedbackPanel) */}
        {isEvaluated && (
          <View
            style={[
              styles.answerFeedbackPanel,
              isAwaitingRetry
                ? {
                    backgroundColor: isDark ? 'rgba(254, 243, 199, 0.12)' : '#FEF3C7',
                    borderColor: isDark ? 'rgba(251, 191, 36, 0.4)' : '#FCD34D',
                  }
                : {
                    backgroundColor: isQuestionCorrect
                      ? isDark
                        ? '#214730'
                        : '#E5F7EB'
                      : isDark
                        ? '#573330'
                        : '#FDF2F0',
                    borderColor: isQuestionCorrect
                      ? isDark
                        ? '#59B87A'
                        : '#337A52'
                      : isDark
                        ? '#F04A45'
                        : '#D33C30',
                  },
            ]}
          >
            {isAwaitingRetry ? (
              <View style={styles.feedbackRetryRow}>
                <View style={styles.feedbackRetryTextWrap}>
                  <Text
                    style={[
                      styles.feedbackStatus,
                      { color: isDark ? '#FDE68A' : '#92400E' },
                    ]}
                  >
                    ✕ Incorrect
                  </Text>
                  <Text
                    style={[
                      styles.feedbackRetrySub,
                      { color: isDark ? '#FCD34D' : '#78350F' },
                    ]}
                  >
                    — 1 try-again attempt left
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.assessmentTryAgainBtn,
                    {
                      backgroundColor: isDark ? '#FDE68A' : '#FFFFFF',
                      borderColor: isDark ? '#FDE68A' : '#F59E0B',
                    },
                  ]}
                  onPress={handleTryAgainAssessment}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={13} color={isDark ? '#78350F' : '#92400E'} />
                  <Text
                    style={[
                      styles.assessmentTryAgainBtnText,
                      { color: isDark ? '#78350F' : '#92400E' },
                    ]}
                  >
                    Try Again (1 left)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.feedbackTopRow}>
                  <Text
                    style={[
                      styles.feedbackStatus,
                      {
                        color: isQuestionCorrect
                          ? isDark
                            ? '#59B87A'
                            : '#337A52'
                          : isDark
                            ? '#FF8C82'
                            : '#D33C30',
                      },
                    ]}
                  >
                    {isQuestionCorrect ? '✓  Correct' : '✕  Incorrect'}
                  </Text>
                  <Text
                    style={[
                      styles.correctAnswerLabel,
                      { color: isDark ? '#BAD1BF' : '#1F2E29' },
                    ]}
                  >
                    {`Correct option:  ${correctLetterString}`}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.feedbackExplanation,
                    { color: isDark ? '#F0F7F0' : '#1F2E29' },
                  ]}
                >
                  {currentQ.explanation}
                </Text>
              </>
            )}
          </View>
        )}

        {/* 6. BOTTOM NAVIGATION & SUBMIT ROW */}
        <View style={styles.bottomActionRow}>
          {/* Backward Arrow */}
          <TouchableOpacity
            style={[
              styles.navArrowBtn,
              {
                backgroundColor: isDark ? '#21362B' : '#FFFFFF',
                borderColor: isDark ? '#4D6E57' : '#C7DBCF',
              },
              currentIndex === 0 && styles.navArrowBtnDisabled,
            ]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Previous question"
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={currentIndex === 0 ? (isDark ? '#4A6356' : '#A6C5B3') : (isDark ? '#F0F7F0' : '#1C2E24')}
            />
          </TouchableOpacity>

          {/* Submit / Next / Finish / Try Again Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isAwaitingRetry
                  ? '#D9A55C'
                  : !isEvaluated
                  ? isMultiple
                    ? selectedOptions.length === 0
                      ? isDark
                        ? '#2A2318'
                        : '#E8DFD3'
                      : '#D9A55C'
                    : isDark
                      ? '#1E3328'
                      : '#DCE8E0'
                  : '#265945',
              },
            ]}
            onPress={handleActionButton}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.submitButtonText,
                {
                  color: isAwaitingRetry
                    ? '#FFFFFF'
                    : !isEvaluated
                    ? isMultiple
                      ? selectedOptions.length === 0
                        ? isDark
                          ? '#7A6B56'
                          : '#94836D'
                        : '#FFFFFF'
                      : isDark
                        ? '#4A6956'
                        : '#88A394'
                    : '#FFFFFF',
                },
              ]}
            >
              {isAwaitingRetry
                ? 'Try Again (1 left)'
                : isMultiple && !isEvaluated
                ? 'Submit'
                : currentIndex === questions.length - 1
                ? 'Finish Assessment'
                : 'Next'}
            </Text>
          </TouchableOpacity>

          {/* Forward Arrow */}
          <TouchableOpacity
            style={[
              styles.navArrowBtn,
              {
                backgroundColor: isDark ? '#21362B' : '#FFFFFF',
                borderColor: isDark ? '#4D6E57' : '#C7DBCF',
              },
              currentIndex === questions.length - 1 && styles.navArrowBtnDisabled,
            ]}
            onPress={handleNextQuestion}
            disabled={currentIndex === questions.length - 1}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Next question"
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={currentIndex === questions.length - 1 ? (isDark ? '#4A6356' : '#A6C5B3') : (isDark ? '#F0F7F0' : '#1C2E24')}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  tabletContent: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  /* 1. Header (.rectangleParent, .subjectBreadcrumb, .headerRule) */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: 28,
    height: 28,
  },
  subjectBreadcrumb: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  themeToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRule: {
    height: 1,
    width: '100%',
    marginBottom: 14,
  },
  /* 2. Pills Row */
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  progressPill: {
    height: 29,
    minWidth: 66,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D3E36',
  },
  /* 3. Question Panel (.questionPanel) */
  questionPanel: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  hiddenMeasurePanel: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    opacity: 0,
    zIndex: -10,
  },
  questionEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  /* 4. Options Cards (.optionA, .optionBSelected) */
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  optionCardSelected: {
    borderWidth: 1.5,
    borderColor: '#336B54',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#336B54',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D3E36',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  correctCheckIcon: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 6,
  },
  wrongCrossIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 6,
  },
  /* 5. Answer Feedback Panel (.answerFeedbackPanel) */
  answerFeedbackPanel: {
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 8,
  },
  feedbackTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedbackStatus: {
    fontSize: 14,
    fontWeight: '700',
  },
  correctAnswerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackExplanation: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  feedbackRetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  feedbackRetryTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  feedbackRetrySub: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  assessmentTryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  assessmentTryAgainBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  /* 6. Bottom Navigation & Submit Row */
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    width: '100%',
  },
  navArrowBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    flexShrink: 0,
  },
  navArrowBtnDisabled: {
    opacity: 0.28,
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  /* 7. Footer (.questionFooter) */
  questionFooter: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  /* Results View */
  resultsWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 4,
  },
  scoreIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  resultScoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#265945',
  },
  resultSub: {
    fontSize: 12.5,
    color: '#596B66',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  retakeButton: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  backToOverviewBtn: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 4,
  },
  backToOverviewText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
