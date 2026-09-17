/**
 * AI Mentor - Splash Screen
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../src/constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate loading bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start(() => {
      // Navigate to onboarding screen
      router.replace('/onboarding');
    });
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Center AI Brain Icon */}
        <View style={styles.iconOuterRing}>
          <View style={styles.iconInnerCircle}>
            <Ionicons name="hardware-chip-outline" size={44} color={Colors.primary} />
          </View>
        </View>

        {/* Brand & Tagline */}
        <Text style={styles.brandTitle}>AI Mentor</Text>
        <Text style={styles.tagline}>MASTER YOUR FUTURE</Text>
      </View>

      {/* Bottom Loading Indicator */}
      <View style={styles.bottomSection}>
        <Text style={styles.statusText}>Initializing Intelligence</Text>
        
        <View style={styles.progressBarTrack}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>

        <Text style={styles.securityFooter}>SECURED BY AI MENTOR CORE</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070C12',
    justifyContent: 'space-between',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  iconOuterRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 245, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  iconInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#121B28',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 212, 0.4)',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  statusText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  progressBarTrack: {
    width: '75%',
    height: 3,
    backgroundColor: '#1B2636',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  securityFooter: {
    fontSize: 10,
    fontWeight: Typography.semiBold,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
});
