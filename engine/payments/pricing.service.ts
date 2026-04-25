import type { ExecutionResult } from "@/execution/types";
import { JobType } from "@/execution/types";

export interface PricingResult {
  costUsd: number;
  breakdown: {
    baseFee: number;
    computeTimeFee: number;
    memoryFee: number;
    typeFee: number;
  };
}

// Base fee applied to every job regardless of type
const BASE_FEES: Record<string, number> = {
  [JobType.COMPUTE]:  0.000003,
  [JobType.FILE]:     0.000003,
  [JobType.LLM]:      0.000010,
  [JobType.ACTION]:   0.000001,
  [JobType.DATA]:     0.000001,
  [JobType.STATEFUL]: 0.000001,
  [JobType.BATCH]:    0.000000, // batch cost = sum of child job costs
};

// Per-millisecond fee on top of base (compute-class jobs only)
const COMPUTE_TIME_FEE_PER_MS = 0.000000001; // $0.000001 per second

export function calculateCost(result: ExecutionResult): PricingResult {
  const baseFee = BASE_FEES[result.type] ?? 0.000001;

  // Only charge compute time for jobs that actually run code
  const isComputeClass =
    result.type === JobType.COMPUTE ||
    result.type === JobType.FILE ||
    result.type === JobType.LLM;

  const durationMs = result.durationMs ?? 0;
  const computeTimeFee = isComputeClass
    ? parseFloat((durationMs * COMPUTE_TIME_FEE_PER_MS).toFixed(8))
    : 0;

  // For batch, costUsd is already summed by BatchExecutor from child results.
  // We just attach a zero breakdown so the shape is consistent.
  if (result.type === JobType.BATCH) {
    const batchTotal = result.costUsd ?? 0;
    return {
      costUsd: parseFloat(batchTotal.toFixed(8)),
      breakdown: { baseFee: 0, computeTimeFee: 0, memoryFee: 0, typeFee: 0 },
    };
  }

  const total = baseFee + computeTimeFee;

  return {
    costUsd: parseFloat(total.toFixed(8)),
    breakdown: {
      baseFee:        parseFloat(baseFee.toFixed(8)),
      computeTimeFee: parseFloat(computeTimeFee.toFixed(8)),
      memoryFee:      0,
      typeFee:        0,
    },
  };
}