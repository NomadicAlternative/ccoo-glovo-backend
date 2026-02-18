# Project summary — CCOO Glovo Backend

Fecha: 2026-02-18

Resumen corto
--------------
- Proyecto: backend Express + MySQL (Prisma) para que trabajadores envíen casos laborales y adjunten pruebas.
- Estado actual: API funcional en desarrollo local. Soporta creación de casos públicos, subida de adjuntos, autenticación para internos con JWT, refresh tokens básicos, y cuentas de trabajador sin verificación por email.

Puntos importantes implementados
-------------------------------
- Rutas principales:
  - `POST /api/submissions` — crear caso público (devuelve `publicToken` para acceder sin cuenta).
  - `GET /api/submissions/public/:token` — ver caso usando token público.
  - `POST /api/submissions/:id/attachments` — subir adjuntos (restringido a representantes/admins).
  - `GET /api/submissions` y `GET /api/submissions/:id` — APIs protegidas para representantes/admins.
  - `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` — auth con refresh tokens (rotación implementada).
  - `POST /api/workers/register`, `POST /api/workers/login`, `GET /api/workers/me` — cuentas de trabajador sin verificación por email.
  - `GET /api/attachments/:id/download` — descarga de adjuntos protegida.

- Seguridad básica: helmet, rate-limiting, input validation (express-validator), límites de subida de ficheros (Multer).
- Almacenamiento de archivos durante desarrollo: `src/uploads/` (no público). Attachments devuelven URL protegida.
- Prisma: esquema adaptado a la base de datos existente (`casos`, `trabajadores`) y modelos añadidos: `attachments`, `users`, `refresh_tokens`, `worker_accounts`.

Decisiones de diseño relevantes
------------------------------
- Tokens públicos: se generan y se devuelven en la respuesta sólo para desarrollo; en producción recomendamos enviar el token por email o usar cuentas.
- No se usa verificación por email para cuentas de trabajador (decisión explícita del equipo).
- Refresh tokens se guardan hasheados y se rotan al refrescar.

Estado actual (snapshot de tareas)
---------------------------------
- Validación y sanitización: completado
- Attachments (upload): completado
- Auth (login + middleware): en progreso
- Refresh tokens (modelo + endpoints): completado (rotación implementada)
- Protecciones por rol: completado para endpoints críticos
- Worker accounts (sin verificación por email): completado
- Tests automatizados (Jest + Supertest): pendiente
- CI (GitHub Actions): pendiente

Cómo reanudar mañana (rápido)
----------------------------
1. Clona el repo y copia `.env.example` a `.env` y ajusta `DATABASE_URL`, `JWT_SECRET` y otros valores.

```bash
cp .env.example .env
npm install
npx prisma generate
npm run dev
```

2. Para probar el flujo público (sin cuenta):
  - POST `/api/submissions` con `{ name,email,category,subject,message }` => guarda el `publicToken` devuelto.
  - GET `/api/submissions/public/:token` para ver el caso.

3. Para crear una cuenta de trabajador:
  - POST `/api/workers/register` con `{ name, email, password }` => recibe JWT.
  - Con ese JWT llama `GET /api/workers/me`.

4. Para usar endpoints internos (representante/admin): regenera usuario admin con `scripts/seed-admin.js` si existe, o usar las credenciales provisionales en README.

Qué guardar en el repo para que el agente pueda 'recordar' mañana
----------------------------------------------------------------
- `docs/PROJECT_SUMMARY.md` (este archivo) — decisiones, endpoints, tareas pendientes.
- `docs/CHAT_TRANSCRIPT-YYYYMMDD.md` — (opcional) pega la transcripción relevante de la sesión si quieres guardar detalles de la conversación.
- Issues en GitHub por cada tarea pendiente (tests, CI, S3, políticas de retención).

Notas finales y seguridad
------------------------
- No subas `.env` con secretos reales.
- Antes de pasar a producción: configuración HTTPS, mover uploads a S3 con URLs firmadas, revisar política de retención y consentimiento legal.

---
Archivo generado automáticamente por el agente el 2026-02-18.
