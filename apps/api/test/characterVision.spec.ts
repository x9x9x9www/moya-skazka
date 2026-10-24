import { describe, it, expect } from 'vitest';
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

  it('поддерживает также префикс /api/v1/character/analyze-photo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/character/analyze-photo',
      payload: {
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.gender).toBeDefined();
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

  it('генерирует 3D Pixar аватар и возвращает status ok, avatarUrl и traits', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/character/generate-avatar',
      payload: {
        imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        outfit: 'костюм супергероя',
      },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.status).toBe('ok');
    expect(json.avatarUrl).toBeDefined();
    expect(json.avatar_id).toBeDefined();
    expect(json.traits).toBeDefined();
    expect(json.traits.gender).toBeDefined();
    expect(json.traits.approxAge).toBeDefined();
    expect(json.traits.hairColor).toBeDefined();
    expect(json.traits.hairType).toBeDefined();
    expect(json.traits.eyeColor).toBeDefined();
    expect(json.traits.skinTone).toBeDefined();
  });
});

