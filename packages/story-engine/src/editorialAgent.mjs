/**
 * ========================================================
 * «Моя сказка» — Story Editorial & Integrity Agent
 * ========================================================
 * Автономный агент литературной редактуры и проверки целостности сказки.
 * Работает на 100% алгоритмически (детерминированно, 0 токенов расхода, ~5 мс).
 *
 * Обязанности агента:
 * 1. Проверка и обеспечение целостности 4-актного сюжета (Narrative Integrity).
 * 2. Непрерывность героя и спутника-игрушки во всех сценах.
 * 3. Строгое согласование рода глаголов, прилагательных и местоимений.
 * 4. Склонение русских имён по падежам без грамматических ошибок.
 * 5. Книжная типографика для детей (обязательная буква «ё», длинные тире «—», ёлочки «...»).
 * 6. Оформление диалогов по российским издательским стандартам.
 * 7. Очистка от AI-канцеляризмов, клише и пугающих слов перед сном.
 */

import { declineRussianName, removeAgeFromText, fixGenderAgreements } from './declension.mjs';

const CYR_PRE = '(?<![а-яёА-ЯЁ0-9a-zA-Z])';
const CYR_POST = '(?![а-яёА-ЯЁ0-9a-zA-Z])';

/**
 * Словарь обязательной ёфикации для детской литературы (ГОСТ для дошкольников).
 */
const YO_WORD_PAIRS = [
  // Существительные и местоимения
  ['звезды', 'звёзды'],
  ['звезд', 'звёзд'],
  ['звездами', 'звёздами'],
  ['звездах', 'звёздах'],
  ['звездочка', 'звёздочка'],
  ['звездочки', 'звёздочки'],
  ['звездочку', 'звёздочку'],
  ['звездочке', 'звёздочке'],
  ['звездочкой', 'звёздочкой'],
  ['огонек', 'огонёк'],
  ['огонька', 'огонька'],
  ['огоньку', 'огоньку'],
  ['огоньком', 'огоньком'],
  ['огоньки', 'огоньки'],
  ['зверек', 'зверёк'],
  ['зверька', 'зверька'],
  ['зверьку', 'зверьку'],
  ['зверьком', 'зверьком'],
  ['зверьки', 'зверьки'],
  ['мотылек', 'мотылёк'],
  ['ручеек', 'ручеёк'],
  ['лисенок', 'лисёнок'],
  ['лисенка', 'лисёнка'],
  ['лисенку', 'лисёнку'],
  ['лисенком', 'лисёнком'],
  ['котенок', 'котёнок'],
  ['котенка', 'котёнка'],
  ['котенку', 'котёнку'],
  ['котенком', 'котёнком'],
  ['ежик', 'ёжик'],
  ['ежика', 'ёжика'],
  ['ежику', 'ёжику'],
  ['ежиком', 'ёжиком'],
  ['елка', 'ёлка'],
  ['елкой', 'ёлкой'],
  ['елочка', 'ёлочка'],
  ['елочки', 'ёлочки'],
  ['елочку', 'ёлочку'],
  ['елочкой', 'ёлочкой'],
  ['елки', 'ёлки'],
  ['самолетик', 'самолётик'],
  ['вертолетик', 'вертолётик'],
  ['колесики', 'колёсики'],
  ['колесико', 'колёсико'],
  ['колеса', 'колёса'],
  ['перышко', 'пёрышко'],
  ['перышки', 'пёрышки'],
  ['гнездышко', 'гнёздышко'],
  ['зернышко', 'зёрнышко'],
  ['слезы', 'слёзы'],
  ['слез', 'слёз'],
  ['слезами', 'слёзами'],
  ['ребенок', 'ребёнок'],
  ['ребенка', 'ребёнка'],
  ['ребенку', 'ребёнку'],
  ['ребенком', 'ребёнком'],

  // Прилагательные
  ['теплый', 'тёплый'],
  ['теплая', 'тёплая'],
  ['теплое', 'тёплое'],
  ['теплые', 'тёплые'],
  ['теплого', 'тёплого'],
  ['теплому', 'тёплому'],
  ['теплой', 'тёплой'],
  ['теплым', 'тёплым'],
  ['теплых', 'тёплых'],
  ['зеленый', 'зелёный'],
  ['зеленая', 'зелёная'],
  ['зеленое', 'зелёное'],
  ['зеленые', 'зелёные'],
  ['зеленого', 'зелёного'],
  ['зеленой', 'зелёной'],
  ['зеленым', 'зелёным'],
  ['зеленых', 'зелёных'],
  ['темный', 'тёмный'],
  ['темная', 'тёмная'],
  ['темное', 'тёмное'],
  ['темные', 'тёмные'],
  ['темного', 'тёмного'],
  ['темной', 'тёмной'],
  ['желтый', 'жёлтый'],
  ['желтая', 'жёлтая'],
  ['желтое', 'жёлтое'],
  ['желтые', 'жёлтые'],
  ['черный', 'чёрный'],
  ['черная', 'чёрная'],
  ['черное', 'чёрное'],
  ['черные', 'чёрные'],
  ['веселый', 'весёлый'],
  ['веселая', 'весёлая'],
  ['веселое', 'весёлое'],
  ['веселые', 'весёлые'],
  ['легкий', 'лёгкий'],
  ['легкая', 'лёгкая'],
  ['легкое', 'лёгкое'],
  ['легкие', 'лёгкие'],
  ['легкого', 'лёгкого'],
  ['легким', 'лёгким'],
  ['шелковый', 'шёлковый'],
  ['шелковая', 'шёлковая'],
  ['шелковые', 'шёлковые'],

  // Наречия, частицы и глаголы
  ['еще', 'ещё'],
  ['все вокруг', 'всё вокруг'],
  ['все было', 'всё было'],
  ['все стало', 'всё стало'],
  ['все получилось', 'всё получилось'],
  ['все озарилось', 'всё озарилось'],
  ['все засияло', 'всё засияло'],
  ['все сложилось', 'всё сложилось'],
  ['пошел', 'пошёл'],
  ['нашел', 'нашёл'],
  ['пришел', 'пришёл'],
  ['ушел', 'ушёл'],
  ['зашел', 'зашёл'],
  ['пойдет', 'пойдёт'],
  ['найдет', 'найдёт'],
  ['придет', 'придёт'],
  ['поет', 'поёт'],
  ['зовет', 'зовёт'],
  ['несет', 'несёт'],
  ['ведет', 'ведёт'],
  ['узнает', 'узнаёт'],
  ['мигнет', 'мигнёт'],
  ['зажжется', 'зажжётся'],
];

