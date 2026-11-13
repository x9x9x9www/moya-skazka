// Telegram Bot & AI Bridge Runner for «Моя сказка»
import fs from 'fs';
import path from 'path';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { shouldActivateTunnel } from './tunnelPriority.mjs';
import {
  buildStoryPrompt,
  buildArchitectPrompt,
  buildStoryFromBlueprintPrompt,
  normalizeBlueprint,
  chooseStoryDna,
  createSeededRandom,
  normalizeStory,
  buildRepairPrompt,
  buildLengthRepairPrompt,
  buildCoverPrompt,
  buildScenePrompt,
  buildCharacterAnchor,
  fallbackQuestions,
  declineRussianName,
  inferRussianNameGender,
  runEditorialAgent,
  classifyClothingNarrativeRole,
  generateDailyIdea,
  buildVisualDirectorPrompt,
  buildLinguisticEditorialPrompt,
  STORY_ARCHETYPES,
  selectStoryArchetype,
  robustParseJson,
} from '../packages/story-engine/src/index.mjs';
import { Agent, ProxyAgent, setGlobalDispatcher, fetch as undiciFetch } from 'undici';
import localtunnel from 'localtunnel';

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

// Настройка прокси для стабильного доступа к Telegram API и AI провайдерам
const explicitProxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
const isProxyDisabled = process.env.DISABLE_PROXY === 'true' || process.env.NO_PROXY === '*';
const proxyUrl = isProxyDisabled ? null : (explicitProxy || 'http://127.0.0.1:10809');

let currentProxyAgent = null;

function applyProxyAgent() {
  if (!proxyUrl) {
    currentProxyAgent = null;
    console.log('[Proxy] ⚡️ Прокси отключен, используется прямое соединение');
    return null;
  }
  try {
    currentProxyAgent = new ProxyAgent({
      uri: proxyUrl,
      connect: {
        timeout: 60000,
      },
      headersTimeout: 240000,
      bodyTimeout: 240000,
    });
    console.log(`[Proxy] 🛡 Настроен Telegram-прокси: ${proxyUrl}`);
    return currentProxyAgent;
  } catch (err) {
    console.warn('[Proxy] Ошибка инициализации прокси:', err.message);
    currentProxyAgent = null;
    return null;
  }
}

applyProxyAgent();

if (proxyUrl) {
  // Удаляем из env, чтобы сокетные туннели (localtunnel/ssh) не блокировались HTTP-прокси
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;
  delete process.env.http_proxy;
  delete process.env.https_proxy;
  delete process.env.ALL_PROXY;
  delete process.env.all_proxy;
}

const isMainModule = Boolean(
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SKIP_TELEGRAM = process.env.SKIP_TELEGRAM === 'true';
const SKIP_TUNNELS = process.env.SKIP_TUNNELS === 'true';
const ADMIN_USERNAMES = ['dinar_fazlyev', 'x9x9x9ww'];
const WEB_APP_BASE_URL = process.env.WEB_APP_URL || 'https://x9x9x9www.github.io/moya-skazka/?v=4.4';
if (!BOT_TOKEN && isMainModule) {
  console.error('[Bot] Критическая ошибка: TELEGRAM_BOT_TOKEN не найден в .env!');
  process.exit(1);
}

const AI_MOCK_MODE =
  process.env.AI_MOCK_MODE === 'true' ||
  process.env.AI_DISABLED === 'true' ||
  !process.env.WELLFLOW_TEXT_KEY;
const AI_TEXT_PROVIDER = process.env.AI_TEXT_PROVIDER || 'wellflow';
const WELLFLOW_API_URL = process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1';
const WELLFLOW_TEXT_KEY = process.env.WELLFLOW_TEXT_KEY || '';
const WELLFLOW_TEXT_MODEL = process.env.WELLFLOW_TEXT_MODEL || 'gpt-6-luna';
const WELLFLOW_IMAGE_KEY = process.env.WELLFLOW_IMAGE_KEY || '';
const WELLFLOW_IMAGE_MODEL = process.env.WELLFLOW_IMAGE_MODEL || 'nano-banana-2';

const TELEGRAM_API_BASE = (process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '');
const TELEGRAM_API = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}`;
const BRIDGE_PORT = 4040;
let publicTunnelUrl = '';
let activeTunnelSource = '';
let lastServeoUrl = '';
let lastLocalTunnelUrl = '';

const BOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.join(BOT_DIR, 'generated');
fs.mkdirSync(GENERATED_DIR, { recursive: true });

// ========================================================
// 1.1. ЛОКАЛЬНАЯ БАЗА ДАННЫХ (bot/data/db.json)
// ========================================================
const DATA_DIR = path.join(BOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function initDb() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        users: {},
        children: {},
        books: {},
        daily_ideas: {},
        saved_ideas: {},
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '{}');
    return {
      users: parsed.users || {},
      children: parsed.children || {},
      books: parsed.books || {},
      daily_ideas: parsed.daily_ideas || {},
      saved_ideas: parsed.saved_ideas || {},
    };
  } catch (err) {
    console.error('[DB] Ошибка чтения db.json:', err.message);
    return { users: {}, children: {}, books: {}, daily_ideas: {}, saved_ideas: {} };
  }
}

let db = initDb();

function saveDb() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[DB] Ошибка сохранения db.json:', err.message);
  }
}

function getAuthContext(req, url) {
  let userId = '';
  let username = '';
  let firstName = 'Родитель';

  // 1. Из заголовка x-telegram-init-data
  const tgHeader = req.headers['x-telegram-init-data'] || '';
  if (tgHeader) {
    try {
      const sp = new URLSearchParams(tgHeader);
      const uStr = sp.get('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.id) userId = String(u.id);
        if (u.username) username = (u.username || '').toLowerCase();
        if (u.first_name) firstName = u.first_name;
      }
    } catch {}
  }

  // 2. Из заголовка Authorization (Bearer bridge_token_..., JWT или raw)
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token.startsWith('bridge_token_')) {
      const parsedId = token.replace('bridge_token_', '').trim();
      if (parsedId && !userId) userId = parsedId;
    } else if (token.includes('.')) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload.userId || payload.sub || payload.id) {
            userId = String(payload.userId || payload.sub || payload.id);
          }
          if (payload.username && !username) {
            username = String(payload.username).toLowerCase();
          }
        }
      } catch {}
    } else if (token && !userId) {
      userId = token;
    }
  }

  // 3. Из query params
  if (!userId) {
    userId = url.searchParams.get('userId') || url.searchParams.get('user_id') || '';
  }

  // 4. Из x-user-id
  if (!userId) {
    userId = (req.headers['x-user-id'] || '').toString().trim();
  }

  // 5. Дефолтный пользователь для разработки
  if (!userId) {
    userId = 'user_default';
  }

  // Безопасная проверка: только список доверенных администраторов
  const isAdmin = ADMIN_USERNAMES.includes((username || '').toLowerCase()) || db.users[userId]?.role === 'ADMIN';

  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      telegram_user_id: userId,
      first_name: firstName,
      username: username || (isAdmin ? 'dinar_fazlyev' : 'parent'),
      role: isAdmin ? 'ADMIN' : 'USER',
      free_text_claimed_at: null,
      default_questions_enabled: true,
      timezone: 'UTC+3',
      balance: {
        total: isAdmin ? 999 : 5,
        paid: isAdmin ? 999 : 5,
        gift: 0,
        reserved: 0,
        available: isAdmin ? 999 : 5,
      },
      createdAt: new Date().toISOString(),
    };
    saveDb();
  } else {
    // Обновляем поля, если пришли новые данные из Telegram
    if (username && db.users[userId].username !== username) {
      db.users[userId].username = username;
    }
    if (isAdmin && db.users[userId].role !== 'ADMIN') {
      db.users[userId].role = 'ADMIN';
    }
  }

  return { userId, user: db.users[userId], isAdmin, username };
}

// Промпт, Story DNA и контракт сказки живут в packages/story-engine/src/index.mjs

// ========================================================
// 2. ВЫЗОВЫ AI API (Wellflow API: gpt-6-luna / nano-banana-2)
// ========================================================
function parseJsonContent(content, preferredKeys = []) {
  return robustParseJson(content, preferredKeys);
}

const aiDispatcher = new Agent({
  headersTimeout: 240000,
  bodyTimeout: 240000,
  connectTimeout: 45000,
  keepAliveTimeout: 60000,
});

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`timeout ${timeoutMs}ms`)), timeoutMs + 1000);
  });
  const fetchOpts = { ...options, signal: controller.signal };
  if (currentProxyAgent && !fetchOpts.dispatcher && url.includes('api.telegram.org')) {
    fetchOpts.dispatcher = currentProxyAgent;
  } else if (!fetchOpts.dispatcher) {
    fetchOpts.dispatcher = aiDispatcher;
  }
  try {
    return await Promise.race([undiciFetch(url, fetchOpts), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function callWellflowDirect(messages, label, options = {}) {
  const maxTokens = options.max_tokens || 4500;
  const timeoutMs = options.timeoutMs || 90000;
  let res;
  try {
    res = await fetchWithTimeout(
      `${WELLFLOW_API_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WELLFLOW_TEXT_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: WELLFLOW_TEXT_MODEL,
          messages,
          response_format: { type: 'json_object' },
          max_tokens: maxTokens,
        }),
      },
      timeoutMs
    );
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

async function callTextChat(messages, label, options = {}) {
  return await callWellflowDirect(messages, label, options);
}

const callWellflowChat = callTextChat;

async function callWithRetry(messages, label, attempts = 2, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) console.warn(`[AI] 🔁 ${label}: повторная попытка ${attempt}/${attempts}`);
      return await callTextChat(messages, `${label}#${attempt}`, options);
    } catch (error) {
      lastError = error;
      console.warn(`[AI] ⚠️ ${label}: ${error.message}`);
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

  console.log(
    `[StoryEngine] 🚀 Генерация для «${input.childName || 'Малыш'}» (${input.age || 4} г., ${dna.personality_profile?.traitLabel || input.personality || 'Добрый'}): тема «${input.theme || 'Дружба'}»`
  );

  let storyPrompt = null;
  const enableTwoStage = params.useTwoStage !== false;
  if (enableTwoStage) {
    try {
      const architectPrompt = buildArchitectPrompt(input, { dna });
      console.log(`[StoryEngine/Этап 1] 🏛 Архитектор анализирует архетип «${dna.archetype?.title || 'Приключение'}», характер и проектирует реквизит...`);
      const architectContent = await callWithRetry(
        [
          { role: 'system', content: architectPrompt.system },
          { role: 'user', content: architectPrompt.user },
        ],
        'architect',
        1,
        { max_tokens: 500, timeoutMs: 75000 }
      );

      const rawBlueprint = parseJsonContent(architectContent, ['scene_by_scene_blueprint', 'psychological_profile', 'creative_concept']);
      const blueprint = normalizeBlueprint(rawBlueprint, input);
      console.log(
        `[StoryEngine/Этап 1] ✅ Архитектурный паспорт утверждён: Архетип «${blueprint.archetype}» | Реквизит: ${blueprint.physical_props.join(', ')} | «${blueprint.creative_concept.core_metaphor}»`
      );

      storyPrompt = buildStoryFromBlueprintPrompt(input, blueprint, { dna });
    } catch (archErr) {
      console.warn(`[StoryEngine/Этап 1] ⚠️ Сбой этапа Архитектора (${archErr.message}), используем прямой фоллбэк StoryPrompt`);
      storyPrompt = buildStoryPrompt(input, { dna });
    }
  } else {
    storyPrompt = buildStoryPrompt(input, { dna });
  }

  console.log(
    `[StoryEngine/Этап 2] ✍️ Сказочник (${WELLFLOW_TEXT_MODEL}) пишет 4 сцены...`
  );

  const content = await callWithRetry(
    [
      { role: 'system', content: storyPrompt.system },
      { role: 'user', content: storyPrompt.user },
    ],
    'story',
    2,
    { max_tokens: 1800, timeoutMs: 120000 }
  );

  let raw;
  try {
    raw = parseJsonContent(content, ['scenes', 'title', 'characters']);
  } catch (error) {
    console.warn(`[StoryEngine] ⚠️ Ошибка парсинга JSON сказочника (${error.message}), запускаем аварийный ремонт синтаксиса...`);
    try {
      const repairPrompt = buildRepairPrompt(content, [
        error.message,
        'Верни ТОЛЬКО ОДИН валидный JSON-объект сказки по контракту: {"title":"...","scenes":[...],"characters":[...],"questions":[...]} без Markdown и без лишнего текста.',
      ]);
      const repairedContent = await callTextChat(
        [
          { role: 'system', content: storyPrompt.system },
          { role: 'user', content: storyPrompt.user },
          { role: 'assistant', content },
          { role: 'user', content: repairPrompt },
        ],
        'json-syntax-repair',
        { max_tokens: 2000, timeoutMs: 50000 }
      );
      raw = parseJsonContent(repairedContent, ['scenes', 'title', 'characters']);
    } catch (repairErr) {
      throw new Error(`story: невалидный JSON: ${error.message} (ремонт не удался: ${repairErr.message})`);
    }
  }

  try {
    let story = normalizeStory(raw, input, dna);

    // Адаптивная проверка длины по возрасту ребенка: не вызываем лишний repair, если объем отклоняется незначительно (<25%)
    const childAge = Number(input.age) || 4;
    const minWords = childAge <= 3 ? 190 : (childAge <= 5 ? 270 : 360);
    const severeShortageThreshold = Math.round(minWords * 0.75);
    if (story.metrics.total_words < severeShortageThreshold) {
      console.warn(
        `[StoryEngine] 📏 Текст существенно короче минимума для возраста ${childAge}: ${story.metrics.total_words} < ${severeShortageThreshold} (базовый минимум: ${minWords}), запускаем length repair`
      );
      try {
        const lengthRepair = buildLengthRepairPrompt(story, story.metrics.target);
        const expandedContent = await callTextChat(
          [
            { role: 'system', content: storyPrompt.system },
            { role: 'user', content: storyPrompt.user },
            { role: 'assistant', content },
            { role: 'user', content: lengthRepair },
          ],
          'length-repair',
          { max_tokens: 2200, timeoutMs: 90000 }
        );
        const expandedRaw = parseJsonContent(expandedContent, ['scenes', 'title']);
        const expanded = normalizeStory(expandedRaw, input, dna);
        if (expanded.metrics.total_words > story.metrics.total_words) {
          console.log(`[StoryEngine] ✅ Расширено: ${story.metrics.total_words} → ${expanded.metrics.total_words} слов`);
          story = expanded;
        }
      } catch (lengthError) {
        console.warn(`[StoryEngine] ⚠️ Length repair не удался, оставляем исходный текст: ${lengthError.message}`);
      }
    }

    // Двухуровневая литературная редактура (LLM-редактор + детерминированный ГОСТ-редактор)
    try {
      // Уровень 1: Интеллектуальный LLM-редактор (проверка согласования рода глаголов, падежей имени и литературности)
      const linguisticPrompt = buildLinguisticEditorialPrompt(story, input);
      console.log(`[StoryEngine/Этап 3] 📖 LLM-редактор вычитывает грамматику и литературный стиль...`);
      try {
        const editorialLlmContent = await callWithRetry(
          [
            { role: 'system', content: linguisticPrompt.system },
            { role: 'user', content: linguisticPrompt.user },
          ],
          'linguistic-editorial',
          1,
          { max_tokens: 950, timeoutMs: 45000 }
        );
        const editorialLlmJson = parseJsonContent(editorialLlmContent, ['scenes', 'title', 'questions']);
        if (editorialLlmJson && Array.isArray(editorialLlmJson.scenes) && editorialLlmJson.scenes.length === 4) {
          story.title = editorialLlmJson.title || story.title;
          for (const s of editorialLlmJson.scenes) {
            const idx = s.index || s.scene_index;
            const targetScene = story.scenes.find((sc) => sc.index === idx);
            if (targetScene && typeof s.text === 'string' && s.text.length > 30) {
              targetScene.text = s.text;
            }
          }
          if (Array.isArray(editorialLlmJson.questions) && editorialLlmJson.questions.length >= 2) {
            for (const q of editorialLlmJson.questions) {
              const targetQ = story.questions.find((tq) => tq.after_scene === q.after_scene);
              if (targetQ && q.question) {
                targetQ.question = q.question;
                if (q.parent_hint) targetQ.parent_hint = q.parent_hint;
              }
            }
          }
          console.log(`[StoryEngine/Этап 3] ✅ LLM-вычитка завершена успешно`);
        }
      } catch (llmEdErr) {
        console.warn(`[StoryEngine/Этап 3] ⚠️ Сбой LLM-редактора (${llmEdErr.message}), переходим к детерминированному агенту`);
      }

      // Уровень 2: Детерминированный ГОСТ-редактор (ёфикация, диалоги, тире, очистка от штампов)
      const editorial = runEditorialAgent(story, input);
      if (editorial && editorial.story) {
        story = editorial.story;
        if (editorial.fixesApplied?.length) {
          console.log(`[StoryEngine/Этап 3] 📚 EditorialAgent применил детерминированные правки: ${editorial.fixesApplied.join(', ')}`);
        }
      }
    } catch (edErr) {
      console.warn(`[StoryEngine] ⚠️ Ошибка EditorialAgent: ${edErr.message}`);
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
    const repairedContent = await callTextChat(
      [
        { role: 'system', content: storyPrompt.system },
        { role: 'user', content: storyPrompt.user },
        { role: 'assistant', content },
        { role: 'user', content: repair },
      ],
      'repair',
      { max_tokens: 1800, timeoutMs: 50000 }
    );
    const repairedRaw = parseJsonContent(repairedContent, ['scenes', 'title', 'characters']);
    try {
      let story = normalizeStory(repairedRaw, input, dna);
      try {
        const editorial = runEditorialAgent(story, input);
        if (editorial?.story) story = editorial.story;
      } catch {}
      console.log(`[StoryEngine] ✅ после repair: «${story.title}» (${story.metrics.total_words} слов)`);
      return story;
    } catch (repairError) {
      if ((repairError.issues || []).some((issue) => /вопрос/i.test(issue))) {
        const patched = { ...repairedRaw, questions: fallbackQuestions(input.childName) };
        let story = normalizeStory(patched, input, dna);
        try {
          const editorial = runEditorialAgent(story, input);
          if (editorial?.story) story = editorial.story;
        } catch {}
        story.warnings.push('вопросы заменены fallback-вопросами после repair');
        console.warn('[StoryEngine] ⚠️ Вопросы заменены fallback-вопросами');
        return story;
      }
      if (!input._retried && WELLFLOW_TEXT_KEY) {
        console.warn('[StoryEngine] ⚠️ Repair не удался, пробуем резервный генератор Wellflow...');
        return await generateWellflowStoryAI({ ...params, _retried: true });
      }
      throw repairError;
    }
  }
}

export const ALL_AVATAR_KEYS = [
  'boy_blonde',
  'boy_brown',
  'boy_dark',
  'boy_ginger',
  'boy_glasses',
  'boy_tan',
  'girl_blonde',
  'girl_brown',
  'girl_dark',
  'girl_ginger',
  'girl_glasses',
  'girl_tan',
];

export function resolveChildAvatarKey(params) {
  if (!params) return 'boy_brown';
  const appearance = params.appearance || params;
  const avatarId = String(appearance.avatar_id || params.avatar_id || '').toLowerCase().trim();

  // 0. Если передан точный канонический ID из 12 аватаров, возвращаем его сразу
  if (ALL_AVATAR_KEYS.includes(avatarId)) {
    return avatarId;
  }

  const rawGender = params.gender || appearance.gender;
  const gender =
    rawGender === 'girl'
      ? 'girl'
      : rawGender === 'boy'
      ? 'boy'
      : avatarId.startsWith('girl_') || avatarId.includes('girl')
      ? 'girl'
      : 'boy';

  const hair = String(appearance.hairColor || params.hairColor || '').toLowerCase();
  const skin = String(appearance.skinTone || params.skinTone || '').toLowerCase();
  const features = String(appearance.distinctiveFeatures || params.distinctiveFeatures || '').toLowerCase();

  // 1. Очки
  if (features.includes('очк') || avatarId.includes('glasses')) {
    return `${gender}_glasses`;
  }
  // 2. Смуглый тон кожи
  if (skin.includes('смугл') || avatarId.includes('tan')) {
    return `${gender}_tan`;
  }
  // 3. Цвет волос
  if (hair.includes('светл') || hair.includes('блонд') || avatarId.includes('blonde')) {
    return `${gender}_blonde`;
  }
  if (hair.includes('рыж') || avatarId.includes('ginger')) {
    return `${gender}_ginger`;
  }
  if (
    hair.includes('тёмн') ||
    hair.includes('темн') ||
    hair.includes('черн') ||
    hair.includes('брюнет') ||
    avatarId.includes('dark')
  ) {
    return `${gender}_dark`;
  }
  // 4. По умолчанию для русых / шатенов
  return `${gender}_brown`;
}

export function getThemedFallbackIllustration(themeOrInterest, sceneIndex = 0, params = null) {
  const baseUrl = 'https://x9x9x9www.github.io/moya-skazka';
  // Если есть профиль ребёнка — всегда отдаём его персонализированный аватар, исключая чужие иллюстрации
  if (params) {
    const avatarKey = resolveChildAvatarKey(params);
    return `${baseUrl}/illustrations/avatars/${avatarKey}.webp`;
  }
  const t = (themeOrInterest || '').toLowerCase();
  if (t.includes('дино')) return `${baseUrl}/illustrations/cover_dino.jpg`;
  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('сон') || t.includes('ночь')) {
    return `${baseUrl}/illustrations/cover_star.jpg`;
  }
  if (t.includes('лес') || t.includes('животн') || t.includes('звер')) {
    return `${baseUrl}/illustrations/cover_forest.jpg`;
  }
  return `${baseUrl}/illustrations/cover_star.jpg`;
}

