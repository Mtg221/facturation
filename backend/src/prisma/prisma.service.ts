import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { piiEncryptionMiddleware, sensitiveFields, isEncrypted } from '../common/utils/pii-encryption.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    
    // Soft-delete middleware: automatically filter out deleted records
    this.$use(async (params, next) => {
      const modelsWithSoftDelete = ['User', 'Client', 'SecteursActivite', 'Produit', 'Facture'];

      if (modelsWithSoftDelete.includes(params.model ?? '')) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
          params.args = params.args ?? {};
          params.args.where = { ...params.args.where, deletedAt: null };
        }
      }

      return next(params);
    });

    // PII Encryption middleware.
    // - Encryption at rest applies to the Client model only.
    // - Decryption runs on ALL find results and walks nested relations, so
    //   Client PII loaded indirectly (e.g. facture.include.client, paiement
    //   .include.facture.client) is decrypted too — not just direct Client
    //   queries. Without this, relations show raw ciphertext (invoice PDF).
    this.$use(async (params, next) => {
      // Encrypt on create/update — Client model only
      if (
        params.model === 'Client' &&
        (params.action === 'create' || params.action === 'update' || params.action === 'upsert')
      ) {
        const data = params.args.data;
        if (data) {
          for (const field of sensitiveFields) {
            if (data[field] && typeof data[field] === 'string' && !isEncrypted(data[field])) {
              data[field] = piiEncryptionMiddleware.encrypt(data[field]);
            }
          }
        }
      }

      const result = await next(params);

      // Decrypt on any find operation, traversing nested objects/arrays
      if (typeof params.action === 'string' && params.action.startsWith('find') && result && typeof result === 'object') {
        const seen = new Set<unknown>();
        const decryptObject = (obj: any) => {
          if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
          seen.add(obj);

          for (const field of sensitiveFields) {
            if (obj[field] && typeof obj[field] === 'string' && isEncrypted(obj[field])) {
              try {
                obj[field] = piiEncryptionMiddleware.decrypt(obj[field]);
              } catch {
                // Not actually encrypted (plaintext on another model, or legacy) — leave as is
              }
            }
          }

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

      return result;
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async softDelete(model: string, id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any)[this.camelCase(model)].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private camelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
