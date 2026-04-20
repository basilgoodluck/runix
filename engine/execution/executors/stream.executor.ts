import { PassThrough } from "stream";
import { containerPool } from "../sandbox/container.pool";
import type { ComputeJob, StreamChunk } from "../types";
import type { SupportedRuntime } from "../sandbox/container.pool";
import logger from "@/lib/logger";

export async function* streamJob(job: ComputeJob): AsyncGenerator<StreamChunk> {
  const runtime = job.runtime as SupportedRuntime;
  const pooled = await containerPool.acquire(runtime);
  const { container } = pooled;

  logger.info(`StreamExecutor: acquired container for [${runtime}] job=${job.id}`);

  try {
    const isCompiled = ["go", "java", "rust", "c"].includes(job.runtime);
    const cmd = buildCmd(job.runtime, job.code);

    const envVars: string[] = [];
    if (isCompiled) envVars.push(`CODE=${job.code}`);
    if (job.env) {
      for (const [k, v] of Object.entries(job.env)) envVars.push(`${k}=${v}`);
    }

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: !!job.stdin,
      Env: envVars,
    });

    const merged = new PassThrough();
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    stdoutStream.on("data", (chunk: Buffer) => {
      merged.write(JSON.stringify({ type: "stdout", data: chunk.toString("utf-8"), timestamp: Date.now() }) + "\n");
    });

    stderrStream.on("data", (chunk: Buffer) => {
      merged.write(JSON.stringify({ type: "stderr", data: chunk.toString("utf-8"), timestamp: Date.now() }) + "\n");
    });

    const execStream = await exec.start({ hijack: true, stdin: !!job.stdin });
    (container as any).modem.demuxStream(execStream, stdoutStream, stderrStream);

    if (job.stdin) { execStream.write(job.stdin); execStream.end(); }

    let endCount = 0;
    const onEnd = () => { if (++endCount === 2) merged.end(); };
    stdoutStream.on("end", onEnd);
    stderrStream.on("end", onEnd);

    let buffer = "";
    for await (const raw of merged) {
      buffer += (raw as Buffer).toString("utf-8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim()) yield JSON.parse(line) as StreamChunk;
      }
    }

    const inspect = await exec.inspect();
    yield { type: "exit", data: String(inspect.ExitCode ?? -1), timestamp: Date.now() };
  } catch (err: any) {
    yield { type: "error", data: err.message, timestamp: Date.now() };
  } finally {
    containerPool.release(pooled).catch(() => {});
  }
}

function buildCmd(runtime: string, code: string): string[] {
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