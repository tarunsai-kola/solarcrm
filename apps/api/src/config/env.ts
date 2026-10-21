import dotenv from 'dotenv';
dotenv.config({ override: true });

import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  API_BASE_PATH: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().default('https://ixncpmlhfzeoxxtjyzum.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_JWT_SECRET: z.string().default('super-secret-jwt-token-signing-key-test'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),
  // Integrations & Encryption
  INTEGRATION_ENCRYPTION_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@sunbeam.example'),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️  Some environment variables are missing or invalid:', parsed.error.flatten().fieldErrors);
}

// Fallback to parsed data or schema defaults so serverless function never exits with 500
export const env = parsed.success ? parsed.data : envSchema.parse({});
