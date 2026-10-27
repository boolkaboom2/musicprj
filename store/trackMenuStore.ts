import { create } from 'zustand';

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

interface TrackMenuState {
  isTrackMenuOpen: boolean;
  trackForMenu: Track | null;
  menuPosition: { top: number; left: number };
  openTrackMenu: (track: Track, rect: DOMRect) => void;
  closeTrackMenu: () => void;
}

export const useTrackMenuStore = create<TrackMenuState>((set) => ({
  isTrackMenuOpen: false,
  trackForMenu: null,
  menuPosition: { top: 0, left: 0 },
  openTrackMenu: (track, rect) => set({ 
    isTrackMenuOpen: true, 
    trackForMenu: track, 
    // Вычисляем позицию: под кнопкой и выравниваем по её левому краю (или можно чуть сдвинуть)
    menuPosition: { top: rect.bottom + 8, left: rect.left - 100 } 
  }),
  closeTrackMenu: () => set({ isTrackMenuOpen: false, trackForMenu: null }),
}));