export function resolveAvatarReferenceUrl(params) {
  const direct = params?.avatarUrl || params?.avatar_url || params?.appearance?.avatar_url || params?.appearance?.avatarUrl;
  if (direct && (direct.startsWith('http://') || direct.startsWith('https://') || direct.startsWith('data:image/'))) {
    return direct;
  }
  if (direct && (direct.startsWith('/illustrations/') || direct.startsWith('illustrations/'))) {
    const clean = direct.replace(/^\/+/, '');
    return `https://x9x9x9www.github.io/moya-skazka/${clean}`;
  }
  if (direct && direct.startsWith('/media/')) {
    const base = publicTunnelUrl || (process.env.PUBLIC_BRIDGE_URL || '').replace(/\/+$/, '') || 'http://localhost:4040';
    return `${base}${direct}`;
  }
  const app = params?.appearance || {};
  const traits = {
    gender: params?.gender || app.gender,
    hairColor: app.hairColor || params?.hairColor,
    hairType: app.hairType || params?.hairType,
    skinTone: app.skinTone || params?.skinTone,
    distinctiveFeatures: app.distinctiveFeatures || params?.distinctiveFeatures,
    avatar_id: app.avatar_id || params?.avatar_id,
  };
  const avatarKey = resolveChildAvatarKey(traits);
  return `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarKey}.webp`;
}

async function generateWellflowImageAI(prompt, retries = 2, referenceImageUrl = null) {
  if (!WELLFLOW_IMAGE_KEY) {
    throw new Error('WELLFLOW_IMAGE_KEY not set');
  }
  const models = [WELLFLOW_IMAGE_MODEL || 'nano-banana-2'].filter(Boolean);
  // Story Engine уже добавил 3D Pixar-стиль и character bible.
  const finalPrompt = prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const currentModel = models[attempt] || models[0];
    try {
      console.log(`[Wellflow] 🎨 Генерация иллюстрации через ${currentModel} (попытка ${attempt + 1}/${retries + 1})...`);
      const bodyPayload = {
        model: currentModel,
        prompt: finalPrompt,
        n: 1,
        size: '1024x1024',
      };
      if (referenceImageUrl && typeof referenceImageUrl === 'string' && (referenceImageUrl.startsWith('http://') || referenceImageUrl.startsWith('https://'))) {
        // Консистентность персонажа: референсный 3D-аватар для Nano-Banana-2 / Wellflow (только реальные HTTPS-ссылки)
        bodyPayload.image_url = referenceImageUrl;
        bodyPayload.reference_image = referenceImageUrl;
        bodyPayload.init_image = referenceImageUrl;
      }
      const res = await fetchWithTimeout(`${WELLFLOW_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WELLFLOW_IMAGE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      }, 45000);

      if (!res.ok) {
        const errText = await res.text();
        const isQuota = res.status === 402 || res.status === 401;
        const err = new Error(`API error ${res.status}: ${errText}`);
        if (isQuota) err.isQuota = true;
        throw err;
      }

      const data = await res.json();
      const url = data.imageUrl || data.data?.[0]?.url;
      if (!url) throw new Error('No image URL in response');

      console.log(`[Wellflow] ✅ Иллюстрация готова (${currentModel}): ${url.slice(0, 70)}...`);
      return url;
    } catch (err) {
      console.warn(`[Wellflow] ⚠️ Попытка ${attempt + 1} (${currentModel}) не удалась: ${err.message}`);
      // Баланс/квота или исчерпаны все попытки — завершаем
      if (err.isQuota || err.message.includes('402') || err.message.includes('insufficient_quota') || attempt >= retries) {
        throw err;
      }
      // При таймауте или сетевом сбое повторяем попытку с паузой
      await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
}

function saveImageToDiskBackground(remoteUrl, jobId, name) {
  if (!jobId || !remoteUrl) return;
  fetch(remoteUrl, {
    headers: WELLFLOW_IMAGE_KEY ? { Authorization: `Bearer ${WELLFLOW_IMAGE_KEY}` } : {},
    signal: AbortSignal.timeout(30000),
  })
    .then(async (res) => {
      if (!res.ok) return;
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
      const dir = path.join(GENERATED_DIR, jobId);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${name}${ext}`), buffer);
      console.log(`[Wellflow] 💾 Иллюстрация ${name} закэширована на сервере`);
    })
    .catch(() => {
      // Фоновое кэширование не блокирует отдачу картинок
    });
}

async function saveGeneratedImage(remoteUrl, jobId, name) {
  if (!remoteUrl) return remoteUrl;
  if (jobId) {
    saveImageToDiskBackground(remoteUrl, jobId, name);
  }
  // Всегда возвращаем прямой CDN-URL Wellflow!
  // Это исключает задержки туннелей, всплывающие окна LocalTunnel и ускоряет отображение в 10 раз.
  return remoteUrl;
}

/**
 * Единый серверный конвейер: текст сказки → обложка + 4 сцены.
 * Картинки сохраняются локально в bot/generated/<jobId>/ и отдаются по /media/...
 */
