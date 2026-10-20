import { describe, it, expect } from 'vitest';
import { WellflowAIProvider, WELLFLOW_SYSTEM_PROMPT, NANO_BANANA_STYLE_TEMPLATE } from '../src/services/ai/wellflow.ai.provider';
import { AIStoryResponseSchema } from '@moya-skazka/shared';

const LIVE_AI_TESTS = process.env.RUN_LIVE_AI_TESTS === 'true';

describe('Wellflow AI Provider (GPT-6-Astra & Nano-Banana-2)', () => {
  const provider = new WellflowAIProvider();

  it('содержит корректный системный промпт согласно спецификации ТЗ', () => {
    expect(WELLFLOW_SYSTEM_PROMPT).toContain("award-winning Russian children's book author");
    expect(WELLFLOW_SYSTEM_PROMPT).toContain('LANGUAGE RULES (CRITICAL)');
    expect(WELLFLOW_SYSTEM_PROMPT).toContain('PEDAGOGICAL QUESTIONS');
    expect(WELLFLOW_SYSTEM_PROMPT).toContain('JSON OUTPUT CONTRACT');
    expect(WELLFLOW_SYSTEM_PROMPT).toContain('Whimsical cozy 2D digital watercolor and gouache');
  });

  it('содержит эталонную формулу стиля Nano-Banana-2', () => {
    expect(NANO_BANANA_STYLE_TEMPLATE.toLowerCase()).toContain('whimsical, cozy 2d digital watercolor and gouache');
    expect(NANO_BANANA_STYLE_TEMPLATE).toContain('soft sketchy dark brown outlines');
    expect(NANO_BANANA_STYLE_TEMPLATE).toContain('golden hour glimmers');
  });

  it('успешно валидирует контракт сказки через Zod-схему AIStoryResponseSchema', () => {
    const validResponse = {
      title: 'Миша и яблочный сад',
      age: 4,
      theme: 'Дружба',
      story_outline: 'Миша знакомится с добрым динозавриком и вместе они находят спелое золотое яблоко.',
      cover_prompt: 'A cozy bedroom with glowing magical fireflies...',
      characters: [
        { id: 'hero', name: 'Миша', visual_description: 'A 4yo boy with neat brown hair and emerald sweater' },
        { id: 'companion', name: 'Тоша', visual_description: 'A friendly green little baby dino' },
      ],
      scenes: [
        { index: 1, text: 'В тёплой уютной комнате пахло корицей и яблоками.', image_prompt: 'Scene 1 prompt...' },
        { index: 2, text: 'На тропинке друзья встретили грустного ежонка.', image_prompt: 'Scene 2 prompt...' },
        { index: 3, text: 'Миша поделился яблочком, и ежонок радостно улыбнулся.', image_prompt: 'Scene 3 prompt...' },
        { index: 4, text: 'Вечер опустился на землю, и Миша сладко уснул в кроватке.', image_prompt: 'Scene 4 prompt...' },
      ],
      questions: [
        { after_scene: 2, question: 'Как Миша понял, что ежонку нужна помощь?', parent_hint: 'Спросите ребёнка об эмоциях', skill: 'emotions' },
        { after_scene: 4, question: 'Что тебе понравилось в сказке больше всего?', parent_hint: 'Поговорите перед сном', skill: 'empathy' },
      ],
    };

    const parsed = AIStoryResponseSchema.parse(validResponse);
    expect(parsed.title).toBe('Миша и яблочный сад');
    expect(parsed.scenes).toHaveLength(4);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0].skill_tag).toBe('emotions');
  });

  it.skipIf(!LIVE_AI_TESTS)('generateStory возвращает 4 сцены и педагогические вопросы (live)', async () => {
    const story = await provider.generateStory({
      childName: 'Миша',
      age: 4,
      interests: ['Динозавры'],
      theme: 'Дружба',
      appearance: {
        hair: 'русые',
        clothing: 'изумрудный свитер',
        toy: 'плюшевый динозаврик',
      },
      includeQuestions: true,
    });

    expect(story.title).toBeDefined();
    expect(story.scenes).toHaveLength(4);
    expect(story.questions.length).toBeGreaterThanOrEqual(1);
  }, 120000);
});
