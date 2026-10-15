// ========================================================
// Проект «Моя сказка» — Shared Core Types & Enums
// Единый источник истины для Frontend и Backend
// ========================================================

export type UserRole = 'USER' | 'ADMIN';

export type BookStatus =
  | 'DRAFT'
  | 'TEXT_GENERATING'
  | 'TEXT_READY'
  | 'ILLUSTRATIONS_QUEUED'
  | 'ILLUSTRATING'
  | 'ILLUSTRATED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL';

export type BookFormat = 'TEXT' | 'ILLUSTRATED';

export type DailyIdeaStatus = 'ACTIVE' | 'SAVED' | 'USED' | 'REFRESHED';

export type AssetType = 'COVER' | 'SCENE';

export type AssetStatus = 'PENDING' | 'READY' | 'FAILED';

export type OrderSku = 'SINGLE_BOOK_1' | 'PACK_5';

export type OrderStatus =
  | 'CREATED'
  | 'INVOICE_OPENED'
  | 'PAID'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'REFUNDED';

export type CreditSourceType =
  | 'PAID'
  | 'GIFT'
  | 'SPEND'
  | 'REFUND'
  | 'ADMIN_ADJUSTMENT';

export type CreditLedgerStatus = 'PENDING' | 'CONFIRMED' | 'REVERSED';

export type CreditReservationStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'CONSUMED'
  | 'RELEASED';

export type ReferralRewardStatus = 'AWARDED' | 'REVOKED' | 'FLAGGED_REVIEW';

export type JobType = 'GENERATE_TEXT' | 'GENERATE_ILLUSTRATIONS';

export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL';

// --------------------------------------------------------
// Стейт-машина книги: допустимые переходы
// --------------------------------------------------------
export const BOOK_STATUS_TRANSITIONS: Record<BookStatus, BookStatus[]> = {
  DRAFT: ['TEXT_GENERATING'],
  TEXT_GENERATING: ['TEXT_READY', 'FAILED_RETRYABLE', 'FAILED_FINAL'],
  TEXT_READY: ['ILLUSTRATIONS_QUEUED'],
  ILLUSTRATIONS_QUEUED: ['ILLUSTRATING'],
  ILLUSTRATING: ['ILLUSTRATED', 'FAILED_RETRYABLE', 'FAILED_FINAL'],
  ILLUSTRATED: [],
  FAILED_RETRYABLE: ['TEXT_GENERATING', 'ILLUSTRATING', 'FAILED_FINAL'],
  FAILED_FINAL: [],
};

// --------------------------------------------------------
// Стейт-машина заказа: допустимые переходы
// --------------------------------------------------------
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['INVOICE_OPENED', 'CANCELLED'],
  INVOICE_OPENED: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'REFUNDED'],
  FULFILLED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

// --------------------------------------------------------
// AI Контракты (Текст и 4 Сцены + Вопросы)
// --------------------------------------------------------
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
  parent_hint?: string;
  skill_tag: string; // 'emotions' | 'logic' | 'empathy' | 'courage'
}

export interface AIGeneratedStoryResponse {
  title: string;
  age: number;
  characters: AIStoryCharacter[];
  story_outline: string;
  scenes: AIStoryScene[];
  questions: AIStoryQuestion[];
}

// --------------------------------------------------------
// DTOs & Интерфейсы
// --------------------------------------------------------
export interface UserDTO {
  id: string;
  telegram_user_id: string;
  first_name?: string | null;
  username?: string | null;
  role: UserRole;
  free_text_claimed_at: string | null;
  consent_version: string;
  default_questions_enabled: boolean;
  timezone: string;
}

export interface ChildProfileDTO {
  id: string;
  user_id: string;
  name: string;
  age: number;
  interests: string[];
  appearance: {
    avatar_id: string;
    hair?: string;
    clothing?: string;
    personality?: string;
  };
  is_active: boolean;
}

export interface BookSummaryDTO {
  id: string;
  child_id: string;
  child_name: string;
  title: string;
  status: BookStatus;
  format: BookFormat;
  cover_url?: string | null;
  created_at: string;
}

export interface BookSceneDTO {
  id: string;
  scene_index: number;
  text: string;
  image_url?: string | null;
  image_prompt?: string | null;
}

export interface BookQuestionDTO {
  id: string;
  after_scene: number;
  question: string;
  parent_hint?: string | null;
  skill_tag: string;
}

export interface BookDetailsDTO {
  id: string;
  title: string;
  status: BookStatus;
  format: BookFormat;
  scenes: BookSceneDTO[];
  questions: BookQuestionDTO[];
  can_upgrade: boolean;
}

export interface UserBalanceDTO {
  total: number;
  paid: number;
  gift: number;
  reserved: number;
  available: number;
}
