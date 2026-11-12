import { BookDetailsDTO } from '@moya-skazka/shared';
import { declineRussianName, removeAgeFromText, fixGenderAgreements } from '../utils/russianGrammar';

export interface GenerateStoryParams {
  userId?: string;
  childName: string;
  age: number;
  gender?: 'boy' | 'girl';
  theme: string;
  interests: string[];
  personality: string;
  storyMood?: string;
  customWishes?: string | null;
  includeQuestions: boolean;
  avatarUrl?: string;
  format?: 'TEXT' | 'ILLUSTRATED';
  appearance?: {
    avatar_url?: string;
    avatar_id?: string;
    hairColor?: string;
    hairType?: string;
    hairLength?: string;
    hairStructure?: string;
    clothingItem?: string;
    clothingDescription?: string;
    clothingColor?: string;
    toy?: string;
    eyeColor?: string;
    skinTone?: string;
    distinctiveFeatures?: string;
  };
}

export const DEFAULT_API_BRIDGE_URL =
  (import.meta as any).env?.VITE_API_BRIDGE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  '';

const logDev = (...args: unknown[]) => {
  if ((import.meta as any).env?.DEV) {
    console.log(...args);
  }
};

export function isMockMode(): boolean {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock') === 'true') return true;
    if (params.get('mock') === 'false') return false;
    // Очищаем старые тестовые флаги, чтобы у пользователя всегда генерировалась уникальная сказка через ИИ
    try {
      localStorage.removeItem('ms_mock_mode');
    } catch {}
  }
  return false; // По умолчанию включена реальная генерация через Wellflow API
}

export function setMockMode(enabled: boolean) {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('ms_mock_mode', 'true');
    } else {
      localStorage.removeItem('ms_mock_mode');
    }
  }
}

/**
 * Процедурный генератор уникальных сказок для оффлайн/тестового режима:
 * Каждая создаваемая сказка уникальна, подстраивается под пол, имя, тему, интересы и пожелания ребёнка.
 * Строго соблюдает грамматику (род/склонения), отсутствие скобок возраста и 5 уникальных иллюстраций.
 */
