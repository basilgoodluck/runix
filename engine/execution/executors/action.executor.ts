import axios, { type AxiosRequestConfig } from "axios";
import {JobStatus, JobType } from "../types";
import type {  ActionJob, ExecutionResult } from "../types";
import logger from "@/lib/logger";

export class ActionExecutor {
  async run(job: ActionJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`ActionExecutor: [${job.id}] ${job.method} ${job.url}`);

    try {
      const config: AxiosRequestConfig = {
        method: job.method,
        url: job.url,
        headers: job.headers ?? {},
        data: job.body,
        timeout: job.timeoutMs ?? 15_000,
      };

      const response = await axios(config);

      return {
        jobId: job.id,
        type: JobType.ACTION,
        status: JobStatus.SUCCESS,
        output: {
          status: response.status,
          headers: response.headers,
          data: response.data,
        },
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data ?? err.message;

      logger.error(`ActionExecutor failed [${job.id}]: ${message}`);

      return {
        jobId: job.id,
        type: JobType.ACTION,
        status: JobStatus.FAILED,
        error: `HTTP ${status ?? "ERR"}: ${message}`,
        durationMs: Date.now() - start,
      };
    }
  }
}