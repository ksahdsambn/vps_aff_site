import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { successResponse, errorResponse } from '../utils/response';
import { ERROR_CODES, ProductListQuery } from '../types';

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

/**
 * GET /api/products/all — 返回所有未删除产品的 ID + updatedAt 列表。
 * 用于前端 generateStaticParams（取 id）和 sitemap lastmod（取 updatedAt）。
 * 仅返回 id 与 updatedAt，体积小。
 */
export async function getAllProductIds(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, updatedAt: true },
      orderBy: { id: 'asc' },
    });

    successResponse(res, products.map((p) => ({ id: p.id, updatedAt: p.updatedAt })));
  } catch (error) {
    console.error('Get all product ids error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * GET /api/products/:id — 返回单个产品详情。
 * 不存在或已软删除时返回 404。
 */
export async function getProductById(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    // 使用 parseInt(id, 10) 而非 Number()，避免 Number("0x10")=16 等
    // 非十进制字面量被接受（URL 路径参数语义上应为十进制）。
    const id = parseInt(rawId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
      return;
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
    });

    if (!product) {
      errorResponse(res, ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      return;
    }

    successResponse(res, product);
  } catch (error) {
    console.error('Get product by id error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * GET /api/providers/:name/products — 返回指定服务商的所有产品（聚合页用）。
 */
export async function getProductsByProvider(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const providerName = Array.isArray(req.params.name) ? req.params.name[0] : req.params.name;
    if (!providerName) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Provider name is required', 400);
      return;
    }

    const list = await prisma.product.findMany({
      where: { provider: providerName, isDeleted: false },
      orderBy: { price: 'asc' },
    });

    successResponse(res, list);
  } catch (error) {
    console.error('Get products by provider error:', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}
