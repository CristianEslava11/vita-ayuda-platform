import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { VitalSignRepository, VitalValue } from '../domain/vital-sign.repository';
const include = { vitalSignType: true } as const;
type VitalRow = Prisma.VitalSignGetPayload<{ include: typeof include }>;
function mapVital(row: VitalRow) {
  return { id: row.id, patientId: row.patientId, vitalSignTypeId: row.vitalSignTypeId, vitalSignTypeName: row.vitalSignType.nombre, valor: Number(row.valor), fechaRegistro: row.fechaRegistro, registradoPor: row.registradoPor };
}
@Injectable()
export class VitalSignPrismaRepository implements VitalSignRepository {
  constructor(private readonly prisma: PrismaService) {}
  listTypes() { return this.prisma.client.vitalSignType.findMany({ orderBy: { nombre: 'asc' } }); }
  async list(patientId: string, limit: number) {
    return (await this.prisma.client.vitalSign.findMany({ where: { patientId }, take: limit, orderBy: [{ fechaRegistro: 'desc' }, { id: 'asc' }], include })).map(mapVital);
  }
  async today(patientId: string, start: Date, end: Date) {
    return (await this.prisma.client.vitalSign.findMany({ where: { patientId, fechaRegistro: { gte: start, lt: end } }, orderBy: { fechaRegistro: 'desc' }, include })).map(mapVital);
  }
  async createEntry(patientId: string, userId: string, values: VitalValue[]) {
    return this.prisma.client.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${patientId}))`;
      const previous = await tx.vitalSign.findFirst({ where: { patientId }, orderBy: { fechaRegistro: 'desc' }, select: { fechaRegistro: true } });
      // A shared, unique timestamp identifies all six readings in this entry.
      const fechaRegistro = new Date(Math.max(Date.now(), (previous?.fechaRegistro.getTime() ?? 0) + 1));
      const created = [];
      for (const value of values) {
        created.push(await tx.vitalSign.create({ data: { ...value, patientId, registradoPor: userId, fechaRegistro }, include }));
      }
      return created.map(mapVital);
    }, { maxWait: 10000, timeout: 15000 });
  }
  async saveToday(patientId: string, userId: string, values: VitalValue[], start: Date, end: Date) {
    return this.prisma.client.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${patientId}))`;
      const now = new Date();
      for (const value of values) {
        const existing = await tx.vitalSign.findFirst({ where: { patientId, vitalSignTypeId: value.vitalSignTypeId, fechaRegistro: { gte: start, lt: end } }, orderBy: { fechaRegistro: 'desc' } });
        if (existing) {
          await tx.vitalSign.update({ where: { id: existing.id }, data: { valor: value.valor, registradoPor: userId } });
        } else {
          await tx.vitalSign.create({ data: { ...value, patientId, registradoPor: userId, fechaRegistro: now } });
        }
      }
      return (await tx.vitalSign.findMany({ where: { patientId, fechaRegistro: { gte: start, lt: end } }, orderBy: { fechaRegistro: 'desc' }, include })).map(mapVital);
    }, { maxWait: 10000, timeout: 15000 });
  }
}
