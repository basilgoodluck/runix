import axios from "axios";
import { JobStatus, JobType } from "../types";
import type { LlmJob, ExecutionResult } from "../types";
import logger from "@/lib/logger";

const PROVIDERS: Record<string, (apiKey: string, model: string) => string> = {
  gemini: (apiKey, model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  openai: () => `https://api.openai.com/v1/chat/completions`,
};

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
};

function buildGeminiBody(prompt: string, systemPrompt?: string) {
  return {
    contents: [
      {
        parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }],
      },
    ],
  };
}

function buildOpenAIBody(prompt: string, model: string, systemPrompt?: string) {
  return {
    model,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: prompt },
    ],
  };
}

function extractText(provider: string, data: unknown): string {
  try {
    if (provider === "gemini") {
      return (data as any).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    if (provider === "openai") {
      return (data as any).choices?.[0]?.message?.content ?? "";
    }
    return JSON.stringify(data);
  } catch {
    return "";
  }
}

export class LlmExecutor {
  async run(job: LlmJob): Promise<ExecutionResult> {
    const start = Date.now();

    const provider = job.provider ?? "gemini";
    const model = job.model ?? DEFAULT_MODELS[provider] ?? "gemini-2.0-flash";
    const retries = job.retries ?? 2;

    const envKey = process.env[`${provider.toUpperCase()}_API_KEY`];
    const apiKey = job.apiKey ?? envKey;

    if (!apiKey) {
      return {
        id: job.id,
        type: JobType.LLM,
        status: JobStatus.FAILED,
        error: `${provider.toUpperCase()} API key is missing (job or env)`,
        durationMs: Date.now() - start,
      };
    }

    let endpoint: string;

    if (provider === "custom" && job.endpoint) {
      endpoint = job.endpoint;
    } else if (PROVIDERS[provider]) {
      endpoint = PROVIDERS[provider](apiKey, model);
    } else {
      return {
        id: job.id,
        type: JobType.LLM,
        status: JobStatus.FAILED,
        error: `Unknown provider: ${provider}`,
        durationMs: Date.now() - start,
      };
    }

    const body =
      provider === "openai"
        ? buildOpenAIBody(job.prompt, model, job.systemPrompt)
        : buildGeminiBody(job.prompt, job.systemPrompt);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(job.headers ?? {}),
    };

    if (provider === "openai") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    logger.info(`LlmExecutor: [${job.id}] provider=${provider} model=${model}`);

    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios.post(endpoint, body, {
          headers,
          timeout: job.timeoutMs ?? 30000,
          maxContentLength: 1024 * 1024,
        });

        const text = extractText(provider, response.data);

        return {
          id: job.id,
          type: JobType.LLM,
          status: JobStatus.DONE,
          output: {
            text,
            provider,
            model,
            raw: response.data,
          },
          durationMs: Date.now() - start,
        };
      } catch (err: any) {
        const status = err.response?.status;
        lastError = `HTTP ${status ?? "ERR"}: ${JSON.stringify(err.response?.data ?? err.message)}`;

        if (status && status < 500) break;

        logger.warn(`LlmExecutor retry ${attempt + 1}/${retries} [${job.id}]: ${lastError}`);
      }
    }

    logger.error(`LlmExecutor failed [${job.id}]: ${lastError}`);

    return {
      id: job.id,
      type: JobType.LLM,
      status: JobStatus.FAILED,
      error: lastError ?? "LLM request failed",
      durationMs: Date.now() - start,
    };
  }
}