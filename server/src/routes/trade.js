import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Get all active listings with owner wants + image
router.get("/listings", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.title, l.description, l.category, l.condition,
            l.neighborhood, l.image_url, l.created_at,
            u.id AS owner_id, u.display_name AS owner_name, u.karma AS owner_karma,
            COALESCE(
              json_agg(json_build_object(
                'category', w.category,
                'item_name', COALESCE(w.item_name,''),
                'description', COALESCE(w.description,'')
              )) FILTER (WHERE w.id IS NOT NULL AND w.is_active = TRUE),
              '[]'
            ) AS owner_wants
     FROM listings l
     JOIN users u ON u.id = l.user_id
     LEFT JOIN wants w ON w.user_id = l.user_id AND w.is_active = TRUE
     WHERE l.status = 'active' AND l.user_id != $1
     GROUP BY l.id, u.id, u.display_name, u.karma
     ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Create a trade board (collaborative session)
router.post("/boards", requireAuth, async (req, res) => {
  const { name } = req.body;
  const { rows: [board] } = await pool.query(
    `INSERT INTO trade_boards (name, created_by) VALUES ($1, $2) RETURNING *`,
    [name || "Trade Session", req.user.id]
  );
  await pool.query(
    `INSERT INTO trade_board_members (board_id, user_id) VALUES ($1, $2)`,
    [board.id, req.user.id]
  );
  res.status(201).json(board);
});

// Invite someone to a board
router.post("/boards/:id/invite", requireAuth, async (req, res) => {
  const { phone } = req.body;
  const { rows: [target] } = await pool.query("SELECT id FROM users WHERE phone=$1", [phone]);
  if (!target) return res.status(404).json({ error: "User not found" });
  await pool.query(
    `INSERT INTO trade_board_members (board_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [req.params.id, target.id]
  );
  res.json({ ok: true });
});

// Get boards I'm in
router.get("/boards", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT b.*, u.display_name AS creator_name,
            (SELECT COUNT(*) FROM trade_board_members WHERE board_id = b.id) AS member_count
     FROM trade_boards b
     JOIN trade_board_members tbm ON tbm.board_id = b.id AND tbm.user_id = $1
     JOIN users u ON u.id = b.created_by
     ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
});

// Add listing to board
router.post("/boards/:id/listings", requireAuth, async (req, res) => {
  const { listing_id } = req.body;
  await pool.query(
    `INSERT INTO trade_board_listings (board_id, listing_id, added_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
    [req.params.id, listing_id, req.user.id]
  );
  res.json({ ok: true });
});

// Get listings on a board
router.get("/boards/:id/listings", requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT l.id, l.title, l.category, l.condition, l.image_url,
            u.display_name AS owner_name, u.id AS owner_id,
            tbl.notes, tbl.added_by
     FROM trade_board_listings tbl
     JOIN listings l ON l.id = tbl.listing_id
     JOIN users u ON u.id = l.user_id
     WHERE tbl.board_id = $1`,
    [req.params.id]
  );
  res.json(rows);
});

export default router;
