import { createPrivateKey, sign } from "crypto";
import { config } from "@/config";
import { hashInput, hashOutput } from "./hash.service";
import type { Job, ExecutionResult, ExecutionReceipt } from "../types";

function getPrivateKey() {
  if (!config.receipt.privateKey) {
    throw new Error("RECEIPT_PRIVATE_KEY is not set in config");
  }

  return createPrivateKey({
    key: Buffer.from(config.receipt.privateKey, "base64"),
    format: "der",
    type: "pkcs8",
  });
}

export function generateReceipt(job: Job, result: ExecutionResult): ExecutionReceipt {
  const inputHash  = hashInput(job);
  const outputHash = hashOutput(result.output ?? result.error ?? null);
  const timestamp  = new Date().toISOString();

  const payload = JSON.stringify({
    id: job.id,
    jobType: job.type,
    inputHash,
    outputHash,
    status: result.status,
    timestamp,
  });

  const privateKey = getPrivateKey();
  const signature  = sign(null, Buffer.from(payload), privateKey).toString("base64");

  return {
    id: job.id,
    jobType:    job.type,
    inputHash,
    outputHash,
    status:     result.status,
    timestamp,
    signature,
  };
}