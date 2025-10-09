import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '10d',
  },
  mail: {
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    },
    defaults: {
      from: process.env.SMTP_FROM!,
      fromName: process.env.SMTP_FROM_NAME ?? 'Opengig',
    },
  },

  astrology: {
    userId: process.env.ASTROLOGY_API_USER_ID!,
    apiKey: process.env.ASTROLOGY_API_KEY!,
    language: process.env.ASTROLOGY_API_LANG || 'en',
  },
};
