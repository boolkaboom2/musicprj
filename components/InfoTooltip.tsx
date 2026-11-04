"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InfoTooltip({ text }: { text: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative flex items-center justify-center ml-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsHovered(!isHovered)} // Для мобилок
    >
      <HelpCircle size={16} className="text-white/40 hover:text-white transition-colors cursor-help" />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 w-48 p-3 bg-[#1c1c1c] text-white/80 text-xs rounded-lg shadow-2xl border border-white/10 z-50 pointer-events-none text-left leading-relaxed"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}