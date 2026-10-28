import test from 'node:test';
import assert from 'node:assert/strict';
import {
  proofreadRussianGrammar,
  formatRussianDialogues,
  applyYoification,
  applyTypographySpacing,
  sanitizeToneAndPurity,
  verifyNarrativeIntegrity,
  runEditorialAgent,
} from '../src/editorialAgent.mjs';

test('Агент: родовое согласование глаголов для девочки', () => {
  const raw = 'Аэлита пошел по тропинке, увидел огонек и улыбнулся. Девочка подошел к дереву.';
  const fixed = proofreadRussianGrammar(raw, { childName: 'Аэлита', gender: 'girl' });

  assert.ok(fixed.includes('Аэлита пошла'), 'пошел -> пошла');
  assert.ok(fixed.includes('увидела'), 'увидел -> увидела');
  assert.ok(fixed.includes('улыбнулась'), 'улыбнулся -> улыбнулась');
  assert.ok(fixed.includes('девочка подошла') || fixed.includes('Девочка подошла'), 'подошел -> подошла');
});

test('Агент: родовое согласование глаголов для мальчика', () => {
  const raw = 'Марк пошла вперед и увидела красивый домик. Малыш улыбнулась.';
  const fixed = proofreadRussianGrammar(raw, { childName: 'Марк', gender: 'boy' });

  assert.ok(fixed.includes('Марк пошёл'), 'пошла -> пошёл');
  assert.ok(fixed.includes('увидел'), 'увидела -> увидел');
  assert.ok(fixed.includes('малыш улыбнулся') || fixed.includes('Малыш улыбнулся'), 'улыбнулась -> улыбнулся');
});

test('Агент: падежное склонение имён в предложных конструкциях', () => {
  const rawLev = 'В руках Лев был компас. Навстречу Лев выбежал заяц. Вместе с Лев они пошли домой.';
  const fixedLev = proofreadRussianGrammar(rawLev, { childName: 'Лев', gender: 'boy' });
  assert.ok(fixedLev.includes('В руках Льва'), 'Родительный: Лев -> Льва');
  assert.ok(fixedLev.includes('Навстречу Льву'), 'Дательный: Лев -> Льву');
  assert.ok(fixedLev.includes('Вместе с Львом') || fixedLev.includes('Вместе со Львом'), 'Творительный: со Львом');

  const rawAelita = 'Около Аэлита сидел лисенок. Вместе с Аэлита они улыбнулись.';
  const fixedAelita = proofreadRussianGrammar(rawAelita, { childName: 'Аэлита', gender: 'girl' });
  assert.ok(fixedAelita.includes('Около Аэлиты'), 'Родительный: Аэлита -> Аэлиты');
  assert.ok(fixedAelita.includes('Вместе с Аэлитой'), 'Творительный: с Аэлитой');
});

test('Агент: детская книжная ёфикация (ГОСТ для дошкольников)', () => {
  const raw = 'Теплый ветерок зашелестел, и на небе зажглись первые звезды. Зеленый лисенок еще не спал.';
  const yoified = applyYoification(raw);

  assert.ok(yoified.includes('Тёплый'), 'Теплый -> Тёплый');
  assert.ok(yoified.includes('звёзды'), 'звезды -> звёзды');
  assert.ok(yoified.includes('Зелёный'), 'Зеленый -> Зелёный');
  assert.ok(yoified.includes('лисёнок'), 'лисенок -> лисёнок');
  assert.ok(yoified.includes('ещё'), 'еще -> ещё');
});

test('Агент: оформление книжных диалогов и прямой речи', () => {
  const raw = '"Здравствуй, Лев!" - прошептал Лучик. "Я помогу тебе," - ответил друг.';
  const formatted = formatRussianDialogues(raw);

  assert.ok(formatted.includes('— Здравствуй, Лев! — прошептал Лучик.'), 'Диалог оформлен с длинным тире');
  assert.ok(formatted.includes('— Я помогу тебе'), 'Вторая реплика оформлена с тире');
});

test('Агент: анти-канцелярит и сонный фильтр', () => {
  const raw = 'Жил-был Лев (4 года). Следует отметить, что впереди был страшный лес с монстром.';
  const sanitized = sanitizeToneAndPurity(raw);

  assert.ok(!sanitized.includes('Жил-был'), 'Клише удалено');
  assert.ok(!sanitized.includes('(4 года)'), 'Возраст в скобках удален');
  assert.ok(!sanitized.includes('следует отметить'), 'Канцеляризм удален');
  assert.ok(!sanitized.includes('страшный'), 'Пугающее слово заменено');
  assert.ok(!sanitized.includes('монстром'), 'Монстр заменен на безопасный образ');
});

