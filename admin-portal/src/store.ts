/**
 * Zustand store — auth state + telemetry user data
 */
import { create } from 'zustand';

export interface TelemetryUser {
  userId: string;
  name: string;
  email: string;
  activity: string;
  latitude: number | null;
  longitude: number | null;
  lastSeenAt?: string;
  isOnline?: boolean;
  targetRole?: string;
  readinessScore?: number;
}

export interface TrailPoint {
  latitude: number;
  longitude: number;
  activityContext: string;
  recordedAt: string;
}

interface AppState {
  token: string | null;
  adminUser: { id: string; email: string; name: string } | null;
  users: Map<string, TelemetryUser>;
  selectedUserId: string | null;
  trail: TrailPoint[];

  setAuth: (token: string, user: { id: string; email: string; name: string }) => void;
  logout: () => void;
  setUsers: (users: Map<string, TelemetryUser>) => void;
  updateUser: (userId: string, patch: Partial<TelemetryUser>) => void;
  removeUser: (userId: string) => void;
  selectUser: (userId: string | null) => void;
  setTrail: (trail: TrailPoint[]) => void;
}

export const useStore = create<AppState>((set, get) => ({
  token: localStorage.getItem('admin_token'),
  adminUser: null,
  users: new Map(),
  selectedUserId: null,
  trail: [],

  setAuth: (token, user) => {
    localStorage.setItem('admin_token', token);
    set({ token, adminUser: user });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ token: null, adminUser: null });
  },

  setUsers: (users) => set({ users }),

  updateUser: (userId, patch) => {
    const users = new Map(get().users);
    const existing = users.get(userId) || {
      userId,
      name: 'Unknown',
      email: '',
      activity: 'IDLE',
      latitude: null,
      longitude: null,
    };
    users.set(userId, { ...existing, ...patch });
    set({ users });
  },

  removeUser: (userId) => {
    const users = new Map(get().users);
    const u = users.get(userId);
    if (u) {
      u.isOnline = false;
      users.set(userId, u);
    }
    set({ users });
  },

  selectUser: (userId) => set({ selectedUserId: userId }),
  setTrail: (trail) => set({ trail }),
}));
