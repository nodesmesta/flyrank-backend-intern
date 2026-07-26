import type { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────
// Auth Middleware
// ──────────────────────────────────────────────

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string | undefined;
    created_at: string | undefined;
  };
}

/**
 * Factory: creates an auth middleware that verifies Bearer tokens via Supabase.
 *
 * Usage:
 *   import { createAuthMiddleware } from "./middleware/auth.js";
 *   const authMiddleware = createAuthMiddleware(supabase);
 *   app.get("/protected/profile", authMiddleware, handler);
 */
export function createAuthMiddleware(supabase: SupabaseClient) {
  return async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const token = authHeader.slice(7);
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach user info to request for downstream handlers
    req.user = {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at,
    };
    next();
  };
}
