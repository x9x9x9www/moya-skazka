// Telegram Bot & AI Bridge Runner for «Моя сказка»
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { shouldActivateTunnel } from './tunnelPriority.mjs';
import {
  buildStoryPrompt,
  chooseStoryDna,
  createSeededRandom,
  normalizeStory,
  buildRepairPrompt,
  buildLengthRepairPrompt,
  buildCoverPrompt,
  buildScenePrompt,
  fallbackQuestions,
} from '../packages/story-engine/src/index.mjs';

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
const SKIP_TELEGRAM = process.env.SKIP_TELEGRAM === 'true';
const SKIP_TUNNELS = process.env.SKIP_TUNNELS === 'true';
if (!BOT_TOKEN) {
  console.error('[Bot] Критическая ошибка: TELEGRAM_BOT_TOKEN не найден в .env!');
  process.exit(1);
}

const WEB_APP_BASE_URL = process.env.WEB_APP_URL || 'https://x9x9x9www.github.io/moya-skazka/?v=2.4';
const WELLFLOW_API_URL = process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1';
const WELLFLOW_TEXT_KEY = process.env.WELLFLOW_TEXT_KEY || '';
const WELLFLOW_TEXT_MODEL = process.env.WELLFLOW_TEXT_MODEL || 'gemini-3.8-flash';
const WELLFLOW_IMAGE_KEY = process.env.WELLFLOW_IMAGE_KEY || '';
const WELLFLOW_IMAGE_MODEL = process.env.WELLFLOW_IMAGE_MODEL || 'nano-banana-2';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BRIDGE_PORT = 4040;
let publicTunnelUrl = process.env.PUBLIC_BRIDGE_URL || '';
let activeTunnelSource = process.env.PUBLIC_BRIDGE_URL ? 'env' : '';
let lastServeoUrl = '';
let lastLocalTunnelUrl = '';

const BOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(BOT_DIR, 'generated');
fs.mkdirSync(GENERATED_DIR, { recursive: true });

// Промпт, Story DNA и контракт сказки живут в packages/story-engine/src/index.mjs

// ========================================================
// 2. ВЫЗОВЫ WELLFLOW API (Node.js без ограничений CORS)
// ========================================================
function parseJsonContent(content) {
  const cleaned = String(content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('JSON object not found');
  return JSON.parse(cleaned.slice(first, last + 1));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms`)), timeoutMs + 1000);
  });
  try {
    return await Promise.race([fetch(url, { ...options, signal: controller.signal }), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function callWellflowChat(messages, label) {
  let res;
  try {
    res = await fetchWithTimeout(`${WELLFLOW_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WELLFLOW_TEXT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: WELLFLOW_TEXT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 4500,
      }),
    }, 90000);
  } catch (error) {
    const cause = error.cause ? ` (${error.cause.code || error.cause.message || error.cause})` : '';
    throw new Error(`${label}: fetch failed: ${error.message}${cause}`);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${label}: ${WELLFLOW_TEXT_MODEL} HTTP ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label}: пустой ответ ${WELLFLOW_TEXT_MODEL}`);
  return content;
}

async function callWithRetry(messages, label, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) console.warn(`[Wellflow] 🔁 ${label}: повторная попытка ${attempt}/${attempts}`);
      return await callWellflowChat(messages, `${label}#${attempt}`);
    } catch (error) {
      lastError = error;
      console.warn(`[Wellflow] ⚠️ ${label}: ${error.message}`);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
}

