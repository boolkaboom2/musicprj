import { PrismaClient } from '@prisma/client';
import { downloadAndSaveTrack } from './lib/downloader';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => {
  console.error('[Worker] Критическая ошибка (uncaughtException):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Worker] Необработанный reject (unhandledRejection):', reason);
});

async function processQueue() {
  console.log('[Worker] Запущен. Ожидание задач...');
  
  while (true) {
    try {
      const task = await prisma.importTask.findFirst({
        where: { status: 'PENDING' }, // Берем только PENDING (отмененные не берем)
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
        const query = `${task.artist} ${task.title}`;
        await downloadAndSaveTrack(query);
        
        await prisma.importTask.update({
          where: { id: task.id },
          data: { status: 'DONE' }
        });
        console.log(`[Worker] Успешно: ${task.title}`);
      } catch (e: any) {
        console.error(`[Worker] Ошибка: ${task.title} - ${e.message}`);
        await prisma.importTask.update({
          where: { id: task.id },
          data: { status: 'FAILED', errorMessage: e.message }
        });
      }

      await new Promise(r => setTimeout(r, 2000));

    } catch (error) {
      console.error('[Worker] Ошибка базы данных/цикла:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

processQueue();