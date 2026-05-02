import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/leaderboard", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT display_name, karma, karma_tier, neighborhood
     FROM users ORDER BY karma DESC LIMIT 20`
  );
  res.json(rows);
});

router.get("/history", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, delta AS points, reason AS action, reason AS description, match_id, created_at
     FROM karma_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [req.user.id]
  );
  res.json(rows);
});

export default router;
