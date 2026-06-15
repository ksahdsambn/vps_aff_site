import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * 应用全局唯一的 PrismaClient 实例。
 *
 * 早期实现中每个 controller 各自 new PrismaClient + PrismaMariaDb，
 * 导致同时打开 3+ 个独立连接池（每个 connectionLimit:10），
 * 既浪费 DB 连接又使配置分散漂移（如 configController 漏写 parseInt radix）。
 *
 * 此处集中维护单一 adapter + 单一 client，所有 controller / seedRuntime 共享。
 */
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vps_aff_db',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 10,
});

export const prisma = new PrismaClient({ adapter });
