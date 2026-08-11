import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth } from "../middleware/auth.js";
import { KARMA } from "../services/trustEngine.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT n.*, json_agg(nw.*) FILTER (WHERE nw.id IS NOT NULL) AS wishlist
     FROM ngos n LEFT JOIN ngo_wants nw ON nw.ngo_id = n.id AND nw.fulfilled = FALSE
     WHERE n.verified = TRUE GROUP BY n.id ORDER BY n.name`
  );
  res.json(rows);
});

router.post("/:ngoId/donate", requireAuth, async (req, res) => {
  const { wantId } = req.body;
  if (!wantId) return res.status(400).json({ error: "wantId required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE ngo_wants SET fulfilled = TRUE
       WHERE id = $1 AND ngo_id = $2 AND fulfilled = FALSE
       RETURNING id`,
      [wantId, req.params.ngoId]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Open NGO request not found" });
    }
    await client.query("INSERT INTO karma_events (user_id, delta, reason) VALUES ($1,$2,$3)", [req.user.id, KARMA.NGO_DONATION, "ngo_donation"]);
    await client.query("UPDATE users SET karma = karma + $1 WHERE id = $2", [KARMA.NGO_DONATION, req.user.id]);
    await client.query("COMMIT");
    res.json({ ok: true, karmaAwarded: KARMA.NGO_DONATION });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

export default router;
