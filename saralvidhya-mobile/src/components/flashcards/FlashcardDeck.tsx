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
  const [isFlipped, setIsFlipped] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [showAnswerText, setShowAnswerText] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const flipAnimation = useSharedValue(0);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setDeck(cards);
      setCurrentIndex(cards.length >= 4 ? 3 : 0);
      setIsFlipped(false);
      setIsImageZoomed(false);
      setShowAnswerText(false);
      setIsFinished(false);
      flipAnimation.value = 0;
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

  const handleFlip = () => {
    if (isImageZoomed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFlipped) {
      flipAnimation.value = withTiming(0, { duration: 320 });
      setIsFlipped(false);
    } else {
      flipAnimation.value = withTiming(1, { duration: 320 });
      setIsFlipped(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      Haptics.selectionAsync();
      flipAnimation.value = withTiming(0, { duration: 150 });
      setIsFlipped(false);
      setIsImageZoomed(false);
      setShowAnswerText(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      onFinish?.();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      flipAnimation.value = withTiming(0, { duration: 150 });
      setIsFlipped(false);
      setIsImageZoomed(false);
      setShowAnswerText(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    Haptics.selectionAsync();
    setCurrentIndex(0);
    setIsFinished(false);
    flipAnimation.value = 0;
    setIsFlipped(false);
    setIsImageZoomed(false);
    setShowAnswerText(false);
  };

  const handleShuffle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    handleRestart();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [0, 180]);
    const isFront = flipAnimation.value < 0.5;
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity: isFront ? 1 : 0,
      zIndex: isFront ? 2 : 0,
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [180, 360]);
    const isBack = flipAnimation.value >= 0.5;
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateValue}deg` }],
      opacity: isBack ? 1 : 0,
      zIndex: isBack ? 2 : 0,
      backfaceVisibility: 'hidden',
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

  // Exact card dimensions from Figma DevMode: width 380px, height 359px
  const cardWidth = isTablet ? 460 : Math.min(width - 32, 380);
  const cardHeight = isTablet ? 380 : 359;

  return (
    <View style={styles.screenWrapper}>
      {/* 3-Part Persona Switcher Bar: [ 📗 | 📚 | 🌟 ] (Logos only) */}
      <View
        style={[
          styles.personaBar,
          {
            width: cardWidth,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 255, 255, 0.65)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(45, 62, 54, 0.12)',
          },
        ]}
      >
        {PERSONA_CONFIG.map((item) => {
          const isActive = currentPersona === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.personaPill,
                isActive && [
                  styles.personaPillActive,
                  {
                    backgroundColor: isDark ? '#147A43' : '#FFFFFF',
                    borderColor: isDark ? '#3D8E5F' : '#2D3E36',
                  },
                ],
              ]}
              onPress={() => handlePersonaSelect(item.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Image
                source={PERSONA_ICONS[item.id]}
                style={styles.personaBookImg}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Outer Card Container with floating side navigation arrows */}
      <View style={[styles.cardOuterContainer, { width: cardWidth, height: cardHeight }]}>
        {/* The 3D Flip Card */}
        <TouchableOpacity
          activeOpacity={0.96}
          onPress={handleFlip}
          style={[styles.cardTouchArea, { width: cardWidth, height: cardHeight }]}
        >
          {/* FRONT FACE (Question + Tap here button) */}
          <Animated.View
            pointerEvents={isFlipped ? 'none' : 'auto'}
            style={[styles.cardFace, frontAnimatedStyle, { width: cardWidth, height: cardHeight }]}
          >
            <LinearGradient
              colors={CARD_GRADIENT_COLORS}
              locations={CARD_GRADIENT_LOCATIONS}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Top-Left Counter Badge: e.g. 4/10 (.wrapper / .div) */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{deck.length}
                </Text>
              </View>

              {/* Top-Right Persona Badge (.flashCard8Child) */}
              <TouchableOpacity
                style={styles.cardPersonaBadge}
                activeOpacity={0.75}
                onPress={handleCyclePersona}
                accessibilityRole="button"
                accessibilityLabel={`Active persona: ${currentPersona}. Tap to switch`}
              >
                <Image
                  source={PERSONA_ICONS[currentPersona]}
                  style={styles.cardPersonaImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Center Content: Question + Tap here button */}
              <View style={styles.frontCenterBody}>
                <Text style={styles.questionText}>
                  {currentCard?.front}
                </Text>

                <TouchableOpacity
                  style={styles.tapPill}
                  activeOpacity={0.8}
                  onPress={handleFlip}
                >
                  <Text style={styles.tapPillText}>Tap here</Text>
                  <Ionicons name="hand-left-outline" size={16} color="#1A2921" style={styles.handIcon} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* BACK FACE (Question + Infographic answer) */}
          <Animated.View
            pointerEvents={isFlipped ? 'auto' : 'none'}
            style={[styles.cardFace, styles.cardBack, backAnimatedStyle, { width: cardWidth, height: cardHeight }]}
          >
            <LinearGradient
              colors={CARD_GRADIENT_COLORS}
              locations={CARD_GRADIENT_LOCATIONS}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Top-Left Counter Badge */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{deck.length}
                </Text>
              </View>

              {/* Top-Right Persona Badge (.flashCard8Child) */}
              <TouchableOpacity
                style={styles.cardPersonaBadge}
                activeOpacity={0.75}
                onPress={handleCyclePersona}
                accessibilityRole="button"
                accessibilityLabel={`Active persona: ${currentPersona}. Tap to switch`}
              >
                <Image
                  source={PERSONA_ICONS[currentPersona]}
                  style={styles.cardPersonaImg}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              {/* Back Content: Question at top + Infographic below */}
              <View style={styles.backCenterBody}>
                <Text style={styles.backQuestionText} numberOfLines={3}>
                  {currentCard?.front}
                </Text>

                {/* Infographic Image or Formatted Answer Text */}
                {cardImageSource && !showAnswerText ? (
                  <TouchableOpacity
                    style={styles.infographicThumbWrap}
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsImageZoomed(true);
                    }}
                    activeOpacity={0.88}
                  >
                    <Image
                      source={cardImageSource}
                      style={styles.infographicThumb}
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
                    {/* Zoom indicator chip */}
                    <View style={styles.zoomChip}>
                      <Ionicons name="scan-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.zoomChipText}>Tap to zoom</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.answerTextBox}>
                    <Text style={styles.answerTextBody}>
                      {currentCard?.back}
                    </Text>
                  </View>
                )}

                {/* Bottom row: Optional text toggle if card has both text and image */}
                {currentCard?.back && cardImageSource ? (
                  <TouchableOpacity
                    style={styles.switchModePill}
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.selectionAsync();
                      setShowAnswerText((prev) => !prev);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showAnswerText ? 'image-outline' : 'document-text-outline'}
                      size={13}
                      color="#1A2921"
                    />
                    <Text style={styles.switchModeText}>
                      {showAnswerText ? 'Show Infographic' : 'Show Text Answer'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* Floating Left Navigation Button (.frameChild) */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.leftArrow,
            currentIndex === 0 && styles.arrowDisabled,
          ]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Previous card"
        >
          <Ionicons
            name="arrow-back"
            size={16}
            color={currentIndex === 0 ? '#A6C5B3' : '#1C2E24'}
          />
        </TouchableOpacity>

        {/* Floating Right Navigation Button (.frameItem) */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.rightArrow,
            currentIndex === deck.length - 1 && styles.arrowDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === deck.length - 1}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Next card"
        >
          <Ionicons
            name="arrow-forward"
            size={16}
            color={currentIndex === deck.length - 1 ? '#A6C5B3' : '#1C2E24'}
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
  /* 3-Part Persona Bar */
  personaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    marginBottom: 14,
  },
  personaPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personaPillActive: {
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
  },
  personaBookImg: {
    width: 24,
    height: 24,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  /* Card Outer Container */
  cardOuterContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouchArea: {
    borderRadius: 20,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
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
  cardBack: {
    // Rotated by 180deg
  },
  cardGradient: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  counterBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 46,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(7, 7, 7, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  counterText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 25,
  },
  cardPersonaBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(7, 7, 7, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardPersonaImg: {
    width: 20,
    height: 20,
  },
  frontCenterBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 25,
    color: '#000000',
    textAlign: 'center',
    width: 301,
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    width: 220,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
  backCenterBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  backQuestionText: {
    fontSize: 14.5,
    fontWeight: '700',
    lineHeight: 21,
    color: '#000000',
    textAlign: 'center',
    width: 305,
    marginBottom: 8,
  },
  infographicThumbWrap: {
    width: 285,
    height: 159,
    borderRadius: 4,
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
  },
  infographicThumb: {
    width: '100%',
    height: '100%',
  },
  zoomChip: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(28, 46, 36, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  zoomChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  answerTextBox: {
    width: 285,
    minHeight: 140,
    maxHeight: 170,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
  },
  answerTextBody: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    color: '#0F1D16',
    textAlign: 'left',
  },
  switchModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 0.8,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    marginTop: 4,
  },
  switchModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A2921',
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  leftArrow: {
    left: -14,
  },
  rightArrow: {
    right: -14,
  },
  arrowDisabled: {
    opacity: 0.35,
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
