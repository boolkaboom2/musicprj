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
import LyricsViewer from "./LyricsViewer";
import QueueModal from "./QueueModal";
import { Mic2, ListMusic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  const { quality, isEqualizerOn, isCrossfadeEnabled, volume, eqBass, eqMid, eqTreble, toggleMute, isMuted } = useSoundStore();
  const { openTrackMenu } = useTrackMenuStore();
  const { isPlayerExpanded, setPlayerExpanded, isLyricsOpen, setLyricsOpen, isQueueOpen, setQueueOpen, isSidebarOpen } = useUIStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const nextSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const gainRef = useRef<GainNode | null>(null);
  const nextGainRef = useRef<GainNode | null>(null);
  
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [isCrossfading, setIsCrossfading] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);

  const hasScrobbledRef = useRef(false);
  const isFetchingMoreRef = useRef(false);
  const isFadingOutRef = useRef(false);
  const crossfadeTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(!isPlaying); }
      if (e.code === 'ArrowRight') { e.preventDefault(); if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 5, duration); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 5, 0); }
      if (e.code === 'KeyM') { e.preventDefault(); toggleMute(); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, setIsPlaying, toggleMute]);

  useEffect(() => {
    if (activeTrack && audioRef.current && !audioCtxRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const source = ctx.createMediaElementSource(audioRef.current);
        sourceRef.current = source;
        const gain = ctx.createGain();
        gainRef.current = gain;
        
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf'; bass.frequency.value = 250;
        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1;
        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf'; treble.frequency.value = 4000;

        source.connect(gain);
        gain.connect(bass); bass.connect(mid); mid.connect(treble); treble.connect(ctx.destination);
        
        bassRef.current = bass; midRef.current = mid; trebleRef.current = treble;

        if (nextAudioRef.current && !nextSourceRef.current) {
          const nextSource = ctx.createMediaElementSource(nextAudioRef.current);
          nextSourceRef.current = nextSource;
          const nextGain = ctx.createGain();
          nextGainRef.current = nextGain;
          nextGain.gain.value = 0;
          
          nextSource.connect(nextGain);
          nextGain.connect(bass);
        }
      } catch (e) { console.error("Web Audio API init failed", e); }
    }

    if (audioCtxRef.current?.state === 'suspended' && isPlaying) audioCtxRef.current.resume();
    if (bassRef.current) bassRef.current.gain.value = isEqualizerOn ? eqBass : 0;
    if (midRef.current) midRef.current.gain.value = isEqualizerOn ? eqMid : 0;
    if (trebleRef.current) trebleRef.current.gain.value = isEqualizerOn ? eqTreble : 0;
  }, [activeTrack, isPlaying, isEqualizerOn, eqBass, eqMid, eqTreble]);

  useEffect(() => {
    if ('mediaSession' in navigator && activeTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeTrack.title, artist: activeTrack.artist, album: 'SADOVOD',
        artwork: [{ src: activeTrack.coverUrl || '/icon.svg', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [activeTrack, setIsPlaying, playPrevious, playNext]);

  useEffect(() => {
    hasScrobbledRef.current = false; setIsWaitingForNext(false); isFadingOutRef.current = false;
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);

    setIsCrossfading(false);
    if (nextAudioRef.current) {
      nextAudioRef.current.pause();
      nextAudioRef.current.currentTime = 0;
    }
    if (nextGainRef.current) {
      nextGainRef.current.gain.value = 0;
    }
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.value = 1;
    }

    if (crossfadeTimeRef.current === null) {
        setCurrentTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
    }
    if (isLyricsOpen) setLyricsOpen(false);
  }, [activeTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRadioMode && activeTrack && queue.length - currentIndex <= 2 && !isFetchingMoreRef.current) {
      isFetchingMoreRef.current = true;
      const excludeIds = queue.map(t => t.id).join(',');
      fetch(`/api/recommendations?trackId=${activeTrack.id}&excludeIds=${excludeIds}`)
        .then(res => res.json()).then(data => { if (Array.isArray(data) && data.length > 0) addToQueue(data); })
        .catch(console.error).finally(() => { isFetchingMoreRef.current = false; });
    }
  }, [isRadioMode, activeTrack, queue, currentIndex, addToQueue]);

  useEffect(() => {
    if (isWaitingForNext && currentIndex < queue.length - 1) { setIsWaitingForNext(false); playNext(); }
  }, [isWaitingForNext, currentIndex, queue.length, playNext]);

  useEffect(() => {
    if (audioRef.current && !isFadingOutRef.current) audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        audioRef.current.play().catch(e => console.log(e));
      } else {
        audioRef.current.pause();
        if (nextAudioRef.current) nextAudioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrack]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60); const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const updateSeek = (clientX: number, element: HTMLElement) => {
    if (audioRef.current && duration) {
      const rect = element.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSeek(e.clientX, e.currentTarget);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSeek(e.clientX, e.currentTarget);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current; if (!audio) return;
    const time = audio.currentTime; setCurrentTime(time);

    if (time > 15 && !hasScrobbledRef.current && activeTrack) {
      hasScrobbledRef.current = true;
      fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId: activeTrack.id }) }).catch(console.error);
    }

    if (isCrossfadeEnabled && !isCrossfading && duration > 10 && queue.length > currentIndex + 1) {
      const timeLeft = duration - time;
      
      if (timeLeft <= 6 && timeLeft > 0) {
        setIsCrossfading(true);
        
        const nextTrack = queue[currentIndex + 1];
        const nextAudio = nextAudioRef.current;
        const ctx = audioCtxRef.current;

        if (nextAudio && ctx && nextTrack && nextGainRef.current && gainRef.current) {
          const currentBpm = activeTrack?.bpm || 120;
          const nextBpm = nextTrack?.bpm || 120;
          
          let rate = currentBpm / nextBpm;
          rate = Math.max(0.8, Math.min(1.2, rate));

          const nextSrc = nextTrack.audioUrl.startsWith('/') ? nextTrack.audioUrl : `/api/stream/${nextTrack.audioUrl}`;
          nextAudio.src = nextSrc;
          nextAudio.playbackRate = rate;
          
          nextAudio.play().then(() => {
            gainRef.current!.gain.setValueAtTime(1, ctx.currentTime);
            gainRef.current!.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);
            
            nextGainRef.current!.gain.setValueAtTime(0, ctx.currentTime);
            nextGainRef.current!.gain.linearRampToValueAtTime(1, ctx.currentTime + 5.5);
          }).catch(console.error);
        }
      }
    }

    if (!isCrossfadeEnabled && duration > 4 && duration - time <= 3 && !isFadingOutRef.current && isPlaying) {
      isFadingOutRef.current = true;
      const targetVolume = isMuted ? 0 : getRealVolume(volume);
      let currentVol = targetVolume;
      const fadeInterval = setInterval(() => {
        if (currentVol > 0.005) { currentVol -= targetVolume / 15; if (currentVol < 0) currentVol = 0; audio.volume = currentVol; } 
        else { clearInterval(fadeInterval); audio.volume = 0; }
      }, 100);
    }
  };

  const handleEnded = () => {
    if (isCrossfading) {
        if (nextAudioRef.current) {
            crossfadeTimeRef.current = nextAudioRef.current.currentTime;
            nextAudioRef.current.pause();
        }
        playNext();
        return;
    }

    if (isRepeat) { 
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(e => console.log(e)); } 
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
       if (!isFadingOutRef.current) audioRef.current.volume = isMuted ? 0 : getRealVolume(volume);
       
       if (crossfadeTimeRef.current !== null) {
           audioRef.current.currentTime = crossfadeTimeRef.current;
           setCurrentTime(crossfadeTimeRef.current);
           crossfadeTimeRef.current = null;
       }

       if (activeTrack.duration === 0 && realDuration > 0) {
          try {
            await fetch(`/api/tracks/${activeTrack.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: realDuration }) });
            usePlayerStore.setState((state) => ({
              activeTrack: state.activeTrack ? { ...state.activeTrack, duration: realDuration } : null,
              queue: state.queue.map(t => t.id === activeTrack.id ? { ...t, duration: realDuration } : t)
            }));
          } catch (e) { console.error(e); }
       }
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const audioSrc = activeTrack?.audioUrl ? (activeTrack.audioUrl.startsWith('/') ? activeTrack.audioUrl : `/api/stream/${activeTrack.audioUrl}`) : undefined;

  if (!activeTrack || pathname === '/login' || pathname === '/register' || pathname === '/welcome') return null;

  return (
    <>
      <audio 
        ref={audioRef} src={audioSrc} crossOrigin="anonymous"
        onEnded={handleEnded} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} 
      />
      
      <audio ref={nextAudioRef} crossOrigin="anonymous" />

      <AnimatePresence>
        {isPlayerExpanded && activeTrack && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-[var(--bg-main)] flex flex-col transition-colors"
          >
            {activeTrack.coverUrl && <img src={activeTrack.coverUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover blur-[120px] opacity-20 scale-125 pointer-events-none" />}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            <div className="relative z-10 flex justify-between items-center p-3 md:p-6 shrink-0">
              <button onClick={() => { setPlayerExpanded(false); setLyricsOpen(false); }} className="text-[var(--text-base)] hover:scale-110 transition p-2 bg-[var(--bg-card)]/50 backdrop-blur-md border border-white/10 rounded-full">
                <IChevronDown size={24} className="md:w-8 md:h-8" />
              </button>
              <span className="text-[10px] md:text-xs text-[var(--text-subdued)] uppercase tracking-widest font-bold hidden sm:block">Сейчас играет</span>
              <div className="flex gap-2">
                <button onClick={() => setLyricsOpen(!isLyricsOpen)} className={`hover:scale-110 transition p-2 backdrop-blur-md border rounded-full ${isLyricsOpen ? 'bg-[var(--text-base)] text-[var(--bg-main)] border-[var(--text-base)]' : 'bg-[var(--bg-card)]/50 text-[var(--text-base)] border-white/10'}`}>
                  <Mic2 size={20} className="md:w-7 md:h-7" />
                </button>
                <button onClick={() => setIsSoundModalOpen(true)} className="text-[var(--text-base)] hover:scale-110 transition p-2 bg-[var(--bg-card)]/50 backdrop-blur-md border border-white/10 rounded-full">
                  <ISettings size={20} className="md:w-7 md:h-7" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (activeTrack) openTrackMenu(activeTrack, e.currentTarget.getBoundingClientRect()); }} className="text-[var(--text-base)] hover:scale-110 transition p-2 bg-[var(--bg-card)]/50 backdrop-blur-md border border-white/10 rounded-full z-[200]">
                  <IMore size={20} className="md:w-7 md:h-7" />
                </button>
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 w-full max-w-[1400px] 3xl:max-w-[2000px] mx-auto">
              
              <motion.div 
                layout transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`h-full overflow-y-auto custom-scrollbar p-4 md:p-8 ${isLyricsOpen ? 'hidden md:flex md:w-[45%]' : 'flex w-full'}`}
              >
                <div className={`min-h-full flex flex-col justify-center w-full ${isLyricsOpen ? 'md:items-start' : 'items-center'}`}>
                  
                  <motion.div layout className={`w-full aspect-square bg-[var(--bg-card)] overflow-hidden shadow-2xl border border-white/10 transition-all duration-500 ${isLyricsOpen ? 'max-w-[220px] md:max-w-[240px] 3xl:max-w-[320px] rounded-xl' : 'max-w-[220px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[400px] 3xl:max-w-[500px] rounded-2xl'}`}>
                    {activeTrack.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><IMusic size={64} className="3xl:w-24 3xl:h-24" /></div>}
                  </motion.div>

                  <motion.div layout className={`flex flex-col w-full mt-4 md:mt-8 ${isLyricsOpen ? 'md:max-w-[240px] 3xl:max-w-[320px]' : 'max-w-[220px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-[400px] 3xl:max-w-[500px]'}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[var(--text-base)] font-black text-lg sm:text-xl md:text-2xl 3xl:text-4xl truncate">{activeTrack.title}</span>
                        <span className="text-[var(--text-subdued)] text-xs sm:text-sm md:text-base 3xl:text-xl truncate">
                          {activeTrack.artist} {activeTrack.bpm ? `• ${activeTrack.bpm} BPM` : ''}
                        </span>
                      </div>
                      <PlayerLikeButton trackId={activeTrack.id} />
                    </div>

                    <div className="flex items-center gap-3 w-full mt-4 md:mt-6">
                      <span className="text-[10px] sm:text-xs 3xl:text-base text-[var(--text-subdued)] font-medium w-8 3xl:w-12 text-right">{formatTime(currentTime)}</span>
                      <div 
                        className="flex-1 py-2 cursor-pointer group touch-none" 
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      >
                        <div className="w-full h-1 3xl:h-1.5 bg-[var(--border-color)] rounded-full relative group-hover:h-1.5 3xl:group-hover:h-2 transition-all duration-200">
                          <div className="h-full bg-[var(--text-base)] rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 3xl:w-4 3xl:h-4 bg-[var(--text-base)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-xs 3xl:text-base text-[var(--text-subdued)] font-medium w-8 3xl:w-12 text-left">{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-between px-1 mt-4 md:mt-8">
                      <button onClick={toggleShuffle} className={`p-1.5 md:p-2 rounded-full transition ${isShuffle ? "text-[var(--text-base)] bg-white/10" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                        <IShuffle size={18} className="md:w-5 md:h-5 3xl:w-7 3xl:h-7" />
                      </button>
                      <button onClick={playPrevious} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition"><ISkipBack size={28} className="md:w-8 md:h-8 3xl:w-12 3xl:h-12" /></button>
                      <button onClick={() => setIsPlaying(!isPlaying)} className="bg-[var(--text-base)] text-[var(--bg-main)] w-12 h-12 md:w-16 md:h-16 3xl:w-20 3xl:h-20 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        {isPlaying ? <IPause size={24} className="md:w-7 md:h-7 3xl:w-10 3xl:h-10" /> : <IPlay size={24} className="md:w-7 md:h-7 3xl:w-10 3xl:h-10" />}
                      </button>
                      <button onClick={playNext} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition"><ISkipForward size={28} className="md:w-8 md:h-8 3xl:w-12 3xl:h-12" /></button>
                      <button onClick={toggleRepeat} className={`p-1.5 md:p-2 rounded-full transition ${isRepeat ? "text-[var(--text-base)] bg-white/10" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                        <IRepeat size={18} className="md:w-5 md:h-5 3xl:w-7 3xl:h-7" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

              <AnimatePresence>
                {isLyricsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="w-full md:w-[55%] h-full flex flex-col overflow-hidden border-l border-[var(--border-color)]/20"
                  >
                    <LyricsViewer trackId={activeTrack.id} currentTime={currentTime} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ПРЯЧЕМ ПЛЕЕР, ЕСЛИ ОТКРЫТ САЙДБАР НА МОБИЛКЕ */}
      <footer className={`relative bg-[var(--bg-card)] border-t border-[var(--border-color)] w-full shrink-0 z-50 transition-colors duration-300 ${isSidebarOpen ? 'hidden md:block' : 'block'}`}>
        <div className="md:hidden flex flex-col">
          <div onClick={() => activeTrack && setPlayerExpanded(true)} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer active:bg-[var(--bg-main)] transition">
            <div className="w-12 h-12 bg-[var(--bg-main)] rounded-md overflow-hidden shrink-0 shadow-lg border border-[var(--border-color)]">
              {activeTrack?.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><IMusic size={20} /></div>}
            </div>
            <div className="overflow-hidden flex flex-col justify-center min-w-0 flex-1">
              <div className="text-sm font-bold text-[var(--text-base)] truncate">{activeTrack.title}</div>
              <div className="text-xs text-[var(--text-subdued)] truncate mt-0.5">{activeTrack.artist}</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); setPlayerExpanded(true); setLyricsOpen(true); }} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2 shrink-0 z-50 relative">
                <Mic2 size={20} />
              </button>
              <PlayerLikeButton trackId={activeTrack.id} />
              <button type="button" onClick={(e) => { e.stopPropagation(); setIsSoundModalOpen(true); }} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2 shrink-0 z-50 relative">
                <ISettings size={20} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="flex items-center justify-center gap-6">
              <button onClick={playPrevious} className="text-[var(--text-base)] p-1.5"><ISkipBack size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} className="bg-[var(--text-base)] text-[var(--bg-main)] w-12 h-12 rounded-full flex items-center justify-center">
                {isPlaying ? <IPause size={22} /> : <IPlay size={22} />}
              </button>
              <button onClick={playNext} className="text-[var(--text-base)] p-1.5"><ISkipForward size={24} /></button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[var(--text-subdued)] tabular-nums w-8 text-right">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 py-2 cursor-pointer group touch-none" 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="w-full h-1 bg-[var(--border-color)] rounded-full relative group-hover:h-1.5 transition-all">
                  <div className="h-full bg-[var(--text-base)] rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <span className="text-xs text-[var(--text-subdued)] tabular-nums w-8 text-left">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-3 items-center h-[90px] 3xl:h-[110px] 4xl:h-[130px] px-6 3xl:px-10 4xl:px-14">
          <div onClick={() => activeTrack && setPlayerExpanded(true)} className="flex items-center gap-4 3xl:gap-6 overflow-hidden cursor-pointer hover:bg-[var(--bg-main)] p-2 rounded-md transition">
            <div className="w-14 h-14 3xl:w-20 3xl:h-20 4xl:w-24 4xl:h-24 bg-[var(--bg-main)] rounded-md overflow-hidden shrink-0 shadow-lg border border-[var(--border-color)]">
              {activeTrack?.coverUrl ? <img src={activeTrack.coverUrl} alt="cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]"><IMusic size={32} /></div>}
            </div>
            <div className="overflow-hidden flex flex-col justify-center flex-1">
              <div className="text-sm 3xl:text-lg 4xl:text-xl font-bold text-[var(--text-base)] truncate">{activeTrack.title}</div>
              <div className="text-xs 3xl:text-base 4xl:text-lg text-[var(--text-subdued)] truncate mt-0.5">{activeTrack.artist}</div>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="scale-100 3xl:scale-125">
              <PlayerLikeButton trackId={activeTrack.id} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 3xl:gap-3 w-full max-w-[500px] 3xl:max-w-[600px] mx-auto">
            <div className="flex items-center gap-6 3xl:gap-8">
              <div className="relative">
                <button onClick={toggleShuffle} className={`p-1.5 3xl:p-2 rounded-full transition ${isShuffle ? "text-[var(--text-base)] bg-[var(--bg-main)]" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                  <IShuffle size={18} className="3xl:w-6 3xl:h-6" />
                </button>
                {isShuffle && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />}
              </div>
              <button onClick={playPrevious} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition"><ISkipBack size={22} className="3xl:w-7 3xl:h-7" /></button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="bg-[var(--text-base)] text-[var(--bg-main)] hover:scale-105 w-10 h-10 3xl:w-14 3xl:h-14 rounded-full flex items-center justify-center transition-transform shadow-lg">
                {isPlaying ? <IPause size={22} className="3xl:w-7 3xl:h-7" /> : <IPlay size={22} className="3xl:w-7 3xl:h-7" />}
              </button>
              <button onClick={playNext} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition"><ISkipForward size={22} className="3xl:w-7 3xl:h-7" /></button>
              <div className="relative">
                <button onClick={toggleRepeat} className={`p-1.5 3xl:p-2 rounded-full transition ${isRepeat ? "text-[var(--text-base)] bg-[var(--bg-main)]" : "text-[var(--text-subdued)] hover:text-[var(--text-base)]"}`}>
                  <IRepeat size={18} className="3xl:w-6 3xl:h-6" />
                </button>
                {isRepeat && <span className="absolute -top-1 -right-1 bg-[var(--text-base)] text-[var(--bg-main)] text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center border border-[var(--bg-main)]">1</span>}
              </div>
            </div>
            <div className="w-full flex items-center gap-3">
              <span className="text-sm 3xl:text-base text-[var(--text-subdued)] font-medium w-9 3xl:w-12 text-right">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 py-2 cursor-pointer group touch-none" 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div className="w-full h-1 3xl:h-1.5 bg-[var(--border-color)] rounded-full relative group-hover:h-1.5 3xl:group-hover:h-2 transition-all duration-200">
                  <div className="h-full bg-[var(--text-base)] rounded-full absolute left-0 top-0 pointer-events-none" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 3xl:w-4 3xl:h-4 bg-[var(--text-base)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
              </div>
              <span className="text-sm 3xl:text-base text-[var(--text-subdued)] font-medium w-9 3xl:w-12 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="w-full flex justify-end items-center gap-4 3xl:gap-6">
            <button onClick={() => { setPlayerExpanded(true); setLyricsOpen(true); }} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2"><Mic2 size={20} className="3xl:w-6 3xl:h-6" /></button>
            
            <button onClick={() => setQueueOpen(true)} className={`transition p-2 ${isQueueOpen ? 'text-[var(--text-base)]' : 'text-[var(--text-subdued)] hover:text-[var(--text-base)]'}`}>
              <ListMusic size={20} className="3xl:w-6 3xl:h-6" />
            </button>

            <button onClick={() => setIsSoundModalOpen(true)} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2"><ISettings size={20} className="3xl:w-6 3xl:h-6" /></button>
            <div className="relative group flex items-center justify-center p-2">
              <button onClick={toggleMute} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition">
                {isMuted || volume === 0 ? <IMute size={20} className="3xl:w-6 3xl:h-6" /> : <IVolume size={20} className="3xl:w-6 3xl:h-6" />}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[var(--bg-card)] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl border border-[var(--border-color)] flex flex-col items-center"><VolumeSlider /></div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); if (activeTrack) openTrackMenu(activeTrack, e.currentTarget.getBoundingClientRect()); }} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-2"><IMore size={20} className="3xl:w-6 3xl:h-6" /></button>
          </div>
        </div>
      </footer>

      <SoundSettingsModal isOpen={isSoundModalOpen} onClose={() => setIsSoundModalOpen(false)} />
      <QueueModal />
    </>
  );
}