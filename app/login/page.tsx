"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, RotateCcw } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";
import VinylScene from "@/components/VinylScene";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // НАЧИНАЕМ С FALSE (сразу показываем анимацию)
  const [isTransitioned, setIsTransitioned] = useState(false); 
  const [isChecking, setIsChecking] = useState(true);
  const showToast = useToast((state) => state.show);

  useEffect(() => {
    const vinylShown = localStorage.getItem('sadovod_vinyl_shown') === 'true';
    const isDesktop = window.innerWidth >= 1024;

    // Если уже видел ИЛИ это мобилка — скрываем анимацию
    if (vinylShown || !isDesktop) {
      setIsTransitioned(true); 
    }
    setIsChecking(false);
  }, []);

  const handleSpin = () => {
    localStorage.setItem('sadovod_vinyl_shown', 'true');
    setIsTransitioned(true);
  };

  const handleShowAnimationAgain = () => {
    localStorage.removeItem('sadovod_vinyl_shown');
    setIsTransitioned(false);
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      showToast("Введите email и пароль", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/";
      } else {
        showToast(data.error || "Ошибка входа", "error");
      }
    } catch (err) {
      showToast("Ошибка сети. Попробуйте позже.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      
      <AnimatePresence>
        {!isTransitioned && (
          <motion.div
            key="vinyl-scene"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20"
          >
            <VinylScene onSpin={handleSpin} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTransitioned && (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-screen flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md">
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Вход</h1>
                  <p className="text-[var(--text-subdued)] text-sm mb-8">Войдите, чтобы слушать и создавать плейлисты.</p>
                  
                  <div className="flex flex-col gap-4">
                    <CustomInput
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <CustomInput
                      isPassword
                      placeholder="Пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-white text-black font-bold uppercase tracking-wider py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.1)]"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Войти"}
                    </button>
                  </div>

                  <div className="mt-6 flex justify-between items-center text-sm text-[var(--text-subdued)]">
                    <Link href="/register" className="hover:text-white transition-all">Регистрация</Link>
                    <Link href="/forgot-password" className="hover:text-white transition-all">Забыли пароль?</Link>
                  </div>
                </div>

                <div className="hidden lg:flex justify-center mt-6">
                  <button
                    onClick={handleShowAnimationAgain}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/70 transition"
                  >
                    <RotateCcw size={12} /> Показать анимацию снова
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}