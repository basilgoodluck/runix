/**
 * scripts/register-runix-agent.ts
 *
 * Run ONCE to register the Runix engine as a verified agent on Arc via ERC-8004.
 * Appends RUNIX_ONCHAIN_AGENT_ID and RUNIX_REGISTRATION_TX to your .env
 *
 * Usage:
 *   node --env-file=.env --import=tsx scripts/register-runix-agent.ts
 */

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createPublicClient, http, parseAbiItem } from "viem";
import { arcTestnet } from "viem/chains";
import { appendFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config();

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const RUNIX_METADATA = {
  name: "Runix Execution Engine",
  description: "Machine-to-machine execution service. Run code, HTTP actions, data jobs, and stateful operations. Pay per execution in USDC.",
  agent_type: "execution_engine",
  capabilities: ["compute", "action", "data", "stateful", "batch", "file"],
  version: "1.0.0",
};

// For hackathon — use a placeholder IPFS URI or upload metadata first
const METADATA_URI = process.env["RUNIX_METADATA_URI"] ??
  "ipfs://bafkreibdi6623n3xpf7ymk62ckb4bo75o3qemwkpfvp5i25j66itxvsoei";

async function main() {
  const apiKey = process.env["CIRCLE_API_KEY"]!;
  const entitySecret = process.env["CIRCLE_ENTITY_SECRET"]!;


  const systemWalletAddress = process.env["CIRCLE_WALLET_ADDRESS"]!;

  if (!apiKey || !entitySecret || !systemWalletAddress) {
    throw new Error("CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, CIRCLE_WALLET_ADDRESS required in .env");
  }

  const client = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });

  const publicClient = createPublicClient({
    chain: arcTestnet,
    transport: http("https://rpc.testnet.arc.network"),
  });

  console.log("Registering Runix on Arc via ERC-8004...");
  console.log(`Wallet: ${systemWalletAddress}`);
  console.log(`Metadata: ${METADATA_URI}`);

  const tx = await client.createContractExecutionTransaction({
    walletAddress: systemWalletAddress,
    blockchain: "ARC-TESTNET",
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "register(string)",
    abiParameters: [METADATA_URI],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const txId = tx.data?.id;
  if (!txId) throw new Error("No transaction ID returned");

  console.log(`Transaction submitted: ${txId}`);
  console.log("Waiting for confirmation...");

  let txHash: string | undefined;
  const terminal = new Set(["COMPLETE", "FAILED", "CANCELLED", "DENIED"]);

  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data } = await client.getTransaction({ id: txId });
    const state = data?.transaction?.state;
    process.stdout.write(".");

    if (state && terminal.has(state)) {
      if (state !== "COMPLETE") throw new Error(`Transaction ${state}`);
      txHash = data?.transaction?.txHash;
      break;
    }
  }

  if (!txHash) throw new Error("Transaction timed out");

  console.log(`\nRegistered! txHash=${txHash}`);
  console.log(`Explorer: https://testnet.arcscan.app/tx/${txHash}`);

  // Get agentId from Transfer event
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  });

  const logs = await publicClient.getLogs({
    address: IDENTITY_REGISTRY as `0x${string}`,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ),
    args: { to: systemWalletAddress as `0x${string}` },
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  const agentId = logs[logs.length - 1]?.args.tokenId?.toString() ?? null;

  console.log(`On-chain Agent ID: ${agentId}`);

  // Append to .env
  const envPath = resolve(process.cwd(), ".env");
  appendFileSync(envPath, `\nRUNIX_ONCHAIN_AGENT_ID=${agentId}\n`);
  appendFileSync(envPath, `RUNIX_REGISTRATION_TX=${txHash}\n`);

  console.log("\nAppended to .env:");
  console.log(`  RUNIX_ONCHAIN_AGENT_ID=${agentId}`);
  console.log(`  RUNIX_REGISTRATION_TX=${txHash}`);
  console.log("\nDone. Run this script only once.");
}

main().catch((err) => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});