import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Определяем тип (аудио или картинка)
    const isAudio = file.type.startsWith("audio/");
    const method = isAudio ? "sendAudio" : "sendPhoto";
    const field = isAudio ? "audio" : "photo";

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    const tgFormData = new FormData();
    tgFormData.append("chat_id", chatId!);
    tgFormData.append(field, file);

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      body: tgFormData,
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      console.error("Ошибка Telegram:", tgData);
      return NextResponse.json({ error: "Ошибка загрузки в Telegram" }, { status: 500 });
    }

    // Достаем file_id из ответа Telegram
    let fileId = "";
    if (isAudio && tgData.result.audio) {
      fileId = tgData.result.audio.file_id;
    } else if (!isAudio && tgData.result.photo) {
      // Telegram возвращает массив размеров фото (берем последнее - самое большое)
      fileId = tgData.result.photo[tgData.result.photo.length - 1].file_id;
    }

    // ВАЖНО: Мы возвращаем file_id. В базе он будет храниться в поле audioUrl/coverUrl
    return NextResponse.json({ url: fileId });
  } catch (error) {
    console.error("Ошибка сервера:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}