import { create } from 'zustand';

interface UIState {
  isPlayerExpanded: boolean;
  setPlayerExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPlayerExpanded: false,
  setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
}));