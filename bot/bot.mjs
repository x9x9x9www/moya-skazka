// Telegram Bot & AI Bridge Runner for «Моя сказка»
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

// Автоматическая загрузка переменных из .env
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...vals] = trimmed.split('=');
          const val = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
          process.env[key.trim()] = val;
        }
      }
      break;
    }
  }
}
loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('[Bot] Критическая ошибка: TELEGRAM_BOT_TOKEN не найден в .env!');
  process.exit(1);
}

const WEB_APP_BASE_URL = process.env.WEB_APP_URL || 'https://x9x9x9www.github.io/moya-skazka/?v=2.2';
const WELLFLOW_API_URL = process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1';
const WELLFLOW_TEXT_KEY = process.env.WELLFLOW_TEXT_KEY || '';
const WELLFLOW_TEXT_MODEL = process.env.WELLFLOW_TEXT_MODEL || 'gpt-6-astra';
const WELLFLOW_IMAGE_KEY = process.env.WELLFLOW_IMAGE_KEY || '';
const WELLFLOW_IMAGE_MODEL = process.env.WELLFLOW_IMAGE_MODEL || 'nano-banana-2';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BRIDGE_PORT = 4040;
let publicTunnelUrl = '';

// ========================================================
// 1. СИСТЕМНЫЙ ПРОМПТ ДЛЯ ПЕРСОНАЛЬНОЙ СКАЗКИ
// ========================================================
const WELLFLOW_STORY_SYSTEM_PROMPT = `You are an award-winning Russian children's book author and child psychologist. Generate a personalized, therapeutic bedtime fairytale for a child aged 2–6 strictly as a valid JSON object without Markdown wrappers.

### RULES:
1. Warm, natural literary RUSSIAN for all user-facing text (title, scenes, questions).
2. Anti-cliché: never start with "Жил-был" or "Однажды". Start directly with the provided opening_hook.
3. Write exactly 4 scenes (2–3 cozy, vivid sentences each):
   - Scene 1: Hook, cozy setting, meeting companion.
   - Scene 2: Small obstacle or emotional challenge (triggers Question 1).
   - Scene 3: Kind, creative climax where the child's good traits shine.
   - Scene 4: Safe, comforting return and peaceful sleepiness.
4. Include 2 warm discussion questions for parent and child (after scene 2 and scene 4).
5. For each scene, include image_prompt in English (1 descriptive sentence + "Whimsical cozy 2D digital watercolor and gouache children's book illustration, warm natural palette, gentle storybook look, no text").

### JSON CONTRACT:
{
  "title": "Название сказки на русском",
  "scenes": [
    { "index": 1, "text": "Текст сцены 1 на русском...", "image_prompt": "English scene prompt..." },
    { "index": 2, "text": "Текст сцены 2 на русском...", "image_prompt": "English scene prompt..." },
    { "index": 3, "text": "Текст сцены 3 на русском...", "image_prompt": "English scene prompt..." },
    { "index": 4, "text": "Текст сцены 4 на русском...", "image_prompt": "English scene prompt..." }
  ],
  "questions": [
    { "after_scene": 2, "question": "Вопрос на русском...", "parent_hint": "Подсказка родителю...", "skill": "emotions" },
    { "after_scene": 4, "question": "Финальный вопрос на русском...", "parent_hint": "Подсказка родителю...", "skill": "empathy" }
  ]
}`;

