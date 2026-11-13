export type YoutubeTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
};

const CLOUDFLARE_WORKER_URL = 'https://sadovodproxy.vladgoncharov27x27x27.workers.dev'; 

export async function searchYoutube(query: string): Promise<YoutubeTrack | null> {
  try {
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const proxyUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(ytSearchUrl)}`;
    
    console.log(`[YouTube Proxy] Поиск: ${query}`);
    
    const searchRes = await fetch(proxyUrl);
    if (!searchRes.ok) return null;

    const searchHtml = await searchRes.text();
    
    const idMatch = searchHtml.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (!idMatch) {
      console.log('[YouTube Proxy] Видео не найдено в HTML');
      return null;
    }
    const videoId = idMatch[1];

    // Используем другой публичный API (y2mate/youtube-mp36)
    // Шлем запрос через наш CF Worker, чтобы обойти блокировку
    const convertApiUrl = `https://api.vevioz.com/api/button/mp3/${videoId}`;
    const apiRes = await fetch(`${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(convertApiUrl)}`);
    const apiHtml = await apiRes.text();

    const mp3Match = apiHtml.match(/href="(https:\/\/[^"]+\.mp3)"/);
    if (!mp3Match) {
      console.log('[YouTube Proxy] Не удалось сконвертировать в MP3');
      return null;
    }

    const mp3Url = mp3Match[1];

    const titleMatch = searchHtml.match(/"title":{"runs":\[{"text":"([^"]+)"}\]/);
    let title = titleMatch ? titleMatch[1] : query;
    title = title.replace(/\(Official.*?\)|\[.*?\]/gi, '').trim();

    console.log(`[YouTube Proxy] Найден: ${title}`);
    return { 
      title, 
      artist: 'YouTube', 
      url: mp3Url, 
      coverUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
    };
  } catch (e: any) {
    console.error('[YouTube Proxy Error]', e.message);
    return null;
  }
}