test('Агент: проверка целостности сказки и вопросов', () => {
  const brokenStory = {
    title: 'Приключение',
    scenes: [
      { index: 1, text: 'Маленький герой встретил машинку.' },
      { index: 2, text: 'Они поехали по дороге. Как зовут машинку?' }, // дубль вопроса в тексте
    ],
    questions: [
      { question: 'Как зовут машинку?' },
    ],
  };

  const integrity = verifyNarrativeIntegrity(brokenStory, { childName: 'Лев', gender: 'boy' });

  assert.equal(integrity.story.scenes.length, 4, 'Сцены дополнены до 4');
  assert.equal(integrity.story.questions.length, 2, 'Вопросов ровно 2');
  assert.equal(integrity.story.questions[0].after_scene, 2, 'Вопрос 1 после сцены 2');
  assert.equal(integrity.story.questions[1].after_scene, 4, 'Вопрос 2 после сцены 4');
  assert.ok(!integrity.story.scenes[1].text.includes('Как зовут машинку?'), 'Дубль вопроса удален из сцены');
  assert.ok(integrity.story.scenes[3].text.includes('звёзд') || integrity.story.scenes[3].text.includes('сон'), 'Сонный финал в сцене 4');
});

test('Агент: сквозной цикл runEditorialAgent', () => {
  const draft = {
    title: 'Аэлита и тайна "Звезд"',
    scenes: [
      { index: 1, text: 'Жил-был Аэлита (4 года). Аэлита пошел в теплый лес.' },
      { index: 2, text: 'Аэлита увидел свет. "Куда мы идем?" - спросил спутник.' },
      { index: 3, text: 'Сердце Аэлита забилось, но она шагнула вперед и улыбнулся.' },
      { index: 4, text: 'Все вокруг засияло теплым светом.' },
    ],
    questions: [
      { after_scene: 2, question: 'Что почувствовал Аэлита?' },
      { after_scene: 4, question: 'Почему Аэлита был счастлив?' },
    ],
  };

  const result = runEditorialAgent(draft, { childName: 'Аэлита', gender: 'girl', age: 4 });

  assert.ok(result.story.title.includes('«') && result.story.title.includes('»'), 'Заголовок в кавычках-ёлочках');
  assert.ok(result.story.title.includes('Звёзд'), 'Ёфикация в заголовке');
  assert.ok(result.story.scenes[0].text.includes('Аэлита пошла'), 'Согласование глагола для девочки');
  assert.ok(result.story.scenes[0].text.includes('тёплый'), 'Ёфикация слова тёплый');
  assert.ok(result.story.scenes[1].text.includes('Аэлита увидела'), 'увидел -> увидела');
  assert.ok(result.story.scenes[2].text.includes('Сердце Аэлиты'), 'Склонение имени: Сердце Аэлиты');
  assert.ok(result.story.scenes[2].text.includes('улыбнулась'), 'улыбнулся -> улыбнулась');
  assert.ok(result.story.questions[0].question.includes('Аэлита почувствовала') || result.story.questions[0].question.includes('почувствовала Аэлита'), 'Вопрос согласован по роду');
  assert.ok(result.story.metrics.editorial_checked, 'Метка прохождения редактуры выставлена');
});

test('Агент: интеграция одежды, любимой игрушки и особого пожелания родителя', () => {
  const storyWithoutDetails = {
    title: 'Путешествие Миши',
    scenes: [
      { index: 1, text: 'Миша вышел на тропинку и посмотрел по сторонам.' },
      { index: 2, text: 'Впереди показались таинственные деревья.' },
      { index: 3, text: 'Вместе они преодолели преграду.' },
      { index: 4, text: 'На небе мягко засияли добрые звёзды перед сном.' },
    ],
    questions: [
      { after_scene: 2, question: 'Что почувствовал Миша?' },
      { after_scene: 4, question: 'Чему обрадовался Миша?' },
    ],
  };

  const params = {
    childName: 'Миша',
    gender: 'boy',
    age: 4,
    appearance: {
      clothingItem: 'жёлтый дождевик и сапожки',
      clothingColor: 'солнечно-жёлтый',
      toy: 'плюшевый динозаврик',
    },
    customWishes: 'построить домик из кораллов для морской черепашки',
  };

  const result = runEditorialAgent(storyWithoutDetails, params);

  // Проверяем одежду в первой сцене
  assert.ok(
    result.story.scenes[0].text.toLowerCase().includes('дождевик') ||
    result.story.scenes[0].text.toLowerCase().includes('сапожк'),
    'Одежда героя добавлена в текст 1-й сцены'
  );

  // Проверяем любимую игрушку в первой сцене
  assert.ok(
    result.story.scenes[0].text.toLowerCase().includes('динозавр'),
    'Любимая игрушка-спутник вплетена в 1-ю сцену'
  );

  // Проверяем особое пожелание родителя в 3-й сцене
  assert.ok(
    result.story.scenes[2].text.toLowerCase().includes('коралл') ||
    result.story.scenes[2].text.toLowerCase().includes('черепаш'),
    'Особое пожелание родителя исполнено в 3-й сцене'
  );
});
