import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../utils/db';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { getJwtSecret } from '../utils/secrets';
import {
  ERROR_CODES,
  ProductCreateInput,
  AdminProductListQuery,
  ConfigUpdateInput,
} from '../types';
import { isSafeHttpUrl, isSafeOptionalHttpUrl } from '../utils/validators';
import { generateJti, revokeToken } from '../utils/tokenRevocation';
import { logError } from '../utils/logError';
import { ADMIN_SESSION_COOKIE, adminSessionCookieOptions } from '../utils/sessionCookie';
import {
  PRODUCT_LIMITS,
  parseStrictPositiveId,
  validateOptionalText,
  validateProductNumber,
  validateRequiredText,
} from '../utils/productValidation';

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
let dummyHashPromise: Promise<string> | null = null;

function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    dummyHashPromise = bcrypt.hash(randomPassword, 10);
  }
  return dummyHashPromise;
}

function normalizeTrafficInput(value: unknown): { value: number } | { error: string } {
  if (typeof value === 'object' && value !== null) {
    const { value: rawValue, unit } = value as { value?: unknown; unit?: unknown };
    const parsed = validateProductNumber(rawValue, 'monthlyTraffic', { min: 0, inclusive: true, max: PRODUCT_LIMITS.capacity });
    if ('error' in parsed) {
      return parsed;
    }

    if (unit !== 'GB' && unit !== 'TB') {
      return { error: 'Field monthlyTraffic must use GB or TB' };
    }

    const normalized = unit === 'TB' ? parsed.value * 1000 : parsed.value;
    return normalized <= PRODUCT_LIMITS.capacity
      ? { value: normalized }
      : { error: `Field monthlyTraffic must be at most ${PRODUCT_LIMITS.capacity}` };
  }

  return validateProductNumber(value, 'monthlyTraffic', { min: 0, inclusive: true, max: PRODUCT_LIMITS.capacity });
}

function normalizeBandwidthInput(value: unknown): { value: number } | { error: string } {
  if (typeof value === 'object' && value !== null) {
    const { value: rawValue, unit } = value as { value?: unknown; unit?: unknown };
    const parsed = validateProductNumber(rawValue, 'bandwidth', { min: 0, max: PRODUCT_LIMITS.capacity });
    if ('error' in parsed) {
      return parsed;
    }

    if (unit !== 'Mbps' && unit !== 'Gbps') {
      return { error: 'Field bandwidth must use Mbps or Gbps' };
    }

    const normalized = unit === 'Gbps' ? parsed.value * 1000 : parsed.value;
    return normalized <= PRODUCT_LIMITS.capacity
      ? { value: normalized }
      : { error: `Field bandwidth must be at most ${PRODUCT_LIMITS.capacity}` };
  }

  return validateProductNumber(value, 'bandwidth', { min: 0, max: PRODUCT_LIMITS.capacity });
}

