export type SaavnTrack = {
  title: string;
  artist: string;
  url: string;
  coverUrl: string | null;
  duration: number;
};

export async function searchSaavn(query: string): Promise<SaavnTrack | null> {
  try {
    const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=1`);
    if (!res.ok) {
      console.log(`[Saavn] Ошибка поиска: ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (!json.success || !json.data.results || json.data.results.length === 0) {
      console.log('[Saavn] Ничего не найдено');
      return null;
    }

    const track = json.data.results[0];
    
    // Ищем ссылку в 320 kbps (или берем последнюю доступную)
    const downloadUrls = track.downloadUrl || [];
    const highestQuality = downloadUrls.find((u: any) => u.quality === '320kbps') || downloadUrls[downloadUrls.length - 1];
    
    if (!highestQuality || !highestQuality.url) {
      console.log('[Saavn] Нет ссылки на скачивание');
      return null;
    }

    const cover = track.image && track.image.length > 0 ? track.image[track.image.length - 1].url : null;
    const artists = track.artists?.primary?.map((a: any) => a.name).join(', ') || 'Unknown';

    console.log(`[Saavn] Найден: ${artists} - ${track.name}`);

    return {
      title: track.name,
      artist: artists,
      url: highestQuality.url,
      coverUrl: cover,
      duration: track.duration || 0,
    };
  } catch (e: any) {
    console.error('[Saavn Error]', e.message);
    return null;
  }
}