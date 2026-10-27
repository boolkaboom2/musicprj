import { create } from 'zustand';

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

interface ModalState {
  isAddToPlaylistOpen: boolean;
  trackToAdd: Track | null;
  openAddToPlaylist: (track: Track) => void;
  closeAddToPlaylist: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isAddToPlaylistOpen: false,
  trackToAdd: null,
  openAddToPlaylist: (track) => set({ isAddToPlaylistOpen: true, trackToAdd: track }),
  closeAddToPlaylist: () => set({ isAddToPlaylistOpen: false, trackToAdd: null }),
}));