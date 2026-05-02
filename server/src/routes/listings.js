import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { withinRadius } from "../services/trustEngine.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { geohash } = req.query;
  const { rows } = await pool.query(
    `SELECT l.id, l.title, l.description, l.category, l.condition,
            l.neighborhood, l.geohash, l.status, l.created_at, l.image_url,
            l.user_id AS owner_id, u.display_name AS owner_name, u.karma_tier AS owner_tier,
            COALESCE(
              json_agg(
                json_build_object(
                  'category', w.category, 'item_name', w.item_name,
                  'description', w.description,
                  'paired', (w.listing_id = l.id)
                ) ORDER BY (w.listing_id = l.id) DESC NULLS LAST
              ) FILTER (WHERE w.id IS NOT NULL AND w.is_active = TRUE),
              '[]'
            ) AS owner_wants
     FROM listings l
     JOIN users u ON u.id = l.user_id
     LEFT JOIN wants w ON (w.listing_id = l.id OR (w.listing_id IS NULL AND w.user_id = l.user_id)) AND w.is_active = TRUE
     WHERE l.status = 'active' AND l.user_id != $1
     GROUP BY l.id, l.user_id, u.display_name, u.karma_tier
     ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  const filtered = geohash ? rows.filter((r) => withinRadius(r.geohash, geohash)) : rows;
  res.json(filtered);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, category, condition, neighborhood, geohash } = req.body;
  if (!title || !category || !geohash) return res.status(400).json({ error: "title, category, geohash required" });
  const { rows } = await pool.query(
    `INSERT INTO listings (user_id, title, description, category, condition, neighborhood, geohash)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, title, description, category, condition || "good", neighborhood || "Unknown", geohash]
  );
  res.status(201).json(rows[0]);
});

router.get("/mine", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM listings WHERE user_id = $1 ORDER BY created_at DESC",
    [req.user.id]
  );
  res.json(rows);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await pool.query("UPDATE listings SET status = 'cancelled' WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
  res.json({ ok: true });
});

export default router;
