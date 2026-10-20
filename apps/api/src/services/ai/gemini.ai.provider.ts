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
import {
  buildStoryPrompt,
  chooseStoryDna,
  createSeededRandom,
  normalizeStory,
  buildRepairPrompt,
  buildLengthRepairPrompt,
  buildCoverPrompt,
  buildScenePrompt,
  STYLE_3D_PIXAR,
} from '@moya-skazka/story-engine';

function parseJsonContent(content: string) {
  const cleaned = String(content || '').replace(/```json/gi, '').replace(/```/g, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('JSON object not found');
  return JSON.parse(cleaned.slice(first, last + 1));
}

export class GeminiAIProvider implements ITextAIProvider, IImageAIProvider {
  private mockFallback = new MockAIProvider();

  /**
   * Генерация сказки и педагогических вопросов через Google Gemini API с единым Story Engine
   */
  public async generateStory(input: GenerateStoryInput): Promise<AIGeneratedStory> {
    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      return await this.mockFallback.generateStory(input);
    }

    const storyEngineInput = {
      childName: input.childName,
      age: input.age,
      theme: input.theme,
      interests: input.interests,
      personality: input.appearance?.personality,
      customWishes: input.customWishes,
      gender: input.appearance?.gender,
      appearance: {
        hairColor: input.appearance?.hair,
        clothingItem: input.appearance?.clothing,
        toy: input.appearance?.toy,
      },
    };

    const dna = chooseStoryDna(
      storyEngineInput,
      createSeededRandom(`${Date.now()}|${input.childName}|${input.age}|${input.theme}`)
    );
    const prompt = buildStoryPrompt(storyEngineInput, { dna });
    const model = (config as any).GEMINI_MODEL || 'gemini-2.0-flash';

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: prompt.system }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt.user }],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
            max_output_tokens: 4000,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Gemini API returned error ${response.status}: ${errorText}. Falling back to mock.`);
        return await this.mockFallback.generateStory(input);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJson) {
        throw new Error('Пустой ответ от модели Gemini');
      }

      const parsed = parseJsonContent(rawJson);
      let normalizedStory;
      try {
        normalizedStory = normalizeStory(parsed, storyEngineInput, dna);
      } catch (err: any) {
        console.warn(`[GeminiAIProvider] Normalization failed: ${(err.issues || [err.message]).join('; ')}`);
        return await this.mockFallback.generateStory(input);
      }

      const coverPrompt = buildCoverPrompt(normalizedStory);

      return {
        title: normalizedStory.title,
        age: normalizedStory.age,
        theme: normalizedStory.theme,
        characters: normalizedStory.characters.map((c) => ({
          id: c.id,
          name: c.name,
          visual_description: c.visual_description,
        })),
        story_outline: normalizedStory.story_outline,
        cover_prompt: coverPrompt,
        scenes: normalizedStory.scenes.map((s) => ({
          index: s.index,
          text: s.text,
          image_prompt: buildScenePrompt(normalizedStory, s),
        })),
        questions: normalizedStory.questions.map((q) => ({
          after_scene: q.after_scene,
          question: q.question,
          parent_hint: q.parent_hint,
          skill_tag: q.skill_tag,
        })),
        estimatedCost: 0.005,
      };
    } catch (err) {
      console.error('[GeminiAIProvider] Ошибка генерации сказки Gemini:', err);
      return await this.mockFallback.generateStory(input);
    }
  }

  /**
   * Генерация иллюстраций через Imagen (Imagen 3) или возврат безопасного мока
   */
  public async generateImage(input: GenerateImageInput): Promise<AIGeneratedImage> {
    const apiKey = config.GEMINI_API_KEY;

    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      return await this.mockFallback.generateImage(input);
    }

    let prompt = input.prompt;
    if (!prompt.includes('Pixar') && !prompt.includes('3D')) {
      prompt = `${prompt}. ${STYLE_3D_PIXAR}`;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            outputOptions: { mimeType: 'image/jpeg' },
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Imagen API error: ${response.status}. Falling back to mock.`);
        return await this.mockFallback.generateImage(input);
      }

      const data = (await response.json()) as {
        predictions?: Array<{ bytesBase64Encoded: string }>;
      };

      const base64 = data.predictions?.[0]?.bytesBase64Encoded;
      if (!base64) {
        throw new Error('Пустой ответ Imagen');
      }

      const imageUrl = `data:image/jpeg;base64,${base64}`;
      const storageKey = `gemini_${Date.now()}_${input.sceneIndex ?? 'cover'}.jpg`;

      return {
        storageKey,
        imageUrl,
        generationCost: 0.03,
      };
    } catch (err) {
      console.error('[GeminiAIProvider] Ошибка генерации Imagen:', err);
      return await this.mockFallback.generateImage(input);
    }
  }
}
