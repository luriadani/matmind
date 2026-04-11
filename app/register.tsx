import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppContext } from '../components/Localization';
import { Brand, Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useColorScheme } from '../hooks/useColorScheme';

const SESSION_KEY = 'session_user_email';

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const palette = Colors[scheme];
  const { loadSessionUser } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleRegister = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const User = (await import('../entities/User')).default;
      const newUser = await User.createAccount({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      await AsyncStorage.setItem(SESSION_KEY, newUser.email);
      await loadSessionUser(newUser.email);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.message === 'EMAIL_TAKEN') {
        setError('An account with this email already exists.');
      } else {
        setError('Something went wrong. Please try again.');
        console.error('Register error:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logoRing, { backgroundColor: Brand.primaryMuted, borderColor: Brand.primary }]}>
            <Ionicons name="body" size={36} color={Brand.primary} />
          </View>
          <Text style={[styles.appName, { color: palette.text }]}>MatMind</Text>
          <Text style={[styles.tagline, { color: palette.textSecondary }]}>
            Your BJJ technique library
          </Text>
        </View>

        {/* Trial banner */}
        <View style={[styles.trialBanner, { backgroundColor: Brand.successMuted, borderColor: Brand.success }]}>
          <Ionicons name="gift-outline" size={18} color={Brand.success} />
          <Text style={[styles.trialText, { color: Brand.success }]}>
            Free 14-day trial — full access, no credit card needed
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.cardTitle, { color: palette.text }]}>Create account</Text>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>Full name</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
              <Ionicons name="person-outline" size={18} color={palette.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="Dan the White Belt"
                placeholderTextColor={palette.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
              <Ionicons name="mail-outline" size={18} color={palette.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="you@example.com"
                placeholderTextColor={palette.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>Password</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="At least 6 characters"
                placeholderTextColor={palette.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={palette.textTertiary}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: palette.textSecondary }]}>Confirm password</Text>
            <View style={[styles.inputRow, { backgroundColor: palette.surfaceSunken, borderColor: palette.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                placeholder="Same password again"
                placeholderTextColor={palette.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
              />
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: Brand.accentMuted }]}>
              <Ionicons name="alert-circle-outline" size={15} color={Brand.accent} />
              <Text style={[styles.errorText, { color: Brand.accent }]}>{error}</Text>
            </View>
          )}

          {/* Register button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: Brand.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>
            }
          </Pressable>
        </View>

        {/* Login link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={[styles.footerLink, { color: Brand.primary }]}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPaddingH,
    paddingVertical: 48,
    gap: 20,
  },

  // Brand
  brand: { alignItems: 'center', gap: 10 },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...Typography.titleLarge,
    fontWeight: '700',
  },
  tagline: { ...Typography.body },

  // Trial banner
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  trialText: { ...Typography.small, flex: 1, lineHeight: 18 },

  // Card
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    ...Typography.title,
    fontWeight: '700',
    marginBottom: 4,
  },

  // Fields
  fieldGroup: { gap: 6 },
  label: { ...Typography.smallMedium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  eyeBtn: { padding: 4 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { ...Typography.small, flex: 1 },

  // Button
  primaryBtn: {
    height: 50,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { ...Typography.body },
  footerLink: { ...Typography.bodyMedium, fontWeight: '600' },
});
