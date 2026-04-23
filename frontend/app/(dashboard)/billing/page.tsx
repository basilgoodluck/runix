"use client";

import { useEffect, useState } from "react";

interface Payment {
  tx: string;
  label: string;
  amount: string;
  createdAt: string;
}

export default function BillingPage() {
  const [balance, setBalance] = useState("0.0000");
  const [wallet, setWallet] = useState("0x0000000000000000000000000000000000000000");
  const [history, setHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const apiKey = localStorage.getItem("runix_api_key") || "";
    Promise.all([
      fetch("/api/billing/balance", { headers: { "x-api-key": apiKey } }).then(r => r.json()),
      fetch("/api/billing/history", { headers: { "x-api-key": apiKey } }).then(r => r.json()),
    ]).then(([bal, hist]) => {
      setBalance(bal.balance ?? "0.0000");
      setWallet(bal.walletAddress ?? "0x0000000000000000000000000000000000000000");
      setHistory(hist.payments ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function copy() {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <style>{`
        .billing-top {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        .billing-input {
          flex: 1;
          background: #060708;
          border: 1px solid #1e2128;
          border-radius: 8px;
          padding: 11px 14px;
          color: #e8e8e8;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          outline: none;
          min-width: 0;
        }
        .hist-table { width: 100%; border-collapse: collapse; }
        @media (max-width: 600px) {
          .billing-top { grid-template-columns: 1fr; }
          .hist-table thead { display: none; }
          .hist-table tr { display: block; padding: 14px 0; border-bottom: 1px solid #1e2128; }
          .hist-table td { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border: none; font-size: 14px; }
          .hist-table td::before { content: attr(data-label); color: #8a8f98; font-size: 13px; }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Billing</h1>
          <p style={{ fontSize: 15, color: "#8a8f98", margin: "6px 0 0" }}>Your USDC wallet and payment history.</p>
        </div>

        <div className="billing-top">
          {/* Balance */}
          <div style={{ background: "#0d0e10", border: "1px solid #1e2128", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, color: "#8a8f98", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>USDC BALANCE</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: loading ? "#1e2128" : "#ffffff", marginBottom: 6 }}>
              ${loading ? "0.0000" : balance}
            </div>
            <div style={{ fontSize: 13, color: "#8a8f98" }}>Arc Testnet</div>
          </div>

          {/* Wallet */}
          <div style={{ background: "#0d0e10", border: "1px solid #1e2128", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, color: "#8a8f98", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 14 }}>WALLET ADDRESS</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input readOnly value={wallet} className="billing-input" />
              <button onClick={copy} style={{
                padding: "11px 16px",
                background: copied ? "#3b82f620" : "transparent",
                border: `1px solid ${copied ? "#3b82f6" : "#1e2128"}`,
                borderRadius: 8,
                color: copied ? "#3b82f6" : "#e8e8e8",
                fontFamily: "inherit",
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                fontWeight: 500,
              }}>
                {copied ? "✓" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#8a8f98", marginTop: 12, lineHeight: 1.6 }}>
              Send USDC here to fund your agent.
            </p>
          </div>
        </div>

        {/* Payment history */}
        <div style={{ background: "#0d0e10", border: "1px solid #1e2128", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, color: "#8a8f98", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 18 }}>PAYMENT HISTORY</div>
          <table className="hist-table">
            <thead>
              <tr>
                {["Tx Hash", "Description", "Amount", "Timestamp"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8a8f98", borderBottom: "1px solid #1e2128", fontWeight: 500, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} style={{ padding: "20px 12px", color: "#8a8f98", fontSize: 15 }}>Loading...</td></tr>
              )}
              {!loading && history.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "20px 12px", color: "#8a8f98", fontSize: 15 }}>No transactions yet.</td></tr>
              )}
              {history.map((h, i) => (
                <tr key={i}>
                  <td data-label="Tx Hash" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#8a8f98", fontSize: 13 }}>{h.tx}</td>
                  <td data-label="Description" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{h.label}</td>
                  <td data-label="Amount" style={{
                    padding: "12px",
                    borderBottom: "1px solid #1e2128",
                    fontSize: 15,
                    fontWeight: 600,
                    color: h.amount.startsWith("+") ? "#3b82f6" : "#e8e8e8",
                  }}>{h.amount}</td>
                  <td data-label="Timestamp" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#8a8f98", fontSize: 14 }}>{h.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}