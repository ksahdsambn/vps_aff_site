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
exports.logout = logout;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../utils/db");
const response_1 = require("../utils/response");
const secrets_1 = require("../utils/secrets");
const types_1 = require("../types");
const validators_1 = require("../utils/validators");
const tokenRevocation_1 = require("../utils/tokenRevocation");
const logError_1 = require("../utils/logError");
/**
 * 允许通过 Admin API 更新的配置项 key 白名单。
 * 防止任意 key 被写入（即使数据库中已存在），限制可修改范围。
 */
const ALLOWED_CONFIG_KEYS = new Set([
    'announcement_zh',
    'announcement_en',
    'link_telegram',
    'link_youtube',
    'link_blog',
    'link_x',
    'site_title_zh',
    'site_title_en',
    'site_logo',
]);
/**
 * 值为 URL 的配置项 — 这些 key 的 configValue 必须通过 http(s) 协议校验，
 * 防止 javascript:/data: 等危险协议被存储并渲染为 <a href> / <img src>。
 */
const URL_CONFIG_KEYS = new Set([
    'link_telegram',
    'link_youtube',
    'link_blog',
    'link_x',
    'site_logo',
]);
/**
 * JWT Token 有效期（秒）。30 分钟 = 1800 秒。
 * 使用数字而非字符串（如 '30m'），使前后端契约统一为数字秒数。
 */
const TOKEN_EXPIRES_IN_SECONDS = 1800;
/**
 * 用于抹平登录时序侧信道的占位 bcrypt hash。
 *
 * 当用户名不存在时，原始实现会立即返回（不执行 bcrypt.compare），
 * 而存在用户名时则要跑一次 ~100ms 的 bcrypt 比较 —— 攻击者可据此
 * 通过响应耗时枚举出有效用户名。
 *
 * 改进：每个进程启动时用 crypto.randomBytes 生成一个随机占位密码并异步计算
 * 其 bcrypt hash（cost=10），缓存到 Promise。这样：
 * 1. 不阻塞应用启动（异步生成，首次 login 时 await）。
 * 2. 每次进程重启的 dummy hash 不同（进程唯一），消除固定公开 hash 的理论风险
 *    ——即使某管理员碰巧使用了与旧固定值匹配的密码，也无法被据此区分。
 * 3. 用户不存在时仍 await 一次 bcrypt.compare，使两条分支耗时接近一致。
 */
let dummyHashPromise = null;
function getDummyPasswordHash() {
    if (!dummyHashPromise) {
        const randomPassword = crypto_1.default.randomBytes(32).toString('hex');
        dummyHashPromise = bcryptjs_1.default.hash(randomPassword, 10);
    }
    return dummyHashPromise;
}
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
/**
 * 校验数值字段。
 *
 * @param options.min        下限阈值（默认 0）。
 * @param options.inclusive  min 是否为闭区间（true: parsed >= min；false: parsed > min）。默认 false。
 *
 * 语义说明（使用数学区间术语，消除 allowZero 的歧义）：
 * - `{ min: 0 }`（inclusive 默认 false）          → 要求 parsed > 0，即 (0, +∞)，拒绝 0 和负数。
 * - `{ min: 0, inclusive: true }`                 → 要求 parsed >= 0，即 [0, +∞)，允许 0 但拒绝负数。
 * - `{ min: 1 }`（inclusive 默认 false）          → 要求 parsed > 1，即 (1, +∞)。
 * - `{ min: 1, inclusive: true }`                 → 要求 parsed >= 1，即 [1, +∞)。
 *
 * inclusive 一词来自数学区间（闭区间 [] / 开区间 ()），比 allowZero 更准确——
 * 后者仅在 min=0 时名字合理，当 min 非 0 时名字会产生误导。
 */
