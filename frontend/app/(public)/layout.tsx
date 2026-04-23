"use client";

import { useState, useEffect, type ReactNode } from "react";

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "background 0.3s, box-shadow 0.3s",
      background: scrolled ? "rgba(11,12,14,0.93)" : "transparent",
      backdropFilter: scrolled ? "blur(14px)" : "none",
      boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.55)" : "none",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px", height: 108, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Runix</span>
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Docs", "API Reference", "Pricing"].map(item => (
            <a key={item} href="#" style={{ textDecoration: "none", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{item}</a>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/auth" style={{ textDecoration: "none", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Sign in</a>
          <a href="/auth" style={{ padding: "9px 20px", borderRadius: 8, textDecoration: "none", background: "#fff", color: "#0b0c0e", fontWeight: 700, fontSize: 14 }}>Get API Key</a>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 14, color: "rgba(255,255,255,0.2)" }}>Runix</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Docs", "API Reference", "Status", "Privacy"].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, textDecoration: "none", color: "rgba(255,255,255,0.2)" }}>{l}</a>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", fontFamily: "monospace" }}>© 2025</span>
      </div>
    </footer>
  );
}

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}