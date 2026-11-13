import 'dotenv/config'; // АВТОМАТИЧЕСКИ ЧИТАЕТ .env ИЗ КОРНЯ ПРОЕКТА
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// БЕРЕМ ТОКЕНЫ ИЗ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ
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
  
  try {
    // yt-dlp.exe должен лежать в корне проекта
    execSync(`yt-dlp.exe -x --audio-format mp3 -o "${tempFile}" "scsearch1:${query}"`, { stdio: 'inherit' });
    
    if (!fs.existsSync(tempFile)) {
      console.log('❌ Не удалось скачать файл.');
      return;
    }

    console.log(`[PC Worker] Файл скачан. Отправляем в Telegram...`);

    const formData = new FormData();
    // ВОСКЛИЦАТЕЛЬНЫЙ ЗНАК РЕШАЕТ ПРОБЛЕМУ С ТИПОМ
    formData.append('chat_id', TELEGRAM_CHANNEL_ID!);
    
    const buffer = fs.readFileSync(tempFile);
    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    formData.append('audio', blob, `${query}.mp3`);

    // ВОСКЛИЦАТЕЛЬНЫЙ ЗНАК РЕШАЕТ ПРОБЛЕМУ С ТИПОМ
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

    // Отправляем на сервер
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
      console.log('❌ Ошибка сохранения на сервере');
    }

  } catch (e: any) {
    console.error('❌ Ошибка:', e.message);
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