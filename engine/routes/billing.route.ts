import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { getAgentByApiKey, getAgentBalance } from "@/agents/agent.service";
import { getPaymentHistory } from "@/payments/payment.service";

export const billingRouter = Router();

billingRouter.get("/balance", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = extractApiKey(req);
    const agent = await getAgentByApiKey(apiKey);

    if (!agent) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const balance = await getAgentBalance(agent.walletId);

    return res.json({
      agentId:       agent.agentId,
      walletAddress: agent.walletAddress,
      balance:       `${balance} USDC`,
    });
  } catch (err) {
    next(err);
  }
});

billingRouter.get("/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = extractApiKey(req);
    const agent = await getAgentByApiKey(apiKey);

    if (!agent) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    const history = await getPaymentHistory(agent.walletId);

    return res.json({
      agentId: agent.agentId,
      total:   history.length,
      payments: history,
    });
  } catch (err) {
    next(err);
  }
});

function extractApiKey(req: Request): string {
  const auth = req.headers["authorization"] ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
}