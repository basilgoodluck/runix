import { JobStatus, JobType } from "../types";
import type { ExecutionResult } from "../types";
import type { BaseJob } from "../types";
import { writeFile, readFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";
import { containerPool } from "../sandbox/container.pool";
import { PassThrough } from "stream";
import Docker from "dockerode";
import logger from "@/lib/logger";

const TMP_DIR = "/tmp/runix-files";

export type FileTransform =
  | "none"          // return file as-is
  | "base64-encode" // encode file to base64 string
  | "base64-decode" // decode base64 input to file
  | "json-parse"    // parse file as JSON and return object
  | "csv-parse"     // parse CSV and return rows as JSON
  | "text"          // return raw text content

export interface FileJob extends BaseJob {
  type: JobType.FILE;
  // Base64-encoded file content
  content: string;
  // Original filename — used to infer mime type and extension
  filename: string;
  // What to do with the file
  transform: FileTransform;
  // Optional: run a compute job on the file after writing it
  // The code receives the file path as the FILE_PATH env var
  compute?: {
    runtime: "python" | "node" | "bash";
    code: string;
  };
}

export class FileExecutor {
  async run(job: FileJob): Promise<ExecutionResult> {
    const start = Date.now();

    logger.info(`FileExecutor: [${job.id}] filename=${job.filename} transform=${job.transform}`);

    const filePath = join(TMP_DIR, `${randomUUID()}-${job.filename}`);

    try {
      // Decode base64 input and write to temp file
      const fileBuffer = Buffer.from(job.content, "base64");
      await writeFile(filePath, fileBuffer);

      let output: unknown;

      if (job.compute) {
        // Run user code against the file inside a sandbox container
        output = await this.runComputeOnFile(job, filePath);
      } else {
        output = await this.applyTransform(job.transform, filePath, fileBuffer);
      }

      return {
        id: job.id,
        type: JobType.FILE,
        status: JobStatus.DONE,
        output,
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      logger.error(`FileExecutor failed [${job.id}]: ${err.message}`);

      return {
        id: job.id,
        type: JobType.FILE,
        status: JobStatus.FAILED,
        error: err.message,
        durationMs: Date.now() - start,
      };
    } finally {
      // Always clean up temp file
      await unlink(filePath).catch(() => {});
    }
  }

  private async applyTransform(
    transform: FileTransform,
    filePath: string,
    buffer: Buffer
  ): Promise<unknown> {
    switch (transform) {
      case "none":
        return { base64: buffer.toString("base64") };

      case "base64-encode":
        return { encoded: buffer.toString("base64") };

      case "base64-decode": {
        const decoded = Buffer.from(buffer.toString("utf-8").trim(), "base64");
        return { base64: decoded.toString("base64"), sizeBytes: decoded.length };
      }

      case "json-parse": {
        const text = await readFile(filePath, "utf-8");
        return JSON.parse(text);
      }

      case "csv-parse": {
        const text = await readFile(filePath, "utf-8");
        return this.parseCsv(text);
      }

      case "text": {
        const text = await readFile(filePath, "utf-8");
        return { text };
      }

      default:
        throw new Error(`Unknown transform: ${transform}`);
    }
  }

  private parseCsv(text: string): Record<string, string>[] {
    const lines = text.trim().split("\n");
    const headers = lines[0]?.split(",").map((h) => h.trim()) ?? [];

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] ?? "";
      });
      return row;
    });
  }

  private async runComputeOnFile(job: FileJob, filePath: string): Promise<unknown> {
    if (!job.compute) throw new Error("No compute config provided");

    const { runtime, code } = job.compute;
    const pooled = await containerPool.acquire(runtime as any);
    const { container } = pooled;

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    try {
      const exec = await container.exec({
        Cmd: this.buildCmd(runtime, code),
        AttachStdout: true,
        AttachStderr: true,
        Env: [`FILE_PATH=${filePath}`, `FILE_NAME=${job.filename}`],
      });

      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();

      stdoutStream.on("data", (chunk: Buffer) => stdout.push(chunk));
      stderrStream.on("data", (chunk: Buffer) => stderr.push(chunk));

      const execStream = await exec.start({ hijack: true, stdin: false });
      (container as any).modem.demuxStream(execStream, stdoutStream, stderrStream);

      await this.waitForExec(exec, job.timeoutMs ?? 15_000);

      const inspect = await exec.inspect();

      return {
        stdout: Buffer.concat(stdout).toString("utf-8").trim(),
        stderr: Buffer.concat(stderr).toString("utf-8").trim(),
        exitCode: inspect.ExitCode ?? -1,
      };
    } finally {
      containerPool.release(pooled).catch(() => {});
    }
  }

  private buildCmd(language: string, code: string): string[] {
    switch (language) {
      case "python": return ["python3", "-c", code];
      case "node":   return ["node", "-e", code];
      case "bash":   return ["bash", "-c", code];
      default:       throw new Error(`Unsupported language for file compute: ${language}`);
    }
  }

  private waitForExec(exec: Docker.Exec, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`File compute timed out after ${timeoutMs}ms`)), timeoutMs);
      const poll = setInterval(async () => {
        const info = await exec.inspect().catch(() => null);
        if (info && !info.Running) {
          clearTimeout(timeout);
          clearInterval(poll);
          resolve();
        }
      }, 100);
    });
  }
}