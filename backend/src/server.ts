import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';
import { CodingService } from './services/coding.service';

import { AuthService } from './services/auth.service';

const PORT = parseInt(ENV.PORT, 10) || 5000;

async function startServer() {
  try {
    // 1. Connect to Database
    await prisma.$connect();
    console.log('✅ Connected to SQLite database via Prisma ORM.');

    // 2. Seed initial data
    await AuthService.seedDemoUser();
    await CodingService.seedInitialChallenges();
    console.log('✅ Initial coding challenges bank verified.');

    // 3. Start Express HTTP Server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AI Mentor Backend running on http://0.0.0.0:${PORT}`);
      console.log(`📡 Health Check: http://0.0.0.0:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
