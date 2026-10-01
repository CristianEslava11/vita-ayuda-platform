import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VITAL_FIELDS } from '@vita-ayuda/shared';
import { GetMyPatientUseCase } from '../../patients/application/get-my-patient.use-case';
import { VITAL_SIGN_REPOSITORY, type VitalSignEntity, type VitalSignRepository } from '../domain/vital-sign.repository';
import type { SaveDailyMonitoringDto } from './vital-sign.dto';
export function bogotaDay(now = new Date()) {
  const localDate = new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 10);
  const start = new Date(`${localDate}T05:00:00.000Z`);
  return { start, end: new Date(start.getTime() + 86400000) };
}
function latestValues(readings: VitalSignEntity[]) {
  const byType = new Map<string, VitalSignEntity>();
  for (const value of readings) {
    const current = byType.get(value.vitalSignTypeId);
    if (!current || value.fechaRegistro > current.fechaRegistro) byType.set(value.vitalSignTypeId, value);
  }
  return [...byType.values()].sort((a, b) => b.fechaRegistro.getTime() - a.fechaRegistro.getTime());
}
@Injectable()
export class VitalSignUseCases {
  constructor(@Inject(VITAL_SIGN_REPOSITORY) private readonly vitals: VitalSignRepository, private readonly getPatient: GetMyPatientUseCase, private readonly config: ConfigService) {}
  settings() { return { demoEnabled: this.config.get<string>('MONITORING_DEMO_MODE') === 'true' }; }
  listTypes() { return this.vitals.listTypes(); }
  async list(userId: string, patientId: string, limitValue = '120') {
    const patient = await this.getPatient.execute(userId, patientId);
    const limit = Number(limitValue);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new BadRequestException('El limite debe estar entre 1 y 500.');
    return this.vitals.list(patient.id, limit);
  }
  async today(userId: string, patientId: string) {
    const patient = await this.getPatient.execute(userId, patientId);
    const { start, end } = bogotaDay();
    const readings = await this.vitals.today(patient.id, start, end);
    // Preload only the latest value of each type when the demo has multiple entries.
    const values = latestValues(readings);
    return { hasMonitoringToday: values.length > 0, date: values[0]?.fechaRegistro ?? null, values };
  }
  async saveToday(userId: string, patientId: string, dto: SaveDailyMonitoringDto) {
    const patient = await this.getPatient.execute(userId, patientId);
    await this.validateValues(dto);
    const { start, end } = bogotaDay();
    const values = latestValues(await this.vitals.saveToday(patient.id, userId, dto.values, start, end));
    return { hasMonitoringToday: true, date: values[0]?.fechaRegistro ?? null, values };
  }
  async createDemoEntry(userId: string, patientId: string, dto: SaveDailyMonitoringDto) {
    if (!this.settings().demoEnabled) throw new ForbiddenException('El modo demostración está desactivado.');
    const patient = await this.getPatient.execute(userId, patientId);
    if (dto.values.length !== VITAL_FIELDS.length) throw new BadRequestException('Completa las seis mediciones para guardar un nuevo registro.');
    await this.validateValues(dto);
    const values = await this.vitals.createEntry(patient.id, userId, dto.values);
    return { hasMonitoringToday: true, date: values[0]?.fechaRegistro ?? null, values };
  }
  private async validateValues(dto: SaveDailyMonitoringDto) {
    if (new Set(dto.values.map(value => value.vitalSignTypeId)).size !== dto.values.length) throw new BadRequestException('No repitas tipos de signos vitales.');
    const types = await this.vitals.listTypes();
    for (const value of dto.values) {
      const type = types.find(item => item.id === value.vitalSignTypeId);
      const field = VITAL_FIELDS.find(item => item.key === type?.nombre);
      if (!field || value.valor < field.min || value.valor > field.max) {
        throw new BadRequestException(field ? `${field.label}: ingresa un valor entre ${field.min} y ${field.max} ${field.unit}.` : 'Tipo de signo vital no valido.');
      }
    }
  }
}
