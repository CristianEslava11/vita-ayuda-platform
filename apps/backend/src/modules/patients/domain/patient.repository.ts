export interface PatientEntity {
  id: string; userId: string; nombres: string; apellidos: string; fullName: string;
  numeroDocumento: string | null; fechaNacimiento: Date | null; telefono: string | null;
  email: string; activo: boolean; createdAt: Date; updatedAt: Date;
}
export const PATIENT_REPOSITORY = Symbol('PATIENT_REPOSITORY');
export interface PatientRepository { findByUserId(userId: string): Promise<PatientEntity | null>; }
