import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  const results: any[] = [];
  const words = query.toLowerCase().split(' ').filter((w: string) => w.length > 2);

  // 1. iTunes
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term="${encodeURIComponent(query)}"&entity=song&limit=15&country=RU`);
    const itunesData = await itunesRes.json();
    
    if (itunesData.results) {
      itunesData.results.forEach((t: any) => {
        const tTitle = t.trackName.toLowerCase();
        const tArtist = t.artistName.toLowerCase();
        
        // Если хотя бы одно слово из запроса есть в названии или артисте — берем
        const isMatch = words.some((w: string) => tTitle.includes(w) || tArtist.includes(w));

        if (isMatch) {
          results.push({
            source: 'itunes',
            title: t.trackName,
            artist: t.artistName,
            coverUrl: t.artworkUrl100?.replace('100x100', '300x300'),
            duration: Math.round(t.trackTimeMillis / 1000),
          });
        }
      });
    }
  } catch (e) {
    console.error('[External Search iTunes]', e);
  }

  // 2. Deezer (если iTunes дал мало)
  if (results.length < 5) {
    try {
      const deezerRes = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`);
      const deezerData = await deezerRes.json();
      if (deezerData.data) {
        deezerData.data.forEach((t: any) => {
          results.push({
            source: 'deezer',
            title: t.title,
            artist: t.artist.name,
            coverUrl: t.album.cover_medium,
            duration: t.duration,
          });
        });
      }
    } catch (e) {
      console.error('[External Search Deezer]', e);
    }
  }

  return NextResponse.json({ results: results.slice(0, 15) });
}