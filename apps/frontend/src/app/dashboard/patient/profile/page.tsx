'use client';
import { useEffect, useState } from 'react';
import { patientPortalService, type PatientItem } from '@/services/patient-portal.service';
import PatientProfileCard from '@/components/patient/PatientProfileCard';
import styles from '../patient.module.css';
export default function PatientProfile() {
  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; patientPortalService.getMyPatient().then(data => { if (active) setPatient(data); }).catch(err => { if (active) setError(err.message); }); return () => { active = false; }; }, []);
  return <div className={styles.page}><h1 className={styles.pageTitle}>Mi Perfil</h1><p className={styles.pageSubtitle}>Información de tu cuenta y tu perfil de paciente.</p>
    {error && <div className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</div>}
    <div className={styles.profileSection}>
      {patient ? <PatientProfileCard patient={patient} /> : !error && <p role="status">Cargando perfil...</p>}
    </div></div>;
}
