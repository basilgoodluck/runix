import type { Request, Response, NextFunction } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";

import { executeRouter } from "./routes/execute.route";
import { agentRouter } from "./routes/agent.route";
import { billingRouter } from "./routes/billing.route";

import { RunixError } from "@/lib/error";
import { getAgentByApiKey } from "@/agents/agent.service";
import logger from "@/lib/logger";
import { config } from "@/config";

const app = express();

app.set("trust proxy", 1);

// ─────────────────────────────
// Core middleware
// ─────────────────────────────

app.use(helmet());

app.use(cors({
  origin: [config.frontendUrl, "http://localhost:3000"],
  credentials: true,
}));

app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).id =
    (req.headers["x-request-id"] as string) ?? randomUUID();
  next();
});

app.use(express.json({ limit: "64kb" }));

// ─────────────────────────────
// Rate limit
// ─────────────────────────────

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use("/api/execute", rateLimit({
  windowMs: 60 * 1000,
  max: 10,
}));

// ─────────────────────────────
// HEALTH
// ─────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─────────────────────────────
// 🔓 PUBLIC AUTH ROUTES (NO API KEY)
// ─────────────────────────────

// app.use("/api/auth", authRouter);

// ─────────────────────────────
app.use("/api/agents", agentRouter);
app.use("/api/billing", billingRouter);
// 🔐 API KEY MIDDLEWARE (SDK ONLY)
// ─────────────────────────────

async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? "";

  const key = authHeader.startsWith("Bearer ")
  ? authHeader.slice(7).trim()
    : authHeader.trim();

    if (!key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  // system key (optional)
  if (key === config.apiKey) {
    (req as any).isSystemKey = true;
    return next();
  }

  try {
    const agent = await getAgentByApiKey(key);
    
    if (!agent) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    (req as any).agent = agent;
    (req as any).agentApiKey = key;

    return next();
  } catch (err) {
    logger.error("API key lookup failed", err);
    return res.status(500).json({ error: "Auth error" });
  }
}

// ─────────────────────────────
// 🔐 SDK ROUTES ONLY (IMPORTANT)
// ─────────────────────────────
app.use("/api/execute", apiKeyMiddleware, executeRouter);


// ─────────────────────────────
// 404
// ─────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─────────────────────────────
// Error handler
// ─────────────────────────────

app.use((err: unknown, req: Request, res: Response) => {
  const reqId = (req as any).id ?? "unknown";

  if (err instanceof RunixError) {
    logger.warn(`[${reqId}] ${err.message}`);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(`[${reqId}] Unhandled error`, err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;