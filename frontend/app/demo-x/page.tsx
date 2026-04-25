"use client";

import { useState, useRef, useCallback } from "react";
import { RunixClient } from "@basilgoodluck/runix-sdk";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ExecutionType = "compute" | "llm" | "batch" | "stateful";

interface Scenario {
  id: ExecutionType;
  label: string;
  description: string;
  payload: unknown;
}

const SCENARIOS: Scenario[] = [
  {
    id: "compute",
    label: "Compute",
    description: "Run Python, Node, Go in isolated sandbox",
    payload: {
      runtime: "node",
      code: `const numbers = [1, 2, 3, 4, 5];
      const sum = numbers.reduce((a, b) => a + b, 0);
      const avg = sum / numbers.length;
      console.log(\`Sum: \${sum}, Average: \${avg}\`);
      console.log(\`Processed at: \${new Date().toISOString()}\`);`,
    },
  },
  {
    id: "llm",
    label: "LLM",
    description: "Call Gemini, GPT, or Claude",
    payload: {
      prompt: "Explain what a sandboxed execution environment is in one sentence.",
      systemPrompt: "You are a concise technical writer. Respond in plain text only, no markdown.",
    },
  },
  {
    id: "batch",
    label: "Batch",
    description: "Run multiple jobs in parallel",
    payload: {
      jobs: [
        { type: "compute", runtime: "node", code: "console.log('Job 1: 1 + 1 =', 1 + 1)" },
        { type: "compute", runtime: "node", code: "console.log('Job 2: 2 * 3 =', 2 * 3)" },
        { type: "compute", runtime: "node", code: "console.log('Job 3: 10 / 2 =', 10 / 2)" },
        { type: "compute", runtime: "python", code: "print('Job 4: 5 ** 2 =', 5 ** 2)" },
        { type: "compute", runtime: "python", code: "print('Job 5: 100 % 7 =', 100 % 7)" },
      ],
      concurrency: 5,
    },
  },
  {
    id: "stateful",
    label: "Stateful",
    description: "Persist data between executions",
    payload: {
      sessionId: `demo_${Date.now()}`,
      operations: [
        { op: "set", key: "counter", value: 1 },
        { op: "get", key: "counter" },
      ],
    },
  },
];

const PIPELINES: Record<ExecutionType, string[]> = {
  compute:   ["compute"],
  llm:       ["llm"],
  batch:     ["batch"],
  stateful:  ["stateful"],
};

type StepStatus = "idle" | "running" | "done" | "error" | "cached";

interface Step {
  label: string;
  status: StepStatus;
  durationMs?: number;
  costUsd?: number;
  detail?: string;
}

interface RunState {
  steps: Step[];
  events: { type: string; data: unknown }[];
  totalCost: number;
  totalDuration: number;
  done: boolean;
  error?: string;
  activePipelineStep: number;
}

function pipelineStepForLabel(label: string, type: ExecutionType): number {
  const pipeline = PIPELINES[type] ?? [];
  const lower = label.toLowerCase();
  for (let i = 0; i < pipeline.length; i++) {
    if (lower.includes(pipeline[i]!)) return i;
  }
  return -1;
}

