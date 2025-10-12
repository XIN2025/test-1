import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),

  jwt: {
    secret: process.env.JWT_SECRET || 'supersecret', // fallback for dev
    expiresIn: process.env.JWT_EXPIRES_IN ?? '10d',
  },

  urls: {
    api: process.env.API_URL || 'http://localhost:3001/api',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  mail: {
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    },
    defaults: {
      from: process.env.SMTP_FROM || 'noreply@karmi.ai',
      fromName: process.env.SMTP_FROM_NAME ?? 'Karmi',
    },
  },

  astrology: {
    userId: process.env.ASTROLOGY_API_USER_ID || '',
    apiKey: process.env.ASTROLOGY_API_KEY || '',
    language: process.env.ASTROLOGY_API_LANG || 'en',
  },
};
