/**
 * useTelemetryTracker — Battery-Friendly Location & Presence Hook
 *
 * Integrates with Expo Router's authenticated layout to:
 *  1. Request foreground location permission on user consent.
 *  2. Watch position (Accuracy.Balanced, 25m distance, 10s interval) only while foregrounded.
 *  3. Connect to backend Socket.io with JWT, sending coordinates + current activity context.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Socket.io client (lazy import to avoid issues when module is missing) ──
let ioConnect: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const socketLib = require('socket.io-client');
  ioConnect = socketLib.io || socketLib.default?.io || socketLib;
} catch {
  // socket.io-client not installed — telemetry disabled
}

const API_URL =
  (typeof process !== 'undefined' && (process.env as any).EXPO_PUBLIC_API_URL) || 'http://localhost:5000';

export type ActivityContext =
  | 'IDLE'
  | 'MOCK_INTERVIEW'
  | 'CODING_SANDBOX'
  | 'ATS_SCANNER'
  | 'CAREER_COACH';

interface TelemetryOptions {
  /** Override activity context from the calling screen */
  activityContext?: ActivityContext;
  /** If false, skips location tracking entirely (privacy toggle) */
  enabled?: boolean;
}

export function useTelemetryTracker(options: TelemetryOptions = {}) {
  const { activityContext = 'IDLE', enabled = true } = options;
  const socketRef = useRef<any>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState || 'active') as AppStateStatus);
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // ── Socket connection ──
  const connectSocket = useCallback(async () => {
    if (!ioConnect || socketRef.current?.connected) return;

    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const socket = ioConnect(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('📡 Telemetry socket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (err: any) => {
      console.warn('⚠️ Telemetry socket error:', err);
    });

    socketRef.current = socket;
  }, []);

  // ── Send a location ping ──
  const sendPing = useCallback(
    (location: Location.LocationObject) => {
      if (!socketRef.current?.connected) return;

      socketRef.current.emit('telemetry:location_ping', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        activityContext,
        timestamp: Date.now(),
      });
    },
    [activityContext]
  );

  // ── Start watching position ──
  const startWatching = useCallback(async () => {
    if (watchRef.current || !enabled) return;

    // Web doesn't support expo-location's watchPositionAsync the same way
    if (Platform.OS === 'web') {
      if ('geolocation' in navigator) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            sendPing({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
              },
              timestamp: pos.timestamp,
            } as any);
          },
          () => {},
          { enableHighAccuracy: false, maximumAge: 10000 }
        );
        // Store the id so we can clear it
        (watchRef as any).current = { remove: () => navigator.geolocation.clearWatch(id) };
        setPermissionGranted(true);
      }
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionGranted(false);
      return;
    }
    setPermissionGranted(true);

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25, // meters
        timeInterval: 10_000, // 10 seconds
      },
      (loc: Location.LocationObject) => sendPing(loc)
    );

    watchRef.current = subscription;
  }, [enabled, sendPing]);

  // ── Stop watching ──
  const stopWatching = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  // ── Send activity context changes ──
  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('telemetry:activity_change', { activityContext });
    }
  }, [activityContext]);

  // ── App state handling (foreground only) ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Resuming to foreground
        connectSocket();
        startWatching();
      } else if (nextState.match(/inactive|background/)) {
        // Going to background — stop location to save battery
        stopWatching();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [connectSocket, startWatching, stopWatching]);

  // ── Initial mount ──
  useEffect(() => {
    if (!enabled) return;

    connectSocket();
    startWatching();

    return () => {
      stopWatching();
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [enabled, connectSocket, startWatching, stopWatching]);

  return {
    isConnected,
    permissionGranted,
    socket: socketRef,
  };
}
