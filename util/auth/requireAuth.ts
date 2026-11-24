import type { RequestHandler } from "express";
import { verifyAuthToken, type AuthUser } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  if (req.method === "POST" && req.path === "/api/auth/login") {
    next();
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : "";

  if (!token) {
    res.status(401).json({ error: "로그인이 필요합니다." });
    return;
  }

  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    res.status(401).json({ error: "로그인이 필요합니다." });
  }
};
