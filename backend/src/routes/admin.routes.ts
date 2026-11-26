/**
 * Admin API Routes — Super-Admin authentication & data endpoints
 * Used by the admin-portal for login and REST-based data retrieval.
 */
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { broadcastLiveTelemetryPing, requestClientLocationPing } from '../sockets/telemetry';

const router = Router();

// ── Super-Admin login ──
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    // Must match SUPER_ADMIN_EMAIL
    if (email !== ENV.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
});

// ── Super-Admin guard middleware ──
const superAdminGuard = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const dbUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true, email: true },
  });

  if (!dbUser || dbUser.role !== 'SUPER_ADMIN' || dbUser.email !== ENV.SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }
  next();
};

// ── Get all users with presence data ──
router.get('/users', authenticate, superAdminGuard as any, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        targetRole: true,
        readinessScore: true,
        isOnline: true,
        lastLat: true,
        lastLng: true,
        lastCity: true,
        lastCountry: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    return res.json({ success: true, data: { users } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get location trail for a specific user ──
router.get(
  '/users/:userId/trail',
  authenticate,
  superAdminGuard as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const limit = parseInt(req.query.limit as string) || 200;

      const logs = await prisma.userLocationLog.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      });
      return res.json({ success: true, data: { trail: logs } });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── Trigger on-demand live GPS ping for a specific user ──
router.post(
  '/users/:userId/request-ping',
  authenticate,
  superAdminGuard as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const sent = requestClientLocationPing(userId);
      return res.json({
        success: true,
        sent,
        message: sent
          ? 'On-demand location ping dispatched to device.'
          : 'User device is currently offline or disconnected.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── Dashboard stats ──
router.get('/stats', authenticate, superAdminGuard as any, async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, onlineUsers, totalInterviews, totalApplications] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isOnline: true } }),
      prisma.interviewSession.count(),
      prisma.jobApplication.count(),
    ]);

    return res.json({
      success: true,
      data: { totalUsers, onlineUsers, totalInterviews, totalApplications },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ── Simulate / inject live location ping for a user (for verification & testing) ──
router.post(
  '/users/:userId/simulate-location',
  authenticate,
  superAdminGuard as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const {
        latitude = 6.9271 + (Math.random() - 0.5) * 0.05,
        longitude = 79.8612 + (Math.random() - 0.5) * 0.05,
        city = 'Colombo',
        country = 'Sri Lanka',
        activityContext = 'MOCK_INTERVIEW',
      } = req.body || {};

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          lastLat: latitude,
          lastLng: longitude,
          lastCity: city,
          lastCountry: country,
          isOnline: true,
          lastSeenAt: new Date(),
        },
      });

      const log = await prisma.userLocationLog.create({
        data: {
          userId,
          latitude,
          longitude,
          accuracy: 12,
          activityContext,
        },
      });

      broadcastLiveTelemetryPing({
        userId: user.id,
        name: user.name,
        email: user.email,
        latitude,
        longitude,
        accuracy: 12,
        activityContext,
        timestamp: Date.now(),
      });

      return res.json({
        success: true,
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          latitude,
          longitude,
          activityContext,
          city,
          country,
          logId: log.id,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
