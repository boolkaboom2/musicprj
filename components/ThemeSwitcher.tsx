"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useThemeStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const controls = useAnimation();

  const handleToggle = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Темная: у ямы (x=80). Светлая: у солнца (x=12)
    const startX = theme === 'dark' ? 80 : 12;
    const holeX = 80;
    const sunX = 12;
    const centerX = 45;

    // Шаг 1: Идем к яме
    setIsWalking(true);
    await controls.start({
      x: holeX,
      y: 0,
      transition: { duration: 1.0, ease: "linear" }
    });

    // Шаг 2: Падаем в яму (ровно по центру)
    setIsWalking(false);
    await controls.start({
      y: 30,
      opacity: 0,
      rotate: 90,
      transition: { duration: 0.4, ease: "easeIn" }
    });

    // Мгновенно меняем тему
    if (theme === 'dark') toggleTheme();

    // Шаг 3: Выпрыгиваем в центре
    await controls.start({
      x: centerX,
      y: 0,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.1 }
    });

    // Шаг 4: Идем к финальной точке (солнце или яма)
    setIsWalking(true);
    await controls.start({
      x: theme === 'dark' ? sunX : holeX,
      transition: { duration: 1.2, ease: "linear" }
    });

    setIsWalking(false);
    setIsAnimating(false);
  };

  const initialX = theme === 'dark' ? 80 : 12;

  return (
    <div 
      onClick={handleToggle}
      className="relative w-[120px] h-[60px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full cursor-pointer overflow-hidden flex items-center select-none shadow-inner"
    >
      {/* Солнце */}
      <motion.div 
        animate={{ 
          opacity: theme === 'light' ? 1 : 0.3, 
          scale: theme === 'light' ? 1.1 : 0.9,
          rotate: theme === 'light' ? 360 : 0
        }}
        transition={{ duration: 0.8 }}
        className="absolute left-2 text-yellow-500"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </motion.div>

      {/* Яма (справа) */}
      <div className="absolute right-4 bottom-2 w-6 h-1.5 bg-black rounded-[50%] border border-[var(--border-color)] shadow-[inset_0_2px_4px_rgba(0,0,0,1)]" />

      {/* Стикман */}
      <motion.div
        initial={{ x: initialX, y: 0, opacity: 1, rotate: 0 }}
        animate={controls}
        className="absolute left-0 bottom-2"
        style={{ originX: 0.5, originY: 0 }}
      >
        <svg width="20" height="30" viewBox="0 0 20 30" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {/* Голова */}
          <circle cx="10" cy="5" r="4" className="text-[var(--text-base)]" />
          
          {/* Тело */}
          <line x1="10" y1="9" x2="10" y2="20" className="text-[var(--text-base)]" />
          
          {/* Левая рука (точка вращения: плечо 10,12) */}
          <motion.line 
            x1="10" y1="12" x2="4" y2="15" 
            className="text-[var(--text-base)]"
            animate={isWalking ? { rotate: [20, -20, 20] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "10px 12px" }}
          />
          {/* Правая рука */}
          <motion.line 
            x1="10" y1="12" x2="16" y2="15" 
            className="text-[var(--text-base)]"
            animate={isWalking ? { rotate: [-20, 20, -20] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "10px 12px" }}
          />
          
          {/* Левая нога (точка вращения: бедро 10,20) */}
          <motion.line 
            x1="10" y1="20" x2="6" y2="28" 
            className="text-[var(--text-base)]"
            animate={isWalking ? { rotate: [-15, 15, -15] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "10px 20px" }}
          />
          {/* Правая нога */}
          <motion.line 
            x1="10" y1="20" x2="14" y2="28" 
            className="text-[var(--text-base)]"
            animate={isWalking ? { rotate: [15, -15, 15] } : { rotate: 0 }}
            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            style={{ transformOrigin: "10px 20px" }}
          />
        </svg>
      </motion.div>
    </div>
  );
}