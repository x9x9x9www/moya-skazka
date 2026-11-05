import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCHITECT_SYSTEM_PROMPT,
  STORY_SYSTEM_PROMPT,
  buildArchitectPrompt,
  buildStoryFromBlueprintPrompt,
  normalizeBlueprint,
  chooseStoryDna,
  createSeededRandom,
} from '../src/index.mjs';

test('buildArchitectPrompt формирует промпт архитектора с психологией, темой и одеждой', () => {
  const params = {
    childName: 'Алиса',
    age: 4,
    gender: 'girl',
    theme: 'Космическое путешествие',
    interests: ['звёзды', 'роботы'],
    personality: 'Любознательный (почемучка)',
    appearance: {
      hairColor: 'светлые',
      clothingItem: 'серебристый комбинезон со звёздами',
      toy: 'плюшевый робот Болтик',
    },
    customWishes: 'Помочь маленькой кометке найти свою орбиту',
  };

  const { system, user, dna } = buildArchitectPrompt(params, {
    random: createSeededRandom('test-architect-seed'),
  });

  assert.equal(system, ARCHITECT_SYSTEM_PROMPT);
  assert.ok(system.includes('Story Blueprint'));
  assert.ok(system.includes('world-class child psychologist'));

  // Проверяем элементы анализа
  assert.ok(user.includes('Алиса'));
  assert.ok(user.includes('девочка'));
  assert.ok(user.includes('Космическое путешествие'));
  assert.ok(user.includes('серебристый комбинезон со звёздами'));
  assert.ok(user.includes('плюшевый робот Болтик'));
  assert.ok(user.includes('Помочь маленькой кометке найти свою орбиту'));
  assert.ok(user.includes('psychological_profile'));
  assert.ok(user.includes('scene_by_scene_blueprint'));
  assert.ok(Boolean(dna));
});

test('normalizeBlueprint корректно парсит полный блюпринт и заполняет дефолты при неполных данных', () => {
  const fullRaw = {
    psychological_profile: {
      age_focus: 'Внимание к сенсорным деталям 4 лет',
      character_strength: 'Неугомонное любопытство',
      therapeutic_goal: 'Чувство безопасности в бескрайнем космосе',
    },
    creative_concept: {
      core_metaphor: 'Звёздная карта как созвездие дружбы',
      world_description: 'Планета мягких комет с ароматом ванили',
      companion_role: 'Робот Болтик подмигивает синей лампочкой',
    },
    scene_by_scene_blueprint: {
      scene_1_hook: {
        setting: 'У иллюминатора звёздного шаттла',
        sensory_hook: 'Тихий звон космического колокольчика',
        clothing_action: 'Алиса поправляет кармашек серебристого комбинезона',
        toy_awakening: 'Болтик весело пищит и крутит антенкой',
      },
      scene_2_intrigue: {
        gentle_mystery: 'Маленькая комета потеряла свой хвостик',
        emotional_beat: 'Сочувствие и желание помочь',
        pause_hook: 'Алиса и Болтик разглядывают звёздную пыльцу',
      },
      scene_3_climax: {
        child_decision: 'Алиса делится звёздным огоньком из кармашка',
        wish_fulfillment: 'Кометка вспыхивает радостью и находит орбиту',
        triumph_moment: 'Праздничный звездопад вокруг шаттла',
      },
      scene_4_bedtime_calm: {
        calming_imagery: 'Мягкий свет угасающих звёздочек за окном',
        grounding_gesture: 'Алиса обнимает тёплого Болтика и засыпает',
        pause_hook: 'Покой перед сладким сном',
      },
    },
    pedagogical_focus: {
      question_1_theme: 'Что почувствовала Алиса при встрече с кометой?',
      question_2_theme: 'Что согрело сердечко Алисы перед сном?',
    },
  };

  const parsed = normalizeBlueprint(fullRaw, { childName: 'Алиса', age: 4 });
  assert.equal(parsed.creative_concept.core_metaphor, 'Звёздная карта как созвездие дружбы');
  assert.equal(parsed.scene_by_scene_blueprint.scene_1_hook.sensory_hook, 'Тихий звон космического колокольчика');
  assert.equal(parsed.pedagogical_focus.question_1_theme, 'Что почувствовала Алиса при встрече с кометой?');

  // Проверка fallback при пустом объекте
  const emptyParsed = normalizeBlueprint({}, { childName: 'Миша', theme: 'Динозавры', age: 5 });
  assert.ok(emptyParsed.creative_concept.core_metaphor.includes('Динозавры'));
  assert.ok(emptyParsed.psychological_profile.age_focus.includes('5'));
  assert.ok(emptyParsed.scene_by_scene_blueprint.scene_1_hook.clothing_action.includes('Миша'));
});

