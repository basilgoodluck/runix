// engine/routes/auth.route.ts
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/prisma/prisma";
import { randomUUID } from "crypto";
import { config } from "@/config";

const router = Router();
const client = new OAuth2Client(config.google.clientId);

function generateApiKey() {
  return `rx_${randomUUID().replace(/-/g, "")}`;
}

router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: "Invalid token" });

    const email = payload.email;
    const name = payload.name ?? "";
    const picture = payload.picture ?? "";

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          picture,
          apiKey: generateApiKey(),
        },
      });
    }

    return res.json({
      apiKey: user.apiKey,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;