async function generateWellflowStoryAI(params) {
  const input = { ...params, recentOutlines: params.recentBlacklist || [] };
  const dna = chooseStoryDna(
    input,
    createSeededRandom(`${Date.now()}|${input.childName}|${input.age}|${input.theme}|${input.personality}`)
  );
  const prompt = buildStoryPrompt(input, { dna });

  console.log(
    `[StoryEngine] ✍️ ${WELLFLOW_TEXT_MODEL} для «${input.childName || 'Малыш'}» (${input.age || 4} г.): ` +
      `${dna.world_scale} / ${dna.narrative_engine}`
  );

  const content = await callWithRetry(
    [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    'story',
    2
  );

  let raw;
  try {
    raw = parseJsonContent(content);
  } catch (error) {
    throw new Error(`story: невалидный JSON от ${WELLFLOW_TEXT_MODEL}: ${error.message}`);
  }

  try {
    let story = normalizeStory(raw, input, dna);

    // Если модель написала заметно короче возрастной нормы — расширяем
    // без изменения сюжета. Это лучше, чем отдавать 300 слов вместо 400+.
    if (story.metrics.total_words < story.metrics.target[0]) {
      console.warn(
        `[StoryEngine] 📏 Текст короче цели: ${story.metrics.total_words} < ${story.metrics.target[0]}, запускаем length repair`
      );
      try {
        const lengthRepair = buildLengthRepairPrompt(story, story.metrics.target);
        const expandedContent = await callWithRetry(
          [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
            { role: 'assistant', content },
            { role: 'user', content: lengthRepair },
          ],
          'length-repair',
          2
        );
        const expandedRaw = parseJsonContent(expandedContent);
        const expanded = normalizeStory(expandedRaw, input, dna);
        if (expanded.metrics.total_words > story.metrics.total_words) {
          console.log(`[StoryEngine] ✅ Расширено: ${story.metrics.total_words} → ${expanded.metrics.total_words} слов`);
          story = expanded;
        }
      } catch (lengthError) {
        console.warn(`[StoryEngine] ⚠️ Length repair не удался, оставляем исходный текст: ${lengthError.message}`);
      }
    }

    console.log(
      `[StoryEngine] ✅ «${story.title}»: ${story.metrics.total_words} слов, ` +
        `персонажей ${story.characters.length}, вопросов ${story.questions.length}` +
        (story.warnings.length ? `, warnings: ${story.warnings.join('; ')}` : '')
    );
    return story;
  } catch (error) {
    console.warn(`[StoryEngine] ⚠️ Валидация не прошла: ${(error.issues || [error.message]).join('; ')}`);
    const repair = buildRepairPrompt(raw, error.issues || [error.message]);
    const repairedContent = await callWithRetry(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
        { role: 'assistant', content },
        { role: 'user', content: repair },
      ],
      'repair',
      2
    );
    const repairedRaw = parseJsonContent(repairedContent);
    try {
      const story = normalizeStory(repairedRaw, input, dna);
      console.log(`[StoryEngine] ✅ после repair: «${story.title}» (${story.metrics.total_words} слов)`);
      return story;
    } catch (repairError) {
      if ((repairError.issues || []).some((issue) => /вопрос/i.test(issue))) {
        const patched = { ...repairedRaw, questions: fallbackQuestions(input.childName) };
        const story = normalizeStory(patched, input, dna);
        story.warnings.push('вопросы заменены fallback-вопросами после repair');
        console.warn('[StoryEngine] ⚠️ Вопросы заменены fallback-вопросами');
        return story;
      }
      throw repairError;
    }
  }
}

function getThemedFallbackIllustration(themeOrInterest, _sceneIndex = 0) {
  const t = (themeOrInterest || '').toLowerCase();
  if (t.includes('дино')) {
    return 'https://x9x9x9www.github.io/moya-skazka/illustrations/cover_dino.jpg';
  }
  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('сон')) {
    return 'https://x9x9x9www.github.io/moya-skazka/illustrations/cover_star.jpg';
  }
  return 'https://x9x9x9www.github.io/moya-skazka/illustrations/cover_forest.jpg';
}

