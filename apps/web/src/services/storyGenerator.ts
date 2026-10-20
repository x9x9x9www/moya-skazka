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
    clothingItem?: string;
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

/**
 * Картинки, сгенерированные мостом, лежат в /media/<jobId>/...
 * Если туннель перезапустился, абсолютный origin устарел — подменяем его
 * на текущий API-адрес, а путь /media/... сохраняем.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
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
  maxWaitMs = 60000,
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
  timeoutMs = 60000,
  onProgress?: (update: StoryProgressUpdate) => void
): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const recentBlacklist = getRecentBooksBlacklist();
  // AI-ключи живут только на сервере. Клиент умеет обращаться к мосту
  // (bot.mjs) или к тому же origin, если web и API развёрнуты вместе.
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
  const endpoints: Array<{
    url: string;
    headers: Record<string, string>;
    body: any;
    pollBase: string;
  }> = [];

  if (activeApi) {
    endpoints.push({
      url: `${activeApi}/api/v1/ai/generate-story`,
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
      },
      body,
      pollBase: activeApi,
    });
  }

  endpoints.push({
    url: '/api/v1/ai/generate-story',
    headers: { 'Content-Type': 'application/json' },
    body,
    pollBase: '',
  });

  try {
    for (const ep of endpoints) {
      try {
        const response = await fetch(ep.url, {
          method: 'POST',
          headers: ep.headers as HeadersInit,
          body: JSON.stringify(ep.body),
          signal: controller.signal,
        });

        if (response.ok || response.status === 202) {
          const data = await response.json();
          if (data.jobId) {
            console.log(`[StoryGenerator] ⏳ Ожидание генерации сюжета через мост (jobId: ${data.jobId})...`);
            const polled = await pollJob<any>(ep.pollBase, data.jobId, timeoutMs, onProgress);
            if (polled && polled.scenes) {
              clearTimeout(timer);
              console.log('[StoryGenerator] ✅ Сказка получена через Story Engine:', polled.title);
              return polled;
            }
          }
          if (data.scenes && Array.isArray(data.scenes)) {
            clearTimeout(timer);
            console.log('[StoryGenerator] ✅ Сказка получена через серверный endpoint:', data.title);
            return data;
          }
          const rawText = data.choices?.[0]?.message?.content;
          if (rawText) {
            const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            clearTimeout(timer);
            console.log('[StoryGenerator] ✅ Сказка распарсена из ответа модели:', parsed.title);
            return parsed;
          }
        }
      } catch {
        // try next endpoint
      }
    }
  } finally {
    clearTimeout(timer);
  }

  throw new Error('Story generation endpoints unreachable or timed out');
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
          message: 'Повторное подключение к ИИ-мосту...',
        });
      }
      storyData = await callWellflowStory(params, 90000, onProgress);
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
    throw new Error(
      lastError?.message ||
      'Не удалось связаться с сервером генерации сказок. Пожалуйста, проверьте интернет-соединение или повторите попытку.'
    );
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
        message: 'Создаём 3D Pixar-иллюстрации в Nano-Banana-2...',
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
            const timer = setTimeout(resolve, 5000);
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

  const hair = `${hairColorMap[params.appearance?.hairColor?.toLowerCase() || 'русые'] || 'soft light-brown'} ${resolveHairPrompt(
    params.appearance?.hairType
  )} hair`;
  const eyes = eyeColorMap[params.appearance?.eyeColor?.toLowerCase() || 'карие'] || 'warm sparkling eyes';
  const skin = skinToneMap[params.appearance?.skinTone?.toLowerCase() || 'персиковая'] || 'warm healthy peach complexion';
  const clothes = `${clothingColorMap[params.appearance?.clothingColor?.toLowerCase() || 'изумрудный'] || 'cozy emerald green'} ${
    clothingItemMap[params.appearance?.clothingItem?.toLowerCase() || 'уютный свитер'] || 'knitted sweater'
  }`;
  const companion =
    companionMap[params.appearance?.toy?.toLowerCase() || 'плюшевый динозаврик'] ||
    'a small friendly companion creature';

  return `A breathtaking 3D Disney Pixar animation style movie still for a children's fairytale book. A cute ${params.age}-year-old ${genderWord} named ${params.childName} with ${hair}, ${eyes}, ${skin}, wearing ${clothes}, accompanied by ${companion}, ${sceneAction}. Cinematic volumetric golden hour lighting, soft glowing particles, fireflies, rich depth of field (85mm f/1.4 lens bokeh), warm cozy bedtime atmosphere, Octane 3D CGI render, masterpiece, no text, no words.`;
}
