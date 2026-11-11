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
  'Rendered as a high-end 3D animated children’s movie still in a charming 3D cartoon style: ' +
  'soft cinematic lighting, warm volumetric glow, tactile detailed materials, expressive rounded characters with large warm eyes, ' +
  'cozy fairytale atmosphere, gentle depth of field, rich natural colors, ultra-detailed, safe and comforting for young children, ' +
  'absolutely no text anywhere: no letters, no titles, no labels, no captions, no speech bubbles, no book spine text, no watermark, no logo, no signature, no UI. ' +
  'Any books, signs, or labels in the scene are completely blank.';
export const STYLE_3D_CARTOON = STYLE_3D_PIXAR;

import {
  declineRussianName,
  formatSafeForWhom,
  formatSafeCreationHeader,
  inferRussianNameGender,
  removeAgeFromText,
  fixGenderAgreements,
  getOPreposition,
  countWords,
  classifyClothingNarrativeRole,
} from './declension.mjs';
export {
  declineRussianName,
  formatSafeForWhom,
  formatSafeCreationHeader,
  inferRussianNameGender,
  removeAgeFromText,
  fixGenderAgreements,
  getOPreposition,
  countWords,
  classifyClothingNarrativeRole,
};

import {
  runEditorialAgent,
  proofreadRussianGrammar,
  formatRussianDialogues,
  applyYoification,
  applyTypographySpacing,
  sanitizeToneAndPurity,
  simplifyChildQuestion,
  removeTautologiesAndDuplications,
  verifyNarrativeIntegrity,
  LINGUISTIC_EDITORIAL_SYSTEM_PROMPT,
  buildLinguisticEditorialPrompt,
} from './editorialAgent.mjs';
export {
  runEditorialAgent,
  proofreadRussianGrammar,
  formatRussianDialogues,
  applyYoification,
  applyTypographySpacing,
  sanitizeToneAndPurity,
  simplifyChildQuestion,
  removeTautologiesAndDuplications,
  verifyNarrativeIntegrity,
  LINGUISTIC_EDITORIAL_SYSTEM_PROMPT,
  buildLinguisticEditorialPrompt,
};

import { generateDailyIdea } from './dailyIdeaGenerator.mjs';
export { generateDailyIdea };

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
2. 10 NARRATIVE ARCHETYPES:
   - Root the story structure, conflict, and climax in the assigned narrative archetype:
     1. inventors (Маленькие изобретатели: созидание, починка, крафт)
     2. miracle_mystery (Тайна пропавшего чуда: уютный детектив, поиск следов и улик)
     3. empathy_heart (Большое сердце для крохи: забота о меньшем, нежность, колыбельная)
     4. brave_step (Смелость маленького шага: преодоление робости, первый шаг)
     5. harmony_orchestra (Оркестр добрых дел: командная дружба непохожих талантов)
     6. horizon_voyage (Путешествие за горизонт: экспедиция по карте, преодоление преград)
     7. upside_down_fun (Праздник вверх дном: добрый юмор, игра, переворот правил)
     8. nature_guardians (Хранители природы и волшебства: бережный лад в природе)
     9. transformation_magic (Магия преображения: фантазия превращает обычные вещи в чудеса)
     10. calm_haven (Тихая гавань и возвращение домой: вечернее умиротворение перед сном)
3. PHYSICAL PROPS CONTINUITY (ОСЯЗАЕМЫЙ РЕКВИЗИТ):
   - Choose 2–3 concrete physical props (e.g. glowing lantern, star map, wooden compass, shell ribbon, key) that MUST appear in the scenes and will be accurately rendered by the 3D illustrator.
4. CHARACTER INTEGRATION:
   - The child's personality is not a passive label; it is the unique superpower that unlocks the story's gentle climax.
   - The toy companion retains its toy nature (plush texture, stitches, wheels, button eyes) while coming alive as a loyal sidekick.
5. CUSTOM THEME & MOOD DEPTH (STRICT BAN ON CLICHÉS):
   - The conflict, setting, and tactile actions MUST DERIVE 100% FROM THE CHOSEN THEME AND STORY MOOD.
   - ABSOLUTE BAN ON CLICHÉS: NEVER introduce freezing animals, shivering from cold, getting lost in dark woods, or fear of darkness UNLESS the parent explicitly chose a winter/cold/darkness theme!
   - In themes like "Fashion and Style" or "Circus" or "Cars", the action is about creativity, designing, playful mix-up, invention, or friendly cooperation — NOT about shivering or surviving the elements!
6. FOUR-SCENE DRAMATURGY:
   - Scene 1: Hook, atmosphere, meeting/waking the toy companion in the themed world.
   - Scene 2: Gentle mystery or challenge, ending with a natural pause for Question 1.
   - Scene 3: Climax where the child's kind choice solves the challenge (integrating parent wishes).
   - Scene 4: Grounding calm or celebration, tactile reassurance, safe embrace, ending with Question 2.
7. STRICT BREVITY & CONCISE JSON:
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
- MULTI-CHARACTER GENDER SEPARATION (РАЗДЕЛЕНИЕ РОДОВ ПЕРСОНАЖЕЙ):
  * When the child is a girl ("девочка") and her companion is masculine (он, енотик, мишка, щенок, кот, робот, лис, друг, папа): The child's actions are feminine (-ла / -лась), BUT the companion's actions MUST REMAIN MASCULINE!
  * STRICTLY FORBIDDEN to assign feminine verbs to masculine companions: «Он подмигнул пуговичным глазком и протянул лапку» (FORBIDDEN: «Он подмигнул ... и протянула»).
  * Each character's verbs MUST agree with that specific character's grammatical gender!
- DECLENSION OF NAMES (СКЛОНЕНИЕ ИМЕНИ): Correctly decline the child's Russian name in all grammatical cases!
  * Родительный падеж (кого? чьё?): «сердце Аэлиты», «ладошка Аэлиты» (FORBIDDEN: «сердце Аэлита»).
  * Дательный падеж (кому?): «навстречу Аэлите», «сказал Аэлите».
  * Творительный падеж (с кем?): «вместе с Аэлитой».
- ABSOLUTE BAN ON AGE IN BRACKETS OR TEXT:
  * NEVER write the child's age in brackets, parentheses, or inline in the story text (FORBIDDEN: «Аэлита (4 года)», «Малышка (5)», «(4 года)»). Age is ONLY a guideline for text complexity and vocabulary calibration.
- NATURAL CHILD-DIRECTED LITERARY RUSSIAN (ЕСТЕСТВЕННЫЙ ЯЗЫК ДЛЯ ДЕТЕЙ 2–6 ЛЕТ):
  * ABSOLUTELY FORBIDDEN: Awkward synthetic AI phrasing, weird biological/fabric metaphors (FORBIDDEN: «тканевые пятнышки затрепетали», «глазки наполнились серебром», «душа запела хрусталём»).
  * Use vivid, warm, sensory words understandable to a 2–6 year old. Speak naturally like a loving parent telling a cozy bedtime story.
- ANTI-TAUTOLOGY & LITERARY QUALITY (АНТИ-ТАВТОЛОГИЯ И ЛИТЕРАТУРНОЕ КАЧЕСТВО):
  * Категорически запрещены тавтологии, механические повторы слов ("бежал, бежал", "шевелились, шевелились") и канцеляризмы. Речь должна быть живой, тёплой, напевной и образной, как в лучших классических иллюстрированных книгах для малышей.
