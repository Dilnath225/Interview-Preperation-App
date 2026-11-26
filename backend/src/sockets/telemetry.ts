/**
 * Real-Time User Location & Presence Telemetry — Socket.io Server Module
 *
 * Architecture:
 *  - Every authenticated user emits `telemetry:location_ping` from the mobile app.
 *  - Pings are immediately forwarded to the `super-admin-telemetry` room (sub-second).
 *  - Supabase DB writes are throttled: at most once per 20s OR when displacement > 30m.
 *  - Only SUPER_ADMIN + matching email can join the admin room.
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { LocationPingSchema, ActivityChangeSchema, LocationPing } from './schemas';

// ── In-memory write-throttle map ──
interface ThrottleEntry {
  lastSavedAt: number;
  lat: number;
  lng: number;
}

const writeThrottle = new Map<string, ThrottleEntry>();

// ── Haversine distance (meters) ──
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Constants ──
const THROTTLE_MS = 20_000; // 20 seconds
const DISPLACEMENT_THRESHOLD = 30; // meters
const ADMIN_ROOM = 'super-admin-telemetry';

// ── Socket user metadata attached during auth ──
interface SocketUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// ── Online users tracker ──
const onlineUsers = new Map<string, { socketId: string; user: SocketUser; activity: string }>();

let telemetryIo: Server | null = null;

export function broadcastLiveTelemetryPing(data: {
  userId: string;
  name: string;
  email: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  activityContext?: string;
  timestamp: number;
}) {
  if (telemetryIo) {
    telemetryIo.to(ADMIN_ROOM).emit('telemetry:live_ping', data);
  }
}

/**
 * Triggers an instant on-demand location ping on a connected client device.
 * Used when Super-Admin inspects or focuses on a specific user in the Admin Portal.
 */
export function requestClientLocationPing(targetUserId: string): boolean {
  if (!telemetryIo) return false;
  const entry = onlineUsers.get(targetUserId);
  if (entry && entry.socketId) {
    telemetryIo.to(entry.socketId).emit('telemetry:request_immediate_ping', {
      requestedAt: Date.now(),
    });
    return true;
  }
  return false;
}

