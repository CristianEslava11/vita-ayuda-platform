const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
process.loadEnvFile(path.join(__dirname, '../.env'));
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const prisma = new PrismaClient();
const api = 'http://localhost:3001/api';
const origin = 'http://localhost:3000';
const accounts = [];
let types;
async function call(endpoint, { cookie, body, method = 'GET', requestOrigin = origin } = {}) {
  return fetch(api + endpoint, { method, headers: { Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
}
before(async () => {
  const role = await prisma.role.findUniqueOrThrow({ where: { nombre: 'PATIENT' } });
  types = await prisma.vitalSignType.findMany();
  assert.equal(types.length, 6);
  for (let index = 0; index < 2; index++) {
    const email = 'integration-' + crypto.randomUUID() + '@vitaayuda.local';
    const password = 'Integration2026!';
    const user = await prisma.user.create({ data: { email, passwordHash: await hash(password, 12), userRoles: { create: { roleId: role.id } }, patient: { create: { nombres: 'Prueba', apellidos: 'Integración' } } }, include: { patient: true } });
    accounts.push({ ...user, password, cookie: '' });
    const login = await call('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(login.status, 200);
    const header = login.headers.get('set-cookie');
    assert.match(header, /HttpOnly/i);
    assert.match(header, /SameSite=Lax/i);
    accounts[index].cookie = header.split(';')[0];
    const payload = await login.json();
    assert.equal(payload.accessToken, undefined);
    assert.equal(payload.user.passwordHash, undefined);
  }
});
after(async () => {
  for (const account of accounts) {
    await prisma.patient.deleteMany({ where: { userId: account.id } });
    await prisma.user.deleteMany({ where: { id: account.id } });
  }
  await prisma.$disconnect();
});
test('sesión, validación, aislamiento y persistencia del monitoreo', async () => {
  const [one, two] = accounts;
  assert.equal((await call('/patients/me')).status, 401);
  assert.equal((await call('/vital-signs/types')).status, 401);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: one.email, password: 'Incorrecta2026!' } })).status, 401);
  const me = await call('/auth/me', { cookie: one.cookie });
  assert.equal((await me.json()).id, one.id);
  const profile = await call('/patients/me', { cookie: one.cookie });
  assert.equal((await profile.json()).data.id, one.patient.id);
  assert.equal((await call('/vital-signs/patient/' + two.patient.id, { cookie: one.cookie })).status, 403);
  const endpoint = '/vital-signs/daily-monitoring/today/' + one.patient.id;
  const values = types.map(type => ({ vitalSignTypeId: type.id, valor: ({ glucose: 120, blood_pressure_systolic: 125, blood_pressure_diastolic: 82, heart_rate: 76, body_weight: 72.5, oxygen_saturation: 96 })[type.nombre] }));
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values }, requestOrigin: 'https://other.example' })).status, 403);
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values, registradoPor: two.id } })).status, 400);
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [] } })).status, 400);
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [values[0], values[0]] } })).status, 400);
  const oxygen = types.find(type => type.nombre === 'oxygen_saturation');
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [{ vitalSignTypeId: oxygen.id, valor: 101 }] } })).status, 400);
  assert.equal((await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [{ vitalSignTypeId: oxygen.id, valor: 95.555 }] } })).status, 400);
  assert.equal((await call('/vital-signs/daily-monitoring/today/' + two.patient.id, { cookie: one.cookie, method: 'PUT', body: { values } })).status, 403);
  const saved = await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values } });
  assert.equal(saved.status, 200);
  const savedData = (await saved.json()).data;
  assert.equal(savedData.values.length, 6);
  assert.ok(savedData.values.every(value => value.registradoPor === one.id));
  const updated = await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: values.map(value => ({ ...value, valor: value.vitalSignTypeId === oxygen.id ? 97 : value.valor })) } });
  assert.equal(updated.status, 200);
  const persisted = (await (await call(endpoint, { cookie: one.cookie })).json()).data;
  assert.equal(persisted.values.length, 6);
  assert.equal(persisted.values.find(value => value.vitalSignTypeId === oxygen.id).valor, 97);
  assert.deepEqual(persisted.values.map(value => value.id).sort(), savedData.values.map(value => value.id).sort());
  const concurrent = await Promise.all([96, 98].map(valor => call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [{ vitalSignTypeId: oxygen.id, valor }] } })));
  assert.ok(concurrent.every(response => response.status === 200));
  assert.equal(await prisma.vitalSign.count({ where: { patientId: one.patient.id } }), 6);
  assert.equal((await call('/vital-signs/patient/' + one.patient.id + '?limit=abc', { cookie: one.cookie })).status, 400);
  const other = await call('/vital-signs/patient/' + two.patient.id, { cookie: two.cookie });
  assert.equal((await other.json()).data.length, 0);
  const demoEndpoint = '/vital-signs/daily-monitoring/entries/' + one.patient.id;
  const settings = await (await call('/vital-signs/daily-monitoring/settings', { cookie: one.cookie })).json();
  if (settings.data.demoEnabled) {
    assert.equal((await call(demoEndpoint, { method: 'POST', body: { values } })).status, 401);
    assert.equal((await call('/vital-signs/daily-monitoring/entries/' + two.patient.id, { cookie: one.cookie, method: 'POST', body: { values } })).status, 403);
    assert.equal((await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values }, requestOrigin: 'https://other.example' })).status, 403);
    assert.equal((await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values: values.slice(0, 5) } })).status, 400);
    assert.equal((await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values, registradoPor: two.id } })).status, 400);
    assert.equal((await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values: values.map(value => ({ ...value, valor: value.vitalSignTypeId === oxygen.id ? 101 : value.valor })) } })).status, 400);
    assert.equal(await prisma.vitalSign.count({ where: { patientId: one.patient.id } }), 6);
    const originalReadings = await prisma.vitalSign.findMany({ where: { patientId: one.patient.id }, orderBy: { id: 'asc' } });
    const entries = [];
    for (const valor of [95, 99]) {
      const response = await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values: values.map(value => ({ ...value, valor: value.vitalSignTypeId === oxygen.id ? valor : value.valor })) } });
      assert.equal(response.status, 201);
      const entry = (await response.json()).data;
      assert.equal(entry.values.length, 6);
      assert.equal(new Set(entry.values.map(value => value.fechaRegistro)).size, 1);
      assert.ok(entry.values.every(value => value.registradoPor === one.id));
      entries.push(entry);
    }
    assert.notEqual(entries[0].date, entries[1].date);
    assert.equal(await prisma.vitalSign.count({ where: { patientId: one.patient.id } }), 18);
    assert.deepEqual(await prisma.vitalSign.findMany({ where: { id: { in: originalReadings.map(value => value.id) } }, orderBy: { id: 'asc' } }), originalReadings);
    const latest = (await (await call(endpoint, { cookie: one.cookie })).json()).data;
    assert.equal(latest.values.length, 6);
    assert.equal(latest.values.find(value => value.vitalSignTypeId === oxygen.id).valor, 99);
    const corrected = await call(endpoint, { cookie: one.cookie, method: 'PUT', body: { values: [{ vitalSignTypeId: oxygen.id, valor: 97 }] } });
    assert.equal(corrected.status, 200);
    assert.equal((await corrected.json()).data.values.length, 6);
    assert.equal(await prisma.vitalSign.count({ where: { patientId: one.patient.id } }), 18);
    assert.equal(Number((await prisma.vitalSign.findUniqueOrThrow({ where: { id: entries[0].values.find(value => value.vitalSignTypeId === oxygen.id).id } })).valor), 95);
    const concurrentEntries = await Promise.all([0, 1].map(() => call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values } })));
    assert.ok(concurrentEntries.every(response => response.status === 201));
    const dates = await Promise.all(concurrentEntries.map(async response => (await response.json()).data.date));
    assert.equal(new Set(dates).size, 2);
    assert.equal(await prisma.vitalSign.count({ where: { patientId: one.patient.id } }), 30);
  } else {
    assert.equal((await call(demoEndpoint, { cookie: one.cookie, method: 'POST', body: { values } })).status, 403);
  }
  await prisma.user.update({ where: { id: one.id }, data: { activo: false } });
  assert.equal((await call('/auth/me', { cookie: one.cookie })).status, 401);
  await prisma.user.update({ where: { id: one.id }, data: { activo: true } });
  const logout = await call('/auth/logout', { cookie: one.cookie, method: 'POST' });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /access_token=;/);
  assert.equal((await call('/auth/me')).status, 401);
});

test('el backend rechaza nuevos registros cuando la demostración está desactivada', async () => {
  const { VitalSignUseCases } = require('../dist/modules/monitoring/application/vital-sign.use-cases');
  const useCases = new VitalSignUseCases({}, {}, { get: () => 'false' });
  await assert.rejects(() => useCases.createDemoEntry('user', 'patient', { values: [] }), error => error.getStatus() === 403);
});
