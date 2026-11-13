import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'boolkaboom2';
const GITHUB_REPO = 'musicprj';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Введите название трека' }, { status: 400 });
    }

    if (!GITHUB_TOKEN) {
      return NextResponse.json({ error: 'GitHub Token не настроен' }, { status: 500 });
    }

    console.log(`[GitHub Action] Запуск скачивания для: ${query}`);

    // Отправляем команду в GitHub
    const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/download.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: { query: query }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[GitHub Action Error]', errorText);
      return NextResponse.json({ error: 'Не удалось запустить скачивание на GitHub' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Трек добавлен в очередь. Он появится на сайте через 30-60 секунд.' 
    });

  } catch (error: any) {
    console.error('[GitHub Action Fatal]', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}