export function createMockStory(params: GenerateStoryParams): BookDetailsDTO {
  const child = params.childName?.trim() || 'Малыш';
  const theme = params.theme || 'Космос и дружба';
  const interest = params.interests?.[0] || 'волшебные открытия';

  // 1. Определение пола и согласование грамматики
  const isGirl = params.gender === 'girl' || (params.gender !== 'boy' && (child.endsWith('а') || child.endsWith('я')));
  const gender = isGirl ? 'girl' : 'boy';
  const declined = declineRussianName(child, gender);

  const vFelt = isGirl ? 'почувствовала' : 'почувствовал';
  const vStepped = isGirl ? 'очутилась' : 'очутился';
  const vSmiled = isGirl ? 'улыбнулась' : 'улыбнулся';
  const vProved = isGirl ? 'доказала' : 'доказал';
  const heroRef = isGirl ? 'На ней' : 'На нём';
  const heroWord = isGirl ? 'героиня' : 'герой';

  const hair = params.appearance?.hairColor
    ? `${params.appearance.hairLength || ''} ${params.appearance.hairType || params.appearance.hairStructure || ''} ${params.appearance.hairColor} волосы`.replace(/\s+/g, ' ').trim()
    : 'аккуратные волосы';
  const clothes = (params.appearance?.clothingItem || params.appearance?.clothingDescription)
    ? `${params.appearance?.clothingItem || params.appearance?.clothingDescription} (${params.appearance?.clothingColor || 'любимого цвета'})`
    : 'уютная одежда';

  const companionToy = params.appearance?.toy || 'Светлячок Лучик';
  const bookId = `book_story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Тематические миры и единый спутник
  const t = theme.toLowerCase();
  const storyMood = params.storyMood || (params as any).mood || '';
  const isBedtimeMood = storyMood === 'Спокойный сон' || t.includes('сон') || t.includes('ночь');
  const wLower = (params.customWishes || '').toLowerCase();
  let worldName = isBedtimeMood ? 'Волшебная поляна' : 'Волшебная страна открытий';
  let companionName = companionToy;
  let goalText = isBedtimeMood
    ? 'помочь крошечным лесным колокольчикам найти дорогу ко сну'
    : 'раскрыть великую тайну солнечной поляны и помочь лесным друзьям';
  let trialText = isBedtimeMood
    ? 'мягкий вечерний туман спрятал тропинку к полянке с колокольчиками'
    : 'извилистая тропинка петляла среди высоких волшебных трав, скрывая путь к разгадке';
  let victoryText = `${declined.nom} ласково зажгла свой волшебный фонарик доброты, а верный спутник озарил каждый листик тёплым золотым сиянием`;
  let climaxText = isBedtimeMood
    ? 'все сонные колокольчики нежно зазвенели в ответ, благодаря за заботу'
    : 'поляна озарилась тысячами ярких искр, а лесные жители устроили весёлый праздник в честь друзей';
  let coverUrl = params.avatarUrl || resolveAssetUrl('/illustrations/cover_forest.jpg');

  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('планет')) {
    worldName = 'Звёздная Поляна';
    companionName = companionToy.includes('Лучик') ? 'Светлячок Лучик' : companionToy;
    goalText = 'помочь маленькой звёздочке найти путь к её маме Большой Медведице';
    trialText = 'звёздное облачко мягкой серебристой пыли закрыло мерцающую небесную тропу';
    victoryText = `${declined.nom} ласково ${vSmiled} и подняла ручки к небу, а ${companionName} полетел вперёд и указал верный путь`;
    climaxText = isBedtimeMood
      ? 'небосвод озарился тёплым светом радости, и звёздочка счастливо заснула в объятиях мамы'
      : 'небосвод озарился фейерверком радости, и звёздочка весело закружилась в танце дружбы';
    coverUrl = resolveAssetUrl('/illustrations/cover_star.jpg');
  } else if (t.includes('дино') || t.includes('древн') || t.includes('джунгл')) {
    worldName = 'Зелёная Долина';
    companionName = companionToy.includes('Лучик') ? 'Динозаврик Тоша' : companionToy;
    goalText = isBedtimeMood
      ? 'найти для маленького динозаврика самую уютную полянку с тёплыми цветами для отдыха'
      : 'найти для маленького динозаврика древний кристалл дружбы';
    trialText = 'широкий ручеёк преградил путь, и мостик из листьев казался слишком далёким';
    victoryText = `${declined.nom} нашла надёжные гладкие камушки и бережно перевела друзей на другой берег`;
    climaxText = 'долина расцвела изумрудным светом, согревая всех ласковым теплом';
    coverUrl = resolveAssetUrl('/illustrations/cover_dino.jpg');
  } else if (t.includes('мор') || t.includes('океан') || t.includes('вод') || t.includes('рыб') || t.includes('черепах') || wLower.includes('черепах') || wLower.includes('мор')) {
    worldName = 'Лазурная Бухта';
    companionName = companionToy.includes('Лучик') ? 'Дельфинёнок Капелька' : companionToy;
    goalText = 'помочь маленькой морской черепашке благополучно добраться до тёплого кораллового рифа';
    trialText = 'игривые морские волны закружили ласковую тропинку из сияющих ракушек';
    victoryText = `${declined.nom} ласково ${isGirl ? 'протянула' : 'протянул'} руку помощи, бережно ${isGirl ? 'обняла' : 'обнял'} черепашку и ${isGirl ? 'указала' : 'указал'} путь к ласковому песчаному берегу`;
    climaxText = isBedtimeMood
      ? 'весь океан мягко убаюкал сиянием изумрудных ракушек, а сонная черепашка сладко закрыла глазки'
      : 'весь океан мягко озарился сиянием изумрудных ракушек, а благодарная черепашка радостно помахала лапкой и позвала играть';
    coverUrl = resolveAssetUrl('/illustrations/cover_forest.jpg');
  } else if (t.includes('лес') || t.includes('животн') || t.includes('звер')) {
    worldName = 'Изумрудный Лес';
    companionName = companionToy.includes('Лучик') ? 'Лисёнок Рыжик' : companionToy;
    coverUrl = resolveAssetUrl('/illustrations/cover_forest.jpg');
  }

  // Интеграция заветного пожелания родителя в кульминацию
  let wishAction = '';
  if (params.customWishes && params.customWishes.trim()) {
    const w = params.customWishes.trim();
    wishAction = ` В этот волшебный миг сбылось самое заветное желание: ${w}!`;
  }

  const title = `${declined.nom} и тайна: «${theme}»`;

  const isTextOnly = params.format === 'TEXT';
  // Иллюстрации сцен привязаны к теме или аватару героя (для формата TEXT - строго без картинок на сценах)
  const defaultSceneImg = isTextOnly ? null : (params.avatarUrl || coverUrl);
  const scene1Img = defaultSceneImg;
  const scene2Img = defaultSceneImg;
  const scene3Img = defaultSceneImg;
  const scene4Img = defaultSceneImg;

  const finaleBedtimeText = `И вот тайна открылась: ${climaxText}! Сердце ${declined.gen} наполнилось тихим теплом и радостью. Приключение счастливо завершилось, ${companionName} уютно устроился рядом, напевая нежную колыбельную. На небе мягко засияли добрые звёзды. Самое время сладко закрыть глазки и уснуть.`;
  const finaleDaytimeText = `И вот тайна открылась: ${climaxText}! Сердце ${declined.gen} наполнилось ликованием и солнечным теплом. Приключение завершилось настоящей победой добра! ${declined.nom} и ${companionName} дали друг другу пять и весело засмеялись. Впереди их ждало ещё множество удивительных открытий, новых игр и счастливых моментов!`;

  const finaleBedtimePrompt = `3D cartoon style scene 4: peaceful cozy bedtime finale, starry night sky, child sleeping peacefully, glowing warm light`;
  const finaleDaytimePrompt = `3D cartoon style scene 4: joyful daytime finale, smiling child celebrating victory with friend, bright sunlight, happy vibrant colors`;

  const isCostume = /супергеро|скафандр|космонавт|манти|волшебн|рыцар|доспех|кигуруми|дождевик|бальн.*плат|пижам/i.test(clothes) ||
    /супергеро|космос|рыцар|маги|волшеб/i.test(theme);
  const allowBestowal = /супергеро|космос|рыцар/i.test(theme) || /супергеро|скафандр|доспех/i.test(clothes);
  let costumeSentence = '';
  if (isCostume) {
    costumeSentence = allowBestowal
      ? ` Друзья приготовили для ${declined.gen} особенный ${clothes}, чтобы отправиться в славный путь!`
      : ` ${heroRef} был надет ${clothes}.`;
  }

  const rawScenes = [
    {
      id: 'scene_1',
      scene_index: 1,
      text: `Однажды солнечным утром ${declined.nom} ${vFelt}, что день готовит нечто по-настоящему чудесное.${costumeSentence ? ' ' + costumeSentence : ''} Рядом был любимый спутник — ${companionName}, ласково согревая ладошку. Вдруг тёплый ветерок зашелестел листвой, приглашая в удивительный мир — ${worldName}!`,
      image_url: scene1Img,
      image_prompt: `3D cartoon style scene 1: ${declined.nom} as a cute child smiling with ${companionName} in ${worldName}, soft 3D animation render`,
    },
    {
      id: 'scene_2',
      scene_index: 2,
      text: `Сделав смелый шаг, ${declined.nom} ${vStepped} на тропинку, где вокруг оживали ${interest}. ${companionName} тихонько прошептал: «Здравствуй, ${declined.nom}! Нам очень нужно ${goalText}». Маленькая ${heroWord} с радостью согласилась помочь верному другу.`,
      image_url: scene2Img,
      image_prompt: `3D cartoon style scene 2: ${declined.nom} and ${companionName} walking along friendly fairytale path, magical lighting`,
    },
    {
      id: 'scene_3',
      scene_index: 3,
      text: `Впереди возникло испытание: ${trialText}. Но ${declined.nom} не растерялась, ${vSmiled} и крепко взяла спутника за руку. ${victoryText}.${wishAction} Вместе друзья дружно справились с препятствием, доказав силу добра и дружбы!`,
      image_url: scene3Img,
      image_prompt: `3D cartoon style scene 3: ${declined.nom} gently holding light lantern with friends, overcoming challenge together`,
    },
    {
      id: 'scene_4',
      scene_index: 4,
      text: isBedtimeMood ? finaleBedtimeText : finaleDaytimeText,
      image_url: scene4Img,
      image_prompt: isBedtimeMood ? finaleBedtimePrompt : finaleDaytimePrompt,
    },
  ];

  // Валидация и нормализация грамматики
  const scenes = rawScenes.map((s) => ({
    ...s,
    text: fixGenderAgreements(removeAgeFromText(s.text), gender, declined.nom),
  }));

  const questions = params.includeQuestions
    ? [
        {
          id: 'q_1',
          after_scene: 2,
          question: `Что почувствовал${isGirl ? 'а' : ''} ${declined.nom}, когда началось приключение?`,
          parent_hint: 'Спросите ребёнка о его чувствах и эмоциях в начале пути.',
          skill_tag: 'empathy',
        },
        {
          id: 'q_2',
          after_scene: 4,
          question: `Кто помог ${declined.dat} стать смелее?`,
          parent_hint: isBedtimeMood
            ? 'Подчеркните важность заботы, доброты и взаимной поддержки перед сном.'
            : 'Подчеркните важность заботы, доброты, смелости и взаимной поддержки в жизни и дружбе.',
          skill_tag: 'reflection',
        },
      ]
    : [];

  return {
    id: bookId,
    title,
    status: isTextOnly ? 'TEXT_READY' : 'ILLUSTRATED',
    format: isTextOnly ? 'TEXT' : 'ILLUSTRATED',
    can_upgrade: false,
    cover_url: isTextOnly ? (params.avatarUrl || null) : coverUrl,
    scenes,
    questions,
  };
}

/**
 * Картинки, сгенерированные мостом, лежат в /media/<jobId>/...
 * Прямые CDN-ссылки Wellflow (https://api.wellflow.dev) защищены и отдаются напрямую!
 */
/**
 * Преобразует относительный путь ассета (например /illustrations/...) в корректный URL для GitHub Pages
 */
export function resolveAssetUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = ((import.meta as any).env?.BASE_URL || '/').replace(/\/+$/, '');
  const clean = url.replace(/^\/+/, '');
  return `${base}/${clean}`;
}

/**
 * Картинки, сгенерированные мостом, лежат в /media/<jobId>/...
 * Прямые CDN-ссылки Wellflow (https://api.wellflow.dev) защищены и отдаются напрямую!
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Прямые CDN-ссылки Wellflow не трогаем — они отдаются напрямую и быстро
  if (
    url.startsWith('https://api.wellflow.dev') ||
    url.startsWith('http://api.wellflow.dev') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex !== -1) {
    const base = getActiveApiUrl();
    return base ? `${base}${url.slice(mediaIndex)}` : url;
  }
  return resolveAssetUrl(url);
}

export function resolveBookMedia(book: BookDetailsDTO): BookDetailsDTO {
  return {
    ...book,
    cover_url: resolveMediaUrl(book.cover_url),
    scenes: book.scenes.map((scene) => ({
      ...scene,
      image_url: resolveMediaUrl(scene.image_url),
    })),
  };
}

const badApiUrls = new Set<string>();

export function markApiUrlFailed(url?: string | null) {
  if (!url) return;
  const clean = url.replace(/\/$/, '');
  badApiUrls.add(clean);
  try {
    const cached = localStorage.getItem('ms_api_url');
    if (cached && (cached.replace(/\/$/, '') === clean || clean.includes(cached))) {
      localStorage.removeItem('ms_api_url');
    }
  } catch {}
}

export function resetBadApiUrls() {
  badApiUrls.clear();
}

export function getActiveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const searchParams = new URLSearchParams(window.location.search);
    let paramUrl = searchParams.get('api_url');
    if (!paramUrl && window.location.hash.includes('api_url=')) {
      const qIndex = window.location.hash.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(window.location.hash.slice(qIndex + 1));
        paramUrl = hashParams.get('api_url');
      }
    }
    if (paramUrl) {
      const clean = paramUrl.replace(/\/$/, '');
      if (!badApiUrls.has(clean)) {
        try {
          localStorage.setItem('ms_api_url', clean);
        } catch {}
        return clean;
      }
    }
    try {
      const cached = localStorage.getItem('ms_api_url');
      const isDeadTunnel =
        !cached ||
        cached.includes('192a1eaba3c1ee78') ||
        cached.includes('b4e24b393c4c2c70') ||
        cached.includes('serveousercontent.com') ||
        cached.includes('trycloudflare.com') ||
        cached.includes('loca.lt') ||
        badApiUrls.has(cached.replace(/\/$/, ''));

      if (isDeadTunnel && cached) {
        localStorage.removeItem('ms_api_url');
      } else if (cached && !isDeadTunnel) {
        return cached.replace(/\/$/, '');
      }
    } catch {}
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4040';
    }
  }
  return DEFAULT_API_BRIDGE_URL;
}

/**
 * Опрос фоновой задачи генерации на сервере/мосте
 */
async function pollJob<T>(
  activeApi: string,
  jobId: string,
  maxWaitMs = 240000,
  onProgress?: (update: StoryProgressUpdate) => void,
  childName?: string,
  userId?: string
): Promise<T> {
  const start = Date.now();
  let consecutiveErrors = 0;
  let currentBase = activeApi;

  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      // Если было несколько сетевых сбоев, пробуем обновить базовый URL из хранилища
      if (consecutiveErrors >= 5) {
        const fresh = getActiveApiUrl();
        if (fresh && fresh !== currentBase) {
          currentBase = fresh;
        }
      }

      // Всегда опрашиваем с меткой времени _t и cache: 'no-store', чтобы Safari/WebKit не кэшировал статус
      const pollUrl = `${currentBase}/api/v1/ai/job-status?id=${encodeURIComponent(jobId)}&_t=${Date.now()}`;
      const res = await fetch(pollUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Bypass-Tunnel-Reminder': 'true',
          'X-Pinggy-No-Screen': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (res.ok) {
        consecutiveErrors = 0;
        const data = await res.json();
        if (data.stage && data.message && onProgress) {
          onProgress({
            stage: data.stage,
            progress: data.progress || 50,
            message: data.message,
          });
        }
        if (data.status === 'ready' || data.status === 'COMPLETED' || data.state === 'COMPLETED') {
          onProgress?.({
            stage: 'finishing',
            progress: 96,
            message: 'Сказка готова! Открываем страницы...',
          });
          return (data.story || data.book || data.imageUrl || data) as T;
        }
        if (data.status === 'error' || data.status === 'FAILED_FINAL') {
          throw new Error(`JOB_FAILED: ${data.error || 'Job failed'}`);
        }
      } else if (res.status === 404) {
        consecutiveErrors++;
        // Пробуем альтернативный маршрут /api/v1/ai/job/:id
        try {
          const altPollUrl = `${currentBase}/api/v1/ai/job/${encodeURIComponent(jobId)}?_t=${Date.now()}`;
          const altRes = await fetch(altPollUrl, {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store' },
          });
          if (altRes.ok) {
            const altData = await altRes.json();
            if (altData.status === 'ready' || altData.status === 'COMPLETED' || altData.state === 'COMPLETED') {
              return (altData.story || altData.book || altData.imageUrl || altData) as T;
            }
          }
        } catch {}

        if (consecutiveErrors > 50) {
          throw new Error('Задача генерации не найдена на сервере');
        }
      } else {
        consecutiveErrors++;
      }
    } catch (err: any) {
      if (
        err.message &&
        (err.message.startsWith('JOB_FAILED:') ||
          err.message.includes('Job failed') ||
          err.message.includes('Задача генерации не найдена'))
      ) {
        const cleanMsg = err.message.replace(/^JOB_FAILED:\s*/, '');
        throw new Error(cleanMsg);
      }
      consecutiveErrors++;
      if (consecutiveErrors % 5 === 0 && onProgress) {
        onProgress({
          stage: 'finishing',
          progress: 88,
          message: 'Сказка почти готова... Проверяем связь со сказочной мастерской...',
        });
      }
      if (consecutiveErrors > 40) {
        // Пробуем аварийный запрос последней готовой сказки перед падением
        if (childName) {
          try {
            const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
            const fallbackRes = await fetch(
              `${currentBase}/api/v1/ai/latest-story?childName=${encodeURIComponent(childName)}${userParam}&_t=${Date.now()}`,
              {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Bypass-Tunnel-Reminder': 'true',
                },
              }
            );
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData.status === 'ready' && fallbackData.story) {
                logDev('[StoryGenerator] 🔄 Найдена готовая сказка через latest-story!');
                return fallbackData.story as T;
              }
            }
          } catch {}
        }
        throw new Error('Потеряно соединение с сервером генерации сказок');
      }
    }
  }

  // Перед таймаутом проверяем, не завершилась ли сказка на сервере
  if (childName) {
    try {
      const userParam = userId ? `&userId=${encodeURIComponent(userId)}` : '';
      const fallbackRes = await fetch(
        `${currentBase}/api/v1/ai/latest-story?childName=${encodeURIComponent(childName)}${userParam}&_t=${Date.now()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Bypass-Tunnel-Reminder': 'true',
          },
        }
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.status === 'ready' && fallbackData.story) {
          logDev('[StoryGenerator] 🔄 Готовая сказка получена перед таймаутом!');
          return fallbackData.story as T;
        }
      }
    } catch {}
  }

  throw new Error('Превышено время ожидания генерации сказки (таймаут)');
}