// ========================================================
// 2. ВЫЗОВЫ WELLFLOW API (Node.js без ограничений CORS)
// ========================================================
async function generateWellflowStoryAI(params) {
  console.log(`[Wellflow] ✍️ Генерация сюжета через ${WELLFLOW_TEXT_MODEL} для: ${params.childName || 'Малыш'} (${params.age || 4} г.)...`);

  const mainInterest = (params.interests && params.interests[0]) || 'Волшебство';
  const openingHooks = {
    Динозавры: 'В комнате пахло сладкими сушёными яблоками и тёплым пледом, когда под мягким ковриком тихонько хрустнула сказочная скорлупка.',
    Космос: 'За круглым окном вспыхнула крошечная золотая звёздочка, оставив в вечернем небе тонкий искрящийся хвостик.',
    Машинки: 'На ковре тихонько заурчал маленький моторчик, а фары крошечной машинки осветили дорогу к волшебному туннелю.',
    Животные: 'В раскрытую форточку заглянул пушистый рыжий лучик солнца и мягко пощекотал носик.',
    Волшебство: 'Из резного деревянного сундучка выпорхнула звонкая синяя бабочка, осыпая вокруг мерцающую пыльцу.',
    Природа: 'Капелька утренней росы на подоконнике отразила весь огромный зелёный лес за окном.',
  };
  const hook = openingHooks[mainInterest] || 'В тихой вечерней комнате послышался ласковый перелив колокольчика.';

  const userPrompt = `Входные данные для генерации персонализированной сказки:
- Имя ребёнка: ${params.childName || 'Малыш'}
- Пол: ${params.gender === 'girl' ? 'девочка' : 'мальчик'}
- Возраст: ${params.age || 4} года/лет
- Внешность: ${params.appearance?.hairColor || 'светлые'} ${params.appearance?.hairType || 'кудрявые'} волосы, одет в ${params.appearance?.clothingColor || 'изумрудный'} ${params.appearance?.clothingItem || 'свитер'}
- Любимая игрушка-спутник: ${params.appearance?.toy || 'плюшевый динозаврик'}
- Главная тема: "${params.theme || 'Доброта и дружба'}"
- Интересы: ${(params.interests || []).join(', ') || 'сказки'}
- Характер: ${params.personality || 'Добрый'}
- Особые пожелания: ${params.customWishes ? `"${params.customWishes}"` : 'нет'}
- opening_hook: ${hook}
- plot_archetype: Преодоление маленького препятствия с помощью дружбы и доброты
- atmosphere_seed: Тёплый вечер, мягкий свет, шелест трав, аромат яблочного пирога и лесной мяты

Строго следуй системной инструкции и верни валидный JSON по указанному контракту!`;

  const res = await fetch(`${WELLFLOW_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WELLFLOW_TEXT_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: WELLFLOW_TEXT_MODEL,
      messages: [
        { role: 'system', content: WELLFLOW_STORY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Wellflow GPT-6-Astra error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content returned from Wellflow GPT-6-Astra');

  const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleaned);
  console.log(`[Wellflow] ✅ Сюжет успешно сгенерирован: «${parsed.title}» (сцен: ${parsed.scenes?.length || 0})`);
  return parsed;
}

async function generateWellflowImageAI(prompt) {
  console.log(`[Wellflow] 🎨 Генерация иллюстрации через ${WELLFLOW_IMAGE_MODEL}...`);

  const styleTemplate = `A whimsical, cozy 2D digital watercolor and gouache children's book illustration of [SCENE]. The art style is heartwarming, playful, and natural, with visible gentle paper grain, textured brushwork, and soft sketchy dark brown outlines (no harsh black outlines). Rich, warm natural color palette with deep forest greens, earthy browns, warm gold, and sunset/dusk glows. Enchanting, gentle magical lighting with golden hour glimmers, glowing particles, tiny sparkles, and fireflies hovering around. The background is densely packed and richly detailed, featuring oversized fairytale foliage, curly whimsical trees, glowing mushrooms, and blooming fantasy flora, creating a layered, hand-crafted environment with soft atmospheric perspective. Cute, rounded 2D character designs with highly expressive, large warm eyes and friendly, gentle features. Everything has a safe, comforting, nostalgic, and adventurous storybook look, ideal for young children. Natural camera angle, cinematic focus. No text.`;

  const finalPrompt = (prompt || '').includes('watercolor and gouache')
    ? prompt
    : styleTemplate.replace('[SCENE]', prompt);

  const res = await fetch(`${WELLFLOW_API_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WELLFLOW_IMAGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: WELLFLOW_IMAGE_MODEL,
      prompt: finalPrompt,
      n: 1,
      size: '1024x1024',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Wellflow Nano-Banana-2 error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const url = data.imageUrl || data.data?.[0]?.url;
  if (!url) throw new Error('No image URL in Wellflow Nano-Banana-2 response');

  console.log(`[Wellflow] ✅ Иллюстрация готова: ${url.slice(0, 70)}...`);
  return url;
}

// Хранилище фоновых задач генерации
const jobs = new Map();

// Очистка старых задач каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 10 * 60 * 1000) {
      jobs.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ========================================================
// 3. СЕРВЕРНЫЙ МОСТ ДЛЯ MINI APP (CORS, Proxy, Job Queue)
// ========================================================
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', provider: 'wellflow', models: { text: WELLFLOW_TEXT_MODEL, image: WELLFLOW_IMAGE_MODEL } }));
    return;
  }

  // Проверка статуса фоновой задачи (быстрый GET 5мс)
  if (url.pathname === '/api/v1/ai/job-status' && req.method === 'GET') {
    const jobId = url.searchParams.get('id');
    const job = jobs.get(jobId);
    if (!job) {
      const notFoundStr = JSON.stringify({ status: 'not_found' });
      res.writeHead(404, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(notFoundStr),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(notFoundStr);
      return;
    }
    const jsonStr = JSON.stringify(job);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(jsonStr),
      'Access-Control-Allow-Origin': '*',
    });
    res.end(jsonStr);
    return;
  }

  // Генерация сюжета через GPT-6-Astra (мгновенный 202 ответ + опрос)
  if (url.pathname === '/api/v1/ai/generate-story' && req.method === 'POST') {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const params = JSON.parse(bodyStr || '{}');

      const jobId = 'story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      jobs.set(jobId, { status: 'pending', createdAt: Date.now(), progress: 'Генерация сюжета в GPT-6-Astra...' });

      // Запуск в фоне
      generateWellflowStoryAI(params)
        .then(story => {
          jobs.set(jobId, { status: 'ready', story, createdAt: Date.now() });
        })
        .catch(err => {
          console.error('[API Bridge Error generate-story]:', err.message);
          jobs.set(jobId, { status: 'error', error: err.message, createdAt: Date.now() });
        });

      // Мгновенный ответ клиенту (менее 10мс!)
      const jsonStr = JSON.stringify({ jobId, status: 'pending' });
      res.writeHead(202, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(jsonStr),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(jsonStr);
    } catch (err) {
      console.error('[API Bridge Error generate-story]:', err.message);
      const errStr = JSON.stringify({ error: err.message });
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(errStr),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(errStr);
    }
    return;
  }

  // Генерация иллюстрации через Nano-Banana-2 (мгновенный 202 ответ + опрос)
  if (url.pathname === '/api/v1/ai/generate-image' && req.method === 'POST') {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const { prompt } = JSON.parse(bodyStr || '{}');

      const jobId = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      jobs.set(jobId, { status: 'pending', createdAt: Date.now(), progress: 'Создание иллюстрации в Nano-Banana-2...' });

      generateWellflowImageAI(prompt)
        .then(imageUrl => {
          jobs.set(jobId, { status: 'ready', imageUrl, createdAt: Date.now() });
        })
        .catch(err => {
          console.error('[API Bridge Error generate-image]:', err.message);
          jobs.set(jobId, { status: 'error', error: err.message, createdAt: Date.now() });
        });

      const jsonStr = JSON.stringify({ jobId, status: 'pending' });
      res.writeHead(202, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(jsonStr),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(jsonStr);
    } catch (err) {
      console.error('[API Bridge Error generate-image]:', err.message);
      const errStr = JSON.stringify({ error: err.message });
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(errStr),
        'Access-Control-Allow-Origin': '*',
      });
      res.end(errStr);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(BRIDGE_PORT, '0.0.0.0', () => {
  console.log(`[API Bridge] ⚡️ Локальный сервер запущен на порту ${BRIDGE_PORT}`);
});

// ========================================================
// 4. ЗАПУСК БЫСТРОГО И НАДЁЖНОГО HTTPS ТУННЕЛЯ (Serveo)
// ========================================================
function startTunnel() {
  console.log('[Tunnel] 🌐 Запуск защищённого HTTPS туннеля через Serveo...');
  const child = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=15',
    '-o', 'ServerAliveCountMax=10',
    '-R', `80:localhost:${BRIDGE_PORT}`,
    'serveo.net',
  ]);

  const handleData = async (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9.-]+\.serveousercontent\.com/);
    if (match && match[0] && match[0] !== publicTunnelUrl) {
      publicTunnelUrl = match[0];
      console.log(`[Tunnel] 🚀 HTTPS туннель активен: ${publicTunnelUrl}`);
      try {
        fs.writeFileSync(path.resolve(process.cwd(), '.tunnel_url'), publicTunnelUrl);
      } catch {}
      await updateChatMenuWithApi(publicTunnelUrl);
    }
  };

  child.stdout.on('data', handleData);
  child.stderr.on('data', handleData);

  child.on('close', (code) => {
    console.log(`[Tunnel] Туннель завершился (код: ${code}), перезапуск через 3 сек...`);
    setTimeout(startTunnel, 3000);
  });
}
startTunnel();

// ========================================================
// 5. ВЗАИМОДЕЙСТВИЕ С TELEGRAM API
// ========================================================
async function callTelegram(method, params = {}) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Bot] Ошибка вызова ${method}:`, err.message);
    return null;
  }
}

