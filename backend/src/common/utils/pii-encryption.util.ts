import * as crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Derive encryption key from environment variable
function getEncryptionKey(): Buffer {
  const masterKey = process.env.PII_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('PII_ENCRYPTION_KEY environment variable is required');
  }
  
  // Use scrypt to derive a consistent key from the master key
  // In production, use a proper KDF with a stored salt
  return crypto.scryptSync(masterKey, 'facturation-pii-salt', KEY_LENGTH);
}

// Check if a value appears to be encrypted (base64 with proper length)
export function isEncrypted(value: string): boolean {
  try {
    const buffer = Buffer.from(value, 'base64');
    // Minimum: IV (12) + AuthTag (16) + at least 1 byte ciphertext = 29 bytes
    return buffer.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

export class PiiEncryption {
  private static instance: PiiEncryption;
  private key: Buffer;

  private constructor() {
    this.key = getEncryptionKey();
  }

  static getInstance(): PiiEncryption {
    if (!PiiEncryption.instance) {
      PiiEncryption.instance = new PiiEncryption();
    }
    return PiiEncryption.instance;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Combine IV + AuthTag + Ciphertext
    const combined = Buffer.concat([iv, authTag, ciphertext]);
    return combined.toString('base64');
  }

  decrypt(encryptedData: string): string {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  }
}

// Singleton instance for Prisma middleware
export const piiEncryptionMiddleware = PiiEncryption.getInstance();

// Sensitive fields that should be encrypted
export const sensitiveFields = [
  'email',
  'telephone',
  'telephone1',
  'telephone2', 
  'telephone3',
  'adresse',
  'ville',
  'localisation',
  'ninea',
  'rc',
  'commentaire',
  'notes',
  'conditionsPaiement',
];