function validateNumberField(value, field, options = {}) {
    const parsed = parseFiniteNumber(value);
    if (parsed === null) {
        return { error: `Field ${field} must be a valid number` };
    }
    const min = options.min ?? 0;
    const isValid = options.inclusive ? parsed >= min : parsed > min;
    if (!isValid) {
        const operator = options.inclusive ? '>=' : '>';
        return { error: `Field ${field} must be ${operator} ${min}` };
    }
    return { value: parsed };
}
function normalizeTrafficInput(value) {
    if (typeof value === 'object' && value !== null) {
        const { value: rawValue, unit } = value;
        const parsed = validateNumberField(rawValue, 'monthlyTraffic', { min: 0, inclusive: true });
        if ('error' in parsed) {
            return parsed;
        }
        if (unit !== 'GB' && unit !== 'TB') {
            return { error: 'Field monthlyTraffic must use GB or TB' };
        }
        return { value: unit === 'TB' ? parsed.value * 1000 : parsed.value };
    }
    return validateNumberField(value, 'monthlyTraffic', { min: 0, inclusive: true });
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
        const admin = await db_1.prisma.admin.findUnique({
            where: { username },
        });
        if (!admin) {
            // 用户名不存在时也执行一次 bcrypt 比较，抹平响应时序，防止用户名枚举。
            await bcryptjs_1.default.compare(password, await getDummyPasswordHash());
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
            return;
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isPasswordValid) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
            return;
        }
        const token = jsonwebtoken_1.default.sign({ adminId: admin.id, username: admin.username, jti: (0, tokenRevocation_1.generateJti)() }, (0, secrets_1.getJwtSecret)(), { expiresIn: TOKEN_EXPIRES_IN_SECONDS, algorithm: 'HS256' });
        await db_1.prisma.admin.update({
            where: { id: admin.id },
            data: { lastLoginAt: new Date() },
        });
        (0, response_1.successResponse)(res, {
            token,
            expiresIn: TOKEN_EXPIRES_IN_SECONDS,
        });
    }
    catch (error) {
        (0, logError_1.logError)('Login error', error);
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
        // affiliateUrl 必须为 http/https 协议，防止 javascript:/data: 等危险协议
        if (!(0, validators_1.isSafeHttpUrl)(affiliateUrl)) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'affiliateUrl must be a valid http(s) URL', 400);
            return;
        }
        // reviewUrl 可选，但若提供必须为合法 http(s) URL
        if (!(0, validators_1.isSafeOptionalHttpUrl)(normalizeOptionalString(body.reviewUrl))) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'reviewUrl must be a valid http(s) URL', 400);
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
        const price = validateNumberField(body.price, 'price', { min: 0, inclusive: true });
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
        const product = await db_1.prisma.product.create({
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
        (0, logError_1.logError)('Add product error', error);
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
        const existing = await db_1.prisma.product.findFirst({
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
            const price = validateNumberField(body.price, 'price', { min: 0, inclusive: true });
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
            const reviewUrl = normalizeOptionalString(body.reviewUrl);
            if (!(0, validators_1.isSafeOptionalHttpUrl)(reviewUrl)) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'reviewUrl must be a valid http(s) URL', 400);
                return;
            }
            updateData.reviewUrl = reviewUrl;
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
            if (!(0, validators_1.isSafeHttpUrl)(affiliateUrl)) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'affiliateUrl must be a valid http(s) URL', 400);
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
        const product = await db_1.prisma.product.update({
            where: { id },
            data: updateData,
        });
        (0, response_1.successResponse)(res, product);
    }
    catch (error) {
        (0, logError_1.logError)('Update product error', error);
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
        const existing = await db_1.prisma.product.findUnique({
            where: { id },
        });
        if (!existing) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
            return;
        }
        // 已软删除的产品返回幂等成功消息，避免重复"删除"造成语义混淆
        if (existing.isDeleted) {
            (0, response_1.successResponse)(res, { message: 'Product already deleted' });
            return;
        }
        await db_1.prisma.product.update({
            where: { id },
            data: { isDeleted: true },
        });
        (0, response_1.successResponse)(res, { message: 'Product deleted' });
    }
    catch (error) {
        (0, logError_1.logError)('Delete product error', error);
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
        // Express query 参数恒为字符串（或字符串数组），而类型标注为 boolean。
        // 显式按字符串解析，避免布尔比较恒为 false 的隐式 bug。
        const isDeletedParam = query.isDeleted;
        const isDeleted = isDeletedParam === undefined
            ? false
            : (isDeletedParam === true || isDeletedParam === 'true');
        where.isDeleted = isDeleted;
        const [total, list] = await Promise.all([
            db_1.prisma.product.count({ where }),
            db_1.prisma.product.findMany({
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
        (0, logError_1.logError)('Get admin products error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
async function getAdminConfig(req, res, _next) {
    try {
        const configs = await db_1.prisma.systemConfig.findMany({
            orderBy: { id: 'asc' },
            // 仅返回前端需要的字段，剥离内部元数据（id / description），
            // 避免向后端消费者暴露数据库内部结构（信息暴露收敛）。
            select: { configKey: true, configValue: true },
        });
        (0, response_1.successResponse)(res, configs);
    }
    catch (error) {
        (0, logError_1.logError)('Get admin config error', error);
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
        // 白名单校验：仅允许预定义的配置项被更新
        if (!ALLOWED_CONFIG_KEYS.has(normalizedConfigKey)) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, 'Unknown or disallowed configKey', 400);
            return;
        }
        const normalizedValue = normalizeOptionalString(configValue) ?? '';
        // URL 类配置项必须通过 http(s) 协议校验，防止 javascript:/data: 等危险协议。
        // 此校验在 DB 查询之前执行，确保危险输入在任何 I/O 之前即被拒绝。
        if (URL_CONFIG_KEYS.has(normalizedConfigKey)) {
            if (!(0, validators_1.isSafeOptionalHttpUrl)(normalizedValue)) {
                (0, response_1.errorResponse)(res, types_1.ERROR_CODES.BAD_REQUEST, `${normalizedConfigKey} must be a valid http(s) URL`, 400);
                return;
            }
        }
        const existing = await db_1.prisma.systemConfig.findUnique({
            where: { configKey: normalizedConfigKey },
        });
        if (!existing) {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.CONFIG_NOT_FOUND, 'Config item not found', 404);
            return;
        }
        try {
            const updated = await db_1.prisma.systemConfig.update({
                where: { configKey: normalizedConfigKey },
                data: { configValue: normalizedValue },
            });
            (0, response_1.successResponse)(res, updated);
        }
        catch {
            (0, response_1.errorResponse)(res, types_1.ERROR_CODES.CONFIG_UPDATE_FAILED, 'Failed to update config', 500);
        }
    }
    catch (error) {
        (0, logError_1.logError)('Update config error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
/**
 * POST /api/admin/logout — 登出当前会话（服务端吊销 token）。
 *
 * 从 Authorization 头解析当前 token 的 jti 与 exp，写入 RevokedToken 表。
 * 即使客户端未清除 localStorage，该 token 在后续请求中也会被 auth 中间件拒绝。
 */
async function logout(req, res, _next) {
    try {
        // auth 中间件已校验 token 并将 admin 挂载到 req.admin，但未暴露 jti/exp。
        // 此处从原始 token 重新解码（不验签——中间件已验过），取出 jti 与 exp。
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.decode(token);
                if (decoded?.jti && decoded?.adminId && typeof decoded.exp === 'number') {
                    await (0, tokenRevocation_1.revokeToken)(decoded.jti, decoded.adminId, new Date(decoded.exp * 1000));
                }
            }
            catch {
                // 解码失败不应阻断登出响应（客户端仍会清除本地 token）。
            }
        }
        (0, response_1.successResponse)(res, { message: 'Logged out' });
    }
    catch (error) {
        (0, logError_1.logError)('Logout error', error);
        (0, response_1.errorResponse)(res, types_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
    }
}
//# sourceMappingURL=adminController.js.map