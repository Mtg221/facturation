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

    // PII Encryption middleware for Client model
    this.$use(async (params, next) => {
      // Only apply to Client model for now
      if (params.model !== 'Client') {
        return next(params);
      }

      // Encrypt on create/update
      if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
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

      // Decrypt on find operations
      if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
        if (result && typeof result === 'object') {
          const decryptObject = (obj: any) => {
            if (!obj || typeof obj !== 'object') return obj;

            for (const field of sensitiveFields) {
              if (obj[field] && typeof obj[field] === 'string' && isEncrypted(obj[field])) {
                try {
                  obj[field] = piiEncryptionMiddleware.decrypt(obj[field]);
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
