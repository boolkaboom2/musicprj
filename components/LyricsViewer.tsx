"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

type LyricsViewerProps = {
  trackId: string;
  currentTime: number;
};

type LrcLine = {
  time: number;
  text: string;
};

export default function LyricsViewer({ trackId, currentTime }: LyricsViewerProps) {
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [syncedLines, setSyncedLines] = useState<LrcLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    setPlainLyrics(null);
    setSyncedLines([]);
    setActiveIndex(-1);
    setError(null);
  }, [trackId]);

  useEffect(() => {
    if (!trackId) return;
    
    let isMounted = true;
    setIsLoading(true);
    
    fetch("/api/lyrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Текст не найден");
        
        if (isMounted) {
          if (data.syncedLyrics) {
            const parsed = parseLrc(data.syncedLyrics);
            setSyncedLines(parsed);
          } else if (data.plainLyrics) {
            setPlainLyrics(data.plainLyrics);
          } else {
            setError("Текст не найден");
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [trackId]);

  const parseLrc = (lrc: string): LrcLine[] => {
    const lines = lrc.split('\n');
    const result: LrcLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;

    lines.forEach((line) => {
      const match = line.match(timeRegex);
      if (match) {
        const min = parseInt(match[1]);
        const sec = parseFloat(match[2]);
        const text = match[3].trim();
        if (text) {
          result.push({ time: min * 60 + sec, text });
        }
      }
    });
    return result;
  };

  useEffect(() => {
    if (syncedLines.length === 0) return;

    const index = syncedLines.findIndex((line, i) => {
      const nextLine = syncedLines[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
      
      if (lineRefs.current[index] && scrollRef.current) {
        lineRefs.current[index]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentTime, syncedLines, activeIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subdued)]">
        <Loader2 className="animate-spin" size={40} />
        <p>Ищем текст в базе...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-subdued)]">
        <p>{error}</p>
        <p className="text-sm opacity-50">Попробуйте другой трек</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full w-full overflow-y-auto custom-scrollbar px-4 py-16 md:py-32 pb-[30vh] md:pb-[40vh]">
      <div className="max-w-xl mx-auto flex flex-col gap-4 md:gap-6 text-center md:text-left">
        
        {syncedLines.length > 0 && (
          syncedLines.map((line, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            
            return (
              <p
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className={`text-xl md:text-3xl lg:text-4xl font-black transition-all duration-500 leading-tight cursor-pointer ${
                  isActive 
                    ? "text-[var(--text-base)] scale-105 origin-center md:origin-left drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                    : isPast
                      ? "text-[var(--text-subdued)] opacity-20 hover:opacity-100"
                      : "text-[var(--text-subdued)] opacity-40 hover:opacity-100"
                }`}
              >
                {line.text}
              </p>
            );
          })
        )}

        {plainLyrics && syncedLines.length === 0 && (
          <div className="text-lg md:text-xl font-medium text-[var(--text-base)] whitespace-pre-wrap leading-relaxed opacity-80 text-center">
            {plainLyrics}
          </div>
        )}

      </div>
    </div>
  );
}