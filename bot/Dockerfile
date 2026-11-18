FROM node:22.19-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --workspaces=false

COPY bot/bot.mjs bot/tunnelPriority.mjs bot/appUrls.mjs bot/runtimeConfig.mjs bot/lifecycle.mjs ./bot/
COPY packages/story-engine/src ./packages/story-engine/src

ENV NODE_ENV=production
EXPOSE 4040
CMD ["node", "bot/bot.mjs"]
