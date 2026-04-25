"use client";

import { useRef, useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ShikiHighlighter from "react-shiki";

const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "introduction", label: "Introduction" },
      { id: "installation", label: "Installation" },
      { id: "authentication", label: "Authentication" },
      { id: "quickstart", label: "Quickstart" },
    ],
  },
  {
    group: "SDK Reference",
    items: [
      { id: "sdk-overview", label: "Overview" },
      { id: "sdk-compute", label: "runix.compute()" },
      { id: "sdk-action", label: "runix.action()" },
      { id: "sdk-data", label: "runix.data()" },
      { id: "sdk-stateful", label: "runix.stateful()" },
      { id: "sdk-batch", label: "runix.batch()" },
      { id: "sdk-stream", label: "runix.stream()" },
      { id: "sdk-llm", label: "runix.llm()" },
    ],
  },
  {
    group: "API Reference",
    items: [
      { id: "api-register", label: "POST /agents/register" },
      { id: "api-execute", label: "POST /execute" },
      { id: "api-stream", label: "POST /execute/stream" },
      { id: "api-balance", label: "GET /billing/balance" },
      { id: "api-errors", label: "Errors" },
    ],
  },
  {
    group: "Guides",
    items: [
      { id: "guide-agents", label: "Agent Integration" },
      { id: "guide-sandbox", label: "Sandbox & Security" },
      { id: "guide-billing", label: "Billing & USDC" },
    ],
  },
];

const C = {
  bg: "#080809",
  surface: "rgba(255,255,255,0.02)",
  border: "rgba(255,255,255,0.07)",
  text: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.55)",
  textDim: "rgba(255,255,255,0.3)",
  white: "#fff",
  codeBg: "#0a0b0c",
  codeBar: "#0d0d0f",
  purple: "#7c3aed",
  purpleLight: "rgba(124,58,237,0.7)",
  purpleFaint: "rgba(124,58,237,0.12)",
  purpleBorder: "rgba(124,58,237,0.25)",
};

function CodeBlock({ children, lang }: { children: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin: "18px 0", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.codeBar, padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: C.textMuted, letterSpacing: "0.06em" }}>{lang}</span>
        <button onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ fontSize: 12, color: copied ? "rgba(167,139,250,0.9)" : C.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <div style={{ background: C.codeBg, padding: "18px 20px", overflowX: "auto" }}>
        <ShikiHighlighter language={lang} theme="github-dark" showLanguage={false}
          style={{ fontSize: 13.5, lineHeight: 1.8, fontFamily: "monospace", background: C.codeBg, margin: 0, padding: 0 }}>
          {children.trim()}
        </ShikiHighlighter>
      </div>
    </div>
  );
}

function Callout({ children, type }: { children: React.ReactNode; type: "info" | "tip" | "warning" }) {
  const map = {
    info:    { border: "rgba(124,58,237,0.5)",  bg: "rgba(124,58,237,0.07)", label: "Note",    color: "rgba(167,139,250,0.9)" },
    tip:     { border: "rgba(16,185,129,0.4)",  bg: "rgba(16,185,129,0.07)", label: "Tip",     color: "#6ee7b7" },
    warning: { border: "rgba(245,158,11,0.4)",  bg: "rgba(245,158,11,0.06)", label: "Warning", color: "#fcd34d" },
  }[type];
  return (
    <div style={{ borderLeft: `2px solid ${map.border}`, background: map.bg, borderRadius: "0 10px 10px 0", padding: "12px 16px", margin: "20px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: map.color, marginBottom: 5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{map.label}</div>
      <div style={{ fontSize: 15, color: C.text, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function IC({ children }: { children: string }) {
  return <code style={{ fontSize: 13, fontFamily: "monospace", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", padding: "2px 6px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>{children}</code>;
}

function Badge({ label, color }: { label: string; color: "purple" | "green" | "orange" | "red" }) {
  const map = {
    purple: { bg: C.purpleFaint, color: "rgba(167,139,250,0.95)", border: C.purpleBorder },
    green:  { bg: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "rgba(16,185,129,0.2)" },
    orange: { bg: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "rgba(245,158,11,0.2)" },
    red:    { bg: "rgba(239,68,68,0.1)",  color: "#fca5a5", border: "rgba(239,68,68,0.2)" },
  }[color];
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", background: map.bg, color: map.color, padding: "4px 10px", borderRadius: 6, border: `1px solid ${map.border}` }}>{label}</span>;
}

function H2({ id, children }: { id: string; children: string }) {
  return <h2 id={id} style={{ fontSize: "clamp(1.05rem, 2.5vw, 1.25rem)", fontWeight: 700, color: C.white, margin: "40px 0 12px", scrollMarginTop: 32, letterSpacing: "-0.02em" }}>{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.text, lineHeight: 1.9, marginBottom: 16 }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "1.2rem", marginBottom: 18, listStyle: "disc" }}>
      {items.map(s => (
        <li key={s} style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.text, lineHeight: 1.85, marginBottom: 8 }}>{s}</li>
      ))}
    </ul>
  );
}

function OL({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: "1.2rem", marginBottom: 18 }}>
      {items.map((s) => (
        <li key={s} style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.text, lineHeight: 1.85, marginBottom: 8 }}>{s}</li>
      ))}
    </ol>
  );
}

