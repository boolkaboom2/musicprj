import { create } from 'zustand';

interface SoundState {
  quality: 'excellent' | 'optimal' | 'economical';
  isEqualizerOn: boolean;
  volume: number;
  isMuted: boolean;
  previousVolume: number; // Запоминаем громкость до мьюта
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  setQuality: (q: 'excellent' | 'optimal' | 'economical') => void;
  toggleEqualizer: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setEqBass: (v: number) => void;
  setEqMid: (v: number) => void;
  setEqTreble: (v: number) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  quality: 'optimal',
  isEqualizerOn: false,
  volume: 100,
  isMuted: false,
  previousVolume: 100,
  eqBass: 0,
  eqMid: 0,
  eqTreble: 0,
  setQuality: (quality) => set({ quality }),
  toggleEqualizer: () => set((state) => ({ isEqualizerOn: !state.isEqualizerOn })),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => {
    if (state.isMuted) {
      // Включаем звук обратно
      return { isMuted: false, volume: state.previousVolume > 0 ? state.previousVolume : 100 };
    } else {
      // Выключаем звук
      return { isMuted: true, previousVolume: state.volume, volume: 0 };
    }
  }),
  setEqBass: (eqBass) => set({ eqBass }),
  setEqMid: (eqMid) => set({ eqMid }),
  setEqTreble: (eqTreble) => set({ eqTreble }),
}));