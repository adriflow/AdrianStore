#!/usr/bin/env bash
# Despliegue de AdrianStore en un servidor Debian/Ubuntu.
#
# Requisitos previos:
#   1. Tener el repositorio clonado en /opt/adrianstore
#   2. Tener Node.js 18+ y PostgreSQL instalados y corriendo
#   3. Crear /opt/adrianstore/backend/.env (copia de backend/.env.example
#      con tus valores reales: DB, JWT_SECRET, ADMIN_PASSWORD, BACKEND_URL,
#      FRONTEND_URL con tu dominio HTTPS)
#   4. Apuntar el DNS de tu dominio a la IP del servidor
#
# Uso (como root o con sudo):
#   ./deploy/deploy.sh tu-dominio.com

set -euo pipefail

DOMAIN="${1:-adrianstore.com}"
APP_DIR="/opt/adrianstore"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
SERVICE_NAME="adrianstore-backend"
SERVICE_USER="adrianstore"

echo "==> Desplegando AdrianStore en $APP_DIR (dominio: $DOMAIN)"

# 1) Usuario de servicio
if ! id "$SERVICE_USER" &>/dev/null; then
  useradd --system --create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
fi

# 2) Carpetas
mkdir -p "$BACKEND_DIR" "$FRONTEND_DIR" "$BACKEND_DIR/uploads"

# 3) Verificar .env
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "ERROR: falta $BACKEND_DIR/.env"
  echo "Copia backend/.env.example a $BACKEND_DIR/.env y completa:"
  echo "  DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, BACKEND_URL, FRONTEND_URL"
  echo "Genera el JWT_SECRET con: openssl rand -hex 48"
  exit 1
fi

# 4) Backend: dependencias + build
echo "==> Backend: npm ci + build"
cd "$BACKEND_DIR"
npm ci --omit=dev
npm run build

# 5) Frontend: dependencias + build de producción
echo "==> Frontend: npm ci + build de producción"
cd "$FRONTEND_DIR"
npm ci
npx ng build --configuration production

# 6) Permisos de uploads
chown -R "$SERVICE_USER:$SERVICE_USER" "$BACKEND_DIR/uploads"

# 7) Crear el admin con la credencial del .env (y eliminar admin123)
echo "==> Configurando usuario administrador"
node "$BACKEND_DIR/dist/setup-admin.js"

# 8) Servicio systemd
echo "==> Instalando servicio systemd"
sed -e "s|/opt/adrianstore|$APP_DIR|g" "$APP_DIR/deploy/adrianstore-backend.service" > "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
echo "==> Servicio activo. Logs: journalctl -u $SERVICE_NAME -f"

# 9) Caddy (HTTPS automático con Let's Encrypt)
if ! command -v caddy &>/dev/null; then
  echo "==> Instalando Caddy"
  apt-get update
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

sed -e "s|adrianstore.com|$DOMAIN|g" -e "s|/opt/adrianstore|$APP_DIR|g" "$APP_DIR/deploy/Caddyfile" > /etc/caddy/Caddyfile
systemctl restart caddy

echo ""
echo "==> Despliegue completado."
echo "    Sitio:        https://$DOMAIN"
echo "    API:          https://$DOMAIN/api"
echo "    Logs backend: journalctl -u $SERVICE_NAME -f"
echo "    Recuerda abrir los puertos 80/443 en el firewall del servidor."
