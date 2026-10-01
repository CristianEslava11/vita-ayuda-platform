import type { SystemStatus } from '@vita-ayuda/shared';
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
export async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch { throw new Error('No fue posible conectar con el servidor.'); }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401 && !endpoint.startsWith('/auth/') && typeof window !== 'undefined') window.location.assign('/login');
    throw new Error(Array.isArray(error.message) ? error.message.join(', ') : error.message || 'No fue posible completar la solicitud.');
  }
  return response.json() as Promise<T>;
}
export function getSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
  return requestJson<SystemStatus>('/health', { signal });
}
