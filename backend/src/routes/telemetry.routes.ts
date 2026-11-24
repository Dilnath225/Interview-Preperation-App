import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';
import { broadcastLiveTelemetryPing } from '../sockets/telemetry';

const router = Router();

/**
 * POST /api/telemetry/ping
 * Enterprise Background & Foreground telemetry ping endpoint.
 * Called by expo-task-manager when app is minimized, locked, or backgrounded.
 */
router.post('/ping', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { latitude, longitude, accuracy, activityContext = 'IDLE', timestamp } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    // Update user presence in DB
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        lastLat: latitude,
        lastLng: longitude,
        isOnline: true,
        lastSeenAt: new Date(timestamp || Date.now()),
      },
      select: { id: true, name: true, email: true },
    });

    // Persist location trail record
    await prisma.userLocationLog.create({
      data: {
        userId,
        latitude,
        longitude,
        accuracy: accuracy != null ? Number(accuracy) : null,
        activityContext: String(activityContext),
        recordedAt: new Date(timestamp || Date.now()),
      },
    });

    // Immediately push live telemetry to Super-Admin Ops map
    broadcastLiveTelemetryPing({
      userId: user.id,
      name: user.name,
      email: user.email,
      latitude,
      longitude,
      accuracy: accuracy != null ? Number(accuracy) : undefined,
      activityContext,
      timestamp: timestamp || Date.now(),
    });

    return res.json({ success: true, timestamp: Date.now() });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
