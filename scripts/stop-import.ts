import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.importTask.updateMany({
    where: { status: { in: ['PENDING', 'PROCESSING'] } },
    data: { status: 'CANCELLED' }
  });
  console.log(`🛑 Остановлено задач: ${res.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());