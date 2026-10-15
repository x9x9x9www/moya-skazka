import {
  AIGeneratedImage,
  AIGeneratedStory,
  GenerateImageInput,
  GenerateStoryInput,
  IImageAIProvider,
  ITextAIProvider,
} from './ai.interface';

export class MockAIProvider implements ITextAIProvider, IImageAIProvider {
  /**
   * Детерминированная генерация 4 сцен и вопросов под возраст ребенка
   */
  public async generateStory(input: GenerateStoryInput): Promise<AIGeneratedStory> {
    const { childName, age, theme, interests } = input;
    const interest = interests[0] || 'волшебство';

    // Формируем сюжет по возрастной категории (Раздел 6 ТЗ)
    let scenes = [];
    let questions = [];

    if (age <= 3) {
      // 2-3 года: короткие предложения, узнавание, эмоции
      scenes = [
        {
          index: 1,
          text: `Жил-был любознательный малыш ${childName}. Больше всего на свете ${childName} любил ${interest}. Однажды утром солнышко заглянуло в окно и улыбнулось.`,
          image_prompt: `Cute fairy-tale storybook illustration, ${childName} as a 2-year old child waking up in a cozy warm bedroom, smiling at the morning sun. Soft pastel colors, gentle children book style.`,
        },
        {
          index: 2,
          text: `${childName} вышел на зелёную полянку и встретил доброго маленького друга. Друг был растерян и тихо сидел возле большого цветка.`,
          image_prompt: `Warm children book art, ${childName} meeting a cute fluffy animal friend near a giant magical colorful flower on a green meadow. Sunny gentle day.`,
        },
        {
          index: 3,
          text: `— Не бойся, я с тобой! — ласково сказал ${childName}. Они взялись за ручки и вместе весело зашагали по тропинке навстречу приключениям.`,
          image_prompt: `Fairytale illustration, child and a cute animal holding hands and walking together along a winding path in a sunny fairytale forest.`,
        },
        {
          index: 4,
          text: `Вместе они нашли волшебную полянку и весело играли до самого вечера. ${childName} почувствовал, как тепло на душе, когда рядом настоящий друг.`,
          image_prompt: `Peaceful bedtime storybook illustration, cozy evening sunset, glowing butterflies, happy child and cute friend hugging and smiling.`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Как ты думаешь, почему новый друг сидел тихо? Он испугался или просто ждал друга?`,
          parent_hint: `Выслушайте ответ малыша. Можно ласково спросить: «А как ты помогаешь, когда кто-то грустит?»`,
          skill_tag: 'emotions',
        },
        {
          after_scene: 5,
          question: `Что ${childName}у понравилось больше всего: играть или помогать другу?`,
          parent_hint: `Похвалите ребёнка за доброе сердце и сопереживание герою.`,
          skill_tag: 'empathy',
        },
      ];
    } else if (age <= 5) {
      // 4-5 лет: причины поступков, совместное преодоление трудностей
      scenes = [
        {
          index: 1,
          text: `В одном уютном городке жил смелый ${childName}. Каждый день он придумывал новые истории, ведь его страстью были ${interest} и невероятные тайны.`,
          image_prompt: `Charming children illustration, courageous 4-year old child ${childName} looking through a toy telescope at a starlit horizon, cozy wooden room, warm glowing light.`,
        },
        {
          index: 2,
          text: `Гуляя по лесной опушке, ${childName} услышал тихий шорох. За кустом прятался маленький динозаврик Дино. Он потерял свою любимую звездочку и боялся перешагнуть через ручей.`,
          image_prompt: `Children book style, adorable friendly little baby dinosaur hiding behind green leaves near a sparkling creek, looking worried. Child stepping closer with an encouraging smile.`,
        },
        {
          index: 3,
          text: `${childName} огляделся и придумал отличный план: из крепких сухих веточек они соорудили прочный мостик. Дино сделал первый шаг и радостно захлопал лапками!`,
          image_prompt: `Cooperative storybook art, child and baby dinosaur building a wooden twig bridge over a creek, teamwork, joyful proud expressions.`,
        },
        {
          index: 4,
          text: `На другом берегу в мягкой траве сверкала потерянная звездочка! Дино обнял ${childName}а, а над лесом зажглась радуга дружбы. Настоящая смелость — это помогать тем, кто в этом нуждается.`,
          image_prompt: `Triumphant fairytale climax, glowing magical star in soft grass, child and happy dinosaur hugging, warm golden sunlight, subtle rainbow.`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Почему Дино не мог перейти ручей сам? Что помогло ему почувствовать себя смелее?`,
          parent_hint: `Обратите внимание на то, как поддержка друга придаёт уверенности.`,
          skill_tag: 'logic',
        },
        {
          after_scene: 4,
          question: `Как ${childName} догадался построить мостик? А что бы предложил ты на его месте?`,
          parent_hint: `Поощряйте ребёнка фантазировать и искать альтернативные решения.`,
          skill_tag: 'creativity',
        },
        {
          after_scene: 5,
          question: `Какой момент в сказке показался тебе самым смелым?`,
          parent_hint: `Обсудите, что смелость — это не отсутствие страха, а шаг вперёд вместе с другом.`,
          skill_tag: 'courage',
        },
      ];
    } else {
      // 6 лет: мотивы, причинно-следственные связи, выбор и ответственность
      scenes = [
        {
          index: 1,
          text: `На пороге великих открытий ${childName} держал в руках старинную карту созвездий. Тема «${theme}» давно влекла его, и сегодня открылся путь к забытой тайне.`,
          image_prompt: `Atmospheric children book illustration, 6-year old child ${childName} examining an ancient glowing celestial map in a cozy observatory attic.`,
        },
        {
          index: 2,
          text: `В пути ${childName} встретил хранителя древних часов, шестерёнки которых запутались в плюще. Хранитель спешил, но без помощи не мог запустить ход времени.`,
          image_prompt: `Whimsical fantasy clockwork mechanism wrapped in ivy vines, an eccentric wise little forest keeper talking to the child, detailed warm style.`,
        },
        {
          index: 3,
          text: `Перед ${childName}ом встал выбор: поспешить за своей мечтой или остаться и помочь распутать механизм. Подумав, он решил, что доброта важнее спешки.`,
          image_prompt: `Thoughtful scene, child carefully untangling green vines from golden clockwork gears, showing patience and concentration.`,
        },
        {
          index: 4,
          text: `Часы забили торжественный звон, и из центра механизма вылетел золотистый ключик к тайне. Хранитель тепло поблагодарил ${childName}а: «Тот, кто умеет сопереживать, всегда находит верную дорогу».`,
          image_prompt: `Golden glow, spinning clockwork, magical sparkling key appearing, wise keeper smiling warmly at the proud child, sense of accomplishment.`,
        },
      ];

      questions = [
        {
          after_scene: 2,
          question: `Перед каким выбором оказался ${childName}? Легко ли было остановиться и помочь?`,
          parent_hint: `Поговорите о приоритетах и о том, как наши решения влияют на окружающих.`,
          skill_tag: 'dilemma',
        },
        {
          after_scene: 5,
          question: `Как ты понимаешь слова Хранителя о верной дороге?`,
          parent_hint: `Дайте ребёнку возможность самому сделать вывод о ценности бескорыстной помощи.`,
          skill_tag: 'reflection',
        },
      ];
    }

    return {
      title: `${childName} и тайна «${theme}»`,
      age,
      characters: [
        {
          id: 'hero',
          name: childName,
          visual_description: `Ребёнок ${age} лет, добрый и выразительный взгляд, уютная одежда.`,
        },
        {
          id: 'companion',
          name: 'Дино / Друг',
          visual_description: 'Милый сказочный спутник с добрыми глазами.',
        },
      ],
      story_outline: `4 сцены: знакомство с героем, встреча с препятствием, совместное нахождение решения, счастливый и поучительный финал.`,
      scenes,
      questions: input.includeQuestions ? questions : [],
      estimatedCost: 0.0,
    };
  }

  /**
   * Генерация иллюстрации (Mock возвращает готовый безопасный placeholder с палитрой проекта)
   */
  public async generateImage(input: GenerateImageInput): Promise<AIGeneratedImage> {
    const isCover = input.type === 'cover';
    const seed = Math.floor(Math.random() * 1000000);
    const key = `assets/mock_${input.type}_${seed}.webp`;

    // Для визуального соответствия макету описание.jpg используем качественные сказочные иллюстрации
    const mockImageUrls = [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    ];

    const url = isCover
      ? mockImageUrls[0]
      : mockImageUrls[((input.sceneIndex || 1) % (mockImageUrls.length - 1)) + 1];

    return {
      storageKey: key,
      imageUrl: url,
      generationCost: 0.0,
    };
  }
}
