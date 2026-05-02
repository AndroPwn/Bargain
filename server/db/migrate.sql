-- migrate.sql — safe to run on existing DB (all IF NOT EXISTS / IF EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age     INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IN';

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
