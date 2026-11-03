"use client";

import { IMusic } from "./Icons";
import { motion } from "framer-motion";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[50vh] gap-6">
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
          rotate: [0, 0, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
      >
        <IMusic size={32} className="text-white" />
      </motion.div>
      
      <div className="flex flex-col items-center gap-2">
        <span className="text-white font-black uppercase tracking-[0.3em] text-sm animate-pulse">
          Загрузка
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -5, 0] }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity, 
                delay: i * 0.2,
                ease: "easeInOut" 
              }}
              className="w-1.5 h-1.5 bg-white/50 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}