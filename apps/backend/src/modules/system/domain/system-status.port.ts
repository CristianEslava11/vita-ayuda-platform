import type { SystemStatus } from '@vita-ayuda/shared';

export const SYSTEM_STATUS_PORT = Symbol('SYSTEM_STATUS_PORT');
export interface SystemStatusPort {
  read(): SystemStatus;
}
