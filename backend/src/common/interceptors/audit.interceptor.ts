import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers, user } = request as Request & { 
      user?: { id: string; email: string };
      ip?: string;
    };

    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutatingMethods.includes(method)) return next.handle();

    const start = Date.now();
    const userAgent = headers['user-agent'] || 'unknown';
    const clientIp = ip || headers['x-forwarded-for'] as string || headers['x-real-ip'] as string || 'unknown';

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${url} by ${user?.email ?? 'anonymous'} ` +
          `[IP: ${clientIp}] [UA: ${userAgent.substring(0, 100)}] [${duration}ms]`,
        );
      }),
    );
  }
}
