import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientsModule } from '../patients/patients.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VITAL_SIGN_REPOSITORY } from './domain/vital-sign.repository';
import { VitalSignUseCases } from './application/vital-sign.use-cases';
import { VitalSignPrismaRepository } from './infrastructure/vital-sign.prisma.repository';
import { VitalSignController } from './infrastructure/vital-sign.controller';
@Module({
  imports: [AuthModule, PatientsModule, PrismaModule], controllers: [VitalSignController],
  providers: [VitalSignUseCases, { provide: VITAL_SIGN_REPOSITORY, useClass: VitalSignPrismaRepository }],
})
export class MonitoringModule {}
