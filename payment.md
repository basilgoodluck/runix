# Runix × Circle Nanopayments + Arc — Hackathon Plan

## Why Runix is a perfect fit

Runix is a machine-to-machine execution engine. Agents submit jobs (code execution,
HTTP actions, data scraping, stateful ops) and pay per execution. This maps directly
to the hackathon's "Usage-Based Compute Billing" track and partially to
"Agent-to-Agent Payment Loop".

The receipt system (Ed25519 signed, SHA-256 hashed) already provides cryptographic
proof of every execution — this is exactly the kind of verifiable billing evidence
judges will want to see.

---

## Track alignment

Primary: 🧮 Usage-Based Compute Billing
- Charge per job execution based on durationMs + memory used
- Price is calculated from real ExecutionResult data we already collect

Secondary: 🤖 Agent-to-Agent Payment Loop  
- Agents call Runix, Runix charges them per job
- Agents can themselves be data sources that get paid when their endpoints are hit
  via ActionExecutor

---

## What needs to be built (in order)

### 1. Circle Developer Account + Testnet Setup (do this first, today)
- Create account at developers.circle.com
- Get testnet USDC from the Circle Faucet
- Connect to Arc Testnet via MetaMask or QuickNode RPC
- This is not code — just account setup. Do it before anything else.

### 2. Wallet Service — engine/payments/wallet.service.ts (NEW FILE)
Use Circle Wallets API to create a wallet per agent on registration.
Each agent gets a Circle-managed wallet that holds their USDC balance.

What to implement:
- createAgentWallet(agentId) → Circle API → returns walletId + address
- getBalance(walletId) → returns USDC balance
- Store walletId against agentId in Redis (sessionManager pattern)

Circle SDK: @circle-fin/developer-controlled-wallets

### 3. Pricing Engine — engine/payments/pricing.service.ts (NEW FILE)
Calculate cost of a job from ExecutionResult.

Pricing model (simple, defensible to judges):
- Base fee:      $0.0001 per job (any type)
- Compute time:  $0.000001 per ms of durationMs
- Memory:        $0.000001 per MB of memoryUsedBytes (compute jobs only)
- Action jobs:   +$0.00005 flat (external HTTP call cost)
- Data jobs:     +$0.00005 flat
- Batch jobs:    sum of child job costs

Example:
  Python job, 500ms, 10MB memory used
  = 0.0001 + (500 × 0.000001) + (10 × 0.000001)
  = 0.0001 + 0.0005 + 0.00001
  = $0.00061 per execution

This is well under the $0.01 per-action requirement. Good for judges.

### 4. Payment Middleware — engine/payments/payment.middleware.ts (NEW FILE)
Runs before every job in route.ts.

Flow:
  1. Extract agentId from API key (map API key → agentId in config/Redis)
  2. Estimate job cost (from job type + expected timeout)
  3. Check agent wallet balance via Circle API
  4. If balance < estimated cost → reject with HTTP 402 Payment Required
  5. After job completes → call chargeAgent(agentId, actualCost, result)

### 5. Nanopayments Integration — engine/payments/nanopayment.service.ts (NEW FILE)
This is the core Circle integration.

How Nanopayments works:
- Agent signs an EIP-3009 authorization (signed USDC transfer message)
- You submit it to Circle Nanopayments API
- Circle validates signature, updates internal ledger instantly
- Actual on-chain settlement happens in background batches on Arc

What to implement:
- submitNanopayment(agentWalletId, amount, jobId) → Circle Nanopayments API
- verifyPayment(paymentId) → confirm payment was accepted
- The receipt we already generate (Ed25519 signed) pairs perfectly with this —
  attach the Nanopayments paymentId to the ExecutionReceipt

Circle Nanopayments SDK / API docs: https://developers.circle.com/w3s/nanopayments

### 6. x402 Payment Verification — engine/payments/x402.middleware.ts (NEW FILE)
x402 is the web-native payment standard used in this hackathon.

Flow:
  Request hits /api/execute
  → x402 middleware checks for Payment header
  → If missing → return 402 with payment requirements (amount, currency, address)
  → Agent pays via Nanopayments → resubmits request with Payment header
  → Middleware verifies payment → allows request through

