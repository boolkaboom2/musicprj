"use client";

export default function AvatarEffect({ 
  children, 
  effect = "none" 
}: { 
  children: React.ReactNode; 
  effect?: string 
}) {
  if (effect === "none") {
    return <>{children}</>;
  }

  return (
    // Жестко фиксируем w-full h-full, чтобы эффект не растягивал контейнер
    <div className="relative w-full h-full rounded-full group">
      
      {/* GRADIENT EFFECT */}
      {effect === "gradient" && (
        <div className="absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_3s_linear_infinite] opacity-60" />
      )}

      {/* NEON EFFECT */}
      {effect === "neon" && (
        <div className="absolute inset-0 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse pointer-events-none" />
      )}

      {/* PULSE EFFECT */}
      {effect === "pulse" && (
        <div className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping pointer-events-none" />
      )}

      {/* ОСНОВНОЙ КОНТЕНТ (Аватарка) */}
      <div className="relative w-full h-full rounded-full z-10">
        {children}
      </div>
    </div>
  );
}