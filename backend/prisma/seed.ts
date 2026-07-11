import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedDatabase } from '../src/utils/seedData';

const isProduction = process.env.NODE_ENV === 'production';

function readRequiredDbEnv(key: string, devDefault: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    if (isProduction) {
      throw new Error(`${key} 环境变量未设置。`);
    }
    return devDefault;
  }
  return value;
}

const adapter = new PrismaMariaDb({
  host: readRequiredDbEnv('DATABASE_HOST', 'localhost'),
  user: readRequiredDbEnv('DATABASE_USER', 'root'),
  password: readRequiredDbEnv('DATABASE_PASSWORD', 'password'),
  database: readRequiredDbEnv('DATABASE_NAME', 'vps_aff_db'),
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await seedDatabase(prisma);
  console.log('Seed data created successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
