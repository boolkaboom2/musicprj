"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "@/store/playerStore";
import { useSoundStore } from "@/store/soundStore";
import { useTrackMenuStore } from "@/store/trackMenuStore";
import { useUIStore } from "@/store/uiStore";
import { 
  IPlay, IPause, ISkipBack, ISkipForward, IVolume, IMute, 
  IMore, IMusic, ISettings, IChevronDown, IShuffle, IRepeat 
} from "./Icons";
import PlayerLikeButton from "./PlayerLikeButton";
import SoundSettingsModal from "./SoundSettingsModal";
import VolumeSlider from "./VolumeSlider";

const getRealVolume = (v: number): number => {
  if (v <= 0) return 0;
  return Math.pow(10, (v - 100) / 50);
};

export default function Player() {
  const pathname = usePathname();
  const { 
    activeTrack, isPlaying, setIsPlaying, playNext, playPrevious,
    queue, currentIndex, isRadioMode, addToQueue, isShuffle, toggleShuffle, isRepeat, toggleRepeat
  } = usePlayerStore();
  
  const { quality, isEqualizerOn, volume, eqBass, eqMid, eqTreble, toggleMute, isMuted } = useSoundStore();
  const { openTrackMenu } = useTrackMenuStore();
  const { isPlayerExpanded, setPlayerExpanded } = useUIStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);

  const hasScrobbledRef = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const isFadingOutRef = useRef(false);

  useEffect(() => {
    hasScrobbledRef.current = false;
    setIsWaitingForNext(false);
    isFadingOutRef.current = false;
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);
  }, [activeTrack, isMuted, volume]);

  useEffect(() => {
    if (isRadioMode && activeTrack && queue.length - currentIndex <= 2 && !isFetchingMoreRef.current) {
      isFetchingMoreRef.current = true;
      const excludeIds = queue.map(t => t.id).join(',');
      fetch(`/api/recommendations?trackId=${activeTrack.id}&excludeIds=${excludeIds}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data) && data.length > 0) addToQueue(data); })
        .catch(console.error)
        .finally(() => { isFetchingMoreRef.current = false; });
    }
  }, [isRadioMode, activeTrack, queue, currentIndex, addToQueue]);

  useEffect(() => {
    if (isWaitingForNext && currentIndex < queue.length - 1) {
      setIsWaitingForNext(false);
      playNext();
    }
  }, [isWaitingForNext, currentIndex, queue.length, playNext]);

  useEffect(() => {
    if (filterRef.current) {
      if (quality === 'economical') filterRef.current.frequency.value = 4000;
      else if (quality === 'optimal') filterRef.current.frequency.value = 12000;
      else filterRef.current.frequency.value = 22000;
    }
    if (isEqualizerOn) {
      if (bassRef.current) bassRef.current.gain.value = eqBass;
      if (midRef.current) midRef.current.gain.value = eqMid;
      if (trebleRef.current) trebleRef.current.gain.value = eqTreble;
    } else {
      if (bassRef.current) bassRef.current.gain.value = 0;
      if (midRef.current) midRef.current.gain.value = 0;
      if (trebleRef.current) trebleRef.current.gain.value = 0;
    }
  }, [quality, isEqualizerOn, eqBass, eqMid, eqTreble]);

  useEffect(() => {
    if (audioRef.current && !isFadingOutRef.current) {
      audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, [activeTrack]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        audioRef.current.play().catch(e => console.log(e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrack]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = Math.max(0, Math.min(percent * duration, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      if (!isPlaying) setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = audio.currentTime;
    setCurrentTime(time);

    if (time > 15 && !hasScrobbledRef.current && activeTrack) {
      hasScrobbledRef.current = true;
      fetch('/api/history', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: activeTrack.id })
      }).catch(console.error);
    }

    if (duration > 4 && duration - time <= 3 && !isFadingOutRef.current && isPlaying) {
      isFadingOutRef.current = true;
      const targetVolume = isMuted ? 0 : getRealVolume(volume);
      let currentVol = targetVolume;
      const fadeInterval = setInterval(() => {
        if (currentVol > 0.005) {
          currentVol -= targetVolume / 15;
          if (currentVol < 0) currentVol = 0;
          audio.volume = currentVol;
        } else {
          clearInterval(fadeInterval);
          audio.volume = 0;
        }
      }, 100);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log(e));
      }
      return;
    }
    if (queue.length - currentIndex > 1) playNext();
    else if (isRadioMode) setIsWaitingForNext(true);
    else setIsPlaying(false);
  };

  const handleLoadedMetadata = async () => {
    if (audioRef.current && activeTrack) {
       const realDuration = Math.round(audioRef.current.duration);
       setDuration(realDuration);
       if (!isFadingOutRef.current) {
          audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);
       }
       if (activeTrack.duration === 0 && realDuration > 0) {
          try {
            await fetch(`/api/tracks/${activeTrack.id}`, {
               method: 'PATCH', headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ duration: realDuration })
            });
            usePlayerStore.setState((state) => ({
              activeTrack: state.activeTrack ? { ...state.activeTrack, duration: realDuration } : null,
              queue: state.queue.map(t => t.id === activeTrack.id ? { ...t, duration: realDuration } : t)
            }));
          } catch (e) { console.error(e); }
       }
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const audioSrc = activeTrack?.audioUrl 
    ? (activeTrack.audioUrl.startsWith('/') ? activeTrack.audioUrl : `/api/stream/${activeTrack.audioUrl}`) 
    : undefined;

  if (!activeTrack || pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <>
      <audio ref={audioRef} src={audioSrc} onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} />

      {/* FULLSCREEN PLAYER */}
      {isPlayerExpanded && activeTrack && (
        <div className="fixed inset-0 z-[150] bg-[#0a0a0a] flex flex-col animate-in slide-in-from-bottom-full duration-500 ease-out">
          {activeTrack.coverUrl && <img src={activeTrack.coverUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-30 scale-125 pointer-events-none" />}
          <div className="absolute inset-0 bg-black/50 pointer-events-none" />

          <div className="relative z-10 flex justify-between items-center p-4 md:p-6">
            <button onClick={() => setPlayerExpanded(false)} className="text-white hover:scale-110 transition p-2 bg-white/10 rounded-full">
              <IChevronDown size={28} className="md:w-8 md:h-8" />
            </button>
            <span className="text-[10px] md:text-xs text-white/60 uppercase tracking-widest font-bold">Сейчас играет</span>
            <div className="flex gap-2">
              <button onClick={() => setIsSoundModalOpen(true)} className="text-white hover:scale-110 transition p-2 bg-white/10 rounded-full" title="Эквалайзер и качество">
                <ISettings size={22} className="md:w-7 md:h-7" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (activeTrack) openTrackMenu(activeTrack, e.currentTarget.getBoundingClientRect()); }} className="text-white hover:scale-110 transition p-2 bg-white/10 rounded-full z-[200]">
                <IMore size={22} className="md:w-7 md:h-7" />
              </button>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 md:gap-10 p-4 md:p-6">
            <div className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[400px] md:h-[400px] bg-[#222] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              {activeTrack.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><IMusic size={64} /></div>}
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-full px-6 py-3 md:px-8 md:py-4 flex items-center justify-between w-full max-w-md border border-white/10">
              <div className="flex flex-col overflow-hidden">
                <span className="text-white font-bold text-base md:text-lg truncate">{activeTrack.title}</span>
                <span className="text-white/60 text-xs md:text-sm truncate">{activeTrack.artist}</span>
              </div>
              <PlayerLikeButton trackId={activeTrack.id} />
            </div>
          </div>

          <div className="relative z-10 p-4 md:p-8 flex flex-col gap-4 md:gap-6 max-w-2xl mx-auto w-full pb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-xs md:text-sm text-white/50 font-medium w-8 md:w-10 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 md:h-1.5 bg-white/20 rounded-full cursor-pointer group relative" onClick={handleSeek}>
                <div className="h-full bg-white rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 md:w-3.5 md:h-3.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs md:text-sm text-white/50 font-medium w-8 md:w-10 text-left">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between px-2 md:px-4">
              <div className="relative">
                <button onClick={toggleShuffle} className={`p-1.5 md:p-2 rounded-full transition ${isShuffle ? "text-white bg-white/10" : "text-white/40 hover:text-white"}`}>
                  <IShuffle size={20} className="md:w-6 md:h-6" />
                </button>
                {isShuffle && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />}
              </div>

              <div className="flex items-center gap-4 md:gap-8">
                <button onClick={playPrevious} className="text-white/60 hover:text-white transition"><ISkipBack size={28} className="md:w-9 md:h-9" /></button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-black w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  {isPlaying ? <IPause size={32} className="md:w-10 md:h-10" /> : <IPlay size={32} className="md:w-10 md:h-10" />}
                </button>
                <button onClick={playNext} className="text-white/60 hover:text-white transition"><ISkipForward size={28} className="md:w-9 md:h-9" /></button>
              </div>

              <div className="relative">
                <button onClick={toggleRepeat} className={`p-1.5 md:p-2 rounded-full transition ${isRepeat ? "text-white bg-white/10" : "text-white/40 hover:text-white"}`}>
                  <IRepeat size={20} className="md:w-6 md:h-6" />
                </button>
                {isRepeat && <span className="absolute -top-1 -right-1 bg-white text-black text-[7px] md:text-[8px] font-bold rounded-full w-3 h-3 md:w-3.5 md:h-3.5 flex items-center justify-center border border-black">1</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MINI PLAYER */}
      <footer className="relative bg-[#121212]/95 backdrop-blur-2xl border-t border-white/10 w-full shrink-0 z-50">
        
        {/* MOBILE */}
        <div className="md:hidden flex flex-col">
          <div 
            onClick={() => activeTrack && setPlayerExpanded(true)} 
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer active:bg-white/5 transition"
          >
            <div className="w-12 h-12 bg-[#222] rounded-md overflow-hidden shrink-0 shadow-lg border border-white/5">
              {activeTrack?.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#555]"><IMusic size={20} /></div>}
            </div>
            <div className="overflow-hidden flex flex-col justify-center min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{activeTrack.title}</div>
              <div className="text-xs text-[var(--text-subdued)] truncate mt-0.5">{activeTrack.artist}</div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="text-[var(--text-subdued)] hover:text-white transition p-2 shrink-0"
            >
              {isMuted || volume === 0 ? <IMute size={20} /> : <IVolume size={20} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); if (activeTrack) openTrackMenu(activeTrack, e.currentTarget.getBoundingClientRect()); }} 
              className="text-[var(--text-subdued)] hover:text-white transition p-2 shrink-0"
            >
              <IMore size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="flex items-center justify-center gap-6">
              <button onClick={playPrevious} className="text-white/80 p-1.5"><ISkipBack size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center">
                {isPlaying ? <IPause size={22} /> : <IPlay size={22} />}
              </button>
              <button onClick={playNext} className="text-white/80 p-1.5"><ISkipForward size={24} /></button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--text-subdued)] tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer relative" onClick={handleSeek}>
                <div className="h-full bg-white rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-[var(--text-subdued)] tabular-nums w-8 text-left">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:grid grid-cols-3 items-center h-[90px] px-6">
          <div onClick={() => activeTrack && setPlayerExpanded(true)} className="flex items-center gap-4 overflow-hidden cursor-pointer hover:bg-white/5 p-2 rounded-md transition">
            <div className="w-14 h-14 bg-[#222] rounded-md overflow-hidden shrink-0 shadow-lg border border-white/5">
              {activeTrack?.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#555]"><IMusic size={24} /></div>}
            </div>
            <div className="overflow-hidden flex flex-col justify-center">
              <div className="text-sm font-bold text-white truncate">{activeTrack.title}</div>
              <div className="text-xs text-[var(--text-subdued)] truncate mt-0.5">{activeTrack.artist}</div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 w-full max-w-[500px] mx-auto">
            <div className="flex items-center gap-6">
              <div className="relative">
                <button onClick={toggleShuffle} className={`p-1.5 rounded-full transition ${isShuffle ? "text-white bg-white/10" : "text-[var(--text-subdued)] hover:text-white"}`}>
                  <IShuffle size={18} />
                </button>
                {isShuffle && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />}
              </div>
              <button onClick={playPrevious} className="text-[var(--text-subdued)] hover:text-white transition"><ISkipBack size={22} /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="bg-white text-black hover:scale-105 w-10 h-10 rounded-full flex items-center justify-center transition-transform shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {isPlaying ? <IPause size={22} /> : <IPlay size={22} />}
              </button>
              <button onClick={playNext} className="text-[var(--text-subdued)] hover:text-white transition"><ISkipForward size={22} /></button>
              <div className="relative">
                <button onClick={toggleRepeat} className={`p-1.5 rounded-full transition ${isRepeat ? "text-white bg-white/10" : "text-[var(--text-subdued)] hover:text-white"}`}>
                  <IRepeat size={18} />
                </button>
                {isRepeat && <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-black">1</span>}
              </div>
            </div>
            <div className="w-full flex items-center gap-3">
              <span className="text-sm text-[var(--text-subdued)] font-medium w-9 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full cursor-pointer group relative" onClick={handleSeek}>
                <div className="h-full bg-white rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
              <span className="text-sm text-[var(--text-subdued)] font-medium w-9 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="w-full flex justify-end items-center gap-4">
            <button onClick={() => setIsSoundModalOpen(true)} className="text-[var(--text-subdued)] hover:text-white transition p-2"><ISettings size={20} /></button>
            <div className="relative group flex items-center justify-center p-2">
              <button onClick={toggleMute} className="text-[var(--text-subdued)] hover:text-white transition">
                {isMuted || volume === 0 ? <IMute size={20} /> : <IVolume size={20} />}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1c1c1c] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl border border-white/5 flex flex-col items-center"><VolumeSlider /></div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); if (activeTrack) openTrackMenu(activeTrack, e.currentTarget.getBoundingClientRect()); }} className="text-[var(--text-subdued)] hover:text-white transition p-2"><IMore size={20} /></button>
          </div>
        </div>
      </footer>

      <SoundSettingsModal isOpen={isSoundModalOpen} onClose={() => setIsSoundModalOpen(false)} />
    </>
  );
}