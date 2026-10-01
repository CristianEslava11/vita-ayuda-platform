const path = require('node:path');
process.loadEnvFile(path.join(__dirname, '../.env'));
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const { VITAL_FIELDS } = require('@vita-ayuda/shared');
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.upsert({ where: { nombre: 'PATIENT' }, update: {}, create: { nombre: 'PATIENT', descripcion: 'Paciente de la IPS' } });
  for (const field of VITAL_FIELDS) {
    await prisma.vitalSignType.upsert({ where: { nombre: field.key }, update: { unidadBase: field.unit, descripcion: field.label }, create: { nombre: field.key, unidadBase: field.unit, descripcion: field.label } });
  }
  const email = 'paciente@vitaayuda.local';
  const user = await prisma.user.upsert({ where: { email }, update: {}, create: { email, passwordHash: await hash('Paciente2026!', 12) } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  await prisma.patient.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, nombres: 'Paciente', apellidos: 'Demo' } });
  console.log('Catálogo de seis signos vitales y cuenta de demostración preparados.');
}
main().catch(() => { console.error('No fue posible cargar los datos de demostración. Revisa la conexión a PostgreSQL.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
