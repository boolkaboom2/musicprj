import { NextResponse } from 'next/server';
import { downloadAndSaveTrack } from '@/lib/downloader';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Введите название трека' }, { status: 400 });
    }

    console.log(`[Search Music] Query: ${query}`);
    const result = await downloadAndSaveTrack(query);

    if (result.skipped) {
      return NextResponse.json({ error: 'Трек уже есть в базе', track: result.track }, { status: 409 });
    }

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, track: result.track });

  } catch (error: any) {
    console.error('[Search Music Fatal]', error.message);
    
    if (error.message.includes('неподходящий трек')) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    
    return NextResponse.json({ error: error.message || 'Ошибка сервера' }, { status: 404 });
  }
}