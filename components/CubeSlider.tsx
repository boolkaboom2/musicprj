"use client";

import Link from "next/link";

export default function CubeSlider({ playlists }: { playlists: any[] }) {
  const displayPlaylists = [...playlists];
  while (displayPlaylists.length < 6 && displayPlaylists.length > 0) {
    displayPlaylists.push(playlists[displayPlaylists.length % playlists.length]);
  }

  if (displayPlaylists.length === 0) return null;

  const faces = [
    { transform: "translateZ(100px)" },
    { transform: "rotateX(-90deg) translateZ(100px)" },
    { transform: "rotateY(90deg) translateZ(100px)" },
    { transform: "rotateX(180deg) rotate(90deg) translateZ(100px)" },
    { transform: "rotateX(90deg) translateZ(100px)" },
    { transform: "rotateY(-90deg) translateZ(100px)" },
  ];

  return (
    <div className="w-full h-[450px] flex items-center justify-center" style={{ perspective: "1200px" }}>
      <div 
        className="relative w-[200px] h-[200px]" 
        style={{ 
          transformStyle: "preserve-3d",
          animation: "cube-spin 15s infinite cubic-bezier(0.5, -0.5, 0.5, 1.5)"
        }}
      >
        {displayPlaylists.slice(0, 6).map((pl, index) => {
          const cover = pl.coverUrl
            ? (pl.coverUrl.startsWith('http') || pl.coverUrl.startsWith('/') ? pl.coverUrl : `/api/stream/${pl.coverUrl}`)
            : null;
          
          return (
            <Link 
              key={`${pl.id}-${index}`}
              href={`/playlist/${pl.id}`}
              className="absolute inset-0 w-full h-full group transition-transform duration-300 hover:scale-105"
              style={{ 
                transform: faces[index].transform,
                backfaceVisibility: "hidden" 
              }}
            >
              <div className="w-full h-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl relative">
                {cover ? (
                  <img src={cover} alt={pl.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-subdued)]">Нет обложки</div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                  <h3 className="text-white font-bold text-sm truncate">{pl.title}</h3>
                  <p className="text-white/60 text-xs">{pl._count.items} треков</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes cube-spin {
          0%, 3%   { transform: rotate3d(0, 0, 0, 0deg); }
          14%, 19% { transform: rotate3d(-1, 1, 0, 180deg); }
          31%, 36% { transform: rotate3d(0, -1, 0, 90deg); }
          47%, 52% { transform: rotate3d(1, 0, 0, 90deg); }
          64%, 69% { transform: rotate3d(1, 0, 0, -90deg); }
          81%, 86% { transform: rotate3d(0, 1, 0, 90deg); }
          97%, 100%{ transform: rotate3d(0, 0, 0, 0deg); }
        }
      `}</style>
    </div>
  );
}