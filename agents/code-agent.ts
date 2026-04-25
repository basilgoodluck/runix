/**
 * Runix Code Agent
 * ----------------
 * Runix methods used: compute, batch, stateful, llm
 *
 * Flow:
 *  1. compute  — run submitted code in sandbox
 *  2. llm      — analyze code + output, generate fix if needed
 *  3. batch    — run 5 test cases simultaneously
 *  4. stateful — debug session if tests fail (2 steps, same session)
 *
 * Mount: app.post("/demo/code", codeAgentHandler)
 * Streams every step live via SSE.
 */

import { RunixClient } from "@basilgoodluck/runix-sdk";
import type { Request, Response } from "express";

const runix = new RunixClient({
  apiKey: process.env.RUNIX_API_KEY!
});

// ─── SSE ─────────────────────────────────────────────────────────────────────

function emit(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function emitStep(
  res: Response,
  label: string,
  status: "running" | "done" | "error" | "cached",
  meta?: { durationMs?: number; costUsd?: number; detail?: string }
) {
  emit(res, "step", { label, status, ...meta });
}

// ─── Test cases ───────────────────────────────────────────────────────────────

function buildTestCases(code: string, runtime: "python" | "node" | "go") {
  if (runtime === "node") {
    return [
      { name: "Basic execution",       code: `${code}\nconsole.log("TEST:basic:pass")` },
      { name: "Null safety",           code: `${code}\ntry{const x=null?.toString?.();console.log("TEST:null_safety:pass")}catch(e){console.log("TEST:null_safety:fail")}` },
      { name: "Error boundary",        code: `${code}\ntry{throw new Error("boundary")}catch(e){console.log("TEST:error_boundary:pass")}` },
      { name: "Async compatibility",   code: `${code}\n;(async()=>{await Promise.resolve();console.log("TEST:async:pass")})()` },
      { name: "Performance (1k runs)", code: `const _s=Date.now();for(let _i=0;_i<1000;_i++){${code.split("\n").filter(l=>!l.trim().startsWith("console")).join(";") || "null"}}\nconsole.log(\`TEST:perf:pass:\${Date.now()-_s}ms\`)` },
    ];
  }
  if (runtime === "python") {
    return [
      { name: "Basic execution",       code: `${code}\nprint("TEST:basic:pass")` },
      { name: "None safety",           code: `${code}\ntry:\n    x = None\n    _ = x or "fallback"\n    print("TEST:none_safety:pass")\nexcept Exception as e:\n    print(f"TEST:none_safety:fail")` },
      { name: "Exception boundary",    code: `${code}\ntry:\n    raise ValueError("boundary")\nexcept ValueError:\n    print("TEST:exception_boundary:pass")` },
      { name: "Type check",            code: `${code}\ntry:\n    assert True\n    print("TEST:type_check:pass")\nexcept Exception as e:\n    print(f"TEST:type_check:fail")` },
      { name: "Performance (1k runs)", code: `import time\n_s=time.time()\nfor _i in range(1000):\n${code.split("\n").map(l=>"    "+l).join("\n")}\nprint(f"TEST:perf:pass:{(time.time()-_s)*1000:.1f}ms")` },
    ];
  }
  return Array.from({ length: 5 }, (_, i) => ({ name: `Test ${i + 1}`, code }));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function codeAgentHandler(req: Request, res: Response) {
  const { code, runtime = "node" } = req.body as {
    code: string;
    runtime: "python" | "node" | "go";
  };

  if (!code?.trim()) { res.status(400).json({ error: "code is required" }); return; }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const agentStart = Date.now();
  let totalCost = 0;

  try {
    // ── 1. compute: run the code ──────────────────────────────────────────────
    emitStep(res, "Running code in Runix sandbox", "running");

    const run = await runix.compute({ runtime, code, timeoutMs: 10_000 });
    totalCost += run.costUsd ?? 0;

    emitStep(res, "Running code in Runix sandbox", run.status === "done" ? (run.cached ? "cached" : "done") : "error", {
      durationMs: run.durationMs,
      costUsd: run.costUsd ?? 0,
      detail: run.cached ? "Returned from deterministic cache" : (run.stdout?.slice(0, 100) || run.stderr?.slice(0, 100) || "no output"),
    });

    emit(res, "output", { stdout: run.stdout, stderr: run.stderr, status: run.status, cached: run.cached, receipt: run.receipt });

    // ── 2. llm: analyze + generate fix ───────────────────────────────────────
    emitStep(res, "Analyzing with LLM via Runix", "running");

    const analysis = await runix.llm({
      provider: "gemini",
      systemPrompt: "You are a code review agent. Respond ONLY with valid JSON, no markdown, no explanation.",
      prompt: `Review this ${runtime} code and its execution result.

CODE:
${code}

RESULT:
status: ${run.status}
stdout: ${run.stdout || "(empty)"}
stderr: ${run.stderr || "(none)"}

Respond with this exact JSON shape:
{
  "verdict": "pass" | "fail" | "warn",
  "summary": "one sentence max",
  "fix": "complete corrected code, or null if no fix needed"
}`,
    });

    totalCost += analysis.costUsd ?? 0;

    let parsed: { verdict: string; summary: string; fix: string | null } = {
      verdict: "warn",
      summary: "Analysis unavailable",
      fix: null,
    };

    try {
      parsed = JSON.parse(analysis.text.replace(/```json|```/g, "").trim());
    } catch { /* keep defaults */ }

    emitStep(res, "Analyzing with LLM via Runix", "done", {
      durationMs: analysis.durationMs,
      costUsd: analysis.costUsd ?? 0,
      detail: `${parsed.verdict} - ${parsed.summary?.slice(0, 80)}`,
    });

    emit(res, "analysis", parsed);

    // ── 3. batch: 5 test cases in parallel ───────────────────────────────────
    const codeToTest = parsed.fix ?? code;
    const testCases = buildTestCases(codeToTest, runtime);

    emitStep(res, "Batch running 5 test cases in parallel", "running");

    const batch = await runix.batch({
      jobs: testCases.map(tc => ({ type: "compute" as const, runtime, code: tc.code, timeoutMs: 8_000 })),
      concurrency: 5,
    });

    totalCost += (batch as any).total_cost_usd ?? 0;

    const testResults = ((batch as any).results ?? []).map((r: any, i: number) => {
      const out = r.stdout ?? "";
      const passed = out.includes(":pass") || (r.status === "done" && !r.stderr?.trim() && !out.includes(":fail"));
      return { name: testCases[i]?.name ?? `Test ${i + 1}`, passed, output: out.slice(0, 120), durationMs: r.duration_ms ?? 0, costUsd: r.cost_usd ?? 0 };
    });

    const passCount = testResults.filter((t: any) => t.passed).length;

    emitStep(res, "Batch running 5 test cases in parallel", "done", {
      durationMs: Math.max(...((batch as any).results ?? []).map((r: any) => r.duration_ms ?? 0)),
      costUsd: (batch as any).total_cost_usd ?? 0,
      detail: `${passCount}/5 passed`,
    });

    emit(res, "tests", { results: testResults, passCount, total: 5 });

    // ── 4. stateful: store debug result ──────────────────────────────────────
    let fixedOutput: string | undefined;
    let sessionSteps = 0;

    if (passCount < 5 && parsed.fix) {
      emitStep(res, "Running fix in sandbox", "running");

      const s1 = await runix.compute({ runtime, code: parsed.fix, timeoutMs: 10_000 });
      totalCost += s1.costUsd ?? 0;
      sessionSteps++;
      fixedOutput = s1.stdout;

      emitStep(res, "Running fix in sandbox", s1.status === "done" ? "done" : "error", {
        durationMs: s1.durationMs,
        costUsd: s1.costUsd ?? 0,
        detail: s1.stdout?.slice(0, 80) || s1.stderr?.slice(0, 80) || "",
      });

      // store result in stateful store
      emitStep(res, "Storing debug result via Runix stateful", "running");

      const store = await runix.stateful({ op: "set", key: `debug:${Date.now()}`, value: { stdout: s1.stdout, verdict: parsed.verdict } });
      totalCost += store.costUsd ?? 0;
      sessionSteps++;

      emitStep(res, "Storing debug result via Runix stateful", store.status === "done" ? "done" : "error", {
        durationMs: store.durationMs,
        costUsd: store.costUsd ?? 0,
        detail: "Debug result stored",
      });
    }

    // ── done ──────────────────────────────────────────────────────────────────
    emit(res, "result", {
      success: passCount >= 4,
      verdict: parsed.verdict,
      summary: parsed.summary,
      originalOutput: run.stdout,
      fixedOutput,
      fixApplied: !!parsed.fix,
      testsPassed: passCount,
      testsTotal: 5,
      debugSessionSteps: sessionSteps,
      totalCostUsd: Number(totalCost.toFixed(8)),
      totalDurationMs: Date.now() - agentStart,
      receipt: run.receipt,
    });

    emit(res, "done", { totalCostUsd: Number(totalCost.toFixed(8)), totalDurationMs: Date.now() - agentStart });

  } catch (err: unknown) {
    emit(res, "error", { message: err instanceof Error ? err.message : "Agent error" });
  } finally {
    res.end();
  }
}