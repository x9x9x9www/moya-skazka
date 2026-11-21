# VPS beta deployment

This is a separate deployment for the current bridge (`bot/bot.mjs`) and Mini App. It does not use the existing root `docker-compose.yml`, which is the separate Fastify/PostgreSQL/MinIO stack.

## Requirements

- A Linux VPS with Docker Engine and the Docker Compose plugin.
- A domain whose `A`/`AAAA` records point to the VPS. Allow inbound TCP 80/443 and UDP 443; keep port 4040 private.
- Access to configure the Telegram bot and production provider credentials. Do not put secrets in git or logs.

## Configure and start

From the repository root on the VPS:

```sh
cp deploy/vps/.env.vps.example .env.vps
chmod 600 .env.vps
```

Edit `.env.vps`: set `APP_DOMAIN` (hostname only, no scheme/path), the real `TELEGRAM_BOT_TOKEN`, `WELLFLOW_TEXT_KEY`, and `WELLFLOW_IMAGE_KEY`. Keep `AI_MOCK_MODE=true` for initial smoke tests. The keys are read only by the bot container. Do not use actual children’s photos for a live provider test without separate approval; never log images, base64 payloads, or provider keys. The bot image installs only root-level runtime dependencies; it deliberately does not install npm workspaces, whose API dependencies are not needed by this bridge.

Start the isolated VPS stack:

```sh
docker compose --env-file .env.vps -f deploy/vps/docker-compose.yml config
docker compose --env-file .env.vps -f deploy/vps/docker-compose.yml up -d --build
```

Caddy obtains and renews HTTPS certificates automatically. The app is served at `https://APP_DOMAIN/`; Caddy routes `/api/*`, `/media/*`, and `/health` to the bot and all other paths to the static web container. Only Caddy publishes host ports. The bot's JSON database and generated images use named Docker volumes; the deployment does not import, reset, or overwrite any existing local `bot/data/db.json`.

## Verify before switching Telegram

```sh
docker compose --env-file .env.vps -f deploy/vps/docker-compose.yml ps
curl --fail https://APP_DOMAIN/health
```

Then open the site in a browser and verify static assets and `/health`. With mock mode enabled, verify the UI/network path without incurring provider charges. Confirm that Telegram menu and `/app` links point to the stable domain. Only after all checks pass, manually update the Mini App URL in Telegram/BotFather if needed; this repository setup does not change Telegram settings or DNS.

## Backup and restore

Stop the bot before copying its live JSON data to maintain a consistent snapshot. Store backups outside the repository and protect them as personal data:

```sh
mkdir -p /secure-backups/moya-skazka
docker compose --env-file .env.vps -f deploy/vps/docker-compose.yml stop bot
BOT_DATA_VOLUME=project_bot_data # Replace with the actual name from `docker volume ls`.
docker run --rm -v "$BOT_DATA_VOLUME:/data" -v /secure-backups/moya-skazka:/backup alpine \
  tar czf /backup/bot-data-$(date +%Y%m%d-%H%M%S).tgz -C /data .
BOT_GENERATED_VOLUME=project_bot_generated # Replace with the actual name from `docker volume ls`.
docker run --rm -v "$BOT_GENERATED_VOLUME:/data" -v /secure-backups/moya-skazka:/backup alpine \
  tar czf /backup/bot-generated-$(date +%Y%m%d-%H%M%S).tgz -C /data .
docker compose --env-file .env.vps -f deploy/vps/docker-compose.yml start bot
```

Set both volume variables to the actual names shown by `docker volume ls`; Compose project names affect the volume prefix. For restore, stop the stack and extract the desired archive into the matching volume; first take a backup of the current volume and never extract over live data. Keep `.env.vps` in a separate protected backup. Periodically test restoration to a separate volume.

## Roll back

Keep the previous image/tag or git revision and a verified data backup. Roll back the code by checking out the known-good revision and rebuilding/restarting this compose file. Do not use `down -v`: it deletes the named data volumes. Restore a backup only when necessary, with the bot stopped and the current volume separately preserved. If the new instance fails, keep Telegram pointed at the last known-good URL until the replacement passes checks.
