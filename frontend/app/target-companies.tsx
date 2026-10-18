/**
 * AI Mentor - Target Top Companies & Job Openings Nowadays
 * Comprehensive Elite Preparation calibrated to Sri Lanka and Global Tech Giants
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Header } from '../src/components/Header';
import {
  TECH_COMPANIES,
  JOB_OPENINGS,
  TechCompany,
  JobOpening,
} from '../src/data/techGiantsAndJobs';

type ActiveTab = 'all' | 'srilanka' | 'global' | 'jobs' | 'categories';

export default function TargetCompaniesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ActiveTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<TechCompany | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [customPrepVisible, setCustomPrepVisible] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customJd, setCustomJd] = useState('');
  const [jobRegionFilter, setJobRegionFilter] = useState<'all' | 'srilanka' | 'global'>('all');

  // Filter companies based on search and tab
  const filteredCompanies = useMemo(() => {
    return TECH_COMPANIES.filter((comp) => {
      const matchesSearch =
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.techStacks.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'srilanka') return comp.category === 'srilanka';
      if (activeTab === 'global') return comp.category === 'global';
      return true;
    });
  }, [searchQuery, activeTab]);

  // Filter jobs based on search and region
  const filteredJobs = useMemo(() => {
    return JOB_OPENINGS.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.techStacks.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (jobRegionFilter === 'srilanka') return job.region === 'srilanka';
      if (jobRegionFilter === 'global') return job.region === 'global' || job.region === 'remote';
      return true;
    });
  }, [searchQuery, jobRegionFilter]);

  const handleLaunchCompanyInterview = (company: TechCompany) => {
    setSelectedCompany(null);
    router.push({
      pathname: '/mock-interview',
      params: {
        companyId: company.id,
        companyName: company.name,
        role: `${company.name} Software Engineer`,
      },
    });
  };

  const handleLaunchJobInterview = (job: JobOpening) => {
    setSelectedJob(null);
    router.push({
      pathname: '/mock-interview',
      params: {
        companyId: job.companyId,
        companyName: job.companyName,
        role: job.title,
      },
    });
  };

  const handleLaunchCustomPrep = () => {
    setCustomPrepVisible(false);
    router.push({
      pathname: '/mock-interview',
      params: {
        companyName: customCompany.trim() || 'Custom Tech Enterprise',
        role: customRole.trim() || 'Software Engineer',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header matching app standards */}
      <View style={styles.topNavBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Target Top Companies</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Elite Preparation Hero Header */}
        <View style={styles.heroSection}>
          <View style={styles.eliteBadgeRow}>
            <Text style={styles.eliteBadgeText}>ELITE PREPARATION</Text>
          </View>
          <Text style={styles.heroMainTitle}>Target Top Companies</Text>
          <Text style={styles.heroSubtitle}>
            Tailored AI simulations calibrated to specific corporate hiring benchmarks.
          </Text>
        </View>

        {/* Search Bar matching screenshot */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tech giants, stacks (Java, React, AWS)..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab & Category Filter Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={activeTab === 'all' ? '#070C12' : Colors.textSecondary}
            />
            <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
              All Tech Giants
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'srilanka' && styles.filterPillActive]}
            onPress={() => setActiveTab('srilanka')}
            activeOpacity={0.8}
          >
            <Text style={styles.pillEmoji}>🇱🇰</Text>
            <Text style={[styles.filterPillText, activeTab === 'srilanka' && styles.filterPillTextActive]}>
              Sri Lanka Giants ({TECH_COMPANIES.filter((c) => c.category === 'srilanka').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'global' && styles.filterPillActive]}
            onPress={() => setActiveTab('global')}
            activeOpacity={0.8}
          >
            <Text style={styles.pillEmoji}>🌍</Text>
            <Text style={[styles.filterPillText, activeTab === 'global' && styles.filterPillTextActive]}>
              Global Giants ({TECH_COMPANIES.filter((c) => c.category === 'global').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'jobs' && styles.filterPillActiveJobs]}
            onPress={() => setActiveTab('jobs')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="briefcase"
              size={13}
              color={activeTab === 'jobs' ? '#070C12' : '#00E676'}
            />
            <Text
              style={[
                styles.filterPillText,
                activeTab === 'jobs' ? styles.filterPillTextActive : { color: '#00E676', fontWeight: '800' },
              ]}
            >
              Job Openings Nowadays ({JOB_OPENINGS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'categories' && styles.filterPillActive]}
            onPress={() => setActiveTab('categories')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid-outline"
              size={13}
              color={activeTab === 'categories' ? '#070C12' : Colors.textSecondary}
            />
            <Text style={[styles.filterPillText, activeTab === 'categories' && styles.filterPillTextActive]}>
              Core Categories
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ========================================================
            VIEW 1: JOB OPENINGS NOWADAYS (Dedicated Live Vacancies)
        ======================================================== */}
        {activeTab === 'jobs' ? (
          <View style={styles.jobsSectionContainer}>
            {/* Jobs Header Banner */}
            <View style={styles.jobsNoticeBanner}>
              <View style={styles.jobsLiveDotRow}>
                <View style={styles.pulseLiveDot} />
                <Text style={styles.jobsLiveTag}>ACTIVE RECRUITMENT • Q4 2026</Text>
              </View>
              <Text style={styles.jobsSectionHeading}>Job Openings Nowadays</Text>
              <Text style={styles.jobsSectionSubheading}>
                Curated active tech openings in Sri Lanka and globally. Select any vacancy to test calibrated AI interview loops!
              </Text>

              {/* Sub-region Filter */}
              <View style={styles.regionSelectorRow}>
                <TouchableOpacity
                  style={[styles.regionChip, jobRegionFilter === 'all' && styles.regionChipActive]}
                  onPress={() => setJobRegionFilter('all')}
                >
                  <Text style={[styles.regionChipText, jobRegionFilter === 'all' && styles.regionChipTextActive]}>
                    All ({JOB_OPENINGS.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.regionChip, jobRegionFilter === 'srilanka' && styles.regionChipActive]}
                  onPress={() => setJobRegionFilter('srilanka')}
                >
                  <Text style={[styles.regionChipText, jobRegionFilter === 'srilanka' && styles.regionChipTextActive]}>
                    🇱🇰 Sri Lanka ({JOB_OPENINGS.filter((j) => j.region === 'srilanka').length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.regionChip, jobRegionFilter === 'global' && styles.regionChipActive]}
                  onPress={() => setJobRegionFilter('global')}
                >
                  <Text style={[styles.regionChipText, jobRegionFilter === 'global' && styles.regionChipTextActive]}>
                    🌍 Global / Remote ({JOB_OPENINGS.filter((j) => j.region !== 'srilanka').length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Job Opening Cards */}
            {filteredJobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyStateTitle}>No job openings found</Text>
                <Text style={styles.emptyStateSubtitle}>Try clearing your search query.</Text>
              </View>
            ) : (
              filteredJobs.map((job) => (
                <View key={job.id} style={styles.jobCard}>
                  {/* Job Header */}
                  <View style={styles.jobCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.companyBadgeRow}>
                        <Text style={styles.jobCompanyName}>{job.companyName}</Text>
                        {job.badge && (
                          <View style={styles.jobHotBadge}>
                            <Text style={styles.jobHotBadgeText}>{job.badge}</Text>
                          </View>
                        )}
                        <Text style={styles.jobPostedDate}>{job.postedDate}</Text>
                      </View>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                    </View>
                  </View>

                  {/* Location & Experience Meta */}
                  <View style={styles.jobMetaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-outline" size={13} color={Colors.primary} />
                      <Text style={styles.metaText}>{job.location}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="briefcase-outline" size={13} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{job.experienceLevel}</Text>
                    </View>
                  </View>

                  {/* Salary Bracket */}
                  {job.salaryRange && (
                    <View style={styles.salaryRow}>
                      <Ionicons name="cash-outline" size={14} color="#00E676" />
                      <Text style={styles.salaryText}>{job.salaryRange}</Text>
                    </View>
                  )}

                  {/* Tech Stack Chips */}
                  <View style={styles.techStackRow}>
                    {job.techStacks.map((tech) => (
                      <View key={tech} style={styles.techPill}>
                        <Text style={styles.techPillText}>{tech}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.jobActionRow}>
                    <TouchableOpacity
                      style={styles.prepForJobBtn}
                      onPress={() => handleLaunchJobInterview(job)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="sparkles" size={14} color="#070C12" />
                      <Text style={styles.prepForJobBtnText}>Practice for this Role</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.viewJobSpecsBtn}
                      onPress={() => setSelectedJob(job)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewJobSpecsBtnText}>Job Specs</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : activeTab === 'categories' ? (
          /* ========================================================
              VIEW 2: CORE INTERVIEW CATEGORIES (Classic Preserved)
          ======================================================== */
          <View style={styles.categoriesContainer}>
            <Text style={styles.categorySectionTitle}>Standard Milestone Categories</Text>

            {/* Leadership Questions */}
            <TouchableOpacity
              style={styles.legacyCategoryCard}
              onPress={() => router.push('/leadership-mcq')}
              activeOpacity={0.8}
            >
              <View style={[styles.legacyIconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
                <Ionicons name="ribbon-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.legacyInfo}>
                <View style={styles.legacyTitleRow}>
                  <Text style={styles.legacyTitle}>Leadership Questions</Text>
                  <View style={styles.legacyBadge}>
                    <Text style={styles.legacyBadgeText}>40 MCQs</Text>
                  </View>
                </View>
                <Text style={styles.legacySubtitle}>
                  40-question scenario papers tiered from Internship to Executive level with auto-submit.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Technical Coding & Behavioral Split */}
            <View style={styles.splitRow}>
              <TouchableOpacity
                style={styles.splitCard}
                onPress={() => router.push('/coding-challenge')}
                activeOpacity={0.8}
              >
                <View style={[styles.legacyIconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
                  <Ionicons name="code-slash-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.splitTitle}>Technical</Text>
                <Text style={styles.splitSubtitle}>Code, system design, and theory sandbox.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.splitCard}
                onPress={() => router.push('/mock-interview')}
                activeOpacity={0.8}
              >
                <View style={[styles.legacyIconBox, { backgroundColor: 'rgba(255, 179, 0, 0.12)' }]}>
                  <Ionicons name="bulb-outline" size={22} color={Colors.warning} />
                </View>
                <Text style={styles.splitTitle}>Behavioral</Text>
                <Text style={styles.splitSubtitle}>STAR method storytelling and scenario logic.</Text>
              </TouchableOpacity>
            </View>

            {/* Final Round Elite */}
            <TouchableOpacity
              style={styles.legacyCategoryCard}
              onPress={() => router.push('/mock-interview')}
              activeOpacity={0.8}
            >
              <View style={[styles.legacyIconBox, { backgroundColor: 'rgba(0, 245, 212, 0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.legacyInfo}>
                <View style={styles.legacyTitleRow}>
                  <Text style={styles.legacyTitle}>Final Round</Text>
                  <View style={[styles.legacyBadge, { backgroundColor: 'rgba(0, 245, 212, 0.2)' }]}>
                    <Text style={styles.legacyBadgeText}>ELITE</Text>
                  </View>
                </View>
                <Text style={styles.legacySubtitle}>
                  Executive alignment, high-stakes decision making, and culture assessment.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          /* ========================================================
              VIEW 3: TARGET TOP COMPANIES (Matches Screenshot)
          ======================================================== */
          <View style={styles.companiesListContainer}>
            {/* Company Cards Loop */}
            {filteredCompanies.map((company) => {
              // Special Netflix styling
              if (company.id === 'netflix') {
                return (
                  <TouchableOpacity
                    key={company.id}
                    style={styles.netflixCard}
                    onPress={() => setSelectedCompany(company)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.netflixAccentBar} />
                    <View style={styles.netflixContent}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.netflixTitle}>{company.title}</Text>
                        <Text style={styles.netflixSubtitle}>{company.subtitle}</Text>
                        <View style={styles.techPillRow}>
                          {company.techStacks.slice(0, 4).map((tech) => (
                            <View key={tech} style={styles.netflixTechPill}>
                              <Text style={styles.netflixTechText}>{tech}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={styles.netflixScoreBlock}>
                        <Text style={styles.netflixScoreNum}>{company.matchScore}%</Text>
                        <Text style={styles.netflixScoreLabel}>MASTERY</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              // Standard Full-Width & Grid Cards (Google, Amazon, WSO2, IFS, etc.)
              return (
                <TouchableOpacity
                  key={company.id}
                  style={styles.companyCard}
                  onPress={() => setSelectedCompany(company)}
                  activeOpacity={0.85}
                >
                  <View style={styles.companyCardTop}>
                    <View style={styles.companyBrandRow}>
                      <View style={[styles.companyLogoBox, { backgroundColor: company.logoBg }]}>
                        <Ionicons
                          name={company.logoIcon as any}
                          size={24}
                          color={company.logoColor}
                        />
                      </View>
                      {company.category === 'srilanka' && (
                        <View style={styles.slFlagBadge}>
                          <Text style={styles.slFlagText}>🇱🇰 SRI LANKA</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.readinessBlock}>
                      <Text style={styles.readinessScore}>{company.matchScore}% Match</Text>
                      <Text style={styles.readinessLabel}>Readiness</Text>
                    </View>
                  </View>

                  <Text style={styles.companyMainTitle}>{company.title}</Text>
                  <Text style={styles.companySubtitle}>{company.subtitle}</Text>

                  {/* Tech Stacks Tags */}
                  <View style={styles.techStackRow}>
                    {company.techStacks.slice(0, 5).map((tech) => (
                      <View key={tech} style={styles.techPill}>
                        <Text style={styles.techPillText}>{tech}</Text>
                      </View>
                    ))}
                    {company.techStacks.length > 5 && (
                      <View style={styles.techPillMore}>
                        <Text style={styles.techPillMoreText}>+{company.techStacks.length - 5}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Stats & Badge */}
                  <View style={styles.companyCardBottom}>
                    <View style={styles.companyStatsRow}>
                      <Ionicons name="pulse-outline" size={14} color={Colors.primary} />
                      <Text style={styles.companyStatsText}>{company.statsText}</Text>
                    </View>

                    {company.badge && (
                      <View
                        style={[
                          styles.companyCustomBadge,
                          {
                            backgroundColor: `${company.badgeColor || Colors.primary}20`,
                            borderColor: `${company.badgeColor || Colors.primary}50`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.companyCustomBadgeText,
                            { color: company.badgeColor || Colors.primary },
                          ]}
                        >
                          {company.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Custom Prep Card (Exactly matching screenshot at bottom) */}
            <View style={styles.customPrepCard}>
              <View style={styles.customIconCircle}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.customPrepTitle}>Custom Prep</Text>
              <Text style={styles.customPrepSubtitle}>
                Paste a job description to generate a hyper-specific AI interview simulation.
              </Text>
              <TouchableOpacity
                style={styles.createMockSessionBtn}
                onPress={() => setCustomPrepVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.createMockSessionBtnText}>Create Mock Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================
          MODAL 1: TECH GIANT DOSSIER & PREPARATION BLUEPRINT
      ======================================================== */}
      <Modal
        visible={!!selectedCompany}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedCompany(null)}
      >
        {selectedCompany && (
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View
              style={[
                styles.modalHeader,
                { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) + 12 : 28 },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelectedCompany(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {selectedCompany.name} Dossier
                </Text>
                <Text style={styles.modalHeaderSubtitle}>Hiring Benchmark & Tech Stack</Text>
              </View>
              <View style={{ width: 38 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Company Banner */}
              <View style={styles.companyBannerCard}>
                <View style={[styles.companyBannerLogo, { backgroundColor: selectedCompany.logoBg }]}>
                  <Ionicons
                    name={selectedCompany.logoIcon as any}
                    size={32}
                    color={selectedCompany.logoColor}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyBannerName}>{selectedCompany.name}</Text>
                  <Text style={styles.companyBannerHQ}>📍 {selectedCompany.headquarters}</Text>
                  <View style={styles.companyBannerMatchRow}>
                    <Text style={styles.companyBannerMatchText}>
                      Readiness Match: {selectedCompany.matchScore}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Company Overview */}
              <Text style={styles.modalSectionTitle}>OVERVIEW & HIRING BENCHMARK</Text>
              <Text style={styles.companyOverviewText}>{selectedCompany.overview}</Text>

              {/* Complete Tech Stacks */}
              <Text style={styles.modalSectionTitle}>PRIMARY TECH STACK & ECOSYSTEM</Text>
              <View style={styles.techPillGrid}>
                {selectedCompany.techStacks.map((tech) => (
                  <View key={tech} style={styles.modalTechPill}>
                    <Ionicons name="code-working-outline" size={13} color={Colors.primary} />
                    <Text style={styles.modalTechPillText}>{tech}</Text>
                  </View>
                ))}
              </View>

              {/* 4-Stage Interview Process */}
              <Text style={styles.modalSectionTitle}>INTERVIEW LOOP STAGES</Text>
              {selectedCompany.interviewRounds.map((round, idx) => (
                <View key={idx} style={styles.roundCard}>
                  <View style={styles.roundHeaderRow}>
                    <View style={styles.roundBadge}>
                      <Text style={styles.roundBadgeText}>{round.round}</Text>
                    </View>
                    <Text style={styles.roundDuration}>{round.duration}</Text>
                  </View>
                  <Text style={styles.roundTitle}>{round.title}</Text>
                  <Text style={styles.roundDesc}>{round.description}</Text>
                </View>
              ))}

              {/* Frequently Asked Question Themes */}
              <Text style={styles.modalSectionTitle}>FREQUENT INTERVIEW THEMES</Text>
              <View style={styles.questionThemesBox}>
                {selectedCompany.keyQuestionThemes.map((q, qIdx) => (
                  <View key={qIdx} style={styles.themeRow}>
                    <Ionicons name="help-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.themeText}>{q}</Text>
                  </View>
                ))}
              </View>

              {/* Launch Action Button */}
              <TouchableOpacity
                style={styles.launchSimulationBtn}
                onPress={() => handleLaunchCompanyInterview(selectedCompany)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#070C12" />
                <Text style={styles.launchSimulationBtnText}>
                  Start AI Interview for {selectedCompany.name}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ========================================================
          MODAL 2: JOB OPENING SPECS & APPLICATION DETAILS
      ======================================================== */}
      <Modal
        visible={!!selectedJob}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedJob(null)}
      >
        {selectedJob && (
          <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
            <View
              style={[
                styles.modalHeader,
                { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) + 12 : 28 },
              ]}
            >
              <TouchableOpacity
                onPress={() => setSelectedJob(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                  {selectedJob.companyName}
                </Text>
                <Text style={styles.modalHeaderSubtitle}>Job Specification</Text>
              </View>
              <View style={{ width: 38 }} />
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Job Title & Meta Banner */}
              <View style={styles.jobModalBanner}>
                <Text style={styles.jobModalTitle}>{selectedJob.title}</Text>
                <Text style={styles.jobModalCompany}>
                  {selectedJob.companyName} • {selectedJob.department}
                </Text>
                <View style={styles.jobModalMetaRow}>
                  <Text style={styles.jobModalMeta}>📍 {selectedJob.location}</Text>
                  <Text style={styles.jobModalMeta}>💼 {selectedJob.experienceLevel}</Text>
                </View>
                {selectedJob.salaryRange && (
                  <View style={styles.jobModalSalaryRow}>
                    <Ionicons name="cash-outline" size={16} color="#00E676" />
                    <Text style={styles.jobModalSalaryText}>{selectedJob.salaryRange}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text style={styles.modalSectionTitle}>ROLE DESCRIPTION</Text>
              <Text style={styles.companyOverviewText}>{selectedJob.description}</Text>

              {/* Tech Stack Required */}
              <Text style={styles.modalSectionTitle}>TECH STACK & TOOLS</Text>
              <View style={styles.techPillGrid}>
                {selectedJob.techStacks.map((tech) => (
                  <View key={tech} style={styles.modalTechPill}>
                    <Ionicons name="layers-outline" size={13} color={Colors.primary} />
                    <Text style={styles.modalTechPillText}>{tech}</Text>
                  </View>
                ))}
              </View>

              {/* Key Responsibilities */}
              <Text style={styles.modalSectionTitle}>KEY RESPONSIBILITIES</Text>
              {selectedJob.responsibilities.map((r, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{r}</Text>
                </View>
              ))}

              {/* Minimum Requirements */}
              <Text style={styles.modalSectionTitle}>MINIMUM QUALIFICATIONS</Text>
              {selectedJob.requirements.map((req, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#00E676" style={{ marginTop: 2 }} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}

              {/* Interview Loop */}
              <Text style={styles.modalSectionTitle}>INTERVIEW STAGES</Text>
              <View style={styles.stagesBox}>
                {selectedJob.interviewStages.map((stage, idx) => (
                  <View key={idx} style={styles.stageItem}>
                    <View style={styles.stageNumberCircle}>
                      <Text style={styles.stageNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stageText}>{stage}</Text>
                  </View>
                ))}
              </View>

              {/* Start AI Prep for this exact Job */}
              <TouchableOpacity
                style={styles.launchSimulationBtn}
                onPress={() => handleLaunchJobInterview(selectedJob)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#070C12" />
                <Text style={styles.launchSimulationBtnText}>
                  Practice AI Interview for this Vacancy
                </Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* ========================================================
          MODAL 3: CUSTOM PREP (Paste JD & Calibrate AI)
      ======================================================== */}
      <Modal
        visible={customPrepVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setCustomPrepVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View
            style={[
              styles.modalHeader,
              { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 50) + 12 : 28 },
            ]}
          >
            <TouchableOpacity
              onPress={() => setCustomPrepVisible(false)}
              style={styles.modalCloseBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.modalHeaderTitle}>Custom Prep Session</Text>
              <Text style={styles.modalHeaderSubtitle}>Calibrate to Any Job Description</Text>
            </View>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.customNoticeCard}>
              <Ionicons name="flash-outline" size={20} color={Colors.primary} />
              <Text style={styles.customNoticeText}>
                Paste any job vacancy text or corporate requirements. The AI Mentor will ingest the tech stack and question loop automatically!
              </Text>
            </View>

            <Text style={styles.inputLabel}>TARGET COMPANY NAME</Text>
            <TextInput
              style={styles.customTextInput}
              placeholder="e.g. WSO2, Uber, Sysco LABS, Stripe, Databricks..."
              placeholderTextColor={Colors.textMuted}
              value={customCompany}
              onChangeText={setCustomCompany}
            />

            <Text style={styles.inputLabel}>TARGET ROLE TITLE</Text>
            <TextInput
              style={styles.customTextInput}
              placeholder="e.g. Senior Backend Engineer, Lead DevOps, Full Stack Lead..."
              placeholderTextColor={Colors.textMuted}
              value={customRole}
              onChangeText={setCustomRole}
            />

            <Text style={styles.inputLabel}>PASTE JOB DESCRIPTION OR TECH SPEC</Text>
            <TextInput
              style={[styles.customTextInput, styles.customTextArea]}
              placeholder="Paste responsibilities, required tech stack (e.g. Go, Kubernetes, Kafka), or job description here..."
              placeholderTextColor={Colors.textMuted}
              value={customJd}
              onChangeText={setCustomJd}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.launchSimulationBtn}
              onPress={handleLaunchCustomPrep}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color="#070C12" />
              <Text style={styles.launchSimulationBtnText}>Generate Calibrated AI Interview</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#121D2C',
    backgroundColor: '#070C12',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0E1724',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: '#070C12',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Hero Section
  heroSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  eliteBadgeRow: {
    marginBottom: 4,
  },
  eliteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00F5D4',
    letterSpacing: 1.2,
  },
  heroMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121C28',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#1D2A3A',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Filter Pills
  filterPillsRow: {
    gap: 8,
    marginBottom: Spacing.lg,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E1724',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#1C2B3C',
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillActiveJobs: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#070C12',
    fontWeight: '800',
  },
  pillEmoji: {
    fontSize: 13,
  },

  // Companies List & Cards
  companiesListContainer: {
    gap: Spacing.md,
  },
  companyCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#19283B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  companyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  companyBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slFlagBadge: {
    backgroundColor: 'rgba(255, 115, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 115, 0, 0.3)',
  },
  slFlagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF7300',
    letterSpacing: 0.5,
  },
  readinessBlock: {
    alignItems: 'flex-end',
  },
  readinessScore: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  readinessLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  companyMainTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  techStackRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  techPill: {
    backgroundColor: '#142131',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#203348',
  },
  techPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  techPillMore: {
    backgroundColor: '#111B27',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  techPillMoreText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  companyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#162434',
    paddingTop: Spacing.sm,
  },
  companyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  companyCustomBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  companyCustomBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Netflix Special Card
  netflixCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#19283B',
    marginBottom: Spacing.xs,
  },
  netflixAccentBar: {
    width: 4,
    backgroundColor: '#E50914',
  },
  netflixContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  netflixTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  netflixSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 6,
  },
  techPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  netflixTechPill: {
    backgroundColor: '#19222E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  netflixTechText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  netflixScoreBlock: {
    alignItems: 'center',
    paddingLeft: Spacing.md,
  },
  netflixScoreNum: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FF6B6B',
  },
  netflixScoreLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
  },

  // Custom Prep Card (matches screenshot)
  customPrepCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#19283B',
    marginTop: Spacing.sm,
  },
  customIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
    marginBottom: Spacing.md,
  },
  customPrepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  customPrepSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  createMockSessionBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createMockSessionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070C12',
  },

  // Jobs Section
  jobsSectionContainer: {
    gap: Spacing.md,
  },
  jobsNoticeBanner: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.25)',
    marginBottom: Spacing.xs,
  },
  jobsLiveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  jobsLiveTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E676',
    letterSpacing: 0.8,
  },
  jobsSectionHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  jobsSectionSubheading: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: Spacing.md,
  },
  regionSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  regionChip: {
    backgroundColor: '#14202F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#1E3044',
  },
  regionChipActive: {
    backgroundColor: '#00E676',
    borderColor: '#00E676',
  },
  regionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  regionChipTextActive: {
    color: '#070C12',
    fontWeight: '800',
  },

  // Job Opening Card
  jobCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#19283B',
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  companyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  jobCompanyName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  jobHotBadge: {
    backgroundColor: 'rgba(255, 61, 0, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 0, 0.3)',
  },
  jobHotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF3D00',
  },
  jobPostedDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  salaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E676',
  },
  jobActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  prepForJobBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
  },
  prepForJobBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#070C12',
  },
  viewJobSpecsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#142131',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#203348',
  },
  viewJobSpecsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // Legacy Categories View
  categoriesContainer: {
    gap: Spacing.md,
  },
  categorySectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  legacyCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#19283B',
    gap: Spacing.md,
  },
  legacyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legacyInfo: {
    flex: 1,
  },
  legacyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  legacyBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  legacyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  legacySubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  splitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  splitCard: {
    flex: 1,
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#19283B',
  },
  splitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  splitSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Modals Styling
  modalContainer: {
    flex: 1,
    backgroundColor: '#070C12',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#162434',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#121D2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  // Company Dossier Modal Details
  companyBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1D2F44',
    gap: Spacing.md,
  },
  companyBannerLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyBannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  companyBannerHQ: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  companyBannerMatchRow: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  companyBannerMatchText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  companyOverviewText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  techPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTechPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121E2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#1E334A',
  },
  modalTechPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  roundCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#182738',
  },
  roundHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roundBadge: {
    backgroundColor: 'rgba(0, 245, 212, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roundBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  roundDuration: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  roundTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  roundDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  questionThemesBox: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#182738',
    gap: 8,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  themeText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  launchSimulationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  launchSimulationBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070C12',
  },

  // Job Modal Specs
  jobModalBanner: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#1E3248',
  },
  jobModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  jobModalCompany: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 6,
  },
  jobModalMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  jobModalMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  jobModalSalaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  jobModalSalaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  stagesBox: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#182738',
    gap: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stageNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#070C12',
  },
  stageText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
  },

  // Custom Prep Form
  customNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0E1724',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#1A293A',
    marginBottom: Spacing.lg,
  },
  customNoticeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: Spacing.sm,
  },
  customTextInput: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#1E2F42',
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  customTextArea: {
    minHeight: 110,
    lineHeight: 19,
  },
});
