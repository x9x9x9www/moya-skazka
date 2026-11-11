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

export interface StoryArchetype {
  id: string;
  title: string;
  category: string;
  summary: string;
  conflict: string;
  childAction: string;
  toyRole: string;
  climaxBeat: string;
  idealThemes: string[];
}

export const STORY_ARCHETYPES: StoryArchetype[];
export function selectStoryArchetype(params?: Partial<StoryParams>, random?: () => number): StoryArchetype;

export interface StoryDnaChoice {
  world_scale: string;
  world_description: string;
  narrative_engine: string;
  narrative_description: string;
  literary_voice: string;
  companion_quirk: string;
  opening_hook: string;
  hero_anchor: string;
  archetype?: StoryArchetype;
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

export interface StoryBlueprint {
  archetype: string;
  physical_props: string[];
  psychological_profile: {
    age_focus: string;
    character_strength: string;
    therapeutic_goal: string;
  };
  creative_concept: {
    core_metaphor: string;
    world_description: string;
    companion_role: string;
  };
  scene_by_scene_blueprint: {
    scene_1_hook: {
      setting: string;
      sensory_hook: string;
      clothing_action: string;
      toy_awakening: string;
    };
    scene_2_intrigue: {
      gentle_mystery: string;
      emotional_beat: string;
      pause_hook: string;
    };
    scene_3_climax: {
      child_decision: string;
      wish_fulfillment: string;
      triumph_moment: string;
    };
    scene_4_bedtime_calm: {
      calming_imagery: string;
      grounding_gesture: string;
      pause_hook: string;
    };
  };
  pedagogical_focus: {
    question_1_theme: string;
    question_2_theme: string;
  };
}

export const STORY_ENGINE_VERSION: string;
export const STYLE_3D_PIXAR: string;
export const ARCHITECT_SYSTEM_PROMPT: string;
export const STORY_SYSTEM_PROMPT: string;
export const VISUAL_DIRECTOR_SYSTEM_PROMPT: string;
export const LINGUISTIC_EDITORIAL_SYSTEM_PROMPT: string;

export function buildVisualDirectorPrompt(
  story: unknown,
  params?: Partial<StoryParams>
): { system: string; user: string };

export function buildLinguisticEditorialPrompt(
  story: unknown,
  params?: Partial<StoryParams>
): { system: string; user: string };

export function resolveExactHairPrompt(appearance?: ChildAppearance): string;
export function appearanceHints(appearance?: ChildAppearance): {
  hairColor: string;
  hairType: string;
  exactHairPrompt: string;
  eyes: string;
  skin: string;
  clothes: string;
  toy: string;
  glasses: string;
  hasGlasses: boolean;
};

export function createSeededRandom(seed?: string): () => number;
export function chooseStoryDna(params?: Partial<StoryParams>, random?: () => number): StoryDnaChoice;

export function buildStoryPrompt(
  params?: Partial<StoryParams>,
  options?: { random?: () => number; dna?: StoryDnaChoice }
): { system: string; user: string; dna: StoryDnaChoice };

export function buildArchitectPrompt(
  params?: Partial<StoryParams>,
  options?: { random?: () => number; dna?: StoryDnaChoice }
): { system: string; user: string; dna: StoryDnaChoice };

export function buildStoryFromBlueprintPrompt(
  params?: Partial<StoryParams>,
  blueprint?: Partial<StoryBlueprint> | Record<string, any>,
  options?: { random?: () => number; dna?: StoryDnaChoice }
): { system: string; user: string; dna: StoryDnaChoice };

export function normalizeBlueprint(raw: unknown, params?: Partial<StoryParams>): StoryBlueprint;

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

export function buildCharacterAnchor(params?: Partial<StoryParams>): string;

export function buildImagePrompt(input: {
  visual: string;
  characters?: StoryCharacter[];
  kind?: 'scene' | 'cover';
  avatarUrl?: string | null;
}): string;

export function buildScenePrompt(story: NormalizedStory | { characters: StoryCharacter[]; avatar_url?: string; avatar_reference?: string }, scene: StoryScene, avatarUrl?: string | null): string;
export function buildCoverPrompt(story: NormalizedStory | { cover_visual: string; characters: StoryCharacter[]; avatar_url?: string; avatar_reference?: string }, avatarUrl?: string | null): string;

export function buildRepairPrompt(raw: unknown, issues: string[]): string;
export function buildLengthRepairPrompt(story: NormalizedStory, target?: [number, number]): string;
export function fallbackQuestions(heroName?: string): StoryQuestion[];
export function robustParseJson<T = any>(content: string | unknown, preferredKeys?: string[]): T;

export interface DeclinedName {
  nom: string;
  gen: string;
  dat: string;
  acc: string;
  ins: string;
  prep: string;
}

export function declineRussianName(name: string, gender?: 'boy' | 'girl' | string): DeclinedName;
export function formatSafeForWhom(name: string, gender?: 'boy' | 'girl' | string): string;
export function formatSafeCreationHeader(name: string, gender?: 'boy' | 'girl' | string): string;
export function getOPreposition(word: string): 'об' | 'о';
export function countWords(text: string): number;
export function removeAgeFromText(text: string): string;
export function fixGenderAgreements(text: string, childName?: string, gender?: 'boy' | 'girl' | string): string;

export interface EditorialResult {
  story: NormalizedStory;
  fixesApplied: string[];
  integrityPassed: boolean;
}

export function runEditorialAgent(story: unknown, params?: Partial<StoryParams>): EditorialResult;
export function proofreadRussianGrammar(text: string, params?: Partial<StoryParams>): string;
export function formatRussianDialogues(text: string): string;
export function applyYoification(text: string): string;
export function applyTypographySpacing(text: string): string;
export function sanitizeToneAndPurity(text: string): string;
export function simplifyChildQuestion(text: string): string;
export function removeTautologiesAndDuplications(text: string): string;
export function verifyNarrativeIntegrity(story: unknown, params?: Partial<StoryParams>): {
  valid: boolean;
  issues: string[];
  fixes: string[];
  story: any;
};

export interface ClothingNarrativeClassification {
  role: 'costume' | 'functional' | 'thematic_fashion' | 'everyday';
  isNarrativelyRelevant: boolean;
  costumeType: string | null;
  allowBestowal: boolean;
}

export function classifyClothingNarrativeRole(input?: {
  appearance?: ChildAppearance;
  theme?: string;
  storyMood?: string;
  customWishes?: string | null;
}): ClothingNarrativeClassification;

export function formatClothingNarrativePrompt(input?: {
  appearance?: ChildAppearance;
  theme?: string;
  storyMood?: string;
  customWishes?: string | null;
  childName?: string;
  gender?: 'boy' | 'girl' | string;
}): string;

