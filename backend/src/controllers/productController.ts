import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { successResponse, errorResponse } from '../utils/response';
import { ERROR_CODES, ProductListQuery } from '../types';
import { logError } from '../utils/logError';
import { parseStrictPositiveId } from '../utils/productValidation';

const ALLOWED_SORT_FIELDS = ['cpu', 'memory', 'disk', 'monthlyTraffic', 'bandwidth', 'price'];

/**
 * 公共产品查询统一排除的字段。
 *
 * `affiliateUrl` 是商家真实推广链接（B 域名），仅在 `/api/go/:id` 跳转端点按需返回。
 * 公共列表/详情/服务商聚合接口剥离该字段，避免前端 HTML 虽经 /go/ 中转隐藏了 URL，
 * 但通过 F12 抓取 /api/products 的 JSON 响应仍可批量采集真实推广域名。
 * admin 接口（adminController）不受此限制，后台编辑仍需回填该字段。
 */
const PUBLIC_PRODUCT_OMIT = { omit: { affiliateUrl: true } } as const;

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
        ...PUBLIC_PRODUCT_OMIT,
      }),
    ]);

    successResponse(res, {
      total,
      page,
      pageSize,
      list,
    });
  } catch (error) {
    logError('Get products error', error);
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
    logError('Get providers error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * GET /api/products/all — 返回所有未删除产品的 ID + updatedAt 列表。
 * 用于前端 generateStaticParams（取 id）和 sitemap lastmod（取 updatedAt）。
 * 仅返回 id 与 updatedAt，体积小。
 *
 * 安全上限：take 限制为 10000，防止极端数据量下无限制查询耗尽资源。
 */
export async function getAllProductIds(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      select: { id: true, updatedAt: true },
      orderBy: { id: 'asc' },
      take: 10000,
    });

    successResponse(res, products.map((p) => ({ id: p.id, updatedAt: p.updatedAt })));
  } catch (error) {
    logError('Get all product ids error', error);
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
    const id = parseStrictPositiveId(rawId);
    if (id === null) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
      return;
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      ...PUBLIC_PRODUCT_OMIT,
    });

    if (!product) {
      errorResponse(res, ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      return;
    }

    successResponse(res, product);
  } catch (error) {
    logError('Get product by id error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * GET /api/providers/:name/products — 返回指定服务商的所有产品（聚合页用）。
 *
 * 安全上限：take 限制为 200，防止单服务商产品过多时无限制查询耗尽资源。
 * 该接口为聚合页展示用，200 条足以覆盖实际场景。
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
      take: 200,
      ...PUBLIC_PRODUCT_OMIT,
    });

    successResponse(res, list);
  } catch (error) {
    logError('Get products by provider error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}

/**
 * GET /api/go/:id — 推广链接中转端点。
 *
 * 仅返回 { id, affiliateUrl }，供前端 /go/[id] 跳转路由服务端查询真实商家推广 URL。
 * 这是 affiliateUrl 从公共产品接口剥离后，唯一获取该字段的入口（admin 接口除外）。
 *
 * 设计权衡：
 * - 不在公共 API 文档宣传此端点；但它本身是公开只读接口（无敏感数据泄露之外的风险），
 *   仅用于"按单条 id 查推广地址"。即使被逐个枚举，也只能一条条拿，无法批量采集
 *   （对比 /api/products 一次返回 50 条 affiliateUrl）。
 * - 商品不存在/已软删除 → 404（业务码 PRODUCT_NOT_FOUND），与 getProductById 一致。
 */
export async function getAffiliateTarget(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseStrictPositiveId(rawId);
    if (id === null) {
      errorResponse(res, ERROR_CODES.BAD_REQUEST, 'Invalid product id', 400);
      return;
    }

    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, affiliateUrl: true },
    });

    if (!product) {
      errorResponse(res, ERROR_CODES.PRODUCT_NOT_FOUND, 'Product not found', 404);
      return;
    }

    successResponse(res, product);
  } catch (error) {
    logError('Get affiliate target error', error);
    errorResponse(res, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', 500);
  }
}
