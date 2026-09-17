/**
 * AI Mentor - Sign In Screen (Functionalized with Backend API)
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

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid email or password.');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Your silent mentor is ready to help you excel.
          </Text>

          {/* Form Fields */}
          <View style={styles.form}>
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
              rightLabel="Forgot Password?"
              onRightLabelPress={() => {}}
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              isPassword
            />

            {/* Quick Demo Fill */}
            <TouchableOpacity
              style={styles.demoFillBtn}
              onPress={() => {
                setEmail('demo@aimentor.com');
                setPassword('password123');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="flash-outline" size={14} color={Colors.primary} />
              <Text style={styles.demoFillText}>Fill Demo Credentials (demo@aimentor.com)</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              variant="primary"
              style={styles.signInButton}
            />

            {/* Or Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/sign-up')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Register</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.xxl },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#162232', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxxl, lineHeight: 22 },
  form: { width: '100%' },
  demoFillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0, 245, 212, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.25)', borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: 12, marginTop: 4, marginBottom: Spacing.md },
  demoFillText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.primary },
  signInButton: { marginTop: Spacing.xs, marginBottom: Spacing.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E2A3A' },
  dividerText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.textMuted, marginHorizontal: Spacing.md, letterSpacing: 1 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#151E2B', borderRadius: BorderRadius.md, height: 54, borderWidth: 1, borderColor: '#222F42', gap: Spacing.md },
  googleButtonText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.huge },
  footerText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  registerLink: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.bold },
});
