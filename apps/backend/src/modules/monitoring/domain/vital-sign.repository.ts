export interface VitalSignEntity {
  id: string; patientId: string; vitalSignTypeId: string; vitalSignTypeName: string;
  valor: number; fechaRegistro: Date; registradoPor: string;
}
export interface VitalSignTypeEntity { id: string; nombre: string; unidadBase: string; descripcion: string | null; }
export interface VitalValue { vitalSignTypeId: string; valor: number; }
export const VITAL_SIGN_REPOSITORY = Symbol('VITAL_SIGN_REPOSITORY');
export interface VitalSignRepository {
  listTypes(): Promise<VitalSignTypeEntity[]>;
  list(patientId: string, limit: number): Promise<VitalSignEntity[]>;
  today(patientId: string, start: Date, end: Date): Promise<VitalSignEntity[]>;
  createEntry(patientId: string, userId: string, values: VitalValue[]): Promise<VitalSignEntity[]>;
  saveToday(patientId: string, userId: string, values: VitalValue[], start: Date, end: Date): Promise<VitalSignEntity[]>;
}
