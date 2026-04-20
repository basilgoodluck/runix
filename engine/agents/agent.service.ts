import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "crypto";
import { config } from "@/config";
import { store } from "@/state/store";
import { registerAgentOnChain } from "./agent.registry";
import type { AgentInfo } from "@/execution/types";
import logger from "@/lib/logger";

const AGENT_PREFIX = "agent:";
const API_KEY_PREFIX = "apikey:";

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: config.circle.apiKey,
    entitySecret: config.circle.entitySecret,
  });
}

function generateApiKey(): string {
  return `rx_${randomUUID().replace(/-/g, "")}`;
}

export async function registerAgent(metadataUri: string): Promise<AgentInfo> {
  const client = getClient();

  logger.info("AgentService: creating Circle wallet for new agent");

  // Create a Circle wallet for the agent
  const walletsResponse = await client.createWallets({
    blockchains: ["ARC-TESTNET"],
    count: 1,
    walletSetId: config.circle.walletSetId,
    accountType: "EOA",
  });

  const wallet = walletsResponse.data?.wallets?.[0];
  if (!wallet?.id || !wallet.address) {
    throw new Error("Failed to create Circle wallet for agent");
  }

  logger.info(`AgentService: wallet created address=${wallet.address}`);

  // Register agent on-chain via ERC-8004
  const { txHash, onchainAgentId } = await registerAgentOnChain(
    wallet.address,
    metadataUri
  );

  const agentId = randomUUID();
  const apiKey = generateApiKey();

  const agent: AgentInfo = {
    agentId,
    onchainAgentId: onchainAgentId ?? undefined,
    txHash,
    walletId: wallet.id,
    walletAddress: wallet.address,
    apiKey,
    metadataUri,
    createdAt: Date.now(),
  };

  // Store agent data in Redis
  await store.set(`${AGENT_PREFIX}${agentId}`, JSON.stringify(agent));

  // Map API key → agentId for fast lookup on every request
  await store.set(`${API_KEY_PREFIX}${apiKey}`, agentId);

  logger.info(`AgentService: agent registered agentId=${agentId} onchainId=${onchainAgentId}`);

  return agent;
}

export async function getAgentByApiKey(apiKey: string): Promise<AgentInfo | null> {
  const agentId = await store.get(`${API_KEY_PREFIX}${apiKey}`);
  if (!agentId) return null;
  return getAgentById(agentId);
}

export async function getAgentById(agentId: string): Promise<AgentInfo | null> {
  const raw = await store.get(`${AGENT_PREFIX}${agentId}`);
  if (!raw) return null;
  return JSON.parse(raw) as AgentInfo;
}

export async function getAgentBalance(walletId: string): Promise<string> {
  const client = getClient();

  const balances = await client.getWalletTokenBalance({ id: walletId });
  const usdc = balances.data?.tokenBalances?.find(
    (b) => b.token?.symbol === "USDC"
  );

  return usdc?.amount ?? "0";
}