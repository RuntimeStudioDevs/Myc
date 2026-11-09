import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
  googleSheetsWebhookUrl:
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
    '',
};
