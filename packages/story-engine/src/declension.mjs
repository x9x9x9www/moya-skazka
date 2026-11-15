/**
 * Модуль русской грамматики и склонения имён для детских сказок.
 * Обеспечивает строгое согласование рода, падежей и удаление технических метаданных.
 */

/**
 * Определение правильного предлога («о» или «об») перед словом в русском языке.
 * Перед чистыми гласными (а, и, о, у, э) используется «об»,
 * перед согласными и йотированными гласными (е, ё, ю, я) — «о».
 * @param {string} word
 * @returns {'об' | 'о'}
 */
export function getOPreposition(word) {
  const first = (word || '').trim().charAt(0).toLowerCase();
  return ['а', 'и', 'о', 'у', 'э'].includes(first) ? 'об' : 'о';
}

const FEMININE_CONSONANT_NAMES = new Set([
  'любовь', 'николь', 'кармен', 'рахиль', 'руфь', 'адель', 'элис', 'эстер', 'эдит',
  'инес', 'жизель', 'шанталь', 'мишель', 'сесиль', 'нинель', 'жаклин', 'жанетт',
  'изабель', 'кэтрин', 'хелен', 'элен', 'кристин', 'моник', 'флоренс',
]);

function unchangedDeclension(name) {
  const prep = getOPreposition(name);
  return { nom: name, gen: name, dat: name, acc: name, ins: name, prep: `${prep} ${name}` };
}

function resolveNameGender(name, gender) {
  if (gender === 'boy' || gender === 'girl') return gender;
  return inferRussianNameGender(name) || 'boy';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Подсчёт реальных слов в тексте (кириллица, латиница, слова с дефисом).
 * Исключает стоящие отдельно знаки пунктуации (тире «—», многоточия «…»).
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return (text.match(/[а-яёА-ЯЁa-zA-Z0-9-]+/gu) || []).length;
}

/**
 * Склонение русского имени по падежам
 * @param {string} name - Имя ребёнка (например, «Аэлита», «Миша», «Марк»)
 * @param {'boy' | 'girl' | string} gender - Пол ребёнка
 * @returns {{ nom: string, gen: string, dat: string, acc: string, ins: string, prep: string }}
 */