// Промпт и контракт сказки живут в packages/story-engine/src/index.mjs.

/**
 * Генерация одной иллюстрации через серверный мост.
 * Промпт уже содержит 3D-мультяшный стиль и character bible от Story Engine.
 */
export async function generateWellflowImage(prompt: string, timeoutMs = 120000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const activeApi = getActiveApiUrl();
  const candidates: Array<{
    url: string;
    headers: Record<string, string>;
    body: any;
    pollBase: string;
  }> = [];

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    candidates.push({
      url: 'http://localhost:4040/api/v1/ai/generate-image',
      headers: { 'Content-Type': 'application/json' },
      body: { prompt, type: 'scene' },
      pollBase: 'http://localhost:4040',
    });
    candidates.push({
      url: 'http://127.0.0.1:4040/api/v1/ai/generate-image',
      headers: { 'Content-Type': 'application/json' },
      body: { prompt, type: 'scene' },
      pollBase: 'http://127.0.0.1:4040',
    });
  }

  if (activeApi) {
    candidates.push({
      url: `${activeApi}/api/v1/ai/generate-image`,
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body: { prompt, type: 'scene' },
      pollBase: activeApi,
    });
  }

  candidates.push({
    url: '/api/v1/ai/generate-image',
    headers: { 'Content-Type': 'application/json' },
    body: { prompt, type: 'scene' },
    pollBase: '',
  });

  try {
    for (const candidate of candidates) {
      const initCtrl = new AbortController();
      const initTimer = setTimeout(() => initCtrl.abort(), 3500);

      try {
        const res = await fetch(candidate.url, {
          method: 'POST',
          headers: candidate.headers,
          body: JSON.stringify(candidate.body),
          signal: initCtrl.signal,
        });
        clearTimeout(initTimer);

        if (res.ok || res.status === 202) {
          const data = await res.json();
          if (data.jobId) {
            const polled = await pollJob<{ imageUrl?: string }>(candidate.pollBase, data.jobId, timeoutMs);
            const img = polled?.imageUrl || (typeof polled === 'string' ? polled : null);
            if (img) {
              clearTimeout(timer);
              return img;
            }
          }
          const imageUrl = data.imageUrl || data.data?.[0]?.url;
          if (imageUrl) {
            clearTimeout(timer);
            return imageUrl;
          }
        }
      } catch {
        clearTimeout(initTimer);
        // try next candidate
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return null;
}

/**
 * Получение списка названий недавних книг ребёнка из localStorage для исключения повторений сюжета
 */
export function getRecentBooksBlacklist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('ms_books');
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list
        .slice(0, 6)
        .map((b: any) => b.title || b.theme)
        .filter(Boolean);
    }
  } catch {}
  return [];
}

