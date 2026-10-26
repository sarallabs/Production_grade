import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useDeviceLayout } from '@/hooks/use-device-layout';

const VALID_PASSCODE = 'ANGRAU@2026';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { isTablet } = useDeviceLayout();
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleLogin = async () => {
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Please enter your access code to continue');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Validate access passcode
    if (trimmed !== VALID_PASSCODE && trimmed.toUpperCase() !== VALID_PASSCODE) {
      setError('Invalid access code. Please enter ANGRAU@2026');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await login(VALID_PASSCODE);
      router.replace('/landing');
    } catch {
      setError('Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDefaultPasscode = () => {
    setPassword(VALID_PASSCODE);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
          isKeyboardVisible && styles.keyboardActiveScrollContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isTablet && styles.tabletMainWrapper]}>
          {/* Top Tree Logo */}
          <View style={[styles.brandLogoContainer, isKeyboardVisible && styles.brandLogoContainerCompact]}>
            <Image
              source={require('@/assets/images/saral-logo.png')}
              style={[styles.brandLogo, isKeyboardVisible && styles.brandLogoCompact]}
              contentFit="contain"
            />
          </View>

          {/* Golden Headline */}
          <Text style={[styles.headline, isKeyboardVisible && styles.headlineCompact]}>
            Personalised Adaptive Learning{'\n'}Platform exclusively built for Students.
          </Text>

          {/* University Material Pill - hidden when typing to maximize visible space */}
          {!isKeyboardVisible && (
            <>
              <View style={styles.pillContainer}>
                <Text style={styles.pillText}>
                  Grounded in your university's course material
                </Text>
              </View>

              <View style={[styles.pillContainer, styles.pillSecondary]}>
                <Text style={styles.pillTextSecondary}>
                  Mindmaps · Read · Listen · Watch
                </Text>
              </View>
            </>
          )}

          {/* University Logo Circular Badge */}
          <View style={[styles.universityCircleBadge, isKeyboardVisible && styles.universityCircleBadgeCompact]}>
            <Image
              source={require('@/assets/images/angrau-logo.png')}
              style={styles.universityLogoImage}
              contentFit="contain"
            />
          </View>

          {/* White Card Container */}
          <View style={styles.whiteCard}>
            <Text style={styles.cardTitle}>Welcome to Saral Vidhya</Text>
            <Text style={styles.cardSubtitle}>Enter your access code to continue</Text>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Input Box with live visible text & eye toggle */}
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="ANGRAU@2026"
                placeholderTextColor="#9CA3AF"
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
              {password.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPassword('')}
                  style={styles.clearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowPassword((prev) => !prev);
                }}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Hide passcode' : 'Show passcode'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#65786E"
                />
              </TouchableOpacity>
            </View>

            {/* Quick passcode hint helper */}
            <TouchableOpacity onPress={fillDefaultPasscode} style={styles.quickHintRow}>
              <Text style={styles.quickHintText}>
                Passcode: <Text style={styles.quickHintBold}>ANGRAU@2026</Text> (tap to fill)
              </Text>
            </TouchableOpacity>

            {/* Enter Button */}
            <TouchableOpacity
              style={[styles.enterButton, isSubmitting && styles.enterButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.enterButtonText}>Enter</Text>
              )}
            </TouchableOpacity>

            {/* 3 Pillars: Learn, Practice, Prepare */}
            <View style={styles.pillarsRow}>
              <View style={[styles.pillarPill, styles.learnPill]}>
                <Text style={[styles.pillarText, styles.learnText]}>Learn</Text>
              </View>
              <View style={[styles.pillarPill, styles.practicePill]}>
                <Text style={[styles.pillarText, styles.practiceText]}>Practice</Text>
              </View>
              <View style={[styles.pillarPill, styles.preparePill]}>
                <Text style={[styles.pillarText, styles.prepareText]}>Prepare</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#20332A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 36,
  },
  keyboardActiveScrollContent: {
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 220,
  },
  tabletScrollContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  mainWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  tabletMainWrapper: {
    maxWidth: 440,
  },
  brandLogoContainer: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandLogoContainerCompact: {
    height: 75,
    marginBottom: 2,
  },
  brandLogo: {
    width: 220,
    height: 130,
  },
  brandLogoCompact: {
    width: 130,
    height: 70,
  },
  headline: {
    fontSize: 17,
    fontWeight: '700',
    color: '#E8C99B',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  headlineCompact: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  pillContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 18,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSecondary: {
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  pillText: {
    color: '#E3ECE6',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillTextSecondary: {
    color: '#CDE0D6',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  universityCircleBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 9,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
  },
  universityCircleBadgeCompact: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 6,
    marginBottom: 10,
  },
  universityLogoImage: {
    width: '100%',
    height: '100%',
  },
  whiteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B2E24',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#65786E',
    marginBottom: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
  },
  inputBox: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2E24',
    letterSpacing: 1.5,
  },
  clearButton: {
    padding: 4,
  },
  eyeButton: {
    padding: 6,
    marginLeft: 4,
  },
  quickHintRow: {
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  quickHintText: {
    fontSize: 11.5,
    color: '#82958B',
  },
  quickHintBold: {
    color: '#BA6E43',
    fontWeight: '700',
  },
  enterButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#BA6E43',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
    shadowColor: '#BA6E43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  enterButtonDisabled: {
    opacity: 0.65,
  },
  enterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  pillarPill: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnPill: {
    backgroundColor: '#F3FAF6',
    borderColor: '#7EAD98',
  },
  practicePill: {
    backgroundColor: '#FDF6F1',
    borderColor: '#C88358',
  },
  preparePill: {
    backgroundColor: '#FAF4EF',
    borderColor: '#C98F6C',
  },
  pillarText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  learnText: {
    color: '#285C45',
  },
  practiceText: {
    color: '#9C542B',
  },
  prepareText: {
    color: '#965A31',
  },
});

