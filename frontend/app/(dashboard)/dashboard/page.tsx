"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  balance: string;
  jobsRun: number;
  totalSpent: string;
}

interface Job {
  id: string;
  type: string;
  status: string;
  cost: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ balance: "0.0000", jobsRun: 0, totalSpent: "0.0000" });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = localStorage.getItem("runix_api_key") || "";
    Promise.all([
      fetch("/api/billing/balance", { headers: { "x-api-key": apiKey } }).then(r => r.json()),
      fetch("/api/billing/history?limit=5", { headers: { "x-api-key": apiKey } }).then(r => r.json()),
    ]).then(([bal, hist]) => {
      setStats({
        balance: bal.balance ?? "0.0000",
        jobsRun: bal.jobsRun ?? 0,
        totalSpent: bal.totalSpent ?? "0.0000",
      });
      setJobs(hist.payments ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        @media (max-width: 600px) {
          .dash-grid { grid-template-columns: 1fr; }
          .jobs-table thead { display: none; }
          .jobs-table tr { display: block; padding: 14px 0; border-bottom: 1px solid #1e2128; }
          .jobs-table td { display: flex; justify-content: space-between; padding: 3px 0; border: none; font-size: 14px; }
          .jobs-table td::before { content: attr(data-label); color: #8a8f98; font-size: 13px; }
        }
        @media (min-width: 601px) and (max-width: 900px) {
          .dash-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Overview</h1>
          <p style={{ fontSize: 15, color: "#8a8f98", margin: "6px 0 0" }}>Your agent's activity.</p>
        </div>

        {/* Stat cards */}
        <div className="dash-grid">
          {[
            { label: "USDC BALANCE", value: `$${stats.balance}` },
            { label: "JOBS EXECUTED", value: String(stats.jobsRun) },
            { label: "TOTAL SPENT", value: `$${stats.totalSpent}` },
          ].map(s => (
            <div key={s.label} style={{
              background: "#0d0e10",
              border: "1px solid #1e2128",
              borderRadius: 14,
              padding: "22px 24px",
            }}>
              <div style={{ fontSize: 11, color: "#8a8f98", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: loading ? "#1e2128" : "#ffffff" }}>
                {loading ? "0.0000" : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Recent jobs */}
        <div style={{ background: "#0d0e10", border: "1px solid #1e2128", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: "#8a8f98", letterSpacing: "0.1em", fontWeight: 600 }}>RECENT JOBS</div>
            <Link href="/jobs" style={{ fontSize: 14, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>View all →</Link>
          </div>

          <table className="jobs-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Job ID", "Type", "Status", "Cost", "When"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8a8f98", borderBottom: "1px solid #1e2128", fontWeight: 500, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && jobs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "20px 12px", color: "#8a8f98", fontSize: 15 }}>No jobs yet.</td></tr>
              )}
              {jobs.map(j => (
                <tr key={j.id}>
                  <td data-label="Job ID" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.id}</td>
                  <td data-label="Type" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.type}</td>
                  <td data-label="Status" style={{ padding: "12px", borderBottom: "1px solid #1e2128", fontSize: 15 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      background: j.status === "success" ? "#3b82f615" : "#ef444415",
                      color: j.status === "success" ? "#3b82f6" : "#ef4444",
                      border: `1px solid ${j.status === "success" ? "#3b82f630" : "#ef444430"}`,
                    }}>{j.status}</span>
                  </td>
                  <td data-label="Cost" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.cost}</td>
                  <td data-label="When" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#8a8f98", fontSize: 14 }}>{j.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}