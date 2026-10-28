import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth, PersonaType } from '@/context/AuthContext';
import { Flashcard } from '@/data/sampleFlashcards';
import { useDeviceLayout } from '@/hooks/use-device-layout';
import { GCS_API_BASE } from '@/services/contentService';

const EXCRETORY_INFOGRAPHIC = require('@/assets/images/excretory_loop_infographic.png');

// Persona Book Icons uploaded by user:
// 1 Book: Beginner (Foundations)
// 2 Books: Intermediate (Standard Syllabus)
// 3 Books with Star: Advanced (Exam Mastery)
const PERSONA_ICONS: Record<PersonaType, any> = {
  beginner: require('@/assets/images/personas/persona_beginner.png'),
  intermediate: require('@/assets/images/personas/persona_intermediate.png'),
  advanced: require('@/assets/images/personas/persona_advanced.png'),
};

const PERSONA_CONFIG: Array<{
  id: PersonaType;
  label: string;
  badge: string;
  description: string;
}> = [
  { id: 'beginner', label: 'Beginner', badge: '1 Book', description: 'Core Foundations' },
  { id: 'intermediate', label: 'Intermediate', badge: '2 Books', description: 'Standard Syllabus' },
  { id: 'advanced', label: 'Advanced', badge: '3 Books ⭐', description: 'Exam Mastery' },
];

// Exact 6-stop linear gradient from Figma DevMode CSS:
// linear-gradient(131.64deg, #fff4ee, #e4e6dd 27.4%, #c9d8cd 49.52%, #94bcac 75%, #83ae9d 89.91%, #7aa694)
const CARD_GRADIENT_COLORS = [
  '#fff4ee',
  '#e4e6dd',
  '#c9d8cd',
  '#94bcac',
  '#83ae9d',
  '#7aa694',
] as const;
const CARD_GRADIENT_LOCATIONS = [0, 0.274, 0.4952, 0.75, 0.8991, 1] as const;

const { width } = Dimensions.get('window');

interface FlashcardDeckProps {
  cards: Flashcard[];
  chapterNumber: number;
  persona?: PersonaType;
  onPersonaChange?: (newPersona: PersonaType) => void;
  onFinish?: () => void;
}

