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

const isProduction = process.env.NODE_ENV === 'production';

/**
 * 读取必需的数据库环境变量。
 *
 * 生产环境：DATABASE_HOST / DATABASE_USER / DATABASE_PASSWORD / DATABASE_NAME 缺失时抛错，
 * 拒绝用不安全的默认值（root/password）静默连接。
 * 开发环境：保留默认值以方便本地调试，但缺失时打印警告。
 */
function readRequiredDbEnv(key: string, devDefault: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    if (isProduction) {
      throw new Error(
        `${key} 环境变量未设置。生产环境必须显式配置数据库连接参数，不使用不安全默认值。`,
      );
    }
    console.warn(`[security] ${key} 未设置，开发环境使用默认值 "${devDefault}"。`);
    return devDefault;
  }
  return value;
}

const dbHost = readRequiredDbEnv('DATABASE_HOST', 'localhost');
const dbUser = readRequiredDbEnv('DATABASE_USER', 'root');
const dbPassword = readRequiredDbEnv('DATABASE_PASSWORD', 'password');
const dbName = readRequiredDbEnv('DATABASE_NAME', 'vps_aff_db');
const dbPort = parseInt(process.env.DATABASE_PORT || '3306', 10);

const adapter = new PrismaMariaDb({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  connectionLimit: 10,
});

export const prisma = new PrismaClient({ adapter });
