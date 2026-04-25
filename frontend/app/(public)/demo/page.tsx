"use client";

import { useState, useRef, useCallback } from "react";
import codeScenarios from "@/data/scenarios/code.json";
import financeScenarios from "@/data/scenarios/finance.json";
import researchScenarios from "@/data/scenarios/research.json";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Agent = "code" | "finance" | "research";

interface Scenario {
  id: string;
  label: string;
  sub: string;
  payload: unknown;
  agent: Agent;
}

const SCENARIOS: Scenario[] = [
  ...codeScenarios.map(s => ({ ...s, agent: "code" as const })),
  ...financeScenarios.map(s => ({ ...s, agent: "finance" as const })),
  ...researchScenarios.map(s => ({ ...s, agent: "research" as const })),
];

const PIPELINES: Record<string, string[]> = {
  code:     ["compute", "llm", "batch", "stateful"],
  finance:  ["batch", "batch", "compute", "llm"],
  research: ["batch", "llm", "llm"],
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

function pipelineStepForLabel(label: string, agent: string): number {
  const pipeline = PIPELINES[agent] ?? [];
  const lower = label.toLowerCase();
  for (let i = 0; i < pipeline.length; i++) {
    if (lower.includes(pipeline[i]!)) return i;
  }
  return -1;
}

export default function DemoPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<RunState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const runScenario = useCallback(async (scenario: typeof SCENARIOS[0]) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setSelected(scenario.id);
    setRunning(true);
    setState({ steps: [], events: [], totalCost: 0, totalDuration: 0, done: false, activePipelineStep: -1 });

    try {
      const res = await fetch(`${API_URL}/agent/demo/${scenario.agent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.payload),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

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
              next.activePipelineStep = pipelineStepForLabel(step.label, scenario.agent);
              if (step.costUsd) next.totalCost = Number((next.totalCost + step.costUsd).toFixed(10));
            }

            if (eventType === "done") {
              next.done = true;
              next.totalCost     = (p.totalCostUsd as number) ?? next.totalCost;
              next.totalDuration = (p.totalDurationMs as number) ?? 0;
            }

            if (eventType === "error") {
              next.error = p.message as string;
              next.done  = true;
            }

            return next;
          });

          setTimeout(() => feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" }), 50);
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setState(prev => prev ? { ...prev, error: (err as Error).message, done: true } : prev);
      }
    } finally {
      setRunning(false);
    }
  }, []);

  const activeScenario = SCENARIOS.find(s => s.id === selected);
  const pipeline = activeScenario ? (PIPELINES[activeScenario.agent] ?? []) : [];
  const donePipelineNodes = new Set(
    (state?.steps ?? [])
      .filter(s => s.status === "done" || s.status === "cached")
      .map(s => pipelineStepForLabel(s.label, activeScenario?.agent ?? ""))
  );

  return (
    <div style={{ minHeight: "100vh", background: "#080809", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.4); border-radius: 2px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { to { transform:rotate(360deg); } }

        .sc-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 12px 16px;
          cursor: pointer;
          color: #fff;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s;
        }
        .sc-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: rgba(124,58,237,0.5); }
        .sc-btn.active { background: rgba(124,58,237,0.12); border-color: #7c3aed; box-shadow: 0 0 24px rgba(124,58,237,0.15); }
        .sc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pipe-node {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .pipe-node.active { border-color: #7c3aed; color: #c4b5fd; background: rgba(124,58,237,0.15); box-shadow: 0 0 16px rgba(124,58,237,0.25); }
        .pipe-node.done   { border-color: #10b981; color: #34d399; background: rgba(16,185,129,0.08); }

        .step-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          animation: fadeUp 0.2s ease;
        }
        .step-row:last-child { border-bottom: none; }

        .ev-card {
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 8px;
          border: 1px solid transparent;
          animation: fadeUp 0.2s ease;
        }

        @media (max-width: 768px) {
          .layout { flex-direction: column !important; height: auto !important; }
          .sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
          .sidebar-inner { flex-direction: row !important; flex-wrap: nowrap; overflow-x: auto; padding: 12px !important; gap: 8px !important; }
          .group-head { display: none !important; }
          .sc-btn { min-width: 130px; }
          .events-col { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.06) !important; max-height: 280px; }
          .pipe-row { overflow-x: auto; }
        }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 4px 16px rgba(124,58,237,0.45)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em", color: "#fff" }}>Runix</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 2 }}>demo</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>live</span>
        </div>
      </div>

      {/* Pipeline bar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 52 }}>
        <div className="pipe-row" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          {activeScenario ? pipeline.map((node, i) => (
            <div key={`${node}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={`pipe-node${donePipelineNodes.has(i) ? " done" : state?.activePipelineStep === i && !donePipelineNodes.has(i) ? " active" : ""}`}>
                {node}
              </div>
              {i < pipeline.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>→</span>}
            </div>
          )) : <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>select a scenario to begin</span>}
        </div>

        {state && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>$</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {state.totalCost.toFixed(8)}
            </span>
            {state.done && state.totalDuration > 0 && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 10 }}>
                {(state.totalDuration / 1000).toFixed(2)}s
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="layout" style={{ display: "flex", height: "calc(100vh - 112px)" }}>

        {/* Sidebar */}
        <div className="sidebar" style={{ width: 240, borderRight: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", flexShrink: 0 }}>
          <div className="sidebar-inner" style={{ display: "flex", flexDirection: "column", gap: 4, padding: "20px 16px" }}>
            {(["code", "finance", "research"] as const).map(agent => (
              <div key={agent}>
                <p className="group-head" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", padding: "16px 0 8px" }}>{agent}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SCENARIOS.filter(s => s.agent === agent).map(s => (
                    <button key={s.id} className={`sc-btn${selected === s.id ? " active" : ""}`} onClick={() => !running && runScenario(s)} disabled={running}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: selected === s.id ? "#c4b5fd" : "#fff", marginBottom: 2 }}>{s.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps feed */}
        <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {!state && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 16, height: 16, border: "1.5px solid rgba(124,58,237,0.5)", borderRadius: "50%" }} />
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>pick a scenario to run</p>
            </div>
          )}

          {state?.error && (
            <div style={{ border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "14px 18px", background: "rgba(239,68,68,0.07)", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#f87171", fontWeight: 500 }}>{state.error}</p>
            </div>
          )}

          {state?.steps.map((step, i) => (
            <div key={i} className="step-row">
              <div style={{ marginTop: 3, flexShrink: 0 }}>
                {step.status === "running" && (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: step.status === "running" ? "#fff" : step.status === "error" ? "#f87171" : "rgba(255,255,255,0.6)" }}>
                    {step.label}
                  </span>
                  {step.status === "cached" && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.25)", borderRadius: 4, padding: "1px 6px" }}>cached</span>
                  )}
                </div>
                {step.detail && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.detail}</p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {step.durationMs != null && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>{step.durationMs}ms</p>
                )}
                {step.costUsd != null && step.costUsd > 0 && (
                  <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>${step.costUsd.toFixed(8)}</p>
                )}
              </div>
            </div>
          ))}

          {running && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
              <div style={{ width: 10, height: 10, border: "1.5px solid rgba(124,58,237,0.4)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              streaming
            </div>
          )}

          {state?.done && !state.error && (
            <div style={{ border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "14px 18px", background: "rgba(16,185,129,0.05)", marginTop: 16 }}>
              <p style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>
                complete · ${state.totalCost.toFixed(8)} · {(state.totalDuration / 1000).toFixed(2)}s
              </p>
            </div>
          )}
        </div>

        {/* Events panel */}
        <div className="events-col" style={{ width: 300, borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: "20px 16px", flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>event stream</p>

          {!state && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>events appear here</p>}

          {state?.events.filter(e => e.type !== "step" && e.type !== "done").map((ev, i) => {
            const st: Record<string, { bg: string; accent: string; border: string }> = {
              output:    { bg: "rgba(16,185,129,0.06)",  accent: "#34d399", border: "rgba(16,185,129,0.2)" },
              analysis:  { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.25)" },
              tests:     { bg: "rgba(96,165,250,0.07)",  accent: "#60a5fa", border: "rgba(96,165,250,0.2)" },
              sources:   { bg: "rgba(96,165,250,0.07)",  accent: "#60a5fa", border: "rgba(96,165,250,0.2)" },
              report:    { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.25)" },
              questions: { bg: "rgba(167,139,250,0.07)", accent: "#c4b5fd", border: "rgba(167,139,250,0.2)" },
              tickers:   { bg: "rgba(16,185,129,0.06)",  accent: "#34d399", border: "rgba(16,185,129,0.2)" },
              depths:    { bg: "rgba(16,185,129,0.06)",  accent: "#34d399", border: "rgba(16,185,129,0.2)" },
              summary:   { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.25)" },
              result:    { bg: "rgba(251,191,36,0.06)",  accent: "#fbbf24", border: "rgba(251,191,36,0.2)" },
              error:     { bg: "rgba(239,68,68,0.07)",   accent: "#f87171", border: "rgba(239,68,68,0.2)" },
            };
            const c = st[ev.type] ?? { bg: "rgba(255,255,255,0.03)", accent: "#fff", border: "rgba(255,255,255,0.08)" };
            const d = ev.data as Record<string, unknown>;

            return (
              <div key={i} className="ev-card" style={{ background: c.bg, borderColor: c.border }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: c.accent, textTransform: "uppercase", marginBottom: 6 }}>{ev.type}</p>
                <div style={{ fontSize: 12, color: "#fff", lineHeight: 1.5 }}>
                  {ev.type === "output" && (
                    <pre style={{ fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", color: "#34d399", maxHeight: 64, overflow: "hidden" }}>
                      {(d.stdout as string)?.slice(0, 120) || (d.stderr as string)?.slice(0, 80) || "no output"}
                    </pre>
                  )}
                  {ev.type === "analysis" && <span style={{ color: c.accent }}>{d.verdict as string} · {(d.summary as string)?.slice(0, 60)}</span>}
                  {ev.type === "tests" && <span style={{ color: c.accent }}>{d.passCount as number}/{d.total as number} passed</span>}
                  {ev.type === "sources" && <span>4 sources fetched in parallel</span>}
                  {ev.type === "report" && <span>{(d.text as string)?.slice(0, 90)}</span>}
                  {ev.type === "questions" && <span>{(d.questions as string[])?.length ?? 0} follow-up questions generated</span>}
                  {ev.type === "tickers" && <span>market data fetched</span>}
                  {ev.type === "depths" && <span>order books analyzed</span>}
                  {ev.type === "summary" && <span>{(d.text as string)?.slice(0, 80)}</span>}
                  {ev.type === "result" && (
                    <span style={{ color: c.accent }}>
                      {d.totalCostUsd != null ? `$${(d.totalCostUsd as number).toFixed(8)}` : "complete"}
                      {d.receipt ? " · receipted" : ""}
                    </span>
                  )}
                  {ev.type === "error" && <span style={{ color: c.accent }}>{d.message as string}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}