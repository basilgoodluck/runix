export type JobType =
  | "compute"
  | "action"
  | "data"
  | "stateful"
  | "batch"
  | "file";

export type JobStatus = "pending" | "running" | "done" | "failed" | "timeout";

export type Runtime =
  | "python"
  | "node"
  | "typescript"
  | "ruby"
  | "go"
  | "java"
  | "rust"
  | "php"
  | "bash"
  | "c";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type FileTransform = "none" | "base64-encode" | "base64-decode" | "json-parse" | "csv-parse" | "text";
export type StatefulOp = "get" | "set" | "delete" | "exists";

// ── Job payloads ──────────────────────────────────────────────────────────────

export interface ComputePayload {
  runtime: Runtime;
  code: string;
  stdin?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface ActionPayload {
  method?: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  retries?: number;
  timeoutMs?: number;
}

export interface DataPayload {
  mode: "fetch" | "scrape";
  url: string;
  selector?: string;
  timeoutMs?: number;
}

export interface StatefulPayload {
  op: StatefulOp;
  key: string;
  value?: unknown;
  ttl?: number;
}

export interface BatchPayload {
  jobs: Array<
    | ({ type: "compute" } & ComputePayload)
    | ({ type: "action" } & ActionPayload)
    | ({ type: "data" } & DataPayload)
    | ({ type: "stateful" } & StatefulPayload)
  >;
  failFast?: boolean;
  concurrency?: number;
  timeoutMs?: number;
}

export interface FilePayload {
  content: string;
  filename: string;
  transform: FileTransform;
  compute?: { runtime: "python" | "node" | "bash"; code: string };
  timeoutMs?: number;
}

// ── Results ───────────────────────────────────────────────────────────────────

export interface JobResources {
  cpuPercent: number;
  memoryUsedBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
}

export interface ExecutionReceipt {
  id: string;
  inputHash: string;
  outputHash: string;
  signature: string;
  timestamp: number;
}

export interface ExecutionResult {
  id: string;
  type: JobType;
  status: JobStatus;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  output?: unknown;
  error?: string;
  durationMs: number;
  resources?: JobResources;
  receipt?: ExecutionReceipt;
  cached?: boolean;
  costUsd?: number;
  paymentId?: string;
  results?: ExecutionResult[];
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
    totalCostUsd: number;
  };
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export interface AgentRegistration {
  agentId: string;
  apiKey: string;
  walletAddress: string;
  onchainAgentId?: string;
  txHash?: string;
  metadataUri: string;
  createdAt: number;
  message: string;
}

export interface AgentBalance {
  agentId: string;
  walletAddress: string;
  balance: string;
}

export interface PaymentRecord {
  jobId: string;
  txId: string;
  amount: string;
  currency: string;
  network: string;
  timestamp: string;
}

export interface BillingHistory {
  agentId: string;
  total: number;
  payments: PaymentRecord[];
}

// ── Stream ────────────────────────────────────────────────────────────────────

export interface StreamChunk {
  type: "stdout" | "stderr" | "exit" | "error";
  data: string;
  timestamp: number;
}

// ── Client config ─────────────────────────────────────────────────────────────

export interface RunixClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface RegisterOptions {
  metadataUri: string;
}