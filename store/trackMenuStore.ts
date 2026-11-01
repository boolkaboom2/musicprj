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
  menuPosition: { top: number; left: number; buttonTop: number; buttonHeight: number };
  openTrackMenu: (track: Track, rect: DOMRect) => void;
  closeTrackMenu: () => void;
}

export const useTrackMenuStore = create<TrackMenuState>((set) => ({
  isTrackMenuOpen: false,
  trackForMenu: null,
  menuPosition: { top: 0, left: 0, buttonTop: 0, buttonHeight: 0 },
  openTrackMenu: (track, rect) => set({ 
    isTrackMenuOpen: true, 
    trackForMenu: track, 
    menuPosition: { 
      top: rect.bottom + 8, 
      left: rect.left - 140, // <--- было -100, стало -140 (левее)
      buttonTop: rect.top,
      buttonHeight: rect.height
    } 
  }),
  closeTrackMenu: () => set({ isTrackMenuOpen: false, trackForMenu: null }),
}));