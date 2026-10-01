'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  patientPortalService,
  type PatientItem,
  type VitalSignItem,
  type VitalSignTypeItem,
} from '@/services/patient-portal.service';
import { PlusIcon, HeartPulseIcon } from '@/components/ui/icons';
import styles from '../patient.module.css';

type VitalKey =
  | 'glucose'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'heart_rate'
  | 'body_weight'
  | 'oxygen_saturation';
type TrendKey = Exclude<VitalKey, 'blood_pressure_diastolic'>;

interface VitalConfig {
  key: VitalKey;
  label: string;
  unit: string;
}

interface SummaryCard {
  key: string;
  label: string;
  value: string;
  unit: string;
  date: Date | null;
  icon: string;
}

interface HistoryGroup {
  groupKey: string;
  label: string;
  items: Array<{ icon: string; label: string; value: string; unit: string }>;
}

interface DiseaseSummarySection {
  key: string;
  title: string;
  cards: SummaryCard[];
}

const VITALS: Record<VitalKey, VitalConfig> = {
  glucose: { key: 'glucose', label: 'Glucosa', unit: 'mg/dL' },
  blood_pressure_systolic: { key: 'blood_pressure_systolic', label: 'Presion sistolica', unit: 'mmHg' },
  blood_pressure_diastolic: { key: 'blood_pressure_diastolic', label: 'Presion diastolica', unit: 'mmHg' },
  heart_rate: { key: 'heart_rate', label: 'Frecuencia cardiaca', unit: 'bpm' },
  body_weight: { key: 'body_weight', label: 'Peso corporal', unit: 'kg' },
  oxygen_saturation: { key: 'oxygen_saturation', label: 'Saturacion de oxigeno', unit: '%' },
};

const VITAL_ICONS: Record<string, string> = {
  glucose: 'G',
  blood_pressure: 'PA',
  blood_pressure_systolic: 'PA',
  blood_pressure_diastolic: 'PA',
  heart_rate: 'FC',
  body_weight: 'KG',
  oxygen_saturation: 'O2',
};

const VITAL_ORDER: VitalKey[] = [
  'glucose',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'heart_rate',
  'body_weight',
  'oxygen_saturation',
];

function getVitalKey(vital: VitalSignItem, typeMap: Map<string, VitalSignTypeItem>): VitalKey | null {
  const name = vital.vitalSignTypeName ?? typeMap.get(vital.vitalSignTypeId)?.nombre ?? '';
  return VITAL_ORDER.includes(name as VitalKey) ? (name as VitalKey) : null;
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'Sin registro';
  return date.toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

function latestByKey(
  vitals: VitalSignItem[],
  typeMap: Map<string, VitalSignTypeItem>,
): Map<VitalKey, VitalSignItem> {
  const latest = new Map<VitalKey, VitalSignItem>();

  for (const vital of vitals) {
    const key = getVitalKey(vital, typeMap);
    if (!key) continue;

    const current = latest.get(key);
    if (!current || new Date(vital.fechaRegistro) > new Date(current.fechaRegistro)) {
      latest.set(key, vital);
    }
  }

  return latest;
}

function buildSummaryCards(
  relevantKeys: VitalKey[],
  latest: Map<VitalKey, VitalSignItem>,
): SummaryCard[] {
  const cards: SummaryCard[] = [];

  if (
    relevantKeys.includes('blood_pressure_systolic') ||
    relevantKeys.includes('blood_pressure_diastolic')
  ) {
    const systolic = latest.get('blood_pressure_systolic');
    const diastolic = latest.get('blood_pressure_diastolic');
    const date = systolic?.fechaRegistro ?? diastolic?.fechaRegistro ?? null;

    cards.push({
      key: 'blood_pressure',
      label: 'Presion arterial',
      value: systolic && diastolic ? `${systolic.valor}/${diastolic.valor}` : '--',
      unit: 'mmHg',
      date: date ? new Date(date) : null,
      icon: VITAL_ICONS.blood_pressure,
    });
  }

  for (const key of relevantKeys) {
    if (key === 'blood_pressure_systolic' || key === 'blood_pressure_diastolic') continue;

    const config = VITALS[key];
    const vital = latest.get(key);
    cards.push({
      key,
      label: config.label,
      value: vital ? String(vital.valor) : '--',
      unit: config.unit,
      date: vital ? new Date(vital.fechaRegistro) : null,
      icon: VITAL_ICONS[key],
    });
  }

  return cards;
}

function buildHistoryGroups(
  vitals: VitalSignItem[],
  relevantKeys: VitalKey[],
  typeMap: Map<string, VitalSignTypeItem>,
): HistoryGroup[] {
  const groups = new Map<string, Map<VitalKey, VitalSignItem>>();

  for (const vital of vitals) {
    const key = getVitalKey(vital, typeMap);
    if (!key || !relevantKeys.includes(key)) continue;

    const groupKey = new Date(vital.fechaRegistro).toISOString();
    const group = groups.get(groupKey) ?? new Map<VitalKey, VitalSignItem>();
    const current = group.get(key);
    if (!current || new Date(vital.fechaRegistro) > new Date(current.fechaRegistro)) {
      group.set(key, vital);
    }
    groups.set(groupKey, group);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([groupKey, group]) => {
      const items: HistoryGroup['items'] = [];
      const systolic = group.get('blood_pressure_systolic');
      const diastolic = group.get('blood_pressure_diastolic');
      const date = new Date(groupKey);

      if (systolic || diastolic) {
        items.push({
          icon: VITAL_ICONS.blood_pressure,
          label: 'Presion arterial',
          value: systolic && diastolic ? `${systolic.valor}/${diastolic.valor}` : '--',
          unit: 'mmHg',
        });
      }

      for (const key of relevantKeys) {
        if (key === 'blood_pressure_systolic' || key === 'blood_pressure_diastolic') continue;
        const vital = group.get(key);
        if (!vital) continue;
        items.push({
          icon: VITAL_ICONS[key],
          label: VITALS[key].label,
          value: String(vital.valor),
          unit: VITALS[key].unit,
        });
      }

      return {
        groupKey,
        label: date.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          day: 'numeric',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        }),
        items,
      };
    });
}