export function declineRussianName(name, gender = '') {
  if (!name || typeof name !== 'string') {
    return { nom: 'Малыш', gen: 'Малыша', dat: 'Малышу', acc: 'Малыша', ins: 'Малышом', prep: 'о Малыше' };
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return { nom: 'Малыш', gen: 'Малыша', dat: 'Малышу', acc: 'Малыша', ins: 'Малышом', prep: 'о Малыше' };
  }
  if (!canDeclineRussianName(trimmed, gender)) return unchangedDeclension(trimmed);

  const lower = trimmed.toLowerCase();
  const lastChar = lower.slice(-1);
  const lastTwo = lower.slice(-2);
  const stem = trimmed.slice(0, -1);
  const effectiveGender = resolveNameGender(trimmed, gender);
  const stemTwo = trimmed.slice(0, -2);
  const prep = getOPreposition(trimmed);

  // 1. Имена на -ия (София, Мария, Амелия, Аглая...)
  if (lastTwo === 'ия') {
    return {
      nom: trimmed,
      gen: `${stemTwo}ии`,
      dat: `${stemTwo}ии`,
      acc: `${stemTwo}ию`,
      ins: `${stemTwo}ией`,
      prep: `${prep} ${stemTwo}ии`,
    };
  }

  // 2. Имена на -а (Аэлита, Алиса, Даша, Маша, Миша, Саша, Ева...)
  if (lastChar === 'а') {
    // После шипящих (ж, ч, ш, щ, г, к, х) в род. падеже 'и', а не 'ы'
    const prevChar = lower.charAt(lower.length - 2);
    const useI = ['ж', 'ч', 'ш', 'щ', 'г', 'к', 'х'].includes(prevChar);
    const isSibilant = ['ж', 'ч', 'ш', 'щ', 'ц'].includes(prevChar);
    return {
      nom: trimmed,
      gen: `${stem}${useI ? 'и' : 'ы'}`,
      dat: `${stem}е`,
      acc: `${stem}у`,
      ins: `${stem}${isSibilant ? 'ей' : 'ой'}`,
      prep: `${prep} ${stem}е`,
    };
  }

  // 3. Имена на -я (Оля, Аня, Настя, Ваня, Илья...)
  if (lastChar === 'я') {
    return {
      nom: trimmed,
      gen: `${stem}и`,
      dat: `${stem}е`,
      acc: `${stem}ю`,
      ins: `${stem}ей`,
      prep: `${prep} ${stem}е`,
    };
  }

  // 4. Исключения с беглыми гласными: Лев, Павел, Пётр
  if (lower === 'лев') {
    const isCap = trimmed[0] === trimmed[0].toUpperCase();
    const l = isCap ? 'Л' : 'л';
    return {
      nom: trimmed,
      gen: `${l}ьва`,
      dat: `${l}ьву`,
      acc: `${l}ьва`,
      ins: `${l}ьвом`,
      prep: `о ${l}ьве`,
    };
  }
  if (lower === 'павел') {
    const isCap = trimmed[0] === trimmed[0].toUpperCase();
    const p = isCap ? 'Павл' : 'павл';
    return {
      nom: trimmed,
      gen: `${p}а`,
      dat: `${p}у`,
      acc: `${p}а`,
      ins: `${p}ом`,
      prep: `о ${p}е`,
    };
  }
  if (lower === 'пётр' || lower === 'петр') {
    const isCap = trimmed[0] === trimmed[0].toUpperCase();
    const p = isCap ? 'Петр' : 'петр';
    return {
      nom: trimmed,
      gen: `${p}а`,
      dat: `${p}у`,
      acc: `${p}а`,
      ins: `${p}ом`,
      prep: `о ${p}е`,
    };
  }

  // 5. Мужские имена на согласный (Марк, Артём, Роман, Даниил...)
  if (effectiveGender === 'boy') {
    if (lastChar === 'й') {
      return {
        nom: trimmed,
        gen: `${stem}я`,
        dat: `${stem}ю`,
        acc: `${stem}я`,
        ins: `${stem}ем`,
        prep: `${prep} ${stem}е`,
      };
    }
    if (lastChar === 'ь') {
      return {
        nom: trimmed,
        gen: `${stem}я`,
        dat: `${stem}ю`,
        acc: `${stem}я`,
        ins: `${stem}ем`,
        prep: `${prep} ${stem}е`,
      };
    }
    return {
      nom: trimmed,
      gen: `${trimmed}а`,
      dat: `${trimmed}у`,
      acc: `${trimmed}а`,
      ins: `${trimmed}ом`,
      prep: `${prep} ${trimmed}е`,
    };
  }

  // Имена, не поддающиеся стандартному склонению (Николь, Кармен, Эли)
  return {
    nom: trimmed,
    gen: trimmed,
    dat: trimmed,
    acc: trimmed,
    ins: trimmed,
    prep: `${prep} ${trimmed}`,
  };
}

/**
 * Проверка возможности 100% надёжного склонения русского имени.
 * Если имя иностранное, составное или несклоняемое — возвращает false (Zero-Grammar-Risk).
 * @param {string} name
 * @param {'boy' | 'girl' | string} gender
 * @returns {boolean}
 */
