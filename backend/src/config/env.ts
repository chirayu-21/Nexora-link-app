import dotenv from 'dotenv'

dotenv.config({ path: ['.env', '../.env'] })

const requiredEnv = ['DATABASE_URL', 'SESSION_SECRET'] as const

for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`)
}
if ((process.env.NODE_ENV ?? 'development') === 'production') {
  if ((process.env.SESSION_SECRET ?? '').length < 32 || process.env.SESSION_SECRET === 'change-me-in-production') {
    throw new Error('Production SESSION_SECRET must be a unique random value of at least 32 characters.')
  }
  if (process.env.USE_MOCK_DATA === 'true') throw new Error('Mock data mode must be disabled in production.')
}

const appBaseUrls = (process.env.APP_BASE_URL ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  useMockData: process.env.USE_MOCK_DATA === 'true',
  databaseUrl: process.env.DATABASE_URL!,
  sessionSecret: process.env.SESSION_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173,http://localhost:5174',
  corsOrigins: appBaseUrls,
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:4000',
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  redisUrl: process.env.REDIS_URL ?? '',
  objectStorageEndpoint: process.env.OBJECT_STORAGE_ENDPOINT ?? '',
  objectStorageBucket: process.env.OBJECT_STORAGE_BUCKET ?? '',
  objectStorageAccessKey: process.env.OBJECT_STORAGE_ACCESS_KEY ?? '',
  objectStorageSecretKey: process.env.OBJECT_STORAGE_SECRET_KEY ?? '',
  eventSearchApiKey: process.env.EVENT_SEARCH_API_KEY ?? '',
}