async function generateWellflowImageAI(prompt, retries = 2) {
  const models = [WELLFLOW_IMAGE_MODEL, 'nano-banana-pro', 'nano-banana'].filter(Boolean);
  // Story Engine уже добавил 3D Pixar-стиль и character bible. Не оборачиваем
  // промпт в старый акварельный шаблон, иначе стиль сломается.
  const finalPrompt = prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const currentModel = models[attempt] || models[0];
    try {
      console.log(`[Wellflow] 🎨 Генерация иллюстрации через ${currentModel} (попытка ${attempt + 1})...`);
      const res = await fetchWithTimeout(`${WELLFLOW_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WELLFLOW_IMAGE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: currentModel,
          prompt: finalPrompt,
          n: 1,
          size: '1024x1024',
        }),
      }, 90000);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const url = data.imageUrl || data.data?.[0]?.url;
      if (!url) throw new Error('No image URL in response');

      console.log(`[Wellflow] ✅ Иллюстрация готова (${currentModel}): ${url.slice(0, 70)}...`);
      return url;
    } catch (err) {
      console.warn(`[Wellflow] ⚠️ Попытка ${attempt + 1} (${currentModel}) не удалась: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
}

async function saveGeneratedImage(remoteUrl, jobId, name) {
  if (!jobId || !remoteUrl) return remoteUrl;
  try {
    const res = await fetch(remoteUrl, {
      headers: WELLFLOW_IMAGE_KEY ? { Authorization: `Bearer ${WELLFLOW_IMAGE_KEY}` } : {},
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`download HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
    const dir = path.join(GENERATED_DIR, jobId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}${ext}`), buffer);
    if (!publicTunnelUrl) return remoteUrl;
    return `${publicTunnelUrl.replace(/\/$/, '')}/media/${jobId}/${name}${ext}`;
  } catch (error) {
    console.warn(`[Wellflow] ⚠️ Не удалось сохранить ${name} локально: ${error.message}`);
    return remoteUrl;
  }
}

/**
 * Единый серверный конвейер: текст сказки → обложка + 4 сцены.
 * Картинки сохраняются локально в bot/generated/<jobId>/ и отдаются по /media/...
 */
async function generateFullStoryWithImagesAI(params, onProgress, jobId) {
  onProgress?.({
    stage: 'writing',
    progress: 20,
    message: 'Автор придумывает сюжет и character bible...',
  });

  const story = await generateWellflowStoryAI(params);

  if (!story.scenes || !Array.isArray(story.scenes) || story.scenes.length !== 4) {
    throw new Error('Invalid story scenes structure');
  }

  onProgress?.({
    stage: 'drawing',
    progress: 50,
    message: 'Художник создаёт обложку и 4 иллюстрации...',
  });

  const jobs = [
    { name: 'cover', kind: 'cover', prompt: buildCoverPrompt(story), fallback: getThemedFallbackIllustration(params.theme, 0) },
    ...story.scenes.map((scene) => ({
      name: `scene_${scene.index}`,
      kind: 'scene',
      sceneIndex: scene.index,
      prompt: buildScenePrompt(story, scene),
      fallback: getThemedFallbackIllustration(params.interests?.[0] || params.theme, scene.index),
    })),
  ];

  console.log(`[StoryEngine] 🎨 Запуск параллельной генерации 5 изображений для «${story.title}»...`);

  let completedImages = 0;
  await Promise.all(
    jobs.map(async (job) => {
      let url;
      try {
        const remoteUrl = await generateWellflowImageAI(job.prompt);
        url = await saveGeneratedImage(remoteUrl, jobId, job.name);
      } catch (error) {
        console.error(`[StoryEngine] ⚠️ ${job.name}: используем fallback — ${error.message}`);
        url = job.fallback;
      }

      if (job.kind === 'cover') {
        story.cover_url = url;
      } else {
        const scene = story.scenes.find((item) => item.index === job.sceneIndex);
        if (scene) {
          scene.image_url = url;
          scene.image_prompt = scene.visual;
        }
      }

      completedImages += 1;
      const pct = 50 + Math.round((completedImages / jobs.length) * 45);
      onProgress?.({
        stage: 'drawing',
        progress: pct,
        message: `Создаём иллюстрации (${completedImages} из ${jobs.length} готовы)...`,
      });
    })
  );

  // Гарантия: у каждой сцены и обложки есть URL
  if (!story.cover_url) story.cover_url = getThemedFallbackIllustration(params.theme, 0);
  for (const scene of story.scenes) {
    if (!scene.image_url) scene.image_url = getThemedFallbackIllustration(params.interests?.[0] || params.theme, scene.index);
    if (!scene.image_prompt) scene.image_prompt = scene.visual;
  }

  onProgress?.({
    stage: 'finishing',
    progress: 100,
    message: 'Сказка готова!',
  });

  return story;
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

  // Статика сгенерированных иллюстраций: /media/<jobId>/cover.jpg
  if (url.pathname.startsWith('/media/') && req.method === 'GET') {
    const rel = decodeURIComponent(url.pathname.slice('/media/'.length));
    const filePath = path.resolve(GENERATED_DIR, rel);
    if (!filePath.startsWith(GENERATED_DIR + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(data);
    });
    return;
  }

  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
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

  // Полная генерация сказки + всех 4 иллюстраций на сервере (мгновенный 202 ответ + опрос)
  if (url.pathname === '/api/v1/ai/generate-story' && req.method === 'POST') {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const params = JSON.parse(bodyStr || '{}');

      const jobId = 'story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      jobs.set(jobId, {
        status: 'pending',
        stage: 'writing',
        progress: 15,
        message: 'Автор придумывает сюжет и character bible...',
        createdAt: Date.now(),
      });

      // Запуск полного цикла генерации текста + 5 изображений в фоне
      generateFullStoryWithImagesAI(params, (update) => {
        const current = jobs.get(jobId);
        if (current && current.status === 'pending') {
          jobs.set(jobId, { ...current, ...update });
        }
      }, jobId)
        .then((story) => {
          jobs.set(jobId, {
            status: 'ready',
            story,
            stage: 'finishing',
            progress: 100,
            message: 'Сказка готова!',
            createdAt: Date.now(),
          });
        })
        .catch((err) => {
          console.error('[API Bridge Error generate-story]:', err.message, err.cause || '');
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
      console.error('[API Bridge Error generate-story]:', err.message, err.cause || '');
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

  // Генерация одиночной иллюстрации через Nano-Banana-2
  if (url.pathname === '/api/v1/ai/generate-image' && req.method === 'POST') {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const { prompt } = JSON.parse(bodyStr || '{}');

      const jobId = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      jobs.set(jobId, {
        status: 'pending',
        stage: 'drawing',
        progress: 50,
        message: 'Создание иллюстрации в Nano-Banana-2...',
        createdAt: Date.now(),
      });

      generateWellflowImageAI(prompt)
        .then((imageUrl) => {
          jobs.set(jobId, { status: 'ready', imageUrl, progress: 100, createdAt: Date.now() });
        })
        .catch((err) => {
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
// 4. ТУННЕЛИ: localtunnel важнее случайного serveo
// ========================================================
async function activateTunnel(url, source) {
  if (!url) return;
  if (!shouldActivateTunnel(source, activeTunnelSource)) {
    console.log(`[Tunnel] ${source} не активирован: приоритет ниже ${activeTunnelSource || '—'}`);
    return;
  }
  const cleanUrl = url.replace(/\/$/, '');
  if (cleanUrl === publicTunnelUrl) return;

  try {
    const res = await fetch(`${cleanUrl}/health`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data?.status !== 'ok') throw new Error('health status != ok');
  } catch (error) {
    console.warn(`[Tunnel] ${source} не прошёл health-check: ${error.message}`);
    return;
  }

  publicTunnelUrl = cleanUrl;
  activeTunnelSource = source;
  console.log(`[Tunnel] 🚀 Активный туннель (${source}): ${publicTunnelUrl}`);
  try {
    fs.writeFileSync(path.resolve(process.cwd(), '.tunnel_url'), publicTunnelUrl);
  } catch {}
  await updateChatMenuWithApi(publicTunnelUrl);
}

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
    if (match && match[0]) {
      lastServeoUrl = match[0];
      await activateTunnel(lastServeoUrl, 'serveo');
    }
  };

  child.stdout.on('data', handleData);
  child.stderr.on('data', handleData);

  child.on('close', async (code) => {
    console.log(`[Tunnel] Serveo завершился (код: ${code}), перезапуск через 3 сек...`);
    if (activeTunnelSource === 'serveo') {
      publicTunnelUrl = '';
      activeTunnelSource = '';
      if (lastLocalTunnelUrl) await activateTunnel(lastLocalTunnelUrl, 'localtunnel');
    }
    setTimeout(startTunnel, 3000);
  });
}

function startLocalTunnel() {
  console.log('[LocalTunnel] 🌐 Запуск постоянного туннеля через LocalTunnel...');
  const lt = spawn('npx', ['localtunnel', '--port', `${BRIDGE_PORT}`, '--subdomain', 'moya-skazka-bot-bridge']);

  lt.stdout.on('data', async (d) => {
    const text = d.toString();
    console.log('[LocalTunnel]', text.trim());
    if (text.includes('url is:')) {
      const match = text.match(/https:\/\/[^\s]+/);
      if (match) {
        const url = match[0].replace(/[),.;]+$/, '');
        lastLocalTunnelUrl = url;
        await activateTunnel(url, 'localtunnel');
      }
    }
  });

  lt.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (!msg.includes('node')) console.warn('[LocalTunnel Warning]', msg);
  });

  lt.on('close', async (c) => {
    console.log(`[LocalTunnel] Завершился (код: ${c}), перезапуск через 5 сек...`);
    if (activeTunnelSource === 'localtunnel') {
      publicTunnelUrl = '';
      activeTunnelSource = '';
      if (lastServeoUrl) await activateTunnel(lastServeoUrl, 'serveo');
    }
    setTimeout(startLocalTunnel, 5000);
  });
}

if (SKIP_TUNNELS) {
  console.log('[Tunnel] SKIP_TUNNELS=true — туннели отключены');
} else {
  startTunnel();
  startLocalTunnel();
}

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
    `• Текст генерируется нейросетью специально под характер ребёнка\n` +
    `• Обложку и 4 иллюстрации в 3D Pixar-стиле рисует **Nano-Banana-2**\n` +
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

if (SKIP_TELEGRAM) {
  console.log('[Bot] SKIP_TELEGRAM=true — long polling отключён (режим API-моста)');
} else {
  startPolling();
}