export function canDeclineRussianName(name, gender = 'boy') {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  // Decline only a single Cyrillic name with a supported, predictable ending.
  if (!/^[а-яёА-ЯЁ]+$/u.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  const lastChar = lower.slice(-1);
  if (lower === 'лев' && resolveNameGender(trimmed, gender) === 'boy') return true;
  if (FEMININE_CONSONANT_NAMES.has(lower)) return false;
  if (['о', 'е', 'и', 'у', 'ю', 'э', 'ы'].includes(lastChar)) return false;
  if (resolveNameGender(trimmed, gender) === 'girl' && !['а', 'я'].includes(lastChar)) return false;
  return ['а', 'я', 'й', 'ь'].includes(lastChar) || /[бвгджзклмнпрстфхцчшщ]$/u.test(lower);
}

/**
 * Безопасное формирование конструкции «для кого» с Zero-Grammar-Risk фоллбэком.
 * Если имя не склоняется со 100% надёжностью, возвращает конструкцию в именительном падеже:
 * «героиня — Аэлита» (или «для Аэлиты»).
 * @param {string} name
 * @param {'boy' | 'girl' | string} gender
 * @returns {string}
 */
export function formatSafeForWhom(name, gender = 'boy') {
  if (!name || typeof name !== 'string') {
    return gender === 'girl' ? 'для малышки' : 'для малыша';
  }
  const trimmed = name.trim();
  const effectiveGender = resolveNameGender(trimmed, gender);
  const isGirl = effectiveGender === 'girl';
  if (!canDeclineRussianName(trimmed, effectiveGender)) {
    return isGirl ? `героиня — ${trimmed}` : `герой — ${trimmed}`;
  }
  const declined = declineRussianName(trimmed, effectiveGender);
  if (declined.gen === trimmed) {
    return isGirl ? `героиня — ${trimmed}` : `герой — ${trimmed}`;
  }
  return `для ${declined.gen}`;
}

/**
 * Заголовок создания сказки с Zero-Grammar-Risk фоллбэком:
 * «Создаём сказку для Аэлиты» или «Создаём сказку. Главная героиня — Аэлита».
 * @param {string} name
 * @param {'boy' | 'girl' | string} gender
 * @returns {string}
 */
export function formatSafeCreationHeader(name, gender = 'boy') {
  if (!name || typeof name !== 'string') {
    return gender === 'girl' ? 'Создаём сказку для малышки' : 'Создаём сказку для малыша';
  }
  const trimmed = name.trim();
  const effectiveGender = resolveNameGender(trimmed, gender);
  const isGirl = effectiveGender === 'girl';
  if (!canDeclineRussianName(trimmed, effectiveGender)) {
    return `Создаём сказку. Главн${isGirl ? 'ая героиня' : 'ый герой'} — ${trimmed}`;
  }
  const declined = declineRussianName(trimmed, effectiveGender);
  if (declined.gen === trimmed) {
    return `Создаём сказку. Главн${isGirl ? 'ая героиня' : 'ый герой'} — ${trimmed}`;
  }
  return `Создаём сказку для ${declined.gen}`;
}

/**
 * Определение вероятного пола ребёнка по имени
 * @param {string} name
 * @returns {'boy' | 'girl' | null}
 */
export function inferRussianNameGender(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim().toLowerCase();
  if (trimmed.length < 2) return null;

  const maleNamesOnAorYa = new Set([
    'миша', 'саша', 'паша', 'ваня', 'даня', 'илья', 'никита', 'лёва', 'лева',
    'сеня', 'тёма', 'тема', 'коля', 'дима', 'серёжа', 'сережа', 'рома', 'гоша',
    'юра', 'гриша', 'федя', 'лука', 'кузьма', 'тима', 'жора', 'стёпа', 'степа',
    'влад', 'женя', 'слава', 'боря', 'илюша', 'матвейка',
  ]);

  if (maleNamesOnAorYa.has(trimmed)) {
    return 'boy';
  }

  const femaleExceptions = new Set([
    ...FEMININE_CONSONANT_NAMES,
    'алиса',
  ]);
  if (femaleExceptions.has(trimmed)) {
    return 'girl';
  }

  const lastChar = trimmed.slice(-1);
  if (lastChar === 'а' || lastChar === 'я') {
    return 'girl';
  }

  const maleConsonants = new Set([
    'б', 'в', 'г', 'д', 'ж', 'з', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'й'
  ]);
  if (maleConsonants.has(lastChar)) {
    return 'boy';
  }

  return null;
}

/**
 * Очистка текста от технических скобок возраста: «(4 года)», «(5)», «(3 лет)»
 */
export function removeAgeFromText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\(\s*\d+\s*(?:года|лет|год)?\s*\)/gi, '')
    .replace(/\b\d+\s*(?:года|лет)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Исправление родовых согласований в русском тексте
 */
export function fixGenderAgreements(text, arg2 = 'Герой', arg3 = 'boy') {
  if (!text || typeof text !== 'string') return '';
  let clean = removeAgeFromText(text);

  let childName = 'Герой';
  let gender = 'boy';
  if (arg2 === 'boy' || arg2 === 'girl') {
    gender = arg2;
    childName = typeof arg3 === 'string' && arg3.trim() ? arg3.trim() : 'Герой';
  } else {
    childName = typeof arg2 === 'string' && arg2.trim() ? arg2.trim() : 'Герой';
    gender = arg3 === 'girl' ? 'girl' : 'boy';
  }

  const effectiveGender = resolveNameGender(childName, gender);
  const isGirl = effectiveGender === 'girl';
  const declined = declineRussianName(childName, effectiveGender);
  const escapedChildName = escapeRegExp(childName);

  const CYR_PRE = '(?<![а-яёА-ЯЁ])';
  const CYR_POST = '(?![а-яёА-ЯЁ])';

  // Склоняем только уверенно распознанные имена; остальные оставляем без изменений.
  if (canDeclineRussianName(childName, effectiveGender)) {
    clean = clean.replace(new RegExp(`${CYR_PRE}(Сердце|сердце|ладошка|ладошки|глаза|улыбка|рука|ручки|голос|взгляд)\\s+${escapedChildName}${CYR_POST}`, 'g'), `$1 ${declined.gen}`);
    clean = clean.replace(new RegExp(`${CYR_PRE}(вместе с|рядом с|вслед за)\\s+${escapedChildName}${CYR_POST}`, 'g'), `$1 ${declined.ins}`);
    clean = clean.replace(new RegExp(`${CYR_PRE}(навстречу|к)\\s+${escapedChildName}${CYR_POST}`, 'g'), `$1 ${declined.dat}`);
    clean = clean.replace(new RegExp(`${CYR_PRE}(о|об|обо)\\s+${escapedChildName}${CYR_POST}`, 'gi'), declined.prep);
  }

  if (isGirl) {
    // Список мужских глаголов, ошибочно генерируемых моделями для девочек
    const verbReplacements = [
      ['почувствовал', 'почувствовала'],
      ['очутился', 'очутилась'],
      ['улыбнулся', 'улыбнулась'],
      ['побежал', 'побежала'],
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
      ['взглянул', 'взглянула'],
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
      ['засмеялся', 'засмеялась'],
      ['прижал', 'прижала'],
      ['обнял', 'обняла'],
      ['погладил', 'погладила'],
      ['понял', 'поняла'],
      ['открыл', 'открыла'],
      ['закрыл', 'закрыла'],
      ['кивнул', 'кивнула'],
      ['присел', 'присела'],
      ['остановился', 'остановилась'],
      ['поблагодарил', 'поблагодарила'],
      ['догадался', 'догадалась'],
      ['прикоснулся', 'прикоснулась'],
      ['дотронулся', 'дотронулась'],
      ['протянул', 'протянула'],
      ['зевнул', 'зевнула'],
      ['укутался', 'укуталась'],
    ];

    for (const [masc, fem] of verbReplacements) {
      // Исправляем только глагол, непосредственно согласованный с именем ребёнка.
      clean = clean.replace(new RegExp(`(${CYR_PRE}${escapedChildName}\\s+)(${masc})${CYR_POST}`, 'giu'), `$1${fem}`);
    }

    // При однородных сказуемых субъект сохраняется: «Аэлита очутилась ... и улыбнулся».
    // Не переходим через запятые и границы частей предложения, где может появиться другой персонаж.
    const masculineForms = verbReplacements.map(([masc]) => escapeRegExp(masc)).join('|');
    const feminineForms = verbReplacements.map(([, fem]) => escapeRegExp(fem));
    const firstPredicate = `(?:${masculineForms}|${feminineForms.join('|')})`;
    const coordinatedPredicate = new RegExp(
      `(${escapedChildName}\\s+${firstPredicate}[^,;.!?…—–]{0,80}?\\s+и\\s+)(${masculineForms})${CYR_POST}`,
      'giu'
    );
    clean = clean.replace(coordinatedPredicate, (match, prefix, verb) => {
      const pair = verbReplacements.find(([masc]) => masc.toLowerCase() === verb.toLowerCase());
      return pair ? `${prefix}${pair[1]}` : match;
    });
  }

  return clean;
}

/**
 * Классифицирует роль одежды в сюжете сказки:
 * - 'costume': ролевой или сюжетный костюм (супергерой, космонавт, маг, рыцарь, бальное платье, кигуруми)
 * - 'functional': одежда, оправданная погодой или ритуалом (дождевик для луж, пуховик для снега, пижама для сна)
 * - 'thematic_fashion': тема напрямую связана с модой, переодеванием или созданием стиля
 * - 'everyday': обычная повседневная одежда (свитер, толстовка, комбинезон, платье), которая не должна отвлекать сюжет
 */
export function classifyClothingNarrativeRole({ appearance = {}, theme = '', storyMood = '', customWishes = '' } = {}) {
  const item = String(appearance?.clothingItem || appearance?.clothing || appearance?.outfit || '').toLowerCase();
  const t = String(theme || '').toLowerCase();
  const w = String(customWishes || '').toLowerCase();
  const m = String(storyMood || '').toLowerCase();

  // 1. Тема «Мода и стиль» или переодевание
  if (t.includes('мод') || t.includes('стиль') || t.includes('наряд') || t.includes('карнавал') || t.includes('показ')) {
    return {
      role: 'thematic_fashion',
      isNarrativelyRelevant: true,
      costumeType: 'fashion',
      allowBestowal: true,
    };
  }

  // 2. Сюжетные костюмы: супергерой, космонавт, маг/волшебник, рыцарь, бальное платье, кигуруми
  const isSuperhero = item.includes('супергеро') || item.includes('плащ супергеро') || item.includes('маск') || t.includes('супергеро') || w.includes('супергеро');
  const isAstronaut = item.includes('скафандр') || item.includes('космонавт') || (t.includes('косм') && (item.includes('шлем') || item.includes('комбинезон со звезд')));
  const isWizard = item.includes('манти') || item.includes('маг') || item.includes('волшебн') || item.includes('колпак') || t.includes('школа волшебств');
  const isKnight = item.includes('доспех') || item.includes('рыцар') || item.includes('латы');
  const isKigurumi = item.includes('кигуруми') || item.includes('костюм динозавр') || item.includes('костюм звер');
  const isBallDress = item.includes('бальн') || item.includes('королевск') || (t.includes('бал') && item.includes('плать'));

  if (isSuperhero || isAstronaut || isWizard || isKnight || isKigurumi || isBallDress) {
    let costumeType = 'costume';
    if (isSuperhero) costumeType = 'superhero_costume';
    else if (isAstronaut) costumeType = 'astronaut_suit';
    else if (isWizard) costumeType = 'wizard_robe';
    else if (isKnight) costumeType = 'knight_armor';
    else if (isBallDress) costumeType = 'ball_dress';
    else if (isKigurumi) costumeType = 'kigurumi';

    return {
      role: 'costume',
      isNarrativelyRelevant: true,
      costumeType,
      allowBestowal: true,
    };
  }

  // 3. Функциональная одежда (дождевик и сапожки в сырую погоду, пуховик в мороз, пижамка перед сном)
  const isRainwear = item.includes('дождевик') || item.includes('сапожк') || item.includes('резинов');
  const isRainContext = t.includes('дожд') || t.includes('луж') || t.includes('осен') || t.includes('руче');
  if (isRainwear && (isRainContext || item.includes('дождевик'))) {
    return {
      role: 'functional',
      isNarrativelyRelevant: true,
      costumeType: 'weather_rain',
      allowBestowal: false,
    };
  }

  const isWinterwear = item.includes('пуховик') || item.includes('шапк с помпон') || item.includes('варежк') || item.includes('зимн');
  const isWinterContext = t.includes('зим') || t.includes('снег') || t.includes('мороз') || t.includes('нов');
  if (isWinterwear && isWinterContext) {
    return {
      role: 'functional',
      isNarrativelyRelevant: true,
      costumeType: 'weather_winter',
      allowBestowal: false,
    };
  }

  const isSleepwear = item.includes('пижам') || item.includes('ночн');
  const isBedtime = m.includes('сон') || t.includes('сон') || t.includes('ночь');
  if (isSleepwear && isBedtime) {
    return {
      role: 'functional',
      isNarrativelyRelevant: true,
      costumeType: 'bedtime_pajamas',
      allowBestowal: false,
    };
  }

  // 4. Повседневная одежда (свитер, толстовка, комбинезончик, платье)
  return {
    role: 'everyday',
    isNarrativelyRelevant: false,
    costumeType: 'everyday_casual',
    allowBestowal: false,
  };
}
