import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { enqueueJob } from "@/execution/queue/job.queue";
import { streamJob } from "@/execution/executors/stream.executor";
import { type Job, type ComputeJob, JobType } from "../execution/types";
import { ValidationError } from "@/lib/error";
import { generateJobId, clamp } from "../lib/utils";
import { config } from "../config";
import logger from "../lib/logger";
import { requireOnchain } from "@/middleware/onchain.middleware";

export const executeRouter = Router();

// ── Standard execution ────────────────────────────────────────────────────────
executeRouter.post("/execute", requireOnchain, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, timeoutMs, ...rest } = req.body;

    if (!type || !Object.values(JobType).includes(type)) {
      throw new ValidationError(
        `Invalid or missing job type. Must be one of: ${Object.values(JobType).join(", ")}`
      );
    }

    const job: Job = {
      id: generateJobId(),
      type,
      timeoutMs: clamp(
        timeoutMs ?? config.execution.defaultTimeoutMs,
        1000,
        config.execution.maxTimeoutMs
      ),
      ...rest,
    } as Job;

    logger.info(`Received job [${job.id}] type=${job.type}`);

    const apiKey = (req as any).agentApiKey as string | undefined;
    const result = await enqueueJob(job, apiKey);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ── Streaming execution (compute only, SSE) ───────────────────────────────────
executeRouter.post("/execute/stream", requireOnchain, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { runtime, code, stdin, timeoutMs } = req.body;

    if (!runtime || !code) {
      throw new ValidationError("runtime and code are required for streaming execution");
    }

    const job: ComputeJob = {
      id: generateJobId(),
      type: JobType.COMPUTE,
      runtime,
      code,
      timeoutMs: clamp(
        timeoutMs ?? config.execution.defaultTimeoutMs,
        1000,
        config.execution.maxTimeoutMs
      ),
      ...(stdin !== undefined ? { stdin } : {}),
    };

    logger.info(`Streaming job [${job.id}] runtime=${runtime}`);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    req.on("close", () => {
      logger.info(`Stream job [${job.id}] — client disconnected`);
    });

    for await (const chunk of streamJob(job)) {
      if (res.writableEnded) break;
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.type === "exit" || chunk.type === "error") break;
    }

    if (!res.writableEnded) res.end();
  } catch (err) {
    next(err);
  }
});