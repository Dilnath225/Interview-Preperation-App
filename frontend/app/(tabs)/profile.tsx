/**
 * AI Mentor - Enterprise-Grade Profile Screen with Complete CRUD & Picture Upload
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Safely load ImagePicker only when invoked to prevent Expo Go boot crashes if ExpoAsset native module is missing
const getImagePicker = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-image-picker');
  } catch (e) {
    console.warn('expo-image-picker is unavailable in this client:', e);
    return null;
  }
};

import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { ProgressRing } from '../../src/components/ProgressRing';
import { Button } from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { api, API_BASE_URL } from '../../src/services/api';

const POPULAR_ROLES = [
  'Full Stack Developer',
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps / SRE',
  'Data Scientist / AI',
  'Product Manager',
  'QA Automation Engineer',
];

const EXPERIENCE_LEVELS = [
  'Student / Intern',
  'Junior (0-2 yrs)',
  'Mid-Level (3-5 yrs)',
  'Senior (5-8 yrs)',
  'Lead / Staff (8+ yrs)',
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Modals state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExpLevel, setEditExpLevel] = useState('Junior');
  const [editEducation, setEditEducation] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editSkillsList, setEditSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        setStats(res.data.stats);
        if (res.data.user) {
          updateUser(res.data.user);
        }
      }
    } catch (err) {
      console.warn('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setEditName(user?.name || '');
    setEditRole(user?.targetRole || 'Full Stack Developer');
    setEditBio(user?.bio || '');
    setEditPhone(user?.phone || '');
    setEditExpLevel(user?.experienceLevel || 'Junior (0-2 yrs)');
    setEditEducation(user?.education || '');
    setEditGithub(user?.githubUrl || '');
    setEditLinkedin(user?.linkedinUrl || '');

    const currentSkills = user?.skills
      ? user.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];
    setEditSkillsList(currentSkills);
    setNewSkillInput('');

    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: editName.trim(),
        targetRole: editRole.trim(),
        bio: editBio.trim(),
        phone: editPhone.trim(),
        experienceLevel: editExpLevel,
        education: editEducation.trim(),
        githubUrl: editGithub.trim(),
        linkedinUrl: editLinkedin.trim(),
        skills: editSkillsList.join(', '),
      };

      const res = await api.updateProfile(payload);
      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setEditModalVisible(false);
        Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update profile.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An error occurred while saving.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !editSkillsList.includes(trimmed)) {
      setEditSkillsList([...editSkillsList, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditSkillsList(editSkillsList.filter((s) => s !== skillToRemove));
  };

  // Avatar Management
  const handlePickFromGallery = async () => {
    setAvatarModalVisible(false);
    const picker = getImagePicker();
    if (!picker) {
      Alert.alert(
        'Picker Not Available in Expo Go',
        'Camera roll requires a custom development build. Please choose one of the stylish preset avatars below!'
      );
      return;
    }
    try {
      const { status } = await picker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to select a photo.');
        return;
      }

      const result = await picker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarFile(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not pick image.');
    }
  };

  const handleTakePhoto = async () => {
    setAvatarModalVisible(false);
    const picker = getImagePicker();
    if (!picker) {
      Alert.alert(
        'Camera Not Available in Expo Go',
        'Direct camera capture requires a custom development build. Please choose one of the stylish preset avatars below!'
      );
      return;
    }
    try {
      const { status } = await picker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture a photo.');
        return;
      }

      const result = await picker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatarFile(result.assets[0]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not capture photo.');
    }
  };

  const uploadAvatarFile = async (asset: any) => {
    setUploadingAvatar(true);
    try {
      const res = await api.uploadAvatar(asset);
      if (res.success && res.data?.avatarUrl) {
        updateUser({ avatarUrl: res.data.avatarUrl });
        Alert.alert('Success', 'Profile picture updated successfully!');
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload avatar.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSelectPresetAvatar = async (presetUrl: string) => {
    setAvatarModalVisible(false);
    setUploadingAvatar(true);
    try {
      const res = await api.updateProfile({ avatarUrl: presetUrl });
      if (res.success && res.data?.user) {
        updateUser({ avatarUrl: presetUrl });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not apply preset avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarModalVisible(false);
    setUploadingAvatar(true);
    try {
      const res = await api.updateProfile({ avatarUrl: '' });
      if (res.success) {
        updateUser({ avatarUrl: null });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not remove avatar.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Password Change
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Missing Fields', 'Please enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.changePassword(oldPassword, newPassword);
      if (res.success) {
        setPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Success', 'Your password has been changed successfully.');
      } else {
        Alert.alert('Failed', res.message || 'Could not change password.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Password change failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Account Deletion (CRUD Delete)
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? All interview histories, challenges, and ATS reports will be irreversibly erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteAccount();
              if (res.success) {
                await logout();
                router.replace('/sign-in');
              } else {
                Alert.alert('Error', res.message || 'Could not delete account.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/sign-in');
        },
      },
    ]);
  };

  // Compute full avatar image URL
  const getAvatarSource = () => {
    const raw = user?.avatarUrl;
    if (!raw) return null;
    if (raw.startsWith('http')) return { uri: raw };
    const base = API_BASE_URL.replace(/\/api$/, '');
    return { uri: `${base}${raw}` };
  };

  const readinessScore =
    stats?.readinessScore !== undefined && stats?.readinessScore !== null
      ? stats.readinessScore
      : user?.readinessScore !== undefined && user?.readinessScore !== null
      ? user.readinessScore
      : 0;
  const skillsArray = user?.skills
    ? user.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : ['React', 'TypeScript', 'Node.js', 'PostgreSQL'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Candidate Profile"
        showAvatar={false}
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={openEditModal}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.headerBtnText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Avatar & Identity Card */}
        <View style={styles.userSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setAvatarModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : getAvatarSource() ? (
                <Image source={getAvatarSource()!} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={44} color={Colors.primary} />
              )}
            </View>

            {/* Camera / Edit Badge */}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#070C12" />
            </View>

            {/* Readiness Score Pill */}
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{readinessScore}%</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user?.name || 'Candidate Name'}</Text>
          <Text style={styles.userRole}>{user?.targetRole || 'Full Stack Developer'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Experience Level Pill */}
          <View style={styles.expBadge}>
            <Ionicons name="ribbon-outline" size={13} color={Colors.primary} />
            <Text style={styles.expBadgeText}>{user?.experienceLevel || 'Mid-Level'}</Text>
          </View>
        </View>

        {/* Aggregated Performance Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.totalInterviews || 0}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.solvedChallenges || 0}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats?.uploadedResumes || 0}</Text>
            <Text style={styles.statLabel}>Resumes</Text>
          </View>
        </View>

        {/* Readiness Score Gauge Card */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessLeft}>
            <Text style={styles.readinessTitle}>OVERALL READINESS</Text>
            <View style={styles.scoreNumberRow}>
              <Text style={styles.scoreNumberLarge}>{readinessScore}</Text>
              <Text style={styles.scoreNumberTotal}> / 100</Text>
            </View>
            <Text style={styles.readinessStatus}>
              {readinessScore === 0
                ? 'Not Started (Take Drills)'
                : stats?.readinessVerdict ||
                  (readinessScore >= 90
                    ? 'Enterprise Ready (Top 5%)'
                    : readinessScore >= 75
                    ? 'Job Ready'
                    : readinessScore >= 50
                    ? 'Making Steady Progress'
                    : 'Needs Practice')}
            </Text>
          </View>

          <ProgressRing
            progress={readinessScore}
            size={76}
            strokeWidth={7}
            label={`${readinessScore}%`}
          />
        </View>

        {/* Professional Summary / Bio */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>EXECUTIVE SUMMARY / BIO</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.sectionEditAction}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>
              {user?.bio || 'No professional bio added yet. Tap Edit to add your executive summary, career achievements, and interview goals.'}
            </Text>
          </View>
        </View>

        {/* Core Technical Competencies & Skills */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>CORE COMPETENCIES & SKILLS</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.sectionEditAction}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsGrid}>
            {skillsArray.map((skill, index) => (
              <View key={index} style={styles.skillPill}>
                <Text style={styles.skillPillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact & Professional Profiles */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderLabel}>PROFESSIONAL DETAILS & LINKS</Text>
          <View style={styles.infoCard}>
            {/* Phone */}
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not specified'}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* Education */}
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>Education:</Text>
              <Text style={styles.infoValue}>{user?.education || 'BSc / Undergraduate'}</Text>
            </View>

            <View style={styles.infoDivider} />

            {/* GitHub */}
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => user?.githubUrl && Linking.openURL(user.githubUrl)}
              disabled={!user?.githubUrl}
            >
              <Ionicons name="logo-github" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>GitHub:</Text>
              <Text style={[styles.infoValue, user?.githubUrl && styles.infoLink]}>
                {user?.githubUrl || 'Add GitHub URL'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoDivider} />

            {/* LinkedIn */}
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => user?.linkedinUrl && Linking.openURL(user.linkedinUrl)}
              disabled={!user?.linkedinUrl}
            >
              <Ionicons name="logo-linkedin" size={18} color={Colors.primary} />
              <Text style={styles.infoLabel}>LinkedIn:</Text>
              <Text style={[styles.infoValue, user?.linkedinUrl && styles.infoLink]}>
                {user?.linkedinUrl || 'Add LinkedIn URL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Account Management Block */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeaderLabel}>SECURITY & ACCOUNT</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setPasswordModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.infoDivider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/settings')}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="settings-outline" size={18} color={Colors.primary} />
                <Text style={styles.actionText}>App Preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.infoDivider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                <Text style={[styles.actionText, { color: Colors.error }]}>Delete Account</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.primary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Modal Header - Pushed down for iPhone Notch / Dynamic Island */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 52) + 12 : 32 }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>Edit Candidate Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={savingProfile} style={styles.modalSaveBtn} activeOpacity={0.8}>
              {savingProfile ? (
                <ActivityIndicator size="small" color="#070C12" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <Text style={styles.inputGroupLabel}>FULL NAME</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Candidate Name"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Target Job Role */}
            <Text style={styles.inputGroupLabel}>TARGET JOB ROLE</Text>
            <TextInput
              style={styles.modalInput}
              value={editRole}
              onChangeText={setEditRole}
              placeholder="e.g. Senior Full Stack Developer"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Role Quick Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {POPULAR_ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.smallChip, editRole === r && styles.smallChipActive]}
                  onPress={() => setEditRole(r)}
                >
                  <Text style={[styles.smallChipText, editRole === r && styles.smallChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Seniority / Experience Level */}
            <Text style={[styles.inputGroupLabel, { marginTop: Spacing.md }]}>EXPERIENCE LEVEL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.smallChip, editExpLevel === lvl && styles.smallChipActive]}
                  onPress={() => setEditExpLevel(lvl)}
                >
                  <Text style={[styles.smallChipText, editExpLevel === lvl && styles.smallChipTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Bio / Summary */}
            <Text style={[styles.inputGroupLabel, { marginTop: Spacing.md }]}>BIO / EXECUTIVE SUMMARY</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Highlight your background, core stacks, and career goals..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
            />

            {/* Skills Manager */}
            <Text style={styles.inputGroupLabel}>CORE TECHNICAL SKILLS</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillTextInput}
                value={newSkillInput}
                onChangeText={setNewSkillInput}
                placeholder="Type skill & tap Add (e.g. Docker, Redis)..."
                placeholderTextColor={Colors.textMuted}
                onSubmitEditing={handleAddSkill}
              />
              <TouchableOpacity style={styles.addSkillBtn} onPress={handleAddSkill}>
                <Ionicons name="add" size={20} color="#070C12" />
                <Text style={styles.addSkillText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editSkillsGrid}>
              {editSkillsList.map((skill) => (
                <View key={skill} style={styles.removableSkillPill}>
                  <Text style={styles.removableSkillText}>{skill}</Text>
                  <TouchableOpacity onPress={() => handleRemoveSkill(skill)}>
                    <Ionicons name="close-circle" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Phone & Education */}
            <Text style={styles.inputGroupLabel}>PHONE NUMBER</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+94 77 123 4567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputGroupLabel}>EDUCATION / UNIVERSITY</Text>
            <TextInput
              style={styles.modalInput}
              value={editEducation}
              onChangeText={setEditEducation}
              placeholder="e.g. BEng (Hons) Software Engineering"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Social / Dev Links */}
            <Text style={styles.inputGroupLabel}>GITHUB PROFILE URL</Text>
            <TextInput
              style={styles.modalInput}
              value={editGithub}
              onChangeText={setEditGithub}
              placeholder="https://github.com/yourusername"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.inputGroupLabel}>LINKEDIN PROFILE URL</Text>
            <TextInput
              style={styles.modalInput}
              value={editLinkedin}
              onChangeText={setEditLinkedin}
              placeholder="https://linkedin.com/in/yourusername"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />

            {/* Bottom Save Action */}
            <Button
              title="Save Profile Changes"
              onPress={handleSaveProfile}
              loading={savingProfile}
              variant="primary"
              style={{ marginTop: Spacing.xl, marginBottom: Spacing.xxxl }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ================= AVATAR PICKER MODAL ================= */}
      <Modal
        visible={avatarModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAvatarModalVisible(false)}
        >
          <View style={styles.avatarPickerCard} onStartShouldSetResponder={() => true}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>Update Profile Picture</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.avatarActionBtn} onPress={handlePickFromGallery}>
              <View style={styles.avatarActionIcon}>
                <Ionicons name="images-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.avatarActionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.avatarActionBtn} onPress={handleTakePhoto}>
              <View style={styles.avatarActionIcon}>
                <Ionicons name="camera-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.avatarActionText}>Take a Photo</Text>
            </TouchableOpacity>

            {/* Preset Avatars */}
            <Text style={styles.presetHeading}>OR PICK A PRESET AVATAR</Text>
            <View style={styles.presetGrid}>
              {PRESET_AVATARS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectPresetAvatar(preset)}
                  style={styles.presetCircle}
                >
                  <Image source={{ uri: preset }} style={styles.presetImage} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Remove Option */}
            {user?.avatarUrl && (
              <TouchableOpacity style={styles.removeAvatarBtn} onPress={handleRemoveAvatar}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.removeAvatarText}>Remove Current Picture</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================= CHANGE PASSWORD MODAL ================= */}
      <Modal
        visible={passwordModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPasswordModalVisible(false)}
        >
          <View style={styles.passwordCard} onStartShouldSetResponder={() => true}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGroupLabel}>CURRENT PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Enter current password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />

            <Text style={styles.inputGroupLabel}>NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />

            <Text style={styles.inputGroupLabel}>CONFIRM NEW PASSWORD</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />

            <Button
              title="Update Password"
              onPress={handleChangePassword}
              loading={savingPassword}
              variant="primary"
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070C12' },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: 'rgba(0, 245, 212, 0.1)', borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.3)' },
  headerBtnText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },

  // User Section
  userSection: { alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#101A28', borderWidth: 2.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  editBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: Colors.primary, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#070C12' },
  scoreBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: Colors.primary, paddingVertical: 3, paddingHorizontal: 8, borderRadius: BorderRadius.full, borderWidth: 2, borderColor: '#070C12' },
  scoreBadgeText: { fontSize: 10, fontWeight: Typography.bold, color: '#070C12' },
  userName: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 2 },
  userRole: { fontSize: Typography.bodySmall, color: Colors.textSecondary, marginBottom: 2 },
  userEmail: { fontSize: Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 245, 212, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  expBadgeText: { fontSize: 11, fontWeight: Typography.bold, color: Colors.primary },

  // Stats Row
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E1724', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1B283A', marginBottom: Spacing.xl },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: Typography.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#1B283A' },

  // Readiness Card
  readinessCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0E1724', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: '#1B283A', marginBottom: Spacing.xl },
  readinessLeft: { flex: 1 },
  readinessTitle: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.xs },
  scoreNumberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.xs },
  scoreNumberLarge: { fontSize: 30, fontWeight: Typography.bold, color: Colors.textPrimary },
  scoreNumberTotal: { fontSize: Typography.body, color: Colors.textMuted },
  readinessStatus: { fontSize: Typography.bodySmall, color: Colors.primary, fontWeight: Typography.semiBold },

  // Section Blocks
  sectionBlock: { marginBottom: Spacing.xl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionHeaderLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1 },
  sectionEditAction: { fontSize: Typography.caption, fontWeight: Typography.bold, color: Colors.primary },
  bioCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: '#1B283A' },
  bioText: { fontSize: Typography.bodySmall, color: Colors.textSecondary, lineHeight: 22 },

  // Skills Grid
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillPill: { backgroundColor: '#111D2D', borderWidth: 1, borderColor: '#1F3148', borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6 },
  skillPillText: { fontSize: Typography.caption, color: Colors.textPrimary, fontWeight: Typography.medium },

  // Details & Info Card
  infoCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: '#1B283A' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.sm },
  infoLabel: { fontSize: Typography.bodySmall, color: Colors.textMuted, width: 84 },
  infoValue: { flex: 1, fontSize: Typography.bodySmall, color: Colors.textPrimary },
  infoLink: { color: Colors.primary, fontWeight: Typography.semiBold },
  infoDivider: { height: 1, backgroundColor: '#172332' },

  // Actions Card
  actionsCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderWidth: 1, borderColor: '#1B283A' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  actionText: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Colors.textPrimary },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(0, 245, 212, 0.3)', borderRadius: BorderRadius.xl, paddingVertical: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.xxl },
  signOutText: { fontSize: Typography.body, fontWeight: Typography.bold, color: Colors.primary },

  // Edit Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#070C12' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 64 : 32,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2738',
    backgroundColor: '#0A1017',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#121E2C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1D2F44',
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: Spacing.xs,
  },
  modalSaveBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: '#070C12' },
  modalScroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  inputGroupLabel: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginBottom: 6, marginTop: Spacing.sm },
  modalInput: { backgroundColor: '#0E1724', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#1B283A', paddingHorizontal: Spacing.md, height: 48, fontSize: Typography.bodySmall, color: Colors.textPrimary, marginBottom: Spacing.xs },
  chipRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  smallChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: '#111D2C', borderWidth: 1, borderColor: '#1D2E42' },
  smallChipActive: { backgroundColor: 'rgba(0, 245, 212, 0.15)', borderColor: Colors.primary },
  smallChipText: { fontSize: Typography.caption, color: Colors.textSecondary },
  smallChipTextActive: { color: Colors.primary, fontWeight: Typography.bold },
  skillInputRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  skillTextInput: { flex: 1, backgroundColor: '#0E1724', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: '#1B283A', paddingHorizontal: Spacing.md, height: 44, fontSize: Typography.bodySmall, color: Colors.textPrimary },
  addSkillBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44 },
  addSkillText: { fontSize: Typography.caption, fontWeight: Typography.bold, color: '#070C12' },
  editSkillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  removableSkillPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#111D2D', borderWidth: 1, borderColor: '#1F3148', borderRadius: BorderRadius.full, paddingLeft: 10, paddingRight: 6, paddingVertical: 5 },
  removableSkillText: { fontSize: Typography.caption, color: Colors.textPrimary },

  // Avatar Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  avatarPickerCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#1B283A' },
  avatarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  avatarModalTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Colors.textPrimary },
  avatarActionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: '#131E2E', borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#1D2F44', marginBottom: Spacing.sm },
  avatarActionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,245,212,0.1)', alignItems: 'center', justifyContent: 'center' },
  avatarActionText: { fontSize: Typography.bodySmall, fontWeight: Typography.bold, color: Colors.textPrimary },
  presetHeading: { fontSize: 10, fontWeight: Typography.bold, color: Colors.textMuted, letterSpacing: 1, marginTop: Spacing.md, marginBottom: Spacing.sm },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center', marginBottom: Spacing.lg },
  presetCircle: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.primary },
  presetImage: { width: '100%', height: '100%' },
  removeAvatarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm },
  removeAvatarText: { fontSize: Typography.caption, color: Colors.error, fontWeight: Typography.bold },

  // Password Modal
  passwordCard: { backgroundColor: '#0E1724', borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#1B283A' },
});
