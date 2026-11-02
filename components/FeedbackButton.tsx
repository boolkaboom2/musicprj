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
            : "flex items-center gap-2 text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide mt-4 pt-4 border-t border-[#333]"
        }
      >
        <MessageSquarePlus size={compact ? 20 : 16} />
        {!compact && "Обратная связь"}
      </button>
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}