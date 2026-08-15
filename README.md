# AdrianStore

Catálogo en línea de AdrianStore: tienda personal con productos seleccionados y pedidos directos por WhatsApp.

| Capa       | Tecnología                                        |
|------------|---------------------------------------------------|
| Backend    | NestJS 10 · TypeScript · Drizzle ORM · JWT        |
| Base de datos | PostgreSQL (en producción) · SQLite en tests    |
| Frontend   | Angular 16 · Tailwind CSS 3 · RxJS                |
| Seguridad  | Helmet/CSP · bcrypt · throttling · validación de archivos |
| Gestor de paquetes | pnpm (workspace en la raíz: `backend` + `frontend`) |

---

## Estructura del proyecto

```
AdrianStore/
├── backend/            # API NestJS
│   ├── src/
│   │   ├── auth/       # Login, JWT, guard de roles
│   │   ├── product/    # CRUD de productos, subida de imágenes, enum de tipos/provincias/monedas
│   │   ├── about/      # Sección "Sobre mí"
│   │   ├── users/      # Modelo de usuarios
│   │   ├── security/   # Sanitización XSS, filtro multer, validación de origen
│   │   ├── db.ts       # Conexión PostgreSQL/SQLite + creación automática de tablas
│   │   ├── seeder.ts   # Productos de ejemplo
│   │   ├── clean-db.ts # Vacía la base de datos (mantiene la estructura)
│   │   └── setup-admin.ts  # Crea/actualiza el admin desde variables de entorno
│   ├── .env.example    # Plantilla de configuración
│   └── package.json
├── frontend/           # SPA Angular
│   └── src/
│       ├── app/        # Componente principal (catálogo, admin, filtros)
│       ├── assets/     # logo.png + imágenes de fondo por categoría
│       └── environments/ # environment.ts (dev) y environment.prod.ts (producción)
├── deploy/             # Kit de despliegue a producción
│   ├── docker-stack.yml    # Stack de Docker Swarm (backend detrás de Traefik)
│   ├── stack.env.example   # Plantilla de variables para el stack de Swarm
│   ├── deploy.sh       # Alternativa: instalación en un solo VPS Debian/Ubuntu
│   ├── Caddyfile       # Reverse proxy con HTTPS automático (alternativa VPS)
│   ├── nginx.conf      # Alternativa para nginx + Let's Encrypt (alternativa VPS)
│   ├── backup.sh       # Backup de la base de datos (alternativa VPS)
│   └── adrianstore-backend.service  # Servicio systemd (alternativa VPS)
└── README.md
```

---

## Funcionalidades

- **Catálogo público** con búsqueda por categoría, **filtro de precio** (doble bolilla) y **filtro por provincia**.
- **Productos**: nombre, descripción, precio, **moneda (CUP / USD / EUR / ZELLE)**, transferencia sí/no, hasta **8 fotos** con rotación automática (5 s), número de WhatsApp por producto y **provincia** (16 provincias de Cuba, por defecto Camagüey).
- **Pedido por WhatsApp** con mensaje automático que incluye nombre, precio y moneda del producto.
- **Sección "Agregados recientemente"** (últimos 6 productos) y hero con producto destacado.
- **Imágenes de fondo por categoría** (`frontend/src/assets/categorias/`).
- **Panel de administración**: crear, editar y eliminar productos; editar "Sobre mí".
- **Categorías**: Tecnología, Ropa, Alimentos, Hogar, Electrodomésticos, Deportes y Otros.

---

## Requisitos

- Node.js 18+
- pnpm (`corepack enable && corepack prepare pnpm@11.9.0 --activate`)
- PostgreSQL (probado con PostgreSQL 18); crear una base de datos llamada `adrianstore`.
- Angular CLI (se instala con las dependencias del frontend).

---

## Puesta en marcha (desarrollo)

Es un workspace pnpm: un solo `pnpm install` en la raíz instala `backend/` y `frontend/`.

```bash
pnpm install
```

### 1. Backend

```bash
cd backend
cp .env.example .env   # ajustar valores (DB, JWT_SECRET, etc.)
pnpm run start:dev     # http://localhost:3000
```

Variables de entorno (`backend/.env`):

