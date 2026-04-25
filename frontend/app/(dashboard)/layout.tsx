import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#060708",
      color: "#e8e8e8",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Page content */}
      <main style={{
        padding: 24,
      }}>
        {children}
      </main>
    </div>
  );
}