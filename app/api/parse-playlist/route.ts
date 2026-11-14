import { NextResponse } from 'next/server';
import { proxyFetch } from '@/lib/proxyFetch';

type ParsedTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  confidence: 'high' | 'low';
};

type ParseResult = {
  playlistTitle: string;
  tracks: ParsedTrack[];
};

async function fetchYandex(url: string): Promise<any> {
  try {
    // Пробуем через WARP (обход блокировки IP)
    console.log(`[Yandex] Запрос через WARP: ${url}`);
    const res = await proxyFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (res.ok) return await res.json();
  } catch (e: any) {
    console.log(`[Yandex] WARP не сработал: ${e.message}`);
  }

  // Если WARP упал, пробуем напрямую
  try {
    console.log(`[Yandex] Запрос напрямую: ${url}`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (res.ok) return await res.json();
    throw new Error(`Статус ${res.status}`);
  } catch (e: any) {
    throw new Error(`Яндекс недоступен даже через WARP. Ошибка: ${e.message}`);
  }
}

async function parseYandexPlaylist(id: string): Promise<ParseResult> {
  const data = await fetchYandex(`https://api.music.yandex.net/playlist/${id}`);
  const rawTracks = data.result?.tracks || [];
  const playlistTitle = data.result?.title || 'Плейлист';

  const tracks = rawTracks.map((item: any, index: number) => {
    const track = item.track || item;
    return {
      id: track.id?.toString() || index.toString(),
      title: track.title || 'Unknown Title',
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: track.albums?.[0]?.title || '',
      confidence: 'high' as const,
    };
  });

  return { playlistTitle, tracks };
}

async function parseYandexAlbum(id: string): Promise<ParseResult> {
  const data = await fetchYandex(`https://api.music.yandex.net/albums/${id}/with-tracks`);
  const volumes = data.result?.volumes || [];
  const rawTracks = volumes.flat();
  const albumTitle = data.result?.title || 'Альбом';
  const albumArtist = data.result?.artists?.map((a: any) => a.name).join(', ') || '';
  const fullTitle = albumArtist ? `${albumArtist} — ${albumTitle}` : albumTitle;

  const tracks = rawTracks.map((track: any, index: number) => ({
    id: track.id?.toString() || index.toString(),
    title: track.title || 'Unknown Title',
    artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: albumTitle,
    confidence: 'high' as const,
  }));

  return { playlistTitle: fullTitle, tracks };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Вставьте ссылку' }, { status: 400 });
    }

    const iframeMatch = url.match(/src="https:\/\/music\.yandex\.ru\/iframe\/playlist\/([a-zA-Z0-9.\-]+)"/);
    if (iframeMatch) {
      const result = await parseYandexPlaylist(iframeMatch[1]);
      return NextResponse.json({ success: true, ...result });
    }

    const yandexPlaylistMatch = url.match(/music\.yandex\.ru\/playlists\/([a-zA-Z0-9.\-]+)/)
      || url.match(/music\.yandex\.ru\/users\/[^/]+\/playlists\/(\d+)/);
    if (yandexPlaylistMatch) {
      const result = await parseYandexPlaylist(yandexPlaylistMatch[1]);
      return NextResponse.json({ success: true, ...result });
    }

    const yandexAlbumMatch = url.match(/music\.yandex\.ru\/album\/(\d+)/);
    if (yandexAlbumMatch) {
      const result = await parseYandexAlbum(yandexAlbumMatch[1]);
      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'Платформа не распознана. Работает: Яндекс.Музыка.' }, { status: 400 });

  } catch (error: any) {
    console.error('[Parse Error]', error);
    return NextResponse.json({ error: error.message || 'Ошибка парсинга' }, { status: 500 });
  }
}