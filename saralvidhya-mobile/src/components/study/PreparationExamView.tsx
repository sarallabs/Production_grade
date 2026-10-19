import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export interface ExamQuestion {
  id: number;
  part: string;
  marks: string;
  taxonomy: string;
  topicTitle: string;
  questionText: string;
  guidanceText?: string;
}

export const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    part: 'PART A  ·  SHORT ANSWER',
    marks: '★  2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Three regions of the insect gut',
    questionText:
      'State the embryonic germ layer origins of the Foregut (Stomodaeum), Midgut (Mesenteron), and Hindgut (Proctodaeum), and note whether each has a cuticular intima.',
    guidanceText: 'Be clear and concise · 2 marks',
  },
  {
    id: 2,
    part: 'PART A  ·  SHORT ANSWER',
    marks: '★  2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Proventricular Teeth & Gizzard Action',
    questionText:
      'Describe the histological arrangement of the proventriculus in Orthopteran insects and explain its mechanical grinding action.',
    guidanceText: 'Point-to-point structural notes · 2 marks',
  },
  {
    id: 3,
    part: 'PART A  ·  SHORT ANSWER',
    marks: '★  2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Peritrophic Membrane Structure',
    questionText:
      'Distinguish between Type I and Type II peritrophic membranes in terms of site of secretion and chitin mesh arrangement.',
    guidanceText: 'Mention anatomical origins · 2 marks',
  },
  {
    id: 4,
    part: 'PART A  ·  SHORT ANSWER',
    marks: '★  2 marks',
    taxonomy: 'Application',
    topicTitle: 'Malpighian Tubules & Cryptonephridial System',
    questionText:
      'Explain the adaptive significance of the cryptonephridial arrangement in desert beetles for extreme water conservation.',
    guidanceText: 'Focus on rectal absorption dynamics · 2 marks',
  },
  {
    id: 5,
    part: 'PART B  ·  ESSAY QUESTION',
    marks: '★  5 marks',
    taxonomy: 'Analyzing',
    topicTitle: 'Midgut Epithelial Cell Diversity',
    questionText:
      'Detail the physiological roles of columnar digestive cells, goblet cells, and regenerative nidi cells in insect mesenteron epithelium.',
    guidanceText: 'Provide detailed functional summary · 5 marks',
  },
];

interface PreparationExamViewProps {
  questions?: ExamQuestion[];
  subjectName?: string;
  onBack?: () => void;
  onSubmit?: (answers: Record<number, string>) => void;
}

