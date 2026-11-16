import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаю импорт...');
  const rawData = fs.readFileSync('backup.json', 'utf-8');
  const data = JSON.parse(rawData);

  // Важно: порядок вставки, чтобы не нарушить внешние ключи
  await prisma.user.createMany({ data: data.users, skipDuplicates: true });
  await prisma.track.createMany({ data: data.tracks, skipDuplicates: true });
  await prisma.playlist.createMany({ data: data.playlists, skipDuplicates: true });
  await prisma.playlistItem.createMany({ data: data.playlistItems, skipDuplicates: true });
  await prisma.like.createMany({ data: data.likes, skipDuplicates: true });
  await prisma.listenHistory.createMany({ data: data.listenHistory, skipDuplicates: true });
  await prisma.pinnedTrack.createMany({ data: data.pinnedTracks, skipDuplicates: true });
  await prisma.inviteCode.createMany({ data: data.inviteCodes, skipDuplicates: true });
  await prisma.feedback.createMany({ data: data.feedbacks, skipDuplicates: true });

  console.log('✅ Импорт завершен!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });