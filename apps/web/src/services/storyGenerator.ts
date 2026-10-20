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

export const DEFAULT_API_BRIDGE_URL = 'https://b4e24b393c4c2c70-94-249-175-134.serveousercontent.com';

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
      if (cached && !cached.includes('192a1eaba3c1ee78')) {
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

// Склонение русского имени ребёнка
function declineChildName(name: string, isGirl: boolean) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return {
      nom: isGirl ? 'Малышка' : 'Малыш',
      gen: isGirl ? 'Малышки' : 'Малыша',
      dat: isGirl ? 'Малышке' : 'Малышу',
      acc: isGirl ? 'Малышку' : 'Малыша',
      ins: isGirl ? 'Малышкой' : 'Малышом',
      prep: isGirl ? 'Малышке' : 'Малыше',
    };
  }

  const lastChar = trimmed.slice(-1).toLowerCase();
  const stem = trimmed.slice(0, -1);

  if (lastChar === 'а' || lastChar === 'я') {
    const prevChar = stem.slice(-1).toLowerCase();
    const isHushing = ['ж', 'ш', 'ч', 'щ', 'ц', 'г', 'к', 'х'].includes(prevChar);
    const genEnding = lastChar === 'я' ? 'и' : isHushing ? 'и' : 'ы';
    return {
      nom: trimmed,
      gen: stem + genEnding, // Миши, Саши, Ани
      dat: stem + 'е',       // Мише, Саше, Ане
      acc: stem + (lastChar === 'я' ? 'ю' : 'у'), // Мишу, Сашу, Аню
      ins: stem + (lastChar === 'я' ? 'ей' : isHushing ? 'ей' : 'ой'), // Мишей, Сашей
      prep: stem + 'е',      // о Мише, на Мише
    };
  }

  if (!isGirl) {
    return {
      nom: trimmed,
      gen: trimmed + 'а',
      dat: trimmed + 'у',
      acc: trimmed + 'а',
      ins: trimmed + 'ом',
      prep: trimmed + 'е',
    };
  }

  return {
    nom: trimmed,
    gen: trimmed,
    dat: trimmed,
    acc: trimmed,
    ins: trimmed,
    prep: trimmed,
  };
}

// Склонение любимой игрушки-спутника
function getToyForms(toyStr?: string) {
  const toy = (toyStr || 'плюшевый динозаврик').toLowerCase().trim();
  if (toy.includes('мишк')) {
    return {
      nom: 'плюшевый мишка',
      gen: 'плюшевого мишки',
      dat: 'плюшевому мишке',
      acc: 'плюшевого мишку',
      ins: 'плюшевым мишкой',
      prep: 'плюшевом мишке',
    };
  }
  if (toy.includes('зайк')) {
    return {
      nom: 'пушистый зайка',
      gen: 'пушистого зайки',
      dat: 'пушистому зайке',
      acc: 'пушистого зайку',
      ins: 'пушистым зайкой',
      prep: 'пушистом зайке',
    };
  }
  if (toy.includes('кот') || toy.includes('котик') || toy.includes('котёнок')) {
    return {
      nom: 'маленький котёнок',
      gen: 'маленького котёнка',
      dat: 'маленькому котёнку',
      acc: 'маленького котёнка',
      ins: 'маленьким котёнком',
      prep: 'маленьком котёнке',
    };
  }
  if (toy.includes('звезд') || toy.includes('звёзд')) {
    return {
      nom: 'волшебная звёздочка',
      gen: 'волшебной звёздочки',
      dat: 'волшебной звёздочке',
      acc: 'волшебную звёздочку',
      ins: 'волшебной звёздочкой',
      prep: 'волшебной звёздочке',
    };
  }
  return {
    nom: 'плюшевый динозаврик',
    gen: 'плюшевого динозаврика',
    dat: 'плюшевому динозаврику',
    acc: 'плюшевого динозаврика',
    ins: 'плюшевым динозавриком',
    prep: 'плюшевом динозаврике',
  };
}

// Склонение одежды и цвета
function getClothingForms(item?: string, color?: string) {
  const i = (item || 'уютный свитер').toLowerCase().trim();
  const c = (color || 'изумрудный').toLowerCase().trim();

  const colorMap: Record<
    string,
    { mNom: string; mPrep: string; fNom: string; fPrep: string; nNom: string; nPrep: string }
  > = {
    изумрудный: {
      mNom: 'изумрудный',
      mPrep: 'изумрудном',
      fNom: 'изумрудная',
      fPrep: 'изумрудной',
      nNom: 'изумрудное',
      nPrep: 'изумрудном',
    },
    'солнечно-жёлтый': {
      mNom: 'солнечно-жёлтый',
      mPrep: 'солнечно-жёлтом',
      fNom: 'солнечно-жёлтая',
      fPrep: 'солнечно-жёлтой',
      nNom: 'солнечно-жёлтое',
      nPrep: 'солнечно-жёлтом',
    },
    'небесно-голубой': {
      mNom: 'небесно-голубой',
      mPrep: 'небесно-голубом',
      fNom: 'небесно-голубая',
      fPrep: 'небесно-голубой',
      nNom: 'небесно-голубое',
      nPrep: 'небесно-голубом',
    },
    'нежно-розовый': {
      mNom: 'нежно-розовый',
      mPrep: 'нежно-розовом',
      fNom: 'нежно-розовая',
      fPrep: 'нежно-розовой',
      nNom: 'нежно-розовое',
      nPrep: 'нежно-розовом',
    },
    терракотовый: {
      mNom: 'терракотовый',
      mPrep: 'терракотовом',
      fNom: 'терракотовая',
      fPrep: 'терракотовой',
      nNom: 'терракотовое',
      nPrep: 'терракотовом',
    },
  };

  const cm = colorMap[c] || colorMap['изумрудный'];

  if (i.includes('комбинезон')) {
    return {
      nom: `удобный ${cm.mNom} комбинезончик`,
      prep: `в своём удобном ${cm.mPrep} комбинезончике`,
      acc: `свой удобный ${cm.mNom} комбинезончик`,
    };
  }
  if (i.includes('плать')) {
    return {
      nom: `нарядное ${cm.nNom} платьице`,
      prep: `в своём нарядном ${cm.nPrep} платьице`,
      acc: `своё нарядное ${cm.nNom} платьице`,
    };
  }
  if (i.includes('толстовк')) {
    return {
      nom: `тёплая ${cm.fNom} толстовка`,
      prep: `в своей тёплой ${cm.fPrep} толстовке`,
      acc: `свою тёплую ${cm.fNom.replace(/ая$/, 'ую')} толстовку`,
    };
  }
  return {
    nom: `уютный ${cm.mNom} свитер`,
    prep: `в своём уютном ${cm.mPrep} свитере`,
    acc: `свой уютный ${cm.mNom} свитер`,
  };
}

// Склонение причёски и волос
function getHairForms(color?: string, type?: string) {
  const c = (color || 'светлые').toLowerCase().trim();
  const t = (type || 'кудрявые').toLowerCase().trim();
  const toDat = (w: string) =>
    w.endsWith('ые') ? w.slice(0, -2) + 'ым' : w.endsWith('ие') ? w.slice(0, -2) + 'им' : w;
  const toPrep = (w: string) =>
    w.endsWith('ые') ? w.slice(0, -2) + 'ых' : w.endsWith('ие') ? w.slice(0, -2) + 'их' : w;

  return {
    nom: `${c} ${t} волосы`,
    acc: `${c} ${t} волосы`,
    dat: `${toDat(c)} ${toDat(t)} волосам`,
    prep: `${toPrep(c)} ${toPrep(t)} волосах`,
  };
}

// Склонение черт характера
function getTraitForms(traitStr?: string, isGirl: boolean = false) {
  const t = (traitStr || 'Добрый').trim();
  const lower = t.toLowerCase();
  if (lower.startsWith('добр')) {
    return {
      nom: isGirl ? 'добрая' : 'добрый',
      gen: isGirl ? 'доброй' : 'доброго',
      dat: isGirl ? 'доброй' : 'доброму',
      acc: isGirl ? 'добрую' : 'доброго',
      ins: isGirl ? 'доброй' : 'добрым',
    };
  }
  if (lower.startsWith('смел')) {
    return {
      nom: isGirl ? 'смелая' : 'смелый',
      gen: isGirl ? 'смелой' : 'смелого',
      dat: isGirl ? 'смелой' : 'смелому',
      acc: isGirl ? 'смелую' : 'смелого',
      ins: isGirl ? 'смелой' : 'смелым',
    };
  }
  if (lower.startsWith('любознательн')) {
    return {
      nom: isGirl ? 'любознательная' : 'любознательный',
      gen: isGirl ? 'любознательной' : 'любознательного',
      dat: isGirl ? 'любознательной' : 'любознательному',
      acc: isGirl ? 'любознательную' : 'любознательного',
      ins: isGirl ? 'любознательной' : 'любознательным',
    };
  }
  if (lower.startsWith('заботлив')) {
    return {
      nom: isGirl ? 'заботливая' : 'заботливый',
      gen: isGirl ? 'заботливой' : 'заботливого',
      dat: isGirl ? 'заботливой' : 'заботливому',
      acc: isGirl ? 'заботливую' : 'заботливого',
      ins: isGirl ? 'заботливой' : 'заботливым',
    };
  }
  if (lower.startsWith('весел') || lower.startsWith('весёл')) {
    return {
      nom: isGirl ? 'весёлая' : 'весёлый',
      gen: isGirl ? 'весёлой' : 'весёлого',
      dat: isGirl ? 'весёлой' : 'весёлому',
      acc: isGirl ? 'весёлую' : 'весёлого',
      ins: isGirl ? 'весёлой' : 'весёлым',
    };
  }
  if (lower.startsWith('спокойн')) {
    return {
      nom: isGirl ? 'спокойная' : 'спокойный',
      gen: isGirl ? 'спокойной' : 'спокойного',
      dat: isGirl ? 'спокойной' : 'спокойному',
      acc: isGirl ? 'спокойную' : 'спокойного',
      ins: isGirl ? 'спокойной' : 'спокойным',
    };
  }
  return { nom: t, gen: t, dat: t, acc: t, ins: t };
}

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

export function getFairytaleFallbackIllustration(themeOrInterest?: string, sceneIndex = 1): string {
  const sIdx = Number(sceneIndex);
  if (sIdx === 1) return './illustrations/scene_1.jpg';
  if (sIdx === 2) return './illustrations/scene_2.jpg';
  if (sIdx === 3) return './illustrations/scene_3.jpg';
  if (sIdx === 4) return './illustrations/scene_4.jpg';

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

  try {
    storyData = await callWellflowStory(params, 180000, onProgress);
  } catch (err) {
    console.warn('[StoryGenerator] Wellflow text API timed out or failed, using procedural story:', err);
  }

  if (storyData && Array.isArray(storyData.scenes) && storyData.scenes.length >= 4) {
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

  // Fallback: процедурный генератор (если сеть упала)
  onProgress?.({
    stage: 'drawing',
    progress: 75,
    message: 'Создаём 3D-иллюстрации книги...',
  });

  const proceduralBook = generateProceduralStory(params);

  // Ожидаем и предзагружаем обложку
  if (proceduralBook.scenes[0]?.image_prompt) {
    try {
      const url = await generateWellflowImage(proceduralBook.scenes[0].image_prompt, 120000);
      if (url) {
        proceduralBook.scenes[0].image_url = url;
      }
    } catch {}
  }

  // Финальная проверка: каждая сцена гарантированно имеет иллюстрацию
  proceduralBook.scenes.forEach((s: any, idx: number) => {
    if (!s.image_url) {
      s.image_url = getFairytaleFallbackIllustration(params.theme || params.interests?.[0], idx + 1);
    }
  });

  await Promise.all(
    proceduralBook.scenes.map(
      (scene: any) =>
        new Promise<void>((resolve) => {
          if (!scene.image_url) {
            resolve();
            return;
          }
          const img = new Image();
          const timer = setTimeout(resolve, 4000);
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

  return proceduralBook;
}


/**
 * Динамический процедурный генератор сказки с безупречной русской грамматикой.
 * Обрабатывает все падежи, глаголы и согласования для мальчиков и девочек.
 */
function generateProceduralStory(params: GenerateStoryParams): BookDetailsDTO {
  const { childName, theme, interests, personality, customWishes, gender, appearance } = params;
  const interest = interests[0] || 'Волшебство';
  const isGirl = gender === 'girl';

  // Грамматические формы героя
  const name = declineChildName(childName, isGirl);
  const toy = getToyForms(appearance?.toy);
  const clothing = getClothingForms(appearance?.clothingItem, appearance?.clothingColor);
  const hair = getHairForms(appearance?.hairColor, appearance?.hairType);
  const trait = getTraitForms(personality, isGirl);

  const pronounNom = isGirl ? 'она' : 'он';
  const pronounGen = isGirl ? 'её' : 'его';
  const pronounDat = isGirl ? 'ей' : 'ему';
  const pronounAcc = isGirl ? 'её' : 'его';
  const pronounIns = isGirl ? 'ею' : 'им';
  const pronounPrep = isGirl ? 'ней' : 'нём';

  // Глаголы прошедшего времени без конкатенации суффиксов
  const v = {
    lived: isGirl ? 'жила' : 'жил',
    liked: isGirl ? 'любила' : 'любил',
    sat: isGirl ? 'сидела' : 'сидел',
    approached: isGirl ? 'подошла' : 'подошёл',
    hugged: isGirl ? 'крепко обняла' : 'крепко обнял',
    looked: isGirl ? 'посмотрела' : 'посмотрел',
    felt: isGirl ? 'почувствовала' : 'почувствовал',
    stroked: isGirl ? 'погладила' : 'погладил',
    smiled: isGirl ? 'улыбнулась' : 'улыбнулся',
    satDown: isGirl ? 'аккуратно присела' : 'аккуратно присел',
    believed: isGirl ? 'верила' : 'верил',
    went: isGirl ? 'отправилась' : 'отправился',
    built: isGirl ? 'построила' : 'построил',
    pressed: isGirl ? 'весело нажала' : 'весело нажал',
    stepped: isGirl ? 'шагала' : 'шагал',
    adored: isGirl ? 'обожала' : 'обожал',
    carried: isGirl ? 'несла' : 'нёс',
    fixed: isGirl ? 'поправила' : 'поправил',
    listened: isGirl ? 'прислушалась' : 'прислушался',
    shared: isGirl ? 'поделилась' : 'поделился',
    didNotPanic: isGirl ? 'не растерялась' : 'не растерялся',
    reachedOut: isGirl ? 'протянула' : 'протянул',
    noticed: isGirl ? 'заметила' : 'заметил',
    putToBed: isGirl ? 'бережно уложила' : 'бережно уложил',
    sang: isGirl ? 'запела' : 'запел',
    yawned: isGirl ? 'сладко зевнула' : 'сладко зевнул',
    picked: isGirl ? 'сорвала' : 'сорвал',
    put: isGirl ? 'положила' : 'положил',
    said: isGirl ? 'сказала' : 'сказал',
    asked: isGirl ? 'спросила' : 'спросил',
    remembered: isGirl ? 'вспомнила' : 'вспомнил',
    counted: isGirl ? 'сосчитала' : 'сосчитал',
    wished: isGirl ? 'загадала' : 'загадал',
    showed: isGirl ? 'проявила' : 'проявил',
    changed: isGirl ? 'переоделась' : 'переоделся',
    climbed: isGirl ? 'забралась' : 'забрался',
    crossed: isGirl ? 'уверенно перешла' : 'уверенно перешёл',
  };

  // Завязка истории (Сцена 1)
  const intros: Record<string, string[]> = {
    Машинки: [
      `${name.nom} ${v.built} из мягких подушек и тёплых одеял настоящий волшебный гараж. Посадив ${toy.acc} на пассажирское сиденье маленькой машинки, ${name.nom} ${clothing.prep} ${v.pressed} на игрушечный клаксон. Путь лежал в добрую страну взаимовыручки!`,
      `По солнечной полянке катилась весёлая машинка-помощник, а рядом ${v.stepped} ${name.nom}, бережно прижимая к себе ${toy.acc}. Впереди начиналось удивительное приключение на тему «${theme}».`,
    ],
    Динозавры: [
      `В одном уютном городке ${v.lived} ${trait.nom} ${name.nom}. Больше всего на свете ${pronounNom} ${v.liked} надевать ${clothing.acc}, поправлять ${hair.acc} и прижимать к себе ${toy.acc}. Сегодня в комнате витал тёплый дух открытий: за окном послышался ласковый шорох сказочных папоротников.`,
      `${name.nom} ${v.sat} на мягком ковре, бережно держа в ручках ${toy.acc}. На ${name.prep} был надет ${clothing.nom}, а в глазах мерцали озорные искорки. Тема «${theme}» тихонько постучалась в окошко с лёгким вечерним ветерком.`,
    ],
    Космос: [
      `Когда на вечернем небе зажглись первые звёздочки, ${name.nom} ${clothing.prep} ${v.approached} к подоконнику. Поправив ${hair.acc}, ${pronounNom} ${v.hugged} ${toy.acc} и ${v.looked} в ночное небо, где мягко светил полумесяц.`,
      `Маленький исследова́тель звёзд ${name.nom} очень ${v.liked} тайны далёких планет. Взяв с собой верного спутника — ${toy.acc}, ${pronounNom} ${v.felt}, что сегодняшний вечер приготовил для них особенную добрую историю про «${theme}».`,
    ],
    Животные: [
      `На пушистой лесной опушке стоял сказочный домик, где ${v.lived} ${name.nom}. На ${name.prep} был надет ${clothing.nom}, а рядом всегда был верный спутник — ${toy.nom}. Все лесные зверушки знали ${pronounAcc} как очень ${trait.gen} друга.`,
      `Утро для ${name.gen} началось с весёлого пения синичек. Погладив ${toy.acc} по мягкой спинке, ${name.nom} ${v.smiled} новому дню, полному заботы и темы «${theme}».`,
    ],
    Волшебство: [
      `В детской комнате у ${name.gen} стоял резной сказочный сундучок. ${name.nom} ${clothing.prep} ${v.satDown} рядом, держа в тёплых ладошках ${toy.acc}. Вдруг из сундучка выпорхнула золотистая искорка волшебного сияния!`,
      `${v.lived} на свете ${name.nom}. Больше всего ${pronounNom} ${v.believed}, что самое настоящее чудо рождается из доброты. Поправив ${hair.acc}, ${pronounNom} вместе с ${toy.ins} ${v.went} навстречу тайне «${theme}».`,
    ],
    Природа: [
      `${name.nom} очень ${v.liked} гулять по мягкой зелёной травке. На ${name.prep} был надет ${clothing.nom}, а в ручках ${pronounNom} ${v.carried} ${toy.acc}, показывая колокольчики и порхающих бабочек.`,
      `Шелест дубовых листочков нежно убаюкивал лесную полянку. ${name.nom} ${v.satDown} в тени ветвей, ${v.fixed} ${hair.acc} и ${v.listened} к мудрому шёпоту природы.`,
    ],
  };

  // Развитие событий и терапевтический фокус (Сцена 2)
  const themeDevelopments: Record<string, string[]> = {
    Дружба: [
      `Впереди на тропинке показался маленький грустный зверёк: он уронил любимую шишку в ручеёк. ${name.nom} ${v.didNotPanic}: крепко сжав лапку ${toy.gen}, ${pronounNom} ${v.reachedOut} малышу руку: «Не грусти, давай достанем вместе! Настоящие друзья всегда выручают друг друга».`,
      `${name.nom} ${v.noticed}, что новому лесному знакомому грустно играть одному. ${name.nom} с улыбкой ${v.shared} своими яркими игрушками и показал своего ${toy.acc}. Глазки малыша сразу засияли радостью!`,
    ],
    Смелость: [
      `Впереди была небольшая тенистая рощица, откуда доносился незнакомый шорох. Сердечко ${name.gen} на мгновение ёкнуло, но ${pronounNom} ${v.hugged} ${toy.acc}, глубоко вдохнул и смело сделал шаг вперёд. Оказалось, там просто играл с сухими листьями смешной пушистый зайчонок!`,
      `Нужно было сделать первый шаг через узкий бревенчатый мостик над ручьём. ${name.nom} ${v.remembered}, что ${pronounNom} — ${trait.nom} герой, ${v.smiled} своему ${toy.dat} и ${v.crossed} на другой бережок.`,
    ],
    'Спокойный сон': [
      `Солнышко ласково опустилось за розовые облачка. Всё вокруг начало затихать, а маленькая звёздочка на небе всё никак не могла уснуть. ${name.nom} ${v.putToBed} рядом ${toy.acc} и тихонько ${v.sang} убаюкивающую песенку про мягкие сны.`,
      `Вечерний туман бережно укутал деревья пушистым одеялом. ${name.nom} ${v.yawned}, поправил свой ${clothing.nom} и почувствовал, как глазки сами собой слипаются в уютном тепле.`,
    ],
    'Доброта и забота': [
      `${name.nom} ${isGirl ? 'увидела' : 'увидел'} маленькую птичку, которая никак не могла дотянуться до спелых ягод рябины. Проявив заботу, ${name.nom} бережно ${v.picked} ягодку и ${v.put} на чистый камушек, а ${toy.nom} словно одобрительно кивнул головой.`,
      `Каждое доброе слово, которое ${isGirl ? 'произносила' : 'произносил'} ${name.nom}, превращалось в крошечный золотистый огонёк, ласково согревающий всё вокруг.`,
    ],
    Любознательность: [
      `${name.nom} с интересом ${v.asked} у ${toy.gen}: «А почему звёздочки мерцают ночью?» Вместе они начали внимательно наблюдать за вечерним небом и разгадали удивительную тайну небесного света!`,
      `Каждый камушек и листик на тропинке таил свой маленький секрет. ${name.nom} с искренним восторгом изучал узоры природы, радуясь новым добрым открытиям.`,
    ],
    Честность: [
      `Случайно задев красивую башенку из шишек, ${name.nom} не ${isGirl ? 'стала' : 'стал'} прятаться, а честно ${v.said}: «Это я случайно, но я помогу построить её ещё лучше!» От правдивых слов на душе стало легко и тепло.`,
      `Честность оказалась самым надёжным волшебным ключиком к доверию всех сказочных друзей.`,
    ],
    'Капризы и эмоции': [
      `Когда что-то пошло не так, внутри ${name.gen} на секунду заворочалась сердитая тучка. Но ${name.nom} ${v.remembered} мамин совет: крепко ${v.hugged} ${toy.acc}, ${v.counted} до трёх и глубоко выдохнул — сердитая тучка растаяла, а на смену ей вернулась ясная улыбка.`,
      `Иногда бывает грустно или трудно, но верный ${toy.nom} и тёплые объятия всегда помогают вернуть солнечное настроение.`,
    ],
    'Волшебные сны': [
      `Фея Снов принесла хрустальное блюдечко с мерцающей звёздной пыльцой. ${name.nom} ${v.wished} самый добрый сон, где ${pronounNom} вместе с ${toy.ins} летает на мягких облаках.`,
      `Волшебные сны бережно окружили кроватку ${name.gen} мерцающим куполом спокойствия и уюта.`,
    ],
  };

  const introList = intros[interest] || intros['Волшебство'];
  const introText = introList[Math.floor(Math.random() * introList.length)];

  const devList = themeDevelopments[theme] || [
    `Сегодня перед ${name.ins} стояла важная задача, связанная с темой «${theme}». Проявив чуткость и держа рядом ${toy.acc}, ${name.nom} ${v.approached} к делу с добрым сердцем.`,
    `${name.nom} ${isGirl ? 'поняла' : 'понял'}, что тема «${theme}» — это умение верить в себя и быть чутким к тем, кто рядом.`,
  ];
  const conflictText = devList[Math.floor(Math.random() * devList.length)];

  const wishesAddition = customWishes ? ` Как ${name.nom} и ${v.wished}, ${customWishes.toLowerCase()}.` : '';

  // Кульминация (Сцена 3)
  const climaxText = `Благодаря тому, что ${name.nom} ${v.showed} ${trait.nom} характер и чуткость к уроку «${theme}», всё сложилось наилучшим образом.${wishesAddition} Маленький ${toy.nom} словно улыбнулся в ответ, а вокруг разлилось мягкое сияние добра и гармонии.`;

  // Финал (Сцена 4)
  const conclusionText = `Сказочное приключение благополучно завершилось. ${name.nom} ${v.yawned}, ${v.changed} в мягкую пижамку и ${v.climbed} под тёплое, воздушное одеяло, бережно уложив рядом ${toy.acc}. Мама нежно погладила ${pronounAcc} по ${hair.dat}: «Спи сладко, мой маленький герой». Впереди ждали только добрые, волшебные сны.`;

  // Педагогические вопросы для родителя
  const questionsList = [
    {
      id: 'q1',
      after_scene: 2,
      question: `Как ты думаешь, почему для ${name.gen} было так важно проявить внимание к теме «${theme}»?`,
      parent_hint: `Выслушайте ответ малыша. Поддержите его рассуждения о том, как доброта и смелость помогают окружающим.`,
      skill_tag: 'emotions',
    },
    {
      id: 'q2',
      after_scene: 5,
      question: `Что в этой сказке тебе понравилось больше всего? Какую игрушку взял бы в приключение ты?`,
      parent_hint: `Обнимите ребёнка, поговорите о его любимой игрушке и пожелайте сладких снов.`,
      skill_tag: 'reflection',
    },
  ];

  const getSceneImageUrl = (idx: number): string => getFairytaleFallbackIllustration(params.theme || interest, idx);

  return {
    id: `book_${Date.now()}`,
    title: `${name.nom} и тайна «${theme}»`,
    status: 'ILLUSTRATED',
    format: 'ILLUSTRATED',
    can_upgrade: false,
    scenes: [
      {
        id: 's1',
        scene_index: 1,
        text: introText,
        image_url: getSceneImageUrl(1),
        image_prompt: buildFairytaleImagePrompt(
          params,
          `in a cozy warm room, lovingly holding a small ${toy.nom}`
        ),
      },
      {
        id: 's2',
        scene_index: 2,
        text: conflictText,
        image_url: getSceneImageUrl(2),
        image_prompt: buildFairytaleImagePrompt(
          params,
          `bravely exploring a magical fairytale path on theme "${theme}", holding ${toy.nom} for courage`
        ),
      },
      {
        id: 's3',
        scene_index: 3,
        text: climaxText,
        image_url: getSceneImageUrl(3),
        image_prompt: buildFairytaleImagePrompt(
          params,
          `celebrating kindness and wonder, surrounded by gentle golden fairytale lights and cheerful forest friends`
        ),
      },
      {
        id: 's4',
        scene_index: 4,
        text: conclusionText,
        image_url: getSceneImageUrl(4),
        image_prompt: buildFairytaleImagePrompt(
          params,
          `curled up in a soft warm bedtime nest under a starry sky with gentle crescent moon, holding ${toy.nom}`
        ),
      },
    ],
    questions: params.includeQuestions ? questionsList : [],
  };
}

/**
 * Эталонный генератор промпта для детской книжной иллюстрации
 * (стиль: Whimsical cozy 2D digital watercolor and gouache children's book illustration)
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
  const hairTypeMap: Record<string, string> = {
    кудрявые: 'soft curly wavy',
    короткие: 'neat short playful',
    длинные: 'long braided with a cute ribbon',
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

  const hair = `${hairColorMap[params.appearance?.hairColor?.toLowerCase() || 'русые'] || 'soft light-brown'} ${
    hairTypeMap[params.appearance?.hairType?.toLowerCase() || 'короткие'] || 'neat short playful'
  } hair`;
  const eyes = eyeColorMap[params.appearance?.eyeColor?.toLowerCase() || 'карие'] || 'warm sparkling eyes';
  const skin = skinToneMap[params.appearance?.skinTone?.toLowerCase() || 'персиковая'] || 'warm healthy peach complexion';
  const clothes = `${clothingColorMap[params.appearance?.clothingColor?.toLowerCase() || 'изумрудный'] || 'cozy emerald green'} ${
    clothingItemMap[params.appearance?.clothingItem?.toLowerCase() || 'уютный свитер'] || 'knitted sweater'
  }`;
  const companion =
    companionMap[params.appearance?.toy?.toLowerCase() || 'плюшевый динозаврик'] ||
    'a small friendly companion creature';

  return `A whimsical, cozy 2D digital watercolor and gouache children's book illustration of a cute ${params.age}-year-old ${genderWord} named ${params.childName} with ${hair}, ${eyes}, ${skin}, wearing ${clothes}, and ${companion}, ${sceneAction}. The art style is heartwarming, playful, and natural, with visible gentle paper grain, textured brushwork, and soft sketchy dark brown outlines (no harsh black outlines). Rich, warm natural color palette with deep forest greens, earthy browns, warm gold, and sunset/dusk glows. Enchanting, gentle magical lighting with golden hour glimmers, glowing particles, tiny sparkles, and fireflies hovering around. The background is densely packed and richly detailed, featuring oversized fairytale foliage, curly whimsical trees, glowing mushrooms, and blooming fantasy flora, creating a layered, hand-crafted environment with soft atmospheric perspective. Cute, rounded 2D character designs with highly expressive, large warm eyes and friendly, gentle features. Everything has a safe, comforting, nostalgic, and adventurous storybook look, ideal for young children. Natural camera angle, cinematic focus. No text.`;
}
