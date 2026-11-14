require('dotenv').config(); 
const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');

const TOKEN = process.env.BOT_TOKEN; 
const SERVER_URL = process.env.SERVER_URL || 'https://178.236.242.110.nip.io';
const API_SECRET = process.env.API_SECRET; 

if (!TOKEN || !API_SECRET) {
  console.error('\n❌ ОШИБКА: В файле .env нет BOT_TOKEN или API_SECRET!');
  process.exit(1);
}

const bot = new Telegraf(TOKEN.trim());
console.log('🤖 Бот (Локальный парсер) запущен.');

const axiosConfig = {
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'X-Yandex-Music-Client': 'YandexMusicAndroid/24023621',
  }
};

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
    [Markup.button.url('🚀 Открыть SADOVOD', SERVER_URL)]
  ]));
});

async function parseYandex(url) {
  const playlistMatch = url.match(/music\.yandex\.ru\/playlists\/([a-zA-Z0-9.\-]+)/);
  if (playlistMatch) {
    const res = await axios.get(`https://api.music.yandex.net/playlist/${playlistMatch[1]}`, axiosConfig);
    return (res.data.result?.tracks || []).map(i => ({ title: (i.track || i).title, artist: (i.track || i).artists?.map(a => a.name).join(', ') || 'Unknown' }));
  }
  const albumMatch = url.match(/music\.yandex\.ru\/album\/(\d+)/);
  if (albumMatch) {
    const res = await axios.get(`https://api.music.yandex.net/albums/${albumMatch[1]}/with-tracks`, axiosConfig);
    return (res.data.result?.volumes?.flat() || []).map(t => ({ title: t.title, artist: t.artists?.map(a => a.name).join(', ') || 'Unknown' }));
  }
  throw new Error('Ссылка не распознана.');
}

async function startProgressPolling(ctx, batchId, totalTracks) {
  const chatId = ctx.chat.id;
  
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
        finalText += `\n\n<a href="${SERVER_URL}">Перейти на SADOVOD</a>`;

        ctx.telegram.editMessageText(chatId, ctx.message.message_id, null, finalText, {
          parse_mode: 'HTML',
          disable_web_page_preview: true
        });
      } else {
        ctx.telegram.editMessageText(
          chatId, ctx.message.message_id, null,
          `⏳ <b>Скачиваем треки...</b>\n\n${bar} ${percent}%\nСкачано: ${done} из ${total}\nОшибок: ${failed}`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: '🛑 Остановить импорт', callback_data: `cancel_${batchId}` }]]
            }
          }
        );
      }
    } catch (e) {
      console.error('[Status Error]', e.message);
    }
  }, 3000);
}

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  if (!text.startsWith('http')) return;

  if (activeUsers.has(chatId)) {
    return ctx.replyWithHTML('⚠️ <b>У вас уже есть активный импорт!</b> Дождитесь завершения или отмените его.');
  }

  const statusMsg = await ctx.replyWithHTML('⏳ <i>Сканирую плейлист...</i>');

  try {
    const tracks = await parseYandex(text);
    if (tracks.length === 0) throw new Error('Треки не найдены.');

    const res = await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks: tracks },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );

    const { batchId, skipped, message } = res.data;

    if (!batchId) {
       return ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `✅ <b>${message}</b>`, { parse_mode: 'HTML' });
    }

    activeUsers.set(chatId, batchId);

    let startText = `🚀 <b>В очереди: ${tracks.length - skipped} треков</b>\n\n${makeBar(0)} 0%\n<i>Ожидаем воркер...</i>`;
    if (skipped > 0) startText = `⚠️ <i>Пропущено (уже есть): ${skipped}</i>\n\n` + startText;

    const progressMsg = await ctx.telegram.editMessageText(
      chatId, statusMsg.message_id, null, startText, 
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🛑 Остановить импорт', callback_data: `cancel_${batchId}` }]]
        }
      }
    );

    // Передаем fake ctx.message для editMessageText
    await startProgressPolling({ chat: { id: chatId }, message: progressMsg, telegram: ctx.telegram }, batchId, tracks.length - skipped);

  } catch (error) {
    console.error('[Bot Error]', error.message);
    ctx.telegram.editMessageText(chatId, statusMsg.message_id, null, `❌ <b>Ошибка:</b> <code>${error.message}</code>`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔄 Попробовать снова', callback_data: 'retry' }]]
      }
    });
  }
});

bot.action(/cancel_(.+)/, async (ctx) => {
  const batchId = ctx.match[1];
  const chatId = ctx.chat.id;
  
  await ctx.answerCbQuery("Отменяем...");
  
  try {
    await axios.post(`${SERVER_URL}/api/import-queue/cancel`, 
      { batchId },
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET } }
    );
    activeUsers.delete(chatId);
    
    await ctx.editMessageText(`🛑 <b>Импорт остановлен.</b>\n\n<i>Вы можете возобновить его позже.</i>`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔄 Продолжить импорт', callback_data: `resume_${batchId}` }]]
      }
    });
  } catch (e) {
    await ctx.reply('Ошибка при отмене импорта на сервере.');
  }
});

bot.action(/resume_(.+)/, async (ctx) => {
  const batchId = ctx.match[1];
  const chatId = ctx.chat.id;
  
  await ctx.answerCbQuery("Возобновляем...");
  
  try {
    await axios.post(`${SERVER_URL}/api/import-queue`, 
      { tracks: [] }, 
      { headers: { 'Content-Type': 'application/json', 'x-api-secret': API_SECRET, 'x-resume-batch-id': batchId } }
    );
    
    activeUsers.set(chatId, batchId);
    const progressMsg = await ctx.editMessageText(`🔄 <b>Импорт возобновлен!</b>\n\n<i>Ожидаем воркер...</i>`, { parse_mode: 'HTML' });
    
    await startProgressPolling({ chat: { id: chatId }, message: progressMsg, telegram: ctx.telegram }, batchId, 0);

  } catch (e) {
    await ctx.reply('Ошибка при возобновлении импорта на сервере.');
  }
});

bot.launch().then(() => {
    console.log('✅ Бот успешно подключен к Telegram.');
}).catch(err => {
    console.error('❌ Ошибка запуска бота:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));