| Variable                | Descripción                                    | Default                 |
|-------------------------|------------------------------------------------|-------------------------|
| `PORT`                  | Puerto del backend                             | `3000`                  |
| `NODE_ENV`              | `production` activa CSP estricto, cookies `secure` y oculta Swagger | `development` |
| `DATABASE_URL`          | Cadena de conexión única (Supabase, Neon, Render, Railway...); si está definida, tiene prioridad sobre `DB_HOST`/`DB_USER`/etc. | - |
| `DB_SSL`                | Fuerza (`true`) o desactiva (`false`) TLS con Postgres; por defecto se activa solo si hay `DATABASE_URL` | - |
| `DB_HOST` / `DB_PORT`   | Host y puerto de PostgreSQL (si no usas `DATABASE_URL`)         | `localhost` / `5432`    |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales y nombre de la base de datos (si no usas `DATABASE_URL`) | `postgres` / - / `adrianstore` |
| `JWT_SECRET`            | Secreto para firmar tokens (**obligatorio**)   | -                       |
| `BACKEND_URL`           | URL pública del backend (para URLs de imágenes) | `http://localhost:3000` |
| `FRONTEND_URL`          | Origen permitido (CORS y validación de origen) | `http://localhost:4200` |
| `SUPABASE_PROJECT_REF` / `SUPABASE_STORAGE_REGION` / `SUPABASE_STORAGE_BUCKET` / `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` | Storage de imágenes en Supabase Storage; si faltan, cae a disco local (`backend/uploads/`) | - |
| `ADMIN_USERNAME`        | Usuario administrador (`pnpm run setup:admin`)  | `adrian0502`            |
| `ADMIN_PASSWORD`        | Contraseña del administrador                   | -                       |
| `THROTTLE_LIMIT` / `THROTTLE_TTL` | Límite global de peticiones por minuto | `20` / `60000` |
| `LOGIN_THROTTLE_LIMIT` / `LOGIN_THROTTLE_TTL` | Límite de intentos de login | `5` / `60000` |

> Las tablas (`products`, `users`, `about`) se crean automáticamente al arrancar.

### 2. Configurar el administrador

El usuario admin **ya no se crea con el seed**. Usa:

```bash
cd backend
pnpm run setup:admin    # lee ADMIN_USERNAME / ADMIN_PASSWORD del .env
```

Esto crea o actualiza el administrador y elimina el usuario legado `admin123` si existiera.

### 3. Datos de ejemplo (opcional)

```bash
cd backend
pnpm run seed           # inserta 4 productos de ejemplo
pnpm run clean          # vacía la base de datos sin borrar la estructura
```

### 4. Frontend

```bash
cd frontend
pnpm start              # http://localhost:4200
```

---

## Scripts útiles

### Backend (`backend/`)

| Comando             | Descripción                                   |
|---------------------|-----------------------------------------------|
| `pnpm run start:dev` | Ejecuta el backend en modo desarrollo         |
| `pnpm run build`     | Compila a `dist/` (TypeScript)                |
| `pnpm run test`      | Tests e2e (Jest + supertest, SQLite en memoria) |
| `pnpm run seed`      | Inserta productos de ejemplo                  |
| `pnpm run clean`     | Vacía productos, usuarios y "Sobre mí"        |
| `pnpm run setup:admin` | Crea/actualiza el admin desde el `.env`     |

### Frontend (`frontend/`)

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Servidor de desarrollo en `http://localhost:4200` |
| `pnpm run build` | Compila la aplicación |
| `pnpm exec ng build --configuration production` | Compila con `environment.prod.ts`, optimización y hashing |

---

## Seguridad

- **Contraseñas** con bcrypt (10 rondas) y política mínima (8-72 caracteres).
- **JWT** en cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` en producción), expiración de 1 hora. El secreto es obligatorio (no hay valores por defecto).
- **Anti-XSS**: todo texto (nombre, descripción, WhatsApp, "Sobre mí") se sanitiza en el backend (se eliminan etiquetas HTML, `script/style` y `javascript:`), además del escapado automático de Angular.
- **Subida de imágenes segura**: solo admin autenticado; validación por **bytes mágicos** (PNG/JPG/WebP reales), límite de **5 MB por imagen y 8 archivos**, extensión derivada del contenido y nombres aleatorios.
- **Rate limiting** activo (`ThrottlerGuard`): límite global y **5 intentos de login por minuto**.
- **CSRF**: validación de `Origin`/`Referer` en todas las peticiones que modifican estado.
- **Headers**: Helmet con Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`.
- **Swagger deshabilitado** en producción.
- Sin secretos en el repositorio (`.env` está en `.gitignore`).

---

## API

Base: `http://localhost:3000/api` · Documentación Swagger en `/api/docs` (solo desarrollo).

