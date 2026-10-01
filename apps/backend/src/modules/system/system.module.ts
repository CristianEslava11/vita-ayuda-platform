import { Module } from '@nestjs/common';
import { SYSTEM_STATUS_PORT } from './domain/system-status.port';
import { GetSystemStatusUseCase } from './application/get-system-status.use-case';
import { EnvironmentStatusAdapter } from './infrastructure/environment-status.adapter';
import { SystemController } from './infrastructure/system.controller';

@Module({
  controllers: [SystemController],
  providers: [
    GetSystemStatusUseCase,
    { provide: SYSTEM_STATUS_PORT, useClass: EnvironmentStatusAdapter },
  ],
})
export class SystemModule {}
