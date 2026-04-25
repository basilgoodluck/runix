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
import { prisma } from "@/prisma/prisma";
import { store } from "@/state/store";

const app = express();

app.set("trust proxy", 1);

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/agents", agentRouter);
app.use("/api/billing", billingRouter);

async function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? "";

  const key = authHeader.startsWith("Bearer ")
  ? authHeader.slice(7).trim()
    : authHeader.trim();

    if (!key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  if (key === config.apiKey) {
    (req as any).isSystemKey = true;
    return next();
  }

  try {
    let agentId = await store.get(`apikey:${key}`);
    
    if (!agentId) {
      const agent = await prisma.agent.findUnique({
        where: { apiKey: key },
      });
      
      if (agent) {
        await store.set(`apikey:${key}`, agent.id);
        agentId = agent.id;
      }
    }
    
    if (!agentId) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });
    
    if (!agent) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    
    (req as any).agent = {
      agentId: agent.id,
      apiKey: agent.apiKey,
      walletId: agent.walletId,
      walletAddress: agent.walletAddress,
      onchainAgentId: agent.onchainAgentId ?? "",
      txHash: agent.txHash ?? "",
      metadataUri: agent.metadataUri,
      createdAt: agent.createdAt.getTime(),
    };
    (req as any).agentApiKey = key;

    return next();
  } catch (err) {
    logger.error("API key lookup failed", err);
    return res.status(500).json({ error: "Auth error" });
  }
}

app.use("/api/execute", apiKeyMiddleware, executeRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, req: Request, res: Response) => {
  const reqId = (req as any).id ?? "unknown";

  if (err instanceof RunixError) {
    logger.warn(`[${reqId}] ${err.message}`);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(`[${reqId}] Unhandled error`, err);
  return res.status(500).json({ error: "Internal server error" });
});

async function rebuildRedisCache() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      apiKey: true,
    },
  });

  for (const agent of agents) {
    await store.set(`apikey:${agent.apiKey}`, agent.id);
  }

  logger.info(`Redis cache rebuilt with ${agents.length} API keys`);
}

(async () => {
  try {
    await rebuildRedisCache();
    logger.info("Server initialization complete");
  } catch (err) {
    logger.error("Failed to rebuild Redis cache", err);
    process.exit(1);
  }
})();

export default app;