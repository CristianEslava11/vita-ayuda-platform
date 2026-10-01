import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { USER_REPOSITORY, PASSWORD_HASHER } from './domain/user.repository';
import { LoginUseCase } from './application/login.use-case';
import { UserPrismaRepository } from './infrastructure/user.prisma.repository';
import { BcryptPasswordAdapter } from './infrastructure/password.adapter';
import { AuthController } from './infrastructure/auth.controller';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')?.trim();
        if (!secret || secret.length < 32) throw new Error('Configura JWT_SECRET con al menos 32 caracteres.');
        return {
          secret,
          signOptions: { algorithm: 'HS256' as const, issuer: config.get<string>('JWT_ISSUER') || 'vita-ayuda-backend', audience: config.get<string>('JWT_AUDIENCE') || 'vita-ayuda-frontend' },
          verifyOptions: { issuer: config.get<string>('JWT_ISSUER') || 'vita-ayuda-backend', audience: config.get<string>('JWT_AUDIENCE') || 'vita-ayuda-frontend' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase, JwtAuthGuard,
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordAdapter },
  ],
  exports: [JwtAuthGuard, JwtModule, USER_REPOSITORY],
})
export class AuthModule {}
