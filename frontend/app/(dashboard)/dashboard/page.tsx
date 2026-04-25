"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  balance: string;
  walletAddress: string;
  onchainAgentId: string | null;
  apiKey: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  totalSpentUsd: number;
  recentJobs: {
    id: string;
    type: string;
    status: string;
    costUsd: number | null;
    durationMs: number;
    createdAt: string;
  }[];
  recentPayments: {
    id: string;
    jobId: string;
    txId: string;
    amount: string;
    createdAt: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"wallet" | "apikey" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/agent/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function copy(text: string, key: "wallet" | "apikey") {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  function fmt(date: string) {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #07070a;
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .layout {
          display: grid;
          grid-template-rows: 56px 1fr;
          min-height: 100vh;
        }

        /* TOP NAV */
        .topnav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: #07070a;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-mark {
          width: 26px; height: 26px; border-radius: 7px; background: #7c3aed;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 0 20px rgba(124,58,237,0.4);
        }
        .logo-mark span { width: 7px; height: 7px; border-radius: 50%; background: #fff; display: block; }
        .logo-name { font-weight: 800; font-size: 17px; letter-spacing: -0.03em; color: #fff; }
        .nav-right { display: flex; align-items: center; gap: 16px; }
        .nav-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4);
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; }
        .status-dot.on { background: #7c3aed; box-shadow: 0 0 8px #7c3aed; }
        .status-dot.off { background: rgba(255,255,255,0.2); }

        /* MAIN */
        .main {
          padding: 32px;
          width: 100%;
        }

        .page-title {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #fff;
          margin-bottom: 4px;
        }
        .page-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* STATS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .stat {
          background: #0f0f13;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 20px 22px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
        }
        .stat-val {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #fff;
          line-height: 1;
        }
        .stat-val.accent { color: #a78bfa; }
        .stat-hint {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          margin-top: 6px;
          font-family: 'DM Mono', monospace;
        }

        /* TWO COL */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        /* CARD */
        .card {
          background: #0f0f13;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 20px 22px;
          margin-bottom: 12px;
        }
        .card-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
          margin-bottom: 14px;
        }

        /* COPY ROW */
        .copy-row { display: flex; align-items: center; gap: 8px; }
        .copy-input {
          flex: 1;
          background: #17171c;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 9px;
          padding: 10px 14px;
          color: rgba(255,255,255,0.75);
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          outline: none;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .copy-input:focus { border-color: rgba(124,58,237,0.4); }
        .copy-btn {
          padding: 10px 18px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px;
          color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .copy-btn:hover { border-color: rgba(124,58,237,0.5); color: #a78bfa; }
        .copy-btn.copied { border-color: #7c3aed; color: #a78bfa; background: rgba(124,58,237,0.08); }
        .copy-hint { font-size: 12px; color: rgba(255,255,255,0.2); margin-top: 10px; }
        .copy-hint code { font-family: 'DM Mono', monospace; background: rgba(255,255,255,0.05); padding: 1px 6px; border-radius: 4px; color: rgba(255,255,255,0.35); }

        /* TABLE */
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th {
          text-align: left;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          white-space: nowrap;
        }
        td {
          padding: 13px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 14px;
          color: #fff;
          white-space: nowrap;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(255,255,255,0.02); }

        .pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }
        .pill.success { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
        .pill.failed { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
        .pill.pending { background: rgba(124,58,237,0.1); color: #a78bfa; border: 1px solid rgba(124,58,237,0.2); }

        .mono { font-family: 'DM Mono', monospace; font-size: 12px; color: rgba(255,255,255,0.35); }
        .empty { padding: 24px 12px; color: rgba(255,255,255,0.2); font-size: 13px; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .main { padding: 20px 16px; }
          .topnav { padding: 0 16px; }
        }
        @media (max-width: 600px) {
          .two-col { grid-template-columns: 1fr; }
          .stat-val { font-size: 26px; }
        }
      `}</style>

      <div className="layout">
        {/* TOP NAV */}
        <header className="topnav">
          <div className="logo">
            <div className="logo-mark"><span /></div>
            <span className="logo-name">Runix</span>
          </div>
          <div className="nav-right">
            <div className="nav-status">
              <span className={`status-dot ${data?.onchainAgentId ? "on" : "off"}`} />
              {data?.onchainAgentId ? "Registered onchain" : "Deposit USDC to activate"}
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="main">
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Your agent, wallet, and execution history.</div>

          {/* STATS */}
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-label">Balance</div>
              <div className="stat-val accent">${loading ? "0.00" : (data?.balance ?? "0.00")}</div>
              <div className="stat-hint">USDC · Arc Testnet</div>
            </div>
            <div className="stat">
              <div className="stat-label">Total Jobs</div>
              <div className="stat-val">{loading ? "0" : (data?.totalJobs ?? 0)}</div>
              <div className="stat-hint">{data?.successfulJobs ?? 0} ok · {data?.failedJobs ?? 0} failed</div>
            </div>
            <div className="stat">
              <div className="stat-label">Total Spent</div>
              <div className="stat-val">${loading ? "0.00" : (data?.totalSpentUsd?.toFixed(4) ?? "0.00")}</div>
              <div className="stat-hint">USDC</div>
            </div>
            <div className="stat">
              <div className="stat-label">Onchain ID</div>
              {data?.onchainAgentId ? (
                <>
                  <div className="stat-val accent" style={{ fontSize: 18, paddingTop: 6, fontFamily: "DM Mono, monospace" }}>
                    {data.onchainAgentId.slice(0, 12)}...
                  </div>
                  <div className="stat-hint">active</div>
                </>
              ) : (
                <>
                  <div className="stat-val" style={{ fontSize: 16, paddingTop: 6, color: "rgba(255,255,255,0.2)" }}>none</div>
                  <div className="stat-hint">deposit USDC to activate</div>
                </>
              )}
            </div>
          </div>

          {/* WALLET + API KEY */}
          <div className="two-col">
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-label">Wallet Address</div>
              <div className="copy-row">
                <input readOnly className="copy-input" value={loading ? "" : (data?.walletAddress ?? "")} />
                <button
                  className={`copy-btn${copied === "wallet" ? " copied" : ""}`}
                  onClick={() => data?.walletAddress && copy(data.walletAddress, "wallet")}
                >
                  {copied === "wallet" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="copy-hint">Send USDC here to fund executions.</div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-label">API Key</div>
              <div className="copy-row">
                <input
                  readOnly
                  className="copy-input"
                  value={loading ? "" : (data?.apiKey ?? "")}
                  type="password"
                  onFocus={(e) => (e.target.type = "text")}
                  onBlur={(e) => (e.target.type = "password")}
                />
                <button
                  className={`copy-btn${copied === "apikey" ? " copied" : ""}`}
                  onClick={() => data?.apiKey && copy(data.apiKey, "apikey")}
                >
                  {copied === "apikey" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="copy-hint">Pass as <code>x-api-key</code> header in requests.</div>
            </div>
          </div>

          {/* RECENT JOBS */}
          <div className="card">
            <div className="card-label">Recent Jobs</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Duration</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={6} className="empty">Loading...</td></tr>}
                  {!loading && !data?.recentJobs?.length && <tr><td colSpan={6} className="empty">No jobs yet.</td></tr>}
                  {data?.recentJobs?.map((j) => (
                    <tr key={j.id}>
                      <td className="mono">{j.id.slice(0, 12)}...</td>
                      <td>{j.type}</td>
                      <td>
                        <span className={`pill ${j.status === "success" ? "success" : j.status === "failed" ? "failed" : "pending"}`}>
                          {j.status}
                        </span>
                      </td>
                      <td>${j.costUsd?.toFixed(4) ?? "0.00"}</td>
                      <td className="mono">{j.durationMs}ms</td>
                      <td className="mono">{fmt(j.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAYMENTS */}
          <div className="card">
            <div className="card-label">Payments</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tx Hash</th>
                    <th>Job ID</th>
                    <th>Amount</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={4} className="empty">Loading...</td></tr>}
                  {!loading && !data?.recentPayments?.length && <tr><td colSpan={4} className="empty">No payments yet.</td></tr>}
                  {data?.recentPayments?.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.txId.slice(0, 14)}...</td>
                      <td className="mono">{p.jobId.slice(0, 12)}...</td>
                      <td style={{ color: "#a78bfa", fontWeight: 700 }}>{p.amount} USDC</td>
                      <td className="mono">{fmt(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}