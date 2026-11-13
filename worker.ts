import { PrismaClient } from '@prisma/client';
import { downloadAndSaveTrack } from './lib/downloader';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => {
  console.error('[Worker] Критическая ошибка:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Worker] Необработанный reject:', reason);
});

async function processQueue() {
  console.log('[Worker] Запущен. Проверка связи с базой...');
  
  while (true) {
    try {
      // Пытаемся проверить связь
      await prisma.$queryRaw`SELECT 1`;
      
      const task = await prisma.importTask.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' }
      });

      if (!task) {
        await new Promise(r => setTimeout(r, 5000)); 
        continue;
      }

      console.log(`[Worker] Взял в работу: ${task.artist} - ${task.title}`);

      await prisma.importTask.update({
        where: { id: task.id },
        data: { status: 'PROCESSING' }
      });

      try {
        // На сервере это не сработает из-за блокировки, 
        // но мы оставим код для истории.
        const query = `${task.artist} ${task.title}`;
        await downloadAndSaveTrack(query);
        
        await prisma.importTask.update({
          where: { id: task.id },
          data: { status: 'DONE' }
        });
        console.log(`[Worker] Успешно: ${task.title}`);
      } catch (e: any) {
        console.error(`[Worker] Ошибка скачивания: ${task.title} - ${e.message}`);
        await prisma.importTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', errorMessage: e.message }
        });
      }

      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      // Если база отвалилась, просто ждем и пробуем снова
      console.log('[Worker] База недоступна. Ждем 10 секунд...');
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

processQueue();