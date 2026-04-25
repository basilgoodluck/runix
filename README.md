<div align="center">

<h1>Runix</h1>

<p>Machine-native execution engine. Agents register, fund a wallet, and pay per job — no subscriptions, no infrastructure, no overhead.</p>

<p>
  <a href="https://runix.basilgoodluck.com/docs"><img src="https://img.shields.io/badge/docs-live-7c3aed?style=flat-square" alt="Docs" /></a>
  <a href="https://runix.basilgoodluck.com"><img src="https://img.shields.io/badge/website-runix.basilgoodluck.com-7c3aed?style=flat-square" alt="Website" /></a>
  <img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/built%20for-Arc%20%C3%97%20Circle%20Hackathon-f59e0b?style=flat-square" alt="Hackathon" />
  <img src="https://img.shields.io/badge/payments-USDC%20on%20Arc-3b82f6?style=flat-square" alt="USDC on Arc" />
</p>

</div>

---

## What it is

Runix is a pay-per-execution compute network for autonomous agents and software systems. Each job — running code, calling an API, scraping data, reading or writing state — is independently priced, independently paid for in USDC, and returns a cryptographically signed receipt.

Think AWS Lambda without the deployment step, with on-chain identity and machine-native payments built in.

```
Agent registers  →  Gets API key + Circle wallet
Agent funds wallet  →  Deposits USDC on Arc Testnet
Agent submits job  →  Runix sandboxes, runs, returns signed result
Payment deducted  →  Circle SDK transfer, cost in result.costUsd
```

---

## Why this matters

Traditional compute billing aggregates usage into monthly plans or is gated by API quota bundles. That model breaks for autonomous agents — they need to pay per action, in real time, programmatically, without a human in the loop.

Runix plus Circle Nanopayments on Arc makes per-action pricing economically viable. A typical compute job costs $0.000003. At traditional gas fees of $0.01-0.05, that job would cost 3,000 to 16,000 times more to settle than it earned. Nanopayments eliminates that overhead entirely.

---

## Tracks (Arc x Circle Hackathon)

| Track | How Runix covers it |
|---|---|
| Usage-Based Compute Billing | Every job billed by durationMs and job type |
| Agent-to-Agent Payment Loop | Third-party agents call and pay Runix per execution |
| Per-API Monetization Engine | Every POST /api/execute is a paid API call |

---

## Features

**Execution**
- Multi-language Docker sandbox: Python, Node.js, TypeScript, Go, Rust, Bash, C, Java, Ruby, PHP
- External HTTP actions with 5xx retries
- URL fetch and CSS scraping
- Persistent key-value state with optional TTL
- File execution with virtual filesystem inputs
- Batch execution with configurable concurrency
- Real-time streaming via SSE

**Payments**
- USDC payments on Arc Testnet via Circle SDK
- x402 payment middleware on all execution endpoints
- Per-job pricing with full cost breakdown in every result
- Payment history and balance endpoints

**Trust**
- Ed25519 signed execution receipts
- SHA-256 hashed inputs and outputs
- ERC-8004 on-chain agent identity and reputation
- Deterministic caching — same input returns instantly at no cost

---

## Quickstart

**1. Install the SDK**

```bash
npm install @basilgoodluck/runix-sdk
```

**2. Register your agent**

```ts
import { RunixClient } from "@basilgoodluck/runix-sdk";

const agent = await RunixClient.register({
  metadataUri: "https://your-metadata-uri.com/agent.json",
});

console.log(agent.apiKey);        // rx_abc123... — save this, shown once
console.log(agent.walletAddress); // 0x...        — fund this with testnet USDC
```

**3. Fund your wallet**

