import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token" });
  }
  try {
    req.user = jwt.verify(header.slice(7), getJwtSecret());
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
