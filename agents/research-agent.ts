/**
 * Runix Research Agent
 * --------------------
 * Runix methods used: batch, action, data, llm
 *
 * Flow:
 *  1. batch  — fetch from 4 sources simultaneously (Wikipedia, HackerNews, Reddit, arXiv RSS)
 *  2. data   — parse structured arXiv feed
 *  3. llm    — synthesize all sources into a structured research report
 *  4. llm    — generate 3 follow-up questions based on the report
 *
 * No API keys needed - all public endpoints.
 * Mount: app.post("/demo/research", researchAgentHandler)
 */

import { RunixClient, type HttpMethod } from "@basilgoodluck/runix-sdk";
import type { Request, Response } from "express";

const runix = new RunixClient({
  apiKey: process.env.RUNIX_API_KEY!,
  baseUrl: process.env.RUNIX_BASE_URL ?? "https://runix.basilgoodluck.com",
});

// ─── SSE ─────────────────────────────────────────────────────────────────────

function emit(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function emitStep(
  res: Response,
  label: string,
  status: "running" | "done" | "error",
  meta?: { durationMs?: number; costUsd?: number; detail?: string }
) {
  emit(res, "step", { label, status, ...meta });
}

// ─── Source builders ──────────────────────────────────────────────────────────

function buildSources(topic: string) {
  const encoded = encodeURIComponent(topic);
  return [
    {
      name: "Wikipedia",
      type: "action" as const,
      url: `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      method: "GET",
    },
    {
      name: "HackerNews",
      type: "action" as const,
      url: `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=5`,
      method: "GET",
    },
    {
      name: "arXiv",
      type: "data" as const,
      url: `https://export.arxiv.org/api/query?search_query=all:${encoded}&max_results=3&sortBy=submittedDate`,
      mode: "fetch" as const,
    },
    {
      name: "Reddit",
      type: "action" as const,
      url: `https://www.reddit.com/search.json?q=${encoded}&sort=top&t=month&limit=5`,
      method: "GET",
      headers: { "User-Agent": "RunixResearchAgent/1.0" },
    },
  ];
}

// ─── Extractors ───────────────────────────────────────────────────────────────

function extractWikipedia(r: any): string {
  try {
    const data = typeof r.output?.data === "string" ? JSON.parse(r.output.data) : r.output?.data;
    return data?.extract ?? data?.title ?? "No Wikipedia content found";
  } catch { return "Wikipedia unavailable"; }
}

function extractHackerNews(r: any): string {
  try {
    const data = typeof r.output?.data === "string" ? JSON.parse(r.output.data) : r.output?.data;
    const hits = data?.hits ?? [];
    return hits.slice(0, 5).map((h: any) => `- ${h.title} (${h.points ?? 0} pts)`).join("\n") || "No HN results";
  } catch { return "HackerNews unavailable"; }
}

function extractArxiv(r: any): string {
  try {
    const text: string = r.output?.data ?? r.stdout ?? "";
    const titles = [...text.matchAll(/<title>(.*?)<\/title>/g)].slice(1).map(m => `- ${m[1] ?? ""}`);
    const summaries = [...text.matchAll(/<summary>(.*?)<\/summary>/gs)].slice(0, 3).map(m => (m[1] ?? "").trim().slice(0, 200));
    return titles.length > 0
      ? `Papers:\n${titles.join("\n")}\n\nSummary of first:\n${summaries[0] ?? ""}`
      : "No arXiv papers found";
  } catch { return "arXiv unavailable"; }
}

function extractReddit(r: any): string {
  try {
    const data = typeof r.output?.data === "string" ? JSON.parse(r.output.data) : r.output?.data;
    const posts = data?.data?.children ?? [];
    return posts.slice(0, 5).map((p: any) => `- ${p.data?.title} (${p.data?.score ?? 0} upvotes)`).join("\n") || "No Reddit results";
  } catch { return "Reddit unavailable"; }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function researchAgentHandler(req: Request, res: Response) {
  const { topic } = req.body as { topic: string };

  if (!topic?.trim()) { res.status(400).json({ error: "topic is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const agentStart = Date.now();
  let totalCost = 0;
  const sources = buildSources(topic.trim());

  try {
    // ── 1. batch: fetch all 4 sources simultaneously ──────────────────────────
    emitStep(res, "Fetching 4 sources in parallel via Runix batch", "running");

    const fetched = await runix.batch({
      jobs: sources.map(s => {
        if (s.type === "data") {
          return { type: "data" as const, mode: "fetch" as const, url: s.url };
        }
        return {
          type: "action" as const,
          url: s.url,
          method: s.method as HttpMethod,
          headers: (s as any).headers,
        };
      }),
      concurrency: 4,
    });

    totalCost += (fetched as any).total_cost_usd ?? 0;

    const results = (fetched as any).results ?? [];
    const wikipedia  = extractWikipedia(results[0]);
    const hackernews = extractHackerNews(results[1]);
    const arxiv      = extractArxiv(results[2]);
    const reddit     = extractReddit(results[3]);

    const successCount = results.filter((r: any) => r.status === "done").length;

    emitStep(res, "Fetching 4 sources in parallel via Runix batch", "done", {
      durationMs: Math.max(...results.map((r: any) => r.duration_ms ?? 0)),
      costUsd: (fetched as any).total_cost_usd ?? 0,
      detail: `${successCount}/4 sources fetched: Wikipedia, HackerNews, arXiv, Reddit`,
    });

    emit(res, "sources", {
      wikipedia:  wikipedia.slice(0, 300),
      hackernews: hackernews.slice(0, 300),
      arxiv:      arxiv.slice(0, 300),
      reddit:     reddit.slice(0, 300),
    });

    // ── 2. llm: synthesize into research report ───────────────────────────────
    emitStep(res, "Synthesizing research report via Runix LLM", "running");

    const report = await runix.llm({
      provider: "gemini",
      systemPrompt: "You are a research analyst. Be concise and structured. Use plain text, no markdown.",
      prompt: `Research topic: "${topic}"

Sources collected:

WIKIPEDIA:
${wikipedia.slice(0, 800)}

HACKER NEWS (community discussion):
${hackernews}

ARXIV (academic papers):
${arxiv.slice(0, 600)}

REDDIT (public sentiment):
${reddit}

Write a structured research report with:
1. Overview (2 sentences)
2. Key findings (3 bullet points)
3. Community sentiment (1 sentence)
4. Academic angle (1 sentence)`,
    });

    totalCost += report.costUsd ?? 0;

    emitStep(res, "Synthesizing research report via Runix LLM", "done", {
      durationMs: report.durationMs,
      costUsd: report.costUsd ?? 0,
      detail: report.text?.slice(0, 100),
    });

    emit(res, "report", { text: report.text });

    // ── 3. llm: generate follow-up questions ──────────────────────────────────
    emitStep(res, "Generating follow-up questions via Runix LLM", "running");

    const followUp = await runix.llm({
      provider: "gemini",
      systemPrompt: "You generate exactly 3 sharp follow-up research questions. Return only a JSON array of 3 strings.",
      prompt: `Based on this research report about "${topic}", generate 3 follow-up questions:\n\n${report.text}`,
    });

    totalCost += followUp.costUsd ?? 0;

    let questions: string[] = [];
    try {
      questions = JSON.parse(followUp.text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(questions)) questions = [];
    } catch { questions = [followUp.text]; }

    emitStep(res, "Generating follow-up questions via Runix LLM", "done", {
      durationMs: followUp.durationMs,
      costUsd: followUp.costUsd ?? 0,
      detail: `${questions.length} questions generated`,
    });

    emit(res, "questions", { questions });

    // ── done ──────────────────────────────────────────────────────────────────
    emit(res, "result", {
      topic,
      report: report.text,
      questions,
      sourceCount: successCount,
      totalCostUsd: Number(totalCost.toFixed(8)),
      totalDurationMs: Date.now() - agentStart,
    });

    emit(res, "done", { totalCostUsd: Number(totalCost.toFixed(8)), totalDurationMs: Date.now() - agentStart });

  } catch (err: unknown) {
    emit(res, "error", { message: err instanceof Error ? err.message : "Agent error" });
  } finally {
    res.end();
  }
}