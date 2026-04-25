import { getAgentBalance } from '@/agents/agent.service';
import { prisma } from '@/prisma/prisma';
import { Router } from 'express';

const agentRouter = Router();

agentRouter.get("/dashboard", async (req, res, next) => {
  try {
    const userId = (req as any).userId;

    const agent = await prisma.agent.findFirst({ where: { userId } });
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const [totalJobs, successfulJobs, failedJobs, costAgg, recentJobs, recentPayments, balance] = await Promise.all([
      prisma.job.count({ where: { agentId: agent.id } }),
      prisma.job.count({ where: { agentId: agent.id, status: "success" } }),
      prisma.job.count({ where: { agentId: agent.id, status: "failed" } }),
      prisma.job.aggregate({ where: { agentId: agent.id }, _sum: { costUsd: true }, _avg: { durationMs: true } }),
      prisma.job.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.payment.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 10 }),
      getAgentBalance(agent.walletId),
    ]);

    return res.json({
      apiKey: agent.apiKey,
      walletAddress: agent.walletAddress,
      onchainAgentId: agent.onchainAgentId,
      balance,
      totalJobs,
      successfulJobs,
      failedJobs,
      totalSpentUsd: costAgg._sum.costUsd ?? 0,
      avgDurationMs: costAgg._avg.durationMs ?? 0,
      recentJobs,
      recentPayments,
    });
  } catch (err) {
    next(err);
  }
});

export { agentRouter };