import { describe, it, expect, vi } from 'vitest';
import { CharacterVisionService } from '../src/services/characterVision.service';
import { app } from '../src/server';

describe('CharacterVisionService (Zero-Storage Vision)', () => {
  const service = new CharacterVisionService();

  it('выбрасывает ошибку, если изображение не передано', async () => {
    await expect(
      service.analyzePhoto({ imageBase64: '' })
    ).rejects.toThrow('Изображение не предоставлено');
  });

  it('выбрасывает ошибку при недопустимом MIME-типе', async () => {
    await expect(
      service.analyzePhoto({
        imageBase64: 'SGVsbG8gV29ybGQ=',
        mimeType: 'application/pdf',
      })
    ).rejects.toThrow('Недопустимый формат файла');
  });

  it('выбрасывает ошибку при превышении лимита 5 МБ', async () => {
    // 8 МБ base64 строка
    const hugeBase64 = 'A'.repeat(8 * 1024 * 1024);
    await expect(
      service.analyzePhoto({
        imageBase64: hugeBase64,
        mimeType: 'image/jpeg',
      })
    ).rejects.toThrow('Размер фотографии превышает допустимый лимит');
  });

  it('корректно обрабатывает data URI с префиксом и возвращает валидный профиль персонажа', async () => {
    const validDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await service.analyzePhoto({
      imageBase64: validDataUri,
    });

    expect(result).toBeDefined();
    // В dev/test режиме возвращается безопасный результат без вызова внешнего биллинга
    expect(['boy', 'girl']).toContain(result.gender);
    expect(result.approxAge).toBeGreaterThanOrEqual(1);
    expect(result.approxAge).toBeLessThanOrEqual(12);
    expect(['светлые', 'русые', 'тёмные', 'рыжие']).toContain(result.hairColor);
    expect(['кудрявые', 'короткие', 'длинные', 'прямые']).toContain(result.hairType);
    expect(['карие', 'голубые', 'зелёные', 'серые']).toContain(result.eyeColor);
    expect(['светлая', 'персиковая', 'смуглая']).toContain(result.skinTone);
  });

  it('сохраняет явно выбранные пол и возраст, а без пола выводит его из имени', async () => {
    const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==';
    const inferred = await service.analyzePhoto({ imageBase64, knownName: 'Алиса', knownAge: 7 });
    const explicit = await service.analyzePhoto({ imageBase64, knownGender: 'boy', knownName: 'Алиса', knownAge: 6 });

    expect(inferred).toMatchObject({ gender: 'girl', approxAge: 7, traitsAnalyzed: true });
    expect(explicit).toMatchObject({ gender: 'boy', approxAge: 6, traitsAnalyzed: true });
  });

  it('не помечает неполный ответ Vision как распознанные черты', async () => {
    const savedEnv = {
      runLive: process.env.RUN_LIVE_AI_TESTS,
      textKey: process.env.WELLFLOW_TEXT_KEY,
    };
    process.env.RUN_LIVE_AI_TESTS = 'true';
    process.env.WELLFLOW_TEXT_KEY = 'test-text-key';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: JSON.stringify({ gender: 'girl', approxAge: 5 }) } }] }),
      text: async () => '',
    } as Response);

    try {
      const result = await service.analyzePhoto({
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==',
      });
      expect(result.traitsAnalyzed).toBe(false);
    } finally {
      fetchSpy.mockRestore();
      if (savedEnv.runLive === undefined) delete process.env.RUN_LIVE_AI_TESTS;
      else process.env.RUN_LIVE_AI_TESTS = savedEnv.runLive;
      if (savedEnv.textKey === undefined) delete process.env.WELLFLOW_TEXT_KEY;
      else process.env.WELLFLOW_TEXT_KEY = savedEnv.textKey;
    }
  });
});

describe('POST /api/character/analyze-photo (Endpoint Zero-Storage)', () => {
  it('возвращает 400 при отсутствии imageBase64', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/analyze-photo',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.payload);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('возвращает 200 и характеристики персонажа на валидный запрос к /api/character/analyze-photo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/analyze-photo',
      payload: {
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.gender).toBeDefined();
    expect(json.hairColor).toBeDefined();
  });

  it('передаёт известные пол, имя и возраст в Vision и сохраняет явный выбор', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/character/analyze-photo',
      payload: {
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        knownGender: 'boy',
        knownName: 'Алиса',
        knownAge: 6,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toMatchObject({ gender: 'boy', approxAge: 6 });
  });
});

