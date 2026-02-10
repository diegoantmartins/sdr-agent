// src/config/env.ts

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  MONGODB_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  
  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  
  // Chatwoot
  CHATWOOT_URL: z.string().url(),
  CHATWOOT_API_TOKEN: z.string(),
  CHATWOOT_ACCOUNT_ID: z.string(),
  
  // UAZAPI (WhatsApp)
  UAZAPI_KEY: z.string(),
  UAZAPI_URL: z.string().url(),
  UAZAPI_WEBHOOK_SECRET: z.string().optional(),

  // Webhooks
  CHATWOOT_WEBHOOK_SECRET: z.string().optional(),
  
  // Slack
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SLACK_BOT_TOKEN: z.string().optional(),

  // Integration Hub
  CALCOM_API_URL: z.string().url().optional(),
  CALCOM_API_KEY: z.string().optional(),
  GOOGLE_CALENDAR_API_URL: z.string().url().optional(),
  GOOGLE_CALENDAR_TOKEN: z.string().optional(),
  GOOGLE_SHEETS_API_URL: z.string().url().optional(),
  GOOGLE_SHEETS_TOKEN: z.string().optional(),
  META_API_URL: z.string().url().optional(),
  META_API_TOKEN: z.string().optional(),
  RD_STATION_API_URL: z.string().url().optional(),
  RD_STATION_TOKEN: z.string().optional(),
  INTEGRATION_ALLOWED_HOSTS: z.string().optional(), // csv allowlist for generic_http
  INTEGRATION_API_KEYS: z.string().optional(), // csv list of keys authorized for integration execution

  // Security / runtime hardening
  CORS_ALLOWED_ORIGINS: z.string().optional(), // csv: https://a.com,https://b.com
  ENABLE_TEST_ENDPOINTS: z.coerce.boolean().default(false),
  REQUIRE_WEBHOOK_SECRETS: z.coerce.boolean().default(false),
  DB_CONNECT_MAX_ATTEMPTS: z.coerce.number().default(5),
  DB_CONNECT_RETRY_MS: z.coerce.number().default(2000),
  
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Agents Config
  FOLLOW_UP_DELAY_HOURS: z.coerce.number().default(24),
  COLD_STORAGE_DAYS: z.coerce.number().default(7),
  MIN_INTENT_SCORE: z.coerce.number().default(0.7),
});

type Config = z.infer<typeof envSchema>;

export const config: Config = envSchema.parse(process.env);
