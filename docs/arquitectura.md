# Arquitectura de Vita Ayuda

## Monorepo

- apps/frontend: Next.js con App Router, React y TypeScript.
- apps/backend: NestJS con módulos auth, patients, monitoring y system.
- packages/config: configuración del servidor.
- packages/shared: contratos y catálogo de campos.
- packages/database: utilidades de persistencia.
- docs: documentación.
- scripts: configuración del entorno local.

El esquema y las migraciones Prisma están en apps/backend/src/prisma.

## Arquitectura hexagonal

Cada módulo mantiene domain (entidades y puertos), application (casos de uso y DTOs) e infrastructure (controladores y adaptadores). El dominio no depende de Prisma, HTTP o NestJS. NestJS ensambla los puertos y sus implementaciones e inyecta las dependencias de los casos de uso.

- Auth: puerto de usuarios y comparación de contraseñas; adaptadores Prisma y bcrypt; controlador de sesión y guarda JWT.
- Patients: puerto de pacientes, caso de uso de perfil propio y adaptador Prisma.
- Monitoring: puerto de signos vitales, casos de consulta y actualización diaria, controlador y adaptador Prisma.
- System: puerto de estado y adaptador de configuración para GET /api/health.

## Persistencia y acceso

Tablas: users, roles, user_roles, patients, vital_sign_types y vital_signs. Cada paciente está vinculado a una cuenta mediante userId único. Las mediciones conservan paciente, tipo, valor, fecha y usuario autor.

La migración habilita RLS en las seis tablas. El backend se conecta directamente a PostgreSQL con la URI administrativa; sus guardas y casos de uso verifican la sesión, el estado activo y la propiedad del paciente. La API de datos de Supabase permanece desactivada.

El cliente no elige el autor de una medición. El backend lo obtiene del usuario autenticado. Los identificadores de otro paciente son rechazados para lecturas y escrituras.

## Monitoreo diario

La ventana diaria utiliza UTC-5 (America/Bogota). En el modo diario, las correcciones actualizan la última medición de cada tipo del día sin borrar registros anteriores. La escritura se realiza en una transacción con bloqueo por paciente para impedir duplicados ante solicitudes concurrentes.

Con MONITORING_DEMO_MODE=true, la ruta POST /api/vital-signs/daily-monitoring/entries/:patientId permite crear un registro nuevo que contiene las seis mediciones. Cada lote comparte una fecha de registro única; el historial utiliza esa fecha completa para agrupar el lote, incluso si se guarda en el mismo minuto que otro. Las escrituras concurrentes conservan ambos lotes. No se modifica el esquema de datos.

GET /api/vital-signs/daily-monitoring/settings informa al formulario del modo activo. La habilitación se comprueba también en el backend: con el modo desactivado, la creación de lotes independientes responde 403. La consulta del día devuelve la última medición de cada tipo para precargar el formulario; el historial mantiene todos los registros.

Los valores y sus límites de entrada se validan en el backend. Estos límites corresponden a las restricciones del formulario y no constituyen diagnósticos.

## Sesiones

El JWT firmado con HS256 contiene el identificador del usuario y se almacena en una cookie HttpOnly, SameSite=Lax y con vigencia de 24 horas. La cookie usa Secure cuando NODE_ENV es production. No se almacena el JWT en localStorage ni se devuelve en el JSON del login.

Cada consulta protegida verifica la firma, la vigencia, el usuario activo, su rol PATIENT y su perfil activo. El cierre de sesión elimina la cookie del navegador. Los intentos de login están limitados a diez por minuto por IP.

La redirección del dashboard mejora la navegación; la protección de datos se aplica también en la API.

## Alcance

Una IPS piloto y acceso de pacientes. La separación entre múltiples IPS y las funciones clínicas de médicos requieren módulos y controles adicionales.
