import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { KARMA } from "../services/trustEngine.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT f.*, u.display_name AS poster_name, u.karma_tier
     FROM food_listings f JOIN users u ON u.id = f.user_id
     WHERE f.status = 'available' AND f.available_until > NOW()
     ORDER BY f.created_at DESC`
  );
  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, quantity, available_until, neighborhood, geohash } = req.body;
  if (!title || !quantity || !available_until || !geohash) {
    return res.status(400).json({ error: "title, quantity, available_until, geohash required" });
  }

  const expiresAt = new Date(available_until);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return res.status(400).json({ error: "available_until must be a future date" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO food_listings (user_id, title, quantity, available_until, neighborhood, geohash)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, title, quantity, expiresAt.toISOString(), neighborhood || "Unknown", geohash]
    );
    await client.query("INSERT INTO karma_events (user_id, delta, reason) VALUES ($1,$2,$3)", [req.user.id, KARMA.FOOD_SURPLUS, "food_donation"]);
    await client.query("UPDATE users SET karma = karma + $1 WHERE id = $2", [KARMA.FOOD_SURPLUS, req.user.id]);
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

export default router;
