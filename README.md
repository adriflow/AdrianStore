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
- `api_adrianstore.ladetec.com` → tu Traefik/swarm, proxied por Cloudflare (backend)

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
3. Antes de buildear, confirma `frontend/src/environments/environment.prod.ts` → `apiUrl` apunta al dominio real del backend (por defecto `https://api_adrianstore.ladetec.com/api`).
4. Añade tu dominio custom (Pages → Custom domains) — Cloudflare gestiona el DNS y el certificado solo.

### 3. Backend → Docker Swarm + Traefik

`deploy/docker-stack.yml` despliega solo el backend, sin Postgres ni volúmenes (DB y storage viven en Supabase, se llega por internet público, no por overlay network). Solo necesita la red `traefik-public` ya existente en tu swarm.

La imagen se construye y publica sola: `.github/workflows/backend-build-push.yml` corre en cada push a `main` que toque `backend/**` (o el lockfile/workspace) y sube `ghcr.io/adriflow/adrianstore-backend:latest` + `:<sha>` con el `GITHUB_TOKEN` del propio repo (sin secrets extra). Primer run: el paquete queda privado por default en GitHub — pásalo a público a mano (Packages → adrianstore-backend → Package settings → Change visibility) si tu host de swarm va a hacer `docker pull` sin login.

Build manual (solo si necesitás algo fuera del flujo de CI, p. ej. probar un cambio antes de mergear):
```bash
# Build (contexto = raíz del repo, es un workspace pnpm, no `backend/`)
docker build -f backend/Dockerfile -t ghcr.io/adriflow/adrianstore-backend:latest .
docker push ghcr.io/adriflow/adrianstore-backend:latest

# Config
cp deploy/stack.env.example deploy/stack.env   # completar con los valores de Supabase + JWT_SECRET + ADMIN_PASSWORD
export $(grep -v '^#' deploy/stack.env | xargs)

# Deploy
docker stack deploy -c deploy/docker-stack.yml adrianstore
```

Verifica:
```bash
docker service ps adrianstore_backend        # replica corriendo, sin reinicios en loop
curl https://api_adrianstore.ladetec.com/api/health   # {"status":"ok"}
docker service logs adrianstore_backend -f   # setup:admin, conexión a Supabase, etc.
```

Luego crea el admin (una vez, contra la DB de producción):
```bash
docker exec -it $(docker ps -q -f name=adrianstore_backend) node dist/setup-admin.js
```

