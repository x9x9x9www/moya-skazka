/**
 * Модуль русской грамматики и склонения имён для детских сказок.
 * Обеспечивает строгое согласование рода, падежей и удаление технических метаданных.
 */

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

  // 1. Имена на -ия (София, Мария, Амелия, Аглая...)
  if (lastTwo === 'ия') {
    return {
      nom: trimmed,
      gen: `${stemTwo}ии`,
      dat: `${stemTwo}ии`,
      acc: `${stemTwo}ию`,
      ins: `${stemTwo}ией`,
      prep: `об ${stemTwo}ии`,
    };
  }

  // 2. Имена на -а (Аэлита, Алиса, Даша, Маша, Миша, Саша, Ева...)
  if (lastChar === 'а') {
    // После шипящих (ж, ч, ш, щ, г, к, х) в род. падеже 'и', а не 'ы'
    const prevChar = lower.charAt(lower.length - 2);
    const useI = ['ж', 'ч', 'ш', 'щ', 'г', 'к', 'х'].includes(prevChar);
    return {
      nom: trimmed,
      gen: `${stem}${useI ? 'и' : 'ы'}`,
      dat: `${stem}е`,
      acc: `${stem}у`,
      ins: `${stem}ой`,
      prep: `об ${stem}е`,
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
      prep: `об ${stem}е`,
    };
  }

  // 4. Мужские имена на согласный (Марк, Лев, Артём, Роман, Даниил...)
  if (gender === 'boy' || (!lower.endsWith('а') && !lower.endsWith('я') && !lower.endsWith('и') && !lower.endsWith('е') && !lower.endsWith('о'))) {
    if (lastChar === 'й') {
      return {
        nom: trimmed,
        gen: `${stem}я`,
        dat: `${stem}ю`,
        acc: `${stem}я`,
        ins: `${stem}ем`,
        prep: `о ${stem}е`,
      };
    }
    if (lastChar === 'ь') {
      return {
        nom: trimmed,
        gen: `${stem}я`,
        dat: `${stem}ю`,
        acc: `${stem}я`,
        ins: `${stem}ем`,
        prep: `о ${stem}е`,
      };
    }
    return {
      nom: trimmed,
      gen: `${trimmed}а`,
      dat: `${trimmed}у`,
      acc: `${trimmed}а`,
      ins: `${trimmed}ом`,
      prep: `о ${trimmed}е`,
    };
  }

  // Имена, не поддающиеся стандартному склонению (Николь, Кармен, Эли)
  return {
    nom: trimmed,
    gen: trimmed,
    dat: trimmed,
    acc: trimmed,
    ins: trimmed,
    prep: `о ${trimmed}`,
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
export function fixGenderAgreements(text, childName, gender) {
  if (!text || typeof text !== 'string') return '';
  let clean = removeAgeFromText(text);
  const declined = declineRussianName(childName, gender);

  // Исправляем несклонённое имя после слов «Сердце», «ладошка», «глаза», «следы» и т.п.
  clean = clean.replace(new RegExp(`(Сердце|сердце|ладошка|ладошки|глаза|улыбка|рука|ручки|голос|взгляд)\\s+${childName}\\b`, 'g'), `$1 ${declined.gen}`);
  clean = clean.replace(new RegExp(`(вместе с|рядом с|вслед за)\\s+${childName}\\b`, 'g'), `$1 ${declined.ins}`);
  clean = clean.replace(new RegExp(`(навстречу|к)\\s+${childName}\\b`, 'g'), `$1 ${declined.dat}`);

  if (gender === 'girl') {
    // Список мужских глаголов, ошибочно генерируемых моделями для девочек
    const verbReplacements = [
      ['почувствовал', 'почувствовала'],
      ['очутился', 'очутилась'],
      ['улыбнулся', 'улыбнулась'],
      ['побежал', 'побежала'],
      ['пошел', 'пошла'],
      ['пошёл', 'пошла'],
      ['увидел', 'увидела'],
      ['обрадовался', 'обрадовалась'],
      ['взял', 'взяла'],
      ['справился', 'справилась'],
      ['решил', 'решила'],
      ['доказал', 'доказала'],
      ['помог', 'помогла'],
      ['шагнул', 'шагнула'],
      ['прошептал', 'прошептала'],
      ['воскликнул', 'воскликнула'],
      ['вздохнул', 'вздохнула'],
      ['посмотрел', 'посмотрела'],
      ['услышал', 'услышала'],
      ['проснулся', 'проснулась'],
      ['заснул', 'заснула'],
      ['испугался', 'испугалась'],
      ['нашёл', 'нашла'],
      ['нашел', 'нашла'],
      ['заметил', 'заметила'],
    ];

    for (const [masc, fem] of verbReplacements) {
      // Замена после имени: «Аэлита почувствовал» -> «Аэлита почувствовала»
      clean = clean.replace(new RegExp(`(${childName}\\s+)(${masc})\\b`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(\\bдевочка\\s+)(${masc})\\b`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(\\bмалышка\\s+)(${masc})\\b`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(\\bгероиня\\s+)(${masc})\\b`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(\\bона\\s+)(${masc})\\b`, 'gi'), `$1${fem}`);
    }

    // Если прямо в начале предложения: «Сделав смелый шаг, Аэлита очутился»
    clean = clean.replace(new RegExp(`(${childName}[^.!?—–]+?)\\b(почувствовал|очутился|улыбнулся|побежал|пошел|пошёл|увидел|обрадовался|взял|справился|решил|доказал|помог|шагнул)\\b`, 'gi'), (match, prefix, verb) => {
      const pair = verbReplacements.find((p) => p[0].toLowerCase() === verb.toLowerCase());
      return pair ? `${prefix}${pair[1]}` : match;
    });
  }

  return clean;
}
