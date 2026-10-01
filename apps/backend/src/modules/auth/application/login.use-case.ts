import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, PASSWORD_HASHER, type UserRepository, type PasswordHasher, type AuthUser } from '../domain/user.repository';
import type { LoginDto } from './login.dto';

export function presentUser(user: AuthUser) {
  return { id: user.id, email: user.email, fullName: user.fullName, roleName: user.roleName, isActive: user.activo };
}
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
  ) {}
  async execute(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    const validPassword = await this.passwords.compare(dto.password, user?.passwordHash);
    if (!user || !validPassword || !user.activo || !user.patientActive || user.roleName !== 'PATIENT') {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    return presentUser(user);
  }
}
