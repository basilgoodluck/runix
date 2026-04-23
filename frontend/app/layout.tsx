import type { ReactNode } from "react";

export const metadata = {
  title: "Runix",
  icons: {
    icon: "https://www.google.com/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://www.google.com/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#060708", color: "#e8e8e8", fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}