"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { Shell } from "./shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.replace("/auth");
  }, []);

  return <Shell>{children}</Shell>;
}