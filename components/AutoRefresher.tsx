"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresher() {
  const router = useRouter();
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const refresh = () => {
      if (Date.now() - lastRefreshRef.current < 3000) return;
      lastRefreshRef.current = Date.now();
      router.refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const handleFocus = () => refresh();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 30000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}