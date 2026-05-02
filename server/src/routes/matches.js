import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { findCircularMatches, KARMA } from "../services/trustEngine.js";

// Background job — runs once, result cached 5 min
// /run returns immediately with whatever is ready (or empty if still scanning)
// Client polls every 3s until it gets results
let _cache     = null;      // final enriched matches array
let _cacheTime = 0;
let _running   = false;     // true while AI is scanning
const CACHE_TTL = 5 * 60 * 1000;

function invalidateCache() { _cache = null; _cacheTime = 0; }

async function startBackgroundRun() {
  if (_running) return;                            // already in progress
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return;  // cache fresh
  _running = true;
  console.log('[/run] starting background AI scan...');
  try {
    const { rows: candidates } = await pool.query(
      `SELECT u.id, u.karma, u.geohash, u.display_name,
              l.id AS listing_id, l.title AS listing_title, l.image_url AS listing_image_url,
              l.category AS listing_category, l.description AS listing_description,
              w.category AS want_category, w.item_name AS want_item_name, w.description AS want_description
       FROM users u
       JOIN listings l ON l.user_id = u.id AND l.status = 'active'
       JOIN wants w ON w.listing_id = l.id AND w.is_active = TRUE
       ORDER BY l.created_at DESC`
    );
    console.log(`[/run] ${candidates.length} candidates (paired give+want)`);

    const mapped = candidates.map(c => ({
      id: c.id, karma: c.karma, display_name: c.display_name,
      listingId: c.listing_id, listingTitle: c.listing_title,
      listingImageUrl: c.listing_image_url, listingCategory: c.listing_category,
      listingDescription: c.listing_description, wantCategory: c.want_category,
      wantItemName: c.want_item_name, wantDescription: c.want_description,
    }));

    const matches = await findCircularMatches(mapped);
    _cache     = matches;
    _cacheTime = Date.now();
    console.log(`[/run] scan complete. ${matches.length} circle(s) cached.`);
  } catch (err) {
    console.error('[/run] background scan failed:', err.message);
  } finally {
    _running = false;
  }
}

