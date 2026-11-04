import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  
  if (!query || query.length < 2) return NextResponse.json({ results: [] });

  const results: any[] = [];

  // 1. iTunes (основная база)
  try {
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15&country=RU`);
    const itunesData = await itunesRes.json();
    if (itunesData.results) {
      itunesData.results.forEach((t: any) => {
        results.push({
          source: 'itunes',
          title: t.trackName,
          artist: t.artistName,
          coverUrl: t.artworkUrl100?.replace('100x100', '300x300'),
          duration: Math.round(t.trackTimeMillis / 1000),
        });
      });
    }
  } catch (e) {
    console.error('[External Search iTunes]', e);
  }

  // 2. Deezer (добиваем, если iTunes дал мало)
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

  // Дедупликация (убираем дубли из iTunes и Deezer)
  const seen = new Set();
  const unique = results.filter(r => {
    const key = `${r.title.toLowerCase()}${r.artist.toLowerCase()}`.replace(/[^a-z0-9а-я]/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ results: unique.slice(0, 20) });
}