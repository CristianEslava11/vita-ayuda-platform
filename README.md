# Vita Ayuda

Plataforma de seguimiento y monitoreo de pacientes para una IPS piloto.

## Funciones disponibles

- Inicio y cierre de sesión mediante cookie HttpOnly y JWT con duración de 24 horas.
- Contraseñas protegidas con hash bcrypt.
- Perfil del paciente vinculado a su cuenta mediante userId.
- Dashboard del paciente, formulario de monitoreo diario e historial de mediciones con gráficas.
- Registro y corrección de las seis mediciones del día, con fecha del día calculada en America/Bogota.
- Modo de demostración opcional para guardar varios registros completos en el mismo día y compararlos en la evolución y el historial.
- Validación de datos y comprobación de propiedad del paciente en el backend.
- Limitación de intentos de login y comprobación del origen de solicitudes que modifican datos.

Los módulos de citas, médicos, enfermedades, alertas y chat se incorporarán en entregas posteriores.

## Requisitos y ejecución

Node.js 22 o superior, npm, Git y un proyecto PostgreSQL en Supabase.

Desde la raíz:

```powershell
npm install
npm run setup:env
```

Configura DATABASE_URL en apps/backend/.env siguiendo [la guía de Supabase](docs/supabase.md). setup:env genera un JWT_SECRET aleatorio solo si no existe y crea los archivos de entorno locales sin reemplazar la configuración existente.

```powershell
npm run db:deploy
npm run db:seed
npm run dev
```

- Aplicación: http://localhost:3000/login
- API: http://localhost:3001/api
- Estado: http://localhost:3001/api/health
- Ctrl+C detiene ambos procesos.

Usa localhost para ambas aplicaciones. FRONTEND_URL debe coincidir con el origen que abre el navegador.

## Cuenta ficticia de demostración

- Correo: paciente@vitaayuda.local
- Contraseña: Paciente2026!

El seed crea el catálogo y la cuenta; al repetirlo conserva las contraseñas y los perfiles existentes. Las mediciones del paciente se registran desde el formulario.

## Registros para la demostración

En apps/backend/.env, `MONITORING_DEMO_MODE=true` permite guardar un nuevo registro de seis mediciones en cada envío. Monitoreo Diario muestra el botón **Guardar nuevo registro** y conserva los anteriores. El historial separa cada envío y la evolución incluye la hora de sus mediciones.

Para volver al registro diario, cambia a `MONITORING_DEMO_MODE=false`, reinicia `npm run dev` y recarga la página. El botón vuelve a registrar o corregir las mediciones de hoy. Los registros de demostración existentes permanecen en el historial. No se requieren cambios en Supabase ni nuevas migraciones.

## Comandos

| Comando | Propósito |
| --- | --- |
| npm run setup:env | Prepara entorno local y secreto JWT |
| npm run dev | Inicia frontend y backend |
| npm run build | Compila paquetes y aplicaciones |
| npm run typecheck | Valida TypeScript |
| npm run db:validate | Valida el esquema Prisma |
| npm run db:deploy | Aplica migraciones versionadas |
| npm run db:seed | Carga catálogo y cuenta ficticia |
| npm run db:studio | Abre Prisma Studio |
| npm run test:integration | Prueba la API con ambos servicios iniciados |

La prueba de integración crea pacientes ficticios temporales, comprueba aislamiento y persistencia, y elimina únicamente sus propios registros al terminar. Requiere conexión a la nueva base y que el backend esté ejecutándose.

## Arquitectura

Monorepo con npm workspaces. Backend NestJS como monolito modular, con arquitectura hexagonal por módulo; frontend Next.js con App Router.

Ver [arquitectura](docs/arquitectura.md), [guion de demostración](docs/demostracion.md) y [configuración de Supabase](docs/supabase.md).
