'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export interface VitalDataPoint {
  id: string;
  vitalSignTypeName: string | null;
  valor: number;
  fechaRegistro: string;
}

interface ChartDataPoint {
  date: string;
  shortDate: string;
  value: number;
}

interface PatientVitalsChartProps {
  vitals: VitalDataPoint[];
  height?: number;
}

function normalizeVitalName(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim();
}

function getLabelAndUnit(vitalName: string): { label: string; unit: string } {
  const normalized = normalizeVitalName(vitalName);

  if (normalized.includes('glucose') || normalized.includes('glucosa')) {
    return { label: 'Glucosa en sangre', unit: 'mg/dL' };
  }
  if (normalized.includes('systolic') || normalized.includes('sistolica')) {
    return { label: 'Presion sistolica', unit: 'mmHg' };
  }
  if (normalized.includes('diastolic') || normalized.includes('diastolica')) {
    return { label: 'Presion diastolica', unit: 'mmHg' };
  }
  if (
    normalized.includes('heart rate') ||
    normalized.includes('frecuencia cardiaca') ||
    normalized.includes('pulso')
  ) {
    return { label: 'Pulso', unit: 'lat/min' };
  }
  if (normalized.includes('weight') || normalized.includes('peso')) {
    return { label: 'Peso corporal', unit: 'kg' };
  }
  if (normalized.includes('oxygen') || normalized.includes('saturacion')) {
    return { label: 'Saturacion O₂', unit: '%' };
  }
  if (normalized.includes('temperature') || normalized.includes('temperatura')) {
    return { label: 'Temperatura', unit: '°C' };
  }

  return { label: vitalName || 'Signo vital', unit: '' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--slate-200)',
        padding: '0.65rem 0.85rem',
        fontSize: '0.82rem',
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0, color: 'var(--slate-500)', fontWeight: 600 }}>{payload[0]?.payload?.date ?? label}</p>
      <p style={{ margin: '0.2rem 0 0', color: 'var(--slate-900)', fontWeight: 800 }}>
        {payload[0].value}
      </p>
    </div>
  );
}

export default function PatientVitalsChart({ vitals, height = 220 }: PatientVitalsChartProps) {
  const { data, label, unit, typeName } = useMemo(() => {
    if (vitals.length === 0) {
      return { data: [] as ChartDataPoint[], label: '', unit: '', typeName: '' };
    }

    // Count frequency of each vital sign type
    const frequency = new Map<string, number>();
    for (const v of vitals) {
      const name = v.vitalSignTypeName ?? 'unknown';
      frequency.set(name, (frequency.get(name) ?? 0) + 1);
    }

    // Pick the most frequent type
    let topName = '';
    let topCount = 0;
    for (const [name, count] of frequency) {
      if (count > topCount) {
        topName = name;
        topCount = count;
      }
    }

    const filtered = vitals
      .filter((v) => v.vitalSignTypeName === topName)
      .sort((a, b) => new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime());

    const presentation = getLabelAndUnit(topName);

    const sameDay = new Set(filtered.map(v => new Date(v.fechaRegistro).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' }))).size === 1;
    const chartData: ChartDataPoint[] = filtered.map((v) => ({
      date: new Date(v.fechaRegistro).toLocaleString('es-CO', { timeZone: 'America/Bogota', second: '2-digit', minute: '2-digit', hour: '2-digit', day: 'numeric', month: 'short' }),
      shortDate: sameDay
        ? new Date(v.fechaRegistro).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : new Date(v.fechaRegistro).toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: '2-digit', month: 'short' }),
      value: v.valor,
    }));

    return {
      data: chartData,
      label: presentation.label,
      unit: presentation.unit,
      typeName: topName,
    };
  }, [vitals]);

  if (data.length === 0) {
    return (
      <p
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'var(--slate-400)',
          fontSize: '0.85rem',
        }}
      >
        No hay registros suficientes para graficar.
      </p>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '0 0.25rem 0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--slate-700)' }}>
          {label}
        </span>
        {unit && (
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate-400)' }}>
            Unidad: {unit}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="var(--slate-100)"
            vertical={false}
          />
          <XAxis
            dataKey="shortDate"
            tick={{ fontSize: 11, fill: 'var(--slate-400)', fontWeight: 600 }}
            axisLine={{ stroke: 'var(--slate-200)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--slate-400)', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--agave-600, #16a34a)"
            strokeWidth={2.5}
            dot={{
              r: 4,
              fill: 'var(--surface, #fff)',
              stroke: 'var(--agave-600, #16a34a)',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: 'var(--agave-600, #16a34a)',
              stroke: 'var(--surface, #fff)',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
