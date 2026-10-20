import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STYLE_3D_PIXAR,
  STORY_SYSTEM_PROMPT,
  appearanceHints,
  chooseStoryDna,
  createSeededRandom,
  buildStoryPrompt,
  normalizeStory,
  buildCoverPrompt,
  buildScenePrompt,
  buildLengthRepairPrompt,
  fallbackQuestions,
  scoreStory,
  StoryValidationError,
} from '../src/index.mjs';

const params = {
  childName: 'Миша',
  age: 4,
  gender: 'boy',
  theme: 'Дружба',
  interests: ['Динозавры', 'Космос'],
  personality: 'Добрый',
  customWishes: null,
  appearance: {
    hairColor: 'русые',
    hairType: 'кудрявые',
    clothingItem: 'уютный свитер',
    clothingColor: 'изумрудный',
    toy: 'плюшевый динозаврик',
    eyeColor: 'карие',
    skinTone: 'персиковая',
  },
  recentOutlines: ['Миша и потерянная звёздочка'],
};

const sceneText = (n) =>
  `Сцена ${n}. В тёплой комнате пахло яблочным пирогом и шерстяным пледом. Миша бережно поправил плюшевого Дино и прислушался к тихому звону за окном. Звёздочка дрожала на подоконнике, и друзья решили помочь ей добраться до неба.`;

const fixture = () => ({
  title: 'Миша и звёздный мостик',
  story_dna: {
    world_scale: 'Домашняя магия',
    narrative_engine: 'Детектив и загадка',
    literary_voice: 'Тёплый, сердечный тон',
  },
  story_outline: 'Миша и Дино помогают звёздочке вернуться на небо.',
  characters: [
    {
      id: 'hero',
      name: 'Миша',
      role: 'hero',
      visual_description:
        'A 4-year-old boy with soft light-brown curly hair, warm hazel-brown eyes, peach skin, wearing an emerald green knitted sweater.',
    },
    {
      id: 'companion',
      name: 'Дино',
      role: 'companion',
      visual_description:
        'A small chubby plush dinosaur made of soft green fabric with visible stitching, button eyes and a warm orange belly.',
    },
  ],
  cover_visual:
    'A cozy attic at dusk with a brass telescope and a tiny glowing star above the windowsill, warm lamplight and deep blue sky.',
  scenes: [1, 2, 3, 4].map((index) => ({
    index,
    text: sceneText(index),
    visual: `Scene ${index} in a cozy attic with warm lamplight, cinematic low angle, deep blue twilight.`,
    character_ids: ['hero', 'companion'],
  })),
  questions: [
    {
      after_scene: 2,
      question: 'Как ты думаешь, почему звёздочка сначала боялась попросить о помощи?',
      parent_hint: 'Выслушайте ребёнка и помогите назвать эмоцию.',
      skill: 'emotions',
    },
    {
      after_scene: 4,
      question: 'Какой мостик ты бы построил для звёздочки?',
      parent_hint: 'Дайте ребёнку пофантазировать и похвалите идею.',
      skill: 'imagination',
    },
  ],
});

test('промпт требует 3D Pixar-стиль и запрещает текст на картинке', () => {
  assert.match(STYLE_3D_PIXAR, /3D animated/i);
  assert.match(STYLE_3D_PIXAR, /no text/i);
  assert.match(STYLE_3D_PIXAR, /no letters/i);
  assert.match(STYLE_3D_PIXAR, /book spine text/i);
});

test('системный промпт содержит контракт и правила персонажей', () => {
  assert.match(STORY_SYSTEM_PROMPT, /STRICT JSON CONTRACT/);
  assert.match(STORY_SYSTEM_PROMPT, /NEVER merge the hero and the companion/);
  assert.match(STORY_SYSTEM_PROMPT, /No text, letters, captions/i);
});

test('appearanceHints переводит русские параметры в английские подсказки', () => {
  const hints = appearanceHints(params.appearance);
  assert.match(hints.hairColor, /light-brown/);
  assert.match(hints.hairType, /curly/);
  assert.match(hints.eyes, /hazel-brown/);
  assert.match(hints.skin, /peach/);
  assert.match(hints.clothes, /emerald green/);
  assert.match(hints.toy, /dinosaur/);
});

test('chooseStoryDna детерминирован при одном seed', () => {
  const a = chooseStoryDna(params, createSeededRandom('seed-1'));
  const b = chooseStoryDna(params, createSeededRandom('seed-1'));
  assert.equal(a.world_scale, b.world_scale);
  assert.equal(a.narrative_engine, b.narrative_engine);
  assert.equal(a.companion_quirk, b.companion_quirk);
});

