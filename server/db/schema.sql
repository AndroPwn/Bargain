-- EcoLoop schema — run this once on a fresh DB
-- For existing DBs use: server/db/migrate.sql (safe, idempotent)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         TEXT UNIQUE NOT NULL,         -- used as email placeholder for email-auth
  email         TEXT,                         -- actual email (same value as phone for email-auth users)
  display_name  TEXT,
  age           INTEGER,
  country       TEXT DEFAULT 'IN',
  password_hash TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    TEXT,
  neighborhood  TEXT NOT NULL DEFAULT 'Unknown',
  geohash       TEXT,
  karma         INTEGER NOT NULL DEFAULT 0,
  karma_tier    TEXT NOT NULL DEFAULT 'seedling',
  is_dev_user   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  condition     TEXT NOT NULL DEFAULT 'good',
  neighborhood  TEXT NOT NULL,
  geohash       TEXT NOT NULL,
  image_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  item_name     TEXT,
  description   TEXT,
  listing_id    UUID REFERENCES listings(id) ON DELETE CASCADE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_type    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  receives_from   UUID REFERENCES match_participants(id),
  confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
  phone_revealed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS karma_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta       INTEGER NOT NULL,
  reason      TEXT NOT NULL,
  match_id    UUID REFERENCES matches(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ngos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  area        TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ngo_wants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id      UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  fulfilled   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  quantity        TEXT NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  neighborhood    TEXT NOT NULL,
  geohash         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'available',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swipe_wants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

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

CREATE TABLE IF NOT EXISTS trade_board_listings (
  board_id    UUID NOT NULL REFERENCES trade_boards(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  added_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_geohash   ON listings(geohash);
CREATE INDEX IF NOT EXISTS idx_listings_status    ON listings(status);
CREATE INDEX IF NOT EXISTS idx_wants_user         ON wants(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wants_user_listing_unique ON wants(user_id, listing_id);
CREATE INDEX IF NOT EXISTS idx_karma_user         ON karma_events(user_id);
CREATE INDEX IF NOT EXISTS idx_match_participants ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_match     ON messages(match_id, created_at);
CREATE INDEX IF NOT EXISTS idx_food_geohash       ON food_listings(geohash);
CREATE INDEX IF NOT EXISTS idx_swipe_wants_listing ON swipe_wants(listing_id);
CREATE INDEX IF NOT EXISTS idx_trade_board_members_user ON trade_board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_board_listings_listing ON trade_board_listings(listing_id);

-- Karma tier trigger
CREATE OR REPLACE FUNCTION update_karma_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.karma_tier := CASE
    WHEN NEW.karma >= 400 THEN 'guardian'
    WHEN NEW.karma >= 151 THEN 'pillar'
    WHEN NEW.karma >= 51  THEN 'neighbor'
    ELSE 'seedling'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS karma_tier_trigger ON users;
CREATE TRIGGER karma_tier_trigger
BEFORE UPDATE OF karma ON users
FOR EACH ROW EXECUTE FUNCTION update_karma_tier();