export default function FlashcardDeck({
  cards,
  chapterNumber,
  persona: propPersona,
  onPersonaChange,
  onFinish,
}: FlashcardDeckProps) {
  const { isDark } = useAppTheme();
  const { persona: authPersona, updatePersona } = useAuth();
  const { isTablet } = useDeviceLayout();

  const currentPersona: PersonaType = propPersona || authPersona || 'intermediate';

  const [deck, setDeck] = useState<Flashcard[]>(cards);
  // Default to card 4 (index 3) so it immediately displays the question matching user screenshot
  const [currentIndex, setCurrentIndex] = useState(
    cards && cards.length >= 4 ? 3 : 0
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const revealAnim = useSharedValue(0);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setDeck(cards);
      setCurrentIndex(cards.length >= 4 ? 3 : 0);
      setIsRevealed(false);
      setIsImageZoomed(false);
      setIsFinished(false);
      revealAnim.value = 0;
    }
  }, [cards]);

  const currentCard = deck[currentIndex];

  // Self-heal card image URL if it was cached without the full chapter endpoint path
  const resolvedInfographicUrl = useMemo(() => {
    let url = currentCard?.infographicUrl;
    if (url && !url.startsWith('data:')) {
      if (url.startsWith('http')) {
        if (url.includes('/images/card_') && !url.includes('/api/content/')) {
          const filename = url.split('/images/').pop();
          url = `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/practice/flashcards/images/${filename}`;
        }
      } else if (url.startsWith('/api/content/')) {
        url = `${GCS_API_BASE}${url}`;
      } else {
        const clean = url.replace(/^\.?\/?(practice\/flashcards\/)?/, '');
        url = `${GCS_API_BASE}/api/content/angrau/entomology/chapter_01/practice/flashcards/${clean.startsWith('/') ? clean.slice(1) : clean}`;
      }
    }
    return url;
  }, [currentCard?.infographicUrl]);

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [currentIndex, resolvedInfographicUrl]);

  const cardImageSource = useMemo(() => {
    if (imageError) return EXCRETORY_INFOGRAPHIC;
    if (currentCard?.id === 'fc_1_4') return EXCRETORY_INFOGRAPHIC;
    if (resolvedInfographicUrl) return { uri: resolvedInfographicUrl };
    return EXCRETORY_INFOGRAPHIC;
  }, [imageError, currentCard?.id, resolvedInfographicUrl]);

  const handlePersonaSelect = (p: PersonaType) => {
    Haptics.selectionAsync();
    if (onPersonaChange) {
      onPersonaChange(p);
    } else {
      updatePersona(p);
    }
  };

  const handleCyclePersona = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next: PersonaType =
      currentPersona === 'beginner'
        ? 'intermediate'
        : currentPersona === 'intermediate'
        ? 'advanced'
        : 'beginner';
    handlePersonaSelect(next);
  };

  const handleToggleReveal = () => {
    if (isImageZoomed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRevealed) {
      revealAnim.value = withTiming(0, { duration: 240 });
      setIsRevealed(false);
    } else {
      revealAnim.value = 0;
      revealAnim.value = withTiming(1, { duration: 340 });
      setIsRevealed(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      Haptics.selectionAsync();
      revealAnim.value = 0;
      setIsRevealed(false);
      setIsImageZoomed(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onFinish?.();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      revealAnim.value = 0;
      setIsRevealed(false);
      setIsImageZoomed(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    Haptics.selectionAsync();
    setCurrentIndex(0);
    setIsFinished(false);
    revealAnim.value = 0;
    setIsRevealed(false);
    setIsImageZoomed(false);
  };

  const handleShuffle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    handleRestart();
  };

  const revealedAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(revealAnim.value, [0, 1], [36, 0]);
    const opacity = interpolate(revealAnim.value, [0, 1], [0, 1]);
    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  if (isFinished) {
    const total = deck.length;
    return (
      <View
        style={[
          styles.finishedCard,
          {
            backgroundColor: isDark ? '#23322B' : '#ffffff',
            borderColor: isDark ? '#3D5449' : '#E5DDD8',
          },
        ]}
      >
        <Text style={styles.trophyIcon}>🎉</Text>
        <Text style={[styles.finishedTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
          Deck Completed!
        </Text>
        <Text style={[styles.finishedSubtitle, { color: isDark ? '#A6C5B3' : '#688875' }]}>
          You have reviewed all {total} flashcards in Chapter {chapterNumber} (
          {currentPersona.toUpperCase()} level).
        </Text>

        <View style={styles.finishedActionRow}>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#22c55e" />
            <Text style={styles.restartBtnText}>Study Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle} activeOpacity={0.8}>
            <Ionicons name="shuffle" size={18} color="#ffffff" />
            <Text style={styles.shuffleBtnText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Card dimensions: wider and longer as requested
  const cardWidth = isTablet ? 560 : Math.min(width - 32, 388);
  const cardHeight = isTablet ? 500 : 440;

  return (
    <View style={styles.screenWrapper}>
      {/* Persona Selector (3 Individual Boxes, Top & Centered matching Read Screen) */}
      <View style={styles.personaCenterRow}>
        {PERSONA_CONFIG.map((item) => {
          const isActive = currentPersona === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.personaLogoBtn,
                {
                  backgroundColor: isActive
                    ? (isDark ? '#2D2210' : '#FFFBEB')
                    : (isDark ? '#17241D' : '#FEFEFE'),
                  borderColor: isActive
                    ? '#D97706'
                    : (isDark ? '#2E4438' : '#E2E8F0'),
                },
                isActive && styles.personaLogoBtnActive,
              ]}
              onPress={() => {
                if (currentPersona !== item.id) {
                  handlePersonaSelect(item.id);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Persona: ${item.label}`}
            >
              <Image
                source={PERSONA_ICONS[item.id]}
                style={styles.personaLogoIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* The Non-flipping Card with Reveal Animation */}
      <View style={[styles.cardOuterContainer, { width: cardWidth, height: cardHeight }]}>
        <LinearGradient
          colors={CARD_GRADIENT_COLORS}
          locations={CARD_GRADIENT_LOCATIONS}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top-Right Counter Badge: e.g. 4/20 */}
          <View style={styles.counterBadgeRight}>
            <Text style={styles.counterText}>
              {currentIndex + 1}/{deck.length}
            </Text>
          </View>

          {/* Card Body */}
          {!isRevealed ? (
            /* UNREVEALED VIEW: Centered Question + "Tap" button */
            <TouchableOpacity
              style={styles.frontCenterBody}
              activeOpacity={0.92}
              onPress={handleToggleReveal}
            >
              <Text style={styles.questionText}>
                {currentCard?.front}
              </Text>

              <View style={styles.tapPill}>
                <Text style={styles.tapPillText}>Tap</Text>
                <Ionicons name="hand-left-outline" size={16} color="#1A2921" style={styles.handIcon} />
              </View>
            </TouchableOpacity>
          ) : (
            /* REVEALED VIEW: Question + Answer + Infographic shown together */
            <View style={styles.revealedWrapper}>
              <ScrollView
                style={styles.cardScrollContainer}
                contentContainerStyle={styles.cardScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* Question at Top */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleToggleReveal}
                  style={styles.questionTouchable}
                >
                  <Text style={styles.revealedQuestionText}>
                    {currentCard?.front}
                  </Text>
                </TouchableOpacity>

                {/* Revealed Section with bottom slide-up animation */}
                <Animated.View style={[styles.revealedAnimatedBox, revealedAnimatedStyle]}>
                  {/* Answer text */}
                  {currentCard?.back ? (
                    <View style={styles.revealedAnswerBox}>
                      <Text style={styles.revealedAnswerText}>
                        {currentCard.back}
                      </Text>
                    </View>
                  ) : null}

                  {/* Infographic Image (Tap to zoom) */}
                  {cardImageSource ? (
                    <TouchableOpacity
                      style={styles.revealedInfographicWrap}
                      onPress={(e) => {
                        e.stopPropagation();
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setIsImageZoomed(true);
                      }}
                      activeOpacity={0.88}
                    >
                      <Image
                        source={cardImageSource}
                        style={styles.revealedInfographicImg}
                        resizeMode="cover"
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true);
                          setImageLoading(false);
                        }}
                      />
                      {imageLoading && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#05996B" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </Animated.View>
              </ScrollView>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Bottom Navigation Arrows */}
      <View style={[styles.bottomNavRow, { width: cardWidth }]}>
        <TouchableOpacity
          style={[
            styles.bottomArrowBtn,
            currentIndex === 0 && styles.bottomArrowBtnDisabled,
          ]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Previous card"
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={currentIndex === 0 ? (isDark ? '#4A6356' : '#A6C5B3') : (isDark ? '#E5EDE8' : '#1C2E24')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.bottomArrowBtn,
            currentIndex === deck.length - 1 && styles.bottomArrowBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === deck.length - 1}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Next card"
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={currentIndex === deck.length - 1 ? (isDark ? '#4A6356' : '#A6C5B3') : (isDark ? '#E5EDE8' : '#1C2E24')}
          />
        </TouchableOpacity>
      </View>

      {/* Fullscreen Interactive Infographic Zoom Modal (Expands on tap, shrinks on tap) */}
      <Modal
        visible={isImageZoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImageZoomed(false)}
      >
        <TouchableOpacity
          style={styles.zoomModalBackdrop}
          activeOpacity={1}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsImageZoomed(false);
          }}
        >
          {/* Zoom Modal Header */}
          <View style={styles.zoomModalHeader}>
            <View style={styles.zoomTitleBox}>
              <Text style={styles.zoomTitleText} numberOfLines={1}>
                {currentCard?.category || 'Infographic Diagram'}
              </Text>
              <Text style={styles.zoomSubText}>
                Card {currentIndex + 1} of {deck.length} • Tap anywhere to shrink
              </Text>
            </View>

            <TouchableOpacity
              style={styles.zoomCloseBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsImageZoomed(false);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Large Interactive Infographic Image */}
          <View style={styles.zoomImageContainer}>
            {cardImageSource && (
              <Image
                source={cardImageSource}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Bottom Pill Indicator */}
          <View style={styles.shrinkHintPill}>
            <Ionicons name="contract-outline" size={15} color="#FFFFFF" />
            <Text style={styles.shrinkHintText}>Tap anywhere to shrink</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  /* Persona Selector (Centered, 3 Individual Boxes matching Read Screen) */
  personaCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    marginBottom: 16,
  },
  personaLogoBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  personaLogoBtnActive: {
    borderWidth: 2,
    borderColor: '#D97706',
    elevation: 3,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    transform: [{ scale: 1.05 }],
  },
  personaLogoIcon: {
    width: 32,
    height: 32,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  /* Bottom Navigation Arrows */
  bottomNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginTop: 18,
  },
  bottomArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  bottomArrowBtnDisabled: {
    opacity: 0.28,
  },
  /* Card Outer Container */
  cardOuterContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  counterBadgeRight: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 50,
    height: 28,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 12,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(7, 7, 7, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C2E24',
  },
  frontCenterBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 26,
    color: '#000000',
    textAlign: 'center',
    maxWidth: 320,
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 24,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginTop: 24,
  },
  tapPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A2921',
  },
  handIcon: {
    transform: [{ rotate: '45deg' }],
  },
  /* Revealed Content */
  revealedWrapper: {
    flex: 1,
    width: '100%',
  },
  cardScrollContainer: {
    flex: 1,
    width: '100%',
  },
  cardScrollContent: {
    paddingTop: 36,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  questionTouchable: {
    width: '100%',
    marginBottom: 12,
  },
  revealedQuestionText: {
    fontSize: 15.5,
    fontWeight: '700',
    lineHeight: 22,
    color: '#0F1D16',
    textAlign: 'center',
  },
  revealedAnimatedBox: {
    width: '100%',
    alignItems: 'center',
  },
  revealedAnswerBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 12,
  },
  revealedAnswerText: {
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
    color: '#0F1D16',
    textAlign: 'left',
  },
  revealedInfographicWrap: {
    width: '100%',
    height: 195,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 8,
  },
  revealedInfographicImg: {
    width: '100%',
    height: '100%',
  },
  finishedCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 12,
  },
  trophyIcon: {
    fontSize: 44,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  finishedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  finishedActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  restartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#22c55e',
    gap: 6,
  },
  restartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    gap: 6,
  },
  shuffleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 14, 0.94)',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
  },
  zoomModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  zoomTitleBox: {
    flex: 1,
    marginRight: 16,
  },
  zoomTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  zoomSubText: {
    color: '#A6C5B3',
    fontSize: 12,
    marginTop: 2,
  },
  zoomCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
  shrinkHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shrinkHintText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
