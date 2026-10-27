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

    // 2. Возвращаем 302 редирект на прямую ссылку Telegram
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    
    return NextResponse.redirect(fileUrl);
  } catch (error) {
    console.error('Ошибка стриминга:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}