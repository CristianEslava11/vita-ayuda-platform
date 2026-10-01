import { Injectable } from '@nestjs/common';
import { compare, hashSync } from 'bcryptjs';
import type { PasswordHasher } from '../domain/user.repository';
const dummyHash = hashSync('unavailable-account-comparison', 12);
@Injectable()
export class BcryptPasswordAdapter implements PasswordHasher {
  compare(password: string, hash?: string): Promise<boolean> {
    return compare(password, hash ?? dummyHash);
  }
}
