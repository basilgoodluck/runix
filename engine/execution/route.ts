import { type Job, JobType, JobStatus, type ExecutionResult } from "./types";
import { ComputeExecutor } from "./executors/compute.executor";
import { ActionExecutor } from "./executors/action.executor";
import { DataExecutor } from "./executors/data.executor";
import { StatefulExecutor } from "./executors/stateful.executor";
import { BatchExecutor } from "./executors/batch.executor";
import { FileExecutor } from "./executors/file.executor";
import { generateReceipt } from "./receipt/receipt.service";
import { getCachedResult, cacheResult } from "./receipt/deterministic.service";
import { calculateCost } from "@/payments/pricing.service";
import { attemptPayment } from "@/payments/payment.service";
import { recordReputation } from "@/agents/agent.registry";
import { getAgentByApiKey } from "@/agents/agent.service";
import { config } from "@/config";
import logger from "@/lib/logger";
import { LlmExecutor } from "./executors/llm.executor";

const compute  = new ComputeExecutor();
const action   = new ActionExecutor();
const data     = new DataExecutor();
const stateful = new StatefulExecutor();
const batch    = new BatchExecutor();
const file     = new FileExecutor();
const llm      = new LlmExecutor();

export async function routeJob(job: Job, apiKey?: string): Promise<ExecutionResult> {
  logger.info(`Routing job [${job.id}] type=${job.type}`);

  const cacheable = job.type !== JobType.STATEFUL && job.type !== JobType.BATCH;

  if (cacheable && config.receipt.deterministicCache) {
    const cached = await getCachedResult(job);
    if (cached) return { ...cached, id: job.id, cached: true };
  }

  let result: ExecutionResult;

  switch (job.type) {
    case JobType.COMPUTE:  result = await compute.run(job);  break;
    case JobType.ACTION:   result = await action.run(job);   break;
    case JobType.DATA:     result = await data.run(job);     break;
    case JobType.STATEFUL: result = await stateful.run(job); break;
    case JobType.BATCH:    result = await batch.run(job);    break;
    case JobType.FILE:     result = await file.run(job);     break;
    case JobType.LLM:      result = await llm.run(job);      break;
    default:
      throw new Error(`Unknown job type: ${(job as Job).type}`);
  }

  // Generate signed receipt
  if (config.receipt.privateKey) {
    result.receipt = generateReceipt(job, result);
  }

  // Cache deterministic result
  if (cacheable && config.receipt.deterministicCache) {
    await cacheResult(job, result);
  }

  // Calculate cost and attach flat fields
  const pricing = calculateCost(result);
  result.costUsd = pricing.costUsd;
  result.costBreakdown = pricing.breakdown;

  // Payment + reputation — only if agent API key provided
  if (apiKey) {
    const agent = await getAgentByApiKey(apiKey).catch(() => null);

    if (agent) {
      const res = await attemptPayment(
        agent.walletAddress,
        { costUsd: pricing.costUsd, breakdown: pricing.breakdown },
        job.id,
        agent.walletId
      );
      if (res.paymentId) result.paymentId = res.paymentId;

      const validatorWallet = process.env["RUNIX_VALIDATOR_WALLET_ADDRESS"];
      if (
        job.type === JobType.COMPUTE &&
        result.status === JobStatus.DONE &&
        agent.onchainAgentId &&
        validatorWallet &&
        validatorWallet !== agent.walletAddress
      ) {
        recordReputation(
          validatorWallet,
          agent.onchainAgentId,
          95,
          "compute_execution"
        ).catch((err) => {
          logger.warn(`Reputation recording failed: ${err.message}`);
        });
      }
    }
  }

  return result;
}