function ParamRow({ name, type, req, desc }: { name: string; type: string; req: boolean; desc: string }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "11px 14px 11px 0", verticalAlign: "top" }}><IC>{name}</IC></td>
      <td style={{ padding: "11px 14px 11px 0", verticalAlign: "top", fontSize: 12.5, fontFamily: "monospace", color: "rgba(167,139,250,0.8)" }}>{type}</td>
      <td style={{ padding: "11px 14px 11px 0", verticalAlign: "top", fontSize: 12.5, color: req ? "#4ade80" : C.textDim }}>{req ? "Yes" : "No"}</td>
      <td style={{ padding: "11px 0", verticalAlign: "top", fontSize: "clamp(13px, 1.8vw, 15px)", color: C.text, lineHeight: 1.75 }}>{desc}</td>
    </tr>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; req: boolean; desc: string }[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "18px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Parameter", "Type", "Required", "Description"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(r => <ParamRow key={r.name} {...r} />)}</tbody>
      </table>
    </div>
  );
}

// ---------- SECTIONS ----------
const SECTIONS: Record<string, { title: string; headings: string[]; content: React.ReactNode }> = {
  introduction: {
    title: "Introduction",
    headings: ["How it works", "When to use it"],
    content: (<>
      <P>Runix is a machine-to-machine execution engine. Agents register an identity on the Arc blockchain, receive a Circle-managed USDC wallet, and submit jobs over HTTP - paying per execution in USDC with no subscriptions and no pre-provisioned infrastructure.</P>
      <P>Think of it as AWS Lambda without the deployment step, with crypto-native payments and on-chain identity built in.</P>
      <H2 id="how-it-works">How it works</H2>
      <OL items={[
        "Register - call POST /api/agents/register with your metadataUri. You get an API key and wallet address.",
        "Fund - deposit USDC to your wallet on Arc Testnet.",
        "Execute - submit jobs via SDK or HTTP. Runix sandboxes, runs, and returns a signed result.",
        "Pay - USDC is deducted from your wallet per execution.",
      ]} />
      <Callout type="info">Execution receipts are Ed25519-signed with SHA-256 hashed inputs and outputs - every result is cryptographically auditable.</Callout>
      <H2 id="when-to-use-it">When to use it</H2>
      <UL items={[
        "Autonomous agents that need to run code or call APIs inside a decision loop",
        "Event-driven systems with bursty, unpredictable compute needs",
        "Machine-to-machine value exchange without human billing",
        "On-chain identity and verifiable execution history",
      ]} />
    </>),
  },

  installation: {
    title: "Installation",
    headings: ["npm", "Requirements"],
    content: (<>
      <P>The Runix SDK wraps all HTTP endpoints and handles auth, streaming, and error handling.</P>
      <H2 id="npm">npm</H2>
      <CodeBlock lang="bash">{`npm install @basilgoodluck/runix-sdk\n# or\nyarn add @basilgoodluck/runix-sdk`}</CodeBlock>
      <Callout type="tip">Full TypeScript types included. No extra @types package needed. ESM and CJS both supported.</Callout>
      <H2 id="requirements">Requirements</H2>
      <UL items={["Node.js 18+", "A Runix API key - see Authentication", "USDC on Arc Testnet in your wallet"]} />
    </>),
  },

  authentication: {
    title: "Authentication",
    headings: ["Register your agent", "Using your key"],
    content: (<>
      <P>Runix uses API keys tied to on-chain identities. Registration creates your API key and Circle wallet at the same time.</P>
      <H2 id="register-your-agent">Register your agent</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@basilgoodluck/runix-sdk";\n\nconst agent = await RunixClient.register({\n  metadataUri: "https://your-metadata-uri.com/agent.json",\n});\n\nconsole.log(agent.apiKey);        // rx_abc123...\nconsole.log(agent.walletAddress); // 0x...\nconsole.log(agent.agentId);       // uuid`}</CodeBlock>
      <Callout type="warning">Store your apiKey immediately - it is only returned once and cannot be recovered.</Callout>
      <H2 id="using-your-key">Using your key</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,\n});`}</CodeBlock>
      <P>The key is sent as a Bearer token on every request. All endpoints except <IC>/api/agents/register</IC> require it.</P>
    </>),
  },

  quickstart: {
    title: "Quickstart",
    headings: ["Register", "Fund your wallet", "Run your first job"],
    content: (<>
      <P>Zero to a running execution in under five minutes.</P>
      <H2 id="register">1. Register</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@basilgoodluck/runix-sdk";\n\nconst agent = await RunixClient.register({\n  metadataUri: "https://your-metadata-uri.com/agent.json",\n});\n\n// Save agent.apiKey somewhere safe - it is only shown once`}</CodeBlock>
      <H2 id="fund-your-wallet">2. Fund your wallet</H2>
      <P>Send testnet USDC to your <IC>walletAddress</IC> on Arc Testnet using the Arc faucet or Circle Gateway.</P>
      <H2 id="run-your-first-job">3. Run your first job</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey: agent.apiKey });\n\nconst result = await runix.compute({\n  runtime: "node",\n  code: "console.log(21 * 2)",\n});\n\nconsole.log(result.stdout);    // "42"\nconsole.log(result.durationMs); // e.g. 38\nconsole.log(result.costUsd);    // e.g. 0.000003`}</CodeBlock>
      <Callout type="tip">Check <IC>result.status</IC> before reading <IC>result.stdout</IC>. A status of <IC>"failed"</IC> means the code ran but exited non-zero.</Callout>
    </>),
  },

  "sdk-overview": {
    title: "SDK Overview",
    headings: ["Client setup", "Response shape", "Error handling"],
    content: (<>
      <P><IC>RunixClient</IC> is the single entry point for all SDK operations.</P>
      <H2 id="client-setup">Client setup</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@basilgoodluck/runix-sdk";\n\nconst runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,   // required\n  baseUrl: "https://runix.basilgoodluck.com", // optional\n  timeoutMs: 30_000,                   // optional, default 30000\n});`}</CodeBlock>
      <H2 id="response-shape">Response shape</H2>
      <CodeBlock lang="ts">{`interface ExecutionResult {\n  id: string;\n  type: JobType;\n  status: "pending" | "running" | "done" | "failed" | "timeout";\n  stdout?: string;\n  stderr?: string;\n  exitCode?: number;\n  output?: unknown;\n  error?: string;\n  durationMs: number;\n  costUsd?: number;\n  cached?: boolean;\n  paymentId?: string;\n  receipt?: {\n    id: string;\n    inputHash: string;\n    outputHash: string;\n    signature: string;\n    timestamp: number;\n  };\n  // batch only\n  results?: ExecutionResult[];\n  summary?: {\n    total: number;\n    succeeded: number;\n    failed: number;\n    totalCostUsd: number;\n  };\n}`}</CodeBlock>
      <H2 id="error-handling">Error handling</H2>
      <CodeBlock lang="ts">{`import { RunixClient, RunixError } from "@basilgoodluck/runix-sdk";\n\ntry {\n  const result = await runix.compute({ runtime: "node", code: "..." });\n} catch (err) {\n  if (err instanceof RunixError) {\n    console.log(err.statusCode); // e.g. 401, 429, 500\n    console.log(err.message);   // human-readable error\n  }\n}`}</CodeBlock>
    </>),
  },

  "sdk-compute": {
    title: "runix.compute()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Run arbitrary code in an isolated Docker sandbox. Memory-capped, CPU-capped, no network access, read-only filesystem.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "runtime", type: "Runtime", req: true,  desc: '"python" | "node" | "typescript" | "go" | "rust" | "bash" | "c" | "java" | "ruby" | "php"' },
        { name: "code",    type: "string",  req: true,  desc: "Source code to execute" },
        { name: "stdin",   type: "string",  req: false, desc: "Input piped to stdin" },
        { name: "env",     type: "Record<string,string>", req: false, desc: "Environment variables injected into the sandbox" },
        { name: "timeoutMs", type: "number", req: false, desc: "Max execution time in ms. Default: 10000" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.compute({\n  runtime: "node",\n  code: \`const nums = [1,2,3,4,5];\nconst avg = nums.reduce((a,b)=>a+b)/nums.length;\nconsole.log(avg);\`,\n  timeoutMs: 5000,\n});\n\nconsole.log(result.stdout);   // "3"\nconsole.log(result.durationMs); // e.g. 42\nconsole.log(result.costUsd);    // e.g. 0.000003`}</CodeBlock>
    </>),
  },

  "sdk-action": {
    title: "runix.action()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Call any external HTTP service through Runix. Handles retries on 5xx and timeout enforcement.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "url",       type: "string",  req: true,  desc: "Full URL of the service to call" },
        { name: "method",    type: "HttpMethod", req: false, desc: '"GET" | "POST" | "PUT" | "DELETE" | "PATCH". Default: "GET"' },
        { name: "headers",   type: "Record<string,string>", req: false, desc: "Request headers" },
        { name: "body",      type: "unknown", req: false, desc: "Request body - auto-serialized to JSON" },
        { name: "retries",   type: "number",  req: false, desc: "Retry count on 5xx. Default: 2" },
        { name: "timeoutMs", type: "number",  req: false, desc: "Request timeout in ms. Default: 15000" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.action({\n  url: "https://api.example.com/data",\n  method: "GET",\n  headers: { Authorization: \`Bearer \${token}\` },\n});\n\nconst data = result.output?.data;`}</CodeBlock>
    </>),
  },

  "sdk-data": {
    title: "runix.data()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Fetch and optionally scrape structured content from a URL.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "mode",      type: "string",  req: true,  desc: '"fetch" - retrieve raw content | "scrape" - extract via CSS selector' },
        { name: "url",       type: "string",  req: true,  desc: "URL to fetch or scrape" },
        { name: "selector",  type: "string",  req: false, desc: "CSS selector - required when mode is scrape" },
        { name: "timeoutMs", type: "number",  req: false, desc: "Request timeout in ms" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`// Fetch JSON\nconst result = await runix.data({\n  mode: "fetch",\n  url: "https://api.example.com/market.json",\n});\n\nconst data = result.output?.data;\n\n// Scrape HTML\nconst scraped = await runix.data({\n  mode: "scrape",\n  url: "https://example.com",\n  selector: "h1",\n});`}</CodeBlock>
    </>),
  },

  "sdk-stateful": {
    title: "runix.stateful()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Persist and retrieve key-value state across executions. Useful for agents that need memory between steps. Keys support an optional TTL.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "op",    type: "StatefulOp", req: true,  desc: '"get" | "set" | "delete" | "exists"' },
        { name: "key",   type: "string",     req: true,  desc: "State key to operate on" },
        { name: "value", type: "unknown",    req: false, desc: "Value to store - required for op: set" },
        { name: "ttl",   type: "number",     req: false, desc: "Time to live in seconds - optional for op: set" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`// Store state\nawait runix.stateful({\n  op: "set",\n  key: "agent:progress",\n  value: { step: 3, total: 10 },\n  ttl: 3600,\n});\n\n// Retrieve state\nconst result = await runix.stateful({\n  op: "get",\n  key: "agent:progress",\n});\n\nconsole.log(result.output); // { step: 3, total: 10 }\n\n// Check existence\nconst exists = await runix.stateful({\n  op: "exists",\n  key: "agent:progress",\n});\n\n// Delete\nawait runix.stateful({\n  op: "delete",\n  key: "agent:progress",\n});`}</CodeBlock>
    </>),
  },

  "sdk-batch": {
    title: "runix.batch()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Submit multiple jobs in one call. Jobs run concurrently up to the concurrency limit. Results come back in submission order.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "jobs",        type: "Job[]",  req: true,  desc: "Array of compute, action, data, or stateful payloads - each with a type field" },
        { name: "concurrency", type: "number", req: false, desc: "Max parallel jobs. Default: all at once" },
        { name: "failFast",    type: "boolean", req: false, desc: "Stop all jobs on first failure. Default: false" },
        { name: "timeoutMs",   type: "number", req: false, desc: "Timeout applied to the entire batch" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const batch = await runix.batch({\n  jobs: [\n    { type: "compute", runtime: "node",   code: "console.log(1 + 1)" },\n    { type: "compute", runtime: "python", code: "print(2 + 2)" },\n    { type: "action",  url: "https://api.example.com/ping", method: "GET" },\n  ],\n  concurrency: 3,\n});\n\nconsole.log(batch.results[0].stdout); // "2"\nconsole.log(batch.summary?.totalCostUsd);`}</CodeBlock>
    </>),
  },

  "sdk-stream": {
    title: "runix.stream()",
    headings: ["Chunk shape", "Example"],
    content: (<>
      <P>Stream compute output in real time via Server-Sent Events. Takes the same parameters as <IC>runix.compute()</IC> and returns an async generator of <IC>StreamChunk</IC>.</P>
      <H2 id="chunk-shape">Chunk shape</H2>
      <CodeBlock lang="ts">{`interface StreamChunk {\n  type: "stdout" | "stderr" | "exit" | "error";\n  data: string;\n  timestamp: number;\n}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`for await (const chunk of runix.stream({ runtime: "node", code: "..." })) {\n  if (chunk.type === "stdout") process.stdout.write(chunk.data);\n  if (chunk.type === "stderr") process.stderr.write(chunk.data);\n  if (chunk.type === "exit")   console.log("exited:", chunk.data);\n  if (chunk.type === "error")  console.error("error:", chunk.data);\n}`}</CodeBlock>
    </>),
  },

  "sdk-llm": {
    title: "runix.llm()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Call an LLM provider through Runix. The call is sandboxed, billed, and receipted like every other job type. Supports Gemini, OpenAI, or any custom endpoint.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "prompt",       type: "string",  req: true,  desc: "The user prompt" },
        { name: "systemPrompt", type: "string",  req: false, desc: "System prompt / persona" },
        { name: "provider",     type: "string",  req: false, desc: '"gemini" | "openai" | "custom". Default: "gemini"' },
        { name: "model",        type: "string",  req: false, desc: 'Model name. Default: gemini-2.0-flash / gpt-4o-mini' },
        { name: "endpoint",     type: "string",  req: false, desc: "Required if provider is custom" },
        { name: "apiKey",       type: "string",  req: false, desc: "Overrides env var if provided" },
        { name: "headers",      type: "Record<string,string>", req: false, desc: "Extra request headers" },
        { name: "retries",      type: "number",  req: false, desc: "Retry count on 5xx. Default: 2" },
        { name: "timeoutMs",    type: "number",  req: false, desc: "Max time in ms. Default: 30000" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.llm({\n  prompt: "Summarize this in one sentence: " + content,\n  systemPrompt: "You are a concise summarizer. Plain text only.",\n  provider: "gemini",\n});\n\nconsole.log(result.text);      // ready to use, no parsing needed\nconsole.log(result.costUsd);   // billed like every other job\nconsole.log(result.receipt);   // Ed25519 signed receipt`}</CodeBlock>
    </>),
  },

  "api-register": {
    title: "POST /agents/register",
    headings: ["Request body", "Response", "Example"],
    content: (<>
      <P>Register a new agent. Creates a Circle USDC wallet and registers on-chain via ERC-8004. No API key required.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Badge label="POST" color="purple" />
        <Badge label="Public - no auth required" color="orange" />
      </div>
      <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/agents/register`}</CodeBlock>
      <H2 id="request-body">Request body</H2>
      <ParamTable rows={[
        { name: "metadataUri", type: "string", req: true, desc: "IPFS or HTTPS URI pointing to your agent metadata JSON - stored on-chain" },
      ]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{\n  "agentId": "uuid",\n  "apiKey": "rx_abc123...",\n  "walletAddress": "0xabc...",\n  "onchainAgentId": "0x...",\n  "txHash": "0x...",\n  "metadataUri": "https://...",\n  "createdAt": 1714000000000,\n  "message": "Fund your wallet with USDC on Arc Testnet to start submitting jobs"\n}`}</CodeBlock>
      <Callout type="warning">Store your <IC>apiKey</IC> immediately - it is only returned once and cannot be recovered.</Callout>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/agents/register \\\n  -H "Content-Type: application/json" \\\n  -d '{ "metadataUri": "https://your-metadata-uri.com/agent.json" }'`}</CodeBlock>
    </>),
  },

  "api-execute": {
    title: "POST /execute",
    headings: ["Request body", "Job types", "Response", "Example"],
    content: (<>
      <P>Submit a single execution job. Routes to the correct worker, runs in an isolated Docker sandbox, returns a signed result synchronously.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Badge label="POST" color="purple" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/execute\nAuthorization: Bearer <your-api-key>`}</CodeBlock>
      <H2 id="request-body">Request body</H2>
      <ParamTable rows={[
        { name: "type",       type: "string",  req: true,  desc: '"compute" | "action" | "data" | "stateful" | "batch" | "file" | "llm"' },
        { name: "runtime",    type: "Runtime", req: false, desc: 'Required for compute and file. "python" | "node" | "typescript" | "go" | "rust" | "bash" | "c" | "java" | "ruby" | "php"' },
        { name: "code",       type: "string",  req: false, desc: "Required for compute and file" },
        { name: "url",        type: "string",  req: false, desc: "Required for action and data" },
        { name: "prompt",     type: "string",  req: false, desc: "Required for llm" },
        { name: "op",         type: "string",  req: false, desc: 'Required for stateful. "get" | "set" | "delete" | "exists"' },
        { name: "key",        type: "string",  req: false, desc: "Required for stateful" },
        { name: "timeoutMs",  type: "number",  req: false, desc: "Max execution time in ms. Default: 10000" },
      ]} />
      <H2 id="job-types">Job types</H2>
      <UL items={[
        "compute - run code in a sandboxed runtime",
        "action - call an external HTTP service",
        "data - fetch or scrape a URL",
        "stateful - get/set/delete persistent key-value state",
        "batch - multiple jobs in one request, run concurrently",
        "file - code execution with virtual filesystem inputs",
        "llm - call an LLM provider (Gemini, OpenAI, or custom endpoint)",
      ]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{\n  "id": "exec_9f3a1c",\n  "type": "compute",\n  "status": "done",\n  "stdout": "42",\n  "stderr": "",\n  "exitCode": 0,\n  "durationMs": 38,\n  "costUsd": 0.000003,\n  "cached": false,\n  "paymentId": "pay_abc...",\n  "receipt": {\n    "id": "rcpt_abc",\n    "inputHash": "sha256:...",\n    "outputHash": "sha256:...",\n    "signature": "ed25519:...",\n    "timestamp": 1714000000\n  }\n}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "node", "code": "console.log(21 * 2)" }'`}</CodeBlock>
    </>),
  },

  "api-stream": {
    title: "POST /execute/stream",
    headings: ["SSE chunk format", "Example"],
    content: (<>
      <P>Stream compute output via Server-Sent Events. Only supports <IC>type: "compute"</IC>.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Badge label="POST" color="purple" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/execute/stream\nAuthorization: Bearer <your-api-key>`}</CodeBlock>
      <H2 id="sse-chunk-format">SSE chunk format</H2>
      <CodeBlock lang="text">{`data: {"type":"stdout","data":"hello\\n","timestamp":1714000000}\n\ndata: {"type":"stderr","data":"","timestamp":1714000001}\n\ndata: {"type":"exit","data":"0","timestamp":1714000002}`}</CodeBlock>
      <Callout type="info">Chunks are <IC>StreamChunk</IC> objects with <IC>type</IC>, <IC>data</IC>, and <IC>timestamp</IC> fields. The stream ends on <IC>exit</IC> or <IC>error</IC>.</Callout>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute/stream \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Accept: text/event-stream" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "node", "code": "for(let i=0;i<5;i++) console.log(i)" }'`}</CodeBlock>
    </>),
  },

  "api-balance": {
    title: "GET /billing/balance",
    headings: ["Response", "Example"],
    content: (<>
      <P>Returns the current USDC balance of your Circle wallet on Arc Testnet.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Badge label="GET" color="green" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`GET https://runix.basilgoodluck.com/api/billing/balance`}</CodeBlock>
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{\n  "agentId": "uuid",\n  "walletAddress": "0xabc...",\n  "balance": "4.820000"\n}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl https://runix.basilgoodluck.com/api/billing/balance \\\n  -H "Authorization: Bearer $RUNIX_API_KEY"`}</CodeBlock>
    </>),
  },

  "api-errors": {
    title: "Errors",
    headings: ["Error shape", "Status codes"],
    content: (<>
      <P>All errors return a consistent JSON shape. The SDK wraps these as <IC>RunixError</IC> instances with a <IC>statusCode</IC> and <IC>message</IC>.</P>
      <H2 id="error-shape">Error shape</H2>
      <CodeBlock lang="json">{`{\n  "error": {\n    "code": "insufficient_balance",\n    "message": "Agent wallet has insufficient USDC.",\n    "param": null\n  }\n}`}</CodeBlock>
      <H2 id="status-codes">Status codes</H2>
      <div style={{ overflowX: "auto", margin: "18px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Code", "Meaning"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["400", "Bad request - missing or invalid parameters"],
              ["401", "Unauthorized - missing or invalid API key"],
              ["403", "Forbidden - key lacks required scope"],
              ["408", "Execution timed out"],
              ["429", "Rate limit exceeded"],
              ["500", "Internal server error"],
            ].map(([code, msg]) => (
              <tr key={code} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "11px 14px 11px 0" }}><IC>{code}</IC></td>
                <td style={{ padding: "11px 0", fontSize: "clamp(13px, 1.8vw, 15px)", color: C.text }}>{msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">A 200 OK with <IC>status: "failed"</IC> means the code ran but exited non-zero - different from a 4xx/5xx HTTP error.</Callout>
    </>),
  },

  "guide-agents": {
    title: "Agent Integration",
    headings: ["Decision loop pattern", "Best practices"],
    content: (<>
      <P>Runix sits inside an agent's decision loop - called whenever the agent needs to act on the world rather than reason about it.</P>
      <H2 id="decision-loop-pattern">Decision loop pattern</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey: process.env.RUNIX_API_KEY });\n\nasync function agentLoop(task: string) {\n  while (true) {\n    // LLM decides next action\n    const action = await llm.decide(task);\n    if (action.type === "done") break;\n\n    // Runix executes it\n    const result = await runix.compute({\n      runtime: action.runtime,\n      code: action.code,\n      timeoutMs: 15_000,\n    });\n\n    if (result.status === "failed") {\n      task = \`Previous step failed: \${result.stderr}. Retry.\`;\n      continue;\n    }\n\n    task = incorporateResult(task, result.stdout);\n  }\n}`}</CodeBlock>
      <H2 id="best-practices">Best practices</H2>
      <UL items={[
        "Store result.id - you can look up any past execution for auditing",
        "Set timeoutMs explicitly in production - don't rely on the default",
        "Use runix.batch() when your agent needs multiple independent results at once",
        "Check result.cached - repeated identical calls return instantly at no cost",
        "Monitor result.costUsd per step to track spend in real time",
        "Use runix.llm() for LLM calls so they are billed and receipted like all other jobs",
      ]} />
    </>),
  },

  "guide-sandbox": {
    title: "Sandbox & Security",
    headings: ["Docker isolation", "What code cannot do"],
    content: (<>
      <P>Every compute, file, and llm job runs inside a Docker container with strict isolation, with a pre-warmed pool per language runtime.</P>
      <H2 id="docker-isolation">Docker isolation</H2>
      <UL items={[
        "Read-only root filesystem",
        "No network access from inside the container",
        "All Linux capabilities dropped",
        "PidsLimit enforced to prevent fork bombs",
        "Containers discarded after each job - no state leaks",
        "Memory and CPU caps enforced by Docker cgroup",
      ]} />
      <Callout type="info">Container pools replenish automatically after each job. Under high concurrency, jobs queue in BullMQ until a container is available.</Callout>
      <H2 id="what-code-cannot-do">What code cannot do</H2>
      <UL items={[
        "Make outbound network requests - use runix.action() instead",
        "Access the host filesystem",
        "Spawn privileged processes",
        "Persist data between separate compute jobs - use runix.stateful() for persistence",
      ]} />
    </>),
  },

  "guide-billing": {
    title: "Billing & USDC",
    headings: ["How billing works", "Pricing", "Funding your wallet"],
    content: (<>
      <P>Runix charges per execution in USDC on Arc Testnet. Payment deducts from your Circle-managed wallet immediately after each successful job.</P>
      <H2 id="how-billing-works">How billing works</H2>
      <OL items={[
        "Your wallet holds a USDC balance on Arc Testnet",
        "After each execution, Runix calculates cost based on job type",
        "A Circle SDK transfer deducts from your wallet to the Runix system wallet",
        "The amount appears in result.costUsd and in your billing history",
      ]} />
      <Callout type="info">Payment failures are currently silent - jobs succeed even if the deduction fails. This changes before mainnet.</Callout>
      <H2 id="pricing">Pricing</H2>
      <div style={{ overflowX: "auto", margin: "18px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Job type", "Cost"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["compute",  "$0.000003 per execution"],
              ["action",   "$0.000001 per execution"],
              ["data",     "$0.000001 per execution"],
              ["stateful", "$0.000001 per operation"],
              ["batch",    "Sum of individual job costs"],
              ["file",     "$0.000003 per execution"],
              ["llm",      "$0.000010 per call"],
            ].map(([type, cost]) => (
              <tr key={type} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "11px 14px 11px 0" }}><IC>{type}</IC></td>
                <td style={{ padding: "11px 0", fontSize: "clamp(13px, 1.8vw, 15px)", color: C.text }}>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H2 id="funding-your-wallet">Funding your wallet</H2>
      <P>Send testnet USDC to your <IC>walletAddress</IC> on Arc Testnet. Use the Arc Testnet faucet or bridge via Circle Gateway from another supported chain.</P>
    </>),
  },
};

// ---------- Main component ----------
export default function DocsPage() {
  const [active, setActive] = useState("introduction");
  const [activeHeading, setActiveHeading] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const section = SECTIONS[active];

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setActiveHeading(section.headings[0] ? toId(section.headings[0]) : "");
  }, [active]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const headingEls = Array.from(el.querySelectorAll("h2[id]")) as HTMLElement[];
    if (!headingEls.length) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveHeading((visible[0].target as HTMLElement).id);
      },
      { root: el, rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );
    headingEls.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [active]);

  const toId = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const scrollToHeading = (h: string) => contentRef.current?.querySelector(`#${toId(h)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const go = (id: string) => { setActive(id); setMobileNavOpen(false); };

  const all = NAV.flatMap(g => g.items);
  const idx = all.findIndex(i => i.id === active);
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const group = NAV.find(g => g.items.some(i => i.id === active))?.group;

  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: "block", width: "100%", textAlign: "left",
    padding: "7px 10px", borderRadius: 8, fontSize: 13.5,
    fontFamily: "inherit", fontWeight: isActive ? 600 : 400,
    color: isActive ? C.white : C.textMuted,
    background: isActive ? C.purpleFaint : "transparent",
    border: isActive ? `1px solid ${C.purpleBorder}` : "1px solid transparent",
    cursor: "pointer", transition: "all 0.15s",
  });

  const paginationBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
    borderRadius: 10, cursor: "pointer", padding: "14px 18px",
    transition: "all 0.15s", fontFamily: "inherit", flex: 1, maxWidth: 240,
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        .docs-sidebar-l { display: flex !important; }
        .docs-sidebar-r { display: flex !important; }
        .docs-mob-bar   { display: none !important; }
        @media (max-width: 768px) {
          .docs-sidebar-l { display: none !important; }
          .docs-sidebar-r { display: none !important; }
          .docs-mob-bar   { display: flex !important; }
          .docs-content   { padding: 24px 16px 60px !important; }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .docs-sidebar-r { display: none !important; }
        }
      `}</style>

      <div style={{
        maxWidth: 1360, margin: "0 auto", width: "100%",
        display: "flex", gap: 10,
        padding: "80px 16px 60px",
        minHeight: "100vh",
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
        color: C.white,
      }}>

        {/* LEFT SIDEBAR */}
        <aside className="docs-sidebar-l" style={{
          width: 210, minWidth: 210, flexShrink: 0,
          flexDirection: "column",
          background: "#0f0f11",
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 14, padding: "20px 10px",
          overflowY: "auto", alignSelf: "flex-start",
          position: "sticky", top: 88,
          maxHeight: "calc(100vh - 108px)",
        }}>
          {NAV.map(g => (
            <div key={g.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, padding: "0 10px", marginBottom: 4 }}>{g.group}</div>
              {g.items.map(item => {
                const isActive = active === item.id;
                return (
                  <button key={item.id} onClick={() => go(item.id)} style={navItemStyle(isActive)}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; } }}
                  >{item.label}</button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* MOBILE NAV OVERLAY */}
        {mobileNavOpen && (
          <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 60, overflowY: "auto", padding: "20px 20px 40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: C.white }}>Runix Docs</span>
              <button onClick={() => setMobileNavOpen(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>x</button>
            </div>
            {NAV.map(g => (
              <div key={g.group} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, padding: "0 10px", marginBottom: 6 }}>{g.group}</div>
                {g.items.map(item => {
                  const isActive = active === item.id;
                  return (
                    <button key={item.id} onClick={() => go(item.id)} style={{ ...navItemStyle(isActive), fontSize: 15, padding: "10px 12px" }}>{item.label}</button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* CENTER CONTENT */}
        <main ref={contentRef} className="docs-content" style={{
          flex: 1, overflowY: "auto",
          background: "#0f0f11",
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 14, padding: "36px 40px 72px",
        }}>
          <div className="docs-mob-bar" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>{group} {'>'} {section.title}</span>
            <button onClick={() => setMobileNavOpen(true)} style={{ background: C.purpleFaint, border: `1px solid ${C.purpleBorder}`, borderRadius: 7, color: "rgba(167,139,250,0.9)", fontSize: 13, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Menu
            </button>
          </div>

          <div style={{ maxWidth: 740, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, letterSpacing: "0.04em", fontWeight: 500 }}>{group} {'>'} {section.title}</div>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: C.white, lineHeight: 1.1, marginBottom: 18 }}>{section.title}</h1>
            <div style={{ height: 1, background: C.border, margin: "20px 0 30px" }} />
            {section.content}

            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 64, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
              {prev ? (
                <button onClick={() => go(prev.id)} style={paginationBtn}
                  onMouseEnter={e => { e.currentTarget.style.background = C.purpleFaint; e.currentTarget.style.borderColor = C.purpleBorder; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = C.border; }}>
                  <FiChevronLeft size={16} color={C.purpleLight} style={{ flexShrink: 0 }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>Previous</div>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{prev.label}</div>
                  </div>
                </button>
              ) : <span />}
              {next ? (
                <button onClick={() => go(next.id)} style={{ ...paginationBtn, justifyContent: "flex-end" }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.purpleFaint; e.currentTarget.style.borderColor = C.purpleBorder; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = C.border; }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>Next</div>
                    <div style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{next.label}</div>
                  </div>
                  <FiChevronRight size={16} color={C.purpleLight} style={{ flexShrink: 0 }} />
                </button>
              ) : <span />}
            </div>
          </div>
        </main>

        {/* RIGHT TOC */}
        <aside className="docs-sidebar-r" style={{
          width: 165, minWidth: 165, flexShrink: 0,
          flexDirection: "column",
          background: "#0f0f11",
          border: `1px solid rgba(255,255,255,0.06)`,
          borderRadius: 14, padding: "24px 14px",
          alignSelf: "flex-start", position: "sticky", top: 88,
          maxHeight: "calc(100vh - 108px)", overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, marginBottom: 14, paddingLeft: 2 }}>On this page</div>
          {section.headings.map(h => {
            const id = toId(h);
            const isActive = activeHeading === id;
            return (
              <button key={h} onClick={() => scrollToHeading(h)} style={{
                display: "block", width: "100%", textAlign: "left",
                fontSize: 13, lineHeight: 1.5, fontFamily: "inherit",
                color: isActive ? C.white : C.textMuted,
                padding: "6px 2px 6px 12px", background: "none", border: "none",
                borderLeft: isActive ? `2px solid ${C.purple}` : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s", borderRadius: "0 6px 6px 0",
              }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.borderLeft = "2px solid rgba(124,58,237,0.35)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderLeft = "2px solid transparent"; } }}
              >{h}</button>
            );
          })}
        </aside>
      </div>
    </>
  );
}