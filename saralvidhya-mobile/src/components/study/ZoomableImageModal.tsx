import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Unrestricted deep zoom so users can inspect tiny microscopic diagram labels
const MIN_SCALE = 1.0;
const MAX_SCALE = 12.0;
const DOUBLE_TAP_SCALE = 3.5;

export interface ZoomableImageModalProps {
  visible: boolean;
  imageSource: any; // require(...) or { uri: string }
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export default function ZoomableImageModal({
  visible,
  imageSource,
  onClose,
}: ZoomableImageModalProps) {
  const insets = useSafeAreaInsets();

  // Animated values for transform
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Numerical tracker references for gesture calculations
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  // Multi-touch tracking
  const prevTouchCountRef = useRef(0);
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const lastTouchTimeRef = useRef(0);
  const lastTouchXRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const lastPanXRef = useRef(0);
  const lastPanYRef = useRef(0);

  // Update numerical trackers
  useEffect(() => {
    const scaleListener = scale.addListener(({ value }) => {
      scaleRef.current = value;
    });
    const panListener = pan.addListener((value) => {
      panRef.current = value;
    });

    return () => {
      scale.removeListener(scaleListener);
      pan.removeListener(panListener);
    };
  }, [scale, pan]);

  // Reset transforms smoothly
  const resetZoom = useCallback((animated = true) => {
    if (animated) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 4,
          speed: 18,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          bounciness: 4,
          speed: 18,
        }),
      ]).start();
    } else {
      scale.setValue(1);
      pan.setValue({ x: 0, y: 0 });
    }
  }, [scale, pan]);

  useEffect(() => {
    if (visible) {
      resetZoom(false);
      prevTouchCountRef.current = 0;
      initialDistanceRef.current = 0;
    }
  }, [visible, resetZoom]);

  // Double-tap handler
  const handleDoubleTap = (centerX: number, centerY: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
    if (scaleRef.current > 1.2) {
      // Zoom out to 1x
      resetZoom(true);
    } else {
      // Zoom in deeply towards tap point
      const targetScale = DOUBLE_TAP_SCALE;
      const offsetX = (SCREEN_WIDTH / 2 - centerX) * 0.9;
      const offsetY = (SCREEN_HEIGHT / 2 - centerY) * 0.9;

      Animated.parallel([
        Animated.spring(scale, {
          toValue: targetScale,
          useNativeDriver: true,
          bounciness: 4,
          speed: 16,
        }),
        Animated.spring(pan, {
          toValue: { x: offsetX, y: offsetY },
          useNativeDriver: true,
          bounciness: 4,
          speed: 16,
        }),
      ]).start();
    }
  };

  // Robust PanResponder with automatic multi-touch transition detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        const now = Date.now();

        // Detect double tap (within 350ms)
        if (touches.length === 1 && now - lastTouchTimeRef.current < 350) {
          handleDoubleTap(touches[0].pageX, touches[0].pageY);
          lastTouchTimeRef.current = 0;
          return;
        }
        lastTouchTimeRef.current = now;

        prevTouchCountRef.current = touches.length;

        if (touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialDistanceRef.current = Math.hypot(dx, dy);
          initialScaleRef.current = scaleRef.current;
        } else if (touches.length === 1) {
          lastTouchXRef.current = touches[0].pageX;
          lastTouchYRef.current = touches[0].pageY;
          lastPanXRef.current = panRef.current.x;
          lastPanYRef.current = panRef.current.y;
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.hypot(dx, dy);

          // If second finger just touched during move, initialize distance smoothly!
          if (prevTouchCountRef.current !== 2 || initialDistanceRef.current <= 0) {
            prevTouchCountRef.current = 2;
            initialDistanceRef.current = currentDistance;
            initialScaleRef.current = scaleRef.current;
            return;
          }

          if (initialDistanceRef.current > 0) {
            const factor = currentDistance / initialDistanceRef.current;
            const newScale = initialScaleRef.current * factor;
            const clampedScale = Math.min(MAX_SCALE + 0.5, Math.max(0.75, newScale));
            scale.setValue(clampedScale);
          }
        } else if (touches.length === 1) {
          // If transitioning from 2 fingers down to 1 finger, re-anchor coordinate baseline
          if (prevTouchCountRef.current !== 1) {
            prevTouchCountRef.current = 1;
            lastTouchXRef.current = touches[0].pageX;
            lastTouchYRef.current = touches[0].pageY;
            lastPanXRef.current = panRef.current.x;
            lastPanYRef.current = panRef.current.y;
            initialDistanceRef.current = 0;
            return;
          }

          // If zoomed in (> 1.05), pan smoothly across the diagram
          if (scaleRef.current > 1.05) {
            const deltaX = touches[0].pageX - lastTouchXRef.current;
            const deltaY = touches[0].pageY - lastTouchYRef.current;

            const currentScale = scaleRef.current;
            const maxPanX = (SCREEN_WIDTH * (currentScale - 1)) / 2 + 100;
            const maxPanY = (SCREEN_HEIGHT * (currentScale - 1)) / 2 + 100;

            const newX = lastPanXRef.current + deltaX;
            const newY = lastPanYRef.current + deltaY;

            const clampedX = Math.min(maxPanX, Math.max(-maxPanX, newX));
            const clampedY = Math.min(maxPanY, Math.max(-maxPanY, newY));

            pan.setValue({ x: clampedX, y: clampedY });
          }
        }
      },

      onPanResponderRelease: () => {
        prevTouchCountRef.current = 0;
        initialDistanceRef.current = 0;

        if (scaleRef.current <= 1.05) {
          resetZoom(true);
        } else if (scaleRef.current > MAX_SCALE) {
          Animated.spring(scale, {
            toValue: MAX_SCALE,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        prevTouchCountRef.current = 0;
        initialDistanceRef.current = 0;
        if (scaleRef.current <= 1.05) {
          resetZoom(true);
        }
      },
    })
  ).current;

  if (!visible || !imageSource) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* Minimal Floating Close Button */}
        <TouchableOpacity
          style={[styles.floatingCloseBtn, { top: Math.max(insets.top + 10, 24) }]}
          onPress={() => {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
            onClose();
          }}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          activeOpacity={0.8}
          accessibilityLabel="Close image"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Fullscreen Interactive Viewport Area */}
        <View style={styles.viewport} {...panResponder.panHandlers}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.imageContainer,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y },
                  { scale: scale },
                ],
              },
            ]}
          >
            <ExpoImage
              source={imageSource}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              priority="high"
              pointerEvents="none"
              transition={150}
            />
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000', // Solid pitch-black so reading text underneath never bleeds through
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCloseBtn: {
    position: 'absolute',
    right: 18,
    zIndex: 999,
    elevation: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
