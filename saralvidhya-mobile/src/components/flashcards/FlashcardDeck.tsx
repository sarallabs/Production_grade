import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  Platform,
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
import { Flashcard } from '@/data/sampleFlashcards';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const { width, height } = Dimensions.get('window');

interface FlashcardDeckProps {
  cards: Flashcard[];
  chapterNumber: number;
}

export default function FlashcardDeck({ cards, chapterNumber }: FlashcardDeckProps) {
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  // Default to card 4 (index 3) so it immediately displays the question matching screenshot
  const [currentIndex, setCurrentIndex] = useState(cards && cards.length >= 4 ? 3 : 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const flipAnimation = useSharedValue(0);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setDeck(cards);
      setCurrentIndex(cards.length >= 4 ? 3 : 0);
      setIsFlipped(false);
      setIsImageZoomed(false);
      setMasteredCount(0);
      setReviewCount(0);
      setIsFinished(false);
      flipAnimation.value = 0;
    }
  }, [cards]);

  const currentCard = deck[currentIndex];

  const handleFlip = () => {
    // Prevent flipping the card if user is tapping the zoomed image
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
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.selectionAsync();
      flipAnimation.value = withTiming(0, { duration: 150 });
      setIsFlipped(false);
      setIsImageZoomed(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    Haptics.selectionAsync();
    setCurrentIndex(0);
    setMasteredCount(0);
    setReviewCount(0);
    setIsFinished(false);
    flipAnimation.value = 0;
    setIsFlipped(false);
    setIsImageZoomed(false);
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
          You have reviewed all {total} flashcards in Chapter {chapterNumber}.
        </Text>

        <View style={styles.finishedActionRow}>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#22c55e" />
            <Text style={styles.restartBtnText}>Study Again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleBtn} onPress={handleShuffle} activeOpacity={0.8}>
            <Ionicons name="shuffle" size={18} color="#ffffff" />
            <Text style={styles.shuffleBtnText}>Shuffle & Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const maxCardWidth = isTablet ? 540 : Math.min(width - 40, 380);

  return (
    <View style={styles.screenWrapper}>
      {/* Outer Card Container with floating left/right navigation arrows */}
      <View style={[styles.cardOuterContainer, { width: maxCardWidth }]}>
        {/* The 3D Flip Card */}
        <TouchableOpacity
          activeOpacity={0.96}
          onPress={handleFlip}
          style={styles.cardTouchArea}
        >
          {/* FRONT FACE (Question) */}
          <Animated.View
            pointerEvents={isFlipped ? 'none' : 'auto'}
            style={[styles.cardFace, frontAnimatedStyle]}
          >
            <LinearGradient
              colors={['#F0F6F2', '#B9D5C8', '#7EA898']}
              start={{ x: 0.08, y: 0.08 }}
              end={{ x: 0.94, y: 0.94 }}
              style={styles.cardGradient}
            >
              {/* Top-Left Counter Badge: e.g. 4/10 */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{deck.length}
                </Text>
              </View>

              {/* Center Content: Question + Tap here button */}
              <View style={styles.centerBody}>
                <Text style={styles.questionText}>
                  {currentCard?.front}
                </Text>

                <View style={styles.tapPill}>
                  <Text style={styles.tapPillText}>Tap here</Text>
                  <Ionicons name="hand-left-outline" size={16} color="#1C2E24" style={styles.handIcon} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* BACK FACE (Answer + Infographics) */}
          <Animated.View
            pointerEvents={isFlipped ? 'auto' : 'none'}
            style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}
          >
            <LinearGradient
              colors={['#F0F6F2', '#B9D5C8', '#7EA898']}
              start={{ x: 0.08, y: 0.08 }}
              end={{ x: 0.94, y: 0.94 }}
              style={styles.cardGradient}
            >
              {/* Top-Left Counter Badge */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  {currentIndex + 1}/{deck.length}
                </Text>
              </View>

              {/* Center Content: Answer & Infographic */}
              <View style={styles.centerBackBody}>
                {/* Category / Answer Tag */}
                <View style={styles.answerTag}>
                  <Text style={styles.answerTagText}>
                    {currentCard?.category?.toUpperCase() || 'ANSWER'}
                  </Text>
                </View>

                {/* Answer explanation text */}
                <Text style={styles.answerText} numberOfLines={4}>
                  {currentCard?.back}
                </Text>

                {/* Infographic Thumbnail View */}
                {currentCard?.infographicUrl ? (
                  <TouchableOpacity
                    style={styles.infographicThumbWrap}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setIsImageZoomed(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: currentCard.infographicUrl }}
                      style={styles.infographicThumb}
                      resizeMode="cover"
                    />
                    {/* Zoom indicator chip */}
                    <View style={styles.zoomChip}>
                      <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.zoomChipText}>Tap to zoom</Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                {/* Tap to flip back button */}
                <View style={styles.tapPillBack}>
                  <Text style={styles.tapPillText}>Tap to flip back</Text>
                  <Ionicons name="refresh-outline" size={15} color="#1C2E24" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {/* Floating Left Navigation Button */}
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
            size={18}
            color={currentIndex === 0 ? '#A6C5B3' : '#1C2E24'}
          />
        </TouchableOpacity>

        {/* Floating Right Navigation Button */}
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
            size={18}
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
              <Text style={styles.zoomTitleText}>
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
            {currentCard?.infographicUrl && (
              <Image
                source={{ uri: currentCard.infographicUrl }}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Bottom Pill Indicator */}
          <View style={styles.shrinkHintPill}>
            <Ionicons name="contract-outline" size={15} color="#FFFFFF" />
            <Text style={styles.shrinkHintText}>Tap to shrink</Text>
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
    paddingVertical: 12,
  },
  cardOuterContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouchArea: {
    width: '100%',
    height: 460,
    borderRadius: 28,
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  cardBack: {
    // Rotated by 180deg
  },
  cardGradient: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    zIndex: 10,
  },
  counterText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C2E24',
    letterSpacing: 0.2,
  },
  centerBody: {
    width: '100%',
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBackBody: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 29,
    color: '#0F1D16',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.2,
  },
  answerTag: {
    backgroundColor: 'rgba(28, 46, 36, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  answerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C2E24',
    letterSpacing: 0.6,
  },
  answerText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    color: '#0F1D16',
    textAlign: 'center',
    marginVertical: 8,
  },
  infographicThumbWrap: {
    width: '100%',
    height: 155,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(28, 46, 36, 0.25)',
    marginVertical: 6,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infographicThumb: {
    width: '100%',
    height: '100%',
  },
  zoomChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28, 46, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomChipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 38,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: 'rgba(28, 46, 36, 0.35)',
    backgroundColor: 'rgba(28, 46, 36, 0.08)',
  },
  tapPillBack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(28, 46, 36, 0.35)',
    backgroundColor: 'rgba(28, 46, 36, 0.08)',
    marginTop: 4,
  },
  tapPillText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1C2E24',
  },
  handIcon: {
    transform: [{ rotate: '45deg' }],
  },
  arrowButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
  /* Zoom Modal Styles */
  zoomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 18, 14, 0.94)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'android' ? 36 : 48,
    paddingHorizontal: 16,
  },
  zoomModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  zoomTitleBox: {
    flex: 1,
  },
  zoomTitleText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  zoomSubText: {
    color: '#A6C5B3',
    fontSize: 12,
    marginTop: 2,
  },
  zoomCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  zoomImageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  zoomImage: {
    width: width * 0.94,
    height: height * 0.72,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  shrinkHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shrinkHintText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
