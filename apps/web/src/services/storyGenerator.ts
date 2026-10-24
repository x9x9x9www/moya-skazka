import { BookDetailsDTO } from '@moya-skazka/shared';

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
  'https://moya-skazka-bridge.loca.lt';

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
 * Каждая создаваемая сказка уникальна, подстраивается под имя, возраст, тему, интересы и пожелания ребёнка.
 */
export function createMockStory(params: GenerateStoryParams): BookDetailsDTO {
  const child = params.childName || 'Малыш';
  const age = params.age || 4;
  const theme = params.theme || 'Космос и дружба';
  const interest = params.interests?.[0] || 'удивительные открытия';
  const wishes = params.customWishes ? ` В руках у героя был заветный спутник — ${params.customWishes}.` : '';
  const hair = params.appearance?.hairColor
    ? `${params.appearance.hairLength || ''} ${params.appearance.hairStructure || ''} ${params.appearance.hairColor} волосы`
    : 'аккуратные волосы';
  const clothes = params.appearance?.clothingDescription
    ? `${params.appearance.clothingDescription} (${params.appearance.clothingColor || 'любимого цвета'})`
    : 'уютная одежда';

  const bookId = `book_story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  
  // Тематические миры и заголовки
  const t = theme.toLowerCase();
  let worldName = 'Волшебная страна';
  let companionName = 'Светлячок Лучик';
  let trialText = 'дорога через сверкающий лабиринт с загадками';
  let climaxText = 'древний кристалл озарил небо сотнями разноцветных огней';
  let coverImg = './illustrations/cover_forest.jpg';

  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('планет')) {
    worldName = 'Звёздная Галактика';
    companionName = 'Звёздный Лисёнок Спарки';
    trialText = 'пояс мерцающих астероидов, где нужно было найти золотистую тропу';
    climaxText = 'созвездие Доброты вспыхнуло на небесном своде, открыв путь к тайне';
    coverImg = './illustrations/cover_star.jpg';
  } else if (t.includes('мор') || t.includes('океан') || t.includes('подвод') || t.includes('дельфин')) {
    worldName = 'Лазурные Глубины';
    companionName = 'Дельфинёнок Флип';
    trialText = 'подводное течение с танцующими кораллами и лабиринтом жемчужин';
    climaxText = 'гигантская раковина раскрылась и наполнила океан мягким изумрудным сиянием';
    coverImg = './illustrations/cover_forest.jpg';
  } else if (t.includes('дино') || t.includes('древн') || t.includes('джунгл')) {
    worldName = 'Долина Исполинов';
    companionName = 'Маленький Трикки';
    trialText = 'древний подвесной мостик над шепчущим водопадом';
    climaxText = 'цветок папоротника распустился золотым сиянием дружбы';
    coverImg = './illustrations/cover_dino.jpg';
  }

  const title = `${child} и тайна: «${theme}»`;

  const scenes = [
    {
      id: 'scene_1',
      scene_index: 1,
      text: `Однажды солнечным утром ${child} (${age} лет) почувствовал, что день готовит нечто необыкновенное. На герое была ${clothes}, а ${hair} искрились в тёплых лучах света.${wishes} Вдруг прямо на ладонь опустилась волшебная светящаяся пылинка, приглашая за собой в ${worldName}!`,
      image_url: coverImg,
      image_prompt: `3D Pixar style scene 1 of ${child} discovering a magic portal`,
    },
    {
      id: 'scene_2',
      scene_index: 2,
      text: `Сделав смелый шаг, ${child} очутился в удивительном краю, где повсюду оживали ${interest}. Навстречу выбежал ${companionName} с сияющими добрыми глазами. «Здравствуй, ${child}! — радостно воскликнул спутник. — Только твоё чуткое сердце поможет нам разгадать великую тайну!»`,
      image_url: coverImg,
      image_prompt: `3D Pixar style scene 2 with ${child} and ${companionName}`,
    },
    {
      id: 'scene_3',
      scene_index: 3,
      text: `Впереди возникло непростое испытание: перед друзьями раскинулся ${trialText}. ${child} не испугался, улыбнулся и крепко взял друга за руку. Проявив смекалку и взаимовыручку, герои дружно справились с препятствием, доказав, что вместе им по плечу любые чудеса!`,
      image_url: coverImg,
      image_prompt: `3D Pixar style scene 3 showing ${child} overcoming challenge`,
    },
    {
      id: 'scene_4',
      scene_index: 4,
      text: `И вот тайна была разгадана: ${climaxText}! Сердце ${child} наполнилось радостью и гордостью за совершённый подвиг. Это удивительное приключение доказало: самые настоящие чудеса рождаются из смелости, дружбы и доброты!`,
      image_url: coverImg,
      image_prompt: `3D Pixar style scene 4 triumphant finale with ${child}`,
    },
  ];

  const questions = params.includeQuestions
    ? [
        {
          id: 'q_1',
          after_scene: 2,
          question: `Что почувствовал ${child}, когда повстречал верного друга ${companionName}?`,
          parent_hint: 'Обсудите с ребёнком радость знакомства и ценность взаимного доверия.',
          skill_tag: 'empathy',
        },
        {
          id: 'q_2',
          after_scene: 4,
          question: `Какая черта помогла ${child} и ${companionName} справиться с испытанием?`,
          parent_hint: 'Подчеркните важность поддержки, смелости и дружбы.',
          skill_tag: 'emotions',
        },
      ]
    : [];

  return {
    id: bookId,
    title,
    status: 'ILLUSTRATED',
    format: 'ILLUSTRATED',
    can_upgrade: false,
    cover_url: coverImg,
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
      try {
        localStorage.setItem('ms_api_url', paramUrl);
      } catch {}
      return paramUrl.replace(/\/$/, '');
    }
    try {
      const cached = localStorage.getItem('ms_api_url');
      if (
        cached &&
        !cached.includes('192a1eaba3c1ee78') &&
        !cached.includes('b4e24b393c4c2c70') &&
        !cached.includes('serveousercontent.com')
      ) {
        return cached.replace(/\/$/, '');
      }
    } catch {}
  }
  return DEFAULT_API_BRIDGE_URL;
}

/**
 * Опрос фоновой задачи генерации на сервере/мосте
 */
async function pollJob<T>(
  activeApi: string,
  jobId: string,
  maxWaitMs = 180000,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 1200));
    try {
      const res = await fetch(`${activeApi}/api/v1/ai/job-status?id=${encodeURIComponent(jobId)}`, {
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
      });
      if (res.ok) {
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
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Job failed')) throw err;
      // Временные сетевые сбои игнорируем до следующего такта опроса
    }
  }
  throw new Error('Job polling timed out');
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
  addCandidate('https://moya-skazka-bridge.loca.lt');
  addCandidate('');

  let jobId: string | null = null;
  let workingPollBase = '';

  for (const candidate of candidates) {
    const initCtrl = new AbortController();
    const initTimer = setTimeout(() => initCtrl.abort(), 8000);

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

export function getFairytaleFallbackIllustration(themeOrInterest?: string, _sceneIndex = 1): string {
  const t = (themeOrInterest || '').toLowerCase();
  if (t.includes('дино')) return './illustrations/cover_dino.jpg';
  if (t.includes('косм') || t.includes('звезд') || t.includes('звёзд') || t.includes('сон')) {
    return './illustrations/cover_star.jpg';
  }
  return './illustrations/cover_forest.jpg';
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
    progress: 15,
    message: 'Сочиняем уникальный сюжет и character bible...',
  });

  let storyData: any = null;
  let lastError: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      if (attempt > 1) {
        onProgress?.({
          stage: 'writing',
          progress: 25,
          message: 'Связываемся со сказочной мастерской...',
        });
      }
      storyData = await callWellflowStory(params, 180000, onProgress);
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
    console.warn('[StoryGenerator] ⚠️ Сервер генерации недоступен, переключаемся на локальную сказку без сбоя:', lastError?.message);
    return createMockStory(params);
  }

  const bookId = `book_${Date.now()}`;
    const scenes = storyData.scenes.slice(0, 4).map((s: any, idx: number) => {
      const sceneIndex = idx + 1;
      const prompt = s.image_prompt || s.visual || buildFairytaleImagePrompt(params, `in scene ${sceneIndex}`);
      return {
        id: `scene_${sceneIndex}`,
        scene_index: sceneIndex,
        text: s.text,
        image_url: s.image_url || null, // Сохраняем готовую иллюстрацию с моста!
        image_prompt: prompt,
      };
    });

    const book: BookDetailsDTO = {
      id: bookId,
      title: storyData.title || `${params.childName} и тайна «${params.theme}»`,
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
              question: q.question,
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
        progress: 55,
        message: 'Волшебная мастерская раскрашивает акварельные сцены...',
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
          const progressVal = 55 + Math.round((completedCount / scenes.length) * 35);
          onProgress?.({
            stage: 'drawing',
            progress: progressVal,
            message: `Создаём иллюстрации (${completedCount} из ${scenes.length} готовы)...`,
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
      progress: 95,
      message: 'Прогружаем страницы книги и настраиваем читалку...',
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
