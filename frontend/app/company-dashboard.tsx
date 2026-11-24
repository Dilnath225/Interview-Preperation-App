/**
 * AI Mentor - Enterprise Recruiter & Company Dashboard
 * Manage Jobs, Candidate Applications, Talent Pool & Credential Verification
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  BackHandler,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { AnimatedEntrance } from '../src/components/AnimatedEntrance';
import { useResponsive } from '../src/hooks/useResponsive';
import { api, API_BASE_URL } from '../src/services/api';
import {
  resolveImageUrl,
  pickImageUniversal,
  captureCameraUniversal,
  PRESET_COMPANY_LOGOS,
} from '../src/utils/imagePicker';

type DashboardTab = 'jobs' | 'applications' | 'talent' | 'verify' | 'profile';

export default function CompanyDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  const [activeTab, setActiveTab] = useState<DashboardTab>('jobs');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<any>(null);

  // Data states
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [talentPool, setTalentPool] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalJobs: 0, activeJobs: 0 });

  // Job Details Inspection Modal
  const [selectedJobDetail, setSelectedJobDetail] = useState<any>(null);

  // Edit Company Profile State
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editSize, setEditSize] = useState('50-200');
  const [editDesc, setEditDesc] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Logo Picker Modal State
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  // Post Job Modal State
  const [postJobModalVisible, setPostJobModalVisible] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full Stack & AI Solutions Engineer');
  const [jobLocation, setJobLocation] = useState('Hybrid / Colombo & Remote');
  const [salaryRange, setSalaryRange] = useState('$3,500 - $6,500 / month');
  const [jobType, setJobType] = useState('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [jobDesc, setJobDesc] = useState('');
  const [jobRequirements, setJobRequirements] = useState('React, TypeScript, Node.js, PostgreSQL, Cloud');

  // Verify Credential State
  const [searchCredId, setSearchCredId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<any>(null);

  // Application Detail Modal
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // Hardware Back Button Interceptor - Prevents accidental sign-out
  useEffect(() => {
    const onBackPress = () => {
      if (selectedJobDetail) {
        setSelectedJobDetail(null);
        return true;
      }
      if (selectedApp) {
        setSelectedApp(null);
        return true;
      }
      if (postJobModalVisible) {
        setPostJobModalVisible(false);
        return true;
      }
      if (editProfileModalVisible) {
        setEditProfileModalVisible(false);
        return true;
      }
      if (activeTab !== 'jobs') {
        setActiveTab('jobs');
        return true;
      }

      // If already on jobs tab, show confirmation dialog before exiting
      Alert.alert(
        'Exit Recruiter Workspace',
        'Do you want to sign out from the Enterprise Recruiter Portal?',
        [
          { text: 'Stay in Portal', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
        ]
      );
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [selectedJobDetail, selectedApp, postJobModalVisible, editProfileModalVisible, activeTab]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, jobsRes, appsRes, talentRes] = await Promise.all([
        api.getCompanyProfile().catch(() => null),
        api.getCompanyJobs().catch(() => null),
        api.getAllCompanyApplications().catch(() => null),
        api.getTalentPool().catch(() => null),
      ]);

      if (!profileRes?.success) {
        // Not authenticated as company
        router.replace('/company-auth');
        return;
      }

      setCompany(profileRes.data?.company || profileRes.data);
      setJobs(jobsRes?.data?.jobs || []);
      setApplications(appsRes?.data?.applications || []);
      setTalentPool(talentRes?.data?.candidates || []);
    } catch (err: any) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.clearCompanyToken();
    router.replace('/portal-select');
  };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out from the Enterprise Recruiter Workspace?')
          : true;
      if (confirmed) {
        handleLogout();
      }
      return;
    }

    Alert.alert(
      'Sign Out Recruiter',
      'Are you sure you want to sign out from the Enterprise Recruiter Workspace?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  const handleEditProfileOpen = () => {
    if (company) {
      setEditName(company.name || '');
      setEditIndustry(company.industry || 'Technology');
      setEditLocation(company.location || '');
      setEditWebsite(company.website || '');
      setEditSize(company.size || '50-200');
      setEditDesc(company.description || '');
    }
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Company Name is required.');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.updateCompanyProfile({
        name: editName.trim(),
        industry: editIndustry.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
        size: editSize.trim(),
        description: editDesc.trim(),
      });

      if (res.success && res.data?.company) {
        setCompany(res.data.company);
        Alert.alert('Success', 'Company profile details updated successfully!');
        setEditProfileModalVisible(false);
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.message || err.message || 'Unable to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // ENTERPRISE LOGO MANAGEMENT (Web file dialog, Camera & Presets)
  // ─────────────────────────────────────────────────────────

  const handleOpenLogoModal = () => {
    setCustomLogoUrl('');
    setLogoModalVisible(true);
  };

  const handlePickLogoFromDevice = async () => {
    setLogoModalVisible(false);
    try {
      setUploadingLogo(true);
      const picked = await pickImageUniversal({ maxSize: 320, quality: 0.85 });
      if (!picked) {
        setUploadingLogo(false);
        return;
      }

      // 1. Direct base64 Data URL to PostgreSQL DB
      const res = await api.updateCompanyProfile({ logoUrl: picked.dataUrl });
      if (res.success && res.data?.company) {
        setCompany(res.data.company);
        Alert.alert('Success', 'Company logo uploaded and updated live!');
      } else {
        // 2. Fallback to multipart endpoint
        const fallback = await api.uploadCompanyLogo(picked.asset || { file: picked.file, uri: picked.dataUrl });
        if (fallback.success && (fallback.data?.company || fallback.data?.logoUrl)) {
          setCompany(fallback.data.company || { ...company, logoUrl: fallback.data.logoUrl });
          Alert.alert('Success', 'Company logo uploaded successfully!');
        } else {
          Alert.alert('Upload Failed', res.message || 'Could not update company logo.');
        }
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to select image.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCaptureLogoCamera = async () => {
    setLogoModalVisible(false);
    try {
      setUploadingLogo(true);
      const captured = await captureCameraUniversal();
      if (!captured) {
        setUploadingLogo(false);
        return;
      }

      const res = await api.updateCompanyProfile({ logoUrl: captured.dataUrl });
      if (res.success && res.data?.company) {
        setCompany(res.data.company);
        Alert.alert('Success', 'Company logo captured and updated live!');
      }
    } catch (e: any) {
      Alert.alert('Camera Error', e.message || 'Could not capture photo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSelectPresetLogo = async (presetUrl: string) => {
    setLogoModalVisible(false);
    setUploadingLogo(true);
    try {
      const res = await api.updateCompanyProfile({ logoUrl: presetUrl });
      if (res.success && res.data?.company) {
        setCompany(res.data.company);
        Alert.alert('Success', 'Enterprise preset logo applied successfully!');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to apply preset logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleApplyCustomUrlLogo = async () => {
    if (!customLogoUrl.trim()) return;
    setLogoModalVisible(false);
    setUploadingLogo(true);
    try {
      const res = await api.updateCompanyProfile({ logoUrl: customLogoUrl.trim() });
      if (res.success && res.data?.company) {
        setCompany(res.data.company);
        Alert.alert('Success', 'Company logo URL saved successfully!');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not apply logo URL.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoModalVisible(false);
    setUploadingLogo(true);
    try {
      const res = await api.updateCompanyProfile({ logoUrl: '' });
      if (res.success) {
        setCompany((prev: any) => ({ ...prev, logoUrl: null }));
        Alert.alert('Success', 'Company logo removed.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to remove logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobTitle.trim() || !jobDesc.trim()) {
      Alert.alert('Missing Details', 'Job Title and Description are required.');
      return;
    }

    setSubmittingJob(true);
    try {
      const reqList = jobRequirements.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await api.createCompanyJob({
        title: jobTitle.trim(),
        description: jobDesc.trim(),
        targetRole: targetRole.trim(),
        location: jobLocation.trim(),
        salaryRange: salaryRange.trim(),
        type: jobType,
        experience: experienceLevel,
        requirements: JSON.stringify(reqList),
      });

      if (res.success) {
        Alert.alert('Success', 'Job posting created and published live to candidates!');
        setPostJobModalVisible(false);
        setJobTitle('');
        setJobDesc('');
        // Reload jobs
        const updated = await api.getCompanyJobs();
        setJobs(updated?.data?.jobs || []);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to post job.');
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const doClose = async () => {
      try {
        await api.deleteCompanyJob(jobId);
        const updated = await api.getCompanyJobs();
        setJobs(updated?.data?.jobs || []);
        Alert.alert('Job Closed', 'Job opening has been closed successfully.');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to close job.');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm('Are you sure you want to close this job opening?') : true;
      if (confirmed) {
        doClose();
      }
      return;
    }

    Alert.alert('Close Job Posting', 'Are you sure you want to close this job opening?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Job',
        style: 'destructive',
        onPress: doClose,
      },
    ]);
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      // Immediately reflect status in local state
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app))
      );
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp((prev: any) => ({ ...prev, status }));
      }
      Alert.alert('Status Updated', `Application marked as ${status}`);
    } catch (e: any) {
      Alert.alert('Update Failed', e.response?.data?.message || e.message || 'Could not update status');
    }
  };

  const handleOpenCv = (resumeUrl: string) => {
    if (!resumeUrl) return;
    const fullUrl = resumeUrl.startsWith('http')
      ? resumeUrl
      : `${API_BASE_URL.replace('/api', '')}${resumeUrl.startsWith('/') ? '' : '/'}${resumeUrl}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(fullUrl, '_blank');
      return;
    }

    Linking.openURL(fullUrl).catch(() =>
      Alert.alert('CV Link', `Candidate attached CV: ${resumeUrl}`)
    );
  };

  const handleVerifyCredential = async () => {
    if (!searchCredId.trim()) {
      Alert.alert('Empty Credential ID', 'Please enter a Credential ID (e.g. AIM-CERT-2026-XXXXXX)');
      return;
    }

    setVerifying(true);
    setVerifiedResult(null);
    try {
      const res = await api.verifyCandidateCredential(searchCredId.trim());
      if (res.success && res.data?.credential) {
        setVerifiedResult(res.data.credential);
      } else {
        Alert.alert('Not Found', 'No verified credential found for this ID.');
      }
    } catch (e: any) {
      Alert.alert('Verification Failed', e.response?.data?.message || 'Invalid or revoked Credential ID.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={{ color: '#94A3B8', marginTop: 12 }}>Loading Enterprise Recruiter Workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ResponsiveContainer>
        {/* Top Recruiter Header & Navbar */}
        <AnimatedEntrance delay={0} direction="down">
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/portal-select')}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.companyHeaderLeft}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.8}
            >
              {resolveImageUrl(company?.logoUrl) ? (
                <Image source={resolveImageUrl(company?.logoUrl)!} style={styles.companyLogoThumb} />
              ) : (
                <View style={styles.companyAvatarPlaceholder}>
                  <Ionicons name="business" size={18} color="#38BDF8" />
                </View>
              )}
              <View style={{ flexShrink: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.companyNameText} numberOfLines={1}>
                    {company?.name || 'Recruiter Portal'}
                  </Text>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={11} color="#38BDF8" />
                    <Text style={styles.verifiedPillText}>RECRUITER</Text>
                  </View>
                </View>
                <Text style={styles.companySub} numberOfLines={1}>
                  {company?.industry || 'Technology'} • {company?.location || 'Remote'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Desktop Top Navbar Links */}
          {isLargeScreen && (
            <View style={styles.desktopNavbarRow}>
              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'jobs' && styles.desktopNavLinkActive]}
                onPress={() => setActiveTab('jobs')}
              >
                <Ionicons
                  name={activeTab === 'jobs' ? 'briefcase' : 'briefcase-outline'}
                  size={15}
                  color={activeTab === 'jobs' ? '#38BDF8' : '#94A3B8'}
                />
                <Text style={[styles.desktopNavText, activeTab === 'jobs' && styles.desktopNavTextActive]}>
                  Jobs ({jobs.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'applications' && styles.desktopNavLinkActive]}
                onPress={() => setActiveTab('applications')}
              >
                <Ionicons
                  name={activeTab === 'applications' ? 'file-tray-full' : 'file-tray-full-outline'}
                  size={15}
                  color={activeTab === 'applications' ? '#38BDF8' : '#94A3B8'}
                />
                <Text style={[styles.desktopNavText, activeTab === 'applications' && styles.desktopNavTextActive]}>
                  Applications ({applications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'talent' && styles.desktopNavLinkActive]}
                onPress={() => setActiveTab('talent')}
              >
                <Ionicons
                  name={activeTab === 'talent' ? 'people' : 'people-outline'}
                  size={15}
                  color={activeTab === 'talent' ? '#38BDF8' : '#94A3B8'}
                />
                <Text style={[styles.desktopNavText, activeTab === 'talent' && styles.desktopNavTextActive]}>
                  Talent ({talentPool.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'verify' && styles.desktopNavLinkActive]}
                onPress={() => setActiveTab('verify')}
              >
                <Ionicons
                  name={activeTab === 'verify' ? 'shield-checkmark' : 'shield-checkmark-outline'}
                  size={15}
                  color={activeTab === 'verify' ? '#38BDF8' : '#94A3B8'}
                />
                <Text style={[styles.desktopNavText, activeTab === 'verify' && styles.desktopNavTextActive]}>
                  Verify ID
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.desktopNavLink, activeTab === 'profile' && styles.desktopNavLinkActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Ionicons
                  name={activeTab === 'profile' ? 'business' : 'business-outline'}
                  size={15}
                  color={activeTab === 'profile' ? '#38BDF8' : '#94A3B8'}
                />
                <Text style={[styles.desktopNavText, activeTab === 'profile' && styles.desktopNavTextActive]}>
                  Profile
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.topBarActions}>
            <TouchableOpacity
              style={styles.postJobBtn}
              onPress={() => setPostJobModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#070C12" />
              <Text style={styles.postJobBtnText}>Post Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={confirmLogout}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation (Horizontally scrollable for mobile responsiveness) */}
        <View style={styles.tabBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'jobs' && styles.tabItemActive]}
              onPress={() => setActiveTab('jobs')}
            >
              <Ionicons
                name="briefcase-outline"
                size={15}
                color={activeTab === 'jobs' ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, activeTab === 'jobs' && styles.tabLabelActive]}>
                My Jobs ({jobs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'applications' && styles.tabItemActive]}
              onPress={() => setActiveTab('applications')}
            >
              <Ionicons
                name="file-tray-full-outline"
                size={15}
                color={activeTab === 'applications' ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, activeTab === 'applications' && styles.tabLabelActive]}>
                Applications ({applications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'talent' && styles.tabItemActive]}
              onPress={() => setActiveTab('talent')}
            >
              <Ionicons
                name="people-outline"
                size={15}
                color={activeTab === 'talent' ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, activeTab === 'talent' && styles.tabLabelActive]}>
                Talent Pool ({talentPool.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'verify' && styles.tabItemActive]}
              onPress={() => setActiveTab('verify')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={15}
                color={activeTab === 'verify' ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, activeTab === 'verify' && styles.tabLabelActive]}>
                Verify ID
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'profile' && styles.tabItemActive]}
              onPress={() => setActiveTab('profile')}
            >
              <Ionicons
                name="business-outline"
                size={15}
                color={activeTab === 'profile' ? '#38BDF8' : '#94A3B8'}
              />
              <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
                Company Profile
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={80} direction="up" style={{ flex: 1 }}>

        {/* Tab 1: Posted Jobs */}
        {activeTab === 'jobs' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Job Openings</Text>
              <Text style={styles.sectionSubtitle}>
                Published live to candidate Target Companies. Tap any card to inspect details.
              </Text>
            </View>

            {jobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="briefcase-outline" size={44} color="#64748B" />
                <Text style={styles.emptyTitle}>No Job Postings Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Post your first engineering opening to receive certified applications.
                </Text>
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => setPostJobModalVisible(true)}
                >
                  <Text style={styles.emptyBtnText}>+ Post a Job Opening</Text>
                </TouchableOpacity>
              </View>
            ) : (
              jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => setSelectedJobDetail(job)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.cardJobTitle}>{job.title}</Text>
                      <Text style={styles.cardJobMeta}>
                        {job.targetRole} • {job.location}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        job.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          job.status === 'ACTIVE' ? { color: '#10B981' } : { color: '#EF4444' },
                        ]}
                      >
                        {job.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobDescSnippet} numberOfLines={2}>
                    {job.description}
                  </Text>

                  <View style={styles.jobBottomBar}>
                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                      <Text style={styles.jobPillText}>💰 {job.salaryRange || 'Market Rate'}</Text>
                      <Text style={styles.jobPillText}>💼 {job.type}</Text>
                      <Text style={styles.jobPillText}>📊 {job.experience}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={styles.inspectPill}>
                        <Text style={styles.inspectPillText}>Inspect Details →</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* Tab 2: Candidate Applications */}
        {activeTab === 'applications' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Received Candidate Applications</Text>
              <Text style={styles.sectionSubtitle}>
                Candidates who applied with verified CVs & Cover Letters
              </Text>
            </View>

            {applications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={44} color="#64748B" />
                <Text style={styles.emptyTitle}>No Applications Received Yet</Text>
                <Text style={styles.emptySubtitle}>
                  When candidates apply from Target Companies, their CVs and details appear here in real-time.
                </Text>
              </View>
            ) : (
              applications.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Text style={styles.candidateName}>{app.fullName}</Text>
                        {app.hasCertificate && (
                          <View style={styles.certBadge}>
                            <Ionicons name="ribbon" size={12} color="#00F5D4" />
                            <Text style={styles.certBadgeText}>CERTIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.appJobApplied}>
                        Applied for: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{app.job?.title || 'Engineering Role'}</Text>
                      </Text>
                    </View>

                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreBoxVal}>{app.readinessScore || 85}%</Text>
                      <Text style={styles.scoreBoxLabel}>READINESS</Text>
                    </View>
                  </View>

                  <View style={styles.contactRow}>
                    <Text style={styles.contactItem}>📧 {app.email}</Text>
                    {app.phone && <Text style={styles.contactItem}>📞 {app.phone}</Text>}
                  </View>

                  {app.coverLetter && (
                    <View style={styles.coverLetterBox}>
                      <Text style={styles.coverLetterLabel}>COVER LETTER:</Text>
                      <Text style={styles.coverLetterText} numberOfLines={3}>
                        {app.coverLetter}
                      </Text>
                    </View>
                  )}

                  <View style={styles.appActionsRow}>
                    <TouchableOpacity
                      style={styles.viewCvBtn}
                      onPress={() => setSelectedApp(app)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-outline" size={15} color="#070C12" />
                      <Text style={styles.viewCvBtnText}>View Full Details & CV</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.statusActionBtn, { borderColor: '#10B981' }]}
                        onPress={() => handleUpdateAppStatus(app.id, 'SHORTLISTED')}
                      >
                        <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>Shortlist</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statusActionBtn, { borderColor: '#EF4444' }]}
                        onPress={() => handleUpdateAppStatus(app.id, 'REJECTED')}
                      >
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Tab 3: Talent Pool */}
        {activeTab === 'talent' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pre-Vetted Talent Pool</Text>
              <Text style={styles.sectionSubtitle}>
                Verified engineers sorted by AI Mentor Readiness Mastery
              </Text>
            </View>

            {talentPool.map((c) => (
              <View key={c.id} style={styles.talentCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.candidateName}>{c.name}</Text>
                      {c.stats?.hasCertificate && (
                        <View style={styles.certBadge}>
                          <Ionicons name="ribbon" size={12} color="#00F5D4" />
                          <Text style={styles.certBadgeText}>CERTIFIED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.talentRole}>{c.targetRole || 'Full Stack Engineer'}</Text>
                  </View>

                  <View style={styles.scoreBox}>
                    <Text style={[styles.scoreBoxVal, { color: '#00F5D4' }]}>
                      {c.readinessScore || 90}%
                    </Text>
                    <Text style={styles.scoreBoxLabel}>READINESS</Text>
                  </View>
                </View>

                {c.skills && (
                  <Text style={styles.talentSkills} numberOfLines={2}>
                    🛠️ {c.skills}
                  </Text>
                )}

                <View style={styles.talentStatsBar}>
                  <Text style={styles.statPill}>🎯 {c.stats?.completedInterviews || 0} Interviews</Text>
                  <Text style={styles.statPill}>💻 {c.stats?.solvedChallenges || 0} Drills</Text>
                  <Text style={styles.statPill}>📜 {c.stats?.certificateCount || 0} Certs</Text>
                </View>

                <TouchableOpacity
                  style={styles.contactTalentBtn}
                  onPress={() => {
                    if (c.email) {
                      Linking.openURL(`mailto:${c.email}?subject=Career Opportunity from ${company?.name || 'Recruiter'}`);
                    } else {
                      Alert.alert('Candidate Contact', `${c.name} has a verified readiness score of ${c.readinessScore || 90}%.`);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-outline" size={14} color="#070C12" />
                  <Text style={styles.contactTalentBtnText}>Contact Candidate</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Tab 4: Verify Credential */}
        {activeTab === 'verify' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Instant Credential Verifier</Text>
              <Text style={styles.sectionSubtitle}>
                Validate an applicant's official AI Mentor Credential ID
              </Text>
            </View>

            <View style={styles.verifyCard}>
              <Text style={styles.verifyLabel}>ENTER CANDIDATE CREDENTIAL ID:</Text>
              <View style={styles.verifyInputRow}>
                <TextInput
                  style={styles.verifyInput}
                  placeholder="e.g. AIM-CERT-2026-690802"
                  placeholderTextColor="#64748B"
                  value={searchCredId}
                  onChangeText={setSearchCredId}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleVerifyCredential}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color="#070C12" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify ID</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {verifiedResult && (
              <View style={styles.verifiedCard}>
                <View style={styles.verifiedHeader}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.verifiedBadgeTitle}>OFFICIAL VERIFIED CREDENTIAL</Text>
                    <Text style={styles.verifiedBadgeSub}>
                      Authenticity verified via AI Mentor Enterprise Registry
                    </Text>
                  </View>
                </View>

                <View style={styles.verifiedDetailsTable}>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Candidate Name:</Text>
                    <Text style={styles.vVal}>
                      {verifiedResult.candidate?.name || verifiedResult.certificate?.candidateName}
                    </Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Certified Role:</Text>
                    <Text style={styles.vVal}>{verifiedResult.certificate?.targetRole}</Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Mastery Benchmark:</Text>
                    <Text style={[styles.vVal, { color: '#00F5D4' }]}>
                      {verifiedResult.certificate?.score}
                    </Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Credential ID:</Text>
                    <Text
                      style={[
                        styles.vVal,
                        { color: '#38BDF8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
                      ]}
                    >
                      {verifiedResult.certificate?.credentialId}
                    </Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Status:</Text>
                    <Text style={[styles.vVal, { color: '#10B981' }]}>Active & Recorded</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Tab 5: Dedicated Company Profile View & CRUD */}
        {activeTab === 'profile' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Company Profile & Brand</Text>
              <Text style={styles.sectionSubtitle}>
                Manage your enterprise identity, logo, and hiring information
              </Text>
            </View>

            {/* Profile Overview Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeaderRow}>
                <TouchableOpacity
                  style={styles.profileLogoContainer}
                  onPress={handleOpenLogoModal}
                  disabled={uploadingLogo}
                  activeOpacity={0.8}
                >
                  {resolveImageUrl(company?.logoUrl) ? (
                    <Image source={resolveImageUrl(company?.logoUrl)!} style={styles.profileLogoBig} />
                  ) : (
                    <View style={styles.profileLogoPlaceholder}>
                      <Ionicons name="business" size={36} color="#38BDF8" />
                    </View>
                  )}
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={14} color="#070C12" />
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={styles.profileName}>{company?.name || 'Company Name'}</Text>
                  <Text style={styles.profileEmail}>{company?.email}</Text>
                  <View style={styles.verifiedRow}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    <Text style={styles.verifiedText}>Official Verified Partner</Text>
                  </View>
                </View>
              </View>

              {/* Upload Logo CTA */}
              <TouchableOpacity
                style={styles.uploadLogoBtn}
                onPress={handleOpenLogoModal}
                disabled={uploadingLogo}
                activeOpacity={0.8}
              >
                {uploadingLogo ? (
                  <ActivityIndicator color="#070C12" size="small" />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={16} color="#070C12" />
                    <Text style={styles.uploadLogoBtnText}>Upload / Change Company Logo</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Company Info List */}
              <View style={styles.profileDetailsList}>
                <View style={styles.profileDetailItem}>
                  <Text style={styles.detailItemLabel}>INDUSTRY</Text>
                  <Text style={styles.detailItemValue}>{company?.industry || 'Technology & Software'}</Text>
                </View>

                <View style={styles.profileDetailItem}>
                  <Text style={styles.detailItemLabel}>LOCATION</Text>
                  <Text style={styles.detailItemValue}>{company?.location || 'Colombo, Sri Lanka / Remote'}</Text>
                </View>

                <View style={styles.profileDetailItem}>
                  <Text style={styles.detailItemLabel}>WEBSITE</Text>
                  <Text style={[styles.detailItemValue, { color: '#38BDF8' }]}>
                    {company?.website || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.profileDetailItem}>
                  <Text style={styles.detailItemLabel}>COMPANY SIZE</Text>
                  <Text style={styles.detailItemValue}>{company?.size || '50-200'} Employees</Text>
                </View>

                {company?.description && (
                  <View style={styles.profileDetailItem}>
                    <Text style={styles.detailItemLabel}>ABOUT / DESCRIPTION</Text>
                    <Text style={styles.detailItemDesc}>{company.description}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={handleEditProfileOpen}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editProfileBtnText}>Edit Company Details</Text>
              </TouchableOpacity>

              {/* Explicit Sign Out Button */}
              <TouchableOpacity
                style={styles.signOutFullBtn}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.signOutFullBtnText}>Sign Out from Recruiter Portal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
        </AnimatedEntrance>

        {/* ========================================================
            MODAL: POST A JOB
        ======================================================== */}
        <Modal
          visible={postJobModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setPostJobModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPostJobModalVisible(false)}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', maxWidth: 540, zIndex: 10 }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Publish New Tech Opening</Text>
                  <TouchableOpacity onPress={() => setPostJobModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: 420 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.inputLabel}>Job Title *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Senior Full Stack & AI Solutions Engineer"
                    placeholderTextColor="#64748B"
                    value={jobTitle}
                    onChangeText={setJobTitle}
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Role Category</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Senior Full Stack & AI Solutions Engineer"
                    placeholderTextColor="#64748B"
                    value={targetRole}
                    onChangeText={setTargetRole}
                    editable={true}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Location Model</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Hybrid / Colombo & Remote"
                        placeholderTextColor="#64748B"
                        value={jobLocation}
                        onChangeText={setJobLocation}
                        editable={true}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Salary Range</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="$3,500 - $6,500 / month"
                        placeholderTextColor="#64748B"
                        value={salaryRange}
                        onChangeText={setSalaryRange}
                        editable={true}
                      />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Type</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="FULL_TIME"
                        placeholderTextColor="#64748B"
                        value={jobType}
                        onChangeText={setJobType}
                        editable={true}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Experience</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Senior"
                        placeholderTextColor="#64748B"
                        value={experienceLevel}
                        onChangeText={setExperienceLevel}
                        editable={true}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Required Skills (comma separated)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="React, TypeScript, Node.js, PostgreSQL"
                    placeholderTextColor="#64748B"
                    value={jobRequirements}
                    onChangeText={setJobRequirements}
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Job Description & Responsibilities *</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 95, textAlignVertical: 'top' }]}
                    placeholder="Detail the technical responsibilities, team structure, and qualifications..."
                    placeholderTextColor="#64748B"
                    value={jobDesc}
                    onChangeText={setJobDesc}
                    multiline
                    editable={true}
                  />

                  <TouchableOpacity
                    style={styles.dismissKeypadBtn}
                    onPress={Keyboard.dismiss}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-down-circle-outline" size={16} color="#94A3B8" />
                    <Text style={styles.dismissKeypadText}>Dismiss Keyboard</Text>
                  </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCreateJob}
                  disabled={submittingJob}
                >
                  {submittingJob ? (
                    <ActivityIndicator color="#070C12" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Publish Opening to Candidates</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ========================================================
            MODAL: EDIT COMPANY PROFILE
        ======================================================== */}
        <Modal
          visible={editProfileModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setEditProfileModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setEditProfileModalVisible(false)}
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', maxWidth: 540, zIndex: 10 }}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Company Profile</Text>
                  <TouchableOpacity onPress={() => setEditProfileModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={{ maxHeight: 420 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.inputLabel}>Company Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Company Legal Name"
                    placeholderTextColor="#64748B"
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Industry</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editIndustry}
                    onChangeText={setEditIndustry}
                    placeholder="e.g. Fintech, Cloud, AI"
                    placeholderTextColor="#64748B"
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Location / Headquarters</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder="Colombo 04, Sri Lanka"
                    placeholderTextColor="#64748B"
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Website URL</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editWebsite}
                    onChangeText={setEditWebsite}
                    placeholder="https://company.com"
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Company Size</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editSize}
                    onChangeText={setEditSize}
                    placeholder="e.g. 50-200"
                    placeholderTextColor="#64748B"
                    editable={true}
                  />

                  <Text style={styles.inputLabel}>Company Description / Mission</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                    value={editDesc}
                    onChangeText={setEditDesc}
                    placeholder="Brief overview of your company..."
                    placeholderTextColor="#64748B"
                    multiline
                    editable={true}
                  />

                  <TouchableOpacity
                    style={styles.dismissKeypadBtn}
                    onPress={Keyboard.dismiss}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-down-circle-outline" size={16} color="#94A3B8" />
                    <Text style={styles.dismissKeypadText}>Dismiss Keyboard</Text>
                  </TouchableOpacity>
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#070C12" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Save Profile Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* ========================================================
            MODAL: JOB DETAILS INSPECTION
        ======================================================== */}
        <Modal
          visible={Boolean(selectedJobDetail)}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedJobDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedJobDetail(null)}
            />
            <View style={[styles.modalContent, { zIndex: 10 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Job Details & Applications</Text>
                <TouchableOpacity onPress={() => setSelectedJobDetail(null)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {selectedJobDetail && (
                <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', flex: 1, paddingRight: 8 }}>
                      {selectedJobDetail.title}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        selectedJobDetail.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          selectedJobDetail.status === 'ACTIVE' ? { color: '#10B981' } : { color: '#EF4444' },
                        ]}
                      >
                        {selectedJobDetail.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, color: '#38BDF8', marginBottom: 12 }}>
                    {selectedJobDetail.targetRole} • {selectedJobDetail.location}
                  </Text>

                  {/* Summary Metric */}
                  <View style={styles.jobInspectStatsRow}>
                    <View style={styles.inspectStatBox}>
                      <Text style={styles.inspectStatVal}>
                        {applications.filter((a) => a.jobId === selectedJobDetail.id).length}
                      </Text>
                      <Text style={styles.inspectStatLabel}>APPLICANTS</Text>
                    </View>
                    <View style={styles.inspectStatBox}>
                      <Text style={styles.inspectStatVal}>{selectedJobDetail.salaryRange || 'Market'}</Text>
                      <Text style={styles.inspectStatLabel}>SALARY</Text>
                    </View>
                    <View style={styles.inspectStatBox}>
                      <Text style={styles.inspectStatVal}>{selectedJobDetail.type}</Text>
                      <Text style={styles.inspectStatLabel}>TYPE</Text>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>FULL DESCRIPTION</Text>
                  <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 20, marginBottom: 14 }}>
                    {selectedJobDetail.description}
                  </Text>

                  {selectedJobDetail.requirements && (
                    <>
                      <Text style={styles.inputLabel}>REQUIRED SKILLS</Text>
                      <Text style={{ color: '#00F5D4', fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                        {selectedJobDetail.requirements}
                      </Text>
                    </>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.modalSubmitBtn, { flex: 1, marginTop: 0 }]}
                      onPress={() => {
                        setSelectedJobDetail(null);
                        setActiveTab('applications');
                      }}
                    >
                      <Text style={styles.modalSubmitBtnText}>View Applicants</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.closeJobActionBtn, { flex: 1 }]}
                      onPress={() => {
                        const jId = selectedJobDetail.id;
                        setSelectedJobDetail(null);
                        handleDeleteJob(jId);
                      }}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Close Opening</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL: APPLICATION DETAILS & CV VIEWER
        ======================================================== */}
        <Modal
          visible={Boolean(selectedApp)}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedApp(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setSelectedApp(null)}
            />
            <View style={[styles.modalContent, { zIndex: 10 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Application Details</Text>
                <TouchableOpacity onPress={() => setSelectedApp(null)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {selectedApp && (
                <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
                    {selectedApp.fullName}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#38BDF8', marginBottom: 12 }}>
                    Applied for: {selectedApp.job?.title}
                  </Text>

                  <View style={styles.contactRow}>
                    <Text style={styles.contactItem}>📧 {selectedApp.email}</Text>
                    {selectedApp.phone && <Text style={styles.contactItem}>📞 {selectedApp.phone}</Text>}
                  </View>

                  <View style={{ backgroundColor: '#132034', padding: 12, borderRadius: 10, marginVertical: 12 }}>
                    <Text style={{ color: '#00F5D4', fontWeight: 'bold' }}>
                      Candidate Readiness Score: {selectedApp.readinessScore || 85}%
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                      Verified Certificate Status: {selectedApp.hasCertificate ? '✅ 100% Certified' : 'In Progress'}
                    </Text>
                  </View>

                  {selectedApp.coverLetter && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.inputLabel}>Candidate Cover Letter:</Text>
                      <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 20 }}>
                        {selectedApp.coverLetter}
                      </Text>
                    </View>
                  )}

                  {selectedApp.resumeUrl && (
                    <TouchableOpacity
                      style={styles.downloadCvBtn}
                      onPress={() => handleOpenCv(selectedApp.resumeUrl)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-attach" size={18} color="#070C12" />
                      <Text style={styles.downloadCvBtnText}>View / Download Attached CV</Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <TouchableOpacity
                      style={[styles.statusModalBtn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleUpdateAppStatus(selectedApp.id, 'SHORTLISTED')}
                    >
                      <Text style={{ color: '#070C12', fontWeight: 'bold' }}>Mark Shortlisted</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.statusModalBtn, { backgroundColor: '#EF4444' }]}
                      onPress={() => handleUpdateAppStatus(selectedApp.id, 'REJECTED')}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* ========================================================
            MODAL: LOGO PICKER MODAL (Universal Web & Mobile)
        ======================================================== */}
        <Modal
          visible={logoModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setLogoModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setLogoModalVisible(false)}
            />
            <View style={[styles.logoModalCard, { zIndex: 10 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Company Logo & Branding</Text>
                <TouchableOpacity onPress={() => setLogoModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 16 }}>
                Upload your official company brand badge or select from enterprise presets:
              </Text>

              {/* Action 1: Upload from Device / Computer */}
              <TouchableOpacity
                style={styles.logoActionBtn}
                onPress={handlePickLogoFromDevice}
                activeOpacity={0.8}
              >
                <View style={styles.logoActionIcon}>
                  <Ionicons name="folder-open-outline" size={20} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logoActionTitle}>Choose from Device / Computer</Text>
                  <Text style={styles.logoActionSub}>Select a PNG, JPG, or WEBP logo file</Text>
                </View>
              </TouchableOpacity>

              {/* Action 2: Camera Capture */}
              <TouchableOpacity
                style={styles.logoActionBtn}
                onPress={handleCaptureLogoCamera}
                activeOpacity={0.8}
              >
                <View style={styles.logoActionIcon}>
                  <Ionicons name="camera-outline" size={20} color="#00F5D4" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logoActionTitle}>Capture via Camera</Text>
                  <Text style={styles.logoActionSub}>Take a quick photo of your company logo</Text>
                </View>
              </TouchableOpacity>

              {/* Preset Enterprise Logos */}
              <Text style={styles.presetHeading}>OR SELECT AN ENTERPRISE BADGE</Text>
              <View style={styles.presetsRow}>
                {PRESET_COMPANY_LOGOS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.presetChip}
                    onPress={() => handleSelectPresetLogo(preset)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: preset }} style={styles.presetImage} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action 3: Enter URL */}
              <Text style={styles.presetHeading}>OR PASTE PUBLIC LOGO URL</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 12 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginTop: 0 }]}
                  placeholder="https://company.com/logo.png"
                  placeholderTextColor="#64748B"
                  value={customLogoUrl}
                  onChangeText={setCustomLogoUrl}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { marginTop: 0, paddingHorizontal: 16 }]}
                  onPress={handleApplyCustomUrlLogo}
                >
                  <Text style={styles.modalSubmitBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>

              {/* Action 4: Remove Logo */}
              {company?.logoUrl && (
                <TouchableOpacity
                  style={styles.removeLogoBtn}
                  onPress={handleRemoveLogo}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.removeLogoText}>Remove Current Logo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

      </ResponsiveContainer>

      {/* ========================================================
          RECRUITER BOTTOM TAB BAR (Viewport Fixed)
      ======================================================== */}
      <View style={styles.bottomNavbarFixedWrapper}>
        <View
          style={[
            styles.bottomTabBar,
            isLargeScreen && styles.bottomTabBarFloating,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <TouchableOpacity
            style={styles.bottomTabItem}
            onPress={() => setActiveTab('jobs')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'jobs' ? 'briefcase' : 'briefcase-outline'}
              size={20}
              color={activeTab === 'jobs' ? '#38BDF8' : '#64748B'}
            />
            <Text style={[styles.bottomTabLabel, activeTab === 'jobs' && styles.bottomTabLabelActive]}>
              Jobs
            </Text>
            {activeTab === 'jobs' && <View style={styles.bottomActiveDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomTabItem}
            onPress={() => setActiveTab('applications')}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons
                name={activeTab === 'applications' ? 'file-tray-full' : 'file-tray-full-outline'}
                size={20}
                color={activeTab === 'applications' ? '#38BDF8' : '#64748B'}
              />
              {applications.length > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{applications.length}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.bottomTabLabel, activeTab === 'applications' && styles.bottomTabLabelActive]}>
              Applications
            </Text>
            {activeTab === 'applications' && <View style={styles.bottomActiveDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomTabItem}
            onPress={() => setActiveTab('talent')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'talent' ? 'people' : 'people-outline'}
              size={20}
              color={activeTab === 'talent' ? '#38BDF8' : '#64748B'}
            />
            <Text style={[styles.bottomTabLabel, activeTab === 'talent' && styles.bottomTabLabelActive]}>
              Talent
            </Text>
            {activeTab === 'talent' && <View style={styles.bottomActiveDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomTabItem}
            onPress={() => setActiveTab('verify')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'verify' ? 'shield-checkmark' : 'shield-checkmark-outline'}
              size={20}
              color={activeTab === 'verify' ? '#38BDF8' : '#64748B'}
            />
            <Text style={[styles.bottomTabLabel, activeTab === 'verify' && styles.bottomTabLabelActive]}>
              Verify ID
            </Text>
            {activeTab === 'verify' && <View style={styles.bottomActiveDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomTabItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'business' : 'business-outline'}
              size={20}
              color={activeTab === 'profile' ? '#38BDF8' : '#64748B'}
            />
            <Text style={[styles.bottomTabLabel, activeTab === 'profile' && styles.bottomTabLabelActive]}>
              Profile
            </Text>
            {activeTab === 'profile' && <View style={styles.bottomActiveDot} />}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : {}),
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  desktopNavbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B1321',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  desktopNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  desktopNavLinkActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  desktopNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  desktopNavTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  companyHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  companyLogoThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  companyAvatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedPillText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '800',
  },
  companySub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  postJobBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  postJobBtnText: {
    color: '#070C12',
    fontWeight: '800',
    fontSize: 12,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    backgroundColor: '#0E1724',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#38BDF8',
  },
  tabLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  tabContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  emptyBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyBtnText: {
    color: '#070C12',
    fontWeight: '800',
    fontSize: 13,
  },
  jobCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  cardJobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardJobMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  jobDescSnippet: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginVertical: 10,
  },
  jobBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  jobPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  inspectPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inspectPillText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  closeJobActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  jobInspectStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
  },
  inspectStatBox: {
    flex: 1,
    backgroundColor: '#132034',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  inspectStatVal: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
  },
  inspectStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  appCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    borderWidth: 1,
    borderColor: '#00F5D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  certBadgeText: {
    color: '#00F5D4',
    fontSize: 9,
    fontWeight: '800',
  },
  appJobApplied: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  scoreBox: {
    backgroundColor: '#152033',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreBoxVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  scoreBoxLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  contactItem: {
    fontSize: 12,
    color: '#94A3B8',
  },
  coverLetterBox: {
    backgroundColor: '#152033',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  coverLetterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  appActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexWrap: 'wrap',
    gap: 8,
  },
  viewCvBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewCvBtnText: {
    color: '#070C12',
    fontSize: 12,
    fontWeight: '800',
  },
  statusActionBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  talentCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 12,
  },
  talentRole: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  talentSkills: {
    fontSize: 12,
    color: '#CBD5E1',
    marginVertical: 8,
  },
  talentStatsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    flexWrap: 'wrap',
  },
  statPill: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  verifyCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: Spacing.lg,
  },
  verifyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  verifyInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  verifyInput: {
    flex: 1,
    backgroundColor: '#152033',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  verifyBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    color: '#070C12',
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedCard: {
    backgroundColor: '#0E1724',
    borderRadius: 14,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  verifiedBadgeTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedBadgeSub: {
    color: '#64748B',
    fontSize: 11,
  },
  verifiedDetailsTable: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  vRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  vLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  vVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Company Profile Tab Styles
  profileCard: {
    backgroundColor: '#0E1724',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileLogoContainer: {
    position: 'relative',
    width: 64,
    height: 64,
  },
  profileLogoBig: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#1E293B',
  },
  profileLogoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#38BDF8',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  uploadLogoBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  uploadLogoBtnText: {
    color: '#070C12',
    fontWeight: '800',
    fontSize: 13,
  },
  profileDetailsList: {
    gap: 12,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: Spacing.md,
  },
  profileDetailItem: {
    paddingVertical: 2,
  },
  detailItemLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailItemValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  detailItemDesc: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  editProfileBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  editProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutFullBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  signOutFullBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: '#0E1724',
    borderRadius: 16,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 540,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#152033',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26354D',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  dismissKeypadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 8,
  },
  dismissKeypadText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalSubmitBtnText: {
    color: '#070C12',
    fontSize: 14,
    fontWeight: '800',
  },
  downloadCvBtn: {
    backgroundColor: '#00F5D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadCvBtnText: {
    color: '#070C12',
    fontSize: 13,
    fontWeight: '800',
  },
  statusModalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  // Recruiter Bottom Tab Bar
  bottomNavbarFixedWrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { pointerEvents: 'box-none' as any } : {}),
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 16, 29, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#1A2637',
    paddingTop: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)', pointerEvents: 'auto' as any } : {}),
  },
  bottomTabBarFloating: {
    maxWidth: 680,
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#26354D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  bottomTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  bottomTabLabelActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  bottomActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginTop: 2,
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#38BDF8',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#070C12',
    fontSize: 9,
    fontWeight: '900',
  },

  // Contact Candidate Button
  contactTalentBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  contactTalentBtnText: {
    color: '#070C12',
    fontSize: 12,
    fontWeight: '800',
  },

  // Logo Picker Modal
  logoModalCard: {
    backgroundColor: '#0E1724',
    borderRadius: 18,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: '#1E2E44',
  },
  logoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#131F33',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1F314D',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  logoActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoActionTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoActionSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  presetHeading: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  presetChip: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1E2E44',
    overflow: 'hidden',
    backgroundColor: '#131F33',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  removeLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  removeLogoText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
