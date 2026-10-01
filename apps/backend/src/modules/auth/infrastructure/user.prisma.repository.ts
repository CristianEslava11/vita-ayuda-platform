import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser, UserRepository } from '../domain/user.repository';
const include = { patient: true, userRoles: { include: { role: true } } } as const;
type UserRow = Prisma.UserGetPayload<{ include: typeof include }>;
function mapUser(row: UserRow | null): AuthUser | null {
  if (!row) return null;
  return {
    id: row.id, email: row.email, passwordHash: row.passwordHash, activo: row.activo,
    patientActive: row.patient?.activo ?? false,
    fullName: row.patient ? `${row.patient.nombres} ${row.patient.apellidos}` : row.email,
    roleName: row.userRoles.find(item => item.role.nombre === 'PATIENT')?.role.nombre ?? '',
  };
}
@Injectable()
export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByEmail(email: string) {
    return mapUser(await this.prisma.client.user.findUnique({ where: { email }, include }));
  }
  async findById(id: string) {
    return mapUser(await this.prisma.client.user.findUnique({ where: { id }, include }));
  }
}
