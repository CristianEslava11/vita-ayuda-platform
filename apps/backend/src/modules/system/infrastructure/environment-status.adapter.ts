import { Injectable } from '@nestjs/common';
import { loadConfig } from '@vita-ayuda/config';
import type { SystemStatus } from '@vita-ayuda/shared';
import type { SystemStatusPort } from '../domain/system-status.port';

@Injectable()
export class EnvironmentStatusAdapter implements SystemStatusPort {
  read(): SystemStatus {
    return {
      application: 'Vita Ayuda',
      status: 'ok',
      database: loadConfig().databaseUrl ? 'configured' : 'pending',
      timestamp: new Date().toISOString(),
    };
  }
}
