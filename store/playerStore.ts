import { create } from 'zustand'

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
  bpm?: number | null;
};

interface PlayerState {
  activeTrack: Track | null;
  isPlaying: boolean;
  likedTrackIds: string[];
  queue: Track[];
  currentIndex: number;
  isRadioMode: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  
  setActiveTrack: (track: Track, newQueue?: Track[], radioMode?: boolean) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setLikedTrackIds: (ids: string[]) => void;
  toggleLikedTrack: (id: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (newTracks: Track[]) => void;
  removeFromQueue: (id: string) => void; // <--- НОВОЕ
  clearQueue: () => void; // <--- НОВОЕ
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeTrack: null,
  isPlaying: false,
  likedTrackIds: [],
  queue: [],
  currentIndex: -1,
  isRadioMode: false,
  isShuffle: false,
  isRepeat: false,
  
  setActiveTrack: (track, newQueue, radioMode = false) => set((state) => {
    const q = newQueue || state.queue;
    const idx = q.findIndex(t => t.id === track.id);
    return { 
      activeTrack: track, 
      isPlaying: true, 
      queue: q, 
      currentIndex: idx !== -1 ? idx : state.currentIndex,
      isRadioMode: radioMode
    };
  }),
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setLikedTrackIds: (ids) => set({ likedTrackIds: ids }),
  toggleLikedTrack: (id) => set((state) => ({
    likedTrackIds: state.likedTrackIds.includes(id) 
      ? state.likedTrackIds.filter(t => t !== id)
      : [...state.likedTrackIds, id]
  })),

  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),

  playNext: () => {
    const { queue, currentIndex, isShuffle } = get();
    if (queue.length === 0) return;

    if (isShuffle) {
      let nextIdx = currentIndex;
      if (queue.length > 1) {
        while (nextIdx === currentIndex) {
          nextIdx = Math.floor(Math.random() * queue.length);
        }
      }
      set({ activeTrack: queue[nextIdx], currentIndex: nextIdx, isPlaying: true });
    } else {
      if (currentIndex < queue.length - 1) {
        set({ activeTrack: queue[currentIndex + 1], currentIndex: currentIndex + 1, isPlaying: true });
      }
    }
  },
  
  playPrevious: () => {
    const { queue, currentIndex } = get();
    if (queue.length > 0 && currentIndex > 0) {
      set({ activeTrack: queue[currentIndex - 1], currentIndex: currentIndex - 1, isPlaying: true });
    }
  },

  addToQueue: (newTracks) => set((state) => {
    const existingIds = new Set(state.queue.map(t => t.id));
    const filteredNewTracks = newTracks.filter(t => !existingIds.has(t.id));
    return { queue: [...state.queue, ...filteredNewTracks] };
  }),

  // УДАЛЕНИЕ ИЗ ОЧЕРЕДИ
  removeFromQueue: (id) => set((state) => {
    const idx = state.queue.findIndex(t => t.id === id);
    if (idx === -1) return state;

    const newQueue = state.queue.filter(t => t.id !== id);
    let newIndex = state.currentIndex;

    if (idx < state.currentIndex) {
      newIndex--;
    } else if (idx === state.currentIndex) {
      // Если удаляем текущий трек
      if (newQueue.length === 0) {
        return { queue: [], activeTrack: null, isPlaying: false, currentIndex: -1 };
      }
      if (newIndex >= newQueue.length) {
        newIndex = newQueue.length - 1;
      }
      return {
        queue: newQueue,
        activeTrack: newQueue[newIndex],
        currentIndex: newIndex,
        isPlaying: state.isPlaying
      };
    }

    return { queue: newQueue, currentIndex: newIndex };
  }),

  // ОЧИСТКА ОЧЕРЕДИ
  clearQueue: () => set({ queue: [], currentIndex: -1, activeTrack: null, isPlaying: false })
}));