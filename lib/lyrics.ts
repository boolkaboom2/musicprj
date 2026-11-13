export type LyricsResult = {
  plainLyrics: string | null;
  syncedLyrics: string | null;
};

export async function fetchLyrics(artist: string, title: string): Promise<LyricsResult> {
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const query = `${artist} ${cleanTitle}`;

  // 1. Пытаемся найти в LRCLIB (там есть караоке)
  try {
    const lrcRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'SADOVOD/1.0 (https://github.com/boolkaboom2/musicprj)' }
    });
    
    if (lrcRes.ok) {
      const lrcData = await lrcRes.json();
      if (Array.isArray(lrcData) && lrcData.length > 0) {
        // Берем первый результат, где есть syncedLyrics
        const track = lrcData.find((t: any) => t.syncedLyrics) || lrcData[0];
        
        if (track.plainLyrics || track.syncedLyrics) {
          return {
            plainLyrics: track.plainLyrics || null,
            syncedLyrics: track.syncedLyrics || null,
          };
        }
      }
    }
  } catch (e) {
    console.error('[LRCLIB Error]', e);
  }

  // 2. Если в LRCLIB ничего нет, идем в Genius (только обычный текст)
  const geniusKey = process.env.GENIUS_API_KEY;
  if (geniusKey) {
    try {
      // Ищем ID песни
      const searchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${geniusKey}` }
      });
      const searchData = await searchRes.json();
      
      const hit = searchData.response?.hits?.[0]?.result;
      if (hit) {
        // В Genius API текст песни нельзя получить напрямую, только ссылку. 
        // Поэтому мы делаем запрос на страницу и парсим HTML.
        // Но пока для простоты вернем null, если караоке нет.
        // В будущем сюда можно прикрутить парсинг.
        return { plainLyrics: null, syncedLyrics: null };
      }
    } catch (e) {
      console.error('[Genius Error]', e);
    }
  }

  return { plainLyrics: null, syncedLyrics: null };
}