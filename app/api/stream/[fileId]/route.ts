import { NextResponse } from 'next/server';

async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, timeout = 15000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      
      if (res.ok || res.status === 206) return res;
    } catch (e: any) {
      console.log(`[Stream] Попытка ${i + 1} не удалась: ${e.message}`);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1500 * (i + 1))); // Пауза перед повтором
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
    const rangeHeader = request.headers.get('range');

    const getFileRes = await fetchWithRetry(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      return NextResponse.json({ error: 'Файл не найден в Telegram' }, { status: 404 });
    }

    const filePath = getFileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    const fetchOptions: RequestInit = {};
    if (rangeHeader) {
      fetchOptions.headers = { 'Range': rangeHeader };
    }

    const fileRes = await fetchWithRetry(fileUrl, fetchOptions, 3, 20000);

    const headers = new Headers();
    headers.set('Content-Type', fileRes.headers.get('Content-Type') || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');
    
    const contentLength = fileRes.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);
    
    const contentRange = fileRes.headers.get('Content-Range');
    if (contentRange) headers.set('Content-Range', contentRange);

    return new NextResponse(fileRes.body, {
      status: fileRes.status,
      headers,
    });
  } catch (error: any) {
    console.error('[Stream Fatal]', error.message);
    return NextResponse.json({ error: 'Ошибка соединения с Telegram' }, { status: 500 });
  }
}