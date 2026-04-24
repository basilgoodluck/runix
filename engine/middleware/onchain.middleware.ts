import { getAgentByApiKey, ensureOnchainRegistration } from "@/agents/agent.service";
import { store } from "@/state/store";
import type { Request, Response, NextFunction } from "express";
import logger from "@/lib/logger";

export async function requireOnchain(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = (req as any).agentApiKey as string | undefined;
    if (!apiKey) return next();

    const agent = await getAgentByApiKey(apiKey);
    if (!agent) return next();

    if (agent.onchainAgentId) return next(); // already registered, skip

    const lockKey = `onchain:lock:${agent.agentId}`;
    const locked = await store.setnx(lockKey, "1");
    if (locked) await store.expire(lockKey, 30);

    if (!locked) {
      logger.info(`requireOnchain: registration in progress for agentId=${agent.agentId}`);
      return next(); // another request is registering, just let it through
    }

    try {
      await ensureOnchainRegistration(agent.agentId);
    } finally {
      await store.del(lockKey);
    }

    next();
  } catch (err) {
    next(err);
  }
}