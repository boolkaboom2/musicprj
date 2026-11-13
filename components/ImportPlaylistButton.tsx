"use client";

import { useState } from "react";
import { ListMusic } from "lucide-react";
import ImportPlaylistModal from "./ImportPlaylistModal";

export default function ImportPlaylistButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 w-full py-2.5 text-[var(--text-subdued)] hover:text-[var(--text-base)] font-medium text-sm 3xl:text-lg transition-all duration-300 hover:translate-x-1"
      >
        <ListMusic size={18} className="3xl:w-6 3xl:h-6 shrink-0" /> 
        <span>Импорт плейлиста</span>
      </button>

      <ImportPlaylistModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSuccess={() => setIsOpen(false)}
      />
    </>
  );
}