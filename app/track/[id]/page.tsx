import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Music, Heart } from "lucide-react";
import PlayButton from "@/components/PlayButton";
import TrackMenuTrigger from "@/components/TrackMenuTrigger";

export default function TrackPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col h-full w-full bg-[#121212]">
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка...</div>}>
        <TrackData paramsPromise={Promise.resolve(params)} />
      </Suspense>
    </div>
  );
}

async function TrackData({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const track = await prisma.track.findUnique({ where: { id } });
  if (!track) notFound();

  return (
    <div className="flex flex-col w-full">
      {/* Хедер: на мобилке столбиком, на десктопе в строку */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 p-4 md:p-8 bg-gradient-to-b from-[#2a2a2a] to-[#121212] pb-8 md:pb-12">
        
        {/* Обложка */}
        <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-[#282828] rounded-lg shadow-2xl shrink-0 overflow-hidden flex items-center justify-center self-start md:self-end">
          {track.coverUrl ? (
            <img 
              src={track.coverUrl.startsWith('http') ? track.coverUrl : `/api/stream/${track.coverUrl}`} 
              alt={track.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <Music size={48} className="text-white/20" />
          )}
        </div>
        
        <div className="flex flex-col gap-3 md:gap-4 min-w-0 flex-1">
          <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-[var(--text-subdued)]">Сингл</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter break-words">
            {track.title}
          </h1>
          <p className="text-white/60 text-sm break-words">
            {track.artist} {track.releaseYear ? `• ${track.releaseYear}` : ''}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2 md:mt-4">
            <PlayButton track={track} />
            
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-full transition flex items-center gap-2">
              <Heart size={16} /> Нравится
            </button>

            <TrackMenuTrigger track={track} />
          </div>
        </div>
      </div>

      {/* Список (в данном случае 1 трек) */}
      <div className="px-4 md:px-8 mt-4">
        <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md transition group cursor-pointer">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            <span className="text-[#777] w-4 text-center text-sm shrink-0">1</span>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-sm md:text-base truncate">{track.title}</span>
              <span className="text-[#777] text-xs md:text-sm truncate">{track.artist}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Heart size={18} className="text-[#777] hover:text-white" />
            <span className="text-[#777] text-xs md:text-sm">
              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}