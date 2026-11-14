require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

// Токен бота-парсера (добавь его в .env на сервере как PARSER_BOT_TOKEN)
const TOKEN = process.env.PARSER_BOT_TOKEN; 
// Так как бот на сервере, он стучится на localhost
const SERVER_URL = 'http://127.0.0.1:3000';
const API_SECRET = process.env.SERVER_API_SECRET;

if (!TOKEN || !API_SECRET) {
  console.error('❌ ОШИБКА: В .env нет PARSER_BOT_TOKEN или SERVER_API_SECRET!');
  process.exit(1);
}

const bot = new Telegraf(TOKEN.trim());
console.log('🤖 Серверный бот-парсер запущен.');

const activeUsers = new Map();

function makeBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '■'.repeat(filled) + '□'.repeat(empty);
}

bot.start((ctx) => {
  const name = ctx.from.first_name || 'друг';
  const text = `<b>Привет, ${name}!</b> 👋\n\nЯ официальный бот-парсер <b>SADOVOD</b>.\n\nОтправь мне ссылку на плейлист или альбом <b>Яндекс.Музыки</b>, и я скачаю все треки и добавлю на сервер.\n\n<i>Просто скинь ссылку в чат.</i>`;
  
  return ctx.replyWithHTML(text, Markup.inlineKeyboard([
    [Markup.button.url('🚀 Открыть SADOVOD', 'https://178.236.242.110.nip.io')]
  ]));
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  if (!text.startsWith('http')) return;

  if (activeUsers.has(chatId)) {
    return ctx.replyWithHTML('⚠️ <b>У вас уже есть активный импорт!</b> Дождитесь завершения или отмените его.');
  }

  const statusMsg = await ctx.replyWithHTML('⏳ <i>Сканирую плейлист на сервере...</i>');

  try {
    // 1. Просим сервер распарсить ссылку (теперь он делает это через прокси)
    const parseRes = await axios.post(`${SERVER_URL}/api/parse-playlist`, { url: text });
    
    if (!parseRes.data.success || !parseRes.data.tracks) {
      throw new Error(parseRes.data.error || 'Ошибка парсинга');
    }
    
    const tracks = parseRes.data.tracks;
    if (tracks.length === 0) throw new Error('Треки не найдены.');

    await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `✅ <b>Найдено ${tracks.length} треков!</b>\n\n<i>Отправляю в очередь...</i>`, { parse_mode: 'HTML' });

    // 2. Отправляем треки в очередь
    const queueRes = await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    const { batchId, skipped, message } = queueRes.data;

    if (!batchId) {
       return ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `✅ <b>${message}</b>`, { parse_mode: 'HTML' });
    }

    activeUsers.set(chatId, batchId);

    let startText = `🚀 <b>В очереди: ${tracks.length - skipped} треков</b>\n\n${makeBar(0)} 0%\n<i>Ожидаем воркер...</i>`;
    if (skipped > 0) startText = `⚠️ <i>Пропущено (уже есть): ${skipped}</i>\n\n` + startText;

    const progressMsg = await ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, startText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🛑 Остановить импорт', callback_data: `cancel_${batchId}` }]]
      }
    });

    // 3. Запускаем пуллинг
    const interval = setInterval(async () => {
      try {
        const statRes = await axios.get(`${SERVER_URL}/api/import-queue/status?batchId=${batchId}`);
        const { total, done, failed, isFinished } = statRes.data;
        
        const percent = Math.round((done / total) * 100);
        const bar = makeBar(percent);

        if (isFinished) {
          clearInterval(interval);
          activeUsers.delete(chatId);
          
          let finalText = `✅ <b>Импорт завершен!</b>\n\nВсего: ${total}\nСкачано: <b>${done}</b>\nОшибок: <b>${failed}</b>`;
          if (failed > 0) finalText += `\n\n<i>* Треки, которые не удалось найти, пропущены.</i>`;
          finalText += `\n\n<a href="https://178.236.242.110.nip.io">Перейти на SADOVOD</a>`;

          ctx.telegram.editMessageText(chatId, progressMsg.message_id, null, finalText, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
          });
        } else {
          ctx.telegram.editMessageText(chatId, progressMsg.message_id, null,
            `⏳ <b>Скачиваем треки...</b>\n\n${bar} ${percent}%\nСкачано: ${done} из ${total}\nОшибок: ${failed}`,
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: [[{ text: '🛑 Остановить импорт', callback_data: `cancel_${batchId}` }]] }
            }
          );
        }
      } catch (e) {}
    }, 3000);

  } catch (error) {
    console.error('[Bot Error]', error.message);
    ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `❌ <b>Ошибка:</b> <code>${error.message}</code>`, { parse_mode: 'HTML' });
  }
});

bot.action(/cancel_(.+)/, async (ctx) => {
  const batchId = ctx.match[1];
  const chatId = ctx.chat.id;
  
  await ctx.answerCbQuery("Отменяем...");
  
  try {
    await axios.post(`${SERVER_URL}/api/import-queue/cancel`, { batchId }, { headers: { 'x-api-secret': API_SECRET } });
    activeUsers.delete(chatId);
    await ctx.editMessageText(`🛑 <b>Импорт остановлен пользователем.</b>`, { parse_mode: 'HTML' });
  } catch (e) {
    await ctx.reply('Ошибка при отмене импорта.');
  }
});

bot.launch().then(() => console.log('✅ Серверный бот подключен к Telegram.'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));