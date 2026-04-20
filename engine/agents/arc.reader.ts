import { createPublicClient, http, parseAbiItem, getContract } from "viem";
import { arcTestnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env["ARC_TESTNET_RPC"] ?? "https://rpc.testnet.arc.network"),
});

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as const;
const VALIDATION_REGISTRY = "0x8004Cb1BF31DAf7788923b405b754f57acEB4272" as const;

const identityAbi = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "tokenURI",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const validationAbi = [
  {
    name: "getValidationStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "requestHash", type: "bytes32" }],
    outputs: [
      { name: "validatorAddress", type: "address" },
      { name: "agentId", type: "uint256" },
      { name: "response", type: "uint8" },
      { name: "responseHash", type: "bytes32" },
      { name: "tag", type: "string" },
      { name: "lastUpdate", type: "uint256" },
    ],
  },
] as const;

// Get on-chain agentId from Transfer event after registration
export async function getAgentIdFromTx(
  txHash: `0x${string}`,
  ownerAddress: `0x${string}`
): Promise<string | null> {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const fromBlock = receipt.blockNumber;
    const toBlock = receipt.blockNumber;

    const logs = await publicClient.getLogs({
      address: IDENTITY_REGISTRY,
      event: parseAbiItem(
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ),
      args: { to: ownerAddress },
      fromBlock,
      toBlock,
    });

    if (logs.length === 0) return null;
    return logs[logs.length - 1]?.args.tokenId?.toString() ?? null;
  } catch {
    return null;
  }
}

// Read agent identity from contract
export async function getAgentIdentity(onchainAgentId: string) {
  const contract = getContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    client: publicClient,
  });

  const [owner, tokenURI] = await Promise.all([
    contract.read.ownerOf([BigInt(onchainAgentId)]),
    contract.read.tokenURI([BigInt(onchainAgentId)]),
  ]);

  return { owner, tokenURI };
}

// Verify validation status
export async function getValidationStatus(requestHash: `0x${string}`) {
  const contract = getContract({
    address: VALIDATION_REGISTRY,
    abi: validationAbi,
    client: publicClient,
  });

  const [validatorAddress, agentId, response, , tag] =
    await contract.read.getValidationStatus([requestHash]);

  return {
    validatorAddress,
    agentId: agentId.toString(),
    passed: response === 100,
    tag,
  };
}