import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { successResponse, errorResponse } from '../utils/response';
import { ERROR_CODES, FrontendConfig } from '../types';

// Create Prisma client with adapter
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vps_aff_db',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  connectionLimit: 10,
});
const prisma = new PrismaClient({ adapter });

/**
 * GET /api/config
 * 前端系统配置接口
 * 返回格式化的配置对象
 */
export async function getConfig(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const configs = await prisma.systemConfig.findMany();

    // 将配置数组转为 key-value 对象
    const configMap: Record<string, string> = {};
    for (const config of configs) {
      configMap[config.configKey] = config.configValue || '';
    }

    const result: FrontendConfig = {
      announcement_zh: configMap['announcement_zh'] || '',
      announcement_en: configMap['announcement_en'] || '',
      link_telegram: configMap['link_telegram'] || '',
      link_youtube: configMap['link_youtube'] || '',
      link_blog: configMap['link_blog'] || '',
      link_x: configMap['link_x'] || '',
      site_title_zh: configMap['site_title_zh'] || 'VPS导航',
      site_title_en: configMap['site_title_en'] || 'VPS Navigator',
      site_logo: configMap['site_logo'] || '',
    };

    successResponse(res, result);
  } catch (error) {
    console.error('Get config error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
  }
}