- ALL visual fields (\`characters[].visual_description\`, \`cover_visual\`, \`scenes[].visual\`) MUST be written in precise, concrete ENGLISH.
- Never transliterate Russian names in English visual fields; describe appearance naturally.

### 2. CUSTOM THEME DOMINANCE & MEANING THROUGH ACTION
- ПРИОРИТЕТ КАСТОМНОЙ ТЕМЫ (CUSTOM THEME DOMINANCE):
  * Если пользователь указал кастомную тему (например: «Новогодние праздники», «Поездка в цирк», «Мода и стиль», «День рождения»):
  * Кастомная тема имеет НАИВЫСШИЙ ПРИОРИТЕТ над общими категориями («волшебство», «природа»).
  * В КАЖДОЙ из 4 страниц ОБЯЗАТЕЛЬНО должны присутствовать минимум 2–3 физических осязаемых атрибута этой темы.
  * КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО игнорировать кастомную тему или сводить её к абстрактному фону!
  * КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА КЛИШЕ «СПАСЕНИЕ ОТ ХОЛОДА»: ЗАПРЕЩЕНО вставлять замерзающих зверей, озябшие лапки или обогрев от мороза, если только тема напрямую не про зиму или снег! Вся интрига и действие должны на 100% происходить внутри выбранной темы («Мода и стиль» — примерка, создание стиля, показ, праздник; «Цирк» — фокусы, трюки; «Машинки» — ремонт, трасса).
- STRICT SETTING SYNCHRONIZATION WITH SCENE 1 VISUAL (СИНХРОНИЗАЦИЯ НАЧАЛА С ИЛЛЮСТРАЦИЕЙ):
  * The text of Scene 1 (\`scenes[0].text\`) and the visual description of Scene 1 (\`scenes[0].visual\`) MUST DEPICT THE EXACT SAME ENVIRONMENT!
  * If the theme, outfit, or visual is outdoors (mountain trail, forest, stream, puddle jumping, sea, space, playground, raincoat and boots): the story text MUST START DIRECTLY OUTDOORS in media res!
  * FORBIDDEN OPENING CLICHÉS: "Жил-был", "Однажды", "В некотором царстве", "В одном волшебном лесу", "Как-то раз", as well as domestic bedroom clichés for outdoor stories (FORBIDDEN: "в приоткрытую форточку заглянул солнечный лучик и пощекотал носик", "в своей комнате проснулся"). If the hero is in a raincoat on a mossy path, start right on the path, feeling the drizzle or tapping the puddles!
- MEANING & MORAL: Every fairytale must have a clear, heartwarming meaning (friendship, kindness, perseverance, mutual aid, curiosity, courage). The moral MUST be expressed through the child's own courageous, kind, or ingenious ACTION in Scene 3, NEVER through preachy didactic lectures at the end.
- No brands, no real people, no pop-culture references, no advertisements.

### 3. CHARACTER BIBLE & NARRATIVE COSTUME ROLES (CRITICAL & STRICT)
- Every character MUST be a separate object in \`characters[]\`. NEVER merge the hero and the companion into one object.
- Required: exactly one \`role: "hero"\` (the child). Add one or two companions with \`role: "companion"\` or \`role: "friend"\`.
- IMMUTABLE CHARACTER ANCHOR (VISUAL FIELDS ONLY): The child's facial appearance, exact hairstyle, exact hair length, hair color, skin tone, eye color, AND exact clothing outfit MUST remain IDENTICAL across the cover and all 4 scenes in all visual description fields (\`characters[].visual_description\`, \`cover_visual\`, \`scenes[].visual\`).
- NARRATIVE CLOTHING PRINCIPLES IN RUSSIAN STORY TEXT:
  * STRICT BAN ON REPETITIVE CLOTHING BOILERPLATE: In everyday fairytales, casual clothes (sweaters, hoodies, casual dresses, overalls) do NOT drive the plot. NEVER waste opening lines mechanically describing what the child is wearing («Маша в любимом свитере поправила рукава» is STRICTLY FORBIDDEN). Start directly with action, wonder, dialogue, or theme!
  * THEMATIC COSTUMES & FUNCTIONAL GEAR: When the outfit is a special costume (superhero suit, astronaut spacesuit, wizard robe, knight armor) or functionally relevant to the setting (raincoat for puddles, cozy pajamas for bedtime), weave it as an active story element!
  * COSTUME BESTOWAL / ADVENTURE GEAR: For superheroes or special quests, the costume can either be the child's proud gear OR BESTOWED/GIVEN to the hero by friends/mentors in Scene 1 or 2 as special equipment for their kind mission!
- FAVORITE TOY & COMPANION CONTINUITY:
  * The favorite toy comes to life as the companion. Keep its toy nature visible (plush texture, stitches, button eyes).
  * The companion toy MUST be at the child's side from Scene 1 to the final bedtime embrace in Scene 4.
- SPECIAL WISHES OF THE PARENT: If provided, they MUST be fulfilled and become the emotional peak of Scene 3.

### 4. FOUR SCENES, STRICT WORD LIMITS & MOBILE LAYOUT
Write EXACTLY four scenes (\`scenes\` array with length exactly 4). NEVER 3, NEVER 5. Total reading time 3–5 minutes.
Strict word counts ensure fast reading and perfect mobile viewport fit without overflow:
- Age 2–3: 45–65 words per scene (total 180–260 words); short musical sentences (5–8 words), sound imitation / onomatopoeia, clear comforting actions.
- Age 4–5: 75–100 words per scene (total 300–400 words); lively simple dialogue, sensory details, empathy, friendship.
- Age 6: 105–130 words per scene (total 420–520 words); richer vocabulary, expanded plot, gentle humor, cause-and-effect.
Scene roles:
1. Hook & discovery: sensory opening, child in specific clothing meets/wakes the toy companion in the themed world.
2. Gentle problem / mystery matching theme and interests. Ends with action and natural pause for Question 1.
3. Creative action / emotional climax: hero uses empathy, courage, or teamwork to solve the situation. Fulfill parent wishes here.
4. Heartwarming resolution: sensory comfort, quiet warmth, safe return. Ends with natural pause for Question 2.
Use 2 short paragraphs per scene separated by "\\n\\n".

### 5. PEDAGOGICAL QUESTIONS (RULE OF ONE SIMPLE QUESTION)
- Return exactly 2 questions (one after scene 2: \`after_scene: 2\`, one after scene 4: \`after_scene: 4\`).
- Each question MUST contain EXACTLY ONE simple, direct question (max 10–12 words).
- AGE-CALIBRATED QUESTIONS:
  * For ages 2–3: focus on recognition, colors, and basic emotions («Какого цвета был фонарик?», «Как звёздочка улыбнулась?»).
  * For ages 4–6: focus on empathy and reflection («Что помогло героям помириться?», «Как бы ты поступил на месте героя?»).
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
- Style: 3D cartoon style / 3D animated children's movie still. No text, letters, captions, speech bubbles, watermarks, logos, signatures, or UI in any image. All books, covers, signs, and labels are completely blank.

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
// 3. Story DNA: динамическая генерация миров, спутников и крючков
// --------------------------------------------------------

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

export function resolveExactHairPrompt(appearance = {}) {
  const rawColor = String(appearance.hairColor || '').toLowerCase();
  const rawType = String(appearance.hairType || '').toLowerCase();
  const rawLength = String(appearance.hairLength || '').toLowerCase();
  const rawStructure = String(appearance.hairStructure || '').toLowerCase();
  const combined = `${rawLength} ${rawType} ${rawStructure} ${rawColor}`;

  const isCurly = combined.includes('кудр') || combined.includes('curly') || combined.includes('волнист') || combined.includes('wavy');
  const isStraight = combined.includes('прям') || combined.includes('straight');
  const isLong = combined.includes('длинн') || combined.includes('long');

  const isBlond = rawColor.includes('светл') || rawColor.includes('blond') || rawColor.includes('желт') || rawColor.includes('жёлт');
  const isDark = rawColor.includes('темн') || rawColor.includes('тёмн') || rawColor.includes('брюнет') || rawColor.includes('черн') || rawColor.includes('чёрн') || rawColor.includes('dark') || rawColor.includes('chestnut');
  const isRed = rawColor.includes('рыж') || rawColor.includes('red') || rawColor.includes('ginger');

  const colorPrefix = isBlond
    ? 'golden-blond'
    : isDark
    ? 'warm chestnut dark brown'
    : isRed
    ? 'vibrant ginger reddish-brown'
    : 'soft light-brown';

  if (isLong) {
    const texture = isCurly ? 'bouncy curly' : isStraight ? 'silky straight' : 'silky';
    return `${colorPrefix} ${texture} hair, distinctly long flowing below shoulders, with a neat cute ribbon, exact same hair length and tone across all scenes`;
  }
  if (isCurly) {
    return `${colorPrefix} bouncy curly hair`;
  }
  if (isStraight) {
    return `${colorPrefix} neat smooth straight silky hair`;
  }
  return `${colorPrefix} neat short playful hair`;
}

export function appearanceHints(appearance = {}) {
  const hairColor = HAIR_COLOR_EN[appearance.hairColor] || 'soft light-brown';

  let hairType = 'neat short playful';
  const rawType = String(appearance.hairType || '').toLowerCase();
  const rawLength = String(appearance.hairLength || '').toLowerCase();
  const rawStructure = String(appearance.hairStructure || '').toLowerCase();
  const combined = `${rawLength} ${rawType} ${rawStructure}`;
  const isCurly = combined.includes('кудр') || combined.includes('curly') || combined.includes('волнист') || combined.includes('wavy');
  const isStraight = combined.includes('прям') || combined.includes('straight');
  const isLong = combined.includes('длинн') || combined.includes('long');
  const isShort = combined.includes('коротк') || combined.includes('short');

  const LONG_HAIR_DESCRIPTOR = 'long flowing hair reaching below shoulders, neat hairstyle, consistent length';

  if (isLong && isCurly) {
    hairType = `${LONG_HAIR_DESCRIPTOR}, bouncy curly wavy with a small ribbon`;
  } else if (isLong && isStraight) {
    hairType = `${LONG_HAIR_DESCRIPTOR}, smooth straight silky with a small ribbon`;
  } else if (isShort && isCurly) {
    hairType = 'short playful bouncy curly';
  } else if (isShort && isStraight) {
    hairType = 'neat short straight';
  } else if (isCurly) {
    hairType = 'soft bouncy curly wavy';
  } else if (isStraight) {
    hairType = 'neat smooth straight silky';
  } else if (isLong) {
    hairType = `${LONG_HAIR_DESCRIPTOR}, with a small ribbon`;
  } else if (isShort) {
    hairType = 'neat short playful';
  } else if (HAIR_TYPE_EN[appearance.hairType]) {
    hairType = HAIR_TYPE_EN[appearance.hairType];
  }

  const exactHairPrompt = resolveExactHairPrompt(appearance);
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

  return { hairColor, hairType, exactHairPrompt, eyes, skin, clothes, toy, glasses, hasGlasses };
}

/**
 * Формирует детальные правила интеграции одежды/костюма в промпты генерации сказки
 */
export function formatClothingNarrativePrompt({ appearance = {}, theme = '', storyMood = '', customWishes = '', childName = 'Малыш' } = {}) {
  const fullClothingRus = formatFullClothingRus(appearance);
  const hints = appearanceHints(appearance);
  const classification = classifyClothingNarrativeRole({ appearance, theme, storyMood, customWishes });

  if (classification.isNarrativelyRelevant) {
    if (classification.role === 'costume') {
      const isSuper = /superhero|супергеро/i.test(classification.costumeType || '');
      return `
- ОДЕЖДА И КОСТЮМ ГЕРОЯ («${fullClothingRus}») — СЮЖЕТНЫЙ ЭЛЕМЕНТ:
  * В этой сказке одежда героя играет активную роль: это специальный ${isSuper ? 'супергеройский костюм' : 'сказочный костюм'} для приключений и добрых дел!
  * СЮЖЕТНЫЙ ХОД (выбери самый органичный для фабулы):
    ${isSuper ? `1) ВАРИАНТ «ВРУЧЕНИЕ КОСТЮМА»: в Сцене 1 или 2 спутник/волшебные друзья торжественно дарят или вручают ${childName} этот супергеройский костюм («${fullClothingRus}») для важной миссии по спасению друзей! Герой с гордостью надевает его и обретает уверенность.\n    2) ВАРИАНТ «СНАРЯЖЕНИЕ ГОТОВО»: ${childName} уже надел${childName.endsWith('а') || childName.endsWith('я') ? 'а' : ''} свой любимый костюм для игры в супергероя и отправляется на подвиг.` : `1) Герой уже одет в свой любимый ${fullClothingRus} для сказочного похода.\n    2) Герою вручают или помогают примерить ${fullClothingRus} как символ дружбы и посвящения в тайну.`}
  * Костюм должен служить действию (развеваться на ветру, согревать, помогать в полете или преодолении испытания), а НЕ быть сухим каталожным описанием ткани.
  * В 3D-иллюстрациях (visual-поля) строго сохраняй: ${hints.clothes}.
`.trim();
    }

    if (classification.role === 'thematic_fashion') {
      return `
- ОДЕЖДА ГЕРОЯ («${fullClothingRus}») — ЦЕНТРАЛЬНАЯ ТЕМА СКАЗКИ:
  * Тема посвящена стилю, моде, примерке и пошиву нарядов.
  * Обыграй выбор, преображение или создание наряда («${fullClothingRus}») как увлекательный творческий процесс и радость совместного праздника.
  * В 3D-иллюстрациях (visual-поля) строго сохраняй: ${hints.clothes}.
`.trim();
    }

    // Functional
    return `
- ОДЕЖДА ГЕРОЯ («${fullClothingRus}») — ПРАКТИЧЕСКАЯ ДЕТАЛЬ СИТУАЦИИ:
  * Одежда («${fullClothingRus}») защищает героя или помогает в обстановке (сапожки для весёлых брызг в лужах, тёплый пуховик от свежего ветерка, мягкая пижамка для засыпания).
  * Упомяни её ТОЛЬКО через реальное действие в сюжете (прыгнул в лужу в сапожках, уютно поправил воротник), БЕЗ шаблонного занудного описания цветов и пуговиц.
  * В 3D-иллюстрациях (visual-поля) строго сохраняй: ${hints.clothes}.
`.trim();
  }

  // Everyday casual (свитер, толстовка, комбинезончик, платье)
  return `
- ОДЕЖДА ГЕРОЯ («${fullClothingRus}») — ТОЛЬКО ВИЗУАЛЬНЫЙ ЯКОРЬ ДЛЯ ИЛЛЮСТРАЦИЙ (ПОВСЕДНЕВНАЯ ОДЕЖДА):
  * КАТЕГОРИЧЕСКИЙ ЗАПРЕТ ШАБЛОННЫХ ОПИСАНИЙ ОДЕЖДЫ В РУССКОМ ТЕКСТЕ!
  * СТРОГО ЗАПРЕЩЕНО начинать сказку со стереотипного описания одежды («${childName} в своём любимом свитере/платьице поправил рукава...» — ЗАПРЕЩЕНО!).
  * Повседневная одежда не играет роли в этом сюжете. Не трать на неё драгоценные слова сказки: начинай СРАЗУ с интриги, настроения, звука, действия или живого диалога со спутником.
  * Упоминать одежду в тексте можно ТОЛЬКО мимолётно при конкретном осязаемом действии (например, «положил камушек в кармашек»). Специально описывать фасон, цвет или ткань свитера/платья ЗАПРЕЩЕНО.
  * В 3D-иллюстрациях (visual-поля) обязательно сохраняй: ${hints.clothes} для 100% консистентности персонажа на картинках.
`.trim();
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
    return { label: '2–3 года', total: [180, 260], perScene: [45, 65], sentences: 'короткие, музыкальные, 5–8 слов, с повторами и звукоподражанием' };
  }
  if (age <= 5) {
    return { label: '4–5 лет', total: [300, 400], perScene: [75, 100], sentences: 'живые диалоги, средние предложения, эмпатия и взаимопомощь' };
  }
  return { label: '6 лет', total: [420, 520], perScene: [105, 130], sentences: 'богатый словарь, причинно-следственные связи, мягкий юмор' };
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

  // Динамическая адаптация мира под кастомные интересы ребёнка
  for (const rawInterest of params.interests || []) {
    const i = String(rawInterest).trim();
    if (i.length >= 3) {
      const iLow = i.toLowerCase();
      if (iLow.includes('пузыр')) {
        pool.push({
          type: 'Glade of Rainbow Soap Bubbles (Поляна радужных мыльных пузырей)',
          desc: 'солнечная поляна, где летают огромные переливающиеся мыльные пузыри, в которых отражаются цветы и улыбки друзей',
        });
      } else if (iLow.includes('робот') || iLow.includes('лего') || iLow.includes('конструкт')) {
        pool.push({
          type: `Invention Workshop (Мастерская добрых открытий и ${i})`,
          desc: `уютный сказочный городок с яркими кубиками, шестерёнками из карамели и весёлыми механическими помощниками`,
        });
      } else if (iLow.includes('рис') || iLow.includes('краск') || iLow.includes('творч')) {
        pool.push({
          type: 'Valley of Living Colors (Долина живых красок)',
          desc: 'волшебная поляна, где травы меняют цвет от добрых поступков, а камушки расписываются сказочными узорами',
        });
      } else if (iLow.includes('музык') || iLow.includes('песн') || iLow.includes('танц')) {
        pool.push({
          type: 'Grove of Melodic Bells (Роща звонких колокольчиков)',
          desc: 'сказочный лес, где лёгкий ветерок играет добрую музыку на хрустальных листьях и цветах',
        });
      } else if (iLow.includes('пазл') || iLow.includes('головолом')) {
        pool.push({
          type: 'Secret Mosaic Garden (Сад мозаичных дорожек)',
          desc: 'удивительный парк, где друзья собирают разноцветные дорожки-пазлы, открывая тайные цветочные поляны',
        });
      }
    }
  }

  if (pool.length > 0) {
    return pick(pool, random);
  }

  const child = params.childName || 'Герой';
  const mood = params.storyMood || params.mood || 'Приключение';
  const themeName = (params.theme || mood).trim();
  return {
    type: `Fairytale Realm of ${themeName} (Волшебный мир: ${themeName})`,
    desc: `удивительное сказочное пространство темы «${themeName}», где ${child} исследует чудеса, решает добрые задачи и радуется вместе с друзьями`,
  };
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

  const toyName = (params.appearance?.toy || params.toy || 'верный друг').trim();
  return `верный и добрый спутник (${toyName}): ласково подмигивает пуговичным глазком, согревает ладошку и всегда готов прийти на выручку`;
}

function getThemedHook(params, random = Math.random) {
  const interests = (params.interests || []).map((i) => i.toLowerCase());
  const theme = (params.theme || '').toLowerCase();
  const wishes = (params.customWishes || '').toLowerCase();
  const clothing = String(params.appearance?.clothingItem || params.appearance?.clothing || params.appearance?.outfit || '').toLowerCase();
  const mood = String(params.storyMood || params.mood || '').toLowerCase();
  const isBedtime = mood.includes('сон') || theme.includes('сон');

  // 1. Зимняя / новогодняя сказка
  if (theme.includes('новогод') || theme.includes('нов год') || theme.includes('рождеств') || theme.includes('зим') || theme.includes('мороз') || theme.includes('снег')) {
    const winterHooks = [
      'Пушистые резные снежинки тихо кружились в воздухе, а искристый снег пах сладкими мандаринами и праздничной хвоей.',
      'С пушистых заснеженных веток тихо вспорхнула птичка, осыпав дорожку веером серебристых снежинок.',
      'На нарядной пушистой ёлке мягко звенел хрустальный колокольчик, а под ногами весело поскрипывал чистый белый снежок.',
    ];
    return pick(winterHooks, random);
  }

  // 2. Дождевик и сапожки (лужи, ручей, горная тропа, свежий дождик)
  if (clothing.includes('дождевик') || clothing.includes('сапожк') || theme.includes('дожд') || theme.includes('луж')) {
    const rainHooks = [
      'Звонкий горный ручеёк весело перекатывал гладкие камушки, а в воздухе пахло свежей хвоей и тёплым дождиком.',
      'Яркие сапожки весело шлёпнули по прозрачной лужице, подняв веер солнечных хрустальных брызг.',
      'Сквозь влажные изумрудные листья ласково проглянуло солнышко, играя бликами на чистых дождевых капельках.',
      'На горной тропе звенели хрустальные капли, стекая с пушистых ветвей прямо в весёлый прозрачный ручей.',
    ];
    return pick(rainHooks, random);
  }

  // 3. Море / океан / пляж / подводный мир
  if (wishes.includes('мор') || wishes.includes('океан') || theme.includes('мор') || theme.includes('океан') || theme.includes('пляж') || theme.includes('рыбк') || theme.includes('кит')) {
    const seaHooks = [
      'Ласковая бирюзовая волна с тихим шелестом коснулась золотистого песка, оставив у самой кромки воды сияющую перламутровую ракушку.',
      'Тёплый морской бриз принёс свежий солоноватый аромат, а над прозрачной зеркальной гладью весело закружились чайки.',
      'На тёплом песчаном берегу сияли разноцветные гладкие камушки, умытые чистой лазурной волной.',
    ];
    return pick(seaHooks, random);
  }

  // 4. Космос / звёзды / ракеты
  if (interests.some((i) => i.includes('косм')) || theme.includes('косм') || theme.includes('звезд') || theme.includes('звёзд') || theme.includes('планет')) {
    const spaceHooks = [
      'За панорамным прозрачным куполом мягко мерцали далёкие созвездия, рассыпая в тишине золотистую звёздную пыльцу.',
      'Маленькая серебристая комета тихо прочертила бархатное небо, оставив за собой мерцающий искристый след.',
      'Мерцающие кольца далёкой планеты тихо переливались всеми оттенками сиреневого и золотого света.',
    ];
    return pick(spaceHooks, random);
  }

  // 5. Полёты / самолётики / воздушный шар
  if (theme.includes('самолёт') || theme.includes('самолет') || theme.includes('полёт') || theme.includes('полет') || theme.includes('шар')) {
    const flightHooks = [
      'На ладошку опустилось лёгкое розовое пёрышко, пахнущее высокими пушистыми облаками и тёплым попутным ветром.',
      'Сквозь пушистые ватные облака открылся удивительный вид на цветущие холмы и зеркальные озёра.',
      'Ласковый попутный ветерок весело надул разноцветный парус, зовя в плавный полёт над солнечной долиной.',
    ];
    return pick(flightHooks, random);
  }

  // 6. Динозаврики
  if (interests.some((i) => i.includes('дино')) || theme.includes('дино')) {
    const dinoHooks = [
      'В тёплой зелёной долине весело шелестели гигантские папоротники, а над ласковым озером поднимался лёгкий солнечный туман.',
      'Под изумрудным папоротником тихонько зашелестел сказочный лист, открывая тайную дорожку в долину динозавриков.',
      'Тёплый ветерок донёс весёлый топот маленьких ножек: в долине начиналась добрая игра в прятки.',
    ];
    return pick(dinoHooks, random);
  }

  // 7. Машинки / транспорт / железная дорога
  if (interests.some((i) => i.includes('машин')) || theme.includes('машин') || theme.includes('поезд') || theme.includes('дорог')) {
    const carHooks = [
      'Маленький светофорчик весело подмигнул зелёным огоньком, приглашая отправиться в путь по солнечной мостовой.',
      'Уютный сказочный моторчик тихонько заурчал, а фары осветили дорогу навстречу новому интересному маршруту.',
      'Мягкий перестук колёс по цветным рельсам наполнял всё вокруг ожиданием весёлого путешествия.',
    ];
    return pick(carHooks, random);
  }

  // 8. Цирк / праздник / день рождения
  if (theme.includes('цирк') || theme.includes('праздник') || theme.includes('день рожд')) {
    const circusHooks = [
      'В воздухе запахло сладким попкорном, а из-за бархатной кулисы вылетел разноцветный праздничный серпантин.',
      'В лучах прожекторов закружились радужные мыльные пузыри, переливающиеся всеми цветами радости.',
      'Задорная музыка сказочной ярмарки звенела колокольчиками, обещая настоящий калейдоскоп сюрпризов.',
    ];
    return pick(circusHooks, random);
  }

  // 9. Мода / стиль / мастерская / творчество
  if (theme.includes('мод') || theme.includes('стил') || theme.includes('наряд') || mood.includes('творч')) {
    const styleHooks = [
      'На деревянном верстаке мягко шуршали рулоны цветной ткани, а в баночках весело звенели перламутровые пуговицы.',
      'В солнечной мастерской витал свежий аромат деревянных карандашей и ярких акварельных красок.',
      'Солнечный зайчик весело заплясал на золотой мерной ленте, словно подсказывая новую творческую идею.',
    ];
    return pick(styleHooks, random);
  }

  // 10. Природа / животные / горы / лес
  if (interests.some((i) => i.includes('животн')) || interests.some((i) => i.includes('природ')) || theme.includes('лес') || theme.includes('гор') || wishes.includes('лес')) {
    const natureHooks = [
      'Звонкий горный ручеёк весело перекатывал гладкие камушки, а в воздухе пахло свежей хвоей и нагретой солнцем смолой.',
      'На лесной тропинке ласково шелестела изумрудная листва, и сквозь кроны высоких деревьев пробивались золотистые лучи.',
      'Под ногами мягко пружинил пушистый мох, а на соседней ветке беззаботно звенели птичьи трели.',
      'Свежий утренний ветерок весело качнул ромашки на полянке, стряхивая прозрачные хрустальные капельки росы.',
    ];
    return pick(natureHooks, random);
  }

  // 11. Спокойный сон (только если выбран сон)
  if (isBedtime) {
    const bedtimeHooks = [
      'В мягких вечерних сумерках зажёгся тёплый ночничок, и по стене заплясали добрые сонные звёздочки.',
      'В сумерках тихо зазвенел хрустальный колокольчик, зовя за собой в мягкую страну добрых снов.',
      'Тёплый вечерний ветерок тихо убаюкивал сонные травинки, наполняя мир тишиной и покоем.',
    ];
    return pick(bedtimeHooks, random);
  }

  // 12. Общий универсальный крючок на природе / в мире сказки (по умолчанию)
  const defaultHooks = [
    'В чистом воздухе витало радостное предчувствие открытия: впереди петляла неизведанная тропинка, залитая ласковым светом.',
    'Весёлый озорной ветерок ласково взъерошил листья на ветках, словно подсказывая, что за ближайшим поворотом прячется маленькое чудо.',
    'Тёплые солнечные лучи золотили верхушки деревьев, наполняя всё вокруг бодрой радостью и предвкушением доброго приключения.',
  ];
  return pick(defaultHooks, random);
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

// --------------------------------------------------------
// 5.5. 10 сюжетных архетипов сказок для детей 2–6 лет
// --------------------------------------------------------
export const STORY_ARCHETYPES = [
  {
    id: 'inventors',
    title: 'Маленькие изобретатели',
    category: 'Творческое созидание и крафт',
    summary: 'Герои мастерят, чинят или собирают с нуля необычный волшебный предмет или механизм',
    conflict: 'Нужно смастерить, починить или собрать волшебный предмет с нуля (мостик из шишек, летающий зонтик, необычный праздничный наряд, фонарик из светлячков)',
    childAction: 'Проба, забавная ошибка, нестандартная догадка («а что если привязать ленточку к ракушке?») и восторг от создания осязаемого предмета своими руками',
    toyRole: 'Подаёт детальки, держит край ткани или забавно примеряет чертёж на носик',
    climaxBeat: 'Механизм или вещь оживает и запускает добрый праздник',
    idealThemes: ['Творчество', 'Космос', 'Машинки', 'Мода и стиль', 'Игры и игрушки'],
  },
  {
    id: 'miracle_mystery',
    title: 'Тайна пропавшего чуда',
    category: 'Уютный детский детектив и исследование',
    summary: 'Поиск пропавшего звука, лучика, эха или ключика по цепочке добрых сенсорных улик',
    conflict: 'Куда спряталось эхо? Кто оставляет искристые следы на тропинке? Где ночует солнечный зайчик на закате?',
    childAction: 'Наблюдательность, сбор сенсорных подсказок (звон, шорох, цветная пыльца) и радость от разгадки доброго секрета',
    toyRole: 'Находит незаметную для взрослого крошечную подсказку на уровне земли',
    climaxBeat: 'Герой раскрывает добрый секрет и находит источник чуда',
    idealThemes: ['Любознательность', 'Природа и лес', 'Следопыты', 'Волшебство'],
  },
  {
    id: 'empathy_heart',
    title: 'Большое сердце для крохи',
    category: 'Забота, чуткость и эмпатия',
    summary: 'Встреча с кем-то очень маленьким, растерянным или робким и помощь через нежность',
    conflict: 'Встреча с кем-то растерянным, робким или очень маленьким (сонная звёздочка без огонька, птенчик, потерявший веточку, пугливый мотылёк)',
    childAction: 'Умение понять без слов: согреть в ладошках, спеть колыбельную, укрыть листиком или шарфом, подарить чувство защищённости',
    toyRole: 'Делится своим мягким боком или уступает свою подушечку',
    climaxBeat: 'Малыш-найдёныш оживает, загорается мягким светом и снова чувствует себя в безопасности',
    idealThemes: ['Доброта', 'Дружба', 'Спокойный сон', 'Животные'],
  },
  {
    id: 'brave_step',
    title: 'Смелость маленького шага',
    category: 'Преодоление робости и страха',
    summary: 'Герой делает первый решительный шаг навстречу новому, опираясь на верного друга',
    conflict: 'Предстоит сделать то, перед чем замирает сердце (съехать с высокой горки, шагнуть в пещеру светлячков, войти на незнакомую поляну)',
    childAction: 'Опора на верного плюшевого друга, зажигание внутреннего огонька уверенности и победный первый шаг',
    toyRole: 'Служит якорем доверия и первой делает робкий шаг вместе с ребёнком',
    climaxBeat: 'Шаг сделан — и за ним открывается не опасность, а невероятное чудо и радость',
    idealThemes: ['Смелость', 'Преодоление темноты', 'Приключения', 'Спорт и движение'],
  },
  {
    id: 'harmony_orchestra',
    title: 'Оркестр добрых дел',
    category: 'Командная дружба разных талантов',
    summary: 'Большая задача объединяет непохожих друзей, и каждый вносит свой уникальный талант',
    conflict: 'Задача слишком велика для одного; собираются друзья с совершенно непохожими способностями (один быстрый, второй зоркий, третий поёт)',
    childAction: 'Добрый лидер: объединяет друзей, помогает каждому раскрыть свою уникальную силу без соперничества',
    toyRole: 'Скрепляет команду своей верностью и вызывает общую улыбку в момент заминки',
    climaxBeat: 'Складывается единый слаженный «оркестр», и общее дело побеждает',
    idealThemes: ['Дружба', 'Приключения', 'Музыка', 'Команда'],
  },
  {
    id: 'horizon_voyage',
    title: 'Путешествие за горизонт',
    category: 'Экспедиция и первооткрывательство',
    summary: 'Герои снаряжаются в экспедицию по старинной карте к неизведанной вершине или острову',
    conflict: 'Найдена старинная сказочная карта! Герои снаряжаются в путь к неведомому острову или водопаду радуги',
    childAction: 'Находчивость при преодолении природных преград (туман из мыльных пузырей, река из киселя, ветреный перевал)',
    toyRole: 'Держит компас, забавно выглядывает из походного кармашка или рюкзачка',
    climaxBeat: 'Герои достигают вершины и видят перед собой захватывающий дух мир с высоты',
    idealThemes: ['Приключения', 'Путешествия', 'Космос', 'Динозавры'],
  },
  {
    id: 'upside_down_fun',
    title: 'Праздник вверх дном',
    category: 'Озорной юмор, игра и переворот правил',
    summary: 'В мире всё весело перепуталось, и игра по новым правилам превращает путаницу в общий праздник',
    conflict: 'В сказочном мире всё пошло кувырком самым весёлым образом (облака пахнут клубникой, гравитация стала батутной, деревья щекочут ветерок)',
    childAction: 'Не пугается путаницы, а подхватывает игру, придумывая смешные правила и заражая всех радостным смехом',
    toyRole: 'Забавно подпрыгивает на мягких лапках, кувыркается и становится главным источником веселья',
    climaxBeat: 'Общий добрый взрыв смеха и праздник, объединяющий всех жителей мира',
    idealThemes: ['Юмор и смех', 'Праздник', 'День рождения', 'Шутки'],
  },
  {
    id: 'nature_guardians',
    title: 'Хранители природы и волшебства',
    category: 'Бережная гармония мира',
    summary: 'Бережное наведение лада в природе: очистить ручеёк, укрыть цветы, вернуть пение птицам',
    conflict: 'Нарушился природный ритм (ручеёк забился опавшими звёздами и перестал звенеть, лунные кувшинки забыли закрыться, ветерок запутался в кронах)',
    childAction: 'Заботливые руки, бережное отношение: очистить русло, распутать веточки, вернуть цветам их сонную тишину',
    toyRole: 'Аккуратно собирает листочки лапками, помогает герою наводить лад',
    climaxBeat: 'Природа откликается — ручеёк звенит хрустальной песней, распускаются светящиеся бутоны',
    idealThemes: ['Природа и лес', 'Животные', 'Доброта', 'Времена года'],
  },
  {
    id: 'transformation_magic',
    title: 'Магия преображения',
    category: 'Сила детской фантазии в привычных вещах',
    summary: 'Сила воображения превращает коробку в звездолёт, а подушки — в волшебные острова',
    conflict: 'Обычные бытовые предметы в руках героя оживают и открывают волшебные миры (коробка становится звездолётом, диванные подушки — островами в океане)',
    childAction: 'Полёт воображения, где ребёнок видит чудо там, где взрослый видит обыденность',
    toyRole: 'Превращается в верного штурмана или первого помощника капитана',
    climaxBeat: 'Мир детской комнаты и сказочный космос сливаются в единое захватывающее приключение',
    idealThemes: ['Волшебство', 'Творчество', 'Сказки перед сном', 'Фантазия'],
  },
  {
    id: 'calm_haven',
    title: 'Тихая гавань и возвращение домой',
    category: 'Вечернее умиротворение и сонный ритуал',
    summary: 'Мягкое замедление ритма, укладывание игрушки спать и глубокое чувство защищённости',
    conflict: 'Большой день приключений подходит к концу. Мир плавно замедляется (фонарщики гасят праздничные огни, сонные облака застилают небо)',
    childAction: 'Замедление дыхания, благодарность прожитому дню, бережное укладывание игрушки в мягкую постельку, тёплые объятия',
    toyRole: 'Устало трёт глазки, сладко зевает и сворачивается калачиком у подушки',
    climaxBeat: 'Зажигается самый мягкий ночной огонёк, звучит тихая сказка на ночь',
    idealThemes: ['Спокойный сон', 'Семья и дом', 'Уют', 'Колыбельная'],
  },
];

export function selectStoryArchetype(params = {}, random = Math.random) {
  const theme = String(params.theme || '').toLowerCase();
  const mood = String(params.storyMood || params.mood || '').toLowerCase();
  const interests = (params.interests || []).map((i) => String(i).toLowerCase());
  const personality = String(params.personality || '').toLowerCase();

  const scored = STORY_ARCHETYPES.map((arch) => {
    let score = 0;
    for (const ideal of arch.idealThemes) {
      const idl = ideal.toLowerCase();
      if (theme.includes(idl)) score += 3;
      if (mood.includes(idl)) score += 3;
      if (interests.some((it) => it.includes(idl))) score += 2;
    }
    if (arch.id === 'calm_haven' && (mood.includes('сон') || theme.includes('сон'))) score += 5;
    if (arch.id === 'upside_down_fun' && (mood.includes('юмор') || mood.includes('смех') || personality.includes('весел'))) score += 5;
    if (arch.id === 'inventors' && (mood.includes('творч') || theme.includes('творч') || interests.some((it) => it.includes('машин') || it.includes('робот')))) score += 4;
    if (arch.id === 'brave_step' && (theme.includes('смел') || personality.includes('смел'))) score += 5;
    if (arch.id === 'miracle_mystery' && (personality.includes('любознательн') || theme.includes('тайн') || theme.includes('загад'))) score += 4;
    if (arch.id === 'empathy_heart' && (theme.includes('добр') || theme.includes('забот'))) score += 3;
    if (arch.id === 'horizon_voyage' && (mood.includes('приключ') || theme.includes('космос') || interests.some((it) => it.includes('динозавр')))) score += 4;
    if (arch.id === 'nature_guardians' && (theme.includes('природ') || theme.includes('лес') || theme.includes('животн'))) score += 4;
    if (arch.id === 'transformation_magic' && (theme.includes('волшеб') || theme.includes('фантаз'))) score += 3;
    return { arch, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topCandidates = scored.filter((item) => item.score >= Math.max(1, topScore - 1));

  const chosenIndex = Math.floor(random() * topCandidates.length);
  return topCandidates[chosenIndex]?.arch || STORY_ARCHETYPES[0];
}

export function chooseStoryDna(params = {}, random = Math.random) {
  const world = getThemedWorld(params, random);
  const quirk = getThemedCompanionQuirk(params, random);
  const hook = getThemedHook(params, random);
  const hints = appearanceHints(params.appearance);
  const trait = params.personality || 'Добрый';
  const moodProfile = getMoodProfile(params.storyMood || params.mood, params.theme || '');
  const profile = getPersonalityProfile(trait, params.theme || '', params.storyMood || params.mood);
  const archetype = selectStoryArchetype(params, random);

  return {
    world_scale: world.type,
    world_description: world.desc,
    narrative_engine: moodProfile.moodLabel,
    narrative_description: `${moodProfile.engineFocus}. ${moodProfile.conflictType}`,
    literary_voice: profile.voice,
    personality_profile: profile,
    mood_profile: moodProfile,
    companion_quirk: quirk,
    opening_hook: hook,
    hero_anchor: getHeroAnchor(params, hints),
    age_band: ageBand(Number(params.age) || 4),
    archetype,
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
  const interestsList = (params.interests || []).filter(Boolean);
  const childInterestsText = interestsList.length > 0 ? interestsList.join(', ') : 'приключения и добрые открытия';

  const fullClothingRus = formatFullClothingRus(params.appearance);

  const mood = params.storyMood || params.mood || '';
  const isBedtime = mood === 'Спокойный сон' || (params.theme || '').toLowerCase().includes('сон');

  let scene4Requirement = '- Сцена 4: Тёплый радостный дневной финал, общий праздник дружбы и взаимовыручки, крепкие объятия с друзьями, улыбки и благодарность. Завершается паузой для Вопроса 2.';
  if (isBedtime) {
    scene4Requirement = '- Сцена 4: Умиротворяющий сонный финал, мягкий свет звёзд, уют, покой перед сном. Завершается паузой для Вопроса 2.';
  } else if (mood === 'Творчество') {
    scene4Requirement = '- Сцена 4: Радостный дневной финал, гордость за созданное, показ творений друзьям, восхищение и творческое вдохновение под ярким солнцем. Завершается паузой для Вопроса 2.';
  } else if (mood === 'Приключение') {
    scene4Requirement = '- Сцена 4: Торжественный дневной финал, победное возвращение из похода, общий праздник открытий с друзьями, звонкий смех и восторг. Завершается паузой для Вопроса 2.';
  } else if (mood === 'Юмор и смех') {
    scene4Requirement = '- Сцена 4: Задорный весёлый финал, общий искренний хохот над доброй путаницей, солнечные улыбки и озорное празднование. Завершается паузой для Вопроса 2.';
  }

  const user = `ВХОДНЫЕ ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗИРОВАННОЙ СКАЗКИ

1. ГЕРОЙ, ОДЕЖДА И ВНЕШНИЙ ВИД (ОБЯЗАТЕЛЬНО ДЛЯ СЮЖЕТА):
- Имя: ${params.childName || 'Малыш'}
- Пол: ${genderRus}
- Падежные формы имени: Родительный (кого? чьё?): «сердце ${declinedName.gen}», Дательный (кому?): «навстречу ${declinedName.dat}», Творительный (с кем?): «вместе с ${declinedName.ins}».
- ВАЖНЕЙШЕЕ ПРАВИЛО ГРАММАТИКИ: ${isGirl ? `ГЕРОИНЯ — ДЕВОЧКА! Все глаголы прошедшего времени для девочки ОБЯЗАНЫ иметь женские окончания -ла / -лась («${params.childName} почувствовала», «улыбнулась», «побежала», «решила»). Категорически запрещено писать в мужском роде! Обязательно склоняй имя: «сердце ${declinedName.gen}»! ДЛЯ СПУТНИКА МУЖСКОГО РОДА (он, енотик, мишка, щенок, робот) ГЛАГОЛЫ ОБЯЗАНЫ ОСТАВАТЬСЯ МУЖСКОГО РОДА («Он подмигнул пуговичным глазком и протянул лапку»)!` : `Герой — мальчик. Все глаголы прошедшего времени — мужского рода («${params.childName} почувствовал», «улыбнулся»). Обязательно склоняй имя: «сердце ${declinedName.gen}»!`}
${formatClothingNarrativePrompt({
  appearance: params.appearance,
  theme: params.theme,
  storyMood: mood,
  customWishes: params.customWishes,
  childName: params.childName,
})}
- Волосы, глаза и кожа: ${params.appearance?.hairColor || 'русые'} ${params.appearance?.hairType || 'мягкие'} волосы, ${params.appearance?.eyeColor || 'карие'} глаза, ${params.appearance?.skinTone || 'персиковая'} кожа${hints.hasGlasses ? ', милые круглые очки' : ''}.
- Любимая игрушка-спутник: ${toy}.
  * Игрушка-спутник оживает, сохраняя свою форму, и находится рядом с героем с самого начала Сцены 1 до ${isBedtime ? 'финального сна' : 'победного финала'} в Сцене 4!
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
- Интересы и увлечения ребёнка: ${childInterestsText}
  * ОБЯЗАТЕЛЬНОЕ ВПЛЕТЕНИЕ ИНТЕРЕСОВ: Органично вплети любимые интересы ребёнка (${childInterestsText}) в сюжет сказки! Пусть герой играет в то, что любит, использует элементы этих увлечений или свои умения в преодолении трудностей.
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
- Сцена 1: Знакомство с миром, погружение в тему «${params.theme || 'Дружба'}» и встреча со спутником (${toy})${classifyClothingNarrativeRole({ appearance: params.appearance, theme: params.theme, storyMood: mood, customWishes: params.customWishes }).isNarrativelyRelevant ? `, органичное сюжетное раскрытие костюма (${fullClothingRus})` : ''}.
- СИНХРОНИЗАЦИЯ НАЧАЛА С ИЛЛЮСТРАЦИЕЙ: Текст Сцены 1 и иллюстрация Сцены 1 обязаны происходить В ОДНОМ И ТОМ ЖЕ МЕСТЕ! Если герой на улице (ручей, тропинка, лужи, лес, горы, космос) — начинай прямо на улице в сапожках/дождевике/скафандре! Категорически ЗАПРЕЩЕНЫ штампы («лучик заглянул в форточку и пощекотал носик», «в своей комнате проснулся»).
- Сцена 2: Добрая интрига / маленькая задача. Завершается действием и паузой для Вопроса 1.
- Сцена 3: Кульминация и доброе решение: ${dna.hero_anchor}${params.customWishes ? `, исполнение пожелания «${params.customWishes}»` : ''}.
${scene4Requirement}
- Каждая сцена — это 2–4 небольших абзаца, а не одна короткая фраза. Не растягивай текст водой: добавляй сенсорные детали, диалоги и маленькие действия.
- СМЫСЛ И МОРАЛЬ: Сказка обязана нести добрый смысл и ценность (дружба, смелость, чуткость), но раскрываться они должны через ПОСТУПОК и ВЫБОР героя в Сцене 3, а НЕ через сухие нотации в конце. Категорически запрещены дидактические поучения («И понял малыш, что...»).
- Никаких заезженных штампов («Жил-был», «Однажды», «в одном волшебном лесу»).
- Ровно один вопрос после сцены 2 и ровно один после сцены 4. Вопросы — строго про переживания героев в этой истории под возраст ${band.label}.
- Герой и спутник — отдельные объекты в characters[]. Не склеивай их.
- visual-поля — только английский, без описания внешности персонажей: рендерер добавит её сам по character_ids.
${isBedtime ? '- Сказка должна быть тёплой, безопасной и пригодной для чтения перед сном.' : '- Сказка должна быть бодрой, вдохновляющей, наполненной дневной радостью и солнечной энергией.'}
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

  const mood = params.storyMood || params.mood || '';
  const isBedtime = mood === 'Спокойный сон' || (theme || '').toLowerCase().includes('сон');

  const rawProps = src.physical_props;
  let physical_props = [];
  if (Array.isArray(rawProps)) {
    physical_props = rawProps.map((p) => asString(p)).filter(Boolean);
  } else if (typeof rawProps === 'string' && rawProps.trim()) {
    physical_props = rawProps.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  }
  if (physical_props.length === 0) {
    physical_props = ['волшебный огонёк', toy];
  }

  const archetypeTitle = asString(src.archetype?.title || src.archetype_title || src.archetype) || 'Путешествие и добрые открытия';

  return {
    archetype: archetypeTitle,
    physical_props,
    psychological_profile: {
      age_focus: asString(psych.age_focus) || `Особенности возраста ${Number(params.age) || 4} лет: наглядность, эмоциональная безопасность, осязаемость`,
      character_strength: asString(psych.character_strength) || `Чуткость, доброта и внимание к окружающим`,
      therapeutic_goal: asString(psych.therapeutic_goal) || (isBedtime ? `Мягкая поддержка уверенности и спокойствия перед сном` : `Радостная поддержка инициативы, дружбы и уверенности`),
    },
    creative_concept: {
      core_metaphor: asString(concept.core_metaphor) || `Уютное открытие волшебства дружбы в мире темы «${theme}»`,
      world_description: asString(concept.world_description) || `Тёплый сказочный мир, наполненный атрибутами темы «${theme}»`,
      companion_role: asString(concept.companion_role) || `Оживший ${toy}, который ласково помогает ${child} и дарит тепло`,
    },
    scene_by_scene_blueprint: {
      scene_1_hook: {
        setting: asString(s1.setting) || `Начало сказочного мира темы «${theme}»`,
        sensory_hook: asString(s1.sensory_hook) || `Тихий шелест или мягкий огонёк, привлекающий внимание`,
        clothing_action: asString(s1.clothing_action) || (classifyClothingNarrativeRole({ appearance: params.appearance, theme: params.theme, storyMood: mood, customWishes: params.customWishes }).isNarrativelyRelevant
          ? `${child} надевает или получает ${clothing} для своего доброго подвига`
          : `${child} легко и свободно двигается навстречу чуду без отвлечения на одежду`),
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
        calming_imagery: asString(s4.calming_imagery || s4.resolution_imagery) || (isBedtime ? `Мягкое мерцание звёзд, уютные сумерки и тихое дыхание ночи` : `Яркие солнечные лучи, праздничные улыбки друзей и радостный смех`),
        grounding_gesture: asString(s4.grounding_gesture) || (isBedtime ? `${child} крепко прижимает к себе ${toy} и сладко зевает` : `Радостные победные объятия с ${toy}, улыбки и общее ликование`),
        pause_hook: asString(s4.pause_hook) || (isBedtime ? `Пауза перед самым глубоким и добрым сном` : `Пауза перед совместным обсуждением победы`),
      },
    },
    pedagogical_focus: {
      question_1_theme: asString(ped.question_1_theme) || `Один простой вопрос о чувствах героя во время встречи с загадкой`,
      question_2_theme: asString(ped.question_2_theme) || (isBedtime ? `Один тёплый вопрос о том, что подарило герою самое нежное спокойствие` : `Один вдохновляющий вопрос о радости от общего успеха`),
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
  const arch = dna.archetype || STORY_ARCHETYPES[0];

  const mood = params.storyMood || params.mood || '';
  const isBedtime = mood === 'Спокойный сон' || (params.theme || '').toLowerCase().includes('сон');

  const user = `ЗАДАЧА: Спроектировать «Архитектурный паспорт сказки» (Story Blueprint).

1. ВХОДНЫЕ ДАННЫЕ РЕБЁНКА:
- Имя: ${params.childName || 'Малыш'} (${isGirl ? 'девочка' : 'мальчик'})
- Падежные формы имени: Родительный («${declinedName.gen}»), Дательный («${declinedName.dat}»), Творительный («${declinedName.ins}»)
- Возраст: ${Number(params.age) || 4} лет (${band.label})
- Характер и темперамент: ${dna.personality_profile?.traitLabel || params.personality || 'Добрый'}
- Ключевые черты характера для раскрытия:
${(dna.personality_profile?.guidelines || ['Сделай акцент на доброте и помощи другу.']).map((g) => `  * ${g}`).join('\n')}
- Одежда и костюм героя: ${fullClothingRus} (${classifyClothingNarrativeRole({ appearance: params.appearance, theme: params.theme, storyMood: mood, customWishes: params.customWishes }).isNarrativelyRelevant ? 'сюжетный костюм / снаряжение героя для миссии или вручение по сюжету' : 'только визуальный якорь для иллюстраций; в сюжете не акцентировать'})
- Любимая игрушка-спутник: ${toy} (живой компаньон с повадкой: «${dna.companion_quirk}»)

2. ВЫБРАННЫЙ СЮЖЕТНЫЙ АРХЕТИП (ОСНОВА СЮЖЕТА):
- Архетип: «${arch.title}» (${arch.category})
- Суть: ${arch.summary}
- Конфликт: ${arch.conflict}
- Действие героя: ${arch.childAction}
- Роль спутника: ${arch.toyRole}
- Кульминационный аккорд: ${arch.climaxBeat}

3. ТЕМА, НАСТРОЕНИЕ И ПОЖЕЛАНИЯ РОДИТЕЛЯ:
- Главная тема: «${params.theme || 'Дружба'}» (строго определяет весь мир, предметы и задачу сюжета)
- Настроение и направленность сказки: «${dna.mood_profile?.moodLabel || 'Дружба и забота'}»
  * Сюжетный фокус: ${dna.mood_profile?.engineFocus || 'Искренняя дружба и совместная радость'}
  * Направленность конфликта: ${dna.mood_profile?.conflictType || 'Добрая задача для друзей'}
- Интересы ребёнка: ${(params.interests || []).join(', ') || 'приключения и открытия'}
  * Вплети эти увлечения в метафору и занятия героя.
${params.customWishes ? `- Особые пожелания родителя (ВЫСШИЙ ПРИОРИТЕТ): «${params.customWishes}»` : '- Особые пожелания родителя: нет'}

4. БАЗОВАЯ ДНК МИРА:
- Масштаб мира: ${dna.world_scale} — ${dna.world_description}
- Сюжетный движок: ${dna.narrative_engine} — ${dna.narrative_description}
- Открывающий крючок: «${dna.opening_hook}»
- Решение героя: ${dna.hero_anchor}
${recent.length ? `\nНЕ ПОВТОРЯЙ сюжеты из недавних сказок:\n${recent.map((t) => `- «${t}»`).join('\n')}\n` : ''}

5. ТРЕБОВАНИЯ К ВЫХОДНОМУ STORY BLUEPRINT:
Сформируй глубокий, продуманный план в виде строгого JSON-объекта (пиши предельно емко, по 1 короткой фразе на каждое поле, без лишних вступлений и длинных рассуждений):
{
  "archetype": "${arch.title}",
  "physical_props": ["осязаемый предмет 1", "осязаемый предмет 2", "осязаемый предмет 3"],
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
      "clothing_action": "${classifyClothingNarrativeRole({ appearance: params.appearance, theme: params.theme, storyMood: mood, customWishes: params.customWishes }).isNarrativelyRelevant ? `как костюм (${fullClothingRus}) задействован в сюжете или вручён ${params.childName || 'герою'}` : `естественное действие ${params.childName || 'героя'} (без фиксации на описании одежды)`}",
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
      "calming_imagery": "${isBedtime ? 'успокаивающие сенсорные образы (тихий свет, мягкое тепло)' : 'яркие праздничные дневные образы (радостный смех, показ творений или победный триумф под солнцем)'}",
      "grounding_gesture": "${isBedtime ? `объятие с ${toy}, укутывание, покой перед сном` : `радостные победные объятия с ${toy}, улыбки друзей и торжество`}",
      "pause_hook": "${isBedtime ? 'пауза для финального вопроса перед сном' : 'пауза для финального вопроса родителю'}"
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

  const mood = params.storyMood || params.mood || '';
  const isBedtime = mood === 'Спокойный сон' || (params.theme || '').toLowerCase().includes('сон');

  const user = `ВХОДНЫЕ ДАННЫЕ ДЛЯ ПЕРСОНАЛИЗИРОВАННОЙ СКАЗКИ НА ОСНОВЕ АРХИТЕКТУРНОГО ПАСПОРТА

1. УТВЕРЖДЁННЫЙ АРХИТЕКТУРНЫЙ ПАСПОРТ СКАЗКИ (STORY BLUEPRINT):
- Сюжетный архетип: «${bp.archetype}»
- Осязаемый реквизит (Physical Props): ${bp.physical_props.join(', ')}
  * ОБЯЗАТЕЛЬНО: Эти предметы должны активно участвовать в сюжете, быть в руках или перед глазами персонажей!
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
  - Действие в начале: ${bp.scene_by_scene_blueprint.scene_1_hook.clothing_action}${classifyClothingNarrativeRole({ appearance: params.appearance, theme: params.theme, storyMood: mood, customWishes: params.customWishes }).isNarrativelyRelevant ? ` (костюм: ${fullClothingRus})` : ''}
  - Оживление игрушки (${toy}): ${bp.scene_by_scene_blueprint.scene_1_hook.toy_awakening}
• Сцена 2 (Интрига и задача):
  - Загадка/задача: ${bp.scene_by_scene_blueprint.scene_2_intrigue.gentle_mystery}
  - Эмоция героя: ${bp.scene_by_scene_blueprint.scene_2_intrigue.emotional_beat}
  - Пауза под вопрос 1: ${bp.scene_by_scene_blueprint.scene_2_intrigue.pause_hook}
• Сцена 3 (Кульминация добра):
  - Решение героя: ${bp.scene_by_scene_blueprint.scene_3_climax.child_decision}
  - Исполнение пожелания: ${bp.scene_by_scene_blueprint.scene_3_climax.wish_fulfillment}
  - Момент совместной радости: ${bp.scene_by_scene_blueprint.scene_3_climax.triumph_moment}
• Сцена 4 (${isBedtime ? 'Умиротворение перед сном' : 'Радостный финал и праздник друзей'}):
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
- ГРАММАТИЧЕСКОЕ ПРАВИЛО: ${isGirl ? `ГЕРОИНЯ — ДЕВОЧКА! Все глаголы прошедшего времени для девочки ОБЯЗАНЫ иметь женские окончания -ла / -лась («${params.childName} почувствовала», «улыбнулась», «побежала»). Категорически запрещено писать в мужском роде! Обязательно склоняй имя: «сердце ${declinedName.gen}»! ДЛЯ СПУТНИКА МУЖСКОГО РОДА (он, енотик, мишка, щенок, робот) ГЛАГОЛЫ ОБЯЗАНЫ ОСТАВАТЬСЯ МУЖСКОГО РОДА («Он подмигнул пуговичным глазком и протянул лапку»)!` : `Герой — мальчик. Все глаголы прошедшего времени — мужского рода («${params.childName} почувствовал», «улыбнулся»). Обязательно склоняй имя: «сердце ${declinedName.gen}»!`}
${formatClothingNarrativePrompt({
  appearance: params.appearance,
  theme: params.theme,
  storyMood: mood,
  customWishes: params.customWishes,
  childName: params.childName,
})}
- Любимая игрушка-спутник: ${toy} (рядом от первой фразы до ${isBedtime ? 'засыпания' : 'победного финала'})
- Волосы, глаза, кожа: ${params.appearance?.hairColor || 'русые'} ${params.appearance?.hairType || 'мягкие'} волосы, ${params.appearance?.eyeColor || 'карие'} глаза, ${params.appearance?.skinTone || 'персиковая'} кожа${hints.hasGlasses ? ', милые круглые очки' : ''}
- СТРОЖАЙШИЙ ЗАПРЕТ СКОБОК: Категорически ЗАПРЕЩЕНО вставлять в текст сказки возраст в скобках (никаких «(${Number(params.age) || 4} лет)»)!
- Возраст для калибровки простоты: ${Number(params.age) || 4} лет (${band.label})
- Интересы и увлечения ребёнка: ${(params.interests || []).join(', ') || 'приключения и открытия'} (органично вплети в сюжет и занятия героя)

3. АНГЛИЙСКИЕ ПОДСКАЗКИ ДЛЯ CHARACTER BIBLE (characters[].visual_description):
- hero: ${hints.hairColor} ${hints.hairType} hair; ${hints.eyes}; ${hints.skin}; wearing ${hints.clothes}${hints.glasses}
- companion: living version of ${hints.toy} with ${dna.companion_quirk}

4. ТРЕБОВАНИЯ ПО ТЗ:
- Ровно 4 сцены. Общий объём: ${band.total[0]}–${band.total[1]} русских слов. Ориентир на каждую сцену: ${band.perScene[0]}–${band.perScene[1]} слов.
- Каждая сцена — 2–4 небольших абзаца.
- СИНХРОНИЗАЦИЯ НАЧАЛА С ИЛЛЮСТРАЦИЕЙ: Текст первой сцены и иллюстрация обязаны происходить В ОДНОМ И ТОМ ЖЕ МЕСТЕ! Если герой на улице (ручей, тропинка, лужи, лес, горы, космос) — начинай сразу с улицы в сапожках/дождевике! Никаких комнатных штампов («лучик заглянул в форточку и пощекотал носик», «в своей комнате проснулся»).
- Никаких заезженных штампов («Жил-был», «Однажды»). Начинай сразу с сенсорного крючка.
- Ровно один вопрос после сцены 2 и ровно один после сцены 4. Правило одного простого вопроса (до 10–12 слов, без «и/или»).
- visual-поля — только английский, 3D cartoon style render, без текста на картинках.

- КРИТИЧЕСКОЕ ПРАВИЛО ФОРМАТА: Выведи СТРОГО ОДИН единый JSON-объект сказки по контракту, начинающийся с { и заканчивающийся на }. Категорически запрещено выводить несколько JSON-объектов, дублировать паспорт сказки перед текстом или добавлять комментарии до или после JSON.

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
      const rawCombined = `${params.appearance?.hairLength || ''} ${params.appearance?.hairType || ''}`.toLowerCase();
      const isLong = rawCombined.includes('длинн') || rawCombined.includes('long');
      if (isLong && !c.visual_description.toLowerCase().includes('below shoulders')) {
        c.visual_description = `${c.visual_description}, with long flowing hair reaching below shoulders, neat hairstyle, consistent length`.trim();
      }
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
    childName: params.childName || 'Малыш',
    child_name: params.childName || 'Малыш',
    gender: params.gender || (params.childName?.endsWith('а') || params.childName?.endsWith('я') ? 'girl' : 'boy'),
    child_gender: params.gender || (params.childName?.endsWith('а') || params.childName?.endsWith('я') ? 'girl' : 'boy'),
    appearance: params.appearance || {},
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
    childName: params.childName || 'Малыш',
    child_name: params.childName || 'Малыш',
    gender: params.gender || (params.childName?.endsWith('а') || params.childName?.endsWith('я') ? 'girl' : 'boy'),
    child_gender: params.gender || (params.childName?.endsWith('а') || params.childName?.endsWith('я') ? 'girl' : 'boy'),
    appearance: params.appearance || editorial.story.appearance || {},
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

export function buildCharacterAnchor(params = {}) {
  const hero = params.characters?.find((c) => c.role === 'hero' || c.id === 'hero');
  const child = params.child_name || params.childName || params.name || hero?.name || 'Малыш';
  const age = Number(params.child_age || params.age) || 4;

  let isGirl = (params.child_gender || params.gender) === 'girl';
  if (!isGirl && (params.child_gender || params.gender) !== 'boy') {
    isGirl = String(child).endsWith('а') || String(child).endsWith('я') || hero?.gender === 'girl' || (hero?.visual_description || '').toLowerCase().includes('girl');
  }
  const genderWord = isGirl ? 'girl' : 'boy';

  let appearance = params.appearance || {};
  if (typeof appearance !== 'object' || Object.keys(appearance).length === 0) {
    if (params.hairColor || params.hairLength || params.hairType) {
      appearance = params;
    }
  }

  // Извлечение длины волос: если в appearance или в описании героя указано long/длинные:
  const heroVd = (hero?.visual_description || '').toLowerCase();
  const isHeroLong = heroVd.includes('long flowing') || heroVd.includes('below shoulders') || heroVd.includes('длинн');
  const rawHair = `${appearance.hairLength || ''} ${appearance.hairType || ''} ${appearance.hairStructure || ''}`.toLowerCase();
  const isLong = rawHair.includes('длинн') || rawHair.includes('long') || isHeroLong;

  let exactHairPrompt = resolveExactHairPrompt(appearance);
  if (isLong && (!exactHairPrompt.includes('long') && !exactHairPrompt.includes('below shoulders'))) {
    const rawColor = String(appearance.hairColor || '').toLowerCase();
    const isBlond = rawColor.includes('светл') || rawColor.includes('blond') || heroVd.includes('blond') || heroVd.includes('golden');
    const isDark = rawColor.includes('темн') || rawColor.includes('тёмн') || rawColor.includes('брюнет') || heroVd.includes('chestnut') || heroVd.includes('dark');
    const isRed = rawColor.includes('рыж') || rawColor.includes('red') || heroVd.includes('ginger');
    const colorPrefix = isBlond ? 'golden-blond' : isDark ? 'warm chestnut dark brown' : isRed ? 'vibrant ginger reddish-brown' : 'soft light-brown';
    const isCurly = rawHair.includes('кудр') || heroVd.includes('curly') || heroVd.includes('wavy');
    const texture = isCurly ? 'bouncy curly wavy' : 'silky straight';
    exactHairPrompt = `${colorPrefix} ${texture} hair, distinctly long flowing below shoulders, with a neat cute ribbon, exact same long hair length flowing below shoulders across all images`;
  }

  const hints = appearanceHints(appearance);
  const skinTone = hints.skin || 'healthy peach';
  const eyeColor = hints.eyes || 'warm sparkling hazel-brown';
  const clothingItem = hints.clothes || 'cozy outfit';

  const continuityNote = isLong
    ? 'IDENTICAL facial features and hairstyle across all images, strictly maintain exact same long hair length flowing below shoulders, never short, never bob cut.'
    : 'IDENTICAL facial features and hairstyle across all images.';

  return `[CHARACTER CONSISTENCY MANDATORY: 3D cartoon style, a ${age}-year-old ${genderWord} named ${child}, ${skinTone} skin, ${eyeColor} eyes, ${exactHairPrompt}, wearing ${clothingItem}. ${continuityNote}]`;
}

export function buildImagePrompt({ visual, characters = [], kind = 'scene', avatarUrl = null, story = null } = {}) {
  const base = asString(visual);
  if (!base) throw new Error('buildImagePrompt: visual is empty');
  const hero = characters.find((c) => c.role === 'hero' || c.id === 'hero') || story?.characters?.find((c) => c.role === 'hero' || c.id === 'hero');
  const companion = characters.find((c) => c.role === 'companion' || c.id === 'companion');

  let characterAnchor = '';
  if (story) {
    characterAnchor = buildCharacterAnchor({
      ...story,
      characters: story.characters || characters,
      appearance: story.appearance || hero?.appearance,
    });
  } else if (hero) {
    characterAnchor = buildCharacterAnchor({
      childName: hero.name,
      characters: characters,
      appearance: hero.appearance,
    });
  } else {
    characterAnchor = `[CHARACTER CONSISTENCY MANDATORY: 3D cartoon style, a cute child, healthy peach skin, warm sparkling hazel-brown eyes, wearing cozy outfit. IDENTICAL facial features across all images.]`;
  }

  const companionPart = companion ? ` Accompanied by ${companion.name} (${companion.visual_description || 'beloved toy companion'}).` : '';
  const avatarRefNote = avatarUrl
    ? ` [Reference Avatar Image: ${avatarUrl} - ensure the child face, hairstyle, hair color, eye color, and features strictly match this reference avatar].`
    : '';

  const composition =
    kind === 'cover'
      ? 'Warm iconic children’s book cover composition: hero and companion as the clear focal point, inviting eye contact, generous negative space at the top for a title, rich layered background. If any books, covers, spines, signs, or labels appear, they are completely blank with no lettering.'
      : 'Cinematic storybook composition with a clear focal point, natural camera angle, and a layered, hand-crafted environment. Strictly depict ONLY the action and setting of this scene; no random animals, no cosmic whales, no extra hallucinated creatures.';
  const people = characters.length ? `Characters in this image (strictly maintain exact immutable facial features, hairstyle, hair length, eye color, and clothing): ${characterBlock(characters)}.` : '';
  const style = /3d animated|3d render|feature film|3d cartoon/i.test(base) ? '' : STYLE_3D_PIXAR;
  return `${characterAnchor}${avatarRefNote}${companionPart} ${base}. ${composition} ${people} ${style}`.replace(/\s+/g, ' ').trim();
}

export function buildScenePrompt(story, scene, avatarUrl = null) {
  const present = (story.characters || []).filter((c) => (scene.character_ids || []).includes(c.id));
  const effectiveAvatar = avatarUrl || story.avatar_url || story.avatar_reference || null;
  return buildImagePrompt({ visual: scene.visual, characters: present.length ? present : story.characters, kind: 'scene', avatarUrl: effectiveAvatar, story });
}

export function buildCoverPrompt(story, avatarUrl = null) {
  const effectiveAvatar = avatarUrl || story.avatar_url || story.avatar_reference || null;
  return buildImagePrompt({ visual: story.cover_visual, characters: story.characters, kind: 'cover', avatarUrl: effectiveAvatar, story });
}

// --------------------------------------------------------
// 9.1. Арт-директор визуальных сцен (Visual Art Director)
// --------------------------------------------------------
export const VISUAL_DIRECTOR_SYSTEM_PROMPT = `You are an elite 3D Animation Art Director and Visual Scene Designer for award-winning Pixar/DreamWorks children's storybooks.
Your mission is to read the finalized Russian text of a 4-scene children's fairytale and generate evocative, precise visual scene descriptions in ENGLISH for each scene and the cover.

### ART DIRECTION MANDATES:
1. SCENE RELEVANCE & KEY PHYSICAL PROPS:
   - Identify the exact physical setting and physical items/props from the Russian scene text (e.g. glowing lantern, wooden star, crystal feather, seashell boat, paintbrush, toy car).
   - Explicitly mention what the child is holding, touching, or looking at. The physical props MUST be clearly visible in the foreground or midground.
2. CHARACTER ACTION & TACTILE EXPRESSION:
   - Describe the child's exact physical action and emotional pose (e.g., crouching gently to touch a glowing petal, pointing up with wide sparkling eyes, lifting the lantern above their shoulder).
   - Describe the living toy companion's distinct pose and physical interaction with the child or setting (e.g., peeking from behind the child's boot, sitting proudly on the child's shoulder, holding a tiny leaf).
3. CINEMATIC CAMERA & LIGHTING:
   - Cover: Warm iconic children's book cover composition, hero and companion front-and-center looking warm and inviting, generous negative space at top, rich lighting.
   - Scene 1: Atmospheric wide-to-medium establishing shot capturing the themed environment and the start of the adventure.
   - Scene 2: Medium action shot highlighting the discovery of the gentle mystery or obstacle.
   - Scene 3: Emotional close-medium shot focusing on the triumphant, kind solution and the child's action.
   - Scene 4: Calming soft-focus bedtime or celebratory golden-hour shot, deep reassurance and cozy warmth.
4. TEXT RESTRICTIONS:
   - Strictly NO text, NO letters, NO words, NO titles on any signs, books, or banners. Any books or objects are completely blank.
5. PURE ENGLISH VISUAL DESCRIPTION:
   - Do NOT include character appearance details (hair, clothes, skin) in the visual field — those are injected automatically from the character bible.
   - Focus 100% on: Action, Props, Companion Interaction, Setting, Camera Angle, and Mood.
   - Write 1–3 clear, vivid sentences per scene (30–60 words each).

Return ONLY a valid JSON object matching:
{
  "cover_visual": "Warm iconic cover scene description...",
  "scenes": [
    { "index": 1, "visual": "Scene 1 action, props, camera angle, lighting..." },
    { "index": 2, "visual": "Scene 2 action, props, camera angle, lighting..." },
    { "index": 3, "visual": "Scene 3 action, props, camera angle, lighting..." },
    { "index": 4, "visual": "Scene 4 action, props, camera angle, lighting..." }
  ]
}`;

export function buildVisualDirectorPrompt(story, params = {}) {
  const child = params.childName || story.childName || 'Child';
  const toy = params.appearance?.toy || params.toy || 'toy companion';
  const theme = story.theme || params.theme || 'Friendly adventure';

  const user = `Here is the finalized Russian fairytale for which you need to direct 3D illustrations:

CHILD: ${child}
COMPANION: ${toy}
THEME: ${theme}
TITLE: ${story.title || 'Fairytale'}

FINAL RUSSIAN SCENES:
${(story.scenes || []).map((s) => `[Scene ${s.index || s.scene_index}]:\n${s.text}`).join('\n\n')}

TASK:
Craft precise English scene descriptions for the Cover and Scenes 1–4.
For each scene, extract the exact physical props, the child's specific action, the companion's pose, the environment, and the cinematic camera framing.

Return ONLY the valid JSON object.`;

  return { system: VISUAL_DIRECTOR_SYSTEM_PROMPT, user };
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
export function fallbackQuestions(heroName = 'герой', isBedtime = false) {
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
      parent_hint: isBedtime
        ? 'Дайте ребёнку договорить. Можно вместе вспомнить самый тёплый момент сказки и пожелать добрых снов.'
        : 'Дайте ребёнку договорить. Можно вместе вспомнить самый радостный момент сказки и отпраздновать победу.',
      skill_tag: 'imagination',
    },
  ];
}

// --------------------------------------------------------
// 12. Надёжный парсер и экстрактор JSON (Robust JSON Parser)
// --------------------------------------------------------

/**
 * Вспомогательная функция для извлечения сбалансированных блоков {...}
 */
function extractBalancedBlocks(text) {
  const blocks = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (char === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && startIndex !== -1) {
          blocks.push(text.slice(startIndex, i + 1));
          startIndex = -1;
        }
      }
    }
  }

  // Если строка оборвалась при depth > 0, сохраняем незакрытый блок для автозакрытия
  if (depth > 0 && startIndex !== -1) {
    blocks.push(text.slice(startIndex));
  }

  return blocks;
}

