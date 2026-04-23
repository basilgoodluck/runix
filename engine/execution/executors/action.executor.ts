import axios, { type AxiosRequestConfig } from "axios";
import { JobStatus, JobType } from "../types";
import type { ActionJob, ExecutionResult } from "../types";
import logger from "@/lib/logger";

const MAX_RESPONSE_BYTES = 1024 * 1024; // 1MB cap

export class ActionExecutor {
  async run(job: ActionJob): Promise<ExecutionResult> {
    const start = Date.now();
    const retries = job.retries ?? 2;

    logger.info(`ActionExecutor: [${job.id}] ${job.method} ${job.url}`);

    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          method: job.method,
          url: job.url,
          headers: job.headers ?? {},
          data: job.body,
          timeout: job.timeoutMs ?? 15_000,
          maxContentLength: MAX_RESPONSE_BYTES,
          maxBodyLength: MAX_RESPONSE_BYTES,
        };

        const response = await axios(config);

        return {
          id: job.id,
          type: JobType.ACTION,
          status: JobStatus.DONE,
          output: {
            status: response.status,
            headers: response.headers,
            data: response.data,
          },
          durationMs: Date.now() - start,
        };
      } catch (err: any) {
        const status = err.response?.status;
        lastError = `HTTP ${status ?? "ERR"}: ${err.response?.data ?? err.message}`;

        // Only retry on 5xx
        if (status && status < 500) break;

        logger.warn(`ActionExecutor retry ${attempt + 1}/${retries} [${job.id}]: ${lastError}`);
      }
    }

    logger.error(`ActionExecutor failed [${job.id}]: ${lastError}`);

    return {
      id: job.id,
      type: JobType.ACTION,
      status: JobStatus.FAILED,
      error: lastError ?? "ERR404",
      durationMs: Date.now() - start,
    };
  }
}