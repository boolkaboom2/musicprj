export type HitmozTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function searchHitmoz(query: string): Promise<HitmozTrack | null> {
  // Новый домен, который ты нашел
  const originalUrl = `https://eu.hitmoz.com/search?q=${encodeURIComponent(query)}`;
  
  // Список прокси для обхода блокировок
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      console.log(`[Hitmoz] Пробуем через прокси: ${proxyUrl.split('?')[0]}`);
      
      const res = await fetch(proxyUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        console.log(`[Hitmoz] Прокси вернул ошибку: ${res.status}`);
        continue; // Пробуем следующий прокси
      }

      const html = await res.text();
      const metaRegex = /data-musmeta='([^']+)'/;
      const match = html.match(metaRegex);

      if (!match || !match[1]) {
        console.log('[Hitmoz] Трек не найден в HTML');
        continue;
      }

      let rawJson = match[1]
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

      let meta: any;
      try {
        meta = JSON.parse(rawJson);
      } catch (e) {
        console.error('[Hitmoz] Ошибка парсинга JSON');
        continue;
      }

      if (!meta.url || !meta.artist || !meta.title) continue;

      let finalUrl = meta.url;
      if (finalUrl.startsWith('/')) {
        finalUrl = `https://eu.hitmoz.com${finalUrl}`;
      }

      console.log(`[Hitmoz] УСПЕХ! Найден: ${meta.artist} - ${meta.title}`);
      return {
        title: meta.title,
        artist: meta.artist,
        url: finalUrl,
        coverUrl: meta.img || null,
      };

    } catch (e: any) {
      console.log(`[Hitmoz] Ошибка прокси: ${e.message}`);
      // Идем к следующему прокси в цикле
    }
  }

  console.log('[Hitmoz] Все прокси провалились');
  return null;
}