import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { runMigrations } from "./db/migrate.js";
import pool from "./db/pool.js";
import jwt from "jsonwebtoken";
import { getJwtSecret, validateServerEnv } from "./config/env.js";
import authRoutes    from "./routes/auth.js";
import listingRoutes from "./routes/listings.js";
import createMatchRoutes from "./routes/matches.js";
import karmaRoutes   from "./routes/karma.js";
import ngoRoutes     from "./routes/ngos.js";
import foodRoutes    from "./routes/food.js";
import userRoutes    from "./routes/users.js";
import uploadRoutes  from "./routes/upload.js";
import wantsRoutes   from "./routes/wants.js";
import chatRoutes    from "./routes/chat.js";
import tradeRoutes   from "./routes/trade.js";
import carbonRoutes  from "./routes/carbon.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
validateServerEnv();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" }, transports: ["websocket", "polling"] });

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.use("/api/auth",     authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/matches",  createMatchRoutes(io));
app.use("/api/karma",    karmaRoutes);
app.use("/api/ngos",     ngoRoutes);
app.use("/api/food",     foodRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/wants",    wantsRoutes);
app.use("/api/chat",     chatRoutes);
app.use("/api/trade",    tradeRoutes);
app.use("/api/carbon",   carbonRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.get("/api/stats", async (_, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM listings)                               AS total_listings,
        (SELECT COUNT(*) FROM users)                                  AS total_users,
        (SELECT COUNT(*) FROM matches WHERE status = 'all_confirmed') AS completed_matches
    `);
    res.json(rows[0]);
  } catch {
    res.json({ total_listings: 0, total_users: 0, completed_matches: 0 });
  }
});

// Socket.io auth
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token"));
  try {
    socket.user = jwt.verify(token, getJwtSecret());
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  // ── Chat ──
  socket.on("join_match", async (matchId) => {
    try {
      const { rows } = await pool.query(
        "SELECT id FROM match_participants WHERE match_id=$1 AND user_id=$2",
        [matchId, socket.user.id]
      );
      if (rows.length) socket.join(`match:${matchId}`);
    } catch {}
  });

  socket.on("send_message", async ({ matchId, body }) => {
    if (!body?.trim()) return;
    try {
      const { rows: access } = await pool.query(
        "SELECT id FROM match_participants WHERE match_id=$1 AND user_id=$2",
        [matchId, socket.user.id]
      );
      if (!access.length) return;

      const { rows: [msg] } = await pool.query(
        `INSERT INTO messages (match_id, sender_id, body)
         VALUES ($1,$2,$3) RETURNING id, match_id, sender_id, body, created_at`,
        [matchId, socket.user.id, body.trim()]
      );
      const { rows: [sender] } = await pool.query(
        "SELECT display_name FROM users WHERE id=$1", [socket.user.id]
      );
      io.to(`match:${matchId}`).emit("new_message", { ...msg, sender_name: sender.display_name });
    } catch (e) { console.error("send_message error:", e.message); }
  });

  // ── Trade Board collaboration ──
  socket.on("join_board", (boardId) => {
    socket.join(`board:${boardId}`);
  });

  socket.on("board_update", (data) => {
    socket.to(`board:${data.boardId}`).emit("board_updated", data);
  });
});

const PORT = process.env.PORT || 3001;
runMigrations()
  .then(() => httpServer.listen(PORT, () => console.log(`EcoLoop server on :${PORT}`)))
  .catch((e) => { console.error("Fatal migration error:", e.message); process.exit(1); });
