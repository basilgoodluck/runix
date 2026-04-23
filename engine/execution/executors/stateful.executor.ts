import { JobStatus, JobType } from "../types";
import type { StatefulJob, ExecutionResult } from "../types";
import { store } from "@/state/store";
import logger from "@/lib/logger";

export class StatefulExecutor {
  async run(job: StatefulJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`StatefulExecutor: [${job.id}] op=${job.op} key=${job.key}`);

    try {
      let output: unknown;

      switch (job.op) {
        case "get": {
          const raw = await store.get(job.key);
          output = raw ? JSON.parse(raw) : null;
          break;
        }
        case "set": {
          const serialized = JSON.stringify(job.value ?? null);
          if (job.ttl) {
            await store.set(job.key, serialized, "EX", job.ttl);
          } else {
            await store.set(job.key, serialized);
          }
          output = { written: true, key: job.key, ttl: job.ttl ?? null };
          break;
        }
        case "delete": {
          await store.del(job.key);
          output = { deleted: true, key: job.key };
          break;
        }
        case "exists": {
          const count = await store.exists(job.key);
          output = { exists: count > 0, key: job.key };
          break;
        }
        default:
          throw new Error(`Unknown stateful op: ${(job as StatefulJob).op}`);
      }

      return {
        id: job.id,
        type: JobType.STATEFUL,
        status: JobStatus.DONE,
        output,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`StatefulExecutor failed [${job.id}]: ${err.message}`);

      return {
        id: job.id,
        type: JobType.STATEFUL,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
  }
}