### Salud

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/health` | Health check para el hosting/orquestador (`{ status: "ok" }`) |

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Inicia sesión (`{ username, password }`), setea cookie HttpOnly y devuelve el token |
| `POST` | `/api/auth/logout` | Cierra sesión y limpia la cookie |
| `GET`  | `/api/auth/me` | Usuario autenticado (requiere token o cookie) |

### Productos (público)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/api/products` | Lista productos. `?type=tecnologia\|ropa\|alimentos\|hogar\|electrodomesticos\|deportes\|otros` |
| `GET`  | `/api/products/:id` | Obtiene un producto |
| `GET`  | `/api/products/:id/whatsapp` | Enlace de WhatsApp con mensaje del producto |

### Productos (solo admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST`   | `/api/products` | Crea un producto (`multipart/form-data`, imágenes opcionales) |
| `PATCH`  | `/api/products/:id` | Actualiza un producto |
| `DELETE` | `/api/products/:id` | Elimina un producto |

### Sobre mí

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/about` | Contenido de "Sobre mí" |
| `PUT` | `/api/about` | Actualiza "Sobre mí" (solo admin) |

---

## Despliegue a producción

Arquitectura actual, tres piezas independientes:

| Pieza                | Dónde vive                                   | Config clave |
|----------------------|-----------------------------------------------|--------------|
| Frontend (Angular SPA) | Cloudflare Pages                             | `frontend/src/environments/environment.prod.ts` → `apiUrl` |
| Backend (NestJS API) | Docker Swarm, detrás de tu Traefik (`traefik-public`), origin de Cloudflare | `deploy/docker-stack.yml` + `deploy/stack.env` |
| DB + storage de imágenes | Supabase (Postgres + Storage)            | `DATABASE_URL` + `SUPABASE_*` en `backend/.env` |

**Dominios**: el frontend y el backend van en **hostnames distintos** — el DNS de un nombre solo puede apuntar a un destino, y Cloudflare Pages ya consume el que le asignes. Este repo usa por defecto:
- `adrianstore.ladetec.com` → Cloudflare Pages (frontend)
- `api.adrianstore.ladetec.com` → tu Traefik/swarm, proxied por Cloudflare (backend)

Si usas otros dominios, ajusta `apiUrl` (frontend), y `BACKEND_URL`/`FRONTEND_URL`/`BACKEND_DOMAIN` (backend) en todos los pasos de abajo.

### 1. Supabase (DB + storage de imágenes)

1. Crea el proyecto en Supabase (te da Postgres + Storage).
2. **DB**: Project Settings → Database → Connection string → conexión directa (`db.[project_ref].supabase.co:5432`, recomendada para este backend que mantiene un `pg.Pool` persistente; usa el pooler en modo sesión, puerto 5432, solo si tu red no soporta IPv6 — NO el 6543 de modo transacción). Va en `DATABASE_URL`; `DB_SSL` se activa solo si defines `DATABASE_URL`, Supabase siempre requiere TLS.
3. **Storage**: Storage → New bucket → márcalo **público**.
4. Storage → Settings → S3 Connection: ahí está `SUPABASE_STORAGE_REGION` y el botón para generar `SUPABASE_S3_ACCESS_KEY_ID` / `SUPABASE_S3_SECRET_ACCESS_KEY` (no son las API keys normales del proyecto).
5. Guarda los 5 valores (`SUPABASE_PROJECT_REF`, `SUPABASE_STORAGE_REGION`, `SUPABASE_STORAGE_BUCKET`, `SUPABASE_S3_ACCESS_KEY_ID`, `SUPABASE_S3_SECRET_ACCESS_KEY`) — los necesitas en el paso 3.

Sin estos 5 valores, el backend cae a disco local para las imágenes (`backend/uploads/`) — válido en dev, pierde archivos en cada redeploy en Swarm (contenedor sin volumen).

### 2. Frontend → Cloudflare Pages

1. Conecta el repo en el dashboard de Cloudflare Pages (Workers & Pages → Create → Pages → conectar a Git).
2. Configuración de build:
   - **Root directory**: `frontend`
   - **Build command**: `pnpm install --frozen-lockfile && pnpm exec ng build --configuration production` (Pages corre `pnpm` nativamente si detecta `pnpm-lock.yaml` en la raíz del repo — si falla la detección, fuerza el gestor con la variable de entorno `PNPM_VERSION` o cambia a `corepack enable && pnpm install ...`).
   - **Build output directory**: `dist/adrianstore-frontend` (relativo a `frontend/`, ver `frontend/angular.json` → `outputPath`).
3. Antes de buildear, confirma `frontend/src/environments/environment.prod.ts` → `apiUrl` apunta al dominio real del backend (por defecto `https://api.adrianstore.ladetec.com/api`).
4. Añade tu dominio custom (Pages → Custom domains) — Cloudflare gestiona el DNS y el certificado solo.

