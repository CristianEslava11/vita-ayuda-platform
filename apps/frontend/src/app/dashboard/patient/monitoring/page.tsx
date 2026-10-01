'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  patientPortalService,
  type PatientItem,
  type TodayDailyMonitoring,
  type VitalSignItem,
  type VitalSignTypeItem,
} from '@/services/patient-portal.service';
import styles from '../patient.module.css';
import { PlusIcon } from '@/components/ui/icons';

type FieldKey =
  | 'glucose'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'heart_rate'
  | 'body_weight'
  | 'oxygen_saturation';

interface VitalField {
  key: FieldKey;
  label: string;
  unit: string;
  inputMode: 'numeric' | 'decimal';
  placeholder: string;
  min: number;
  max: number;
}

const FIELD_CATALOG: Record<FieldKey, VitalField> = {
  glucose: {
    key: 'glucose',
    label: 'Glucosa',
    unit: 'mg/dL',
    inputMode: 'decimal',
    placeholder: 'Ej. 132',
    min: 20,
    max: 600,
  },
  blood_pressure_systolic: {
    key: 'blood_pressure_systolic',
    label: 'Presion sistolica',
    unit: 'mmHg',
    inputMode: 'numeric',
    placeholder: 'Ej. 125',
    min: 60,
    max: 250,
  },
  blood_pressure_diastolic: {
    key: 'blood_pressure_diastolic',
    label: 'Presion diastolica',
    unit: 'mmHg',
    inputMode: 'numeric',
    placeholder: 'Ej. 82',
    min: 30,
    max: 160,
  },
  heart_rate: {
    key: 'heart_rate',
    label: 'Frecuencia cardiaca',
    unit: 'bpm',
    inputMode: 'numeric',
    placeholder: 'Ej. 76',
    min: 30,
    max: 220,
  },
  body_weight: {
    key: 'body_weight',
    label: 'Peso corporal',
    unit: 'kg',
    inputMode: 'decimal',
    placeholder: 'Ej. 72.5',
    min: 20,
    max: 250,
  },
  oxygen_saturation: {
    key: 'oxygen_saturation',
    label: 'Saturacion de oxigeno',
    unit: '%',
    inputMode: 'numeric',
    placeholder: 'Ej. 96',
    min: 50,
    max: 100,
  },
};

const FIELD_ORDER: FieldKey[] = [
  'glucose',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'body_weight',
  'oxygen_saturation',
];

function getTypeIdByName(types: VitalSignTypeItem[], field: VitalField): string | null {
  return types.find((type) => type.nombre === field.key)?.id ?? null;
}

function getVitalLabel(vital: VitalSignItem): string {
  const key = vital.vitalSignTypeName as FieldKey | null;
  return key && FIELD_CATALOG[key] ? FIELD_CATALOG[key].label : 'Signo vital';
}

function buildTodayValues(
  monitoring: TodayDailyMonitoring,
  types: VitalSignTypeItem[],
): Record<string, string> {
  const typeMap = new Map(types.map((type) => [type.id, type.nombre]));

  return monitoring.values.reduce<Record<string, string>>((acc, vital) => {
    const key = vital.vitalSignTypeName ?? typeMap.get(vital.vitalSignTypeId);
    if (key && acc[key] === undefined) {
      acc[key] = String(vital.valor);
    }
    return acc;
  }, {});
}

