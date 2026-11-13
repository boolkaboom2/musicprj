const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- НАСТРОЙКИ ---
const TOKEN = 'ТУТ_ТОКЕН_ОТ_BOTFATHER';
const SERVER_URL = 'https://178.236.242.110.nip.io';
const API_SECRET = 'super_secret_123'; // Тот же ключ, что в .env на сервере

const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я бот SADOVOD. Отправь мне ссылку на плейлист Яндекс.Музыки (или его HTML/iframe код), и я отправлю треки на сервер.');
});

bot.on('message', async (msg) => {
  const text = msg.text;
  if (!text || text.startsWith('/')) return;

  if (!text.startsWith('http') && !text.includes('<iframe')) {
    return bot.sendMessage(msg.chat.id, 'Отправь ссылку (http) или HTML-код iframe.');
  }

  bot.sendMessage(msg.chat.id, '⏳ Парсим ссылку. Это займет пару секунд...');

  try {
    // Отправляем ссылку на сервер (сервер парсит Яндекс)
    // P.S. Если сервер всё равно отдаст 403 (бан IP Aeza), парсинг придется делать прямо в этом боте.
    const parseRes = await axios.post(`${SERVER_URL}/api/parse-playlist`, 
      { url: text },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!parseRes.data.success) {
      throw new Error(parseRes.data.error || 'Ошибка парсинга (Яндекс заблокировал IP сервера)');
    }

    const tracks = parseRes.data.tracks;
    bot.sendMessage(msg.chat.id, `✅ Найдено ${tracks.length} треков. Отправляем в очередь...`);

    // Отправляем треки в очередь на сервере (используя секретный ключ)
    await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks: tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    bot.sendMessage(msg.chat.id, `🚀 Готово! ${tracks.length} треков в очереди. Они начнут качаться на сервере.`);

  } catch (error) {
    console.error(error.response?.data || error.message);
    bot.sendMessage(msg.chat.id, `❌ Ошибка: ${error.response?.data?.error || error.message}`);
  }
});

console.log('🤖 Бот запущен. Открой Telegram и напиши ему /start.');