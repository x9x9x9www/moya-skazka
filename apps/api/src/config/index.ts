import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:4000'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/moya_skazka?schema=public'),

  TELEGRAM_BOT_TOKEN: z.string().default('1234567890:ABCdefGhIJKlmNoPQRstuVWXyz'),
  TELEGRAM_BOT_USERNAME: z.string().default('MoyaSkazkaBot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().default('tg-webhook-secret-token'),
  JWT_SECRET: z.string().default('moya-skazka-super-secure-jwt-secret-key-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  STARS_PRICE_SINGLE_BOOK: z.coerce.number().default(400),
  STARS_PRICE_PACK_5: z.coerce.number().default(1600),
  RUB_REF_SINGLE_BOOK: z.coerce.number().default(199.0),
  RUB_REF_PACK_5: z.coerce.number().default(799.0),

  AI_TEXT_PROVIDER: z.enum(['mock', 'gemini', 'google', 'openai', 'wellflow']).default('google'),
  AI_IMAGE_PROVIDER: z.enum(['mock', 'gemini', 'dalle3', 'wellflow']).default('wellflow'),
  GEMINI_API_KEY: z.string().default(''),
  WELLFLOW_API_URL: z.string().default('https://api.wellflow.dev/v1'),
  WELLFLOW_TEXT_KEY: z.string().default(''),
  WELLFLOW_TEXT_MODEL: z.string().default('gemini-3.8-flash'),
  WELLFLOW_IMAGE_KEY: z.string().default(''),
  WELLFLOW_IMAGE_MODEL: z.string().default('nano-banana-2'),
  AI_MAX_RETRIES: z.coerce.number().default(3),
  AI_TIMEOUT_MS: z.coerce.number().default(60000),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_BUCKET_NAME: z.string().default('moya-skazka-assets'),
  S3_SIGNED_URL_EXPIRES_SECONDS: z.coerce.number().default(3600),

  JOB_WORKER_TYPE: z.enum(['db', 'bullmq']).default('db'),
  JOB_CONCURRENCY: z.coerce.number().default(5),
  JOB_POLL_INTERVAL_MS: z.coerce.number().default(3000),

  ENABLE_AUDIO_MVP: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  ENABLE_ADMIN_DEV_LOGIN: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  ADMIN_SECRET_KEY: z.string().default('admin-secret-access-token-change-in-production'),
});

export const config = ConfigSchema.parse(process.env);
export type Config = z.infer<typeof ConfigSchema>;
