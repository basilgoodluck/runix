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
  result: Record<string, unknown> | null;
}

function pipelineStepForLabel(label: string, agent: string): number {
  const pipeline = PIPELINES[agent] ?? [];
  const lower = label.toLowerCase();
  for (let i = 0; i < pipeline.length; i++) {
    if (lower.includes(pipeline[i]!)) return i;
  }
  return -1;
}

function PayloadDropdown({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);
  const endpoint = `${API_URL}/agents/demo/${scenario.agent}`;
  const payload = scenario.payload;

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: open ? "8px 8px 0 0" : 8, padding: "10px 14px", cursor: "pointer",
          color: "#fff", fontFamily: "inherit", width: "100%", textAlign: "left",
          transition: "background 0.15s",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Request</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace", flex: 1 }}>POST {endpoint.replace(API_URL ?? "", "")}</span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>

      {open && (
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "14px 16px" }}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Endpoint</p>
            <p style={{ fontSize: 12, color: "#a78bfa", fontFamily: "monospace" }}>{endpoint}</p>
          </div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Method</p>
            <p style={{ fontSize: 12, color: "#34d399", fontFamily: "monospace" }}>POST</p>
          </div>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Headers</p>
            <p style={{ fontSize: 12, color: "#93c5fd", fontFamily: "monospace" }}>Content-Type: application/json</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Body</p>
            <pre style={{ fontSize: 12, color: "#fff", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6, maxHeight: 240, overflowY: "auto" }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, agent }: { result: Record<string, unknown>; agent: Agent }) {
  if (agent === "code") {
    const tests = result.testsPassed as number;
    const total = result.testsTotal as number;
    const verdict = result.verdict as string;
    const summary = result.summary as string;
    const originalOutput = result.originalOutput as string;
    const fixedOutput = result.fixedOutput as string;
    const receipt = result.receipt as Record<string, unknown> | undefined;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Verdict</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: verdict === "pass" ? "#34d399" : verdict === "fail" ? "#f87171" : "#fbbf24" }}>{verdict?.toUpperCase()}</p>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tests</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: tests === total ? "#34d399" : "#fbbf24" }}>{tests}/{total}</p>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fix Applied</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: result.fixApplied ? "#a78bfa" : "rgba(255,255,255,0.4)" }}>{result.fixApplied ? "YES" : "NO"}</p>
          </div>
        </div>

        {summary && (
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>LLM Analysis</p>
            <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.7 }}>{summary}</p>
          </div>
        )}

        {originalOutput && (
          <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>stdout</p>
            <pre style={{ fontSize: 13, color: "#a7f3d0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>{originalOutput}</pre>
          </div>
        )}

        {fixedOutput && (
          <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "#34d399", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fixed stdout</p>
            <pre style={{ fontSize: 13, color: "#a7f3d0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6 }}>{fixedOutput}</pre>
          </div>
        )}

        {receipt && (
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Receipt</p>
            <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7 }}>
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Raw result</p>
          <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7, maxHeight: 200, overflowY: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (agent === "research") {
    const report = result.report as string;
    const questions = result.questions as string[];
    const sourceCount = result.sourceCount as number;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sources fetched</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#93c5fd" }}>{sourceCount}/4</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Wikipedia · HackerNews · arXiv · Reddit</p>
        </div>

        {report && (
          <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 8, padding: "16px" }}>
            <p style={{ fontSize: 11, color: "#a78bfa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Report</p>
            <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{report}</p>
          </div>
        )}

        {questions?.length > 0 && (
          <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "#c4b5fd", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Follow-up questions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <p style={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>{q}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Raw result</p>
          <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7, maxHeight: 200, overflowY: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (agent === "finance") {
    const summary = result.summary as string;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {summary && (
          <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 8, padding: "16px" }}>
            <p style={{ fontSize: 11, color: "#34d399", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Market Summary</p>
            <p style={{ fontSize: 14, color: "#fff", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{summary}</p>
          </div>
        )}

        <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Raw result</p>
          <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.7, maxHeight: 200, overflowY: "auto" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return null;
}

export default function DemoPage() {
  const [selected, setSelected] = useState<string | null>(null);
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
    setState({ steps: [], events: [], totalCost: 0, totalDuration: 0, done: false, activePipelineStep: -1, result: null });

    try {
      const res = await fetch(`${API_URL}/agents/demo/${scenario.agent}`, {
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
            setState(prev => prev ? { ...prev, error: p.message as string, done: true } : prev);
            setRunning(false);
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
              next.activePipelineStep = pipelineStepForLabel(step.label, scenario.agent);
              if (step.costUsd) next.totalCost = Number((next.totalCost + step.costUsd).toFixed(10));
            }

            if (eventType === "result") next.result = p;

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
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#fff", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .sc-btn {
          width: 100%; text-align: left; background: transparent;
          border: 1px solid rgba(255,255,255,0.09); border-radius: 8px;
          padding: 12px 14px; cursor: pointer; font-family: inherit;
          transition: all 0.15s ease;
        }
        .sc-btn:hover:not(:disabled) { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); }
        .sc-btn.active { background: rgba(124,58,237,0.12); border-color: #7c3aed; box-shadow: 0 0 0 1px rgba(124,58,237,0.15); }
        .sc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .pipe-node {
          padding: 6px 16px; border-radius: 24px; font-size: 13px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.65);
          transition: all 0.2s; white-space: nowrap;
        }
        .pipe-node.active { border-color: #7c3aed; color: #fff; background: rgba(124,58,237,0.18); box-shadow: 0 0 12px rgba(124,58,237,0.2); }
        .pipe-node.done   { border-color: #10b981; color: #6ee7b7; background: rgba(16,185,129,0.07); }

        .step-row {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          animation: fadeUp 0.2s ease;
        }
        .step-row:last-child { border-bottom: none; }

        .ev-card {
          border-radius: 8px; padding: 12px 14px; margin-bottom: 8px;
          border: 1px solid transparent; animation: fadeUp 0.2s ease;
        }

        @media (max-width: 768px) {
          .layout { flex-direction: column !important; height: auto !important; }
          .sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08) !important; }
          .sidebar-inner { flex-direction: row !important; flex-wrap: nowrap; overflow-x: auto; padding: 12px !important; gap: 8px !important; }
          .group-head { display: none !important; }
          .sc-btn { min-width: 140px; }
          .events-col { width: 100% !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.08) !important; max-height: 300px; }
          .pipe-row { overflow-x: auto; }
        }
      `}</style>

      {/* Topbar */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 4px 16px rgba(124,58,237,0.4)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>Runix</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginLeft: 2 }}>demo</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>live</span>
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
              {i < pipeline.length - 1 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>→</span>}
            </div>
          )) : <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Select a scenario to begin</span>}
        </div>

        {state && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>$</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#c4b5fd", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {state.totalCost.toFixed(8)}
            </span>
            {state.done && state.totalDuration > 0 && (
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 12 }}>
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
            {(["code", "finance", "research"] as const).map(agent => (
              <div key={agent}>
                <p className="group-head" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", padding: "16px 0 10px" }}>{agent}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SCENARIOS.filter(s => s.agent === agent).map(s => (
                    <button key={s.id} className={`sc-btn${selected === s.id ? " active" : ""}`} onClick={() => !running && runScenario(s)} disabled={running}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{s.sub}</p>
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, border: "1px solid rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(124,58,237,0.4)", borderRadius: "50%" }} />
              </div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Select a scenario to run</p>
            </div>
          )}

          {/* Payload dropdown — shown once a scenario is selected */}
          {activeScenario && <PayloadDropdown scenario={activeScenario} />}

          {state?.error && (
            <div style={{ border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "14px 18px", background: "rgba(239,68,68,0.06)", marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: "#f87171", fontWeight: 500 }}>{state.error}</p>
            </div>
          )}

          {state?.steps.map((step, i) => (
            <div key={i} className="step-row">
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                {step.status === "running" && (
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                )}
                {(step.status === "done" || step.status === "cached") && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
                  </div>
                )}
                {step.status === "error" && (
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: step.status === "running" ? "#fff" : step.status === "error" ? "#f87171" : "rgba(255,255,255,0.8)" }}>
                    {step.label}
                  </span>
                  {step.status === "cached" && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#93c5fd", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.22)", borderRadius: 4, padding: "2px 8px" }}>cached</span>
                  )}
                </div>
                {step.detail && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.detail}</p>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                {step.durationMs != null && (
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>{step.durationMs}ms</p>
                )}
                {step.costUsd != null && step.costUsd > 0 && (
                  <p style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 600 }}>${step.costUsd.toFixed(8)}</p>
                )}
              </div>
            </div>
          ))}

          {running && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 0", color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
              <div style={{ width: 12, height: 12, border: "2px solid rgba(124,58,237,0.35)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Streaming
            </div>
          )}

          {state?.done && !state.error && (
            <div style={{ border: "1px solid rgba(16,185,129,0.18)", borderRadius: 8, padding: "14px 18px", background: "rgba(16,185,129,0.05)", marginTop: 16, marginBottom: 28 }}>
              <p style={{ fontSize: 14, color: "#34d399", fontWeight: 600 }}>
                Complete · ${state.totalCost.toFixed(8)} · {(state.totalDuration / 1000).toFixed(2)}s
              </p>
            </div>
          )}

          {state?.result && activeScenario && (
            <div style={{ paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)", animation: "fadeUp 0.3s ease" }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>Result</p>
              <ResultPanel result={state.result} agent={activeScenario.agent} />
            </div>
          )}
        </div>

        {/* Events panel — raw, no filtering */}
        <div className="events-col" style={{ width: 300, borderLeft: "1px solid rgba(255,255,255,0.08)", overflowY: "auto", padding: "20px 16px", flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 16 }}>Event stream</p>

          {!state && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No events yet</p>}

          {state?.events.filter(e => e.type !== "step" && e.type !== "done").map((ev, i) => {
            const palette: Record<string, { bg: string; accent: string; border: string }> = {
              output:    { bg: "rgba(16,185,129,0.07)",  accent: "#34d399", border: "rgba(16,185,129,0.16)" },
              analysis:  { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.18)" },
              tests:     { bg: "rgba(96,165,250,0.07)",  accent: "#93c5fd", border: "rgba(96,165,250,0.16)" },
              sources:   { bg: "rgba(96,165,250,0.07)",  accent: "#93c5fd", border: "rgba(96,165,250,0.16)" },
              report:    { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.18)" },
              questions: { bg: "rgba(167,139,250,0.07)", accent: "#c4b5fd", border: "rgba(167,139,250,0.16)" },
              tickers:   { bg: "rgba(16,185,129,0.07)",  accent: "#34d399", border: "rgba(16,185,129,0.16)" },
              depths:    { bg: "rgba(16,185,129,0.07)",  accent: "#34d399", border: "rgba(16,185,129,0.16)" },
              summary:   { bg: "rgba(124,58,237,0.08)",  accent: "#a78bfa", border: "rgba(124,58,237,0.18)" },
              result:    { bg: "rgba(251,191,36,0.07)",  accent: "#fcd34d", border: "rgba(251,191,36,0.16)" },
              error:     { bg: "rgba(239,68,68,0.07)",   accent: "#f87171", border: "rgba(239,68,68,0.16)" },
            };
            const c = palette[ev.type] ?? { bg: "rgba(255,255,255,0.03)", accent: "#fff", border: "rgba(255,255,255,0.07)" };
            const d = ev.data as Record<string, unknown>;

            return (
              <div key={i} className="ev-card" style={{ background: c.bg, borderColor: c.border }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: c.accent, textTransform: "uppercase", marginBottom: 8 }}>{ev.type}</p>
                <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6, maxHeight: 120, overflowY: "auto" }}>
                  {JSON.stringify(d, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}