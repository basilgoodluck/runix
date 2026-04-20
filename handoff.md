# Runix — Handoff Note

## What this is
Runix is a machine-to-machine execution engine. Third-party agents register, get a Circle wallet, submit jobs via HTTP, and pay per execution in USDC on Arc Testnet. Think AWS Lambda but without deployment, with crypto-native payments and on-chain agent identity.

---

## Stack
- Node.js 20, TypeScript, ESM (bundled with esbuild)
- Express 5
- Redis (ioredis) — state, sessions, job queue
- BullMQ — job queue with per-type workers
- Dockerode — sandboxed code execution
- Circle SDK (@circle-fin/developer-controlled-wallets) — wallets, payments
- viem — read-only Arc blockchain queries (ERC-8004 agentId extraction)
- esbuild — compilation (not tsc directly)

---

## Project structure
```
engine/
  app.ts                        ← Express app, auth middleware, route mounting
  server.ts                     ← bootstrap: Redis, container pool, workers, HTTP
  config.ts                     ← all env vars

  agents/
    arc.reader.ts               ← viem: get agentId from logs, read contract state
    agent.registry.ts           ← ERC-8004 writes via Circle SDK
    agent.service.ts            ← create wallet + register + Redis storage

  execution/
    types.ts                    ← all job/result/agent types
    route.ts                    ← routes job → executor, wires payment + receipt + reputation
    executors/
      compute.executor.ts
      action.executor.ts
      data.executor.ts
      stateful.executor.ts
      batch.executor.ts
      file.executor.ts
      stream.executor.ts        ← SSE streaming for compute jobs
    sandbox/
      docker.runner.ts
      docker.config.ts
      container.pool.ts         ← pre-warmed containers per language
      container.stats.ts
      runtime.images.ts
    queue/
      job.queue.ts              ← BullMQ queue, enqueueJob(job, apiKey?)
      job.worker.ts             ← 6 workers, one per job type
      queue.config.ts
    receipt/
      receipt.service.ts        ← Ed25519 signing
      hash.service.ts           ← SHA-256 input/output hashing
      deterministic.service.ts  ← Redis cache for same-input jobs

  payments/
    pricing.service.ts          ← calculate USDC cost from ExecutionResult
    payment.service.ts          ← deduct from agent wallet via Circle SDK

  routes/
    execute.route.ts            ← POST /api/execute, POST /api/execute/stream
    agent.route.ts              ← POST /api/agents/register
    billing.route.ts            ← GET /api/billing/balance, GET /api/billing/history

  state/
    store.ts                    ← Redis client
    session.manager.ts

  lib/
    logger.ts
    error.ts
    utils.ts

scripts/
  register-runix-agent.ts       ← run ONCE to register Runix itself on Arc ERC-8004
```

---

## What is fully built and working
- POST /api/execute — all 6 job types (compute, action, data, stateful, batch, file)
- POST /api/execute/stream — real-time SSE streaming for compute jobs
- POST /api/agents/register — creates Circle wallet, registers on-chain via ERC-8004, returns apiKey
- GET /api/billing/balance — agent USDC balance
- GET /api/billing/history — payment history
- Docker sandbox — memory cap, CPU cap, PidsLimit, no network, readonly rootfs, capability drops
- Container pool — pre-warmed per language, replenishes after each job
- Job queue — BullMQ, 6 dedicated workers (one per job type)
- Signed execution receipts — Ed25519 + SHA-256
- Deterministic caching — same input → cached result
- Payment — attempt USDC deduction from agent wallet after each job (fail silently)
- Reputation — record ERC-8004 reputation on Arc after successful compute jobs
- Security — helmet, rate limiting, payload size limits, content-type enforcement, auth validates both system key and agent keys

---

## What still needs to be done

### 1. SDK for client agents (separate service/package)
Agents need a way to interact with Runix without building raw HTTP calls.
This should be a separate npm package or service that wraps:
- `POST /api/agents/register` — register and get API key + wallet address
- `POST /api/execute` — submit jobs
- `POST /api/execute/stream` — stream compute jobs
- `GET /api/billing/balance` — check balance
- `GET /api/billing/history` — payment history
- A simple CLI or SDK class: `const runix = new RunixClient({ apiKey })`

### 2. RUNIX_VALIDATOR_WALLET_ADDRESS
ERC-8004 requires the reputation validator to be a different wallet than the agent owner.
Currently `route.ts` reads `process.env.RUNIX_VALIDATOR_WALLET_ADDRESS`.
You need to:
- Create a second Circle wallet (run the create-wallet script again)
- Fund it with testnet USDC for gas
- Add `RUNIX_VALIDATOR_WALLET_ADDRESS=0x...` to `.env`

### 3. Run the Runix registration script
```bash
node --env-file=.env --import=tsx scripts/register-runix-agent.ts
```
This registers Runix on Arc and appends `RUNIX_ONCHAIN_AGENT_ID` and `RUNIX_REGISTRATION_TX` to `.env`.

### 4. x402 payment standard (optional but recommended for hackathon)
Currently payments go through Circle SDK direct transfer.
The x402 standard (install: `@circle-fin/x402-batching`) allows agents to attach
a signed payment header to every request — no prior account balance needed.
This is the cleaner agentic commerce pattern the hackathon expects.
To add it: wrap `/api/execute` with `createGatewayMiddleware` from `@circle-fin/x402-batching/server`
and update the client SDK to use `GatewayClient` for payment signing.

### 5. Build and deploy
```bash
npm run build
docker compose up --build -d
```

### 6. Load test for 50+ transactions (hackathon requirement)
Submit 60 jobs via Postman or a simple script to generate 50+ payment records on Arc.

---

## .env fields required
```
PORT=2345
NODE_ENV=development
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
API_KEY=                          ← system API key
TLS_ENABLED=false
RECEIPT_PRIVATE_KEY=              ← Ed25519 private key (base64)
DETERMINISTIC_CACHE=true
CIRCLE_API_KEY=
CIRCLE_ENTITY_SECRET=
CIRCLE_WALLET_SET_ID=
CIRCLE_WALLET_ID=
CIRCLE_WALLET_ADDRESS=            ← system receiving wallet
POOL_SIZE_PER_LANGUAGE=1
ARC_TESTNET_RPC=https://rpc.testnet.arc.network
RUNIX_METADATA_URI=               ← IPFS URI for Runix agent metadata
RUNIX_ONCHAIN_AGENT_ID=           ← set after running register script
RUNIX_REGISTRATION_TX=            ← set after running register script
RUNIX_VALIDATOR_WALLET_ADDRESS=   ← second Circle wallet for reputation recording
```

---

## npm packages to install (if not already)
```bash
npm install bullmq viem @circle-fin/developer-controlled-wallets @circle-fin/x402-batching @x402/core @x402/evm
```

---

## API quick reference
```
POST   /api/agents/register          ← public, no auth required
POST   /api/execute                  ← requires API key
POST   /api/execute/stream           ← requires API key, returns SSE
GET    /api/billing/balance          ← requires agent API key
GET    /api/billing/history          ← requires agent API key
GET    /health                       ← no auth
```