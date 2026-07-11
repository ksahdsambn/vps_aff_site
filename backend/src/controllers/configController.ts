import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { successResponse, errorResponse } from '../utils/response';
import { ERROR_CODES, FrontendConfig } from '../types';
import { logError } from '../utils/logError';

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
    logError('Get config error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
  }
}
