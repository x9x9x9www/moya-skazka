// ========================================================
// «Моя сказка» — Интеллектуальный генератор «Сказки дня»
// Полное соответствие пункту 14 Технического Задания:
// - Персонализация по имени, возрасту и интересам ребенка
// - Учет последних 3–5 книг для исключения повторяемости сюжетов
// - Детерминированность на календарный день (стабильная идея)
// - Поддержка генерации альтернатив (кнопка «Другая идея»)
// ========================================================

import { declineRussianName } from './declension.mjs';

/**
 * Базовые архетипы сказочных миров и сюжетов, сгруппированные по возрастным особенностям
 */
const AGE_STORY_TEMPLATES = {
  // 2–3 года: мягкий сенсорный уют, зверята, ритуалы сна, мыльные пузыри, простые радости
  toddler: [
    {
      theme: 'Спокойный сон',
      mood: 'Спокойный сон',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и пушистое сонное облачко',
      blurbPattern: 'Нежная вечерняя сказка о том, как {name} помог крошечному облачку найти самую мягкую подушку среди лунных лучей и сладко уснуть.',
      wishes: 'Уютная колыбельная атмосфера, мягкие звуки вечернего леса и спокойный отход ко сну.',
    },
    {
      theme: 'Доброта и забота',
      mood: 'Дружба',
      cover: 'cover_forest.jpg',
      titlePattern: '{name} и потерявшийся котёнок Пушок',
      blurbPattern: 'Тёплая история о том, как {name} угостил пушистого котёнка тёплым молоком и нашёл для него уютный домик под пушистой ёлкой.',
      wishes: 'Забота о маленьких зверятах, ласковые слова и тепло объятий.',
    },
    {
      theme: 'Радость и смех',
      mood: 'Юмор и смех',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и радужные мыльные пузыри',
      blurbPattern: 'Весёлое утро, где мыльные пузыри переливаются на солнце всеми цветами радуги и тихонько щекочут носик {nameGen}.',
      wishes: 'Игры с мыльными пузырями, звонкий смех и лёгкость.',
    },
    {
      theme: 'Дружба',
      mood: 'Дружба',
      cover: 'cover_dino.jpg',
      titlePattern: '{name} и плюшевый мишка Топа',
      blurbPattern: 'Увлекательный день, когда любимый мишка ожил, чтобы вместе с {nameIns} построить из мягких кубиков сказочную башню.',
      wishes: 'Дружба с любимой игрушкой, совместное творчество и безопасность.',
    },
  ],

  // 4–5 лет: пик магического мышления, преодоление робости, совместные игры, приключения
  preschooler: [
    {
      theme: 'Смелость',
      mood: 'Приключение',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и тихий маячок звёздной гавани',
      blurbPattern: 'Вдохновляющая сказка о том, как {name} перестал бояться темноты, зажёг крошечный фонарик и указал дорогу заблудившейся звёздочке.',
      wishes: 'Преодоление робости перед темнотой, внутренний огонёк уверенности.',
    },
    {
      theme: 'Дружба и взаимопомощь',
      mood: 'Дружба',
      cover: 'cover_dino.jpg',
      titlePattern: '{name} и мостик через звонкий ручей',
      blurbPattern: 'Лесные зверята не могли перебраться на поляну праздника, пока {name} и добрый динозаврик не собрали прочный мостик из цветных брёвнышек.',
      wishes: 'Умение делиться игрушками, командная работа и радость общего праздника.',
    },
    {
      theme: 'Любознательность',
      mood: 'Приключение',
      cover: 'cover_forest.jpg',
      titlePattern: '{name} и компас солнечного зайчика',
      blurbPattern: 'Озорной солнечный луч оставил волшебную карту в детской. {name} отправляется в весёлое путешествие, чтобы узнать, куда прячется солнце на закате.',
      wishes: 'Исследование окружающего мира, живой интерес к природе.',
    },
    {
      theme: 'Творчество',
      mood: 'Творчество',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и кисточка утренней зари',
      blurbPattern: 'Сказка о волшебных красках: {name} раскрашивает лесную поляну яркими цветами и дарит каждому цветку свой неповторимый узор.',
      wishes: 'Фантазия, свобода рисования и уверенность в своём творчестве.',
    },
  ],

  // 6+ лет: логика, изобретательство, смелость, доброе супергеройство, дружба
  schoolchild: [
    {
      theme: 'Изобретения и логика',
      mood: 'Приключение',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и чертёж летающего корабля',
      blurbPattern: 'Необычное приключение юного изобретателя: {name} конструирует воздушный парусник из старых часов и шестерёнок, чтобы помочь друзьям взлететь выше облаков.',
      wishes: 'Инженерная смекалка, терпение при сборке и гордость за результат.',
    },
    {
      theme: 'Смелость и доброта',
      mood: 'Приключение',
      cover: 'cover_star.jpg',
      titlePattern: '{name} и плащ доброго защитника',
      blurbPattern: 'Сказка о настоящем супергерое: суперсила {nameGen} — это не разрушительные молнии, а доброе сердце, чуткость и умение вовремя подать руку помощи.',
      wishes: 'Истинный героизм в добрых поступках, поддержка слабых.',
    },
    {
      theme: 'Тайна природы',
      mood: 'Спокойный сон',
      cover: 'cover_forest.jpg',
      titlePattern: '{name} и шёпот векового дуба',
      blurbPattern: 'Глубокая и поэтичная история о том, как {name} научился слушать шелест листьев, понимать язык лесных птиц и разгадал древнюю загадку лесной рощи.',
      wishes: 'Единение с природой, спокойствие, глубокая наблюдательность.',
    },
    {
      theme: 'Дружба и доверие',
      mood: 'Дружба',
      cover: 'cover_dino.jpg',
      titlePattern: '{name} и тайна забытого острова',
      blurbPattern: 'Командное морское приключение, где только взаимное доверие и верность слову помогли экипажу {nameGen} открыть остров добрых великанов.',
      wishes: 'Умение договариваться, верность друзьям и взаимовыручка.',
    },
  ],
};

