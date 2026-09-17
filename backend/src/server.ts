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
    app.listen(PORT, () => {
      console.log(`🚀 AI Mentor Backend running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
