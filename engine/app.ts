import type { Request, Response, NextFunction } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { executeRouter } from "./routes/execute.route";
import { agentRouter } from "./routes/agent.route";
import { billingRouter } from "./routes/billing.route";
import authRouter from "./routes/auth.route";
import { RunixError } from "@/lib/error";
import { getAgentByApiKey } from "@/agents/agent.service";
import logger from "@/lib/logger";
import { config } from "@/config";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(cors({
  origin: [
    process.env.FRONTEND_URL!,
    "http://localhost:3000",
  ],
  credentials: true,
}));

app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).id = (req.headers["x-request-id"] as string) ?? randomUUID();
  next();
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down" },
});

const executionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Execution rate limit exceeded" },
});

app.use(globalLimiter);
app.use("/api/execute", executionLimiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers["content-type"] ?? "";
  if (
    req.method !== "GET" &&
    req.method !== "HEAD" &&
    !contentType.startsWith("application/json")
  ) {
    res.status(415).json({ error: "Unsupported Media Type: use application/json" });
    return;
  }
  next();
});

app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ── Auth — validates system key OR registered agent API key ──────────────────
app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  // Agent registration is public
  if (req.path.startsWith("/agents/register")) return next();

  const authHeader = req.headers["authorization"] ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();

  if (!token) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  // Check system API key first
  if (token === config.apiKey) {
    (req as any).isSystemKey = true;
    return next();
  }

  // Check agent API key from Redis
  try {
    const agent = await getAgentByApiKey(token);
    if (agent) {
      (req as any).agent = agent;
      (req as any).agentApiKey = token;
      return next();
    }
  } catch {
    // fall through to 401
  }

  res.status(401).json({ error: "Invalid API key" });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", executeRouter);
app.use("/api/agents", agentRouter);
app.use("/api/billing", billingRouter);
app.use("/api/auth", authRouter);
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const reqId = (req as any).id ?? "unknown";

  if (err instanceof RunixError) {
    logger.warn(`[${reqId}] RunixError [${err.statusCode}]: ${err.message}`);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(`[${reqId}] Unhandled error`, err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;