function formatMonitoringTime(value: string | null | undefined): string {
  if (!value) return 'hoy';
  return new Date(value).toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function PatientMonitoringPage() {
  const { user } = useAuth();

  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [types, setTypes] = useState<VitalSignTypeItem[]>([]);
  const [recentVitals, setRecentVitals] = useState<VitalSignItem[]>([]);
  const [todayMonitoring, setTodayMonitoring] = useState<TodayDailyMonitoring | null>(null);
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fields = useMemo(() => FIELD_ORDER.map(key => FIELD_CATALOG[key]), []);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const resolvedPatient = await patientPortalService.getMyPatient();
        if (!resolvedPatient) {
          throw new Error('No encontramos tu perfil de paciente vinculado a este usuario.');
        }

        const [vitalTypes, vitals, today, settings] = await Promise.all([
          patientPortalService.listVitalSignTypes(),
          patientPortalService.listVitalsByPatient(resolvedPatient.id, 12),
          patientPortalService.getTodayDailyMonitoring(resolvedPatient.id),
          patientPortalService.getMonitoringSettings(),
        ]);

        if (!cancelled) {
          setPatient(resolvedPatient);
          setTypes(vitalTypes);
          setRecentVitals(vitals);
          setTodayMonitoring(today);
          setDemoEnabled(settings.demoEnabled);
          if (today.hasMonitoringToday) {
            setValues(buildTodayValues(today, vitalTypes));
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar monitoreo.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patient || !user?.id) return;

    const missingField = fields.find((field) => !values[field.key]?.trim());
    if (missingField) {
      setError(`Ingresa el valor de ${missingField.label}.`);
      setMessage(null);
      return;
    }

    const invalidField = fields.find((field) => !Number.isFinite(Number(values[field.key])));
    if (invalidField) {
      setError(`El valor de ${invalidField.label} no es valido.`);
      setMessage(null);
      return;
    }

    const outOfRangeField = fields.find((field) => {
      const value = Number(values[field.key]);
      return value < field.min || value > field.max;
    });
    if (outOfRangeField) {
      setError(
        `${outOfRangeField.label} debe estar entre ${outOfRangeField.min} y ${outOfRangeField.max} ${outOfRangeField.unit}.`,
      );
      setMessage(null);
      return;
    }

    const missingType = fields.find((field) => !getTypeIdByName(types, field));
    if (missingType) {
      setError(`No existe el tipo de signo vital: ${missingType.label}.`);
      setMessage(null);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        values: fields.map((field) => ({
          vitalSignTypeId: getTypeIdByName(types, field) as string,
          valor: Number(values[field.key]),
        })),
      };
      const savedToday = demoEnabled
        ? await patientPortalService.createMonitoringEntry(patient.id, payload)
        : await patientPortalService.saveTodayDailyMonitoring(patient.id, payload);

      const vitals = await patientPortalService.listVitalsByPatient(patient.id, 12);
      setRecentVitals(vitals);
      setTodayMonitoring(savedToday);
      setValues(buildTodayValues(savedToday, types));
      setMessage(
        demoEnabled
          ? 'Nuevo registro agregado. Cambia los valores y guarda otro para comparar su evolución.'
          : todayMonitoring?.hasMonitoringToday
          ? 'Monitoreo de hoy actualizado.'
          : 'Monitoreo diario registrado.',
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar el monitoreo.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Monitoreo Diario</h1>
        <p className={styles.pageSubtitle}>Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Monitoreo Diario</h1>
      <p className={styles.pageSubtitle}>
        {demoEnabled ? 'Registra varias mediciones para comparar su evolución.' : 'Registra o corrige tus signos vitales del dia.'}
      </p>

      {error && <div role="alert" className={`${styles.notice} ${styles.noticeError}`}>{error}</div>}
      {message && <div role="status" className={`${styles.notice} ${styles.noticeSuccess}`}>
        {message}
        <div><Link className={styles.heroBannerAction} href="/dashboard/patient/vitals">Ver evolución e historial</Link></div>
      </div>}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{demoEnabled ? 'Nuevo registro' : 'Registro de hoy'}</h2>
          <span className={styles.cardBadge}>
            {demoEnabled ? 'Modo demostración' : todayMonitoring?.hasMonitoringToday ? 'Registrado hoy' : `${fields.length} campos`}
          </span>
        </div>
        <div className={styles.cardBody}>
          {demoEnabled && <div className={`${styles.notice} ${styles.noticeSuccess}`}>
            Cada guardado crea un registro independiente. Las mediciones anteriores se conservan en el historial.
          </div>}
          {!demoEnabled && todayMonitoring?.hasMonitoringToday && (
            <div className={`${styles.notice} ${styles.noticeSuccess}`}>
              Ya registraste tu monitoreo de hoy a las {formatMonitoringTime(todayMonitoring.date)}.
              Puedes revisar o corregir los valores antes de finalizar el dia.
            </div>
          )}

          {fields.length > 0 && (
            <form className={styles.monitoringForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                {fields.map((field) => (
                  <label className={styles.fieldGroup} key={field.key}>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <span className={styles.inputWithUnit}>
                      <input
                        className={styles.fieldInput}
                        inputMode={field.inputMode}
                        min={field.min}
                        max={field.max}
                        step="any"
                        type="number"
                        required
                        placeholder={field.placeholder}
                        value={values[field.key] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [field.key]: event.target.value,
                          }))
                        }
                      />
                      <span className={styles.inputUnit}>{field.unit}</span>
                    </span>
                    <span className={styles.fieldHint}>
                      Rango permitido: {field.min} - {field.max} {field.unit}
                    </span>
                  </label>
                ))}
              </div>

              <button className={styles.primaryButton} disabled={isSaving} type="submit">
                {isSaving
                  ? 'Guardando...'
                  : demoEnabled
                    ? 'Guardar nuevo registro'
                    : todayMonitoring?.hasMonitoringToday
                    ? 'Actualizar monitoreo de hoy'
                    : 'Guardar monitoreo'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Ultimos registros</h2>
          <span className={styles.cardBadge}>{recentVitals.length}</span>
        </div>
        <div className={styles.cardBody}>
          {recentVitals.length === 0 && (
            <p className={styles.alertMessage}>No hay signos vitales registrados.</p>
          )}
          {recentVitals.slice(0, 6).map((vital) => (
            <div className={styles.vitalItem} key={vital.id}>
              <div className={styles.vitalLeft}>
                <span className={styles.vitalIcon}><PlusIcon size={16} /></span>
                <span className={styles.vitalName}>{getVitalLabel(vital)}</span>
              </div>
              <div className={styles.vitalRight}>
                <span className={styles.vitalValue}>{vital.valor}</span>
                <span className={styles.vitalUnit}>
                  {types.find((type) => type.id === vital.vitalSignTypeId)?.unidadBase || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
