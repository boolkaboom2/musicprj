export type ZaycevTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function searchZaycev(query: string): Promise<ZaycevTrack | null> {
  try {
    const url = `https://zaycev.net/search?query=${encodeURIComponent(query)}`;
    console.log(`[Zaycev] Поиск: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;

    const html = await res.text();
    
    let mp3Url: string | null = null; // <--- ИСПРАВЛЕНИЕ ТУТ
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

    if (nextDataMatch) {
      const str = nextDataMatch[1];
      const match = str.match(/(https?:\/\/[^"'\s]+\.mp3)/) || str.match(/\\\/\/([^"'\s]+\.mp3)/);
      if (match) {
        mp3Url = match[1].startsWith('http') ? match[1] : 'https://' + match[1];
      }
    }

    if (!mp3Url) {
      const match = html.match(/(https?:\/\/[^"'\s]+\.mp3)/);
      if (match) {
        mp3Url = match[1];
      }
    }

    if (!mp3Url) {
      console.log('[Zaycev] Ссылка не найдена');
      return null;
    }

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let pageTitle = titleMatch ? titleMatch[1] : query;
    pageTitle = pageTitle.replace(' - скачать бесплатно', '').trim();
    
    let artist = 'Unknown Artist';
    let title = pageTitle;
    if (pageTitle.includes(' - ')) {
      const parts = pageTitle.split(' - ');
      artist = parts[0].trim();
      title = parts[1].trim();
    }

    console.log(`[Zaycev] Найден: ${artist} - ${title}`);
    return { 
      title, 
      artist, 
      url: mp3Url, 
      coverUrl: null 
    };
  } catch (e: any) {
    console.error('[Zaycev Error]', e.message);
    return null;
  }
}