export default function createMatchRoutes(io) {
  const router = Router();

  router.get("/mine", requireAuth, async (req, res) => {
    const { rows } = await pool.query(
      `SELECT m.id, m.match_type, m.status, m.created_at,
              mp.confirmed AS i_confirmed, mp.phone_revealed,
              (SELECT COUNT(*) FROM match_participants WHERE match_id = m.id) AS participant_count,
              (
                SELECT json_agg(json_build_object(
                  'user_id', mp2.user_id, 'display_name', u2.display_name,
                  'confirmed', mp2.confirmed, 'listing_id', mp2.listing_id,
                  'listing_title', l2.title, 'listing_image_url', l2.image_url
                ))
                FROM match_participants mp2
                JOIN users u2 ON u2.id = mp2.user_id
                LEFT JOIN listings l2 ON l2.id = mp2.listing_id
                WHERE mp2.match_id = m.id
              ) AS participants
       FROM matches m
       JOIN match_participants mp ON mp.match_id = m.id AND mp.user_id = $1
       WHERE m.status NOT IN ('completed','cancelled')
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  });

  // Returns immediately — triggers background scan, responds with cached result (or scanning status)
  router.post("/run", requireAuth, async (req, res) => {
    // Kick off background scan (no-op if already running or cache fresh)
    startBackgroundRun();

    if (_running && !_cache) {
      // Still scanning, tell client to poll
      return res.json({ matches: [], scanning: true });
    }

    const all  = _cache || [];
    const mine = all.filter(chain => chain.some(u => u.id === req.user.id));
    console.log(`[/run] responded instantly. ${mine.length} circle(s) for this user. scanning=${_running}`);
    res.json({ matches: mine, scanning: _running });
  });

  router.post("/", requireAuth, async (req, res) => {
    const { chain } = req.body;
    if (!chain || chain.length < 2)
      return res.status(400).json({ error: "chain must have at least 2 participants" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const matchType = chain.length === 2 ? "one_to_one" : "circular";
      const { rows: [match] } = await client.query(
        "INSERT INTO matches (match_type) VALUES ($1) RETURNING *", [matchType]
      );

      const participantIds = [];
      for (const member of chain) {
        const { rows: [p] } = await client.query(
          "INSERT INTO match_participants (match_id, user_id, listing_id) VALUES ($1,$2,$3) RETURNING id",
          [match.id, member.id, member.listingId || null]
        );
        participantIds.push(p.id);
      }

      for (let i = 0; i < participantIds.length; i++) {
        const receivesFrom = participantIds[(i - 1 + participantIds.length) % participantIds.length];
        await client.query(
          "UPDATE match_participants SET receives_from=$1 WHERE id=$2", [receivesFrom, participantIds[i]]
        );
      }

      for (const member of chain) {
        if (member.listingId)
          await client.query("UPDATE listings SET status='matched' WHERE id=$1", [member.listingId]);
      }

      await client.query("COMMIT");
      invalidateCache();
      res.status(201).json({ match, participantCount: chain.length });
    } catch (e) {
      await client.query("ROLLBACK");
      if (e.code === "23505") return res.status(409).json({ error: "Match already exists" });
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  router.post("/:id/confirm", requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "UPDATE match_participants SET confirmed=TRUE WHERE match_id=$1 AND user_id=$2",
        [req.params.id, req.user.id]
      );

      const { rows: participants } = await client.query(
        "SELECT * FROM match_participants WHERE match_id=$1", [req.params.id]
      );

      const allConfirmed = participants.every(p => p.confirmed);

      if (allConfirmed) {
        await client.query("UPDATE matches SET status='all_confirmed' WHERE id=$1", [req.params.id]);

        const { rows: devInMatch } = await client.query(
          `SELECT u.id FROM match_participants mp JOIN users u ON u.id=mp.user_id
           WHERE mp.match_id=$1 AND u.is_dev_user=TRUE`, [req.params.id]
        );

        for (const dev of devInMatch) {
          await client.query(
            "INSERT INTO messages (match_id, sender_id, body) VALUES ($1,$2,$3)",
            [req.params.id, dev.id, 'yo where can we meet? ']
          );
        }

        await client.query(
          "UPDATE match_participants SET phone_revealed=TRUE WHERE match_id=$1", [req.params.id]
        );

        for (const p of participants) {
          await client.query(
            "INSERT INTO karma_events (user_id, delta, reason, match_id) VALUES ($1,$2,$3,$4)",
            [p.user_id, KARMA.DONATION, "donation", req.params.id]
          );
          await client.query(
            "UPDATE users SET karma=karma+$1 WHERE id=$2", [KARMA.DONATION, p.user_id]
          );
        }
      }

      await client.query("COMMIT");
      res.json({ allConfirmed });
    } catch (e) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  router.post("/:id/cancel", requireAuth, async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: [participant] } = await client.query(
        "SELECT * FROM match_participants WHERE match_id=$1 AND user_id=$2",
        [req.params.id, req.user.id]
      );
      if (!participant) return res.status(403).json({ error: "Not in this match" });

      const { rows: [match] } = await client.query("SELECT * FROM matches WHERE id=$1", [req.params.id]);
      if (!match) return res.status(404).json({ error: "Match not found" });

      if (match.status === 'all_confirmed')
        return res.status(400).json({ error: "Cannot cancel a fully confirmed match" });

      const { rows: participants } = await client.query(
        "SELECT listing_id FROM match_participants WHERE match_id=$1", [req.params.id]
      );

      for (const p of participants) {
        await client.query("UPDATE listings SET status='active' WHERE id=$1", [p.listing_id]);
      }

      await client.query("UPDATE matches SET status='cancelled' WHERE id=$1", [req.params.id]);

      await client.query(
        "INSERT INTO messages (match_id, sender_id, body) VALUES ($1,$2,$3)",
        [req.params.id, req.user.id, `${req.user.name || 'Someone'} backed out. The circle is broken.`]
      );

      await client.query("COMMIT");
      invalidateCache();

      io.to(`match_${req.params.id}`).emit('match_cancelled', { matchId: req.params.id });
      res.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: e.message });
    } finally {
      client.release();
    }
  });

  router.get("/:id/phones", requireAuth, async (req, res) => {
    const { rows: [participant] } = await pool.query(
      "SELECT * FROM match_participants WHERE match_id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    if (!participant) return res.status(403).json({ error: "Not in this match" });
    if (!participant.phone_revealed)
      return res.status(403).json({ error: "Not all participants confirmed yet" });

    const { rows } = await pool.query(
      `SELECT u.display_name, u.phone FROM match_participants mp
       JOIN users u ON u.id=mp.user_id WHERE mp.match_id=$1 AND mp.user_id!=$2`,
      [req.params.id, req.user.id]
    );
    res.json(rows);
  });

  return router;
}
