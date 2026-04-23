"use client";

import { useEffect, useRef, useState } from "react";
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
  bg: "#060708",
  sidebar: "#111214",
  sidebarBorder: "#1e2128",
  surface: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
  text: "rgba(255,255,255,0.62)",
  textMuted: "rgba(255,255,255,0.35)",
  textDim: "rgba(255,255,255,0.18)",
  white: "#fff",
  codeBg: "#0a0b0c",
  codeBar: "#0f1012",
  blue: "#3b82f6",
};

// ---------- CodeBlock with syntax highlighting ----------
function CodeBlock({ children, lang }: { children: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ margin: "20px 0", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.codeBar, padding: "9px 16px", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono','Fira Code',monospace", color: C.textMuted, letterSpacing: "0.06em" }}>{lang}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{ fontSize: 12, fontFamily: "'Inter',sans-serif", color: copied ? "#86efac" : C.textMuted, background: "none", border: "none", cursor: "pointer" }}
        >
          {copied ? "copied ✓" : "copy"}
        </button>
      </div>
      <div style={{ background: C.codeBg, padding: "20px 22px", overflowX: "auto" }}>
        <ShikiHighlighter
          language={lang}
          theme="github-dark"
          showLanguage={false}
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            background: C.codeBg,
            margin: 0,
            padding: 0,
          }}
        >
          {children.trim()}
        </ShikiHighlighter>
      </div>
    </div>
  );
}

// ---------- Helper components (all defined) ----------
function Callout({ children, type }: { children: React.ReactNode; type: "info" | "tip" | "warning" }) {
  const map = {
    info: { border: "rgba(59,130,246,0.5)", bg: "rgba(59,130,246,0.07)", label: "Note", color: "#93c5fd" },
    tip: { border: "rgba(16,185,129,0.5)", bg: "rgba(16,185,129,0.07)", label: "Tip", color: "#6ee7b7" },
    warning: { border: "rgba(245,158,11,0.45)", bg: "rgba(245,158,11,0.06)", label: "Warning", color: "#fcd34d" },
  }[type];
  return (
    <div style={{ borderLeft: `2px solid ${map.border}`, background: map.bg, borderRadius: "0 10px 10px 0", padding: "14px 18px", margin: "24px 0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: map.color, marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>{map.label}</div>
      <div style={{ fontSize: 16, color: C.text, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return <code style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono','Fira Code',monospace", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.8)", padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)" }}>{children}</code>;
}

function Badge({ label, color }: { label: string; color: "blue" | "green" | "orange" | "red" }) {
  const map = {
    blue: { bg: "rgba(59,130,246,0.12)", color: "#93c5fd", border: "rgba(59,130,246,0.25)" },
    green: { bg: "rgba(16,185,129,0.1)", color: "#6ee7b7", border: "rgba(16,185,129,0.2)" },
    orange: { bg: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "rgba(245,158,11,0.2)" },
    red: { bg: "rgba(239,68,68,0.1)", color: "#fca5a5", border: "rgba(239,68,68,0.2)" },
  }[color];
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", background: map.bg, color: map.color, padding: "4px 10px", borderRadius: 6, border: `1px solid ${map.border}` }}>{label}</span>;
}

function ParamRow({ name, type, req, desc }: { name: string; type: string; req: boolean; desc: string }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "13px 16px 13px 0", verticalAlign: "top" }}><InlineCode>{name}</InlineCode></td>
      <td style={{ padding: "13px 16px 13px 0", verticalAlign: "top", fontSize: 13, fontFamily: "'JetBrains Mono','Fira Code',monospace", color: "#c4b5fd" }}>{type}</td>
      <td style={{ padding: "13px 16px 13px 0", verticalAlign: "top", fontSize: 13, color: req ? "#4ade80" : C.textDim }}>{req ? "Yes" : "No"}</td>
      <td style={{ padding: "13px 0", verticalAlign: "top", fontSize: 15, color: C.text, lineHeight: 1.75 }}>{desc}</td>
    </tr>
  );
}

function H2({ id, children }: { id: string; children: string }) {
  return <h2 id={id} style={{ fontSize: 20, fontWeight: 700, color: C.white, margin: "48px 0 14px", scrollMarginTop: 32, letterSpacing: "-0.02em" }}>{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 17, color: C.text, lineHeight: 1.9, marginBottom: 18 }}>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 0, marginBottom: 20, listStyle: "none" }}>
      {items.map((s) => (
        <li key={s} style={{ fontSize: 17, color: C.text, lineHeight: 1.85, marginBottom: 10, paddingLeft: 22, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: C.blue, fontSize: 12, top: 6 }}>▸</span>
          {s}
        </li>
      ))}
    </ul>
  );
}

