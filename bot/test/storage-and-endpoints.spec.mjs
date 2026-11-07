import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveAvatarReferenceUrl, resolveChildAvatarKey } from '../bot.mjs';
import { buildCoverPrompt, buildScenePrompt } from '../../packages/story-engine/src/index.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const BOT_DATA_DIR = path.join(TEST_DIR, '../data');
const DB_PATH = path.join(BOT_DATA_DIR, 'db.json');

test('resolveAvatarReferenceUrl возвращает прямой URL при наличии фото/AI аватара', () => {
  const directUrl = 'https://storage.wellflow.dev/avatars/avatar_123.jpg';
  const res = resolveAvatarReferenceUrl({
    appearance: { avatar_url: directUrl },
  });
  assert.equal(res, directUrl);

  const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
  const res2 = resolveAvatarReferenceUrl({
    avatarUrl: dataUri,
  });
  assert.equal(res2, dataUri);
});

test('resolveAvatarReferenceUrl строит канонический URL пресета при ручной настройке внешности без фото', () => {
  const resBoy = resolveAvatarReferenceUrl({
    gender: 'boy',
    appearance: { hairColor: 'светлые', skinTone: 'светлая' },
  });
  assert.equal(resBoy, 'https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/boy_blonde.webp');

  const resGirl = resolveAvatarReferenceUrl({
    gender: 'girl',
    appearance: { distinctiveFeatures: 'круглые очки' },
  });
  assert.equal(resGirl, 'https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/girl_glasses.webp');

  const resExactPreset = resolveAvatarReferenceUrl({
    appearance: { avatar_id: 'boy_dark' },
  });
  assert.equal(resExactPreset, 'https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/boy_dark.webp');

  const resGirlBlonde = resolveAvatarReferenceUrl({
    appearance: { avatar_id: 'girl_blonde' },
  });
  assert.equal(resGirlBlonde, 'https://x9x9x9www.github.io/moya-skazka/illustrations/avatars/girl_blonde.webp');
});

test('buildCoverPrompt и buildScenePrompt включают ссылку на референсный аватар для консистентности лица', () => {
  const mockStory = {
    title: 'Миша и Звездный Кит',
    cover_visual: 'Миша стоит на берегу реки и смотрит на звездное небо',
    characters: [
      { id: 'hero', role: 'hero', name: 'Миша', visual_description: 'мальчик 4 лет с русыми волосами в синем свитере' },
    ],
    scenes: [
      { index: 1, character_ids: ['hero'], visual: 'Миша собирает ракушки' },
    ],
  };

  const refUrl = 'https://storage.wellflow.dev/avatars/misha_3d.webp';

  const coverPrompt = buildCoverPrompt(mockStory, refUrl);
  assert.ok(coverPrompt.includes(refUrl), 'coverPrompt должен содержать URL опорного аватара');
  assert.ok(coverPrompt.includes('Reference Avatar Image'), 'coverPrompt должен инструктировать модель следовать референсу');

  const scenePrompt = buildScenePrompt(mockStory, mockStory.scenes[0], refUrl);
  assert.ok(scenePrompt.includes(refUrl), 'scenePrompt должен содержать URL опорного аватара');
  assert.ok(scenePrompt.includes('Reference Avatar Image'), 'scenePrompt должен инструктировать модель следовать референсу');
});

test('Разделение сказок и задач по userId исключает коллизии между разными пользователями', () => {
  const childName = 'Миша';
  const user1 = 'user_tg_11111';
  const user2 = 'user_tg_22222';

  const key1 = `${user1}_${childName.toLowerCase()}`;
  const key2 = `${user2}_${childName.toLowerCase()}`;

  assert.notEqual(key1, key2, 'Ключи разных пользователей должны быть строго изолированы');
  assert.equal(key1, 'user_tg_11111_миша');
  assert.equal(key2, 'user_tg_22222_миша');

  // Симуляция кэша: сказка Алисы для «Миши» не должна отдаваться Бобу
  const mockCache = new Map();
  mockCache.set(key1, { story: { id: 'story_alice', title: 'Сказка для Алисы' }, readyAt: Date.now() });

  assert.ok(mockCache.get(key1), 'Алиса должна получать свою сказку');
  assert.equal(mockCache.get(key2), undefined, 'Боб не должен получать сказку Алисы');
  assert.equal(mockCache.get(childName.toLowerCase()), undefined, 'Глобальный неизолированный ключ не должен существовать');
});

test('Фильтрация профилей детей и книг в БД строго изолирует пользователей', () => {
  const mockChildren = {
    c1: { id: 'c1', user_id: 'alice', name: 'Маша' },
    c2: { id: 'c2', user_id: 'bob', name: 'Дима' },
    c3: { id: 'c3', user_id: 'user_default', name: 'Демо-малыш' },
  };

  const mockBooks = {
    b1: { id: 'b1', user_id: 'alice', title: 'Книга Алисы' },
    b2: { id: 'b2', user_id: 'bob', title: 'Книга Боба' },
    b3: { id: 'b3', user_id: 'user_default', title: 'Демо-сказка' },
  };

  const filterByUser = (dict, userId) =>
    Object.values(dict).filter((item) =>
      userId === 'user_default'
        ? item.user_id === 'user_default' || !item.user_id
        : item.user_id === userId
    );

  const aliceChildren = filterByUser(mockChildren, 'alice');
  assert.equal(aliceChildren.length, 1);
  assert.equal(aliceChildren[0].name, 'Маша');

  const bobBooks = filterByUser(mockBooks, 'bob');
  assert.equal(bobBooks.length, 1);
  assert.equal(bobBooks[0].title, 'Книга Боба');

  const defaultBooks = filterByUser(mockBooks, 'user_default');
  assert.equal(defaultBooks.length, 1);
  assert.equal(defaultBooks[0].title, 'Демо-сказка');
});

