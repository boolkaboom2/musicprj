import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isPlayerExpanded: boolean;
  setPlayerExpanded: (expanded: boolean) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isAnimatedBgEnabled: boolean;
  toggleAnimatedBg: () => void;
  isLyricsOpen: boolean;
  setLyricsOpen: (open: boolean) => void;
  isQueueOpen: boolean; // <--- НОВОЕ
  setQueueOpen: (open: boolean) => void; // <--- НОВОЕ
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isPlayerExpanded: false,
      setPlayerExpanded: (expanded) => set({ isPlayerExpanded: expanded }),
      isSidebarOpen: false,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      isAnimatedBgEnabled: true,
      toggleAnimatedBg: () => set((state) => ({ isAnimatedBgEnabled: !state.isAnimatedBgEnabled })),
      isLyricsOpen: false,
      setLyricsOpen: (open) => set({ isLyricsOpen: open }),
      isQueueOpen: false,
      setQueueOpen: (open) => set({ isQueueOpen: open }),
    }),
    {
      name: 'sadovod-ui-storage',
    }
  )
);