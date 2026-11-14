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
  const domains = [
    'https://rus.hitmos.fm',
    'https://cdn.hitmotop.com'
  ];

  for (const domain of domains) {
    const originalUrl = `${domain}/search?q=${encodeURIComponent(query)}`;
    
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
        
        if (!res.ok) continue; 

        const html = await res.text();
        
        const mp3Regex = /https?:\/\/[^"'\s]+\.mp3/gi;
        const downloadRegex = /href="([^"]+download[^"]+)"/gi;
        // Ищем обложку в мета-тегах
        const coverRegex = /<meta property="og:image" content="([^"]+)" \/>/i;
        
        const mp3Matches = html.match(mp3Regex);
        const downloadMatches = [...html.matchAll(downloadRegex)];
        const coverMatch = html.match(coverRegex);

        let finalUrl: string | null = null;
        const coverUrl: string | null = coverMatch ? coverMatch[1] : null;

        if (mp3Matches && mp3Matches.length > 0) {
             const validMp3 = mp3Matches.find(url => !url.includes('preview') && !url.includes('cover'));
             if (validMp3) finalUrl = validMp3;
        }
        
        if (!finalUrl && downloadMatches.length > 0) {
             finalUrl = downloadMatches[0][1];
             if (finalUrl && finalUrl.startsWith('/')) {
                 finalUrl = domain + finalUrl;
             }
        }

        if (finalUrl) {
          console.log(`[Hitmoz] УСПЕХ! Найдена ссылка: ${finalUrl}`);
          return {
            title: query.split('-')[1]?.trim() || query,
            artist: query.split('-')[0]?.trim() || 'Unknown',
            url: finalUrl,
            coverUrl: coverUrl, // <-- ВОЗВРАЩАЕМ ОБЛОЖКУ
          };
        }

      } catch (e: any) {
        console.log(`[Hitmoz] Ошибка запроса: ${e.message}`);
      }
    }
  }

  console.log('[Hitmoz] Все попытки провалились');
  return null;
}