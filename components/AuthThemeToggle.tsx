"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    useThemeStore.getState().hydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null; // Ждем гидратации, чтобы не было мигания

  const isDark = theme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      className="fixed top-6 right-6 z-[9999] w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors duration-300"
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' }}
      aria-label="Переключить тему"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Sun size={22} /> : <Moon size={22} />}
      </motion.div>
    </motion.button>
  );
}