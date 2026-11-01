import { create } from 'zustand';

interface UIState {
  isPlayerExpanded: boolean;
  setPlayerExpanded: (expanded: boolean) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isPlayerExpanded: false,
  setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));