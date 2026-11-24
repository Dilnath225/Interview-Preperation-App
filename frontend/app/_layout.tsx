import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { NotificationProvider } from '../src/context';
import { useTelemetryTracker, ActivityContext } from '../src/hooks/useTelemetryTracker';

function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Active module telemetry context tracking
  const currentSegment = (segments && segments[0]) ? String(segments[0]) : '';
  const activityContext: ActivityContext =
    currentSegment === 'mock-interview'
      ? 'MOCK_INTERVIEW'
      : currentSegment === 'coding-challenge'
      ? 'CODING_SANDBOX'
      : currentSegment === 'resume-review'
      ? 'ATS_SCANNER'
      : currentSegment === '(tabs)'
      ? 'CAREER_COACH'
      : 'IDLE';

  useTelemetryTracker({
    enabled: isAuthenticated,
    activityContext,
  });

  useEffect(() => {
    if (isLoading) return;

    const isCompanyScreen = segments[0] === 'company-auth' || segments[0] === 'company-dashboard' || segments[0] === 'portal-select';
    if (isCompanyScreen) return;

    const inAuthGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'mock-interview' ||
      segments[0] === 'coding-challenge' ||
      segments[0] === 'leadership-mcq' ||
      segments[0] === 'target-companies';
    const isAuthScreen = segments[0] === 'sign-in' || segments[0] === 'sign-up' || segments[0] === 'onboarding' || segments[0] === 'portal-select';

    if (!isAuthenticated && inAuthGroup) {
      // Redirect to sign-in if not authenticated but trying to access protected route
      router.replace('/sign-in');
    } else if (isAuthenticated && isAuthScreen) {
      // Redirect to home if authenticated but trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        animationDuration: 260,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="portal-select" options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="sign-in" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="sign-up" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="company-auth" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="company-dashboard" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="mock-interview" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="coding-challenge" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="leadership-mcq" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="target-companies" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="resume-review" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <InitialLayout />
        </SafeAreaProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}


