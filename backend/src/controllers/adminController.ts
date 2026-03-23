import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import {
  ERROR_CODES,
  ProductCreateInput,
  AdminProductListQuery,
  ConfigUpdateInput,
} from '../types';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vps_aff_db',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

function normalizeRequiredString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function validateNumberField(
  value: unknown,
  field: string,
  options: { min?: number; allowZero?: boolean } = {},
): { value: number } | { error: string } {
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

function normalizeTrafficInput(value: unknown): { value: number } | { error: string } {
  if (typeof value === 'object' && value !== null) {
    const { value: rawValue, unit } = value as { value?: unknown; unit?: unknown };
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

function normalizeBandwidthInput(value: unknown): { value: number } | { error: string } {
  if (typeof value === 'object' && value !== null) {
    const { value: rawValue, unit } = value as { value?: unknown; unit?: unknown };
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

export async function login(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const username = normalizeRequiredString(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Username and password are required', 400);
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      errorResponse(res, ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      errorResponse(res, ERROR_CODES.LOGIN_FAILED, 'Invalid username or password', 401);
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      jwtSecret,
      { expiresIn: '30m' },
    );

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    successResponse(res, {
      token,
      expiresIn: '30m',
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function addProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const body: ProductCreateInput = req.body;
    const provider = normalizeRequiredString(body.provider);
    const name = normalizeRequiredString(body.name);
    const location = normalizeRequiredString(body.location);
    const affiliateUrl = normalizeRequiredString(body.affiliateUrl);
    const currency = normalizeRequiredString(body.currency).toUpperCase();

    if (!provider || !name || !location || !affiliateUrl) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Required text fields cannot be empty', 400);
      return;
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
      return;
    }

    const cpu = validateNumberField(body.cpu, 'cpu', { min: 0 });
    if ('error' in cpu) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, cpu.error, 400);
      return;
    }

    const memory = validateNumberField(body.memory, 'memory', { min: 0 });
    if ('error' in memory) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, memory.error, 400);
      return;
    }

    const disk = validateNumberField(body.disk, 'disk', { min: 0 });
    if ('error' in disk) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, disk.error, 400);
      return;
    }

    const price = validateNumberField(body.price, 'price', { min: 0, allowZero: true });
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

    successResponse(res, product, 201);
  } catch (error) {
    console.error('Add product error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
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
      const provider = normalizeRequiredString(body.provider);
      if (!provider) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Field provider cannot be empty', 400);
        return;
      }
      updateData.provider = provider;
    }

    if (body.name !== undefined) {
      const name = normalizeRequiredString(body.name);
      if (!name) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Field name cannot be empty', 400);
        return;
      }
      updateData.name = name;
    }

    if (body.cpu !== undefined) {
      const cpu = validateNumberField(body.cpu, 'cpu', { min: 0 });
      if ('error' in cpu) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, cpu.error, 400);
        return;
      }
      updateData.cpu = cpu.value;
    }

    if (body.memory !== undefined) {
      const memory = validateNumberField(body.memory, 'memory', { min: 0 });
      if ('error' in memory) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, memory.error, 400);
        return;
      }
      updateData.memory = memory.value;
    }

    if (body.disk !== undefined) {
      const disk = validateNumberField(body.disk, 'disk', { min: 0 });
      if ('error' in disk) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, disk.error, 400);
        return;
      }
      updateData.disk = disk.value;
    }

    if (body.location !== undefined) {
      const location = normalizeRequiredString(body.location);
      if (!location) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Field location cannot be empty', 400);
        return;
      }
      updateData.location = location;
    }

    if (body.price !== undefined) {
      const price = validateNumberField(body.price, 'price', { min: 0, allowZero: true });
      if ('error' in price) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, price.error, 400);
        return;
      }
      updateData.price = price.value;
    }

    if (body.currency !== undefined) {
      const currency = normalizeRequiredString(body.currency).toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Currency code must be a 3-letter ISO code', 400);
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
        errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Field affiliateUrl cannot be empty', 400);
        return;
      }
      updateData.affiliateUrl = affiliateUrl;
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
    console.error('Update product error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
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

    await prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    successResponse(res, { message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
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

    if (query.isDeleted !== undefined) {
      where.isDeleted = query.isDeleted === true || query.isDeleted === ('true' as unknown as boolean);
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

    successResponse(res, {
      total,
      page,
      pageSize,
      list,
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function getAdminConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { id: 'asc' },
    });

    successResponse(res, configs);
  } catch (error) {
    console.error('Get admin config error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function updateConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void> {
  try {
    const { configKey, configValue }: ConfigUpdateInput = req.body;
    const normalizedConfigKey = normalizeRequiredString(configKey);

    if (!normalizedConfigKey) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'configKey is required', 400);
      return;
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
        data: { configValue: normalizeOptionalString(configValue) ?? '' },
      });

      successResponse(res, updated);
    } catch {
      errorResponse(res, ERROR_CODES.CONFIG_UPDATE_FAILED, 'Failed to update config', 500);
    }
  } catch (error) {
    console.error('Update config error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}
