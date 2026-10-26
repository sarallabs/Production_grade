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

const MIN_SCALE = 1.0;
const MAX_SCALE = 10.0;
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

  // Animated values for transform (useNativeDriver: false allows instantaneous setValue() during touch gestures)
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Real-time trackers for scale and pan
  const currentScale = useRef(1);
  const currentPan = useRef({ x: 0, y: 0 });

  // Multi-touch pinch tracking
  const isPinching = useRef(false);
  const startDistance = useRef(0);
  const startScale = useRef(1);

  // Single-finger pan tracking
  const isPanning = useRef(false);
  const startTouchX = useRef(0);
  const startTouchY = useRef(0);
  const startPanX = useRef(0);
  const startPanY = useRef(0);

  // Tap tracking
  const lastTapTime = useRef(0);

  // Reset transforms cleanly
  const resetZoom = useCallback((animated = true) => {
    currentScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    isPinching.current = false;
    isPanning.current = false;
    startDistance.current = 0;

    if (animated) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: false,
          bounciness: 4,
          speed: 18,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
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
    }
  }, [visible, resetZoom]);

  // Double-tap handler: toggles between 1x and 3.5x zoom centered at tap
  const handleDoubleTap = (centerX: number, centerY: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
    if (currentScale.current > 1.2) {
      resetZoom(true);
    } else {
      const targetScale = DOUBLE_TAP_SCALE;
      const offsetX = (SCREEN_WIDTH / 2 - centerX) * 0.9;
      const offsetY = (SCREEN_HEIGHT / 2 - centerY) * 0.9;

      currentScale.current = targetScale;
      currentPan.current = { x: offsetX, y: offsetY };

      Animated.parallel([
        Animated.spring(scale, {
          toValue: targetScale,
          useNativeDriver: false,
          bounciness: 4,
          speed: 16,
        }),
        Animated.spring(pan, {
          toValue: { x: offsetX, y: offsetY },
          useNativeDriver: false,
          bounciness: 4,
          speed: 16,
        }),
      ]).start();
    }
  };

  // PanResponder attached directly to the full-screen solid background
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => false,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        const now = Date.now();

        // Detect double-tap (within 350ms)
        if (touches.length === 1) {
          if (now - lastTapTime.current < 350) {
            lastTapTime.current = 0;
            handleDoubleTap(touches[0].pageX, touches[0].pageY);
            return;
          }
          lastTapTime.current = now;
        }

        if (touches.length >= 2) {
          isPinching.current = true;
          isPanning.current = false;
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          startDistance.current = Math.hypot(dx, dy);
          startScale.current = currentScale.current;
        } else if (touches.length === 1) {
          isPinching.current = false;
          isPanning.current = true;
          startTouchX.current = touches[0].pageX;
          startTouchY.current = touches[0].pageY;
          startPanX.current = currentPan.current.x;
          startPanY.current = currentPan.current.y;
        }
      },

      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.hypot(dx, dy);

          // If second finger just made contact during move, anchor distance smoothly
          if (!isPinching.current || startDistance.current <= 0) {
            isPinching.current = true;
            isPanning.current = false;
            startDistance.current = distance;
            startScale.current = currentScale.current;
            return;
          }

          if (startDistance.current > 0) {
            const factor = distance / startDistance.current;
            const newScale = Math.min(MAX_SCALE, Math.max(0.8, startScale.current * factor));
            currentScale.current = newScale;
            scale.setValue(newScale);
          }
        } else if (touches.length === 1) {
          // If we transitioned from 2 fingers down to 1 finger, re-anchor pan baseline
          if (isPinching.current || !isPanning.current) {
            isPinching.current = false;
            isPanning.current = true;
            startTouchX.current = touches[0].pageX;
            startTouchY.current = touches[0].pageY;
            startPanX.current = currentPan.current.x;
            startPanY.current = currentPan.current.y;
            return;
          }

          // When zoomed in, pan smoothly
          if (currentScale.current > 1.05) {
            const deltaX = touches[0].pageX - startTouchX.current;
            const deltaY = touches[0].pageY - startTouchY.current;

            const maxPanX = (SCREEN_WIDTH * (currentScale.current - 1)) / 2 + 100;
            const maxPanY = (SCREEN_HEIGHT * (currentScale.current - 1)) / 2 + 100;

            const newX = Math.min(maxPanX, Math.max(-maxPanX, startPanX.current + deltaX));
            const newY = Math.min(maxPanY, Math.max(-maxPanY, startPanY.current + deltaY));

            currentPan.current = { x: newX, y: newY };
            pan.setValue({ x: newX, y: newY });
          }
        }
      },

      onPanResponderRelease: () => {
        isPinching.current = false;
        isPanning.current = false;
        startDistance.current = 0;

        // If scale is at or near 1x, spring cleanly back to 1.0
        if (currentScale.current <= 1.05) {
          resetZoom(true);
        } else if (currentScale.current > MAX_SCALE) {
          currentScale.current = MAX_SCALE;
          Animated.spring(scale, {
            toValue: MAX_SCALE,
            useNativeDriver: false,
            bounciness: 4,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        isPinching.current = false;
        isPanning.current = false;
        startDistance.current = 0;
        if (currentScale.current <= 1.05) {
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
      <View style={styles.backdrop} {...panResponder.panHandlers}>
        <StatusBar barStyle="light-content" />

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
        <View style={styles.viewport} pointerEvents="none">
          <Animated.View
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
              transition={100}
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
    backgroundColor: '#000000', // Solid pitch black
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCloseBtn: {
    position: 'absolute',
    right: 18,
    zIndex: 9999,
    elevation: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
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
