export interface AppConfig {
  port: number;
  frontendUrl: string;
  databaseUrl: string;
}

export function loadConfig(): AppConfig {
  const rawPort = process.env.PORT || process.env.BACKEND_PORT || '3001';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT o BACKEND_PORT debe ser un puerto valido.');
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origin = new URL(frontendUrl);
  if (!['http:', 'https:'].includes(origin.protocol)) {
    throw new Error('FRONTEND_URL debe usar HTTP o HTTPS.');
  }
  return { port, frontendUrl: origin.origin, databaseUrl: process.env.DATABASE_URL?.trim() || '' };
}
