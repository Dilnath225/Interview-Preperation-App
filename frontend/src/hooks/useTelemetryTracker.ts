/**
 * useTelemetryTracker — 24/7 Enterprise Location & Presence Hook
 *
 * Capabilities:
 *  1. Foreground high-precision Socket.io streaming with active module tagging.
 *  2. HTTP Fallback: Always dispatches telemetry even when WebSockets are disconnected.
 *  3. 24/7 Continuous Background Tracking (phone locked / app minimized) via
 *     expo-task-manager and direct lightweight HTTP telemetry pings.
 *  4. Universal Token retrieval across SecureStore, AsyncStorage, and Web storage.
 *  5. Direct Google Cloud Run backend routing (production-ready).
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKGROUND_LOCATION_TASK = 'AI_MENTOR_247_LOCATION_TASK';

// Default to live Google Cloud Run production backend
const DEFAULT_API_URL = 'https://ai-mentor-backend-121422847816.asia-south1.run.app';

const API_URL =
  (typeof process !== 'undefined' && (process.env as any).EXPO_PUBLIC_API_URL) || DEFAULT_API_URL;

// ── Universal Token Getter (SecureStore + SafeStorage + AsyncStorage) ──
async function getStoredToken(): Promise<string | null> {
  const keys = ['ai_mentor_auth_token', 'auth_token', 'token'];
  for (const k of keys) {
    if (Platform.OS === 'web') {
      try {
        const val = typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
        if (val) return val;
      } catch {}
    } else {
      try {
        const val = await SecureStore.getItemAsync(k);
        if (val) return val;
      } catch {}
    }
    try {
      const val = await AsyncStorage.getItem(k);
      if (val) return val;
    } catch {}
  }
  return null;
}

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
        const token = await getStoredToken();
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
  const sendPingRef = useRef<((loc: Location.LocationObject) => Promise<void>) | null>(null);
  const appStateRef = useRef<AppStateStatus>((AppState.currentState || 'active') as AppStateStatus);
  const [isConnected, setIsConnected] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // ── Send a live location ping (foreground: socket + HTTP fallback) ──
  const sendPing = useCallback(
    async (location: Location.LocationObject) => {
      // 1. Socket emission if live
      if (socketRef.current?.connected) {
        socketRef.current.emit('telemetry:location_ping', {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          activityContext,
          timestamp: Date.now(),
        });
      } else {
        // 2. Direct HTTP ping fallback (works 100% even if socket is disconnected)
        try {
          const token = await getStoredToken();
          if (token) {
            fetch(`${API_URL}/api/telemetry/ping`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy ?? undefined,
                activityContext,
                timestamp: Date.now(),
              }),
            }).catch(() => {});
          }
        } catch {}
      }
    },
    [activityContext]
  );

  sendPingRef.current = sendPing;

  // ── Socket connection ──
  const connectSocket = useCallback(async () => {
    if (!ioConnect || socketRef.current?.connected) return;

    const token = await getStoredToken();
    if (!token) return;

    const socket = ioConnect(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('📡 Telemetry socket connected to:', API_URL);
    });

    // ── Super-Admin On-Demand Location Request Listener ──
    socket.on('telemetry:request_immediate_ping', async () => {
      console.log('🎯 On-demand live GPS ping requested by Admin Portal');
      try {
        const freshPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (freshPos && sendPingRef.current) {
          sendPingRef.current(freshPos);
        }
      } catch (err) {
        console.warn('On-demand location capture note:', err);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (err: any) => {
      console.warn('⚠️ Telemetry socket error:', err);
    });

    socketRef.current = socket;
  }, []);

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

    // 1. Check existing Foreground location permission first without re-prompting
    let fgStatus = (await Location.getForegroundPermissionsAsync()).status;
    if (fgStatus !== 'granted') {
      const fgReq = await Location.requestForegroundPermissionsAsync();
      fgStatus = fgReq.status;
    }

    if (fgStatus !== 'granted') {
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

    // 2. Check existing Background permission first without re-prompting
    try {
      let bgStatus = (await Location.getBackgroundPermissionsAsync()).status;
      if (bgStatus !== 'granted') {
        const bgReq = await Location.requestBackgroundPermissionsAsync();
        bgStatus = bgReq.status;
      }

      if (bgStatus === 'granted') {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
        if (!isRegistered) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60_000,
            distanceInterval: 100,
            deferredUpdatesInterval: 60_000,
            showsBackgroundLocationIndicator: false, // Hides persistent blue status bar indicator on iOS
            foregroundService: {
              notificationTitle: 'AI Mentor Telemetry',
              notificationBody: 'On-demand presence connected.',
              notificationColor: '#0284c7',
            },
            pausesUpdatesAutomatically: true, // Auto-pauses sensor when user is stationary to prevent battery drain
          });
          console.log('🌍 Silent background telemetry registered (Zero UI intrusion)');
        }
      }
    } catch (err) {
      console.warn('Background location setup note:', err);
    }

    // 3. Foreground continuous watcher
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
        timeInterval: 30_000,
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