Send testnet USDC to your `walletAddress` on Arc Testnet via the [Arc faucet](https://faucet.arc.network).

**4. Run a job**

```ts
const runix = new RunixClient({ apiKey: agent.apiKey });

const result = await runix.compute({
  runtime: "node",
  code: `console.log(21 * 2)`,
});

console.log(result.stdout);    // "42"
console.log(result.costUsd);   // 0.000003
console.log(result.receipt);   // Ed25519 signed proof
```

---

## SDK reference

| Method | What it does |
|---|---|
| `runix.compute()` | Run code in an isolated Docker sandbox |
| `runix.action()` | Call an external HTTP service |
| `runix.data()` | Fetch or scrape a URL |
| `runix.stateful()` | Get, set, or delete persistent key-value state |
| `runix.batch()` | Submit multiple jobs concurrently |
| `runix.stream()` | Stream compute output in real time via SSE |
| `runix.llm()` | Call an LLM provider, billed and receipted like any other job |

Full documentation at [runix.basilgoodluck.com/docs](https://runix.basilgoodluck.com/docs).

---

## API endpoints

```
POST /api/agents/register   — create agent, wallet, and on-chain identity
POST /api/execute           — submit a job (requires API key + x402 payment)
POST /api/execute/stream    — stream compute output via SSE
GET  /api/billing/balance   — USDC balance for your agent wallet
GET  /api/billing/history   — payment history with job IDs and costs
```

All execution endpoints enforce x402 payment headers. The SDK handles this automatically.

---

## Pricing

| Job type | Cost |
|---|---|
| compute | $0.000003 per execution |
| action | $0.000001 per execution |
| data | $0.000001 per execution |
| stateful | $0.000001 per operation |
| batch | Sum of individual job costs |
| file | $0.000003 per execution |
| llm | $0.000010 per call |

Every job is well under the $0.01 per-action threshold. Traditional gas fees of $0.01-0.05 would make this model completely unworkable. Circle Nanopayments on Arc is what makes it viable.

---

## Execution receipts

Every result includes a signed receipt:

```json
{
  "id": "rcpt_abc",
  "inputHash": "sha256:...",
  "outputHash": "sha256:...",
  "signature": "ed25519:...",
  "timestamp": 1714000000
}
```

Receipts prove what ran, what the inputs were, and what the output was — tamper-evident and independently verifiable.

---

## Architecture

```
POST /api/execute
  → Auth middleware (API key validation)
  → x402 payment middleware (validates USDC payment header)
  → Job assembled → BullMQ queue
  → Worker routes to executor (compute / action / data / stateful / batch / file / llm)
  → Docker sandbox runs job (for compute, file)
  → Receipt generated (Ed25519 + SHA-256)
  → Cost calculated, Circle SDK deducts from agent wallet
  → ERC-8004 reputation updated on Arc (async)
  → Result returned
```

**Stack:** Node.js, TypeScript, Express, Docker, BullMQ, Redis, Circle SDK, viem, Arc Testnet

---

## Running locally

**Prerequisites:** Node.js 18+, Docker, Redis

```bash
git clone https://github.com/basilgoodluck/runix
cd runix
npm install
cp .env.example .env   # fill in Circle + Arc credentials
docker-compose up -d   # starts Redis + sandbox executor containers
npm run dev
```

Required environment variables:

```
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_WALLET_SET_ID=
CIRCLE_WALLET_ID=
CIRCLE_WALLET_ADDRESS=
RECEIPT_PRIVATE_KEY=      # Ed25519 private key, base64
ARC_TESTNET_RPC=https://rpc.testnet.arc.network
RUNIX_METADATA_URI=
```

One-time setup after first run:

```bash
npx ts-node scripts/register-runix-agent.ts
```

This registers Runix itself on Arc via ERC-8004 and writes `RUNIX_ONCHAIN_AGENT_ID` and `RUNIX_REGISTRATION_TX` to your `.env`.

---

## Security

- Sandbox containers have no network access, read-only filesystems, dropped Linux capabilities, PID limits, and memory and CPU caps
- Containers are discarded after each job — no state leaks between executions
- Rate limiting, payload size limits, and content-type enforcement on all endpoints
- API keys are hashed before storage and never returned after registration

---

## Contributing

Contributions are welcome. Open an issue first for non-trivial changes so the direction can be discussed before you invest time in a PR.

**Areas that would benefit from help:**
- Additional language runtimes in the Docker sandbox
- Dashboard UI (Next.js, consumes the SDK)
- Job history endpoint (`GET /api/jobs`)
- PostgreSQL migration from Redis for persistent storage
- Additional LLM provider support in `runix.llm()`

**To contribute:**

```bash
git clone https://github.com/basilgoodluck/runix
cd runix && npm install
git checkout -b your-feature
# make changes
npm test
git push origin your-feature
# open a pull request
```

Please follow the existing code style. TypeScript strict mode is enabled. No `any` types without a comment explaining why.

---

## License

<img src="https://img.shields.io/badge/license-MIT-22c55e?style=flat-square" alt="MIT" />

MIT License. Copyright (c) 2026 Basil Goodluck.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

---

## Contact

Built by [Basil Goodluck](https://basilgoodluck.com) for the Arc x Circle Agentic Economy Hackathon, April 2026.

[Website](https://runix.basilgoodluck.com) · [Docs](https://runix.basilgoodluck.com/docs) · [GitHub](https://github.com/basilgoodluck/runix)