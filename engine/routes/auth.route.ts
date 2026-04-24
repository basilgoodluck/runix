import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/prisma/prisma";
import { config } from "@/config";
import { registerAgent } from "@/agents/agent.service";

export const authRouter = Router();
const client = new OAuth2Client(config.google.clientId);

authRouter.post(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: "idToken required" });
      }

      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload?.email) {
        return res.status(400).json({ error: "Invalid Google token" });
      }

      const email = payload.email;
      const name = payload.name ?? "";
      const picture = payload.picture ?? "";

      // USER (source of truth)
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name,
          picture,
        },
      });

      // AGENT (create once)
      let agent = await prisma.agent.findFirst({
        where: {
          userId: user.id,
          metadataUri: "google-auth",
        },
      });

      if (!agent) {
        const created = await registerAgent("google-auth");

        agent = await prisma.agent.create({
          data: {
            id: created.agentId,
            apiKey: created.apiKey,
            walletId: created.walletId,
            walletAddress: created.walletAddress,
            onchainAgentId: created.onchainAgentId ?? null,
            txHash: created.txHash,
            metadataUri: created.metadataUri,
            userId: user.id,
            createdAt: new Date(),
          },
        });
      }

      return res.json({
        apiKey: agent.apiKey,
        walletAddress: agent.walletAddress,
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

authRouter.get(
  "/me",
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization ?? "";
    const apiKey = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!apiKey) {
      return res.status(401).json({ error: "Missing API key" });
    }

    const agent = await prisma.agent.findUnique({
      where: { apiKey },
      include: {
        user: true,
      },
    });

    if (!agent) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    return res.json({
      apiKey: agent.apiKey,
      walletAddress: agent.walletAddress,
      walletId: agent.walletId,
      onchainAgentId: agent.onchainAgentId,
      user: {
        email: agent.user.email,
        name: agent.user.name,
        picture: agent.user.picture,
      },
    });
  }
);

export default authRouter;