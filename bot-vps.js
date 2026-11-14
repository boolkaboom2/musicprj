require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const TOKEN = process.env.PARSER_BOT_TOKEN; 
const SERVER_URL = 'https://178.236.242.110.nip.io';
const API_SECRET = process.env.SERVER_API_SECRET;

if (!TOKEN || !API_SECRET) {
  console.error('❌ ОШИБКА: В .env нет PARSER_BOT_TOKEN или SERVER_API_SECRET!');
  process.exit(1);
}

const bot = new Telegraf(TOKEN.trim());
console.log('🤖 Серверный бот-парсер (Текст + Ссылки) запущен.');

bot.start((ctx) => {
  return ctx.replyWithHTML(`<b>Привет!</b> 👋\n\nЯ принимаю:</b>\n\n1. <b>Ссылки</b> на плейлисты (Spotify, YouTube).\n2. <b>Текстовые списки</b> треков в формате <code>Исполнитель - Название</code>.\n\n<i>Просто отправь текст или ссылку сюда.</i>`);
});

// Обработка текста (списков треков)
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  
  // Если это ссылка — игнорируем здесь, пусть обрабатывает другой хендлер
  if (text.startsWith('http')) return; 

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.includes(' - '));

  if (lines.length === 0) {
    return ctx.reply('⚠️ Не нашел ни одного трека в формате "Исполнитель - Название".');
  }

  const statusMsg = await ctx.replyWithHTML(`⏳ <i>Найдено ${lines.length} строк. Отправляю на сервер...</i>`);

  try {
    const tracks = lines.map(line => {
      const [artist, ...titleParts] = line.split(' - ');
      return {
        artist: artist.trim(),
        title: titleParts.join(' - ').trim()
      };
    });

    const res = await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    const { batchId, skipped, message } = res.data;

    if (!batchId) {
       return ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `✅ <b>${message}</b>`, { parse_mode: 'HTML' });
    }

    let replyText = `🚀 <b>Успешно добавлено!</b>\n\n`;
    if (skipped > 0) replyText += `⚠️ Пропущено (уже в базе): ${skipped}\n`;
    replyText += `🎵 В очереди: ${tracks.length - skipped}\n\n<i>Треки начнут скачиваться в течение пары минут.</i>`;

    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, replyText, { parse_mode: 'HTML' });

  } catch (error) {
    console.error('[Bot Error]', error.message);
    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `❌ <b>Ошибка сервера:</b> <code>${error.message}</code>`, {
      parse_mode: 'HTML'
    });
  }
});

bot.launch().then(() => console.log('✅ Бот подключен к Telegram.'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));