describe('POST /api/character/generate-avatar (Zero-Storage 3D Pixar Avatar)', () => {
  it('возвращает 400 при отсутствии imageBase64', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/generate-avatar',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.payload);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('возвращает status ok, URL аватара и определённые Vision черты', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/generate-avatar',
      payload: {
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        outfit: 'костюм супергероя',
        knownGender: 'girl',
        knownName: 'Миша',
        knownAge: 6,
      },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.status).toBe('ok');
    expect(json.traitsAnalyzed).toBe(true);
    expect(json.traits).toMatchObject({ gender: 'girl', approxAge: 6 });
    expect(json.avatarUrl).toContain('/illustrations/avatars/');
    expect(json.avatar_id).toBeDefined();
    expect(json.traits).toBeDefined();
    expect(json.traits.gender).toBeDefined();
    expect(json.traits.approxAge).toBeDefined();
    expect(json.traits.hairColor).toBeDefined();
    expect(json.traits.hairType).toBeDefined();
    expect(json.traits.eyeColor).toBeDefined();
    expect(json.traits.skinTone).toBeDefined();
  });

  it('передаёт Vision-черты в генератор и возвращает URL созданного аватара без повторной отправки фото', async () => {
    const service = new CharacterVisionService();
    const savedEnv = {
      runLive: process.env.RUN_LIVE_AI_TESTS,
      textKey: process.env.WELLFLOW_TEXT_KEY,
      imageKey: process.env.WELLFLOW_IMAGE_KEY,
    };
    process.env.RUN_LIVE_AI_TESTS = 'true';
    process.env.WELLFLOW_TEXT_KEY = 'test-text-key';
    process.env.WELLFLOW_IMAGE_KEY = 'test-image-key';
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({
            gender: 'girl',
            approxAge: 5,
            hairColor: 'рыжие',
            hairType: 'кудрявые',
            eyeColor: 'зелёные',
            skinTone: 'смуглая',
            distinctiveFeatures: 'веснушки на щёчках',
          }) } }],
        }),
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ url: 'https://cdn.example.com/generated/hero.webp' }] }),
        text: async () => '',
      } as Response);

    try {
      const result = await service.generateAvatar({
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        outfit: 'костюм супергероя',
        knownGender: 'boy',
        knownName: 'Алиса',
        knownAge: 6,
      });

      expect(result.status).toBe('ok');
      expect(result.traitsAnalyzed).toBe(true);
      expect(result.avatarUrl).toBe('https://cdn.example.com/generated/hero.webp');
      expect(result.traits).toMatchObject({
        gender: 'boy',
        approxAge: 6,
        hairColor: 'рыжие',
        hairType: 'кудрявые',
        eyeColor: 'зелёные',
        skinTone: 'смуглая',
        distinctiveFeatures: 'веснушки на щёчках',
      });
      const generationRequest = JSON.parse(String(fetchSpy.mock.calls[1][1]?.body));
      expect(generationRequest).not.toHaveProperty('image_url');
      expect(generationRequest.prompt).toContain('6-year-old boy');
      expect(generationRequest.prompt).toContain('ginger red curly hair');
      expect(generationRequest).not.toHaveProperty('reference_image');
      expect(generationRequest).not.toHaveProperty('init_image');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    } finally {
      fetchSpy.mockRestore();
      if (savedEnv.runLive === undefined) delete process.env.RUN_LIVE_AI_TESTS;
      else process.env.RUN_LIVE_AI_TESTS = savedEnv.runLive;
      if (savedEnv.textKey === undefined) delete process.env.WELLFLOW_TEXT_KEY;
      else process.env.WELLFLOW_TEXT_KEY = savedEnv.textKey;
      if (savedEnv.imageKey === undefined) delete process.env.WELLFLOW_IMAGE_KEY;
      else process.env.WELLFLOW_IMAGE_KEY = savedEnv.imageKey;
    }
  });

  it('возвращает status fallback, если провайдер генерации изображения недоступен', async () => {
    const service = new CharacterVisionService();
    const savedEnv = {
      runLive: process.env.RUN_LIVE_AI_TESTS,
      textKey: process.env.WELLFLOW_TEXT_KEY,
      imageKey: process.env.WELLFLOW_IMAGE_KEY,
    };
    process.env.RUN_LIVE_AI_TESTS = 'true';
    process.env.WELLFLOW_TEXT_KEY = 'test-text-key';
    process.env.WELLFLOW_IMAGE_KEY = 'test-image-key';
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify({ gender: 'boy', approxAge: 4, hairColor: 'русые', hairType: 'короткие', eyeColor: 'карие', skinTone: 'светлая' }) } }] }),
        text: async () => '',
      } as Response)
      .mockRejectedValueOnce(new Error('provider unavailable'));
    try {
      const result = await service.generateAvatar({
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWJr9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      });

      expect(result.status).toBe('fallback');
      expect(result.traitsAnalyzed).toBe(true);
      expect(result.avatarUrl).toContain('/illustrations/avatars/');
      expect(result.avatar_id).toBeDefined();
      expect(result.traits.gender).toBe('boy');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      const requestBody = JSON.parse(String(fetchSpy.mock.calls[1][1]?.body));
      expect(requestBody).not.toHaveProperty('image_url');
      expect(requestBody).not.toHaveProperty('reference_image');
      expect(requestBody).not.toHaveProperty('init_image');
    } finally {
      fetchSpy.mockRestore();
      if (savedEnv.runLive === undefined) delete process.env.RUN_LIVE_AI_TESTS;
      else process.env.RUN_LIVE_AI_TESTS = savedEnv.runLive;
      if (savedEnv.textKey === undefined) delete process.env.WELLFLOW_TEXT_KEY;
      else process.env.WELLFLOW_TEXT_KEY = savedEnv.textKey;
      if (savedEnv.imageKey === undefined) delete process.env.WELLFLOW_IMAGE_KEY;
      else process.env.WELLFLOW_IMAGE_KEY = savedEnv.imageKey;
    }
  });

  it('возвращает понятный 413, если JSON превышает лимит Fastify', async () => {
    const oversizedImage = 'A'.repeat(8 * 1024 * 1024);
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/generate-avatar',
      payload: { imageBase64: oversizedImage, mimeType: 'image/png' },
    });

    expect(res.statusCode).toBe(413);
    expect(JSON.parse(res.payload)).toMatchObject({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Размер фотографии превышает допустимый лимит (5 МБ).',
    });
  });
});

