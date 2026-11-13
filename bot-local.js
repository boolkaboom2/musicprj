const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = '9015769257:AAGWGTRzQ4EuS1erer0qsKDvGs-xDwdziLQ'; 
const SERVER_URL = 'https://178.236.242.110.nip.io';
const API_SECRET = 'sadovod_secret_2026';

// Проверка, что в токене нет русских букв
if (TOKEN.match(/[^\x00-\x7F]/) || TOKEN.includes(' ')) {
  console.error('\n❌ ОШИБКА: В токене есть пробелы или русские буквы! Скопируй токен от BotFather заново.\n');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN.trim(), { polling: true });
console.log('🤖 Бот (Локальный парсер) запущен. Ждем ссылку в Телеграме...');

async function parseYandex(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
  };

  const playlistMatch = url.match(/music\.yandex\.ru\/playlists\/([a-zA-Z0-9.\-]+)/);
  if (playlistMatch) {
    const id = playlistMatch[1];
    console.log(`[Bot] Парсим плейлист: ${id}`);
    const res = await fetch(`https://api.music.yandex.net/playlist/${id}`, { headers });
    if (!res.ok) throw new Error(`Яндекс вернул ${res.status}.`);
    const data = await res.json();
    const rawTracks = data.result?.tracks || [];
    return rawTracks.map(item => {
      const t = item.track || item;
      return {
        title: t.title,
        artist: t.artists?.map(a => a.name).join(', ') || 'Unknown'
      };
    });
  }

  const albumMatch = url.match(/music\.yandex\.ru\/album\/(\d+)/);
  if (albumMatch) {
    const id = albumMatch[1];
    console.log(`[Bot] Парсим альбом: ${id}`);
    const res = await fetch(`https://api.music.yandex.net/albums/${id}/with-tracks`, { headers });
    if (!res.ok) throw new Error(`Яндекс вернул ${res.status}.`);
    const data = await res.json();
    const rawTracks = data.result?.volumes?.flat() || [];
    return rawTracks.map(t => ({
      title: t.title,
      artist: t.artists?.map(a => a.name).join(', ') || 'Unknown'
    }));
  }

  throw new Error('Ссылка не распознана.');
}

bot.onText(/\/start/, (msg) => {
  console.log(`[Bot] Получено /start от ${msg.chat.id}`);
  bot.sendMessage(msg.chat.id, 'Привет! Кидай ссылку на плейлист или альбом Яндекс.Музыки.');
});

bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/') || !text.startsWith('http')) return;

  console.log(`[Bot] Получена ссылка: ${text}`);
  bot.sendMessage(msg.chat.id, '⏳ Парсим ссылку...');

  try {
    const tracks = await parseYandex(text);
    if (tracks.length === 0) throw new Error('Треки не найдены.');

    bot.sendMessage(msg.chat.id, `✅ Найдено ${tracks.length} треков. Отправляем на сервер...`);

    await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks: tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    bot.sendMessage(msg.chat.id, `🚀 Готово! ${tracks.length} треков добавлены в очередь.`);

  } catch (error) {
    console.error('[Bot Error]', error.message);
    bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.message}`);
  }
});