async function generateFullStoryWithImagesAI(params, onProgress, jobId) {
  if (AI_MOCK_MODE) {
    console.log(`[StoryEngine] ⚡️ Режим тестирования (AI_MOCK_MODE): генерация без затрат API для «${params.childName || 'Малыш'}»`);
    onProgress?.({
      stage: 'writing',
      progress: 25,
      message: 'Сочиняем уникальный сюжет и character bible...',
    });
    await new Promise((r) => setTimeout(r, 600));

    onProgress?.({
      stage: 'drawing',
      progress: 65,
      message: 'Художник создаёт 3D-иллюстрации...',
    });
    await new Promise((r) => setTimeout(r, 700));

    onProgress?.({
      stage: 'drawing',
      progress: 90,
      message: 'Создаём иллюстрации (4 из 5 готовы)...',
    });
    await new Promise((r) => setTimeout(r, 500));

    const child = params.childName || 'Малыш';
    const isGirl = params.gender === 'girl' || (child.endsWith('а') || child.endsWith('я'));
    const declined = declineRussianName(child, isGirl ? 'girl' : 'boy');
    const theme = params.theme || 'Дружба и светлячок';
    const interest = params.interests?.[0] || 'волшебные звёзды';
    const wishes = params.customWishes ? ` Рядом был любимый спутник — ${params.customWishes}.` : '';
    const hair = params.appearance?.hairColor
      ? `${params.appearance.hairLength || ''} ${params.appearance.hairType || params.appearance.hairStructure || ''} ${params.appearance.hairColor} волосы`
      : 'аккуратные волосы';
    const clothes = (params.appearance?.clothingItem || params.appearance?.clothingDescription)
      ? `${params.appearance.clothingItem || params.appearance.clothingDescription} (${params.appearance.clothingColor || 'любимого цвета'})`
      : 'уютная одежда';

    const baseUrl = 'https://x9x9x9www.github.io/moya-skazka';
    const avatarKey = resolveChildAvatarKey(params);
    const avatarUrl = `${baseUrl}/illustrations/avatars/${avatarKey}.webp`;
    const t = theme.toLowerCase();
    let worldName = 'Волшебная страна';
    let companionName = params.appearance?.toy || 'Светлячок Лучик';
    let trialText = 'пушистый сонный туман, в котором потерялась тропинка';
    let climaxText = 'поляна озарилась тысячами добрых мерцающих светлячков';
    let coverImg = `${baseUrl}/illustrations/cover_forest.jpg`;

    if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('планет')) {
      worldName = 'Звёздная Галактика';
      companionName = params.appearance?.toy || 'Звёздный Лисёнок Спарки';
      trialText = 'звездный пояс из мягких мерцающих облачков';
      climaxText = 'созвездие Дружбы мягко осветило всю ночную галактику';
      coverImg = `${baseUrl}/illustrations/cover_star.jpg`;
    } else if (t.includes('мор') || t.includes('океан') || t.includes('подвод') || t.includes('дельфин')) {
      worldName = 'Лазурные Глубины';
      companionName = params.appearance?.toy || 'Дельфинёнок Флип';
      trialText = 'волна мягких светящихся пузырьков';
      climaxText = 'жемчужный цветок распустился и наполнил море изумрудным светом';
      coverImg = `${baseUrl}/illustrations/cover_forest.jpg`;
    } else if (t.includes('дино') || t.includes('древн') || t.includes('джунгл')) {
      worldName = 'Долина Исполинов';
      companionName = params.appearance?.toy || 'Маленький Трикки';
      trialText = 'густые листья сказочного папоротника';
      climaxText = 'добрый маячок зажегся золотым светом на вершине холма';
      coverImg = `${baseUrl}/illustrations/cover_dino.jpg`;
    }

    const vFelt = isGirl ? 'почувствовала' : 'почувствовал';
    const vStepped = isGirl ? 'очутилась' : 'очутился';
    const vSmiled = isGirl ? 'не испугалась, улыбнулась и крепко взяла' : 'не испугался, улыбнулся и крепко взял';
    const vProved = isGirl ? 'доказала' : 'доказал';

    const clothingRole = classifyClothingNarrativeRole(params);
    let costumeIntro = '';
    if (clothingRole.isNarrativelyRelevant) {
      costumeIntro = clothingRole.allowBestowal
        ? ` Друзья приготовили для ${declined.gen} особенный ${clothes}, чтобы отправиться в путь.`
        : ` На герое был специальный ${clothes}.`;
    }

    const sceneImg = avatarUrl || coverImg;

    const characterAnchor = buildCharacterAnchor(params);
    const isTextOnly = params.format === 'TEXT';
    const mockStory = {
      title: `${child} и тайна: «${theme}»`,
      status: isTextOnly ? 'TEXT_READY' : 'ILLUSTRATED',
      format: isTextOnly ? 'TEXT' : 'ILLUSTRATED',
      cover_url: avatarUrl || coverImg,
      avatar_url: avatarUrl,
      avatar_id: avatarKey,
      metrics: { total_words: 420 },
      characters: [child, companionName],
      scenes: [
        {
          index: 1,
          text: `Уютным солнечным утром ${child} ${vFelt}, что день готовит доброе чудо.${costumeIntro ? ' ' + costumeIntro : ''}${wishes} Вдруг прямо на ладошку опустился крошечный теплый огонек — это был ${companionName}, который приветливо мигнул и позвал в ${worldName}!`,
          image_url: sceneImg,
          visual: `${characterAnchor} 3D cartoon style scene 1 of ${child} meeting ${companionName}`,
          image_prompt: `${characterAnchor} 3D cartoon style scene 1 of ${child} meeting ${companionName}`,
        },
        {
          index: 2,
          text: `Сделав смелый шаг, ${child} и ${companionName} вместе ${vStepped} на мягкую тропинку, где повсюду оживали ${interest}. «Здравствуй, ${child}! — радостно прошептал спутник. — Только твое чуткое сердце и смелость помогут нам найти путь к волшебной полянке!»`,
          image_url: sceneImg,
          visual: `${characterAnchor} 3D cartoon style scene 2 with ${child} and ${companionName} walking together`,
          image_prompt: `${characterAnchor} 3D cartoon style scene 2 with ${child} and ${companionName} walking together`,
        },
        {
          index: 3,
          text: `Впереди на дорожку опустился ${trialText}. ${child} ${vSmiled} друга за руку. ${companionName} засветился еще теплее и ярче, разгоняя сумерки, и вместе они легко нашли дорогу вперед, доказав, что дружба побеждает любые преграды!`,
          image_url: sceneImg,
          visual: `${characterAnchor} 3D cartoon style scene 3 showing ${child} and ${companionName} overcoming challenge together`,
          image_prompt: `${characterAnchor} 3D cartoon style scene 3 showing ${child} and ${companionName} overcoming challenge together`,
        },
        {
          index: 4,
          text: `И вот тайна открылась: ${climaxText}! Сердце ${declined.gen} наполнилось теплом, радостью и гордостью. Это удивительное приключение ${vProved}: самые настоящие чудеса рождаются из смелости, дружбы и доброты!`,
          image_url: sceneImg,
          visual: `${characterAnchor} 3D cartoon style scene 4 triumphant bedtime finale with ${child} and ${companionName}`,
          image_prompt: `${characterAnchor} 3D cartoon style scene 4 triumphant bedtime finale with ${child} and ${companionName}`,
        },
      ],
      questions: params.includeQuestions
        ? [
            {
              after_scene: 2,
              question: `Что почувствовал${isGirl ? 'а' : ''} ${child}, когда началось приключение?`,
              parent_hint: 'Спросите ребёнка о доверии и первых впечатлениях в начале пути.',
              skill_tag: 'empathy',
            },
            {
              after_scene: 4,
              question: `Кто помог ${declined.dat} стать смелее?`,
              parent_hint: 'Подчеркните ценность доброты, терпения и взаимовыручки перед сном.',
              skill_tag: 'emotions',
            },
          ]
        : [],
    };

    onProgress?.({
      stage: 'finishing',
      progress: 100,
      message: 'Сказка готова!',
    });

    return mockStory;
  }

  onProgress?.({
    stage: 'writing',
    progress: 20,
    message: 'Автор придумывает сюжет и character bible...',
  });

  let writingProg = 20;
  const writingTimer = setInterval(() => {
    writingProg = Math.min(48, writingProg + 2);
    onProgress?.({
      stage: 'writing',
      progress: writingProg,
      message:
        writingProg > 34
          ? 'Сочиняем диалоги и вопросы для обсуждения...'
          : 'Автор придумывает сюжет и character bible...',
    });
  }, 3500);

  let story;
  try {
    story = await generateWellflowStoryAI(params);
  } catch (err) {
    if (!params._retried) {
      console.warn(`[StoryEngine] ⚠️ Ошибка основного провайдера сюжета: ${err.message}. Пробуем резервный генератор Wellflow...`);
      story = await generateWellflowStoryAI({ ...params, _retried: true });
    } else {
      throw err;
    }
  } finally {
    clearInterval(writingTimer);
  }

  if (!story.scenes || !Array.isArray(story.scenes) || story.scenes.length !== 4) {
    throw new Error('Invalid story scenes structure');
  }

  // Если формат сказки только текстовый (бесплатная первая сказка), не тратим токены на генерацию 5 картинок
  if (params.format === 'TEXT') {
    console.log(`[StoryEngine] 📖 Формат 'TEXT' (первая бесплатная сказка): пропускаем генерацию 5 иллюстраций`);
    const avatarReferenceUrl = resolveAvatarReferenceUrl(params);
    story.avatar_url = avatarReferenceUrl;
    story.cover_url = avatarReferenceUrl || null;
    for (const scene of story.scenes) {
      scene.image_url = null;
      scene.id = scene.id || `scene_${scene.index}`;
      scene.scene_index = scene.index;
      scene.image_prompt = scene.visual;
    }

    story.id = jobId || ('story_' + Date.now());
    story.status = 'TEXT_READY';
    story.format = 'TEXT';
    story.scenes = (story.scenes || []).map((s, idx) => ({
      id: s.id || `scene_${s.scene_index || s.index || idx + 1}`,
      scene_index: s.scene_index || s.index || idx + 1,
      index: s.scene_index || s.index || idx + 1,
      text: s.text || '',
      image_url: null,
      image_prompt: s.image_prompt || s.visual || null,
    }));
    story.questions = (story.questions || []).map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      after_scene: q.after_scene || (idx === 0 ? 2 : 4),
      question: q.question || '',
      parent_hint: q.parent_hint || null,
      skill_tag: q.skill_tag || q.skill || 'emotions',
    }));

    const userId = params.userId || 'user_default';
    const childKey = (params.childName || '').trim().toLowerCase();
    const userChildKey = childKey ? `${userId}_${childKey}` : '';
    if (userChildKey) {
      recentReadyStories.set(userChildKey, {
        story,
        jobId: story.id,
        readyAt: Date.now(),
        userId,
      });
    }

    onProgress?.({
      stage: 'finishing',
      progress: 100,
      message: 'Сказка готова!',
      story,
    });

    return story;
  }

  onProgress?.({
    stage: 'drawing',
    progress: 50,
    message: 'Художник создаёт обложку и 4 иллюстрации...',
  });

  const avatarReferenceUrl = resolveAvatarReferenceUrl(params);
  story.avatar_url = avatarReferenceUrl;
  story.childName = params.childName || story.childName || 'Малыш';
  story.child_name = story.childName;
  story.gender = params.gender || story.gender || (story.childName.endsWith('а') || story.childName.endsWith('я') ? 'girl' : 'boy');
  story.child_gender = story.gender;
  story.age = params.age || story.age || 4;
  story.child_age = story.age;
  story.appearance = { ...(params.appearance || {}), ...(story.appearance || {}) };
  console.log(`[StoryEngine] 👤 Опорный референс персонажа (Image-to-Image): ${avatarReferenceUrl}`);

  // Этап 4: Арт-директор визуальных сцен (Visual Art Director)
  // Читает утверждённый русский текст сказки и генерирует точные английские промпты
  // с явным указанием осязаемых предметов (props), позы героя, повадки спутника и освещения
  try {
    const visualDirectorPrompt = buildVisualDirectorPrompt(story, params);
    console.log(`[StoryEngine/Этап 4] 🎨 Арт-директор режиссирует сцены и реквизит из русского текста...`);
    const visualDirectorContent = await callWithRetry(
      [
        { role: 'system', content: visualDirectorPrompt.system },
        { role: 'user', content: visualDirectorPrompt.user },
      ],
      'visual-director',
      1,
      { max_tokens: 800, timeoutMs: 45000 }
    );
    const vdJson = parseJsonContent(visualDirectorContent, ['cover_visual', 'scenes']);
    if (vdJson) {
      if (typeof vdJson.cover_visual === 'string' && vdJson.cover_visual.length > 25) {
        story.cover_visual = vdJson.cover_visual;
      }
      if (Array.isArray(vdJson.scenes)) {
        for (const s of vdJson.scenes) {
          const idx = s.index || s.scene_index;
          const targetScene = story.scenes.find((sc) => sc.index === idx);
          if (targetScene && typeof s.visual === 'string' && s.visual.length > 25) {
            targetScene.visual = s.visual;
          }
        }
      }
      console.log(`[StoryEngine/Этап 4] ✅ Арт-директор утвердил детальные раскадровки сцен`);
    }
  } catch (vdErr) {
    console.warn(`[StoryEngine/Этап 4] ⚠️ Сбой Visual Art Director (${vdErr.message}), используются базовые visual описания`);
  }

  const imageTasks = [
    { name: 'cover', kind: 'cover', prompt: buildCoverPrompt(story, avatarReferenceUrl), fallback: getThemedFallbackIllustration(params.theme, 0, params) },
    ...story.scenes.map((scene) => ({
      name: `scene_${scene.index}`,
      kind: 'scene',
      sceneIndex: scene.index,
      prompt: buildScenePrompt(story, scene, avatarReferenceUrl),
      fallback: getThemedFallbackIllustration(params.interests?.[0] || params.theme, scene.index, params),
    })),
  ];

  console.log(`[StoryEngine] 🎨 Запуск параллельной генерации 5 изображений для «${story.title}» (пул concurrency: 5)...`);

  let completedImages = 0;
  const executeImageJob = async (job) => {
    // Image QA Gate: гарантия префикса консистентности персонажа и очистка устаревших дефолтных заглушек
    const isGirl = story.gender === 'girl' || (story.childName && (story.childName.endsWith('а') || story.childName.endsWith('я')));
    const rawHair = `${story.appearance?.hairLength || ''} ${story.appearance?.hairType || ''} ${story.appearance?.hairStructure || ''}`.toLowerCase();
    const isLongHair = rawHair.includes('длинн') || rawHair.includes('long');

    const hasCorruptedFallbackAnchor = job.prompt.includes('boy named Hero') ||
      (isGirl && job.prompt.includes('4-year-old boy')) ||
      (isLongHair && job.prompt.includes('neat short playful hair'));

    if (hasCorruptedFallbackAnchor) {
      job.prompt = job.prompt.replace(/\[CHARACTER CONSISTENCY MANDATORY:[^\]]+\]/g, '').trim();
    }

    if (!job.prompt.includes('[CHARACTER CONSISTENCY MANDATORY:')) {
      const anchor = buildCharacterAnchor(story);
      job.prompt = `${anchor} ${job.prompt}`.trim();
    }

    let url;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !url) {
      attempts += 1;
      try {
        const remoteUrl = await generateWellflowImageAI(job.prompt, 2, avatarReferenceUrl);
        url = await saveGeneratedImage(remoteUrl, jobId, job.name);
      } catch (error) {
        console.error(`[StoryEngine] ⚠️ ${job.name} (попытка ${attempts}/${maxAttempts}): ошибка генерации — ${error.message}`);
        if (attempts >= maxAttempts) {
          // При сбое ни в коем случае не используем чужие демо-картинки из другого сюжета!
          // Используем: 1) готовую обложку этой сказки; 2) аватар этого ребенка; 3) тематический фон
          url = (story.cover_url && !story.cover_url.includes('/demo/'))
            ? story.cover_url
            : (avatarReferenceUrl || job.fallback);
        } else {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    if (job.kind === 'cover') {
      story.cover_url = url;
    } else {
      const scene = story.scenes.find((item) => item.index === job.sceneIndex);
      if (scene) {
        scene.image_url = url;
        scene.id = scene.id || `scene_${scene.index}`;
        scene.scene_index = scene.index;
        scene.image_prompt = job.prompt;
      }
    }

    completedImages += 1;
    const pct = 50 + Math.round((completedImages / imageTasks.length) * 45);
    onProgress?.({
      stage: 'drawing',
      progress: pct,
      message: `Создаём иллюстрации (${completedImages} из ${imageTasks.length} готовы)...`,
      story,
    });
  };

  const imageQueue = [...imageTasks];
  const workers = Array.from({ length: Math.min(5, imageQueue.length) }, async (_, i) => {
    if (i > 0) await new Promise((r) => setTimeout(r, i * 200));
    while (imageQueue.length > 0) {
      const job = imageQueue.shift();
      if (job) await executeImageJob(job);
    }
  });
  await Promise.all(workers);

  // Гарантия: у каждой сцены и обложки есть URL, строго связанный с этим героем
  if (!story.cover_url || story.cover_url.includes('/demo/')) {
    story.cover_url = avatarReferenceUrl || getThemedFallbackIllustration(params.theme, 0, params);
  }
  story.cover_prompt = imageTasks[0]?.prompt || buildCoverPrompt(story, avatarReferenceUrl);
  for (const scene of story.scenes) {
    if (!scene.image_url || scene.image_url.includes('/demo/')) {
      scene.image_url = story.cover_url || avatarReferenceUrl || getThemedFallbackIllustration(params.interests?.[0] || params.theme, scene.index, params);
    }
    if (!scene.image_prompt) {
      scene.image_prompt = buildScenePrompt(story, scene, avatarReferenceUrl);
    }
  }

  // Заполняем системные поля для читалки и нормализуем сцены и вопросы
  story.id = jobId || ('story_' + Date.now());
  story.status = 'ILLUSTRATED';
  story.format = 'ILLUSTRATED';
  story.scenes = (story.scenes || []).map((s, idx) => ({
    id: s.id || `scene_${s.scene_index || s.index || idx + 1}`,
    scene_index: s.scene_index || s.index || idx + 1,
    index: s.scene_index || s.index || idx + 1,
    text: s.text || '',
    image_url: s.image_url || null,
    image_prompt: s.image_prompt || s.visual || null,
  }));
  story.questions = (story.questions || []).map((q, idx) => ({
    id: q.id || `q_${idx + 1}`,
    after_scene: q.after_scene || (idx === 0 ? 2 : 4),
    question: q.question || '',
    parent_hint: q.parent_hint || null,
    skill_tag: q.skill_tag || q.skill || 'emotions',
  }));

  // Сохраняем в кэш готовых сказок для мгновенной отдачи при обрыве соединения
  const userId = params.userId || 'user_default';
  const childKey = (params.childName || '').trim().toLowerCase();
  const userChildKey = childKey ? `${userId}_${childKey}` : '';
  if (userChildKey) {
    recentReadyStories.set(userChildKey, {
      story,
      jobId: story.id,
      readyAt: Date.now(),
      userId,
    });
  }

  // Сохраняем готовую сказку в постоянную базу данных bot/data/db.json
  try {
    const bookRecord = {
      id: story.id,
      user_id: userId,
      child_id: params.child_id || params.childId || 'default',
      child_name: params.childName || '',
      title: story.title,
      status: 'ILLUSTRATED',
      format: 'ILLUSTRATED',
      cover_url: story.cover_url,
      scenes: story.scenes,
      questions: story.questions,
      can_upgrade: false,
      created_at: new Date().toISOString(),
    };
    db.books[story.id] = bookRecord;
    // Списание кредита для обычных пользователей
    if (db.users[userId] && db.users[userId].role !== 'ADMIN') {
      const bal = db.users[userId].balance;
      if (bal && bal.available > 0) {
        bal.available = Math.max(0, bal.available - 1);
        bal.total = Math.max(0, bal.total - 1);
        bal.paid = Math.max(0, bal.paid - 1);
      }
      db.users[userId].free_text_claimed_at = db.users[userId].free_text_claimed_at || new Date().toISOString();
    }
    saveDb();
    console.log(`[DB] 💾 Сказка «${story.title}» сохранена в db.json для пользователя ${userId}`);
  } catch (dbErr) {
    console.error('[DB] Ошибка сохранения книги в db.json:', dbErr.message);
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
// Кэш недавно сгенерированных сказок по имени ребенка для быстрого восстановления
const recentReadyStories = new Map();

// Очистка старых задач каждые 5 минут
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (now - job.createdAt > 15 * 60 * 1000) {
      jobs.delete(id);
    }
  }
  for (const [key, item] of recentReadyStories.entries()) {
    if (now - item.readyAt > 20 * 60 * 1000) {
      recentReadyStories.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

// ========================================================
// 2.9. ЗАЩИТА API (CORS, Rate Limiting, DoS Guard, Telegram Auth)
// ========================================================
const rateLimits = new Map();

function checkRateLimit(ip, limitPerMinute = 25) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  let record = rateLimits.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { startTime: now, count: 1 };
    rateLimits.set(ip, record);
    return true;
  }
  record.count += 1;
  return record.count <= limitPerMinute;
}

// Очистка старых IP раз в 2 минуты
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimits.entries()) {
    if (now - record.startTime > 120 * 1000) {
      rateLimits.delete(ip);
    }
  }
}, 120 * 1000).unref();

