import { BookDetailsDTO } from '@moya-skazka/shared';
import { declineRussianName, removeAgeFromText, fixGenderAgreements } from '../utils/russianGrammar';

export interface GenerateStoryParams {
  childName: string;
  age: number;
  gender?: 'boy' | 'girl';
  theme: string;
  interests: string[];
  personality: string;
  customWishes?: string | null;
  includeQuestions: boolean;
  appearance?: {
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
  };
}

export const DEFAULT_API_BRIDGE_URL =
  (import.meta as any).env?.VITE_API_BRIDGE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  '';

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
  const wishes = params.customWishes ? ` Рядом был любимый спутник — ${params.customWishes}.` : '';

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
    ? `${params.appearance.hairLength || ''} ${params.appearance.hairStructure || ''} ${params.appearance.hairColor} волосы`
    : 'аккуратные волосы';
  const clothes = params.appearance?.clothingDescription
    ? `${params.appearance.clothingDescription} (${params.appearance.clothingColor || 'любимого цвета'})`
    : 'уютная одежда';

  const bookId = `book_story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  
  // Тематические миры и единый спутник
  const t = theme.toLowerCase();
  let worldName = 'Волшебная поляна';
  let companionName = 'Светлячок Лучик';
  let goalText = 'помочь крошечным лесным колокольчикам найти дорогу ко сну';
  let trialText = 'мягкий вечерний туман спрятал тропинку к полянке с колокольчиками';
  let victoryText = `${declined.nom} ласково зажгла свой волшебный фонарик доброты, а Лучик озарил каждый листик своим тёплым золотым сиянием`;
  let climaxText = 'все сонные колокольчики нежно зазвенели в ответ, благодаря за заботу';

  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('планет')) {
    worldName = 'Звёздная Поляна';
    companionName = 'Светлячок Лучик';
    goalText = 'помочь маленькой звёздочке найти путь к её маме Большой Медведице';
    trialText = 'звёздное облачко мягкой серебристой пыли закрыло мерцающую небесную тропу';
    victoryText = `${declined.nom} ласково улыбнулась и подняла ручки к небу, а Лучик полетел вперёд и указал верный путь`;
    climaxText = 'небосвод озарился тёплым светом радости, и звёздочка счастливо замерцала в объятиях мамы';
  } else if (t.includes('дино') || t.includes('древн') || t.includes('джунгл')) {
    worldName = 'Зелёная Долина';
    companionName = 'Светлячок Лучик';
    goalText = 'найти для маленького динозаврика самую уютную полянку с тёплыми цветами';
    trialText = 'широкий ручеёк преградил путь, и мостик из листьев казался слишком далёким';
    victoryText = `${declined.nom} нашла надёжные гладкие камушки и бережно перевела друзей на другой берег`;
    climaxText = 'долина расцвела изумрудным светом, согревая всех ласковым вечерним теплом';
  }

  const title = `${declined.nom} и тайна: «${theme}»`;

  // Ровно 5 уникальных иллюстраций (1 обложка + 4 сцены)
  const coverUrl = '/illustrations/demo/cover.jpg';
  const scene1Img = '/illustrations/demo/scene_1.jpg';
  const scene2Img = '/illustrations/demo/scene_2.jpg';
  const scene3Img = '/illustrations/demo/scene_3.jpg';
  const scene4Img = '/illustrations/demo/scene_4.jpg';

  const rawScenes = [
    {
      id: 'scene_1',
      scene_index: 1,
      text: `Однажды солнечным утром ${declined.nom} ${vFelt}, что день готовит нечто по-настоящему чудесное. ${heroRef} была ${clothes}, а ${hair} искрились в мягких лучах света.${wishes} Вдруг прямо на тёплую ладошку опустился крошечный ${companionName} с сияющими изумрудными крылышками, приглашая в ${worldName}!`,
      image_url: scene1Img,
      image_prompt: `3D Pixar style scene 1: ${declined.nom} as a cute child smiling at tiny glowing firefly on palm in magical meadow, Pixar render`,
    },
    {
      id: 'scene_2',
      scene_index: 2,
      text: `Сделав смелый шаг, ${declined.nom} ${vStepped} на тропинку, где вокруг оживали ${interest}. ${companionName} тихонько прозвенел: «Здравствуй, ${declined.nom}! Нам очень нужно ${goalText}». Маленькая ${heroWord} с радостью согласилась помочь верному другу.`,
      image_url: scene2Img,
      image_prompt: `3D Pixar style scene 2: ${declined.nom} and ${companionName} walking along friendly fairytale path, magical lighting`,
    },
    {
      id: 'scene_3',
      scene_index: 3,
      text: `Впереди возникло небольшое испытание: ${trialText}. Но ${declined.nom} не растерялась, ${vSmiled} и крепко взяла спутника за руку. ${victoryText}. Вместе друзья дружно справились с препятствием, доказав силу дружбы!`,
      image_url: scene3Img,
      image_prompt: `3D Pixar style scene 3: ${declined.nom} gently holding light lantern with firefly lighting the way through soft mist`,
    },
    {
      id: 'scene_4',
      scene_index: 4,
      text: `И вот тайна открылась: ${climaxText}! Сердце ${declined.gen} наполнилось тихим теплом и радостью. Приключение счастливо завершилось, ${companionName} уютно устроился рядом, напевая нежную колыбельную. Самое время сладко закрыть глазки и уснуть.`,
      image_url: scene4Img,
      image_prompt: `3D Pixar style scene 4: peaceful cozy bedtime finale, starry night sky, child sleeping peacefully, glowing firefly`,
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
          question: `Куда ${declined.nom} и ${companionName} отправились в начале пути?`,
          parent_hint: 'Обсудите с малышом, как приятно и важно помогать тем, кто попал в беду.',
          skill_tag: 'empathy',
        },
        {
          id: 'q_2',
          after_scene: 4,
          question: `Как дружба помогла ${declined.dat} и Лучику справиться с испытанием?`,
          parent_hint: 'Подчеркните важность заботы, доброты и взаимной поддержки перед сном.',
          skill_tag: 'reflection',
        },
      ]
    : [];

  return {
    id: bookId,
    title,
    status: 'ILLUSTRATED',
    format: 'ILLUSTRATED',
    can_upgrade: false,
    cover_url: coverUrl,
    scenes,
    questions,
  };
}

/**
 * Картинки, сгенерированные мостом, лежат в /media/<jobId>/...
 * Прямые CDN-ссылки Wellflow (https://api.wellflow.dev) защищены и отдаются напрямую!
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Прямые CDN-ссылки Wellflow не трогаем — они отдаются напрямую и быстро
  if (url.startsWith('https://api.wellflow.dev') || url.startsWith('http://api.wellflow.dev')) {
    return url;
  }
  const mediaIndex = url.indexOf('/media/');
  if (mediaIndex === -1) return url;
  const base = getActiveApiUrl();
  return base ? `${base}${url.slice(mediaIndex)}` : url;
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

export function getActiveApiUrl(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get('api_url');
    if (paramUrl) {
      const clean = paramUrl.replace(/\/$/, '');
      try {
        localStorage.setItem('ms_api_url', clean);
      } catch {}
      return clean;
    }
    try {
      const cached = localStorage.getItem('ms_api_url');
      if (
        cached &&
        !cached.includes('192a1eaba3c1ee78') &&
        !cached.includes('b4e24b393c4c2c70') &&
        !cached.includes('serveousercontent.com') &&
        !cached.includes('moya-skazka-bridge.loca.lt')
      ) {
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
  maxWaitMs = 120000,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<T> {
  const start = Date.now();
  let consecutiveErrors = 0;
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await fetch(`${activeApi}/api/v1/ai/job-status?id=${encodeURIComponent(jobId)}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
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
        if (data.status === 'ready') {
          return (data.story || data.imageUrl || data) as T;
        }
        if (data.status === 'error') {
          throw new Error(data.error || 'Job failed');
        }
      } else if (res.status === 404) {
        consecutiveErrors++;
        if (consecutiveErrors > 6) {
          throw new Error('Задача генерации не найдена на сервере');
        }
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Job failed') || err.message.includes('Задача генерации не найдена'))) {
        throw err;
      }
      consecutiveErrors++;
      if (consecutiveErrors > 12) {
        throw new Error('Потеряно соединение с сервером генерации сказок');
      }
    }
  }
  throw new Error('Превышено время ожидания генерации сказки (таймаут)');
}

// Промпт и контракт сказки живут в packages/story-engine/src/index.mjs.

/**
 * Генерация одной иллюстрации через серверный мост.
 * Промпт уже содержит 3D Pixar-стиль и character bible от Story Engine.
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
      try {
        const res = await fetch(candidate.url, {
          method: 'POST',
          headers: candidate.headers,
          body: JSON.stringify(candidate.body),
          signal: controller.signal,
        });
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
  timeoutMs = 180000,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<any> {
  const overallStart = Date.now();
  const recentBlacklist = getRecentBooksBlacklist();
  const body = {
    childName: params.childName,
    age: params.age,
    interests: params.interests,
    theme: params.theme,
    appearance: params.appearance,
    personality: params.personality,
    customWishes: params.customWishes,
    includeQuestions: params.includeQuestions,
    gender: params.gender,
    recentBlacklist,
  };

  const activeApi = getActiveApiUrl();
  const candidates: Array<{ url: string; pollBase: string }> = [];

  const addCandidate = (base: string) => {
    const clean = (base || '').replace(/\/$/, '');
    const full = clean ? `${clean}/api/v1/ai/generate-story` : '/api/v1/ai/generate-story';
    if (!candidates.some((c) => c.url === full)) {
      candidates.push({ url: full, pollBase: clean });
    }
  };

  if (activeApi) addCandidate(activeApi);
  if (DEFAULT_API_BRIDGE_URL) addCandidate(DEFAULT_API_BRIDGE_URL);
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    addCandidate('http://localhost:4040');
    addCandidate('http://127.0.0.1:4040');
  }
  addCandidate('');

  let jobId: string | null = null;
  let workingPollBase = '';

  for (const candidate of candidates) {
    const initCtrl = new AbortController();
    const initTimer = setTimeout(() => initCtrl.abort(), 4000);

    try {
      const response = await fetch(candidate.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(body),
        signal: initCtrl.signal,
      });
      clearTimeout(initTimer);

      if (response.ok || response.status === 202) {
        const data = await response.json();
        if (data.jobId) {
          jobId = data.jobId;
          workingPollBase = candidate.pollBase;
          if (candidate.pollBase) {
            try {
              localStorage.setItem('ms_api_url', candidate.pollBase);
            } catch {}
          }
          break;
        } else if (data.scenes && Array.isArray(data.scenes)) {
          console.log('[StoryGenerator] ✅ Сказка получена напрямую:', data.title);
          return data;
        }
      }
    } catch (err: any) {
      clearTimeout(initTimer);
      console.warn(`[StoryGenerator] Не удалось начать генерацию через ${candidate.url}:`, err.message);
    }
  }

  if (jobId) {
    console.log(`[StoryGenerator] ⏳ Ожидание генерации сюжета через мост ${workingPollBase} (jobId: ${jobId})...`);
    const remainingMs = Math.max(30000, timeoutMs - (Date.now() - overallStart));
    const polled = await pollJob<any>(workingPollBase, jobId, remainingMs, onProgress);
    if (polled && polled.scenes) {
      console.log('[StoryGenerator] ✅ Сказка получена через Story Engine:', polled.title);
      return polled;
    }
  }

  throw new Error('Не удалось связаться с сервером генерации сказок ни по одному из адресов');
}

export function getFairytaleFallbackIllustration(themeOrInterest?: string, sceneIndex = 1): string {
  const num = Number(sceneIndex) || 1;
  if (num === 1) return '/illustrations/demo/scene_1.jpg';
  if (num === 2) return '/illustrations/demo/scene_2.jpg';
  if (num === 3) return '/illustrations/demo/scene_3.jpg';
  if (num === 4) return '/illustrations/demo/scene_4.jpg';

  const t = (themeOrInterest || '').toLowerCase();
  if (t.includes('дино')) return '/illustrations/cover_dino.jpg';
  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('сон')) {
    return '/illustrations/cover_star.jpg';
  }
  return '/illustrations/demo/cover.jpg';
}

export interface StoryProgressUpdate {
  stage: 'writing' | 'drawing' | 'finishing';
  progress: number;
  message: string;
  remainingSec?: number;
}

/**
 * Основная функция генерации сказки:
 * 1. Запрашивает серверный Story Engine с таймаутом 180с (мост или тот же origin).
 * 2. Генерирует уникальную сказку на лету под ребёнка через Story DNA Engine.
 * 3. Мост на сервере генерирует параллельно все 4 иллюстрации через Nano Banana 2.
 * 4. Если какие-то иллюстрации не готовы, догенерирует или применяет 3D-фолбек.
 * 5. ДЕРЖИТ ЗАГРУЗКУ и предзагружает ВСЕ 4 страницы в память браузера перед открытием читалки.
 */
export async function generateDynamicStory(
  params: GenerateStoryParams,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<BookDetailsDTO> {
  // Бесплатный тестовый режим без вызовов API и без затрат денег
  if (isMockMode()) {
    console.log('[StoryGenerator] ⚡️ Бесплатный тестовый режим (MOCK_AI): генерация без затрат API для', params.childName);
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

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) {
        onProgress?.({
          stage: 'writing',
          progress: 24,
          message: 'Связываемся со сказочной мастерской нейросетей...',
        });
      }
      storyData = await callWellflowStory(params, 120000, onProgress);
      if (storyData && Array.isArray(storyData.scenes) && storyData.scenes.length >= 4) {
        break;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[StoryGenerator] Попытка ${attempt} завершилась ошибкой:`, err);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  if (!storyData || !Array.isArray(storyData.scenes) || storyData.scenes.length < 4) {
    console.error('[StoryGenerator] ❌ Ошибка генерации сказки через нейросети:', lastError);
    throw new Error(
      lastError?.message ||
        'Не удалось сгенерировать сказку через нейросети. Проверьте соединение с ИИ-мостом и повторите попытку.'
    );
  }

  const isGirl = params.gender === 'girl' || (params.gender !== 'boy' && (params.childName?.endsWith('а') || params.childName?.endsWith('я')));
  const gender = isGirl ? 'girl' : 'boy';
  const child = params.childName?.trim() || 'Малыш';

  const bookId = `book_${Date.now()}`;
  const scenes = storyData.scenes.slice(0, 4).map((s: any, idx: number) => {
    const sceneIndex = idx + 1;
    const prompt = s.image_prompt || s.visual || buildFairytaleImagePrompt(params, `in scene ${sceneIndex}`);
    const cleanedText = fixGenderAgreements(removeAgeFromText(s.text || ''), gender, child);
    return {
      id: `scene_${sceneIndex}`,
      scene_index: sceneIndex,
      text: cleanedText,
      image_url: s.image_url || null, // Сохраняем готовую иллюстрацию с моста!
      image_prompt: prompt,
    };
  });

  const book: BookDetailsDTO = {
    id: bookId,
    title: storyData.title || `${child} и тайна «${params.theme}»`,
    status: 'ILLUSTRATED',
    format: 'ILLUSTRATED',
    can_upgrade: false,
    cover_url: storyData.cover_url || storyData.scenes?.[0]?.image_url || null,
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
            console.log(`[StoryGenerator] ✅ Иллюстрация для сцены ${scene.scene_index} готова:`, url.slice(0, 60));
          }
        } catch (e) {
          console.warn(`[StoryGenerator] ⚠️ Иллюстрация для сцены ${scene.scene_index} задержана:`, e);
        }
        if (!scene.image_url) {
          scene.image_url = getFairytaleFallbackIllustration(params.theme || params.interests?.[0], scene.scene_index);
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

  // Железная гарантия: ни одна сцена не останется с пустым image_url!
  scenes.forEach((s: any, idx: number) => {
    if (!s.image_url) {
      s.image_url = getFairytaleFallbackIllustration(params.theme || params.interests?.[0], idx + 1);
    }
  });

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
  const resolveHairPrompt = (typeRaw?: string): string => {
    const t = String(typeRaw || 'короткие').toLowerCase();
    const isCurly = t.includes('кудр');
    const isStraight = t.includes('прям');
    const isLong = t.includes('длинн');
    const isShort = t.includes('коротк');

    if (isLong && isCurly) return 'long bouncy curly wavy with a cute ribbon';
    if (isLong && isStraight) return 'long smooth straight silky with a cute ribbon';
    if (isShort && isCurly) return 'short playful bouncy curly';
    if (isShort && isStraight) return 'neat short straight';
    if (isCurly) return 'soft bouncy curly wavy';
    if (isStraight) return 'neat smooth straight silky';
    if (isLong) return 'long braided with a cute ribbon';
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

  const hair = `${hairColorMap[params.appearance?.hairColor?.toLowerCase() || 'русые'] || 'soft light-brown'} ${resolveHairPrompt(
    params.appearance?.hairType
  )} hair`;
  const eyes = eyeColorMap[params.appearance?.eyeColor?.toLowerCase() || 'карие'] || 'warm sparkling eyes';
  const skin = skinToneMap[params.appearance?.skinTone?.toLowerCase() || 'персиковая'] || 'warm healthy peach complexion';
  const rawItem = params.appearance?.clothingItem || 'уютный свитер';
  const clothes = `${resolveClothingColorPrompt(params.appearance?.clothingColor, rawItem)} ${resolveClothingItemPrompt(rawItem)}`;
  const companion = resolveToyPrompt(params.appearance?.toy);

  return `A breathtaking 3D Disney Pixar animation style movie still for a children's fairytale book. A cute ${params.age}-year-old ${genderWord} named ${params.childName} with ${hair}, ${eyes}, ${skin}, wearing ${clothes}, accompanied by ${companion}, ${sceneAction}. Cinematic volumetric golden hour lighting, soft glowing particles, fireflies, rich depth of field (85mm f/1.4 lens bokeh), warm cozy bedtime atmosphere, Octane 3D CGI render, masterpiece, no text, no words.`;
}
