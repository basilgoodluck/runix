import axios from "axios";
import * as cheerio from "cheerio";
import { JobStatus, JobType } from "../types";
import type { DataJob, ExecutionResult } from "../types";
import logger from "@/lib/logger";

export class DataExecutor {
  async run(job: DataJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`DataExecutor: [${job.id}] mode=${job.mode} url=${job.url}`);

    try {
      const response = await axios.get(job.url, {
        timeout: job.timeoutMs ?? 15_000,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Runix/1.0)",
        },
      });

      const html: string = response.data;

      if (job.mode === "fetch") {
        return {
          jobId: job.id,
          type: JobType.DATA,
          status: JobStatus.SUCCESS,
          output: { raw: html },
          durationMs: Date.now() - start,
        };
      }

      // scrape mode
      if (!job.selector) {
        throw new Error("scrape mode requires a CSS selector");
      }

      const $ = cheerio.load(html);
      const results: string[] = [];

      $(job.selector).each((_, el) => {
        results.push($(el).text().trim());
      });

      return {
        jobId: job.id,
        type: JobType.DATA,
        status: JobStatus.SUCCESS,
        output: { selector: job.selector, results },
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`DataExecutor failed [${job.id}]: ${err.message}`);

      return {
        jobId: job.id,
        type: JobType.DATA,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
  }
}