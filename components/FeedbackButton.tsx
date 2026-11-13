"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function FeedbackButton({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          compact
            ? "text-[var(--text-subdued)] hover:text-white transition p-2"
            : "flex items-center gap-3 w-full py-2.5 text-[var(--text-subdued)] hover:text-[var(--text-base)] font-medium text-sm 3xl:text-lg transition-all duration-300 hover:translate-x-1"
        }
      >
        <MessageSquarePlus size={compact ? 20 : 18} className="3xl:w-6 3xl:h-6 shrink-0" />
        {!compact && <span>Обратная связь</span>}
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}