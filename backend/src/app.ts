import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middlewares/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import interviewRoutes from './routes/interview.routes';
import codingRoutes from './routes/coding.routes';
import resumeRoutes from './routes/resume.routes';
import chatRoutes from './routes/chat.routes';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

// Security Middlewares
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // Generous limit for real-time interview sessions
  skip: (req: Request) => req.path.includes('gaze-detection'),
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AI Mentor Backend API',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/chat', chatRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
