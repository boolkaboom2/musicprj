export type HitmozTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

// ТВОЙ URL CLOUDFLARE WORKER
const CLOUDFLARE_WORKER_URL = 'https://sadovod-proxy.vladgoncharov27x27x27.workers.dev'; 

export async function searchHitmoz(query: string): Promise<HitmozTrack | null> {
  try {
    // Формируем оригинальную ссылку для поиска
    const originalUrl = `https://rue.hitmoz.org/search?q=${encodeURIComponent(query)}`;
    
    // Передаем её в Worker
    const proxyUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(originalUrl)}`;
    console.log(`[Hitmoz Proxy] Поиск: ${proxyUrl}`);

    const res = await fetch(proxyUrl, { headers: HEADERS });
    if (!res.ok) {
      console.log(`[Hitmoz Proxy] Ошибка поиска: ${res.status}`);
      return null;
    }

    const html = await res.text();

    const metaRegex = /data-musmeta='([^']+)'/;
    const match = html.match(metaRegex);

    if (!match || !match[1]) {
      console.log('[Hitmoz Proxy] Трек не найден в HTML');
      return null;
    }

    let rawJson = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    let meta: any;
    try {
      meta = JSON.parse(rawJson);
    } catch (e) {
      console.error('[Hitmoz Proxy] Не удалось распарсить JSON:', rawJson.slice(0, 200));
      return null;
    }

    if (!meta.url || !meta.artist || !meta.title) {
      return null;
    }

    let finalUrl = meta.url;
    if (finalUrl.startsWith('/')) {
      finalUrl = `https://rue.hitmoz.org${finalUrl}`;
    }

    console.log(`[Hitmoz Proxy] Найден: ${meta.artist} - ${meta.title}`);

    return {
      title: meta.title,
      artist: meta.artist,
      url: finalUrl,
      coverUrl: meta.img || null,
    };
  } catch (e: any) {
    console.error('[Hitmoz Proxy Error]', e.message);
    return null;
  }
}