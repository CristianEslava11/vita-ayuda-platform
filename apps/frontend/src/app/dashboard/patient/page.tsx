'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { VITAL_FIELDS } from '@vita-ayuda/shared';
import { useAuth } from '@/contexts/AuthContext';
import { patientPortalService, type PatientItem, type VitalSignItem } from '@/services/patient-portal.service';
import { HeartPulseIcon, ClipboardListIcon, BarChart3Icon, ChevronRightIcon } from '@/components/ui/icons';
import PatientProfileCard from '@/components/patient/PatientProfileCard';
import styles from './patient.module.css';
const PatientVitalsChart = dynamic(() => import('@/components/ui/charts/PatientVitalsChart'), { ssr: false });
export default function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [vitals, setVitals] = useState<VitalSignItem[]>([]);
  const [hasToday, setHasToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        const profile = await patientPortalService.getMyPatient();
        const [history, today] = await Promise.all([patientPortalService.listVitalsByPatient(profile.id), patientPortalService.getTodayDailyMonitoring(profile.id)]);
        if (active) { setPatient(profile); setVitals(history); setHasToday(today.hasMonitoringToday); }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : 'No fue posible cargar el panel.'); }
      finally { if (active) setIsLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user]);
  const latest = vitals[0];
  const field = VITAL_FIELDS.find(item => item.key === latest?.vitalSignTypeName);
  if (isLoading) return <div className={styles.page}><h1 className={styles.pageTitle}>Mi Dashboard</h1><p>Cargando tu información...</p></div>;
  return <div className={styles.page}>
    <h1 className={styles.pageTitle}>Mi Dashboard</h1><p className={styles.pageSubtitle}>Resumen de tu salud y seguimiento diario.</p>
    {error && <div className={styles.noticeError} role="alert">{error}</div>}
    <div className={`${styles.heroBanner} ${styles.heroBannerDefault}`}><div className={styles.heroBannerIcon}><HeartPulseIcon size={24} /></div><div className={styles.heroBannerContent}><h2 className={styles.heroBannerTitle}>{hasToday ? 'Monitoreo de hoy registrado' : 'Recuerda registrar tu monitoreo diario'}</h2><p className={styles.heroBannerDescription}>{hasToday ? 'Consulta tus mediciones y continúa tu seguimiento.' : 'Lleva un seguimiento de tus signos vitales desde tu espacio personal.'}</p><Link className={styles.heroBannerAction} href="/dashboard/patient/monitoring">Ir al monitoreo <ChevronRightIcon size={14} /></Link></div></div>
    <div className={styles.statsGrid}>
      {[{ icon: HeartPulseIcon, value: String(vitals.length), label: 'Mediciones registradas' }, { icon: ClipboardListIcon, value: hasToday ? 'Completado' : 'Pendiente', label: 'Monitoreo de hoy' }, { icon: BarChart3Icon, value: latest ? `${latest.valor} ${field?.unit || ''}` : '--', label: 'Ultimo registro' }].map(item => <div className={styles.statCard} key={item.label}><div className={styles.statIcon}><item.icon size={20} /></div><div className={styles.statInfo}><div className={styles.statValue}>{item.value}</div><div className={styles.statLabel}>{item.label}</div></div></div>)}
    </div>
    <div className={styles.cardsGrid}>
      <section className={styles.card}><div className={styles.cardHeader}><h2 className={styles.cardTitle}>Indicador Vital</h2><span className={styles.cardBadge}>{field?.label || 'Sin datos'}</span></div><div className={styles.cardBody}>
        {!latest ? <p className={styles.alertMessage}>No hay signos vitales registrados.</p> : <div className={styles.gaugeContainer}><div style={{ position: 'relative', width: 140, height: 140 }}><svg className={styles.gaugeSvg} viewBox="0 0 140 140" width="140" height="140" aria-hidden="true"><circle className={styles.gaugeTrack} cx="70" cy="70" r="58" /><circle className={`${styles.gaugeFill} ${styles.gaugeGreen}`} cx="70" cy="70" r="58" strokeDasharray="364.42" strokeDashoffset="91.1" /></svg><div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div className={styles.gaugeCenter}><span className={styles.gaugeCenterValue}>{latest.valor}</span><span className={styles.gaugeCenterUnit}>{field?.unit}</span></div></div></div><span className={styles.gaugeCenterLabel}>{field?.label}</span><span className={styles.gaugeCenterDate}>{new Date(latest.fechaRegistro).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span></div>}
      </div></section>
      <section className={styles.card}><div className={styles.cardHeader}><h2 className={styles.cardTitle}>Tendencia de Signos Vitales</h2><span className={styles.cardBadge}>{vitals.length} mediciones</span></div><div className={styles.cardBody}><div className={styles.chartContainer}><PatientVitalsChart vitals={vitals} height={220} /></div><Link className={styles.heroBannerAction} href="/dashboard/patient/vitals">Consultar historial <ChevronRightIcon size={14} /></Link></div></section>
      {patient && <PatientProfileCard patient={patient} compact />}
    </div>
  </div>;
}
