"use client";

import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");

    try {
      const idToken = credentialResponse.credential; // ← Google ID token

      const res = await fetch(process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }), // send as { token: "..." }
      });

      if (res.ok) {
        // Redirect to your dashboard or reload
        window.location.href = "/dashboard";
      } else {
        const text = await res.text();
        setError(`Authentication failed: ${text}`);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = () => {
    setError("Google Sign-In failed. Please try again.");
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div style={{
        minHeight: "100vh",
        background: "#080809",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 400,
          background: "#0f0f11",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 18,
          padding: "40px 28px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: "#7c3aed",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 4px 16px rgba(124,58,237,0.45)",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.9)" }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#fff" }}>Runix</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.4rem, 4vw, 1.7rem)", fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>
            Get started
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", fontWeight: 400, marginBottom: 32, lineHeight: 1.6 }}>
            Sign in to generate your API key and start running executions.
          </p>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 14, marginBottom: 16, textAlign: "center" }}>
              {error}
            </div>
          )}

          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap={false}
            theme="filled_black"
            shape="rectangular"
            width="100%"
            text="continue_with"
          />

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
            By continuing, you agree to our terms of service.
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}