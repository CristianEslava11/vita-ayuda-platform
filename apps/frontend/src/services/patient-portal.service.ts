import { requestJson } from './api';
export interface PatientItem { id: string; userId: string; nombres: string; apellidos: string; fullName: string; numeroDocumento: string | null; email: string; telefono: string | null; activo: boolean; }
export interface VitalSignItem { id: string; patientId: string; vitalSignTypeId: string; vitalSignTypeName: string; valor: number; fechaRegistro: string; registradoPor: string; }
export interface VitalSignTypeItem { id: string; nombre: string; unidadBase: string; descripcion: string | null; }
export interface TodayDailyMonitoring { hasMonitoringToday: boolean; date: string | null; values: VitalSignItem[]; }
interface DataResponse<T> { data: T; }
export const patientPortalService = {
  async getMonitoringSettings() { return (await requestJson<DataResponse<{ demoEnabled: boolean }>>('/vital-signs/daily-monitoring/settings')).data; },
  async createMonitoringEntry(patientId: string, dto: { values: Array<{ vitalSignTypeId: string; valor: number }> }) {
    return (await requestJson<DataResponse<TodayDailyMonitoring>>(`/vital-signs/daily-monitoring/entries/${patientId}`, { method: 'POST', body: JSON.stringify(dto) })).data;
  },
  async getMyPatient() { return (await requestJson<DataResponse<PatientItem>>('/patients/me')).data; },
  async listVitalSignTypes() { return (await requestJson<DataResponse<VitalSignTypeItem[]>>('/vital-signs/types')).data; },
  async listVitalsByPatient(patientId: string, limit = 120) {
    return (await requestJson<DataResponse<VitalSignItem[]>>(`/vital-signs/patient/${patientId}?limit=${limit}`)).data;
  },
  async getTodayDailyMonitoring(patientId: string) {
    return (await requestJson<DataResponse<TodayDailyMonitoring>>(`/vital-signs/daily-monitoring/today/${patientId}`)).data;
  },
  async saveTodayDailyMonitoring(patientId: string, dto: { values: Array<{ vitalSignTypeId: string; valor: number }> }) {
    return (await requestJson<DataResponse<TodayDailyMonitoring>>(`/vital-signs/daily-monitoring/today/${patientId}`, { method: 'PUT', body: JSON.stringify(dto) })).data;
  },
};
