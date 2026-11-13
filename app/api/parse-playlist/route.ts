import { NextResponse } from 'next/server';
import { fetchSpotifyPlaylist } from '@/lib/spotify';

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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621', // ПРИТВОРЯЕМСЯ ПРИЛОЖЕНИЕМ
    }
  });
  if (!res.ok) throw new Error(`Яндекс: ${res.status}`);
  return res.json();
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

    // === ЯНДЕКС IFRAME (HTML-код) ===
    const iframeMatch = url.match(/src="https:\/\/music\.yandex\.ru\/iframe\/playlist\/([a-zA-Z0-9.\-]+)"/);
    if (iframeMatch) {
      const id = iframeMatch[1];
      console.log(`[Parse] Yandex iframe playlist ${id}`);
      const result = await parseYandexPlaylist(id);
      return NextResponse.json({ success: true, ...result });
    }

    // === ЯНДЕКС ПЛЕЙЛИСТ ===
    const yandexPlaylistMatch = url.match(/music\.yandex\.ru\/playlists\/([a-zA-Z0-9.\-]+)/)
      || url.match(/music\.yandex\.ru\/users\/[^/]+\/playlists\/(\d+)/);
    if (yandexPlaylistMatch) {
      const id = yandexPlaylistMatch[1];
      console.log(`[Parse] Yandex playlist ${id}`);
      const result = await parseYandexPlaylist(id);
      return NextResponse.json({ success: true, ...result });
    }

    // === ЯНДЕКС АЛЬБОМ ===
    const yandexAlbumMatch = url.match(/music\.yandex\.ru\/album\/(\d+)/);
    if (yandexAlbumMatch) {
      const id = yandexAlbumMatch[1];
      console.log(`[Parse] Yandex album ${id}`);
      const result = await parseYandexAlbum(id);
      return NextResponse.json({ success: true, ...result });
    }

    // === SPOTIFY ===
    const spotifyMatch = url.match(/open\.spotify\.com\/(?:[^/]+\/)?playlist\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      const id = spotifyMatch[1];
      console.log(`[Parse] Spotify playlist ${id}`);
      try {
        const result = await fetchSpotifyPlaylist(id);
        return NextResponse.json({ success: true, ...result });
      } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Ошибка Spotify' }, { status: 502 });
      }
    }

    // === YOUTUBE MUSIC ===
    if (/music\.youtube\.com\/playlist\?list=/.test(url)) {
      return NextResponse.json({ error: 'YouTube Music: сервер в РФ, YouTube блокирует. Нужен прокси.' }, { status: 400 });
    }

    // === VK ===
    if (/vk\.com\/(music|audio|playlist)/.test(url)) {
      return NextResponse.json({ error: 'VK Музыка: API закрыт для новых приложений.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Платформа не распознана. Работают: Яндекс.Музыка (ссылка или iframe), Spotify.' }, { status: 400 });

  } catch (error: any) {
    console.error('[Parse Error]', error);
    // Обработка ошибки 403 от Яндекса
    if (error.message.includes('403')) {
      return NextResponse.json({ error: 'Яндекс временно блокирует запросы. Попробуйте позже или используйте ссылку на плейлист (не альбом).' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Ошибка парсинга' }, { status: 500 });
  }
}