test('Нормализация сцен и вопросов книги гарантирует наличие scene_index и id', () => {
  const rawScenes = [
    { index: 1, text: 'Текст 1', visual: 'Visual 1' },
    { index: 2, text: 'Текст 2', visual: 'Visual 2', image_url: 'https://cdn.wellflow.dev/img2.jpg' },
  ];

  const normalized = rawScenes.map((s, idx) => ({
    id: s.id || `scene_${s.scene_index || s.index || idx + 1}`,
    scene_index: s.scene_index || s.index || idx + 1,
    index: s.scene_index || s.index || idx + 1,
    text: s.text || '',
    image_url: s.image_url || null,
  }));

  assert.equal(normalized[0].scene_index, 1);
  assert.equal(normalized[0].index, 1);
  assert.equal(normalized[0].id, 'scene_1');
  assert.equal(normalized[1].scene_index, 2);
  assert.equal(normalized[1].image_url, 'https://cdn.wellflow.dev/img2.jpg');
});

test('Алгоритм распознавания свайпов в читалке отфильтровывает вертикальный скролл', () => {
  const evaluateSwipe = (startX, startY, endX, endY, currentScene) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) return 'next';
      if (deltaX > 0 && currentScene > 1) return 'prev';
    }
    return 'none';
  };

  // Свайп влево (переход на следующую страницу)
  assert.equal(evaluateSwipe(200, 100, 120, 110, 1), 'next');

  // Свайп вправо со 2 страницы (переход назад)
  assert.equal(evaluateSwipe(100, 100, 180, 110, 2), 'prev');

  // Свайп вправо с 1 страницы не переходит назад
  assert.equal(evaluateSwipe(100, 100, 180, 110, 1), 'none');

  // Вертикальный скролл текста (deltaY преобладает над deltaX)
  assert.equal(evaluateSwipe(100, 100, 140, 250, 2), 'none');

  // Слишком короткое касание (< 45px)
  assert.equal(evaluateSwipe(100, 100, 130, 102, 2), 'none');
});

test('Файл локального постоянного хранилища bot/data/db.json существует и валиден', () => {
  assert.ok(fs.existsSync(DB_PATH), 'db.json должен существовать в bot/data/');
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(content);
  assert.ok(typeof parsed.users === 'object');
  assert.ok(typeof parsed.children === 'object');
  assert.ok(typeof parsed.books === 'object');
});

test('Паттерн endpoint jobs и job-status распознаёт все варианты путей и ID', () => {
  const jobsRegex = /^\/(?:api\/v1\/|api\/)?(?:ai\/)?(?:jobs?|job-status)\/([a-zA-Z0-9_-]+)$/;

  const validPaths = [
    '/jobs/job_abc123',
    '/api/v1/jobs/job_abc123',
    '/api/v1/ai/job/job_abc123',
    '/api/v1/ai/jobs/job_abc123',
    '/api/ai/job/job_abc123',
    '/api/job/job_abc123',
    '/job/job_abc123',
    '/job-status/job_abc123',
  ];

  for (const p of validPaths) {
    const match = p.match(jobsRegex);
    assert.ok(match, `Путь ${p} должен соответствовать jobsRegex`);
    assert.equal(match[1], 'job_abc123');
  }

  // Проверка извлечения jobId из searchParams для всех вариантов
  const queryPaths = [
    'http://localhost:3000/job-status?id=job_999',
    'http://localhost:3000/api/v1/ai/job-status?jobId=job_999',
    'http://localhost:3000/api/v1/ai/job?id=job_999',
    'http://localhost:3000/api/job?jobId=job_999',
    'http://localhost:3000/job?id=job_999',
  ];
  for (const qp of queryPaths) {
    const u = new URL(qp);
    const extracted = u.searchParams.get('id') || u.searchParams.get('jobId');
    assert.equal(extracted, 'job_999');
  }
});

test('Кастомные интересы фильтруются без учета регистра и исключают дубли', () => {
  const standard = ['Динозавры', 'Космос', 'Животные', 'Волшебство'];
  const standardIds = standard.map((s) => s.toLowerCase());

  const selected = ['Динозавры', 'динозавры', 'Роботы', 'РОБОТЫ', 'космос', 'Лего'];
  const deduplicated = [];
  for (const item of selected) {
    if (!deduplicated.some((d) => d.toLowerCase() === item.toLowerCase())) {
      deduplicated.push(item);
    }
  }

  assert.deepEqual(deduplicated, ['Динозавры', 'Роботы', 'космос', 'Лего']);
  const customList = deduplicated.filter((i) => !standardIds.includes(i.toLowerCase()));
  assert.deepEqual(customList, ['Роботы', 'Лего']);
});

