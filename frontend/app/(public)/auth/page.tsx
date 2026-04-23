"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState<{ apiKey: string; wallet: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"key" | "wallet" | null>(null);

  async function handleRegister() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      localStorage.setItem("runix_api_key", data.apiKey);
      setResult({ apiKey: data.apiKey, wallet: data.walletAddress });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid API key");
      localStorage.setItem("runix_api_key", apiKey);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: "key" | "wallet") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .auth-input {
          width: 100%;
          background: #060708;
          border: 1px solid #1e2128;
          border-radius: 8px;
          padding: 12px 14px;
          color: #e8e8e8;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          outline: none;
          transition: border-color 0.15s;
        }
        .auth-input:focus { border-color: #3b82f6; }
        .btn-primary {
          width: 100%;
          padding: 13px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.88; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          padding: 12px 16px;
          background: transparent;
          border: 1px solid #1e2128;
          border-radius: 8px;
          color: #e8e8e8;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.15s;
        }
        .btn-ghost:hover { border-color: #3b82f6; }
      `}</style>
      <div style={{
        minHeight: "100vh",
        background: "#060708",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: "#111214",
          border: "1px solid #1e2128",
          borderRadius: 18,
          padding: "36px 28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.12em", color: "#3b82f6", marginBottom: 32 }}>
            RUNIX
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", border: "1px solid #1e2128", borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
            {(["register", "login"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setResult(null); setError(""); }} style={{
                flex: 1,
                padding: "11px 0",
                background: tab === t ? "#1a1f2e" : "transparent",
                border: "none",
                cursor: "pointer",
                color: tab === t ? "#ffffff" : "#8a8f98",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              fontSize: 14,
              color: "#ef4444",
              background: "#ef444415",
              border: "1px solid #ef444430",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {/* Register form */}
          {tab === "register" && !result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelStyle}>AGENT NAME</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="my-agent" className="auth-input" />
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="auth-input" />
              </div>
              <button onClick={handleRegister} disabled={loading} className="btn-primary">
                {loading ? "Registering..." : "Create account"}
              </button>
              <p style={{ fontSize: 13, color: "#8a8f98", lineHeight: 1.7, margin: 0 }}>
                A Circle wallet is created automatically. Fund it with USDC to start running jobs.
              </p>
            </div>
          )}

          {/* Register result */}
          {tab === "register" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <p style={{ fontSize: 14, color: "#3b82f6", margin: 0, lineHeight: 1.6 }}>
                Account created. Copy your API key — it won't be shown again.
              </p>
              <div>
                <label style={labelStyle}>API KEY</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input readOnly value={result.apiKey} className="auth-input" style={{ flex: 1 }} />
                  <button onClick={() => copy(result.apiKey, "key")} className="btn-ghost">
                    {copied === "key" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>WALLET ADDRESS</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input readOnly value={result.wallet} className="auth-input" style={{ flex: 1 }} />
                  <button onClick={() => copy(result.wallet, "wallet")} className="btn-ghost">
                    {copied === "wallet" ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
              <button onClick={() => router.push("/dashboard")} className="btn-primary">
                Go to Dashboard →
              </button>
            </div>
          )}

          {/* Login */}
          {tab === "login" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelStyle}>API KEY</label>
                <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="rux_..." type="password" className="auth-input" />
              </div>
              <button onClick={handleLogin} disabled={loading} className="btn-primary">
                {loading ? "Authenticating..." : "Login"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#8a8f98",
  marginBottom: 8,
  letterSpacing: "0.08em",
  fontWeight: 600,
};