function OL({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: 0, marginBottom: 20, listStyle: "none" }}>
      {items.map((s, i) => (
        <li key={s} style={{ fontSize: 17, color: C.text, lineHeight: 1.85, marginBottom: 10, paddingLeft: 28, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: C.blue, fontSize: 14, fontWeight: 700 }}>{i + 1}.</span>
          {s}
        </li>
      ))}
    </ol>
  );
}

function ParamTable({ rows }: { rows: { name: string; type: string; req: boolean; desc: string }[] }) {
  return (
    <div style={{ overflowX: "auto", margin: "20px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Parameter", "Type", "Required", "Description"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "11px 16px 11px 0", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((r) => <ParamRow key={r.name} {...r} />)}</tbody>
      </table>
    </div>
  );
}

// ---------- SECTIONS (all content) ----------
const SECTIONS: Record<string, { title: string; headings: string[]; content: React.ReactNode }> = {
  introduction: {
    title: "Introduction",
    headings: ["How it works", "When to use it"],
    content: (
      <>
        <P>Runix is a machine-to-machine execution engine. Agents register an identity on the Arc blockchain, receive a Circle-managed USDC wallet, and submit jobs over HTTP — paying per execution in USDC with no subscriptions and no pre-provisioned infrastructure.</P>
        <P>Think of it as AWS Lambda without the deployment step, with crypto-native payments and on-chain agent identity built in.</P>
        <H2 id="how-it-works">How it works</H2>
        <OL items={["Register — call POST /api/agents/register. You get an API key and wallet address.", "Fund — deposit USDC to your agent wallet on Arc Testnet.", "Execute — submit jobs via SDK or HTTP. Runix sandboxes, runs, and returns a signed result.", "Pay — USDC is deducted from your wallet per execution."]} />
        <Callout type="info">Execution receipts are Ed25519-signed with SHA-256 hashed inputs and outputs — every result is cryptographically auditable.</Callout>
        <H2 id="when-to-use-it">When to use it</H2>
        <UL items={["Autonomous AI agents that need to run code or call APIs inside a decision loop", "Event-driven systems with bursty, unpredictable compute needs", "Machine-to-machine value exchange without human billing", "On-chain agent identity and reputation with verifiable execution history"]} />
      </>
    ),
  },
  installation: {
    title: "Installation",
    headings: ["npm", "Requirements"],
    content: (
      <>
        <P>The Runix SDK wraps all HTTP endpoints and handles auth, streaming, and error handling.</P>
        <H2 id="npm">npm</H2>
        <CodeBlock lang="bash">{`npm install @runix/sdk\n# or\nyarn add @runix/sdk`}</CodeBlock>
        <Callout type="tip">Full TypeScript types included. No extra @types package needed. ESM and CJS both supported.</Callout>
        <H2 id="requirements">Requirements</H2>
        <UL items={["Node.js 18+", "A Runix API key — see Authentication", "USDC on Arc Testnet in your agent wallet"]} />
      </>
    ),
  },
  authentication: {
    title: "Authentication",
    headings: ["Register your agent", "Using your key"],
    content: (
      <>
        <P>Runix uses API keys tied to on-chain agent identities. Registration is once — it creates your API key and Circle wallet at the same time.</P>
        <H2 id="register-your-agent">Register your agent</H2>
        <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";\n\nconst { apiKey, walletAddress, agentId } = await RunixClient.register({\n  name: "my-agent",\n});\n\nconsole.log(apiKey);        // rk_live_...\nconsole.log(walletAddress); // 0x...`}</CodeBlock>
        <Callout type="warning">Never commit your API key to source control. Use environment variables.</Callout>
        <H2 id="using-your-key">Using your key</H2>
        <CodeBlock lang="ts">{`const runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,\n});`}</CodeBlock>
        <P>The key is sent as a Bearer token on every request. All endpoints except <InlineCode>/agents/register</InlineCode> require it.</P>
      </>
    ),
  },
  quickstart: {
    title: "Quickstart",
    headings: ["Register", "Fund your wallet", "Run your first job"],
    content: (
      <>
        <P>Zero to a running execution in under five minutes.</P>
        <H2 id="register">1. Register</H2>
        <CodeBlock lang="ts">{`const { apiKey, walletAddress } = await RunixClient.register({\n  name: "quickstart-agent",\n});`}</CodeBlock>
        <H2 id="fund-your-wallet">2. Fund your wallet</H2>
        <P>Send testnet USDC to your <InlineCode>walletAddress</InlineCode> on Arc Testnet using the Arc faucet or Circle Gateway.</P>
        <H2 id="run-your-first-job">3. Run your first job</H2>
        <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey });\n\nconst result = await runix.compute({\n  runtime: "python",\n  code: "print(21 * 2)",\n});\n\nconsole.log(result.stdout);      // "42"\nconsole.log(result.duration_ms); // e.g. 38\nconsole.log(result.cost_usd);    // e.g. 0.000003`}</CodeBlock>
        <Callout type="tip">Check result.status before reading result.stdout. "error" means the code ran but exited non-zero.</Callout>
      </>
    ),
  },
  "sdk-overview": {
    title: "SDK Overview",
    headings: ["Client setup", "Response shape", "Error handling"],
    content: (
      <>
        <P><InlineCode>RunixClient</InlineCode> is the single entry point for all SDK operations.</P>
        <H2 id="client-setup">Client setup</H2>
        <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";\n\nconst runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,\n  baseUrl: "https://runix.basilgoodluck.com",\n  timeout: 30_000,\n});`}</CodeBlock>
        <H2 id="response-shape">Response shape</H2>
        <CodeBlock lang="ts">{`interface ExecutionResult {\n  id: string;\n  status: "done" | "error" | "timeout" | "cached";\n  stdout: string;\n  stderr: string;\n  duration_ms: number;\n  cost_usd: number;\n  session_id: string | null;\n  cached: boolean;\n  receipt: {\n    id: string;\n    input_hash: string;\n    output_hash: string;\n    signature: string;\n    timestamp: number;\n  };\n}`}</CodeBlock>
        <H2 id="error-handling">Error handling</H2>
        <CodeBlock lang="ts">{`import { RunixError } from "@runix/sdk";\n\ntry {\n  const result = await runix.compute({ runtime: "python", code: "..." });\n} catch (err) {\n  if (err instanceof RunixError) {\n    console.log(err.code);\n    console.log(err.status);\n  }\n}`}</CodeBlock>
      </>
    ),
  },
  "sdk-compute": {
    title: "runix.compute()",
    headings: ["Parameters", "Example"],
    content: (
      <>
        <P>Run arbitrary code in an isolated Docker sandbox. Memory-capped, CPU-capped, no network access, read-only filesystem.</P>
        <H2 id="parameters">Parameters</H2>
        <ParamTable rows={[{ name: "runtime", type: "Runtime", req: true, desc: '"python" | "node" | "go"' }, { name: "code", type: "string", req: true, desc: "Source code to execute" }, { name: "stdin", type: "string", req: false, desc: "Input piped to stdin" }, { name: "timeout_ms", type: "number", req: false, desc: "Max execution time. Default: 10000" }, { name: "env", type: "Record<string,string>", req: false, desc: "Environment variables injected into the sandbox" }]} />
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`const result = await runix.compute({\n  runtime: "node",\n  code: \`const nums = [1,2,3,4,5];\nconst avg = nums.reduce((a,b)=>a+b)/nums.length;\nconsole.log(avg);\`,\n  timeout_ms: 5000,\n});\n\nconsole.log(result.stdout); // "3"`}</CodeBlock>
      </>
    ),
  },
  "sdk-action": {
    title: "runix.action()",
    headings: ["Parameters", "Example"],
    content: (
      <>
        <P>Call any external HTTP service through Runix. Handles retries on 5xx and timeout enforcement.</P>
        <H2 id="parameters">Parameters</H2>
        <ParamTable rows={[{ name: "url", type: "string", req: true, desc: "Full URL of the service to call" }, { name: "method", type: "string", req: false, desc: '"GET" | "POST" | "PUT" | "DELETE". Default: "GET"' }, { name: "headers", type: "Record<string,string>", req: false, desc: "Request headers" }, { name: "body", type: "unknown", req: false, desc: "Request body — auto-serialized to JSON" }, { name: "retries", type: "number", req: false, desc: "Retry count on 5xx. Default: 2" }]} />
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`const result = await runix.action({\n  url: "https://api.example.com/data",\n  method: "GET",\n  headers: { Authorization: \`Bearer \${token}\` },\n});\n\nconst data = JSON.parse(result.stdout);`}</CodeBlock>
      </>
    ),
  },
  "sdk-data": {
    title: "runix.data()",
    headings: ["Parameters", "Example"],
    content: (
      <>
        <P>Fetch and parse structured data sources. Results come back ready to use.</P>
        <H2 id="parameters">Parameters</H2>
        <ParamTable rows={[{ name: "source", type: "string", req: true, desc: "URL or data source identifier" }, { name: "format", type: "string", req: false, desc: '"json" | "csv" | "xml" — auto-detected if omitted' }, { name: "query", type: "string", req: false, desc: "JSONPath filter applied to the result" }]} />
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`const result = await runix.data({\n  source: "https://data.example.com/market.json",\n  format: "json",\n  query: "$.assets[?(@.symbol == 'USDC')]",\n});\n\nconst asset = JSON.parse(result.stdout);`}</CodeBlock>
      </>
    ),
  },
  "sdk-stateful": {
    title: "runix.stateful()",
    headings: ["Parameters", "Example"],
    content: (
      <>
        <P>Execute code with persistent session state across multiple steps. Sessions expire after 30 minutes of inactivity.</P>
        <H2 id="parameters">Parameters</H2>
        <ParamTable rows={[{ name: "runtime", type: "Runtime", req: true, desc: '"python" | "node" | "go"' }, { name: "code", type: "string", req: true, desc: "Code to run in this step" }, { name: "session_id", type: "string", req: false, desc: "Continue an existing session. Omit to start a new one." }, { name: "timeout_ms", type: "number", req: false, desc: "Step timeout. Default: 10000" }]} />
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`const step1 = await runix.stateful({\n  runtime: "python",\n  code: "total = 0",\n});\n\nconst step2 = await runix.stateful({\n  session_id: step1.session_id!,\n  runtime: "python",\n  code: "total += 42\\nprint(total)",\n});\n\nconsole.log(step2.stdout); // "42"`}</CodeBlock>
      </>
    ),
  },
  "sdk-batch": {
    title: "runix.batch()",
    headings: ["Parameters", "Example"],
    content: (
      <>
        <P>Submit multiple jobs in one call. Jobs run concurrently. Results come back in submission order.</P>
        <H2 id="parameters">Parameters</H2>
        <ParamTable rows={[{ name: "jobs", type: "Job[]", req: true, desc: "Array of compute, action, or data payloads" }, { name: "concurrency", type: "number", req: false, desc: "Max parallel jobs. Default: all at once" }]} />
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`const batch = await runix.batch({\n  jobs: [\n    { type: "compute", runtime: "python", code: "print(1 + 1)" },\n    { type: "compute", runtime: "node",   code: "console.log(2 + 2)" },\n  ],\n  concurrency: 2,\n});\n\nconsole.log(batch.results[0].stdout);\nconsole.log(batch.total_cost_usd);`}</CodeBlock>
      </>
    ),
  },
  "sdk-stream": {
    title: "runix.stream()",
    headings: ["Event shape", "Example"],
    content: (
      <>
        <P>Stream compute output in real time via Server-Sent Events. Same parameters as <InlineCode>runix.compute()</InlineCode>.</P>
        <H2 id="event-shape">Event shape</H2>
        <CodeBlock lang="ts">{`type StreamEvent =\n  | { type: "stdout";  data: string }\n  | { type: "stderr";  data: string }\n  | { type: "done";    id: string; duration_ms: number; cost_usd: number }\n  | { type: "error";   message: string };`}</CodeBlock>
        <H2 id="example">Example</H2>
        <CodeBlock lang="ts">{`for await (const event of runix.stream({ runtime: "python", code: "..." })) {\n  if (event.type === "stdout") process.stdout.write(event.data);\n  if (event.type === "done")   console.log("cost:", event.cost_usd);\n}`}</CodeBlock>
      </>
    ),
  },
  "api-register": {
    title: "POST /agents/register",
    headings: ["Request body", "Response", "Example"],
    content: (
      <>
        <P>Register a new agent. Creates a Circle USDC wallet and registers on-chain via ERC-8004. No API key required.</P>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge label="POST" color="blue" />
          <Badge label="Public — no auth required" color="orange" />
        </div>
        <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/agents/register`}</CodeBlock>
        <H2 id="request-body">Request body</H2>
        <ParamTable rows={[{ name: "name", type: "string", req: true, desc: "Human-readable agent name — stored on-chain" }, { name: "metadata_uri", type: "string", req: false, desc: "IPFS URI pointing to agent metadata JSON" }]} />
        <H2 id="response">Response</H2>
        <CodeBlock lang="json">{`{\n  "api_key": "rk_live_abc123...",\n  "wallet_address": "0xabc...",\n  "agent_id": "0x...",\n  "registration_tx": "0x..."\n}`}</CodeBlock>
        <Callout type="warning">Store your api_key immediately — it is only returned once.</Callout>
        <H2 id="example">Example</H2>
        <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/agents/register \\\n  -H "Content-Type: application/json" \\\n  -d '{ "name": "my-agent" }'`}</CodeBlock>
      </>
    ),
  },
  "api-execute": {
    title: "POST /execute",
    headings: ["Request body", "Job types", "Response", "Example"],
    content: (
      <>
        <P>Submit a single execution job. Routes to the correct worker, runs in an isolated Docker sandbox, returns a signed result synchronously.</P>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge label="POST" color="blue" />
          <Badge label="Requires API key" color="red" />
        </div>
        <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/execute\nAuthorization: Bearer <your-api-key>`}</CodeBlock>
        <H2 id="request-body">Request body</H2>
        <ParamTable rows={[{ name: "type", type: "string", req: true, desc: '"compute" | "action" | "data" | "stateful" | "batch" | "file"' }, { name: "runtime", type: "string", req: false, desc: 'Required for compute, stateful, file. "python" | "node" | "go"' }, { name: "code", type: "string", req: false, desc: "Required for compute, stateful, file" }, { name: "url", type: "string", req: false, desc: "Required for action" }, { name: "session_id", type: "string", req: false, desc: "Continue a stateful session" }, { name: "timeout_ms", type: "number", req: false, desc: "Max execution time in ms. Default: 10000" }]} />
        <H2 id="job-types">Job types</H2>
        <UL items={["compute — run code in a sandboxed runtime", "action — call an external HTTP service", "data — fetch and parse a structured source", "stateful — code execution with persistent session", "batch — multiple jobs in one request", "file — code execution with virtual filesystem inputs"]} />
        <H2 id="response">Response</H2>
        <CodeBlock lang="json">{`{\n  "id": "exec_9f3a1c",\n  "status": "done",\n  "stdout": "42",\n  "stderr": "",\n  "duration_ms": 38,\n  "cost_usd": 0.000003,\n  "session_id": null,\n  "cached": false,\n  "receipt": {\n    "id": "rcpt_abc",\n    "input_hash": "sha256:...",\n    "output_hash": "sha256:...",\n    "signature": "ed25519:...",\n    "timestamp": 1714000000\n  }\n}`}</CodeBlock>
        <H2 id="example">Example</H2>
        <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "python", "code": "print(21 * 2)" }'`}</CodeBlock>
      </>
    ),
  },
  "api-stream": {
    title: "POST /execute/stream",
    headings: ["SSE event format", "Example"],
    content: (
      <>
        <P>Stream compute output via Server-Sent Events. Only supports <InlineCode>type: "compute"</InlineCode>.</P>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge label="POST" color="blue" />
          <Badge label="Requires API key" color="red" />
        </div>
        <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/execute/stream\nAuthorization: Bearer <your-api-key>`}</CodeBlock>
        <H2 id="sse-event-format">SSE event format</H2>
        <CodeBlock lang="text">{`event: stdout\ndata: Step 1\n\nevent: done\ndata: {"id":"exec_abc","duration_ms":1240,"cost_usd":0.000003}`}</CodeBlock>
        <H2 id="example">Example</H2>
        <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute/stream \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Accept: text/event-stream" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "python", "code": "for i in range(5): print(i)" }'`}</CodeBlock>
      </>
    ),
  },
  "api-balance": {
    title: "GET /billing/balance",
    headings: ["Response", "Example"],
    content: (
      <>
        <P>Returns the current USDC balance of your agent's Circle wallet on Arc Testnet.</P>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <Badge label="GET" color="green" />
          <Badge label="Requires API key" color="red" />
        </div>
        <CodeBlock lang="bash">{`GET https://runix.basilgoodluck.com/api/billing/balance`}</CodeBlock>
        <H2 id="response">Response</H2>
        <CodeBlock lang="json">{`{\n  "balance_usd": "4.820000",\n  "wallet_address": "0xabc...",\n  "currency": "USDC",\n  "chain": "arc-testnet"\n}`}</CodeBlock>
        <H2 id="example">Example</H2>
        <CodeBlock lang="bash">{`curl https://runix.basilgoodluck.com/api/billing/balance \\\n  -H "Authorization: Bearer $RUNIX_API_KEY"`}</CodeBlock>
      </>
    ),
  },
  "api-errors": {
    title: "Errors",
    headings: ["Error shape", "Status codes"],
    content: (
      <>
        <P>All errors return a consistent JSON shape. The SDK wraps these as <InlineCode>RunixError</InlineCode> instances.</P>
        <H2 id="error-shape">Error shape</H2>
        <CodeBlock lang="json">{`{\n  "error": {\n    "code": "insufficient_balance",\n    "message": "Agent wallet has insufficient USDC.",\n    "param": null\n  }\n}`}</CodeBlock>
        <H2 id="status-codes">Status codes</H2>
        <div style={{ overflowX: "auto", margin: "20px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "11px 16px 11px 0", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Code</th>
                <th style={{ textAlign: "left", padding: "11px 16px 11px 0", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>400</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Bad request — missing or invalid parameters</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>401</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Unauthorized — missing or invalid API key</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>403</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Forbidden — key lacks required scope</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>408</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Execution timed out</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>429</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Rate limit exceeded</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>500</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Internal server error</td></tr>
            </tbody>
          </table>
        </div>
        <Callout type="warning">A 200 OK with status: "error" means the code ran but exited non-zero — different from a 4xx/5xx HTTP error.</Callout>
      </>
    ),
  },
  "guide-agents": {
    title: "Agent Integration",
    headings: ["Decision loop pattern", "Best practices"],
    content: (
      <>
        <P>Runix sits inside an agent's decision loop — called whenever the agent needs to act on the world rather than reason about it.</P>
        <H2 id="decision-loop-pattern">Decision loop pattern</H2>
        <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey: process.env.RUNIX_API_KEY });\n\nasync function agentLoop(task: string) {\n  while (true) {\n    const action = await llm.decide(task);\n    if (action.type === "done") break;\n\n    const result = await runix.compute({\n      runtime: action.runtime,\n      code: action.code,\n      timeout_ms: 15_000,\n    });\n\n    if (result.status === "error") {\n      task = \`Previous step failed: \${result.stderr}. Retry.\`;\n      continue;\n    }\n\n    task = incorporateResult(task, result.stdout);\n  }\n}`}</CodeBlock>
        <H2 id="best-practices">Best practices</H2>
        <UL items={["Store result.id — you can look up any past execution for auditing", "Set timeout_ms explicitly in production — don't rely on the default", "Use runix.batch() when your agent needs multiple independent results at once", "Check result.cached — repeated identical calls return instantly at no cost", "Monitor result.cost_usd per step to track agent spend in real time"]} />
      </>
    ),
  },
  "guide-sandbox": {
    title: "Sandbox & Security",
    headings: ["Docker isolation", "What code cannot do"],
    content: (
      <>
        <P>Every compute, stateful, and file job runs inside a Docker container with strict isolation, with a pre-warmed pool per language runtime.</P>
        <H2 id="docker-isolation">Docker isolation</H2>
        <UL items={["Read-only root filesystem", "No network access from inside the container", "All Linux capabilities dropped", "PidsLimit enforced to prevent fork bombs", "Containers discarded after each job — no state leaks", "Memory and CPU caps enforced by Docker cgroup"]} />
        <Callout type="info">Container pools replenish automatically after each job. Under high concurrency, jobs queue in BullMQ until a container is available.</Callout>
        <H2 id="what-code-cannot-do">What code cannot do</H2>
        <UL items={["Make outbound network requests — use runix.action() instead", "Access the host filesystem", "Spawn privileged processes", "Persist files between separate compute jobs — use runix.stateful() or runix.file()"]} />
      </>
    ),
  },
  "guide-billing": {
    title: "Billing & USDC",
    headings: ["How billing works", "Pricing", "Funding your wallet"],
    content: (
      <>
        <P>Runix charges per execution in USDC on Arc Testnet. Payment deducts from your Circle-managed wallet immediately after each successful job.</P>
        <H2 id="how-billing-works">How billing works</H2>
        <OL items={["Your agent wallet holds a USDC balance on Arc Testnet", "After each execution, Runix calculates cost via pricing.service.ts", "A Circle SDK transfer deducts from your wallet to the Runix system wallet", "The amount appears in result.cost_usd and in your billing history"]} />
        <Callout type="info">Payment failures are currently silent — jobs succeed even if the deduction fails. This changes before mainnet.</Callout>
        <H2 id="pricing">Pricing</H2>
        <div style={{ overflowX: "auto", margin: "20px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "11px 16px 11px 0", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Job type</th>
                <th style={{ textAlign: "left", padding: "11px 16px 11px 0", fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>compute</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>$0.000003 per execution</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>action</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>$0.000001 per execution</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>data</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>$0.000001 per execution</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>stateful</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>$0.000002 per step</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>batch</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>Sum of individual job costs</td></tr>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "12px 16px 12px 0" }}><InlineCode>file</InlineCode></td><td style={{ padding: "12px 0", fontSize: 15, color: C.text }}>$0.000003 per execution</td></tr>
            </tbody>
          </table>
        </div>
        <H2 id="funding-your-wallet">Funding your wallet</H2>
        <P>Send testnet USDC to your <InlineCode>wallet_address</InlineCode> on Arc Testnet. Use the Arc Testnet faucet or bridge via Circle Gateway from another supported chain.</P>
      </>
    ),
  },
};

// ---------- Main Page Component (no fixed height, respects layout) ----------
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
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveHeading((visible[0].target as HTMLElement).id);
      },
      { root: el, rootMargin: "0px 0px -60% 0px", threshold: 0 }
    );
    headingEls.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [active]);

  const toId = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const scrollToHeading = (h: string) => {
    contentRef.current?.querySelector(`#${toId(h)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const go = (id: string) => {
    setActive(id);
    setMobileNavOpen(false);
  };

  const all = NAV.flatMap((g) => g.items);
  const idx = all.findIndex((i) => i.id === active);
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const group = NAV.find((g) => g.items.some((i) => i.id === active))?.group;

  const sidebarStyle: React.CSSProperties = {
    background: C.sidebar,
    borderRadius: 18,
    border: `1px solid ${C.sidebarBorder}`,
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
    overflowY: "auto",
  };

  // NOTE: Removed fixed height and viewport styles – now flows with layout.
  // Added top padding (120px) to account for fixed header (108px height).
  return (
    <div style={{ 
      maxWidth: "1400px", 
      margin: "0 auto", 
      width: "100%", 
      display: "flex", 
      background: C.bg, 
      color: C.white, 
      fontFamily: "'Inter', sans-serif", 
      gap: 12,
      padding: "120px 16px 60px 16px"   /* top: header space, bottom: footer space */
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        .sidebar-left { display: flex; }
        .sidebar-right { display: flex; }
        .mob-toggle { display: none !important; }
        @media (max-width: 768px) {
          .sidebar-left { display: none !important; }
          .sidebar-right { display: none !important; }
          .mob-toggle { display: flex !important; }
        }
        @media (min-width: 769px) and (max-width: 1100px) {
          .sidebar-right { display: none !important; }
        }
      `}</style>

      {/* LEFT SIDEBAR */}
      <aside className="sidebar-left" style={{ ...sidebarStyle, width: 220, minWidth: 220, flexShrink: 0, flexDirection: "column", padding: "24px 12px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", color: C.blue, marginBottom: 28, paddingLeft: 10 }}>RUNIX</div>
        {NAV.map((g) => (
          <div key={g.group} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, padding: "0 10px", marginBottom: 6 }}>{g.group}</div>
            {g.items.map((item) => {
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: "inherit",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? C.white : C.textMuted,
                    background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = C.textMuted;
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileNavOpen && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 50, overflowY: "auto", padding: "24px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", color: C.blue }}>RUNIX</span>
            <button onClick={() => setMobileNavOpen(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 22, cursor: "pointer" }}>
              ✕
            </button>
          </div>
          {NAV.map((g) => (
            <div key={g.group} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, padding: "0 10px", marginBottom: 6 }}>{g.group}</div>
              {g.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 10,
                      fontSize: 15,
                      fontFamily: "inherit",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? C.white : C.textMuted,
                      background: isActive ? "rgba(59,130,246,0.12)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* CENTER CONTENT - main scrollable area */}
      <main ref={contentRef} style={{ flex: 1, overflowY: "auto", ...sidebarStyle, padding: "40px 48px 80px" }}>
        <div className="mob-toggle" style={{ display: "none", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", color: C.blue }}>RUNIX</span>
          <button onClick={() => setMobileNavOpen(true)} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.sidebarBorder}`, borderRadius: 8, color: C.textMuted, fontSize: 14, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            Menu
          </button>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: C.textDim, marginBottom: 14, letterSpacing: "0.04em", fontWeight: 500 }}>{group} › {section.title}</div>
          <h1 style={{ fontSize: "clamp(1.9rem, 3.5vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", color: C.white, lineHeight: 1.1, marginBottom: 20 }}>{section.title}</h1>
          <div style={{ height: 1, background: C.border, margin: "24px 0 36px" }} />
          {section.content}

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 80, paddingTop: 28, borderTop: `1px solid ${C.border}` }}>
            {prev ? (
              <button
                onClick={() => go(prev.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  padding: "16px 20px",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  flex: 1,
                  maxWidth: 260,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <FiChevronLeft size={18} color={C.blue} style={{ flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>Previous</div>
                  <div style={{ fontSize: 14, color: C.white, fontWeight: 500 }}>{prev.label}</div>
                </div>
              </button>
            ) : <span />}
            {next ? (
              <button
                onClick={() => go(next.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  padding: "16px 20px",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  flex: 1,
                  maxWidth: 260,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                  e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4, letterSpacing: "0.04em" }}>Next</div>
                  <div style={{ fontSize: 14, color: C.white, fontWeight: 500 }}>{next.label}</div>
                </div>
                <FiChevronRight size={18} color={C.blue} style={{ flexShrink: 0 }} />
              </button>
            ) : <span />}
          </div>
        </div>
      </main>

      {/* RIGHT TOC */}
      <aside className="sidebar-right" style={{ ...sidebarStyle, width: 175, minWidth: 175, flexShrink: 0, flexDirection: "column", padding: "28px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textDim, marginBottom: 16, paddingLeft: 2 }}>On this page</div>
        {section.headings.map((h) => {
          const id = toId(h);
          const isActive = activeHeading === id;
          return (
            <button
              key={h}
              onClick={() => scrollToHeading(h)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                fontSize: 13.5,
                lineHeight: 1.5,
                fontFamily: "inherit",
                color: isActive ? C.white : C.textMuted,
                padding: "6px 2px 6px 14px",
                background: "none",
                border: "none",
                borderLeft: isActive ? `2px solid ${C.blue}` : "none",
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "0 6px 6px 0",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.borderLeft = "2px solid rgba(255,255,255,0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = C.textMuted;
                  e.currentTarget.style.borderLeft = "none";
                }
              }}
            >
              {h}
            </button>
          );
        })}
      </aside>
    </div>
  );
}