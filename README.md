# AdrianStore

Catálogo en línea de AdrianStore: tienda personal con productos seleccionados y pedidos directos por WhatsApp.

| Capa       | Tecnología                                        |
|------------|---------------------------------------------------|
| Backend    | NestJS 10 · TypeScript · Drizzle ORM · JWT        |
| Base de datos | PostgreSQL (en producción) · SQLite en tests    |
| Frontend   | Angular 16 · Tailwind CSS 3 · RxJS                |
| Seguridad  | Helmet/CSP · bcrypt · throttling · validación de archivos |

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
│   ├── deploy.sh       # Script de instalación en servidor Debian/Ubuntu
│   ├── Caddyfile       # Reverse proxy con HTTPS automático (recomendado)
│   ├── nginx.conf      # Alternativa para nginx + Let's Encrypt
│   └── adrianstore-backend.service  # Servicio systemd
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
- PostgreSQL (probado con PostgreSQL 18); crear una base de datos llamada `adrianstore`.
- Angular CLI (se instala con las dependencias del frontend).

---

## Puesta en marcha (desarrollo)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # ajustar valores (DB, JWT_SECRET, etc.)
npm run start:dev      # http://localhost:3000
```

Variables de entorno (`backend/.env`):

| Variable                | Descripción                                    | Default                 |
|-------------------------|------------------------------------------------|-------------------------|
| `PORT`                  | Puerto del backend                             | `3000`                  |
| `NODE_ENV`              | `production` activa CSP estricto, cookies `secure` y oculta Swagger | `development` |
| `DB_HOST` / `DB_PORT`   | Host y puerto de PostgreSQL                    | `localhost` / `5432`    |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales y nombre de la base de datos | `postgres` / - / `adrianstore` |
| `JWT_SECRET`            | Secreto para firmar tokens (**obligatorio**)   | -                       |
| `BACKEND_URL`           | URL pública del backend (para URLs de imágenes) | `http://localhost:3000` |
| `FRONTEND_URL`          | Origen permitido (CORS y validación de origen) | `http://localhost:4200` |
| `ADMIN_USERNAME`        | Usuario administrador (`npm run setup:admin`)  | `adrian0502`            |
| `ADMIN_PASSWORD`        | Contraseña del administrador                   | -                       |
| `THROTTLE_LIMIT` / `THROTTLE_TTL` | Límite global de peticiones por minuto | `20` / `60000` |
| `LOGIN_THROTTLE_LIMIT` / `LOGIN_THROTTLE_TTL` | Límite de intentos de login | `5` / `60000` |

> Las tablas (`products`, `users`, `about`) se crean automáticamente al arrancar.

### 2. Configurar el administrador

El usuario admin **ya no se crea con el seed**. Usa:

```bash
cd backend
npm run setup:admin    # lee ADMIN_USERNAME / ADMIN_PASSWORD del .env
```

Esto crea o actualiza el administrador y elimina el usuario legado `admin123` si existiera.

### 3. Datos de ejemplo (opcional)

```bash
cd backend
npm run seed           # inserta 4 productos de ejemplo
npm run clean          # vacía la base de datos sin borrar la estructura
```

### 4. Frontend

```bash
cd frontend
npm install
npm start              # http://localhost:4200
```

---

## Scripts útiles

### Backend (`backend/`)

| Comando             | Descripción                                   |
|---------------------|-----------------------------------------------|
| `npm run start:dev` | Ejecuta el backend en modo desarrollo         |
| `npm run build`     | Compila a `dist/` (TypeScript)                |
| `npm run test`      | Tests e2e (Jest + supertest, SQLite en memoria) |
| `npm run seed`      | Inserta productos de ejemplo                  |
| `npm run clean`     | Vacía productos, usuarios y "Sobre mí"        |
| `npm run setup:admin` | Crea/actualiza el admin desde el `.env`     |

### Frontend (`frontend/`)

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo en `http://localhost:4200` |
| `npm run build` | Compila la aplicación |
| `npx ng build --configuration production` | Compila con `environment.prod.ts`, optimización y hashing |

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

El kit está en la carpeta `deploy/`. Pasos:

1. Crea el repo clonado en el servidor en `/opt/adrianstore` (Debian/Ubuntu, Node 18+, PostgreSQL).
2. Crea `backend/.env` a partir de `backend/.env.example` con valores reales:
   - `JWT_SECRET` generado con `openssl rand -hex 48`
   - `ADMIN_PASSWORD` con una contraseña fuerte
   - `BACKEND_URL` y `FRONTEND_URL` con tu dominio HTTPS
3. Compila el frontend apuntando al dominio real: edita `frontend/src/environments/environment.prod.ts` y ejecuta `ng build --configuration production`.
4. Ejecuta `./deploy/deploy.sh tudominio.com`.
5. Abre los puertos 80/443 en el firewall y apunta el DNS del dominio al servidor.

`deploy.sh` instala y compila el backend y el frontend, configura el admin (`setup-admin`), crea el servicio `adrianstore-backend` (systemd) e instala **Caddy** con HTTPS automático (Let's Encrypt). Como alternativa, `nginx.conf` cubre el mismo escenario con nginx.

---

## Roles

- **Admin**: inicia sesión con `ADMIN_USERNAME`/`ADMIN_PASSWORD`. Accede al panel para crear, editar y eliminar productos, y editar "Sobre mí".
- **Invitado**: solo ve el catálogo y abre WhatsApp para hacer pedidos.

---

## Notas

- WhatsApp por defecto: `59028922` (se sobrescribe si el producto define su propio número).
- Tests: se ejecutan con `NODE_ENV=test`, que usa SQLite en memoria (`sql.js`); en ejecución real se usa PostgreSQL.
- El logo de la pestaña del navegador es `frontend/src/assets/logo.png`.
