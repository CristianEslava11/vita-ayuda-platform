import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientInitializationError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'CONNECTION';
    const status = code === 'P2025' ? 404 : code === 'P2002' ? 409 : code === 'P2003' ? 400 : 503;
    response.status(status).json({ statusCode: status, message: status === 503 ? 'No fue posible consultar la base de datos. Intenta de nuevo.' : 'No fue posible completar la operación con esos datos.' });
  }
}
