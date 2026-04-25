import { Worker } from "bullmq";
import { config } from "@/config";
import { QUEUE_NAME } from "./queue.config";
import { routeJob } from "../route";
import type { Job, ExecutionResult } from "../types";
import { JobType } from "../types";
import logger from "@/lib/logger";

const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

const CONCURRENCY: Record<JobType, number> = {
  [JobType.COMPUTE]:  20,
  [JobType.ACTION]:   10,
  [JobType.DATA]:     10,
  [JobType.STATEFUL]: 10,
  [JobType.BATCH]:    5,
  [JobType.FILE]:     5,
  [JobType.LLM]:      5,
};

function createWorker(jobType: JobType) {
  const worker = new Worker<Job, ExecutionResult>(
    QUEUE_NAME,
    async (queuedJob) => {
      const job = queuedJob.data;
      logger.info(`Worker[${jobType}]: processing job [${job.id}]`);
      return routeJob(job);
    },
    {
      connection,
      concurrency: CONCURRENCY[jobType],
    }
  );

  worker.on("completed", (job) => {
    logger.info(`Worker[${jobType}]: job [${job.id}] completed`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Worker[${jobType}]: job [${job?.id}] failed — ${err.message}`);
  });

  return worker;
}

export const computeWorker  = createWorker(JobType.COMPUTE);
export const actionWorker   = createWorker(JobType.ACTION);
export const dataWorker     = createWorker(JobType.DATA);
export const statefulWorker = createWorker(JobType.STATEFUL);
export const batchWorker    = createWorker(JobType.BATCH);
export const fileWorker     = createWorker(JobType.FILE);
export const llmWorker      = createWorker(JobType.LLM);
export const allWorkers = [
  computeWorker,
  actionWorker,
  dataWorker,
  statefulWorker,
  batchWorker,
  fileWorker,
  llmWorker
];