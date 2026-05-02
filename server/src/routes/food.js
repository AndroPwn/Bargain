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
  const { rows } = await pool.query(
    `INSERT INTO food_listings (user_id, title, quantity, available_until, neighborhood, geohash)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, title, quantity, available_until, neighborhood || "Unknown", geohash]
  );
  await pool.query("INSERT INTO karma_events (user_id, delta, reason) VALUES ($1,$2,$3)", [req.user.id, KARMA.FOOD_SURPLUS, "food_donation"]);
  await pool.query("UPDATE users SET karma = karma + $1 WHERE id = $2", [KARMA.FOOD_SURPLUS, req.user.id]);
  res.status(201).json(rows[0]);
});

export default router;