export async function login(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Username and password are required', 400);
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      // 用户名不存在时也执行一次 bcrypt 比较，抹平响应时序，防止用户名枚举。
      await bcrypt.compare(password, await getDummyPasswordHash());
      errorResponse(res, ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      errorResponse(res, ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
      return;
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, jti: generateJti() },
      getJwtSecret(),
      { expiresIn: TOKEN_EXPIRES_IN_SECONDS, algorithm: 'HS256' },
    );

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    res.cookie(ADMIN_SESSION_COOKIE, token, {
      ...adminSessionCookieOptions,
      maxAge: TOKEN_EXPIRES_IN_SECONDS * 1000,
    });
    successResponse(res, { expiresIn: TOKEN_EXPIRES_IN_SECONDS });
  } catch (error) {
    logError('Login error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function addProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const body: ProductCreateInput = req.body;
    const provider = validateRequiredText(body.provider, 'provider', PRODUCT_LIMITS.provider);
    const name = validateRequiredText(body.name, 'name', PRODUCT_LIMITS.name);
    const location = validateRequiredText(body.location, 'location', PRODUCT_LIMITS.location);
    const affiliateUrl = validateRequiredText(body.affiliateUrl, 'affiliateUrl', PRODUCT_LIMITS.url);
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';

    if ('error' in provider) { errorResponse(res, ERROR_CODES.BAD_REQUEST, provider.error, 400); return; }
    if ('error' in name) { errorResponse(res, ERROR_CODES.BAD_REQUEST, name.error, 400); return; }
    if ('error' in location) { errorResponse(res, ERROR_CODES.BAD_REQUEST, location.error, 400); return; }
    if ('error' in affiliateUrl) { errorResponse(res, ERROR_CODES.BAD_REQUEST, affiliateUrl.error, 400); return; }

    if (!/^[A-Z]{3}$/.test(currency)) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
      return;
    }

    // affiliateUrl 必须为 http/https 协议，防止 javascript:/data: 等危险协议
    if (!isSafeHttpUrl(affiliateUrl.value)) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'affiliateUrl must be a valid http(s) URL', 400);
      return;
    }

    // reviewUrl 可选，但若提供必须为合法 http(s) URL
    const reviewUrl = validateOptionalText(body.reviewUrl, 'reviewUrl', PRODUCT_LIMITS.url);
    const remark = validateOptionalText(body.remark, 'remark', PRODUCT_LIMITS.remark);
    if ('error' in reviewUrl) { errorResponse(res, ERROR_CODES.BAD_REQUEST, reviewUrl.error, 400); return; }
    if ('error' in remark) { errorResponse(res, ERROR_CODES.BAD_REQUEST, remark.error, 400); return; }
    if (!isSafeOptionalHttpUrl(reviewUrl.value)) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'reviewUrl must be a valid http(s) URL', 400);
      return;
    }

    const cpu = validateProductNumber(body.cpu, 'cpu', { min: 0, integer: true, max: PRODUCT_LIMITS.cpu });
    if ('error' in cpu) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, cpu.error, 400);
      return;
    }

    const memory = validateProductNumber(body.memory, 'memory', { min: 0, max: PRODUCT_LIMITS.capacity });
    if ('error' in memory) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, memory.error, 400);
      return;
    }

    const disk = validateProductNumber(body.disk, 'disk', { min: 0, max: PRODUCT_LIMITS.capacity });
    if ('error' in disk) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, disk.error, 400);
      return;
    }

    const price = validateProductNumber(body.price, 'price', { min: 0, inclusive: true, max: PRODUCT_LIMITS.price, decimalPlaces: 2 });
    if ('error' in price) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, price.error, 400);
      return;
    }

    const monthlyTraffic = normalizeTrafficInput(body.monthlyTraffic);
    if ('error' in monthlyTraffic) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, monthlyTraffic.error, 400);
      return;
    }

    const bandwidth = normalizeBandwidthInput(body.bandwidth);
    if ('error' in bandwidth) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, bandwidth.error, 400);
      return;
    }

    const product = await prisma.product.create({
      data: {
        provider: provider.value,
        name: name.value,
        cpu: cpu.value,
        memory: memory.value,
        disk: disk.value,
        monthlyTraffic: monthlyTraffic.value,
        bandwidth: bandwidth.value,
        location: location.value,
        price: price.value,
        currency,
        reviewUrl: reviewUrl.value,
        remark: remark.value,
        affiliateUrl: affiliateUrl.value,
      },
    });

    successResponse(res, product, 201);
  } catch (error) {
    logError('Add product error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const id = parseStrictPositiveId(req.params.id);
    if (id === null) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
      return;
    }

    const existing = await prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      errorResponse(res, ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      return;
    }

    const body: ProductCreateInput = req.body;
    const updateData: Record<string, unknown> = {};

    if (body.provider !== undefined) {
      const provider = validateRequiredText(body.provider, 'provider', PRODUCT_LIMITS.provider);
      if ('error' in provider) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, provider.error, 400);
        return;
      }
      updateData.provider = provider.value;
    }

    if (body.name !== undefined) {
      const name = validateRequiredText(body.name, 'name', PRODUCT_LIMITS.name);
      if ('error' in name) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, name.error, 400);
        return;
      }
      updateData.name = name.value;
    }

    if (body.cpu !== undefined) {
      const cpu = validateProductNumber(body.cpu, 'cpu', { min: 0, integer: true, max: PRODUCT_LIMITS.cpu });
      if ('error' in cpu) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, cpu.error, 400);
        return;
      }
      updateData.cpu = cpu.value;
    }

    if (body.memory !== undefined) {
      const memory = validateProductNumber(body.memory, 'memory', { min: 0, max: PRODUCT_LIMITS.capacity });
      if ('error' in memory) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, memory.error, 400);
        return;
      }
      updateData.memory = memory.value;
    }

    if (body.disk !== undefined) {
      const disk = validateProductNumber(body.disk, 'disk', { min: 0, max: PRODUCT_LIMITS.capacity });
      if ('error' in disk) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, disk.error, 400);
        return;
      }
      updateData.disk = disk.value;
    }

    if (body.location !== undefined) {
      const location = validateRequiredText(body.location, 'location', PRODUCT_LIMITS.location);
      if ('error' in location) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, location.error, 400);
        return;
      }
      updateData.location = location.value;
    }

    if (body.price !== undefined) {
      const price = validateProductNumber(body.price, 'price', { min: 0, inclusive: true, max: PRODUCT_LIMITS.price, decimalPlaces: 2 });
      if ('error' in price) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, price.error, 400);
        return;
      }
      updateData.price = price.value;
    }

    if (body.currency !== undefined) {
      const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
      if (!/^[A-Z]{3}$/.test(currency)) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
        return;
      }
      updateData.currency = currency;
    }

    if (body.reviewUrl !== undefined) {
      const reviewUrl = validateOptionalText(body.reviewUrl, 'reviewUrl', PRODUCT_LIMITS.url);
      if ('error' in reviewUrl || !isSafeOptionalHttpUrl(reviewUrl.value)) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'reviewUrl must be a valid http(s) URL', 400);
        return;
      }
      updateData.reviewUrl = reviewUrl.value;
    }

    if (body.remark !== undefined) {
      const remark = validateOptionalText(body.remark, 'remark', PRODUCT_LIMITS.remark);
      if ('error' in remark) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, remark.error, 400);
        return;
      }
      updateData.remark = remark.value;
    }

    if (body.affiliateUrl !== undefined) {
      const affiliateUrl = validateRequiredText(body.affiliateUrl, 'affiliateUrl', PRODUCT_LIMITS.url);
      if ('error' in affiliateUrl) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, affiliateUrl.error, 400);
        return;
      }
      if (!isSafeHttpUrl(affiliateUrl.value)) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'affiliateUrl must be a valid http(s) URL', 400);
        return;
      }
      updateData.affiliateUrl = affiliateUrl.value;
    }

    if (body.monthlyTraffic !== undefined) {
      const monthlyTraffic = normalizeTrafficInput(body.monthlyTraffic);
      if ('error' in monthlyTraffic) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, monthlyTraffic.error, 400);
        return;
      }
      updateData.monthlyTraffic = monthlyTraffic.value;
    }

    if (body.bandwidth !== undefined) {
      const bandwidth = normalizeBandwidthInput(body.bandwidth);
      if ('error' in bandwidth) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, bandwidth.error, 400);
        return;
      }
      updateData.bandwidth = bandwidth.value;
    }

    if (Object.keys(updateData).length === 0) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'No valid fields were provided for update', 400);
      return;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    successResponse(res, product);
  } catch (error) {
    logError('Update product error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const id = parseStrictPositiveId(req.params.id);
    if (id === null) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
      return;
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      errorResponse(res, ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      return;
    }

    // 已软删除的产品返回幂等成功消息，避免重复"删除"造成语义混淆
    if (existing.isDeleted) {
      successResponse(res, { message: 'Product already deleted' });
      return;
    }

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    successResponse(res, { message: 'Product deleted' });
  } catch (error) {
    logError('Delete product error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function getAdminProducts(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const query: AdminProductListQuery = req.query as unknown as AdminProductListQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';

    const where: Record<string, unknown> = {
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
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    successResponse(res, {
      total,
      page,
      pageSize,
      list,
    });
  } catch (error) {
    logError('Get admin products error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function getAdminConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { id: 'asc' },
      // 仅返回前端需要的字段，剥离内部元数据（id / description），
      // 避免向后端消费者暴露数据库内部结构（信息暴露收敛）。
      select: { configKey: true, configValue: true },
    });

    successResponse(res, configs);
  } catch (error) {
    logError('Get admin config error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function updateConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const { configKey, configValue }: ConfigUpdateInput = req.body;
    const normalizedConfigKey = typeof configKey === 'string' ? configKey.trim() : '';

    if (!normalizedConfigKey) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'configKey is required', 400);
      return;
    }

    // 白名单校验：仅允许预定义的配置项被更新
    if (!ALLOWED_CONFIG_KEYS.has(normalizedConfigKey)) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Unknown or disallowed configKey', 400);
      return;
    }

    const normalizedValue = typeof configValue === 'string' ? configValue.trim() : '';

    // URL 类配置项必须通过 http(s) 协议校验，防止 javascript:/data: 等危险协议。
    // 此校验在 DB 查询之前执行，确保危险输入在任何 I/O 之前即被拒绝。
    if (URL_CONFIG_KEYS.has(normalizedConfigKey)) {
      if (!isSafeOptionalHttpUrl(normalizedValue)) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, `${normalizedConfigKey} must be a valid http(s) URL`, 400);
        return;
      }
    }

    const existing = await prisma.systemConfig.findUnique({
      where: { configKey: normalizedConfigKey },
    });

    if (!existing) {
      errorResponse(res, ERROR_CODES.CONFIG_NOT_FOUND, 'Config item not found', 404);
      return;
    }

    try {
      const updated = await prisma.systemConfig.update({
        where: { configKey: normalizedConfigKey },
        data: { configValue: normalizedValue },
      });

      successResponse(res, updated);
    } catch {
      errorResponse(res, ERROR_CODES.CONFIG_UPDATE_FAILED, 'Failed to update config', 500);
    }
  } catch (error) {
    logError('Update config error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * POST /api/admin/logout — 登出当前会话（服务端吊销 token）。
 *
 * auth 已验证会话并附带 jti/exp；吊销写入成功后才清除 HttpOnly Cookie。
 */
export async function logout(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    if (!req.admin) {
      errorResponse(res, ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401);
      return;
    }

    await revokeToken(req.admin.jti, req.admin.adminId, new Date(req.admin.expiresAt));

    res.clearCookie(ADMIN_SESSION_COOKIE, adminSessionCookieOptions);
    successResponse(res, { message: 'Logged out' });
  } catch (error) {
    logError('Logout error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, '认证服务暂不可用，请稍后再试', 503);
  }
}

/** GET /api/admin/session — 验证 HttpOnly 会话 Cookie，供前端路由守卫使用。 */
export async function getSession(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  successResponse(res, { expiresAt: req.admin?.expiresAt ?? 0 });
}
