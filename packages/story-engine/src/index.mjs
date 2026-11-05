// ========================================================
// «Моя сказка» — Story Engine
// Единый контракт сказки: Story DNA, 3D Pixar-стиль,
// character bible, валидация и сборка промптов для картинок.
// Чистый ESM без зависимостей: используется и мостом, и backend.
// ========================================================

export const STORY_ENGINE_VERSION = '2.0.0';

// --------------------------------------------------------
// 1. Визуальный стиль (3D Pixar, как в макете)
// --------------------------------------------------------
export const STYLE_3D_PIXAR =
  'Rendered as a high-end 3D animated children’s film still in the visual language of a modern Pixar-style movie: ' +
  'soft cinematic lighting, warm volumetric glow, tactile detailed materials, expressive rounded characters with large warm eyes, ' +
  'cozy fairytale atmosphere, gentle depth of field, rich natural colors, ultra-detailed, safe and comforting for young children, ' +
  'absolutely no text anywhere: no letters, no titles, no labels, no captions, no speech bubbles, no book spine text, no watermark, no logo, no signature, no UI. ' +
  'Any books, signs, or labels in the scene are completely blank.';

import {
  declineRussianName,
  removeAgeFromText,
  fixGenderAgreements,
  getOPreposition,
  countWords,
} from './declension.mjs';
export {
  declineRussianName,
  removeAgeFromText,
  fixGenderAgreements,
  getOPreposition,
  countWords,
};

import {
  runEditorialAgent,
  proofreadRussianGrammar,
  formatRussianDialogues,
  applyYoification,
  applyTypographySpacing,
  sanitizeToneAndPurity,
  simplifyChildQuestion,
  verifyNarrativeIntegrity,
} from './editorialAgent.mjs';
export {
  runEditorialAgent,
  proofreadRussianGrammar,
  formatRussianDialogues,
  applyYoification,
  applyTypographySpacing,
  sanitizeToneAndPurity,
  simplifyChildQuestion,
  verifyNarrativeIntegrity,
};

// --------------------------------------------------------
// 2. Системные промпты (Архитектор и Сказочник)
// --------------------------------------------------------
export const ARCHITECT_SYSTEM_PROMPT = `You are a world-class child psychologist, fairy tale therapist, and senior narrative architect for children aged 2–6.
Your role is to deeply analyze the child's developmental profile, character traits, the central theme, sensory world, favorite clothing, and toy companion BEFORE the story is written.

You DO NOT write the full literary story text. Instead, you design a comprehensive, psychologically grounded "Story Blueprint" (Архитектурный паспорт сказки) in structured JSON format.

### PRINCIPLES OF NARRATIVE ARCHITECTURE:
1. AGE PSYCHOLOGY:
   - Age 2–3: focus on sensory security, tactile comfort, simple cause-and-effect, object permanence, familiar comforting routines.
   - Age 4–5: peak of magical thinking, harmless curiosity, overcoming gentle doubts/fears (darkness, shadows, sounds), teamwork and empathy.
   - Age 6: emerging autonomy, creative problem solving, self-confidence, gentle humor, social connection.
2. CHARACTER INTEGRATION:
   - The child's personality is not a passive label; it is the unique superpower that unlocks the story's gentle climax.
   - The toy companion retains its toy nature (plush texture, stitches, wheels, button eyes) while coming alive as a loyal sidekick.
3. CUSTOM THEME & MOOD DEPTH (STRICT BAN ON CLICHÉS):
   - The conflict, setting, and tactile actions MUST DERIVE 100% FROM THE CHOSEN THEME AND STORY MOOD.
   - ABSOLUTE BAN ON CLICHÉS: NEVER introduce freezing animals, shivering from cold, getting lost in dark woods, or fear of darkness UNLESS the parent explicitly chose a winter/cold/darkness theme!
   - In themes like "Fashion and Style" or "Circus" or "Cars", the action is about creativity, designing, playful mix-up, invention, or friendly cooperation — NOT about shivering or surviving the elements!
4. FOUR-SCENE DRAMATURGY:
   - Scene 1: Hook, atmosphere, child in their specific clothing, meeting/waking the toy.
   - Scene 2: Gentle mystery or playful challenge, ending with a natural pause for Question 1.
   - Scene 3: Climax where the child's kind choice or action solves the situation (integrating parent wishes if provided).
   - Scene 4: Grounding bedtime calm, tactile reassurance, safe embrace, ending with Question 2.
5. STRICT BREVITY & CONCISE JSON:
   - Keep each field to exactly 1 concise, sensory sentence (max 12–15 words).
   - Deliver deep psychological insight in compact tokens without verbose essays.

Return ONLY a valid JSON object matching the required schema. No Markdown backticks, no comments, no extra text.`;

export const STORY_SYSTEM_PROMPT = `You are an award-winning Russian children's book author, developmental psychologist, and animation art director. You write one deeply personalized illustrated fairytale for a child aged 2–6, suitable for cozy shared reading at any time of day. Return ONLY a valid JSON object. No Markdown, no code fences, no explanations.

### 1. LANGUAGE & GRAMMAR RULES (STRICTEST PRIORITY)
- ALL user-facing text (\`title\`, \`story_outline\`, \`scenes[].text\`, \`questions[].question\`, \`questions[].parent_hint\`, \`characters[].name\`) MUST be written in warm, vivid, natural literary RUSSIAN. No bureaucratic wording, no translated calques, no adult jargon.
- GENDER AGREEMENT: The child's gender is explicitly given as "девочка" (girl) or "мальчик" (boy).
  * If girl ("девочка"): ALL past tense verbs for the child MUST have feminine grammatical endings (-ла / -лась / -а: увидела, почувствовала, побежала, улыбнулась, нашла, помогла, обрадовалась, решила). NEVER use masculine verbs for a female hero (FORBIDDEN: «Аэлита почувствовал», «Аэлита побежал»).
  * If girl ("девочка"): ALL adjectives describing the child MUST be feminine (смелая, маленькая, добрая).
  * If boy ("мальчик"): ALL past tense verbs are masculine (увидел, почувствовал, побежал, улыбнулся).
- DECLENSION OF NAMES (СКЛОНЕНИЕ ИМЕНИ): Correctly decline the child's Russian name in all grammatical cases!
  * Родительный падеж (кого? чьё?): «сердце Аэлиты», «ладошка Аэлиты» (FORBIDDEN: «сердце Аэлита»).
  * Дательный падеж (кому?): «навстречу Аэлите», «сказал Аэлите».
  * Творительный падеж (с кем?): «вместе с Аэлитой».
- ABSOLUTE BAN ON AGE IN BRACKETS OR TEXT:
  * NEVER write the child's age in brackets, parentheses, or inline in the story text (FORBIDDEN: «Аэлита (4 года)», «Малышка (5)», «(4 года)»). Age is ONLY a guideline for text complexity and vocabulary calibration.
- NATURAL CHILD-DIRECTED LITERARY RUSSIAN (ЕСТЕСТВЕННЫЙ ЯЗЫК ДЛЯ ДЕТЕЙ 2–6 ЛЕТ):
  * ABSOLUTELY FORBIDDEN: Awkward synthetic AI phrasing, weird biological/fabric metaphors (FORBIDDEN: «тканевые пятнышки затрепетали», «глазки наполнились серебром», «душа запела хрусталём»).
  * Use vivid, warm, sensory words understandable to a 2–6 year old. Speak naturally like a loving parent telling a cozy bedtime story.
- ALL visual fields (\`characters[].visual_description\`, \`cover_visual\`, \`scenes[].visual\`) MUST be written in precise, concrete ENGLISH.
- Never transliterate Russian names in English visual fields; describe appearance naturally.

### 2. CUSTOM THEME DOMINANCE & MEANING THROUGH ACTION
- ПРИОРИТЕТ КАСТОМНОЙ ТЕМЫ (CUSTOM THEME DOMINANCE):
  * Если пользователь указал кастомную тему (например: «Новогодние праздники», «Поездка в цирк», «Мода и стиль», «День рождения»):
  * Кастомная тема имеет НАИВЫСШИЙ ПРИОРИТЕТ над общими категориями («волшебство», «природа»).
  * В КАЖДОЙ из 4 страниц ОБЯЗАТЕЛЬНО должны присутствовать минимум 2–3 физических осязаемых атрибута этой темы.
  * КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО игнорировать кастомную тему или сводить её к абстрактному фону!
  * КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА КЛИШЕ «СПАСЕНИЕ ОТ ХОЛОДА»: ЗАПРЕЩЕНО вставлять замерзающих зверей, озябшие лапки или обогрев от мороза, если только тема напрямую не про зиму или снег! Вся интрига и действие должны на 100% происходить внутри выбранной темы («Мода и стиль» — примерка, создание стиля, показ, праздник; «Цирк» — фокусы, трюки; «Машинки» — ремонт, трасса).
- FORBIDDEN openings: "Жил-был", "Однажды", "В некотором царстве", "В одном волшебном лесу", "Как-то раз". Start directly in media res with a sensory sound, texture, smell, movement, or line of dialogue.
- MEANING & MORAL: Every fairytale must have a clear, heartwarming meaning (friendship, kindness, perseverance, mutual aid, curiosity, courage). The moral MUST be expressed through the child's own courageous, kind, or ingenious ACTION in Scene 3, NEVER through preachy didactic lectures at the end.
- No brands, no real people, no pop-culture references, no advertisements.

### 3. CHARACTER BIBLE & IMMUTABLE WARDROBE (CRITICAL & STRICT)
- Every character MUST be a separate object in \`characters[]\`. NEVER merge the hero and the companion into one object.
- Required: exactly one \`role: "hero"\` (the child). Add one or two companions with \`role: "companion"\` or \`role: "friend"\`.
- IMMUTABLE CHARACTER ANCHOR: The child's facial appearance, exact hairstyle, exact hair length, hair color, skin tone, eye color, AND exact clothing outfit MUST remain IDENTICAL across the cover and all 4 scenes.
- MANDATORY CLOTHING INTEGRATION IN RUSSIAN STORY TEXT:
  * In Scene 1, explicitly introduce the child in their chosen clothing outfit and color.
  * Weave tactile interactions with clothing into the plot (reaching into pockets, pulling up warm hood, cozy sleeves).
  * The clothing outfit stays identical across all 4 scenes and cover visual.
- FAVORITE TOY & COMPANION CONTINUITY:
  * The favorite toy comes to life as the companion. Keep its toy nature visible (plush texture, stitches, button eyes).
  * The companion toy MUST be at the child's side from Scene 1 to the final bedtime embrace in Scene 4.
- SPECIAL WISHES OF THE PARENT: If provided, they MUST be fulfilled and become the emotional peak of Scene 3.

### 4. FOUR SCENES, STRICT WORD LIMITS & MOBILE LAYOUT
Write EXACTLY four scenes (\`scenes\` array with length exactly 4). NEVER 3, NEVER 5. Total reading time 3–5 minutes.
Strict word counts ensure fast reading and perfect mobile viewport fit without overflow:
- Age 2–3: 50–75 words per scene (total 200–300 words); short musical sentences (5–8 words), repetitions, onomatopoeia, tactile warmth.
- Age 4–5: 85–110 words per scene (total 340–440 words); lively dialogue, sensory details, empathy, ingenuity.
- Age 6: 110–140 words per scene (total 440–560 words); richer vocabulary, gentle humor, cause-and-effect.
Scene roles:
1. Hook & discovery: sensory opening, child in specific clothing meets/wakes the toy companion in the themed world.
2. Gentle problem / mystery matching theme and interests. Ends with action and natural pause for Question 1.
3. Creative action / emotional climax: hero uses empathy, courage, or teamwork to solve the situation. Fulfill parent wishes here.
4. Heartwarming resolution: sensory comfort, quiet warmth, safe return. Ends with natural pause for Question 2.
Use 2 short paragraphs per scene separated by "\\n\\n".

### 5. PEDAGOGICAL QUESTIONS (RULE OF ONE SIMPLE QUESTION)
- Return exactly 2 questions (one after scene 2: \`after_scene: 2\`, one after scene 4: \`after_scene: 4\`).
- Each question MUST contain EXACTLY ONE simple, direct question (max 10–12 words).
- FORBIDDEN: Compound, double questions joined by "and/or" («Что почувствовал герой, и кто помог ему стать смелее?»).
- Questions must be specific to THIS story, warm, and answerable by a child. No test-like questions.
- \`parent_hint\`: short, practical tip for the parent in Russian.
- \`skill\`: one of: emotions, empathy, logic, imagination, speech, memory.

### 6. VISUAL FIELDS FOR 3D RENDERER (FAST & CONCISE)
- \`scenes[].visual\`: ENGLISH ONLY. STRICTLY CONCISE: exactly 1–2 sentences (max 30 words).
  * Describe ONLY camera framing, specific action, setting, and lighting for that scene.
  * DO NOT repeat characters' physical appearance or clothing (the renderer appends character_ids descriptions automatically).
- \`cover_visual\`: ENGLISH ONLY. 1–2 sentences: iconic warm book cover composition with hero and companion, generous space at top for title.
- \`scenes[].character_ids\`: array of ids of characters actually present in that scene (e.g. \`["hero", "companion"]\`).
- Style: 3D Pixar animation movie still. No text, letters, captions, speech bubbles, watermarks, logos, signatures, or UI in any image. All books, covers, signs, and labels are completely blank.

### 7. SAFETY
- Safe and comforting for young children: no violence, death, blood, scary monsters, danger, illness, or adult themes.

### 8. STRICT JSON CONTRACT
{
  "title": "Уникальное образное название на русском",
  "story_dna": {
    "world_scale": "Короткое название выбранного мира",
    "narrative_engine": "Короткое название выбранного сюжетного движка",
    "literary_voice": "Короткое описание выбранного тона"
  },
  "story_outline": "Краткое резюме сюжета на русском, 1–2 предложения",
  "characters": [
    {
      "id": "hero",
      "name": "Имя ребёнка",
      "role": "hero",
      "visual_description": "Full English visual description..."
    },
    {
      "id": "companion",
      "name": "Имя спутника",
      "role": "companion",
      "visual_description": "Full English visual description..."
    }
  ],
  "cover_visual": "English cover scene, composition and lighting, no character appearance details, no text...",
  "scenes": [
    {
      "index": 1,
      "text": "Русский текст сцены 1...",
      "visual": "Concise English setting, action, camera angle (1-2 sentences)...",
      "character_ids": ["hero", "companion"]
    },
    {
      "index": 2,
      "text": "Русский текст сцены 2...",
      "visual": "Concise English setting, action, camera angle (1-2 sentences)...",
      "character_ids": ["hero", "companion"]
    },
    {
      "index": 3,
      "text": "Русский текст сцены 3...",
      "visual": "Concise English setting, action, camera angle (1-2 sentences)...",
      "character_ids": ["hero", "companion"]
    },
    {
      "index": 4,
      "text": "Русский текст сцены 4...",
      "visual": "Concise English setting, action, camera angle (1-2 sentences)...",
      "character_ids": ["hero", "companion"]
    }
  ],
  "questions": [
    {
      "after_scene": 2,
      "question": "Один простой вопрос на русском...",
      "parent_hint": "Подсказка родителю на русском...",
      "skill": "emotions"
    },
    {
      "after_scene": 4,
      "question": "Один простой финальный вопрос на русском...",
      "parent_hint": "Подсказка родителю на русском...",
      "skill": "imagination"
    }
  ]
}`;

