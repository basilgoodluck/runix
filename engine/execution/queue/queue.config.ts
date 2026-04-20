import { JobType } from "../types";

export const QUEUE_NAME = "runix-jobs";

export const CONCURRENCY: Record<JobType, number> = {
  [JobType.COMPUTE]:  3,
  [JobType.ACTION]:   10,
  [JobType.DATA]:     10,
  [JobType.STATEFUL]: 20,
  [JobType.FILE]: 15,
  [JobType.BATCH]: 30
};

export const JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 500,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};