This replaces or sits alongside the current API key auth for paying agents.

npm package: x402 (from the hackathon resources)

### 7. Arc Settlement Visibility — engine/payments/arc.service.ts (NEW FILE)
Judges require proof of 50+ on-chain transactions on Arc.

What to implement:
- After every Nanopayment, log the transaction reference
- Periodically (or on demand) trigger batch settlement to Arc via Circle Gateway
- Store Arc transaction hashes alongside job receipts
- Expose GET /api/payments/history endpoint showing job → cost → Arc tx hash

This gives judges the Arc Block Explorer proof they require.

### 8. Billing History Endpoint — engine/routes/billing.route.ts (NEW FILE)
Expose:
  GET /api/billing/balance     → agent's current USDC balance
  GET /api/billing/history     → list of jobs with costs and Arc tx hashes
  GET /api/billing/receipt/:id → full signed receipt for a specific job

This is the demo dashboard that proves economic activity to judges.

---

## Changes to existing files

### engine/execution/route.ts
After result is generated:
  1. Calculate cost via pricing.service
  2. Charge agent via nanopayment.service
  3. Attach paymentId to receipt
  4. Return result as normal

### engine/routes/execute.route.ts
Add x402 middleware before the execution handler.

### engine/execution/types.ts
Add to ExecutionResult:
  cost?: {
    usdc: number;        // amount charged in USDC
    breakdown: object;   // durationMs cost + memory cost + base fee
    paymentId?: string;  // Circle Nanopayments payment ID
    arcTxHash?: string;  // Arc settlement transaction hash
  }

### engine/config.ts
Add:
  circle: {
    apiKey: process.env.CIRCLE_API_KEY ?? "",
    entitySecret: process.env.CIRCLE_ENTITY_SECRET ?? "",
    walletSetId: process.env.CIRCLE_WALLET_SET_ID ?? "",
  }

### .env
Add:
  CIRCLE_API_KEY=
  CIRCLE_ENTITY_SECRET=
  CIRCLE_WALLET_SET_ID=

---

## What judges will see in the demo

1. Agent submits a compute job (Python code execution)
2. System checks agent USDC balance — sufficient
3. Job runs → returns stdout + durationMs + memoryUsedBytes
4. Charge calculated: $0.00061
5. Nanopayment submitted to Circle → instant confirmation
6. Signed receipt returned with paymentId attached
7. Open Arc Block Explorer → show batched settlement transaction
8. Hit GET /api/billing/history → show 50+ jobs with costs

This hits every judging requirement:
  ✅ Real per-action pricing ≤ $0.01
  ✅ 50+ on-chain transactions (run a load test script before demo)
  ✅ Margin explanation: at $0.00061/job, traditional gas fees of $0.01-0.05
     would make every job unprofitable. Nanopayments makes it viable.

---

## Load test script (to get 50+ transactions before demo)
Write a simple script that fires 60 compute jobs in sequence:
  for i in range(60):
      POST /api/execute { type: compute, language: python, code: "print(i)" }
      
Run it once before the demo. This generates 60 real jobs with 60 real payments
and 60 receipts. Arc settles them in batches so you get on-chain proof.

---

## npm packages to install
  @circle-fin/developer-controlled-wallets   ← Circle Wallets SDK
  x402                                        ← x402 payment standard
  viem                                        ← EVM interactions for Arc (EIP-3009 signing)

---

## Priority order
1. Circle account + testnet USDC (today, no code)
2. wallet.service.ts
3. pricing.service.ts  
4. nanopayment.service.ts
5. payment.middleware.ts + wire into route.ts
6. x402.middleware.ts
7. arc.service.ts + billing.route.ts
8. Load test script
9. Demo run

---

## Why this wins

Most hackathon projects will build toy demos with fake payment flows.
Runix already has:
  - Real sandboxed code execution (Docker containers)
  - Real resource tracking (CPU %, memory)
  - Cryptographically signed execution receipts (Ed25519)
  - A job queue with retries (BullMQ)
  - Deterministic run caching

Adding Circle Nanopayments on top of this is not a demo —
it is a real product. The receipts, the resource data, and the
pricing model are all production-grade. That is what wins.