// --------------------------------------------------------
// 3. Story DNA: миры, движки, спутники, крючки
// --------------------------------------------------------
const WORLD_SCALES = [
  {
    type: 'Micro-World (Микромир)',
    desc: 'герой уменьшается до размеров напёрстка и исследует часовой городок внутри старых настенных часов, оранжерею из росинки под земляничным листом или Пуговичную гавань под диваном',
  },
  {
    type: 'Everyday Domestic Magic (Домашняя магия)',
    desc: 'обычные домашние вещи живут тайной жизнью: сонный чайник заваривает облака, потерянная варежка открыла зимнюю почту, а на подоконнике светит маяк для ночных мотыльков',
  },
  {
    type: 'Grand Workshop (Мастерская стихий)',
    desc: 'за кухонной дверью работает Пекарня тёплых ветров, Мельница смешивания красок для осенней листвы, Док полировки вечерних звёзд или Мастерская по вязанию снеговых шарфов',
  },
  {
    type: 'Secret Expedition (Тайная экспедиция)',
    desc: 'чердачная обсерватория со старинным медным телескопом, субмарина из скорлупы грецкого ореха в садовой лейке или оранжерея звенящих стеклянных цветов',
  },
  {
    type: 'Tiny Weather Station (Крошечная погодная станция)',
    desc: 'на балконе спрятана станция, где улитки-синоптики настраивают утренний туман, а пуговицы-барометры показывают «немного волшебства»',
  },
];

const NARRATIVE_ENGINES = [
  {
    type: 'Whimsical Detective (Детектив и загадка)',
    desc: 'случилось забавное необъяснимое событие: тени танцуют вразнобой, утреннее эхо запуталось в ветвях, все ложки поменялись местами. Герои идут по трём осязаемым уликам к доброй разгадке',
  },
  {
    type: 'Ingenious Invention (Хитроумный механизм)',
    desc: 'герои мастерят необычный механизм из простых вещей — жёлудей, лент, колёсиков, мыльных пузырей, — чтобы решить добрую задачу',
  },
  {
    type: 'The Great Preparation (Тайная подготовка)',
    desc: 'герои готовят миниатюрный праздник фонариков, запускают ночной поезд светлячков или настраивают будильник для сонного солнца',
  },
  {
    type: 'Playful Mix-Up (Весёлая путаница)',
    desc: 'чудаковатый персонаж перепутал инструкции: покрасил шишки синим вместо неба, собрал эхо в баночки из-под варенья, — и герой бережно всё распутывает',
  },
  {
    type: 'Skill Exchange (Обмен умениями)',
    desc: 'ребёнок учит спутника простому человеческому навыку по возрасту — завязать узелок, тихо посчитать, подуть на горячий чай, — и это неожиданно спасает день',
  },
  {
    type: 'Gentle Homecoming (Доброе возвращение)',
    desc: 'герои помогают заблудившемуся существу или потерянной вещи найти своё место, но не через опасное приключение, а через внимательность, тепло и маленькие подсказки',
  },
];

// Важно: это профессии, аксессуары и милые недостатки, а НЕ новые виды.
// Игрушка остаётся игрушкой (машинка — машинкой, зайка — зайкой).
const COMPANION_QUIRKS = [
  'близорукий мастер пуговиц: носит круглые медные очки и вечно мастерит что-то из пуговиц',
  'крошечный садовник в соломенной шляпе, который от радости чихает золотыми искрами',
  'заводной часовщик с крошечными гаечными ключиками в кармашке бархатного жилета',
  'стеснительный ночной библиотекарь, который боится темноты, пока не замечает, что его собственный фонарик светится',
  'шёлковый почтальон с маленькой кожаной сумкой для самых добрых писем',
  'маленький капитан в бумажной треуголке, который обожает считать звёзды',
  'рассеянный синоптик с крошечным барометром, который путает «пасмурно» и «пушисто»',
  'застенчивый художник, который рисует только тёплые цвета и боится громких звуков',
];

const SENSORY_HOOKS = [
  'Под мягким ковриком тихонько щёлкнула крошечная латунная шестерёнка.',
  'Из приоткрытого ящичка комода донёсся звон хрустального колокольчика и аромат сушёной земляники.',
  'Тёплый вечерний ветерок принёс в комнату шорох конфетной фольги и озорной солнечный зайчик.',
  'На подоконнике сама собой покачнулась деревянная катушка с синими нитками, словно зовя за собой.',
  'В чашке с вечерним чаем всплыл круглый пузырёк, в котором отразился крошечный сказочный маяк.',
  'Под подушкой что-то приятно защекотало, будто маленькое пёрышко шепнуло секрет.',
  'В прихожей тихо звякнула связка ключей, хотя никто не подходил к двери.',
  'На книжной полке сама собой раскрылась книга, и из неё вылетела тёплая пыльца.',
];

// --------------------------------------------------------
// 4. Английские подсказки внешности
// --------------------------------------------------------
const HAIR_COLOR_EN = {
  светлые: 'golden blond',
  русые: 'soft light-brown',
  тёмные: 'warm chestnut dark brown',
  рыжие: 'vibrant ginger reddish-brown',
};
const HAIR_TYPE_EN = {
  короткие: 'neat short playful',
  длинные: 'long with a small ribbon',
  кудрявые: 'soft bouncy curly wavy',
  прямые: 'neat smooth straight silky',
};
const EYE_COLOR_EN = {
  карие: 'warm sparkling hazel-brown eyes',
  голубые: 'bright clear sky-blue eyes',
  зелёные: 'gentle expressive emerald-green eyes',
  серые: 'soft thoughtful slate-grey eyes',
};
const SKIN_TONE_EN = {
  светлая: 'fair rosy-cheeked skin',
  персиковая: 'warm healthy peach complexion',
  смуглая: 'warm golden sun-kissed skin tone',
};
const CLOTHING_COLOR_EN = {
  изумрудный: 'cozy emerald green',
  'солнечно-жёлтый': 'bright sunny yellow',
  'небесно-голубой': 'soft pastel sky-blue',
  'нежно-розовый': 'gentle baby pink',
  терракотовый: 'warm vibrant terracotta',
};
const CLOTHING_ITEM_EN = {
  'уютный свитер': 'knitted sweater with soft yarn texture',
  комбинезончик: 'cute denim overalls',
  платьице: 'charming soft dress with gentle ruffles',
  толстовка: 'warm cozy hooded sweatshirt',
};
const TOY_EN = {
  'плюшевый динозаврик': 'a small chubby friendly plush dinosaur with soft green fabric, visible stitching and kind button eyes',
  'плюшевый мишка': 'a soft fluffy plush teddy bear with hand-stitched details and shiny button eyes',
  'пушистый зайка': 'a cute fluffy plush bunny with long velvety ears and a pink stitched nose',
  'маленький котёнок': 'an adorable tiny plush kitten with big curious embroidered eyes and soft whiskers',
  'волшебная звёздочка': 'a glowing plush star creature with a warm embroidered smile and glittering stardust seams',
  'быстрая машинка': 'a small well-loved toy car with rounded edges, chipped paint and bright friendly headlights',
};

export function translateToyItem(toy) {
  if (!toy) return 'a small soft plush toy with kind button eyes';
  const clean = String(toy).trim().toLowerCase();
  if (TOY_EN[clean]) return TOY_EN[clean];
  if (clean.includes('дино')) return 'a small chubby friendly plush dinosaur with kind button eyes';
  if (clean.includes('мишк') || clean.includes('медвеж')) return 'a soft fluffy plush teddy bear with hand-stitched details and shiny button eyes';
  if (clean.includes('зай') || clean.includes('кролик')) return 'a cute fluffy plush bunny with long velvety ears and a pink stitched nose';
  if (clean.includes('кот') || clean.includes('кош')) return 'an adorable tiny plush kitten with big curious embroidered eyes and soft whiskers';
  if (clean.includes('звезд') || clean.includes('звёзд')) return 'a glowing plush star creature with a warm embroidered smile and glittering stardust seams';
  if (clean.includes('машин') || clean.includes('кар') || clean.includes('поезд') || clean.includes('паровоз')) return 'a small cheerful colorful toy vehicle with rounded edges and friendly headlights';
  if (clean.includes('робот')) return 'a cute friendly retro toy robot with rounded corners and gentle glowing eyes';
  if (clean.includes('жираф')) return 'a cute plush giraffe with funny little horns and soft spots';
  if (clean.includes('слон')) return 'a gentle plush elephant with big soft velvety ears and a curved trunk';
  if (clean.includes('щенок') || clean.includes('собак') || clean.includes('пёс')) return 'a friendly fluffy plush puppy dog with floppy ears and a kind embroidered smile';
  if (clean.includes('кукл')) return 'a sweet charming cloth ragdoll with yarn hair and an embroidered smile';
  if (clean.includes('утк')) return 'a cheerful cute yellow toy duckling with an orange beak';
  if (clean.includes('лис')) return 'a clever sweet plush red fox with a fluffy white-tipped tail';
  if (clean.includes('дракон')) return 'a tiny friendly cute baby dragon with small soft wings';
  if (clean.includes('единорог')) return 'a magical cute plush unicorn with a soft spiral horn and rainbow mane';
  return `a beloved charming toy companion (${clean}) with hand-crafted details and friendly button eyes`;
}

