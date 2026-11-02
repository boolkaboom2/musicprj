"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

export default function VinylScene({ onSpin }: { onSpin: () => void }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotate = useMotionValue(0);

  const bloomOpacity = useTransform(rotate, () => (isSpinning ? 1 : 0));

  const dragStateRef = useRef({
    isDragging: false,
    lastAngle: 0,
    lastTime: 0,
    velocity: 0,
    totalRotation: 0,
  });

  const getAngleFromCenter = (clientX: number, clientY: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSpinning) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    dragStateRef.current = {
      isDragging: true,
      lastAngle: angle,
      lastTime: Date.now(),
      velocity: 0,
      totalRotation: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = dragStateRef.current;
    if (!s.isDragging || isSpinning) return;
    const angle = getAngleFromCenter(e.clientX, e.clientY);
    let delta = angle - s.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const now = Date.now();
    const dt = now - s.lastTime;
    if (dt > 0) s.velocity = (delta / dt) * 16;
    s.totalRotation += delta;
    s.lastAngle = angle;
    s.lastTime = now;
    rotate.set(rotate.get() + delta);
  };

  const handlePointerUp = () => {
    const s = dragStateRef.current;
    if (!s.isDragging) return;
    s.isDragging = false;
    const current = rotate.get();

    if (Math.abs(s.totalRotation) > 180 && !isSpinning) {
      setIsSpinning(true);
      const dir = Math.sign(s.totalRotation);
      animate(rotate, current + dir * 1440, {
        duration: 2.4,
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => setTimeout(onSpin, 400),
      });
    } else {
      animate(rotate, current + s.velocity * 30, {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden select-none">
      
      {/* ЗЕРНО фона */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.4]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.15 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* ДЕКОР: кольца на фоне */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="absolute rounded-full border border-white/[0.03]" style={{ width: '95vmin', height: '95vmin' }} />
        <div className="absolute rounded-full border border-white/[0.04]" style={{ width: '80vmin', height: '80vmin' }} />
        <div className="absolute rounded-full border border-white/[0.06]" style={{ width: '110vmin', height: '110vmin' }} />
        <div className="absolute rounded-full border border-white/[0.02]" style={{ width: '130vmin', height: '130vmin' }} />
      </div>

      {/* ДЕКОР: точки-звёзды */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: '12%', left: '18%', size: 2 },
          { top: '25%', left: '82%', size: 1.5 },
          { top: '78%', left: '10%', size: 1.5 },
          { top: '68%', left: '88%', size: 2 },
          { top: '45%', left: '5%', size: 1 },
          { top: '38%', left: '94%', size: 1 },
          { top: '88%', left: '48%', size: 1.5 },
          { top: '8%', left: '55%', size: 1 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bg-white rounded-full"
            style={{
              top: dot.top,
              left: dot.left,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              boxShadow: `0 0 ${dot.size * 3}px rgba(255,255,255,0.8)`,
            }}
          />
        ))}
      </div>

      {/* Виньетка */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Цветовой акцент на фоне */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(50,70,110,0.12) 0%, transparent 60%)',
        }}
      />

      {/* BLOOM при вращении */}
      <motion.div
        style={{ opacity: bloomOpacity }}
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div
          className="rounded-full"
          style={{
            width: '75vmin',
            height: '75vmin',
            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(150,180,255,0.08) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </motion.div>

      {/* Постоянный ореол */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: '65vmin',
            height: '65vmin',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)',
            filter: 'blur(25px)',
          }}
        />
      </div>

      {/* ГЛУБОКАЯ ТЕНЬ под пластинкой */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: '75vmin',
            height: '20vmin',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.9) 0%, transparent 70%)',
            transform: 'translateY(30vmin)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* ЦЕНТРАЛЬНЫЙ БЛОК: тонарм + пластинка */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: 'min(440px, 85vmin)', aspectRatio: '1' }}>
          
          {/* ТОНАРМ — поверх пластинки */}
          <svg 
            viewBox="0 0 400 400" 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ 
              filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.7))',
              zIndex: 10,
            }}
          >
            <defs>
              <linearGradient id="tonearmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#888" />
                <stop offset="50%" stopColor="#333" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              <linearGradient id="headShell" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#555" />
                <stop offset="100%" stopColor="#1a1a1a" />
              </linearGradient>
            </defs>
            
            <circle cx="360" cy="80" r="22" fill="url(#tonearmGradient)" stroke="#000" strokeWidth="1" />
            <circle cx="360" cy="80" r="14" fill="#2a2a2a" stroke="#000" strokeWidth="0.8" />
            <circle cx="360" cy="80" r="5" fill="#555" />

            <line x1="360" y1="80" x2="290" y2="230" stroke="url(#tonearmGradient)" strokeWidth="5" strokeLinecap="round" />
            <line x1="360" y1="80" x2="290" y2="230" stroke="#000" strokeWidth="0.5" strokeLinecap="round" opacity="0.6" />

            <circle cx="368" cy="70" r="8" fill="#1a1a1a" stroke="#000" strokeWidth="1" />

            <rect 
              x="278" y="228" 
              width="22" height="14" 
              rx="1" 
              fill="url(#headShell)" 
              stroke="#000" 
              strokeWidth="0.8"
              transform="rotate(25 289 235)"
            />
            
            <line x1="285" y1="242" x2="280" y2="252" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="280" cy="252" r="1.5" fill="#fff" />
          </svg>

          {/* ОБЕРТКА ДЛЯ ТЕНИ — СТАТИЧНАЯ */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              // Тень и объём привязаны к неподвижной обёртке
              filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.95)) drop-shadow(0 0 20px rgba(255,255,255,0.02))',
              zIndex: 1,
            }}
          >
            {/* ПЛАСТИНКА — ВРАЩАЮЩАЯСЯ */}
            <motion.div
              ref={containerRef}
              style={{ rotate }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-full h-full touch-none rounded-full overflow-hidden ${
                isSpinning ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full"
              >
                <defs>
                  <radialGradient id="vinylGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#161616" />
                    <stop offset="55%" stopColor="#080808" />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                  <radialGradient id="labelGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#4a1515" />
                    <stop offset="80%" stopColor="#2a0808" />
                    <stop offset="100%" stopColor="#180404" />
                  </radialGradient>
                  <radialGradient id="labelInnerShadow" cx="50%" cy="50%">
                    <stop offset="70%" stopColor="transparent" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                  </radialGradient>
                </defs>

                {/* Чистый чёрный диск без цветных ободков */}
                <circle cx="200" cy="200" r="195" fill="url(#vinylGradient)" />

                {/* Бороздки */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const r = 188 - i * 1.4;
                  if (r < 105) return null;
                  return (
                    <circle
                      key={i}
                      cx="200" cy="200" r={r}
                      fill="none"
                      stroke={i % 5 === 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}
                      strokeWidth="0.5"
                    />
                  );
                })}
                {Array.from({ length: 60 }).map((_, i) => {
                  const r = 187 - i * 1.4;
                  if (r < 105) return null;
                  return (
                    <circle
                      key={`f-${i}`}
                      cx="200" cy="200" r={r}
                      fill="none"
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth="0.3"
                    />
                  );
                })}

                {/* Пылинки */}
                {[
                  { x: 145, y: 120, r: 0.8 },
                  { x: 260, y: 180, r: 1 },
                  { x: 130, y: 250, r: 0.6 },
                  { x: 270, y: 280, r: 0.9 },
                  { x: 90, y: 200, r: 0.7 },
                  { x: 300, y: 150, r: 0.8 },
                  { x: 180, y: 300, r: 1.1 },
                  { x: 220, y: 100, r: 0.7 },
                  { x: 320, y: 220, r: 0.9 },
                  { x: 80, y: 160, r: 0.6 },
                ].map((p, i) => (
                  <circle key={`dust-${i}`} cx={p.x} cy={p.y} r={p.r} fill="rgba(255,255,255,0.25)" />
                ))}

                {/* Тёмная прокладка */}
                <circle cx="200" cy="200" r="105" fill="#0a0a0a" />
                <circle cx="200" cy="200" r="105" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

                {/* Метка */}
                <circle cx="200" cy="200" r="78" fill="url(#labelGradient)" />
                <circle cx="200" cy="200" r="78" fill="url(#labelInnerShadow)" />
                <circle cx="200" cy="200" r="78" fill="none" stroke="rgba(120,60,60,0.4)" strokeWidth="1" />

                <text x="200" y="172" textAnchor="middle" fill="rgba(230,215,180,0.85)" fontSize="13" fontWeight="900" letterSpacing="5">SADOVOD</text>
                <line x1="155" y1="184" x2="245" y2="184" stroke="rgba(230,215,180,0.2)" strokeWidth="0.8" />
                <text x="200" y="204" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="10" letterSpacing="4">SIDE A</text>
                <text x="200" y="222" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" letterSpacing="3">33⅓ RPM</text>
                <line x1="155" y1="234" x2="245" y2="234" stroke="rgba(230,215,180,0.15)" strokeWidth="0.8" />

                {/* Отверстие */}
                <circle cx="200" cy="200" r="7" fill="#000" />
                <circle cx="200" cy="200" r="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
                <circle cx="200" cy="200" r="3" fill="#0a0a0a" />
              </svg>
            </motion.div>
          </div>

          {/* СТАТИЧНЫЕ БЛИКИ — поверх вращающейся пластинки, не крутятся */}
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <defs>
              <linearGradient id="staticShine1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="30%" stopColor="rgba(255,255,255,0)" />
                <stop offset="42%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="48%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="52%" stopColor="rgba(255,255,255,0.14)" />
                <stop offset="58%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="70%" stopColor="rgba(255,255,255,0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id="staticShine2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(200,220,255,0)" />
                <stop offset="40%" stopColor="rgba(200,220,255,0)" />
                <stop offset="48%" stopColor="rgba(200,220,255,0.06)" />
                <stop offset="52%" stopColor="rgba(200,220,255,0.06)" />
                <stop offset="60%" stopColor="rgba(200,220,255,0)" />
                <stop offset="100%" stopColor="rgba(200,220,255,0)" />
              </linearGradient>
              <radialGradient id="staticSpot" cx="30%" cy="25%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            <circle cx="200" cy="200" r="195" fill="url(#staticShine1)" />
            <circle cx="200" cy="200" r="195" fill="url(#staticShine2)" />
            <circle cx="200" cy="200" r="195" fill="url(#staticSpot)" />
            
            {/* Внутренняя тень по краю (статичная) */}
            <circle 
              cx="200" cy="200" r="192" 
              fill="none" 
              stroke="rgba(0,0,0,0.6)" 
              strokeWidth="6"
            />
          </svg>

          {/* Шпиндель */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ 
              width: '14px', 
              height: '14px',
              background: 'radial-gradient(circle, #666 0%, #1a1a1a 60%, #000 100%)',
              borderRadius: '50%',
              boxShadow: '0 2px 6px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.3)',
              zIndex: 4,
            }}
          />
        </div>
      </div>

      {/* Подсказка */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 text-center pointer-events-none"
        animate={{ opacity: isSpinning ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold">
          Крутани пластинку, чтобы войти
        </span>
      </motion.div>
    </div>
  );
}