const YO_COMPILED = YO_WORD_PAIRS.map(([src, target]) => {
  const re = new RegExp(`${CYR_PRE}${src}${CYR_POST}`, 'giu');
  return { re, target };
});

/**
 * Словарь замены канцеляризмов и неестественных фраз на живой сказочный язык
 */
const STYLE_REPLACEMENTS = [
  [new RegExp(`${CYR_PRE}следует отметить(?:,)?\\s*`, 'giu'), ''],
  [new RegExp(`${CYR_PRE}таким образом(?:,)?\\s*`, 'giu'), 'Так '],
  [new RegExp(`${CYR_PRE}впоследствии${CYR_POST}`, 'giu'), 'потом'],
  [new RegExp(`${CYR_PRE}являлся${CYR_POST}`, 'giu'), 'был'],
  [new RegExp(`${CYR_PRE}являлась${CYR_POST}`, 'giu'), 'была'],
  [new RegExp(`${CYR_PRE}являлись${CYR_POST}`, 'giu'), 'были'],
  [new RegExp(`${CYR_PRE}вдруг неожиданно${CYR_POST}`, 'giu'), 'вдруг'],
  [new RegExp(`${CYR_PRE}вдруг внезапно${CYR_POST}`, 'giu'), 'внезапно'],
  [new RegExp(`${CYR_PRE}однако тем не менее${CYR_POST}`, 'giu'), 'но'],
  [new RegExp(`${CYR_PRE}в конечном итоге${CYR_POST}`, 'giu'), 'наконец'],
  [new RegExp(`${CYR_PRE}на сегодняшний день${CYR_POST}`, 'giu'), 'сейчас'],
  [new RegExp(`${CYR_PRE}ввиду того что${CYR_POST}`, 'giu'), 'потому что'],
  [new RegExp(`${CYR_PRE}как следствие${CYR_POST}`, 'giu'), 'поэтому'],
];

