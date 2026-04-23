"use client";

import { useRef, useState, useEffect } from "react";

const CAPABILITIES = [
  { title: "Compute Execution", desc: "Run Python, Node, Go, and more in isolated, sandboxed environments. Your agent submits code and gets output — no runtime to manage, no environment to keep alive between calls." },
  { title: "API Execution", desc: "Trigger any external service through a single interface. No wrapper logic to build or maintain. One call in, one structured result back — retried and handled automatically." },
  { title: "Data Execution", desc: "Fetch and process live data sources within a single execution. Results come back typed and structured — your agent receives answers, not raw payloads it has to parse." },
  { title: "Stateful Execution", desc: "Agents working across multi-step tasks keep full context between calls. Each execution has access to prior session state — enabling reasoning chains that span multiple steps." },
];

function useFadeUp(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(24px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    },
  };
}

function FadeUp({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const fade = useFadeUp(delay);
  return <div ref={fade.ref} style={{ ...fade.style, ...style }}>{children}</div>;
}

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b0c0e", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        .grad-radial-tl { background: radial-gradient(ellipse 70% 60% at 0% 0%, rgba(99,102,241,0.07) 0%, transparent 70%), #0b0c0e; }
        .grad-radial-tr { background: radial-gradient(ellipse 70% 60% at 100% 0%, rgba(139,92,246,0.07) 0%, transparent 70%), #0d0e10; }
        .grad-radial-center { background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%), #0b0c0e; }
        .grad-subtle-bottom { background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139,92,246,0.05) 0%, transparent 70%), #0d0e10; }
        .hero-glow { position: absolute; top: -120px; right: -200px; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%); pointer-events: none; }
        @media (max-width: 768px) {
          .hero-section { padding: 150px 20px 72px !important; }
          .hero-title { font-size: clamp(2.8rem, 12vw, 4rem) !important; }
          .section-pad { padding: 72px 20px !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .cap-grid { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .two-col { grid-template-columns: 1fr !important; }
          .why-outer { grid-template-columns: 1fr !important; gap: 40px !important; }
          .why-cards { grid-template-columns: 1fr !important; }
          .cta-section { padding: 80px 20px !important; }
          .hero-glow { display: none; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero-section grad-radial-tl" style={{ position: "relative", padding: "216px 32px 128px" }}>
        <div className="hero-glow" />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <FadeUp delay={0}>
            <h1 className="hero-title" style={{ fontSize: "clamp(3.5rem, 8vw, 7.5rem)", fontWeight: 800, lineHeight: 0.93, letterSpacing: "-0.03em", marginBottom: 32 }}>
              Run Code.<br />Trigger Actions.<br /><span style={{ color: "rgba(255,255,255,0.2)" }}>Fetch Data.</span>
            </h1>
          </FadeUp>
          <FadeUp delay={120}>
            <p style={{ fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.75, maxWidth: 480, marginBottom: 44, color: "rgba(255,255,255,0.55)" }}>
              A unified execution layer for autonomous agents and software systems. Pay per execution — no subscriptions, no infrastructure to own, no idle costs.
            </p>
          </FadeUp>
          <FadeUp delay={220}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="/auth" style={{ padding: "13px 26px", borderRadius: 8, textDecoration: "none", background: "#fff", color: "#0b0c0e", fontWeight: 700, fontSize: 14 }}>Get API Key →</a>
              <a href="#how" style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: 8, textDecoration: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>How it works</a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* STATS */}
      <div style={{ padding: "0 32px" }}>
        <div className="stats-grid" style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { val: "<42ms", label: "Average execution latency" },
            { val: "$0.003", label: "Per-execution cost at scale" },
            { val: "4 types", label: "In one unified API" },
            { val: "Zero", label: "Infrastructure to configure" },
          ].map(({ val, label }, i) => (
            <FadeUp key={label} delay={i * 80} style={{ background: "#111214", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", padding: "32px 24px" }}>
              <div style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>{val}</div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.5)" }}>{label}</div>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section className="grad-radial-center">
        <div className="section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px" }}>
          <FadeUp>
            <div style={{ maxWidth: 600, marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20, lineHeight: 1.1 }}>Compute infrastructure wasn't built for agents</h2>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>Every major cloud and automation platform was designed around human operators — monthly plans, pre-provisioned servers, and billing cycles that aggregate what you used last month.</p>
            </div>
          </FadeUp>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { title: "Subscriptions don't fit agents", body: "Monthly plans were built for predictable human usage. Autonomous agents spike, pause, and burst unpredictably. You end up paying for idle capacity that never runs." },
              { title: "Infrastructure ownership is overhead", body: "Configuring servers, containers, and autoscaling policies consumes engineering hours. None of it is your core product — it's a tax on every team that touches compute." },
              { title: "Billing doesn't match actual usage", body: "Traditional cloud billing aggregates consumption across hours. By the time you see the cost, the moment to optimize has passed." },
            ].map(({ title, body }, i) => (
              <FadeUp key={title} delay={i * 80}>
                <div style={{ background: "#111214", borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{title}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section>
        <div className="section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px" }}>
          <FadeUp>
            <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 56 }}>What Runix executes</h2>
          </FadeUp>
          <div className="cap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {CAPABILITIES.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 80}>
                <div style={{ padding: "32px 24px", background: "#111214", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{cap.title}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{cap.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="grad-radial-tr">
        <div className="section-pad how-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <FadeUp>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 20 }}>Three steps.<br />Zero infrastructure.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.75, maxWidth: 360, color: "rgba(255,255,255,0.55)" }}>Your agent describes what to run. Runix handles routing, isolation, execution, and settlement — returning a structured result synchronously.</p>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { n: "01", title: "Send an execution request", body: "Your system makes a single API call describing what to run. No setup required. No infrastructure to configure first." },
              { n: "02", title: "Runix routes and isolates", body: "The request is matched to the right engine, sandboxed, and run in isolation. Multiple concurrent jobs handled automatically." },
              { n: "03", title: "Results return, cost settles", body: "You receive a structured response — output, status, duration, execution ID. Payment settles in the same moment." },
            ].map(({ n, title, body }, i) => (
              <FadeUp key={n} delay={i * 100}>
                <div style={{ position: "relative", overflow: "hidden", display: "flex", gap: 24, padding: "28px 24px", background: "#111214", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
                  <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: "clamp(5rem, 8vw, 7rem)", fontWeight: 900, color: "rgba(255,255,255,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>{n}</span>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{body}</div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section>
        <div className="section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px" }}>
          <FadeUp>
            <div style={{ maxWidth: 560, marginBottom: 56 }}>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 20, lineHeight: 1.1 }}>Built for the systems that never stop running</h2>
              <p style={{ fontSize: 18, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>The organizations with the most demanding execution workloads are the ones least served by conventional compute platforms.</p>
            </div>
          </FadeUp>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { industry: "Financial Services", title: "Real-time risk computation per market event", body: "Algorithmic trading systems need computation on every signal. Runix lets risk models execute per event, paying only for each computation." },
              { industry: "AI Agents", title: "Autonomous agents that pay per action", body: "AI agents call compute, APIs, and data access as part of their decision loop — each action independently executed and settled." },
              { industry: "Developer Tooling", title: "Code analysis that scales with activity", body: "CI/CD and code review tools have bursty, unpredictable workloads. Execute analysis jobs only when triggered — no idle infrastructure." },
              { industry: "Data Platforms", title: "Per-query billing that mirrors actual value", body: "Data products that charge per query can now execute and settle payment in one step. Cost aligns exactly with consumption." },
            ].map(({ industry, title, body }, i) => (
              <FadeUp key={industry} delay={i * 80}>
                <div style={{ background: "#111214", borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: 12, color: "rgba(255,255,255,0.3)" }}>{industry}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>{title}</h3>
                  <p style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* WHY RUNIX */}
      <section className="grad-subtle-bottom">
        <div className="section-pad why-outer" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }}>
          <FadeUp>
            <h2 style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16 }}>Built for agent workloads.</h2>
            <p style={{ fontSize: 18, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>Most execution tools are wrappers. Runix is infrastructure — designed from the ground up for how agents actually run.</p>
          </FadeUp>
          <div className="why-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { title: "Per-execution pricing", desc: "Cost is determined by what ran, not what you reserved. No minimums, no tiers, no idle waste." },
              { title: "Machine-native design", desc: "The API surface and auth model are designed around agent access patterns — not human dashboards." },
              { title: "Zero infrastructure surface", desc: "No servers to configure, no containers to build. Your team ships integrations, not infrastructure." },
              { title: "Synchronous results", desc: "Call Runix, get a result. No polling, no callbacks, no async state to manage." },
              { title: "Parallel by default", desc: "Submit concurrent jobs. Runix handles queuing and isolation automatically." },
              { title: "Audit-ready output", desc: "Every execution returns an ID, status, duration, and output — a full record without building a logging layer." },
            ].map(({ title, desc }, i) => (
              <FadeUp key={title} delay={i * 60}>
                <div style={{ background: "#111214", borderRadius: 12, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 16, lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>{desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="grad-radial-center cta-section" style={{ padding: "144px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeUp>
            <h2 style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.93, marginBottom: 32 }}>
              First request<br /><span style={{ color: "rgba(255,255,255,0.2)" }}>in 2 minutes.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={100}>
            <p style={{ fontSize: 18, lineHeight: 1.75, maxWidth: 400, marginBottom: 40, color: "rgba(255,255,255,0.55)" }}>
              Generate an API key and send your first execution. No card required, no setup calls, no infrastructure to provision.
            </p>
          </FadeUp>
          <FadeUp delay={200}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="/auth" style={{ padding: "14px 28px", borderRadius: 8, textDecoration: "none", background: "#fff", color: "#0b0c0e", fontWeight: 700, fontSize: 14 }}>Generate API Key →</a>
              <a href="#" style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "14px 24px", borderRadius: 8, textDecoration: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>Read the Docs</a>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}