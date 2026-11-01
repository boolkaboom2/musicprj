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
  try {
    const url = `https://rue.hitmoz.org/search?q=${encodeURIComponent(query)}`;
    console.log(`[Hitmoz] Поиск: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.log(`[Hitmoz] Ошибка поиска: ${res.status}`);
      return null;
    }

    const html = await res.text();

    const metaRegex = /data-musmeta='(\{.*?\})'/;
    const match = html.match(metaRegex);

    if (!match || !match[1]) {
      console.log('[Hitmoz] Трек не найден в HTML');
      return null;
    }

    const cleanJson = match[1].replace(/\\/g, '');
    const meta = JSON.parse(cleanJson);

    if (!meta.url || !meta.artist || !meta.title) {
      return null;
    }

    // ФИКС: Если ссылка относительная (начинается с /), добавляем домен
    let finalUrl = meta.url;
    if (finalUrl.startsWith('/')) {
      finalUrl = `https://rue.hitmoz.org${finalUrl}`;
    }

    console.log(`[Hitmoz] Найден: ${meta.artist} - ${meta.title} (URL: ${finalUrl})`);

    return {
      title: meta.title,
      artist: meta.artist,
      url: finalUrl,
      coverUrl: meta.img || null,
    };
  } catch (e: any) {
    console.error('[Hitmoz Error]', e.message);
    return null;
  }
}