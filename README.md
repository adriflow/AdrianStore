# AdrianStore

Proyecto AdrianStore con backend en NestJS, frontend en Angular y base de datos PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL (probado con PostgreSQL 18)
- Una base de datos llamada `adrianstore` ya creada

## Backend

Ruta: `backend`

1. Instalar dependencias:

```bash
cd backend
npm install
```

2. Configurar el entorno: copia `.env.example` a `.env` y ajusta tus credenciales:

```bash
cp .env.example .env
```

| Variable      | Descripción                              | Default         |
|---------------|------------------------------------------|-----------------|
| `PORT`        | Puerto del backend                       | `3000`          |
| `DB_HOST`     | Host de PostgreSQL                       | `localhost`     |
| `DB_PORT`     | Puerto de PostgreSQL                     | `5432`          |
| `DB_USER`     | Usuario de PostgreSQL                    | `postgres`      |
| `DB_PASSWORD` | Contraseña de PostgreSQL                 | -               |
| `DB_NAME`     | Nombre de la base de datos               | `adrianstore`   |
| `JWT_SECRET`  | Secreto para firmar tokens               | -               |
| `BACKEND_URL` | URL pública del backend (para imágenes)  | `http://localhost:3000` |
| `FRONTEND_URL`| Origen permitido en CORS                 | `http://localhost:4200` |

> Las tablas `products` y `users` se crean automáticamente al arrancar el backend.

3. Sembrar datos iniciales (4 productos de ejemplo + usuario admin):

```bash
npm run seed
```

El usuario admin creado es `admin123` / `admin123`.

4. Ejecutar en modo desarrollo:

```bash
npm run start:dev
```

El backend quedará disponible en `http://localhost:3000`.

## Frontend

Ruta: `frontend`

1. Instalar dependencias:

```bash
cd frontend
npm install
```

2. Ejecutar la aplicación:

```bash
npm start
```

El frontend quedará disponible en `http://localhost:4200`.

## Roles

- **Admin**: puede crear, editar y eliminar productos (requiere iniciar sesión).
- **Invitado**: solo puede ver el catálogo y abrir WhatsApp para hacer un pedido.

## API

### Productos (público)

- `GET /api/products` - lista productos, opcional `?type=tecnologia|ropa|alimentos|hogar|deportes|otros`
- `GET /api/products/:id` - obtiene un producto
- `GET /api/products/:id/whatsapp` - enlace de WhatsApp del producto

### Productos (solo admin, requiere token JWT)

- `POST /api/products` - crea un producto con imagen multipart form-data
- `PATCH /api/products/:id` - actualiza un producto (imagen opcional)
- `DELETE /api/products/:id` - elimina un producto

### Autenticación

- `POST /api/auth/login` - inicia sesión `{ username, password }`, devuelve token y setea cookie HttpOnly
- `POST /api/auth/logout` - cierra sesión y limpia la cookie
- `GET /api/auth/me` - información del usuario autenticado (requiere token o cookie)

## Swagger

Una vez arrancado el backend, abre:

```bash
http://localhost:3000/api/docs
```

## Uso

- En el frontend puedes agregar productos con imagen cargada desde tu equipo, tipo de producto, nombre, precio, descripción y número de WhatsApp.
- El catálogo muestra `Todos` y las subcategorías `Tecnología`, `Ropa`, `Alimentos`, `Hogar`, `Deportes`, `Otros`.
- Cada tarjeta permite eliminar el producto o abrir WhatsApp para hacer el pedido.
