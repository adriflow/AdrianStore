# Build context = raíz del repo (monorepo pnpm), no backend/:
#   docker build -f backend/Dockerfile -t adrianstore-backend .
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend backend
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile --filter adrianstore-backend...
RUN pnpm --filter adrianstore-backend run build
# pnpm deploy aísla el paquete backend con su node_modules ya "flattened" (sin symlinks al store),
# listo para copiar tal cual a la imagen final.
RUN pnpm --filter adrianstore-backend --prod deploy /out

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./package.json
COPY --from=build /app/backend/dist ./dist
RUN mkdir -p uploads
EXPOSE 3000
CMD ["node", "dist/main.js"]
