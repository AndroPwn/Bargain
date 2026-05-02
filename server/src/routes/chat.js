import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:matchId", requireAuth, async (req, res) => {
  const { rows: access } = await pool.query(
    "SELECT id FROM match_participants WHERE match_id=$1 AND user_id=$2",
    [req.params.matchId, req.user.id]
  );
  if (!access.length) return res.status(403).json({ error: "Not in this match" });

  const { rows } = await pool.query(
    `SELECT m.id, m.body, m.created_at, m.sender_id, u.display_name AS sender_name
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.match_id = $1 ORDER BY m.created_at ASC`,
    [req.params.matchId]
  );
  res.json(rows);
});

export default router;
