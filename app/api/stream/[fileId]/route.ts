import { NextResponse } from 'next/server';

// Функция для скачивания с повторными попытками
async function fetchWithRetry(url: string, retries = 3, timeout = 15000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (res.ok) return res;
    } catch (e: any) {
      console.log(`[Stream] Попытка ${i + 1} не удалась: ${e.message}`);
      if (i === retries - 1) throw e;
      // Ждем 1 секунду перед следующей попыткой
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Все попытки скачивания провалились');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;
  
  if (!fileId) {
    return NextResponse.json({ error: 'File ID не найден' }, { status: 400 });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // 1. Получаем путь к файлу
    const getFileRes = await fetchWithRetry(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      return NextResponse.json({ error: 'Файл не найден в Telegram' }, { status: 404 });
    }

    const filePath = getFileData.result.file_path;

    // 2. Скачиваем файл с повторами (если соединение оборвется)
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const fileRes = await fetchWithRetry(fileUrl, 3, 20000);

    // 3. Передаем поток байтов клиенту
    return new NextResponse(fileRes.body, {
      headers: {
        'Content-Type': fileRes.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': fileRes.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error: any) {
    console.error('[Stream Fatal]', error.message);
    return NextResponse.json({ error: 'Ошибка соединения с Telegram' }, { status: 500 });
  }
}