### 3. Backend → Docker Swarm + Traefik

`deploy/docker-stack.yml` despliega solo el backend, sin Postgres ni volúmenes (DB y storage viven en Supabase, se llega por internet público, no por overlay network). Solo necesita la red `traefik-public` ya existente en tu swarm.

```bash
# Build (contexto = raíz del repo, es un workspace pnpm, no `backend/`)
docker build -f backend/Dockerfile -t ghcr.io/vladimir1284/adrianstore-backend:latest .
docker push ghcr.io/vladimir1284/adrianstore-backend:latest

# Config
cp deploy/stack.env.example deploy/stack.env   # completar con los valores de Supabase + JWT_SECRET + ADMIN_PASSWORD
export $(grep -v '^#' deploy/stack.env | xargs)

# Deploy
docker stack deploy -c deploy/docker-stack.yml adrianstore
```

Verifica:
```bash
docker service ps adrianstore_backend        # replica corriendo, sin reinicios en loop
curl https://api.adrianstore.ladetec.com/api/health   # {"status":"ok"}
docker service logs adrianstore_backend -f   # setup:admin, conexión a Supabase, etc.
```

Luego crea el admin (una vez, contra la DB de producción):
```bash
docker exec -it $(docker ps -q -f name=adrianstore_backend) node dist/setup-admin.js
```

Cosas a ajustar/verificar (no tengo acceso a tu swarm real):
- Nombres de entrypoint/certresolver de tu Traefik (el stack asume la convención típica `http`/`https` + certresolver `le`; si tu Traefik usa otros nombres, cambia las labels en `docker-stack.yml`).
- `replicas: 1` por diseño: el rate limiting (`ThrottlerGuard`) cuenta en memoria por réplica — escalar sin mover el throttler a un store compartido (Redis) rompe el límite real.
- Imagen en `ghcr.io/vladimir1284/adrianstore-backend`: no hay CI que la construya/publique todavía, es build+push manual (o cablea un workflow).

### Alternativa: un solo VPS (sin Supabase/Swarm/Pages)

Para un despliegue más simple, todo en un servidor (Postgres local + Caddy sirviendo frontend y backend), el kit original sigue en `deploy/`:

1. Clona el repo en el servidor en `/opt/adrianstore` (Debian/Ubuntu, Node 18+, pnpm, PostgreSQL).
2. Crea `backend/.env` a partir de `backend/.env.example` con valores reales (`JWT_SECRET` con `openssl rand -hex 48`, `ADMIN_PASSWORD`, `BACKEND_URL`/`FRONTEND_URL` con tu dominio HTTPS, `DB_HOST`/`DB_USER`/etc. para el Postgres local).
3. Edita `frontend/src/environments/environment.prod.ts` con el dominio real y compila (`pnpm exec ng build --configuration production`).
4. Ejecuta `./deploy/deploy.sh tudominio.com`.
5. Abre los puertos 80/443 en el firewall y apunta el DNS del dominio al servidor.

`deploy.sh` instala y compila el backend y el frontend, configura el admin (`setup-admin`), crea el servicio `adrianstore-backend` (systemd) e instala **Caddy** con HTTPS automático (Let's Encrypt). Como alternativa a Caddy, `nginx.conf` cubre el mismo escenario con nginx.

También puedes correr el backend en un contenedor suelto (sin Swarm) con la misma imagen del paso 3 anterior:
```bash
docker run -p 3000:3000 --env-file backend/.env ghcr.io/vladimir1284/adrianstore-backend:latest
```

---

## Roles

- **Admin**: inicia sesión con `ADMIN_USERNAME`/`ADMIN_PASSWORD`. Accede al panel para crear, editar y eliminar productos, y editar "Sobre mí".
- **Invitado**: solo ve el catálogo y abre WhatsApp para hacer pedidos.

---

## Notas

- WhatsApp por defecto: `59028922` (se sobrescribe si el producto define su propio número).
- Tests: se ejecutan con `NODE_ENV=test`, que usa SQLite en memoria (`sql.js`); en ejecución real se usa PostgreSQL.
- El logo de la pestaña del navegador es `frontend/src/assets/logo.png`.