export default function DemoPage() {
  const [selected, setSelected] = useState<ExecutionType | null>(null);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<RunState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const runScenario = useCallback(async (scenario: Scenario) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setSelected(scenario.id);
    setRunning(true);
    setState({ steps: [], events: [], totalCost: 0, totalDuration: 0, done: false, activePipelineStep: -1 });

    try {
      const res = await fetch(`${API_URL}/agents/demo/${scenario.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.payload),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.trim().split("\n");
          let eventType = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            if (line.startsWith("data: ")) dataLine = line.slice(6).trim();
          }
          if (!dataLine) continue;

          let parsed: unknown;
          try { parsed = JSON.parse(dataLine); } catch { continue; }
          const p = parsed as Record<string, unknown>;

          if (eventType === "error") {
            const errMsg = (p.message as string) || "Unknown error";
            alert(`Error: ${errMsg}`);
            abort.abort();
            setRunning(false);
            setState(null);
            return;
          }

          setState(prev => {
            if (!prev) return prev;
            const next = { ...prev, events: [...prev.events, { type: eventType, data: parsed }] };

            if (eventType === "step") {
              const existing = next.steps.findIndex(s => s.label === p.label);
              const step: Step = {
                label:      p.label as string,
                status:     p.status as StepStatus,
                durationMs: p.durationMs as number | undefined,
                costUsd:    p.costUsd as number | undefined,
                detail:     p.detail as string | undefined,
              };
              if (existing >= 0) {
                next.steps = [...next.steps];
                next.steps[existing] = step;
              } else {
                next.steps = [...next.steps, step];
              }
              next.activePipelineStep = pipelineStepForLabel(step.label, scenario.id);
              if (step.costUsd) next.totalCost = Number((next.totalCost + step.costUsd).toFixed(10));
            }

            if (eventType === "done") {
              next.done = true;
              next.totalCost     = (p.totalCostUsd as number) ?? next.totalCost;
              next.totalDuration = (p.totalDurationMs as number) ?? 0;
            }

            return next;
          });

          setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 50);
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        alert(`Error: ${(err as Error).message}`);
        setState(null);
      }
    } finally {
      setRunning(false);
    }
  }, []);

  const activeScenario = SCENARIOS.find(s => s.id === selected);
  const pipeline = activeScenario ? (PIPELINES[activeScenario.id] ?? []) : [];
  const donePipelineNodes = new Set(
    (state?.steps ?? [])
      .filter(s => s.status === "done" || s.status === "cached")
      .map(s => pipelineStepForLabel(s.label, activeScenario?.id ?? "compute"))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .sc-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 14px 16px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .sc-btn:hover:not(:disabled) { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.25); }
        .sc-btn.active { background: rgba(124,58,237,0.12); border-color: #7c3aed; box-shadow: 0 0 0 1px rgba(124,58,237,0.2); }
        .sc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pipe-node {
          padding: 6px 16px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.8);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .pipe-node.active { border-color: #7c3aed; color: #fff; background: rgba(124,58,237,0.2); }
        .pipe-node.done   { border-color: #10b981; color: #6ee7b7; background: rgba(16,185,129,0.08); }

        .step-row {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          animation: fadeUp 0.2s ease;
        }
        .step-row:last-child { border-bottom: none; }

        .ev-card {
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 8px;
          border: 1px solid transparent;
          animation: fadeUp 0.2s ease;
        }

        @media (max-width: 768px) {
          .layout { flex-direction: column !important; height: auto !important; }
          .sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .sidebar-inner { flex-direction: row !important; flex-wrap: nowrap; overflow-x: auto; padding: 12px !important; gap: 8px !important; }
          .group-head { display: none !important; }
          .sc-btn { min-width: 140px; }
          .events-col { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.08) !important; max-height: 280px; }
          .pipe-row { overflow-x: auto; }
        }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>R</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em", color: "#fff" }}>Runix</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>demo</span>
        </div>
      </div>

      {/* Pipeline bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 56 }}>
        <div className="pipe-row" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          {activeScenario ? pipeline.map((node, i) => (
            <div key={`${node}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={`pipe-node${donePipelineNodes.has(i) ? " done" : state?.activePipelineStep === i && !donePipelineNodes.has(i) ? " active" : ""}`}>
                {node}
              </div>
              {i < pipeline.length - 1 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>→</span>}
            </div>
          )) : <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Select an execution type</span>}
        </div>

        {state && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>$</span>
            <span style={{ fontSize: 24, fontWeight: 600, color: "#c4b5fd", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {state.totalCost.toFixed(8)}
            </span>
            {state.done && state.totalDuration > 0 && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginLeft: 12 }}>
                {(state.totalDuration / 1000).toFixed(2)}s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="layout" style={{ display: "flex", height: "calc(100vh - 120px)" }}>

        {/* Sidebar */}
        <div className="sidebar" style={{ width: 260, borderRight: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", flexShrink: 0 }}>
          <div className="sidebar-inner" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "20px 16px" }}>
            <div>
              <p className="group-head" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", padding: "0 0 10px" }}>Execution Types</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SCENARIOS.map(s => (
                  <button key={s.id} className={`sc-btn${selected === s.id ? " active" : ""}`} onClick={() => !running && runScenario(s)} disabled={running}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: selected === s.id ? "#fff" : "rgba(255,255,255,0.9)", marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{s.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Steps feed */}
        <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!state && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20 }}>▶</span>
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Select an execution type to run</p>
            </div>
          )}

          {state?.steps.map((step, i) => (
            <div key={i} className="step-row">
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {step.status === "running" && (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(124,58,237,0.4)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                )}
                {(step.status === "done" || step.status === "cached") && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
                  </div>
                )}
                {step.status === "error" && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: step.status === "running" ? "#fff" : step.status === "error" ? "#f87171" : "rgba(255,255,255,0.95)" }}>
                    {step.label}
                  </span>
                  {step.status === "cached" && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#93c5fd", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", borderRadius: 4, padding: "2px 8px" }}>cached</span>
                  )}
                </div>
                {step.detail && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.detail}</p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {step.durationMs != null && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{step.durationMs}ms</p>
                )}
                {step.costUsd != null && step.costUsd > 0 && (
                  <p style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 500 }}>${step.costUsd.toFixed(8)}</p>
                )}
              </div>
            </div>
          ))}

          {running && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(124,58,237,0.5)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Executing...
            </div>
          )}

          {state?.done && !state.error && (
            <div style={{ border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "14px 18px", background: "rgba(16,185,129,0.06)", marginTop: 20 }}>
              <p style={{ fontSize: 14, color: "#34d399", fontWeight: 500 }}>
                Complete · ${state.totalCost.toFixed(8)} · {(state.totalDuration / 1000).toFixed(2)}s
              </p>
            </div>
          )}
        </div>

        {/* Events panel */}
        <div className="events-col" style={{ width: 320, borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: "20px 16px", flexShrink: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 18 }}>Event stream</p>

          {!state && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>No events yet</p>}

          {state?.events.map((ev, i) => {
            const st: Record<string, { bg: string; accent: string; border: string }> = {
              output:    { bg: "rgba(16,185,129,0.08)",  accent: "#34d399", border: "rgba(16,185,129,0.2)" },
              analysis:  { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.2)" },
              tests:     { bg: "rgba(96,165,250,0.08)",  accent: "#93c5fd", border: "rgba(96,165,250,0.2)" },
              summary:   { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.2)" },
              result:    { bg: "rgba(251,191,36,0.08)",  accent: "#fcd34d", border: "rgba(251,191,36,0.2)" },
            };
            const c = st[ev.type] ?? { bg: "rgba(255,255,255,0.04)", accent: "#ccc", border: "rgba(255,255,255,0.1)" };
            const d = ev.data as Record<string, unknown>;

            return (
              <div key={i} className="ev-card" style={{ background: c.bg, borderColor: c.border }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: c.accent, textTransform: "uppercase", marginBottom: 8 }}>{ev.type}</p>
                <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.5 }}>
                  {ev.type === "output" && (
                    <pre style={{ fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#a7f3d0", maxHeight: 70, overflow: "hidden" }}>
                      {(d.stdout as string)?.slice(0, 140) || (d.stderr as string)?.slice(0, 100) || "no output"}
                    </pre>
                  )}
                  {ev.type === "analysis" && <span style={{ color: c.accent }}>{d.verdict as string} · {(d.summary as string)?.slice(0, 70)}</span>}
                  {ev.type === "tests" && <span style={{ color: c.accent }}>{d.passCount as number}/{d.total as number} passed</span>}
                  {ev.type === "summary" && <span>{(d.text as string)?.slice(0, 90)}</span>}
                  {ev.type === "result" && (
                    <span style={{ color: c.accent }}>
                      {d.totalCostUsd != null ? `$${(d.totalCostUsd as number).toFixed(8)}` : "complete"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}