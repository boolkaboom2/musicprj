"use client";

import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('sadovod_theme', theme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('sadovod_theme', newTheme);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
    }
    return { theme: newTheme };
  }),
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('sadovod_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') {
      set({ theme: saved });
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(saved);
    }
  },
}));