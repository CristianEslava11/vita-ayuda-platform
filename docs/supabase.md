# Crear y conectar la base de datos en Supabase

1. Entra en https://supabase.com/dashboard e inicia sesión.
2. Elige **New project**, selecciona tu organización y usa el nombre **VitaAyuda-Software2**.
3. Genera y guarda la contraseña de la base de datos. Elige una región cercana al lugar de uso y pulsa **Create new project**. Espera a que termine la creación.
4. Este proyecto accede a PostgreSQL a través del backend y Prisma. Desactiva **Data API** en la configuración de API del proyecto para que las tablas no queden expuestas por ese servicio.
5. Abre **Connect**, selecciona **Session pooler** y copia la URI PostgreSQL. El puerto debe ser **5432**. Copia exactamente host y usuario del panel.
6. Sustituye `[YOUR-PASSWORD]` por la contraseña de la base. Codifica los caracteres reservados de la contraseña para usarla dentro de una URL. Agrega `?sslmode=require` si la URI no tiene parámetros; usa `&sslmode=require` si ya los tiene.
7. Desde la raíz del monorepo ejecuta:

```powershell
npm run setup:env
```

8. Edita `apps/backend/.env` localmente:

```dotenv
DATABASE_URL="postgresql://postgres.PROJECT_REF:CONTRASENA_CODIFICADA@HOST_DEL_PANEL:5432/postgres?sslmode=require"
```

El texto anterior es un ejemplo: reemplaza todos los campos con la URI del panel. Usa la contraseña de PostgreSQL. La URL pública del proyecto y las claves anon/publishable no son la conexión de Prisma.

9. Valida el esquema y aplica la migración inicial a este proyecto nuevo:

```powershell
npm run db:validate
npm run db:deploy
```

10. Ejecuta `npm run db:seed` para crear el catálogo y la cuenta ficticia de demostración. En **Table Editor**, verifica users, roles, user_roles, patients, vital_sign_types y vital_signs. Reinicia el backend después de cambiar el archivo .env.

La migración versionada habilita RLS en las seis tablas sin políticas para clientes públicos. El backend accede con la conexión administrativa PostgreSQL y comprueba la sesión y la propiedad del perfil antes de consultar o modificar mediciones.

## Conexión elegida

Session pooler admite IPv4 y sesiones persistentes, apropiadas para el backend NestJS local. La conexión directa es otra opción si la red admite IPv6. No se requiere una base adicional de shadow database para `migrate deploy`: se aplica el SQL ya versionado.

## Referencias

- [Crear un proyecto](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Conectar a PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma)
