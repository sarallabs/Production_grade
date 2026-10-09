import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { AssessmentQuestion } from '@/services/assessmentService';
import { BorderRadius, Spacing } from '@/constants/theme';

interface AssessmentCompleteViewProps {
  questions: AssessmentQuestion[];
  userAnswers: Record<string, number[]>;
  chapterNumber: number;
  onRetake: () => void;
  onFinish: () => void;
}

export default function AssessmentCompleteView({
  questions,
  userAnswers,
  chapterNumber,
  onRetake,
  onFinish,
}: AssessmentCompleteViewProps) {
  const { isDark } = useAppTheme();
  const [showReview, setShowReview] = useState(false);

  // Calculate score
  let correctCount = 0;
  questions.forEach((q) => {
    const selected = userAnswers[q.id] || [];
    const expected = q.correctAnswers;
    const isCorrect =
      selected.length === expected.length &&
      selected.every((idx) => expected.includes(idx));
    if (isCorrect) correctCount++;
  });

  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  const getTier = () => {
    if (percentage >= 80) return { title: 'Mastery 🌟', color: '#22c55e', desc: 'Outstanding grasp of insect anatomy!' };
    if (percentage >= 60) return { title: 'Proficient 👍', color: '#3b82f6', desc: 'Good understanding. Review key definitions.' };
    return { title: 'Needs Revision 📚', color: '#f59e0b', desc: 'Recommend reviewing Quick Study notes again.' };
  };

  const tier = getTier();

  return (
    <View style={styles.container}>
      {/* Score Card Header */}
      <View
        style={[
          styles.scoreCard,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <Text style={styles.badgeLabel}>ASSESSMENT REPORT • CH {chapterNumber}</Text>

        <View style={[styles.scoreRing, { borderColor: tier.color }]}>
          <Text style={[styles.percentageText, { color: tier.color }]}>{percentage}%</Text>
          <Text style={styles.scoreFraction}>{correctCount} / {totalQuestions}</Text>
        </View>

        <Text style={[styles.tierTitle, { color: tier.color }]}>{tier.title}</Text>
        <Text style={styles.tierDesc}>{tier.desc}</Text>

        <View style={styles.statsStrip}>
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#22c55e' }]}>{correctCount}</Text>
            <Text style={styles.statLbl}>Correct</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#ef4444' }]}>
              {totalQuestions - correctCount}
            </Text>
            <Text style={styles.statLbl}>Incorrect</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#f59e0b' }]}>+50 XP</Text>
            <Text style={styles.statLbl}>Earned</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.retakeBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRetake();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color="#22c55e" />
            <Text style={styles.retakeBtnText}>Retake Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reviewToggleBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setShowReview(!showReview);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showReview ? 'chevron-up' : 'eye-outline'}
              size={18}
              color="#ffffff"
            />
            <Text style={styles.reviewToggleText}>
              {showReview ? 'Hide Review' : 'Review Answers'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Answer Key Review Mode */}
      {showReview && (
        <View style={styles.reviewContainer}>
          <Text style={[styles.reviewHeader, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Question by Question Breakdown
          </Text>

          {questions.map((q, idx) => {
            const selected = userAnswers[q.id] || [];
            const expected = q.correctAnswers;
            const isCorrect =
              selected.length === expected.length &&
              selected.every((i) => expected.includes(i));

            return (
              <View
                key={q.id}
                style={[
                  styles.reviewItemCard,
                  {
                    backgroundColor: isDark ? '#23322B' : '#ffffff',
                    borderColor: isCorrect ? '#22c55e44' : '#ef444444',
                  },
                ]}
              >
                <View style={styles.reviewItemHeader}>
                  <View
                    style={[
                      styles.statusCircle,
                      { backgroundColor: isCorrect ? '#22c55e22' : '#ef444422' },
                    ]}
                  >
                    <Ionicons
                      name={isCorrect ? 'checkmark' : 'close'}
                      size={16}
                      color={isCorrect ? '#22c55e' : '#ef4444'}
                    />
                  </View>
                  <Text style={[styles.reviewQNum, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
                    Question {idx + 1}
                  </Text>
                </View>

                <Text style={[styles.reviewQText, { color: isDark ? '#A6C5B3' : '#334155' }]}>
                  {q.question}
                </Text>

                <View style={styles.reviewOptionsList}>
                  {q.options.map((opt, optIdx) => {
                    const wasChosen = selected.includes(optIdx);
                    const isRight = expected.includes(optIdx);

                    let optBg = isDark ? '#1C2822' : '#F7EBE3';
                    let optBorder = isDark ? '#3D5449' : '#E5DDD8';
                    let iconName: 'checkmark-circle' | 'close-circle' | 'radio-button-off' =
                      'radio-button-off';
                    let iconColor = '#94a3b8';

                    if (isRight) {
                      optBg = isDark ? '#064e3b33' : '#f0fdf4';
                      optBorder = '#22c55e';
                      iconName = 'checkmark-circle';
                      iconColor = '#22c55e';
                    } else if (wasChosen && !isRight) {
                      optBg = isDark ? '#450a0a33' : '#fef2f2';
                      optBorder = '#ef4444';
                      iconName = 'close-circle';
                      iconColor = '#ef4444';
                    }

                    return (
                      <View
                        key={optIdx}
                        style={[
                          styles.reviewOptionRow,
                          { backgroundColor: optBg, borderColor: optBorder },
                        ]}
                      >
                        <Ionicons name={iconName} size={18} color={iconColor} />
                        <Text
                          style={[
                            styles.reviewOptionText,
                            { color: isDark ? '#f8fafc' : '#0f172a' },
                          ]}
                        >
                          {opt}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Explanation */}
                <View style={styles.explanationBox}>
                  <View style={styles.expHeader}>
                    <Ionicons name="bulb-outline" size={14} color="#22c55e" />
                    <Text style={styles.expLabel}>EXPLANATION</Text>
                  </View>
                  <Text style={styles.expText}>{q.explanation}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scoreCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeLabel: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.three,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreFraction: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  tierDesc: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b55',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    width: '100%',
    marginBottom: Spacing.four,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#064e3b22',
    borderWidth: 1,
    borderColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  retakeBtnText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewToggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  reviewToggleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewContainer: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
  reviewHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  reviewItemCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.three,
    borderWidth: 1,
    gap: 8,
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewQNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewQText: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewOptionsList: {
    gap: 6,
    marginVertical: 4,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  reviewOptionText: {
    fontSize: 13,
    flex: 1,
  },
  explanationBox: {
    backgroundColor: '#064e3b15',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  expHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  expLabel: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
});
