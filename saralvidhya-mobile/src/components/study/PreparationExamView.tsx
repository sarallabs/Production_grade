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
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/ThemeContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { fetchMockTest } from '@/services/contentService';

export interface ExamQuestion {
  id: number;
  part: string;
  marks: string;
  taxonomy: string;
  topicTitle: string;
  questionText: string;
}

export const SAMPLE_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Three regions of the insect gut',
    questionText:
      'State the embryonic germ layer origins of the Foregut (Stomodaeum), Midgut (Mesenteron), and Hindgut (Proctodaeum), and note whether each has a cuticular intima.',
  },
  {
    id: 2,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Proventricular Teeth & Gizzard Action',
    questionText:
      'Describe the histological arrangement of the proventriculus in Orthopteran insects and explain its mechanical grinding action.',
  },
  {
    id: 3,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Peritrophic Membrane Structure',
    questionText:
      'Distinguish between Type I and Type II peritrophic membranes in terms of site of secretion and chitin mesh arrangement.',
  },
  {
    id: 4,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Application',
    topicTitle: 'Malpighian Tubules & Cryptonephridial System',
    questionText:
      'Explain the adaptive significance of the cryptonephridial arrangement in desert beetles for extreme water conservation.',
  },
  {
    id: 5,
    part: 'PART B · ESSAY QUESTION',
    marks: '★ 5 marks',
    taxonomy: 'Analyzing',
    topicTitle: 'Midgut Epithelial Cell Diversity',
    questionText:
      'Detail the physiological roles of columnar digestive cells, goblet cells, and regenerative nidi cells in insect mesenteron epithelium.',
  },
  {
    id: 6,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Filter Chamber in Hemiptera',
    questionText:
      'Explain the anatomical modification and functional role of the filter chamber in sap-sucking Hemipteran insects.',
  },
  {
    id: 7,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Salivary Glands in Insects',
    questionText:
      'Describe the morphology of insect labial salivary glands and list three key enzymes or anticoagulants secreted by them.',
  },
  {
    id: 8,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Rectal Pads & Papillae',
    questionText:
      'What are rectal pads? Explain their ultrastructure and critical role in water and ion reabsorption from primary urine.',
  },
  {
    id: 9,
    part: 'PART B · ESSAY QUESTION',
    marks: '★ 5 marks',
    taxonomy: 'Analyzing',
    topicTitle: 'Insect Ecdysis & Cuticular Moulting',
    questionText:
      'Outline the sequential physiological steps of ecdysis, detailing the hormonal interplay between PTTH, ecdysone, and bursicon.',
  },
  {
    id: 10,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Symbiont-Mediated Digestion in Termites',
    questionText:
      'How do wood-feeding termites digest cellulose? Name the protozoan and bacterial endosymbionts involved.',
  },
  {
    id: 11,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Stomodaeal Cardiac Valve',
    questionText:
      'Describe the position and function of the cardiac (oesophageal) valve in preventing retrograde flow of food bolus.',
  },
  {
    id: 12,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Application',
    topicTitle: 'Digestive Proteases in Predatory Insects',
    questionText:
      'Compare extra-oral digestion in larval Neuroptera/Coleoptera with intra-oral enzymatic processing in chewing herbivorous insects.',
  },
  {
    id: 13,
    part: 'PART B · ESSAY QUESTION',
    marks: '★ 5 marks',
    taxonomy: 'Evaluating',
    topicTitle: 'Insect Endocrine Control of Metamorphosis',
    questionText:
      'Critically evaluate the role of Juvenile Hormone (JH) titers in determining whether a larval moult or a pupal/imaginal moult occurs.',
  },
  {
    id: 14,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Haemolymph Circulation & Dorsal Vessel',
    questionText:
      'Diagrammatically represent the open circulatory system in insects and trace the flow of haemolymph through the ostia and aorta.',
  },
  {
    id: 15,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Tracheal System & Spiracular Closure',
    questionText:
      'Explain the mechanism of discontinuous gas exchange cycles (DGC) in insects and how it minimizes respiratory water loss.',
  },
  {
    id: 16,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Types of Insect Antennae',
    questionText:
      'Differentiate between plumose, flabellate, and geniculate antennae with one agricultural pest example for each type.',
  },
  {
    id: 17,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Application',
    topicTitle: 'Insect Leg Modifications',
    questionText:
      'Describe the morphological adaptations in fossorial and raptorial legs, citing specific insect orders exhibiting them.',
  },
  {
    id: 18,
    part: 'PART B · ESSAY QUESTION',
    marks: '★ 5 marks',
    taxonomy: 'Analyzing',
    topicTitle: 'Insect Excretory Physiology & Nitrogen Metabolism',
    questionText:
      'Explain the biochemical synthesis of uric acid in insects and outline the active transport mechanisms operating in Malpighian tubule cells.',
  },
  {
    id: 19,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Compound Eye Ommatidium Anatomy',
    questionText:
      'Label the optical components of an insect ommatidium and distinguish between apposition and superposition visual mechanisms.',
  },
  {
    id: 20,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Johnston’s Organ Function',
    questionText:
      'Where is Johnston’s organ located in the antenna and what mechanoreceptive and auditory roles does it play in male mosquitoes?',
  },
  {
    id: 21,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Remembering',
    topicTitle: 'Wing Venation: Comstock-Needham System',
    questionText:
      'List the principal longitudinal veins in the Comstock-Needham system from Costa to Anal vein.',
  },
  {
    id: 22,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Understanding',
    topicTitle: 'Fat Body Metabolic Functions',
    questionText:
      'Summarize the trophic, storage, and immunological functions of trophocytes, urocytes, and mycetocytes within insect fat bodies.',
  },
  {
    id: 23,
    part: 'PART A · SHORT ANSWER',
    marks: '★ 2 marks',
    taxonomy: 'Application',
    topicTitle: 'Venom Glands in Hymenoptera',
    questionText:
      'Explain how the female ovipositor is modified into a sting apparatus in aculeate Hymenoptera with acid and alkaline gland secretions.',
  },
  {
    id: 24,
    part: 'PART C · COMPREHENSIVE',
    marks: '★ 10 marks',
    taxonomy: 'Evaluating',
    topicTitle: 'Integrated Insect Digestive Architecture',
    questionText:
      'Present a comprehensive functional overview of the insect alimentary system, correlating histological specialization with diverse feeding guilds (phytophagous, fluid-feeding, and xylophagous).',
  },
];