/**
 * Генератор уникальной комбинации Story DNA (ДНК сказки) для каждой книги
 */
/**
 * Вызов серверного Story Engine с таймаутом
 */
export async function callWellflowStory(
  params: GenerateStoryParams,
  timeoutMs = 240000,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<any> {
  const overallStart = Date.now();
  const recentBlacklist = getRecentBooksBlacklist();
  const effectiveUserId =
    params.userId ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('ms_user_id') : '') ||
    'user_demo';
  const effectiveAvatarUrl =
    params.avatarUrl ||
    params.appearance?.avatar_url ||
    '';
  const body = {
    userId: effectiveUserId,
    childName: params.childName,
    age: params.age,
    interests: params.interests,
    theme: params.theme,
    appearance: params.appearance,
    avatarUrl: effectiveAvatarUrl,
    personality: params.personality,
    storyMood: params.storyMood,
    customWishes: params.customWishes,
    includeQuestions: params.includeQuestions,
    gender: params.gender,
    format: params.format || 'ILLUSTRATED',
    recentBlacklist,
  };

  const activeApi = getActiveApiUrl();
  const candidates: Array<{ url: string; pollBase: string }> = [];

  const addCandidate = (base: string) => {
    const clean = (base || '').replace(/\/$/, '');
    if (!clean) return;
    const full = `${clean}/api/v1/ai/generate-story`;
    if (!candidates.some((c) => c.url === full)) {
      candidates.push({ url: full, pollBase: clean });
    }
  };

  // 1. Immediately prioritize local port or current origin to avoid stale tunnel delays
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    addCandidate('http://localhost:4040');
    addCandidate('http://127.0.0.1:4040');
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
    candidates.push({ url: '/api/v1/ai/generate-story', pollBase: '' });
  }
  if (activeApi) addCandidate(activeApi);
  if (DEFAULT_API_BRIDGE_URL && !DEFAULT_API_BRIDGE_URL.includes('loca.lt')) {
    addCandidate(DEFAULT_API_BRIDGE_URL);
  }

  let jobId: string | null = null;
  let workingPollBase = '';

  for (const candidate of candidates) {
    const initCtrl = new AbortController();
    const initTimer = setTimeout(() => initCtrl.abort(), 20000);

    try {
      const response = await fetch(candidate.url, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Bypass-Tunnel-Reminder': 'true',
          'X-Pinggy-No-Screen': 'true',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
        signal: initCtrl.signal,
      });
      clearTimeout(initTimer);

      if (response.ok || response.status === 202) {
        const data = await response.json();
        if ((data.status === 'ready' || data.status === 'COMPLETED') && data.story && Array.isArray(data.story.scenes)) {
          logDev('[StoryGenerator] ✅ Сказка готова сразу из ответа:', data.story.title);
          return data.story;
        } else if (data.story && Array.isArray(data.story.scenes)) {
          logDev('[StoryGenerator] ✅ Сказка получена напрямую:', data.story.title);
          return data.story;
        } else if (data.scenes && Array.isArray(data.scenes)) {
          logDev('[StoryGenerator] ✅ Сказка получена напрямую:', data.title);
          return data;
        } else if (data.jobId || data.job_id) {
          jobId = data.jobId || data.job_id;
          workingPollBase = candidate.pollBase;
          if (candidate.pollBase) {
            try {
              localStorage.setItem('ms_api_url', candidate.pollBase);
            } catch {}
          }
          break;
        }
      } else {
        markApiUrlFailed(candidate.pollBase);
      }
    } catch (err: any) {
      clearTimeout(initTimer);
      markApiUrlFailed(candidate.pollBase);
      console.warn(`[StoryGenerator] Не удалось начать генерацию через ${candidate.url}:`, err.message);
    }
  }

  if (jobId) {
    logDev(`[StoryGenerator] ⏳ Ожидание генерации сюжета через мост ${workingPollBase} (jobId: ${jobId})...`);
    const remainingMs = Math.max(30000, timeoutMs - (Date.now() - overallStart));
    const polled = await pollJob<any>(workingPollBase, jobId, remainingMs, onProgress, params.childName, effectiveUserId);
    if (polled && polled.scenes) {
      logDev('[StoryGenerator] ✅ Сказка получена через Story Engine:', polled.title);
      return polled;
    }
  }

  throw new Error('Не удалось связаться с сервером генерации сказок ни по одному из адресов');
}

export function getFairytaleFallbackIllustration(themeOrInterest?: string, sceneIndex = 1): string {
  const t = (themeOrInterest || '').toLowerCase();
  if (t.includes('дино')) return resolveAssetUrl('/illustrations/cover_dino.jpg');
  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('сон') || t.includes('ночь')) {
    return resolveAssetUrl('/illustrations/cover_star.jpg');
  }
  return resolveAssetUrl('/illustrations/cover_forest.jpg');
}

export interface StoryProgressUpdate {
  stage: 'writing' | 'drawing' | 'finishing';
  progress: number;
  message: string;
  remainingSec?: number;
}

/**
 * Основная функция генерации сказки:
 * 1. Запрашивает серверный Story Engine с таймаутом (мост или тот же origin).
 * 2. Генерирует уникальную сказку на лету под ребёнка через Story DNA Engine.
 * 3. Мост на сервере генерирует параллельно все 4 иллюстрации через Nano Banana 2.
 * 4. Если связь с мостом прервана или туннель устарел — АВТОМАТИЧЕСКИ И БЕСШОВНО
 *    создаёт полноценную персонализированную сказку через Story Engine без показа ошибок пользователю!
 */
export async function generateDynamicStory(
  params: GenerateStoryParams,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<BookDetailsDTO> {
  // Бесплатный тестовый режим без вызовов API и без затрат денег
  if (isMockMode()) {
    logDev('[StoryGenerator] ⚡️ Бесплатный тестовый режим (MOCK_AI): генерация без затрат API для', params.childName);
    onProgress?.({
      stage: 'writing',
      progress: 25,
      message: 'Сочиняем уникальный сюжет и character bible...',
    });
    await new Promise((r) => setTimeout(r, 600));

    onProgress?.({
      stage: 'drawing',
      progress: 65,
      message: 'Сказочный художник рисует живые иллюстрации...',
    });
    await new Promise((r) => setTimeout(r, 700));

    onProgress?.({
      stage: 'drawing',
      progress: 90,
      message: 'Подготавливаем страницы книги...',
    });
    await new Promise((r) => setTimeout(r, 500));

    onProgress?.({
      stage: 'finishing',
      progress: 100,
      message: 'Сказка готова!',
    });

    return createMockStory(params);
  }

  onProgress?.({
    stage: 'writing',
    progress: 20,
    message: 'Сочиняем неповторимый сюжет и диалоги...',
  });

  let storyData: any = null;
  let lastError: any = null;
  try {
    storyData = await callWellflowStory(params, 240000, onProgress);
  } catch (err: any) {
    lastError = err;
    console.warn('[StoryGenerator] Ошибка вызова callWellflowStory:', err.message);
    // Пробуем восстановить готовую сказку через latest-story, если связь оборвалась
    const apiBase = getActiveApiUrl();
    const effectiveUserId =
      params.userId ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('ms_user_id') : '') ||
      '';
    const userParam = effectiveUserId ? `&userId=${encodeURIComponent(effectiveUserId)}` : '';
    if (apiBase && params.childName) {
      try {
        let checkRes = await fetch(
          `${apiBase}/api/v1/ai/latest-story?childName=${encodeURIComponent(params.childName.trim())}${userParam}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        if (!checkRes.ok && effectiveUserId) {
          checkRes = await fetch(
            `${apiBase}/api/v1/ai/latest-story?childName=${encodeURIComponent(params.childName.trim())}&_t=${Date.now()}`,
            { cache: 'no-store' }
          );
        }
        if (checkRes.ok) {
          const data = await checkRes.json();
          if (data?.status === 'ready' && data?.story?.scenes?.length >= 4) {
            storyData = data.story;
          }
        }
      } catch {}
    }
    if (!storyData) {
      if (isMockMode()) {
        console.warn('[StoryGenerator] ⚠️ Тестовый режим: возврат мок сказки');
        return createMockStory(params);
      }
      throw new Error(lastError?.message || 'Сервер создания сказки временно недоступен. Пожалуйста, попробуйте снова.');
    }
  }

  if (!storyData || !Array.isArray(storyData.scenes) || storyData.scenes.length < 4) {
    if (isMockMode()) {
      return createMockStory(params);
    }
    throw new Error('Получен некорректный ответ от генератора сказок. Пожалуйста, попробуйте снова.');
  }

  const isGirl = params.gender === 'girl' || (params.gender !== 'boy' && (params.childName?.endsWith('а') || params.childName?.endsWith('я')));
  const gender = isGirl ? 'girl' : 'boy';
  const child = params.childName?.trim() || 'Малыш';
  const rawHairCombined = `${params.appearance?.hairLength || ''} ${params.appearance?.hairType || ''} ${params.appearance?.hairStructure || ''}`.toLowerCase();
  const isChildLongHair = rawHairCombined.includes('длинн') || rawHairCombined.includes('long');

  const bookId = storyData.id || `book_${Date.now()}`;
  const scenes = storyData.scenes.slice(0, 4).map((s: any, idx: number) => {
    const sceneIndex = idx + 1;
    let prompt = s.image_prompt || s.visual || buildFairytaleImagePrompt(params, `in scene ${sceneIndex}`);
    const hasCorruptedFallbackAnchor = prompt.includes('boy named Hero') ||
      (isGirl && prompt.includes('4-year-old boy')) ||
      (isChildLongHair && prompt.includes('neat short playful hair'));
    if (hasCorruptedFallbackAnchor) {
      prompt = prompt.replace(/\[CHARACTER CONSISTENCY MANDATORY:[^\]]+\]/g, '').trim();
    }
    if (!prompt.includes('CHARACTER CONSISTENCY MANDATORY')) {
      const anchor = buildFairytaleCharacterAnchor(params);
      prompt = `${anchor} ${prompt}`.replace(/\s+/g, ' ').trim();
    }
    const cleanedText = fixGenderAgreements(removeAgeFromText(s.text || ''), gender, child);
    return {
      id: s.id || `scene_${sceneIndex}`,
      scene_index: sceneIndex,
      index: sceneIndex,
      text: cleanedText,
      image_url: s.image_url || s.imageUrl || null, // Сохраняем готовую иллюстрацию с моста!
      image_prompt: prompt,
    };
  });

  const book: BookDetailsDTO = {
    id: bookId,
    title: storyData.title || `${child} и тайна «${params.theme}»`,
    status: 'ILLUSTRATED',
    format: 'ILLUSTRATED',
    can_upgrade: false,
    cover_url: storyData.cover_url || storyData.coverUrl || storyData.scenes?.[0]?.image_url || storyData.scenes?.[0]?.imageUrl || null,
    scenes,
    questions:
      params.includeQuestions && Array.isArray(storyData.questions)
        ? storyData.questions.map((q: any, i: number) => ({
            id: `q_${i + 1}`,
            after_scene: q.after_scene || (i === 0 ? 2 : 4),
            question: fixGenderAgreements(removeAgeFromText(q.question || ''), gender, child),
            parent_hint: q.parent_hint || null,
            skill_tag: q.skill || q.skill_tag || (i === 0 ? 'emotions' : 'empathy'),
          }))
        : [],
  };

  // Для бесплатной первой сказки (строго текстовый формат) пропускаем генерацию 5 картинок
  if (params.format === 'TEXT') {
    book.format = 'TEXT';
    book.status = 'TEXT_READY';
    book.cover_url = null;
    scenes.forEach((s: any) => {
      s.image_url = null;
    });
    onProgress?.({
      stage: 'finishing',
      progress: 100,
      message: 'Текстовая сказка готова!',
    });
    return book;
  }

  // Если какие-то сцены ещё не имеют image_url (например, при запросе в обход моста)
  const missingScenes = scenes.filter((s: any) => !s.image_url);
  if (missingScenes.length > 0) {
    onProgress?.({
      stage: 'drawing',
      progress: 45,
      message: 'Художественная мастерская рисует 5 иллюстраций...',
    });

    let completedCount = scenes.length - missingScenes.length;
    await Promise.all(
      missingScenes.map(async (scene: any) => {
        try {
          const url = await generateWellflowImage(scene.image_prompt, 120000);
          if (url) {
            scene.image_url = url;
            logDev(`[StoryGenerator] ✅ Иллюстрация для сцены ${scene.scene_index} готова:`, url.slice(0, 60));
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('ms_scene_image_updated', {
                  detail: { sceneIndex: scene.scene_index, url },
                })
              );
            }
          }
        } catch (e) {
          console.warn(`[StoryGenerator] ⚠️ Иллюстрация для сцены ${scene.scene_index} задержана:`, e);
        }
        if (!scene.image_url) {
          scene.image_url = getFairytaleFallbackIllustration(params.theme || params.interests?.[0], scene.scene_index);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('ms_scene_image_updated', {
                detail: { sceneIndex: scene.scene_index, url: scene.image_url },
              })
            );
          }
        }
        completedCount++;
        const progressVal = 40 + Math.round((completedCount / scenes.length) * 35);
        onProgress?.({
          stage: 'drawing',
          progress: progressVal,
          message: `Художественная мастерская рисует 5 иллюстраций (${completedCount} из ${scenes.length} готовы)...`,
        });
      })
    );
  }

  // Для иллюстрированных книг гарантируем наличие картинки на каждой сцене и обложке
  scenes.forEach((s: any, idx: number) => {
    if (!s.image_url) {
      s.image_url = getFairytaleFallbackIllustration(params.theme || params.interests?.[0], idx + 1);
    }
  });

  if (!book.cover_url) {
    book.cover_url = scenes[0]?.image_url || getFairytaleFallbackIllustration(params.theme || params.interests?.[0], 1);
  }

  // ПРЕДЗАГРУЗКА ИЗОБРАЖЕНИЙ: держим кнопку/оверлей до тех пор, пока картинки не окажутся в памяти браузера
  onProgress?.({
    stage: 'finishing',
    progress: 90,
    message: 'Сшиваем страницы и настраиваем колыбельную...',
  });

    await Promise.all(
      scenes.map(
        (scene: any) =>
          new Promise<void>((resolve) => {
            if (!scene.image_url) {
              resolve();
              return;
            }
            const img = new Image();
            const timer = setTimeout(resolve, 3000);
            img.onload = () => {
              clearTimeout(timer);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timer);
              resolve();
            };
            img.src = scene.image_url;
          })
      )
    );

    onProgress?.({
      stage: 'finishing',
      progress: 100,
      message: 'Сказка готова!',
    });

    return book;
}


export function buildFairytaleCharacterAnchor(params: GenerateStoryParams): string {
  const genderWord = params.gender === 'girl' ? 'girl' : 'boy';
  const rawColor = String(params.appearance?.hairColor || '').toLowerCase();
  const rawType = String(params.appearance?.hairType || '').toLowerCase();
  const rawLength = String(params.appearance?.hairLength || '').toLowerCase();
  const rawStructure = String(params.appearance?.hairStructure || '').toLowerCase();
  const combined = `${rawLength} ${rawType} ${rawStructure} ${rawColor}`;

  const isCurly = combined.includes('кудр') || combined.includes('curly') || combined.includes('волнист') || combined.includes('wavy');
  const isStraight = combined.includes('прям') || combined.includes('straight');
  const isLong = combined.includes('длинн') || combined.includes('long');

  const isBlond = rawColor.includes('светл') || rawColor.includes('blond') || rawColor.includes('желт') || rawColor.includes('жёлт');
  const isDark = rawColor.includes('темн') || rawColor.includes('тёмн') || rawColor.includes('брюнет') || rawColor.includes('черн') || rawColor.includes('чёрн') || rawColor.includes('dark') || rawColor.includes('chestnut');
  const isRed = rawColor.includes('рыж') || rawColor.includes('red') || rawColor.includes('ginger');

  const colorPrefix = isBlond
    ? 'golden-blond'
    : isDark
    ? 'warm chestnut dark brown'
    : isRed
    ? 'vibrant ginger reddish-brown'
    : 'soft light-brown';

  let exactHairPrompt: string;
  if (isLong) {
    const texture = isCurly ? 'bouncy curly' : isStraight ? 'silky straight' : 'silky';
    exactHairPrompt = `${colorPrefix} ${texture} hair, distinctly long flowing below shoulders, with a neat cute ribbon, exact same hair length and tone across all scenes`;
  } else if (isCurly) {
    exactHairPrompt = `${colorPrefix} bouncy curly hair`;
  } else if (isStraight) {
    exactHairPrompt = `${colorPrefix} neat smooth straight silky hair`;
  } else {
    exactHairPrompt = `${colorPrefix} neat short playful hair`;
  }

  const skinToneMap: Record<string, string> = {
    светлая: 'fair rosy-cheeked',
    персиковая: 'healthy peach',
    смуглая: 'warm golden sun-kissed',
  };
  const eyeColorMap: Record<string, string> = {
    карие: 'warm sparkling hazel-brown',
    голубые: 'bright clear sky-blue',
    зелёные: 'gentle expressive emerald-green',
    серые: 'soft thoughtful slate-grey',
  };

  const skin = skinToneMap[params.appearance?.skinTone?.toLowerCase() || 'персиковая'] || 'healthy peach';
  const eyes = eyeColorMap[params.appearance?.eyeColor?.toLowerCase() || 'карие'] || 'warm sparkling hazel-brown';
  const clothing = params.appearance?.clothingItem || 'cozy outfit';
  const continuityNote = isLong
    ? 'IDENTICAL facial features and hairstyle across all images, strictly maintain exact same long hair length flowing below shoulders, never short, never bob cut.'
    : 'IDENTICAL facial features and hairstyle across all images.';

  return `[CHARACTER CONSISTENCY MANDATORY: 3D cartoon style, a ${params.age}-year-old ${genderWord} named ${params.childName}, ${skin} skin, ${eyes} eyes, ${exactHairPrompt}, wearing ${clothing}. ${continuityNote}]`;
}

/**
 * Эталонный генератор промпта для детской книжной иллюстрации
 * (стиль: 3D Disney Pixar animation movie still согласно ТЗ)
 */
export function buildFairytaleImagePrompt(params: GenerateStoryParams, sceneAction: string): string {
  const genderWord = params.gender === 'girl' ? 'girl' : 'boy';

  // Точные английские атрибуты внешности
  const hairColorMap: Record<string, string> = {
    светлые: 'golden blond',
    русые: 'soft light-brown',
    тёмные: 'warm chestnut dark brown',
    рыжие: 'vibrant ginger reddish-brown',
  };

  const LONG_HAIR_DESCRIPTOR = 'long flowing hair reaching below shoulders, neat hairstyle, consistent length';
  const rawHairCombined = `${params.appearance?.hairLength || ''} ${params.appearance?.hairType || ''} ${params.appearance?.hairStructure || ''}`.toLowerCase();
  const isCurly = rawHairCombined.includes('кудр') || rawHairCombined.includes('curly') || rawHairCombined.includes('волнист') || rawHairCombined.includes('wavy');
  const isStraight = rawHairCombined.includes('прям') || rawHairCombined.includes('straight');
  const isLong = rawHairCombined.includes('длинн') || rawHairCombined.includes('long');
  const isShort = rawHairCombined.includes('коротк') || rawHairCombined.includes('short');

  const resolveHairPrompt = (typeRaw?: string): string => {
    const t = String(typeRaw || '').toLowerCase();
    const curCurly = isCurly || t.includes('кудр');
    const curStraight = isStraight || t.includes('прям');
    const curLong = isLong || t.includes('длинн');
    const curShort = isShort || t.includes('коротк');

    if (curLong && curCurly) return `${LONG_HAIR_DESCRIPTOR}, bouncy curly wavy with a cute ribbon`;
    if (curLong && curStraight) return `${LONG_HAIR_DESCRIPTOR}, smooth straight silky with a cute ribbon`;
    if (curLong) return `${LONG_HAIR_DESCRIPTOR}, with a cute ribbon`;
    if (curShort && curCurly) return 'short playful bouncy curly';
    if (curShort && curStraight) return 'neat short straight';
    if (curCurly) return 'soft bouncy curly wavy';
    if (curStraight) return 'neat smooth straight silky';
    if (curShort) return 'neat short playful';
    return 'neat short playful';
  };
  const clothingColorMap: Record<string, string> = {
    изумрудный: 'cozy emerald green',
    'солнечно-жёлтый': 'bright sunny yellow',
    'небесно-голубой': 'soft pastel sky-blue',
    'нежно-розовый': 'gentle baby pink',
    терракотовый: 'warm vibrant terracotta orange',
  };
  const clothingItemMap: Record<string, string> = {
    'уютный свитер': 'knitted sweater with soft yarn texture',
    комбинезончик: 'cute denim overalls dungarees',
    платьице: 'charming fairytale dress with soft ruffles',
    толстовка: 'warm cozy hooded sweatshirt',
  };
  const companionMap: Record<string, string> = {
    'плюшевый динозаврик':
      'a small, chubby, friendly green dinosaur with soft spots',
    'плюшевый мишка':
      'a soft fluffy plush teddy bear with hand-stitched details and shiny button eyes',
    'пушистый зайка':
      'a cute fluffy little bunny rabbit with long velvety ears and a pink twitching nose',
    'маленький котёнок':
      'an adorable tiny kitten with big luminous curious eyes and soft whiskers',
    'волшебная звёздочка':
      'a glowing friendly fairytale star creature with a warm smiling face and glittering stardust',
  };

  const eyeColorMap: Record<string, string> = {
    карие: 'warm sparkling hazel-brown eyes',
    голубые: 'bright clear sky-blue eyes',
    зелёные: 'gentle expressive emerald-green eyes',
    серые: 'soft thoughtful slate-grey eyes',
  };
  const skinToneMap: Record<string, string> = {
    светлая: 'fair rosy-cheeked skin',
    персиковая: 'warm healthy peach complexion',
    смуглая: 'warm golden sun-kissed skin tone',
  };

  const resolveClothingItemPrompt = (item?: string): string => {
    if (!item) return 'knitted sweater with soft yarn texture';
    const clean = item.trim().toLowerCase();
    if (clothingItemMap[clean]) return clothingItemMap[clean];
    if (clean.includes('дождевик')) return 'bright raincoat with a hood and tiny boots';
    if (clean.includes('пижам')) return 'cozy bedtime pajama';
    if (clean.includes('плать')) return 'charming fairytale dress with soft ruffles';
    if (clean.includes('свитер') || clean.includes('кофт')) return 'knitted sweater with soft yarn texture';
    if (clean.includes('комбинезон')) return 'cute denim overalls dungarees';
    if (clean.includes('толстовк') || clean.includes('худи')) return 'warm cozy hooded sweatshirt';
    if (clean.includes('космонавт')) return 'playful astronaut suit';
    if (clean.includes('супергеро')) return 'mini superhero costume';
    if (clean.includes('манти') || clean.includes('волшебник')) return 'magical wizard robe with starry patterns';
    if (clean.includes('футболк')) return 'comfortable soft t-shirt';
    if (clean.includes('куртк')) return 'warm cozy jacket';
    return `cute charming outfit (${clean})`;
  };

  const resolveClothingColorPrompt = (color?: string, itemText: string = ''): string => {
    const text = (String(color || '') + ' ' + itemText).toLowerCase();
    if (color && clothingColorMap[color.toLowerCase()]) return clothingColorMap[color.toLowerCase()];
    if (text.includes('жёлт')) return 'bright sunny yellow';
    if (text.includes('голуб')) return 'soft pastel sky-blue';
    if (text.includes('син')) return 'deep royal blue';
    if (text.includes('розов')) return 'gentle baby pink';
    if (text.includes('зелён') || text.includes('изумруд')) return 'cozy emerald green';
    if (text.includes('красн') || text.includes('терракот')) return 'warm vibrant terracotta orange';
    if (text.includes('фиолет') || text.includes('сирен')) return 'gentle soft lilac purple';
    if (text.includes('бел') || text.includes('светл')) return 'pure soft warm white';
    if (text.includes('оранж')) return 'warm sunny orange';
    return 'cozy';
  };

  const resolveToyPrompt = (toy?: string): string => {
    if (!toy) return 'a small friendly companion creature';
    const clean = toy.trim().toLowerCase();
    if (companionMap[clean]) return companionMap[clean];
    if (clean.includes('дино')) return 'a small chubby friendly green plush dinosaur with soft spots and button eyes';
    if (clean.includes('мишк') || clean.includes('медвеж')) return 'a soft fluffy plush teddy bear with hand-stitched details and shiny button eyes';
    if (clean.includes('зай') || clean.includes('кролик')) return 'a cute fluffy little bunny rabbit with long velvety ears and a pink twitching nose';
    if (clean.includes('кот') || clean.includes('кош')) return 'an adorable tiny kitten with big luminous curious eyes and soft whiskers';
    if (clean.includes('звезд') || clean.includes('звёзд')) return 'a glowing friendly fairytale star creature with a warm smiling face and glittering stardust';
    if (clean.includes('машин') || clean.includes('кар') || clean.includes('поезд') || clean.includes('паровоз')) return 'a small cheerful colorful toy vehicle with rounded edges and friendly headlights';
    if (clean.includes('робот')) return 'a cute friendly retro toy robot with rounded corners and glowing eyes';
    if (clean.includes('жираф')) return 'a cute plush giraffe with funny little horns and soft spots';
    if (clean.includes('слон')) return 'a gentle plush elephant with big soft velvety ears and a curved trunk';
    if (clean.includes('щен') || clean.includes('собак') || clean.includes('пёс')) return 'a friendly fluffy plush puppy dog with floppy ears and a kind embroidered smile';
    if (clean.includes('кукл')) return 'a sweet charming cloth ragdoll with yarn hair and an embroidered smile';
    if (clean.includes('утк')) return 'a cheerful cute yellow toy duckling with an orange beak';
    if (clean.includes('лис')) return 'a clever sweet plush red fox with a fluffy white-tipped tail';
    if (clean.includes('дракон')) return 'a tiny friendly cute baby dragon with small soft wings';
    if (clean.includes('единорог')) return 'a magical cute plush unicorn with a soft spiral horn and rainbow mane';
    return `a beloved charming toy companion (${clean}) with hand-crafted details and friendly button eyes`;
  };

  const exactHairPrompt = resolveHairPrompt(params.appearance?.hairType);
  const hair = `${hairColorMap[params.appearance?.hairColor?.toLowerCase() || 'русые'] || 'soft light-brown'} ${exactHairPrompt} hair`;
  const eyes = eyeColorMap[params.appearance?.eyeColor?.toLowerCase() || 'карие'] || 'warm sparkling eyes';
  const skin = skinToneMap[params.appearance?.skinTone?.toLowerCase() || 'персиковая'] || 'warm healthy peach complexion';
  const rawItem = params.appearance?.clothingItem || 'уютный свитер';
  const clothes = `${resolveClothingColorPrompt(params.appearance?.clothingColor, rawItem)} ${resolveClothingItemPrompt(rawItem)}`;
  const companion = resolveToyPrompt(params.appearance?.toy);

  const characterAnchor = buildFairytaleCharacterAnchor(params);

  return `${characterAnchor} A breathtaking 3D cartoon style, soft 3D animation movie still for a children's fairytale book. A cute ${params.age}-year-old ${genderWord} named ${params.childName} with ${hair}, ${eyes}, ${skin}, wearing ${clothes}, accompanied by ${companion}, ${sceneAction}. Cinematic volumetric golden hour lighting, soft glowing particles, fireflies, rich depth of field (85mm f/1.4 lens bokeh), warm cozy bedtime atmosphere, Octane 3D CGI render, masterpiece, no text, no words.`;
}