export function translateClothingItem(item) {
  if (!item) return 'knitted sweater';
  const clean = String(item).trim().toLowerCase();
  if (CLOTHING_ITEM_EN[clean]) {
    return CLOTHING_ITEM_EN[clean];
  }
  if (clean.includes('новогод') || clean.includes('рождеств') || clean.includes('олен') || clean.includes('снежинк')) {
    return 'festive holiday knitted winter sweater with charming patterns, cozy pants, and a cute pompom beanie hat';
  }
  if (clean.includes('пуховик') || clean.includes('зимн') || clean.includes('шубк')) {
    return 'warm cozy winter puffer jacket with faux fur trim, snow boots, warm mittens, and a pompom beanie hat';
  }
  if (clean.includes('дождевик') || clean.includes('сапожк')) return 'bright raincoat with a hood and waterproof little boots';
  if (clean.includes('пижам')) return 'cozy bedtime pajamas with gentle starry patterns';
  if (clean.includes('кигуруми')) return 'cute soft dinosaur kigurumi onesie pajamas';
  if (clean.includes('плать')) return 'charming fairytale dress with gentle ruffles';
  if (clean.includes('свитер') || clean.includes('кофт')) return 'knitted sweater with soft yarn texture and cozy pants';
  if (clean.includes('комбинезон')) return 'cute denim overalls dungarees and little sneakers';
  if (clean.includes('толстовк') || clean.includes('худи')) return 'warm cozy hooded sweatshirt and casual pants';
  if (clean.includes('космонавт') || clean.includes('скафандр')) return 'playful child astronaut space suit with soft patches';
  if (clean.includes('супергеро')) return 'playful mini superhero costume with a soft cape';
  if (clean.includes('манти') || clean.includes('волшебник') || clean.includes('маг')) return 'magical little wizard robe with starry embroidered patterns';
  if (clean.includes('пират')) return 'cute playful child pirate outfit with a striped shirt and soft bandana';
  if (clean.includes('рыцар') || clean.includes('доспех')) return 'friendly child knight costume with soft silver fabric armor and tunic';
  if (clean.includes('принц') || clean.includes('корол')) return 'regal child royal velvet tunic with golden embroidery';
  if (clean.includes('бабочк') || clean.includes('крылышк')) return 'charming fairy butterfly dress with soft translucent wings';
  if (clean.includes('футболк')) return 'comfortable soft t-shirt and cute shorts';
  if (clean.includes('куртк')) return 'warm cozy jacket with fleece lining and boots';
  if (clean.includes('рубашк') || clean.includes('джинс')) return 'casual stylish flannel shirt, denim jeans, and sneakers';
  return 'charming custom storybook outfit with detailed clothing and comfortable footwear';
}

export function translateClothingColor(color, clothingText = '') {
  if (color && CLOTHING_COLOR_EN[color]) {
    return CLOTHING_COLOR_EN[color];
  }
  const text = (String(color) + ' ' + String(clothingText)).toLowerCase();
  if (text.includes('жёлт')) return 'bright sunny yellow';
  if (text.includes('голуб')) return 'soft pastel sky-blue';
  if (text.includes('син')) return 'deep royal blue';
  if (text.includes('розов')) return 'gentle baby pink';
  if (text.includes('зелён') || text.includes('изумруд')) return 'cozy emerald green';
  if (text.includes('красн') || text.includes('терракот')) return 'warm vibrant terracotta red';
  if (text.includes('фиолет') || text.includes('сирен')) return 'gentle soft lilac purple';
  if (text.includes('бел') || text.includes('светл')) return 'pure soft warm white';
  if (text.includes('оранж')) return 'warm sunny orange';
  return 'cozy';
}

export function formatFullClothingRus(appearance = {}) {
  const item = (appearance.clothingItem || appearance.clothing || appearance.outfit || '').trim();
  const color = (appearance.clothingColor || '').trim();

  if (!item && !color) {
    return 'уютный вязаный свитер';
  }
  if (item && color) {
    const itemLower = item.toLowerCase();
    const colorRoot = color.slice(0, 4).toLowerCase();
    if (itemLower.includes(colorRoot)) {
      return item;
    }
    return `${color} ${item}`;
  }
  if (item) return item;
  return `${color} одежда`;
}

export function appearanceHints(appearance = {}) {
  const hairColor = HAIR_COLOR_EN[appearance.hairColor] || 'soft light-brown';

  let hairType = 'neat short playful';
  const rawType = String(appearance.hairType || '').toLowerCase();
  const isCurly = rawType.includes('кудр');
  const isStraight = rawType.includes('прям');
  const isLong = rawType.includes('длинн');
  const isShort = rawType.includes('коротк');

  if (isLong && isCurly) {
    hairType = 'long bouncy curly wavy with a small ribbon';
  } else if (isLong && isStraight) {
    hairType = 'long smooth straight silky with a small ribbon';
  } else if (isShort && isCurly) {
    hairType = 'short playful bouncy curly';
  } else if (isShort && isStraight) {
    hairType = 'neat short straight';
  } else if (isCurly) {
    hairType = 'soft bouncy curly wavy';
  } else if (isStraight) {
    hairType = 'neat smooth straight silky';
  } else if (isLong) {
    hairType = 'long with a small ribbon';
  } else if (isShort) {
    hairType = 'neat short playful';
  } else if (HAIR_TYPE_EN[appearance.hairType]) {
    hairType = HAIR_TYPE_EN[appearance.hairType];
  }

  const eyes = EYE_COLOR_EN[appearance.eyeColor] || 'warm sparkling hazel-brown eyes';
  const skin = SKIN_TONE_EN[appearance.skinTone] || 'warm healthy peach complexion';
  const itemClean = appearance.clothingItem ? String(appearance.clothingItem).trim() : 'уютный свитер';
  const itemEn = CLOTHING_ITEM_EN[itemClean] || translateClothingItem(itemClean);
  const colorEn = CLOTHING_COLOR_EN[appearance.clothingColor] || translateClothingColor(appearance.clothingColor, itemClean);
  const clothes = `${colorEn} ${itemEn}`.replace(/\b(bright|cozy|warm|cute)\s+\1\b/gi, '$1').replace(/\s+/g, ' ').trim();
  const toy = TOY_EN[appearance.toy] || translateToyItem(appearance.toy);

  const features = String(appearance.distinctiveFeatures || appearance.avatar_id || '').toLowerCase();
  const hasGlasses = features.includes('очк') || features.includes('glasses');
  const glasses = hasGlasses ? ', wearing cute round glasses' : '';

  return { hairColor, hairType, eyes, skin, clothes, toy, glasses, hasGlasses };
}

// --------------------------------------------------------
// 5. Детерминированный выбор Story DNA
// --------------------------------------------------------
export function createSeededRandom(seed = '') {
  let h = 2166136261 >>> 0;
  const text = String(seed);
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return function random() {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length) % list.length];
}

function ageBand(age) {
  if (age <= 3) {
    return { label: '2–3 года', total: [240, 360], perScene: [50, 95], sentences: 'короткие, музыкальные, 5–8 слов, с повторами и звукоподражанием' };
  }
  if (age <= 5) {
    return { label: '4–5 лет', total: [380, 540], perScene: [85, 140], sentences: 'живые диалоги, средние предложения, эмпатия и взаимопомощь' };
  }
  return { label: '6 лет', total: [520, 720], perScene: [120, 185], sentences: 'богатый словарь, причинно-следственные связи, мягкий юмор' };
}

function getThemedWorld(params, random) {
  const wishes = (params.customWishes || '').toLowerCase();
  const theme = (params.theme || '').toLowerCase();
  const rawTheme = (params.theme || '').trim();
  const interests = (params.interests || []).map((i) => i.toLowerCase());

  // 1. Тема сказки (кастомная или выбранная) — абсолютный приоритет №1!
  if (theme.includes('новогод') || theme.includes('нов год') || theme.includes('рождеств') || theme.includes('зим') || theme.includes('ёлк') || theme.includes('елк') || theme.includes('мороз')) {
    return {
      type: 'Winter Holiday Wonderland (Новогодняя снежная сказка)',
      desc: 'заснеженная сказочная деревушка с наряженными пушистыми ёлками, сияющими тёплыми гирляндами, морозными узорами и хрустящим искрящимся снегом',
    };
  }
  if (theme.includes('мод') || theme.includes('стил') || theme.includes('наряд') || theme.includes('костюм') || theme.includes('портн')) {
    return {
      type: 'Atelier of Whimsical Style (Мастерская сказочного стиля)',
      desc: 'уютная солнечная мастерская с рулонами бархата и шелка, сияющими пуговицами-звёздочками, мягкими мерными лентами и зеркалами в золотых рамах',
    };
  }
  if (theme.includes('цирк')) {
    return {
      type: 'Magic Big Top Circus (Волшебный цирк)',
      desc: 'яркий сказочный шатёр с летающими мыльными пузырями, дрессированными дружелюбными бабочками и весёлой ярмаркой чудес',
    };
  }
  if (theme.includes('самолёт') || theme.includes('самолет') || theme.includes('полёт') || theme.includes('полет') || theme.includes('шар')) {
    return {
      type: 'Cloud Navigator Skies (Небесная гавань облаков)',
      desc: 'ласковые воздушные течения, пушистые розовые облака и безопасный сказочный аэроплан, парящий над тёплым миром',
    };
  }
  if (theme.includes('поезд') || theme.includes('железн')) {
    return {
      type: 'Wonderland Express (Сказочный экспресс)',
      desc: 'уютный деревянный вагончик с тёплым чаем в подстаканниках, мерцающими фонариками и мягким перестуком колёс по радужным рельсам',
    };
  }
  if (theme.includes('мор') || theme.includes('океан') || theme.includes('подвод') || theme.includes('кит')) {
    return {
      type: 'Seaside Wonder (Тёплая морская бухта)',
      desc: 'берег ласкового моря с мерцающими ракушками, тёплым песком и добрыми морскими светлячками',
    };
  }
  if (theme.includes('косм') || theme.includes('звезд') || theme.includes('звёзд') || theme.includes('планет')) {
    return {
      type: 'Starlight Harbor (Звёздная тихая гавань)',
      desc: 'мягкие лунные облака, далёкие мерцающие созвездия и сонный звездолёт с тёплыми иллюминаторами',
    };
  }
  if (theme.includes('дино')) {
    return {
      type: 'Gentle Dino Valley (Тёплая долина динозавриков)',
      desc: 'долина с мягким мхом, тёплыми папоротниками и добрыми малышами-динозаврами, играющими в прятки',
    };
  }
  if (theme.includes('машин') || theme.includes('город')) {
    return {
      type: 'Town of Friendly Motors (Городок добрых машинок)',
      desc: 'уютные дорожки из цветных лент, светящиеся светофорчики и домики-гаражи, где машинки помогают друг другу',
    };
  }
  if (theme.includes('сад') || theme.includes('садик')) {
    return {
      type: 'Friendly Playgroup (Сказочный детский садик)',
      desc: 'уютная группа с мягкими ковриками, башнями из кубиков и добрыми играми, где каждый находит друга',
    };
  }
  if (theme.includes('день рожд') || theme.includes('праздник')) {
    return {
      type: 'Carnival of Celebrations (Праздничная поляна сюрпризов)',
      desc: 'яркие разноцветные флажки, воздушные шарики, взлетающие мыльные пузыри и стол с вкусным праздничным пирогом',
    };
  }

  // 2. Пожелание родителя по месту действия
  if (wishes.length > 5) {
    if (wishes.includes('мор') || wishes.includes('океан') || wishes.includes('пляж') || wishes.includes('дельфин')) {
      return {
        type: 'Seaside Wonder (Тёплая морская бухта)',
        desc: 'берег ласкового моря с мерцающими ракушками, тёплым песком и добрыми морскими светлячками',
      };
    }
    if (wishes.includes('косм') || wishes.includes('звезд') || wishes.includes('звёзд') || wishes.includes('лун')) {
      return {
        type: 'Starlight Harbor (Звёздная тихая гавань)',
        desc: 'мягкие лунные облака, далёкие мерцающие созвездия и сонный звездолёт с тёплыми иллюминаторами',
      };
    }
    if (wishes.includes('лес') || wishes.includes('полян') || wishes.includes('дерев')) {
      return {
        type: 'Whispering Forest (Пушистая лесная опушка)',
        desc: 'уютная опушка под соснами, где лесные зверушки дружат, строят домики и делятся ягодами',
      };
    }
    if (wishes.includes('сад') || wishes.includes('детск')) {
      return {
        type: 'Friendly Playgroup (Сказочный детский садик)',
        desc: 'уютная группа с мягкими ковриками, башнями из кубиков и добрыми играми, где каждый находит друга',
      };
    }
  }

  // 3. Кастомная уникальная тема родителя
  const standardPresets = [
    'дружба', 'дружба и верность', 'доброта', 'доброта и забота', 'смелость', 'смелость и отвага', 'смелость и победа над страхами', 'спокойный сон', 'спокойный и сладкий сон', 'сон',
    'волшебные сны', 'волшебные сны и звездопад', 'тепло и уют', 'тёплые объятия и нежность', 'заколдованный лес', 'заколдованный лес и тайны',
    'космос и звёзды', 'космическое путешествие', 'подводный мир', 'морские глубины и киты', 'остров динозавров', 'страна дружелюбных динозавров',
    'город машинок', 'город добрых машинок', 'замок фей', 'замок маленьких фей и магов', 'капризы и эмоции', 'капризы и управление эмоциями',
    'честность и правда', 'честность и искренность', 'умение делиться', 'умение делиться и дружить', 'любознательность', 'любознательность и открытия',
    'уборка игрушек', 'порядок и уборка игрушек', 'любимый садик', 'любовь к детскому садику', 'поход к врачу', 'смелый поход к врачу',
    'братик или сестрёнка', 'появление братика или сестрёнки', 'забота о природе', 'бережное отношение к природе',
  ];
  if (rawTheme.length > 3 && !standardPresets.includes(theme)) {
    return {
      type: `Themed Realm of ${rawTheme} (Мир: ${rawTheme})`,
      desc: `сказочное пространство, целиком наполненное атмосферой, предметами и чудесами темы «${rawTheme}»`,
    };
  }

  // 4. Тематический подбор по интересам ребёнка (богатый пул для борьбы с повторами)
  const pool = [];
  if (interests.some((i) => i.includes('дино'))) {
    pool.push({
      type: 'Gentle Dino Valley (Тёплая долина динозавриков)',
      desc: 'долина с мягким мхом, тёплыми папоротниками и добрыми малышами-динозаврами, играющими в прятки',
    });
  }
  if (interests.some((i) => i.includes('косм'))) {
    pool.push({
      type: 'Starlight Harbor (Звёздная тихая гавань)',
      desc: 'мягкие лунные облака, далёкие мерцающие созвездия и сонный звездолёт с тёплыми иллюминаторами',
    });
  }
  if (interests.some((i) => i.includes('машин'))) {
    pool.push({
      type: 'Town of Friendly Motors (Городок добрых машинок)',
      desc: 'уютные дорожки из цветных лент, светящиеся светофорчики и домики-гаражи, где машинки помогают друг другу',
    });
  }
  if (interests.some((i) => i.includes('животн'))) {
    pool.push({
      type: 'Whispering Forest (Пушистая лесная опушка)',
      desc: 'уютная опушка под соснами, где лесные зверушки дружат, строят домики и делятся ягодами',
    });
  }
  if (interests.some((i) => i.includes('волшеб'))) {
    pool.push({
      type: 'Garden of Fireflies (Сад мерцающих светлячков)',
      desc: 'хрустальные колокольчики, раскрывающиеся на закате бутоны и звёздная пыльца, дарящая добрые сны',
    });
    pool.push({
      type: 'Chamber of Gentle Spells (Башенка добрых чудес)',
      desc: 'уютная комната под звёздной крышей со старинными светящимися свитками, мыльными пузырями снов и добрыми волшебными огоньками',
    });
  }
  if (interests.some((i) => i.includes('природ'))) {
    pool.push({
      type: 'Sunlit Meadow (Зелёная солнечная поляна)',
      desc: 'шелест шелковистых трав, ласковый ручеёк с гладкими камушками и цветочные домики для бабочек',
    });
    pool.push({
      type: 'Singing Creek Valley (Долина поющего ручья)',
      desc: 'кристально чистые заводи с кувшинками, тёплые замшелые камушки и звонкие лесные капли',
    });
  }
  if (theme.includes('сон')) {
    pool.push({
      type: 'Cozy Dream Nest (Уютное гнёздышко снов)',
      desc: 'комната с мягкими одеялами, вечерними тенями на стене, колыбельным ветерком и тёплым ночником',
    });
  }

  if (pool.length > 0) {
    return pick(pool, random);
  }

  return pick(WORLD_SCALES, random);
}

