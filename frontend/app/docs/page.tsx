"use client";

import { useEffect, useRef, useState } from "react";

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
  bg: "#09090b",
  surface: "#111113",
  border: "rgba(255,255,255,0.08)",
  text: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)",
  textDim: "rgba(255,255,255,0.2)",
  white: "#fff",
  codeBg: "#0f1011",
  codeBar: "#161719",
};

function CodeBlock({ children, lang }: { children: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin: "20px 0", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.codeBar, padding: "8px 16px" }}>
        <span style={{ fontSize: 11, fontFamily: "monospace", color: C.textMuted, letterSpacing: "0.04em" }}>{lang}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ fontSize: 11, fontFamily: "monospace", color: copied ? "#86efac" : C.textMuted, background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
        >{copied ? "copied ✓" : "copy"}</button>
      </div>
      <pre style={{ margin: 0, padding: "20px", background: C.codeBg, overflowX: "auto" }}>
        <code style={{ fontSize: 13.5, lineHeight: 1.75, color: "rgba(255,255,255,0.68)", fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>{children}</code>
      </pre>
    </div>
  );
}

function Callout({ children, type }: { children: React.ReactNode; type: "info" | "tip" | "warning" }) {
  const map = {
    info:    { border: "rgba(99,102,241,0.5)",  bg: "rgba(99,102,241,0.07)",  label: "Note",    color: "#a5b4fc" },
    tip:     { border: "rgba(16,185,129,0.5)",  bg: "rgba(16,185,129,0.07)",  label: "Tip",     color: "#6ee7b7" },
    warning: { border: "rgba(245,158,11,0.5)",  bg: "rgba(245,158,11,0.07)",  label: "Warning", color: "#fcd34d" },
  }[type];
  return (
    <div style={{ borderLeft: `3px solid ${map.border}`, background: map.bg, borderRadius: "0 8px 8px 0", padding: "14px 18px", margin: "20px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: map.color, marginBottom: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>{map.label}</div>
      <div style={{ fontSize: 15, color: C.text, lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return <code style={{ fontSize: 13, fontFamily: "monospace", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.82)", padding: "2px 6px", borderRadius: 4 }}>{children}</code>;
}

function Badge({ label, color }: { label: string; color: "blue" | "green" | "orange" | "red" }) {
  const map = {
    blue:   { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc" },
    green:  { bg: "rgba(16,185,129,0.12)", color: "#6ee7b7" },
    orange: { bg: "rgba(245,158,11,0.12)", color: "#fcd34d" },
    red:    { bg: "rgba(239,68,68,0.12)",  color: "#fca5a5" },
  }[color];
  return <span style={{ display: "inline-block", fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: map.bg, color: map.color, padding: "3px 10px", borderRadius: 5 }}>{label}</span>;
}

function ParamRow({ name, type, req, desc }: { name: string; type: string; req: boolean; desc: string }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "12px 14px 12px 0", verticalAlign: "top" }}><InlineCode>{name}</InlineCode></td>
      <td style={{ padding: "12px 14px 12px 0", verticalAlign: "top", fontSize: 13, fontFamily: "monospace", color: "#c4b5fd" }}>{type}</td>
      <td style={{ padding: "12px 14px 12px 0", verticalAlign: "top", fontSize: 13, color: req ? "#4ade80" : C.textDim }}>{req ? "Yes" : "No"}</td>
      <td style={{ padding: "12px 0", verticalAlign: "top", fontSize: 15, color: C.text, lineHeight: 1.7 }}>{desc}</td>
    </tr>
  );
}

function H2({ id, children }: { id: string; children: string }) {
  return <h2 id={id} style={{ fontSize: 17, fontWeight: 700, color: C.white, margin: "44px 0 14px", scrollMarginTop: 80 }}>{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 16, color: C.text, lineHeight: 1.85, marginBottom: 16 }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 22, marginBottom: 18 }}>
      {items.map(s => <li key={s} style={{ fontSize: 16, color: C.text, lineHeight: 1.85, marginBottom: 6 }}>{s}</li>)}
    </ul>
  );
}

function OL({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: 22, marginBottom: 18 }}>
      {items.map(s => <li key={s} style={{ fontSize: 16, color: C.text, lineHeight: 1.85, marginBottom: 8 }}>{s}</li>)}
    </ol>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; req: boolean; desc: string }[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "20px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Parameter", "Type", "Required", "Description"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => <ParamRow key={r.name} {...r} />)}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

