import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:8081',
  JWT_SECRET: process.env.JWT_SECRET || 'ai_mentor_super_secret_jwt_key_2026_lk',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ML_SERVICE_URL: process.env.ML_SERVICE_URL || 'http://localhost:8001',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || (process.env.SMTP_USER ? `"AI Mentor" <${process.env.SMTP_USER}>` : '"AI Mentor" <no-reply@aimentor.app>'),
};