function getThemedCompanionQuirk(params, random) {
  const toy = (params.appearance?.toy || '').toLowerCase();

  if (toy.includes('машин') || toy.includes('кар') || toy.includes('поезд') || toy.includes('самолёт')) {
    const vehicleQuirks = [
      'верный помощник: тихонько урчит моторчиком, мягко светит фарами в сумерках и всегда готов подвезти друга',
      'храбрый маленький исследователь: уверенно крутит колёсиками по дорожкам и весело сигналит тихонько: «би-бип!»',
      'аккуратный сонный автомобильчик: любит мягкие подушечные гаражи и убаюкивающе шуршит колёсиками',
    ];
    return pick(vehicleQuirks, random);
  }

  if (toy.includes('дино')) {
    const dinoQuirks = [
      'добродушный малыш-динозаврик: смешно виляет мягким хвостиком, осторожно нюхает цветы и обожает обниматься',
      'любознательный травоядный друг: плюшевый динозаврик с добрыми глазками-пуговками, который делится сочными зелёными листиками',
      'чуткий сонный дино: прячет носик в мягкие лапки и тихонько урчит, согревая перед сном',
    ];
    return pick(dinoQuirks, random);
  }

  if (toy.includes('мишк') || toy.includes('медвеж')) {
    const bearQuirks = [
      'пушистый хранитель уюта: ласково обнимает мягкими лапками, согревает в сумерках и хранит добрые секреты',
      'степенный сладкоежка: смешно водит бархатным носиком, принюхиваясь к запаху яблочного пирога или мёда',
      'сонный плюшевый мишутка: тихонько сопит рядом на подушке и бережёт сладкие сны',
    ];
    return pick(bearQuirks, random);
  }

  if (toy.includes('зай') || toy.includes('кролик')) {
    const bunnyQuirks = [
      'чуткий пушистый друг: забавно шевелит длинными ушками, прислушивается к шорохам и смело делает первый прыжок',
      'ласковый зайчонок: прячет носик в мягкие лапки и согревает пушистым животиком',
      'весёлый попрыгунчик: радуется золотистым искоркам и находит самые мягкие травинки для отдыха',
    ];
    return pick(bunnyQuirks, random);
  }

  if (toy.includes('кот') || toy.includes('кош')) {
    const catQuirks = [
      'мурлыкающий компаньон: ласково трётся тёплой щёчкой, поёт колыбельную песенку и бесшумно исследует мир',
      'любопытный котик: смешно водит бархатными ушками и играет с добрыми лунными зайчиками',
    ];
    return pick(catQuirks, random);
  }

  if (toy.includes('звезд') || toy.includes('звёзд')) {
    const starQuirks = [
      'ласковая звёздочка-хранительница: мягко светится золотистым светом, рассеивая ночные тени и даря тепло',
      'ночная звёздочка: оставляет за собой тонкий мерцающий хвостик из сонной пыльцы',
    ];
    return pick(starQuirks, random);
  }

  if (toy.includes('робот')) {
    const robotQuirks = [
      'маленький добрый робот: тихонько щёлкает шестерёнками, весело мигает дружелюбными лампочками и помогает наводить порядок',
      'заводной механический помощник: носит в кармашке крошечный ключик и умеет тихо проигрывать колыбельную мелодию',
    ];
    return pick(robotQuirks, random);
  }

  if (toy.includes('жираф')) {
    const giraffeQuirks = [
      'высокий добрый жирафик: заглядывает за высокие ветки, смешно шевелит мягкими рожками и находит потерянные вещи',
      'уютный пятнистый друг: ласково наклоняет мягкую шейку и согревает пушистыми лапками',
    ];
    return pick(giraffeQuirks, random);
  }

  if (toy.includes('щен') || toy.includes('собак') || toy.includes('пёс')) {
    const dogQuirks = [
      'преданный пушистый щенок: радостно виляет мягким хвостиком, смешно чихает от пыльцы и всегда бежит рядом',
      'чуткий плюшевый сторож: бережёт сладкие сны и ласково греет пушистым бочком',
    ];
    return pick(dogQuirks, random);
  }

  return pick(COMPANION_QUIRKS, random);
}

function getThemedHook(params, random) {
  const interests = (params.interests || []).map((i) => i.toLowerCase());
  const theme = (params.theme || '').toLowerCase();
  const wishes = (params.customWishes || '').toLowerCase();

  if (theme.includes('новогод') || theme.includes('нов год') || theme.includes('рождеств') || theme.includes('зим') || theme.includes('мороз')) {
    return 'За морозным окном тихо кружились пушистые снежинки, а на нарядной пушистой ёлке мягко звенел серебряный колокольчик.';
  }
  if (theme.includes('цирк')) {
    return 'В воздухе запахло сладким попкорном, а из-за бархатной кулисы весело вылетел разноцветный праздничный серпантин.';
  }
  if (theme.includes('самолёт') || theme.includes('самолет') || theme.includes('полёт') || theme.includes('полет')) {
    return 'На ладошку опустилось лёгкое розовое перышко, пахнущее высокими облаками и тёплым попутным ветром.';
  }
  if (wishes.includes('мор') || wishes.includes('океан') || theme.includes('мор') || theme.includes('океан')) {
    return 'Тёплый вечерний ветерок принёс в комнату ласковый шум морской волны и аромат солоноватого бриза.';
  }
  if (interests.some((i) => i.includes('косм')) || theme.includes('косм')) {
    return 'За круглым вечерним окном тихо вспыхнула крошечная золотая звёздочка, оставив в небе искрящийся хвостик.';
  }
  if (interests.some((i) => i.includes('дино')) || theme.includes('дино')) {
    return 'В комнате пахло сладкими сушёными яблоками, когда под мягким ковриком тихонько зашелестел сказочный листик.';
  }
  if (interests.some((i) => i.includes('машин')) || theme.includes('машин')) {
    return 'На ковре тихонько заурчал маленький дружелюбный моторчик, а фары осветили дорогу к сказочной дверце.';
  }
  if (interests.some((i) => i.includes('животн')) || interests.some((i) => i.includes('природ'))) {
    return 'В приоткрытую форточку заглянул пушистый рыжий солнечный лучик и мягко пощекотал носик.';
  }
  if (theme.includes('сон')) {
    return 'В сумерках тихо зазвенел хрустальный колокольчик, зовя за собой в мягкую страну добрых снов.';
  }

  return pick(SENSORY_HOOKS, random);
}

function getHeroAnchor(params, hints) {
  const wishes = (params.customWishes || '').trim();
  if (wishes.length > 5) {
    return `пожелание родителя («${wishes}»), соединённое с характером героя и заботой о друге`;
  }
  const theme = (params.theme || 'Дружба').toLowerCase();
  const mood = (params.storyMood || params.mood || '').toLowerCase();
  if (theme.includes('мод') || theme.includes('стил') || mood.includes('творч')) {
    return `творческое вдохновение: герой находит идеальное сочетание деталей, помогает другу обрести уверенность и красиво раскрыть свой стиль`;
  }
  if (theme.includes('смел') || mood.includes('приключ')) {
    return `смелый шаг вперёд: глубокий спокойный вдох, тёплое пожатие лапки спутника (${hints.toy}) и ласковое слово, рассеивающее любые сомнения`;
  }
  if (theme.includes('сон') || mood.includes('сон')) {
    return `успокаивающий сонный жест: тихая колыбельная песенка, мягкое укутывание друга и тёплые объятия в ${hints.clothes}`;
  }
  if (mood.includes('юмор') || mood.includes('смех') || mood.includes('весел')) {
    return `добрая находчивость и улыбка: весёлая игра со спутником (${hints.toy}), превращающая любую путаницу в радостный общий смех`;
  }
  if (theme.includes('каприз') || theme.includes('эмоци')) {
    return `умение выдохнуть и обнять: герой сжимает лапку ${hints.toy}, глубоко дышит, и сердитая тучка превращается в улыбку`;
  }
  if (theme.includes('забот') || theme.includes('добр')) {
    return `чуткая поддержка: протянутая рука помощи, готовность разделить радость и вовремя поддержать друга`;
  }
  return `искренняя доброта и сообразительность: дружеская поддержка спутника (${hints.toy}), совместное открытие и радость успеха`;
}