const SECTIONS: Record<string, { title: string; headings: string[]; content: React.ReactNode }> = {
  introduction: {
    title: "Introduction",
    headings: ["What is Runix?", "How it works", "When to use it"],
    content: (<>
      <P>Runix is a machine-to-machine execution engine. Agents register an identity on the Arc blockchain, receive a Circle-managed USDC wallet, and submit jobs over HTTP — paying per execution in USDC with no subscriptions and no pre-provisioned infrastructure.</P>
      <P>Think of it as AWS Lambda without the deployment step, with crypto-native payments and on-chain agent identity built in.</P>
      <H2 id="how-it-works">How it works</H2>
      <OL items={[
        "Register — call POST /api/agents/register. Runix creates a Circle wallet and registers your agent on Arc via ERC-8004. You get an API key and wallet address.",
        "Fund — deposit USDC to your agent wallet on Arc Testnet.",
        "Execute — submit jobs via SDK or HTTP. Runix sandboxes, runs, and returns a signed result.",
        "Pay — USDC is deducted from your wallet per execution.",
      ]} />
      <Callout type="info">Execution receipts are Ed25519-signed with SHA-256 hashed inputs and outputs — every result is cryptographically auditable.</Callout>
      <H2 id="when-to-use-it">When to use it</H2>
      <UL items={[
        "Autonomous AI agents that need to run code or call APIs inside a decision loop",
        "Event-driven systems with bursty, unpredictable compute needs",
        "Machine-to-machine value exchange without human billing",
        "On-chain agent identity and reputation with verifiable execution history",
      ]} />
    </>),
  },

  installation: {
    title: "Installation",
    headings: ["npm", "Requirements"],
    content: (<>
      <P>The Runix SDK wraps all HTTP endpoints and handles auth, streaming, and error handling.</P>
      <H2 id="npm">npm</H2>
      <CodeBlock lang="bash">{`npm install @runix/sdk
# or
yarn add @runix/sdk`}</CodeBlock>
      <Callout type="tip">Full TypeScript types included. No extra @types package needed. ESM and CJS both supported.</Callout>
      <H2 id="requirements">Requirements</H2>
      <UL items={["Node.js 18+", "A Runix API key — see Authentication", "USDC on Arc Testnet in your agent wallet"]} />
    </>),
  },

  authentication: {
    title: "Authentication",
    headings: ["Register your agent", "Using your key"],
    content: (<>
      <P>Runix uses API keys tied to on-chain agent identities. Registration is once — it creates your API key and Circle wallet at the same time.</P>
      <H2 id="register-your-agent">Register your agent</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";

const { apiKey, walletAddress, agentId } = await RunixClient.register({
  name: "my-agent",
});

// Store apiKey securely — shown only once
console.log(apiKey);        // rk_live_...
console.log(walletAddress); // 0x...`}</CodeBlock>
      <Callout type="warning">Never commit your API key to source control. Use environment variables.</Callout>
      <H2 id="using-your-key">Using your key</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({
  apiKey: process.env.RUNIX_API_KEY,
});`}</CodeBlock>
      <P>The key is sent as a Bearer token on every request. All endpoints except <InlineCode>/agents/register</InlineCode> require it.</P>
    </>),
  },

  quickstart: {
    title: "Quickstart",
    headings: ["Register", "Fund your wallet", "Run your first job"],
    content: (<>
      <P>Zero to a running execution in under five minutes.</P>
      <H2 id="register">1. Register</H2>
      <CodeBlock lang="ts">{`const { apiKey, walletAddress } = await RunixClient.register({
  name: "quickstart-agent",
});`}</CodeBlock>
      <H2 id="fund-your-wallet">2. Fund your wallet</H2>
      <P>Send testnet USDC to your <InlineCode>walletAddress</InlineCode> on Arc Testnet using the Arc faucet or Circle Gateway.</P>
      <H2 id="run-your-first-job">3. Run your first job</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey });

const result = await runix.compute({
  runtime: "python",
  code: "print(21 * 2)",
});

console.log(result.stdout);      // "42"
console.log(result.duration_ms); // e.g. 38
console.log(result.cost_usd);    // e.g. 0.000003`}</CodeBlock>
      <Callout type="tip">Check result.status before reading result.stdout. "error" means the code ran but exited non-zero — check result.stderr for the traceback.</Callout>
    </>),
  },

  "sdk-overview": {
    title: "SDK Overview",
    headings: ["Client setup", "Response shape", "Error handling"],
    content: (<>
      <P><InlineCode>RunixClient</InlineCode> is the single entry point for all SDK operations.</P>
      <H2 id="client-setup">Client setup</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";

const runix = new RunixClient({
  apiKey: process.env.RUNIX_API_KEY,
  baseUrl: "https://api.runix.dev", // optional
  timeout: 30_000,                   // optional, ms
});`}</CodeBlock>
      <H2 id="response-shape">Response shape</H2>
      <CodeBlock lang="ts">{`interface ExecutionResult {
  id: string;
  status: "done" | "error" | "timeout" | "cached";
  stdout: string;
  stderr: string;
  duration_ms: number;
  cost_usd: number;
  session_id: string | null;
  cached: boolean;
  receipt: {
    id: string;
    input_hash: string;
    output_hash: string;
    signature: string;  // Ed25519
    timestamp: number;
  };
}`}</CodeBlock>
      <H2 id="error-handling">Error handling</H2>
      <CodeBlock lang="ts">{`import { RunixError } from "@runix/sdk";

try {
  const result = await runix.compute({ runtime: "python", code: "..." });
} catch (err) {
  if (err instanceof RunixError) {
    console.log(err.code);    // e.g. "insufficient_balance"
    console.log(err.status);  // HTTP status code
  }
}`}</CodeBlock>
    </>),
  },

  "sdk-compute": {
    title: "runix.compute()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Run arbitrary code in an isolated Docker sandbox. Memory-capped, CPU-capped, no network access, read-only filesystem.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "runtime", type: "Runtime", req: true,  desc: '"python" | "node" | "go"' },
        { name: "code",    type: "string",  req: true,  desc: "Source code to execute" },
        { name: "stdin",   type: "string",  req: false, desc: "Input piped to stdin" },
        { name: "timeout_ms", type: "number", req: false, desc: "Max execution time. Default: 10000" },
        { name: "env",     type: "Record<string,string>", req: false, desc: "Environment variables injected into the sandbox" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.compute({
  runtime: "node",
  code: \`
const nums = [1, 2, 3, 4, 5];
const avg = nums.reduce((a, b) => a + b) / nums.length;
console.log(avg);
\`,
  timeout_ms: 5000,
});

console.log(result.stdout); // "3"`}</CodeBlock>
    </>),
  },

  "sdk-action": {
    title: "runix.action()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Call any external HTTP service through Runix. Handles retries on 5xx and timeout enforcement.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "url",     type: "string",  req: true,  desc: "Full URL of the service to call" },
        { name: "method",  type: "string",  req: false, desc: '"GET" | "POST" | "PUT" | "DELETE". Default: "GET"' },
        { name: "headers", type: "Record<string,string>", req: false, desc: "Request headers" },
        { name: "body",    type: "unknown", req: false, desc: "Request body — auto-serialized to JSON" },
        { name: "retries", type: "number",  req: false, desc: "Retry count on 5xx. Default: 2" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.action({
  url: "https://api.example.com/data",
  method: "GET",
  headers: { Authorization: \`Bearer \${token}\` },
});

const data = JSON.parse(result.stdout);`}</CodeBlock>
    </>),
  },

  "sdk-data": {
    title: "runix.data()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Fetch and parse structured data sources. Results come back ready to use.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "source", type: "string", req: true,  desc: "URL or data source identifier" },
        { name: "format", type: "string", req: false, desc: '"json" | "csv" | "xml" — auto-detected if omitted' },
        { name: "query",  type: "string", req: false, desc: "JSONPath filter applied to the result" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.data({
  source: "https://data.example.com/market.json",
  format: "json",
  query: "$.assets[?(@.symbol == 'USDC')]",
});

const asset = JSON.parse(result.stdout);`}</CodeBlock>
    </>),
  },

  "sdk-stateful": {
    title: "runix.stateful()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Execute code with persistent session state across multiple steps. Variables survive between calls within the same session. Sessions expire after 30 minutes of inactivity.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "runtime",    type: "Runtime", req: true,  desc: '"python" | "node" | "go"' },
        { name: "code",       type: "string",  req: true,  desc: "Code to run in this step" },
        { name: "session_id", type: "string",  req: false, desc: "Continue an existing session. Omit to start a new one." },
        { name: "timeout_ms", type: "number",  req: false, desc: "Step timeout. Default: 10000" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const step1 = await runix.stateful({
  runtime: "python",
  code: "total = 0",
});

const step2 = await runix.stateful({
  session_id: step1.session_id!,
  runtime: "python",
  code: "total += 42\nprint(total)",
});

console.log(step2.stdout); // "42"`}</CodeBlock>
    </>),
  },

  "sdk-batch": {
    title: "runix.batch()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Submit multiple jobs in one call. Jobs run concurrently up to the concurrency limit. Results come back in submission order.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[
        { name: "jobs",        type: "Job[]",  req: true,  desc: "Array of compute, action, or data payloads" },
        { name: "concurrency", type: "number", req: false, desc: "Max parallel jobs. Default: all at once" },
      ]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const batch = await runix.batch({
  jobs: [
    { type: "compute", runtime: "python", code: "print(1 + 1)" },
    { type: "compute", runtime: "node",   code: "console.log(2 + 2)" },
  ],
  concurrency: 2,
});

console.log(batch.results[0].stdout); // "2"
console.log(batch.total_cost_usd);`}</CodeBlock>
    </>),
  },

  "sdk-stream": {
    title: "runix.stream()",
    headings: ["Event shape", "Example"],
    content: (<>
      <P>Stream compute output in real time via Server-Sent Events. Only supports compute jobs. Same parameters as <InlineCode>runix.compute()</InlineCode>.</P>
      <H2 id="event-shape">Event shape</H2>
      <CodeBlock lang="ts">{`type StreamEvent =
  | { type: "stdout";  data: string }
  | { type: "stderr";  data: string }
  | { type: "done";    id: string; duration_ms: number; cost_usd: number }
  | { type: "error";   message: string };`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`for await (const event of runix.stream({ runtime: "python", code: "..." })) {
  if (event.type === "stdout") process.stdout.write(event.data);
  if (event.type === "done")   console.log("cost:", event.cost_usd);
}`}</CodeBlock>
    </>),
  },

  "api-register": {
    title: "POST /agents/register",
    headings: ["Request body", "Response", "Example"],
    content: (<>
      <P>Register a new agent. Creates a Circle USDC wallet and registers on-chain via ERC-8004. No API key required.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Badge label="POST" color="blue" />
        <Badge label="Public — no auth required" color="orange" />
      </div>
      <CodeBlock lang="bash">{`POST https://api.runix.dev/api/agents/register`}</CodeBlock>
      <H2 id="request-body">Request body</H2>
      <ParamTable rows={[
        { name: "name",         type: "string", req: true,  desc: "Human-readable agent name — stored on-chain" },
        { name: "metadata_uri", type: "string", req: false, desc: "IPFS URI pointing to agent metadata JSON" },
      ]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{
  "api_key": "rk_live_abc123...",
  "wallet_address": "0xabc...",
  "agent_id": "0x...",
  "registration_tx": "0x..."
}`}</CodeBlock>
      <Callout type="warning">Store your api_key immediately — it is only returned once.</Callout>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://api.runix.dev/api/agents/register \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "my-agent" }'`}</CodeBlock>
    </>),
  },

  "api-execute": {
    title: "POST /execute",
    headings: ["Request body", "Job types", "Response", "Example"],
    content: (<>
      <P>Submit a single execution job. Routes to the correct worker, runs in an isolated Docker sandbox, returns a signed result synchronously.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Badge label="POST" color="blue" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`POST https://api.runix.dev/api/execute
Authorization: Bearer <your-api-key>`}</CodeBlock>
      <H2 id="request-body">Request body</H2>
      <ParamTable rows={[
        { name: "type",       type: "string", req: true,  desc: '"compute" | "action" | "data" | "stateful" | "batch" | "file"' },
        { name: "runtime",    type: "string", req: false, desc: 'Required for compute, stateful, file. "python" | "node" | "go"' },
        { name: "code",       type: "string", req: false, desc: "Required for compute, stateful, file" },
        { name: "url",        type: "string", req: false, desc: "Required for action" },
        { name: "session_id", type: "string", req: false, desc: "Continue a stateful session" },
        { name: "timeout_ms", type: "number", req: false, desc: "Max execution time in ms. Default: 10000" },
      ]} />
      <H2 id="job-types">Job types</H2>
      <UL items={[
        "compute — run code in a sandboxed runtime",
        "action — call an external HTTP service",
        "data — fetch and parse a structured source",
        "stateful — code execution with persistent session",
        "batch — multiple jobs in one request",
        "file — code execution with virtual filesystem inputs",
      ]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{
  "id": "exec_9f3a1c",
  "status": "done",
  "stdout": "42",
  "stderr": "",
  "duration_ms": 38,
  "cost_usd": 0.000003,
  "session_id": null,
  "cached": false,
  "receipt": {
    "id": "rcpt_abc",
    "input_hash": "sha256:...",
    "output_hash": "sha256:...",
    "signature": "ed25519:...",
    "timestamp": 1714000000
  }
}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://api.runix.dev/api/execute \\
  -H "Authorization: Bearer $RUNIX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "type": "compute", "runtime": "python", "code": "print(21 * 2)" }'`}</CodeBlock>
    </>),
  },

  "api-stream": {
    title: "POST /execute/stream",
    headings: ["SSE event format", "Example"],
    content: (<>
      <P>Stream compute output via Server-Sent Events. Only supports <InlineCode>type: "compute"</InlineCode>.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Badge label="POST" color="blue" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`POST https://api.runix.dev/api/execute/stream
Authorization: Bearer <your-api-key>`}</CodeBlock>
      <H2 id="sse-event-format">SSE event format</H2>
      <CodeBlock lang="text">{`event: stdout
data: Step 1

event: done
data: {"id":"exec_abc","duration_ms":1240,"cost_usd":0.000003}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://api.runix.dev/api/execute/stream \\
  -H "Authorization: Bearer $RUNIX_API_KEY" \\
  -H "Accept: text/event-stream" \\
  -H "Content-Type: application/json" \\
  -d '{ "type": "compute", "runtime": "python", "code": "for i in range(5): print(i)" }'`}</CodeBlock>
    </>),
  },

  "api-balance": {
    title: "GET /billing/balance",
    headings: ["Response", "Example"],
    content: (<>
      <P>Returns the current USDC balance of your agent's Circle wallet on Arc Testnet.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Badge label="GET" color="green" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`GET https://api.runix.dev/api/billing/balance`}</CodeBlock>
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{
  "balance_usd": "4.820000",
  "wallet_address": "0xabc...",
  "currency": "USDC",
  "chain": "arc-testnet"
}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl https://api.runix.dev/api/billing/balance \\
  -H "Authorization: Bearer $RUNIX_API_KEY"`}</CodeBlock>
    </>),
  },

  "api-errors": {
    title: "Errors",
    headings: ["Error shape", "Status codes"],
    content: (<>
      <P>All errors return a consistent JSON shape. The SDK wraps these as <InlineCode>RunixError</InlineCode> instances.</P>
      <H2 id="error-shape">Error shape</H2>
      <CodeBlock lang="json">{`{
  "error": {
    "code": "insufficient_balance",
    "message": "Agent wallet has insufficient USDC.",
    "param": null
  }
}`}</CodeBlock>
      <H2 id="status-codes">Status codes</H2>
      <div style={{ overflowX: "auto", margin: "20px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Code</th>
              <th style={{ textAlign: "left", padding: "10px 0", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Meaning</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["400", "Bad request — missing or invalid parameters"],
              ["401", "Unauthorized — missing or invalid API key"],
              ["403", "Forbidden — key lacks required scope"],
              ["408", "Execution timed out"],
              ["429", "Rate limit exceeded"],
              ["500", "Internal server error"],
            ].map(([code, desc]) => (
              <tr key={code} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 14px 12px 0" }}><InlineCode>{code}</InlineCode></td>
                <td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">A 200 OK with status: "error" means the code ran but exited non-zero. This is different from a 4xx/5xx where the request itself failed.</Callout>
    </>),
  },

  "guide-agents": {
    title: "Agent Integration",
    headings: ["Decision loop pattern", "Best practices"],
    content: (<>
      <P>Runix sits inside an agent's decision loop — called whenever the agent needs to act on the world rather than reason about it.</P>
      <H2 id="decision-loop-pattern">Decision loop pattern</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey: process.env.RUNIX_API_KEY });

async function agentLoop(task: string) {
  while (true) {
    const action = await llm.decide(task);
    if (action.type === "done") break;

    const result = await runix.compute({
      runtime: action.runtime,
      code: action.code,
      timeout_ms: 15_000,
    });

    if (result.status === "error") {
      task = \`Previous step failed: \${result.stderr}. Retry.\`;
      continue;
    }

    task = incorporateResult(task, result.stdout);
  }
}`}</CodeBlock>
      <H2 id="best-practices">Best practices</H2>
      <UL items={[
        "Store result.id — you can look up any past execution for auditing",
        "Set timeout_ms explicitly in production — don't rely on the default",
        "Use runix.batch() when your agent needs multiple independent results at once",
        "Check result.cached — repeated identical calls return instantly at no cost",
        "Monitor result.cost_usd per step to track agent spend in real time",
      ]} />
    </>),
  },

  "guide-sandbox": {
    title: "Sandbox & Security",
    headings: ["Docker isolation", "What code cannot do"],
    content: (<>
      <P>Every compute, stateful, and file job runs inside a Docker container with strict isolation managed by Dockerode, with a pre-warmed pool per language runtime.</P>
      <H2 id="docker-isolation">Docker isolation</H2>
      <UL items={[
        "Read-only root filesystem",
        "No network access from inside the container",
        "All Linux capabilities dropped",
        "PidsLimit enforced to prevent fork bombs",
        "Containers discarded after each job — no state leaks",
        "Memory and CPU caps enforced by Docker cgroup",
      ]} />
      <Callout type="info">Container pools replenish automatically after each job. Under high concurrency, jobs queue in BullMQ until a container is available.</Callout>
      <H2 id="what-code-cannot-do">What code cannot do</H2>
      <UL items={[
        "Make outbound network requests — use runix.action() instead",
        "Access the host filesystem",
        "Spawn privileged processes",
        "Persist files between separate compute jobs — use runix.stateful() or runix.file()",
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
        "Your agent wallet holds a USDC balance on Arc Testnet",
        "After each execution, Runix calculates cost via pricing.service.ts",
        "A Circle SDK transfer deducts from your wallet to the Runix system wallet",
        "The amount appears in result.cost_usd and in your billing history",
      ]} />
      <Callout type="info">Payment failures are currently silent — jobs succeed even if the deduction fails. This changes before mainnet.</Callout>
      <H2 id="pricing">Pricing</H2>
      <div style={{ overflowX: "auto", margin: "20px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <th style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Job type</th>
              <th style={{ textAlign: "left", padding: "10px 0", fontSize: 11, fontWeight: 500, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["compute",  "$0.000003 per execution"],
              ["action",   "$0.000001 per execution"],
              ["data",     "$0.000001 per execution"],
              ["stateful", "$0.000002 per step"],
              ["batch",    "Sum of individual job costs"],
              ["file",     "$0.000003 per execution"],
            ].map(([t, c]) => (
              <tr key={t} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "12px 14px 12px 0" }}><InlineCode>{t}</InlineCode></td>
                <td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H2 id="funding-your-wallet">Funding your wallet</H2>
      <P>Send testnet USDC to your <InlineCode>wallet_address</InlineCode> on Arc Testnet. Use the Arc Testnet faucet or bridge via Circle Gateway from another supported chain.</P>
    </>),
  },
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [active, setActive] = useState("introduction");
  const [activeHeading, setActiveHeading] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const section = SECTIONS[active];

  // Reset scroll + active heading when section changes
  useEffect(() => {
    const el = contentRef.current;
    if (el) el.scrollTop = 0;
    setActiveHeading(section.headings[0] ? toId(section.headings[0]) : "");
  }, [active]);

  // Scroll-spy: watch h2 elements inside content, highlight matching TOC item
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const headingEls = Array.from(el.querySelectorAll("h2[id]")) as HTMLElement[];
    if (!headingEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible heading
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveHeading((visible[0].target as HTMLElement).id);
        }
      },
      { root: el, rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );

    headingEls.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [active]);

  const toId = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const scrollToHeading = (h: string) => {
    const el = contentRef.current?.querySelector(`#${toId(h)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const go = (id: string) => { setActive(id); setMobileNavOpen(false); };

  const all = NAV.flatMap(g => g.items);
  const idx = all.findIndex(i => i.id === active);
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const group = NAV.find(g => g.items.some(i => i.id === active))?.group;

  const NavItem = ({ item }: { item: { id: string; label: string } }) => {
    const isActive = active === item.id;
    return (
      <button
        onClick={() => go(item.id)}
        style={{
          display: "block", width: "100%", textAlign: "left",
          padding: "7px 12px", borderRadius: 7, fontSize: 13.5,
          color: isActive ? C.white : C.textMuted,
          background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
          border: "none", cursor: "pointer",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = "transparent"; } }}
      >
        {item.label}
      </button>
    );
  };

  const TocItem = ({ h }: { h: string }) => {
    const id = toId(h);
    const isActive = activeHeading === id;
    return (
      <button
        onClick={() => scrollToHeading(h)}
        style={{
          display: "block", width: "100%", textAlign: "left",
          fontSize: 13, lineHeight: 1.5,
          color: isActive ? C.white : C.textMuted,
          padding: "5px 0 5px 14px",
          borderLeft: `2px solid ${isActive ? "rgba(255,255,255,0.5)" : "transparent"}`,
          background: "none", border: "none",
          borderLeftWidth: 2, borderLeftStyle: "solid",
          borderLeftColor: isActive ? "rgba(255,255,255,0.5)" : "transparent",
          cursor: "pointer",
          transition: "color 0.2s, border-color 0.2s",
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.72)"; e.currentTarget.style.borderLeftColor = "rgba(255,255,255,0.2)"; } }}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderLeftColor = "transparent"; } }}
      >{h}</button>
    );
  };

  const NavCard = ({ item, dir }: { item: { id: string; label: string }; dir: "prev" | "next" }) => (
    <button
      onClick={() => go(item.id)}
      style={{
        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
        borderRadius: 10, cursor: "pointer",
        padding: "14px 18px", textAlign: dir === "prev" ? "left" : "right",
        transition: "background 0.15s, border-color 0.15s", flex: 1, maxWidth: 260,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 5, letterSpacing: "0.04em" }}>{dir === "prev" ? "← Previous" : "Next →"}</div>
      <div style={{ fontSize: 14, color: C.white, fontWeight: 500 }}>{item.label}</div>
    </button>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: C.bg, color: C.white, fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        @media (max-width: 768px) {
          .sidebar-left  { display: none !important; }
          .sidebar-right { display: none !important; }
          .mob-toggle    { display: flex !important; }
          .main-content  { padding: 24px 20px 80px !important; }
        }
        @media (min-width: 769px) and (max-width: 1200px) {
          .sidebar-right { display: none !important; }
        }
        @media (min-width: 769px) {
          .mob-toggle { display: none !important; }
        }
      `}</style>

      {/* HEADER — fixed, never scrolls */}
      <header style={{ flexShrink: 0, height: 60, borderBottom: `1px solid ${C.border}`, background: C.bg, zIndex: 50 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="/" style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: C.white, textDecoration: "none" }}>Runix</a>
            <span style={{ color: C.textDim, fontSize: 15 }}>/</span>
            <span style={{ fontSize: 14, color: C.textMuted }}>Docs</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/register" style={{ fontSize: 13, fontWeight: 600, color: C.bg, background: C.white, padding: "7px 16px", borderRadius: 7, textDecoration: "none" }}>Get API Key</a>
            <button
              className="mob-toggle"
              onClick={() => setMobileNavOpen(o => !o)}
              style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 20, padding: "4px 6px", lineHeight: 1 }}
            >{mobileNavOpen ? "✕" : "☰"}</button>
          </div>
        </div>
      </header>

      {/* THREE-COLUMN BODY — fills remaining height, nothing scrolls except center */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", width: "100%", padding: "0 clamp(16px,4vw,48px)", display: "flex", overflow: "hidden" }}>

          {/* LEFT SIDEBAR — fixed, no scroll */}
          <aside className="sidebar-left" style={{ width: "clamp(180px,17vw,230px)", flexShrink: 0, borderRight: `1px solid ${C.border}`, overflowY: "auto", padding: "32px 18px 32px 0" }}>
            {NAV.map(g => (
              <div key={g.group} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.textDim, padding: "0 12px", marginBottom: 6 }}>{g.group}</div>
                {g.items.map(item => <NavItem key={item.id} item={item} />)}
              </div>
            ))}
          </aside>

          {/* MOBILE OVERLAY */}
          {mobileNavOpen && (
            <div style={{ position: "fixed", inset: "60px 0 0 0", background: C.bg, zIndex: 40, overflowY: "auto", padding: "20px" }}>
              {NAV.map(g => (
                <div key={g.group} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.textDim, padding: "0 12px", marginBottom: 6 }}>{g.group}</div>
                  {g.items.map(item => <NavItem key={item.id} item={item} />)}
                </div>
              ))}
            </div>
          )}

          {/* CENTER — only this scrolls */}
          <main ref={contentRef} className="main-content" style={{ flex: 1, overflowY: "auto", padding: "48px 48px 96px" }}>
            <div style={{ maxWidth: 680 }}>
              <div style={{ fontSize: 12, color: C.textDim, marginBottom: 18, letterSpacing: "0.02em" }}>{group} › {section.title}</div>
              <h1 style={{ fontSize: "clamp(1.65rem,3.5vw,2.1rem)", fontWeight: 800, letterSpacing: "-0.025em", color: C.white, lineHeight: 1.12, marginBottom: 16 }}>{section.title}</h1>
              <div style={{ height: 1, background: C.border, margin: "22px 0 32px" }} />
              {section.content}

              {/* Prev / Next */}
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 72, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
                {prev ? <NavCard item={prev} dir="prev" /> : <span />}
                {next ? <NavCard item={next} dir="next" /> : <span />}
              </div>
            </div>
          </main>

          {/* RIGHT TOC — fixed, no scroll, highlights on scroll-spy */}
          <aside className="sidebar-right" style={{ width: "clamp(140px,13vw,180px)", flexShrink: 0, borderLeft: `1px solid ${C.border}`, overflowY: "auto", padding: "48px 0 48px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: C.textDim, marginBottom: 14 }}>On this page</div>
            {section.headings.map(h => <TocItem key={h} h={h} />)}
          </aside>

        </div>
      </div>
    </div>
  );
}