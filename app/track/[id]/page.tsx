import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Music, Heart } from "lucide-react";
import PlayButton from "@/components/PlayButton";
import TrackMenuTrigger from "@/components/TrackMenuTrigger";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-col h-full w-full bg-[#121212]">
      <Suspense fallback={<div className="p-8 text-[var(--text-subdued)]">Загрузка...</div>}>
        <TrackData paramsPromise={params} />
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
      <div className="flex items-end gap-6 p-8 bg-gradient-to-b from-[#2a2a2a] to-[#121212] pb-12">
        <div className="w-48 h-48 md:w-56 md:h-56 bg-[#282828] rounded-lg shadow-2xl shrink-0 overflow-hidden flex items-center justify-center">
           {track.coverUrl ? (
              <img src={track.coverUrl.startsWith('http') ? track.coverUrl : `/api/stream/${track.coverUrl}`} alt={track.title} className="w-full h-full object-cover" />
           ) : (
              <Music size={64} className="text-white/20" />
           )}
        </div>
        
        <div className="flex flex-col gap-4">
          <span className="text-sm font-bold uppercase tracking-widest text-[var(--text-subdued)]">Сингл</span>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            {track.title}
          </h1>
          <p className="text-white/60 text-sm">
            {track.artist} • 2026
          </p>

          <div className="flex items-center gap-3 mt-4">
             <PlayButton track={track} />
             
             <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-full transition flex items-center gap-2">
                <Heart size={16} /> Нравится
             </button>

             <TrackMenuTrigger track={track} />
          </div>
        </div>
      </div>

      <div className="px-8 mt-4">
         <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-md transition group cursor-pointer">
            <div className="flex items-center gap-4">
              <span className="text-[#777] w-4 text-center">1</span>
              <div className="flex flex-col">
                <span className="text-white font-bold">{track.title}</span>
                <span className="text-sm text-[#777]">{track.artist}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <Heart size={18} className="text-[#777] hover:text-white" />
               <span className="text-[#777] text-sm">3:45</span>
            </div>
         </div>
      </div>
    </div>
  );
}