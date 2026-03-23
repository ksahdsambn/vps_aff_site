"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.addProduct = addProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.getAdminProducts = getAdminProducts;
exports.getAdminConfig = getAdminConfig;
exports.updateConfig = updateConfig;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
function normalizeRequiredString(value) {
    return typeof value === 'string' ? value.trim() : '';
}
function normalizeOptionalString(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const normalized = value.trim();
    return normalized ? normalized : null;
}
function parseFiniteNumber(value) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function validateNumberField(value, field, options = {}) {
    const parsed = parseFiniteNumber(value);
    if (parsed === null) {
        return { error: `Field ${field} must be a valid number` };
    }
    const min = options.min ?? 0;
    const isValid = options.allowZero ? parsed >= min : parsed > min;
    if (!isValid) {
        const operator = options.allowZero ? '>=' : '>';
        return { error: `Field ${field} must be ${operator} ${min}` };
    }
    return { value: parsed };
}
function normalizeTrafficInput(value) {
    if (typeof value === 'object' && value !== null) {
        const { value: rawValue, unit } = value;
        const parsed = validateNumberField(rawValue, 'monthlyTraffic', { min: 0, allowZero: true });
        if ('error' in parsed) {
            return parsed;
        }
        if (unit !== 'GB' && unit !== 'TB') {
            return { error: 'Field monthlyTraffic must use GB or TB' };
        }
        return { value: unit === 'TB' ? parsed.value * 1000 : parsed.value };
    }
    return validateNumberField(value, 'monthlyTraffic', { min: 0, allowZero: true });
}
function normalizeBandwidthInput(value) {
    if (typeof value === 'object' && value !== null) {
        const { value: rawValue, unit } = value;
        const parsed = validateNumberField(rawValue, 'bandwidth', { min: 0 });
        if ('error' in parsed) {
            return parsed;
        }
        if (unit !== 'Mbps' && unit !== 'Gbps') {
            return { error: 'Field bandwidth must use Mbps or Gbps' };
        }
        return { value: unit === 'Gbps' ? parsed.value * 1000 : parsed.value };
    }
    return validateNumberField(value, 'bandwidth', { min: 0 });
}
async function login(req, res, _next) {
    try {
        const username = normalizeRequiredString(req.body.username);
        const password = typeof req.body.password === 'string' ? req.body.password : '';
        if (!username || !password) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Username and password are required', 400);
            return;
        }
        const admin = await prisma.admin.findUnique({
            where: { username },
        });
        if (!admin) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
        const token = jsonwebtoken_1.default.sign({ adminId: admin.id, username: admin.username }, jwtSecret, { expiresIn: '30m' });
        await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });
        (0, response_1.successResponse)(res, {
            token,
            expiresIn: '30m',
        });
    }
    catch (error) {
        console.error('Login error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function addProduct(req, res, _next) {
    try {
        const body = req.body;
        const provider = normalizeRequiredString(body.provider);
        const name = normalizeRequiredString(body.name);
        const location = normalizeRequiredString(body.location);
        const affiliateUrl = normalizeRequiredString(body.affiliateUrl);
        const currency = normalizeRequiredString(body.currency).toUpperCase();
        if (!provider || !name || !location || !affiliateUrl) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Required text fields cannot be empty', 400);
            return;
        }
        if (!/^[A-Z]{3}$/.test(currency)) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
            return;
        }
        const cpu = validateNumberField(body.cpu, 'cpu', { min: 0 });
        if ('error' in cpu) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, cpu.error, 400);
            return;
        }
        const memory = validateNumberField(body.memory, 'memory', { min: 0 });
        if ('error' in memory) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, memory.error, 400);
            return;
        }
        const disk = validateNumberField(body.disk, 'disk', { min: 0 });
        if ('error' in disk) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, disk.error, 400);
            return;
        }
        const price = validateNumberField(body.price, 'price', { min: 0, allowZero: true });
        if ('error' in price) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, price.error, 400);
            return;
        }
        const monthlyTraffic = normalizeTrafficInput(body.monthlyTraffic);
        if ('error' in monthlyTraffic) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, monthlyTraffic.error, 400);
            return;
        }
        const bandwidth = normalizeBandwidthInput(body.bandwidth);
        if ('error' in bandwidth) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, bandwidth.error, 400);
            return;
        }
        const product = await prisma.product.create({
            data: {
                provider,
                name,
                cpu: cpu.value,
                memory: memory.value,
                disk: disk.value,
                monthlyTraffic: monthlyTraffic.value,
                bandwidth: bandwidth.value,
                location,
                price: price.value,
                currency,
                reviewUrl: normalizeOptionalString(body.reviewUrl),
                remark: normalizeOptionalString(body.remark),
                affiliateUrl,
            },
        });
        (0, response_1.successResponse)(res, product, 201);
    }
    catch (error) {
        console.error('Add product error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function updateProduct(req, res, _next) {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (Number.isNaN(id)) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
            return;
        }
        const existing = await prisma.product.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
            return;
        }
        const body = req.body;
        const updateData = {};
        if (body.provider !== undefined) {
            const provider = normalizeRequiredString(body.provider);
            if (!provider) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Field provider cannot be empty', 400);
                return;
            }
            updateData.provider = provider;
        }
        if (body.name !== undefined) {
            const name = normalizeRequiredString(body.name);
            if (!name) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Field name cannot be empty', 400);
                return;
            }
            updateData.name = name;
        }
        if (body.cpu !== undefined) {
            const cpu = validateNumberField(body.cpu, 'cpu', { min: 0 });
            if ('error' in cpu) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, cpu.error, 400);
                return;
            }
            updateData.cpu = cpu.value;
        }
        if (body.memory !== undefined) {
            const memory = validateNumberField(body.memory, 'memory', { min: 0 });
            if ('error' in memory) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, memory.error, 400);
                return;
            }
            updateData.memory = memory.value;
        }
        if (body.disk !== undefined) {
            const disk = validateNumberField(body.disk, 'disk', { min: 0 });
            if ('error' in disk) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, disk.error, 400);
                return;
            }
            updateData.disk = disk.value;
        }
        if (body.location !== undefined) {
            const location = normalizeRequiredString(body.location);
            if (!location) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Field location cannot be empty', 400);
                return;
            }
            updateData.location = location;
        }
        if (body.price !== undefined) {
            const price = validateNumberField(body.price, 'price', { min: 0, allowZero: true });
            if ('error' in price) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, price.error, 400);
                return;
            }
            updateData.price = price.value;
        }
        if (body.currency !== undefined) {
            const currency = normalizeRequiredString(body.currency).toUpperCase();
            if (!/^[A-Z]{3}$/.test(currency)) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
                return;
            }
            updateData.currency = currency;
        }
        if (body.reviewUrl !== undefined) {
            updateData.reviewUrl = normalizeOptionalString(body.reviewUrl);
        }
        if (body.remark !== undefined) {
            updateData.remark = normalizeOptionalString(body.remark);
        }
        if (body.affiliateUrl !== undefined) {
            const affiliateUrl = normalizeRequiredString(body.affiliateUrl);
            if (!affiliateUrl) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Field affiliateUrl cannot be empty', 400);
                return;
            }
            updateData.affiliateUrl = affiliateUrl;
        }
        if (body.monthlyTraffic !== undefined) {
            const monthlyTraffic = normalizeTrafficInput(body.monthlyTraffic);
            if ('error' in monthlyTraffic) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, monthlyTraffic.error, 400);
                return;
            }
            updateData.monthlyTraffic = monthlyTraffic.value;
        }
        if (body.bandwidth !== undefined) {
            const bandwidth = normalizeBandwidthInput(body.bandwidth);
            if ('error' in bandwidth) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, bandwidth.error, 400);
                return;
            }
            updateData.bandwidth = bandwidth.value;
        }
        if (Object.keys(updateData).length === 0) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'No valid fields were provided for update', 400);
            return;
        }
        const product = await prisma.product.update({
            where: { id },
            data: updateData,
        });
        (0, response_1.successResponse)(res, product);
    }
    catch (error) {
        console.error('Update product error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function deleteProduct(req, res, _next) {
    try {
        const id = parseInt(String(req.params.id), 10);
        if (Number.isNaN(id)) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
            return;
        }
        const existing = await prisma.product.findUnique({
            where: { id },
        });
        if (!existing) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
            return;
        }
        await prisma.product.update({
            where: { id },
            data: { isDeleted: true },
        });
        (0, response_1.successResponse)(res, { message: 'Product deleted' });
    }
    catch (error) {
        console.error('Delete product error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function getAdminProducts(req, res, _next) {
    try {
        const query = req.query;
        const page = Math.max(1, Number(query.page) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 20));
        const skip = (page - 1) * pageSize;
        const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
        const where = {
            isDeleted: false,
        };
        if (keyword) {
            where.OR = [
                { provider: { contains: keyword } },
                { name: { contains: keyword } },
            ];
        }
        if (query.isDeleted !== undefined) {
            where.isDeleted = query.isDeleted === true || query.isDeleted === 'true';
        }
        const [total, list] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
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
        console.error('Get admin products error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function getAdminConfig(req, res, _next) {
    try {
        const configs = await prisma.systemConfig.findMany({
            orderBy: { id: 'asc' },
        });
        (0, response_1.successResponse)(res, configs);
    }
    catch (error) {
        console.error('Get admin config error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function updateConfig(req, res, _next) {
    try {
        const { configKey, configValue } = req.body;
        const normalizedConfigKey = normalizeRequiredString(configKey);
        if (!normalizedConfigKey) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'configKey is required', 400);
            return;
        }
        const existing = await prisma.systemConfig.findUnique({
            where: { configKey: normalizedConfigKey },
        });
        if (!existing) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.CONFIG_NOT_FOUND, 'Config item not found', 404);
            return;
        }
        try {
            const updated = await prisma.systemConfig.update({
                where: { configKey: normalizedConfigKey },
                data: { configValue: normalizeOptionalString(configValue) ?? '' },
            });
            (0, response_1.successResponse)(res, updated);
        }
        catch {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.CONFIG_UPDATE_FAILED, 'Failed to update config', 500);
        }
    }
    catch (error) {
        console.error('Update config error:', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
//# sourceMappingURL=adminController.js.map