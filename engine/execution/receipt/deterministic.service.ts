import { store } from "@/state/store";
import { hashInput, hashCacheKey } from "./hash.service";
import type { Job, ExecutionResult } from "../types";
import logger from "@/lib/logger";

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export async function getCachedResult(job: Job): Promise<ExecutionResult | null> {
  const key = hashCacheKey(hashInput(job));
  const raw = await store.get(key);

  if (!raw) return null;

  logger.info(`Deterministic cache hit for job [${job.id}]`);
  return JSON.parse(raw) as ExecutionResult;
}

export async function cacheResult(job: Job, result: ExecutionResult): Promise<void> {
  const key = hashCacheKey(hashInput(job));
  await store.set(key, JSON.stringify(result), "EX", CACHE_TTL);
  logger.info(`Deterministic cache stored for job [${job.id}]`);
}