/**
 * AI Mentor - Root Layout with Auth Provider
 */
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/theme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function InitialLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'mock-interview' || segments[0] === 'coding-challenge';
    const isAuthScreen = segments[0] === 'sign-in' || segments[0] === 'sign-up' || segments[0] === 'onboarding';

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
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mock-interview" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="coding-challenge" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="resume-review" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <InitialLayout />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