/**
 * Попытка распарсить фрагмент JSON с каскадным исправлением типичных ошибок моделей
 */
function tryParseJsonChunk(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

  // 1. Прямой парсинг
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // 2. Очистка висячих запятых
  try {
    const noTrailing = trimmed.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(noTrailing);
  } catch (_) {}

  // 3. Удаление непечатных управляющих символов (кроме \n, \r, \t)
  try {
    const sanitized = trimmed
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    return JSON.parse(sanitized);
  } catch (_) {}

  // 4. Экранирование сырых переводов строк внутри строковых литералов JSON
  try {
    let inStr = false;
    let esc = false;
    let fixed = '';
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inStr) {
        if (esc) {
          esc = false;
          fixed += ch;
        } else if (ch === '\\') {
          esc = true;
          fixed += ch;
        } else if (ch === '"') {
          inStr = false;
          fixed += ch;
        } else if (ch === '\n') {
          fixed += '\\n';
        } else if (ch === '\r') {
          fixed += '\\r';
        } else if (ch === '\t') {
          fixed += '\\t';
        } else {
          fixed += ch;
        }
      } else {
        if (ch === '"') inStr = true;
        fixed += ch;
      }
    }
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(fixed);
  } catch (_) {}

  // 5. Автозакрытие незавершённых скобок при обрыве токенов (truncated response)
  try {
    const stack = [];
    let inStr = false;
    let esc = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') {
        inStr = true;
      } else if (ch === '{') {
        stack.push('}');
      } else if (ch === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '}') stack.pop();
      } else if (ch === '[') {
        stack.push(']');
      } else if (ch === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === ']') stack.pop();
      }
    }
    let repaired = trimmed;
    if (inStr) repaired += '"';
    repaired = repaired.replace(/,\s*$/, '');
    while (stack.length > 0) {
      repaired += stack.pop();
    }
    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(repaired);
  } catch (_) {}

  return null;
}