/**
 * Специализированные темы под конкретные интересы ребенка
 */
const INTEREST_THEMED_STORIES = [
  {
    keywords: ['машинк', 'авто', 'гонк', 'колес', 'гараж', 'грузовик', 'транспорт'],
    theme: 'Приключение и дружба',
    mood: 'Приключение',
    cover: 'cover_star.jpg',
    titlePattern: '{name} и светофор волшебного автогородка',
    blurbPattern: 'В сказочном городке машинок перепутались светофоры. {name} садится за руль доброго электрокара и наводит порядок на перекрёстках дружбы.',
    wishes: 'Любимые машинки, внимательность на дороге и дружеская взаимопомощь.',
  },
  {
    keywords: ['динозавр', 'тирекс', 'трицератопс', 'птеро'],
    theme: 'Приключение',
    mood: 'Приключение',
    cover: 'cover_dino.jpg',
    titlePattern: '{name} и добрый динозаврик в долине папоротников',
    blurbPattern: 'Маленький динозаврик потерял свой любимый камешек. {name} отправляется в доисторическую зелёную долину и помогает новому другу.',
    wishes: 'Увлекательные динозаврики, бережное отношение к природе и верная дружба.',
  },
  {
    keywords: ['космос', 'планет', 'ракета', 'звезд', 'марс', 'лун'],
    theme: 'Любознательность',
    mood: 'Приключение',
    cover: 'cover_star.jpg',
    titlePattern: '{name} и секрет светящихся колец Сатурна',
    blurbPattern: 'Уютный космический корабль уносит {nameGen} к далёким звёздам, где звёздные китята поют колыбельные планетам.',
    wishes: 'Космические просторы, доброта вселенной и спокойный полёт.',
  },
  {
    keywords: ['лего', 'конструкт', 'строит', 'кубик', 'башн', 'робот'],
    theme: 'Творчество и изобретения',
    mood: 'Творчество',
    cover: 'cover_star.jpg',
    titlePattern: '{name} и оживший робот из цветных деталей',
    blurbPattern: '{name} собирает из кубиков удивительного робота-помощника, который умеет поливать цветы и рассказывать смешные сказки.',
    wishes: 'Сборка конструктора, созидание своими руками и дружелюбный робот.',
  },
  {
    keywords: ['рисова', 'краск', 'альбом', 'карандаш', 'кисточ'],
    theme: 'Творчество',
    mood: 'Творчество',
    cover: 'cover_star.jpg',
    titlePattern: '{name} и ожившие картинки в альбоме',
    blurbPattern: 'Нарисованное {nameIns} солнышко вдруг подмигнуло и согрело комнату золотым светом. Волшебное путешествие по страницам собственного рисунка.',
    wishes: 'Радость рисования, магия красок и уверенность в своем творчестве.',
  },
  {
    keywords: ['животн', 'котя', 'кошк', 'щен', 'собак', 'лошад', 'хомяк', 'звер'],
    theme: 'Доброта и забота',
    mood: 'Дружба',
    cover: 'cover_forest.jpg',
    titlePattern: '{name} и секретная школа лесных зверят',
    blurbPattern: 'Пушистые бельчата и ежата приглашают {nameGen} на самый весёлый лесной урок — учиться различать следы и находить спелые орехи.',
    wishes: 'Любовь к животным, ласковые лесные обитатели и тепло дружбы.',
  },
  {
    keywords: ['принцесс', 'плать', 'замок', 'корон', 'бал'],
    theme: 'Творчество и доброта',
    mood: 'Творчество',
    cover: 'cover_forest.jpg',
    titlePattern: '{name} и хрустальный ключик от цветочного замка',
    blurbPattern: 'В сказочном цветочном королевстве {name} узнаёт, что главная тайна настоящего принца или принцессы — это вежливость и добрые дела.',
    wishes: 'Красивый сказочный замок, волшебные платья и благородная доброта.',
  },
  {
    keywords: ['супергеро', 'плащ', 'подвиг', 'маги', 'волшеб'],
    theme: 'Смелость',
    mood: 'Приключение',
    cover: 'cover_star.jpg',
    titlePattern: '{name} и секретный пояс добрых дел',
    blurbPattern: '{name} получает особый пояс с кристаллами, которые сияют только тогда, когда совершаешь бескорыстный добрый поступок.',
    wishes: 'Супергеройская смелость, помощь друзьям и благородство.',
  },
];