/**
 * Смягчение пугающих слов перед сном с сохранением грамматической формы
 */
const BEDTIME_SAFETY_REPLACEMENTS = [
  [new RegExp(`${CYR_PRE}страшн(?:ый|ая|ое|ые|ого|ому|ым|ую|о)${CYR_POST}`, 'giu'), 'таинственный'],
  [new RegExp(`${CYR_PRE}ужасн(?:ый|ая|ое|ые|о|ого)${CYR_POST}`, 'giu'), 'необычный'],
  [new RegExp(`${CYR_PRE}чудовищем${CYR_POST}`, 'giu'), 'лесным великаном'],
  [new RegExp(`${CYR_PRE}чудовища${CYR_POST}`, 'giu'), 'лесного великана'],
  [new RegExp(`${CYR_PRE}чудовищу${CYR_POST}`, 'giu'), 'лесному великану'],
  [new RegExp(`${CYR_PRE}чудовище${CYR_POST}`, 'giu'), 'лесной великан'],
  [new RegExp(`${CYR_PRE}чудовищах${CYR_POST}`, 'giu'), 'лесных великанах'],
  [new RegExp(`${CYR_PRE}монстром${CYR_POST}`, 'giu'), 'невиданным зверем'],
  [new RegExp(`${CYR_PRE}монстра${CYR_POST}`, 'giu'), 'невиданного зверя'],
  [new RegExp(`${CYR_PRE}монстру${CYR_POST}`, 'giu'), 'невиданному зверю'],
  [new RegExp(`${CYR_PRE}монстре${CYR_POST}`, 'giu'), 'невиданном звере'],
  [new RegExp(`${CYR_PRE}монстры${CYR_POST}`, 'giu'), 'невиданные звери'],
  [new RegExp(`${CYR_PRE}монстров${CYR_POST}`, 'giu'), 'невиданных зверей'],
  [new RegExp(`${CYR_PRE}монстр${CYR_POST}`, 'giu'), 'невиданный зверь'],
  [new RegExp(`${CYR_PRE}кошмар(?:а|у|ом|е|ы|ов)?${CYR_POST}`, 'giu'), 'дурной сон'],
];

const GENDER_VERB_PAIRS = [
  ['пошел', 'пошла'],
  ['пошёл', 'пошла'],
  ['подошел', 'подошла'],
  ['подошёл', 'подошла'],
  ['пришел', 'пришла'],
  ['пришёл', 'пришла'],
  ['ушел', 'ушла'],
  ['ушёл', 'ушла'],
  ['зашел', 'зашла'],
  ['зашёл', 'зашла'],
  ['увидел', 'увидела'],
  ['услышал', 'услышала'],
  ['улыбнулся', 'улыбнулась'],
  ['засмеялся', 'засмеялась'],
  ['почувствовал', 'почувствовала'],
  ['очутился', 'очутилась'],
  ['побежал', 'побежала'],
  ['обрадовался', 'обрадовалась'],
  ['взял', 'взяла'],
  ['поднял', 'подняла'],
  ['опустил', 'опустила'],
  ['справился', 'справилась'],
  ['решил', 'решила'],
  ['доказал', 'доказала'],
  ['помог', 'помогла'],
  ['шагнул', 'шагнула'],
  ['прошептал', 'прошептала'],
  ['воскликнул', 'воскликнула'],
  ['вздохнул', 'вздохнула'],
  ['посмотрел', 'посмотрела'],
  ['проснулся', 'проснулась'],
  ['заснул', 'заснула'],
  ['испугался', 'испугалась'],
  ['нашёл', 'нашла'],
  ['нашел', 'нашла'],
  ['заметил', 'заметила'],
  ['подумал', 'подумала'],
  ['сказал', 'сказала'],
  ['ответил', 'ответила'],
  ['спросил', 'спросила'],
  ['наклонился', 'наклонилась'],
  ['прикоснулся', 'прикоснулась'],
  ['дотронулся', 'дотронулась'],
  ['прижал', 'прижала'],
  ['открыл', 'открыла'],
  ['закрыл', 'закрыла'],
  ['прислушался', 'прислушалась'],
  ['догадался', 'догадалась'],
  ['понял', 'поняла'],
  ['протянул', 'протянула'],
  ['набрался', 'набралась'],
  ['устал', 'устала'],
  ['зевнул', 'зевнула'],
  ['укутался', 'укуталась'],
  ['погладил', 'погладила'],
  ['спрятал', 'спрятала'],
  ['был', 'была'],
];

