"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RotateCcw, Check } from "lucide-react";
import CustomInput from "@/components/CustomInput";
import { useToast } from "@/components/Toast";
import VinylScene from "@/components/VinylScene";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [agreed, setAgreed] = useState(false); // Стейт для галочки
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioned, setIsTransitioned] = useState(true); // По умолчанию скрываем анимацию (показываем форму)
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const showToast = useToast((state) => state.show);

  useEffect(() => {
    const vinylShown = localStorage.getItem('sadovod_vinyl_shown') === 'true';
    const isDesktop = window.innerWidth >= 1024;

    // Если анимация еще не показывалась и это десктоп — показываем её
    if (!vinylShown && isDesktop) {
      setIsTransitioned(false);
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
    if (!email || !password || !name || !inviteCode) {
      showToast("Заполните все поля", "error");
      return;
    }
    if (!agreed) {
      showToast("Согласитесь с политикой конфиденциальности", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Аккаунт успешно создан!", "success");
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        router.push("/");
        router.refresh();
      } else {
        showToast(data.error || "Ошибка регистрации", "error");
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
            key="register-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-h-screen flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md">
              <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <div className="bg-[#121212] p-8 md:p-10 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">Регистрация</h1>
                  <p className="text-[var(--text-subdued)] text-sm mb-6">Создайте аккаунт SADOVOD.</p>
                  
                  <div className="flex flex-col gap-3">
                    <CustomInput type="text" placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} />
                    <CustomInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <CustomInput isPassword placeholder="Пароль (мин 6 символов)" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <CustomInput type="text" placeholder="Инвайт-код" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />

                    {/* Кастомный чекбокс */}
                    <label className="flex items-start gap-3 mt-2 cursor-pointer group">
                      <div 
                        onClick={(e) => { e.preventDefault(); setAgreed(!agreed); }}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          agreed ? 'bg-white border-white' : 'border-white/20 group-hover:border-white/40'
                        }`}
                      >
                        {agreed && <Check size={14} className="text-black" />}
                      </div>
                      <span className="text-xs text-[var(--text-subdued)] leading-relaxed select-none">
                        Я согласен с <Link href="/privacy" target="_blank" className="text-white hover:underline">политикой конфиденциальности</Link> и обработкой персональных данных.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="bg-white text-black font-bold uppercase tracking-wider py-4 rounded-md hover:bg-gray-200 transition-all duration-300 mt-2 flex justify-center items-center h-[56px] disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.1)]"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Создать аккаунт"}
                    </button>
                  </div>

                  <div className="mt-6 text-center text-sm text-[var(--text-subdued)]">
                    Уже есть аккаунт? <Link href="/login" className="text-white hover:underline transition-all">Войти</Link>
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