import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { config } from "@/config";
import { getAgentIdFromTx } from "./arc.reader";
import logger from "@/lib/logger";

const IDENTITY_REGISTRY   = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272";

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: config.circle.apiKey,
    entitySecret: config.circle.entitySecret,
  });
}

async function waitForTx(client: ReturnType<typeof getClient>, txId: string): Promise<string> {
  const terminal = new Set(["COMPLETE", "FAILED", "CANCELLED", "DENIED"]);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data } = await client.getTransaction({ id: txId });
    const state = data?.transaction?.state;
    const txHash = data?.transaction?.txHash;

    if (state && terminal.has(state)) {
      if (state !== "COMPLETE") throw new Error(`Transaction ${state}: ${txId}`);
      return txHash!;
    }
  }

  throw new Error(`Transaction timed out: ${txId}`);
}

export async function registerAgentOnChain(
  walletAddress: string,
  metadataUri: string
): Promise<{ txHash: string; onchainAgentId: string | null }> {
  const client = getClient();

  logger.info(`AgentRegistry: registering agent onchain wallet=${walletAddress}`);

  const tx = await client.createContractExecutionTransaction({
    walletAddress,
    blockchain: "ARC-TESTNET",
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "register(string)",
    abiParameters: [metadataUri],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const txId = tx.data?.id;
  if (!txId) throw new Error("No transaction ID returned from register()");

  const txHash = await waitForTx(client, txId);
  logger.info(`AgentRegistry: registered onchain txHash=${txHash}`);

  const onchainAgentId = await getAgentIdFromTx(
    txHash as `0x${string}`,
    walletAddress as `0x${string}`
  );

  return { txHash, onchainAgentId };
}

// Record reputation for an agent after a successful job
export async function recordReputation(
  validatorWalletAddress: string,
  onchainAgentId: string,
  score: number,
  tag: string
): Promise<void> {
  const client = getClient();
  const { keccak256, toHex } = await import("viem");
  const feedbackHash = keccak256(toHex(tag));

  const tx = await client.createContractExecutionTransaction({
    walletAddress: validatorWalletAddress,
    blockchain: "ARC-TESTNET",
    contractAddress: REPUTATION_REGISTRY,
    abiFunctionSignature:
      "giveFeedback(uint256,int128,uint8,string,string,string,string,bytes32)",
    abiParameters: [onchainAgentId, score.toString(), "0", tag, "", "", "", feedbackHash],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const txId = tx.data?.id;
  if (!txId) return;

  await waitForTx(client, txId).catch((err) => {
    logger.warn(`AgentRegistry: reputation recording failed — ${err.message}`);
  });
}