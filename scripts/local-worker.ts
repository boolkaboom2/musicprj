import 'dotenv/config';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
  console.error('❌ ОШИБКА: В файле .env не найдены TELEGRAM_BOT_TOKEN или TELEGRAM_CHANNEL_ID');
  process.exit(1);
}

const SERVER_URL = 'https://178.236.242.110.nip.io';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function downloadAndUpload(query: string) {
  console.log(`\n[PC Worker] Ищем и качаем: ${query}`);
  
  const tempFile = path.join(process.cwd(), 'temp_track.mp3');
  const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
  const ffmpegPath = path.join(process.cwd(), 'ffmpeg.exe');
  
  // Проверяем наличие файлов
  if (!fs.existsSync(ytDlpPath)) {
    console.log(`❌ ОШИБКА: Файл yt-dlp.exe не найден в папке ${process.cwd()}`);
    return;
  }
  if (!fs.existsSync(ffmpegPath)) {
    console.log(`❌ ОШИБКА: Файл ffmpeg.exe не найден в папке ${process.cwd()}`);
    return;
  }

  try {
    console.log(`[PC Worker] Запускаем yt-dlp...`);
    // Используем execFileSync и передаем аргументы массивом
    execFileSync(ytDlpPath, [
      '-x', 
      '--audio-format', 'mp3', 
      '--ffmpeg-location', ffmpegPath, 
      '-o', tempFile, 
      `scsearch1:${query}`
    ], { stdio: 'inherit' });
    
    if (!fs.existsSync(tempFile)) {
      console.log('❌ Не удалось скачать файл (yt-dlp завершился с ошибкой).');
      return;
    }

    console.log(`\n[PC Worker] Файл скачан. Отправляем в Telegram...`);

    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHANNEL_ID!);
    
    const buffer = fs.readFileSync(tempFile);
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    formData.append('audio', blob, `${query}.mp3`);

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN!}/sendAudio`, {
      method: 'POST',
      body: formData
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      console.log('❌ Ошибка Telegram:', tgData);
      return;
    }

    const fileId = tgData.result.audio.file_id;
    console.log(`✅ Загружено в TG! file_id: ${fileId}`);

    console.log(`[PC Worker] Сохраняем в базу...`);
    const serverRes = await fetch(`${SERVER_URL}/api/admin/save-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: query.split(' - ')[1] || query,
        artist: query.split(' - ')[0] || 'Unknown',
        fileId: fileId
      })
    });

    if (serverRes.ok) {
      console.log('✅ Трек успешно добавлен в базу!');
    } else {
      console.log('❌ Ошибка сохранения на сервере:', await serverRes.text());
    }

  } catch (e: any) {
    console.error('❌ Ошибка выполнения:', e.message);
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

console.log('=== ЛОКАЛЬНЫЙ ВОРКЕР SADOVOD ===');
console.log('Введи "Артист - Название" (или exit для выхода):');

rl.on('line', async (input: string) => {
  if (input.toLowerCase() === 'exit') {
    rl.close();
    return;
  }
  await downloadAndUpload(input);
  console.log('\nВведи следующий трек (или exit):');
});