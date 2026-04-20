import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "@/config";
import { store } from "@/state/store";
import type { JobCost } from "@/execution/types";
import logger from "@/lib/logger";

const PAYMENT_HISTORY_PREFIX = "payments:";
const ARC_TESTNET_USDC = "0x3600000000000000000000000000000000000000";

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: config.circle.apiKey,
    entitySecret: config.circle.entitySecret,
  });
}

// Attempt to deduct payment from agent wallet to system wallet
// Always fails silently — never blocks job result
export async function attemptPayment(
  agentWalletAddress: string,
  cost: JobCost,
  jobId: string,
  agentWalletId: string
): Promise<JobCost> {
  try {
    const client = getClient();
    const amountStr = cost.costUsd.toFixed(6);

    const tx = await client.createTransaction({
      blockchain: "ARC-TESTNET",
      walletAddress: agentWalletAddress,
      destinationAddress: config.circle.systemWalletAddress,
      amount: [amountStr],
      tokenAddress: ARC_TESTNET_USDC,
      fee: { type: "level", config: { feeLevel: "LOW" } },
    });

    const txId = tx.data?.id;
    if (!txId) return cost;

    // Store payment record for billing history
    const record = {
      jobId,
      txId,
      amount: amountStr,
      currency: "USDC",
      network: "ARC-TESTNET",
      timestamp: new Date().toISOString(),
    };

    await store.lpush(
      `${PAYMENT_HISTORY_PREFIX}${agentWalletId}`,
      JSON.stringify(record)
    );

    logger.info(`PaymentService: payment initiated jobId=${jobId} amount=${amountStr} USDC txId=${txId}`);

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