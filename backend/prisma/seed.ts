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
  // 演示产品需要显式开启，避免本地/生产误执行 seed 时写入虚假推广数据。
  await seedDatabase(prisma, {
    includeSampleProducts: process.env.SEED_SAMPLE_PRODUCTS === 'true',
  });
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
