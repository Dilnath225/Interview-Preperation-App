/**
 * AI Mentor - Enterprise Sign Up Screen with Email OTP Verification
 */
import React, { useState, useEffect, useRef } from 'react';
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
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { useResponsive } from '../src/hooks/useResponsive';
import { useAuth } from '../src/context/AuthContext';

const POPULAR_ROLES = [
  'Full Stack Developer',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps / SRE',
  'Data Scientist / AI',
];

export default function SignUpScreen() {
  const router = useRouter();
  const { register, verifyOtp, resendOtp } = useAuth();

  // Registration step: 'form' | 'otp'
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('Full Stack Developer');
  const [customRole, setCustomRole] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCountdown > 0) {
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
  }, [step, resendCountdown]);

  const activeRole = customRole.trim() || targetRole;

  // Step 1: Initiate registration & request OTP
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(
        fullName.trim(),
        email.trim().toLowerCase(),
        password,
        activeRole
      );

      if (result.success && result.requireOtp) {
        setStep('otp');
        setResendCountdown(60);
        setOtp('');
      } else if (result.success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Registration Failed', result.message || 'Could not register.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      Alert.alert('Incomplete Code', 'Please enter the complete 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const result = await verifyOtp(email.trim().toLowerCase(), otp.trim());
      if (result.success) {
        Alert.alert('Account Verified!', 'Welcome to AI Mentor. Your workspace is ready.', [
          { text: 'Get Started', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Verification Failed', result.message || 'Invalid or expired code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to verify code.');
    } finally {
      setVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setResending(true);
    try {
      const res = await resendOtp(email.trim().toLowerCase());
      if (res.success) {
        setResendCountdown(60);
        setCanResend(false);
        Alert.alert('Code Resent', 'A fresh 6-digit confirmation code has been dispatched to your email.');
      } else {
        Alert.alert('Resend Failed', res.message || 'Could not resend code.');
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
          <ResponsiveContainer maxWidth={500}>
            {/* STEP 1: REGISTRATION FORM */}
            {step === 'form' ? (
              <>
              {/* Header Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Ionicons name="sparkles" size={28} color={Colors.primary} />
                </View>
              </View>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Unlock enterprise-grade AI technical interview preparation.
              </Text>

              {/* Form */}
              <View style={styles.form}>
                <Input
                  label="FULL NAME"
                  icon="person-outline"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Kasun Jayawardena"
                />

                <Input
                  label="EMAIL ADDRESS"
                  icon="mail-outline"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="PASSWORD"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  isPassword
                />

                {/* Preferred Role Selector */}
                <Text style={styles.roleLabel}>TARGET JOB ROLE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.roleChipsRow}
                >
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = targetRole === role && !customRole;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleChip, isSelected && styles.roleChipActive]}
                        onPress={() => {
                          setTargetRole(role);
                          setCustomRole('');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                          {role}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Custom Role Input */}
                <View style={styles.customRoleRow}>
                  <Ionicons name="pencil-outline" size={15} color={Colors.textMuted} />
                  <TextInput
                    style={styles.customRoleInput}
                    placeholder="Or type custom role (e.g., Staff ML Engineer)..."
                    placeholderTextColor={Colors.textMuted}
                    value={customRole}
                    onChangeText={setCustomRole}
                  />
                </View>

                {/* Sign Up Button */}
                <Button
                  title="Send Verification Code"
                  onPress={handleSignUp}
                  loading={loading}
                  variant="primary"
                  style={styles.signUpButton}
                />

                {/* Security Note */}
                <View style={styles.securityNote}>
                  <Ionicons name="shield-checkmark-outline" size={15} color={Colors.primary} />
                  <Text style={styles.securityNoteText}>
                    A 6-digit confirmation code will be sent to your email to verify identity.
                  </Text>
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
              </View>
            </>
          ) : (
            /* STEP 2: EMAIL OTP VERIFICATION */
            <View style={styles.otpCard}>
              <View style={styles.otpIconCircle}>
                <Ionicons name="mail-unread-outline" size={38} color={Colors.primary} />
              </View>

              <Text style={styles.otpTitle}>Verify Your Email</Text>
              <Text style={styles.otpSubtitle}>
                We've sent a 6-digit verification code to:
              </Text>
              <Text style={styles.otpEmail}>{email}</Text>

              {/* 6-Digit OTP Box */}
              <View style={styles.otpInputWrapper}>
                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  placeholderTextColor="#3A4D66"
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  textAlign="center"
                />
              </View>

              {/* Verify Button */}
              <Button
                title={verifying ? 'Verifying...' : 'Confirm & Activate Account'}
                onPress={handleVerifyOtp}
                loading={verifying}
                variant="primary"
                style={styles.verifyBtn}
              />

              {/* Resend and Edit Actions */}
              <View style={styles.otpActionsRow}>
                {canResend ? (
                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResendOtp}
                    disabled={resending}
                    activeOpacity={0.7}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
                        <Text style={styles.resendBtnText}>Resend Code</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.countdownText}>
                    Resend code in <Text style={{ color: Colors.primary, fontWeight: '700' }}>{resendCountdown}s</Text>
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.editEmailBtn}
                  onPress={() => setStep('form')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back-outline" size={15} color={Colors.textMuted} />
                  <Text style={styles.editEmailText}>Edit email</Text>
                </TouchableOpacity>
              </View>

              {/* Helpful tip */}
              <View style={styles.otpTipBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.otpTipText}>
                  Check your spam/junk folder if the email doesn't appear in your inbox within 30 seconds.
                </Text>
              </View>
            </View>
          )}
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#121C2B', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.25)' },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 20 },
  form: { width: '100%' },
  roleLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  roleChipsRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  roleChip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: '#101824', borderWidth: 1, borderColor: '#1C293A' },
  roleChipActive: { backgroundColor: 'rgba(0, 245, 212, 0.12)', borderColor: Colors.primary },
  roleChipText: { fontSize: Typography.caption, color: Colors.textSecondary, fontWeight: Typography.medium },
  roleChipTextActive: { color: Colors.primary, fontWeight: Typography.bold },
  customRoleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#101824', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#1C293A', paddingHorizontal: Spacing.md, height: 44, marginTop: Spacing.xs, marginBottom: Spacing.lg, gap: Spacing.sm },
  customRoleInput: { flex: 1, fontSize: Typography.bodySmall, color: Colors.textPrimary },
  signUpButton: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  securityNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0C1622', borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: '#172738', marginBottom: Spacing.lg },
  securityNoteText: { flex: 1, fontSize: Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  footerText: { fontSize: Typography.bodySmall, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.bold },

  // OTP View Styles
  otpCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xxl, borderWidth: 1, borderColor: '#1C2A3C', alignItems: 'center' },
  otpIconCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#152336', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: Spacing.lg },
  otpTitle: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  otpSubtitle: { fontSize: Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center' },
  otpEmail: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary, marginTop: 4, marginBottom: Spacing.xxl },
  otpInputWrapper: { width: '100%', marginBottom: Spacing.xl },
  otpInput: { width: '100%', height: 64, backgroundColor: '#152132', borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.primary, fontSize: 32, fontWeight: '800', color: Colors.primary, letterSpacing: 10, textAlign: 'center' },
  verifyBtn: { width: '100%', marginBottom: Spacing.lg },
  otpActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: Spacing.xs, marginBottom: Spacing.lg },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  resendBtnText: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.bold },
  countdownText: { fontSize: Typography.bodySmall, color: Colors.textMuted },
  editEmailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm },
  editEmailText: { fontSize: Typography.bodySmall, color: Colors.textMuted, fontWeight: Typography.medium },
  otpTipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: '#121D2C', borderRadius: BorderRadius.md, padding: Spacing.md, width: '100%' },
  otpTipText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
});
