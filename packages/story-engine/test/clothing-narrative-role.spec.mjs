import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyClothingNarrativeRole,
  formatClothingNarrativePrompt,
  buildStoryPrompt,
  runEditorialAgent,
} from '../src/index.mjs';

test('Классификация: повседневная одежда (свитер, худи, комбинезон, платье) не навязывается в текст сюжета', () => {
  const cases = [
    { appearance: { clothingItem: 'уютный вязаный свитер', clothingColor: 'мятный' }, theme: 'Лесные зверята' },
    { appearance: { clothingItem: 'худи с капюшоном', clothingColor: 'синий' }, theme: 'Волшебная поляна' },
    { appearance: { clothingItem: 'джинсовый комбинезон', clothingColor: 'голубой' }, theme: 'Дружба и радость' },
    { appearance: { clothingItem: 'хлопковое платье', clothingColor: 'розовый' }, theme: 'Сад бабочек' },
  ];

  for (const c of cases) {
    const classification = classifyClothingNarrativeRole(c);
    assert.equal(classification.role, 'everyday', `Одежда ${c.appearance.clothingItem} должна быть everyday`);
    assert.equal(classification.isNarrativelyRelevant, false, `Одежда ${c.appearance.clothingItem} не должна навязываться в сюжет`);
    assert.equal(classification.allowBestowal, false);
  }
});

test('Классификация: костюм супергероя и космический скафандр сюжетно значимы и поддерживают вручение (bestowal)', () => {
  const superheroHero = classifyClothingNarrativeRole({
    appearance: { clothingItem: 'костюм супергероя с плащом', clothingColor: 'красно-синий' },
    theme: 'Супергерои спасают город',
  });
  assert.equal(superheroHero.role, 'costume');
  assert.equal(superheroHero.isNarrativelyRelevant, true);
  assert.equal(superheroHero.allowBestowal, true);
  assert.ok(superheroHero.costumeType?.includes('superhero') || superheroHero.costumeType?.includes('костюм'));

  const astronautHero = classifyClothingNarrativeRole({
    appearance: { clothingItem: 'скафандр исследователя космоса', clothingColor: 'белый' },
    theme: 'Полёт к далёким звёздам',
  });
  assert.equal(astronautHero.role, 'costume');
  assert.equal(astronautHero.isNarrativelyRelevant, true);
  assert.equal(astronautHero.allowBestowal, true);

  const knightHero = classifyClothingNarrativeRole({
    appearance: { clothingItem: 'рыцарские доспехи со щитом', clothingColor: 'серебристый' },
    theme: 'Рыцарский турнир доброты',
  });
  assert.equal(knightHero.role, 'costume');
  assert.equal(knightHero.isNarrativelyRelevant, true);
  assert.equal(knightHero.allowBestowal, true);
});

test('Классификация: функциональная одежда (дождевик для луж, пижама для сна)', () => {
  const rainGear = classifyClothingNarrativeRole({
    appearance: { clothingItem: 'жёлтый дождевик и резиновые сапожки', clothingColor: 'жёлтый' },
    theme: 'Прогулка под тёплым дождиком',
  });
  assert.equal(rainGear.role, 'functional');
  assert.equal(rainGear.isNarrativelyRelevant, true);
  assert.equal(rainGear.allowBestowal, false);

  const bedtimePajamas = classifyClothingNarrativeRole({
    appearance: { clothingItem: 'мягкая фланелевая пижамка', clothingColor: 'небесно-голубой' },
    theme: 'Сонная сказка перед сном',
    storyMood: 'Спокойный сон',
  });
  assert.equal(bedtimePajamas.role, 'functional');
  assert.equal(bedtimePajamas.isNarrativelyRelevant, true);
});

