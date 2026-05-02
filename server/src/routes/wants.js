import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get current user's wants
router.get("/", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT w.*, l.title AS listing_title
     FROM wants w
     LEFT JOIN listings l ON l.id = w.listing_id
     WHERE w.user_id = $1 AND w.is_active = TRUE
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Get all wants (for browse — show what people want in return)
router.get("/all", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT w.id, w.category, w.description, w.item_name,
            w.listing_id, l.title AS listing_title, l.category AS listing_category,
            u.display_name AS owner_name, u.karma_tier AS owner_tier
     FROM wants w
     JOIN users u ON u.id = w.user_id
     LEFT JOIN listings l ON l.id = w.listing_id
     WHERE w.is_active = TRUE AND w.user_id != $1
     ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  const { category, description, listing_id, item_name } = req.body;
  if (!category) return res.status(400).json({ error: "category required" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO wants (user_id, category, description, listing_id, item_name)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, listing_id) DO NOTHING RETURNING *`,
      [req.user.id, category, description || "", listing_id || null, item_name || ""]
    );
    res.status(201).json(rows[0] || {});
  } catch (e) {
    if (e.code === "42703") {
      await pool.query("ALTER TABLE wants ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE CASCADE");
      await pool.query("ALTER TABLE wants ADD COLUMN IF NOT EXISTS item_name TEXT DEFAULT ''");
      const { rows } = await pool.query(
        `INSERT INTO wants (user_id, category, description, listing_id, item_name)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.user.id, category, description || "", listing_id || null, item_name || ""]
      );
      return res.status(201).json(rows[0]);
    }
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  await pool.query(
    "UPDATE wants SET is_active = FALSE WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
});

export default router;