test('buildStoryFromBlueprintPrompt строит промпт сказочника с утверждённым планом', () => {
  const params = {
    childName: 'Марк',
    age: 5,
    gender: 'boy',
    theme: 'Подводный мир',
    appearance: {
      clothingItem: 'уютная бирюзовая толстовка с капюшоном',
      toy: 'плюшевый дельфинёнок Плеск',
    },
  };

  const blueprint = {
    creative_concept: {
      core_metaphor: 'Жемчужина доброты на песчаном дне',
      world_description: 'Залив тёплых светящихся кораллов',
      companion_role: 'Плеск свистит серебристыми пузырьками',
    },
    scene_by_scene_blueprint: {
      scene_1_hook: {
        setting: 'У кромки тёплой лагуны',
        sensory_hook: 'Шёпот ласковой морской волны',
        clothing_action: 'Марк натягивает капюшон бирюзовой толстовки',
        toy_awakening: 'Плеск шевелит мягкими плавничками',
      },
      scene_2_intrigue: {
        gentle_mystery: 'Ракушка не может открыться без доброй песенки',
        emotional_beat: 'Марк прислушивается к шуму прибоя',
        pause_hook: 'Пауза перед тем, как спеть ракушке',
      },
      scene_3_climax: {
        child_decision: 'Марк напевает ласковую мелодию',
        wish_fulfillment: 'Ракушка раскрывается и дарит лучик света',
        triumph_moment: 'Все рыбки кружатся в хороводе',
      },
      scene_4_bedtime_calm: {
        calming_imagery: 'Мерцание лунной дорожки на тихой воде',
        grounding_gesture: 'Марк сладко зевает и прижимает Плеска к груди',
        pause_hook: 'Покой ночного моря',
      },
    },
    pedagogical_focus: {
      question_1_theme: 'О чём задумался Марк, когда услышал ракушку?',
      question_2_theme: 'Какая песенка помогла рыбкам успокоиться?',
    },
  };

  const { system, user } = buildStoryFromBlueprintPrompt(params, blueprint);

  assert.equal(system, STORY_SYSTEM_PROMPT);
  assert.ok(user.includes('Жемчужина доброты на песчаном дне'));
  assert.ok(user.includes('Шёпот ласковой морской волны'));
  assert.ok(user.includes('Марк'));
  assert.ok(user.includes('мальчик (мужской род: увидел, почувствовал, улыбнулся)'));
  assert.ok(user.includes('уютная бирюзовая толстовка с капюшоном'));
  assert.ok(user.includes('дельфинёнок Плеск'));
  assert.ok(user.includes('Ракушка не может открыться без доброй песенки'));
});

test('buildArchitectPrompt для темы «Мода и стиль» с настроением «Творчество» не содержит клише про замерзание и мороз', () => {
  const params = {
    childName: 'Петр',
    age: 2,
    gender: 'boy',
    theme: 'Мода и Стиль',
    personality: 'Добрый',
    storyMood: 'Творчество',
    appearance: {
      clothingItem: 'изумрудный свитер',
      toy: 'плюшевый медвежонок',
    },
  };

  const { system, user, dna } = buildArchitectPrompt(params);

  assert.ok(system.includes('STRICT BAN ON CLICHÉS'));
  assert.ok(system.includes('NEVER introduce freezing animals'));
  assert.ok(user.includes('Мода и Стиль'));
  assert.ok(user.includes('Творчество и созидание'));
  assert.ok(dna.world_scale.includes('Atelier of Whimsical Style') || dna.world_description.includes('бархата'));
  assert.ok(!user.includes('согреть озябшие лапки'));
  assert.ok(!user.includes('поделиться последней земляничкой'));
});
