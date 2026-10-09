import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Flashcard } from '@/data/sampleFlashcards';
import { BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface FlashcardDeckProps {
  cards: Flashcard[];
  chapterNumber: number;
}

export default function FlashcardDeck({ cards, chapterNumber }: FlashcardDeckProps) {
  const { isDark } = useAppTheme();
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const flipAnimation = useSharedValue(0);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setDeck(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setMasteredCount(0);
      setReviewCount(0);
      setIsFinished(false);
      flipAnimation.value = 0;
    }
  }, [cards]);

  const currentCard = deck[currentIndex];

  const handleFlip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isFlipped) {
      flipAnimation.value = withTiming(0, { duration: 350 });
      setIsFlipped(false);
    } else {
      flipAnimation.value = withTiming(1, { duration: 350 });
      setIsFlipped(true);
    }
  };

  const advanceCard = (mastered: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (mastered) {
      setMasteredCount((prev) => prev + 1);
    } else {
      setReviewCount((prev) => prev + 1);
    }

    // Reset flip back to front before next card
    flipAnimation.value = withTiming(0, { duration: 150 });
    setIsFlipped(false);

    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
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
  };

  const handleShuffle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    handleRestart();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  if (isFinished) {
    const total = deck.length;
    const percent = Math.round((masteredCount / total) * 100);

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

        <View style={styles.statsSummaryRow}>
          <View style={[styles.statBox, { borderColor: '#22c55e' }]}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{masteredCount}</Text>
            <Text style={styles.statTag}>Mastered</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#f59e0b' }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{reviewCount}</Text>
            <Text style={styles.statTag}>Needs Review</Text>
          </View>
          <View style={[styles.statBox, { borderColor: '#3b82f6' }]}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}>{percent}%</Text>
            <Text style={styles.statTag}>Proficiency</Text>
          </View>
        </View>

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

  return (
    <View style={styles.container}>
      {/* Top Deck Status */}
      <View style={styles.statusBar}>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            CARD {currentIndex + 1} OF {deck.length}
          </Text>
        </View>

        <View style={styles.deckStats}>
          <View style={styles.smallStat}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={styles.smallStatText}>{masteredCount}</Text>
          </View>
          <View style={styles.smallStat}>
            <Ionicons name="time" size={16} color="#f59e0b" />
            <Text style={styles.smallStatText}>{reviewCount}</Text>
          </View>
        </View>
      </View>

      {/* 3D Flip Card Container */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleFlip}
        style={styles.cardTouchArea}
      >
        {/* Front Face */}
        <Animated.View
          style={[
            styles.flashcard,
            styles.cardFront,
            frontAnimatedStyle,
            {
              backgroundColor: isDark ? '#23322B' : '#ffffff',
              borderColor: isDark ? '#3D5449' : '#E5DDD8',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{currentCard.category || 'Entomology'}</Text>
            </View>
            <View style={styles.flipHintPill}>
              <Ionicons name="sync-outline" size={12} color="#94a3b8" />
              <Text style={styles.flipHintText}>Tap to reveal</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardFrontText, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
              {currentCard.front}
            </Text>
          </View>

          {currentCard.hint ? (
            <View style={styles.hintContainer}>
              <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
              <Text style={styles.hintText}>Hint: {currentCard.hint}</Text>
            </View>
          ) : (
            <View style={{ height: 20 }} />
          )}
        </Animated.View>

        {/* Back Face */}
        <Animated.View
          style={[
            styles.flashcard,
            styles.cardBack,
            backAnimatedStyle,
            {
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4',
              borderColor: '#22c55e66',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.categoryPill, { backgroundColor: '#22c55e33' }]}>
              <Text style={[styles.categoryText, { color: '#22c55e' }]}>ANSWER / EXPLANATION</Text>
            </View>
            <View style={styles.flipHintPill}>
              <Ionicons name="sync-outline" size={12} color="#94a3b8" />
              <Text style={styles.flipHintText}>Tap to hide</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <Text style={[styles.cardBackText, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>
              {currentCard?.back}
            </Text>
            {currentCard?.infographicUrl ? (
              <Image
                source={{ uri: currentCard.infographicUrl }}
                style={{
                  width: '100%',
                  height: 120,
                  marginTop: 10,
                  borderRadius: 8,
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Swipe / Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.reviewBtn]}
          onPress={() => advanceCard(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="repeat" size={20} color="#f59e0b" />
          <Text style={styles.reviewBtnText}>Needs Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.masteredBtn]}
          onPress={() => advanceCard(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text style={styles.masteredBtnText}>Mastered</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.three,
  },
  counterBadge: {
    backgroundColor: '#064e3b22',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  counterText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  deckStats: {
    flexDirection: 'row',
    gap: 12,
  },
  smallStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallStatText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTouchArea: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardFront: {},
  cardBack: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  flipHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flipHintText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  cardFrontText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center',
  },
  cardBackText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f59e0b11',
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  hintText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: Spacing.four,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reviewBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f59e0b55',
  },
  reviewBtnText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '700',
  },
  masteredBtn: {
    backgroundColor: '#22c55e',
  },
  masteredBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  finishedCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  trophyIcon: {
    fontSize: 48,
    marginBottom: Spacing.two,
  },
  finishedTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  finishedSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.four,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#064e3b11',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statTag: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  finishedActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  restartBtn: {
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
  restartBtnText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
  shuffleBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shuffleBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
