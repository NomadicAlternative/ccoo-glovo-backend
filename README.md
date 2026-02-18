# ccoo-glovo-backend

Express + MySQL backend para gestionar casos laborales (despidos, sanciones, vacaciones no disfrutadas, etc.) enviados por repartidores representados por Comisiones Obreras.

Este repositorio contiene un scaffold inicial en JavaScript con Express y Prisma (MySQL). Está pensado para desarrollo local con Docker y para seguir los contenidos del curso CSE340.

---

## Qué hay en este scaffold

- `src/index.js` – servidor Express minimal
- `src/routes/submissions.js` – rutas REST básicas para submissions (POST/GET)
- `prisma/schema.prisma` – esquema inicial para Prisma (Submission, Attachment, enums)
- `docker-compose.yml` – servicio MySQL para desarrollo
- `.env.example` – variables de entorno de ejemplo
- `package.json` – scripts y dependencias recomendadas

---

## Arrancar localmente (pasos recomendados)

1) Clona el repo y sitúate en la carpeta del proyecto.

2) Copia el archivo de ejemplo de variables de entorno y ajústalo si es necesario:

```bash
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

