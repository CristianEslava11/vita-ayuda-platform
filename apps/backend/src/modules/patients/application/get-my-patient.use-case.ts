import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PATIENT_REPOSITORY, type PatientRepository } from '../domain/patient.repository';
@Injectable()
export class GetMyPatientUseCase {
  constructor(@Inject(PATIENT_REPOSITORY) private readonly patients: PatientRepository) {}
  async execute(userId: string, expectedPatientId?: string) {
    const patient = await this.patients.findByUserId(userId);
    if (!patient || !patient.activo) throw new NotFoundException('No encontramos tu perfil de paciente.');
    if (expectedPatientId && patient.id !== expectedPatientId) throw new ForbiddenException('No tienes acceso a este paciente.');
    return patient;
  }
}
