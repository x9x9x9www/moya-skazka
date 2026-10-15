import { config } from '../../config/index';
import {
  AIGeneratedImage,
  AIGeneratedStory,
  GenerateImageInput,
  GenerateStoryInput,
  IImageAIProvider,
  ITextAIProvider,
} from './ai.interface';
import { MockAIProvider } from './mock.ai.provider';
import { AIStoryResponseSchema } from '@moya-skazka/shared';

export class GeminiAIProvider implements ITextAIProvider, IImageAIProvider {
  private mockFallback = new MockAIProvider();

  /**
   * Генерация сказки и педагогических вопросов через Google Gemini API
   */
  public async generateStory(input: GenerateStoryInput): Promise<AIGeneratedStory> {
    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      return await this.mockFallback.generateStory(input);
    }

    const systemInstruction = `Ты — профессиональный детский сказкотерапевт и писатель для детей в возрасте ${input.age} лет.
Твоя цель — написать добрую, безопасную, поучительную и захватывающую персонализированную сказку строго из 4 сцен на русском языке.
Требования безопасности и педагогики (Разделы 6 и 15 ТЗ):
- Возраст ребёнка: ${input.age} лет.
- Имя главного героя: ${input.childName}.
- Интересы: ${input.interests.join(', ')}.
- Тема: ${input.theme}.
- Особые пожелания: ${input.customWishes || 'нет'}.
- Никакой жестокости, страхов, агрессии, дискриминации или опасных действий.
- Текст должен состоять СТРОГО из 4 сцен (scenes).
- Должно быть от 2 до 3 вопросов для родителя (questions): после сцены 2, после сцены 4 или в финале (after_scene = 5). Каждый вопрос должен сопровождаться короткой подсказкой parent_hint и тегом skill_tag.
- Возрастные особенности вопросов:
  * 2-3 года: узнавание героев, простые эмоции (грусть/радость), указание на действия.
  * 4-5 лет: причины поступков, помощь другу, варианты решения.
  * 6 лет: мотивы, причинно-следственные связи, моральный выбор.
- Для каждой сцены составь детальный английский image_prompt в стиле тёплой акварельной детской иллюстрации ("warm cozy children book fairytale illustration").

Ты ОБЯЗАН вернуть валидный JSON-объект без markdown-разметки:
{
  "title": "...",
  "age": ${input.age},
  "characters": [{"id": "hero", "name": "${input.childName}", "visual_description": "..."}],
  "story_outline": "...",
  "scenes": [
    {"index": 1, "text": "...", "image_prompt": "..."},
    {"index": 2, "text": "...", "image_prompt": "..."},
    {"index": 3, "text": "...", "image_prompt": "..."},
    {"index": 4, "text": "...", "image_prompt": "..."}
  ],
  "questions": [
    {"after_scene": 2, "question": "...", "parent_hint": "...", "skill_tag": "emotions"},
    {"after_scene": 5, "question": "...", "parent_hint": "...", "skill_tag": "reflection"}
  ]
}`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemInstruction }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            max_output_tokens: 2500,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API returned error ${response.status}: ${errorText}. Falling back to deterministic Mock provider.`);
        return await this.mockFallback.generateStory(input);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Пустой ответ от модели Gemini');
      }

      // Парсинг и валидация через Zod схему
      const parsed = JSON.parse(rawJson);
      const validated = AIStoryResponseSchema.parse(parsed);

      return {
        ...validated,
        estimatedCost: 0.002, // Себестоимость Gemini Flash ≈ 0.002$
      };
    } catch (err) {
      console.error('Ошибка вызова Gemini API:', err);
      // Безопасный fallback, исключающий сбой пользователя
      return await this.mockFallback.generateStory(input);
    }
  }

  /**
   * Генерация иллюстрации через Imagen 3 или Mock fallback
   */
  public async generateImage(input: GenerateImageInput): Promise<AIGeneratedImage> {
    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey || apiKey === '' || config.AI_IMAGE_PROVIDER === 'mock') {
      return await this.mockFallback.generateImage(input);
    }

    try {
      // Imagen 3 endpoint в Google Generative Language API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: input.prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: input.type === 'cover' ? '4:3' : '16:9',
            personGeneration: 'ALLOW_ADULT_AND_CHILD',
          },
        }),
      });

      if (!response.ok) {
        return await this.mockFallback.generateImage(input);
      }

      const data = (await response.json()) as {
        predictions?: Array<{ bytesBase64Encoded?: string }>;
      };

      const base64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (base64) {
        return {
          storageKey: `assets/gemini_${input.type}_${Date.now()}.png`,
          imageUrl: `data:image/png;base64,${base64}`,
          generationCost: 0.03, // Ориентировочная себестоимость Imagen 3
        };
      }

      return await this.mockFallback.generateImage(input);
    } catch {
      return await this.mockFallback.generateImage(input);
    }
  }
}