// ========================================================
// 2.9. «СКАЗКА ДНЯ» И УДЕРЖАНИЕ (Пункт 14 ТЗ)
// ========================================================
export function getDailyIdeaForChild(childId, localDate, userId) {
  const dateStr = localDate || new Date().toISOString().split('T')[0];

  let child = childId ? db.children[childId] : null;
  if (!child && userId) {
    child = Object.values(db.children).find((c) => c.user_id === userId);
  }
  if (!child) {
    child = {
      id: childId || 'child_default',
      name: 'Малыш',
      age: 4,
      gender: 'boy',
      interests: ['Волшебство'],
    };
  }

  const key = `${child.id}_${dateStr}`;
  if (db.daily_ideas && db.daily_ideas[key]) {
    const cached = { ...db.daily_ideas[key] };
    if (db.saved_ideas && db.saved_ideas[cached.id]) {
      cached.is_saved = true;
      cached.status = 'SAVED';
    }
    return cached;
  }

  // Собираем последние 3–5 прочитанных книг ребенка для исключения повторений
  const recentBooks = Object.values(db.books || {})
    .filter((b) => b.child_id === child.id || (userId && b.user_id === userId))
    .slice(-5)
    .map((b) => ({ title: b.title, theme: b.theme }));

  const idea = generateDailyIdea({
    child,
    recentBooks,
    dateStr,
    seed: 0,
  });

  if (db.saved_ideas && db.saved_ideas[idea.id]) {
    idea.is_saved = true;
    idea.status = 'SAVED';
  }

  if (!db.daily_ideas) db.daily_ideas = {};
  db.daily_ideas[key] = idea;
  saveDb();
  console.log(`[DB] 🌟 Сгенерирована «Сказка дня» «${idea.title}» для ребёнка ${child.name} (${child.id}) на ${dateStr}`);
  return idea;
}

export function refreshDailyIdeaForChild(childId, localDate, userId) {
  const dateStr = localDate || new Date().toISOString().split('T')[0];

  let child = childId ? db.children[childId] : null;
  if (!child && userId) {
    child = Object.values(db.children).find((c) => c.user_id === userId);
  }
  if (!child) {
    child = {
      id: childId || 'child_default',
      name: 'Малыш',
      age: 4,
      gender: 'boy',
      interests: ['Волшебство'],
    };
  }

  const key = `${child.id}_${dateStr}`;
  const existing = db.daily_ideas ? db.daily_ideas[key] : null;
  const excludeTitles = existing ? [existing.title] : [];
  const refreshCount = (existing?._refreshCount || 0) + 1;

  const recentBooks = Object.values(db.books || {})
    .filter((b) => b.child_id === child.id || (userId && b.user_id === userId))
    .slice(-5)
    .map((b) => ({ title: b.title, theme: b.theme }));

  const newIdea = generateDailyIdea({
    child,
    recentBooks,
    dateStr,
    seed: refreshCount,
    excludeTitles,
  });

  newIdea._refreshCount = refreshCount;
  newIdea.status = 'REFRESHED';
  if (db.saved_ideas && db.saved_ideas[newIdea.id]) {
    newIdea.is_saved = true;
    newIdea.status = 'SAVED';
  }

  if (!db.daily_ideas) db.daily_ideas = {};
  db.daily_ideas[key] = newIdea;
  saveDb();
  console.log(`[DB] 🔄 Обновлена «Сказка дня» для ${child.name}: «${newIdea.title}» (попытка #${refreshCount})`);
  return newIdea;
}

export function saveDailyIdeaForChild(childId, ideaId, userId) {
  if (!db.saved_ideas) db.saved_ideas = {};
  if (!db.daily_ideas) db.daily_ideas = {};

  const dateStr = new Date().toISOString().split('T')[0];
  let targetIdea = null;

  if (ideaId) {
    for (const idea of Object.values(db.daily_ideas)) {
      if (idea.id === ideaId) {
        targetIdea = idea;
        break;
      }
    }
  }

  if (!targetIdea && childId) {
    const key = `${childId}_${dateStr}`;
    targetIdea = db.daily_ideas[key];
  }

  const targetId = ideaId || targetIdea?.id || `idea_${Date.now()}`;
  db.saved_ideas[targetId] = {
    id: targetId,
    child_id: childId || targetIdea?.child_id,
    user_id: userId,
    title: targetIdea?.title || 'Сохранённая сказка',
    theme: targetIdea?.theme || '',
    saved_at: new Date().toISOString(),
  };

  if (targetIdea) {
    targetIdea.is_saved = true;
    targetIdea.status = 'SAVED';
  }

  saveDb();
  console.log(`[DB] 🔖 Идея дня «${targetIdea?.title || targetId}» сохранена в закладки для ${userId}`);
  return { ok: true, is_saved: true, idea: targetIdea };
}

export function getSavedDailyIdeas(childId, userId) {
  if (!db.saved_ideas) return [];
  return Object.values(db.saved_ideas).filter((item) => {
    if (childId && item.child_id === childId) return true;
    if (userId && item.user_id === userId) return true;
    return false;
  });
}

// ========================================================
// 3. СЕРВЕРНЫЙ МОСТ ДЛЯ MINI APP (CORS, Proxy, Job Queue)
// ========================================================
const server = http.createServer(async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const origin = req.headers['origin'] || '';
  const allowedOrigins = [
    'https://x9x9x9www.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // Защита CORS: доверенные домены Telegram WebApp + локальная разработка
  const isAllowedOrigin = allowedOrigins.includes(origin) || origin.endsWith('.loca.lt');
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : (origin ? origin : '*'));
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-Init-Data, X-User-Id, x-user-id, Bypass-Tunnel-Reminder, bypass-tunnel-reminder, X-Pinggy-No-Screen, x-pinggy-no-screen, ngrok-skip-browser-warning, *');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Rate Limiting для защиты от спама и расхода баланса нейросетей
  const isLocalClient =
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.includes('127.0.0.1') ||
    clientIp === 'localhost' ||
    clientIp === 'unknown';
  if (req.method === 'POST' && !isLocalClient) {
    const isUnderLimit = checkRateLimit(clientIp, 60);
    if (!isUnderLimit) {
      console.warn(`[Security] ⛔️ Rate limit exceeded for IP: ${clientIp}`);
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Слишком много запросов. Пожалуйста, подождите 1 минуту.' }));
      return;
    }
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

function sendJsonResponse(res, statusCode, data, origin = '') {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const isAllowed = origin && (origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1'));
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Telegram-Init-Data, X-User-Id, x-user-id, Bypass-Tunnel-Reminder, bypass-tunnel-reminder, X-Pinggy-No-Screen, x-pinggy-no-screen, ngrok-skip-browser-warning, *',
  });
  res.end(jsonStr);
}

  if (url.pathname === '/health' || url.pathname === '/') {
    sendJsonResponse(
      res,
      200,
      {
        status: 'ok',
        providers: {
          text: AI_TEXT_PROVIDER,
          image: 'wellflow',
        },
        models: {
          text: WELLFLOW_TEXT_MODEL,
          image: WELLFLOW_IMAGE_MODEL,
        },
      },
      origin
    );
    return;
  }

  // Авторизация Telegram WebApp в режиме моста с сохранением в db.json
  if (url.pathname === '/api/v1/auth/telegram' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let username = '';
      let firstName = 'Родитель';
      let userId = 'user_demo';
      try {
        const parsed = JSON.parse(body || '{}');
        const initData = parsed.init_data || '';
        if (initData) {
          const sp = new URLSearchParams(initData);
          const u = JSON.parse(sp.get('user') || '{}');
          username = (u.username || '').toLowerCase();
          firstName = u.first_name || firstName;
          userId = String(u.id || userId);
        }
      } catch {}

      const isAdmin = ADMIN_USERNAMES.includes(username);
      if (!db.users[userId]) {
        db.users[userId] = {
          id: userId,
          telegram_user_id: userId,
          first_name: firstName,
          username: username || (isAdmin ? 'dinar_fazlyev' : 'parent'),
          role: isAdmin ? 'ADMIN' : 'USER',
          free_text_claimed_at: null,
          default_questions_enabled: true,
          timezone: 'UTC+3',
          balance: {
            total: isAdmin ? 999 : 5,
            paid: isAdmin ? 999 : 5,
            gift: 0,
            reserved: 0,
            available: isAdmin ? 999 : 5,
          },
          createdAt: new Date().toISOString(),
        };
      } else {
        if (username) db.users[userId].username = username;
        if (firstName) db.users[userId].first_name = firstName;
        if (isAdmin) db.users[userId].role = 'ADMIN';
      }
      saveDb();

      sendJsonResponse(res, 200, {
        token: `bridge_token_${userId}`,
        user: db.users[userId],
      }, origin);
    });
    return;
  }

  // Профиль и баланс пользователя в режиме моста (/me) — безопасная проверка ADMIN
  if ((url.pathname === '/api/v1/me' || url.pathname === '/api/me' || url.pathname === '/me') && req.method === 'GET') {
    const { user, isAdmin } = getAuthContext(req, url);
    sendJsonResponse(res, 200, {
      user,
      balance: user.balance || {
        total: isAdmin ? 999 : 5,
        paid: isAdmin ? 999 : 5,
        gift: 0,
        reserved: 0,
        available: isAdmin ? 999 : 5,
      },
      can_claim_free_story: (user.balance?.available ?? 5) > 0 || !user.free_text_claimed_at,
    }, origin);
    return;
  }

  // Корректировка кредитов администратора (/admin/credits/adjust) — только для проверенных ADMIN
  if (url.pathname === '/api/v1/admin/credits/adjust' && req.method === 'POST') {
    const { isAdmin, userId } = getAuthContext(req, url);
    if (!isAdmin) {
      sendJsonResponse(res, 403, { status: 'error', message: 'Доступ запрещён: требуются права администратора' }, origin);
      return;
    }
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const parsed = JSON.parse(bodyStr || '{}');
      const targetUserId = parsed.user_id || userId;
      const delta = Number(parsed.delta) || 999;
      if (db.users[targetUserId]) {
        db.users[targetUserId].balance.available += delta;
        db.users[targetUserId].balance.total += delta;
        db.users[targetUserId].balance.paid += delta;
        saveDb();
      }
      sendJsonResponse(res, 200, {
        status: 'ok',
        message: 'Кредиты успешно начислены',
        delta,
      }, origin);
    } catch {
      sendJsonResponse(res, 200, { status: 'ok', delta: 999 }, origin);
    }
    return;
  }

  // Проверка статуса фоновой задачи (/job-status и /jobs/:id и /api/v1/ai/job/:id)
  const isJobStatus =
    (url.pathname === '/api/v1/ai/job-status' ||
      url.pathname === '/api/ai/job-status' ||
      url.pathname === '/ai/job-status' ||
      url.pathname === '/job-status' ||
      url.pathname === '/api/v1/job-status' ||
      url.pathname === '/api/job-status' ||
      url.pathname === '/api/v1/ai/job' ||
      url.pathname === '/api/ai/job' ||
      url.pathname === '/ai/job' ||
      url.pathname === '/api/v1/job' ||
      url.pathname === '/api/job' ||
      url.pathname === '/job') &&
    req.method === 'GET';
  if (isJobStatus) {
    const jobId = url.searchParams.get('id') || url.searchParams.get('jobId') || '';
    const job = jobs.get(jobId);
    if (!job) {
      // 1. Проверяем в db.books
      const savedBook = db.books[jobId];
      if (savedBook) {
        sendJsonResponse(res, 200, {
          jobId,
          job_id: jobId,
          status: 'ready',
          state: 'COMPLETED',
          stage: 'finishing',
          progress: 100,
          progress_percentage: 100,
          message: 'Сказка готова!',
          story: savedBook,
        }, origin);
        return;
      }
      // 2. Проверяем в recentReadyStories
      for (const item of recentReadyStories.values()) {
        if (item.jobId === jobId && item.story) {
          sendJsonResponse(res, 200, {
            jobId,
            job_id: jobId,
            status: 'ready',
            state: 'COMPLETED',
            stage: 'finishing',
            progress: 100,
            progress_percentage: 100,
            message: 'Сказка готова!',
            story: item.story,
          }, origin);
          return;
        }
      }
      sendJsonResponse(res, 404, { status: 'not_found', error: 'Job not found' }, origin);
      return;
    }
    sendJsonResponse(res, 200, {
      ...job,
      jobId,
      job_id: jobId,
      status: job.status,
      state: job.status === 'ready' ? 'COMPLETED' : job.status === 'error' ? 'FAILED_FINAL' : 'PROCESSING',
      stage: job.stage || (job.status === 'ready' ? 'finishing' : 'writing'),
      progress: job.progress || (job.status === 'ready' ? 100 : 25),
      progress_percentage: job.progress || (job.status === 'ready' ? 100 : 25),
      message: job.message || (job.status === 'ready' ? 'Сказка готова!' : 'Создаём сказку...'),
      story: job.story,
    }, origin);
    return;
  }

  // Endpoint /api/v1/jobs/:id или /api/v1/ai/job/:id (совместимость с REST ApiClient и AI Job)
  const jobsMatch = url.pathname.match(/^\/(?:api\/v1\/|api\/)?(?:ai\/)?(?:jobs?|job-status)\/([a-zA-Z0-9_-]+)$/);
  if (jobsMatch && req.method === 'GET') {
    const jobId = jobsMatch[1];
    const job = jobs.get(jobId);
    if (job) {
      sendJsonResponse(res, 200, {
        ...job,
        job_id: jobId,
        jobId,
        status: job.status === 'ready' ? 'ready' : job.status,
        state: job.status === 'ready' ? 'COMPLETED' : job.status === 'error' ? 'FAILED_FINAL' : 'PROCESSING',
        readyStatus: job.status,
        stage: job.stage || (job.status === 'ready' ? 'finishing' : 'writing'),
        attempts: 1,
        progress: job.progress || (job.status === 'ready' ? 100 : 25),
        progress_percentage: job.progress || (job.status === 'ready' ? 100 : 25),
        message: job.message || (job.status === 'ready' ? 'Сказка готова!' : 'Создаём сказку...'),
        story: job.story,
        imageUrl: job.imageUrl,
        error: job.error,
      }, origin);
      return;
    }
    const book = db.books[jobId];
    if (book) {
      sendJsonResponse(res, 200, {
        job_id: jobId,
        jobId,
        status: 'ready',
        state: 'COMPLETED',
        readyStatus: 'ready',
        stage: 'finishing',
        attempts: 1,
        progress: 100,
        progress_percentage: 100,
        message: 'Сказка готова!',
        story: book,
      }, origin);
      return;
    }
    for (const item of recentReadyStories.values()) {
      if (item.jobId === jobId && item.story) {
        sendJsonResponse(res, 200, {
          job_id: jobId,
          jobId,
          status: 'ready',
          state: 'COMPLETED',
          readyStatus: 'ready',
          stage: 'finishing',
          attempts: 1,
          progress: 100,
          progress_percentage: 100,
          message: 'Сказка готова!',
          story: item.story,
        }, origin);
        return;
      }
    }
    sendJsonResponse(res, 404, { error: 'Job not found', status: 'not_found' }, origin);
    return;
  }

  // Получение последней готовой сказки для восстановления при обрывах (с учётом userId)
  const isLatestStory =
    (url.pathname === '/api/v1/ai/latest-story' ||
      url.pathname === '/api/ai/latest-story' ||
      url.pathname === '/latest-story') &&
    req.method === 'GET';
  if (isLatestStory) {
    const authCtx = getAuthContext(req, url);
    const userId = url.searchParams.get('userId') || authCtx.userId || '';
    const childName = (url.searchParams.get('childName') || '').trim().toLowerCase();
    const userChildKey = (userId && childName) ? `${userId}_${childName}` : '';
    const cached = userChildKey ? recentReadyStories.get(userChildKey) : null;
    if (cached && Date.now() - cached.readyAt < 15 * 60 * 1000) {
      sendJsonResponse(
        res,
        200,
        {
          status: 'ready',
          state: 'COMPLETED',
          story: cached.story,
          jobId: cached.jobId,
          message: 'Сказка готова!',
        },
        origin
      );
      return;
    }
    // Резервный поиск в постоянной БД книг по имени ребёнка
    if (childName) {
      const booksList = Object.values(db.books || {});
      for (let i = booksList.length - 1; i >= 0; i--) {
        const b = booksList[i];
        if ((b.child_name || '').toLowerCase() === childName) {
          sendJsonResponse(
            res,
            200,
            {
              status: 'ready',
              state: 'COMPLETED',
              story: b,
              jobId: b.id,
              message: 'Сказка готова!',
            },
            origin
          );
          return;
        }
      }
    }
    sendJsonResponse(res, 404, { status: 'not_found' }, origin);
    return;
  }

  // ========================================================
  // 1.2. ПОСТОЯННОЕ ХРАНИЛИЩЕ: ПРОФИЛИ ДЕТЕЙ (/api/v1/children)
  // ========================================================
  const isChildrenEndpoint =
    (url.pathname === '/api/v1/children' ||
      url.pathname === '/api/children' ||
      url.pathname === '/children');

  if (isChildrenEndpoint && req.method === 'GET') {
    const { userId } = getAuthContext(req, url);
    const childrenList = Object.values(db.children || {}).filter(
      (c) => (userId === 'user_default' ? (c.user_id === 'user_default' || !c.user_id) : c.user_id === userId)
    );
    sendJsonResponse(res, 200, childrenList, origin);
    return;
  }

  if (isChildrenEndpoint && req.method === 'POST') {
    const { userId } = getAuthContext(req, url);
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const childId = payload.id || (`child_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const childRecord = {
        id: childId,
        user_id: userId,
        name: (payload.name || 'Малыш').trim(),
        age: Number(payload.age) || 4,
        gender: payload.gender || (payload.appearance?.gender || 'boy'),
        interests: Array.isArray(payload.interests) && payload.interests.length > 0 ? payload.interests : ['Волшебство'],
        appearance: payload.appearance || {},
        is_active: payload.is_active !== false,
        updatedAt: new Date().toISOString(),
      };
      db.children[childId] = childRecord;
      saveDb();
      console.log(`[DB] 👶 Профиль ребёнка «${childRecord.name}» сохранён в db.json для ${userId}`);
      sendJsonResponse(res, 201, childRecord, origin);
    } catch (err) {
      sendJsonResponse(res, 400, { error: err.message }, origin);
    }
    return;
  }

  // Обновление профиля ребёнка PATCH /api/v1/children/:id
  const childMatch = url.pathname.match(/^\/(?:api\/v1\/)?children\/([a-zA-Z0-9_-]+)$/);
  if (childMatch && (req.method === 'PATCH' || req.method === 'PUT')) {
    const { userId } = getAuthContext(req, url);
    const childId = childMatch[1];
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const patch = JSON.parse(bodyStr || '{}');
      const existing = db.children[childId] || { id: childId, user_id: userId };
      db.children[childId] = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      saveDb();
      sendJsonResponse(res, 200, db.children[childId], origin);
    } catch (err) {
      sendJsonResponse(res, 400, { error: err.message }, origin);
    }
    return;
  }

  // ========================================================
  // 1.3. ПОСТОЯННОЕ ХРАНИЛИЩЕ: КНИГИ И СКАЗКИ (/api/v1/books)
  // ========================================================
  const isBooksEndpoint =
    (url.pathname === '/api/v1/books' ||
      url.pathname === '/api/books' ||
      url.pathname === '/books');

  if (isBooksEndpoint && req.method === 'GET') {
    const { userId } = getAuthContext(req, url);
    const format = url.searchParams.get('format');
    let list = Object.values(db.books || {}).filter(
      (b) => (userId === 'user_default' ? (b.user_id === 'user_default' || !b.user_id) : b.user_id === userId)
    );
    if (format && format !== 'ALL') {
      list = list.filter((b) => b.format === format);
    }
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const summaries = list.map((b) => ({
      id: b.id,
      child_id: b.child_id || 'default',
      child_name: b.child_name || '',
      title: b.title || 'Сказка',
      status: b.status || 'ILLUSTRATED',
      format: b.format || 'ILLUSTRATED',
      cover_url: b.cover_url || null,
      created_at: b.created_at || new Date().toISOString(),
    }));
    sendJsonResponse(res, 200, summaries, origin);
    return;
  }

  // Сохранение книги POST /api/v1/books или /api/v1/books/free
  const isSaveBookEndpoint =
    isBooksEndpoint ||
    url.pathname === '/api/v1/books/free' ||
    url.pathname === '/books/free';

  if (isSaveBookEndpoint && req.method === 'POST') {
    const { userId } = getAuthContext(req, url);
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    try {
      const payload = JSON.parse(bodyStr || '{}');
      const bookId = payload.id || (`book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      const bookRecord = {
        id: bookId,
        user_id: userId,
        child_id: payload.child_id || 'default',
        child_name: payload.child_name || payload.childName || '',
        title: payload.title || 'Сказка',
        status: payload.status || 'ILLUSTRATED',
        format: payload.format || 'ILLUSTRATED',
        cover_url: payload.cover_url || null,
        scenes: (payload.scenes || []).map((s, idx) => ({
          id: s.id || `scene_${s.scene_index || s.index || idx + 1}`,
          scene_index: s.scene_index || s.index || idx + 1,
          index: s.scene_index || s.index || idx + 1,
          text: s.text || '',
          image_url: s.image_url || null,
          image_prompt: s.image_prompt || s.visual || null,
        })),
        questions: (payload.questions || []).map((q, idx) => ({
          id: q.id || `q_${idx + 1}`,
          after_scene: q.after_scene || (idx === 0 ? 2 : 4),
          question: q.question || '',
          parent_hint: q.parent_hint || null,
          skill_tag: q.skill_tag || q.skill || 'emotions',
        })),
        can_upgrade: false,
        created_at: payload.created_at || new Date().toISOString(),
      };
      db.books[bookId] = bookRecord;
      saveDb();
      console.log(`[DB] 📖 Книга «${bookRecord.title}» сохранена в db.json для ${userId}`);
      sendJsonResponse(res, 201, {
        book_id: bookId,
        job_id: bookId,
        status: 'ok',
        book: bookRecord,
      }, origin);
    } catch (err) {
      sendJsonResponse(res, 400, { error: err.message }, origin);
    }
    return;
  }

  // Получение детальной книги GET /api/v1/books/:id
  const bookMatch = url.pathname.match(/^\/(?:api\/v1\/)?books\/([a-zA-Z0-9_-]+)$/);
  if (bookMatch && req.method === 'GET') {
    const bookId = bookMatch[1];
    let book = db.books[bookId];
    if (!book) {
      // Проверяем задачи в памяти
      const job = jobs.get(bookId);
      if (job && job.story) {
        book = {
          id: bookId,
          ...job.story,
          can_upgrade: false,
        };
      }
    }
    if (!book) {
      // Проверяем кэш готовых сказок
      for (const item of recentReadyStories.values()) {
        if (item.jobId === bookId || item.story?.id === bookId) {
          book = item.story;
          break;
        }
      }
    }
    if (!book) {
      sendJsonResponse(res, 404, { error: 'Book not found' }, origin);
      return;
    }
    sendJsonResponse(res, 200, {
      id: book.id,
      title: book.title || 'Сказка',
      status: book.status || 'ILLUSTRATED',
      format: book.format || 'ILLUSTRATED',
      cover_url: book.cover_url || null,
      scenes: (book.scenes || []).map((s, idx) => ({
        id: s.id || `scene_${s.scene_index || s.index || idx + 1}`,
        scene_index: s.scene_index || s.index || idx + 1,
        index: s.scene_index || s.index || idx + 1,
        text: s.text || '',
        image_url: s.image_url || null,
        image_prompt: s.image_prompt || s.visual || null,
      })),
      questions: (book.questions || []).map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        after_scene: q.after_scene || (idx === 0 ? 2 : 4),
        question: q.question || '',
        parent_hint: q.parent_hint || null,
        skill_tag: q.skill_tag || q.skill || 'emotions',
      })),
      can_upgrade: Boolean(book.can_upgrade),
    }, origin);
    return;
  }

  // Апгрейд книги POST /api/v1/books/:id/upgrade
  const bookUpgradeMatch = url.pathname.match(/^\/(?:api\/v1\/)?books\/([a-zA-Z0-9_-]+)\/upgrade$/);
  if (bookUpgradeMatch && req.method === 'POST') {
    const bookId = bookUpgradeMatch[1];
    if (db.books[bookId]) {
      db.books[bookId].format = 'ILLUSTRATED';
      db.books[bookId].status = 'ILLUSTRATED';
      saveDb();
    }
    sendJsonResponse(res, 200, { book_id: bookId, job_id: bookId, status: 'ok' }, origin);
    return;
  }

  // ========================================================
  // 1.4. РЕФЕРАЛЫ, ИДЕИ ДНЯ, КАТАЛОГ И УДАЛЕНИЕ АККАУНТА
  // ========================================================
  if ((url.pathname === '/api/v1/referrals/me' || url.pathname === '/referrals/me') && req.method === 'GET') {
    const { userId } = getAuthContext(req, url);
    const botUser = process.env.TELEGRAM_BOT_USERNAME || 'My_SSSkaska_bot';
    sendJsonResponse(res, 200, {
      referral_link: `https://t.me/${botUser}?startapp=ref_${userId}`,
      qualified_friends_count: 0,
      gift_credits_earned: 0,
    }, origin);
    return;
  }

  if ((url.pathname === '/api/v1/daily-idea' || url.pathname === '/daily-idea') && req.method === 'GET') {
    const { userId } = getAuthContext(req, url);
    const childId = url.searchParams.get('child_id') || url.searchParams.get('childId') || '';
    const dateStr = url.searchParams.get('date') || url.searchParams.get('local_date') || new Date().toISOString().split('T')[0];
    const idea = getDailyIdeaForChild(childId, dateStr, userId);
    sendJsonResponse(res, 200, idea, origin);
    return;
  }

  if ((url.pathname === '/api/v1/daily-idea/refresh' || url.pathname === '/daily-idea/refresh') && req.method === 'POST') {
    const { userId } = getAuthContext(req, url);
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    let payload = {};
    try { payload = JSON.parse(bodyStr || '{}'); } catch {}
    const childId = payload.child_id || payload.childId || url.searchParams.get('child_id') || '';
    const dateStr = payload.local_date || payload.date || new Date().toISOString().split('T')[0];
    const idea = refreshDailyIdeaForChild(childId, dateStr, userId);
    sendJsonResponse(res, 200, idea, origin);
    return;
  }

  if ((url.pathname === '/api/v1/daily-idea/save' || url.pathname === '/daily-idea/save') && req.method === 'POST') {
    const { userId } = getAuthContext(req, url);
    let bodyStr = '';
    for await (const chunk of req) bodyStr += chunk;
    let payload = {};
    try { payload = JSON.parse(bodyStr || '{}'); } catch {}
    const childId = payload.child_id || payload.childId || '';
    const ideaId = payload.idea_id || payload.ideaId || '';
    const result = saveDailyIdeaForChild(childId, ideaId, userId);
    sendJsonResponse(res, 200, result, origin);
    return;
  }

  if ((url.pathname === '/api/v1/daily-idea/saved' || url.pathname === '/daily-idea/saved') && req.method === 'GET') {
    const { userId } = getAuthContext(req, url);
    const childId = url.searchParams.get('child_id') || '';
    const list = getSavedDailyIdeas(childId, userId);
    sendJsonResponse(res, 200, list, origin);
    return;
  }

  if ((url.pathname === '/api/v1/catalog' || url.pathname === '/catalog') && req.method === 'GET') {
    sendJsonResponse(res, 200, [
      { id: 'single_book_1', title: '1 сказка', price_stars: 50 },
      { id: 'pack_5', title: '5 сказок', price_stars: 190 },
    ], origin);
    return;
  }

  if ((url.pathname === '/api/v1/orders' || url.pathname === '/orders') && req.method === 'POST') {
    sendJsonResponse(res, 200, {
      order_id: `ord_${Date.now()}`,
      stars_amount: 50,
      status: 'CREATED',
    }, origin);
    return;
  }

  if ((url.pathname === '/api/v1/credits' || url.pathname === '/credits') && req.method === 'GET') {
    const { user } = getAuthContext(req, url);
    sendJsonResponse(res, 200, [
      {
        id: 'c_init',
        delta: user.balance?.total ?? 5,
        source_type: 'INITIAL_GRANT',
        created_at: user.createdAt || new Date().toISOString(),
      },
    ], origin);
    return;
  }

  if ((url.pathname === '/api/v1/privacy/delete' || url.pathname === '/privacy/delete') && req.method === 'POST') {
    const { userId } = getAuthContext(req, url);
    delete db.users[userId];
    for (const [id, child] of Object.entries(db.children)) {
      if (child.user_id === userId) delete db.children[id];
    }
    for (const [id, book] of Object.entries(db.books)) {
      if (book.user_id === userId) delete db.books[id];
    }
    saveDb();
    sendJsonResponse(res, 200, { ok: true }, origin);
    return;
  }

  // Мгновенная генерация 3D-аватарки по фото ребенка + наряд (Zero-Storage: фото удаляется сразу после Vision)
  const isGenerateAvatar =
    (url.pathname === '/api/v1/character/generate-avatar' ||
      url.pathname === '/api/v1/ai/generate-avatar' ||
      url.pathname === '/api/character/generate-avatar' ||
      url.pathname === '/api/ai/generate-avatar' ||
      url.pathname === '/character/generate-avatar' ||
      url.pathname === '/ai/generate-avatar') &&
    req.method === 'POST';

  if (isGenerateAvatar) {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const parsedBody = JSON.parse(bodyStr || '{}');
      let imageBase64 = parsedBody.imageBase64 || parsedBody.image;
      const outfit = parsedBody.outfit || '';
      const knownGender = parsedBody.knownGender || parsedBody.gender || null;
      const knownName = parsedBody.knownName || parsedBody.name || null;
      const knownAge = Number(parsedBody.knownAge || parsedBody.age) || null;
      const inferredGenderFromName = knownName ? inferRussianNameGender(knownName) : null;
      const genderInstruction = knownGender
        ? `Пол ребёнка уже точно подтверждён родителем: ${knownGender === 'girl' ? 'девочка (girl)' : 'мальчик (boy)'}.`
        : (inferredGenderFromName
          ? `Имя ребёнка: ${knownName} (пол: ${inferredGenderFromName === 'girl' ? 'девочка (girl)' : 'мальчик (boy)'}).`
          : 'Внимательно определи пол ребёнка по лицу, причёске и одежде.');

      if (!imageBase64) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'imageBase64 is required' }));
        return;
      }

      if (AI_MOCK_MODE) {
        console.log('[AvatarGen] ⚡️ Режим тестирования (AI_MOCK_MODE): возврат мок 3D аватара');
        const mockGender = knownGender || inferredGenderFromName || 'boy';
        const mockTraits = {
          gender: mockGender,
          approxAge: knownAge || 4,
          hairColor: 'русые',
          hairType: mockGender === 'girl' ? 'длинные' : 'короткие',
          eyeColor: 'голубые',
          skinTone: 'светлая',
          distinctiveFeatures: 'милые круглые очки',
        };
        const mockKey = resolveChildAvatarKey(mockTraits);
        const mockUrl = `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${mockKey}.webp`;
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(
          JSON.stringify({
            status: 'ok',
            avatarUrl: mockUrl,
            avatar_id: mockKey,
            traits: mockTraits,
          })
        );
        return;
      }

      // Шаг А (Vision): Gemini Flash / gpt-6-luna извлекает JSON с чертами лица
      const visionPrompt = `Ты профессиональный детский AI-стилист для создания персонализированной детской сказки.
Внимательно посмотри на фото ребёнка и определи его анатомические и визуальные черты для мультяшного 3D-персонажа. ${genderInstruction}
Выбирай строго из указанных вариантов:
- gender: ${knownGender ? `"${knownGender}"` : `"girl" (если на фото девочка) или "boy" (если на фото мальчик)`}
- approxAge: число от 1 до 12 (приблизительный возраст)
- hairColor: строго один из: "светлые" | "русые" | "тёмные" | "рыжие"
- hairType: строго один из: "кудрявые" | "короткие" | "длинные" | "прямые"
- eyeColor: строго один из: "карие" | "голубые" | "зелёные" | "серые"
- skinTone: строго один из: "светлая" | "персиковая" | "смуглая"
- distinctiveFeatures: особенности внешности на русском (например: "милые круглые очки", "веснушки на щёчках" или "")

Ответь ИСКЛЮЧИТЕЛЬНО валидным JSON-объектом:
{
  "gender": "${knownGender || inferredGenderFromName || 'girl'}",
  "approxAge": 4,
  "hairColor": "русые",
  "hairType": "кудрявые",
  "eyeColor": "голубые",
  "skinTone": "светлая",
  "distinctiveFeatures": "милые круглые очки"
}`;

      let dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ];

      const raw = await callWellflowChat(messages, '[AvatarVision]', { timeoutMs: 60000 });

      let parsed = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      const hairColorMap = {
        'светлые': 'светлые',
        'блонд': 'светлые',
        'русые': 'русые',
        'шатен': 'русые',
        'тёмные': 'тёмные',
        'черные': 'тёмные',
        'чёрные': 'тёмные',
        'брюнет': 'тёмные',
        'рыжие': 'рыжие',
      };
      const hairColor = hairColorMap[String(parsed.hairColor || '').toLowerCase()] || 'русые';
      const hairType = ['кудрявые', 'короткие', 'длинные', 'прямые'].includes(parsed.hairType)
        ? parsed.hairType
        : String(parsed.hairType || '').includes('кудр')
        ? 'кудрявые'
        : 'короткие';
      const eyeColor = ['карие', 'голубые', 'зелёные', 'серые'].includes(parsed.eyeColor) ? parsed.eyeColor : 'голубые';
      const skinTone = ['светлая', 'персиковая', 'смуглая'].includes(parsed.skinTone) ? parsed.skinTone : 'светлая';
      const rawGender = String(parsed.gender || '').toLowerCase();
      const detectedGender = rawGender.includes('girl') || rawGender.includes('девочк')
        ? 'girl'
        : (rawGender.includes('boy') || rawGender.includes('мальч')
          ? 'boy'
          : (inferredGenderFromName || 'boy'));
      const gender = knownGender || detectedGender;
      const approxAge =
        Number(parsed.approxAge || parsed.estimatedAge) >= 1 && Number(parsed.approxAge || parsed.estimatedAge) <= 12
          ? Number(parsed.approxAge || parsed.estimatedAge)
          : (knownAge || 4);
      const distinctiveFeatures = parsed.distinctiveFeatures || '';

      const traits = {
        gender,
        approxAge,
        hairColor,
        hairType,
        eyeColor,
        skinTone,
        distinctiveFeatures,
      };

      const avatarId = resolveChildAvatarKey(traits);

      // Шаг В (Image Generation): Формирование промпта для Nano-Banana-2
      const genderEn = gender === 'girl' ? 'girl' : 'boy';
      const hairColorEn = {
        'светлые': 'blonde',
        'русые': 'light brown',
        'тёмные': 'dark brown',
        'рыжие': 'ginger red',
      }[hairColor] || 'light brown';

      const isLong = String(hairType || '').includes('длин') || String(hairType || '').includes('long');
      const hairTypeEn = isLong
        ? 'long flowing hair reaching below shoulders, neat hairstyle, consistent length'
        : ({
            'кудрявые': 'curly',
            'короткие': 'short neat',
            'прямые': 'straight',
          }[hairType] || 'curly');

      const eyeColorEn = {
        'карие': 'warm hazel brown',
        'голубые': 'bright expressive blue',
        'зелёные': 'vibrant emerald green',
        'серые': 'gentle grey',
      }[eyeColor] || 'bright expressive blue';

      const skinToneEn = {
        'светлая': 'fair',
        'персиковая': 'warm peach',
        'смуглая': 'golden tan',
      }[skinTone] || 'fair';

      let distinctiveEn = '';
      if (distinctiveFeatures) {
        const feat = distinctiveFeatures.toLowerCase();
        if (feat.includes('очк')) distinctiveEn = 'cute round glasses';
        else if (feat.includes('веснуш')) distinctiveEn = 'cute freckles on cheeks';
        else distinctiveEn = distinctiveFeatures;
      }

      let outfitEn = 'cozy fairytale outfit';
      if (outfit) {
        const o = String(outfit).toLowerCase();
        if (o.includes('супергер')) outfitEn = 'superhero costume with cape';
        else if (o.includes('космонавт') || o.includes('скафандр')) outfitEn = 'white astronaut space suit';
        else if (o.includes('динозавр') || o.includes('кигуруми')) outfitEn = 'cozy dinosaur kigurumi onesie';
        else if (o.includes('маг') || o.includes('манти')) outfitEn = 'little starry wizard robe';
        else if (o.includes('плать')) outfitEn = 'festive fairytale ball gown';
        else if (o.includes('дождевик')) outfitEn = 'yellow raincoat and boots';
        else if (o.includes('пижам')) outfitEn = 'soft pajamas with stars';
        else outfitEn = outfit;
      }

      const avatarPrompt = `Close-up 3D cartoon style character avatar portrait of a cute ${approxAge}-year-old ${genderEn}, ${hairColorEn} ${hairTypeEn} hair, bright expressive ${eyeColorEn} eyes, ${skinToneEn} skin${distinctiveEn ? ', ' + distinctiveEn : ''}, wearing ${outfitEn || 'cozy fairytale outfit'}, warm gentle smile looking at camera, soft cinematic studio lighting, magical blurry background with warm bokeh, square 1:1, ultra-detailed, 8k, no text, no watermark.`;

      console.log(`[AvatarGen] 🎨 Запуск генерации 3D аватара: ${avatarPrompt.slice(0, 100)}...`);

      let avatarUrl = '';
      try {
        const remoteUrl = await generateWellflowImageAI(avatarPrompt, 1, null);
        if (remoteUrl) {
          avatarUrl = await saveGeneratedImage(remoteUrl, 'avatars', 'avatar_' + Date.now());
        }
      } catch (genErr) {
        console.warn('[AvatarGen] ⚠️ Ошибка генерации Nano-Banana-2, fallback к локальному пресету:', genErr.message);
      } finally {
        // Шаг Б (Zero-Storage): Буфер imageBase64 и dataUrl немедленно очищается из памяти
        dataUrl = null;
        imageBase64 = null;
        parsedBody.imageBase64 = null;
        parsedBody.image = null;
      }

      if (!avatarUrl) {
        avatarUrl = `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarId}.webp`;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          status: 'ok',
          avatarUrl,
          avatar_id: avatarId,
          traits,
        })
      );
    } catch (err) {
      console.warn('[AvatarGen] Ошибка:', err.message);
      const isGirl = knownGender === 'girl' || (inferredGenderFromName === 'girl');
      const fallbackGender = isGirl ? 'girl' : (knownGender || 'boy');
      const fallbackTraits = {
        gender: fallbackGender,
        approxAge: knownAge || 4,
        hairColor: 'русые',
        hairType: fallbackGender === 'girl' ? 'длинные' : 'короткие',
        eyeColor: 'карие',
        skinTone: 'светлая',
        distinctiveFeatures: '',
      };
      const fallbackId = resolveChildAvatarKey(fallbackTraits);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          status: 'fallback',
          avatarUrl: `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${fallbackId}.webp`,
          avatar_id: fallbackId,
          traits: fallbackTraits,
        })
      );
    }
    return;
  }

  // Анализ фото ребёнка для автоподбора параметров внешности (Zero-Storage Vision: фото НЕ сохраняется на диск/в БД)
  const isAnalyzePhoto =
    (url.pathname === '/api/v1/ai/analyze-photo' ||
      url.pathname === '/api/v1/character/analyze-photo' ||
      url.pathname === '/api/ai/analyze-photo' ||
      url.pathname === '/api/character/analyze-photo' ||
      url.pathname === '/ai/analyze-photo' ||
      url.pathname === '/character/analyze-photo') &&
    req.method === 'POST';

  if (isAnalyzePhoto) {
    let parsedBody = {};
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      parsedBody = JSON.parse(bodyStr || '{}');
      const imageBase64 = parsedBody.imageBase64 || parsedBody.image;
      const knownGender = parsedBody.knownGender || parsedBody.gender || null;
      const knownName = parsedBody.knownName || parsedBody.name || null;
      const knownAge = Number(parsedBody.knownAge || parsedBody.age) || null;

      if (!imageBase64) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'imageBase64 is required' }));
        return;
      }

      if (AI_MOCK_MODE) {
        console.log('[PhotoVision] ⚡️ Режим тестирования (AI_MOCK_MODE): мгновенный возврат тестового профиля');
        const mockGender = knownGender || 'boy';
        const mockAnalysis = {
          gender: mockGender,
          approxAge: knownAge || 4,
          estimatedAge: knownAge || 4,
          hairColor: 'русые',
          hairLength: mockGender === 'girl' ? 'длинные' : 'короткие',
          hairStructure: 'прямые',
          hairType: mockGender === 'girl' ? 'длинные' : 'короткие',
          eyeColor: 'карие',
          skinTone: 'персиковая',
          clothingItem: mockGender === 'girl' ? 'платьице' : 'уютный свитер',
          clothingDescription: mockGender === 'girl' ? 'платьице' : 'уютный свитер',
          clothingColor: mockGender === 'girl' ? 'нежно-розовый' : 'небесно-голубой',
          distinctiveFeatures: '',
          hasGlasses: false,
          avatar_id: `${mockGender}_brown`,
          confidenceTip: 'Внешность малыша определена (3D-аватар подобран)!',
        };
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(
          JSON.stringify({
            status: 'ok',
            analysis: mockAnalysis,
            ...mockAnalysis,
          })
        );
        return;
      }

      const inferredGenderFromName = knownName ? inferRussianNameGender(knownName) : null;
      const genderHint = knownGender
        ? `Пол ребёнка уже точно известен: ${knownGender === 'girl' ? 'девочка (girl)' : 'мальчик (boy)'}.`
        : (inferredGenderFromName
          ? `Имя ребёнка: ${knownName} (пол: ${inferredGenderFromName === 'girl' ? 'девочка (girl)' : 'мальчик (boy)'}).`
          : 'Внимательно определи пол ребёнка по чертам лица, причёске и одежде.');

      const visionPrompt = `Ты детский фото-стилист для 3D-мультипликации. Внимательно взгляни на фото ребёнка и определи его визуальные черты. ${genderHint}

Выбери строго из разрешённых вариантов:
- gender: ${knownGender ? `"${knownGender}"` : `"girl" (девочка) или "boy" (мальчик)`}
- estimatedAge: число от 2 до 6
- hairColor: строго один из: "светлые" | "русые" | "тёмные" | "рыжие"
- hairLength: строго "короткие" или "длинные"
- hairStructure: строго "прямые" или "кудрявые"
- eyeColor: строго один из: "карие" | "голубые" | "зелёные" | "серые"
- skinTone: строго один из: "светлая" | "персиковая" | "смуглая"
- hasGlasses: true если ребёнок в очках, иначе false
- clothingItem: строго один из: "уютный свитер" | "платьице" | "комбинезончик" | "толстовка" | "дождевик и сапожки" | "пижамка со звёздами"
- clothingColor: строго один из: "солнечно-жёлтый" | "небесно-голубой" | "изумрудный" | "нежно-розовый" | "терракотовый"
- confidenceTip: короткое тёплое сообщение родителю на русском (1 предложение)

ОТВЕТЬ ТОЛЬКО ЧИСТЫМ JSON БЕЗ РАССУЖДЕНИЙ:
{
  "gender": "${knownGender || inferredGenderFromName || 'girl'}",
  "estimatedAge": 4,
  "hairColor": "русые",
  "hairLength": "короткие",
  "hairStructure": "прямые",
  "eyeColor": "карие",
  "skinTone": "персиковая",
  "hasGlasses": false,
  "clothingItem": "уютный свитер",
  "clothingColor": "небесно-голубой",
  "confidenceTip": "Определили русые волосы, карие глазки и уютную одежду."
}`;

      let dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ];

      // Vision анализ с достаточным временем для reasoning токенов
      const raw = await callWellflowChat(messages, '[PhotoVision]', { max_tokens: 350, timeoutMs: 45000 });
      let parsed = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      }

      const hairColorMap = {
        'светлые': 'светлые',
        'блонд': 'светлые',
        'русые': 'русые',
        'шатен': 'русые',
        'тёмные': 'тёмные',
        'черные': 'тёмные',
        'чёрные': 'тёмные',
        'брюнет': 'тёмные',
        'рыжие': 'рыжие',
      };
      const hairColor = hairColorMap[String(parsed.hairColor || '').toLowerCase()] || 'русые';
      const hairLength = String(parsed.hairLength || '').includes('длин') ? 'длинные' : 'короткие';
      const hairStructure =
        String(parsed.hairStructure || '').includes('кудр') || String(parsed.hairStructure || '').includes('волн')
          ? 'кудрявые'
          : 'прямые';
      const eyeColor = ['карие', 'голубые', 'зелёные', 'серые'].includes(parsed.eyeColor) ? parsed.eyeColor : 'карие';
      const skinTone = ['светлая', 'персиковая', 'смуглая'].includes(parsed.skinTone) ? parsed.skinTone : 'персиковая';
      const rawGender = String(parsed.gender || '').toLowerCase();
      const detectedGender = rawGender.includes('girl') || rawGender.includes('девочк')
        ? 'girl'
        : (rawGender.includes('boy') || rawGender.includes('мальч')
          ? 'boy'
          : (inferredGenderFromName || 'boy'));
      const gender = knownGender || detectedGender;
      const estimatedAge =
        Number(parsed.estimatedAge) >= 2 && Number(parsed.estimatedAge) <= 6
          ? Number(parsed.estimatedAge)
          : (knownAge || 4);

      const hasGlasses = Boolean(
        parsed.hasGlasses === true ||
        String(parsed.distinctiveFeatures || '').toLowerCase().includes('очк')
      );
      const distinctiveFeatures = hasGlasses ? 'очки' : (parsed.distinctiveFeatures || '');

      // Привязка одежды к каталогу интерфейса
      const validItems = ['уютный свитер', 'платьице', 'комбинезончик', 'толстовка', 'дождевик и сапожки', 'пижамка со звёздами'];
      let clothingItem = validItems.find((v) => v === parsed.clothingItem);
      if (!clothingItem) {
        const desc = String(parsed.clothingDescription || parsed.clothingItem || '').toLowerCase();
        if (desc.includes('плать')) clothingItem = 'платьице';
        else if (desc.includes('дождевик') || desc.includes('сапожк')) clothingItem = 'дождевик и сапожки';
        else if (desc.includes('комбинезон')) clothingItem = 'комбинезончик';
        else if (desc.includes('пижам')) clothingItem = 'пижамка со звёздами';
        else if (desc.includes('толстовк') || desc.includes('худи')) clothingItem = 'толстовка';
        else clothingItem = gender === 'girl' ? 'платьице' : 'уютный свитер';
      }

      const validColors = ['солнечно-жёлтый', 'небесно-голубой', 'изумрудный', 'нежно-розовый', 'терракотовый'];
      let clothingColor = validColors.find((c) => c === parsed.clothingColor);
      if (!clothingColor) {
        const rawCol = String(parsed.clothingColor || '').toLowerCase();
        if (rawCol.includes('жёлт') || rawCol.includes('желт')) clothingColor = 'солнечно-жёлтый';
        else if (rawCol.includes('голуб') || rawCol.includes('син')) clothingColor = 'небесно-голубой';
        else if (rawCol.includes('зелён') || rawCol.includes('изумруд')) clothingColor = 'изумрудный';
        else if (rawCol.includes('розов') || rawCol.includes('красн')) clothingColor = 'нежно-розовый';
        else clothingColor = gender === 'girl' ? 'нежно-розовый' : 'небесно-голубой';
      }

      const avatarId = resolveChildAvatarKey({ gender, hairColor, skinTone, distinctiveFeatures });
      const hairType = hairStructure === 'кудрявые' ? 'кудрявые' : (hairLength === 'длинные' ? 'длинные' : 'короткие');

      const result = {
        gender,
        approxAge: estimatedAge,
        estimatedAge,
        hairColor,
        hairLength,
        hairStructure,
        hairType,
        eyeColor,
        skinTone,
        distinctiveFeatures,
        hasGlasses,
        avatar_id: avatarId,
        avatarUrl: `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarId}.webp`,
        clothingItem,
        clothingDescription: clothingItem,
        clothingColor,
        confidenceTip: parsed.confidenceTip || `Определили ${hairColor} ${hairType} волосы, ${eyeColor} глазки и ${clothingColor} одежду!`,
      };

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ status: 'ok', analysis: result, ...result }));
    } catch (err) {
      console.warn('[PhotoVision] ⚠️ Ошибка анализа фото:', err.message);
      const knownGender = parsedBody.knownGender || parsedBody.gender || null;
      const knownName = parsedBody.knownName || parsedBody.name || null;
      const knownAge = Number(parsedBody.knownAge || parsedBody.age) || null;
      const fbGender = knownGender || (knownName && (knownName.endsWith('а') || knownName.endsWith('я')) ? 'girl' : 'boy');
      const fbAge = knownAge && knownAge >= 2 && knownAge <= 6 ? knownAge : 4;

      const fallbackResult = {
        gender: fbGender,
        approxAge: fbAge,
        estimatedAge: fbAge,
        hairColor: 'русые',
        hairLength: fbGender === 'girl' ? 'длинные' : 'короткие',
        hairStructure: 'прямые',
        hairType: fbGender === 'girl' ? 'длинные' : 'короткие',
        eyeColor: 'карие',
        skinTone: 'персиковая',
        distinctiveFeatures: '',
        hasGlasses: false,
        avatar_id: `${fbGender}_brown`,
        clothingItem: fbGender === 'girl' ? 'платьице' : 'уютный свитер',
        clothingDescription: fbGender === 'girl' ? 'платьице' : 'уютный свитер',
        clothingColor: fbGender === 'girl' ? 'нежно-розовый' : 'небесно-голубой',
        confidenceTip: 'Установили базовые параметры внешности — вы можете скорректировать их в один клик.',
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(
        JSON.stringify({
          status: 'fallback',
          analysis: fallbackResult,
          ...fallbackResult,
        })
      );
    }
    return;
  }

  // Полная генерация сказки + всех 4 иллюстраций на сервере (мгновенный 202 ответ + опрос)
  const isGenerateStory =
    (url.pathname === '/api/v1/ai/generate-story' ||
      url.pathname === '/api/ai/generate-story' ||
      url.pathname === '/ai/generate-story' ||
      url.pathname === '/api/v1/story/generate' ||
      url.pathname === '/api/story/generate' ||
      url.pathname === '/generate-story') &&
    req.method === 'POST';
  if (isGenerateStory) {
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const params = JSON.parse(bodyStr || '{}');

      const authCtx = getAuthContext(req, url);
      const userId = params.userId || authCtx.userId || 'user_default';
      params.userId = userId;

      const childKey = (params.childName || '').trim().toLowerCase();
      const userChildKey = childKey ? `${userId}_${childKey}` : '';

      // Защита от случайного дабл-клика: если генерация для этого ребенка была запущена секунды назад (<45с), переиспользуем pending задачу
      if (userChildKey && !params.forceNew) {
        const existingJob = [...jobs.entries()].find(
          ([id, j]) =>
            j.status === 'pending' &&
            j.childKey === userChildKey &&
            Date.now() - j.createdAt < 45000
        );
        if (existingJob) {
          console.log(`[API Bridge] ⚡️ Переиспользуем активную задачу ${existingJob[0]} для «${params.childName}» (user: ${userId})`);
          sendJsonResponse(res, 202, { jobId: existingJob[0], status: 'pending' }, origin);
          return;
        }
      }

      const jobId = 'story_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      jobs.set(jobId, {
        status: 'pending',
        userId,
        childKey: userChildKey,
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
          if (userChildKey) {
            recentReadyStories.set(userChildKey, {
              story,
              jobId,
              readyAt: Date.now(),
              userId,
            });
          }
          console.log(`[StoryEngine] 🎉 Сказка «${story.title}» полностью готова! (jobId: ${jobId}, user: ${userId})`);
          jobs.set(jobId, {
            status: 'ready',
            story,
            userId,
            childKey: userChildKey,
            stage: 'finishing',
            progress: 100,
            message: 'Сказка готова!',
            createdAt: Date.now(),
          });
        })
        .catch((err) => {
          console.error('[API Bridge Error generate-story]:', err.message, err.cause || '');
          jobs.set(jobId, { status: 'error', userId, childKey: userChildKey, error: err.message, createdAt: Date.now() });
        });

      // Мгновенный ответ клиенту (менее 10мс!)
      sendJsonResponse(res, 202, { jobId, status: 'pending' }, origin);
    } catch (err) {
      console.error('[API Bridge Error generate-story]:', err.message, err.cause || '');
      sendJsonResponse(res, 500, { error: err.message }, origin);
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

if (isMainModule) {
  server.listen(BRIDGE_PORT, '0.0.0.0', () => {
    console.log(`[API Bridge] ⚡️ Локальный сервер запущен на порту ${BRIDGE_PORT}`);
  });
}

// ========================================================
// 4. ТУННЕЛИ: localtunnel важнее случайного serveo
// ========================================================
async function checkTunnelHealth(url, timeoutMs = 4500) {
  if (!url) return false;
  const cleanUrl = url.replace(/\/$/, '');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let res;
      try {
        res = await undiciFetch(`${cleanUrl}/health`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'X-Pinggy-No-Screen': 'true',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        res = await fetch(`${cleanUrl}/health`, {
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'X-Pinggy-No-Screen': 'true',
            'Cache-Control': 'no-cache',
          },
          signal: AbortSignal.timeout(timeoutMs),
        });
      }
      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        if (json && (json.status === 'ok' || json.service)) return true;
      }
    } catch {}
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function activateTunnel(url, source) {
  if (!url) return false;
  if (!shouldActivateTunnel(source, activeTunnelSource)) {
    console.log(`[Tunnel] ${source} не активирован: приоритет ниже ${activeTunnelSource || '—'}`);
    return false;
  }
  const cleanUrl = url.replace(/\/$/, '');
  if (cleanUrl === publicTunnelUrl) return true;

  if (source === 'cloudflare') {
    // 2.5 сек на первичное распространение DNS Cloudflare перед health-check
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`[Tunnel] 🩺 Проверка работоспособности туннеля (${source}): ${cleanUrl}...`);
  const isHealthy = await checkTunnelHealth(cleanUrl, 5000);
  if (!isHealthy) {
    console.warn(`[Tunnel] ❌ ${source} (${cleanUrl}) не прошёл health-check (HTTP 408/503/таймаут). Активация отклонена!`);
    if (source === 'cloudflare') {
      if (cloudflareProc) {
        try { cloudflareProc.kill(); } catch {}
        cloudflareProc = null;
      }
      startPinggyTunnel();
    }
    return false;
  }

  publicTunnelUrl = cleanUrl;
  activeTunnelSource = source;
  console.log(`[Tunnel] 🚀 Активный туннель (${source}) подтверждён: ${publicTunnelUrl}`);
  try {
    fs.writeFileSync(path.resolve(process.cwd(), '.tunnel_url'), publicTunnelUrl);
    const tunnelPayload = JSON.stringify(
      {
        url: publicTunnelUrl,
        source,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    );
    const botDataDir = path.resolve(process.cwd(), 'bot/data');
    if (!fs.existsSync(botDataDir)) fs.mkdirSync(botDataDir, { recursive: true });
    fs.writeFileSync(path.join(botDataDir, 'active_tunnel.json'), tunnelPayload);

    const webPublicDir = path.resolve(process.cwd(), 'apps/web/public');
    if (fs.existsSync(webPublicDir)) {
      fs.writeFileSync(path.join(webPublicDir, 'active_tunnel.json'), tunnelPayload);
    }
  } catch (err) {
    console.warn('[Tunnel] Предупреждение при записи active_tunnel.json:', err.message);
  }
  await updateChatMenuWithApi(publicTunnelUrl);
  return true;
}

let currentTunnel = null;
let sshTunnelProc = null;

async function startLocalTunnel() {
  if (currentTunnel) return;
  if (!shouldActivateTunnel('localtunnel', activeTunnelSource) && activeTunnelSource) {
    return;
  }
  console.log('[LocalTunnel] 🌐 Запуск стабильного туннеля через LocalTunnel...');

  const envSub = process.env.LOCALTUNNEL_SUBDOMAIN;
  const initialSubdomain = envSub && envSub !== 'moya-skazka-live-api' ? envSub : 'moya-skazka-app-live';

  const subdomains = [
    initialSubdomain,
    `moya-skazka-${crypto.randomBytes(3).toString('hex')}`,
    undefined,
  ];

  for (const sub of subdomains) {
    if (!shouldActivateTunnel('localtunnel', activeTunnelSource) && activeTunnelSource) {
      return;
    }
    try {
      console.log(`[LocalTunnel] Попытка подключения с поддоменом: ${sub || 'random'}...`);
      const tunnelPromise = localtunnel({ port: BRIDGE_PORT, subdomain: sub });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 15s')), 15000));
      const tunnelInstance = await Promise.race([tunnelPromise, timeoutPromise]);

      if (!shouldActivateTunnel('localtunnel', activeTunnelSource) && activeTunnelSource) {
        currentTunnel = tunnelInstance;
        return;
      }

      console.log(`[LocalTunnel] Подключен: ${tunnelInstance.url}, проверяем доступность...`);
      const activated = await activateTunnel(tunnelInstance.url, 'localtunnel');
      if (activated) {
        currentTunnel = tunnelInstance;
        currentTunnel.on('close', () => {
          console.log('[LocalTunnel] Соединение закрыто. Переподключение через 3 сек...');
          currentTunnel = null;
          if (activeTunnelSource === 'localtunnel') {
            publicTunnelUrl = '';
            activeTunnelSource = '';
          }
          setTimeout(startLocalTunnel, 3000);
        });

        currentTunnel.on('error', (err) => {
          console.warn('[LocalTunnel Ошибка]:', err.message);
        });
        return;
      } else {
        console.warn(`[LocalTunnel] Поддомен ${sub || 'random'} не отвечает. Пробуем следующий...`);
        try { tunnelInstance.close(); } catch {}
      }
    } catch (err) {
      console.warn(`[LocalTunnel] Сбой при подключении (${sub || 'random'}): ${err.message}`);
    }
  }

  console.warn('[LocalTunnel]: Все попытки localtunnel исчерпаны. Повтор через 5 сек...');
  currentTunnel = null;
  setTimeout(startLocalTunnel, 5000);
}

let consecutiveWatchdogFailures = 0;
if (isMainModule) {
  setInterval(async () => {
    if (!publicTunnelUrl) {
      if (!serveoProc && !pinggyProc && !currentTunnel && !cloudflareProc) {
        const binPath = path.resolve('bot/cloudflared');
        if (fs.existsSync(binPath)) {
          startCloudflareTunnel();
        } else {
          startPinggyTunnel();
        }
      }
      return;
    }
    const healthy = await checkTunnelHealth(publicTunnelUrl, 10000);
    if (healthy) {
      consecutiveWatchdogFailures = 0;
      return;
    }
    consecutiveWatchdogFailures++;
    const hasPendingJob = Array.from(jobs.values()).some((j) => j.status === 'pending');
    const maxFailures = hasPendingJob ? 10 : 3;
    console.warn(`[Tunnel Watchdog] ⚠️ Туннель ${publicTunnelUrl} (${activeTunnelSource}) не ответил (${consecutiveWatchdogFailures}/${maxFailures})...`);
    if (consecutiveWatchdogFailures < maxFailures) {
      return;
    }
    consecutiveWatchdogFailures = 0;
    console.warn(`[Tunnel Watchdog] ⚠️ Туннель ${publicTunnelUrl} (${activeTunnelSource}) признан неработающим. Автоматический перезапуск...`);
    if (activeTunnelSource === 'cloudflare') {
      if (cloudflareProc) {
        try { cloudflareProc.kill(); } catch {}
        cloudflareProc = null;
      }
      publicTunnelUrl = '';
      activeTunnelSource = '';
      startPinggyTunnel();
    } else {
      stopPinggyTunnel();
      if (currentTunnel) {
        try { currentTunnel.close(); } catch {}
        currentTunnel = null;
      }
      publicTunnelUrl = '';
      activeTunnelSource = '';
      const binPath = path.resolve('bot/cloudflared');
      if (fs.existsSync(binPath)) {
        startCloudflareTunnel();
      } else {
        startPinggyTunnel();
      }
    }
  }, 35000).unref();
}

let serveoProc = null;
let serveoReconnectTimer = null;

function stopServeoTunnel() {
  if (serveoReconnectTimer) {
    clearTimeout(serveoReconnectTimer);
    serveoReconnectTimer = null;
  }
  if (serveoProc) {
    const proc = serveoProc;
    serveoProc = null;
    try { proc.kill('SIGTERM'); } catch {}
  }
  if (activeTunnelSource === 'serveo') {
    publicTunnelUrl = '';
    activeTunnelSource = '';
  }
}

function startServeoTunnel() {
  if (serveoProc) return;
  if (serveoReconnectTimer) {
    clearTimeout(serveoReconnectTimer);
    serveoReconnectTimer = null;
  }
  console.log('[Serveo] 🌐 Запуск быстрого HTTPS-туннеля Serveo (порт 443, без предупреждений)...');
  try {
    const sshArgs = [
      '-p', '443',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=20',
      '-o', 'ServerAliveCountMax=4',
      '-o', 'ConnectTimeout=15',
      '-o', 'ExitOnForwardFailure=yes',
      '-R', `80:localhost:${BRIDGE_PORT}`,
      'serveo.net',
    ];
    const proc = spawn('ssh', sshArgs);
    serveoProc = proc;

    const parseOutput = async (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.serveousercontent\.com/);
      if (match) {
        const url = match[0];
        console.log(`[Serveo] 🚀 HTTPS туннель получен: ${url}`);
        await activateTunnel(url, 'serveo');
      }
    };

    proc.stdout.on('data', parseOutput);
    proc.stderr.on('data', parseOutput);

    proc.on('close', (code) => {
      if (serveoProc !== proc) return;
      console.log(`[Serveo] Соединение завершилось (код ${code}). Перезапуск через 5 сек...`);
      serveoProc = null;
      if (activeTunnelSource === 'serveo') {
        publicTunnelUrl = '';
        activeTunnelSource = '';
      }
      serveoReconnectTimer = setTimeout(startServeoTunnel, 5000);
    });

    proc.on('error', (err) => {
      if (serveoProc !== proc) return;
      console.warn('[Serveo Ошибка]:', err.message);
      serveoProc = null;
      serveoReconnectTimer = setTimeout(startServeoTunnel, 10000);
    });
  } catch (err) {
    console.error('[Serveo Сбой запуска]:', err.message);
    serveoProc = null;
    startPinggyTunnel();
  }
}

let cloudflareProc = null;

function startCloudflareTunnel() {
  if (cloudflareProc) return;
  const binPath = path.resolve('bot/cloudflared');
  if (!fs.existsSync(binPath)) {
    console.warn('[Cloudflare] Бинарник cloudflared не найден, пробуем резервные туннели...');
    startPinggyTunnel();
    return;
  }
  console.log('[Cloudflare] 🌐 Запуск быстрого HTTPS-туннеля Cloudflare (без предупреждений и блокировок CORS)...');
  try {
    const env = { ...process.env };
    if (proxyUrl) {
      env.HTTP_PROXY = proxyUrl;
      env.HTTPS_PROXY = proxyUrl;
      env.ALL_PROXY = proxyUrl;
    }
    const proc = spawn(binPath, ['tunnel', '--url', `http://127.0.0.1:${BRIDGE_PORT}`], { env });
    cloudflareProc = proc;

    const parseOutput = async (data) => {
      const text = data.toString();
      const matches = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g);
      if (matches) {
        const url = matches.find((u) => !u.includes('api.trycloudflare.com'));
        if (url) {
          console.log(`[Cloudflare] 🚀 HTTPS туннель получен: ${url}`);
          await activateTunnel(url, 'cloudflare');
        }
      }
    };

    proc.stdout.on('data', parseOutput);
    proc.stderr.on('data', parseOutput);

    proc.on('close', (code) => {
      console.log(`[Cloudflare] Соединение завершилось (код ${code}).`);
      cloudflareProc = null;
      if (activeTunnelSource === 'cloudflare') {
        publicTunnelUrl = '';
        activeTunnelSource = '';
        setTimeout(startCloudflareTunnel, 5000);
      } else {
        startPinggyTunnel();
      }
    });

    proc.on('error', (err) => {
      console.warn('[Cloudflare Ошибка]:', err.message);
      cloudflareProc = null;
      if (activeTunnelSource === 'cloudflare') {
        setTimeout(startCloudflareTunnel, 10000);
      } else {
        startPinggyTunnel();
      }
    });
  } catch (err) {
    console.error('[Cloudflare Сбой запуска]:', err.message);
    cloudflareProc = null;
    startPinggyTunnel();
  }
}

let pinggyProc = null;
let pinggyReconnectTimer = null;

function stopPinggyTunnel() {
  if (pinggyReconnectTimer) {
    clearTimeout(pinggyReconnectTimer);
    pinggyReconnectTimer = null;
  }
  if (pinggyProc) {
    const proc = pinggyProc;
    pinggyProc = null;
    try { proc.kill('SIGTERM'); } catch {}
  }
  if (activeTunnelSource === 'pinggy') {
    publicTunnelUrl = '';
    activeTunnelSource = '';
  }
}

function startPinggyTunnel() {
  if (pinggyProc) return;
  if (pinggyReconnectTimer) {
    clearTimeout(pinggyReconnectTimer);
    pinggyReconnectTimer = null;
  }
  console.log('[Pinggy] 🌐 Запуск быстрого HTTPS-туннеля через Pinggy (порт 443)...');
  try {
    const sshArgs = [
      '-p', '443',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=20',
      '-o', 'ServerAliveCountMax=4',
      '-o', 'ConnectTimeout=15',
      '-o', 'ExitOnForwardFailure=yes',
      '-R', `80:localhost:${BRIDGE_PORT}`,
      'a.pinggy.io',
    ];
    const proc = spawn('ssh', sshArgs);
    pinggyProc = proc;

    const parseOutput = async (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.run\.pinggy-free\.link/);
      if (match) {
        const url = match[0];
        console.log(`[Pinggy] 🚀 HTTPS туннель получен: ${url}`);
        await activateTunnel(url, 'pinggy');
      }
    };

    proc.stdout.on('data', parseOutput);
    proc.stderr.on('data', parseOutput);

    proc.on('close', (code) => {
      if (pinggyProc !== proc) return;
      console.log(`[Pinggy] Соединение завершилось (код ${code}). Перезапуск через 5 сек...`);
      pinggyProc = null;
      if (activeTunnelSource === 'pinggy') {
        publicTunnelUrl = '';
        activeTunnelSource = '';
      }
      pinggyReconnectTimer = setTimeout(startPinggyTunnel, 5000);
    });

    proc.on('error', (err) => {
      if (pinggyProc !== proc) return;
      console.warn('[Pinggy Ошибка]:', err.message);
      pinggyProc = null;
      pinggyReconnectTimer = setTimeout(startPinggyTunnel, 10000);
    });
  } catch (err) {
    console.error('[Pinggy Сбой запуска]:', err.message);
    pinggyProc = null;
    pinggyReconnectTimer = setTimeout(startPinggyTunnel, 10000);
  }
}

