"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();
  const isDark = theme === 'dark';

  useEffect(() => {
    useThemeStore.getState().hydrate();
  }, []);

  // Позиции
  const INSIDE_X = 20;   // Пластинка внутри упаковки
  const OUTSIDE_X = 175; // Пластинка снаружи

  const handleToggle = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (isDark) {
      // DARK -> LIGHT: Выкатываем
      await controls.start({
        x: OUTSIDE_X,
        rotate: 720,
        transition: { duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }
      });
    } else {
      // LIGHT -> DARK: Закатываем
      await controls.start({
        x: INSIDE_X,
        rotate: -720,
        transition: { duration: 1.2, ease: "easeInOut" }
      });
    }

    toggleTheme();
    setIsAnimating(false);
  };

  return (
    <div 
      onClick={handleToggle}
      className="relative w-[280px] h-[130px] bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-2xl cursor-pointer overflow-hidden select-none transition-colors duration-300 flex items-center"
    >
      
      {/* ВЕТЕР (Линии скорости) */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-[35px] bottom-[35px] left-[110px] right-4 pointer-events-none z-0 flex flex-col justify-center gap-3"
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0, opacity: 0, x: isDark ? 0 : -50 }}
                animate={{ scaleX: 1, opacity: [0, 0.6, 0], x: isDark ? 50 : -100 }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.1,
                  ease: "linear"
                }}
                className="h-[2px] bg-[var(--text-subdued)] rounded-full origin-left"
                style={{ width: `${30 + i * 20}px` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ПОЛ (линия, по которой катится) */}
      <div className="absolute bottom-[24px] left-6 right-6 h-[2px] bg-[var(--border-color)] opacity-40 z-0" />

      {/* УПАКОВКА (Конверт) */}
      <div 
        className="absolute left-4 top-[15px] w-[96px] h-[96px] z-20 rounded-md transition-all duration-500"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' 
            : 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
          boxShadow: isDark 
            ? '0 0 25px rgba(220, 38, 38, 0.4), inset 0 0 15px rgba(0,0,0,0.8)' 
            : '0 0 25px rgba(234, 179, 8, 0.4), inset 0 0 15px rgba(255,255,255,0.8)',
          border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)'
        }}
      >
        {/* Корешок упаковки слева */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-2 rounded-l-md ${
            isDark ? 'bg-[#111] border-r border-[#222]' : 'bg-[#d4d4d4] border-r border-[#ccc]'
          }`} 
        />

        {/* Вырез в упаковке (полукруг сверху) */}
        <div 
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[25px] border-b border-x rounded-b-full ${
            isDark ? 'bg-[var(--bg-card)] border-[#222]' : 'bg-[var(--bg-card)] border-[#ccc]'
          }`}
        />

        {/* Декоративные линии на конверте */}
        <div className={`absolute bottom-4 left-4 right-4 h-[1px] ${isDark ? 'bg-[#222]' : 'bg-[#ccc]'}`} />
        
        {/* Логотип на упаковке */}
        <div className={`absolute bottom-6 left-0 right-0 text-center text-[9px] font-black uppercase tracking-[0.2em] ${
          isDark ? 'text-[#333]' : 'text-[#999]'
        }`}>
          SADOVOD
        </div>
      </div>

      {/* ВИНИЛ (Пластинка) */}
      <motion.div
        initial={{ x: isDark ? INSIDE_X : OUTSIDE_X }}
        animate={controls}
        className="absolute top-[23px] w-[84px] h-[84px] z-10"
      >
        <div 
          className="w-full h-full rounded-full relative border border-white/10"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #222 0%, #050505 60%, #000 100%)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
          }}
        >
          {/* Бороздки */}
          <div className="absolute inset-[4px] rounded-full border border-white/[0.05]" />
          <div className="absolute inset-[10px] rounded-full border border-white/[0.08]" />
          <div className="absolute inset-[16px] rounded-full border border-white/[0.05]" />
          <div className="absolute inset-[22px] rounded-full border border-white/[0.08]" />
          
          {/* Наклейка по центру */}
          <div 
            className={`absolute inset-[26px] rounded-full flex items-center justify-center shadow-inner transition-colors duration-500 ${
              isDark ? 'bg-red-600' : 'bg-yellow-400'
            }`}
          >
            <div className="w-2.5 h-2.5 bg-black rounded-full shadow-inner" />
          </div>
          
          {/* Блик на виниле */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'conic-gradient(from 45deg, transparent 0%, rgba(255,255,255,0.08) 25%, transparent 50%, rgba(255,255,255,0.08) 75%, transparent 100%)'
            }}
          />
        </div>
      </motion.div>
      
    </div>
  );
}