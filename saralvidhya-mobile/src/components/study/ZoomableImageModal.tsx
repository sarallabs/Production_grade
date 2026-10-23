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

// Unrestricted deep zoom so users can see tiny microscopic diagram labels
const MIN_SCALE = 1.0;
const MAX_SCALE = 12.0;
const DOUBLE_TAP_SCALE = 3.5;

export interface ZoomableImageModalProps {
  visible: boolean;
  imageSource: any; // Can be require(...) or { uri: string }
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
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const lastTouchTimeRef = useRef(0);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  // Update numerical tracker
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

  // Reset transforms smoothly whenever modal opens or resets
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
    }
  }, [visible, resetZoom]);

  // Double tap handler
  const handleDoubleTap = (centerX: number, centerY: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
    if (scaleRef.current > 1.2) {
      // Zoom out to normal
      resetZoom(true);
    } else {
      // Zoom in deeply centered towards tap point
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

  // PanResponder to handle natural touch gestures:
  // 1. Pinch to zoom in/out with 2 fingers freely up to 12x
  // 2. Drag to pan around with 1 finger when zoomed in
  // 3. Double-tap to quickly zoom in / zoom back out
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.numberActiveTouches > 1 ||
          Math.abs(gestureState.dx) > 3 ||
          Math.abs(gestureState.dy) > 3
        );
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        const now = Date.now();

        // Detect double tap (within 300ms)
        if (touches.length === 1 && now - lastTouchTimeRef.current < 300) {
          handleDoubleTap(touches[0].pageX, touches[0].pageY);
          lastTouchTimeRef.current = 0;
          return;
        }
        lastTouchTimeRef.current = now;

        if (touches.length === 2) {
          // Pinch start
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          initialDistanceRef.current = Math.hypot(dx, dy);
          initialScaleRef.current = scaleRef.current;
        } else if (touches.length === 1) {
          // Pan start
          lastPanPosRef.current = { x: panRef.current.x, y: panRef.current.y };
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch zooming (smooth scaling with natural touch distance, unconstrained up to 12x)
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.hypot(dx, dy);

          if (initialDistanceRef.current > 0) {
            const rawScale =
              (currentDistance / initialDistanceRef.current) * initialScaleRef.current;
            const boundedScale = Math.min(MAX_SCALE + 0.5, Math.max(0.8, rawScale));
            scale.setValue(boundedScale);
          }
        } else if (touches.length === 1 && scaleRef.current > 1.05) {
          // Panning when zoomed in
          const currentScale = scaleRef.current;
          const maxPanX = (SCREEN_WIDTH * (currentScale - 1)) / 2 + 100;
          const maxPanY = (SCREEN_HEIGHT * (currentScale - 1)) / 2 + 100;

          const newX = lastPanPosRef.current.x + gestureState.dx;
          const newY = lastPanPosRef.current.y + gestureState.dy;

          const clampedX = Math.min(maxPanX, Math.max(-maxPanX, newX));
          const clampedY = Math.min(maxPanY, Math.max(-maxPanY, newY));

          pan.setValue({ x: clampedX, y: clampedY });
        }
      },
      onPanResponderRelease: () => {
        // If pinched below 1.05, snap smoothly back to normal 1x
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
    })
  ).current;

  if (!visible) return null;

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

        {/* Minimal Floating Close Button Only (No text, no clutter) */}
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
    backgroundColor: '#000000', // Solid pitch-black so background reading text never bleeds through
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCloseBtn: {
    position: 'absolute',
    right: 18,
    zIndex: 99,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
