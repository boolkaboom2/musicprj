"use client";

import { useState, useRef } from "react";
import { useSoundStore } from "@/store/soundStore";
import { X, Check, RotateCcw, Disc3 } from "lucide-react";
import InfoTooltip from "./InfoTooltip";

export default function SoundSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { 
    quality, setQuality, isEqualizerOn, toggleEqualizer,
    isCrossfadeEnabled, toggleCrossfade,
    eqBass, eqMid, eqTreble, setEqBass, setEqMid, setEqTreble 
  } = useSoundStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl p-6 shadow-2xl border border-[var(--border-color)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-base)] tracking-tight">Настройки звука</h2>
          <button onClick={onClose} className="text-[var(--text-subdued)] hover:text-[var(--text-base)] bg-[var(--bg-main)] p-2 rounded-full transition"><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <button onClick={() => setQuality('excellent')} className="flex justify-between items-center p-3 hover:bg-[var(--bg-main)] rounded-xl transition text-left">
            <div>
              <div className="flex items-center">
                <p className="text-[var(--text-base)] font-bold text-sm">Превосходное</p>
                <InfoTooltip text="Максимальное качество звука. Полный спектр частот без обрезки." />
              </div>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Полный спектр частот</p>
            </div>
            {quality === 'excellent' && <Check size={20} className="text-[var(--text-base)] shrink-0" />}
          </button>
          
          <button onClick={() => setQuality('optimal')} className="flex justify-between items-center p-3 hover:bg-[var(--bg-main)] rounded-xl transition text-left">
            <div>
              <div className="flex items-center">
                <p className="text-[var(--text-base)] font-bold text-sm">Оптимальное</p>
                <InfoTooltip text="Сбалансированный звук. Оптимальное соотношение качества и трафика." />
              </div>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Сбалансированный звук</p>
            </div>
            {quality === 'optimal' && <Check size={20} className="text-[var(--text-base)] shrink-0" />}
          </button>
          
          <button onClick={() => setQuality('economical')} className="flex justify-between items-center p-3 hover:bg-[var(--bg-main)] rounded-xl transition text-left">
            <div>
              <div className="flex items-center">
                <p className="text-[var(--text-base)] font-bold text-sm">Экономичное</p>
                <InfoTooltip text="Экономия трафика. Звук обрезается по высоким частотам." />
              </div>
              <p className="text-[var(--text-subdued)] text-xs mt-1">Имитация низкого битрейта</p>
            </div>
            {quality === 'economical' && <Check size={20} className="text-[var(--text-base)] shrink-0" />}
          </button>
        </div>

        <div className="h-px bg-[var(--border-color)] my-4" />

        {/* DJ MODE ТУМБЛЕР */}
        <div className="flex justify-between items-center mb-6 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <Disc3 size={20} className="text-[var(--text-base)]" />
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-[var(--text-base)] font-bold text-sm">DJ Mode (Кроссфейд)</span>
                <InfoTooltip text="Плавный переход между треками с подстройкой BPM (темпа). Работает, когда включена очередь." />
              </div>
              <span className="text-[var(--text-subdued)] text-xs mt-0.5">Плавный микс треков</span>
            </div>
          </div>
          <button 
            onClick={toggleCrossfade}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${isCrossfadeEnabled ? 'bg-green-500' : 'bg-[var(--border-color)]'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${isCrossfadeEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="h-px bg-[var(--border-color)] my-4" />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-base)] font-bold text-sm">Эквалайзер</span>
            <InfoTooltip text="Усиление или ослабление частот. BASS — низкие, MID — средние, TREBLE — высокие." />
            {isEqualizerOn && (
              <button 
                onClick={() => { setEqBass(0); setEqMid(0); setEqTreble(0); }}
                className="text-[var(--text-subdued)] hover:text-[var(--text-base)] transition p-1 bg-[var(--bg-main)] rounded-md"
                title="Сбросить настройки"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={toggleEqualizer}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isEqualizerOn ? 'bg-green-500' : 'bg-[var(--border-color)]'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${isEqualizerOn ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

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
        className="relative w-2 h-full bg-[var(--border-color)] rounded-full cursor-pointer flex flex-col justify-center"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--text-subdued)] opacity-50" />
        <div 
          className="w-full bg-[var(--text-base)] rounded-full absolute"
          style={{
            bottom: value >= 0 ? '50%' : `${percent}%`,
            height: `${Math.abs(value) / 20 * 100}%`
          }}
        />
        <div 
          className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--text-base)] rounded-full shadow-lg transition-transform ${isDragging ? "scale-125" : "hover:scale-110"}`}
          style={{ bottom: `calc(${percent}% - 8px)` }} 
        />
      </div>
      <span className="text-[11px] text-[var(--text-subdued)] font-bold tracking-wider">{label}</span>
    </div>
  );
}