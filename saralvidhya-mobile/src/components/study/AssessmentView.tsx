import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import {
  SAMPLE_ASSESSMENT_QUESTIONS,
  AssessmentQuestion,
} from '@/services/assessmentService';

const PLANT_BADGE = require('@/assets/images/entomology_plant_badge.png');

interface AssessmentViewProps {
  chapterNumber?: number;
  subjectName?: string;
  onFinish?: () => void;
  onBackPress?: () => void;
}

export default function AssessmentView({
  chapterNumber = 1,
  subjectName = 'Entomology',
  onFinish,
  onBackPress,
}: AssessmentViewProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const questions: AssessmentQuestion[] =
    SAMPLE_ASSESSMENT_QUESTIONS[chapterNumber] || SAMPLE_ASSESSMENT_QUESTIONS[1];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [userAnswersRecord, setUserAnswersRecord] = useState<Record<string, number[]>>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];
  const questionNumberFormatted = currentIndex + 1 < 10 ? `0${currentIndex + 1}` : `${currentIndex + 1}`;
  const totalQuestions = questions.length >= 20 ? questions.length : 20;

  const handleSelectOption = (idx: number) => {
    Haptics.selectionAsync();
    const newSelected = [idx];
    setSelectedOptions(newSelected);
    setIsEvaluated(true);

    const isCorrect = currentQ.correctAnswers.includes(idx);
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setUserAnswersRecord((prev) => ({
      ...prev,
      [currentQ.id]: newSelected,
    }));
  };

  const handleNext = () => {
    if (!isEvaluated && selectedOptions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Selection Required', 'Please select an option to proceed.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptions([]);
      setIsEvaluated(false);
    } else {
      setIsQuizComplete(true);
      onFinish?.();
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(0);
    setSelectedOptions([]);
    setIsEvaluated(false);
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

  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];
  const correctLetterString = currentQ.correctAnswers
    .map((ansIdx) => OPTION_LETTERS[ansIdx] || `${ansIdx + 1}`)
    .join(', ');

  const isQuestionCorrect =
    selectedOptions.length > 0 &&
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. APP HEADER (.rectangleParent & .subjectBreadcrumb & .headerRule) */}
        <View style={styles.headerRow}>
          {onBackPress ? (
            <TouchableOpacity
              style={[styles.backBtn, { borderColor: cardBorder }]}
              onPress={onBackPress}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={18} color={headerTextColor} />
            </TouchableOpacity>
          ) : null}

          {/* Plant Emblem Square (.rectangleParent) */}
          <View style={[styles.badgeSquare, { backgroundColor: badgeBg }]}>
            <Image source={PLANT_BADGE} style={styles.badgeImage} resizeMode="contain" />
          </View>

          {/* Subject Breadcrumb (.subjectBreadcrumb) */}
          <Text style={[styles.subjectBreadcrumb, { color: headerTextColor }]}>
            {`${subjectName}  ·  Chapter ${chapterNumber}`}
          </Text>
        </View>

        {/* 1px Horizontal Rule (.headerRule) */}
        <View style={[styles.headerRule, { backgroundColor: headerRuleColor }]} />

        {/* 2. PILLS ROW: Progress | Question Type | Difficulty */}
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

          {/* Question Type Pill (.questionTypeChip) */}
          <View
            style={[
              styles.questionTypePill,
              {
                backgroundColor: isDark ? '#304D3B' : '#E3F2E8',
                borderColor: cardBorder,
              },
            ]}
          >
            <Text style={[styles.typeDotIcon, { color: isDark ? '#F0F7F0' : '#2D3E36' }]}>◉</Text>
            <Text style={[styles.typeLabelText, { color: isDark ? '#F0F7F0' : '#2D3E36' }]}>
              {currentQ.isMultipleSelect ? 'Multiple Select' : 'Single Choice (MCQ)'}
            </Text>
          </View>

          {/* Difficulty Pill (.difficultyChip) */}
          <View
            style={[
              styles.difficultyPill,
              {
                backgroundColor: isDark ? '#304D3B' : '#E3F2E8',
                borderColor: cardBorder,
                borderWidth: isDark ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.difficultyLabelText, { color: isDark ? '#F0F7F0' : '#2D3E36' }]}>
              {currentQ.difficulty || 'Easy'}
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

            // Feedback states
            const showAsCorrect = isEvaluated && isCorrectAnswer;
            const showAsWrong = isEvaluated && isSelected && !isCorrectAnswer;

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
              cardBorderColor = isDark ? '#59B87A' : '#337A52';
              radioBorderColor = isDark ? '#59B87A' : '#337A52';
              radioInnerColor = isDark ? '#59B87A' : '#337A52';
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
                ]}
                onPress={() => handleSelectOption(idx)}
                activeOpacity={0.85}
              >
                {/* Circular Radio Indicator (.radioA, .radioB) */}
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
              {
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
          </View>
        )}

        {/* 6. NEXT BUTTON (.nextQuestionButton) */}
        <View style={styles.nextBtnWrap}>
          <TouchableOpacity
            style={[
              styles.nextQuestionButton,
              { backgroundColor: isDark ? '#B2E0C2' : '#2B634A' },
            ]}
            onPress={handleNext}
            activeOpacity={0.88}
          >
            <Text
              style={[
                styles.nextQuestionLabel,
                { color: isDark ? '#1A2921' : '#FFFFFF' },
              ]}
            >
              {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 7. FOOTER (.questionFooter) */}
        <Text style={[styles.questionFooter, { color: footerTextColor }]}>
          {`${totalQuestions} questions  ·  Chapter ${chapterNumber}`}
        </Text>

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
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressPill: {
    height: 29,
    width: 66,
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
  questionTypePill: {
    height: 29,
    borderRadius: 14,
    backgroundColor: '#E8F2EB',
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDotIcon: {
    fontSize: 11,
    color: '#2D3E36',
  },
  typeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2D3E36',
  },
  difficultyPill: {
    height: 29,
    width: 62,
    borderRadius: 14,
    backgroundColor: '#D6E5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D3E36',
  },
  /* 3. Question Panel (.questionPanel) */
  questionPanel: {
    minHeight: 180,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
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
  /* 6. Next Button (.nextQuestionButton) */
  nextBtnWrap: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  nextQuestionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2B634A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  nextQuestionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
