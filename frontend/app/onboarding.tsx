/**
 * AI Mentor - Onboarding Screen (3 interactive slides)
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/theme';
import { Button } from '../src/components/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  type: 'mock' | 'resume' | 'speech';
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Realistic Mock Interviews',
    subtitle: 'Practice with our advanced AI that mimics real-world interview scenarios.',
    type: 'mock',
  },
  {
    id: '2',
    title: 'Smart Resume Analysis',
    subtitle: 'Get instant feedback on your CV and optimize it for ATS systems.',
    type: 'resume',
  },
  {
    id: '3',
    title: 'Speech & Progress Tracking',
    subtitle: 'Improve your communication and track your improvement with detailed analytics.',
    type: 'speech',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex && index >= 0 && index < slides.length) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentIndex + 1),
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/sign-in');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      scrollRef.current?.scrollTo({
        x: SCREEN_WIDTH * (currentIndex - 1),
        animated: true,
      });
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    router.replace('/sign-in');
  };

  const renderIllustration = (type: Slide['type']) => {
    if (type === 'mock') {
      return (
        <View style={styles.illustrationCard}>
          <View style={styles.mockCenterGraphic}>
            <View style={styles.mockRing}>
              <Ionicons name="sparkles" size={54} color={Colors.primary} />
            </View>
            <View style={styles.badgeVideo}>
              <Ionicons name="videocam" size={16} color={Colors.primary} />
            </View>
            <View style={styles.badgeMic}>
              <Ionicons name="mic" size={16} color={Colors.primary} />
            </View>
          </View>

          {/* Audio waveform */}
          <View style={styles.waveformContainer}>
            <View style={[styles.waveBar, { height: 16 }]} />
            <View style={[styles.waveBar, { height: 32 }]} />
            <View style={[styles.waveBar, { height: 48 }]} />
            <View style={[styles.waveBar, { height: 28 }]} />
            <View style={[styles.waveBar, { height: 40 }]} />
            <View style={[styles.waveBar, { height: 20 }]} />
          </View>
        </View>
      );
    }

    if (type === 'resume') {
      return (
        <View style={styles.illustrationCard}>
          <View style={styles.resumeDocMockup}>
            <View style={styles.docHeaderCircle} />
            <View style={styles.docLineLong} />
            <View style={styles.docLineMed} />
            <View style={styles.docLineShort} />

            <View style={styles.atsBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.atsText}>ATS OPTIMIZED</Text>
            </View>

            <View style={styles.docLineMed} />
            <View style={styles.docLineShort} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.speechContainer}>
        {/* Speech Clarity Card */}
        <View style={styles.speechTopCard}>
          <View style={styles.speechHeaderRow}>
            <Text style={styles.speechCardTitle}>SPEECH CLARITY</Text>
            <Ionicons name="mic-outline" size={16} color={Colors.primary} />
          </View>
          <View style={styles.waveformRow}>
            <View style={[styles.waveBar, { height: 20 }]} />
            <View style={[styles.waveBar, { height: 38 }]} />
            <View style={[styles.waveBar, { height: 48 }]} />
            <View style={[styles.waveBar, { height: 30 }]} />
            <View style={[styles.waveBar, { height: 44 }]} />
            <View style={[styles.waveBar, { height: 18 }]} />
            <View style={[styles.waveBar, { height: 36 }]} />
          </View>
          <Text style={styles.speechSub}>Real-time tone & pace analysis</Text>
        </View>

        {/* 2 Mini Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={18} color={Colors.warning} />
            <Text style={styles.statValue}>84%</Text>
            <Text style={styles.statLabel}>COMMUNICATION SCORE</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="analytics" size={18} color={Colors.primary} />
            <Text style={styles.statGraphText}>Steady Progress</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Brand & Skip */}
      <View style={styles.topHeader}>
        <Text style={styles.brandText}>AI Mentor</Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.slideScroll}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.graphicSection}>
              {renderIllustration(slide.type)}
            </View>

            <View style={styles.textSection}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Section with Dots & Action Buttons */}
      <View style={styles.footerSection}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        {currentIndex === 0 ? (
          <View style={styles.buttonStack}>
            <Button
              title="Next  →"
              onPress={handleNext}
              variant="primary"
            />
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>SKIP INTRODUCTION</Text>
            </TouchableOpacity>
          </View>
        ) : currentIndex === 1 ? (
          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="secondary"
              style={styles.halfBtn}
            />
            <Button
              title="Next"
              onPress={handleNext}
              variant="primary"
              style={styles.halfBtn}
            />
          </View>
        ) : (
          <Button
            title="Get Started"
            onPress={() => router.replace('/sign-in')}
            variant="primary"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  brandText: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  skipText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  slideScroll: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  graphicSection: {
    width: '100%',
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  illustrationCard: {
    width: '90%',
    height: 280,
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mockCenterGraphic: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mockRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(0, 245, 212, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
  },
  badgeVideo: {
    position: 'absolute',
    bottom: 10,
    left: -5,
    backgroundColor: '#162234',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  badgeMic: {
    position: 'absolute',
    top: 5,
    right: -5,
    backgroundColor: '#162234',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.3)',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: Spacing.xl,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  resumeDocMockup: {
    width: '75%',
    height: '75%',
    backgroundColor: '#141E2C',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#1E2B3D',
  },
  docHeaderCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#202E42',
    marginBottom: Spacing.md,
  },
  docLineLong: {
    height: 6,
    width: '90%',
    backgroundColor: '#202E42',
    borderRadius: 3,
    marginBottom: 8,
  },
  docLineMed: {
    height: 6,
    width: '70%',
    backgroundColor: '#202E42',
    borderRadius: 3,
    marginBottom: 8,
  },
  docLineShort: {
    height: 6,
    width: '50%',
    backgroundColor: '#202E42',
    borderRadius: 3,
    marginBottom: Spacing.md,
  },
  atsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1724',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    gap: 6,
    alignSelf: 'flex-end',
    marginVertical: Spacing.xs,
  },
  atsText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  speechContainer: {
    width: '90%',
    gap: Spacing.md,
  },
  speechTopCard: {
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.15)',
    alignItems: 'center',
  },
  speechHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  speechCardTitle: {
    fontSize: Typography.label,
    fontWeight: Typography.bold,
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 50,
    marginVertical: Spacing.sm,
  },
  speechSub: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0E1724',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statGraphText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  slideTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  slideSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#202C3D',
  },
  buttonStack: {
    gap: Spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfBtn: {
    flex: 1,
  },
});
