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
