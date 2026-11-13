/**
 * Модуль русской грамматики и склонения имён для детских сказок.
 * Обеспечивает строгое согласование рода, падежей и удаление технических скобок возраста.
 */

export interface DeclinedName {
  nom: string;
  gen: string;
  dat: string;
  acc: string;
  ins: string;
  prep: string;
}

export function getOPreposition(word?: string): 'об' | 'о' {
  const first = (word || '').trim().charAt(0).toLowerCase();
  return ['а', 'и', 'о', 'у', 'э'].includes(first) ? 'об' : 'о';
}

export function declineRussianName(name?: string, gender: 'boy' | 'girl' | string = 'boy'): DeclinedName {
  if (!name || typeof name !== 'string') {
    return { nom: 'Малыш', gen: 'Малыша', dat: 'Малышу', acc: 'Малыша', ins: 'Малышом', prep: 'о Малыше' };
  }

  const trimmed = name.trim();
  // Поддержка составных дефисных имён (например, «Анна-Мария», «Жан-Поль»)
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2 && parts[0] && parts[1]) {
      const d1 = declineRussianName(parts[0], gender);
      const d2 = declineRussianName(parts[1], gender);
      const prep = getOPreposition(trimmed);
      return {
        nom: `${d1.nom}-${d2.nom}`,
        gen: `${d1.gen}-${d2.gen}`,
        dat: `${d1.dat}-${d2.dat}`,
        acc: `${d1.acc}-${d2.acc}`,
        ins: `${d1.ins}-${d2.ins}`,
        prep: `${prep} ${d1.prep.replace(/^(о|об|обо)\s+/i, '')}-${d2.prep.replace(/^(о|об|обо)\s+/i, '')}`,
      };
    }
  }

  const lower = trimmed.toLowerCase();
  const lastChar = lower.slice(-1);
  const lastTwo = lower.slice(-2);
  const stem = trimmed.slice(0, -1);
  const stemTwo = trimmed.slice(0, -2);
  const prep = getOPreposition(trimmed);

  // 1. Имена на -ия (София, Мария, Амелия...)
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

  // 2. Имена на -а (Аэлита, Алиса, Даша, Маша, Миша, Саша...)
  if (lastChar === 'а') {
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

  // 4. Мужские имена на согласный (Марк, Лев, Артём, Роман...)
  if (gender === 'boy' || (!lower.endsWith('а') && !lower.endsWith('я') && !lower.endsWith('и') && !lower.endsWith('е') && !lower.endsWith('о'))) {
    if (lastChar === 'й' || lastChar === 'ь') {
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
 */
export function canDeclineRussianName(name?: string, gender: 'boy' | 'girl' | string = 'boy'): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (!/^[а-яёА-ЯЁ\- ]+$/.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  // Несклоняемые гласные на конце
  if (['о', 'е', 'и', 'у', 'ю', 'э'].some((v) => lower.endsWith(v))) return false;
  const isGirl = gender === 'girl' || (gender !== 'boy' && (lower.endsWith('а') || lower.endsWith('я')));
  // Иностранные женские имена на согласный (Николь, Кармен, Элис и др.)
  if (isGirl && !lower.endsWith('а') && !lower.endsWith('я')) return false;
  return true;
}

/**
 * Безопасное формирование конструкции «для кого» с Zero-Grammar-Risk фоллбэком.
 * Если имя не склоняется со 100% надёжностью, возвращает естественную конструкцию в именительном падеже:
 * «героиня — Аэлита» (или «для Аэлиты»).
 */
export function formatSafeForWhom(name?: string, gender: 'boy' | 'girl' | string = 'boy'): string {
  if (!name || typeof name !== 'string') {
    return gender === 'girl' ? 'для малышки' : 'для малыша';
  }
  const trimmed = name.trim();
  const isGirl = gender === 'girl' || (gender !== 'boy' && (trimmed.endsWith('а') || trimmed.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
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
 */
export function formatSafeCreationHeader(name?: string, gender: 'boy' | 'girl' | string = 'boy'): string {
  if (!name || typeof name !== 'string') {
    return gender === 'girl' ? 'Создаём сказку для малышки' : 'Создаём сказку для малыша';
  }
  const trimmed = name.trim();
  const isGirl = gender === 'girl' || (gender !== 'boy' && (trimmed.endsWith('а') || trimmed.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
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
 * Устранение неестественных тавтологий и механических повторов слов
 * (например, «шевелились, шевелились» -> «шевелились», «бежал, бежал» -> «бежал»),
 * с бережным сохранением детского звукоподражания («топ-топ», «тук-тук», «кап-кап», «чух-чух»).
 */
export function removeTautologiesAndDuplications(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  let out = text;

  const ALLOWED_ONOMATOPOEIA = new Set([
    'топ', 'тук', 'кап', 'чух', 'ква', 'мяу', 'гав', 'буль', 'плюх', 'хрусь', 'динь', 'чик', 'хлоп', 'прыг', 'бум', 'бам', 'бип', 'цок', 'ля', 'ку'
  ]);

  // 1. Механические тройные повторы: «бежал, бежал, бежал» -> «бежал»
  out = out.replace(/(?<![а-яёА-ЯЁ0-9])([а-яёА-ЯЁ]{3,})([,\s—–-]+)\1([,\s—–-]+)\1(?![а-яёА-ЯЁ0-9])/giu, (match, word) => {
    return word;
  });

  // 2. Механические двойные повторы: «бежал, бежал» -> «бежал», «шевелились, шевелились» -> «шевелились»
  out = out.replace(/(?<![а-яёА-ЯЁ0-9])([а-яёА-ЯЁ]{3,})([,\s—–-]+)\1(?![а-яёА-ЯЁ0-9])/giu, (match, word, sep) => {
    const wLow = word.toLowerCase();
    if (sep.includes('-') && ALLOWED_ONOMATOPOEIA.has(wLow)) {
      return match;
    }
    return word;
  });

  // 3. Повтор через союз «и»: «бежал и бежал» -> «бежал»
  out = out.replace(/(?<![а-яёА-ЯЁ0-9])([а-яёА-ЯЁ]{3,})\s+и\s+\1(?![а-яёА-ЯЁ0-9])/giu, (match, word) => {
    const wLow = word.toLowerCase();
    if (wLow === 'все' || wLow === 'всё' || wLow === 'еще' || wLow === 'ещё') return match;
    return word;
  });

  // 4. Шаблонные тавтологии с двоеточием и предикатами:
  out = out.replace(/:\s*([а-яёА-ЯЁ]{4,})(?:лись|лось|лась|лись)\b/giu, ' и $1');

  // Устранение сдвоенных запятых или пробелов
  out = out.replace(/,\s*,/gu, ',').replace(/\s{2,}/gu, ' ');

  return out.trim();
}

/**
 * Очистка текста от технических скобок возраста: «(4 года)», «(5)», «(3 лет)»
 */
export function removeAgeFromText(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\s*\(\s*\d+\s*(?:года|лет|год)?\s*\)/gi, '')
    .replace(/\b\d+\s*(?:года|лет)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Исправление родовых согласований глаголов и падежей имени в русском тексте
 */
export function fixGenderAgreements(text?: string, arg2: string = 'Герой', arg3: string = 'boy'): string {
  if (!text || typeof text !== 'string') return '';
  let clean = removeTautologiesAndDuplications(removeAgeFromText(text));

  let childName = 'Герой';
  let gender = 'boy';
  if (arg2 === 'boy' || arg2 === 'girl') {
    gender = arg2;
    childName = typeof arg3 === 'string' && arg3.trim() ? arg3.trim() : 'Герой';
  } else {
    childName = typeof arg2 === 'string' && arg2.trim() ? arg2.trim() : 'Герой';
    gender = arg3 === 'girl' ? 'girl' : 'boy';
  }

  const isGirl = gender === 'girl' || (childName && (childName.endsWith('а') || childName.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
  const declined = declineRussianName(childName, effectiveGender);

  const CYR_PRE = '(?<![а-яёА-ЯЁ])';
  const CYR_POST = '(?![а-яёА-ЯЁ])';

  // Исправляем несклонённое имя после предлогов и существительных:
  clean = clean.replace(new RegExp(`${CYR_PRE}(Сердце|сердце|ладошка|ладошки|глаза|улыбка|рука|ручки|голос|взгляд)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.gen}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(вместе с|рядом с|вслед за)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.ins}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(навстречу|к)\\s+${childName}${CYR_POST}`, 'g'), `$1 ${declined.dat}`);
  clean = clean.replace(new RegExp(`${CYR_PRE}(о|об|обо)\\s+${childName}${CYR_POST}`, 'gi'), declined.prep);

  if (isGirl) {
    const verbReplacements: [string, string][] = [
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
      clean = clean.replace(new RegExp(`(${childName}\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}девочка\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}малышка\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}героиня\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
      clean = clean.replace(new RegExp(`(${CYR_PRE}она\\s+)(${masc})${CYR_POST}`, 'gi'), `$1${fem}`);
    }

    const verbsPattern = verbReplacements.map((v) => v[0]).join('|');
    clean = clean.replace(new RegExp(`(${childName}[^.!?—–]+?)${CYR_PRE}(${verbsPattern})${CYR_POST}`, 'gi'), (match, prefix, verb) => {
      const pair = verbReplacements.find((p) => p[0].toLowerCase() === verb.toLowerCase());
      return pair ? `${prefix}${pair[1]}` : match;
    });
  }

  return clean;
}

/**
 * Определение вероятного пола ребёнка по имени
 */
export function inferRussianNameGender(name?: string): 'boy' | 'girl' | null {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim().toLowerCase();
  if (trimmed.length < 2) return null;

  // Известные мужские уменьшительные и полные имена на -а / -я
  const maleNamesOnAorYa = new Set([
    'миша', 'саша', 'паша', 'ваня', 'даня', 'илья', 'никита', 'лёва', 'лева',
    'сеня', 'тёма', 'тема', 'коля', 'дима', 'серёжа', 'сережа', 'рома', 'гоша',
    'юра', 'гриша', 'федя', 'лука', 'кузьма', 'тима', 'жора', 'стёпа', 'степа',
    'влад', 'женя', 'слава', 'боря', 'илюша', 'матвейка',
  ]);

  if (maleNamesOnAorYa.has(trimmed)) {
    return 'boy';
  }

  const femaleExceptions = new Set(['любовь', 'николь', 'кармен', 'рахиль', 'руфь', 'адель', 'алиса']);

  const maleConsonants = new Set([
    'б', 'в', 'г', 'д', 'ж', 'з', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'й'
  ]);

  const checkSingleWord = (word: string): 'boy' | 'girl' | null => {
    if (maleNamesOnAorYa.has(word)) return 'boy';
    if (femaleExceptions.has(word)) return 'girl';
    const last = word.slice(-1);
    if (last === 'а' || last === 'я') return 'girl';
    if (maleConsonants.has(last)) return 'boy';
    return null;
  };

  const direct = checkSingleWord(trimmed);
  if (direct) return direct;

  // Если составное имя (например, Анна-Мария или Марк-Аврелий)
  const parts = trimmed.split(/[- ]+/).filter(Boolean);
  if (parts.length > 1) {
    const lastPartGender = checkSingleWord(parts[parts.length - 1]);
    if (lastPartGender) return lastPartGender;
    const firstPartGender = checkSingleWord(parts[0]);
    if (firstPartGender) return firstPartGender;
  }

  return null;
}