/**
 * Извлекает и парсит наиболее релевантный JSON-объект из любого ответа LLM.
 * @param {string|unknown} content Исходный ответ модели
 * @param {string[]} [preferredKeys=[]] Приоритетные ключи (например, ['scenes', 'title'])
 * @returns {any}
 */
export function robustParseJson(content, preferredKeys = []) {
  if (content && typeof content === 'object') return content;
  const str = String(content || '').trim();
  if (!str) throw new Error('Пустой ответ от языковой модели (JSON отсутствует)');

  const candidates = [];

  // Стратегия 1: Поиск в markdown code fences (```json ... ``` или ``` ... ```)
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match;
  while ((match = fenceRegex.exec(str)) !== null) {
    const block = match[1].trim();
    const parsed = tryParseJsonChunk(block);
    if (parsed && typeof parsed === 'object') {
      candidates.push(parsed);
    } else {
      // Внутри блока кода также может быть несколько объектов
      const subBlocks = extractBalancedBlocks(block);
      for (const sb of subBlocks) {
        const p = tryParseJsonChunk(sb);
        if (p && typeof p === 'object') candidates.push(p);
      }
    }
  }

  // Стратегия 2: Извлечение сбалансированных {...} блоков из всего текста
  const textBlocks = extractBalancedBlocks(str);
  for (const tb of textBlocks) {
    const parsed = tryParseJsonChunk(tb);
    if (parsed && typeof parsed === 'object') {
      const jsonStr = JSON.stringify(parsed);
      if (!candidates.some((c) => JSON.stringify(c) === jsonStr)) {
        candidates.push(parsed);
      }
    }
  }

  // Стратегия 3: Классический срез от первого { до последнего }
  if (candidates.length === 0) {
    const first = str.indexOf('{');
    const last = str.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      const slice = str.slice(first, last + 1);
      const parsed = tryParseJsonChunk(slice);
      if (parsed && typeof parsed === 'object') {
        candidates.push(parsed);
      }
    }
  }

  if (candidates.length === 0) {
    throw new Error('В ответе нейросети не найден валидный JSON-объект');
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  // Ранжирование кандидатов: выбираем объект, наиболее соответствующий preferredKeys
  const keysToMatch = (preferredKeys && preferredKeys.length > 0)
    ? preferredKeys
    : ['scenes', 'scene_by_scene_blueprint', 'cover_visual', 'title'];

  let bestCandidate = candidates[0];
  let maxScore = -1;

  for (const cand of candidates) {
    let score = 0;
    if (typeof cand === 'object' && cand !== null) {
      for (const key of keysToMatch) {
        if (key in cand) {
          score += 20;
          if (Array.isArray(cand[key]) && cand[key].length > 0) {
            score += 15;
          }
        }
      }
      if (Array.isArray(cand.scenes) && cand.scenes.length === 4) {
        score += 40;
      }
      if (cand.title && typeof cand.title === 'string' && cand.title.length > 3) {
        score += 15;
      }
      // Предпочитаем более полные объекты по длине сериализации
      score += Math.min(10, Math.floor(JSON.stringify(cand).length / 200));
    }

    if (score > maxScore) {
      maxScore = score;
      bestCandidate = cand;
    }
  }

  return bestCandidate;
}

