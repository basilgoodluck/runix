"use client";

import { useEffect, useState } from "react";

interface Job {
  id: string;
  type: string;
  status: string;
  cost: string;
  receipt: string;
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiKey = localStorage.getItem("runix_api_key") || "";
    fetch("/api/billing/history", { headers: { "x-api-key": apiKey } })
      .then(r => r.json())
      .then(d => setJobs(d.payments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .jobs-table { width: 100%; border-collapse: collapse; }
        @media (max-width: 600px) {
          .jobs-table thead { display: none; }
          .jobs-table tr { display: block; padding: 16px 0; border-bottom: 1px solid #1e2128; }
          .jobs-table td { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border: none; font-size: 14px; }
          .jobs-table td::before { content: attr(data-label); color: #8a8f98; font-size: 13px; }
        }
      `}</style>

      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#ffffff" }}>Jobs</h1>
          <p style={{ fontSize: 15, color: "#8a8f98", margin: "6px 0 0" }}>Full execution history with receipts.</p>
        </div>

        <div style={{ background: "#0d0e10", border: "1px solid #1e2128", borderRadius: 14, padding: "22px 24px" }}>
          <table className="jobs-table">
            <thead>
              <tr>
                {["Job ID", "Type", "Status", "Cost", "Receipt", "Timestamp"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#8a8f98", borderBottom: "1px solid #1e2128", fontWeight: 500, fontSize: 13 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ padding: "20px 12px", color: "#8a8f98", fontSize: 15 }}>Loading...</td></tr>
              )}
              {!loading && jobs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "20px 12px", color: "#8a8f98", fontSize: 15 }}>No jobs yet.</td></tr>
              )}
              {jobs.map(j => (
                <tr key={j.id}>
                  <td data-label="Job ID" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.id}</td>
                  <td data-label="Type" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.type}</td>
                  <td data-label="Status" style={{ padding: "12px", borderBottom: "1px solid #1e2128" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                      background: j.status === "success" ? "#3b82f615" : "#ef444415",
                      color: j.status === "success" ? "#3b82f6" : "#ef4444",
                      border: `1px solid ${j.status === "success" ? "#3b82f630" : "#ef444430"}`,
                    }}>{j.status}</span>
                  </td>
                  <td data-label="Cost" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#e8e8e8", fontSize: 15 }}>{j.cost}</td>
                  <td data-label="Receipt" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#8a8f98", fontSize: 13 }}>{j.receipt || "0.0000"}</td>
                  <td data-label="Timestamp" style={{ padding: "12px", borderBottom: "1px solid #1e2128", color: "#8a8f98", fontSize: 14 }}>{j.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}