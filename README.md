# ccoo-glovo-backend

Express + MySQL backend para gestionar casos laborales (despidos, sanciones, vacaciones no disfrutadas, etc.) enviados por repartidores representados por Comisiones Obreras.

Este repositorio contiene un scaffold inicial en JavaScript con Express y Prisma (MySQL). Está pensado para desarrollo local con Docker y para seguir los contenidos del curso CSE340.

---

## Qué hay en este scaffold



## Arrancar localmente (pasos recomendados)


2) Copia el archivo de ejemplo de variables de entorno y ajústalo si es necesario:

```bash

## Cleanup refresh tokens (maintenance)

We provide a small maintenance script that deletes expired refresh tokens and old revoked tokens. You can run it manually or schedule it.

- Run manually:

```bash
# from repo root
npm run cleanup:tokens
```

- Schedule (recommended):

1. Use the included GitHub Actions workflow `.github/workflows/cleanup-tokens.yml` which runs the cleanup daily (03:00 UTC). This workflow runs a MySQL service in CI and executes the cleanup against a temporary DB — it's intended as a convenience for test/CI environments. For production, run the script against your production database carefully.

2. To run in production, add a cron job or a Kubernetes CronJob that runs the same command with DATABASE_URL and other env vars set securely. Example (Linux cron):

```cron
# run daily at 03:00
0 3 * * * cd /path/to/repo && /usr/bin/env DATABASE_URL="mysql://user:pass@host:3306/dbname" /usr/bin/node scripts/cleanup-refresh-tokens.js >> /var/log/cleanup-tokens.log 2>&1
```

Notes:
- Always ensure backups exist before running destructive cleanup jobs against production.
- The GitHub Actions workflow is provided as an operational convenience; adapt it to your infra and secrets management (do NOT store production credentials in the repo).

## Attachment storage details

We store uploaded files under `src/uploads/` (development). Each `attachments` DB record contains the following relevant fields:

- `filename`: original filename provided by the uploader.
- `storedFilename`: the sanitized filename used on disk (unique prefix + original name). Use this to locate the file on disk.
- `url`: legacy field that holds a storage path (e.g. `/uploads/<storedFilename>`). API responses return a protected download URL (`/api/attachments/<id>/download`).

When moving to production, consider storing files in S3 and keeping only a reference (S3 key) in `storedFilename`.

## Token retention policy (recommended)

- Access tokens (JWTs): short lived. Configurable via `JWT_EXPIRES_IN` (e.g. `15m`). The special value `never` issues tokens without expiry — avoid in production.
- Refresh tokens: opaque tokens stored hashed in `refresh_tokens` table. Recommended defaults:
	- Expire refresh tokens after 30 days (configurable via `JWT_REFRESH_EXPIRES_IN`, e.g. `30d`).
	- Revoke tokens on logout and rotate on refresh.
	- Periodically clean expired tokens (we provide `scripts/cleanup-refresh-tokens.js`).

Audit process:
- Use the admin endpoint `GET /api/admin/refresh-tokens?status=expired|revoked|all` (ADMIN only) to review old tokens before deletion.
- Keep backups and logs before mass deletions. The included cleanup script deletes expired tokens and revoked tokens older than 30 days by default.

cp .env.example .env
```

3) Levanta una base de datos MySQL para desarrollo con Docker:

```bash
docker-compose up -d
```

4) Instala dependencias (en macOS zsh):

```bash
npm install
```

5) Inicializa Prisma y ejecuta la primera migración (crea las tablas en MySQL):

```bash
npx prisma generate
npx prisma migrate dev --name init
```

6) Arranca el servidor en modo desarrollo:

```bash
npm run dev
```

El servidor por defecto escucha en el puerto indicado en `.env` (o 3000).

---

## Endpoints iniciales

- POST `/api/submissions` – crear una submission
- GET `/api/submissions` – listar submissions con paginación

Worker public access
--------------------

Cuando un trabajador crea una submission con `POST /api/submissions` el servidor genera un token público (formato `tokenId.tokenValue`) válido un tiempo limitado (configurable con la variable de entorno `PUBLIC_TOKEN_EXPIRES_DAYS`, por defecto 30 días).

- GET `/api/submissions/public/:token` – recuperar la submission usando el token público (no requiere autenticación).

Nota de seguridad: en desarrollo el token se devuelve en la respuesta de creación para facilitar pruebas. En producción no devuelvas el token en la API: envíalo por correo al trabajador o implementa cuentas autenticadas para trabajadores.

Estos endpoints son intencionalmente mínimos y servirán de punto de partida para añadir validación, almacenamiento de archivos, autenticación y panel interno.

---

## Siguientes pasos recomendados (para que yo te guíe)

1. Implementar validación y sanitización de inputs.
2. Añadir subida de archivos (attachments) con límite de tamaño y tipos permitidos.
3. Implementar autenticación para vistas internas (representantes/administradores).
4. Escribir tests con Jest + Supertest y configurar CI (GitHub Actions).

Si quieres, puedo crear ya estos cambios y explicarte cada archivo y comando línea por línea mientras trabajamos.

---

## Autor

Diego García

---

## Credenciales y datos útiles (temporal — eliminar antes de producción)

ATENCIÓN: estas credenciales se incluyen aquí solo para facilitar el desarrollo local. No las publiques ni subas a un repositorio público. Antes de poner en producción, reemplaza estas credenciales por secretos gestionados y elimina este bloque.

- Usuario de base de datos (desarrollo): `ccoo_user`
- Contraseña (temporal): `Cc00p4ssw0rd2026!`
- Base de datos: `ccoo_glovo`
- Host: `127.0.0.1`
- Puerto: `3306`

Cadena de conexión (usar en `.env`):

```
DATABASE_URL="mysql://ccoo_user:Cc00p4ssw0rd2026!@127.0.0.1:3306/ccoo_glovo"
PORT=3000
```

Comandos útiles (zsh / macOS):

- Probar conexión MySQL con el usuario de desarrollo:

```bash
mysql -u ccoo_user -pCc00p4ssw0rd2026! -h 127.0.0.1 -D ccoo_glovo
```

- Regenerar Prisma Client (después de cambiar `.env` o `schema.prisma`):

```bash
npx prisma generate
```

- Introspección de la base de datos existente (no modifica datos; actualiza `schema.prisma`):

```bash
npx prisma db pull
```

- Crear migración y aplicarla en desarrollo:

```bash
npx prisma migrate dev --name init
```

Cómo rotar (cambiar) la contraseña del usuario `ccoo_user`:

```bash
mysql -u root -p
# Dentro del prompt MySQL:
ALTER USER 'ccoo_user'@'localhost' IDENTIFIED BY 'NuevaContraseniaFuerte!2026';
FLUSH PRIVILEGES;
EXIT;
```

Recomendación de seguridad:
- No uses `root` en producción. Crea un usuario con permisos limitados y restringe el host de conexión.
- Gestiona secretos con un vault (HashiCorp Vault, AWS Secrets Manager, etc.) o variables de entorno en el entorno de despliegue.
- Elimina este bloque del `README.md` y guarda solo un `.env.example` sin contraseñas reales antes de hacer push al repositorio remoto.

