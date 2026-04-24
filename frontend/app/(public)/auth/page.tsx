"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";

function AuthContent() {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const res = await fetch(process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL!, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: tokenResponse.access_token }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("accessToken", data.accessToken);
          window.location.href = "/dashboard";
        } else {
          alert("Authentication failed. Please try again.");
        }
      } catch (err) {
        alert("Network error. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      alert("Google Sign-In failed. Please try again.");
    },
  });

  return (
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

        <button
          onClick={() => login()}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1a1a1f",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: isLoading ? 0.6 : 1,
            transition: "all 0.15s",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Google SVG icon */}
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </g>
          </svg>
          {isLoading ? "Signing in..." : "Continue with Google"}
        </button>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 24, lineHeight: 1.6 }}>
          By continuing, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <AuthContent />
    </GoogleOAuthProvider>
  );
}