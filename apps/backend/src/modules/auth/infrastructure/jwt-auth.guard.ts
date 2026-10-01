import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { USER_REPOSITORY, type AuthUser, type UserRepository } from '../domain/user.repository';
export type AuthenticatedRequest = Request & { user: AuthUser };
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, @Inject(USER_REPOSITORY) private readonly users: UserRepository) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = request.cookies?.access_token;
    if (typeof token !== 'string') throw new UnauthorizedException('Inicia sesión para continuar.');
    let subject: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, { algorithms: ['HS256'] });
      if (typeof payload.sub !== 'string') throw new Error('Invalid subject');
      subject = payload.sub;
    } catch { throw new UnauthorizedException('Tu sesión no es válida o ha expirado.'); }
    const user = await this.users.findById(subject);
    if (!user || !user.activo || !user.patientActive || user.roleName !== 'PATIENT') {
      throw new UnauthorizedException('Tu cuenta no tiene acceso.');
    }
    request.user = user;
    return true;
  }
}