function getAppUrlWithApi(apiUrl) {
  const base = WEB_APP_BASE_URL;
  const target = apiUrl || publicTunnelUrl;
  if (!target) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}api_url=${encodeURIComponent(target)}`;
}

async function updateChatMenuWithApi(apiUrl) {
  const targetUrl = getAppUrlWithApi(apiUrl);
  console.log(`[Bot] 📱 Настройка кнопки Telegram Mini App: ${targetUrl}`);
  const res = await callTelegram('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Моя сказка ✨',
      web_app: { url: targetUrl },
    },
  });
  if (res && res.ok) {
    console.log('[Bot] ✅ Кнопка меню чата Telegram синхронизирована с ИИ-мостом');
  }
}

async function sendWelcome(chatId, firstName, startParam) {
  const currentAppUrl = getAppUrlWithApi(publicTunnelUrl);
  let message = `Привет, ${firstName || 'дорогой родитель'}! ✨\n\n` +
    `Добро пожаловать в **«Моя сказка»** — уютное приложение для создания персональных терапевтических сказок на ночь для детей 2–6 лет.\n\n`;

  if (startParam && startParam.startsWith('ref_')) {
    message += `🎁 **Вы перешли по приглашению друга!**\nВаша первая иллюстрированная история уже ждёт вас.\n\n`;
  }

  message += `🌟 **Создание сказок через ИИ:**\n` +
    `• Текст генерируется нейросетью **GPT-6-Astra** специально под характер ребёнка\n` +
    `• Уютные акварельные иллюстрации рисует **Nano-Banana-2**\n` +
    `• 4 сцены + вопросы для тёплой беседы перед сном\n` +
    `• Первая персональная история — бесплатно!\n\n` +
    `Нажмите кнопку ниже, чтобы открыть сказочный визард! 👇`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '✨ Открыть «Моя сказка»',
          web_app: { url: currentAppUrl },
        },
      ],
      [
        {
          text: '💬 Поддержка',
          url: 'https://t.me/x9x9x9www',
        },
      ],
    ],
  };

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text: message,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// ========================================================
// 6. LONG-POLLING БОТА
// ========================================================
async function startPolling() {
  console.log(`[Bot] Инициализация подключения к Telegram...`);

  const me = await callTelegram('getMe');
  if (!me || !me.ok) {
    console.error('[Bot Error] Не удалось авторизоваться в Telegram API:', me);
    return;
  }

  console.log(`[Bot] ✅ Успешно авторизован: @${me.result.username} (${me.result.first_name}, ID: ${me.result.id})`);
  await updateChatMenuWithApi(publicTunnelUrl);

  let offset = 0;

  while (true) {
    try {
      const updates = await callTelegram('getUpdates', {
        offset,
        timeout: 25,
        allowed_updates: ['message', 'callback_query'],
      });

      if (!updates || !updates.ok) {
        console.error('[Bot Error getUpdates]:', updates?.description || updates);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

      if (Array.isArray(updates.result)) {
        for (const update of updates.result) {
          offset = update.update_id + 1;

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const firstName = update.message.from?.first_name || '';

            console.log(`[Bot] 📩 Новое сообщение от ${firstName} (${chatId}): "${text}"`);

            if (text.startsWith('/start')) {
              const parts = text.split(' ');
              const startParam = parts.length > 1 ? parts[1] : null;
              const res = await sendWelcome(chatId, firstName, startParam);
              console.log(`[Bot] Ответ на /start отправлен:`, res?.ok ? 'OK' : res?.description);
            } else if (text === '/app') {
              const appUrl = getAppUrlWithApi(publicTunnelUrl);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: 'Нажмите кнопку ниже, чтобы открыть визард сказок:',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '✨ Открыть сказки', web_app: { url: appUrl } }],
                  ],
                },
              });
            } else if (text === '/help') {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: '«Моя сказка» создаёт персонализированные иллюстрированные сказки на ночь для детей 2–6 лет.\n\nНажмите кнопку «Моя сказка ✨» внизу экрана для запуска!',
              });
            } else {
              await sendWelcome(chatId, firstName, null);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Bot Polling Error]:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

startPolling();
