"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const pathname = usePathname();

  // СКРЫВАЕМ НА ВСЕХ СТРАНИЦАХ АВТОРИЗАЦИИ
  const isAuthPage = pathname.startsWith('/welcome') || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  useEffect(() => {
    if (isAuthPage) {
      setIsVisible(false);
      return; 
    }

    const lastDismissed = localStorage.getItem('sadovod_pwa_dismissed');
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return; 
    }

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
      setIsVisible(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e; 
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [pathname, isAuthPage]);

  const handleInstall = async () => {
    if (isIOS) {
      setIsVisible(false);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
      (window as any).deferredPrompt = null;
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('sadovod_pwa_dismissed', Date.now().toString());
  };

  if (isAuthPage) return null; 

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 md:bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-[#121212] border border-white/10 p-4 rounded-xl shadow-2xl z-[100] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
            {isIOS ? <Share size={24} className="text-white" /> : <Download size={24} className="text-white" />}
          </div>
          
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white font-bold text-sm">Установить SADOVOD</span>
            <span className="text-white/50 text-xs leading-tight mt-1">
              {isIOS 
                ? "Нажмите кнопку 'Поделиться' в Safari и выберите 'На экран Домой'." 
                : "Слушай музыку как в приложении"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="bg-white text-black font-bold text-xs px-3 py-2 rounded-md hover:bg-gray-200 transition"
              >
                Установить
              </button>
            )}
            <button onClick={handleDismiss} className="text-white/40 hover:text-white transition p-1">
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}