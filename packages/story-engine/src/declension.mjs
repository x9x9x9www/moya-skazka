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
export function declineRussianName(name, gender = 'boy') {
  if (!name || typeof name !== 'string') {
    return { nom: 'Малыш', gen: 'Малыша', dat: 'Малышу', acc: 'Малыша', ins: 'Малышом', prep: 'о Малыше' };
  }

  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const lastChar = lower.slice(-1);
  const lastTwo = lower.slice(-2);
  const stem = trimmed.slice(0, -1);
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
  if (gender === 'boy' || (!lower.endsWith('а') && !lower.endsWith('я') && !lower.endsWith('и') && !lower.endsWith('е') && !lower.endsWith('о'))) {
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

  const declined = declineRussianName(childName, gender);

  const CYR_PRE = '(?<![а-яёА-ЯЁ])';
  const CYR_POST = '(?![а-яёА-ЯЁ])';

  // Исправляем несклонённое имя после предлогов и маркеров
  clean = clean.replace(new RegExp(`${CYR_PRE}(Сердце|сердце|ладошка|ладошки|глаза|улыбка|рука|ручки|голос|взгляд)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.gen}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(вместе с|рядом с|вслед за)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.ins}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(навстречу|к)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.dat}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(о|об|обо)\\s+${childName}${CYR_POST}`, 'gi'), declined.prep);

  if (gender === 'girl') {
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
      // Замена после имени: «Аэлита почувствовал» -> «Аэлита почувствовала»
      clean = clean.replace(new RegExp(`(${childName}\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}девочка\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}малышка\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}героиня\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}она\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
    }

    // Если прямо в одном предложении после имени: «Сделав смелый шаг, Аэлита очутилась на полянке и улыбнулся» -> улыбнулась
    const verbsPattern = verbReplacements.map((v) => v[0]).join('|');
    clean = clean.replace(new RegExp(`(${childName}[^.!?—–]+?)${CYR_PRE}(${verbsPattern})${CYR_POST}`, 'gi'), (match, prefix, verb) => {
      const pair = verbReplacements.find((p) => p[0].toLowerCase() === verb.toLowerCase());
      return pair ? `${prefix}${pair[1]}` : match;
    });
  }

  return clean;
}
