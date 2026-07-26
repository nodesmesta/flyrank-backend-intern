import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import type { Request, Response, NextFunction } from "express";

const swaggerDocument = JSON.parse(
  readFileSync(new URL("./openapi.json", import.meta.url), "utf-8")
);

// Extend Express Request to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string | undefined;
    created_at: string | undefined;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "..", ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_KEY ?? "";
const PORT = parseInt(process.env.PORT ?? "3000", 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const app = express();
app.use(express.json());

// ──────────────────────────────────────────────
// Stage 4: Auth Middleware
// ──────────────────────────────────────────────

// Reusable middleware: verifies Bearer token and attaches user to request
async function authMiddleware(
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
}

// ──────────────────────────────────────────────
// Stage 1: Sign Up & Log In
// ──────────────────────────────────────────────

// POST /auth/signup — create a new user account
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(201).json(data.user);
});

// POST /auth/login — authenticate and return a JWT
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    res.status(401).json({ error: "Invalid login credentials" });
    return;
  }

  res.status(200).json({
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    user: data.user,
  });
});

// ──────────────────────────────────────────────
// Stage 2: Public & Protected Gates
// ──────────────────────────────────────────────

// GET /public/info — no auth required
app.get("/public/info", (_req, res) => {
  res.json({ message: "Welcome stranger! This info is public." });
});

// ──────────────────────────────────────────────
// Stage 4: Protected Routes (with middleware)
// ──────────────────────────────────────────────

// GET /protected/profile — return authenticated user info
app.get("/protected/profile", authMiddleware, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    id: req.user?.id,
    email: req.user?.email,
    created_at: req.user?.created_at,
  });
});

// POST /auth/logout — end the user's session (protected)
app.post("/auth/logout", authMiddleware, async (_req: AuthenticatedRequest, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(204).send();
});

// GET /protected/dashboard — second protected route (demonstrates middleware reuse)
app.get("/protected/dashboard", authMiddleware, (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    message: "Welcome to your dashboard!",
    user_id: req.user?.id,
    email: req.user?.email,
  });
});

// ──────────────────────────────────────────────
// Stage 5: Swagger UI
// ──────────────────────────────────────────────

// GET /api-docs — interactive API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Connected to Supabase");
});
