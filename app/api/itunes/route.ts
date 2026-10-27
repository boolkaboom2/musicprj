import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Пустой запрос' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    
    if (!res.ok) throw new Error('Ошибка iTunes');

    const data = await res.json();

    if (data.results.length === 0) {
      return NextResponse.json({ error: 'Ничего не найдено' }, { status: 404 });
    }

    const track = data.results[0];

    // Указываем, что переменная может быть числом или null
    let releaseYear: number | null = null; 
    
    if (track.releaseDate) {
      releaseYear = parseInt(track.releaseDate.split('-')[0]);
    }

    return NextResponse.json({
      title: track.trackName,
      artist: track.artistName,
      coverUrl: track.artworkUrl100.replace('100x100', '600x600'),
      genre: track.primaryGenreName,
      duration: Math.round(track.trackTimeMillis / 1000),
      releaseYear: releaseYear,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}