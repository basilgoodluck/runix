import { JobStatus, JobType } from "../types";
import type { ComputeJob, ExecutionResult } from "../types";
import { DockerRunner } from "../sandbox/docker.runner";
import { RUNTIME_IMAGES } from "../sandbox/runtime.images";
import logger from "@/lib/logger";

export class ComputeExecutor {
  private runner: DockerRunner;

  constructor() {
    this.runner = new DockerRunner();
  }

  async run(job: ComputeJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`ComputeExecutor: running job [${job.id}] runtime=${job.runtime}`);

    try {
      const image = RUNTIME_IMAGES[job.runtime];

      if (!image) {
        throw new Error(`No runtime image for: ${job.runtime}`);
      }

      const runOpts: Parameters<DockerRunner["execute"]>[0] = {
        image,
        code: job.code,
        runtime: job.runtime,
        timeoutMs: job.timeoutMs ?? 10_000,
        env: job.env ?? {},
        ...(job.stdin !== undefined ? { stdin: job.stdin } : {}),
      };

      const { stdout, stderr, exitCode, resources } = await this.runner.execute(runOpts);

      return {
        id: job.id,
        type: JobType.COMPUTE,
        status: JobStatus.DONE,
        stdout,
        stderr,
        exitCode,
        resources,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`ComputeExecutor failed [${job.id}]: ${err.message}`);

      return {
        id: job.id,
        type: JobType.COMPUTE,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
  }
}