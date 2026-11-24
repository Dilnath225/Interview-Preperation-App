/**
 * Zod validation schemas for all WebSocket telemetry payloads
 */
import { z } from 'zod';

export const LocationPingSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  activityContext: z
    .enum(['IDLE', 'MOCK_INTERVIEW', 'CODING_SANDBOX', 'ATS_SCANNER', 'CAREER_COACH'])
    .optional()
    .default('IDLE'),
  timestamp: z.number().optional(), // Client-side epoch ms
});

export const ActivityChangeSchema = z.object({
  activityContext: z.enum([
    'IDLE',
    'MOCK_INTERVIEW',
    'CODING_SANDBOX',
    'ATS_SCANNER',
    'CAREER_COACH',
  ]),
});

export type LocationPing = z.infer<typeof LocationPingSchema>;
export type ActivityChange = z.infer<typeof ActivityChangeSchema>;
