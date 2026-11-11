import test from 'node:test';
import assert from 'node:assert/strict';
import { robustParseJson } from '../src/index.mjs';

test('robustParseJson парсит стандартный валидный JSON', () => {
  const jsonStr = JSON.stringify({ title: 'Тестовая сказка', count: 42 });
  const result = robustParseJson(jsonStr);
  assert.equal(result.title, 'Тестовая сказка');
  assert.equal(result.count, 42);
});

test('robustParseJson извлекает правильный объект при выводе двух JSON подряд (баг Unexpected non-whitespace character)', () => {
  // Точная воспроизведённая ситуация: модель сначала вывела паспорт/архетип, а затем полный объект сказки
  const doubleJson = `
{
  "archetype": "holiday_upside_down",
  "reason": "Весёлая путаница и смех"
}

{
  "title": "Лондонская путаница и шляпа с колокольчиками",
  "scenes": [
    { "index": 1, "text": "Сцена 1: на улице Лондона...", "visual": "3D cartoon scene 1" },
    { "index": 2, "text": "Сцена 2: перевёрнутая карта...", "visual": "3D cartoon scene 2" },
    { "index": 3, "text": "Сцена 3: дружный смех...", "visual": "3D cartoon scene 3" },
    { "index": 4, "text": "Сцена 4: праздник радости...", "visual": "3D cartoon scene 4" }
  ],
  "characters": [
    { "name": "Сьюзана", "role": "hero" }
  ],
  "questions": [
    { "after_scene": 2, "question": "Что рассмешило Сьюзану?" }
  ]
}
`;

  const parsed = robustParseJson(doubleJson, ['scenes', 'title', 'characters']);
  assert.equal(parsed.title, 'Лондонская путаница и шляпа с колокольчиками');
  assert.ok(Array.isArray(parsed.scenes));
  assert.equal(parsed.scenes.length, 4);
  assert.equal(parsed.characters[0].name, 'Сьюзана');
});

test('robustParseJson извлекает блюпринт при наличии метаданных вокруг', () => {
  const rawOutput = `
Вот архитектурный план сказки:
\`\`\`json
{
  "psychological_profile": { "character_strength": "доброта" },
  "creative_concept": { "core_metaphor": "живая карта" },
  "scene_by_scene_blueprint": {
    "scene_1_hook": { "setting": "улица" }
  }
}
\`\`\`
Надеюсь, вам понравился план!
`;

  const parsed = robustParseJson(rawOutput, ['scene_by_scene_blueprint', 'psychological_profile']);
  assert.ok(parsed.scene_by_scene_blueprint);
  assert.equal(parsed.scene_by_scene_blueprint.scene_1_hook.setting, 'улица');
});

test('robustParseJson очищает висячие запятые (trailing commas)', () => {
  const malformed = `{
    "title": "Сказка с запятыми",
    "items": [
      "один",
      "два",
    ],
    "nested": {
      "key": "value",
    },
  }`;

  const parsed = robustParseJson(malformed);
  assert.equal(parsed.title, 'Сказка с запятыми');
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.nested.key, 'value');
});

test('robustParseJson обрабатывает сырые переносы строк внутри строковых литералов', () => {
  const malformedWithRawNewlines = `{
    "title": "Сказка",
    "scene_text": "Первая строчка диалога
Вторая строчка диалога
Третья строчка"
  }`;

  const parsed = robustParseJson(malformedWithRawNewlines);
  assert.equal(parsed.title, 'Сказка');
  assert.ok(parsed.scene_text.includes('Вторая строчка диалога'));
});

test('robustParseJson восстанавливает оборванные скобки (truncated response)', () => {
  const truncated = `{"title": "Оборванная сказка", "scenes": [{"index": 1, "text": "Начало истории"`;

  const parsed = robustParseJson(truncated);
  assert.equal(parsed.title, 'Оборванная сказка');
  assert.ok(Array.isArray(parsed.scenes));
  assert.equal(parsed.scenes[0].text, 'Начало истории');
});

test('robustParseJson выбрасывает понятную ошибку при полном отсутствии JSON', () => {
  assert.throws(
    () => robustParseJson('Здесь вообще нет никакого json объекта, просто текст.'),
    /не найден валидный JSON-объект/
  );
});
