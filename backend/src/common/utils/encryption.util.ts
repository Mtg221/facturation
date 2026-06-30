import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Derive key from environment variable
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required for PII encryption');
  }
  // Use scrypt to derive a 32-byte key from the environment key
  return crypto.scryptSync(envKey, 'facturation-salt', KEY_LENGTH);
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted (base64)
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData;
  
  const key = getEncryptionKey();
  const buf = Buffer.from(encryptedData, 'base64');
  
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

// Helper to check if a field is already encrypted (base64 format with proper length)
export function isEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

// Prisma middleware for automatic encryption/decryption of sensitive fields
export const piiEncryptionMiddleware = async (params: any, next: (params: any) => Promise<any>) => {
  const sensitiveFields = ['email', 'telephone1', 'telephone2', 'telephone3', 'adresse', 'ninea', 'rc'];
  
  // Encrypt on create/update
  if (params.action === 'create' || params.action === 'update') {
    const data = params.args.data;
    if (data) {
      for (const field of sensitiveFields) {
        if (data[field] && typeof data[field] === 'string' && !isEncrypted(data[field])) {
          data[field] = encrypt(data[field]);
        }
      }
    }
  }
  
  const result = await next(params);
  
  // Decrypt on find operations
  if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
    if (result && typeof result === 'object') {
      const decryptObject = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        for (const field of sensitiveFields) {
          if (obj[field] && typeof obj[field] === 'string' && isEncrypted(obj[field])) {
            try {
              obj[field] = decrypt(obj[field]);
            } catch {
              // If decryption fails, leave as is (might be unencrypted legacy data)
            }
          }
        }
        
        // Handle nested objects and arrays
        for (const key of Object.keys(obj)) {
          if (obj[key] && typeof obj[key] === 'object') {
            if (Array.isArray(obj[key])) {
              obj[key].forEach(decryptObject);
            } else {
              decryptObject(obj[key]);
            }
          }
        }
      };
      
      if (Array.isArray(result)) {
        result.forEach(decryptObject);
      } else {
        decryptObject(result);
      }
    }
  }
  
  return result;
};