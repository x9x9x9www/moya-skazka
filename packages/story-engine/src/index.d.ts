// Type declarations for @moya-skazka/story-engine
// The runtime is dependency-free ESM; these types are shared by the API.

export type StoryRole = 'hero' | 'companion' | 'friend';
export type QuestionSkill = 'emotions' | 'empathy' | 'logic' | 'imagination' | 'speech' | 'memory';

export interface ChildAppearance {
  hairColor?: string;
  hairType?: string;
  clothingItem?: string;
  clothingColor?: string;
  toy?: string;
  eyeColor?: string;
  skinTone?: string;
}

export interface StoryParams {
  childName: string;
  age: number;
  gender?: 'boy' | 'girl';
  theme: string;
  interests: string[];
  personality?: string;
  customWishes?: string | null;
  appearance?: ChildAppearance;
  recentOutlines?: string[];
}

export interface StoryDnaChoice {
  world_scale: string;
  world_description: string;
  narrative_engine: string;
  narrative_description: string;
  literary_voice: string;
  companion_quirk: string;
  opening_hook: string;
  hero_anchor: string;
  age_band: {
    label: string;
    total: [number, number];
    perScene: [number, number];
    sentences: string;
  };
}

export interface StoryCharacter {
  id: string;
  name: string;
  role: StoryRole;
  visual_description: string;
}

export interface StoryScene {
  index: number;
  text: string;
  visual: string;
  character_ids: string[];
}

export interface StoryQuestion {
  after_scene: 2 | 4 | 5;
  question: string;
  parent_hint: string | null;
  skill_tag: QuestionSkill;
}

export interface NormalizedStory {
  title: string;
  age: number;
  theme: string;
  story_dna: {
    world_scale: string;
    narrative_engine: string;
    literary_voice: string;
  };
  story_outline: string;
  cover_visual: string;
  characters: StoryCharacter[];
  scenes: StoryScene[];
  questions: StoryQuestion[];
  warnings: string[];
  metrics: {
    total_words: number;
    scene_words: number[];
    target: [number, number];
    age_band: string;
  };
}

export const STORY_ENGINE_VERSION: string;
export const STYLE_3D_PIXAR: string;
export const STORY_SYSTEM_PROMPT: string;

export function appearanceHints(appearance?: ChildAppearance): {
  hairColor: string;
  hairType: string;
  eyes: string;
  skin: string;
  clothes: string;
  toy: string;
};

export function createSeededRandom(seed?: string): () => number;
export function chooseStoryDna(params?: Partial<StoryParams>, random?: () => number): StoryDnaChoice;

export function buildStoryPrompt(
  params?: Partial<StoryParams>,
  options?: { random?: () => number; dna?: StoryDnaChoice }
): { system: string; user: string; dna: StoryDnaChoice };

export class StoryValidationError extends Error {
  issues: string[];
  constructor(issues: string[] | string);
}

export function normalizeStory(
  raw: unknown,
  params?: Partial<StoryParams>,
  dna?: StoryDnaChoice | null
): NormalizedStory;

export function scoreStory(story: NormalizedStory): {
  score: number;
  issues: string[];
  total_words: number;
  target: [number, number];
};

export function buildImagePrompt(input: {
  visual: string;
  characters?: StoryCharacter[];
  kind?: 'scene' | 'cover';
}): string;

export function buildScenePrompt(story: NormalizedStory | { characters: StoryCharacter[] }, scene: StoryScene): string;
export function buildCoverPrompt(story: NormalizedStory | { cover_visual: string; characters: StoryCharacter[] }): string;

export function buildRepairPrompt(raw: unknown, issues: string[]): string;
export function buildLengthRepairPrompt(story: NormalizedStory, target?: [number, number]): string;
export function fallbackQuestions(heroName?: string): StoryQuestion[];
