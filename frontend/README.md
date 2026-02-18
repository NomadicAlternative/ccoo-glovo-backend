CCOO Glovo - Frontend (CSE340 course mapping)

Este frontend es un proyecto didáctico diseñado para mapear los módulos del curso CSE340 a tareas reales del proyecto.

Stack recomendado
- Vite + React + TypeScript
- Tailwind CSS para estilos rápidos
- Axios para llamadas HTTP

Módulos / ejercicios propuestos (mapeo CSE340 -> tareas)

1) HTML & CSS (Introducción)
- Objetivo: crear la página de envío público (`/`) con un formulario accesible y responsivo.
- Entregable: `src/pages/Submit.tsx` (estilos con Tailwind) — validar campos simples en cliente.

2) JavaScript & DOM (Interactividad)
- Objetivo: manejar estados del formulario, mostrar mensajes de éxito/error, crear enlace público.
- Entregable: completar `Submit.tsx` con validación y UX.

3) SPA y React (Componentes)
- Objetivo: dividir UI en componentes (`Submit`, `PublicView`, `Login`, `AdminTokens`), usar React Router.
- Entregable: `src/App.tsx` con rutas y navegación.

4) Consumo de APIs (Fetch + Axios)
- Objetivo: conectar con backend (POST `/api/submissions`, GET `/api/submissions/public/:token`, auth endpoints).
- Entregable: llamadas con Axios y manejo de errores.

5) Autenticación (JWT)
- Objetivo: implementar login (guardar access token en memoria/localStorage), proteger vistas de admin.
- Entregable: `src/context/AuthContext.tsx`, `src/pages/Login.tsx`.

6) File uploads
- Objetivo: desde la vista admin, subir attachments a `/api/submissions/:id/attachments` usando FormData.
- Entregable: UI de subida de archivos y visualización de links seguros.

7) Testing (Frontend)
- Objetivo: escribir pruebas con Testing Library para el formulario público y la vista pública del caso.
- Entregable: tests que mockean API y validan la UI.

8) Deployment/CI
- Objetivo: build y desplegar el frontend (Vercel/Netlify) y configurar un proxy a la API en dev.
- Entregable: configuración `vite.config.ts` con `proxy: { '/api': 'http://localhost:3000' }`.

Cómo empezar (dev)
1. Ir a la carpeta `frontend`
2. Instalar dependencias: `npm install`
3. Correr en dev: `npm run dev` (abre en http://localhost:5173)

Notas de seguridad para el curso
- Para prototipos se usa localStorage para accessToken; explicar a estudiantes por qué esto no es ideal en producción.
- Discutir cookies httpOnly y estrategias para refresh token en un módulo avanzado.

---

Siguiente paso: implementar autenticación y panel admin para cubrir módulos 5-6. Si quieres que continúe, lo haré de forma iterativa (primero login + token storage, luego admin tokens UI y upload).