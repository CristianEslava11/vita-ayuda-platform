export interface SystemStatus {
  application: string;
  status: 'ok';
  /** Solo indica presencia de DATABASE_URL; no certifica conectividad. */
  database: 'pending' | 'configured';
  timestamp: string;
}

export * from './vital-fields';
