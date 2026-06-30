import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur de base de données';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Cette valeur existe déjà';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Enregistrement introuvable';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence vers un enregistrement inexistant';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Violation de contrainte de relation';
        break;
    }

    this.logger.warn(`Prisma error ${exception.code}: ${exception.message}`);

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
