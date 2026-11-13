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
        className="flex items-center gap-2 text-[var(--text-subdued)] hover:text-[var(--text-base)] transition font-medium text-sm tracking-wide"
      >
        <ListMusic size={16} /> Импорт плейлиста
      </button>

      <ImportPlaylistModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onSuccess={() => setIsOpen(false)}
      />
    </>
  );
}