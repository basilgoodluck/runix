import { JobStatus, JobType } from "../types";
import type { BatchJob, ExecutionResult } from "../types";
import { routeJob } from "../route";
import { generateJobId } from "@/lib/utils";
import logger from "@/lib/logger";

export class BatchExecutor {
  async run(job: BatchJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`BatchExecutor: running job [${job.id}] children=${job.jobs.length}`);

    if (job.jobs.length === 0) {
      return {
        id: job.id,
        type: JobType.BATCH,
        status: JobStatus.DONE,
        results: [],
        summary: { total: 0, succeeded: 0, failed: 0, totalCostUsd: 0 },
        durationMs: Date.now() - start,
      };
    }

    try {
      const children = job.jobs.map((child) => ({
        ...child,
        id: child.id ?? generateJobId(),
      }));

      let results: ExecutionResult[];

      if (job.failFast) {
        results = await this.runFailFast(children, job.id);
      } else {
        results = await this.runAll(children);
      }

      const succeeded = results.filter((r) => r.status === JobStatus.DONE).length;
      const failed = results.length - succeeded;
      const totalCostUsd = results.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);

      return {
        id: job.id,
        type: JobType.BATCH,
        status: failed === 0 ? JobStatus.DONE : JobStatus.FAILED,
        results,
        summary: {
          total: results.length,
          succeeded,
          failed,
          totalCostUsd: parseFloat(totalCostUsd.toFixed(8)),
        },
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`BatchExecutor failed [${job.id}]: ${err.message}`);

      return {
        id: job.id,
        type: JobType.BATCH,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
  }

  private async runAll(children: BatchJob["jobs"]): Promise<ExecutionResult[]> {
    const settled = await Promise.allSettled(children.map((child) => routeJob(child)));

    return settled.map((result, i) => {
      if (result.status === "fulfilled") return result.value;
      return {
        id: children[i]!.id,
        type: children[i]!.type as any,
        status: JobStatus.FAILED,
        error: result.reason?.message ?? "Unknown error",
        durationMs: 0,
      };
    });
  }

  private async runFailFast(children: BatchJob["jobs"], batchId: string): Promise<ExecutionResult[]> {
    return new Promise((resolve, reject) => {
      const results: ExecutionResult[] = new Array(children.length);
      let completed = 0;
      let aborted = false;

      children.forEach((child, i) => {
        routeJob(child)
          .then((result) => {
            if (aborted) return;
            results[i] = result;
            completed++;
            if (result.status === JobStatus.FAILED) {
              aborted = true;
              logger.warn(`BatchExecutor [${batchId}]: fail-fast triggered by child [${child.id}]`);
              reject(new Error(`Batch aborted — child [${child.id}] failed: ${result.error}`));
              return;
            }
            if (completed === children.length) resolve(results as ExecutionResult[]);
          })
          .catch((err) => { if (!aborted) { aborted = true; reject(err); } });
      });
    });
  }
}