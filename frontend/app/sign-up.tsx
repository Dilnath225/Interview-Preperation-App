/**
 * AI Mentor - Sign Up Screen (Functionalized with Backend API)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { useAuth } from '../src/context/AuthContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(fullName.trim(), email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Registration Failed', result.message || 'Could not create account.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sparkle Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={32} color={Colors.textPrimary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join AI Mentor and unlock your personalized interview prep.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="FULL NAME"
              icon="person-outline"
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Shanu Fernando"
            />

            <Input
              label="EMAIL ADDRESS"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="PASSWORD"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              isPassword
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              variant="primary"
              style={styles.signUpButton}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign Up */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleSignUp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/sign-in')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#162232', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl, lineHeight: 22 },
  form: { width: '100%' },
  signUpButton: { marginTop: Spacing.sm, marginBottom: Spacing.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E2A3A' },
  dividerText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.textMuted, marginHorizontal: Spacing.md, letterSpacing: 1 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#151E2B', borderRadius: BorderRadius.md, height: 54, borderWidth: 1, borderColor: '#222F42', gap: Spacing.md },
  googleButtonText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xxl },
  footerText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.bold },
});