export function initTelemetrySocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, origin || true),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  telemetryIo = io;

  // ─────────────────────────────────────────────────────
  // JWT Handshake Authentication
  // ─────────────────────────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('AUTH_REQUIRED'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      const userId = decoded?.id || decoded?.userId;
      if (!userId) {
        return next(new Error('INVALID_TOKEN'));
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) {
        return next(new Error('USER_NOT_FOUND'));
      }

      (socket as any).__user = user;
      next();
    } catch (err) {
      next(new Error('INVALID_TOKEN'));
    }
  });

  // ─────────────────────────────────────────────────────
  // Connection Handler
  // ─────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const user: SocketUser = (socket as any).__user;
    console.log(`🔌 Socket connected: ${user.name} (${user.id}) [${user.role}]`);

    // Mark user online
    onlineUsers.set(user.id, { socketId: socket.id, user, activity: 'IDLE' });
    prisma.user
      .update({ where: { id: user.id }, data: { isOnline: true, lastSeenAt: new Date() } })
      .catch(() => {});

    // Notify admin room of connection
    io.to(ADMIN_ROOM).emit('telemetry:user_connected', {
      userId: user.id,
      name: user.name,
      email: user.email,
      timestamp: Date.now(),
    });

    // ── Admin room join ──
    socket.on('admin:join', (_, ack) => {
      if (user.role !== 'SUPER_ADMIN' || user.email !== ENV.SUPER_ADMIN_EMAIL) {
        socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient privileges.' });
        if (typeof ack === 'function') ack({ success: false });
        return;
      }
      socket.join(ADMIN_ROOM);
      console.log(`🔐 Super-Admin ${user.email} joined ${ADMIN_ROOM}`);

      // Send current online roster
      const roster = Array.from(onlineUsers.entries()).map(([uid, entry]) => ({
        userId: uid,
        name: entry.user.name,
        email: entry.user.email,
        activity: entry.activity,
        lastLat: writeThrottle.get(uid)?.lat ?? null,
        lastLng: writeThrottle.get(uid)?.lng ?? null,
      }));
      socket.emit('admin:roster', roster);
      if (typeof ack === 'function') ack({ success: true });
    });

    // ── Admin: request user trail ──
    socket.on('admin:get_trail', async (payload: { userId: string; limit?: number }, ack) => {
      if (user.role !== 'SUPER_ADMIN' || user.email !== ENV.SUPER_ADMIN_EMAIL) {
        if (typeof ack === 'function') ack({ success: false, error: 'FORBIDDEN' });
        return;
      }
      try {
        const logs = await prisma.userLocationLog.findMany({
          where: { userId: payload.userId },
          orderBy: { recordedAt: 'desc' },
          take: payload.limit || 100,
          select: { latitude: true, longitude: true, activityContext: true, recordedAt: true },
        });
        if (typeof ack === 'function') ack({ success: true, trail: logs });
      } catch (err) {
        if (typeof ack === 'function') ack({ success: false, error: 'DB_ERROR' });
      }
    });

    // ── Admin: trigger on-demand live GPS ping for a specific candidate ──
    socket.on('admin:request_ping', (payload: { targetUserId: string }, ack) => {
      if (user.role !== 'SUPER_ADMIN' || user.email !== ENV.SUPER_ADMIN_EMAIL) {
        if (typeof ack === 'function') ack({ success: false, error: 'FORBIDDEN' });
        return;
      }
      const sent = requestClientLocationPing(payload.targetUserId);
      if (typeof ack === 'function') {
        ack({
          success: sent,
          message: sent
            ? 'On-demand location ping dispatched to user device.'
            : 'Candidate device is currently disconnected.',
        });
      }
    });

    // ── Location ping (regular users) ──
    socket.on('telemetry:location_ping', async (raw: unknown) => {
      const parsed = LocationPingSchema.safeParse(raw);
      if (!parsed.success) {
        socket.emit('error', { code: 'VALIDATION', message: parsed.error.issues });
        return;
      }

      const ping: LocationPing = parsed.data;

      // Update online tracker
      const entry = onlineUsers.get(user.id);
      if (entry && ping.activityContext) {
        entry.activity = ping.activityContext;
      }

      // ── Immediately broadcast to admin room (sub-second) ──
      io.to(ADMIN_ROOM).emit('telemetry:live_ping', {
        userId: user.id,
        name: user.name,
        email: user.email,
        latitude: ping.latitude,
        longitude: ping.longitude,
        accuracy: ping.accuracy,
        activityContext: ping.activityContext,
        timestamp: Date.now(),
      });

      // ── Throttled DB write ──
      const now = Date.now();
      const prev = writeThrottle.get(user.id);
      const timeSinceLast = prev ? now - prev.lastSavedAt : Infinity;
      const displacement = prev
        ? haversineMeters(prev.lat, prev.lng, ping.latitude, ping.longitude)
        : Infinity;

      if (timeSinceLast >= THROTTLE_MS || displacement >= DISPLACEMENT_THRESHOLD) {
        writeThrottle.set(user.id, {
          lastSavedAt: now,
          lat: ping.latitude,
          lng: ping.longitude,
        });

        // Fire-and-forget DB writes
        Promise.all([
          prisma.user.update({
            where: { id: user.id },
            data: {
              lastLat: ping.latitude,
              lastLng: ping.longitude,
              lastSeenAt: new Date(),
              isOnline: true,
            },
          }),
          prisma.userLocationLog.create({
            data: {
              userId: user.id,
              latitude: ping.latitude,
              longitude: ping.longitude,
              accuracy: ping.accuracy ?? null,
              activityContext: ping.activityContext ?? 'IDLE',
            },
          }),
        ]).catch((err) => {
          console.error(`⚠️ Telemetry DB write failed for ${user.id}:`, err.message);
        });
      }
    });

    // ── Activity context change ──
    socket.on('telemetry:activity_change', (raw: unknown) => {
      const parsed = ActivityChangeSchema.safeParse(raw);
      if (!parsed.success) return;

      const entry = onlineUsers.get(user.id);
      if (entry) entry.activity = parsed.data.activityContext;

      io.to(ADMIN_ROOM).emit('telemetry:activity_update', {
        userId: user.id,
        activityContext: parsed.data.activityContext,
        timestamp: Date.now(),
      });
    });

    // ── Block regular users from admin events ──
    socket.onAny((event: string) => {
      if (event.startsWith('admin:') && user.role !== 'SUPER_ADMIN') {
        socket.emit('error', {
          code: 'FORBIDDEN',
          message: 'You do not have permission for admin operations.',
        });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      onlineUsers.delete(user.id);
      prisma.user
        .update({
          where: { id: user.id },
          data: { isOnline: false, lastSeenAt: new Date() },
        })
        .catch(() => {});

      io.to(ADMIN_ROOM).emit('telemetry:user_disconnected', {
        userId: user.id,
        timestamp: Date.now(),
      });
      console.log(`🔌 Socket disconnected: ${user.name} (${user.id})`);
    });
  });

  console.log('📡 Telemetry WebSocket layer initialized on existing HTTP server.');
  return io;
}
