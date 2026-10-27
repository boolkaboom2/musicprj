import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const track = await prisma.track.create({
    data: {
      title: 'Test Track 1',
      artist: 'SADOVOD Artist',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Тестовый mp3
      coverUrl: 'https://picsum.photos/400/400', // Тестовая обложка
      duration: 180,
    },
  })
  console.log('Добавлен тестовый трек:', track.title)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())