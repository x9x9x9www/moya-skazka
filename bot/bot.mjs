// Telegram Bot & AI Bridge Runner for «Моя сказка»
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
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
import { ProxyAgent, setGlobalDispatcher } from 'undici';
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
const proxyUrl = isProxyDisabled ? null : (explicitProxy || null);

if (proxyUrl) {
  try {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log(`[Proxy] 🛡 Настроен системный прокси: ${proxyUrl}`);
  } catch (err) {
    console.warn('[Proxy] Ошибка инициализации прокси:', err.message);
  }
} else {
  console.log('[Proxy] ⚡️ Прокси отключен, используется прямое соединение');
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SKIP_TELEGRAM = process.env.SKIP_TELEGRAM === 'true';
const SKIP_TUNNELS = process.env.SKIP_TUNNELS === 'true';
if (!BOT_TOKEN) {
  console.error('[Bot] Критическая ошибка: TELEGRAM_BOT_TOKEN не найден в .env!');
  process.exit(1);
}

const WEB_APP_BASE_URL = process.env.WEB_APP_URL || 'https://x9x9x9www.github.io/moya-skazka/?v=2.6';
const AI_MOCK_MODE = process.env.AI_MOCK_MODE === 'true' || process.env.AI_DISABLED === 'true';
const AI_TEXT_PROVIDER = process.env.AI_TEXT_PROVIDER || 'wellflow';
const WELLFLOW_API_URL = process.env.WELLFLOW_API_URL || 'https://api.wellflow.dev/v1';
const WELLFLOW_TEXT_KEY = process.env.WELLFLOW_TEXT_KEY || '';
const WELLFLOW_TEXT_MODEL = process.env.WELLFLOW_TEXT_MODEL || 'gpt-6-luna';
const WELLFLOW_IMAGE_KEY = process.env.WELLFLOW_IMAGE_KEY || '';
const WELLFLOW_IMAGE_MODEL = process.env.WELLFLOW_IMAGE_MODEL || 'nano-banana-2';

const TELEGRAM_API_BASE = (process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org').replace(/\/+$/, '');
const TELEGRAM_API = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}`;
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
// 2. ВЫЗОВЫ AI API (Wellflow API: gpt-6-luna / nano-banana-2)
// ========================================================
function parseJsonContent(content) {
  let cleaned = String(content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('JSON object not found');
  let jsonSlice = cleaned.slice(first, last + 1);

  try {
    return JSON.parse(jsonSlice);
  } catch (e1) {
    try {
      // 1. Удаление висячих запятых в объектах и массивах
      const noTrailing = jsonSlice.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(noTrailing);
    } catch (e2) {
      try {
        // 2. Очистка неэкранированных служебных символов
        const sanitized = jsonSlice
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
        return JSON.parse(sanitized);
      } catch (e3) {
        throw new Error(e1.message);
      }
    }
  }
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

async function callWellflowDirect(messages, label) {
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
          max_tokens: 4500,
        }),
      },
      150000
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

async function callTextChat(messages, label) {
  return await callWellflowDirect(messages, label);
}

const callWellflowChat = callTextChat;

async function callWithRetry(messages, label, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) console.warn(`[AI] 🔁 ${label}: повторная попытка ${attempt}/${attempts}`);
      return await callTextChat(messages, `${label}#${attempt}`);
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
    throw new Error(`story: невалидный JSON: ${error.message}`);
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
        const expandedContent = await callTextChat(
          [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
            { role: 'assistant', content },
            { role: 'user', content: lengthRepair },
          ],
          'length-repair'
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
    const repairedContent = await callTextChat(
      [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
        { role: 'assistant', content },
        { role: 'user', content: repair },
      ],
      'repair'
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
      if (!input._forceWellflow && WELLFLOW_TEXT_KEY) {
        console.warn('[StoryEngine] ⚠️ Repair не удался, пробуем резервный генератор Wellflow...');
        return await generateWellflowStoryAI({ ...params, _forceWellflow: true });
      }
      throw repairError;
    }
  }
}

export function resolveChildAvatarKey(params) {
  if (!params) return 'boy_brown';
  const appearance = params.appearance || params;
  const gender = (params.gender || appearance.gender) === 'girl' ? 'girl' : 'boy';
  const hair = (appearance.hairColor || params.hairColor || '').toLowerCase();
  const skin = (appearance.skinTone || params.skinTone || '').toLowerCase();
  const features = (appearance.distinctiveFeatures || params.distinctiveFeatures || '').toLowerCase();
  const avatarId = (appearance.avatar_id || params.avatar_id || '').toLowerCase();

  // 1. Очки
  if (features.includes('очк') || avatarId.includes('glasses')) {
    return `${gender}_glasses`;
  }
  // 2. Смуглый тон кожи
  if (skin.includes('смугл') || avatarId.includes('tan')) {
    return `${gender}_tan`;
  }
  // 3. Цвет волос
  if (hair.includes('светл') || hair.includes('блонд')) {
    return `${gender}_blonde`;
  }
  if (hair.includes('рыж')) {
    return `${gender}_ginger`;
  }
  if (hair.includes('тёмн') || hair.includes('темн') || hair.includes('черн') || hair.includes('брюнет')) {
    return `${gender}_dark`;
  }
  // 4. По умолчанию для русых / шатенов
  return `${gender}_brown`;
}

function getThemedFallbackIllustration(themeOrInterest, sceneIndex = 0, params = null) {
  if (sceneIndex === 0 && params) {
    const avatarKey = resolveChildAvatarKey(params);
    return `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarKey}.webp`;
  }
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
  const models = [WELLFLOW_IMAGE_MODEL || 'nano-banana-2'].filter(Boolean);
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
      if (err.isQuota || err.message.includes('402') || err.message.includes('insufficient_quota') || attempt === retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 1200));
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
      message: 'Художник создаёт 3D Pixar-иллюстрации...',
    });
    await new Promise((r) => setTimeout(r, 700));

    onProgress?.({
      stage: 'drawing',
      progress: 90,
      message: 'Создаём иллюстрации (4 из 5 готовы)...',
    });
    await new Promise((r) => setTimeout(r, 500));

    const child = params.childName || 'Малыш';
    const age = params.age || 4;
    const theme = params.theme || 'Космос и дружба';
    const interest = params.interests?.[0] || 'волшебные звёзды';
    const wishes = params.customWishes ? ` Любимая вещь и верный спутник — ${params.customWishes}.` : '';
    const hair = params.appearance?.hairColor
      ? `${params.appearance.hairLength || ''} ${params.appearance.hairStructure || ''} ${params.appearance.hairColor} волосы`
      : 'аккуратные волосы';
    const clothes = params.appearance?.clothingDescription
      ? `${params.appearance.clothingDescription} (${params.appearance.clothingColor || 'любимого цвета'})`
      : 'уютная одежда';

    const baseUrl = 'https://x9x9x9www.github.io/moya-skazka';
    const avatarKey = resolveChildAvatarKey(params);
    const avatarUrl = `${baseUrl}/illustrations/avatars/${avatarKey}.webp`;
    const t = theme.toLowerCase();
    let worldName = 'Волшебная страна';
    let companionName = 'Светлячок Лучик';
    let trialText = 'дорога через сверкающий лабиринт с загадками';
    let climaxText = 'древний кристалл озарил небо сотнями разноцветных огней';
    let coverImg = `${baseUrl}/illustrations/cover_forest.jpg`;

    if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('планет')) {
      worldName = 'Звёздная Галактика';
      companionName = 'Звёздный Лисёнок Спарки';
      trialText = 'пояс мерцающих астероидов, где нужно было найти золотистую тропу';
      climaxText = 'созвездие Доброты вспыхнуло на небесном своде, открыв путь к тайне';
      coverImg = `${baseUrl}/illustrations/cover_star.jpg`;
    } else if (t.includes('мор') || t.includes('океан') || t.includes('подвод') || t.includes('дельфин')) {
      worldName = 'Лазурные Глубины';
      companionName = 'Дельфинёнок Флип';
      trialText = 'подводное течение с танцующими кораллами и лабиринтом жемчужин';
      climaxText = 'гигантская раковина раскрылась и наполнила океан мягким изумрудным сиянием';
      coverImg = `${baseUrl}/illustrations/cover_forest.jpg`;
    } else if (t.includes('дино') || t.includes('древн') || t.includes('джунгл')) {
      worldName = 'Долина Исполинов';
      companionName = 'Маленький Трикки';
      trialText = 'древний подвесной мостик над шепчущим водопадом';
      climaxText = 'цветок папоротника распустился золотым сиянием дружбы';
      coverImg = `${baseUrl}/illustrations/cover_dino.jpg`;
    }

    const mockStory = {
      title: `${child} и тайна: «${theme}»`,
      cover_url: avatarUrl || coverImg,
      avatar_url: avatarUrl,
      avatar_id: avatarKey,
      metrics: { total_words: 420 },
      characters: [child, companionName],
      scenes: [
        {
          index: 1,
          text: `Однажды солнечным утром ${child} (${age} лет) почувствовал, что день готовит нечто необыкновенное. На герое была ${clothes}, а ${hair} искрились в тёплых лучах света.${wishes} Вдруг прямо на ладонь опустилась волшебная светящаяся пылинка, приглашая за собой в ${worldName}!`,
          image_url: coverImg,
          visual: `3D Pixar style scene 1 of ${child} discovering a magic portal`,
        },
        {
          index: 2,
          text: `Сделав смелый шаг, ${child} очутился в удивительном краю, где повсюду оживали ${interest}. Навстречу выбежал ${companionName} с сияющими добрыми глазами. «Здравствуй, ${child}! — радостно воскликнул спутник. — Только твоё чуткое сердце поможет нам разгадать великую тайну!»`,
          image_url: coverImg,
          visual: `3D Pixar style scene 2 with ${child} and ${companionName}`,
        },
        {
          index: 3,
          text: `Впереди возникло непростое испытание: перед друзьями раскинулся ${trialText}. ${child} не испугался, улыбнулся и крепко взял друга за руку. Проявив смекалку и взаимовыручку, герои дружно справились с препятствием, доказав, что вместе им по плечу любые чудеса!`,
          image_url: coverImg,
          visual: `3D Pixar style scene 3 showing ${child} overcoming challenge`,
        },
        {
          index: 4,
          text: `И вот тайна была разгадана: ${climaxText}! Сердце ${child} наполнилось радостью и гордостью за совершённый подвиг. Это удивительное приключение доказало: самые настоящие чудеса рождаются из смелости, дружбы и доброты!`,
          image_url: coverImg,
          visual: `3D Pixar style scene 4 triumphant finale with ${child}`,
        },
      ],
      questions: params.includeQuestions
        ? [
            {
              after_scene: 2,
              question: `Что почувствовал ${child}, когда встретил нового пушистого друга?`,
              parent_hint: 'Спросите ребёнка о доверии и о том, как приятно находить новых друзей.',
              skill_tag: 'empathy',
            },
            {
              after_scene: 4,
              question: `А какой поступок ${child} помог друзьям справиться с препятствием?`,
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

  let story;
  try {
    story = await generateWellflowStoryAI(params);
  } catch (err) {
    console.warn(`[StoryEngine] ⚠️ Ошибка основного провайдера сюжета: ${err.message}. Пробуем резервный генератор Wellflow...`);
    story = await generateWellflowStoryAI({ ...params, _forceWellflow: true });
  }

  if (!story.scenes || !Array.isArray(story.scenes) || story.scenes.length !== 4) {
    throw new Error('Invalid story scenes structure');
  }

  onProgress?.({
    stage: 'drawing',
    progress: 50,
    message: 'Художник создаёт обложку и 4 иллюстрации...',
  });

  const jobs = [
    { name: 'cover', kind: 'cover', prompt: buildCoverPrompt(story), fallback: getThemedFallbackIllustration(params.theme, 0, params) },
    ...story.scenes.map((scene) => ({
      name: `scene_${scene.index}`,
      kind: 'scene',
      sceneIndex: scene.index,
      prompt: buildScenePrompt(story, scene),
      fallback: getThemedFallbackIllustration(params.interests?.[0] || params.theme, scene.index, params),
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
        story,
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
    res.end(
      JSON.stringify({
        status: 'ok',
        providers: {
          text: AI_TEXT_PROVIDER,
          image: 'wellflow',
        },
        models: {
          text: WELLFLOW_TEXT_MODEL,
          image: WELLFLOW_IMAGE_MODEL,
        },
      })
    );
    return;
  }

  // Проверка статуса фоновой задачи (быстрый GET 5мс)
  const isJobStatus =
    (url.pathname === '/api/v1/ai/job-status' ||
      url.pathname === '/api/ai/job-status' ||
      url.pathname === '/ai/job-status' ||
      url.pathname === '/job-status') &&
    req.method === 'GET';
  if (isJobStatus) {
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
        const mockTraits = {
          gender: 'boy',
          approxAge: 4,
          hairColor: 'русые',
          hairType: 'кудрявые',
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
Внимательно посмотри на фото ребёнка и определи его анатомические и визуальные черты для мультяшного 3D Pixar персонажа.
Выбирай строго из указанных вариантов:
- gender: "boy" или "girl"
- approxAge: число от 1 до 12 (приблизительный возраст)
- hairColor: строго один из: "светлые" | "русые" | "тёмные" | "рыжие"
- hairType: строго один из: "кудрявые" | "короткие" | "длинные" | "прямые"
- eyeColor: строго один из: "карие" | "голубые" | "зелёные" | "серые"
- skinTone: строго один из: "светлая" | "персиковая" | "смуглая"
- distinctiveFeatures: особенности внешности на русском (например: "милые круглые очки", "веснушки на щёчках" или "")

Ответь ИСКЛЮЧИТЕЛЬНО валидным JSON-объектом:
{
  "gender": "boy",
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

      const raw = await callWellflowChat(messages, '[AvatarVision]');

      // Шаг Б (Zero-Storage): Буфер imageBase64 немедленно обнуляется из памяти
      dataUrl = null;
      imageBase64 = null;
      parsedBody.imageBase64 = null;
      parsedBody.image = null;

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
      const gender = parsed.gender === 'girl' ? 'girl' : 'boy';
      const approxAge =
        Number(parsed.approxAge || parsed.estimatedAge) >= 1 && Number(parsed.approxAge || parsed.estimatedAge) <= 12
          ? Number(parsed.approxAge || parsed.estimatedAge)
          : 4;
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

      const hairTypeEn = {
        'кудрявые': 'curly',
        'короткие': 'short neat',
        'длинные': 'long wavy',
        'прямые': 'straight',
      }[hairType] || 'curly';

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

      const avatarPrompt = `Close-up 3D animated Pixar-style character avatar portrait of a cute ${approxAge}-year-old ${genderEn}, ${hairColorEn} ${hairTypeEn} hair, bright expressive ${eyeColorEn} eyes, ${skinToneEn} skin${distinctiveEn ? ', ' + distinctiveEn : ''}, wearing ${outfitEn || 'cozy fairytale outfit'}, warm gentle smile looking at camera, soft cinematic studio lighting, magical blurry background with warm bokeh, square 1:1, ultra-detailed, 8k, no text, no watermark.`;

      console.log(`[AvatarGen] 🎨 Запуск генерации 3D аватара: ${avatarPrompt.slice(0, 100)}...`);

      let avatarUrl = '';
      try {
        const remoteUrl = await generateWellflowImageAI(avatarPrompt);
        if (remoteUrl) {
          avatarUrl = await saveGeneratedImage(remoteUrl, 'avatars', 'avatar_' + Date.now());
        }
      } catch (genErr) {
        console.warn('[AvatarGen] ⚠️ Ошибка генерации Nano-Banana-2, fallback к локальному пресету:', genErr.message);
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
      const fallbackTraits = {
        gender: 'boy',
        approxAge: 4,
        hairColor: 'русые',
        hairType: 'короткие',
        eyeColor: 'карие',
        skinTone: 'персиковая',
        distinctiveFeatures: '',
      };
      const fallbackId = 'boy_brown';
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
    try {
      let bodyStr = '';
      for await (const chunk of req) bodyStr += chunk;
      const parsedBody = JSON.parse(bodyStr || '{}');
      const imageBase64 = parsedBody.imageBase64 || parsedBody.image;

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
        const mockAnalysis = {
          gender: 'boy',
          approxAge: 4,
          estimatedAge: 4,
          hairColor: 'русые',
          hairLength: 'короткие',
          hairStructure: 'прямые',
          hairType: 'короткие',
          eyeColor: 'карие',
          skinTone: 'персиковая',
          clothingDescription: 'уютная футболка',
          clothingColor: 'небесно-голубой',
          distinctiveFeatures: '',
          avatar_id: 'boy_brown',
          confidenceTip: 'Внешность малыша определена (3D Pixar аватар подобран)!',
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

      const visionPrompt = `Ты профессиональный детский AI-стилист для создания персонализированной детской сказки.
Внимательно посмотри на фото ребёнка и определи его визуальные черты для мультяшного 3D Pixar персонажа.
Выбирай строго из указанных вариантов:
- gender: "boy" или "girl"
- estimatedAge: число от 2 до 6 (приблизительный возраст)
- hairColor: строго один из: "светлые" | "русые" | "тёмные" | "рыжие"
- hairLength: строго "короткие" или "длинные"
- hairStructure: строго "прямые" или "кудрявые"
- eyeColor: строго один из: "карие" | "голубые" | "зелёные" | "серые"
- skinTone: строго один из: "светлая" | "персиковая" | "смуглая"
- clothingDescription: короткое приятное описание одежды на фото (например: "жёлтая футболка", "синяя толстовка", "розовое платьице", "светлый свитер")
- clothingColor: основной цвет одежды ("солнечно-жёлтый", "небесно-голубой", "нежно-розовый", "изумрудный", "терракотовый")
- confidenceTip: тёплое доброе сообщение родителю о том, что удалось определить (1 короткое предложение на русском)

Ответь ИСКЛЮЧИТЕЛЬНО валидным JSON-объектом:
{
  "gender": "boy",
  "estimatedAge": 4,
  "hairColor": "светлые",
  "hairLength": "короткие",
  "hairStructure": "прямые",
  "eyeColor": "голубые",
  "skinTone": "светлая",
  "clothingDescription": "синяя футболка",
  "clothingColor": "небесно-голубой",
  "confidenceTip": "Определили светлые волосы, голубые глазки и синюю футболку."
}`;

      const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ];

      const raw = await callWellflowChat(messages, '[PhotoVision]');
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
      const gender = parsed.gender === 'girl' ? 'girl' : 'boy';
      const estimatedAge =
        Number(parsed.estimatedAge) >= 2 && Number(parsed.estimatedAge) <= 6 ? Number(parsed.estimatedAge) : 4;

      const avatarId = resolveChildAvatarKey({ gender, ...parsed });
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
        distinctiveFeatures: parsed.distinctiveFeatures || '',
        avatar_id: avatarId,
        clothingDescription: parsed.clothingDescription || 'уютная футболка',
        clothingColor: parsed.clothingColor || 'небесно-голубой',
        confidenceTip: parsed.confidenceTip || 'Внешность малыша определена!',
      };

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ status: 'ok', analysis: result, ...result }));
    } catch (err) {
      console.warn('[PhotoVision] Ошибка анализа фото:', err.message);
      const fallbackResult = {
        gender: 'boy',
        approxAge: 4,
        estimatedAge: 4,
        hairColor: 'русые',
        hairLength: 'короткие',
        hairStructure: 'прямые',
        hairType: 'короткие',
        eyeColor: 'карие',
        skinTone: 'персиковая',
        distinctiveFeatures: '',
        avatar_id: 'boy_brown',
        clothingDescription: 'уютный свитер',
        clothingColor: 'изумрудный',
        confidenceTip: 'Установили базовые параметры внешности — вы можете скорректировать их вручную.',
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
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    console.warn(`[Tunnel] ${source} предупреждение health-check (${error.message}), туннель активируется.`);
  }

  publicTunnelUrl = cleanUrl;
  activeTunnelSource = source;
  console.log(`[Tunnel] 🚀 Активный туннель (${source}): ${publicTunnelUrl}`);
  try {
    fs.writeFileSync(path.resolve(process.cwd(), '.tunnel_url'), publicTunnelUrl);
  } catch {}
  await updateChatMenuWithApi(publicTunnelUrl);
}

let currentTunnel = null;

async function startLocalTunnel() {
  console.log('[LocalTunnel] 🌐 Запуск постоянного туннеля через LocalTunnel...');
  const subdomain = process.env.LOCALTUNNEL_SUBDOMAIN || 'moya-skazka-bridge';
  try {
    currentTunnel = await localtunnel({ port: BRIDGE_PORT, subdomain });
    lastLocalTunnelUrl = currentTunnel.url;
    console.log(`[LocalTunnel] 🚀 Постоянный туннель готов: ${currentTunnel.url}`);
    await activateTunnel(currentTunnel.url, 'localtunnel');

    currentTunnel.on('close', () => {
      console.log('[LocalTunnel] Соединение закрыто. Переподключение через 3 сек...');
      if (activeTunnelSource === 'localtunnel') {
        publicTunnelUrl = '';
        activeTunnelSource = '';
      }
      setTimeout(startLocalTunnel, 3000);
    });

    currentTunnel.on('error', (err) => {
      console.warn('[LocalTunnel Ошибка]', err.message);
    });
  } catch (err) {
    console.error('[LocalTunnel Сбой старта]:', err.message);
    setTimeout(startLocalTunnel, 4000);
  }
}

if (SKIP_TUNNELS) {
  console.log('[Tunnel] SKIP_TUNNELS=true — туннели отключены');
} else {
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
    const causeMsg = err.cause?.message || err.cause?.code || '';
    const details = causeMsg ? `${err.message} (${causeMsg})` : err.message;
    console.error(`[Bot] Ошибка вызова ${method}:`, details);
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

const BANNER_ANIMATION_FILE_ID = process.env.BANNER_ANIMATION_FILE_ID || 'CgACAgIAAxkDAAM5at0n0tfqhLOCItTMSgn6e1kSW8EAAo2wAALJ3elKYPaeGcRpR7I9BA';

async function sendWelcome(chatId, firstName, startParam) {
  const currentAppUrl = getAppUrlWithApi(publicTunnelUrl);
  const name = firstName || 'дорогой родитель';

  let refBlock = '';
  if (startParam && startParam.startsWith('ref_')) {
    refBlock = `\n\n> 🎁 **Вы перешли по приглашению друга!** Ваша первая иллюстрированная история уже ждёт вас.\n`;
  }

  const richMarkdown =
`# ✨ МОЯ СКАЗКА // ПЕРСОНАЛЬНЫЕ ИИ-КНИГИ

![](tg://video?id=banner "Волшебная книга «Моя сказка»")

---

Привет, **${name}**! ✨

Добро пожаловать в **«Моя сказка»** — уютное приложение для создания персональных терапевтических сказок на ночь для детей 2–6 лет.${refBlock}

### 🌟 Создание сказок через ИИ:
- 📖 **Сюжет:** Текст генерируется нейросетью специально под характер, возраст и любимые игрушки ребёнка
- 🎨 **Иллюстрации:** Обложка и 4 сюжетные сцены в 3D Pixar-стиле от **Nano-Banana-2**
- 🧸 **Терапия сна:** 4 сцены + бережные вопросы для тёплой беседы перед сном
- 🎁 **Подарок:** Первая персональная книга — бесплатно!

---

<details open><summary><b>ℹ️ Как работает волшебная мастерская</b></summary>
1. 📸 Загрузите фото малыша — зрение ИИ считает черты лица и цвет волос
2. 🪄 Сервер создаст 3D Pixar портрет-аватарку в сказочном наряде
3. 📖 Автор сочинит добрую терапевтическую историю под характер ребёнка
4. 🎨 Художник нарисует 4 иллюстрации и обложку книги!
</details>

---
*Нажмите кнопку ниже, чтобы открыть сказочный визард! 👇*`;

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

  // 1. Нативная статья Telegram в формате Rich Message (Bot API 10+)
  try {
    const richRes = await callTelegram('sendRichMessage', {
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
    if (richRes && richRes.ok) {
      return richRes;
    }
    console.warn('[Bot] sendRichMessage fallback triggered:', richRes?.description);
  } catch (err) {
    console.warn('[Bot] sendRichMessage error, falling back:', err.message);
  }

  // 2. Фолбэк на классический sendMessage
  let fallbackMessage = `Привет, ${name}! ✨\n\n` +
    `Добро пожаловать в **«Моя сказка»** — уютное приложение для создания персональных терапевтических сказок на ночь для детей 2–6 лет.\n\n`;

  if (startParam && startParam.startsWith('ref_')) {
    fallbackMessage += `🎁 **Вы перешли по приглашению друга!**\nВаша первая иллюстрированная история уже ждёт вас.\n\n`;
  }

  fallbackMessage += `🌟 **Создание сказок через ИИ:**\n` +
    `• Текст генерируется нейросетью специально под характер ребёнка\n` +
    `• Обложку и 4 иллюстрации в 3D Pixar-стиле рисует **Nano-Banana-2**\n` +
    `• 4 сцены + вопросы для тёплой беседы перед сном\n` +
    `• Первая персональная история — бесплатно!\n\n` +
    `Нажмите кнопку ниже, чтобы открыть сказочный визард! 👇`;

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text: fallbackMessage,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

// ========================================================
// 6. LONG-POLLING БОТА
// ========================================================
async function startPolling() {
  console.log(`[Bot] Инициализация подключения к Telegram...`);

  let me = null;
  while (!me || !me.ok) {
    me = await callTelegram('getMe');
    if (!me || !me.ok) {
      console.warn('[Bot] Ожидание связи с Telegram API... (повтор через 5 сек)');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
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
            } else if (text === '/reset' || text.startsWith('/start reset') || text === 'сброс' || text === '/clear') {
              const resetAppUrl = `${getAppUrlWithApi(publicTunnelUrl)}&reset=1`;
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
