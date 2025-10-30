import 'dotenv/config';
export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '10d',
  },
  urls: {
    api: process.env.API_URL || 'http://localhost:3001',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '',
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
  freeAstrology: {
    apiKey: process.env.FREE_ASTROLOGY_API_KEY || '',
  },
  jyotishamAstro: {
    apiKey: process.env.JYOTISHAM_ASTRO_API_KEY || '',
  },
  supermemory: {
    apiKey: process.env.SUPERMEMORY_API_KEY || '',
  },
};