/**
 * Простая хэш-функция строки для детерминированного выбора
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Получить категорию возраста
 */
function getAgeCategory(age) {
  const num = Number(age) || 4;
  if (num <= 3) return 'toddler';
  if (num <= 5) return 'preschooler';
  return 'schoolchild';
}

/**
 * Нормализовать интересы в плоский список ключевых слов
 */
function extractInterestKeywords(interests) {
  if (!interests) return [];
  if (Array.isArray(interests)) {
    return interests.flatMap((item) =>
      typeof item === 'string' ? item.toLowerCase().split(/[,\s]+/) : []
    );
  }
  if (typeof interests === 'string') {
    return interests.toLowerCase().split(/[,\s]+/);
  }
  return [];
}

/**
 * Проверить, совпадает ли шаблон с сюжетом одной из последних книг
 */
function isRepeatingRecentBook(candidateTitle, candidateTheme, recentBooks = []) {
  if (!recentBooks || recentBooks.length === 0) return false;
  const candLower = `${candidateTitle} ${candidateTheme}`.toLowerCase();

  for (const book of recentBooks.slice(0, 5)) {
    const bookTitle = (book.title || '').toLowerCase();
    const bookTheme = (book.theme || '').toLowerCase();

    // Если темы в точности совпадают
    if (candidateTheme && bookTheme && candidateTheme.toLowerCase() === bookTheme) {
      return true;
    }

    // Если ключевые слова заголовка пересекаются более чем на 50%
    const candWords = candLower.split(/\s+/).filter((w) => w.length > 4);
    const bookWords = `${bookTitle} ${bookTheme}`.split(/\s+/).filter((w) => w.length > 4);

    let matchCount = 0;
    for (const w of candWords) {
      if (bookWords.includes(w)) matchCount++;
    }
    if (candWords.length > 0 && matchCount / candWords.length >= 0.5) {
      return true;
    }
  }

  return false;
}

/**
 * Заполнить плейсхолдеры имени ребенка с правильным склонением
 */
function fillNamePlaceholders(templateStr, childName, gender) {
  if (!templateStr) return '';
  const name = childName || 'Малыш';
  const decl = declineRussianName(name, gender);
  const genName = decl?.gen || name;
  const datName = decl?.dat || name;
  const insName = decl?.ins || name;
  const prepName = decl?.prep || name;

  return templateStr
    .replaceAll('{name}', name)
    .replaceAll('{nameGen}', genName)
    .replaceAll('{nameDat}', datName)
    .replaceAll('{nameIns}', insName)
    .replaceAll('{namePrep}', prepName);
}

