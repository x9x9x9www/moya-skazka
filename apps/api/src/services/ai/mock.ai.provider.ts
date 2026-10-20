import {
  AIGeneratedImage,
  AIGeneratedStory,
  GenerateImageInput,
  GenerateStoryInput,
  IImageAIProvider,
  ITextAIProvider,
} from './ai.interface';
import { STYLE_3D_PIXAR } from '@moya-skazka/story-engine';

export class MockAIProvider implements ITextAIProvider, IImageAIProvider {
  /**
   * Детерминированная качественная генерация 4 сцен и вопросов под возраст и параметры ребёнка
   */
  public async generateStory(input: GenerateStoryInput): Promise<AIGeneratedStory> {
    const { childName, age, theme, interests, appearance, customWishes } = input;
    const interest = interests[0] || 'Волшебство';
    const toy = appearance?.toy || 'любимый плюшевый спутник';
    const clothing = appearance?.clothing || 'уютный свитер';
    const hair = appearance?.hair || 'светлые волосы';

    let scenes: Array<{ index: number; text: string; image_prompt: string }> = [];
    let questions: Array<{ after_scene: number; question: string; parent_hint: string | null; skill_tag: string }> = [];

    const wishesLine = customWishes ? ` ${customWishes}.` : '';

    if (age <= 3) {
      // 2-3 года: короткие фразы, узнавание, простые эмоции
      scenes = [
        {
          index: 1,
          text: `Солнечный зайчик прыгнул на мягкий коврик. Маленький ${childName} надел ${clothing} и взял на ручки своего друга — ${toy}. За окном тихо шелестели зелёные листочки, приглашая в добрую игру про ${theme}.`,
          image_prompt: `A beautiful 3D Disney Pixar animation style movie still for a children's fairytale. A cute 3-year-old child named ${childName} with ${hair}, wearing ${clothing}, hugging ${toy} in a cozy sunlit room. Cinematic warm lighting, masterpiece. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 2,
          text: `${childName} и ${toy} вышли на солнечную полянку. Возле пушистого кустика сидел маленький зверёк и тихо вздыхал — он не мог найти свою любимую шишку. ${childName} ласково погладил зверька по спинке: «Не грусти, мы рядом!».`,
          image_prompt: `A cute 3-year-old child named ${childName} and ${toy} on a magical blooming meadow comforting a tiny furry forest creature. Volumetric warm bedtime light. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 3,
          text: `${toy} весело указал лапкой под большой колокольчик. Там и лежала потерянная шишка! Зверёк радостно захлопал в ладошки.${wishesLine} Все вокруг заулыбались, а солнышко согрело полянку ласковым теплом.`,
          image_prompt: `Child ${childName} and ${toy} finding a lost pinecone under a giant fairy bellflower, happy smiling forest creature. Glowing magical particles. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 4,
          text: `Наступил тихий вечер. ${childName} вернулся в уютную кроватку, бережно уложив рядом ${toy}. Мама нежно поцеловала малыша: «Спи сладко, мой добрый помощник». Впереди ждали самые волшебные сны.`,
          image_prompt: `Peaceful bedtime storybook illustration, cute child ${childName} in bed hugging ${toy}, soft moonlight, glowing fireflies, cozy night bedroom. ${STYLE_3D_PIXAR}`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Как ты думаешь, зверёк грустил или радовался, когда ${childName} подошёл ему помочь?`,
          parent_hint: `Попросите малыша показать эмоцию личиком или найти зверька на картинке.`,
          skill_tag: 'emotions',
        },
        {
          after_scene: 4,
          question: `Какую любимую игрушку ты возьмёшь сегодня с собой в кроватку, как ${childName}?`,
          parent_hint: `Обнимите ребёнка, укутайте одеялом и пожелайте добрых сказочных снов.`,
          skill_tag: 'empathy',
        },
      ];
    } else if (age <= 5) {
      // 4-5 лет: причины поступков, совместное преодоление трудностей
      scenes = [
        {
          index: 1,
          text: `В комнате пахло спелыми яблоками и вечерней прохладой. ${childName} поправил ${clothing}, взял в руки ${toy} и посмотрел на карту сказочной страны. Сегодня их ждало удивительное путешествие, посвящённое теме «${theme}».`,
          image_prompt: `A stunning 3D Pixar animation render of ${childName}, a curious 4-year-old child with ${hair}, wearing ${clothing}, holding ${toy} in a cozy room with glowing fairytale map. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 2,
          text: `На пути к волшебной полянке звенел быстрый лесной ручеёк. Мостик через воду слегка покачивался, и новый лесной знакомый робко жался к траве, боясь сделать шаг. ${childName} крепко сжал ${toy} и ободряюще улыбнулся: «Держись за нас, вместе мы обязательно справимся!».`,
          image_prompt: `3D Pixar animation style scene: child ${childName} and ${toy} standing near a sparkling forest stream with a quaint wooden bridge, encouraging a hesitant friendly creature. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 3,
          text: `Шаг за шагом, поддерживая друг друга, друзья благополучно перешли ручеёк. ${toy} забавно покачивался в такт шагам, разгоняя любые сомнения.${wishesLine} Награда за отзывчивость не заставила себя ждать: над лесом зажглась золотистая искорка настоящей дружбы.`,
          image_prompt: `Triumphant scene in 3D Pixar style: child ${childName} and ${toy} celebrating safe crossing of the stream with forest friend, magical golden sparkles. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 4,
          text: `Небо окрасилось в мягкие сумеречные тона. Дома ${childName} с улыбкой забрался под тёплое пуховое одеяло, положив ${toy} рядом на подушку. На душе было спокойно и радостно: день принёс важный урок доброты. Глазки закрылись навстречу сладким снам.`,
          image_prompt: `Cozy bedtime scene, warm cinematic lighting, child ${childName} asleep in cozy bed with ${toy}, moonlight streaming through window. ${STYLE_3D_PIXAR}`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Почему новому другу было страшно переходить ручей? Что помогло ему решиться?`,
          parent_hint: `Обсудите, как поддержка и доброе слово помогают преодолевать любые сомнения.`,
          skill_tag: 'logic',
        },
        {
          after_scene: 4,
          question: `Что бы ты посоветовал другу, если бы он оказался в такой ситуации?`,
          parent_hint: `Поощрите ребёнка поразмышлять и предложить свой собственный вариант помощи.`,
          skill_tag: 'empathy',
        },
      ];
    } else {
      // 6 лет: мотивы, причинно-следственные связи, выбор и ответственность
      scenes = [
        {
          index: 1,
          text: `Вечернее небо зажгло первые мерцающие созвездия. ${childName} в ${clothing} бережно держал ${toy}, размышляя о важной загадке на тему «${theme}». Интуиция и доброе сердце подсказывали, что сегодня откроется нечто особенное.`,
          image_prompt: `Intricate 3D Pixar animation movie still: 6-year-old child ${childName} with ${hair}, wearing ${clothing}, holding ${toy}, studying enchanted star constellations. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 2,
          text: `На тропинке стояли старинные башенные часы, шестерёнки которых бережно укрывал вьющийся плющ. Маленький хранитель часов растерялся и не знал, с чего начать распутывать ветви. ${childName} понял: если поспешить дальше, тайна останется нераскрытой, но без помощи часы не пойдут.`,
          image_prompt: `Whimsical 3D Pixar scene: child ${childName} and ${toy} examining glowing mechanical clockwork overgrown with ivy in a twilight fairytale forest. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 3,
          text: `Не раздумывая ни секунды, ${childName} решил остаться и помочь. Вместе с ${toy} они аккуратно освободили механизм, не повредив ни единого зелёного листочка.${wishesLine} Часы благодарно зазвенели звонкими переливами колокольчиков, озарив дорогу мягким светом.`,
          image_prompt: `Magical 3D Pixar scene: golden clockwork gears spinning, radiant amber light filling the enchanted forest glade, happy keeper thanking child ${childName}. ${STYLE_3D_PIXAR}`,
        },
        {
          index: 4,
          text: `Возвращаясь в уютную комнату, ${childName} ощутил глубокое внутреннее тепло. Укутавшись в одеяло рядом с верным ${toy}, он знал: истинная мудрость рождается из готовности прийти на помощь. Под тихий шёпот вечернего ветра начались самые волшебные сны.`,
          image_prompt: `Warm soothing bedtime still in 3D Pixar style: child ${childName} falling asleep peacefully with ${toy}, comforting ambient bedroom glow. ${STYLE_3D_PIXAR}`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Перед каким выбором оказался ${childName}? Почему он решил помочь хранителю, а не поспешил дальше?`,
          parent_hint: `Поговорите о том, почему искренняя забота о других важнее спешки.`,
          skill_tag: 'dilemma',
        },
        {
          after_scene: 4,
          question: `Какое доброе дело, сделанное сегодня тобой, запомнилось тебе больше всего?`,
          parent_hint: `Поддержите самооценку ребёнка и похвалите за его чуткость и внимательность к близким.`,
          skill_tag: 'empathy',
        },
      ];
    }

    const coverPrompt = `A breathtaking 3D Disney Pixar animation style movie still for a children's fairytale book cover. Title: "${childName} и тайна «${theme}»". A cute ${age}-year-old child with ${hair}, wearing ${clothing}, smiling warmly and holding ${toy}. Cozy magical glowing environment with fireflies, golden lighting, Octane render, no text. ${STYLE_3D_PIXAR}`;

    return {
      title: `${childName} и тайна «${theme}»`,
      age,
      theme,
      characters: [
        {
          id: 'hero',
          name: childName,
          visual_description: `Cute ${age}-year-old child with ${hair}, rosy cheeks, expressive warm eyes, wearing ${clothing}.`,
        },
        {
          id: 'companion',
          name: typeof toy === 'string' ? toy : 'Верный спутник',
          visual_description: `Beloved companion toy ${toy}, friendly rounded shape, soft tactile texture.`,
        },
      ],
      story_outline: `4 сцены: завязка в уютной обстановке, встреча с препятствием, доброе и заботливое решение, уютный отход ко сну.`,
      cover_prompt: coverPrompt,
      scenes,
      questions: input.includeQuestions ? questions : [],
      estimatedCost: 0.0,
    };
  }

  /**
   * Генерация иллюстрации (Mock возвращает готовую безопасную иллюстрацию)
   */
  public async generateImage(input: GenerateImageInput): Promise<AIGeneratedImage> {
    const isCover = input.type === 'cover';
    const seed = Math.floor(Math.random() * 1000000);
    const key = `assets/mock_${input.type}_${seed}.jpg`;

    const sIdx = Number(input.sceneIndex || 1);
    let fallback = `./illustrations/scene_${sIdx}.jpg`;
    if (isCover) {
      fallback = './illustrations/cover_forest.jpg';
    }

    return {
      storageKey: key,
      imageUrl: fallback,
      generationCost: 0.0,
    };
  }
}
