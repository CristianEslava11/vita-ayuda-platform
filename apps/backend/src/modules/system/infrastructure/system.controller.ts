import { Controller, Get } from '@nestjs/common';
import type { SystemStatus } from '@vita-ayuda/shared';
import { GetSystemStatusUseCase } from '../application/get-system-status.use-case';

@Controller('health')
export class SystemController {
  constructor(private readonly getStatus: GetSystemStatusUseCase) {}
  @Get()
  get(): SystemStatus {
    return this.getStatus.execute();
  }
}
