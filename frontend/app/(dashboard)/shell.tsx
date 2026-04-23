"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/jobs", label: "Jobs" },
  { href: "/billing", label: "Billing" },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "#060708",
      padding: 16,
      gap: 16,
    }}>
      {/* Floating sidebar */}
      <aside style={{
        width: 240,
        minWidth: 240,
        background: "#111214",
        borderRadius: 18,
        border: "1px solid #1e2128",
        display: "flex",
        flexDirection: "column",
        padding: "28px 16px",
        flexShrink: 0,
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}>
        <div style={{ marginBottom: 44, paddingLeft: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.12em", color: "#3b82f6" }}>RUNIX</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              display: "block",
              padding: "10px 14px",
              borderRadius: 10,
              color: pathname === href ? "#ffffff" : "#8a8f98",
              textDecoration: "none",
              fontSize: 15,
              fontWeight: pathname === href ? 600 : 400,
              background: pathname === href ? "#1a1f2e" : "transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ paddingTop: 16, borderTop: "1px solid #1e2128", paddingLeft: 6 }}>
          <a href="/docs" target="_blank" rel="noopener noreferrer" style={{
            fontSize: 14,
            color: "#8a8f98",
            textDecoration: "none",
          }}>
            Docs ↗
          </a>
        </div>
      </aside>

      <main style={{
        flex: 1,
        overflowY: "auto",
        padding: "40px 48px",
        background: "#111214",
        borderRadius: 18,
        border: "1px solid #1e2128",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}>
        {children}
      </main>
    </div>
  );
}