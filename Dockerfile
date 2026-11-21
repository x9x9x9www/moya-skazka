FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --workspaces=false

COPY bot/ ./bot/
COPY packages/story-engine/ ./packages/story-engine/

ENV NODE_ENV=production
EXPOSE 4040
CMD ["node", "bot/bot.mjs"]
