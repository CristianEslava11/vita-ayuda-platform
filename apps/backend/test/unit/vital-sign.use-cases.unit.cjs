const { test } = require('node:test');
const assert = require('node:assert/strict');
const { VitalSignUseCases } = require('../../dist/modules/monitoring/application/vital-sign.use-cases');

function createUseCases() {
  const calls = [];
  const vitals = {
    listTypes: async () => [],
    list: async (patientId, limit) => {
      calls.push({ patientId, limit });
      return [];
    },
  };
  const getPatient = { execute: async () => ({ id: 'patient-1' }) };
  const config = { get: () => 'false' };
  return { useCases: new VitalSignUseCases(vitals, getPatient, config), calls };
}

test('consulta las mediciones del paciente autenticado con el límite solicitado', async () => {
  const { useCases, calls } = createUseCases();

  const result = await useCases.list('user-1', 'patient-1', '25');

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [{ patientId: 'patient-1', limit: 25 }]);
});

test('rechaza límites de consulta fuera del rango permitido', async () => {
  const { useCases, calls } = createUseCases();

  await assert.rejects(() => useCases.list('user-1', 'patient-1', '501'), error => error.getStatus() === 400);
  assert.deepEqual(calls, []);
});