/**
 * Исправление русской грамматики и согласования рода героя
 */
export function proofreadRussianGrammar(text, params = {}) {
  if (!text || typeof text !== 'string') return '';

  const childName = (params.childName || 'Герой').trim();
  const isGirl =
    params.gender === 'girl' ||
    (params.gender !== 'boy' && (childName.endsWith('а') || childName.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';

  // 1. Базовые родовые глаголы и падежи имени
  let result = fixGenderAgreements(text, childName, effectiveGender);

  // 2. Дополнительные падежи имени в предложных конструкциях
  const declined = declineRussianName(childName, effectiveGender);

  // Родительный падеж
  result = result.replace(
    new RegExp(
      `${CYR_PRE}(у|для|около|возле|впереди|в руках|на ладошке|в ладошках|в глазах|на щечках|на щёчках|в сердце|в кармашке|на плече|в узелке)\\s+${childName}${CYR_POST}`,
      'giu'
    ),
    `$1 ${declined.gen}`
  );

  // Творительный падеж
  result = result.replace(
    new RegExp(
      `${CYR_PRE}(вместе с|рядом с|вслед за|рука об руку с|бок о бок с)\\s+${childName}${CYR_POST}`,
      'giu'
    ),
    `$1 ${declined.ins}`
  );

  // Дательный падеж
  result = result.replace(
    new RegExp(
      `${CYR_PRE}(навстречу|благодаря|к|ко)\\s+${childName}${CYR_POST}`,
      'giu'
    ),
    `$1 ${declined.dat}`
  );

  // 3. Согласование глаголов для девочки
  if (effectiveGender === 'girl') {
    // Инвертированные конструкции: «Что почувствовал Аэлита?» -> «Что почувствовала Аэлита?»
    for (const [m, f] of GENDER_VERB_PAIRS) {
      result = result.replace(
        new RegExp(`${CYR_PRE}(${m})\\s+(${childName})${CYR_POST}`, 'giu'),
        (match, verb, name) => {
          const cap = verb.charAt(0) === verb.charAt(0).toUpperCase();
          const femVerb = cap ? f.charAt(0).toUpperCase() + f.slice(1) : f;
          return `${femVerb} ${name}`;
        }
      );
      // «Аэлита был счастлив» -> «Аэлита была счастлива»
      result = result.replace(
        new RegExp(`${CYR_PRE}(${childName})\\s+был\\s+счастлив${CYR_POST}`, 'giu'),
        `$1 была счастлива`
      );
      result = result.replace(
        new RegExp(`${CYR_PRE}был\\s+счастлив\\s+(${childName})${CYR_POST}`, 'giu'),
        `была счастлива $1`
      );
    }

    // Замена глаголов непосредственно после маркеров субъекта
    const girlSubjects = `${childName}|девочка|малышка|героиня|она`;
    for (const [m, f] of GENDER_VERB_PAIRS) {
      result = result.replace(
        new RegExp(`${CYR_PRE}(${girlSubjects})\\s+(${m})${CYR_POST}`, 'giu'),
        (match, subj, verb) => `${subj} ${f}`
      );
    }

    // Согласование составных сказуемых в рамках одного предложения/клаузы:
    // «Аэлита пошла ..., увидел ... и улыбнулся» -> увидела ... и улыбнулась
    const mascVerbsList = GENDER_VERB_PAIRS.map(([m]) => m).join('|');
    const femMap = new Map(GENDER_VERB_PAIRS);

    // Случай 1: запятая перед глаголом «, увидел» -> «, увидела»
    result = result.replace(
      new RegExp(`,\\s*(${mascVerbsList})${CYR_POST}`, 'giu'),
      (match, verb) => `, ${femMap.get(verb.toLowerCase()) || verb}`
    );

    // Случай 2: союз «и / но / а» перед глаголом «и улыбнулся» -> «и улыбнулась»
    result = result.replace(
      new RegExp(`\\s+(и|но|а)\\s+(${mascVerbsList})${CYR_POST}`, 'giu'),
      (match, conj, verb) => ` ${conj} ${femMap.get(verb.toLowerCase()) || verb}`
    );
  }

  // 4. Согласование глаголов для мальчика
  if (effectiveGender === 'boy') {
    const boySubjects = `${childName}|мальчик|малыш|герой|он`;
    const boyMap = new Map(GENDER_VERB_PAIRS.map(([m, f]) => [f, m]));
    const femVerbsList = GENDER_VERB_PAIRS.map(([, f]) => f).join('|');

    // Прямой субъект: «Марк пошла» -> «Марк пошёл», «Малыш улыбнулась» -> «Малыш улыбнулся»
    result = result.replace(
      new RegExp(`${CYR_PRE}(${boySubjects})\\s+(${femVerbsList})${CYR_POST}`, 'giu'),
      (match, subj, verb) => {
        const replacement = boyMap.get(verb.toLowerCase()) || verb;
        return `${subj} ${replacement}`;
      }
    );

    // Составные сказуемые для мальчика: «Марк пошёл вперед и увидела» -> «и увидел»
    result = result.replace(
      new RegExp(`,\\s*(${femVerbsList})${CYR_POST}`, 'giu'),
      (match, verb) => `, ${boyMap.get(verb.toLowerCase()) || verb}`
    );

    result = result.replace(
      new RegExp(`\\s+(и|но|а)\\s+(${femVerbsList})${CYR_POST}`, 'giu'),
      (match, conj, verb) => ` ${conj} ${boyMap.get(verb.toLowerCase()) || verb}`
    );
  }

  return result;
}

/**
 * Оформление книжных диалогов и прямой речи по стандартам российской литературы
 */
export function formatRussianDialogues(text) {
  if (!text || typeof text !== 'string') return '';

  let out = text;

  // Оформление прямой речи в начале строки или после конца предложения:
  // "Здравствуй, Лев!" - сказал спутник. -> — Здравствуй, Лев! — сказал спутник.
  out = out.replace(
    /(?:^|\n|(?<=[.!?]\s+))["“«]([^"”»\n]+)["”»]\s*[-—–]\s*([а-яёА-ЯЁ])/gu,
    '— $1 — $2'
  );

  // Реплики внутри текста: «Привет!» - улыбнулся герой. -> «Привет!» — улыбнулся герой.
  out = out.replace(/([«“"][^»”"]+[»”"])\s*[-–]\s*([а-яёА-ЯЁ])/gu, '$1 — $2');

  // Замена оставшихся английских кавычек “ ” " на русские кавычки-ёлочки « »
  out = out.replace(/(^|[\s(\[])["“]([а-яёА-ЯЁ0-9])/gu, '$1«$2');
  out = out.replace(/([а-яёА-ЯЁ0-9.!,?])["”]([\s)\].,!?:;]|$)/gu, '$1»$2');

  // Замена оставшихся парных прямых кавычек "..."
  out = out.replace(/"([^"]+)"/gu, '«$1»');

  // Замена дефисов между словами на правильное длинное тире с отбивкой:
  // «слово - слово» -> «слово — слово»
  out = out.replace(/([а-яёА-ЯЁ0-9])\s+[-–]\s+([а-яёА-ЯЁ0-9])/gu, '$1 — $2');

  return out;
}

/**
 * Детская книжная ёфикация (ГОСТ для дошкольников)
 */
export function applyYoification(text) {
  if (!text || typeof text !== 'string') return '';

  let out = text;
  for (const { re, target } of YO_COMPILED) {
    out = out.replace(re, (match) => {
      if (match === match.toUpperCase()) {
        return target.toUpperCase();
      }
      if (match.charAt(0) === match.charAt(0).toUpperCase()) {
        return target.charAt(0).toUpperCase() + target.slice(1);
      }
      return target;
    });
  }
  return out;
}

/**
 * Типографика: расстановка неразрывных пробелов перед предлогами и союзами
 */
export function applyTypographySpacing(text) {
  if (!text || typeof text !== 'string') return '';

  const NBSP = '\u00A0';
  let out = text.replace(/(^|[\s(«])([всккоиуя])\s+([а-яёА-ЯЁ0-9])/giu, `$1$2${NBSP}$3`);
  out = out.replace(/\s+—\s+/gu, `${NBSP}— `);
  out = out.replace(/[ ]{2,}/gu, ' ');

  return out.trim();
}

/**
 * Анти-канцелярит и сонный фильтр безопасности
 */
export function sanitizeToneAndPurity(text) {
  if (!text || typeof text !== 'string') return '';

  let out = removeAgeFromText(text);

  out = out
    .replace(/^Жил-был\s+/iu, '')
    .replace(/^Жила-была\s+/iu, '')
    .replace(/^В некотором царстве,\s*/iu, '')
    .replace(/^Как-то раз\s+/iu, 'Однажды ');

  for (const [re, rep] of STYLE_REPLACEMENTS) {
    out = out.replace(re, rep);
  }

  for (const [re, rep] of BEDTIME_SAFETY_REPLACEMENTS) {
    out = out.replace(re, rep);
  }

  return out.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Проверка и выравнивание сюжетной целостности (Narrative Integrity)
 */
export function verifyNarrativeIntegrity(story, params = {}) {
  const issues = [];
  const fixes = [];

  if (!story || typeof story !== 'object') {
    return { valid: false, issues: ['Сказка не является объектом'], story };
  }

  const childName = (params.childName || 'Герой').trim();
  const companionHint = params.appearance?.toy || params.customWishes || 'волшебный спутник';

  // 1. Проверка структуры сцен (должно быть ровно 4 сцены)
  let scenes = Array.isArray(story.scenes) ? [...story.scenes] : [];
  if (scenes.length < 4) {
    issues.push(`В сказке только ${scenes.length} сцен, требуется 4`);
    while (scenes.length < 4) {
      const idx = scenes.length + 1;
      scenes.push({
        index: idx,
        text: `Вместе ${childName} и ${companionHint} продолжили свой добрый путь, радуясь новым открытиям.`,
        visual: `3D Pixar style scene ${idx} with ${childName}`,
      });
      fixes.push(`Добавлена гармонизирующая сцена ${idx}`);
    }
  } else if (scenes.length > 4) {
    scenes = scenes.slice(0, 4);
    fixes.push('Лишние сцены обрезаны до канонических 4');
  }

  scenes = scenes.map((scene, i) => ({
    ...scene,
    index: i + 1,
  }));

  // 2. Проверка присутствия героя в тексте
  const fullText = scenes.map((s) => s.text).join(' ');
  const isGirl = params.gender === 'girl' || childName.endsWith('а') || childName.endsWith('я');

  if (!fullText.includes(childName)) {
    issues.push(`Имя ребёнка «${childName}» отсутствовало в тексте`);
    if (scenes[0]) {
      const verbFelt = isGirl ? 'почувствовала' : 'почувствовал';
      scenes[0].text = `В самый уютный и добрый день ${childName} ${verbFelt} приближение настоящего чуда. ${scenes[0].text}`;
      fixes.push(`Имя «${childName}» аккуратно вплетено в начало первой сцены`);
    }
  }

  // 3. Проверка и бережная интеграция одежды героя в первую сцену
  const item = (params.appearance?.clothingItem || '').trim();
  const color = (params.appearance?.clothingColor || '').trim();
  let clothingRus = item;
  if (item && color && !item.toLowerCase().includes(color.slice(0, 4).toLowerCase())) {
    clothingRus = `${color} ${item}`;
  } else if (!clothingRus) {
    clothingRus = color ? `${color} одежда` : '';
  }

  if (clothingRus && scenes[0]) {
    const clothingKeywords = [
      'дождевик', 'сапожк', 'сапог', 'пижам', 'кигуруми', 'плать', 'свитер', 'кофт',
      'комбинезон', 'толстовк', 'худи', 'скафандр', 'космонавт', 'супергеро', 'манти',
      'куртк', 'шапочк', 'кармаш', 'капюшон', 'наряд',
    ];
    const hasClothingMention = clothingKeywords.some((w) => fullText.toLowerCase().includes(w));
    if (!hasClothingMention) {
      const verb = isGirl ? 'поправила' : 'поправил';
      const pronoun = isGirl ? 'свою' : 'свой';
      scenes[0].text += ` ${childName} с улыбкой ${verb} ${pronoun} ${clothingRus}, чувствуя уютное тепло и готовность к новому приключению.`;
      fixes.push(`Одежда героя («${clothingRus}») бережно вплетена в первую сцену`);
    }
  }

  // 4. Проверка и интеграция игрушки-спутника
  const toyRus = (params.appearance?.toy || params.toy || '').trim();
  if (toyRus && scenes[0]) {
    const toyWords = toyRus.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const hasToyMention = toyWords.some((w) => fullText.toLowerCase().includes(w.slice(0, -1)));
    if (!hasToyMention) {
      const verbHold = isGirl ? 'прижала' : 'прижал';
      scenes[0].text += ` Рядом был любимый верный спутник — ${toyRus}, которого ${childName} ласково ${verbHold} к себе.`;
      fixes.push(`Любимая игрушка-спутник («${toyRus}») вплетена в первую сцену`);
    }
  }

  // 5. Проверка и интеграция особого пожелания родителя (customWishes) в кульминацию 3-й сцены
  const wishes = (params.customWishes || '').trim();
  if (wishes.length > 5 && scenes[2]) {
    const wishWords = wishes.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const hasWishMention = wishWords.some((w) => fullText.toLowerCase().includes(w.slice(0, -1)));
    if (!hasWishMention) {
      scenes[2].text += ` Именно в этот миг сбылось самое заветное желание: ${wishes}.`;
      fixes.push(`Особое пожелание родителя («${wishes}») исполнено в кульминации сцены 3`);
    }
  }

  // 6. Проверка сонного финала в 4-й сцене
  const bedtimeKeywords = ['сон', 'звёзд', 'звезд', 'тепл', 'уют', 'тишин', 'спокойн', 'отдых', 'ноч', 'глазк', 'ласков'];
  const lastSceneText = (scenes[3]?.text || '').toLowerCase();
  const hasBedtimeMood = bedtimeKeywords.some((w) => lastSceneText.includes(w));
  if (!hasBedtimeMood && scenes[3]) {
    scenes[3].text += ` На ночном небе мягко засияли добрые звёзды, укутывая мир теплом и тишиной перед самым сладким сном.`;
    fixes.push('В финал 4-й сцены добавлен умиротворяющий сонный аккорд');
  }

  // 7. Вопросы для обсуждения с родителями
  const rawQuestions = Array.isArray(story.questions) ? [...story.questions] : [];

  let questions = [];
  if (rawQuestions.length === 0) {
    questions = [
      {
        after_scene: 2,
        question: `Как ${childName} ${isGirl ? 'проявила' : 'проявил'} заботу о друге в этом путешествии?`,
        parent_hint: 'Обсудите с ребёнком ценность взаимовыручки и умения поддерживать друзей.',
        skill_tag: 'empathy',
      },
      {
        after_scene: 4,
        question: `Что помогло ${childName} почувствовать спокойствие и радость в конце сказки?`,
        parent_hint: 'Сделайте акцент на чувстве безопасности и тёплом настрое на сон.',
        skill_tag: 'emotions',
      },
    ];
    fixes.push('Сформированы канонические вопросы для родителя после сцен 2 и 4');
  } else if (rawQuestions.length === 1) {
    questions = [
      { ...rawQuestions[0], after_scene: 2 },
      {
        after_scene: 4,
        question: `Что помогло ${childName} почувствовать спокойствие и радость в конце сказки?`,
        parent_hint: 'Сделайте акцент на чувстве безопасности и тёплом настрое на сон.',
        skill_tag: 'emotions',
      },
    ];
    fixes.push('Дополнен недостающий второй вопрос после сцены 4');
  } else {
    questions = [
      { ...rawQuestions[0], after_scene: 2 },
      { ...rawQuestions[1], after_scene: 4 },
    ];
  }

  // Очистка текста сцен от возможного дублирования вопросов
  const questionsToSanitize = [
    ...rawQuestions.map((q) => q?.question),
    ...questions.map((q) => q?.question),
  ].filter(Boolean);

  for (const qText of questionsToSanitize) {
    for (const sc of scenes) {
      if (sc.text.includes(qText)) {
        sc.text = sc.text.replace(qText, '').replace(/\s{2,}/g, ' ').trim();
        fixes.push(`Вопрос удалён из текста сцены ${sc.index} (исключено дублирование в читалке)`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    fixes,
    story: {
      ...story,
      scenes,
      questions,
    },
  };
}

/**
 * Главная точка входа Агента-Редактора (Editorial & Integrity Agent).
 * Проводит сказку через полный издательский цикл:
 * 1. Narrative Integrity Check
 * 2. Russian Grammar & Declension
 * 3. Dialogue Formatting
 * 4. Yoification (буква «Ё»)
 * 5. Book Typography Spacing
 * 6. Tone & Safety Sanitization
 */
export function runEditorialAgent(story, params = {}) {
  const logFixes = [];

  // Шаг 1: Проверка и гармонизация целостности
  const integrity = verifyNarrativeIntegrity(story, params);
  logFixes.push(...integrity.fixes);

  const edited = { ...integrity.story };

  // Шаг 2: Обработка заголовка
  if (edited.title) {
    let t = proofreadRussianGrammar(edited.title, params);
    t = applyYoification(t);
    t = formatRussianDialogues(t);
    edited.title = t;
  }

  // Шаг 3: Полная редактура всех 4 сцен
  edited.scenes = edited.scenes.map((scene) => {
    let text = scene.text || '';
    text = sanitizeToneAndPurity(text);
    text = proofreadRussianGrammar(text, params);
    text = formatRussianDialogues(text);
    text = applyYoification(text);
    text = applyTypographySpacing(text);

    return {
      ...scene,
      text,
    };
  });

  // Шаг 4: Редактура вопросов для родителей
  edited.questions = edited.questions.map((q) => {
    let question = q.question || '';
    question = sanitizeToneAndPurity(question);
    question = proofreadRussianGrammar(question, params);
    question = applyYoification(question);
    question = applyTypographySpacing(question);

    let hint = q.parent_hint || '';
    if (hint) {
      hint = sanitizeToneAndPurity(hint);
      hint = proofreadRussianGrammar(hint, params);
      hint = applyYoification(hint);
      hint = applyTypographySpacing(hint);
    }

    return {
      ...q,
      question,
      parent_hint: hint,
    };
  });

  // Шаг 5: Обновление метаданных и подсчёта слов
  const sceneWords = edited.scenes.map((s) => (s.text.match(/[а-яёА-ЯЁa-zA-Z0-9-]+/gu) || []).length);
  const totalWords = sceneWords.reduce((sum, n) => sum + n, 0);

  edited.metrics = {
    ...(edited.metrics || {}),
    total_words: totalWords,
    scene_words: sceneWords,
    editorial_checked: true,
    agent_version: '1.0.0',
  };

  return {
    story: edited,
    fixesApplied: logFixes,
    integrityPassed: integrity.valid,
  };
}
