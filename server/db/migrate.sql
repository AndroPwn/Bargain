-- migrate.sql — safe to run on existing DB (all IF NOT EXISTS / IF EXISTS)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE users ADD COLUMN IF NOT EXISTS email   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age     INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IN';
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE wants ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE;
ALTER TABLE wants ADD COLUMN IF NOT EXISTS item_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_wants_user_listing_unique ON wants(user_id, listing_id);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);

CREATE TABLE IF NOT EXISTS swipe_wants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_swipe_wants_listing ON swipe_wants(listing_id);

CREATE TABLE IF NOT EXISTS trade_pairs (
  user_a      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);

CREATE TABLE IF NOT EXISTS trade_boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL DEFAULT 'Trade Session',
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trade_board_members (
  board_id   UUID NOT NULL REFERENCES trade_boards(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_trade_board_members_user ON trade_board_members(user_id);

CREATE TABLE IF NOT EXISTS trade_board_listings (
  board_id    UUID NOT NULL REFERENCES trade_boards(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  added_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_trade_board_listings_listing ON trade_board_listings(listing_id);
