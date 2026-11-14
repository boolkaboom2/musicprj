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
  // Новые домены
  const domains = [
    'https://rus.hitmos.fm',
    'https://cdn.hitmotop.com'
  ];

  for (const domain of domains) {
    const originalUrl = `${domain}/search?q=${encodeURIComponent(query)}`;
    
    // Обход-маскировка (прокси)
    const urls = [
      originalUrl,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(originalUrl)}`
    ];

    for (const targetUrl of urls) {
      try {
        console.log(`[Hitmoz] Пробуем: ${targetUrl.split('?')[0]} (${domain})`);
        
        const res = await fetch(targetUrl, { 
          headers: HEADERS, 
          signal: AbortSignal.timeout(15000) 
        });
        
        if (!res.ok) {
          console.log(`[Hitmoz] Ошибка: ${res.status}`);
          continue; 
        }

        const html = await res.text();
        if (html.includes('<!DOCTYPE html>') && !html.includes('data-musmeta')) {
             console.log('[Hitmoz] Получен HTML без метаданных');
             continue;
        }

        const metaRegex = /data-musmeta='([^']+)'/;
        const match = html.match(metaRegex);

        if (!match || !match[1]) continue;

        let rawJson = match[1]
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');

        let meta: any;
        try {
          meta = JSON.parse(rawJson);
        } catch (e) {
          continue;
        }

        if (!meta.url || !meta.artist || !meta.title) continue;

        let finalUrl = meta.url;
        if (finalUrl.startsWith('/')) {
          finalUrl = `${domain}${finalUrl}`;
        }

        console.log(`[Hitmoz] УСПЕХ! Найден: ${meta.artist} - ${meta.title}`);
        return {
          title: meta.title,
          artist: meta.artist,
          url: finalUrl,
          coverUrl: meta.img || null,
        };

      } catch (e: any) {
        console.log(`[Hitmoz] Ошибка запроса: ${e.message}`);
      }
    }
  }

  console.log('[Hitmoz] Все попытки провалились');
  return null;
}