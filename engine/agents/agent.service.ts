import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { randomUUID } from "crypto";
import { config } from "@/config";
import { store } from "@/state/store";
import { registerAgentOnChain } from "./agent.registry";
import type { AgentInfo } from "@/execution/types";
import logger from "@/lib/logger";
import { prisma } from "@/prisma/prisma";

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

  const { txHash, onchainAgentId } = await registerAgentOnChain(
    wallet.address,
    metadataUri
  );

  const agentId = randomUUID();
  const apiKey = generateApiKey();

  const agent: AgentInfo = {
    agentId,
    ...(onchainAgentId ? { onchainAgentId } : {}),
    txHash,
    walletId: wallet.id,
    walletAddress: wallet.address,
    apiKey,
    metadataUri,
    createdAt: Date.now(),
  };

  // persist to postgres
  await prisma.agent.create({
    data: {
      id:             agentId,
      apiKey,
      walletId:       wallet.id,
      walletAddress:  wallet.address,
      onchainAgentId: onchainAgentId ?? "",
      txHash,
      metadataUri,
      createdAt:      new Date(),
    },
  });

  // keep redis for fast api key lookup on every request
  await store.set(`apikey:${apiKey}`, agentId);

  logger.info(
    `AgentService: agent registered agentId=${agentId} onchainId=${onchainAgentId}`
  );

  return agent;
}

export async function getAgentByApiKey(apiKey: string): Promise<AgentInfo | null> {
  // redis first - fast path on every authenticated request
  const agentId = await store.get(`apikey:${apiKey}`);
  if (!agentId) return null;
  return getAgentById(agentId);
}

export async function getAgentById(agentId: string): Promise<AgentInfo | null> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) return null;

  return {
    agentId:        agent.id,
    apiKey:         agent.apiKey,
    walletId:       agent.walletId,
    walletAddress:  agent.walletAddress,
    onchainAgentId: agent.onchainAgentId ?? "",
    txHash:         agent.txHash ?? "",
    metadataUri:    agent.metadataUri,
    createdAt:      agent.createdAt.getTime(),
  };
}

export async function getAgentBalance(walletId: string): Promise<string> {
  const client = getClient();
  const balances = await client.getWalletTokenBalance({ id: walletId });
  const usdc = balances.data?.tokenBalances?.find(
    (b) => b.token?.symbol === "USDC"
  );
  return usdc?.amount ?? "0";
}