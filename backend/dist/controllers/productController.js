"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProviders = getProviders;
const client_1 = require("../generated/prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const response_1 = require("../utils/response");
const types_1 = require("../types");
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'vps_aff_db',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    connectionLimit: 10,
});
const prisma = new client_1.PrismaClient({ adapter });
const ALLOWED_SORT_FIELDS = ['cpu', 'memory', 'disk', 'monthlyTraffic', 'bandwidth', 'price'];
function normalizeQueryText(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim();
    return normalized || undefined;
}
async function getProducts(req, res, _next) {
    try {
        const query = req.query;
        const page = Math.max(1, Number(query.page) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 50));
        const skip = (page - 1) * pageSize;
        const providers = normalizeQueryText(query.providers);
        const keyword = normalizeQueryText(query.keyword);
        const location = normalizeQueryText(query.location);
        const sortField = normalizeQueryText(query.sortField);
        const where = {
            isDeleted: false,
        };
        if (providers) {
            const providerList = providers.split(',').map((provider) => provider.trim()).filter(Boolean);
            if (providerList.length > 0) {
                where.provider = { in: providerList };
            }
        }
        if (keyword) {
            where.name = { contains: keyword };
        }
        if (location) {
            where.location = { contains: location };
        }
        let orderBy = { createdAt: 'desc' };
        if (sortField && ALLOWED_SORT_FIELDS.includes(sortField)) {
            const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
            orderBy = { [sortField]: sortOrder };
        }
        const [total, list] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: pageSize,
                orderBy,
            }),
        ]);
        (0, response_1.successResponse)(res, {
            total,
            page,
            pageSize,
            list,
        });
    }
    catch (error) {
        console.error('Get products error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function getProviders(_req, res, _next) {
    try {
        const products = await prisma.product.findMany({
            where: { isDeleted: false },
            select: { provider: true },
            distinct: ['provider'],
            orderBy: { provider: 'asc' },
        });
        (0, response_1.successResponse)(res, products.map((product) => product.provider));
    }
    catch (error) {
        console.error('Get providers error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
//# sourceMappingURL=productController.js.map