Cosas a ajustar/verificar (no tengo acceso a tu swarm real):
- Nombres de entrypoint/certresolver de tu Traefik (el stack asume la convención típica `http`/`https` + certresolver `le`; si tu Traefik usa otros nombres, cambia las labels en `docker-stack.yml`).
- `replicas: 1` por diseño: el rate limiting (`ThrottlerGuard`) cuenta en memoria por réplica — escalar sin mover el throttler a un store compartido (Redis) rompe el límite real.
- Imagen en `ghcr.io/adriflow/adrianstore-backend`, publicada por `.github/workflows/backend-build-push.yml` en cada push a `main`.
- Visibilidad del paquete: primer push lo crea privado, cambialo a público en GitHub si el host de swarm no va a hacer `docker login`.

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
docker run -p 3000:3000 --env-file backend/.env ghcr.io/adriflow/adrianstore-backend:latest
```

---

## Autenticación y modo admin

Solo existen dos roles, y no hay registro público: **`admin`** (un único usuario, provisto por variables de entorno) e **invitado** (cualquiera sin sesión). No hay endpoint para crear cuentas nuevas ni para asignar el rol admin a otro usuario desde la API.

### Modelo de usuario

Tabla `users` (`backend/src/users/user.schema.ts`): `id` (uuid), `username`, `password_hash` (bcrypt, 10 rondas), `role` (string libre, pero solo `RolesGuard` reconoce `"admin"`). `UsersService` (`backend/src/users/users.service.ts`) solo expone `findByUsername` y `createUser` — no hay update de perfil, ni endpoint de "cambiar contraseña" para el propio usuario.

### Cómo se crea/actualiza el admin

No hay seed automático del admin. Se gestiona a mano con `pnpm run setup:admin` (`backend/src/setup-admin.ts`), que lee `ADMIN_USERNAME`/`ADMIN_PASSWORD` del `.env`:

- Si el usuario no existe, lo crea con `role: 'admin'`.
- Si ya existe, le actualiza el hash de contraseña (permite rotar la contraseña sin tocar la DB a mano).
- Siempre borra el usuario legado `admin123` si existiera (limpieza de una versión anterior que sembraba ese usuario por defecto).
- Valida contraseña de 8-72 caracteres (bcrypt trunca a partir de 72); si falta alguna variable o la contraseña no cumple, termina con `process.exit(1)` sin tocar la DB.

Solo puede haber un admin "oficial" por convención (un solo `ADMIN_USERNAME`), pero nada en el código impide insertar más filas con `role: 'admin'` directamente en la DB — no hay UI ni endpoint para eso.

### Flujo de login (backend)

1. `POST /api/auth/login` (`backend/src/auth/auth.controller.ts`) recibe `{ username, password }`, validado con `class-validator`: `username` máx. 64 caracteres y `^[A-Za-z0-9_@.-]+$` (rechaza espacios/caracteres raros antes de tocar la DB), `password` no vacío, máx. 72.
2. Limitado por `@Throttle` con `LOGIN_THROTTLE_LIMIT`/`LOGIN_THROTTLE_TTL` (5 intentos/minuto por defecto), **por IP y a nivel de servidor** — independiente de cualquier bloqueo en el navegador.
3. `AuthService.validateUser` (`backend/src/auth/auth.service.ts`) busca el usuario y compara con `bcrypt.compare`. Si no hay match, `401 Unauthorized` (mensaje genérico, no distingue "usuario no existe" de "contraseña incorrecta").
4. Si es válido, firma un JWT (`JwtService`, `backend/src/auth/auth.module.ts`) con payload `{ sub: id, username, role }`, expiración fija de **1 hora**, secreto = `JWT_SECRET` (obligatorio, sin default — `requireEnv` tira si falta).
5. La respuesta pone el token en una cookie `jwt`: `httpOnly`, `sameSite: 'lax'` en dev / `'none'` en producción, `secure` solo en producción, `maxAge` 1 hora. **También** devuelve el token en el body JSON (`{ message, token }`), pero el frontend actual lo ignora y trabaja solo con la cookie.

### Cómo se protegen las rutas

Dos guards encadenados con `@UseGuards(JwtAuthGuard, RolesGuard)`:

- **`JwtAuthGuard`** (`backend/src/auth/auth.guard.ts`) — envoltorio de Passport (`AuthGuard('jwt')`). Usa `JwtStrategy` (`backend/src/auth/jwt.strategy.ts`), que extrae el token primero de la cookie `jwt` y, si no está, de `Authorization: Bearer <token>`. Rechaza si el JWT es inválido, está corrompido, mal firmado o expiró (`ignoreExpiration: false`). Al pasar, deja `req.user = { sub, username, role }` (el payload del token, no relee la DB — si el rol de un usuario cambia en la DB, sus tokens ya emitidos siguen con el rol viejo hasta que expiren).
- **`RolesGuard`** (`backend/src/auth/roles.guard.ts`) — corre después, exige `req.user.role === 'admin'`; si no, `403 Forbidden`. Es un chequeo simple hardcodeado a `'admin'`, no hay decorador `@Roles(...)` genérico ni soporte multi-rol.

Aplicado en:

| Endpoint | Guard |
|----------|-------|
| `GET /api/auth/me` | solo `JwtAuthGuard` (cualquier usuario autenticado, no exige admin) |
| `POST/PATCH/DELETE /api/products` | `JwtAuthGuard` + `RolesGuard` |
| `PUT /api/about` | `JwtAuthGuard` + `RolesGuard` |

No hay refresh token ni renovación silenciosa: a la hora, el usuario tiene que volver a loguearse. Tampoco hay revocación server-side (blocklist/versión de token) — un JWT robado sigue siendo válido hasta que expira, aunque se llame a `/logout` (que solo borra la cookie del navegador que la pidió).

### Logout

`POST /api/auth/logout` solo hace `res.clearCookie('jwt')`. Es estateless: no invalida el token en el servidor, solo borra la cookie del cliente que llamó al endpoint. Si el mismo token se copió a otro cliente (o vía el `token` que devuelve el body de `/login`), sigue funcionando hasta expirar.

### CSRF / origen

`originGuard` (`backend/src/security/origin.middleware.ts`) corre en todas las peticiones `POST/PUT/PATCH/DELETE`: si el header `Origin` (o, en su defecto, `Referer`) no coincide con `FRONTEND_URL`, responde `403` antes de llegar a ningún controller/guard. Es la defensa contra CSRF (la cookie `jwt` no tiene `SameSite=strict`, así que esto no es opcional).

### Modo admin en el frontend

No hay routing de Angular ni guard de ruta: es una sola página (`app.component.ts`) con un flag `isAdmin: boolean` y una vista `activeView`. Nada carga código de admin por separado; el HTML del panel simplemente no se muestra (`*ngIf`-style) cuando `isAdmin` es `false`. Esto es solo UX — la seguridad real la hacen los guards del backend, no este flag.

- Al iniciar (`ngOnInit`), llama `GET /api/auth/me` con `withCredentials: true`; si la cookie `jwt` es válida y `role === 'admin'`, pone `isAdmin = true` y `activeView = 'admin'`. Si no hay cookie o expiró, queda como invitado sin mostrar error.
- El formulario de login vive siempre en la vista "admin" (`selectView('admin')` la muestra a cualquiera; solo cambia si loguea con éxito).
- `loginAdmin()` llama `POST /api/auth/login` con `withCredentials: true`; el navegador guarda la cookie `HttpOnly` sola, el frontend nunca toca el JWT ni lo guarda en `localStorage`/`sessionStorage`.
- Todas las peticiones que mutan datos (`createProduct`, `updateProduct`, `deleteProduct`, `updateAbout`) van con `withCredentials: true` para que el navegador adjunte la cookie; si expiró, el backend responde 401/403 y el frontend simplemente deja el error sin manejar en varios casos (no hay redirect automático a login ni renovación).
- **Bloqueo de intentos fallidos es solo cosmético en el cliente**: tras 3 fallos, guarda `adminLockUntil` en `localStorage` y bloquea el formulario 5 minutos (`app.component.ts` → `loginAsAdmin`/`restoreLock`). Se salta borrando `localStorage` o usando otro navegador — la protección real de fuerza bruta es el throttling del backend (`LOGIN_THROTTLE_LIMIT`).
- `logoutAdmin()` llama `POST /api/auth/logout` y resetea `isAdmin`/vista a invitado.

### Limitaciones conocidas

- Un solo admin "con nombre" por diseño (via `ADMIN_USERNAME`); no hay gestión de múltiples usuarios admin desde la app.
- Sin refresh token: sesión muere a la hora en punto, sin aviso previo en el frontend.
- Sin revocación server-side de JWT: robar la cookie o el token del body de `/login` da acceso hasta que expira (1h), incluso después de "cerrar sesión" en otro cliente.
- `RolesGuard` está hardcodeado a `role === 'admin'`; agregar un segundo rol con permisos distintos requeriría tocar ese guard.
- El formulario de login arranca vacío (`app.component.ts:46-47`); ya no precarga `admin`/`admin123` (versión anterior lo hacía, `setup-admin.ts` purga ese usuario legado igualmente).

---

## Notas

- WhatsApp por defecto: `59028922` (se sobrescribe si el producto define su propio número).
- Tests: se ejecutan con `NODE_ENV=test`, que usa SQLite en memoria (`sql.js`); en ejecución real se usa PostgreSQL.
- El logo de la pestaña del navegador es `frontend/src/assets/logo.png`.
