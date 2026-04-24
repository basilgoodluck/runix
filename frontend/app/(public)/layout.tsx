"use client";

import { useState, useEffect, type ReactNode } from "react";

function RunixLogo() {
  return (
    <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7, background: "#7c3aed",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 4px 16px rgba(124,58,237,0.45)",
        flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#fff" }}>Runix</span>
    </a>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <style>{`
        .nav-link {
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          color: rgba(255,255,255,0.8);
          transition: color 0.2s;
        }
        .nav-link:hover { color: #fff; }
        
        .hbtn-ghost {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          border-radius: 7px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.8);
          font-weight: 600;
          font-size: 15px;
          transition: all 0.2s;
        }
        .hbtn-ghost:hover {
          border-color: rgba(139,92,246,0.6);
          color: #fff;
        }
        
        .hbtn-primary {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          border-radius: 7px;
          text-decoration: none;
          background: #7c3aed;
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          transition: all 0.2s;
        }
        .hbtn-primary:hover {
          background: #6d28d9;
          transform: translateY(-1px);
        }
        
        .mob-menu {
          display: none;
          flex-direction: column;
          background: rgba(8,8,9,0.98);
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .mob-menu.open { display: flex; }
        .mob-menu a {
          padding: 15px 24px;
          font-size: 16px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: color 0.2s;
        }
        .mob-menu a:hover { color: #fff; }
        
        .burger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .burger span {
          display: block;
          width: 22px;
          height: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 2px;
          transition: all 0.25s;
        }
        
        @media (max-width: 640px) {
          .hdr-right { display: none !important; }
          .burger { display: flex !important; }
        }
      `}</style>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "background 0.3s, box-shadow 0.3s",
        background: scrolled || menuOpen ? "rgba(8,8,9,0.97)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(16px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,0.05)" : "none",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <RunixLogo />
          
          {/* Right section: Docs + Sign in + Get API Key */}
          <div className="hdr-right" style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="/docs" className="nav-link">Docs</a>
            <a href="/auth" className="hbtn-ghost">Sign in</a>
            <a href="/auth" className="hbtn-primary">Get API Key</a>
          </div>
          
          <button className="burger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
        <div className={`mob-menu${menuOpen ? " open" : ""}`}>
          <a href="/docs" onClick={() => setMenuOpen(false)}>Docs</a>
          <a href="/auth" onClick={() => setMenuOpen(false)}>Sign in</a>
          <div style={{ padding: "14px 24px 20px" }}>
            <a href="/auth" style={{ display: "block", textAlign: "center", padding: "13px 20px", borderRadius: 8, background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
              Get API Key
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
        <RunixLogo />
        <a href="/docs" style={{ fontSize: 14, textDecoration: "none", color: "rgba(255,255,255,0.25)", transition: "color 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}
        >Docs</a>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.12)", fontFamily: "monospace" }}>© 2025 Runix</span>
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