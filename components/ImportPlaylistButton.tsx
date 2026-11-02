"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListMusic } from "lucide-react";
import ImportPlaylistModal from "./ImportPlaylistModal";

export default function ImportPlaylistButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = (playlistId: string | null) => {
    router.refresh();
    if (playlistId) {
      router.push(`/playlist/${playlistId}`);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-[var(--text-subdued)] hover:text-white transition font-medium text-sm tracking-wide"
      >
        <ListMusic size={16} /> Импорт плейлиста
      </button>
      <ImportPlaylistModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}