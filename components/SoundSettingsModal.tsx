"use client";

import { useState, useRef } from "react";
import { useSoundStore } from "@/store/soundStore";
import { X, Check, RotateCcw } from "lucide-react";

export default function SoundSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    quality, setQuality, isEqualizerOn, toggleEqualizer,
    eqBass, eqMid, eqTreble, setEqBass, setEqMid, setEqTreble 
  } = useSoundStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#1c1c1c] rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Настройки звука</h2>
          <button onClick={onClose} className="text-[var(--text-subdued)] hover:text-white bg-white/5 p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <button onClick={() => setQuality('excellent')} className="flex justify-between items-start p-3 hover:bg-white/5 rounded-xl transition text-left">
            <div>
              <p className="text-white font-bold text-sm">Превосходное</p>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Полный спектр частот</p>
            </div>
            {quality === 'excellent' && <Check size={20} className="text-white shrink-0" />}
          </button>
          <button onClick={() => setQuality('optimal')} className="flex justify-between items-start p-3 hover:bg-white/5 rounded-xl transition text-left">
            <div>
              <p className="text-white font-bold text-sm">Оптимальное</p>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Сбалансированный звук</p>
            </div>
            {quality === 'optimal' && <Check size={20} className="text-white shrink-0" />}
          </button>
          <button onClick={() => setQuality('economical')} className="flex justify-between items-start p-3 hover:bg-white/5 rounded-xl transition text-left">
            <div>
              <p className="text-white font-bold text-sm">Экономичное</p>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Имитация низкого битрейта</p>
            </div>
            {quality === 'economical' && <Check size={20} className="text-white shrink-0" />}
          </button>
        </div>

        <div className="h-px bg-white/10 my-4" />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm">Эквалайзер</span>
            {isEqualizerOn && (
              <button 
                onClick={() => { setEqBass(0); setEqMid(0); setEqTreble(0); }}
                className="text-[var(--text-subdued)] hover:text-white transition p-1 bg-white/5 rounded-md"
                title="Сбросить настройки"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={toggleEqualizer}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isEqualizerOn ? 'bg-green-500' : 'bg-white/20'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${isEqualizerOn ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Большой и плавный эквалайзер */}
        <div className={`flex justify-center gap-12 h-40 transition-opacity duration-300 ${isEqualizerOn ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <CustomEqSlider label="BASS" value={eqBass} onChange={setEqBass} />
          <CustomEqSlider label="MID" value={eqMid} onChange={setEqMid} />
          <CustomEqSlider label="TREBLE" value={eqTreble} onChange={setEqTreble} />
        </div>

      </div>
    </div>
  );
}

function CustomEqSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const percent = ((value + 10) / 20) * 100;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateValue(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateValue = (clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = clientY - rect.top;
    let p = 1 - (clickY / rect.height);
    p = Math.max(0, Math.min(1, p));
    onChange(Math.round(p * 20 - 10));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative w-2 h-full bg-white/10 rounded-full cursor-pointer flex flex-col justify-center"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/30" />
        <div 
          className="w-full bg-white rounded-full absolute"
          style={{
            bottom: value >= 0 ? '50%' : `${percent}%`,
            height: `${Math.abs(value) / 20 * 100}%`
          }}
        />
        <div 
          className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-transform ${isDragging ? "scale-125" : "hover:scale-110"}`}
          style={{ bottom: `calc(${percent}% - 8px)` }} 
        />
      </div>
      <span className="text-[11px] text-[var(--text-subdued)] font-bold tracking-wider">{label}</span>
    </div>
  );
}