test('formatClothingNarrativePrompt: запрещает клише для повседневной одежды и описывает вручение для костюмов', () => {
  const everydayPrompt = formatClothingNarrativePrompt({
    childName: 'Миша',
    gender: 'boy',
    appearance: { clothingItem: 'уютный свитер', clothingColor: 'зелёный' },
    theme: 'Лесные тропинки',
  });
  assert.ok(everydayPrompt.includes('ПОВСЕДНЕВНАЯ ОДЕЖДА'), 'Содержит статус повседневной одежды');
  assert.ok(everydayPrompt.includes('ЗАПРЕТ ШАБЛОННЫХ ОПИСАНИЙ') || everydayPrompt.includes('СТРОГО ЗАПРЕЩЕНО'), 'Запрещает навязчивые шаблонные вставки');
  assert.ok(/иллюстраци/i.test(everydayPrompt), 'Сохраняет визуальный контракт для 3D Pixar');

  const superheroPrompt = formatClothingNarrativePrompt({
    childName: 'Артём',
    gender: 'boy',
    appearance: { clothingItem: 'костюм супергероя', clothingColor: 'красный' },
    theme: 'Супергерои',
  });
  assert.ok(superheroPrompt.includes('СЮЖЕТНЫЙ ЭЛЕМЕНТ') || superheroPrompt.includes('супергеройский костюм'), 'Указывает сюжетную роль костюма');
  assert.ok(superheroPrompt.includes('вручён') || superheroPrompt.includes('подарен') || superheroPrompt.includes('ВРУЧЕНИЕ КОСТЮМА'), 'Упоминает вручение костюма');
});

test('buildStoryPrompt: формирует корректный промпт без принудительного свитера в Сцене 1', () => {
  const prompt = buildStoryPrompt({
    childName: 'Алиса',
    age: 5,
    gender: 'girl',
    theme: 'Тайны звёздного сада',
    interests: ['звёзды', 'котята'],
    personality: 'любознательная',
    appearance: {
      hairColor: 'светлые',
      clothingItem: 'уютный свитерок',
      clothingColor: 'персиковый',
    },
  });

  assert.ok(prompt.user.includes('ПОВСЕДНЕВНАЯ ОДЕЖДА'), 'Включает классификацию одежды');
  assert.ok(!prompt.user.includes('В Сцене 1 ОБЯЗАТЕЛЬНО покажи героя в этой одежде («Алиса в своём любимом...»)'), 'Удалено принудительное шаблонное требование в Сцене 1');
});

test('runEditorialAgent: не дописывает принудительно свитер в Сцену 1, если одежда повседневная', () => {
  const rawStory = {
    title: 'Алиса и Звёздный Сад',
    characters: [{ id: 'hero', name: 'Алиса', role: 'hero', visual_description: 'Cute 5yo girl' }],
    scenes: [
      {
        index: 1,
        text: 'Однажды утром Алиса вышла на крылечко своего дома. В воздухе пахло свежестью и земляникой, а на ветке пела звонкая синичка.',
        visual: 'Alice on porch',
        character_ids: ['hero'],
      },
      {
        index: 2,
        text: 'Навстречу ей выбежал пушистый котёнок. «Пойдём искать волшебную поляну!» — позвал он.',
        visual: 'Alice and kitten',
        character_ids: ['hero'],
      },
      {
        index: 3,
        text: 'Тропинка вела через густую траву. Вместе они перешагнули быстрый ручеёк.',
        visual: 'Crossing brook',
        character_ids: ['hero'],
      },
      {
        index: 4,
        text: 'На солнечной полянке звёздочки опустились на цветы. Наступил счастливый и добрый вечер.',
        visual: 'Starry meadow finale',
        character_ids: ['hero'],
      },
    ],
    questions: [
      { after_scene: 2, question: 'Как котёнок позвал Алису?', parent_hint: null, skill_tag: 'memory' },
    ],
  };

  const result = runEditorialAgent(rawStory, {
    childName: 'Алиса',
    gender: 'girl',
    appearance: {
      clothingItem: 'уютный свитер',
      clothingColor: 'мятный',
    },
    theme: 'Лесные приключения',
  });

  const scene1 = result.story.scenes[0].text;
  assert.ok(!scene1.includes('с улыбкой поправила свой уютный свитер'), 'Эдиториал не должен насильно дописывать шаблонный свитер');
  assert.ok(!scene1.includes('чувствуя уютное тепло'), 'Удалено шаблонное предложение про свитер');
});