function buildTrendPoints(
  vitals: VitalSignItem[],
  typeMap: Map<string, VitalSignTypeItem>,
  key: VitalKey,
  days: number,
): Array<{ date: Date; value: number }> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return vitals
    .filter((vital) => getVitalKey(vital, typeMap) === key)
    .map((vital) => ({ date: new Date(vital.fechaRegistro), value: vital.valor }))
    .filter((point) => point.date >= since)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function formatShortDate(date: Date): string {
  return date.toLocaleString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function TrendChart({
  points,
  unit,
}: {
  points: Array<{ date: Date; value: number }>;
  unit: string;
}) {
  if (points.length < 2) {
    return <p className={styles.alertMessage}>Se necesitan al menos dos registros para ver tendencia.</p>;
  }

  const width = 720;
  const height = 260;
  const paddingX = 54;
  const paddingY = 34;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  const range = max - min || 1;
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = Math.round((max - ratio * range) * 10) / 10;
    const y = paddingY + ratio * (height - paddingY * 2);
    return { value, y };
  });

  const coords = points.map((point, index) => {
    const x = paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((point.value - min) / range) * (height - paddingY * 2);
    return { x, y, value: point.value, date: point.date };
  });

  const polyline = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const maxIndex = values.indexOf(max);
  const minIndex = values.indexOf(min);
  const labelIndexes = new Set([0, coords.length - 1, maxIndex, minIndex]);

  return (
    <div className={styles.trendPanel}>
      <div className={styles.trendStats}>
        <span>Min <strong>{min}</strong>{unit}</span>
        <span>Prom <strong>{avg}</strong>{unit}</span>
        <span>Max <strong>{max}</strong>{unit}</span>
      </div>
      <svg className={styles.trendChart} viewBox={`0 0 ${width} ${height}`} role="img">
        {gridLines.map((line) => (
          <g key={line.y}>
            <line
              className={styles.trendGridLine}
              x1={paddingX}
              x2={width - paddingX}
              y1={line.y}
              y2={line.y}
            />
            <text className={styles.trendYAxisLabel} x={paddingX - 10} y={line.y + 4}>
              {line.value}
            </text>
          </g>
        ))}
        <line className={styles.trendAxis} x1={paddingX} x2={width - paddingX} y1={height - paddingY} y2={height - paddingY} />
        <polyline className={styles.trendLine} fill="none" points={polyline} />
        {coords.map((point, index) => (
          <g key={`${point.x}-${index}`}>
            <circle className={styles.trendDot} cx={point.x} cy={point.y} r="5">
              <title>{`${point.value}${unit} - ${formatShortDate(point.date)}`}</title>
            </circle>
            {labelIndexes.has(index) && (
              <text className={styles.trendPointLabel} x={point.x} y={point.y - 10}>
                {point.value}
              </text>
            )}
          </g>
        ))}
        <text className={styles.trendXLabel} x={paddingX} y={height - 8}>
          {formatShortDate(coords[0].date)}
        </text>
        <text className={styles.trendXLabel} textAnchor="end" x={width - paddingX} y={height - 8}>
          {formatShortDate(coords[coords.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

export default function PatientVitalsPage() {
  const { user } = useAuth();

  const [patient, setPatient] = useState<PatientItem | null>(null);
  const [types, setTypes] = useState<VitalSignTypeItem[]>([]);
  const [vitals, setVitals] = useState<VitalSignItem[]>([]);
  const [daysRange, setDaysRange] = useState<7 | 30>(7);
  const [selectedTrend, setSelectedTrend] = useState<TrendKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const typeMap = useMemo(() => new Map(types.map((type) => [type.id, type])), [types]);
  const relevantKeys = useMemo(() => VITAL_ORDER, []);
  const latest = useMemo(() => latestByKey(vitals, typeMap), [typeMap, vitals]);
  const summarySections = useMemo(
    () => [{ key: 'all', title: 'Ultimas mediciones', cards: buildSummaryCards(relevantKeys, latest) }],
    [relevantKeys, latest],
  );
  const historyGroups = useMemo(
    () => buildHistoryGroups(vitals, relevantKeys, typeMap),
    [relevantKeys, typeMap, vitals],
  );
  const trendOptions = relevantKeys.filter(
    (key): key is TrendKey => key !== 'blood_pressure_diastolic',
  );
  const activeTrend = selectedTrend && trendOptions.includes(selectedTrend)
    ? selectedTrend
    : trendOptions[0] ?? null;
  const trendPoints = useMemo(
    () => (activeTrend ? buildTrendPoints(vitals, typeMap, activeTrend, daysRange) : []),
    [activeTrend, daysRange, typeMap, vitals],
  );
  const activeTrendConfig = activeTrend ? VITALS[activeTrend] : null;

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

        const [vitalTypes, patientVitals] = await Promise.all([
          patientPortalService.listVitalSignTypes(),
          patientPortalService.listVitalsByPatient(resolvedPatient.id, 120),
        ]);

        if (!cancelled) {
          setPatient(resolvedPatient);
          setTypes(vitalTypes);
          setVitals(patientVitals);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar signos vitales.');
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

  if (isLoading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Mis Signos Vitales</h1>
        <p className={styles.pageSubtitle}>Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>Mis Signos Vitales</h1>
        <p className={styles.pageSubtitle}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.patientPageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mis Signos Vitales</h1>
          <p className={styles.pageSubtitle}>
            Seguimiento personal de salud{patient ? ` de ${patient.fullName}` : ''}.
          </p>
        </div>
        <Link className={styles.primaryLinkButton} href="/dashboard/patient/monitoring">
          <PlusIcon size={16} />
          Registrar monitoreo
        </Link>
      </div>

      {relevantKeys.length > 0 && (
        <>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Resumen actual</h2>
              <span className={styles.cardBadge}>{summarySections.length}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.diseaseSummaryStack}>
                {summarySections.map((section) => (
                  <div className={styles.diseaseSummarySection} key={section.key}>
                    <h3>{section.title}</h3>
                    <div className={styles.vitalSummaryGrid}>
                      {section.cards.map((card) => (
                        <div className={styles.vitalSummaryCard} key={`${section.key}-${card.key}`}>
                          <span className={styles.vitalSummaryIcon}>{card.icon}</span>
                          <span className={styles.vitalSummaryLabel}>{card.label}</span>
                          <strong className={styles.vitalSummaryValue}>
                            {card.value}
                            <span>{card.unit}</span>
                          </strong>
                          <small>{formatDateTime(card.date)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Evolucion</h2>
              <div className={styles.segmentedControl}>
                <button
                  className={daysRange === 7 ? styles.segmentActive : ''}
                  onClick={() => setDaysRange(7)}
                  type="button"
                >
                  7 dias
                </button>
                <button
                  className={daysRange === 30 ? styles.segmentActive : ''}
                  onClick={() => setDaysRange(30)}
                  type="button"
                >
                  30 dias
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              {activeTrend ? (
                <>
                  <div className={styles.trendToolbar}>
                    <div>
                      <strong>{activeTrendConfig?.label}</strong>
                      <span>{trendPoints.length} registros en el periodo</span>
                    </div>
                    <div className={styles.trendSelector}>
                      {trendOptions.map((key) => (
                        <button
                          className={activeTrend === key ? styles.trendOptionActive : ''}
                          key={key}
                          onClick={() => setSelectedTrend(key)}
                          type="button"
                        >
                          {VITALS[key].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <TrendChart points={trendPoints} unit={activeTrendConfig?.unit ?? ''} />
                </>
              ) : (
                <p className={styles.alertMessage}>No hay signos configurados para graficar.</p>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Historial de registros</h2>
              <span className={styles.cardBadge}>{historyGroups.length}</span>
            </div>
            <div className={styles.cardBody}>
              {historyGroups.length === 0 && (
                <p className={styles.alertMessage}>No hay monitoreos diarios registrados.</p>
              )}
              <div className={styles.monitoringTimeline}>
                {historyGroups.map((group) => (
                  <div className={styles.clinicalTimelineItem} key={group.groupKey}>
                    <div className={styles.timelineMarker} />
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineVitals}>
                        {group.items.map((item) => (
                          <div className={styles.timelineVital} key={`${group.groupKey}-${item.label}`}>
                            <span className={styles.timelineVitalIcon}>{item.icon}</span>
                            <span>
                              <strong>{item.label}</strong>
                              {' - '}
                              {item.value} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      <time>{group.label}</time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
