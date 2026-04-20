import { createHash } from "crypto";

export function hashInput(data: unknown): string {
  const normalized = JSON.stringify(data, Object.keys(data as object).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

export function hashOutput(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function hashCacheKey(inputHash: string): string {
  return `deterministic:${inputHash}`;
}