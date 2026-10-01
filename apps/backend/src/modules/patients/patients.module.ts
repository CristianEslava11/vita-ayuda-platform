import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PATIENT_REPOSITORY } from './domain/patient.repository';
import { GetMyPatientUseCase } from './application/get-my-patient.use-case';
import { PatientPrismaRepository } from './infrastructure/patient.prisma.repository';
import { PatientController } from './infrastructure/patient.controller';
@Module({
  imports: [AuthModule, PrismaModule], controllers: [PatientController],
  providers: [GetMyPatientUseCase, { provide: PATIENT_REPOSITORY, useClass: PatientPrismaRepository }],
  exports: [GetMyPatientUseCase],
})
export class PatientsModule {}
