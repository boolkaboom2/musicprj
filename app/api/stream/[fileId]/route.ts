import { NextResponse } from 'next/server';

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
    const getFileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      return NextResponse.json({ error: 'Файл не найден в Telegram' }, { status: 404 });
    }

    const filePath = getFileData.result.file_path;

    // 2. Вместо редиректа, скачиваем файл на сервер и отдаем клиенту (Proxy)
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const fileRes = await fetch(fileUrl);

    if (!fileRes.ok) {
      return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
    }

    // 3. Передаем поток байтов клиенту
    return new NextResponse(fileRes.body, {
      headers: {
        'Content-Type': fileRes.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': fileRes.headers.get('Content-Length') || '',
        'Accept-Ranges': 'bytes', // Для перемотки
      },
    });
  } catch (error) {
    console.error('Ошибка стриминга:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}