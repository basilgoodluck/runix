import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { registerAgent } from "@/agents/agent.service";
import { ValidationError } from "@/lib/error";
import logger from "@/lib/logger";

export const agentRouter = Router();

agentRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { metadataUri } = req.body;

    if (!metadataUri || typeof metadataUri !== "string") {
      throw new ValidationError("metadataUri is required — provide an IPFS or HTTPS URI describing your agent");
    }

    logger.info(`AgentRoute: new agent registration metadataUri=${metadataUri}`);

    const agent = await registerAgent(metadataUri);

    return res.status(201).json({
      agentId:          agent.agentId,
      apiKey:           agent.apiKey,
      walletAddress:    agent.walletAddress,
      onchainAgentId:   agent.onchainAgentId,
      txHash:           agent.txHash,
      metadataUri:      agent.metadataUri,
      createdAt:        agent.createdAt,
      message:          "Fund your wallet with USDC on Arc Testnet to start submitting jobs",
    });
  } catch (err) {
    next(err);
  }
});