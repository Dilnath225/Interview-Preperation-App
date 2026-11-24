/**
 * Dashboard Page — Live Operations Map & Candidate Activity Dashboard
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore, TelemetryUser } from '../store';
import { apiGet, API_BASE } from '../api';
import LiveMap from '../components/LiveMap';
import Sidebar from '../components/Sidebar';
import StatsBar from '../components/StatsBar';

export default function DashboardPage() {
  const token = useStore((s) => s.token);
  const logout = useStore((s) => s.logout);
  const updateUser = useStore((s) => s.updateUser);
  const removeUser = useStore((s) => s.removeUser);
  const setUsers = useStore((s) => s.setUsers);
  const setTrail = useStore((s) => s.setTrail);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const selectUser = useStore((s) => s.selectUser);

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, onlineUsers: 0, totalInterviews: 0, totalApplications: 0 });

  // ── Load REST data ──
  const loadInitialData = useCallback(async () => {
    if (!token) return;
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiGet('/api/admin/users', token),
        apiGet('/api/admin/stats', token),
      ]);

      if (usersRes.success) {
        const map = new Map<string, TelemetryUser>();
        for (const u of usersRes.data.users) {
          map.set(u.id, {
            userId: u.id,
            name: u.name,
            email: u.email,
            activity: 'IDLE',
            latitude: u.lastLat,
            longitude: u.lastLng,
            lastSeenAt: u.lastSeenAt,
            isOnline: u.isOnline,
            targetRole: u.targetRole,
            readinessScore: u.readinessScore,
          });
        }
        setUsers(map);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [token, setUsers]);

  // ── Socket connection ──
  useEffect(() => {
    if (!token) return;

    loadInitialData();

    const socket = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      setConnected(true);
      // Join admin room
      socket.emit('admin:join', null, (ack: any) => {
        if (!ack?.success) {
          console.error('Failed to join admin room');
          logout();
        }
      });
    });

    socket.on('disconnect', () => setConnected(false));

    // ── Admin roster ──
    socket.on('admin:roster', (roster: any[]) => {
      const map = new Map(useStore.getState().users);
      for (const r of roster) {
        const existing = map.get(r.userId);
        map.set(r.userId, {
          ...existing!,
          userId: r.userId,
          name: r.name || existing?.name || 'Unknown',
          email: r.email || existing?.email || '',
          activity: r.activity || 'IDLE',
          latitude: r.lastLat ?? existing?.latitude ?? null,
          longitude: r.lastLng ?? existing?.longitude ?? null,
          isOnline: true,
        });
      }
      setUsers(map);
      setOnlineCount(roster.length);
    });

    // ── Live pings ──
    socket.on('telemetry:live_ping', (data: any) => {
      updateUser(data.userId, {
        latitude: data.latitude,
        longitude: data.longitude,
        activity: data.activityContext || 'IDLE',
        name: data.name,
        email: data.email,
        isOnline: true,
      });
    });

    // ── Activity updates ──
    socket.on('telemetry:activity_update', (data: any) => {
      updateUser(data.userId, { activity: data.activityContext });
    });

    // ── User connect / disconnect ──
    socket.on('telemetry:user_connected', (data: any) => {
      updateUser(data.userId, { isOnline: true, name: data.name, email: data.email });
      setOnlineCount((c) => c + 1);
    });

    socket.on('telemetry:user_disconnected', (data: any) => {
      removeUser(data.userId);
      setOnlineCount((c) => Math.max(0, c - 1));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ── Load trail when user selected ──
  useEffect(() => {
    if (!selectedUserId || !token) {
      setTrail([]);
      return;
    }

    apiGet(`/api/admin/users/${selectedUserId}/trail?limit=200`, token)
      .then((res) => {
        if (res.success) setTrail(res.data.trail);
      })
      .catch(() => {});
  }, [selectedUserId, token, setTrail]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/15 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">OPS Command Center</h1>
            <p className="text-[10px] text-slate-500">AI Mentor Live Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-slate-400">
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 px-2 py-1 rounded">
            {onlineCount} ONLINE
          </span>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <StatsBar stats={stats} onlineCount={onlineCount} />

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          <LiveMap />
        </main>
      </div>
    </div>
  );
}
