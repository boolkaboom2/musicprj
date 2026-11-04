"use client";

import CarouselSlider from "./CarouselSlider";

type Track = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  audioUrl: string;
  duration: number;
};

export default function RecentlyPlayed({ tracks }: { tracks: Track[] }) {
  if (!tracks || tracks.length === 0) return null;

  return (
    <div className="py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <h2 className="px-4 md:px-8 text-xl md:text-2xl font-bold text-[var(--text-base)] mb-4 flex items-center gap-2">
        Недавно прослушанное
      </h2>
      
      {/* Наша новая 3D-карусель */}
      <CarouselSlider tracks={tracks} />
    </div>
  );
}