"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProviders = getProviders;
exports.getAllProductIds = getAllProductIds;
exports.getProductById = getProductById;
exports.getProductsByProvider = getProductsByProvider;
const db_1 = require("../utils/db");
const response_1 = require("../utils/response");
const types_1 = require("../types");
const logError_1 = require("../utils/logError");
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
            db_1.prisma.product.count({ where }),
            db_1.prisma.product.findMany({
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
        (0, logError_1.logError)('Get products error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function getProviders(_req, res, _next) {
    try {
        const products = await db_1.prisma.product.findMany({
            where: { isDeleted: false },
            select: { provider: true },
            distinct: ['provider'],
            orderBy: { provider: 'asc' },
        });
        (0, response_1.successResponse)(res, products.map((product) => product.provider));
    }
    catch (error) {
        (0, logError_1.logError)('Get providers error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
/**
 * GET /api/products/all — 返回所有未删除产品的 ID + updatedAt 列表。
 * 用于前端 generateStaticParams（取 id）和 sitemap lastmod（取 updatedAt）。
 * 仅返回 id 与 updatedAt，体积小。
 *
 * 安全上限：take 限制为 10000，防止极端数据量下无限制查询耗尽资源。
 */
async function getAllProductIds(_req, res, _next) {
    try {
        const products = await db_1.prisma.product.findMany({
            where: { isDeleted: false },
            select: { id: true, updatedAt: true },
            orderBy: { id: 'asc' },
            take: 10000,
        });
        (0, response_1.successResponse)(res, products.map((p) => ({ id: p.id, updatedAt: p.updatedAt })));
    }
    catch (error) {
        (0, logError_1.logError)('Get all product ids error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
/**
 * GET /api/products/:id — 返回单个产品详情。
 * 不存在或已软删除时返回 404。
 */
async function getProductById(req, res, _next) {
    try {
        const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        // 使用 parseInt(id, 10) 而非 Number()，避免 Number("0x10")=16 等
        // 非十进制字面量被接受（URL 路径参数语义上应为十进制）。
        const id = parseInt(rawId, 10);
        if (!Number.isInteger(id) || id <= 0) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
            return;
        }
        const product = await db_1.prisma.product.findFirst({
            where: { id, isDeleted: false },
        });
        if (!product) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
            return;
        }
        (0, response_1.successResponse)(res, product);
    }
    catch (error) {
        (0, logError_1.logError)('Get product by id error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
/**
 * GET /api/providers/:name/products — 返回指定服务商的所有产品（聚合页用）。
 *
 * 安全上限：take 限制为 200，防止单服务商产品过多时无限制查询耗尽资源。
 * 该接口为聚合页展示用，200 条足以覆盖实际场景。
 */
async function getProductsByProvider(req, res, _next) {
    try {
        const providerName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
        if (!providerName) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Provider name is required', 400);
            return;
        }
        const list = await db_1.prisma.product.findMany({
            where: { provider: providerName, isDeleted: false },
            orderBy: { price: 'asc' },
            take: 200,
        });
        (0, response_1.successResponse)(res, list);
    }
    catch (error) {
        (0, logError_1.logError)('Get products by provider error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
//# sourceMappingURL=productController.js.map