import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
const MAX_SCALE = 6.0;
const DOUBLE_TAP_SCALE = 2.8;

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
  title,
  subtitle,
  onClose,
}: ZoomableImageModalProps) {
  const insets = useSafeAreaInsets();

  // Animated values for smooth transform
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Numerical tracker references for gesture calculations
  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [currentZoomDisplay, setCurrentZoomDisplay] = useState('1.0x');
  const [isZoomed, setIsZoomed] = useState(false);

  // Multi-touch tracking
  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const lastTouchTimeRef = useRef(0);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  // Update numerical tracker
  useEffect(() => {
    const scaleListener = scale.addListener(({ value }) => {
      scaleRef.current = value;
      setCurrentZoomDisplay(`${value.toFixed(1)}x`);
      setIsZoomed(value > 1.08);
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
          speed: 16,
        }),
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          bounciness: 4,
          speed: 16,
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
    if (scaleRef.current > 1.15) {
      // Zoom out to normal
      resetZoom(true);
    } else {
      // Zoom in centered towards tap point
      const targetScale = DOUBLE_TAP_SCALE;
      const offsetX = (SCREEN_WIDTH / 2 - centerX) * 0.8;
      const offsetY = (SCREEN_HEIGHT / 2 - centerY) * 0.8;

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
  // 1. Pinch to zoom in/out with 2 fingers
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
          // Pinch zooming (smooth scaling with natural touch distance)
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.hypot(dx, dy);

          if (initialDistanceRef.current > 0) {
            const rawScale =
              (currentDistance / initialDistanceRef.current) * initialScaleRef.current;
            const boundedScale = Math.min(MAX_SCALE + 0.3, Math.max(0.85, rawScale));
            scale.setValue(boundedScale);
          }
        } else if (touches.length === 1 && scaleRef.current > 1.05) {
          // Panning when zoomed in
          const currentScale = scaleRef.current;
          const maxPanX = (SCREEN_WIDTH * (currentScale - 1)) / 2 + 50;
          const maxPanY = (SCREEN_HEIGHT * (currentScale - 1)) / 2 + 50;

          const newX = lastPanPosRef.current.x + gestureState.dx;
          const newY = lastPanPosRef.current.y + gestureState.dy;

          const clampedX = Math.min(maxPanX, Math.max(-maxPanX, newX));
          const clampedY = Math.min(maxPanY, Math.max(-maxPanY, newY));

          pan.setValue({ x: clampedX, y: clampedY });
        }
      },
      onPanResponderRelease: () => {
        // If pinched below 1.05, snap smoothly back to normal
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
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />

        {/* Top Header Controls */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 36) }]}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || 'Visual Infographic'}
            </Text>
            {subtitle ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerRightControls}>
            {/* Live Zoom Level Indicator (Visible when zoomed) */}
            {isZoomed && (
              <View style={styles.zoomPill}>
                <Text style={styles.zoomPillText}>{currentZoomDisplay}</Text>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
                onClose();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.8}
              accessibilityLabel="Close viewer"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Interactive Viewport Area with Pure Touch Gestures */}
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
              transition={200}
            />
          </Animated.View>
        </View>

        {/* Bottom Floating Clean Touch Hint Pill (No intrusive buttons) */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 14, 24) }]}>
          <View style={styles.gestureHintPill}>
            <Ionicons
              name={isZoomed ? 'move-outline' : 'finger-print-outline'}
              size={13}
              color="rgba(255, 255, 255, 0.75)"
            />
            <Text style={styles.gestureHintText}>
              {isZoomed
                ? `${currentZoomDisplay} • Drag to pan • Double-tap to reset`
                : 'Pinch with two fingers or double-tap to zoom in'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(7, 14, 10, 0.96)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    zIndex: 20,
    backgroundColor: 'rgba(7, 14, 10, 0.75)',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    marginTop: 2,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoomPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoomPillText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '94%',
    height: '94%',
  },
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  gestureHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 43, 33, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(45, 69, 56, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  gestureHintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
