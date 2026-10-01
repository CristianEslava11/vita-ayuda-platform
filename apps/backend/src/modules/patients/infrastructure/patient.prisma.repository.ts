import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { PatientRepository } from '../domain/patient.repository';
@Injectable()
export class PatientPrismaRepository implements PatientRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findByUserId(userId: string) {
    const row = await this.prisma.client.patient.findUnique({ where: { userId }, include: { user: { select: { email: true } } } });
    if (!row) return null;
    const { user, ...patient } = row;
    return { ...patient, email: user.email, fullName: `${row.nombres} ${row.apellidos}` };
  }
}
