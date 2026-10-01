import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import type { Response, CookieOptions } from 'express';
import { LoginDto } from '../application/login.dto';
import { LoginUseCase, presentUser } from '../application/login.use-case';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard';
const cookieOptions: CookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' };
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase, private readonly jwt: JwtService) {}
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.loginUseCase.execute(dto);
    const token = await this.jwt.signAsync({ sub: user.id }, { expiresIn: 86400 });
    response.setHeader('Cache-Control', 'no-store');
    response.cookie('access_token', token, { ...cookieOptions, maxAge: 86400000 });
    return { message: 'Sesión iniciada.', user };
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    return presentUser(request.user);
  }
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', cookieOptions);
    return { message: 'Sesión cerrada.' };
  }
}
