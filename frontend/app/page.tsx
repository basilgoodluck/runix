"use client";

import { useEffect, useRef, useState } from "react";

const CAPABILITIES = [
  {
    title: "Compute Execution",
    desc: "Run Python, Node, Go, and more in isolated, sandboxed environments. Your agent submits code and gets output — no runtime to manage, no environment to keep alive between calls.",
  },
  {
    title: "API Execution",
    desc: "Trigger any external service through a single interface. No wrapper logic to build or maintain. One call in, one structured result back — retried and handled automatically.",
  },
  {
    title: "Data Execution",
    desc: "Fetch and process live data sources within a single execution. Results come back typed and structured — your agent receives answers, not raw payloads it has to parse.",
  },
  {
    title: "Stateful Execution",
    desc: "Agents working across multi-step tasks keep full context between calls. Each execution has access to prior session state — enabling reasoning chains that span multiple steps.",
  },
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

function FadeUp({ children, delay = 0, style = {}, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const fade = useFadeUp(delay);
  return (
    <div ref={fade.ref} style={{ ...fade.style, ...style }} className={className}>
      {children}
    </div>
  );
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-white font-sans" style={{ overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }

        /* Section gradients — applied to the wrapping section bg, not cards */
        .grad-radial-tl {
          background: radial-gradient(ellipse 70% 60% at 0% 0%, rgba(99,102,241,0.07) 0%, transparent 70%), #0b0c0e;
        }
        .grad-radial-tr {
          background: radial-gradient(ellipse 70% 60% at 100% 0%, rgba(139,92,246,0.07) 0%, transparent 70%), #0d0e10;
        }
        .grad-radial-center {
          background: radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%), #0b0c0e;
        }
        .grad-subtle-bottom {
          background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139,92,246,0.05) 0%, transparent 70%), #0d0e10;
        }

        /* Hero glow blob */
        .hero-glow {
          position: absolute;
          top: -120px;
          right: -200px;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%);
          pointer-events: none;
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
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
          .footer-inner { padding: 20px 20px !important; flex-direction: column !important; gap: 16px !important; }
          .footer-links { display: none !important; }
          .hero-glow { display: none; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-section { padding: 180px 40px 80px !important; }
          .section-pad { padding: 80px 40px !important; }
          .cap-grid { grid-template-columns: 1fr 1fr !important; }
          .two-col { grid-template-columns: 1fr 1fr !important; }
          .why-cards { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* NAV */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "background 0.3s, box-shadow 0.3s",
        background: scrolled ? "rgba(11,12,14,0.93)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.55)" : "none",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 108, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Runix</span>
          <nav className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Docs", "API Reference", "Pricing"].map(item => (
              <a key={item} href="#" className="font-sans text-sm text-white/40 hover:text-white/80 transition-colors" style={{ textDecoration: "none" }}>{item}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a href="#" className="hide-mobile font-sans text-sm text-white/40 hover:text-white/80 transition-colors" style={{ textDecoration: "none" }}>Sign in</a>
            <a href="/register" className="font-sans font-bold text-sm text-[#0b0c0e] bg-white hover:bg-white/85 transition-colors" style={{ padding: "9px 20px", borderRadius: 8, textDecoration: "none" }}>Get API Key</a>
          </div>
        </div>
      </header>

      {/* HERO — gradient radial from top-right */}
      <section
        className="hero-section grad-radial-tl"
        style={{ position: "relative", padding: "216px 32px 128px" }}
      >
        <div className="hero-glow" />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>
          <FadeUp delay={0}>
            <h1 className="hero-title font-sans font-extrabold text-white" style={{ fontSize: "clamp(3.5rem, 8vw, 7.5rem)", lineHeight: 0.93, letterSpacing: "-0.03em", marginBottom: 32 }}>
              Run Code.<br />
              Trigger Actions.<br />
              <span className="text-white/20">Fetch Data.</span>
            </h1>
          </FadeUp>
          <FadeUp delay={120}>
            <p className="font-sans text-white/55" style={{ fontSize: "clamp(17px, 2vw, 20px)", lineHeight: 1.75, maxWidth: 480, marginBottom: 44 }}>
              A unified execution layer for autonomous agents and software systems. Pay per execution — no subscriptions, no infrastructure to own, no idle costs.
            </p>
          </FadeUp>
          <FadeUp delay={220}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="/register" className="font-sans font-bold text-sm text-[#0b0c0e] bg-white hover:bg-white/85 transition-colors" style={{ padding: "13px 26px", borderRadius: 8, textDecoration: "none" }}>Get API Key →</a>
              <a href="#how" className="font-sans font-semibold text-sm text-white/50 hover:text-white/80 transition-all" style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "13px 24px", borderRadius: 8, textDecoration: "none" }}>How it works</a>
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
              <div className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)", letterSpacing: "-0.02em", marginBottom: 8 }}>{val}</div>
              <div className="font-sans text-white/50" style={{ fontSize: 15 }}>{label}</div>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* PROBLEM — gradient from bottom-center */}
      <section className="grad-radial-center">
        <div className="section-pad" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px" }}>
          <FadeUp>
            <div style={{ maxWidth: 600, marginBottom: 56 }}>
              <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", letterSpacing: "-0.02em", marginBottom: 20, lineHeight: 1.1 }}>
                Compute infrastructure wasn't built for agents
              </h2>
              <p className="font-sans text-white/55" style={{ fontSize: 18, lineHeight: 1.75 }}>
                Every major cloud and automation platform was designed around human operators — monthly plans, pre-provisioned servers, and billing cycles that aggregate what you used last month. Autonomous systems pay a hidden tax for infrastructure they didn't ask for.
              </p>
            </div>
          </FadeUp>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { title: "Subscriptions don't fit agents", body: "Monthly plans were built for predictable human usage. Autonomous agents spike, pause, and burst unpredictably. You end up paying for idle capacity that never runs." },
              { title: "Infrastructure ownership is overhead", body: "Configuring servers, containers, and autoscaling policies consumes engineering hours. None of it is your core product — it's a tax on every team that touches compute." },
              { title: "Billing doesn't match actual usage", body: "Traditional cloud billing aggregates consumption across hours. By the time you see the cost, the moment to optimize has passed. There's no per-action signal — only a monthly bill." },
            ].map(({ title, body }, i) => (
              <FadeUp key={title} delay={i * 80}>
                <div style={{ background: "#111214", borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <h3 className="font-sans font-semibold text-white" style={{ fontSize: 16, marginBottom: 12 }}>{title}</h3>
                  <p className="font-sans text-white/55" style={{ fontSize: 16, lineHeight: 1.75 }}>{body}</p>
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
            <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em", marginBottom: 56 }}>
              What Runix executes
            </h2>
          </FadeUp>
          <div className="cap-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {CAPABILITIES.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 80}>
                <div style={{ padding: "32px 24px", background: "#111214", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <h3 className="font-sans font-semibold text-white" style={{ fontSize: 16, marginBottom: 14 }}>{cap.title}</h3>
                  <p className="font-sans text-white/55" style={{ fontSize: 16, lineHeight: 1.75 }}>{cap.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — gradient top-right, large faded bg numbers */}
      <section id="how" className="grad-radial-tr">
        <div className="section-pad how-grid" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
          <FadeUp>
            <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 20 }}>
              Three steps.<br />Zero infrastructure.
            </h2>
            <p className="font-sans text-white/55" style={{ fontSize: 18, lineHeight: 1.75, maxWidth: 360 }}>
              Your agent describes what to run. Runix handles routing, isolation, execution, and settlement — returning a structured result synchronously. No polling, no callbacks, no async state to manage.
            </p>
          </FadeUp>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { n: "01", title: "Send an execution request", body: "Your system makes a single API call describing what to run — code, a service call, a data fetch, or a workflow step. No setup required. No infrastructure to configure first." },
              { n: "02", title: "Runix routes and isolates", body: "The request is matched to the right engine, sandboxed, and run in isolation. Multiple concurrent jobs are handled automatically. You don't think about queues or capacity." },
              { n: "03", title: "Results return, cost settles", body: "You receive a structured response — output, status, duration, execution ID. Payment for that exact execution settles in the same moment. No invoices, no billing cycles, no human in the loop." },
            ].map(({ n, title, body }, i) => (
              <FadeUp key={n} delay={i * 100}>
                <div style={{ position: "relative", overflow: "hidden", display: "flex", gap: 24, padding: "28px 28px 28px 24px", background: "#111214", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>
                  {/* Large faded background number */}
                  <span style={{
                    position: "absolute",
                    right: 16,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "clamp(5rem, 8vw, 7rem)",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "rgba(255,255,255,0.04)",
                    lineHeight: 1,
                    userSelect: "none",
                    pointerEvents: "none",
                    fontFamily: "sans-serif",
                  }}>{n}</span>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div className="font-sans font-semibold text-white" style={{ fontSize: 16, marginBottom: 8 }}>{title}</div>
                    <div className="font-sans text-white/55" style={{ fontSize: 16, lineHeight: 1.75 }}>{body}</div>
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
              <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em", marginBottom: 20, lineHeight: 1.1 }}>
                Built for the systems that never stop running
              </h2>
              <p className="font-sans text-white/55" style={{ fontSize: 18, lineHeight: 1.75 }}>
                The organizations with the most demanding execution workloads are the ones least served by conventional compute platforms.
              </p>
            </div>
          </FadeUp>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { industry: "Financial Services", title: "Real-time risk computation per market event", body: "Algorithmic trading systems need computation on every signal — not on a schedule. Runix lets risk models execute per event, paying only for each computation, with results back before the next tick." },
              { industry: "AI Agents", title: "Autonomous agents that pay per action", body: "AI agents don't need a pre-configured environment. They call compute, APIs, and data access as part of their decision loop — each action independently executed and settled, with no orchestration overhead." },
              { industry: "Developer Tooling", title: "Code analysis that scales with activity", body: "CI/CD and code review tools have bursty, unpredictable workloads. Execute analysis jobs only when triggered — no idle infrastructure, no pre-warming, handles peaks automatically." },
              { industry: "Data Platforms", title: "Per-query billing that mirrors actual value", body: "Data products that charge per query can now execute and settle payment in one step. No billing cycle mismatch. Cost aligns exactly with consumption — transparent for both sides." },
            ].map(({ industry, title, body }, i) => (
              <FadeUp key={industry} delay={i * 80}>
                <div style={{ background: "#111214", borderRadius: 12, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", height: "100%" }}>
                  <div className="font-sans text-white/30" style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>{industry}</div>
                  <h3 className="font-sans font-semibold text-white" style={{ fontSize: 16, marginBottom: 12, lineHeight: 1.4 }}>{title}</h3>
                  <p className="font-sans text-white/55" style={{ fontSize: 16, lineHeight: 1.75 }}>{body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* WHY RUNIX — gradient subtle bottom */}
      <section className="grad-subtle-bottom">
        <div className="section-pad why-outer" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 32px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }}>
          <FadeUp>
            <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 16 }}>
              Built for agent workloads.
            </h2>
            <p className="font-sans text-white/55" style={{ fontSize: 18, lineHeight: 1.75 }}>
              Most execution tools are wrappers. Runix is infrastructure — designed from the ground up for how agents actually run.
            </p>
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
                  <div className="font-sans font-semibold text-white" style={{ fontSize: 16, marginBottom: 8 }}>{title}</div>
                  <div className="font-sans text-white/55" style={{ fontSize: 16, lineHeight: 1.75 }}>{desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — gradient radial center */}
      <section className="grad-radial-center cta-section" style={{ padding: "144px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <FadeUp>
            <h2 className="font-sans font-extrabold text-white" style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)", letterSpacing: "-0.03em", lineHeight: 0.93, marginBottom: 32 }}>
              First request<br />
              <span className="text-white/20">in 2 minutes.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={100}>
            <p className="font-sans text-white/55" style={{ fontSize: 18, lineHeight: 1.75, maxWidth: 400, marginBottom: 40 }}>
              Generate an API key and send your first execution. No card required, no setup calls, no infrastructure to provision.
            </p>
          </FadeUp>
          <FadeUp delay={200}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="/register" className="font-sans font-bold text-sm text-[#0b0c0e] bg-white hover:bg-white/85 transition-colors" style={{ padding: "14px 28px", borderRadius: 8, textDecoration: "none" }}>Generate API Key →</a>
              <a href="#" className="font-sans font-semibold text-sm text-white/50 hover:text-white/80 transition-all" style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "14px 24px", borderRadius: 8, textDecoration: "none" }}>Read the Docs</a>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="font-sans font-extrabold text-white/20" style={{ fontSize: 14 }}>Runix</span>
          <div className="footer-links" style={{ display: "flex", gap: 24 }}>
            {["Docs", "API Reference", "Status", "Privacy"].map(l => (
              <a key={l} href="#" className="font-sans text-white/20" style={{ fontSize: 13, textDecoration: "none" }}>{l}</a>
            ))}
          </div>
          <span className="font-mono text-white/10" style={{ fontSize: 11 }}>© 2025</span>
        </div>
      </footer>
    </div>
  );
}