import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { Colors, BorderRadius, Spacing, TabletFontSize } from '@/constants/theme';
import { useDeviceLayout } from '@/hooks/use-device-layout';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsDemoStudent } = useAuth();
  const { isDark } = useAppTheme();
  const { isTablet } = useDeviceLayout();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!password.trim()) {
      setError('Please enter your access password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setError('');
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await login(password.trim());
      router.replace('/landing');
    } catch {
      setError('Failed to login. Please check your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await loginAsDemoStudent();
      router.replace('/landing');
    } catch {
      setError('Failed demo login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: isDark ? '#2D3E36' : '#FFF6F1' }]}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]} keyboardShouldPersistTaps="handled">
       <View style={isTablet ? styles.tabletRow : undefined}>
        <View style={isTablet ? styles.tabletLeft : undefined}>
        {/* Header / Logo */}
        <View style={styles.brandHeader}>
          <View style={[styles.logoBadge, isTablet && styles.tabletLogoBadge, { backgroundColor: isDark ? '#23322B' : '#ffffff', borderColor: isDark ? '#3D5449' : '#E5DDD8' }]}>
            <Ionicons name="school" size={isTablet ? 56 : 42} color="#22c55e" />
          </View>
          <Text style={[styles.brandTitle, isTablet && { fontSize: TabletFontSize.display }, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>Saral Vidhya</Text>
          <Text style={[styles.brandSubtitle, isTablet && { fontSize: TabletFontSize.body, maxWidth: 360 }, { color: isDark ? '#A6C5B3' : '#688875' }]}>
            Acharya N.G. Ranga Agricultural University (ANGRAU)
          </Text>
        </View>
        </View>

        <View style={isTablet ? styles.tabletRight : undefined}>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#23322B' : '#ffffff', borderColor: isDark ? '#3D5449' : '#E5DDD8' }]}>
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}>Student Access</Text>
          <Text style={[styles.cardDescription, { color: isDark ? '#A6C5B3' : '#688875' }]}>
            Enter your university passcode to access your courses, subjects, and study tools.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? '#A6C5B3' : '#557A65' }]}>Access Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#1C2822' : '#F7EBE3', borderColor: isDark ? '#3D5449' : '#E5DDD8' }]}>
              <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#A6C5B3' : '#688875'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#1C2E24' }]}
                placeholder="Enter passcode..."
                placeholderTextColor={isDark ? '#7E998B' : '#8A7A70'}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isDark ? '#A6C5B3' : '#688875'}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Unlock & Enter</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3D5449' : '#E5DDD8' }]} />
            <Text style={[styles.dividerText, { color: isDark ? '#A6C5B3' : '#688875' }]}>OR QUICK ACCESS</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#3D5449' : '#E5DDD8' }]} />
          </View>

          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)', borderColor: '#22c55e' }]}
            onPress={handleDemoLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color="#22c55e" />
            <Text style={styles.demoButtonText}>Continue as ANGRAU Student</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerNote, { color: isDark ? '#A6C5B3' : '#688875' }]}>
          Powered by Saral Labs • AI-Assisted Agricultural Learning
        </Text>
        </View>
       </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D3E36',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    paddingTop: Platform.OS === 'android' ? 60 : 40,
    paddingBottom: 40,
  },
  tabletScrollContent: {
    alignItems: 'center',
    padding: 48,
  },
  tabletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 56,
    width: '100%',
    maxWidth: 1000,
  },
  tabletLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletRight: {
    flex: 1,
    maxWidth: 520,
  },
  tabletLogoBadge: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#22c55e33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: BorderRadius.xl,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: Spacing.three,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.two,
    marginBottom: Spacing.three,
    gap: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: Spacing.three,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#f8fafc',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#22c55e',
    borderRadius: BorderRadius.md,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: '#064e3b33',
    borderColor: '#22c55e66',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  demoButtonText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    marginTop: Spacing.four,
  },
});
