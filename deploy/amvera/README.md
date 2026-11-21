# Развёртывание Telegram-бота и ИИ-моста на Amvera

Данная конфигурация разворачивает бэкенд Telegram-бота и API-мост генерации сказок (`bot/bot.mjs`) в облаке Amvera. Фронтенд Mini App при этом работает на GitHub Pages.

---

## 1. Сборочная конфигурация

- `amvera.yaml` и корневой `Dockerfile` собирают контейнер на базе `node:22-alpine`.
- Контейнер слушает внутренний порт **4040** (`PORT=4040`).
- Директория `/data` монтируется как постоянное хранилище (Persistent Volume) для сохранения базы данных `db.json` и сгенерированных ассетов.
- **Важно:** запускайте ровно **1 реплику** (Telegram Long Polling не поддерживает одновременную работу нескольких экземпляров).

---

## 2. Переменные окружения в панели Amvera

В панели управления Amvera перейдите в ваш проект -> вкладка **«Переменные»** и задайте:

| Переменная | Значение | Описание |
|---|---|---|
| `NODE_ENV` | `production` | Режим работы |
| `PORT` | `4040` | Порт контейнера |
| `SKIP_TUNNELS` | `true` | Отключает локальные туннели (Pinggy, Cloudflare, LocalTunnel) |
| `DISABLE_PROXY` | `true` | Прямое соединение без локального прокси |
| `PUBLIC_BRIDGE_URL` | `https://<ваш-домен>.amvera.io` | HTTPS-домен, выданный сервисом Amvera |
| `WEB_APP_URL` | `https://x9x9x9www.github.io/moya-skazka/?v=4.4` | URL вашего Telegram Mini App |
| `CORS_ALLOWED_ORIGINS` | `https://x9x9x9www.github.io` | Разрешенный домен для CORS-запросов |
| `BOT_DATA_DIR` | `/data` | Путь к постоянному хранилищу |
| `BOT_DB_FILE` | `/data/db.json` | База данных пользователей и сказок |
| `BOT_GENERATED_DIR` | `/data/generated` | Директория сгенерированных медиа |
| `TELEGRAM_BOT_TOKEN` | `ваш_токен_от_BotFather` | Токен Telegram-бота |
| `TELEGRAM_BOT_USERNAME` | `My_SSSkaska_bot` | Юзернейм бота |
| `AI_MOCK_MODE` | `false` | **false** для работы с реальными нейросетями |
| `AI_TEXT_PROVIDER` | `wellflow` | Провайдер текста (wellflow или openai) |
| `AI_IMAGE_PROVIDER` | `wellflow` | Провайдер картинок |
| `WELLFLOW_API_URL` | `https://api.wellflow.dev/v1` | URL API нейросетей |
| `WELLFLOW_TEXT_KEY` | `wf_...` | API ключ для генерации текста |
| `WELLFLOW_TEXT_MODEL` | `gpt-6-luna` | Модель генерации историй |
| `WELLFLOW_IMAGE_KEY` | `wf_...` | API ключ для генерации иллюстраций |
| `WELLFLOW_IMAGE_MODEL` | `nano-banana-2` | Модель генерации картинок |

---

## 3. Проверка после развёртывания

1. **Проверка логов в Amvera**:
   Убедитесь, что в логах приложения отображается:
   ```
   [API Bridge] ⚡️ Локальный сервер запущен на порту 4040
   [AI Config] 🧠 Режим генерации: ⚡️ LIVE нейросеть (gpt-6-luna / nano-banana-2)
   [Bot] ✅ Успешно авторизован: @My_SSSkaska_bot
   [Bot] 📱 Настройка глобальной кнопки Telegram Mini App: https://...
   ```
2. **Проверка доступности Healthcheck**:
   Откройте в браузере: `https://<ваш-домен>.amvera.io/health`  
   Должен вернуться ответ:
   ```json
   { "status": "ok", "providers": { "text": "wellflow", "image": "wellflow" } }
   ```
3. **Проверка в Telegram**:
   - Нажмите `/start` в боте и откройте Mini App по кнопке меню.
   - Запустите генерацию новой сказки: она создастся реальной нейросетью, а иллюстрации отобразятся в читалке.
