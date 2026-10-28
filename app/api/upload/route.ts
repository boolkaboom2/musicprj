import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/isAdmin';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  try {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // ОГРАНИЧЕНИЕ РАЗМЕРА
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой (макс 20 МБ)" }, { status: 413 });
    }

    const isAudio = file.type.startsWith("audio/");
    const method = isAudio ? "sendAudio" : "sendPhoto";
    const field = isAudio ? "audio" : "photo";

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId!);
    
    if (isAudio) {
      tgFormData.append(field, file);
    } else {
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
      tgFormData.append(field, blob, file.name || 'image.jpg');
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      body: tgFormData,
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      return NextResponse.json({ error: "Ошибка загрузки в Telegram" }, { status: 500 });
    }

    let fileId = "";
    if (isAudio && tgData.result.audio) {
      fileId = tgData.result.audio.file_id;
    } else if (!isAudio && tgData.result.photo) {
      fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
    }

    return NextResponse.json({ url: fileId });
  } catch (error) {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