export function getMoodProfile(mood = '', theme = '') {
  const m = String(mood || '').toLowerCase();
  const th = String(theme || '').toLowerCase();

  if (m.includes('творчеств') || m.includes('созидан') || th.includes('мод') || th.includes('стил')) {
    return {
      moodLabel: 'Творчество и созидание',
      engineFocus: 'Созидание, придумывание нового, подбор уникального стиля, конструирование или украшение',
      conflictType: 'Творческая задача или подготовка к празднику: создание необычного наряда/изобретения/шедевра, где каждому другу находится его идеальный образ или роль',
      climaxAct: 'Герой находит нестандартное красивое решение, объединяя фантазию и заботу о друзьях (показ мод, преображение, завершение творческого шедевра)',
    };
  }
  if (m.includes('приключен') || m.includes('поиск') || m.includes('исследован')) {
    return {
      moodLabel: 'Приключение и поиск',
      engineFocus: 'Увлекательное исследование, следование по добрым приметам и следам, разгадка дружелюбной тайны',
      conflictType: 'Таинственная находка, карта или добрая загадка мира темы, требующая внимания и смекалки',
      climaxAct: 'Герой делает смелый шаг, разгадывает секрет и открывает удивительное место или находит потерянное сокровище дружбы',
    };
  }
  if (m.includes('юмор') || m.includes('смех') || m.includes('весел') || m.includes('путаниц')) {
    return {
      moodLabel: 'Весёлая путаница и смех',
      engineFocus: 'Забавные комичные ситуации, озорная детская игра, добрые недоразумения и заразительный смех',
      conflictType: 'Смешная путаница (перепутались шляпы или роли, забавные повадки спутника, комичные звуки и неожиданности)',
      climaxAct: 'Герой и друзья с улыбкой распутывают забавную путаницу, доказывая, что юмор и хорошее настроение решают любые сложности',
    };
  }
  if (m.includes('сон') || m.includes('спокойн') || m.includes('уют') || th.includes('сон')) {
    return {
      moodLabel: 'Уютный и спокойный сон',
      engineFocus: 'Медитативный, убаюкивающий ритм, мягкие звуки, согревающее тепло и плавное засыпание',
      conflictType: 'Мирная вечерняя забота: помочь сонной звёздочке зажечь тихий маячок, застелить мягкие постельки или спеть колыбельную',
      climaxAct: 'Тишина и покой опускаются на сказочный мир, герой нежно обнимает своего спутника и сладко засыпает',
    };
  }
  // По умолчанию: Дружба и взаимовыручка
  return {
    moodLabel: 'Дружба и забота',
    engineFocus: 'Искренняя дружба, командная игра, взаимное доверие и радость быть вместе',
    conflictType: 'Важная совместная задача для друзей: помочь подготовить общий сюрприз или поддержать друга в его начинании',
    climaxAct: 'Общий триумф дружбы, где каждый чувствует себя нужным, любимым и счастливым',
  };
}

export function getPersonalityProfile(trait = 'Добрый', theme = '', mood = '') {
  const t = String(trait).toLowerCase();
  const th = String(theme).toLowerCase();

  if (t.includes('весел') || t.includes('озорн') || t.includes('шут')) {
    return {
      traitLabel: 'Весёлый (жизнерадостный озорник)',
      voice: 'Искрящийся, жизнерадостный тон, наполненный добрым детским юмором и звукоподражаниями',
      guidelines: [
        'Включи 2–3 добрых шутки, комичных момента или забавных недоразумения со спутником (спутник забавно чихнул искрами, перепутал башмачки, смешные звуки: «бульк!», «ой-ёй!», «дзынь!»).',
        'Диалоги должны быть задорными, озорными и вызывать у ребёнка искреннюю улыбку.',
        'Смысл и мораль: Смех и неунывающий настрой помогают преодолеть любые сложности и дарят радость всем вокруг.',
      ],
    };
  }

  if (t.includes('любознательн') || t.includes('почемучк') || t.includes('умн') || t.includes('исследовател')) {
    return {
      traitLabel: 'Любознательный (маленький исследователь-почемучка)',
      voice: 'Увлекательный, познавательный тон исследователя, открывающий тайны мира понятным для малыша языком',
      guidelines: [
        'ОБЯЗАТЕЛЬНО включи 1–2 удивительных реальных факта о мире/природе/вещах, адаптированных под возраст (например: как светлячки зажигают холодный свет без огня, почему звёзды мерцают в темноте, как муравьи строят свои мостики, почему морские ракушки поют песенку прибоя).',
        'Покажи исследовательский азарт героя: ребёнок подмечает интересные детали, находит закономерности и с восторгом делает новые открытия.',
        'Смысл и мораль: Любопытство, внимание к деталям и ум открывают самые удивительные двери и помогают найти верное решение.',
      ],
    };
  }

  if (t.includes('смел') || t.includes('храбр') || th.includes('смел')) {
    return {
      traitLabel: 'Смелый (отважный первооткрыватель)',
      voice: 'Вдохновляющий, динамичный тон первооткрывателя: неизвестное оказывается дружелюбным и понятным',
      guidelines: [
        'Покажи преодоление маленького детского сомнения или страха (непонятный ночной шорох, таинственная дверца, шаг на новый мостик или сцена).',
        'Страх быстро рассеивается: герой делает глубокий вдох, крепче сжимает лапку друга и убеждается, что мир полон дружелюбия («страшная тень оказалась веткой яблони с птичкой»).',
        'Смысл и мораль: Истинная смелость — это не отсутствие страха, а готовность сделать добрый шаг вперёд и прийти на выручку другу.',
      ],
    };
  }

  if (t.includes('спокойн') || th.includes('сон')) {
    return {
      traitLabel: 'Спокойный (чуткий созерцатель и мечтатель)',
      voice: 'Бархатный, медитативный, убаюкивающий тон: покой, дыхание, мягкие текстуры, тихое удивление',
      guidelines: [
        'Сделай акцент на тактильном комфорте и умиротворяющих звуках (шелест листьев, шелковистая ткань, мерцание звёзд, ровное спокойное дыхание).',
        'Плавный, размеренный ритм без резких потрясений, создающий глубокое чувство безопасности и нежного тепла.',
        'Смысл и мораль: Спокойствие, гармония и душевный мир — это великая целительная сила, укутывающая теплом перед сном.',
      ],
    };
  }

  // По умолчанию: Добрый
  return {
    traitLabel: 'Добрый (чуткий и заботливый друг)',
    voice: 'Тёплый, сердечный, осязаемый тон с акцентом на искреннюю поддержку, командную помощь и принятие',
    guidelines: [
      'Покажи тонкую эмпатию героя: способность заметить переживания или трудность друга и вовремя прийти на выручку в общем деле темы.',
      'Трогательные жесты заботы, подходящие под мир истории: ободрить, подставить плечо, помочь смастерить или наладить то, что не получалось, поделиться нужной деталью.',
      'Смысл и мораль: Самое главное чудо на свете — это чуткое сердце, взаимовыручка и радость от общего доброго дела.',
    ],
  };
}

export function chooseStoryDna(params = {}, random = Math.random) {
  const world = getThemedWorld(params, random);
  const engine = pick(NARRATIVE_ENGINES, random);
  const quirk = getThemedCompanionQuirk(params, random);
  const hook = getThemedHook(params, random);
  const hints = appearanceHints(params.appearance);
  const trait = params.personality || 'Добрый';
  const moodProfile = getMoodProfile(params.storyMood || params.mood, params.theme || '');
  const profile = getPersonalityProfile(trait, params.theme || '', params.storyMood || params.mood);

  return {
    world_scale: world.type,
    world_description: world.desc,
    narrative_engine: engine.type,
    narrative_description: engine.desc,
    literary_voice: profile.voice,
    personality_profile: profile,
    mood_profile: moodProfile,
    companion_quirk: quirk,
    opening_hook: hook,
    hero_anchor: getHeroAnchor(params, hints),
    age_band: ageBand(Number(params.age) || 4),
  };
}

