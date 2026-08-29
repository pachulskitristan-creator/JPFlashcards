// screens/LoginScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import PatternBackground from '../components/PatternBackground';
import { ThemeColors } from '../theme/theme';

interface LoginScreenProps {
  colors: ThemeColors;
}

type Mode = 'login' | 'signup';

export default function LoginScreen({ colors }: LoginScreenProps) {
  const { signIn, signUp, resetPassword, setGuestMode } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Enter an email and password.');
      return;
    }
    setSubmitting(true);
    const result = mode === 'login' ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then log in.');
      setMode('login');
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Enter your email above first, then tap this again.');
      return;
    }
    const result = await resetPassword(email.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setInfo('Password reset email sent.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PatternBackground opacity={0.25} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Image
          source={require('../assets/images/adaptive-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>単語カード</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {mode === 'login' ? 'Welcome back' : 'Create an account'}
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
        {info ? <Text style={[styles.infoText, { color: colors.success }]}>{info}</Text> : null}

        <Pressable
          style={[styles.submitButton, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </Text>
        </Pressable>

        {mode === 'login' ? (
          <Pressable onPress={handleForgotPassword} hitSlop={8}>
            <Text style={[styles.link, { color: colors.textSecondary }]}>Forgot password?</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setInfo(null);
          }}
          hitSlop={8}
          style={styles.switchModeRow}
        >
          <Text style={[styles.link, { color: colors.primary, fontWeight: '700' }]}>
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </Pressable>

        <Pressable onPress={() => setGuestMode(true)} hitSlop={8} style={styles.guestRow}>
          <Text style={[styles.guestLink, { color: colors.textSecondary }]}>Continue as Guest</Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    fontSize: 13,
    marginTop: 16,
  },
  switchModeRow: {
    marginTop: 4,
  },
  guestRow: {
    marginTop: 28,
  },
  guestLink: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
