import type { ExecutionResult } from "@/execution/types";
import { JobType } from "@/execution/types";

const BASE_FEE         = 0.000003;
const COMPUTE_TIME_FEE = 0.000001;
const MEMORY_FEE       = 0.000001;
const ACTION_TYPE_FEE  = 0.000001;
const DATA_TYPE_FEE    = 0.000001;

export interface PricingResult {
  costUsd: number;
  breakdown: {
    baseFee: number;
    computeTimeFee: number;
    memoryFee: number;
    typeFee: number;
  };
}

export function calculateCost(result: ExecutionResult): PricingResult {
  const computeTimeFee = result.durationMs * COMPUTE_TIME_FEE;

  const memoryFee = result.resources
    ? (result.resources.memoryUsedBytes / (1024 * 1024)) * MEMORY_FEE
    : 0;

  let typeFee = 0;
  if (result.type === JobType.ACTION) typeFee = ACTION_TYPE_FEE;
  if (result.type === JobType.DATA)   typeFee = DATA_TYPE_FEE;

  const total = BASE_FEE + computeTimeFee + memoryFee + typeFee;

  return {
    costUsd: parseFloat(total.toFixed(8)),
    breakdown: {
      baseFee:        parseFloat(BASE_FEE.toFixed(8)),
      computeTimeFee: parseFloat(computeTimeFee.toFixed(8)),
      memoryFee:      parseFloat(memoryFee.toFixed(8)),
      typeFee:        parseFloat(typeFee.toFixed(8)),
    },
  };
}