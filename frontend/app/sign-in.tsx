/**
 * AI Mentor - Sign In Screen (With Unverified Account OTP Recovery)
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
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
  const { login, verifyOtp, resendOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP flow for unverified accounts trying to log in
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer: any;
    if (requireOtp && resendCountdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [requireOtp, resendCountdown]);

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
      } else if (result.requireOtp) {
        setRequireOtp(true);
        setResendCountdown(60);
        Alert.alert(
          'Email Verification Required',
          result.message || 'Please enter the 6-digit verification code sent to your email.'
        );
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otpCode.trim());
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification Failed', res.message || 'Invalid code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const res = await resendOtp(email.trim().toLowerCase());
      if (res.success) {
        setResendCountdown(60);
        setCanResend(false);
        Alert.alert('Code Sent', 'A fresh 6-digit confirmation code has been sent to your email.');
      } else {
        Alert.alert('Resend Failed', res.message || 'Could not send code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Sparkle Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={30} color={Colors.primary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Your AI interview mentor is ready to help you excel.
          </Text>

          {requireOtp ? (
            /* OTP CONFIRMATION BOX FOR UNVERIFIED ACCOUNTS */
            <View style={styles.otpCard}>
              <View style={styles.otpHeaderRow}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <Text style={styles.otpTitle}>Email Verification</Text>
              </View>
              <Text style={styles.otpDesc}>
                Enter the 6-digit verification code sent to <Text style={{ color: Colors.primary, fontWeight: '700' }}>{email}</Text>:
              </Text>

              <TextInput
                style={styles.otpInput}
                placeholder="• • • • • •"
                placeholderTextColor="#3A4D66"
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                textAlign="center"
              />

              <Button
                title={verifyingOtp ? 'Verifying...' : 'Confirm & Sign In'}
                onPress={handleVerifyOtp}
                loading={verifyingOtp}
                variant="primary"
                style={{ width: '100%', marginBottom: Spacing.md }}
              />

              <View style={styles.otpFooterRow}>
                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resending}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                        <Text style={styles.resendText}>Resend Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={{ color: Colors.primary }}>{resendCountdown}s</Text>
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => setRequireOtp(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* STANDARD SIGN IN FORM */
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
            </View>
          )}

          {/* Footer Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/sign-up')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Register with Email</Text>
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
  iconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#121C2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.25)' },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl, lineHeight: 20 },
  form: { width: '100%' },
  demoFillBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0, 245, 212, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.25)', borderRadius: BorderRadius.md, paddingVertical: 10, paddingHorizontal: 12, marginTop: 4, marginBottom: Spacing.md },
  demoFillText: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Colors.primary },
  signInButton: { marginTop: Spacing.xs, marginBottom: Spacing.xl },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xxl },
  footerText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  registerLink: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.bold },

  // OTP Card
  otpCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: '#1C2A3C', width: '100%', marginBottom: Spacing.lg },
  otpHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  otpTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.textPrimary },
  otpDesc: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg },
  otpInput: { width: '100%', height: 56, backgroundColor: '#152132', borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.primary, fontSize: 26, fontWeight: '800', color: Colors.primary, letterSpacing: 8, textAlign: 'center', marginBottom: Spacing.lg },
  otpFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  resendText: { fontSize: Typography.caption, color: Colors.primary, fontWeight: Typography.bold },
  timerText: { fontSize: Typography.caption, color: Colors.textMuted },
  backToLoginText: { fontSize: Typography.caption, color: Colors.textMuted, fontWeight: Typography.medium },
});
