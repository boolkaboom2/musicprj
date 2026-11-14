export type HitmozTrack = {
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

export async function searchHitmoz(query: string): Promise<HitmozTrack | null> {
  // Пробуем новые домены
  const domains = [
    'https://rus.hitmos.fm',
    'https://cdn.hitmotop.com'
  ];

  for (const domain of domains) {
    try {
      const url = `${domain}/search?q=${encodeURIComponent(query)}`;
      console.log(`[Hitmoz] Пробуем домен: ${domain}`);
      
      const res = await fetch(url, { 
        headers: HEADERS, 
        signal: AbortSignal.timeout(15000) 
      });
      
      if (!res.ok) {
        console.log(`[Hitmoz] Ошибка: ${res.status}`);
        continue; 
      }

      const html = await res.text();
      const metaRegex = /data-musmeta='([^']+)'/;
      const match = html.match(metaRegex);

      if (!match || !match[1]) {
        console.log(`[Hitmoz] Трек не найден в HTML на ${domain}`);
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
      if (finalUrl.startsWith('/')) finalUrl = `${domain}${finalUrl}`;

      console.log(`[Hitmoz] УСПЕХ! Найден: ${meta.artist} - ${meta.title}`);
      return {
        title: meta.title,
        artist: meta.artist,
        url: finalUrl,
        coverUrl: meta.img || null,
      };

    } catch (e: any) {
      console.log(`[Hitmoz] Ошибка запроса на ${domain}: ${e.message}`);
    }
  }

  console.log('[Hitmoz] Все домены провалились');
  return null;
}