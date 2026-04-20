import Docker from "dockerode";
import { PassThrough } from "stream";
import { DOCKER_CONFIG } from "./docker.config";
import { containerPool } from "./container.pool";
import { collectStats } from "./container.stats";
import type { JobResources } from "../types";
import logger from "../../lib/logger";

interface RunOptions {
  image: string;
  runtime: string;
  code: string;
  stdin?: string;
  env?: Record<string, string>;
  timeoutMs: number;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  resources: JobResources;
}

export class DockerRunner {
  async execute(opts: RunOptions): Promise<RunResult> {
    const { image, runtime, code, stdin, env, timeoutMs } = opts;

    if (Buffer.byteLength(code, "utf-8") > DOCKER_CONFIG.maxCodeBytes) {
      throw new Error(`Code exceeds maximum allowed size (${DOCKER_CONFIG.maxCodeBytes / 1024}KB)`);
    }

    if (stdin && Buffer.byteLength(stdin, "utf-8") > DOCKER_CONFIG.maxStdinBytes) {
      throw new Error(`Stdin exceeds maximum allowed size (${DOCKER_CONFIG.maxStdinBytes / 1024}KB)`);
    }

    const pooled = await containerPool.acquire(runtime as any);
    const { container } = pooled;

    logger.info(`DockerRunner: acquired container for [${runtime}]`);

    try {
      const cmd = this.buildCmd(runtime, code);
      const isCompiled = ["go", "java", "rust", "c"].includes(runtime);

      const envVars: string[] = [];
      if (isCompiled) envVars.push(`CODE=${code}`);
      if (env) {
        for (const [k, v] of Object.entries(env)) {
          envVars.push(`${k}=${v}`);
        }
      }

      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: !!stdin,
        Env: envVars,
      });

      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();

      stdoutStream.on("data", (chunk: Buffer) => stdout.push(chunk));
      stderrStream.on("data", (chunk: Buffer) => stderr.push(chunk));

      const execStream = await exec.start({ hijack: true, stdin: !!stdin });
      (container as any).modem.demuxStream(execStream, stdoutStream, stderrStream);

      if (stdin) {
        execStream.write(stdin);
        execStream.end();
      }

      const statsPromise = collectStats(container);
      const timedOut = await this.waitWithTimeout(exec, timeoutMs);

      if (timedOut) throw new Error(`Execution timed out after ${timeoutMs}ms`);

      const execInspect = await exec.inspect();
      const exitCode = execInspect.ExitCode ?? -1;
      const resources = await statsPromise.catch(() => ({
        cpuPercent: 0,
        memoryUsedBytes: 0,
        memoryLimitBytes: DOCKER_CONFIG.memory,
        memoryPercent: 0,
      }));

      return {
        stdout: Buffer.concat(stdout).toString("utf-8").trim(),
        stderr: Buffer.concat(stderr).toString("utf-8").trim(),
        exitCode,
        resources,
      };
    } finally {
      containerPool.release(pooled).catch((err) => {
        logger.error(`ContainerPool: failed to release [${runtime}]: ${err.message}`);
      });
    }
  }

  private buildCmd(runtime: string, code: string): string[] {
    switch (runtime) {
      case "python":     return ["python3", "-c", code];
      case "node":       return ["node", "-e", code];
      case "typescript": return ["npx", "ts-node", "-e", code];
      case "ruby":       return ["ruby", "-e", code];
      case "php":        return ["php", "-r", code];
      case "bash":       return ["bash", "--restricted", "-c", code];
      case "go":         return ["sh", "-c", `printf '%s' "$CODE" > /tmp/main.go && go run /tmp/main.go`];
      case "java":       return ["sh", "-c", `printf '%s' "$CODE" > /tmp/Main.java && javac /tmp/Main.java -d /tmp && java -cp /tmp Main`];
      case "rust":       return ["sh", "-c", `printf '%s' "$CODE" > /tmp/main.rs && rustc /tmp/main.rs -o /tmp/main && /tmp/main`];
      case "c":          return ["sh", "-c", `printf '%s' "$CODE" > /tmp/main.c && gcc /tmp/main.c -o /tmp/main && /tmp/main`];
      default:           throw new Error(`Unsupported runtime: ${runtime}`);
    }
  }

  private waitWithTimeout(exec: Docker.Exec, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(true), timeoutMs);
      const poll = setInterval(async () => {
        const info = await exec.inspect().catch(() => null);
        if (info && !info.Running) {
          clearTimeout(timer);
          clearInterval(poll);
          resolve(false);
        }
      }, 100);
    });
  }
}