interface PreparationExamViewProps {
  questions?: ExamQuestion[];
  subjectId?: string;
  chapterNumber?: number;
  subjectName?: string;
  selectedUnits?: number[];
  questionCount?: number;
  onBack?: () => void;
  onSubmit?: (answers: Record<number, string>, photos?: Record<number, string[]>) => void;
}

export default function PreparationExamView({
  questions,
  subjectId = 'entomology',
  chapterNumber = 1,
  subjectName = 'INSECT DIGESTIVE SYSTEM & ANATOMY',
  selectedUnits,
  questionCount = 10,
  onBack,
  onSubmit,
}: PreparationExamViewProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>(() => {
    const base = questions && questions.length > 0 ? questions : SAMPLE_EXAM_QUESTIONS;
    return questionCount && base.length > questionCount ? base.slice(0, questionCount) : base;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!questions || questions.length === 0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answerPhotos, setAnswerPhotos] = useState<Record<number, string[]>>({});
  const [previewPhotoUri, setPreviewPhotoUri] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(7185); // 119:45

  useEffect(() => {
    const applyCountLimit = (qs: ExamQuestion[]) => {
      if (questionCount && qs.length > questionCount) {
        return qs.slice(0, questionCount);
      }
      return qs;
    };

    if (questions && questions.length > 0) {
      setExamQuestions(applyCountLimit(questions));
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    setIsLoading(true);

    fetchMockTest(subjectId, chapterNumber, controller.signal)
      .then((data) => {
        if (isMounted) {
          if (data && data.examQuestions.length > 0) {
            setExamQuestions(applyCountLimit(data.examQuestions));
          } else {
            setExamQuestions(applyCountLimit(SAMPLE_EXAM_QUESTIONS));
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[PreparationExamView] Error fetching exam questions:', err);
        }
        if (isMounted) {
          setExamQuestions(applyCountLimit(SAMPLE_EXAM_QUESTIONS));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [questions, subjectId, chapterNumber, questionCount]);

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

  const totalQuestions = examQuestions.length;
  const currentQ = examQuestions[currentIndex] || examQuestions[0];
  const currentAnswer = currentQ ? answers[currentQ.id] || '' : '';
  const currentPhotos = currentQ ? answerPhotos[currentQ.id] || [] : [];

  // Word count calculation
  const wordCount = currentAnswer.trim()
    ? currentAnswer.trim().split(/\s+/).filter(Boolean).length
    : 0;

  // Answered progress count (text or photo)
  const answeredCount = examQuestions.filter(
    (q) =>
      (answers[q.id] && answers[q.id].trim().length > 0) ||
      (answerPhotos[q.id] && answerPhotos[q.id].length > 0)
  ).length;
  const percentComplete = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Exact color scheme matching the provided exam mockups 1:1
  const colors = isDark
    ? {
        screenBg: '#121E19',
        topAccentBar: '#BE7E57',
        primaryText: '#FFFFFF',
        subText: '#8FA89B',
        accentGreen: '#BE7E57',
        divider: '#1F3329',
        timerBg: '#24362E',
        timerBorder: 'transparent',
        timerText: '#F5E4DB',
        progressTrack: '#23342B',
        progressFill: '#BE7E57',
        // Badges
        partBg: '#1C3026',
        partText: '#F5E4DB',
        marksBg: '#BE7E57',
        marksText: '#FFFFFF',
        taxonomyBg: '#1C3026',
        taxonomyBorder: 'transparent',
        taxonomyText: '#D8E6DF',
        // Card
        cardBg: '#17251F',
        cardBorder: '#23352B',
        qBadgeBg: '#BE7E57',
        qBadgeText: '#FFFFFF',
        qLabel: '#F5E4DB',
        // Answer box
        inputBg: '#121E19',
        inputBorder: '#23352B',
        inputDivider: '#1D2F25',
        inputPlaceholder: '#668072',
        // Buttons
        clearBtnBg: '#17251F',
        clearBtnBorder: '#2E4237',
        clearBtnText: '#C5D8CE',
        nextBtnBg: '#BE7E57',
        nextBtnText: '#FFFFFF',
        submitBtnBg: '#BE7E57',
        submitBtnText: '#FFFFFF',
        bottomSheetBg: '#17251F',
      }
    : {
        screenBg: '#F4F7F5',
        topAccentBar: '#BE7E57',
        primaryText: '#172A21',
        subText: '#5C7066',
        accentGreen: '#BE7E57',
        divider: '#E0E8E3',
        timerBg: '#FAF1EB',
        timerBorder: 'transparent',
        timerText: '#8C4F2B',
        progressTrack: '#DFE8E3',
        progressFill: '#BE7E57',
        // Badges
        partBg: '#FAF1EB',
        partText: '#8C4F2B',
        marksBg: '#BE7E57',
        marksText: '#FFFFFF',
        taxonomyBg: '#FAF1EB',
        taxonomyBorder: 'transparent',
        taxonomyText: '#8C4F2B',
        // Card
        cardBg: '#FFFFFF',
        cardBorder: '#E0E8E3',
        qBadgeBg: '#BE7E57',
        qBadgeText: '#FFFFFF',
        qLabel: '#BE7E57',
        // Answer box
        inputBg: '#FFFFFF',
        inputBorder: '#DFE7E2',
        inputDivider: '#EBEFEC',
        inputPlaceholder: '#8FA89B',
        // Buttons
        clearBtnBg: '#FFFFFF',
        clearBtnBorder: '#DCE5E0',
        clearBtnText: '#2A4538',
        nextBtnBg: '#BE7E57',
        nextBtnText: '#FFFFFF',
        submitBtnBg: '#BE7E57',
        submitBtnText: '#FFFFFF',
        bottomSheetBg: '#FFFFFF',
      };

  const handleAnswerChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const attachPhoto = (uri: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAnswerPhotos((prev) => ({
      ...prev,
      [currentQ.id]: [...(prev[currentQ.id] || []), uri],
    }));
  };

  const removePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAnswerPhotos((prev) => ({
      ...prev,
      [currentQ.id]: (prev[currentQ.id] || []).filter((_, i) => i !== index),
    }));
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Permission Needed',
          'Camera access is required to take a photo of your handwritten answer or diagram.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        attachPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[PreparationExamView] Error taking photo:', e);
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Gallery Permission Needed',
          'Photo library access is required to upload your answer photo.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        attachPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[PreparationExamView] Error selecting photo:', e);
      Alert.alert('Gallery Error', 'Could not select photo.');
    }
  };

  const handleCameraPress = () => {
    Haptics.selectionAsync();
    Alert.alert(
      'Attach Answer Photo',
      'Take a photo of your handwritten answer or diagram, or select from gallery:',
      [
        { text: '📷 Take Photo', onPress: takePhoto },
        { text: '🖼️ Choose from Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleClearAnswer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: '',
    }));
    setAnswerPhotos((prev) => ({
      ...prev,
      [currentQ.id]: [],
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
      onSubmit(answers, answerPhotos);
    } else {
      Alert.alert('Exam Submitted', `Successfully recorded ${answeredCount} answers.`, [
        { text: 'OK', onPress: onBack },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.screenBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={{ marginTop: 12, color: colors.subText, fontSize: 14 }}>
          Loading official preparation exam questions...
        </Text>
      </View>
    );
  }

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
            <Ionicons name="chevron-back" size={24} color={colors.primaryText} />
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
            <Ionicons name="time-outline" size={14} color={colors.timerText} style={{ marginRight: 5 }} />
            <Text style={[styles.timerText, { color: colors.timerText }]}>
              {formatTimer(secondsRemaining)}
            </Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Question Counter & % Complete */}
        <View style={styles.counterRow}>
          <Text style={[styles.questionNumText, { color: colors.primaryText }]}>
            Question {currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}
            <Text style={[styles.ofTotalText, { color: colors.subText }]}>
              of {totalQuestions}
            </Text>
          </Text>

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
          {currentQ.topicTitle && !currentQ.topicTitle.startsWith('Concept ') ? (
            <Text style={[styles.topicTitle, { color: colors.primaryText }]}>
              {currentQ.topicTitle}
            </Text>
          ) : null}

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

          {/* Attached Photos Preview inside the Answer Box if any */}
          {currentPhotos.length > 0 && (
            <View style={styles.attachedPhotosContainer}>
              <Text style={[styles.attachedPhotosLabel, { color: colors.subText }]}>
                Attached Pages / Diagrams ({currentPhotos.length}):
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.attachedPhotosRow}
              >
                {currentPhotos.map((uri, idx) => (
                  <View key={`${uri}-${idx}`} style={styles.photoThumbnailWrap}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setPreviewPhotoUri(uri)}
                    >
                      <Image
                        source={{ uri }}
                        style={styles.photoThumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoRemoveBadge}
                      activeOpacity={0.7}
                      onPress={() => removePhoto(idx)}
                      accessibilityLabel="Remove photo"
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={[styles.inputDivider, { backgroundColor: colors.inputDivider }]} />

          <View style={styles.inputFooter}>
            <View style={styles.inputFooterLeft}>
              <TouchableOpacity
                style={styles.formatBtn}
                activeOpacity={0.7}
                onPress={() => Haptics.selectionAsync()}
              >
                <Text style={[styles.formatText, { color: colors.subText }]}>Aa  Format</Text>
              </TouchableOpacity>

              {/* Camera Icon Button */}
              <TouchableOpacity
                style={[
                  styles.cameraIconButton,
                  {
                    backgroundColor: isDark ? '#3B2A20' : '#FAF1EB',
                    borderColor: isDark ? '#5C3E2F' : '#E8D0C3',
                  },
                ]}
                activeOpacity={0.7}
                onPress={handleCameraPress}
                accessibilityLabel="Upload photo answer"
              >
                <Ionicons name="camera" size={17} color={colors.accentGreen} />
                <Text style={[styles.cameraIconLabel, { color: colors.accentGreen }]}>
                  {currentPhotos.length > 0 ? `Photo (${currentPhotos.length})` : 'Photo'}
                </Text>
              </TouchableOpacity>
            </View>

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

      {/* Full screen photo preview Modal */}
      <Modal
        visible={!!previewPhotoUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhotoUri(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setPreviewPhotoUri(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {previewPhotoUri && (
            <Image
              source={{ uri: previewPhotoUri }}
              style={styles.fullPreviewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  backButton: {
    width: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timerBadge: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 13.5,
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
    fontSize: 16,
    fontWeight: '700',
  },
  ofTotalText: {
    fontSize: 14,
    fontWeight: '400',
  },
  percentCompleteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'nowrap',
  },
  partBadge: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  marksBadge: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marksBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taxonomyBadge: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxonomyBadgeText: {
    fontSize: 11.5,
    fontWeight: '500',
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
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qSquareText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  qLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  questionBody: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  answerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  yourAnswerTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    minHeight: 120,
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
    fontSize: 12,
    fontWeight: '500',
  },
  wordsCountText: {
    fontSize: 12,
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
    width: 124,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginBottom: 16,
    marginTop: 4,
  },
  bottomProgressDivider: {
    height: 1,
    width: '100%',
    marginBottom: 8,
  },
  examProgressLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  answeredRatioText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // Attached Photos & Camera button styles
  attachedPhotosContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  attachedPhotosLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  attachedPhotosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  photoThumbnailWrap: {
    position: 'relative',
    borderRadius: 8,
  },
  photoThumbnail: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#00000015',
  },
  photoRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  inputFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  cameraIconLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPreviewImage: {
    width: '100%',
    height: '80%',
  },
});