function startSshTunnel() {
  if (sshTunnelProc) return;
  console.log('[SshTunnel] 🌐 Запуск туннеля через localhost.run...');
  try {
    const sshArgs = [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'ServerAliveInterval=10',
      '-o', 'ServerAliveCountMax=3',
      '-o', 'ExitOnForwardFailure=yes',
      '-R', `80:localhost:${BRIDGE_PORT}`,
      'nokey@localhost.run',
    ];
    const ed25519Path = path.join(process.env.HOME || '', '.ssh', 'id_ed25519');
    if (fs.existsSync(ed25519Path)) {
      sshArgs.unshift('-i', ed25519Path);
    }
    const proc = spawn('ssh', sshArgs);
    sshTunnelProc = proc;

    const parseOutput = (data) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/);
      if (match) {
        const url = match[0];
        console.log(`[SshTunnel] 🚀 HTTPS туннель получен: ${url}`);
        activateTunnel(url, 'localhost_run');
      }
    };

    proc.stdout.on('data', parseOutput);
    proc.stderr.on('data', parseOutput);

    proc.on('close', (code) => {
      console.log(`[SshTunnel] Соединение завершилось (код ${code}). Перезапуск через 5 сек...`);
      sshTunnelProc = null;
      if (activeTunnelSource === 'localhost_run') {
        publicTunnelUrl = '';
        activeTunnelSource = '';
      }
      setTimeout(startSshTunnel, 5000);
    });

    proc.on('error', (err) => {
      console.warn('[SshTunnel Ошибка]:', err.message);
      sshTunnelProc = null;
      setTimeout(startSshTunnel, 10000);
    });
  } catch (err) {
    console.error('[SshTunnel Сбой запуска]:', err.message);
    sshTunnelProc = null;
    setTimeout(startSshTunnel, 10000);
  }
}

// Завершение процессов туннелей при остановке приложения
process.on('SIGINT', () => {
  if (serveoProc) try { serveoProc.kill(); } catch {}
  if (cloudflareProc) try { cloudflareProc.kill(); } catch {}
  if (pinggyProc) try { pinggyProc.kill(); } catch {}
  if (sshTunnelProc) try { sshTunnelProc.kill(); } catch {}
  if (currentTunnel) try { currentTunnel.close(); } catch {}
  process.exit(0);
});
process.on('SIGTERM', () => {
  if (serveoProc) try { serveoProc.kill(); } catch {}
  if (cloudflareProc) try { cloudflareProc.kill(); } catch {}
  if (pinggyProc) try { pinggyProc.kill(); } catch {}
  if (sshTunnelProc) try { sshTunnelProc.kill(); } catch {}
  if (currentTunnel) try { currentTunnel.close(); } catch {}
  process.exit(0);
});

if (isMainModule) {
  if (SKIP_TUNNELS) {
    console.log('[Tunnel] SKIP_TUNNELS=true — туннели отключены');
  } else {
    const binPath = path.resolve('bot/cloudflared');
    const hasCloudflared = fs.existsSync(binPath);
    const preferredTunnel = (process.env.TUNNEL || (hasCloudflared ? 'cloudflare' : 'pinggy')).toLowerCase();
    if (preferredTunnel === 'cloudflare') {
      startCloudflareTunnel();
    } else if (preferredTunnel === 'serveo') {
      startServeoTunnel();
    } else {
      startPinggyTunnel();
    }
  }
}

// ========================================================
// 5. ВЗАИМОДЕЙСТВИЕ С TELEGRAM API
// ========================================================
async function callTelegram(method, params = {}) {
  try {
    const isLongPoll = method === 'getUpdates';
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(isLongPoll ? 45000 : 15000),
    };
    if (currentProxyAgent) {
      fetchOptions.dispatcher = currentProxyAgent;
    }
    const res = await undiciFetch(`${TELEGRAM_API}/${method}`, fetchOptions);
    return await res.json();
  } catch (err) {
    const causeMsg = err.cause?.message || err.cause?.code || '';
    const details = causeMsg ? `${err.message} (${causeMsg})` : err.message;

    const isNetworkIdle =
      err.name === 'TimeoutError' ||
      err.name === 'AbortError' ||
      details.includes('timeout') ||
      details.includes('Timeout') ||
      details.includes('other side closed') ||
      details.includes('ECONNRESET') ||
      details.includes('UND_ERR_SOCKET') ||
      details.includes('Client network socket disconnected') ||
      details.includes('terminated');

    if (method === 'getUpdates' && isNetworkIdle) {
      return { ok: true, result: [] };
    }
    if (proxyUrl && method !== 'getUpdates') {
      if (
        details.includes('ECONNREFUSED') ||
        details.includes('connect error') ||
        details.includes('Client network socket disconnected') ||
        details.includes('fetch failed')
      ) {
        applyProxyAgent();
      }
    }
    console.error(`[Bot] Ошибка вызова ${method}:`, details);
    return null;
  }
}

export function getAppUrlWithApi(apiUrl, isAdmin = false) {
  const base = WEB_APP_BASE_URL;
  const target = apiUrl || publicTunnelUrl;
  let url = target ? `${base}${base.includes('?') ? '&' : '?'}api_url=${encodeURIComponent(target)}` : base;
  if (isAdmin) {
    url += `${url.includes('?') ? '&' : '?'}admin=1`;
  }
  return url;
}

export async function setChatMenuButtonForUser(chatId, url) {
  if (!chatId || !url) return;
  try {
    const res = await callTelegram('setChatMenuButton', {
      chat_id: chatId,
      menu_button: {
        type: 'web_app',
        text: 'Моя сказка ✨',
        web_app: { url },
      },
    });
    if (res && res.ok) {
      console.log(`[Bot] 📱 Кнопка меню чата ${chatId} моментально обновлена: ${url}`);
    }
  } catch (err) {
    console.warn(`[Bot] Не удалось обновить кнопку меню для чата ${chatId}:`, err.message);
  }
}

let lastMenuButtonUrl = '';
async function updateChatMenuWithApi(apiUrl) {
  const targetUrl = getAppUrlWithApi(apiUrl);
  if (targetUrl === lastMenuButtonUrl) return;
  lastMenuButtonUrl = targetUrl;
  console.log(`[Bot] 📱 Настройка глобальной кнопки Telegram Mini App: ${targetUrl}`);
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

const BANNER_ANIMATION_FILE_ID =
  process.env.BANNER_ANIMATION_FILE_ID || 'CgACAgIAAxUAAWrez1oeiJxqw4FB28bUW5PvUotdAAI0sQACPG_xSsy5Dk8kfFAIPQQ';

async function sendWelcome(chatId, firstName, startParam, username = '') {
  const userLower = (username || '').toLowerCase();
  const isAdmin = ADMIN_USERNAMES.includes(userLower);
  const currentAppUrl = getAppUrlWithApi(publicTunnelUrl, isAdmin);
  const name = firstName || 'дорогой родитель';

  // Мобильные клиенты Telegram кэшируют кнопку меню чата, вызываем явно с chat_id!
  await setChatMenuButtonForUser(chatId, currentAppUrl);

  let refNote = '';
  if (startParam && startParam.startsWith('ref_')) {
    refNote = '\n• 🎁 **Бонус:** Вы перешли по приглашению друга — первая книга готова к созданию!';
  }

  let adminBanner = '';
  if (isAdmin) {
    adminBanner = `\n👑 **Статус: Администратор (@${userLower})** Вам предоставлены права ADMIN с безлимитными кредитами на сказки!`;
  }

  const richMarkdown =
`# Моя сказка

![](tg://video?id=banner "***")

Привет, **${name}**! ✨${adminBanner}

Добро пожаловать в **«Моя сказка»** — уютное приложение для создания персональных терапевтических сказок на ночь для детей 2–6 лет.

🌟 **Создание сказок через ИИ:**
• 📖 Текст пишется нейросетью под характер малыша
• 🎨 Красочные 3D-иллюстрации от **Nano-Banana-2**
• 🧸 4 сцены + вопросы для тёплой беседы перед сном
• 🎁 Первая персональная сказка — в подарок!${refNote}

Нажмите кнопку ниже, чтобы открыть сказочный визард! 👇`;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: isAdmin ? '👑 Открыть (Режим ADMIN)' : '✨ Открыть «Моя сказка»',
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

  try {
    const res = await callTelegram('sendRichMessage', {
      chat_id: chatId,
      rich_message: {
        markdown: richMarkdown,
        media: [
          {
            id: 'banner',
            media: {
              type: 'animation',
              media: BANNER_ANIMATION_FILE_ID,
            },
          },
        ],
      },
      reply_markup: keyboard,
    });
    if (res && res.ok) {
      return res;
    }
    console.warn('[Bot] sendRichMessage fallback triggered:', res?.description);
  } catch (err) {
    console.warn('[Bot] sendRichMessage error, falling back:', err.message);
  }

  // Фолбэк на классический sendMessage с полным currentAppUrl
  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text: `🚀 Чтобы создать персональную терапевтическую сказку для вашего малыша, перейдите в приложение: ${currentAppUrl}`,
    link_preview_options: {
      url: currentAppUrl,
      prefer_small_media: true,
      show_above_text: false,
    },
    reply_markup: keyboard,
  });
}

// ========================================================
// 6. LONG-POLLING БОТА
// ========================================================
async function startPolling() {
  console.log(`[Bot] Инициализация подключения к Telegram...`);

  // Восстановление последнего подтверждённого URL туннеля из файла при старте
  if (!publicTunnelUrl) {
    try {
      const savedTunnel = fs.readFileSync(path.resolve(process.cwd(), '.tunnel_url'), 'utf-8').trim();
      if (savedTunnel && savedTunnel.startsWith('http')) {
        publicTunnelUrl = savedTunnel;
        console.log(`[Bot] 📂 Восстановлен сохранённый URL туннеля: ${publicTunnelUrl}`);
      }
    } catch {}
  }

  let me = null;
  while (!me || !me.ok) {
    me = await callTelegram('getMe');
    if (!me || !me.ok) {
      console.warn('[Bot] Ожидание связи с Telegram API... (повтор через 5 сек)');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log(`[Bot] ✅ Успешно авторизован: @${me.result.username} (${me.result.first_name}, ID: ${me.result.id})`);
  if (publicTunnelUrl) {
    await updateChatMenuWithApi(publicTunnelUrl);
  }

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

          if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || update.message.caption || '';
            const firstName = update.message.from?.first_name || '';

            console.log(`[Bot] 📩 Входящее сообщение от ${firstName} (${chatId}):`, JSON.stringify(update.message, null, 2));

            const username = (update.message.from?.username || '').toLowerCase();
            const isAdmin = ADMIN_USERNAMES.includes(username);

            if (text.startsWith('/admin') || text.startsWith('/credits') || text.startsWith('/add_credits')) {
              if (!isAdmin) {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: '⛔️ У вас нет прав администратора.',
                });
                continue;
              }
              const adminAppUrl = getAppUrlWithApi(publicTunnelUrl, true);
              await setChatMenuButtonForUser(chatId, adminAppUrl);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `👑 **Панель администратора «Моя сказка»**\n\nЗдравствуйте, @${update.message.from?.username || 'admin'}!\nВам выдан полный доступ **ADMIN**:\n• 🌟 Безлимитные кредиты на создание сказок\n• 🛠 Доступ к панели управления и повтору задач\n• ⚡️ Моментальное пополнение баланса в 1 клик\n\nНажмите кнопку ниже, чтобы открыть приложение:`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '👑 Открыть с безлимитными кредитами', web_app: { url: adminAppUrl } }],
                  ],
                },
              });
            } else if (text.startsWith('/start')) {
              const parts = text.split(' ');
              const startParam = parts.length > 1 ? parts[1] : null;
              const res = await sendWelcome(chatId, firstName, startParam, username);
              console.log(`[Bot] Ответ на /start отправлен:`, res?.ok ? 'OK' : res?.description);
            } else if (text === '/app') {
              const appUrl = getAppUrlWithApi(publicTunnelUrl, isAdmin);
              await setChatMenuButtonForUser(chatId, appUrl);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: isAdmin
                  ? '👑 Режим Администратора активирован. Нажмите кнопку ниже:'
                  : 'Нажмите кнопку ниже, чтобы открыть визард сказок:',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: isAdmin ? '👑 Открыть сказки (ADMIN)' : '✨ Открыть сказки', web_app: { url: appUrl } }],
                  ],
                },
              });
            } else if (text === '/reset' || text.startsWith('/start reset') || text === 'сброс' || text === '/clear') {
              const resetAppUrl = `${getAppUrlWithApi(publicTunnelUrl, isAdmin)}&reset=1`;
              await setChatMenuButtonForUser(chatId, resetAppUrl);
              console.log(`[Bot] 🔄 Запрос сброса аккаунта от ${firstName} (${chatId})`);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `🔄 **Профиль сброшен!**\n\nВсе сохранённые данные (профиль ребёнка, созданные сказки и настройки) будут очищены.\n\nНажмите кнопку ниже, чтобы открыть приложение **с чистого листа как новый пользователь**:\n• Приветственный онбординг\n• Быстрая регистрация малыша\n• Чистая библиотека\n• Бесплатная первая сказка! 🎁`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '✨ Начать как новый пользователь', web_app: { url: resetAppUrl } }],
                  ],
                },
              });
            } else if (text === '/link' || text === '/url' || text === '/site') {
              const directAppUrl = getAppUrlWithApi(publicTunnelUrl, isAdmin);
              await setChatMenuButtonForUser(chatId, directAppUrl);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `🔗 **Прямая ссылка на приложение «Моя сказка»:**\n\n${directAppUrl}\n\n_Нажмите на ссылку выше или на кнопку внизу для входа с подключённым ИИ._`,
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: isAdmin ? '👑 Открыть (ADMIN)' : '✨ Открыть сказки', web_app: { url: directAppUrl } }],
                  ],
                },
              });
            } else if (text === '/help') {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: '«Моя сказка» создаёт персонализированные иллюстрированные сказки на ночь для детей 2–6 лет.\n\nНажмите кнопку «Моя сказка ✨» внизу экрана для запуска!',
              });
            } else {
              await sendWelcome(chatId, firstName, null, username);
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

if (isMainModule) {
  if (SKIP_TELEGRAM) {
    console.log('[Bot] SKIP_TELEGRAM=true — long polling отключён (режим API-моста)');
  } else {
    startPolling();
  }
}
