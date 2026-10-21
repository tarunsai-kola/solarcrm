import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Derives a consistent 32-byte (256-bit) encryption key
 * from INTEGRATION_ENCRYPTION_KEY or SUPABASE_JWT_SECRET.
 */
function getEncryptionKey(): Buffer {
  if (env.INTEGRATION_ENCRYPTION_KEY) {
    if (env.INTEGRATION_ENCRYPTION_KEY.length === 64) {
      return Buffer.from(env.INTEGRATION_ENCRYPTION_KEY, 'hex');
    }
    return crypto.createHash('sha256').update(env.INTEGRATION_ENCRYPTION_KEY).digest();
  }
  // Fallback to SHA-256 hash of SUPABASE_JWT_SECRET
  return crypto.createHash('sha256').update(env.SUPABASE_JWT_SECRET).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `enc:iv:tag:ciphertext` (base64 encoded parts)
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string produced by `encryptToken`.
 * Gracefully handles unencrypted plaintext for backward compatibility.
 */
export function decryptToken(ciphertext: string): string {
  if (!ciphertext) return '';
  if (!ciphertext.startsWith('enc:')) {
    // Unencrypted legacy token
    return ciphertext;
  }

  const parts = ciphertext.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted token format');
  }

  const [, ivBase64, tagBase64, encryptedBase64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64!, 'base64');
  const authTag = Buffer.from(tagBase64!, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedBase64!, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
