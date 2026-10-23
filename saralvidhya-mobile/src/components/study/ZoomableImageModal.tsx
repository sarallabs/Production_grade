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
  Platform,
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
    });
    const panListener = pan.addListener((value) => {
      panRef.current = value;
    });

    return () => {
      scale.removeListener(scaleListener);
      pan.removeListener(panListener);
    };
  }, [scale, pan]);

  // Reset transforms whenever modal opens/closes
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

  // Zoom In button handler
  const handleZoomIn = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
    const newScale = Math.min(MAX_SCALE, Math.round((scaleRef.current + 0.8) * 10) / 10);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: true,
      bounciness: 4,
      speed: 16,
    }).start();
  };

  // Zoom Out button handler
  const handleZoomOut = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
    const newScale = Math.max(MIN_SCALE, Math.round((scaleRef.current - 0.8) * 10) / 10);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: newScale,
        useNativeDriver: true,
        bounciness: 4,
        speed: 16,
      }),
      ...(newScale === 1
        ? [
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              bounciness: 4,
              speed: 16,
            }),
          ]
        : []),
    ]).start();
  };

  // Double tap handler
  const handleDoubleTap = (centerX: number, centerY: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch {}
    if (scaleRef.current > 1.2) {
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

  // PanResponder to handle 1-finger panning, double-tap, and 2-finger pinch
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
          // Pinch zooming
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.hypot(dx, dy);

          if (initialDistanceRef.current > 0) {
            const rawScale =
              (currentDistance / initialDistanceRef.current) * initialScaleRef.current;
            const boundedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, rawScale));
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
        // If scale fell below 1, snap back to 1
        if (scaleRef.current < 1) {
          resetZoom(true);
        } else if (scaleRef.current > MAX_SCALE) {
          Animated.spring(scale, {
            toValue: MAX_SCALE,
            useNativeDriver: true,
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
            {/* Live Zoom Level Indicator */}
            <View style={styles.zoomPill}>
              <Text style={styles.zoomPillText}>{currentZoomDisplay}</Text>
            </View>

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

        {/* Interactive Viewport Area with Gestures */}
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

        {/* Bottom Floating Control Bar */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          <View style={styles.toolbarCard}>
            {/* Zoom Out Button */}
            <TouchableOpacity
              style={[styles.toolBtn, scaleRef.current <= 1.05 && styles.toolBtnDisabled]}
              onPress={handleZoomOut}
              disabled={scaleRef.current <= 1.0}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="remove"
                size={20}
                color={scaleRef.current <= 1.05 ? 'rgba(255,255,255,0.35)' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <View style={styles.toolDivider} />

            {/* Reset 1x Button */}
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); } catch {}
                resetZoom(true);
              }}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={15} color="#10B981" />
              <Text style={styles.resetBtnText}>1x Reset</Text>
            </TouchableOpacity>

            <View style={styles.toolDivider} />

            {/* Zoom In Button */}
            <TouchableOpacity
              style={[styles.toolBtn, scaleRef.current >= MAX_SCALE && styles.toolBtnDisabled]}
              onPress={handleZoomIn}
              disabled={scaleRef.current >= MAX_SCALE}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="add"
                size={20}
                color={scaleRef.current >= MAX_SCALE ? 'rgba(255,255,255,0.35)' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* Hint Label */}
          <Text style={styles.hintText}>
            Pinch to zoom in/out • Double-tap to focus • Drag to pan details
          </Text>
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
    color: '#A6C5B3',
    fontSize: 12,
    marginTop: 2,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  zoomPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  zoomPillText: {
    color: '#10B981',
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewport: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
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
    gap: 8,
  },
  toolbarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 43, 33, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(45, 69, 56, 0.8)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    gap: 6,
  },
  toolBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnDisabled: {
    opacity: 0.4,
  },
  toolDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    gap: 5,
  },
  resetBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
