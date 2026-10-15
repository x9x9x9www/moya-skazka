FROM node:20-alpine AS builder

WORKDIR /app

# Копируем манифесты
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

RUN npm install

# Копируем исходный код
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

# Сборка пакетов и API
RUN npm run build --workspace=@moya-skazka/shared
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma
RUN npm run build --workspace=@moya-skazka/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
