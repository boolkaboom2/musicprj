"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Проверяем, что это ПК
    if (window.innerWidth >= 768) {
      setIsDesktop(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // Показываем только на ПК и только если браузер дал добро на установку
  if (!isDesktop || !deferredPrompt) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide mt-4 pt-4 border-t border-[#333]"
    >
      <Download size={16} /> Установить приложение
    </button>
  );
}