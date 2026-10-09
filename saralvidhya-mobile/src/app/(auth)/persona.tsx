import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';

interface PersonaCard {
  id: PersonaType;
  title: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  highlights: string[];
}

const PERSONAS: PersonaCard[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    badge: 'Foundations & Simplified',
    icon: 'leaf-outline',
    description: 'Focus on fundamental concepts, simplified summaries, easy glossary terms, and step-by-step guidance.',
    highlights: [
      'Simple, visual chapter overviews',
      'Plain English explanations with zero jargon',
      'Gentle intro assessments & flashcards',
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    badge: 'Standard University Pace',
    icon: 'book-outline',
    description: 'Balanced depth matching the standard ANGRAU syllabus speed with comprehensive reading guides and topic quizzes.',
    highlights: [
      'Complete chapter study guides',
      'Full flashcard decks with terminology',
      'MCQ & MSQ assessments with instant explanations',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    badge: 'Deep Dive & Exam Mastery',
    icon: 'trophy-outline',
    description: 'Exhaustive notes covering detailed insect morphology, 10-mark university PYQ answers, and competitive exam readiness.',
    highlights: [
      'Deep dive comprehensive lecture notes',
      'Past 5-year university exam model answers',
      'High-rigor timed mock tests & case studies',
    ],
  },
];

export default function PersonaSelectionScreen() {
  const router = useRouter();
  const { persona: currentPersona, updatePersona } = useAuth();
  const [selected, setSelected] = useState<PersonaType>(currentPersona || 'intermediate');

  const handleSelect = async (personaId: PersonaType) => {
    Haptics.selectionAsync();
    setSelected(personaId);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updatePersona(selected);
    router.push('/(auth)/questionnaire');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepBadge}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Choose Your Learning Persona</Text>
        <Text style={styles.subtitle}>
          Saral Vidhya customizes the depth of notes, quiz difficulty, and study recommendations based on your persona.
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {PERSONAS.map((item) => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => handleSelect(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={isSelected ? '#22c55e' : '#94a3b8'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardBadge}>{item.badge}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </View>

              <Text style={styles.cardDescription}>{item.description}</Text>

              <View style={styles.highlightsContainer}>
                {item.highlights.map((hl, i) => (
                  <View key={i} style={styles.highlightRow}>
                    <Ionicons name="checkmark-sharp" size={14} color="#22c55e" />
                    <Text style={styles.highlightText}>{hl}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Next: Diagnostic Questionnaire</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={async () => {
          await updatePersona(selected);
          router.replace('/(tabs)/index');
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.skipButtonText}>Skip Questionnaire & Start Studying</Text>
      </TouchableOpacity>
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
  header: {
    marginBottom: Spacing.four,
  },
  stepBadge: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1.5,
    borderColor: '#1e293b',
    borderRadius: BorderRadius.xl,
    padding: Spacing.three,
  },
  cardSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b14',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.two,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: '#064e3b33',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  cardTitleSelected: {
    color: '#4ade80',
  },
  cardBadge: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#22c55e',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  cardDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: Spacing.two,
  },
  highlightsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: Spacing.two,
    gap: 6,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  continueButton: {
    backgroundColor: '#22c55e',
    borderRadius: BorderRadius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
