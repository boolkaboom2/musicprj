require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const TOKEN = process.env.PARSER_BOT_TOKEN; 
const SERVER_URL = 'https://178.236.242.110.nip.io';
const API_SECRET = process.env.SERVER_API_SECRET;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN || !API_SECRET || !GITHUB_TOKEN) {
  console.error('❌ ОШИБКА: В .env нет PARSER_BOT_TOKEN, SERVER_API_SECRET или GITHUB_TOKEN!');
  process.exit(1);
}

const bot = new Telegraf(TOKEN.trim());
console.log('🤖 Серверный бот-парсер (через GitHub) запущен.');

bot.start((ctx) => {
  return ctx.replyWithHTML(`<b>Привет!</b> 👋\n\nКидай ссылку на плейлист (Яндекс, Spotify, YouTube).\nПарсинг происходит через GitHub (обход блокировок), это займет 1-2 минуты.`);
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  if (!text.startsWith('http')) return;

  const statusMsg = await ctx.replyWithHTML('⏳ <i>Отправляю ссылку на парсинг в GitHub...</i>');

  try {
    // Отправляем команду в GitHub Actions
    await axios.post(`https://api.github.com/repos/boolkaboom2/musicprj/actions/workflows/parse-playlist.yml/dispatches`, {
      ref: 'main',
      inputs: {
        url: text,
        secret: API_SECRET
      }
    }, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });

    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, 
      `✅ <b>Ссылка отправлена в GitHub!</b>\n\n<i>Парсинг займет около 30-60 секунд. Как только GitHub закончит, треки автоматически попадут в очередь на сайте.</i>`, 
      { parse_mode: 'HTML' }
    );
    
  } catch (error) {
    console.error('[Bot Error]', error.response?.data || error.message);
    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `❌ <b>Ошибка GitHub:</b> <code>${error.message}</code>`, {
      parse_mode: 'HTML'
    });
  }
});

bot.launch().then(() => console.log('✅ Бот подключен к Telegram.'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));