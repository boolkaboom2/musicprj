export function TrackListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-4 md:p-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 md:gap-4 p-2 animate-pulse">
          <div className="hidden sm:block w-6 h-4 bg-white/5 rounded" />
          <div className="w-14 h-14 md:w-12 md:h-12 bg-white/5 rounded" />
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="h-4 w-3/4 max-w-[280px] bg-white/5 rounded" />
            <div className="h-3 w-1/2 max-w-[180px] bg-white/5 rounded" />
          </div>
          <div className="h-4 w-10 bg-white/5 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function PlaylistGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-4 md:p-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3 animate-pulse">
          <div className="w-full aspect-square bg-white/5 rounded-lg" />
          <div className="h-4 w-3/4 bg-white/5 rounded" />
          <div className="h-3 w-1/2 bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="p-4 md:p-8 flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 md:gap-4 p-2 animate-pulse">
          <div className="w-14 h-14 bg-white/5 rounded shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            <div className="h-4 w-2/3 max-w-[240px] bg-white/5 rounded" />
            <div className="h-3 w-1/3 max-w-[140px] bg-white/5 rounded" />
          </div>
          <div className="h-4 w-10 bg-white/5 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}