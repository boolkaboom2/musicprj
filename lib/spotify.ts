let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify не настроен. Добавь SPOTIFY_CLIENT_ID и SPOTIFY_CLIENT_SECRET в .env');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

export type SpotifyTrack = {
  id: string;
  title: string;
  artist: string;
  album: string;
  confidence: 'high' | 'low';
};

export async function fetchSpotifyPlaylist(id: string): Promise<{ playlistTitle: string; tracks: SpotifyTrack[] }> {
  const token = await getAccessToken();

  const metaRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!metaRes.ok) {
    if (metaRes.status === 404) throw new Error('Spotify: плейлист не найден или приватный');
    throw new Error(`Spotify: ${metaRes.status}`);
  }

  const playlist = await metaRes.json();
  const tracks: any[] = [];

  for (const item of playlist.tracks?.items || []) {
    if (item.track) tracks.push(item.track);
  }

  let nextUrl: string | null = playlist.tracks?.next;
  while (nextUrl) {
    const pageRes: Response = await fetch(nextUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!pageRes.ok) break;
    const page: any = await pageRes.json();
    for (const item of page.items || []) {
      if (item.track) tracks.push(item.track);
    }
    nextUrl = page.next;
  }

  return {
    playlistTitle: playlist.name || 'Spotify плейлист',
    tracks: tracks.map((t, idx) => ({
      id: t.id || idx.toString(),
      title: t.name || 'Unknown Title',
      artist: t.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      album: t.album?.name || '',
      confidence: 'high' as const,
    })),
  };
}
