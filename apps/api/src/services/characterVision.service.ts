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
}
