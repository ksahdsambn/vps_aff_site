import 'dotenv/config';
import { prisma } from '../utils/db';
import { seedDatabase } from '../utils/seedData';

async function main() {
  await seedDatabase(prisma);
  console.log('Runtime seed completed successfully');
}

main()
  .catch((error) => {
    console.error('Runtime seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
