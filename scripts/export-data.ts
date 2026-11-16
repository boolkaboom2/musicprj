import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Начинаю экспорт...');

  const data = {
    users: await prisma.user.findMany(),
    tracks: await prisma.track.findMany(),
    playlists: await prisma.playlist.findMany(),
    playlistItems: await prisma.playlistItem.findMany(),
    likes: await prisma.like.findMany(),
    listenHistory: await prisma.listenHistory.findMany(),
    pinnedTracks: await prisma.pinnedTrack.findMany(),
    inviteCodes: await prisma.inviteCode.findMany(),
    feedbacks: await prisma.feedback.findMany(),
    // ImportTask и VisitLog можно не выгружать, они не критичны
  };

  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('✅ Экспорт завершен! Файл: backup.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });