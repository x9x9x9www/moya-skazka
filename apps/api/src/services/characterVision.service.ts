import { config } from '../config/index';

export interface AnalyzeCharacterPhotoInput {
  imageBase64: string;
  mimeType?: string;
}

export interface CharacterVisionResult {
  gender?: 'boy' | 'girl';
  approxAge?: number;
  hairColor?: 'светлые' | 'русые' | 'тёмные' | 'рыжие';
  hairType?: 'кудрявые' | 'короткие' | 'длинные' | 'прямые';
  eyeColor?: 'карие' | 'голубые' | 'зелёные' | 'серые';
  skinTone?: 'светлая' | 'персиковая' | 'смуглая';
  distinctiveFeatures?: string;
  error?: 'FACE_NOT_DETECTED' | string;
  message?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_BASE64_LENGTH = 7 * 1024 * 1024; // ~5MB бинарных данных

function normalizeHairColor(raw?: string): 'светлые' | 'русые' | 'тёмные' | 'рыжие' {
  const val = String(raw || '').toLowerCase().trim();
  if (val.includes('рыж')) return 'рыжие';
  if (val.includes('светл') || val.includes('блонд') || val.includes('бел')) return 'светлые';
  if (val.includes('темн') || val.includes('тёмн') || val.includes('черн') || val.includes('чёрн') || val.includes('каштан') || val.includes('брюнет')) return 'тёмные';
  return 'русые';
}

function normalizeHairType(raw?: string): 'кудрявые' | 'короткие' | 'длинные' | 'прямые' {
  const val = String(raw || '').toLowerCase().trim();
  if (val.includes('кудр') || val.includes('волн') || val.includes('завит')) return 'кудрявые';
  if (val.includes('длин') || val.includes('кос') || val.includes('хвост')) return 'длинные';
  if (val.includes('прям')) return 'прямые';
  return 'короткие';
}

function normalizeEyeColor(raw?: string): 'карие' | 'голубые' | 'зелёные' | 'серые' {
  const val = String(raw || '').toLowerCase().trim();
  if (val.includes('кар') || val.includes('черн') || val.includes('чёрн') || val.includes('коричн')) return 'карие';
  if (val.includes('голуб') || val.includes('син')) return 'голубые';
  if (val.includes('зелен') || val.includes('зелён')) return 'зелёные';
  return 'серые';
}

function normalizeSkinTone(raw?: string): 'светлая' | 'персиковая' | 'смуглая' {
  const val = String(raw || '').toLowerCase().trim();
  if (val.includes('смугл') || val.includes('загор')) return 'смуглая';
  if (val.includes('персик') || val.includes('тепл') || val.includes('тёпл') || val.includes('беж')) return 'персиковая';
  return 'светлая';
}

function normalizeGender(raw?: string): 'boy' | 'girl' {
  const val = String(raw || '').toLowerCase().trim();
  if (val === 'girl' || val.includes('девочк') || val.includes('жен') || val.includes('дочь')) return 'girl';
  return 'boy';
}

function normalizeAge(raw?: any): number {
  const parsed = parseInt(String(raw || ''), 10);
  if (isNaN(parsed) || parsed < 1) return 4;
  if (parsed > 12) return 12;
  return parsed;
}

export class CharacterVisionService {
  /**
   * Анализ фото ребенка с нулевым сохранением на диск / БД (Zero-Storage Vision).
   * Изображение передается исключительно в оперативную память и после ответа сразу освобождается.
   */
  public async analyzePhoto(input: AnalyzeCharacterPhotoInput): Promise<CharacterVisionResult> {
    let rawBase64 = input.imageBase64 || '';
    let detectedMime = input.mimeType || 'image/jpeg';

    if (!rawBase64) {
      throw new Error('Изображение не предоставлено');
    }

    // Если передан data URI (data:image/jpeg;base64,...)
    if (rawBase64.startsWith('data:')) {
      const match = rawBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1].toLowerCase();
        rawBase64 = match[2];
      } else {
        const commaIdx = rawBase64.indexOf(',');
        if (commaIdx !== -1) {
          rawBase64 = rawBase64.slice(commaIdx + 1);
        }
      }
    }

    // Проверка MIME типа
    if (detectedMime === 'image/jpg') detectedMime = 'image/jpeg';
    if (!ALLOWED_MIME_TYPES.has(detectedMime)) {
      throw new Error(`Недопустимый формат файла (${detectedMime}). Поддерживаются JPEG, PNG, WEBP.`);
    }

    // Проверка размера
    if (rawBase64.length > MAX_BASE64_LENGTH) {
      throw new Error('Размер фотографии превышает допустимый лимит (5 МБ).');
    }

    const isTestEnv = process.env.NODE_ENV === 'test' && process.env.RUN_LIVE_AI_TESTS !== 'true';
    const wellflowKey = config.WELLFLOW_TEXT_KEY || process.env.WELLFLOW_TEXT_KEY;

    // Безопасный фоллбэк для тестов и локальной разработки без ключа
    if (isTestEnv || !wellflowKey) {
      console.warn('[CharacterVisionService] Режим тестирования / ключ отсутствует, возвращаем тестовый результат.');
      return {
        gender: 'boy',
        approxAge: 4,
        hairColor: 'русые',
        hairType: 'короткие',
        eyeColor: 'карие',
        skinTone: 'персиковая',
        distinctiveFeatures: 'милая открытая улыбка',
      };
    }

    try {
      const visionPrompt = `Ты — детский иллюстратор. Проанализируй фото ребенка и выдели базовые внешние черты для создания сказочного мультяшного персонажа в стиле доброй книжной иллюстрации.
Верни строго JSON со следующими полями:
{
  "gender": "boy" | "girl",
  "approxAge": number (от 1 до 12),
  "hairColor": "светлые" | "русые" | "тёмные" | "рыжие",
  "hairType": "кудрявые" | "короткие" | "длинные" | "прямые",
  "eyeColor": "карие" | "голубые" | "зелёные" | "серые",
  "skinTone": "светлая" | "персиковая" | "смуглая",
  "distinctiveFeatures": string (например: "милые круглые очки", "веснушки на щёчках", "задорные хвостики" или "")
}
Если на фото нет человека или лицо не видно, верни { "error": "FACE_NOT_DETECTED" }.`;

      const dataUrl = `data:${detectedMime};base64,${rawBase64}`;
      rawBase64 = ''; // Zero-Storage: очистка ссылки из памяти

      const res = await fetch(`${config.WELLFLOW_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${wellflowKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.WELLFLOW_TEXT_MODEL || 'gpt-6-luna',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt },
                { type: 'image_url', image_url: { url: dataUrl } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Wellflow Vision HTTP ${res.status}: ${errorText}`);
      }

      const json = (await res.json()) as any;
      const text = json.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(text);

      if (parsed.error === 'FACE_NOT_DETECTED') {
        return {
          error: 'FACE_NOT_DETECTED',
          message: 'Не удалось чётко разглядеть личико. Попробуйте другое фото или просто выберите параметры вручную ниже.',
        };
      }

      return {
        gender: normalizeGender(parsed.gender),
        approxAge: normalizeAge(parsed.approxAge),
        hairColor: normalizeHairColor(parsed.hairColor),
        hairType: normalizeHairType(parsed.hairType),
        eyeColor: normalizeEyeColor(parsed.eyeColor),
        skinTone: normalizeSkinTone(parsed.skinTone),
        distinctiveFeatures: String(parsed.distinctiveFeatures || '').trim(),
      };
    } catch (err: any) {
      rawBase64 = ''; // Zero-Storage
      console.warn('[CharacterVisionService] Ошибка Vision анализа Wellflow:', err?.message || err);

      if (err?.message?.includes('FACE_NOT_DETECTED')) {
        return {
          error: 'FACE_NOT_DETECTED',
          message: 'Не удалось чётко разглядеть личико. Попробуйте другое фото или выберите параметры вручную.',
        };
      }

      throw new Error('Не удалось проанализировать фото через Vision API. Попробуйте ещё раз или укажите параметры вручную.');
    }
  }

  /**
   * Мгновенная генерация 3D-аватарки по фото ребенка + блокировка черт + сказочный наряд.
   * Шаг А (Vision): извлечение черт лица
   * Шаг Б: буфер фото немедленно обнуляется (Zero-Storage)
   * Шаг В: генерация 3D Pixar портрета крупным планом (Nano-Banana-2)
   */
  public async generateAvatar(input: GenerateCharacterAvatarInput): Promise<GenerateCharacterAvatarResult> {
    const rawPhoto = input.imageBase64;
    const traitsResult = await this.analyzePhoto({
      imageBase64: rawPhoto,
      mimeType: input.mimeType,
    });
    // Шаг Б: обнуляем буфер
    input.imageBase64 = '';

    const traits = {
      gender: traitsResult.gender || 'boy',
      approxAge: traitsResult.approxAge || 4,
      hairColor: traitsResult.hairColor || 'русые',
      hairType: traitsResult.hairType || 'короткие',
      eyeColor: traitsResult.eyeColor || 'карие',
      skinTone: traitsResult.skinTone || 'персиковая',
      distinctiveFeatures: traitsResult.distinctiveFeatures || '',
    };

    const avatarId = resolveChildAvatarKey(traits);

    // Шаг В: формирование промпта
    const genderEn = traits.gender === 'girl' ? 'girl' : 'boy';
    const approxAge = traits.approxAge;
    const hairColorEn = {
      светлые: 'blonde',
      русые: 'light brown',
      тёмные: 'dark brown',
      рыжие: 'ginger red',
    }[traits.hairColor] || 'light brown';

    const hairTypeEn = {
      кудрявые: 'curly',
      короткие: 'short neat',
      длинные: 'long wavy',
      прямые: 'straight',
    }[traits.hairType] || 'curly';

    const eyeColorEn = {
      карие: 'warm hazel brown',
      голубые: 'bright expressive blue',
      зелёные: 'vibrant emerald green',
      серые: 'gentle grey',
    }[traits.eyeColor] || 'bright expressive blue';

    const skinToneEn = {
      светлая: 'fair',
      персиковая: 'warm peach',
      смуглая: 'golden tan',
    }[traits.skinTone] || 'fair';

    let distinctiveEn = '';
    if (traits.distinctiveFeatures) {
      const feat = traits.distinctiveFeatures.toLowerCase();
      if (feat.includes('очк')) distinctiveEn = 'cute round glasses';
      else if (feat.includes('веснуш')) distinctiveEn = 'cute freckles on cheeks';
      else distinctiveEn = traits.distinctiveFeatures;
    }

    let outfitEn = 'cozy fairytale outfit';
    if (input.outfit) {
      const o = String(input.outfit).toLowerCase();
      if (o.includes('супергер')) outfitEn = 'superhero costume with cape';
      else if (o.includes('космонавт') || o.includes('скафандр')) outfitEn = 'white astronaut space suit';
      else if (o.includes('динозавр') || o.includes('кигуруми')) outfitEn = 'cozy dinosaur kigurumi onesie';
      else if (o.includes('маг') || o.includes('манти')) outfitEn = 'little starry wizard robe';
      else if (o.includes('плать')) outfitEn = 'festive fairytale ball gown';
      else if (o.includes('дождевик')) outfitEn = 'yellow raincoat and boots';
      else if (o.includes('пижам')) outfitEn = 'soft pajamas with stars';
      else outfitEn = input.outfit;
    }

    const avatarPrompt = `Close-up 3D animated Pixar-style character avatar portrait of a cute ${approxAge}-year-old ${genderEn}, ${hairColorEn} ${hairTypeEn} hair, bright expressive ${eyeColorEn} eyes, ${skinToneEn} skin${distinctiveEn ? ', ' + distinctiveEn : ''}, wearing ${outfitEn || 'cozy fairytale outfit'}, warm gentle smile looking at camera, soft cinematic studio lighting, magical blurry background with warm bokeh, square 1:1, ultra-detailed, 8k, no text, no watermark.`;

    const isTestEnv = process.env.NODE_ENV === 'test' && process.env.RUN_LIVE_AI_TESTS !== 'true';
    const imageKey = config.WELLFLOW_IMAGE_KEY || process.env.WELLFLOW_IMAGE_KEY;

    if (isTestEnv || !imageKey) {
      return {
        status: 'ok',
        avatarUrl: `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarId}.webp`,
        avatar_id: avatarId,
        traits,
      };
    }

    try {
      const res = await fetch(`${config.WELLFLOW_API_URL}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${imageKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.WELLFLOW_IMAGE_MODEL || 'nano-banana-2',
          prompt: avatarPrompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!res.ok) {
        throw new Error(`Wellflow Image HTTP ${res.status}`);
      }

      const json = (await res.json()) as any;
      const avatarUrl = json.imageUrl || json.data?.[0]?.url;
      if (!avatarUrl) {
        throw new Error('No image URL in response');
      }

      return {
        status: 'ok',
        avatarUrl,
        avatar_id: avatarId,
        traits,
      };
    } catch (err: any) {
      console.warn('[CharacterVisionService] Ошибка генерации аватара через Wellflow, возврат пресета:', err?.message || err);
      return {
        status: 'ok',
        avatarUrl: `https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/${avatarId}.webp`,
        avatar_id: avatarId,
        traits,
      };
    }
  }
}

export interface GenerateCharacterAvatarInput {
  imageBase64: string;
  mimeType?: string;
  outfit?: string;
}

export interface GenerateCharacterAvatarResult {
  status: 'ok';
  avatarUrl: string;
  avatar_id: string;
  traits: {
    gender: 'boy' | 'girl';
    approxAge: number;
    hairColor: 'светлые' | 'русые' | 'тёмные' | 'рыжие';
    hairType: 'кудрявые' | 'короткие' | 'длинные' | 'прямые';
    eyeColor: 'карие' | 'голубые' | 'зелёные' | 'серые';
    skinTone: 'светлая' | 'персиковая' | 'смуглая';
    distinctiveFeatures: string;
  };
}

export function resolveChildAvatarKey(params: {
  gender?: string;
  hairColor?: string;
  skinTone?: string;
  distinctiveFeatures?: string;
  avatar_id?: string;
}): string {
  const gender = params.gender === 'girl' ? 'girl' : 'boy';
  const hair = (params.hairColor || '').toLowerCase();
  const skin = (params.skinTone || '').toLowerCase();
  const features = (params.distinctiveFeatures || '').toLowerCase();
  const avatarId = (params.avatar_id || '').toLowerCase();

  if (features.includes('очк') || avatarId.includes('glasses')) {
    return `${gender}_glasses`;
  }
  if (skin.includes('смугл') || avatarId.includes('tan')) {
    return `${gender}_tan`;
  }
  if (hair.includes('светл') || hair.includes('блонд')) {
    return `${gender}_blonde`;
  }
  if (hair.includes('рыж')) {
    return `${gender}_ginger`;
  }
  if (hair.includes('тёмн') || hair.includes('темн') || hair.includes('черн') || hair.includes('брюнет')) {
    return `${gender}_dark`;
  }
  return `${gender}_brown`;
}
