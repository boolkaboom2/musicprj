import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Вставьте ссылку на плейлист' }, { status: 400 });
    }

    // Ищем UUID плейлиста в ссылке
    const playlistMatch = url.match(/playlists\/([a-zA-Z0-9-]+)/);
    
    if (!playlistMatch) {
      return NextResponse.json({ 
        error: 'Не удалось распознать ссылку. Убедитесь, что это ссылка на плейлист Яндекс.Музыки' 
      }, { status: 400 });
    }

    const playlistId = playlistMatch[1];
    console.log(`[Yandex] Плейлист UUID: ${playlistId}`);

    const apiUrl = `https://api.music.yandex.net/playlist/${playlistId}`;
    
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      console.error(`[Yandex API] Ошибка: ${res.status} ${res.statusText}`);
      
      if (res.status === 404) {
        return NextResponse.json({ error: 'Плейлист не найден или ссылка неверная' }, { status: 404 });
      }
      if (res.status === 403) {
        return NextResponse.json({ error: 'Яндекс блокирует запросы с этого сервера' }, { status: 403 });
      }
      
      return NextResponse.json({ error: `Ошибка Яндекса: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    
    // Парсим структуру ответа
    const rawTracks = data.result?.tracks || [];
    const playlistTitle = data.result?.title || 'Импортированный плейлист';
    
    if (rawTracks.length === 0) {
      return NextResponse.json({ error: 'Плейлист пуст или треки не найдены' }, { status: 404 });
    }

    console.log(`[Yandex] Найдено треков: ${rawTracks.length}`);

    // Преобразуем в наш формат (с учетом вложенности)
    const formattedTracks = rawTracks.map((item: any, index: number) => {
      // В Яндекс.Музыке трек лежит внутри item.track
      const track = item.track || item;
      
      const trackTitle = track.title || 'Unknown Title';
      const trackArtist = track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
      
      return {
        id: track.id?.toString() || index.toString(),
        title: trackTitle,
        artist: trackArtist,
        album: track.albums?.[0]?.title || '',
        confidence: 'high' 
      };
    });

    return NextResponse.json({ 
      success: true, 
      playlistTitle,
      tracks: formattedTracks 
    });

  } catch (error: any) {
    console.error('[Parse Playlist Error]', error);
    return NextResponse.json({ error: 'Ошибка парсинга плейлиста' }, { status: 500 });
  }
}