export default function PreparationExamView({
  questions = SAMPLE_EXAM_QUESTIONS,
  subjectName = 'INSECT DIGESTIVE SYSTEM & ANATOMY',
  onBack,
  onSubmit,
}: PreparationExamViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(7185); // 119:45

  // 1-second countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${mins}:${pad(secs)}`;
  };

  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQ.id] || '';

  // Word count calculation
  const wordCount = currentAnswer.trim()
    ? currentAnswer.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Answered progress count
  const answeredCount = Object.values(answers).filter((val) => val.trim().length > 0).length;
  const percentComplete = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Exact color scheme from Figma DevMode CSS exports
  const colors = isDark
    ? {
        screenBg: '#2D3E36',
        topAccentBar: '#477762',
        primaryText: '#f4f7f4',
        subText: '#b4c5bb',
        accentGreen: '#9bcdb2',
        divider: '#3b5146',
        timerBg: '#2a3e33',
        timerBorder: '#3b5146',
        timerText: '#9bcdb2',
        progressTrack: '#3b5146',
        progressFill: '#9bcdb2',
        // Badges
        partBg: '#2a3e33',
        partText: '#9bcdb2',
        marksBg: '#477762',
        marksText: '#ffffff',
        taxonomyBg: '#2a3e33',
        taxonomyBorder: '#3b5146',
        taxonomyText: '#f4f7f4',
        // Card
        cardBg: '#1E2B24',
        cardBorder: '#3D5449',
        qBadgeBg: '#477762',
        qBadgeText: '#ffffff',
        qLabel: '#9bcdb2',
        // Answer box
        inputBg: '#1a2821',
        inputBorder: '#3b5146',
        inputDivider: '#40564a',
        inputPlaceholder: '#718078',
        // Buttons
        clearBtnBg: '#1f2d26',
        clearBtnBorder: '#3b5146',
        clearBtnText: '#b4c5bb',
        nextBtnBg: '#477762',
        nextBtnText: '#ffffff',
        submitBtnBg: '#477762',
        submitBtnText: '#ffffff',
        bottomSheetBg: '#1E2B24',
      }
    : {
        screenBg: '#FFF6F1',
        topAccentBar: '#2f493c',
        primaryText: '#24362e',
        subText: '#718078',
        accentGreen: '#477762',
        divider: '#dce7e0',
        timerBg: '#eaf3ed',
        timerBorder: '#dce7e0',
        timerText: '#477762',
        progressTrack: '#dce7e0',
        progressFill: '#477762',
        // Badges
        partBg: '#eaf3ed',
        partText: '#477762',
        marksBg: '#2f493c',
        marksText: '#ffffff',
        taxonomyBg: '#eaf3ed',
        taxonomyBorder: '#dce7e0',
        taxonomyText: '#24362e',
        // Card
        cardBg: '#ffffff',
        cardBorder: '#dce7e0',
        qBadgeBg: '#2f493c',
        qBadgeText: '#ffffff',
        qLabel: '#477762',
        // Answer box
        inputBg: '#fbfdfc',
        inputBorder: '#dce7e0',
        inputDivider: '#e5ece7',
        inputPlaceholder: '#718078',
        // Buttons
        clearBtnBg: '#ffffff',
        clearBtnBorder: '#dce7e0',
        clearBtnText: '#24362e',
        nextBtnBg: '#2f493c',
        nextBtnText: '#ffffff',
        submitBtnBg: '#2f493c',
        submitBtnText: '#ffffff',
        bottomSheetBg: '#ffffff',
      };

  const handleAnswerChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const handleClearAnswer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: '',
    }));
  };

  const handleNext = () => {
    Haptics.selectionAsync();
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      Alert.alert(
        'All Questions Reviewed',
        `You have answered ${answeredCount} of ${totalQuestions} questions. Are you ready to submit your exam?`,
        [
          { text: 'Review Answers', style: 'cancel' },
          { text: 'Submit Exam', onPress: handleSubmitExam },
        ]
      );
    }
  };

  const handleSubmitExam = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onSubmit) {
      onSubmit(answers);
    } else {
      Alert.alert('Exam Submitted', `Successfully recorded ${answeredCount} answers.`, [
        { text: 'OK', onPress: onBack },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top 5px decorative bar from Figma */}
      <View style={[styles.topAccent, { backgroundColor: colors.topAccentBar }]} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 4),
            paddingBottom: insets.bottom + 20,
          },
          isTablet && styles.tabletContainer,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <Text style={[styles.backChevron, { color: colors.primaryText }]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTitles}>
            <Text style={[styles.headerTitle, { color: colors.primaryText }]}>
              Preparation Exam
            </Text>
            <Text style={[styles.headerSub, { color: colors.subText }]} numberOfLines={1}>
              {subjectName}
            </Text>
          </View>

          {/* Timer Badge */}
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: colors.timerBg,
                borderColor: colors.timerBorder,
              },
            ]}
          >
            <Text style={[styles.timerText, { color: colors.timerText }]}>
              ◷  {formatTimer(secondsRemaining)}
            </Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Question Counter & % Complete */}
        <View style={styles.counterRow}>
          <View style={styles.counterLeft}>
            <Text style={[styles.questionNumText, { color: colors.primaryText }]}>
              Question {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}
            </Text>
            <Text style={[styles.ofTotalText, { color: colors.subText }]}>
              {' '}of {totalQuestions < 10 ? `0${totalQuestions}` : totalQuestions}
            </Text>
          </View>

          <Text style={[styles.percentCompleteText, { color: colors.accentGreen }]}>
            {percentComplete}% complete
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressBarTrack, { backgroundColor: colors.progressTrack }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.progressFill,
                width: `${Math.max(4, percentComplete)}%`,
              },
            ]}
          />
        </View>

        {/* Badges Row: [ Part A · Short Answer ] [ ★ 2 marks ] [ Remembering ] */}
        <View style={styles.badgesRow}>
          <View style={[styles.partBadge, { backgroundColor: colors.partBg }]}>
            <Text style={[styles.partBadgeText, { color: colors.partText }]}>
              {currentQ.part}
            </Text>
          </View>

          <View style={[styles.marksBadge, { backgroundColor: colors.marksBg }]}>
            <Text style={[styles.marksBadgeText, { color: colors.marksText }]}>
              {currentQ.marks}
            </Text>
          </View>

          <View
            style={[
              styles.taxonomyBadge,
              {
                backgroundColor: colors.taxonomyBg,
                borderColor: colors.taxonomyBorder,
              },
            ]}
          >
            <Text style={[styles.taxonomyBadgeText, { color: colors.taxonomyText }]}>
              {currentQ.taxonomy}
            </Text>
          </View>
        </View>

        {/* Question Card */}
        <View
          style={[
            styles.questionCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Question Tag */}
          <View style={styles.qHeaderRow}>
            <View style={[styles.qSquare, { backgroundColor: colors.qBadgeBg }]}>
              <Text style={[styles.qSquareText, { color: colors.qBadgeText }]}>Q</Text>
            </View>
            <Text style={[styles.qLabel, { color: colors.qLabel }]}>QUESTION</Text>
          </View>

          {/* Question Topic Title */}
          <Text style={[styles.topicTitle, { color: colors.primaryText }]}>
            {currentQ.topicTitle}
          </Text>

          {/* Question Full Text */}
          <Text style={[styles.questionBody, { color: colors.primaryText }]}>
            {currentQ.questionText}
          </Text>
        </View>

        {/* Your Answer Section */}
        <View style={styles.answerSectionHeader}>
          <Text style={[styles.yourAnswerTitle, { color: colors.primaryText }]}>
            Your answer
          </Text>
          <Text style={[styles.answerGuidance, { color: colors.subText }]}>
            {currentQ.guidanceText || 'Be clear and concise · 2 marks'}
          </Text>
        </View>

        {/* Input Box Card */}
        <View
          style={[
            styles.answerInputCard,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[styles.textInput, { color: colors.primaryText }]}
            placeholder="Start typing your answer…"
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            textAlignVertical="top"
            value={currentAnswer}
            onChangeText={handleAnswerChange}
          />

          <View style={[styles.inputDivider, { backgroundColor: colors.inputDivider }]} />

          <View style={styles.inputFooter}>
            <TouchableOpacity
              style={styles.formatBtn}
              activeOpacity={0.7}
              onPress={() => Haptics.selectionAsync()}
            >
              <Text style={[styles.formatText, { color: colors.subText }]}>Aa  Format</Text>
            </TouchableOpacity>

            <Text style={[styles.wordsCountText, { color: colors.subText }]}>
              {wordCount} words
            </Text>
          </View>
        </View>

        {/* Clear Answer & Next Actions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.clearButton,
              {
                backgroundColor: colors.clearBtnBg,
                borderColor: colors.clearBtnBorder,
              },
            ]}
            onPress={handleClearAnswer}
            activeOpacity={0.75}
          >
            <Text style={[styles.clearButtonText, { color: colors.clearBtnText }]}>
              Clear answer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.nextBtnBg }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextButtonText, { color: colors.nextBtnText }]}>
              {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Exam Progress Card */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.bottomSheetBg,
              borderColor: colors.divider,
            },
          ]}
        >
          <View style={[styles.bottomProgressDivider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.examProgressLabel, { color: colors.subText }]}>
            EXAM PROGRESS
          </Text>

          <Text style={[styles.answeredRatioText, { color: colors.primaryText }]}>
            {answeredCount} of {totalQuestions} answered
          </Text>

          {/* Secondary Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.progressTrack }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.progressFill,
                  width: `${(answeredCount / totalQuestions) * 100}%`,
                },
              ]}
            />
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.submitBtnBg }]}
            onPress={handleSubmitExam}
            activeOpacity={0.85}
          >
            <Text style={[styles.submitButtonText, { color: colors.submitBtnText }]}>
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAccent: {
    height: 5,
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tabletContainer: {
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  backButton: {
    width: 28,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 28,
  },
  headerTitles: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  timerBadge: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  counterLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  questionNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ofTotalText: {
    fontSize: 12,
    fontWeight: '500',
  },
  percentCompleteText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'nowrap',
  },
  partBadge: {
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  marksBadge: {
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  taxonomyBadge: {
    paddingHorizontal: 10,
    height: 27,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxonomyBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  qHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qSquare: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qSquareText: {
    fontSize: 12,
    fontWeight: '800',
  },
  qLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  questionBody: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  answerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  yourAnswerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  answerGuidance: {
    fontSize: 10,
    fontWeight: '500',
  },
  answerInputCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  textInput: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    minHeight: 110,
  },
  inputDivider: {
    height: 1,
    width: '100%',
    marginVertical: 10,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatText: {
    fontSize: 10,
    fontWeight: '500',
  },
  wordsCountText: {
    fontSize: 10,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  clearButton: {
    width: 112,
    height: 42,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  bottomProgressDivider: {
    height: 1,
    width: '100%',
    marginBottom: 6,
  },
  examProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  answeredRatioText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  submitButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