// --------------------------------------------------------
// 6. Сборка пользовательского промпта
// --------------------------------------------------------
export function buildStoryPrompt(params = {}, options = {}) {
  const random = options.random || Math.random;
  const dna = options.dna || chooseStoryDna(params, random);
  const hints = appearanceHints(params.appearance);
  const band = ageBand(Number(params.age) || 4);
  const recent = (params.recentOutlines || []).filter(Boolean).slice(0, 5);
  const isGirl = params.gender === 'girl' || (params.childName && (params.childName.endsWith('а') || params.childName.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
  const declinedName = declineRussianName(params.childName, effectiveGender);
  const genderRus = isGirl ? 'девочка (женский род: увидела, почувствовала, улыбнулась)' : 'мальчик (мужской род: увидел, почувствовал, улыбнулся)';
  const toy = params.appearance?.toy || params.toy || 'плюшевый медвежонок';

  const fullClothingRus = formatFullClothingRus(params.appearance);

  const user = `ВХОДНЫЕ ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗИРОВАННОЙ СКАЗКИ

1. ГЕРОЙ, ОДЕЖДА И ВНЕШНИЙ ВИД (ОБЯЗАТЕЛЬНО ДЛЯ СЮЖЕТА):
- Имя: ${params.childName || 'Малыш'}
- Пол: ${genderRus}
- Падежные формы имени: Родительный (кого? чьё?): «сердце ${declinedName.gen}», Дательный (кому?): «навстречу ${declinedName.dat}», Творительный (с кем?): «вместе с ${declinedName.ins}».
- ВАЖНЕЙШЕЕ ПРАВИЛО ГРАММАТИКИ: ${isGirl ? `ГЕРОИНЯ — ДЕВОЧКА! Все глаголы прошедшего времени ОБЯЗАНЫ иметь женские окончания -ла / -лась («${params.childName} почувствовала», «улыбнулась», «побежала», «решила»). Категорически запрещено писать в мужском роде! Обязательно склоняй имя: «сердце ${declinedName.gen}»!` : `Герой — мальчик. Все глаголы прошедшего времени — мужского рода («${params.childName} почувствовал», «улыбнулся»). Обязательно склоняй имя: «сердце ${declinedName.gen}»!`}
- ОДЕЖДА ГЕРОЯ (КРИТИЧЕСКИ ВАЖНО ВПЛЕСТИ В ТЕКСТ): ${fullClothingRus}.
  * В Сцене 1 ОБЯЗАТЕЛЬНО покажи героя в этой одежде («${params.childName} в своём любимом ${fullClothingRus}...»).
  * Сделай одежду осязаемой деталью сюжета: пусть герой спрячет что-то в кармашек, натянет капюшон, отряхнёт сапожки, почувствует тепло мягкой ткани или воротника.
  * Герой сохраняет ЭТУ ЖЕ одежду во всех 4 сценах и на обложке!
- Волосы, глаза и кожа: ${params.appearance?.hairColor || 'русые'} ${params.appearance?.hairType || 'мягкие'} волосы, ${params.appearance?.eyeColor || 'карие'} глаза, ${params.appearance?.skinTone || 'персиковая'} кожа${hints.hasGlasses ? ', милые круглые очки' : ''}.
- Любимая игрушка-спутник: ${toy}.
  * Игрушка-спутник оживает, сохраняя свою форму, и находится рядом с героем с самого начала Сцены 1 до финального сна в Сцене 4!
- СТРОЖАЙШИЙ ЗАПРЕТ СКОБОК: Категорически ЗАПРЕЩЕНО вставлять в текст сказки возраст в скобках (никаких «(${Number(params.age) || 4} лет)» или «(4)»)! Текст должен быть чистой художественной литературой без технических меток.
- Возраст для калибровки простоты: ${Number(params.age) || 4} лет (${band.label})
- ХАРАКТЕР И ТЕМПЕРАМЕНТ РЕБЁНКА: ${dna.personality_profile?.traitLabel || params.personality || 'Добрый'}
  * СТИЛЬ И ГОЛОС: ${dna.personality_profile?.voice || dna.literary_voice}
  * ОБЯЗАТЕЛЬНЫЕ ДЕТАЛИ ДЛЯ ЭТОГО ХАРАКТЕРА В СЮЖЕТЕ:
${(dna.personality_profile?.guidelines || ['Сделай акцент на доброте и помощи другу.']).map((g) => `    - ${g}`).join('\n')}

2. ТЕМА, ИНТЕРЕСЫ И КАСТОМНОЕ НАПРАВЛЕНИЕ (ГЛАВНЫЙ СТЕРЖЕНЬ СЮЖЕТА):
- Главная тема сказки: «${params.theme || 'Дружба'}»
  * КРИТИЧЕСКИЙ ЗАКОН: Главная тема «${params.theme || 'Дружба'}» определяет весь мир, атмосферу и конфликт сказки!
  * На КАЖДОЙ из 4 страниц ОБЯЗАТЕЛЬНО должны присутствовать минимум 2–3 осязаемых физических атрибута этой темы!
  * Если тема праздничная, сезонная или конкретная (например, «Новогодние праздники», «Зимняя сказка», «Поход в цирк»), весь сюжет должен дышать этой атмосферой (снег, наряженная ёлка, гирлянды, новогодние шары, запах мандаринов, ожидание полуночного чуда). Категорически ЗАПРЕЩЕНО игнорировать тему или заменять её абстрактным лесом!
- Интересы ребёнка: ${(params.interests || []).join(', ') || 'приключения и открытия'}
${params.customWishes ? `- ОСОБЫЕ ПОЖЕЛАНИЯ РОДИТЕЛЯ (ВЫСШИЙ ПРИОРИТЕТ ДЛЯ СЮЖЕТА): «${params.customWishes}». Обязательно вплети это пожелание в кульминацию Сцены 3 как главное доброе событие!` : '- Особые пожелания: нет'}

3. ВЫБРАННАЯ ДНК ЭТОЙ СКАЗКИ (строй сюжет вокруг неё):
1. Мир: ${dna.world_scale} — ${dna.world_description}
2. Сюжетный движок: ${dna.narrative_engine} — ${dna.narrative_description}
3. Литературный голос: ${dna.literary_voice}
4. Секретная особенность игрушки-спутника: ${dna.companion_quirk}. Сохрани при этом природу и форму игрушки: ${toy}. Не превращай игрушку в другое животное или предмет: машинка остаётся машинкой, зайка — зайкой.
5. Открывающий сенсорный крючок первой сцены: «${dna.opening_hook}»
6. Терапевтическое решение третьей сцены: ${dna.hero_anchor}.

4. АНГЛИЙСКИЕ ПОДСКАЗКИ ДЛЯ CHARACTER BIBLE (characters[].visual_description):
- hero: ${hints.hairColor} ${hints.hairType} hair; ${hints.eyes}; ${hints.skin}; wearing ${hints.clothes}${hints.glasses}
- companion: living version of ${hints.toy} with ${dna.companion_quirk}

5. ТРЕБОВАНИЯ ПО ТЗ (РАЗДЕЛЫ 6 И 15):
- Ровно 4 сцены. Общий объём: ${band.total[0]}–${band.total[1]} русских слов. Ориентир на каждую сцену: ${band.perScene[0]}–${band.perScene[1]} слов. Стиль предложений: ${band.sentences}.
- Сцена 1: Знакомство с миром, ${params.childName} в одежде (${fullClothingRus}) и встреча со спутником (${toy}).
- Сцена 2: Добрая интрига / маленькая задача. Завершается действием и паузой для Вопроса 1.
- Сцена 3: Кульминация и доброе решение: ${dna.hero_anchor}${params.customWishes ? `, исполнение пожелания «${params.customWishes}»` : ''}.
- Сцена 4: Умиротворяющий сонный финал, мягкий свет звёзд, уют, покой перед сном. Завершается паузой для Вопроса 2.
- Каждая сцена — это 2–4 небольших абзаца, а не одна короткая фраза. Не растягивай текст водой: добавляй сенсорные детали, диалоги и маленькие действия.
- СМЫСЛ И МОРАЛЬ: Сказка обязана нести добрый смысл и ценность (дружба, смелость, чуткость), но раскрываться они должны через ПОСТУПОК и ВЫБОР героя в Сцене 3, а НЕ через сухие нотации в конце. Категорически запрещены дидактические поучения («И понял малыш, что...»).
- Никаких заезженных штампов («Жил-был», «Однажды», «в одном волшебном лесу»).
- Ровно один вопрос после сцены 2 и ровно один после сцены 4. Вопросы — строго про переживания героев в этой истории под возраст ${band.label}.
- Герой и спутник — отдельные объекты в characters[]. Не склеивай их.
- visual-поля — только английский, без описания внешности персонажей: рендерер добавит её сам по character_ids.
- Сказка должна быть тёплой, безопасной и пригодной для чтения перед сном.
${recent.length ? `\nНЕ ПОВТОРЯЙ сюжеты, миры и спутников из последних сказок:\n${recent.map((t) => `- «${t}»`).join('\n')}\n` : ''}
Верни только валидный JSON по контракту из системной инструкции.`;

  return { system: STORY_SYSTEM_PROMPT, user, dna };
}

// --------------------------------------------------------
// 6.1. Двухэтапная генерация: Нормализация блюпринта
// --------------------------------------------------------
export function normalizeBlueprint(raw, params = {}) {
  const src = typeof raw === 'object' && raw !== null ? raw : {};
  const child = params.childName || 'Малыш';
  const theme = params.theme || 'Дружба';
  const toy = params.appearance?.toy || params.toy || 'плюшевый медвежонок';
  const clothing = formatFullClothingRus(params.appearance);
  const wishes = params.customWishes || '';

  const psych = src.psychological_profile || {};
  const concept = src.creative_concept || {};
  const scenes = src.scene_by_scene_blueprint || {};
  const ped = src.pedagogical_focus || {};

  const s1 = scenes.scene_1_hook || {};
  const s2 = scenes.scene_2_intrigue || {};
  const s3 = scenes.scene_3_climax || {};
  const s4 = scenes.scene_4_bedtime_calm || {};

  return {
    psychological_profile: {
      age_focus: asString(psych.age_focus) || `Особенности возраста ${Number(params.age) || 4} лет: наглядность, эмоциональная безопасность, осязаемость`,
      character_strength: asString(psych.character_strength) || `Чуткость, доброта и внимание к окружающим`,
      therapeutic_goal: asString(psych.therapeutic_goal) || `Мягкая поддержка уверенности и спокойствия перед сном`,
    },
    creative_concept: {
      core_metaphor: asString(concept.core_metaphor) || `Уютное открытие волшебства дружбы в мире темы «${theme}»`,
      world_description: asString(concept.world_description) || `Тёплый сказочный мир, наполненный атрибутами темы «${theme}»`,
      companion_role: asString(concept.companion_role) || `Оживший ${toy}, который ласково помогает ${child} и дарит тепло`,
    },
    scene_by_scene_blueprint: {
      scene_1_hook: {
        setting: asString(s1.setting) || `Уютная комната или начало сказочного мира темы «${theme}»`,
        sensory_hook: asString(s1.sensory_hook) || `Тихий шелест или мягкий огонёк, привлекающий внимание`,
        clothing_action: asString(s1.clothing_action) || `${child} в любимой одежде (${clothing}) ощущает тепло ткани или прячет ручки в кармашки`,
        toy_awakening: asString(s1.toy_awakening) || `${toy} ласково оживает и ободряюще подмигивает пуговичным глазком`,
      },
      scene_2_intrigue: {
        gentle_mystery: asString(s2.gentle_mystery) || `Интересная загадка или доброе недоразумение по теме «${theme}»`,
        emotional_beat: asString(s2.emotional_beat) || `Искреннее любопытство и желание помочь`,
        pause_hook: asString(s2.pause_hook) || `Пауза перед совместным решением с ${toy}`,
      },
      scene_3_climax: {
        child_decision: asString(s3.child_decision) || `${child} проявляет доброту и находит верное решение`,
        wish_fulfillment: asString(s3.wish_fulfillment) || (wishes ? `Исполнение пожелания «${wishes}»` : `Торжество искренней дружбы и заботы`),
        triumph_moment: asString(s3.triumph_moment) || `Радостная улыбка и тёплые объятия с ${toy}`,
      },
      scene_4_bedtime_calm: {
        calming_imagery: asString(s4.calming_imagery) || `Мягкое мерцание звёзд, уютные сумерки и тихое дыхание ночи`,
        grounding_gesture: asString(s4.grounding_gesture) || `${child} крепко прижимает к себе ${toy} и сладко зевает`,
        pause_hook: asString(s4.pause_hook) || `Пауза перед самым глубоким и добрым сном`,
      },
    },
    pedagogical_focus: {
      question_1_theme: asString(ped.question_1_theme) || `Один простой вопрос о чувствах героя во время встречи с загадкой`,
      question_2_theme: asString(ped.question_2_theme) || `Один тёплый вопрос о том, что подарило герою самое нежное спокойствие`,
    },
  };
}

// --------------------------------------------------------
// 6.2. Двухэтапная генерация: Этап 1 (Архитектор & Психолог)
// --------------------------------------------------------
export function buildArchitectPrompt(params = {}, options = {}) {
  const random = options.random || Math.random;
  const dna = options.dna || chooseStoryDna(params, random);
  const band = ageBand(Number(params.age) || 4);
  const recent = (params.recentOutlines || []).filter(Boolean).slice(0, 5);
  const isGirl = params.gender === 'girl' || (params.childName && (params.childName.endsWith('а') || params.childName.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
  const declinedName = declineRussianName(params.childName, effectiveGender);
  const toy = params.appearance?.toy || params.toy || 'плюшевый медвежонок';
  const fullClothingRus = formatFullClothingRus(params.appearance);

  const user = `ЗАДАЧА: Спроектировать «Архитектурный паспорт сказки» (Story Blueprint).

1. ВХОДНЫЕ ДАННЫЕ РЕБЁНКА:
- Имя: ${params.childName || 'Малыш'} (${isGirl ? 'девочка' : 'мальчик'})
- Падежные формы имени: Родительный («${declinedName.gen}»), Дательный («${declinedName.dat}»), Творительный («${declinedName.ins}»)
- Возраст: ${Number(params.age) || 4} лет (${band.label})
- Характер и темперамент: ${dna.personality_profile?.traitLabel || params.personality || 'Добрый'}
- Ключевые черты характера для раскрытия:
${(dna.personality_profile?.guidelines || ['Сделай акцент на доброте и помощи другу.']).map((g) => `  * ${g}`).join('\n')}
- Одежда героя: ${fullClothingRus} (сохраняется во всех сценах)
- Любимая игрушка-спутник: ${toy} (живой компаньон с повадкой: «${dna.companion_quirk}»)

2. ТЕМА, НАСТРОЕНИЕ И ПОЖЕЛАНИЯ РОДИТЕЛЯ:
- Главная тема: «${params.theme || 'Дружба'}» (строго определяет весь мир, предметы и задачу сюжета)
- Настроение и направленность сказки: «${dna.mood_profile?.moodLabel || 'Дружба и забота'}»
  * Сюжетный фокус: ${dna.mood_profile?.engineFocus || 'Искренняя дружба и совместная радость'}
  * Направленность конфликта: ${dna.mood_profile?.conflictType || 'Добрая задача для друзей'}
- Интересы ребёнка: ${(params.interests || []).join(', ') || 'приключения и открытия'}
${params.customWishes ? `- Особые пожелания родителя (ВЫСШИЙ ПРИОРИТЕТ): «${params.customWishes}»` : '- Особые пожелания родителя: нет'}

3. БАЗОВАЯ ДНК МИРА:
- Масштаб мира: ${dna.world_scale} — ${dna.world_description}
- Сюжетный движок: ${dna.narrative_engine} — ${dna.narrative_description}
- Открывающий крючок: «${dna.opening_hook}»
- Решение героя: ${dna.hero_anchor}
${recent.length ? `\nНЕ ПОВТОРЯЙ сюжеты из недавних сказок:\n${recent.map((t) => `- «${t}»`).join('\n')}\n` : ''}

4. ТРЕБОВАНИЯ К ВЫХОДНОМУ STORY BLUEPRINT:
Сформируй глубокий, продуманный план в виде строгого JSON-объекта (пиши предельно емко, по 1 короткой фразе на каждое поле, без лишних вступлений и длинных рассуждений):
{
  "psychological_profile": {
    "age_focus": "психологическая специфика возраста ${Number(params.age) || 4} лет",
    "character_strength": "как именно характер (${dna.personality_profile?.traitLabel || params.personality || 'Добрый'}) поможет преодолеть задачу",
    "therapeutic_goal": "мягкий терапевтический посыл без прямых поучений"
  },
  "creative_concept": {
    "core_metaphor": "главная метафора сказки (свежая, осязаемая, без банальностей)",
    "world_description": "мир сказки с 3-4 физическими атрибутами темы «${params.theme || 'Дружба'}»",
    "companion_role": "как оживает ${toy}, его помощь и повадка"
  },
  "scene_by_scene_blueprint": {
    "scene_1_hook": {
      "setting": "где начинается история",
      "sensory_hook": "открывающий звук, запах или ощущение",
      "clothing_action": "как ${params.childName || 'Малыш'} взаимодействует с одеждой (${fullClothingRus})",
      "toy_awakening": "как оживает или включается ${toy}"
    },
    "scene_2_intrigue": {
      "gentle_mystery": "добрая загадка или творческая задачка по теме «${params.theme || 'Дружба'}» в духе «${dna.mood_profile?.moodLabel || 'Дружба'}»",
      "emotional_beat": "эмоциональное состояние ребёнка (любопытство, озорство, интерес)",
      "pause_hook": "пауза для первого вопроса родителю"
    },
    "scene_3_climax": {
      "child_decision": "созидательный поступок героя через характер (${dna.personality_profile?.traitLabel || params.personality || 'Добрый'}): ${dna.mood_profile?.climaxAct || 'доброе решение'}",
      "wish_fulfillment": "${params.customWishes ? `воплощение пожелания: ${params.customWishes}` : 'кульминация радости и дружбы'}",
      "triumph_moment": "радостное совместное торжество с ${toy}"
    },
    "scene_4_bedtime_calm": {
      "calming_imagery": "успокаивающие сенсорные образы (тихий свет, мягкое тепло)",
      "grounding_gesture": "объятие с ${toy}, укутывание, покой перед сном",
      "pause_hook": "пауза для финального вопроса перед сном"
    }
  },
  "pedagogical_focus": {
    "question_1_theme": "тема для простого вопроса после сцены 2 (эмоции/наблюдательность)",
    "question_2_theme": "тема для простого вопроса после сцены 4 (эмпатия/закрепление тепла)"
  }
}
Верни ТОЛЬКО валидный JSON-объект без пояснений.`;

  return { system: ARCHITECT_SYSTEM_PROMPT, user, dna };
}

// --------------------------------------------------------
// 6.3. Двухэтапная генерация: Этап 2 (Сказочник из блюпринта)
// --------------------------------------------------------
export function buildStoryFromBlueprintPrompt(params = {}, blueprint = {}, options = {}) {
  const random = options.random || Math.random;
  const dna = options.dna || chooseStoryDna(params, random);
  const hints = appearanceHints(params.appearance);
  const band = ageBand(Number(params.age) || 4);
  const isGirl = params.gender === 'girl' || (params.childName && (params.childName.endsWith('а') || params.childName.endsWith('я')));
  const effectiveGender = isGirl ? 'girl' : 'boy';
  const declinedName = declineRussianName(params.childName, effectiveGender);
  const genderRus = isGirl ? 'девочка (женский род: увидела, почувствовала, улыбнулась)' : 'мальчик (мужской род: увидел, почувствовал, улыбнулся)';
  const toy = params.appearance?.toy || params.toy || 'плюшевый медвежонок';
  const fullClothingRus = formatFullClothingRus(params.appearance);

  const bp = normalizeBlueprint(blueprint, params);

  const user = `ВХОДНЫЕ ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗИРОВАННОЙ СКАЗКИ НА ОСНОВЕ АРХИТЕКТУРНОГО ПАСПОРТА

1. УТВЕРЖДЁННЫЙ АРХИТЕКТУРНЫЙ ПАСПОРТ СКАЗКИ (STORY BLUEPRINT):
- Центральная метафора: ${bp.creative_concept.core_metaphor}
- Мир сказки: ${bp.creative_concept.world_description}
- Настроение и направленность: ${dna.mood_profile?.moodLabel || 'Дружба и забота'} (${dna.mood_profile?.engineFocus || 'совместное доброе дело'})
- Роль и повадка спутника (${toy}): ${bp.creative_concept.companion_role}
- Терапевтическая цель: ${bp.psychological_profile.therapeutic_goal}
- Сильная сторона героя: ${bp.psychological_profile.character_strength}

ПОШАГОВЫЙ ПЛАН 4 СЦЕН (СТРОГО СЛЕДУЙ ЭТОМУ СЦЕНАРИЮ):
• Сцена 1 (Завязка):
  - Место и атмосфера: ${bp.scene_by_scene_blueprint.scene_1_hook.setting}
  - Сенсорный крючок начала: ${bp.scene_by_scene_blueprint.scene_1_hook.sensory_hook}
  - Действие с одеждой (${fullClothingRus}): ${bp.scene_by_scene_blueprint.scene_1_hook.clothing_action}
  - Оживление игрушки (${toy}): ${bp.scene_by_scene_blueprint.scene_1_hook.toy_awakening}
• Сцена 2 (Интрига и задача):
  - Загадка/задача: ${bp.scene_by_scene_blueprint.scene_2_intrigue.gentle_mystery}
  - Эмоция героя: ${bp.scene_by_scene_blueprint.scene_2_intrigue.emotional_beat}
  - Пауза под вопрос 1: ${bp.scene_by_scene_blueprint.scene_2_intrigue.pause_hook}
• Сцена 3 (Кульминация добра):
  - Решение героя: ${bp.scene_by_scene_blueprint.scene_3_climax.child_decision}
  - Исполнение пожелания: ${bp.scene_by_scene_blueprint.scene_3_climax.wish_fulfillment}
  - Момент совместной радости: ${bp.scene_by_scene_blueprint.scene_3_climax.triumph_moment}
• Сцена 4 (Умиротворение перед сном):
  - Успокаивающие образы: ${bp.scene_by_scene_blueprint.scene_4_bedtime_calm.calming_imagery}
  - Заземляющий жест уюта: ${bp.scene_by_scene_blueprint.scene_4_bedtime_calm.grounding_gesture}
  - Пауза под вопрос 2: ${bp.scene_by_scene_blueprint.scene_4_bedtime_calm.pause_hook}

ФОКУС ВОПРОСОВ:
- Вопрос 1 (после сцены 2): ${bp.pedagogical_focus.question_1_theme}
- Вопрос 2 (после сцены 4): ${bp.pedagogical_focus.question_2_theme}

2. ГЕРОЙ, ОДЕЖДА И ГРАММАТИКА:
- Имя: ${params.childName || 'Малыш'}
- Пол: ${genderRus}
- Падежные формы имени: Родительный («сердце ${declinedName.gen}»), Дательный («навстречу ${declinedName.dat}»), Творительный («вместе с ${declinedName.ins}»)
- ГРАММАТИЧЕСКОЕ ПРАВИЛО: ${isGirl ? `ГЕРОИНЯ — ДЕВОЧКА! Все глаголы прошедшего времени ОБЯЗАНЫ иметь женские окончания -ла / -лась («${params.childName} почувствовала», «улыбнулась», «побежала»). Категорически запрещено писать в мужском роде! Обязательно склоняй имя: «сердце ${declinedName.gen}»!` : `Герой — мальчик. Все глаголы прошедшего времени — мужского рода («${params.childName} почувствовал», «улыбнулся»). Обязательно склоняй имя: «сердце ${declinedName.gen}»!`}
- Одежда героя: ${fullClothingRus} (обязательно вплести осязаемо в Сцену 1, сохранять во всех сценах)
- Любимая игрушка-спутник: ${toy} (рядом от первой фразы до засыпания)
- Волосы, глаза, кожа: ${params.appearance?.hairColor || 'русые'} ${params.appearance?.hairType || 'мягкие'} волосы, ${params.appearance?.eyeColor || 'карие'} глаза, ${params.appearance?.skinTone || 'персиковая'} кожа${hints.hasGlasses ? ', милые круглые очки' : ''}
- СТРОЖАЙШИЙ ЗАПРЕТ СКОБОК: Категорически ЗАПРЕЩЕНО вставлять в текст сказки возраст в скобках (никаких «(${Number(params.age) || 4} лет)»)!
- Возраст для калибровки простоты: ${Number(params.age) || 4} лет (${band.label})

3. АНГЛИЙСКИЕ ПОДСКАЗКИ ДЛЯ CHARACTER BIBLE (characters[].visual_description):
- hero: ${hints.hairColor} ${hints.hairType} hair; ${hints.eyes}; ${hints.skin}; wearing ${hints.clothes}${hints.glasses}
- companion: living version of ${hints.toy} with ${dna.companion_quirk}

4. ТРЕБОВАНИЯ ПО ТЗ:
- Ровно 4 сцены. Общий объём: ${band.total[0]}–${band.total[1]} русских слов. Ориентир на каждую сцену: ${band.perScene[0]}–${band.perScene[1]} слов.
- Каждая сцена — 2–4 небольших абзаца.
- Никаких заезженных штампов («Жил-был», «Однажды»). Начинай сразу с сенсорного крючка.
- Ровно один вопрос после сцены 2 и ровно один после сцены 4. Правило одного простого вопроса (до 10–12 слов, без «и/или»).
- visual-поля — только английский, 3D Pixar render, без текста на картинках.

Верни только валидный JSON по контракту из системной инструкции.`;

  return { system: STORY_SYSTEM_PROMPT, user, dna };
}

// --------------------------------------------------------
// 7. Валидация и нормализация
// --------------------------------------------------------
export class StoryValidationError extends Error {
  constructor(issues) {
    const list = Array.isArray(issues) ? issues : [String(issues)];
    super(`Story validation failed: ${list.join('; ')}`);
    this.name = 'StoryValidationError';
    this.issues = list;
  }
}

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function hasCyrillic(text) {
  return /[А-Яа-яЁё]/.test(text || '');
}

/**
 * Модель иногда дописывает вопрос для родителя прямо в конец сцены.
 * Убираем только явно «родительский» вопрос в отдельном абзаце, не трогая
 * диалоги (они начинаются с тире или стоят в кавычках).
 */
function stripTrailingParentQuestion(text) {
  const parts = text.split(/\n{2,}/);
  if (parts.length < 2) return { text, removed: false };
  const last = parts[parts.length - 1]?.trim();
  if (!last || !last.endsWith('?')) return { text, removed: false };
  if (last.startsWith('—') || last.startsWith('-') || last.startsWith('«') || last.includes('—')) {
    return { text, removed: false };
  }
  const parentMarkers = /(\bты\b|\bтеб[яе]\b|\bтво[йяе]\b|\bтвой\b|\bтвоя\b)/i;
  const questionStart = /^(Почему|Как|Что|Кто|Где|Когда|А что|А как|А почему|Как ты|Что ты|Почему ты|Как думаешь)/i;
  if (!parentMarkers.test(last) && !questionStart.test(last)) return { text, removed: false };
  parts.pop();
  return { text: parts.join('\n\n').trim(), removed: true };
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function defaultCharacterFromInput(params, role = 'companion') {
  const hints = appearanceHints(params.appearance);
  if (role === 'hero') {
    return {
      id: 'hero',
      name: params.childName || 'Малыш',
      role: 'hero',
      visual_description:
        `A ${Number(params.age) || 4}-year-old ${params.gender === 'girl' ? 'girl' : 'boy'} with ` +
        `${hints.hairColor} ${hints.hairType} hair, ${hints.eyes}, ${hints.skin}, wearing ${hints.clothes}${hints.glasses}.`,
    };
  }
  return {
    id: 'companion',
    name: 'Спутник',
    role: 'companion',
    visual_description: `A living version of the child's favorite toy: ${hints.toy}.`,
  };
}

function normalizeCharacters(rawCharacters, params) {
  const issues = [];
  let characters = Array.isArray(rawCharacters) ? rawCharacters : [];
  characters = characters
    .map((c, index) => {
      const id = asString(c?.id) || (index === 0 ? 'hero' : `companion_${index}`);
      const name = asString(c?.name) || (id === 'hero' ? params.childName || 'Малыш' : 'Спутник');
      const role = ['hero', 'companion', 'friend'].includes(c?.role) ? c.role : id === 'hero' ? 'hero' : 'companion';
      const visual = asString(c?.visual_description);
      return { id, name, role, visual_description: visual };
    })
    .filter((c) => c.visual_description);

  if (characters.length === 0) {
    characters = [defaultCharacterFromInput(params, 'hero'), defaultCharacterFromInput(params, 'companion')];
    issues.push('characters[] отсутствовал — собран из профиля ребёнка');
  }

  let heroIndex = characters.findIndex((c) => c.role === 'hero' || c.id === 'hero');
  if (heroIndex === -1) {
    characters.unshift(defaultCharacterFromInput(params, 'hero'));
    heroIndex = 0;
    issues.push('не найден hero — добавлен из профиля ребёнка');
  }
  characters[heroIndex] = { ...characters[heroIndex], id: 'hero', role: 'hero' };

  characters = uniqueBy(characters, (c) => c.id);
  if (characters.length === 1) {
    characters.push(defaultCharacterFromInput(params, 'companion'));
    issues.push('не найден companion — добавлен из любимой игрушки');
  }

  const hints = appearanceHints(params.appearance);
  for (const c of characters) {
    if (c.role === 'hero' || c.id === 'hero') {
      if (!c.visual_description.toLowerCase().includes('wearing') && hints.clothes) {
        c.visual_description = `${c.visual_description}, wearing ${hints.clothes}${hints.glasses}`.trim();
        issues.push(`character hero: добавлена одежда из профиля (${hints.clothes})`);
      }
    }
    if (hasCyrillic(c.visual_description)) {
      issues.push(`character ${c.id}: visual_description должен быть на английском`);
    }
    if (c.visual_description.length < 40) {
      issues.push(`character ${c.id}: visual_description слишком короткий`);
    }
  }
  return { characters, issues };
}

function normalizeScenes(rawScenes, characters) {
  const issues = [];
  const scenes = Array.isArray(rawScenes) ? rawScenes : [];
  if (scenes.length !== 4) {
    throw new StoryValidationError([`ожидалось ровно 4 сцены, получено ${scenes.length}`]);
  }
  const validIds = new Set(characters.map((c) => c.id));
  const normalized = scenes.map((scene, index) => {
    const sceneIndex = index + 1;
    const rawText = asString(scene?.text);
    if (rawText.length < 40) {
      throw new StoryValidationError([`сцена ${sceneIndex}: текст слишком короткий (${rawText.length} символов)`]);
    }
    const stripped = stripTrailingParentQuestion(rawText);
    if (stripped.removed) issues.push(`сцена ${sceneIndex}: вопрос для родителя был в тексте — удалён`);
    const text = stripped.text
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    const visual = asString(scene?.visual) || asString(scene?.image_prompt) || asString(scene?.action);
    if (!visual || visual.length < 20) {
      throw new StoryValidationError([`сцена ${sceneIndex}: отсутствует английское поле visual`]);
    }
    if (hasCyrillic(visual)) {
      issues.push(`сцена ${sceneIndex}: visual содержит кириллицу`);
    }
    let ids = Array.isArray(scene?.character_ids) ? scene.character_ids.map((id) => asString(id)).filter(Boolean) : [];
    ids = ids.filter((id) => validIds.has(id));
    if (ids.length === 0) {
      ids = characters.map((c) => c.id);
      issues.push(`сцена ${sceneIndex}: character_ids отсутствовали — подставлены все персонажи`);
    }
    return { index: sceneIndex, text, visual, character_ids: ids };
  });
  return { scenes: normalized, issues };
}

function normalizeQuestions(rawQuestions) {
  const issues = [];
  const list = Array.isArray(rawQuestions) ? rawQuestions : [];
  const normalized = [];
  for (const q of list) {
    const after = Number(q?.after_scene);
    if (![2, 4, 5].includes(after)) {
      issues.push(`вопрос с after_scene=${q?.after_scene} отброшен`);
      continue;
    }
    const question = asString(q?.question);
    if (!question) continue;
    const skill = asString(q?.skill) || asString(q?.skill_tag) || 'emotions';
    normalized.push({
      after_scene: after,
      question,
      parent_hint: asString(q?.parent_hint) || null,
      skill_tag: ['emotions', 'empathy', 'logic', 'imagination', 'speech', 'memory'].includes(skill) ? skill : 'emotions',
    });
  }
  const deduped = uniqueBy(normalized, (q) => q.after_scene);
  if (deduped.length < 2) {
    throw new StoryValidationError(['нужно минимум 2 вопроса с разными паузами (после сцен 2 и 4)']);
  }
  if (!deduped.some((q) => q.after_scene === 2) || !deduped.some((q) => q.after_scene === 4)) {
    throw new StoryValidationError(['вопросы должны быть после сцены 2 и после сцены 4']);
  }
  return { questions: deduped, issues };
}

export function normalizeStory(raw, params = {}, dna = null) {
  if (!raw || typeof raw !== 'object') {
    throw new StoryValidationError(['ответ модели не является объектом']);
  }
  const warnings = [];
  const { characters, issues: charIssues } = normalizeCharacters(raw.characters, params);
  warnings.push(...charIssues);
  const { scenes, issues: sceneIssues } = normalizeScenes(raw.scenes, characters);
  warnings.push(...sceneIssues);
  const { questions, issues: questionIssues } = normalizeQuestions(raw.questions);
  warnings.push(...questionIssues);

  const title = asString(raw.title) || `${params.childName || 'Малыш'} и ${params.theme || 'волшебная история'}`;
  if (!asString(raw.title)) warnings.push('title отсутствовал — подставлен fallback');

  const outline =
    asString(raw.story_outline) ||
    `${title}. ${scenes[0].text.slice(0, 180)}${scenes[0].text.length > 180 ? '…' : ''}`;
  if (!asString(raw.story_outline)) warnings.push('story_outline отсутствовал — собран из первой сцены');

  const coverVisual =
    asString(raw.cover_visual) ||
    asString(raw.cover_prompt) ||
    `${scenes[0].visual}. A warm iconic book-cover moment with the hero and companion, generous space at the top for a title.`;
  if (!asString(raw.cover_visual) && !asString(raw.cover_prompt)) {
    warnings.push('cover_visual отсутствовал — собран из первой сцены');
  }
  if (hasCyrillic(coverVisual)) warnings.push('cover_visual содержит кириллицу');

  const storyDna = {
    world_scale: asString(raw.story_dna?.world_scale) || dna?.world_scale || 'не указан',
    narrative_engine: asString(raw.story_dna?.narrative_engine) || dna?.narrative_engine || 'не указан',
    literary_voice: asString(raw.story_dna?.literary_voice) || dna?.literary_voice || 'не указан',
  };

  // Модели иногда дублируют вопрос в тексте сцены. Убираем, чтобы читалка
  // не показывала один и тот же вопрос дважды (в тексте и в карточке).
  for (const question of questions) {
    for (const scene of scenes) {
      if (scene.text.includes(question.question)) {
        scene.text = scene.text.replace(question.question, '').replace(/\n{3,}/g, '\n\n').trim();
        warnings.push(`вопрос после сцены ${question.after_scene} дублировался в тексте — удалён`);
      }
    }
  }

  // Пост-промпт валидация: очистка от технических скобок возраста и исправление согласования рода
  const childName = params.childName || 'Герой';
  const isGirl = params.gender === 'girl' || (childName.endsWith('а') || childName.endsWith('я'));
  const effectiveGender = isGirl ? 'girl' : 'boy';

  for (const scene of scenes) {
    scene.text = fixGenderAgreements(scene.text, childName, effectiveGender);
  }
  for (const question of questions) {
    question.question = fixGenderAgreements(question.question, childName, effectiveGender);
    if (question.parent_hint) {
      question.parent_hint = fixGenderAgreements(question.parent_hint, childName, effectiveGender);
    }
  }

  const age = Number(params.age) || 4;
  if (raw.age && Number(raw.age) !== age) warnings.push(`модель вернула age=${raw.age}, используем возраст профиля ${age}`);

  const sceneWords = scenes.map((s) => countWords(s.text));
  const totalWords = sceneWords.reduce((sum, n) => sum + n, 0);
  const band = ageBand(age);
  if (totalWords < band.total[0]) warnings.push(`текст короче цели: ${totalWords} слов < ${band.total[0]}`);
  if (totalWords > band.total[1]) warnings.push(`текст длиннее цели: ${totalWords} слов > ${band.total[1]}`);

  for (const cliche of ['Жил-был', 'Однажды', 'В некотором царстве', 'в одном волшебном лесу', 'Как-то раз']) {
    if (new RegExp(cliche, 'i').test(scenes.map((s) => s.text).join(' '))) {
      warnings.push(`найден штамп: «${cliche}»`);
    }
  }

  const name = params.childName || '';
  if (name && !scenes.some((s) => s.text.includes(name))) warnings.push('имя ребёнка не встречается в тексте');

  const baseStory = {
    title,
    age,
    theme: params.theme || 'Дружба',
    story_dna: storyDna,
    story_outline: outline,
    cover_visual: coverVisual,
    characters,
    scenes,
    questions,
    warnings,
    metrics: { total_words: totalWords, scene_words: sceneWords, target: band.total, age_band: band.label },
  };

  const editorial = runEditorialAgent(baseStory, params);
  const finalWarnings = [...warnings];
  if (editorial.fixesApplied?.length) {
    finalWarnings.push(...editorial.fixesApplied.map((f) => `агент-редактор: ${f}`));
  }

  return {
    ...editorial.story,
    warnings: finalWarnings,
    metrics: {
      ...editorial.story.metrics,
      target: band.total,
      age_band: band.label,
    },
  };
}

// --------------------------------------------------------
// 8. Оценка качества (для калибровки)
// --------------------------------------------------------
export function scoreStory(story) {
  const issues = [...(story.warnings || [])];
  const total = story.metrics?.total_words || 0;
  const [min, max] = story.metrics?.target || [0, Infinity];
  let score = 100;
  if (total < min) score -= Math.min(25, Math.round(((min - total) / min) * 40));
  if (total > max) score -= Math.min(20, Math.round(((total - max) / max) * 30));
  score -= Math.min(30, issues.length * 6);
  const pauses = new Set(story.questions.map((q) => q.after_scene));
  if (!pauses.has(2) || !pauses.has(4)) score -= 15;
  if (story.characters.length < 2) score -= 10;
  return { score: Math.max(0, Math.min(100, score)), issues, total_words: total, target: [min, max] };
}

// --------------------------------------------------------
// 9. Промпты для 3D-иллюстраций
// --------------------------------------------------------
function characterBlock(characters) {
  return characters
    .map((c) => `${c.name} (${c.id}): ${c.visual_description}`)
    .join(' ');
}

export function buildImagePrompt({ visual, characters = [], kind = 'scene' } = {}) {
  const base = asString(visual);
  if (!base) throw new Error('buildImagePrompt: visual is empty');
  const hero = characters.find((c) => c.role === 'hero' || c.id === 'hero');
  const heroRef = hero
    ? `[Character Reference: exact same face, ${hero.name}, consistent child proportions, strictly immutable hair color, hair length, hairstyle, eye color, facial features, wearing EXACTLY the same outfit throughout all scenes: ${hero.visual_description}].`
    : '';
  const composition =
    kind === 'cover'
      ? 'Warm iconic children’s book cover composition: hero and companion as the clear focal point, inviting eye contact, generous negative space at the top for a title, rich layered background. If any books, covers, spines, signs, or labels appear, they are completely blank with no lettering.'
      : 'Cinematic storybook composition with a clear focal point, natural camera angle, and a layered, hand-crafted environment. Strictly depict ONLY the action and setting of this scene; no random animals, no cosmic whales, no extra hallucinated creatures.';
  const people = characters.length ? `Characters in this image (strictly maintain exact immutable facial features, hairstyle, hair length, eye color, and clothing): ${characterBlock(characters)}.` : '';
  const style = /pixar|3d animated|3d render|feature film/i.test(base) ? '' : STYLE_3D_PIXAR;
  return `${heroRef} ${base}. ${composition} ${people} ${style}`.replace(/\s+/g, ' ').trim();
}

export function buildScenePrompt(story, scene) {
  const present = (story.characters || []).filter((c) => (scene.character_ids || []).includes(c.id));
  return buildImagePrompt({ visual: scene.visual, characters: present.length ? present : story.characters, kind: 'scene' });
}

export function buildCoverPrompt(story) {
  return buildImagePrompt({ visual: story.cover_visual, characters: story.characters, kind: 'cover' });
}

// --------------------------------------------------------
// 10. Ремонтный промпт
// --------------------------------------------------------
export function buildRepairPrompt(raw, issues) {
  return `Твой предыдущий JSON не прошёл валидацию.

Проблемы:
${issues.map((issue) => `- ${issue}`).join('\n')}

Исправь только эти проблемы, сохранив сюжет и текст. Верни ПОЛНЫЙ валидный JSON по контракту, без Markdown и пояснений. Предыдущий JSON:
${JSON.stringify(raw)}`;
}

/**
 * Расширение слишком короткой сказки без изменения сюжета.
 * Модель иногда пишет 300 слов вместо 400 — это ломает «3–5 минут чтения».
 */
export function buildLengthRepairPrompt(story, target) {
  const [min, max] = target || [380, 540];
  const sceneHint = (story.scenes || [])
    .map((scene) => `- Сцена ${scene.index}: сейчас ${countWords(scene.text)} слов, нужно примерно ${Math.max(85, Math.round((min + max) / 8))}–${Math.round((min + max) / 5)} слов`)
    .join('\n');
  return `Сказка получилась короче целевого объёма: ${story.metrics?.total_words || 0} слов вместо ${min}–${max}.

Расширь каждую сцену на 20–35%, не меняя сюжет, персонажей, их внешность, вопросы и финал:
${sceneHint}
- Добавь сенсорные детали (звук, запах, текстура), короткие живые диалоги и одно маленькое действие.
- Не добавляй новых персонажей, новых мест и новых поворотов сюжета.
- Не добавляй вопрос для родителя внутрь текста сцены.
- Сохрани тот же JSON-контракт и верни ПОЛНЫЙ валидный JSON, без Markdown.

Текущая сказка:
${JSON.stringify(story)}`;
}

// --------------------------------------------------------
// 11. Fallback-вопросы (последняя линия обороны)
// --------------------------------------------------------
export function fallbackQuestions(heroName = 'герой') {
  return [
    {
      after_scene: 2,
      question: `Что почувствовал ${heroName}, когда услышал шорох?`,
      parent_hint: 'Выслушайте ответ без оценки. Помогите ребёнку назвать эмоцию и вспомнить, кто поддержал героя.',
      skill_tag: 'emotions',
    },
    {
      after_scene: 4,
      question: `Кто помог ${heroName} стать смелее?`,
      parent_hint: 'Дайте ребёнку договорить. Можно вместе вспомнить самый тёплый момент сказки и пожелать добрых снов.',
      skill_tag: 'imagination',
    },
  ];
}
