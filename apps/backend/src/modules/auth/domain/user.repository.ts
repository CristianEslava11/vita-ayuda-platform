export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  activo: boolean;
  patientActive: boolean;
  fullName: string;
  roleName: string;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
}
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
export interface PasswordHasher { compare(password: string, hash?: string): Promise<boolean>; }