test('buildStoryPrompt содержит возрастной объём и героя', () => {
  const { system, user } = buildStoryPrompt(params, { random: createSeededRandom('seed-1') });
  assert.match(system, /STRICT JSON CONTRACT/);
  assert.match(user, /Миша/);
  assert.match(user, /380–540/);
  assert.match(user, /Ориентир на каждую сцену/);
  assert.match(user, /НЕ ПОВТОРЯЙ/);
});

test('buildStoryPrompt поднимает customWishes на высший приоритет', () => {
  const customParams = { ...params, customWishes: 'Пусть Миша встретит дельфина в тёплом море' };
  const { user, dna } = buildStoryPrompt(customParams, { random: createSeededRandom('seed-custom') });
  assert.match(user, /ВЫСШИЙ ПРИОРИТЕТ/);
  assert.match(user, /встретит дельфина в тёплом море/);
  assert.match(dna.world_scale, /Seaside Wonder/);
});

test('chooseStoryDna адаптирует мир и спутника под машинки и динозавров', () => {
  const carParams = {
    ...params,
    interests: ['Машинки'],
    appearance: { ...params.appearance, toy: 'быстрая машинка' },
  };
  const dna = chooseStoryDna(carParams, createSeededRandom('seed-car'));
  assert.match(dna.world_scale, /Motors/);
  assert.match(dna.companion_quirk, /моторчик|колёсик|фара/i);
});

test('normalizeStory принимает валидный ответ и считает слова', () => {
  const story = normalizeStory(fixture(), params);
  assert.equal(story.title, 'Миша и звёздный мостик');
  assert.equal(story.scenes.length, 4);
  assert.equal(story.questions.length, 2);
  assert.ok(story.metrics.total_words > 100);
  assert.deepEqual(story.metrics.scene_words.length, 4);
});

test('normalizeStory убирает вопрос для родителя из текста сцены', () => {
  const raw = fixture();
  raw.scenes[1].text += '\n\nПочему звёздочка не попросила помощи сразу?';
  const story = normalizeStory(raw, params);
  assert.ok(!story.scenes[1].text.includes('Почему звёздочка не попросила'));
  assert.ok(story.warnings.some((warning) => warning.includes('вопрос для родителя')));
});

test('normalizeStory убирает точный дубль вопроса из текста', () => {
  const raw = fixture();
  raw.scenes[1].text += '\n\n' + raw.questions[0].question;
  const story = normalizeStory(raw, params);
  assert.ok(!story.scenes[1].text.includes(raw.questions[0].question));
  assert.ok(story.warnings.some((warning) => warning.includes('вопрос')));
});

test('normalizeStory требует ровно 4 сцены', () => {
  const raw = fixture();
  raw.scenes.pop();
  assert.throws(() => normalizeStory(raw, params), (error) => {
    assert.ok(error instanceof StoryValidationError);
    assert.ok(error.issues.some((issue) => issue.includes('4 сцены')));
    return true;
  });
});

test('normalizeStory требует вопросы после сцен 2 и 4', () => {
  const raw = fixture();
  raw.questions = [raw.questions[0]];
  assert.throws(() => normalizeStory(raw, params), (error) => {
    assert.ok(error instanceof StoryValidationError);
    return true;
  });
});

test('buildCoverPrompt включает character bible и стиль', () => {
  const story = normalizeStory(fixture(), params);
  const prompt = buildCoverPrompt(story);
  assert.match(prompt, /Миша/);
  assert.match(prompt, /Дино/);
  assert.match(prompt, /Pixar-style/);
  assert.match(prompt, /no text/i);
});

test('buildScenePrompt включает только персонажей, указанных в сцене', () => {
  const story = normalizeStory(fixture(), params);
  story.scenes[0].character_ids = ['hero'];
  const prompt = buildScenePrompt(story, story.scenes[0]);
  assert.match(prompt, /Миша/);
  assert.ok(!prompt.includes('Дино'));
});

test('buildLengthRepairPrompt содержит цель и запрет менять сюжет', () => {
  const story = normalizeStory(fixture(), params);
  const prompt = buildLengthRepairPrompt(story, [500, 600]);
  assert.match(prompt, /500–600/);
  assert.match(prompt, /20–35%/);
  assert.match(prompt, /не меняя сюжет/i);
});

test('fallbackQuestions даёт вопросы после 2 и 4', () => {
  const questions = fallbackQuestions('Миша');
  assert.deepEqual(questions.map((q) => q.after_scene), [2, 4]);
  assert.ok(questions.every((q) => q.question.length > 10));
});

test('scoreStory не падает на валидной сказке', () => {
  const story = normalizeStory(fixture(), params);
  const score = scoreStory(story);
  assert.ok(score.score >= 0 && score.score <= 100);
  assert.ok(Array.isArray(score.issues));
});
