const APP_NAME = 'SADOVOD';

// Список известных публичных нод Audius (если одна упадет, возьмем следующую)
const DISCOVERY_NODES = [
  'https://discoveryprovider.audius.co',
  'https://discoveryprovider2.audius.co',
  'https://discoveryprovider3.audius.co',
  'https://audius-discovery-1.altego.net',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

export type AudiusTrack = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  artwork: string | null;
  duration: number;
};

async function fetchFromNodes(path: string): Promise<any> {
  let lastError: any = null;

  for (const host of DISCOVERY_NODES) {
    try {
      const url = `${host}${path}${path.includes('?') ? '&' : '?'}app_name=${APP_NAME}`;
      console.log(`[Audius] Trying: ${url}`);
      
      const res = await fetch(url, { headers: HEADERS });
      
      if (!res.ok) {
        console.log(`[Audius] Node ${host} failed with status ${res.status}`);
        continue; // Пробуем следующую ноду
      }

      return await res.json();
    } catch (e: any) {
      console.log(`[Audius] Node ${host} error: ${e.message}`);
      lastError = e;
    }
  }

  throw new Error(lastError?.message || 'Все ноды Audius недоступны');
}

export async function searchAudius(query: string): Promise<AudiusTrack[]> {
  const json = await fetchFromNodes(`/v1/tracks/search?query=${encodeURIComponent(query)}`);
  
  if (!json.data || !Array.isArray(json.data)) return [];

  return json.data
    .filter((t: any) => t.is_streamable !== false)
    .map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.user?.name || 'Unknown',
      genre: t.genre || null,
      artwork: t.artwork ? (t.artwork['480x480'] || t.artwork['1000x1000'] || null) : null,
      duration: t.duration || 0,
    }));
}

export async function downloadAudiusTrack(id: string): Promise<{ buffer: ArrayBuffer; contentType: string; sizeMB: number }> {
  let lastError: any = null;

  for (const host of DISCOVERY_NODES) {
    try {
      const url = `${host}/v1/tracks/${id}/stream?app_name=${APP_NAME}`;
      console.log(`[Audius Stream] Trying: ${url}`);

      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 10000) continue; // Слишком маленький файл (ошибка)

      const contentType = res.headers.get('content-type') || 'audio/mpeg';
      return { buffer, contentType, sizeMB: buffer.byteLength / 1024 / 1024 };
    } catch (e: any) {
      lastError = e;
    }
  }

  throw new Error(lastError?.message || 'Не удалось скачать трек с нод Audius');
}