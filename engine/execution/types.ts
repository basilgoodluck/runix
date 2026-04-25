export enum JobType {
  COMPUTE  = "compute",
  ACTION   = "action",
  DATA     = "data",
  STATEFUL = "stateful",
  BATCH    = "batch",
  FILE     = "file",
  LLM      = "llm",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  DONE    = "done",      // was "success"
  FAILED  = "failed",
  TIMEOUT = "timeout",
}

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

// ---------- Base ----------

export interface BaseJob {
  id: string;
  type: JobType;
  timeoutMs?: number;
}

// ---------- Compute ----------

export interface ComputeJob extends BaseJob {
  type: JobType.COMPUTE;
  runtime: Runtime;         // was "language"
  code: string;
  stdin?: string;
  env?: Record<string, string>;
}

export interface LlmJob {
  id: string;
  type: "llm";                        // matches JobType.LLM
  prompt: string;                     // the user prompt
  systemPrompt?: string;              // optional system prompt
  provider?: "gemini" | "openai" | "custom";  // default: "gemini"
  model?: string;                     // default: gemini-2.0-flash / gpt-4o-mini
  endpoint?: string;                  // required if provider = "custom"
  apiKey?: string;                    // overrides env var if provided
  headers?: Record<string, string>;   // extra headers
  retries?: number;                   // default: 2
  timeoutMs?: number;                 // default: 30000
}

// ---------- Action ----------

export interface ActionJob extends BaseJob {
  type: JobType.ACTION;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  retries?: number;
}

// ---------- Data ----------

export interface DataJob extends BaseJob {
  type: JobType.DATA;
  mode: "fetch" | "scrape";
  url: string;
  selector?: string;
}

// ---------- Stateful ----------

export type StatefulOp = "get" | "set" | "delete" | "exists";

export interface StatefulJob extends BaseJob {
  type: JobType.STATEFUL;
  op: StatefulOp;
  key: string;
  value?: unknown;
  ttl?: number;
}

// ---------- Batch ----------

export type BatchChildJob = ComputeJob | ActionJob | DataJob | StatefulJob;

export interface BatchJob extends BaseJob {
  type: JobType.BATCH;
  jobs: BatchChildJob[];
  failFast?: boolean;
  concurrency?: number;
}

// ---------- File ----------

export type FileTransform =
  | "none"
  | "base64-encode"
  | "base64-decode"
  | "json-parse"
  | "csv-parse"
  | "text";

export interface FileJob extends BaseJob {
  type: JobType.FILE;
  content: string;
  filename: string;
  transform: FileTransform;
  compute?: {
    runtime: "python" | "node" | "bash";
    code: string;
  };
}

// ---------- Union ----------

export type Job = ComputeJob | ActionJob | DataJob | StatefulJob | BatchJob | FileJob | LlmJob;

// ---------- Resources ----------

export interface JobResources {
  cpuPercent: number;
  memoryUsedBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
}

// ---------- Receipt ----------

export interface ExecutionReceipt {
  id: string;
  jobType: string;
  inputHash: string;
  outputHash: string;
  status: string;
  timestamp: string;
  signature: string;
}

// ---------- Cost ----------

export interface JobCost {
  costUsd: number;           // flat, was cost.usdc
  breakdown: {
    baseFee: number;
    computeTimeFee: number;
    memoryFee: number;
    typeFee: number;
  };
  paymentId?: string;
  arcTxHash?: string;
}

// ---------- Agent ----------

export interface AgentInfo {
  agentId: string;
  onchainAgentId?: string;
  txHash?: string;
  walletId: string;
  walletAddress: string;
  apiKey: string;
  metadataUri: string;
  createdAt: number;
}

// ---------- Result ----------

export interface ExecutionResult {
  id: string;              // was jobId
  type: JobType;
  status: JobStatus;
  stdout?: string;         // flat, was output.stdout
  stderr?: string;         // flat, was output.stderr
  exitCode?: number;       // flat, was output.exitCode
  output?: unknown;        // for non-compute jobs (action, data, stateful, file)
  error?: string;
  durationMs: number;
  resources?: JobResources;
  receipt?: ExecutionReceipt;
  cached?: boolean;
  costUsd?: number;        // flat, was cost.usdc
  costBreakdown?: JobCost["breakdown"];
  paymentId?: string;
  results?: ExecutionResult[];
  summary?: {
    total: number;
    succeeded: number;
    failed: number;
    totalCostUsd: number;
  };
}

// ---------- Streaming ----------

export interface StreamChunk {
  type: "stdout" | "stderr" | "exit" | "error";
  data: string;
  timestamp: number;
}
