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
  text: "rgba(255,255,255,0.75)",      // much brighter
  textMuted: "rgba(255,255,255,0.55)", // previously 0.32
  textDim: "rgba(255,255,255,0.3)",    // previously 0.16
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

// Removed AI marker (▸) – using standard disc bullet
function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: "1.2rem", marginBottom: 18, listStyle: "disc" }}>
      {items.map(s => (
        <li key={s} style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.text, lineHeight: 1.85, marginBottom: 8 }}>
          {s}
        </li>
      ))}
    </ul>
  );
}

function OL({ items }: { items: string[] }) {
  return (
    <ol style={{ paddingLeft: "1.2rem", marginBottom: 18 }}>
      {items.map((s, i) => (
        <li key={s} style={{ fontSize: "clamp(14px, 2vw, 16px)", color: C.text, lineHeight: 1.85, marginBottom: 8 }}>
          {s}
        </li>
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
      <P>Runix is a machine‑to‑machine execution engine. Agents register an identity on the Arc blockchain, receive a Circle‑managed USDC wallet, and submit jobs over HTTP — paying per execution in USDC with no subscriptions and no pre‑provisioned infrastructure.</P>
      <P>Think of it as AWS Lambda without the deployment step, with crypto‑native payments and on‑chain identity built in.</P>
      <H2 id="how-it-works">How it works</H2>
      <OL items={["Register — call POST /api/agents/register. You get an API key and wallet address.", "Fund — deposit USDC to your wallet on Arc Testnet.", "Execute — submit jobs via SDK or HTTP. Runix sandboxes, runs, and returns a signed result.", "Pay — USDC is deducted from your wallet per execution."]} />
      <Callout type="info">Execution receipts are Ed25519‑signed with SHA‑256 hashed inputs and outputs — every result is cryptographically auditable.</Callout>
      <H2 id="when-to-use-it">When to use it</H2>
      <UL items={["Autonomous agents that need to run code or call APIs inside a decision loop", "Event‑driven systems with bursty, unpredictable compute needs", "Machine‑to‑machine value exchange without human billing", "On‑chain identity and verifiable execution history"]} />
    </>),
  },
  installation: {
    title: "Installation",
    headings: ["npm", "Requirements"],
    content: (<>
      <P>The Runix SDK wraps all HTTP endpoints and handles auth, streaming, and error handling.</P>
      <H2 id="npm">npm</H2>
      <CodeBlock lang="bash">{`npm install @runix/sdk\n# or\nyarn add @runix/sdk`}</CodeBlock>
      <Callout type="tip">Full TypeScript types included. No extra @types package needed. ESM and CJS both supported.</Callout>
      <H2 id="requirements">Requirements</H2>
      <UL items={["Node.js 18+", "A Runix API key — see Authentication", "USDC on Arc Testnet in your wallet"]} />
    </>),
  },
  authentication: {
    title: "Authentication",
    headings: ["Register your agent", "Using your key"],
    content: (<>
      <P>Runix uses API keys tied to on‑chain identities. Registration creates your API key and Circle wallet at the same time.</P>
      <H2 id="register-your-agent">Register your agent</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";\n\nconst { apiKey, walletAddress, agentId } = await RunixClient.register({\n  name: "my-agent",\n});\n\nconsole.log(apiKey);        // rk_live_...\nconsole.log(walletAddress); // 0x...`}</CodeBlock>
      <Callout type="warning">Never commit your API key to source control. Use environment variables.</Callout>
      <H2 id="using-your-key">Using your key</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,\n});`}</CodeBlock>
      <P>The key is sent as a Bearer token on every request. All endpoints except <IC>/agents/register</IC> require it.</P>
    </>),
  },
  quickstart: {
    title: "Quickstart",
    headings: ["Register", "Fund your wallet", "Run your first job"],
    content: (<>
      <P>Zero to a running execution in under five minutes.</P>
      <H2 id="register">1. Register</H2>
      <CodeBlock lang="ts">{`const { apiKey, walletAddress } = await RunixClient.register({\n  name: "quickstart-agent",\n});`}</CodeBlock>
      <H2 id="fund-your-wallet">2. Fund your wallet</H2>
      <P>Send testnet USDC to your <IC>walletAddress</IC> on Arc Testnet using the Arc faucet or Circle Gateway.</P>
      <H2 id="run-your-first-job">3. Run your first job</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey });\n\nconst result = await runix.compute({\n  runtime: "python",\n  code: "print(21 * 2)",\n});\n\nconsole.log(result.stdout);      // "42"\nconsole.log(result.duration_ms); // e.g. 38\nconsole.log(result.cost_usd);    // e.g. 0.000003`}</CodeBlock>
      <Callout type="tip">Check result.status before reading result.stdout. "error" means the code ran but exited non‑zero.</Callout>
    </>),
  },
  "sdk-overview": {
    title: "SDK Overview",
    headings: ["Client setup", "Response shape", "Error handling"],
    content: (<>
      <P><IC>RunixClient</IC> is the single entry point for all SDK operations.</P>
      <H2 id="client-setup">Client setup</H2>
      <CodeBlock lang="ts">{`import { RunixClient } from "@runix/sdk";\n\nconst runix = new RunixClient({\n  apiKey: process.env.RUNIX_API_KEY,\n  baseUrl: "https://runix.basilgoodluck.com",\n  timeout: 30_000,\n});`}</CodeBlock>
      <H2 id="response-shape">Response shape</H2>
      <CodeBlock lang="ts">{`interface ExecutionResult {\n  id: string;\n  status: "done" | "error" | "timeout" | "cached";\n  stdout: string;\n  stderr: string;\n  duration_ms: number;\n  cost_usd: number;\n  session_id: string | null;\n  cached: boolean;\n  receipt: {\n    id: string;\n    input_hash: string;\n    output_hash: string;\n    signature: string;\n    timestamp: number;\n  };\n}`}</CodeBlock>
      <H2 id="error-handling">Error handling</H2>
      <CodeBlock lang="ts">{`import { RunixError } from "@runix/sdk";\n\ntry {\n  const result = await runix.compute({ runtime: "python", code: "..." });\n} catch (err) {\n  if (err instanceof RunixError) {\n    console.log(err.code);\n    console.log(err.status);\n  }\n}`}</CodeBlock>
    </>),
  },
  "sdk-compute": {
    title: "runix.compute()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Run arbitrary code in an isolated Docker sandbox. Memory‑capped, CPU‑capped, no network access, read‑only filesystem.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[{ name: "runtime", type: "Runtime", req: true, desc: '"python" | "node" | "go"' }, { name: "code", type: "string", req: true, desc: "Source code to execute" }, { name: "stdin", type: "string", req: false, desc: "Input piped to stdin" }, { name: "timeout_ms", type: "number", req: false, desc: "Max execution time. Default: 10000" }, { name: "env", type: "Record<string,string>", req: false, desc: "Environment variables injected into the sandbox" }]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.compute({\n  runtime: "node",\n  code: \`const nums = [1,2,3,4,5];\nconst avg = nums.reduce((a,b)=>a+b)/nums.length;\nconsole.log(avg);\`,\n  timeout_ms: 5000,\n});\n\nconsole.log(result.stdout); // "3"`}</CodeBlock>
    </>),
  },
  "sdk-action": {
    title: "runix.action()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Call any external HTTP service through Runix. Handles retries on 5xx and timeout enforcement.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[{ name: "url", type: "string", req: true, desc: "Full URL of the service to call" }, { name: "method", type: "string", req: false, desc: '"GET" | "POST" | "PUT" | "DELETE". Default: "GET"' }, { name: "headers", type: "Record<string,string>", req: false, desc: "Request headers" }, { name: "body", type: "unknown", req: false, desc: "Request body — auto‑serialized to JSON" }, { name: "retries", type: "number", req: false, desc: "Retry count on 5xx. Default: 2" }]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.action({\n  url: "https://api.example.com/data",\n  method: "GET",\n  headers: { Authorization: \`Bearer \${token}\` },\n});\n\nconst data = JSON.parse(result.stdout);`}</CodeBlock>
    </>),
  },
  "sdk-data": {
    title: "runix.data()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Fetch and parse structured data sources. Results come back ready to use.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[{ name: "source", type: "string", req: true, desc: "URL or data source identifier" }, { name: "format", type: "string", req: false, desc: '"json" | "csv" | "xml" — auto‑detected if omitted' }, { name: "query", type: "string", req: false, desc: "JSONPath filter applied to the result" }]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const result = await runix.data({\n  source: "https://data.example.com/market.json",\n  format: "json",\n  query: "$.assets[?(@.symbol == 'USDC')]",\n});\n\nconst asset = JSON.parse(result.stdout);`}</CodeBlock>
    </>),
  },
  "sdk-stateful": {
    title: "runix.stateful()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Execute code with persistent session state across multiple steps. Sessions expire after 30 minutes of inactivity.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[{ name: "runtime", type: "Runtime", req: true, desc: '"python" | "node" | "go"' }, { name: "code", type: "string", req: true, desc: "Code to run in this step" }, { name: "session_id", type: "string", req: false, desc: "Continue an existing session. Omit to start a new one." }, { name: "timeout_ms", type: "number", req: false, desc: "Step timeout. Default: 10000" }]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const step1 = await runix.stateful({\n  runtime: "python",\n  code: "total = 0",\n});\n\nconst step2 = await runix.stateful({\n  session_id: step1.session_id!,\n  runtime: "python",\n  code: "total += 42\\nprint(total)",\n});\n\nconsole.log(step2.stdout); // "42"`}</CodeBlock>
    </>),
  },
  "sdk-batch": {
    title: "runix.batch()",
    headings: ["Parameters", "Example"],
    content: (<>
      <P>Submit multiple jobs in one call. Jobs run concurrently. Results come back in submission order.</P>
      <H2 id="parameters">Parameters</H2>
      <ParamTable rows={[{ name: "jobs", type: "Job[]", req: true, desc: "Array of compute, action, or data payloads" }, { name: "concurrency", type: "number", req: false, desc: "Max parallel jobs. Default: all at once" }]} />
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`const batch = await runix.batch({\n  jobs: [\n    { type: "compute", runtime: "python", code: "print(1 + 1)" },\n    { type: "compute", runtime: "node",   code: "console.log(2 + 2)" },\n  ],\n  concurrency: 2,\n});\n\nconsole.log(batch.results[0].stdout);\nconsole.log(batch.total_cost_usd);`}</CodeBlock>
    </>),
  },
  "sdk-stream": {
    title: "runix.stream()",
    headings: ["Event shape", "Example"],
    content: (<>
      <P>Stream compute output in real time via Server‑Sent Events. Same parameters as <IC>runix.compute()</IC>.</P>
      <H2 id="event-shape">Event shape</H2>
      <CodeBlock lang="ts">{`type StreamEvent =\n  | { type: "stdout";  data: string }\n  | { type: "stderr";  data: string }\n  | { type: "done";    id: string; duration_ms: number; cost_usd: number }\n  | { type: "error";   message: string };`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="ts">{`for await (const event of runix.stream({ runtime: "python", code: "..." })) {\n  if (event.type === "stdout") process.stdout.write(event.data);\n  if (event.type === "done")   console.log("cost:", event.cost_usd);\n}`}</CodeBlock>
    </>),
  },
  "api-register": {
    title: "POST /agents/register",
    headings: ["Request body", "Response", "Example"],
    content: (<>
      <P>Register a new agent. Creates a Circle USDC wallet and registers on‑chain via ERC‑8004. No API key required.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Badge label="POST" color="purple" />
        <Badge label="Public — no auth required" color="orange" />
      </div>
      <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/agents/register`}</CodeBlock>
      <H2 id="request-body">Request body</H2>
      <ParamTable rows={[{ name: "name", type: "string", req: true, desc: "Human‑readable agent name — stored on‑chain" }, { name: "metadata_uri", type: "string", req: false, desc: "IPFS URI pointing to agent metadata JSON" }]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{\n  "api_key": "rk_live_abc123...",\n  "wallet_address": "0xabc...",\n  "agent_id": "0x...",\n  "registration_tx": "0x..."\n}`}</CodeBlock>
      <Callout type="warning">Store your api_key immediately — it is only returned once.</Callout>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/agents/register \\\n  -H "Content-Type: application/json" \\\n  -d '{ "name": "my-agent" }'`}</CodeBlock>
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
      <ParamTable rows={[{ name: "type", type: "string", req: true, desc: '"compute" | "action" | "data" | "stateful" | "batch" | "file"' }, { name: "runtime", type: "string", req: false, desc: 'Required for compute, stateful, file. "python" | "node" | "go"' }, { name: "code", type: "string", req: false, desc: "Required for compute, stateful, file" }, { name: "url", type: "string", req: false, desc: "Required for action" }, { name: "session_id", type: "string", req: false, desc: "Continue a stateful session" }, { name: "timeout_ms", type: "number", req: false, desc: "Max execution time in ms. Default: 10000" }]} />
      <H2 id="job-types">Job types</H2>
      <UL items={["compute — run code in a sandboxed runtime", "action — call an external HTTP service", "data — fetch and parse a structured source", "stateful — code execution with persistent session", "batch — multiple jobs in one request", "file — code execution with virtual filesystem inputs"]} />
      <H2 id="response">Response</H2>
      <CodeBlock lang="json">{`{\n  "id": "exec_9f3a1c",\n  "status": "done",\n  "stdout": "42",\n  "stderr": "",\n  "duration_ms": 38,\n  "cost_usd": 0.000003,\n  "session_id": null,\n  "cached": false,\n  "receipt": {\n    "id": "rcpt_abc",\n    "input_hash": "sha256:...",\n    "output_hash": "sha256:...",\n    "signature": "ed25519:...",\n    "timestamp": 1714000000\n  }\n}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "python", "code": "print(21 * 2)" }'`}</CodeBlock>
    </>),
  },
  "api-stream": {
    title: "POST /execute/stream",
    headings: ["SSE event format", "Example"],
    content: (<>
      <P>Stream compute output via Server‑Sent Events. Only supports <IC>type: "compute"</IC>.</P>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <Badge label="POST" color="purple" />
        <Badge label="Requires API key" color="red" />
      </div>
      <CodeBlock lang="bash">{`POST https://runix.basilgoodluck.com/api/execute/stream\nAuthorization: Bearer <your-api-key>`}</CodeBlock>
      <H2 id="sse-event-format">SSE event format</H2>
      <CodeBlock lang="text">{`event: stdout\ndata: Step 1\n\nevent: done\ndata: {"id":"exec_abc","duration_ms":1240,"cost_usd":0.000003}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl -X POST https://runix.basilgoodluck.com/api/execute/stream \\\n  -H "Authorization: Bearer $RUNIX_API_KEY" \\\n  -H "Accept: text/event-stream" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "type": "compute", "runtime": "python", "code": "for i in range(5): print(i)" }'`}</CodeBlock>
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
      <CodeBlock lang="json">{`{\n  "balance_usd": "4.820000",\n  "wallet_address": "0xabc...",\n  "currency": "USDC",\n  "chain": "arc-testnet"\n}`}</CodeBlock>
      <H2 id="example">Example</H2>
      <CodeBlock lang="bash">{`curl https://runix.basilgoodluck.com/api/billing/balance \\\n  -H "Authorization: Bearer $RUNIX_API_KEY"`}</CodeBlock>
    </>),
  },
  "api-errors": {
    title: "Errors",
    headings: ["Error shape", "Status codes"],
    content: (<>
      <P>All errors return a consistent JSON shape. The SDK wraps these as <IC>RunixError</IC> instances.</P>
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
            {[["400","Bad request — missing or invalid parameters"],["401","Unauthorized — missing or invalid API key"],["403","Forbidden — key lacks required scope"],["408","Execution timed out"],["429","Rate limit exceeded"],["500","Internal server error"]].map(([code, msg]) => (
              <tr key={code} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "11px 14px 11px 0" }}><IC>{code}</IC></td>
                <td style={{ padding: "11px 0", fontSize: "clamp(13px, 1.8vw, 15px)", color: C.text }}>{msg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Callout type="warning">A 200 OK with status: "error" means the code ran but exited non‑zero — different from a 4xx/5xx HTTP error.</Callout>
    </>),
  },
  "guide-agents": {
    title: "Agent Integration",
    headings: ["Decision loop pattern", "Best practices"],
    content: (<>
      <P>Runix sits inside an agent's decision loop — called whenever the agent needs to act on the world rather than reason about it.</P>
      <H2 id="decision-loop-pattern">Decision loop pattern</H2>
      <CodeBlock lang="ts">{`const runix = new RunixClient({ apiKey: process.env.RUNIX_API_KEY });\n\nasync function agentLoop(task: string) {\n  while (true) {\n    const action = await llm.decide(task);\n    if (action.type === "done") break;\n\n    const result = await runix.compute({\n      runtime: action.runtime,\n      code: action.code,\n      timeout_ms: 15_000,\n    });\n\n    if (result.status === "error") {\n      task = \`Previous step failed: \${result.stderr}. Retry.\`;\n      continue;\n    }\n\n    task = incorporateResult(task, result.stdout);\n  }\n}`}</CodeBlock>
      <H2 id="best-practices">Best practices</H2>
      <UL items={["Store result.id — you can look up any past execution for auditing", "Set timeout_ms explicitly in production — don't rely on the default", "Use runix.batch() when your agent needs multiple independent results at once", "Check result.cached — repeated identical calls return instantly at no cost", "Monitor result.cost_usd per step to track spend in real time"]} />
    </>),
  },
  "guide-sandbox": {
    title: "Sandbox & Security",
    headings: ["Docker isolation", "What code cannot do"],
    content: (<>
      <P>Every compute, stateful, and file job runs inside a Docker container with strict isolation, with a pre‑warmed pool per language runtime.</P>
      <H2 id="docker-isolation">Docker isolation</H2>
      <UL items={["Read‑only root filesystem", "No network access from inside the container", "All Linux capabilities dropped", "PidsLimit enforced to prevent fork bombs", "Containers discarded after each job — no state leaks", "Memory and CPU caps enforced by Docker cgroup"]} />
      <Callout type="info">Container pools replenish automatically after each job. Under high concurrency, jobs queue in BullMQ until a container is available.</Callout>
      <H2 id="what-code-cannot-do">What code cannot do</H2>
      <UL items={["Make outbound network requests — use runix.action() instead", "Access the host filesystem", "Spawn privileged processes", "Persist files between separate compute jobs — use runix.stateful() or runix.file()"]} />
    </>),
  },
  "guide-billing": {
    title: "Billing & USDC",
    headings: ["How billing works", "Pricing", "Funding your wallet"],
    content: (<>
      <P>Runix charges per execution in USDC on Arc Testnet. Payment deducts from your Circle‑managed wallet immediately after each successful job.</P>
      <H2 id="how-billing-works">How billing works</H2>
      <OL items={["Your wallet holds a USDC balance on Arc Testnet", "After each execution, Runix calculates cost via pricing.service.ts", "A Circle SDK transfer deducts from your wallet to the Runix system wallet", "The amount appears in result.cost_usd and in your billing history"]} />
      <Callout type="info">Payment failures are currently silent — jobs succeed even if the deduction fails. This changes before mainnet.</Callout>
      <H2 id="pricing">Pricing</H2>
      <div style={{ overflowX: "auto", margin: "18px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Job type", "Cost"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 14px 10px 0", fontSize: 10, fontWeight: 600, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[["compute","$0.000003 per execution"],["action","$0.000001 per execution"],["data","$0.000001 per execution"],["stateful","$0.000002 per step"],["batch","Sum of individual job costs"],["file","$0.000003 per execution"]].map(([type, cost]) => (
              <tr key={type} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: "11px 14px 11px 0" }}><IC>{type}</IC></td>
                <td style={{ padding: "11px 0", fontSize: "clamp(13px, 1.8vw, 15px)", color: C.text }}>{cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <H2 id="funding-your-wallet">Funding your wallet</H2>
      <P>Send testnet USDC to your <IC>wallet_address</IC> on Arc Testnet. Use the Arc Testnet faucet or bridge via Circle Gateway from another supported chain.</P>
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
              <button onClick={() => setMobileNavOpen(false)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
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
          {/* Mobile top bar */}
          <div className="docs-mob-bar" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <span style={{ fontSize: 14, color: C.textMuted, fontWeight: 500 }}>{group} › {section.title}</span>
            <button onClick={() => setMobileNavOpen(true)} style={{ background: C.purpleFaint, border: `1px solid ${C.purpleBorder}`, borderRadius: 7, color: "rgba(167,139,250,0.9)", fontSize: 13, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              Menu
            </button>
          </div>

          <div style={{ maxWidth: 740, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12, letterSpacing: "0.04em", fontWeight: 500 }}>{group} › {section.title}</div>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: C.white, lineHeight: 1.1, marginBottom: 18 }}>{section.title}</h1>
            <div style={{ height: 1, background: C.border, margin: "20px 0 30px" }} />
            {section.content}

            {/* Pagination */}
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