/**
 * Runix Finance Agent
 * -------------------
 * Runix methods used: batch, compute, llm
 *
 * Flow:
 *  1. batch   — fetch BTC, ETH, SOL, BNB, ARB 24hr stats from Binance simultaneously
 *  2. batch   — fetch order book depth for all 5 simultaneously
 *  3. compute — run financial calculations (spreads, volatility, momentum) in Node
 *  4. llm     — generate market summary from computed data
 *
 * No API keys needed for Binance public endpoints.
 * Mount: app.post("/demo/finance", financeAgentHandler)
 */

import { RunixClient } from "@basilgoodluck/runix-sdk";
import type { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

const runix = new RunixClient({ apiKey: process.env.RUNIX_FINANCE_API_KEY! });

const BINANCE = "https://api.binance.com/api/v3";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ARBUSDT"] as const;

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function financeAgentHandler(req: Request, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const agentStart = Date.now();
  let totalCost = 0;

  try {
    // ── 1. batch: fetch 24hr ticker stats for all symbols simultaneously ──────
    emitStep(res, `Fetching ${SYMBOLS.length} markets from Binance in parallel`, "running");

    const tickerBatch = await runix.batch({
      jobs: SYMBOLS.map(symbol => ({
        type: "action" as const,
        url: `${BINANCE}/ticker/24hr?symbol=${symbol}`,
        method: "GET",
        timeout_ms: 10_000,
      })),
      concurrency: 5,
    });

    totalCost += (tickerBatch as any).total_cost_usd ?? 0;

    const tickers = ((tickerBatch as any).results ?? []).map((r: any, i: number) => {
      try {
        const raw = typeof r.output?.data === "string" ? JSON.parse(r.output.data) : r.output?.data;
        return {
          symbol: SYMBOLS[i],
          price: parseFloat(raw?.lastPrice ?? "0"),
          change24h: parseFloat(raw?.priceChangePercent ?? "0"),
          volume24h: parseFloat(raw?.quoteVolume ?? "0"),
          high24h: parseFloat(raw?.highPrice ?? "0"),
          low24h: parseFloat(raw?.lowPrice ?? "0"),
          trades: parseInt(raw?.count ?? "0"),
        };
      } catch {
        return { symbol: SYMBOLS[i], price: 0, change24h: 0, volume24h: 0, high24h: 0, low24h: 0, trades: 0 };
      }
    });

    emitStep(res, `Fetching ${SYMBOLS.length} markets from Binance in parallel`, "done", {
      durationMs: Math.max(...((tickerBatch as any).results ?? []).map((r: any) => r.durationMs ?? 0)),
      costUsd: (tickerBatch as any).total_cost_usd,
      detail: tickers.map((t: any) => `${t.symbol.replace("USDT", "")} $${t.price.toLocaleString()}`).join(" | "),
    });

    emit(res, "tickers", { tickers });

    // ── 2. batch: fetch order book depth for all symbols simultaneously ───────
    emitStep(res, "Fetching order book depth for all markets in parallel", "running");

    const depthBatch = await runix.batch({
      jobs: SYMBOLS.map(symbol => ({
        type: "action" as const,
        url: `${BINANCE}/depth?symbol=${symbol}&limit=5`,
        method: "GET",
        timeout_ms: 10_000,
      })),
      concurrency: 5,
    });

    totalCost += (depthBatch as any).total_cost_usd ?? 0;

    const depths = ((depthBatch as any).results ?? []).map((r: any, i: number) => {
      try {
        const raw = typeof r.output?.data === "string" ? JSON.parse(r.output.data) : r.output?.data;
        const bestBid = parseFloat(raw?.bids?.[0]?.[0] ?? "0");
        const bestAsk = parseFloat(raw?.asks?.[0]?.[0] ?? "0");
        const spread = bestAsk - bestBid;
        const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0;
        return { symbol: SYMBOLS[i], bestBid, bestAsk, spread, spreadPct };
      } catch {
        return { symbol: SYMBOLS[i], bestBid: 0, bestAsk: 0, spread: 0, spreadPct: 0 };
      }
    });

    emitStep(res, "Fetching order book depth for all markets in parallel", "done", {
      durationMs: Math.max(...((depthBatch as any).results ?? []).map((r: any) => r.durationMs ?? 0)),
      costUsd: (depthBatch as any).total_cost_usd,
      detail: `Spreads: ${depths.map((d: any) => `${d.symbol.replace("USDT", "")} ${d.spreadPct.toFixed(4)}%`).join(" | ")}`,
    });

    emit(res, "depths", { depths });

    // ── 3. compute: financial analysis in Node sandbox ────────────────────────
    emitStep(res, "Running financial calculations in Runix sandbox", "running");

    const analysisCode = `
const tickers = ${JSON.stringify(tickers)};
const depths  = ${JSON.stringify(depths)};

// momentum score: weight price change + volume
const momentum = tickers.map(t => ({
  symbol: t.symbol.replace("USDT", ""),
  score: ((t.change24h * 0.6) + (Math.log10(t.volume24h + 1) * 0.4)).toFixed(4),
  change24h: t.change24h,
  volume24h: t.volume24h,
  price: t.price,
})).sort((a, b) => parseFloat(b.score) - parseFloat(a.score));

// volatility: (high - low) / low * 100
const volatility = tickers.map(t => ({
  symbol: t.symbol.replace("USDT", ""),
  volatility: t.low24h > 0 ? (((t.high24h - t.low24h) / t.low24h) * 100).toFixed(2) : "0",
})).sort((a, b) => parseFloat(b.volatility) - parseFloat(a.volatility));

// liquidity: tightest spread wins
const liquidity = depths.map(d => ({
  symbol: d.symbol.replace("USDT", ""),
  spreadPct: d.spreadPct.toFixed(4),
  bestBid: d.bestBid,
  bestAsk: d.bestAsk,
})).sort((a, b) => parseFloat(a.spreadPct) - parseFloat(b.spreadPct));

// market summary
const totalVolume = tickers.reduce((s, t) => s + t.volume24h, 0);
const gainers = tickers.filter(t => t.change24h > 0).length;
const losers  = tickers.filter(t => t.change24h < 0).length;

console.log(JSON.stringify({ momentum, volatility, liquidity, totalVolume, gainers, losers }, null, 2));
`;

    const compute = await runix.compute({ runtime: "node", code: analysisCode, timeoutMs: 10_000 });
    totalCost += compute.costUsd ?? 0;

    let analysis: any = {};
    try { analysis = JSON.parse(compute.stdout ?? "{}"); } catch { /* keep empty */ }

    emitStep(res, "Running financial calculations in Runix sandbox", compute.status === "done" ? "done" : "error", {
      durationMs: compute.durationMs,
      costUsd: compute.costUsd ?? 0,
      detail: `Top momentum: ${analysis.momentum?.[0]?.symbol} | Most volatile: ${analysis.volatility?.[0]?.symbol}`,
    });

    emit(res, "analysis", analysis);

    // ── 4. llm: market summary ────────────────────────────────────────────────
    emitStep(res, "Generating market summary via Runix LLM", "running");

    const summary = await runix.llm({
      provider: "gemini",
      systemPrompt: "You are a concise crypto market analyst. Max 3 sentences. No fluff.",
      prompt: `Summarize this market snapshot:

Momentum leaders: ${JSON.stringify(analysis.momentum?.slice(0, 3))}
Most volatile: ${JSON.stringify(analysis.volatility?.slice(0, 3))}
Best liquidity: ${JSON.stringify(analysis.liquidity?.slice(0, 3))}
Total 24h volume: $${analysis.totalVolume?.toLocaleString()}
Gainers: ${analysis.gainers} | Losers: ${analysis.losers}

Give a brief market sentiment and one actionable observation.`,
    });

    totalCost += summary.costUsd ?? 0;

    emitStep(res, "Generating market summary via Runix LLM", "done", {
      durationMs: summary.durationMs,
      costUsd: summary.costUsd ?? 0,
      detail: summary.text?.slice(0, 100),
    });

    emit(res, "summary", { text: summary.text });

    // ── done ──────────────────────────────────────────────────────────────────
    emit(res, "result", {
      tickers,
      depths,
      analysis,
      summary: summary.text,
      totalCostUsd: Number(totalCost.toFixed(8)),
      totalDurationMs: Date.now() - agentStart,
      receipt: compute.receipt,
    });

    emit(res, "done", { totalCostUsd: Number(totalCost.toFixed(8)), totalDurationMs: Date.now() - agentStart });

  } catch (err: unknown) {
    emit(res, "error", { message: err instanceof Error ? err.message : "Agent error" });
  } finally {
    res.end();
  }
}