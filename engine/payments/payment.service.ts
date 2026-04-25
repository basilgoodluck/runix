import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "@/config";
import { store } from "@/state/store";
import type { JobCost } from "@/execution/types";
import logger from "@/lib/logger";

const PAYMENT_HISTORY_PREFIX = "payments:";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";

// How long to wait for CONFIRMED status before giving up (ms)
const CONFIRM_TIMEOUT_MS = 30_000;
const CONFIRM_POLL_MS    = 2_000;

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: config.circle.apiKey,
    entitySecret: config.circle.entitySecret,
  });
}

/**
 * Poll until the transaction reaches CONFIRMED or FAILED,
 * or until CONFIRM_TIMEOUT_MS elapses.
 * Returns the final status string.
 */
async function waitForConfirmation(
  client: ReturnType<typeof getClient>,
  txId: string
): Promise<string> {
  const deadline = Date.now() + CONFIRM_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, CONFIRM_POLL_MS));

    try {
      const res = await client.getTransaction({ id: txId });
      const status = res.data?.transaction?.state ?? "UNKNOWN";

      if (status === "CONFIRMED" || status === "COMPLETE") return "CONFIRMED";
      if (status === "FAILED" || status === "DENIED" || status === "CANCELLED") {
        return status;
      }
      // INITIATED / QUEUED / SENT — keep polling
    } catch (err: any) {
      logger.warn(`PaymentService: poll error txId=${txId} — ${err.message}`);
    }
  }

  return "TIMEOUT";
}

/**
 * Attempt to deduct payment from agent wallet to system wallet.
 * Waits for on-chain confirmation before returning.
 * Always fails silently — never blocks the job result.
 */
export async function attemptPayment(
  agentWalletAddress: string,
  cost: JobCost,
  jobId: string,
  agentWalletId: string
): Promise<JobCost> {
  try {
    const client = getClient();
    const amountStr = cost.costUsd.toFixed(6);

    // walletId (Circle UUID) — not walletAddress (0x...)
    // amounts is an array in the Circle SDK
    const tx = await client.createTransaction({
      walletId: agentWalletId,
      destinationAddress: config.circle.systemWalletAddress,
      amount: [amountStr],
      tokenAddress: ARC_TESTNET_USDC,
      fee: { type: "level", config: { feeLevel: "LOW" } },
    });

    const txId = tx.data?.id;
    if (!txId) {
      logger.warn(`PaymentService: no txId returned jobId=${jobId}`);
      return cost;
    }

    logger.info(`PaymentService: transaction initiated jobId=${jobId} txId=${txId} amount=${amountStr} USDC`);

    // Wait for on-chain confirmation
    const finalStatus = await waitForConfirmation(client, txId);
    logger.info(`PaymentService: transaction ${finalStatus} jobId=${jobId} txId=${txId}`);

    if (finalStatus !== "CONFIRMED") {
      logger.warn(`PaymentService: transaction did not confirm — status=${finalStatus} jobId=${jobId} txId=${txId}`);
      return cost;
    }

    // Store confirmed payment record
    const record = {
      jobId,
      txId,
      amount: amountStr,
      currency: "USDC",
      network: "ARC-TESTNET",
      status: "CONFIRMED",
      timestamp: new Date().toISOString(),
    };

    await store.lpush(
      `${PAYMENT_HISTORY_PREFIX}${agentWalletId}`,
      JSON.stringify(record)
    );

    return { ...cost, paymentId: txId };
  } catch (err: any) {
    logger.warn(`PaymentService: payment failed silently jobId=${jobId} — ${err.message}`);
    return cost;
  }
}

export async function getPaymentHistory(agentWalletId: string): Promise<unknown[]> {
  const raw = await store.lrange(`${PAYMENT_HISTORY_PREFIX}${agentWalletId}`, 0, 99);
  return raw.map((r) => JSON.parse(r));
}