# Telegram bridge on Amvera

This deploy target is the existing Telegram/API bridge in `bot/bot.mjs`. It is separate from the root Compose stack, which runs the Fastify/PostgreSQL/MinIO backend. For this first migration step, keep the Mini App on GitHub Pages and run only the bridge on Amvera.

## What is included

- `amvera.yaml` builds `bot/Dockerfile`, exposes container port `4040`, and mounts persistent storage at `/data`.
- The Docker build context must be the repository root: the Dockerfile installs root runtime dependencies and copies `packages/story-engine/src`.
- The image does not copy `bot/data/db.json` or `bot/generated`; configure both data paths under `/data` in Amvera.
- Keep a single running replica. Telegram `getUpdates` long polling and the JSON database are not safe for multiple concurrent bot instances.

## Configure Amvera (do not switch production users yet)

1. Create a separate Amvera application for the bridge and connect/build from this repository only when you are ready. Do not add the real bot token to Git or a checked-in `.env` file.
2. Confirm the source folder/build context is the repository root so `bot/Dockerfile`, root `package.json`/`package-lock.json`, and `packages/story-engine/src` are available.
3. In the app's protected environment settings, add the non-secret values from `.env.example`. Replace `PUBLIC_BRIDGE_URL` with the HTTPS domain assigned to this Amvera app (no trailing slash). Keep `WEB_APP_URL` at the current GitHub Pages URL.
4. Add `TELEGRAM_BOT_TOKEN` only to protected Amvera secrets, using a separate test bot for initial polling validation. Add any provider keys only when separately approved; keep `AI_MOCK_MODE=true` during smoke tests.
5. Keep exactly one replica. Leave the real bot's Telegram Web App URL and DNS unchanged until the test app has passed verification and a separate migration decision is made.

Required environment settings:

- `NODE_ENV=production`, `PORT=4040`
- `SKIP_TUNNELS=true`, `DISABLE_PROXY=true`
- `PUBLIC_BRIDGE_URL=https://<assigned-app-domain>`
- `WEB_APP_URL=https://x9x9x9www.github.io/moya-skazka/?v=4.4`
- `CORS_ALLOWED_ORIGINS=https://x9x9x9www.github.io` (comma-separated explicit origins only; no `*`)
- `BOT_DATA_DIR=/data`, `BOT_DB_FILE=/data/db.json`, `BOT_GENERATED_DIR=/data/generated`
- `AI_MOCK_MODE=true`

`PORT` is set to `4040` to match `run.containerPort`; if Amvera requires a different container port for the application, set both to the same value.

## Safe verification

1. Check Amvera build and runtime logs for startup errors. Never paste tokens or provider credentials into logs/issues.
2. Request `https://<assigned-app-domain>/health`; expect JSON with `status: "ok"`.
3. From the GitHub Pages app, verify browser requests reach the stable bridge and that `/api` responses contain `Access-Control-Allow-Origin: https://x9x9x9www.github.io`. A random origin must not receive that header.
4. With `AI_MOCK_MODE=true`, verify the API/UI flow without a paid provider call. Do not upload or send real children's photographs to an external provider.
5. Verify Telegram polling only with the separate test bot. Ensure its `/app` link uses `PUBLIC_BRIDGE_URL`; do not update the real bot or BotFather settings as part of this preparation.
6. If a test creates a database record or generated image, verify the files remain after an Amvera application restart. Treat all such data as personal data and do not copy production data into this test app.

The current bot uses a local JSON file rather than a transactional database; the persistent mount protects it across restarts but does not make concurrent replicas safe. Back up `/data` before any future data migration. No Amvera deployment, Telegram URL change, DNS change, or live paid generation is performed by this repository preparation.
