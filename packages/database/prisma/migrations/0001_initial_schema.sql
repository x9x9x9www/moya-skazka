-- ========================================================
-- Миграция 0001_initial_schema.sql
-- Проект «Моя сказка» — PostgreSQL DDL для всех 14 таблиц
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Перечисления (Enums)
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE book_status AS ENUM ('DRAFT', 'TEXT_GENERATING', 'TEXT_READY', 'ILLUSTRATIONS_QUEUED', 'ILLUSTRATING', 'ILLUSTRATED', 'FAILED_RETRYABLE', 'FAILED_FINAL');
CREATE TYPE book_format AS ENUM ('TEXT', 'ILLUSTRATED');
CREATE TYPE daily_idea_status AS ENUM ('ACTIVE', 'SAVED', 'USED', 'REFRESHED');
CREATE TYPE asset_type AS ENUM ('COVER', 'SCENE');
CREATE TYPE asset_status AS ENUM ('PENDING', 'READY', 'FAILED');
CREATE TYPE order_sku AS ENUM ('SINGLE_BOOK_1', 'PACK_5');
CREATE TYPE order_status AS ENUM ('CREATED', 'INVOICE_OPENED', 'PAID', 'FULFILLED', 'CANCELLED', 'REFUNDED');
CREATE TYPE credit_source_type AS ENUM ('PAID', 'GIFT', 'SPEND', 'REFUND', 'ADMIN_ADJUSTMENT');
CREATE TYPE credit_ledger_status AS ENUM ('PENDING', 'CONFIRMED', 'REVERSED');
CREATE TYPE credit_reservation_status AS ENUM ('AVAILABLE', 'RESERVED', 'CONSUMED', 'RELEASED');
CREATE TYPE referral_reward_status AS ENUM ('AWARDED', 'REVOKED', 'FLAGGED_REVIEW');
CREATE TYPE job_type AS ENUM ('GENERATE_TEXT', 'GENERATE_ILLUSTRATIONS');
CREATE TYPE job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED_RETRYABLE', 'FAILED_FINAL');

-- 2. users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(100),
    username VARCHAR(100),
    role user_role DEFAULT 'USER' NOT NULL,
    free_text_claimed_at TIMESTAMPTZ NULL, -- Атомарный маркер использования бесплатной сказки
    consent_version VARCHAR(20) DEFAULT '1.0' NOT NULL,
    default_questions_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Europe/Moscow' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. child_profiles
CREATE TABLE child_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    age INT NOT NULL CHECK (age >= 2 AND age <= 6),
    interests_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    appearance_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_child_profiles_user_id ON child_profiles(user_id);

-- 4. assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key VARCHAR(255) NOT NULL,
    type asset_type NOT NULL,
    status asset_status DEFAULT 'PENDING' NOT NULL,
    generation_cost NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    mime_type VARCHAR(50) DEFAULT 'image/webp' NOT NULL,
    width INT NULL,
    height INT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_assets_owner_id ON assets(owner_id);
CREATE INDEX idx_assets_status ON assets(status);

-- 5. daily_ideas
CREATE TABLE daily_ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    local_date VARCHAR(10) NOT NULL, -- YYYY-MM-DD
    title VARCHAR(200) NOT NULL,
    blurb TEXT NOT NULL,
    theme VARCHAR(100) NOT NULL,
    status daily_idea_status DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_daily_ideas_child_date UNIQUE (child_id, local_date)
);
CREATE INDEX idx_daily_ideas_child_id ON daily_ideas(child_id);

-- 6. books
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    status book_status DEFAULT 'DRAFT' NOT NULL,
    format book_format DEFAULT 'TEXT' NOT NULL,
    text_version INT DEFAULT 1 NOT NULL,
    theme VARCHAR(100) NOT NULL,
    character_bible_json JSONB NULL,
    story_outline_json JSONB NULL,
    cover_asset_id UUID NULL REFERENCES assets(id) ON DELETE SET NULL,
    source_idea_id UUID NULL REFERENCES daily_ideas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_child_id ON books(child_id);
CREATE INDEX idx_books_status ON books(status);

-- 7. book_scenes (строго 4 сцены на книгу)
CREATE TABLE book_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    scene_index INT NOT NULL CHECK (scene_index >= 1 AND scene_index <= 4),
    text TEXT NOT NULL,
    image_asset_id UUID NULL REFERENCES assets(id) ON DELETE SET NULL,
    image_prompt TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_book_scenes_book_index UNIQUE (book_id, scene_index)
);
CREATE INDEX idx_book_scenes_book_id ON book_scenes(book_id);

-- 8. book_questions (педагогические вопросы)
CREATE TABLE book_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    after_scene INT NOT NULL CHECK (after_scene IN (2, 4, 5)),
    question TEXT NOT NULL,
    parent_hint TEXT NULL,
    skill_tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_book_questions_book_id ON book_questions(book_id);

-- 9. orders (заказы в Telegram Stars)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sku order_sku NOT NULL,
    stars_amount INT NOT NULL,
    rub_reference_amount NUMERIC(10, 2) NOT NULL,
    status order_status DEFAULT 'CREATED' NOT NULL,
    telegram_charge_id VARCHAR(128) UNIQUE NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

-- 10. credit_ledger (неизменяемый журнал движений баланса)
CREATE TABLE credit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type credit_source_type NOT NULL,
    source_id VARCHAR(128) NOT NULL,
    delta INT NOT NULL,
    status credit_ledger_status DEFAULT 'CONFIRMED' NOT NULL,
    book_id UUID NULL REFERENCES books(id) ON DELETE SET NULL,
    reason VARCHAR(255) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_source_type ON credit_ledger(source_type);
CREATE INDEX idx_credit_ledger_created_at ON credit_ledger(created_at);

-- 11. credit_reservations (резервирование кредита на генерацию)
CREATE TABLE credit_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    credit_source_id UUID NULL REFERENCES credit_ledger(id) ON DELETE SET NULL,
    status credit_reservation_status DEFAULT 'RESERVED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_credit_reservations_user_id ON credit_reservations(user_id);
CREATE INDEX idx_credit_reservations_book_id ON credit_reservations(book_id);
CREATE INDEX idx_credit_reservations_status ON credit_reservations(status);

-- 12. referrals (приглашения пользователей с защитой от самоприглашения)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_token VARCHAR(64) NOT NULL,
    attributed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    qualifying_order_id UUID NULL REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT chk_no_self_referral CHECK (inviter_id != invitee_id)
);
CREATE INDEX idx_referrals_inviter_id ON referrals(inviter_id);

-- 13. referral_rewards (награда strictly 1 раз за первую оплату)
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID UNIQUE NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    credit_ledger_id UUID NOT NULL REFERENCES credit_ledger(id) ON DELETE CASCADE,
    status referral_reward_status DEFAULT 'AWARDED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_referral_rewards_credit_ledger ON referral_rewards(credit_ledger_id);

-- 14. jobs (очередь с поддержкой SELECT ... FOR UPDATE SKIP LOCKED)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    type job_type NOT NULL,
    status job_status DEFAULT 'PENDING' NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    max_attempts INT DEFAULT 3 NOT NULL,
    last_error TEXT NULL,
    provider_cost NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    locked_at TIMESTAMPTZ NULL,
    locked_by VARCHAR(64) NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_jobs_book_id ON jobs(book_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_locked_at ON jobs(locked_at);

-- 15. events (аналитические события)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    properties_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_created_at ON events(created_at);
