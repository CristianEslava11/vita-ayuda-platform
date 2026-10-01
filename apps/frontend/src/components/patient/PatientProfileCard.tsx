import Link from 'next/link';
import { ChevronRightIcon, FileTextIcon, MailIcon, PhoneIcon, UserIcon } from '@/components/ui/icons';
import type { PatientItem } from '@/services/patient-portal.service';
import styles from './PatientProfileCard.module.css';

interface PatientProfileCardProps {
  patient: PatientItem;
  compact?: boolean;
}

export default function PatientProfileCard({ patient, compact = false }: PatientProfileCardProps) {
  const initials = [patient.nombres, patient.apellidos]
    .map(name => name.trim().charAt(0)).join('').toLocaleUpperCase('es-CO') || 'P';
  const details = [
    { label: 'Correo electrónico', value: patient.email, icon: MailIcon },
    { label: 'Documento', value: patient.numeroDocumento, icon: FileTextIcon },
    { label: 'Teléfono', value: patient.telefono, icon: PhoneIcon },
  ];

  return (
    <section className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}><UserIcon size={18} />{compact ? 'Mi Perfil' : 'Datos del paciente'}</h2>
      </div>
      <div className={styles.body}>
        <div className={styles.identity}>
          <span className={styles.avatar} aria-hidden="true">{initials}</span>
          <div className={styles.identityText}>
            <h3 className={styles.name}>{patient.fullName}</h3>
            <span className={styles.role}>Paciente</span>
          </div>
        </div>
        <dl className={styles.details}>
          {details.map(({ label, value, icon: Icon }) => (
            <div className={styles.detail} key={label}>
              <dt className={styles.label}>
                <span className={styles.icon} aria-hidden="true"><Icon size={18} /></span>
                {label}
              </dt>
              <dd className={`${styles.value} ${!value ? styles.emptyValue : ''}`}>{value || 'Sin registrar'}</dd>
            </div>
          ))}
        </dl>
        {compact && <Link className={styles.profileLink} href="/dashboard/patient/profile">Ver mi perfil <ChevronRightIcon size={16} /></Link>}
      </div>
    </section>
  );
}
