import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { loadConfig } from '@vita-ayuda/config';
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin && request.headers.origin !== loadConfig().frontendUrl) {
      throw new ForbiddenException('Origen de solicitud no permitido.');
    }
    return true;
  }
}
