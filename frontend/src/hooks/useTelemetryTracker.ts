/**
 * useTelemetryTracker — 24/7 Enterprise Location & Presence Hook
 *
 * Capabilities:
 *  1. Foreground high-precision Socket.io streaming with active module tagging.
 *  2. 24/7 Continuous Background Tracking (phone locked / app minimized) via
 *     expo-task-manager and direct lightweight HTTP telemetry pings.
 *  3. Seamless cross-platform support (iOS native, Android native, Web).
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKGROUND_LOCATION_TASK = 'AI_MENTOR_247_LOCATION_TASK';

const API_URL =
  (typeof process !== 'undefined' && (process.env as any).EXPO_PUBLIC_API_URL) || 'http://localhost:5000';

// ── Socket.io client (lazy import) ──
let ioConnect: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const socketLib = require('socket.io-client');
  ioConnect = socketLib.io || socketLib.default?.io || socketLib;
} catch {
  // socket.io-client not installed
}

// ─────────────────────────────────────────────────────────────
// 24/7 Background Headless Task Definition (Outside React Scope)
// ─────────────────────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const loc = locations && locations[0];
    if (loc && loc.coords) {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Dispatch lightweight REST HTTP telemetry ping
        await fetch(`${API_URL}/api/telemetry/ping`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? undefined,
            activityContext: 'IDLE',
            timestamp: loc.timestamp || Date.now(),
          }),
        });
      } catch {
        // Silently tolerate intermittent background network fluctuations
      }
    }
  }
});

export type ActivityContext =
  | 'IDLE'
  | 'MOCK_INTERVIEW'
  | 'CODING_SANDBOX'
  | 'ATS_SCANNER'
  | 'CAREER_COACH';

interface TelemetryOptions {
  /** Override activity context from calling screen */
  activityContext?: ActivityContext;
  /** If false, skips location tracking entirely */
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

  // ── Send a live location ping (foreground) ──
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

  // ── Start watching & register 24/7 background updates ──
  const startWatching = useCallback(async () => {
    if (watchRef.current || !enabled) return;

    // Web Geolocation fallback
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
        (watchRef as any).current = { remove: () => navigator.geolocation.clearWatch(id) };
        setPermissionGranted(true);
      }
      return;
    }

    // 1. Request Foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionGranted(false);
      return;
    }
    setPermissionGranted(true);

    // Immediate initial coordinate capture
    try {
      const initialPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (initialPos) sendPing(initialPos);
    } catch {
      // Fallback silently to subscription
    }

    // 2. Request & Enable 24/7 Background Updates on Native Devices
    try {
      const bgStatus = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus.status === 'granted') {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (!isRegistered) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 20_000, // 20s update interval
            distanceInterval: 25, // 25m displacement threshold
            deferredUpdatesInterval: 20_000,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'AI Mentor Telemetry Active',
              notificationBody: '24/7 operations & presence telemetry running.',
              notificationColor: '#0284c7',
            },
            pausesUpdatesAutomatically: false,
          });
          console.log('🌍 24/7 Background telemetry task started');
        }
      }
    } catch (err) {
      console.warn('Background location setup note:', err);
    }

    // 3. Foreground continuous watcher
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        timeInterval: 10_000,
      },
      (loc: Location.LocationObject) => sendPing(loc)
    );

    watchRef.current = subscription;
  }, [enabled, sendPing]);

  // ── Stop foreground watching ──
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

  // ── App state listener ──
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Foreground resumed
        connectSocket();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [connectSocket]);

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