/**
 * Основная функция генерации «Сказки дня» (Пункт 14 ТЗ)
 *
 * @param {object} options
 * @param {object} options.child - Профиль ребенка { name, gender, age, interests, appearance }
 * @param {Array}  [options.recentBooks] - Последние 3–5 прочитанных книг { title, theme }
 * @param {string} [options.dateStr] - Календарная дата YYYY-MM-DD (для стабильности дня)
 * @param {number} [options.seed] - Числовой сид для альтернатив (кнопка «Другая идея»)
 * @param {Array}  [options.excludeTitles] - Заголовки, которые нужно исключить
 * @returns {object} DailyIdeaDTO
 */
export function generateDailyIdea(options = {}) {
  const {
    child = {},
    recentBooks = [],
    dateStr = new Date().toISOString().split('T')[0],
    seed = 0,
    excludeTitles = [],
  } = options;

  const childName = (child.name || 'Малыш').trim();
  const childAge = Number(child.age) || 4;
  const childGender =
    child.gender ||
    child.appearance?.gender ||
    (childName.endsWith('а') || childName.endsWith('я') ? 'girl' : 'boy');

  const ageCat = getAgeCategory(childAge);
  const basePool = AGE_STORY_TEMPLATES[ageCat] || AGE_STORY_TEMPLATES.preschooler;

  // Извлекаем интересы ребенка
  const childInterests = extractInterestKeywords(child.interests);

  // Собираем подходящие шаблоны по интересам
  const matchedInterestPool = INTEREST_THEMED_STORIES.filter((item) => {
    return item.keywords.some((kw) => childInterests.some((ci) => ci.includes(kw)));
  });

  // Объединяем пул: сначала совпадения по интересам (если есть), затем базовые возрастные
  const combinedPool = [...matchedInterestPool, ...basePool];

  // Фильтруем пул: исключаем недавние книги и ранее предложенные заголовки
  let filteredPool = combinedPool.filter((tpl) => {
    const rawTitle = fillNamePlaceholders(tpl.titlePattern, childName, childGender);
    if (excludeTitles.includes(rawTitle)) return false;
    if (isRepeatingRecentBook(rawTitle, tpl.theme, recentBooks)) return false;
    return true;
  });

  // Если все отфильтровались (например, слишком много прочитано), используем полный пул без строгой фильтрации
  if (filteredPool.length === 0) {
    filteredPool = combinedPool.filter((tpl) => {
      const rawTitle = fillNamePlaceholders(tpl.titlePattern, childName, childGender);
      return !excludeTitles.includes(rawTitle);
    });
  }
  if (filteredPool.length === 0) {
    filteredPool = combinedPool;
  }

  // Детерминированный выбор на основе даты + имени ребенка + seed
  const hashKey = `${dateStr}_${childName}_${childAge}_${seed}`;
  const pickIndex = hashString(hashKey) % filteredPool.length;
  const chosen = filteredPool[pickIndex];

  const title = fillNamePlaceholders(chosen.titlePattern, childName, childGender);
  const blurb = fillNamePlaceholders(chosen.blurbPattern, childName, childGender);
  const id = `idea_${hashString(`${dateStr}_${child.id || childName}_${title}`)}`;

  const coverUrl = chosen.cover.startsWith('http')
    ? chosen.cover
    : `/illustrations/${chosen.cover}`;

  return {
    id,
    child_id: child.id || 'default_child',
    local_date: dateStr,
    title,
    blurb,
    theme: chosen.theme,
    cover_url: coverUrl,
    status: seed > 0 ? 'REFRESHED' : 'ACTIVE',
    is_saved: false,
    suggested_params: {
      childName,
      gender: childGender,
      age: childAge,
      theme: chosen.theme,
      mood: chosen.mood,
      interests: Array.isArray(child.interests)
        ? child.interests
        : typeof child.interests === 'string'
          ? [child.interests]
          : [],
      customWishes: chosen.wishes,
    },
    created_at: new Date().toISOString(),
  };
}
