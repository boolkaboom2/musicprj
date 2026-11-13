"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomeSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="relative flex items-center justify-end min-w-[48px]">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="icon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsOpen(true)}
            className="p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-[var(--text-base)] hover:bg-[var(--bg-input)] transition"
          >
            <Search size={24} />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 48, opacity: 0 }}
            animate={{ width: "100%", maxWidth: 400, opacity: 1 }}
            exit={{ width: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onSubmit={handleSubmit}
            className="flex items-center bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-full overflow-hidden w-full max-w-[400px]"
          >
            <div className="pl-4 text-[var(--text-subdued)] shrink-0">
              <Search size={20} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск треков..."
              className="w-full bg-transparent text-[var(--text-base)] px-3 py-3 outline-none text-sm placeholder:text-[var(--text-subdued)]"
            />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery("");
              }}
              className="p-3 text-[var(--text-subdued)] hover:text-[var(--text-base)] transition shrink-0"
            >
              <X size={20} />
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}