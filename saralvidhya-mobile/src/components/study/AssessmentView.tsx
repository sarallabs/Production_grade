import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import {
  SAMPLE_ASSESSMENT_QUESTIONS,
  AssessmentQuestion,
} from '@/services/assessmentService';
import AssessmentCompleteView from './AssessmentCompleteView';
import { BorderRadius, Spacing } from '@/constants/theme';

interface AssessmentViewProps {
  chapterNumber: number;
}

export default function AssessmentView({ chapterNumber }: AssessmentViewProps) {
  const { isDark } = useAppTheme();
  const questions: AssessmentQuestion[] =
    SAMPLE_ASSESSMENT_QUESTIONS[chapterNumber] || SAMPLE_ASSESSMENT_QUESTIONS[1];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswersRecord, setUserAnswersRecord] = useState<Record<string, number[]>>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);

  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;

    Haptics.selectionAsync();
    if (currentQ.isMultipleSelect) {
      if (selectedOptions.includes(idx)) {
        setSelectedOptions(selectedOptions.filter((i) => i !== idx));
      } else {
        setSelectedOptions([...selectedOptions, idx]);
      }
    } else {
      setSelectedOptions([idx]);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedOptions.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Selection Required', 'Please select at least one option.');
      return;
    }

    const expected = currentQ.correctAnswers;
    const isCorrect =
      selectedOptions.length === expected.length &&
      selectedOptions.every((idx) => expected.includes(idx));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setIsAnswerSubmitted(true);
    setUserAnswersRecord((prev) => ({
      ...prev,
      [currentQ.id]: selectedOptions,
    }));
  };

  const handleNextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptions([]);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizComplete(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedOptions([]);
    setIsAnswerSubmitted(false);
    setUserAnswersRecord({});
    setIsQuizComplete(false);
  };

  if (isQuizComplete) {
    return (
      <AssessmentCompleteView
        questions={questions}
        userAnswers={userAnswersRecord}
        chapterNumber={chapterNumber}
        onRetake={handleRetake}
        onFinish={() => handleRetake()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Question Tracker */}
      <View style={styles.trackerRow}>
        <View style={styles.qBadge}>
          <Text style={styles.qBadgeText}>
            QUESTION {currentIndex + 1} OF {questions.length}
          </Text>
        </View>

        <View
          style={[
            styles.typeBadge,
            currentQ.isMultipleSelect ? styles.msqBadge : styles.mcqBadge,
          ]}
        >
          <Text
            style={[
              styles.mcqBadgeText,
              currentQ.isMultipleSelect && styles.msqBadgeText,
            ]}
          >
            {currentQ.isMultipleSelect ? '☑️ MSQ (Select all)' : '🔘 Single Choice (MCQ)'}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Question Card */}
      <View
        style={[
          styles.questionCard,
          {
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <Text style={[styles.questionText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
          {currentQ.question}
        </Text>

        {/* Options List */}
        <View style={styles.optionsList}>
          {currentQ.options.map((optText, idx) => {
            const isSelected = selectedOptions.includes(idx);
            const isCorrect = currentQ.correctAnswers.includes(idx);

            let cardBg = isDark ? '#1e293b' : '#f8fafc';
            let cardBorder = isDark ? '#334155' : '#e2e8f0';

            if (isAnswerSubmitted) {
              if (isCorrect) {
                cardBg = isDark ? '#064e3b33' : '#f0fdf4';
                cardBorder = '#22c55e';
              } else if (isSelected && !isCorrect) {
                cardBg = isDark ? '#450a0a33' : '#fef2f2';
                cardBorder = '#ef4444';
              }
            } else if (isSelected) {
              cardBg = isDark ? '#064e3b22' : '#f0fdf4';
              cardBorder = '#22c55e';
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.optionCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
                onPress={() => handleSelectOption(idx)}
                activeOpacity={0.8}
                disabled={isAnswerSubmitted}
              >
                {/* Selector Icon (Radio for MCQ, Checkbox for MSQ) */}
                {currentQ.isMultipleSelect ? (
                  <View
                    style={[
                      styles.squareCheckbox,
                      isSelected && styles.squareCheckboxSelected,
                      isAnswerSubmitted && isCorrect && styles.squareCheckboxCorrect,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                      isAnswerSubmitted && isCorrect && styles.radioCircleCorrect,
                    ]}
                  >
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                )}

                <Text
                  style={[
                    styles.optionText,
                    { color: isDark ? '#f8fafc' : '#0f172a' },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {optText}
                </Text>

                {/* Post-submit validation badge */}
                {isAnswerSubmitted && isCorrect && (
                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                )}
                {isAnswerSubmitted && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Instant Explanation Box */}
        {isAnswerSubmitted && (
          <View style={styles.explanationCard}>
            <View style={styles.expHeader}>
              <Ionicons name="bulb" size={16} color="#22c55e" />
              <Text style={styles.expTitle}>ANSWER EXPLANATION</Text>
            </View>
            <Text style={styles.expContent}>{currentQ.explanation}</Text>
          </View>
        )}

        {/* Submit / Next Button */}
        {!isAnswerSubmitted ? (
          <TouchableOpacity
            style={styles.checkAnswerBtn}
            onPress={handleCheckAnswer}
            activeOpacity={0.8}
          >
            <Text style={styles.checkAnswerText}>Check Answer</Text>
            <Ionicons name="checkmark-sharp" size={18} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextQuestionBtn}
            onPress={handleNextQuestion}
            activeOpacity={0.8}
          >
            <Text style={styles.nextQuestionText}>
              {currentIndex === questions.length - 1 ? 'View Final Results' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  qBadge: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  qBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  mcqBadge: {
    backgroundColor: '#1e293b',
  },
  mcqBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  msqBadge: {
    backgroundColor: '#22c55e22',
  },
  msqBadgeText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1e293b',
    borderRadius: 2,
    marginBottom: Spacing.four,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  questionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    elevation: 3,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: Spacing.three,
  },
  optionsList: {
    gap: 10,
    marginBottom: Spacing.three,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#22c55e',
  },
  radioCircleCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  squareCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareCheckboxSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  squareCheckboxCorrect: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  optionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  explanationCard: {
    backgroundColor: '#064e3b18',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    borderRadius: BorderRadius.sm,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  expTitle: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expContent: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  checkAnswerBtn: {
    backgroundColor: '#22c55e',
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkAnswerText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  nextQuestionBtn: {
    backgroundColor: '#16a34a',
    height: 48,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextQuestionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
