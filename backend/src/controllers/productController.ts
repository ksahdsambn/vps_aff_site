import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { successResponse, errorResponse } from '../utils/response';
import { ERROR_CODES, ProductListQuery } from '../types';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'vps_aff_db',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

const ALLOWED_SORT_FIELDS = ['cpu', 'memory', 'disk', 'monthlyTraffic', 'bandwidth', 'price'];

function normalizeQueryText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized || undefined;
}

export async function getProducts(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as ProductListQuery;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(query.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const providers = normalizeQueryText(query.providers);
    const keyword = normalizeQueryText(query.keyword);
    const location = normalizeQueryText(query.location);
    const sortField = normalizeQueryText(query.sortField);

    const where: Record<string, unknown> = {
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

    let orderBy: Record<string, string> = { createdAt: 'desc' };
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

    successResponse(res, {
      total,
      page,
      pageSize,
      list,
    });
  } catch (error) {
    console.error('Get products error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

export async function getProviders(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: { provider: true },
      distinct: ['provider'],
      orderBy: { provider: 'asc' },
    });

    successResponse(res, products.map((product) => product.provider));
  } catch (error) {
    console.error('Get providers error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}
