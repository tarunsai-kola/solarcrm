import dotenv from 'dotenv';
dotenv.config({ override: true });

export interface AppEnv {
  PORT: number;
  NODE_ENV: 'development' | 'test' | 'production';
  API_BASE_PATH: string;
  CORS_ORIGIN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
  INTEGRATION_ENCRYPTION_KEY?: string | undefined;
  GOOGLE_CLIENT_ID?: string | undefined;
  GOOGLE_CLIENT_SECRET?: string | undefined;
  GOOGLE_REDIRECT_URI?: string | undefined;
  SMTP_HOST?: string | undefined;
  SMTP_PORT: number;
  SMTP_USER?: string | undefined;
  SMTP_PASS?: string | undefined;
  EMAIL_FROM: string;
  WHATSAPP_API_TOKEN?: string | undefined;
  WHATSAPP_PHONE_NUMBER_ID?: string | undefined;
}

const nodeEnv = process.env.NODE_ENV;
const validNodeEnv = nodeEnv === 'development' || nodeEnv === 'test' || nodeEnv === 'production'
  ? nodeEnv
  : 'production';

export const env: AppEnv = {
  PORT: Number(process.env.PORT) || 3001,
  NODE_ENV: validNodeEnv,
  API_BASE_PATH: process.env.API_BASE_PATH || '/api/v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://ixncpmlhfzeoxxtjyzum.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4bmNwbWxoZnplb3h4dGp5enVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjQ5NTgwMSwiZXhwIjoyMTA4MDcxODAxfQ.Lp91cSi6eluUNIyZPCq3rTaOVNVwgLN_ObneFYVT0wY',
  SUPABASE_JWT_SECRET:
    process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-signing-key-test',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  INTEGRATION_ENCRYPTION_KEY: process.env.INTEGRATION_ENCRYPTION_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@sunbeam.example',
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
};
