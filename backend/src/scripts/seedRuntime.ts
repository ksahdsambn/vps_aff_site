import 'dotenv/config';
import { prisma } from '../utils/db';
import { seedDatabase } from '../utils/seedData';

async function main() {
  // 容器启动只初始化管理员与站点配置；绝不自动发布演示产品。
  await seedDatabase(prisma);
  console.log('Runtime initialization completed successfully');
}

main()
  .catch((error) => {
    console.error('Runtime seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
