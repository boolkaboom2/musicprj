const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = 'ТВОЙ_ТОКЕН_ОТ_BOTFATHER';
const SERVER_URL = 'https://178.236.242.110.nip.io';
const API_SECRET = 'super_secret_123'; // Из .env сервера

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я бот-прокси. Кидай ссылку на плейлист (Яндекс), и я отправлю её на сервер.');
});

bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/') || !text.startsWith('http')) return;

  bot.sendMessage(msg.chat.id, '⏳ Отправляем ссылку на сервер...');

  try {
    const parseRes = await axios.post(`${SERVER_URL}/api/parse-playlist`, 
      { url: text },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!parseRes.data.success) throw new Error(parseRes.data.error);

    const tracks = parseRes.data.tracks;
    bot.sendMessage(msg.chat.id, `✅ Найдено ${tracks.length} треков. Ставим в очередь...`);

    await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks: tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    bot.sendMessage(msg.chat.id, `🚀 Успешно добавлено ${tracks.length} треков в очередь!`);
  } catch (error) {
    bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.response?.data?.error || error.message}`);
  }
});

console.log('Бот (Прокси) запущен.');