"use client";

import { useRef, useState, useEffect } from "react";

function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(28px)",
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    },
  };
}

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const fade = useFadeUp(delay);
  return <div ref={fade.ref} style={{ ...fade.style, ...style }}>{children}</div>;
}

const CAPABILITIES = [
  { title: "Compute Execution", desc: "Run Python, Node, Go in isolated sandboxes. Submit code, get output. No runtime to manage." },
  { title: "API Execution", desc: "Trigger any external service through one interface. One call in, one structured result back." },
  { title: "Data Execution", desc: "Fetch and process live data within a single execution. Results come back typed and structured." },
  { title: "Stateful Execution", desc: "Agents keep full context between calls. Each execution has access to prior session state." },
];

const WALLET_ADDRESS = "0xac5c3cbbfa0a28f5208e5411b2a07d462511c13d";
const ARC_SCAN_URL = `https://testnet.arcscan.app/address/${WALLET_ADDRESS}`;

export default function HomePage() {
  const [hoveredCap, setHoveredCap] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#080809", color: "#fff", overflowX: "hidden", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: rgba(139,92,246,0.35); }

        .btn-primary { display: inline-flex; align-items: center; padding: 12px 24px; border-radius: 7px; text-decoration: none; background: #fff; color: #080809; font-weight: 700; font-size: 15px; letter-spacing: -0.01em; transition: background 0.2s, transform 0.15s; white-space: nowrap; }
        .btn-primary:hover { background: #e4e4e8; transform: translateY(-1px); }

        .btn-ghost { display: inline-flex; align-items: center; padding: 12px 24px; border-radius: 7px; text-decoration: none; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); font-weight: 500; font-size: 15px; letter-spacing: -0.01em; transition: border-color 0.2s, color 0.2s, transform 0.15s; white-space: nowrap; }
        .btn-ghost:hover { border-color: rgba(139,92,246,0.6); color: rgba(139,92,246,0.9); transform: translateY(-1px); }

        .sec { padding: 60px 20px; max-width: 1280px; margin: 0 auto; }
        .sec-divider { border-top: 1px solid rgba(255,255,255,0.05); }
        .sec-alt { background: #0b0b0d; }

        .cap-row { display: grid; grid-template-columns: 1fr; gap: 10px; border-top: 1px solid rgba(255,255,255,0.06); padding: 28px 0; cursor: default; }
        .cap-row:last-child { border-bottom: 1px solid rgba(255,255,255,0.06); }

        .step-card { padding: 28px; background: #0f0f11; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; transition: border-color 0.3s, transform 0.3s; }
        .step-card:hover { border-color: rgba(139,92,246,0.35); transform: translateY(-2px); }

        .why-item { padding: 24px 0; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 16px; align-items: start; }
        .why-item:last-child { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .why-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(139,92,246,0.6); margin-top: 9px; flex-shrink: 0; transition: background 0.2s; }
        .why-item:hover .why-dot { background: rgba(139,92,246,1); }

        .code-block { font-family: 'DM Mono', monospace; font-size: 12.5px; line-height: 1.85; background: #0f0f11; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 24px; overflow-x: auto; }
        .code-comment { color: rgba(255,255,255,0.4); }
        .code-key { color: rgba(139,92,246,0.85); }
        .code-str { color: rgba(110,231,183,0.8); }
        .code-num { color: rgba(251,191,36,0.8); }

        .noise-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.02; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px; }

        .usecase-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
        }
        .usecase-card {
          background: #0f0f11;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 28px 24px;
          transition: all 0.3s ease;
        }
        .usecase-card:hover {
          border-color: rgba(139,92,246,0.4);
          transform: translateY(-3px);
          background: #111114;
        }
        .usecase-badge {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: rgba(139,92,246,0.8);
          margin-bottom: 16px;
          display: inline-block;
          padding: 4px 12px;
          border-radius: 40px;
          background: rgba(139,92,246,0.12);
          border: 1px solid rgba(139,92,246,0.2);
        }
        .usecase-title {
          font-size: clamp(1.2rem, 3vw, 1.5rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
          line-height: 1.3;
          color: rgba(255,255,255,0.92);
        }
        .usecase-desc {
          font-size: clamp(14px, 1.8vw, 16px);
          line-height: 1.7;
          color: rgba(255,255,255,0.7);
          font-weight: 300;
        }

        @media (min-width: 640px) {
          .usecase-grid { grid-template-columns: repeat(2, 1fr); gap: 32px; }
        }
        @media (min-width: 1024px) {
          .usecase-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 640px) {
          .sec { padding: 100px 32px; }
          .cap-row { grid-template-columns: 1fr 1fr; gap: 0; }
          .step-grid { grid-template-columns: 1fr 1fr !important; }
          .why-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .sec-header { flex-direction: row !important; align-items: flex-end !important; }
          .sec-header p { text-align: right !important; }
        }

        @media (min-width: 1024px) {
          .sec { padding: 110px 48px; }
          .problem-grid { grid-template-columns: 360px 1fr !important; }
        }

        @media (max-width: 639px) {
          .step-card { padding: 20px; }
          .code-block { padding: 16px; font-size: 11px; }
        }
      `}</style>

      <div className="noise-overlay" />

      {/* ── HERO ── */}
      <section style={{
        padding: "90px 20px 60px",
        minHeight: "100vh",
        maxWidth: 1280,
        margin: "0 auto",
        position: "relative",
      }}>
        <style>{`
          @media (min-width: 640px) {
            .hero-section { padding: 110px 32px 80px !important; }
          }
        `}</style>
        <div className="hero-section" style={{
          padding: "90px 20px 60px",
          minHeight: "100vh",
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
            pointerEvents: "none"
          }} />

          <FadeUp delay={0}>
            <h1 style={{ fontSize: "clamp(3rem, 11vw, 8.5rem)", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.045em", marginBottom: 36 }}>
              Run code.<br />
              <span style={{ color: "rgba(255,255,255,0.16)" }}>Trigger actions.</span><br />
              Fetch data.
            </h1>
          </FadeUp>

          <FadeUp delay={100}>
            <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px 60px", maxWidth: 860, marginBottom: 44 }}>
              <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", lineHeight: 1.75, color: "rgba(255,255,255,0.72)", fontWeight: 300 }}>
                A unified execution layer for autonomous agents and software systems. Pay per execution — no subscriptions, no infrastructure to own.
              </p>
              <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", lineHeight: 1.75, color: "rgba(255,255,255,0.72)", fontWeight: 300 }}>
                One API call in. One structured result out. Retried, sandboxed, and settled automatically.
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={180}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="/auth" className="btn-primary">Generate API Key</a>
              <a href="#how" className="btn-ghost">See how it works</a>
            </div>
          </FadeUp>

          <FadeUp delay={260} style={{ marginTop: 72 }}>
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 44 }}>
              {[
                { val: "<42ms", label: "Average latency" },
                { val: "$0.003", label: "Per execution at scale" },
                { val: "4 types", label: "One unified API" },
                { val: "Zero", label: "Infrastructure overhead" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em", marginBottom: 6 }}>{val}</div>
                  <div style={{ fontSize: "clamp(13px, 2vw, 15px)", color: "rgba(255,255,255,0.55)" }}>{label}</div>
                </div>
              ))}
            </div>
          </FadeUp>

          {/* ── WALLET LINK SECTION ── */}
          <FadeUp delay={320} style={{ marginTop: 48 }}>
            <div style={{ 
              padding: "20px 24px", 
              background: "rgba(139,92,246,0.08)", 
              border: "1px solid rgba(139,92,246,0.2)", 
              borderRadius: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  View your transaction history
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "rgba(139,92,246,0.9)" }}>
                  {WALLET_ADDRESS.slice(0, 6)}...{WALLET_ADDRESS.slice(-4)}
                </div>
              </div>
              <a 
                href={ARC_SCAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ padding: "8px 20px", fontSize: 13 }}
              >
                View on ARC Testnet →
              </a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── IMAGE BREAK ── */}
      <FadeUp>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px 72px" }}>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1400&auto=format&fit=crop&q=80" alt="Server infrastructure" style={{ width: "100%", height: "clamp(200px, 40vw, 420px)", objectFit: "cover", display: "block", filter: "brightness(0.38) saturate(0.45)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,8,9,0.6) 0%, transparent 50%, rgba(8,8,9,0.6) 100%)" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
              <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.9rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 560, lineHeight: 1.3 }}>
                Infrastructure designed for machines, not monthly billing cycles.
              </p>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* ── PROBLEM ── */}
      <section className="sec sec-divider">
        <div className="problem-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "48px 72px", alignItems: "start" }}>
          <FadeUp>
            <div>
              <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: 18 }}>Compute wasn't built for agents</h2>
              <p style={{ fontSize: "clamp(14px, 2vw, 16px)", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", fontWeight: 300 }}>Every major cloud was designed around human operators. Monthly plans, pre-provisioned servers, billing cycles that aggregate what you used last month.</p>
            </div>
          </FadeUp>
          <div>
            {[
              { title: "Subscriptions don't fit agents", body: "Monthly plans were built for predictable human usage. Autonomous agents spike, pause, and burst unpredictably. You end up paying for idle capacity." },
              { title: "Infrastructure ownership is overhead", body: "Configuring servers, containers, and autoscaling consumes engineering hours. None of it is your core product. It's a tax on every team that touches compute." },
              { title: "Billing doesn't match actual usage", body: "Traditional cloud billing aggregates consumption across hours. By the time you see the cost, the moment to optimize has already passed." },
            ].map(({ title, body }, i) => (
              <FadeUp key={title} delay={i * 80}>
                <div style={{ paddingTop: 32, paddingBottom: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ fontSize: "clamp(1rem, 2.2vw, 1.25rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12, lineHeight: 1.2 }}>{title}</h3>
                  <p style={{ fontSize: "clamp(14px, 2vw, 16px)", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", fontWeight: 300 }}>{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="sec-alt sec-divider">
        <div className="sec">
          <FadeUp>
            <div className="sec-header" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em" }}>What Runix executes</h2>
              <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "rgba(255,255,255,0.55)", maxWidth: 300, lineHeight: 1.6 }}>Four execution types. One API. No configuration.</p>
            </div>
          </FadeUp>
          {CAPABILITIES.map((cap, i) => (
            <FadeUp key={cap.title} delay={i * 55}>
              <div className="cap-row" onMouseEnter={() => setHoveredCap(i)} onMouseLeave={() => setHoveredCap(null)}>
                <h3 style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", fontWeight: 700, letterSpacing: "-0.025em", color: hoveredCap === i ? "#fff" : "rgba(255,255,255,0.75)", transition: "color 0.2s", paddingRight: 32, lineHeight: 1.2 }}>{cap.title}</h3>
                <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", fontWeight: 300 }}>{cap.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="sec sec-divider">
        <FadeUp>
          <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: 56 }}>Three steps.<br />Zero infrastructure.</h2>
        </FadeUp>
        <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { n: "01", title: "Send an execution request", body: "Your system makes a single API call describing what to run. No setup, no infrastructure to configure first." },
              { n: "02", title: "Runix routes and isolates", body: "The request is matched to the right engine, sandboxed, and run in isolation. Multiple concurrent jobs handled automatically." },
              { n: "03", title: "Results return, cost settles", body: "You receive a structured response with output, status, duration, and execution ID. Payment settles in the same moment." },
            ].map(({ n, title, body }, i) => (
              <FadeUp key={n} delay={i * 90}>
                <div className="step-card">
                  <div style={{ display: "flex", gap: 18, alignItems: "start" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: "rgba(139,92,246,0.55)", paddingTop: 3, flexShrink: 0 }}>{n}</span>
                    <div>
                      <div style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>{title}</div>
                      <div style={{ fontSize: "clamp(13px, 1.8vw, 15px)", lineHeight: 1.8, color: "rgba(255,255,255,0.65)", fontWeight: 300 }}>{body}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={200}>
            <div className="code-block">
              <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6 }}>
                {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
              </div>
              <div className="code-comment">{"// Single execution request"}</div>
              <br />
              <div><span className="code-key">const</span> result = <span className="code-key">await</span> runix.<span style={{ color: "rgba(96,165,250,0.85)" }}>execute</span>{"({"}</div>
              <div style={{ paddingLeft: 20 }}>
                <div><span className="code-key">type</span>: <span className="code-str">"compute"</span>,</div>
                <div><span className="code-key">runtime</span>: <span className="code-str">"python3.12"</span>,</div>
                <div><span className="code-key">timeout_ms</span>: <span className="code-num">5000</span>,</div>
              </div>
              <div>{"});"}</div>
              <br />
              <div className="code-comment">{"// result is immediately available"}</div>
              <div><span className="code-key">console</span>.log(result.<span style={{ color: "rgba(96,165,250,0.85)" }}>output</span>);     <span className="code-comment">{"// { ... }"}</span></div>
              <div><span className="code-key">console</span>.log(result.<span style={{ color: "rgba(96,165,250,0.85)" }}>duration_ms</span>);  <span className="code-comment">{"// 38"}</span></div>
              <div><span className="code-key">console</span>.log(result.<span style={{ color: "rgba(96,165,250,0.85)" }}>cost_usd</span>);     <span className="code-comment">{"// 0.00003"}</span></div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="sec-alt sec-divider">
        <div className="sec">
          <FadeUp>
            <div className="sec-header" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em" }}>Built for systems that never stop</h2>
              <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "rgba(255,255,255,0.7)", maxWidth: 300, lineHeight: 1.5 }}>
                The highest‑demand workloads, least served by conventional platforms.
              </p>
            </div>
          </FadeUp>
          <div className="usecase-grid">
            {[
              { industry: "Financial Services", title: "Real-time risk computation per market event", body: "Algorithmic trading systems need computation on every signal. Runix lets risk models execute per event, paying only for each computation." },
              { industry: "AI Agents", title: "Autonomous agents that pay per action", body: "AI agents call compute, APIs, and data as part of their decision loop. Each action is independently executed, sandboxed, and settled." },
              { industry: "Developer Tooling", title: "Code analysis that scales with activity", body: "CI/CD tools have bursty, unpredictable workloads. Execute analysis jobs only when triggered — no idle infrastructure to pay for." },
              { industry: "Data Platforms", title: "Per-query billing that mirrors actual value", body: "Data products that charge per query can now execute and settle payment in one step. Cost aligns exactly with consumption." },
              { industry: "Edge Computing", title: "Low‑latency inference at the edge", body: "Run models and processing near your users. Each execution is sandboxed and billed per request – no cold starts or idle servers." },
              { industry: "Web3 & DeFi", title: "On‑chain compute without nodes", body: "Execute off‑chain logic that feeds into smart contracts. Pay only for each verification or data fetch, not for maintaining nodes." },
            ].map((item, i) => (
              <FadeUp key={item.industry} delay={i * 50}>
                <div className="usecase-card">
                  <div className="usecase-badge">{item.industry}</div>
                  <h3 className="usecase-title">{item.title}</h3>
                  <p className="usecase-desc">{item.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY RUNIX ── */}
      <section className="sec sec-divider">
        <FadeUp>
          <div className="sec-header" style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.035em" }}>Built for agent workloads</h2>
            <p style={{ fontSize: "clamp(14px, 2vw, 16px)", color: "rgba(255,255,255,0.6)", maxWidth: 300, lineHeight: 1.6 }}>Most execution tools are wrappers. Runix is infrastructure.</p>
          </div>
        </FadeUp>
        <div className="why-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0 64px" }}>
          {[
            { title: "Per-execution pricing", desc: "Cost is determined by what ran, not what you reserved. No minimums, no idle waste." },
            { title: "Synchronous results", desc: "Call Runix, get a result. No polling, no callbacks, no async state to manage." },
            { title: "Machine-native design", desc: "API surface designed around agent access patterns, not human dashboards." },
            { title: "Parallel by default", desc: "Submit concurrent jobs. Runix handles queuing and isolation automatically." },
            { title: "Zero infrastructure surface", desc: "No servers to configure, no containers to build. Ship integrations, not infrastructure." },
            { title: "Audit-ready output", desc: "Every execution returns an ID, status, duration, and output. No logging layer needed." },
          ].map(({ title, desc }, i) => (
            <FadeUp key={title} delay={i * 55}>
              <div className="why-item">
                <div className="why-dot" />
                <div>
                  <div style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.05rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 7, color: "rgba(255,255,255,0.9)" }}>{title}</div>
                  <div style={{ fontSize: "clamp(13px, 1.8vw, 15px)", lineHeight: 1.75, color: "rgba(255,255,255,0.65)", fontWeight: 300 }}>{desc}</div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="sec-divider">
        <div className="sec">
          <FadeUp>
            <div style={{ maxWidth: 720 }}>
              <h2 style={{ fontSize: "clamp(2.6rem, 9vw, 6rem)", fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 0.9, marginBottom: 32 }}>
                First request<br />
                <span style={{ color: "rgba(255,255,255,0.14)" }}>in 2 minutes.</span>
              </h2>
              <p style={{ fontSize: "clamp(15px, 2.5vw, 18px)", lineHeight: 1.75, maxWidth: 440, marginBottom: 40, color: "rgba(255,255,255,0.7)", fontWeight: 300 }}>
                Generate an API key and send your first execution. No card required, no setup calls, no infrastructure to provision.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/auth" className="btn-primary">Generate API Key</a>
                <a href="/docs" className="btn-ghost">Read the Docs</a>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}