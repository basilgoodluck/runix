import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/prisma/prisma";
import { config } from "@/config";
import { provisionAgent } from "@/agents/agent.service";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const authRouter = Router();
const client = new OAuth2Client(config.google.clientId);

function signAccessToken(userId: string) {
  return jwt.sign(
    { sub: userId },
    config.jwt.accessSecret,
    {
      expiresIn: "24h",
      issuer: "runix",
    }
  );
}

function signRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

// ─── Google Login ───────────────────────────────────────────────

authRouter.post(
  "/google",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = req.body;
      if (!idToken) return res.status(400).json({ error: "idToken required" });

      // add this temporarily right before verifyIdToken
      console.log("CLIENT ID:", config.google.clientId);
      console.log("TOKEN AUDIENCE:", JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString()).aud);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(400).json({ error: "Invalid Google token" });
      }

      const { email, name = "", picture = "" } = payload;

      // ─── Upsert user ───────────────────────────────────────────

      const user = await prisma.user.upsert({
        where: { email }, 
        update: {},
        create: { email, name, picture },
      });

      // ─── Ensure agent exists ───────────────────────────────────

      let agent = await prisma.agent.findFirst({
        where: { userId: user.id, metadataUri: "google-auth" },
      });

      if (!agent) {
        const created = await provisionAgent("google-auth", user.id);

        agent = await prisma.agent.create({
          data: {
            id: created.agentId,
            apiKey: created.apiKey,
            walletId: created.walletId,
            walletAddress: created.walletAddress,
            onchainAgentId: created.onchainAgentId ?? null,
            txHash: created.txHash ?? "",
            metadataUri: created.metadataUri,
            userId: user.id,
            createdAt: new Date(),
          },
        });
      }

      // ─── Tokens ────────────────────────────────────────────────

      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken();

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt,
        },
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/auth",
      });

      return res.json({
        accessToken,
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        walletAddress: agent.walletAddress,
        onchainAgentId: agent.onchainAgentId,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Refresh Token ──────────────────────────────────────────────

authRouter.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ error: "No refresh token" });
      }

      const stored = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!stored || stored.expiresAt < new Date()) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const accessToken = signAccessToken(stored.userId);

      return res.json({ accessToken });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Logout ─────────────────────────────────────────────────────

authRouter.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.refreshToken;

      if (token) {
        await prisma.refreshToken.deleteMany({
          where: { token },
        });
      }

      res.clearCookie("refreshToken", { path: "/auth" });

      return res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Me endpoint ────────────────────────────────────────────────

authRouter.get(
  "/me",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization ?? "";
      const token = header.startsWith("Bearer ")
        ? header.slice(7)
        : null;

      if (!token) {
        return res.status(401).json({ error: "Missing access token" });
      }

      let payload: any;

      try {
        payload = jwt.verify(token, config.jwt.accessSecret);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const agent = await prisma.agent.findFirst({
        where: { userId: user.id, metadataUri: "google-auth" },
      });

      return res.json({
        user: {
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        walletAddress: agent?.walletAddress ?? null,
        onchainAgentId: agent?.onchainAgentId ?? null,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default authRouter;