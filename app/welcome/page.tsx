"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VinylScene from "@/components/VinylScene";
import InviteModal from "@/components/InviteModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { Crown, Zap, ArrowRight, ShieldCheck, Infinity as InfinityIcon, ShieldAlert } from "lucide-react";
import { useToast } from "@/components/Toast";

const DURATIONS = [
  { months: 1, price: 99, label: "1 месяц", discount: null },
  { months: 3, price: 249, label: "3 месяца", discount: "Скидка 15%" },
  { months: 12, price: 899, label: "1 год", discount: "Выгода 25%" },
];

export default function WelcomePage() {
  const [step, setStep] = useState<"vinyl" | "welcome" | "pricing">("vinyl");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false); // Новый стейт
  const [durationIdx, setDurationIdx] = useState(2);
  const showToast = useToast((s) => s.show);

  const handleSubscribe = () => {
    showToast("Оплата пока не подключена. Свяжитесь с администратором в Telegram для получения кода.", "info");
  };

  return (
    <div className="relative min-h-screen bg-[#000000] overflow-hidden flex flex-col">
      
      {step === "pricing" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] opacity-50" />
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {step === "vinyl" && (
          <motion.div
            key="vinyl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-20"
          >
            <VinylScene onSpin={() => setStep("welcome")} />
          </motion.div>
        )}

        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center max-w-2xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
              Добро пожаловать в <br /> SADOVOD
            </h1>
            <p className="text-[var(--text-subdued)] text-base md:text-lg mb-8 leading-relaxed">
              Твой личный стриминговый сервис. Слушай музыку, собирай плейлисты, лайкай треки и делись ими с друзьями. Мы используем открытые источники, чтобы ты мог найти даже самый редкий андеграунд.
            </p>
            
            <button
              onClick={() => setStep("pricing")}
              className="bg-white text-black font-bold text-lg py-4 px-8 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              Продолжить <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {step === "pricing" && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 w-full max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-bold text-xs uppercase tracking-widest mb-6"
              >
                <Crown size={16} /> Подписка
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                SADOVOD <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">PREMIUM</span>
              </h2>
              <p className="text-[var(--text-subdued)] text-lg">
                Максимальные возможности для настоящих ценителей музыки.
              </p>
            </div>

            <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[32px] p-8 md:p-10 relative overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)]">
              
              <div className="flex bg-[#121212] p-1.5 rounded-2xl relative mb-8 border border-white/5">
                {DURATIONS.map((d, idx) => (
                  <button
                    key={d.months}
                    onClick={() => setDurationIdx(idx)}
                    className={`flex-1 relative py-3 text-sm font-bold transition-colors ${durationIdx === idx ? 'text-black' : 'text-white/50 hover:text-white'}`}
                  >
                    {durationIdx === idx && (
                      <motion.div 
                        layoutId="active-duration"
                        className="absolute inset-0 bg-white rounded-xl shadow-lg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{d.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-end justify-between mb-8 pb-8 border-b border-white/10">
                <div>
                  <p className="text-white/40 text-sm font-bold uppercase tracking-wider mb-1">Итого к оплате</p>
                  <div className="flex items-baseline gap-2">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={durationIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-5xl font-black text-white tracking-tighter"
                      >
                        {DURATIONS[durationIdx].price} ₽
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                {DURATIONS[durationIdx].discount && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30"
                  >
                    {DURATIONS[durationIdx].discount}
                  </motion.div>
                )}
              </div>

              <ul className="flex flex-col gap-4 mb-10">
                {[
                  { icon: InfinityIcon, text: "Безлимитный импорт треков" },
                  { icon: Zap, text: "Приоритетная очередь скачивания" },
                  { icon: ShieldCheck, text: "Свои обложки для плейлистов" },
                  { icon: Crown, text: "Эксклюзивный доступ к новым фичам" },
                ].map((feature, i) => (
                  <motion.li 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-center gap-3 text-sm font-medium text-white/80"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <feature.icon size={16} className="text-white" />
                    </div>
                    {feature.text}
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                className="w-full bg-white text-black font-black uppercase tracking-wider text-sm py-4 rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Оформить подписку
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-8">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setIsInviteOpen(true)}
                className="text-sm font-bold text-[var(--text-subdued)] hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
              >
                Я уже знаком(а) — Ввести инвайт-код
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={() => setIsAdminModalOpen(true)}
                className="text-sm font-bold text-red-500/50 hover:text-red-500 transition-colors flex items-center justify-center gap-1"
              >
                <ShieldAlert size={14} /> Для администрации
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <AdminLoginModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />
    </div>
  );
}