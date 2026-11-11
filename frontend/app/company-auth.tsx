/**
 * AI Mentor - Enterprise Recruiter & Company Authentication
 * Dedicated Sign In and Registration for Hiring Companies
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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { api } from '../src/services/api';

export default function CompanyAuthScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [companySize, setCompanySize] = useState('50-200');
  const [location, setLocation] = useState('Hybrid / Colombo & Remote');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Please enter your work email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.companyLogin(email.trim().toLowerCase(), password);
      if (res.success) {
        router.replace('/company-dashboard');
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid company credentials.');
      }
    } catch (err: any) {
      Alert.alert('Login Error', err.response?.data?.message || err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!companyName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Details', 'Company Name, Work Email, and Password are required.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.companyRegister({
        name: companyName.trim(),
        email: email.trim().toLowerCase(),
        password,
        website: website.trim() || undefined,
        industry: industry.trim() || 'Technology',
        size: companySize,
        location: location.trim() || undefined,
      });

      if (res.success) {
        Alert.alert('Registration Successful', 'Welcome to AI Mentor Enterprise Hiring Portal!');
        router.replace('/company-dashboard');
      } else {
        Alert.alert('Registration Failed', res.message || 'Unable to register company.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to register company.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ResponsiveContainer maxWidth={520}>
            {/* Top Navigation */}
            <TouchableOpacity style={styles.backRow} onPress={() => router.push('/portal-select')}>
              <Ionicons name="arrow-back" size={20} color="#94A3B8" />
              <Text style={styles.backText}>Switch Workspace Portal</Text>
            </TouchableOpacity>

            {/* Brand Header */}
            <View style={styles.header}>
              <View style={styles.badge}>
                <Ionicons name="business" size={14} color="#38BDF8" />
                <Text style={styles.badgeText}>ENTERPRISE RECRUITER SUITE</Text>
              </View>
              <Text style={styles.title}>
                {activeTab === 'login' ? 'Recruiter Sign In' : 'Register Your Company'}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'login'
                  ? 'Access your talent pipeline, job postings, and applicant tracking dashboard.'
                  : 'Hire pre-vetted senior software talent with 100% verified readiness scores.'}
              </Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
                onPress={() => setActiveTab('login')}
              >
                <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                  Company Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'register' && styles.tabBtnActive]}
                onPress={() => setActiveTab('register')}
              >
                <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                  Register Company
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              {activeTab === 'register' && (
                <>
                  <Text style={styles.inputLabel}>Company Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Google, WSO2, MillenniumIT"
                    placeholderTextColor="#64748B"
                    value={companyName}
                    onChangeText={setCompanyName}
                  />

                  <Text style={styles.inputLabel}>Industry</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cloud Computing, AI, Fintech"
                    placeholderTextColor="#64748B"
                    value={industry}
                    onChangeText={setIndustry}
                  />

                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>Company Size</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="50-200"
                        placeholderTextColor="#64748B"
                        value={companySize}
                        onChangeText={setCompanySize}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Company Website</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="https://company.com"
                        placeholderTextColor="#64748B"
                        value={website}
                        onChangeText={setWebsite}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Location / Model</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Colombo & Remote / Hybrid"
                    placeholderTextColor="#64748B"
                    value={location}
                    onChangeText={setLocation}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Work Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="recruiter@company.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter secure password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={activeTab === 'login' ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#070C12" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      {activeTab === 'login' ? 'Access Recruiter Portal' : 'Register & Start Hiring'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#070C12" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Candidate Link */}
            <TouchableOpacity
              style={styles.switchPortalLink}
              onPress={() => router.push('/sign-in')}
            >
              <Text style={styles.switchPortalText}>
                🎓 Are you a candidate looking for a job?{' '}
                <Text style={{ color: '#00F5D4', fontWeight: 'bold' }}>Sign in here</Text>
              </Text>
            </TouchableOpacity>
          </ResponsiveContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
  },
  scrollContent: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  backText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    marginBottom: 12,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 440,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0E1724',
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#38BDF8',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#070C12',
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: '#0E1724',
    borderRadius: 16,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#152033',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26354D',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#070C12',
    fontSize: 14,
    fontWeight: '800',
  },
  switchPortalLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchPortalText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});

