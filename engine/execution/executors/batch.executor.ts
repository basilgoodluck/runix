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
        jobId: job.id,
        type: JobType.BATCH,
        status: JobStatus.SUCCESS,
        results: [],
        summary: { total: 0, succeeded: 0, failed: 0 },
        durationMs: Date.now() - start,
      };
    }

    try {
      // Stamp each child with a unique id if not already set
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

      const succeeded = results.filter((r) => r.status === JobStatus.SUCCESS).length;
      const failed = results.length - succeeded;
      const overallStatus = failed === 0 ? JobStatus.SUCCESS : JobStatus.FAILED;

      return {
        jobId: job.id,
        type: JobType.BATCH,
        status: overallStatus,
        results,
        summary: {
          total: results.length,
          succeeded,
          failed,
        },
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`BatchExecutor failed [${job.id}]: ${err.message}`);

      return {
        jobId: job.id,
        type: JobType.BATCH,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
  }

  // Run all jobs in parallel — collect all results regardless of failures
  private async runAll(
    children: BatchJob["jobs"]
  ): Promise<ExecutionResult[]> {
    const settled = await Promise.allSettled(children.map((child) => routeJob(child)));

    return settled.map((result, i) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      // Job threw — wrap as a failed ExecutionResult
      return {
        jobId: children[i]!.id,
        type: children[i]!.type as any,
        status: JobStatus.FAILED,
        error: result.reason?.message ?? "Unknown error",
        durationMs: 0,
      };
    });
  }

  // Run all jobs in parallel but abort remaining on first failure
  private async runFailFast(
    children: BatchJob["jobs"],
    batchId: string
  ): Promise<ExecutionResult[]> {
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
              reject(new Error(`Batch aborted — child job [${child.id}] failed: ${result.error}`));
              return;
            }

            if (completed === children.length) {
              resolve(results as ExecutionResult[]);
            }
          })
          .catch((err) => {
            if (aborted) return;
            aborted = true;
            reject(err);
          });
      });
    });
  }
}