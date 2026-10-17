export interface GenerateStoryInput {
  childName: string;
  age: number; // 2..6
  interests: string[];
  theme: string;
  appearance?: {
    avatar_id?: string;
    hair?: string;
    clothing?: string;
    personality?: string;
    toy?: string;
    gender?: 'boy' | 'girl';
  };
  customWishes?: string | null;
  includeQuestions: boolean;
}

export interface AIStoryCharacter {
  id: string;
  name: string;
  visual_description: string;
}

export interface AIStoryScene {
  index: number; // 1..4
  text: string;
  image_prompt: string;
}

export interface AIStoryQuestion {
  after_scene: number; // 2, 4 или 5 (финал)
  question: string;
  parent_hint?: string | null;
  skill_tag: string;
}

export interface AIGeneratedStory {
  title: string;
  age: number;
  theme?: string;
  characters: AIStoryCharacter[];
  story_outline: string;
  cover_prompt?: string;
  scenes: AIStoryScene[];
  questions: AIStoryQuestion[];
  estimatedCost: number;
}

export interface GenerateImageInput {
  prompt: string;
  type: 'cover' | 'scene';
  characterBible?: string;
  sceneIndex?: number;
}

export interface AIGeneratedImage {
  storageKey: string;
  imageUrl: string;
  generationCost: number;
}

export interface ITextAIProvider {
  generateStory(input: GenerateStoryInput): Promise<AIGeneratedStory>;
}

export interface IImageAIProvider {
  generateImage(input: GenerateImageInput): Promise<AIGeneratedImage>;
}
