export type ZaycevTrack = {
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

export async function searchZaycev(query: string): Promise<ZaycevTrack | null> {
  try {
    const url = `https://zaycev.net/search?query=${encodeURIComponent(query)}`;
    console.log(`[Zaycev] Поиск: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.log(`[Zaycev] Ошибка поиска: ${res.status}`);
      return null;
    }

    const html = await res.text();

    // Ищем ссылку на скачивание (обычно она в формате data-url или в теге <a>)
    // Zaycev часто использует JSON-LD или data-атрибуты
    const match = html.match(/"name":"([^"]+)","url":"([^"]+\.mp3)"/) 
      || html.match(/data-url="([^"]+\.mp3)"/)
      || html.match(/href="(https:\/\/cdn\d+\.zaycev\.net\/[^"]+\.mp3)"/);

    // Если нашли прямой MP3
    if (match) {
      const mp3Url = match[2] || match[1];
      const cleanUrl = mp3Url.replace(/\\/g, ''); // Очищаем экранирование

      // Достаем название и артиста из title страницы
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const pageTitle = titleMatch ? titleMatch[1].replace(' - скачать бесплатно', '').split(' - ') : [query, 'Unknown'];
      
      let artist = pageTitle[0]?.trim() || 'Unknown';
      let title = pageTitle[1]?.trim() || query;

      console.log(`[Zaycev] Найден: ${artist} - ${title}`);

      return {
        title,
        artist,
        url: cleanUrl,
        coverUrl: null, 
      };
    }

    console.log('[Zaycev] Трек не найден в HTML');
    return null;
  } catch (e: any) {
    console.error('[Zaycev Error]', e.message);
    return null;
  }
}