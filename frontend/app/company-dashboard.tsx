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
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { ResponsiveContainer } from '../src/components/ResponsiveContainer';
import { useResponsive } from '../src/hooks/useResponsive';
import { api, API_BASE_URL } from '../src/services/api';

type DashboardTab = 'jobs' | 'applications' | 'talent' | 'verify';

export default function CompanyDashboardScreen() {
  const router = useRouter();
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
    Alert.alert('Close Job Posting', 'Are you sure you want to close this job opening?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Job',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteCompanyJob(jobId);
            const updated = await api.getCompanyJobs();
            setJobs(updated?.data?.jobs || []);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      Alert.alert('Status Updated', `Application marked as ${status}`);
      // Refresh applications
      const appsRes = await api.getAllCompanyApplications();
      setApplications(appsRes?.data?.applications || []);
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp({ ...selectedApp, status });
      }
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    }
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
        {/* Top Recruiter Header */}
        <View style={styles.topBar}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.companyNameText}>{company?.name || 'Enterprise Recruiter'}</Text>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={13} color="#38BDF8" />
                <Text style={styles.verifiedPillText}>VERIFIED RECRUITER</Text>
              </View>
            </View>
            <Text style={styles.companySub}>{company?.industry || 'Technology'} • {company?.location || 'Remote'}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.postJobBtn} onPress={() => setPostJobModalVisible(true)}>
              <Ionicons name="add" size={18} color="#070C12" />
              <Text style={styles.postJobBtnText}>Post a Job</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'jobs' && styles.tabItemActive]}
            onPress={() => setActiveTab('jobs')}
          >
            <Ionicons name="briefcase-outline" size={16} color={activeTab === 'jobs' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'jobs' && styles.tabLabelActive]}>
              My Jobs ({jobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'applications' && styles.tabItemActive]}
            onPress={() => setActiveTab('applications')}
          >
            <Ionicons name="file-tray-full-outline" size={16} color={activeTab === 'applications' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'applications' && styles.tabLabelActive]}>
              Applications ({applications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'talent' && styles.tabItemActive]}
            onPress={() => setActiveTab('talent')}
          >
            <Ionicons name="people-outline" size={16} color={activeTab === 'talent' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'talent' && styles.tabLabelActive]}>
              Talent Pool ({talentPool.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'verify' && styles.tabItemActive]}
            onPress={() => setActiveTab('verify')}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={activeTab === 'verify' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'verify' && styles.tabLabelActive]}>
              Verify Credential
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Posted Jobs */}
        {activeTab === 'jobs' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Job Openings</Text>
              <Text style={styles.sectionSubtitle}>Jobs published directly to candidate Target Companies</Text>
            </View>

            {jobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="briefcase-outline" size={44} color="#64748B" />
                <Text style={styles.emptyTitle}>No Job Postings Yet</Text>
                <Text style={styles.emptySubtitle}>Post your first engineering opening to receive certified applications.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setPostJobModalVisible(true)}>
                  <Text style={styles.emptyBtnText}>+ Post a Job Opening</Text>
                </TouchableOpacity>
              </View>
            ) : (
              jobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.cardJobTitle}>{job.title}</Text>
                      <Text style={styles.cardJobMeta}>{job.targetRole} • {job.location}</Text>
                    </View>
                    <View style={[styles.statusBadge, job.status === 'ACTIVE' ? styles.statusActive : styles.statusClosed]}>
                      <Text style={[styles.statusBadgeText, job.status === 'ACTIVE' ? { color: '#10B981' } : { color: '#EF4444' }]}>
                        {job.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.jobDescSnippet} numberOfLines={2}>{job.description}</Text>

                  <View style={styles.jobBottomBar}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Text style={styles.jobPillText}>💰 {job.salaryRange || 'Market Rate'}</Text>
                      <Text style={styles.jobPillText}>💼 {job.type}</Text>
                      <Text style={styles.jobPillText}>📊 {job.experience}</Text>
                    </View>

                    <TouchableOpacity style={styles.deleteJobBtn} onPress={() => handleDeleteJob(job.id)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Close Job</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Tab 2: Candidate Applications */}
        {activeTab === 'applications' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Received Candidate Applications</Text>
              <Text style={styles.sectionSubtitle}>Candidates who applied with CVs & Cover Letters</Text>
            </View>

            {applications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={44} color="#64748B" />
                <Text style={styles.emptyTitle}>No Applications Received Yet</Text>
                <Text style={styles.emptySubtitle}>When candidates apply from Target Companies, their CVs and details appear here.</Text>
              </View>
            ) : (
              applications.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.candidateName}>{app.fullName}</Text>
                        {app.hasCertificate && (
                          <View style={styles.certBadge}>
                            <Ionicons name="ribbon" size={12} color="#00F5D4" />
                            <Text style={styles.certBadgeText}>100% CERTIFIED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.appJobApplied}>Applied for: <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{app.job?.title || 'Engineering Role'}</Text></Text>
                    </View>

                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreBoxVal}>{app.readinessScore}%</Text>
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
                      <Text style={styles.coverLetterText} numberOfLines={3}>{app.coverLetter}</Text>
                    </View>
                  )}

                  <View style={styles.appActionsRow}>
                    <TouchableOpacity
                      style={styles.viewCvBtn}
                      onPress={() => setSelectedApp(app)}
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
              <Text style={styles.sectionSubtitle}>Verified engineers sorted by AI Mentor Readiness Mastery</Text>
            </View>

            {talentPool.map((c) => (
              <View key={c.id} style={styles.talentCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                    <Text style={[styles.scoreBoxVal, { color: '#00F5D4' }]}>{c.readinessScore}%</Text>
                    <Text style={styles.scoreBoxLabel}>READINESS</Text>
                  </View>
                </View>

                {c.skills && (
                  <Text style={styles.talentSkills} numberOfLines={2}>🛠️ {c.skills}</Text>
                )}

                <View style={styles.talentStatsBar}>
                  <Text style={styles.statPill}>🎯 {c.stats?.completedInterviews || 0} Mock Interviews</Text>
                  <Text style={styles.statPill}>💻 {c.stats?.solvedChallenges || 0} Solved Drills</Text>
                  <Text style={styles.statPill}>📜 {c.stats?.certificateCount || 0} Certs</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Tab 4: Verify Credential */}
        {activeTab === 'verify' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Instant Credential Verifier</Text>
              <Text style={styles.sectionSubtitle}>Validate an applicant's official AI Mentor Credential ID</Text>
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
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.verifiedBadgeTitle}>OFFICIAL VERIFIED CREDENTIAL</Text>
                    <Text style={styles.verifiedBadgeSub}>Authenticity verified via AI Mentor Enterprise Registry</Text>
                  </View>
                </View>

                <View style={styles.verifiedDetailsTable}>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Candidate Name:</Text>
                    <Text style={styles.vVal}>{verifiedResult.candidate?.name || verifiedResult.certificate?.candidateName}</Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Certified Role:</Text>
                    <Text style={styles.vVal}>{verifiedResult.certificate?.targetRole}</Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Mastery Benchmark:</Text>
                    <Text style={[styles.vVal, { color: '#00F5D4' }]}>{verifiedResult.certificate?.score}</Text>
                  </View>
                  <View style={styles.vRow}>
                    <Text style={styles.vLabel}>Credential ID:</Text>
                    <Text style={[styles.vVal, { color: '#38BDF8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
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

        {/* Post a Job Modal */}
        <Modal
          visible={postJobModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPostJobModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Publish New Tech Opening</Text>
                <TouchableOpacity onPress={() => setPostJobModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 500 }}>
                <Text style={styles.inputLabel}>Job Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Senior Full Stack & AI Solutions Engineer"
                  placeholderTextColor="#64748B"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                />

                <Text style={styles.inputLabel}>Role Category</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Senior Full Stack & AI Solutions Engineer"
                  placeholderTextColor="#64748B"
                  value={targetRole}
                  onChangeText={setTargetRole}
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
                />

                <Text style={styles.inputLabel}>Job Description & Responsibilities *</Text>
                <TextInput
                  style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Detail the technical responsibilities, team structure, and qualifications..."
                  placeholderTextColor="#64748B"
                  value={jobDesc}
                  onChangeText={setJobDesc}
                  multiline
                />
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
          </View>
        </Modal>

        {/* Application Details Modal */}
        <Modal
          visible={Boolean(selectedApp)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedApp(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Application Details</Text>
                <TouchableOpacity onPress={() => setSelectedApp(null)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {selectedApp && (
                <ScrollView style={{ maxHeight: 500 }}>
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
                      Candidate Readiness Score: {selectedApp.readinessScore}%
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
                      onPress={() => {
                        const fullUrl = selectedApp.resumeUrl.startsWith('http')
                          ? selectedApp.resumeUrl
                          : `${API_BASE_URL.replace('/api', '')}${selectedApp.resumeUrl}`;
                        Linking.openURL(fullUrl).catch(() => Alert.alert('Error', 'Unable to open CV link.'));
                      }}
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
      </ResponsiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  companyNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  companySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  postJobBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postJobBtnText: {
    color: '#070C12',
    fontWeight: '800',
    fontSize: 13,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E1724',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
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
    paddingBottom: Spacing.xxl,
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
  },
  jobPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  deleteJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  viewCvBtn: {
    backgroundColor: '#38BDF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
});
