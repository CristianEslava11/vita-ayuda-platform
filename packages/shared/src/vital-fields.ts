export const VITAL_FIELDS = [
  { key: 'glucose', label: 'Glucosa', unit: 'mg/dL', min: 20, max: 600 },
  { key: 'blood_pressure_systolic', label: 'Presion sistolica', unit: 'mmHg', min: 60, max: 250 },
  { key: 'blood_pressure_diastolic', label: 'Presion diastolica', unit: 'mmHg', min: 30, max: 160 },
  { key: 'heart_rate', label: 'Frecuencia cardiaca', unit: 'bpm', min: 30, max: 220 },
  { key: 'body_weight', label: 'Peso corporal', unit: 'kg', min: 20, max: 250 },
  { key: 'oxygen_saturation', label: 'Saturacion de oxigeno', unit: '%', min: 50, max: 100 },
] as const;
