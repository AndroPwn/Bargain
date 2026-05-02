import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, phone, email, display_name, age, country, neighborhood, geohash, karma, karma_tier, avatar_url, created_at FROM users WHERE id = $1",
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

router.patch("/me", requireAuth, async (req, res) => {
  const { display_name, neighborhood, geohash, avatar_url, age, country } = req.body;
  const { rows } = await pool.query(
    `UPDATE users SET
       display_name = COALESCE($1, display_name),
       neighborhood = COALESCE($2, neighborhood),
       geohash      = COALESCE($3, geohash),
       avatar_url   = COALESCE($4, avatar_url),
       age          = COALESCE($5, age),
       country      = COALESCE($6, country)
     WHERE id = $7
     RETURNING id, email, display_name, age, country, neighborhood, geohash, karma, karma_tier, avatar_url`,
    [display_name, neighborhood, geohash, avatar_url, age, country, req.user.id]
  );
  res.json(rows[0]);
});

export default router;
