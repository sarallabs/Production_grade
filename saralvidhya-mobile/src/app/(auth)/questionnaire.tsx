import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { QUESTIONS, calculatePersona } from '@/data/questionnaireData';
import { BorderRadius, Spacing } from '@/constants/theme';

export default function QuestionnaireScreen() {
  const router = useRouter();
  const { completeQuestionnaire } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(QUESTIONS.length).fill(-1));
  const [isFinishing, setIsFinishing] = useState(false);

  const currentQ = QUESTIONS[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  const handleSelectOption = (optionIndex: number) => {
    Haptics.selectionAsync();
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (answers[currentIndex] === -1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Selection Required', 'Please select an option to continue.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = async () => {
    setIsFinishing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { persona, totalScore } = calculatePersona(answers);
    await completeQuestionnaire(persona);

    Alert.alert(
      'Diagnostic Completed! 🎓',
      `Based on your learning preferences and background (Score: ${totalScore}), your recommended curriculum tier is "${persona.toUpperCase()}".`,
      [
        {
          text: 'Enter Study Table',
          onPress: () => router.replace('/(tabs)/index'),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Bar with Progress */}
      <View style={styles.topBar}>
        <View style={styles.progressRow}>
          <Text style={styles.stepText}>
            QUESTION {currentIndex + 1} OF {QUESTIONS.length}
          </Text>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      {/* Question Container */}
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{currentQ.text}</Text>
        {currentQ.description ? (
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{currentQ.description}</Text>
          </View>
        ) : null}

        {/* Options */}
        <View style={styles.optionsList}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentIndex] === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                onPress={() => handleSelectOption(idx)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                {opt.icon ? <Text style={styles.optionEmoji}>{opt.icon}</Text> : null}
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.backButton, currentIndex === 0 && styles.buttonDisabled]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#94a3b8" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === QUESTIONS.length - 1 ? 'Finish & Analyze' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === QUESTIONS.length - 1 ? 'checkmark-circle' : 'arrow-forward'}
            size={18}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 50 : 30,
    paddingBottom: 40,
  },
  topBar: {
    marginBottom: Spacing.four,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  percentText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#1e293b',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 3,
  },
  questionCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    marginBottom: Spacing.four,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    lineHeight: 26,
    marginBottom: Spacing.two,
  },
  descriptionBox: {
    backgroundColor: '#1e293b',
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
    borderRadius: BorderRadius.sm,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  descriptionText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  optionsList: {
    gap: 10,
    marginTop: Spacing.two,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: BorderRadius.md,
    padding: Spacing.three,
    gap: 12,
  },
  optionRowSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b22',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#22c55e',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionText: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  backButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
