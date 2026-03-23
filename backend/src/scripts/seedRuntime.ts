import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import { seedDatabase } from '../utils/seedData';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vps_aff_db',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

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
