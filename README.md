# Sitio web U.E. Sagrado Corazón 4

Sitio web para promover el periodismo estudiantil y ofrecer información institucional a la comunidad.

## Arquitectura

- `backend/` → FastAPI, PostgreSQL, MinIO, autenticación JWT, notificaciones por correo y Web Push, integración con Google Calendar.
- `frontend/` → React + Vite, interfaz pública dinámica y panel admin.
- `docker-compose.yml` → entorno de desarrollo completo.
- `docker-compose.prod.yml` → entorno de producción con Nginx reverse proxy.

> La solución está implementada como **monolito modular**, no como microservicios.

## Funcionalidades

- Inicio: perfil institucional dinámico, noticias recientes, avisos, actividad destacada, galería destacada y contacto.
- Avisos: comunicados para estudiantes, padres y profesores.
- Noticias: publicaciones de la unidad educativa y comunidad.
- Actividades: deportes, cultura y academia.
- Galería: álbumes e imágenes almacenadas en MinIO.
- Historia: contenido editable desde el panel admin.
- Notificaciones: email SMTP, Web Push y feed interno.
- Google Calendar: autorización, estado de conexión y sincronización de eventos.

## Requisitos

- Docker y Docker Compose.
- Opcional para desarrollo sin contenedores: Python 3.11+ y Node 18+.

## Variables de entorno

### Backend `backend/.env`

Copiar desde `backend/.env.example`.

- `DATABASE_URL`: conexión PostgreSQL.
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- `SECRET_KEY`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- `ADMIN_NAME`.

### Frontend `frontend/.env`

Copiar desde `frontend/.env.example`.

- `VITE_API_URL`: URL base del backend.
- `VITE_VAPID_PUBLIC_KEY`: clave pública VAPID.

## Arranque rápido en desarrollo

1. Copia los ejemplos de variables:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

2. Ajusta los valores de correo, Google y VAPID si los vas a usar.

3. Levanta todo:

```powershell
docker-compose up --build
```

4. Abre:

- Frontend: http://localhost:3000
- Backend: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs

## Usuario inicial

El backend crea o actualiza el usuario administrador al arrancar si encuentra estas variables de entorno:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME` (opcional)

La contraseña se guarda hasheada en PostgreSQL y no aparece en el código fuente.

## Producción

Usa el archivo:

```powershell
docker-compose -f docker-compose.prod.yml up --build
```

El proxy Nginx expone el sitio en `http://localhost`.

## Build manual por servicio

### Backend

```powershell
Push-Location backend
docker build -t sagrado-backend .
Pop-Location
```

### Frontend

```powershell
Push-Location frontend
docker build -t sagrado-frontend .
Pop-Location
```

## Endpoints principales

### Públicos

- `GET /api/v1/site/profile`
- `GET /api/v1/news`
- `GET /api/v1/notices`
- `GET /api/v1/activities`
- `GET /api/v1/galleries`
- `GET /api/v1/history`

### Admin

- `POST /api/v1/auth/login`
- `POST /api/v1/news`
- `POST /api/v1/notices`
- `POST /api/v1/activities`
- `POST /api/v1/galleries`
- `PUT /api/v1/site/profile`
- `PUT /api/v1/history`
- `POST /api/v1/notifications/send`
- `POST /api/v1/google/sync_event`

## Panel admin

Desde la sección `Admin` puedes:

- iniciar sesión,
- editar el perfil institucional,
- publicar noticias,
- crear avisos,
- crear actividades,
- crear galerías,
- subir imágenes,
- editar la historia,
- enviar notificaciones,
- conectar y sincronizar Google Calendar.

## Acceso de estudiantes

Desde la sección `Estudiante` del frontend puedes:

- crear una cuenta nueva con rol `STUDENT`,
- iniciar sesión con tu email y contraseña,
- ver tus notificaciones personales.

El registro usa `POST /api/v1/auth/register` y el inicio de sesión usa `POST /api/v1/auth/login`.

## Despliegue y CI/CD

- El flujo de integración continua está en `.github/workflows/ci-cd.yml`.
- El entorno de producción está en `docker-compose.prod.yml`.
- El frontend usa `npm ci` y build reproducible con `package-lock.json`.

## Notas técnicas

- Arquitectura: monolito modular.
- Base de datos: PostgreSQL.
- Storage: MinIO para imágenes.
- Autenticación: JWT.
- Push web: VAPID.
- Calendario: Google Calendar API.

## Documentación complementaria

- `00_START_HERE.md`
- `DEPLOYMENT.md`
- `backend/.env.example`
- `frontend/.env.example`


