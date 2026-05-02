/**
 * migrate.js — runs safe ALTER TABLE migrations on startup.
 * All statements use IF NOT EXISTS / IF EXISTS so they are idempotent.
 */
import pool from "./pool.js";

const migrations = [
  // v2: email-based auth columns
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email         TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS age           INTEGER`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS country       TEXT DEFAULT 'IN'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash   TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified  BOOLEAN DEFAULT FALSE`,
  `ALTER TABLE listings  ADD COLUMN IF NOT EXISTS image_url TEXT`,
  `ALTER TABLE wants     ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE`,
  `ALTER TABLE wants     ADD COLUMN IF NOT EXISTS item_name  TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_wants_user_listing ON wants(user_id, listing_id) WHERE listing_id IS NOT NULL`,

  // v3: swipe_wants (items users express interest in by swiping)
  `CREATE TABLE IF NOT EXISTS swipe_wants (
     id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE(user_id, listing_id)
   )`,
  `CREATE INDEX IF NOT EXISTS idx_swipe_wants_listing ON swipe_wants(listing_id)`,

  // v4: trade_pairs for analytics
  `CREATE TABLE IF NOT EXISTS trade_pairs (
     user_a      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     user_b      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     trade_count INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (user_a, user_b),
     CHECK (user_a < user_b)
   )`,
];

export async function runMigrations() {
  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (e) {
      // Non-fatal: log and continue (e.g. column already exists with different type)
      console.warn(`[migrate] warning: ${e.message.split("\n")[0]}`);
    }
  }
  console.log("[migrate] ✓ migrations applied");
}
