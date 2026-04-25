import type {
  RunixClientConfig,
  RegisterOptions,
  ComputePayload,
  ActionPayload,
  DataPayload,
  StatefulPayload,
  BatchPayload,
  FilePayload,
  LlmPayload,
  ExecutionResult,
  LlmResult,
  AgentRegistration,
  AgentBalance,
  BillingHistory,
  StreamChunk,
} from "./types";

export class RunixClient {
  private apiKey: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: RunixClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? "https://runix.basilgoodluck.com").replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 30_000;
  }

  // ── Execution ───────────────────────────────────────────────────────────────

  async compute(payload: ComputePayload): Promise<ExecutionResult> {
    return this.execute("compute", payload);
  }

  async action(payload: ActionPayload): Promise<ExecutionResult> {
    return this.execute("action", payload);
  }

  async data(payload: DataPayload): Promise<ExecutionResult> {
    return this.execute("data", payload);
  }

  async stateful(payload: StatefulPayload): Promise<ExecutionResult> {
    return this.execute("stateful", payload);
  }

  async batch(payload: BatchPayload): Promise<ExecutionResult> {
    return this.execute("batch", payload);
  }

  async file(payload: FilePayload): Promise<ExecutionResult> {
    return this.execute("file", payload);
  }

  async llm(payload: LlmPayload): Promise<LlmResult> {
    return this.execute("llm", payload) as Promise<LlmResult>;
  }

  // ── Streaming - async generator, yields StreamChunk ──────────────────────────

  async *stream(payload: ComputePayload): AsyncGenerator<StreamChunk> {
    const res = await fetch(`${this.baseUrl}/api/execute/stream`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new RunixError(res.status, (err as any).error ?? "Stream failed");
    }

    if (!res.body) throw new RunixError(500, "No response body for stream");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim();
          if (json) {
            const chunk = JSON.parse(json) as StreamChunk;
            yield chunk;
            if (chunk.type === "exit" || chunk.type === "error") return;
          }
        }
      }
    }
  }

  // ── Agent registration - static, no auth needed ───────────────────────────────

  static async register(
    options: RegisterOptions,
    baseUrl: string = "https://runix.basilgoodluck.com"
  ): Promise<AgentRegistration> {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadataUri: options.metadataUri }),
    });

    const data = await res.json();
    if (!res.ok) throw new RunixError(res.status, data.error ?? "Registration failed");
    return data as AgentRegistration;
  }

  // ── Billing ─────────────────────────────────────────────────────────────────

  async balance(): Promise<AgentBalance> {
    return this.get("/api/billing/balance");
  }

  async history(): Promise<BillingHistory> {
    return this.get("/api/billing/history");
  }

  // ── Health ──────────────────────────────────────────────────────────────────

  async health(): Promise<{ status: string; ts: string }> {
    return this.get("/health", false);
  }

  // ── Internal ────────────────────────────────────────────────────────────────

  private async execute(type: string, payload: unknown): Promise<ExecutionResult> {
    const res = await fetch(`${this.baseUrl}/api/execute`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ type, ...(payload as object) }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json();
    if (!res.ok) throw new RunixError(res.status, data.error ?? "Execution failed");
    return data as ExecutionResult;
  }

  private async get<T>(path: string, auth = true): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: auth ? this.headers() : { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json();
    if (!res.ok) throw new RunixError(res.status, data.error ?? "Request failed");
    return data as T;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }
}

export class RunixError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "RunixError";
  }
}