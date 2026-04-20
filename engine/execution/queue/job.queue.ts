import { Queue, QueueEvents } from "bullmq";
import { config } from "@/config";
import { QUEUE_NAME, JOB_OPTIONS } from "./queue.config";
import type { Job, ExecutionResult } from "../types";

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

export const jobQueue = new Queue<Job & { _apiKey?: string }, ExecutionResult>(
  QUEUE_NAME,
  { connection }
);

const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

export async function enqueueJob(job: Job, apiKey?: string): Promise<ExecutionResult> {
  const payload = apiKey ? { ...job, _apiKey: apiKey } : job;

  const queued = await jobQueue.add(job.type, payload, {
    ...JOB_OPTIONS,
    jobId: job.id,
  });

  return queued.waitUntilFinished(queueEvents);
}