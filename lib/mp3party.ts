export type Mp3PartyTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
};

export async function searchMp3Party(query: string): Promise<Mp3PartyTrack | null> {
  try {
    const url = `https://mp3party.net/search?q=${encodeURIComponent(query)}`;
    console.log(`[Mp3Party] Поиск: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;

    const html = await res.text();
    
    // Mp3Party часто отдает ссылки через редирект или в атрибутах data-
    const mp3Match = html.match(/(https?:\/\/[^"'\s]+\.mp3)/) 
                  || html.match(/data-url="([^"]+\.mp3)"/)
                  || html.match(/href="(https:\/\/[^"]+download[^"]+)"/); // Ищем страницу скачивания
    
    if (!mp3Match) {
      console.log('[Mp3Party] Ссылка не найдена');
      return null;
    }
    
    let mp3Url = mp3Match[1];
    if (!mp3Url.startsWith('http')) mp3Url = 'https://' + mp3Url;

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let pageTitle = titleMatch ? titleMatch[1] : query;
    pageTitle = pageTitle.replace(' - скачать mp3', '').replace(' - слушать онлайн', '').trim();
    
    let artist = 'Unknown Artist';
    let title = pageTitle;
    if (pageTitle.includes(' - ')) {
      const parts = pageTitle.split(' - ');
      artist = parts[0].trim();
      title = parts[1].trim();
    }

    console.log(`[Mp3Party] Найден: ${artist} - ${title}`);
    return { title, artist, url: mp3Url, coverUrl: null };
  } catch (e: any) {
    console.error('[Mp3Party Error]', e.message);
    return null;
  }
}