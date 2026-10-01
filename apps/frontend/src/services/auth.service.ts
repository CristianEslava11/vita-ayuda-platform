import { requestJson } from './api';
export interface MeResponse { id: string; email: string; fullName: string; roleName: string; isActive: boolean; }
export const authService = {
  login: (email: string, password: string) => requestJson<{ user: MeResponse }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => requestJson<MeResponse>('/auth/me'),
  logout: () => requestJson<{ message: string }>('/auth/logout', { method: 'POST' }),
};
