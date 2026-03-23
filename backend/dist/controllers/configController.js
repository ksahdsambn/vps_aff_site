"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const client_1 = require("../generated/prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const response_1 = require("../utils/response");
const types_1 = require("../types");
// Create Prisma client with adapter
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'vps_aff_db',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    connectionLimit: 10,
});
const prisma = new client_1.PrismaClient({ adapter });
/**
 * GET /api/config
 * 前端系统配置接口
 * 返回格式化的配置对象
 */
async function getConfig(_req, res, _next) {
    try {
        const configs = await prisma.systemConfig.findMany();
        // 将配置数组转为 key-value 对象
        const configMap = {};
        for (const config of configs) {
            configMap[config.configKey] = config.configValue || '';
        }
        const result = {
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
        (0, response_1.successResponse)(res, result);
    }
    catch (error) {
        console.error('Get config error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, '服务器内部错误', 500);
    }
}
//# sourceMappingURL=configController.js.map