import { Inject, Injectable } from '@nestjs/common';
import type { SystemStatus } from '@vita-ayuda/shared';
import { SYSTEM_STATUS_PORT, type SystemStatusPort } from '../domain/system-status.port';

@Injectable()
export class GetSystemStatusUseCase {
  constructor(@Inject(SYSTEM_STATUS_PORT) private readonly status: SystemStatusPort) {}
  execute(): SystemStatus {
    return this.status.read();
  }
}
