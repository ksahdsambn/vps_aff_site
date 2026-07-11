import { Request, Response, NextFunction } from 'express';
export declare function getProducts(req: Request, res: Response, _next: NextFunction): Promise<void>;
export declare function getProviders(_req: Request, res: Response, _next: NextFunction): Promise<void>;
/**
 * GET /api/products/all — 返回所有未删除产品的 ID + updatedAt 列表。
 * 用于前端 generateStaticParams（取 id）和 sitemap lastmod（取 updatedAt）。
 * 仅返回 id 与 updatedAt，体积小。
 *
 * 安全上限：take 限制为 10000，防止极端数据量下无限制查询耗尽资源。
 */
export declare function getAllProductIds(_req: Request, res: Response, _next: NextFunction): Promise<void>;
/**
 * GET /api/products/:id — 返回单个产品详情。
 * 不存在或已软删除时返回 404。
 */
export declare function getProductById(req: Request, res: Response, _next: NextFunction): Promise<void>;
/**
 * GET /api/providers/:name/products — 返回指定服务商的所有产品（聚合页用）。
 *
 * 安全上限：take 限制为 200，防止单服务商产品过多时无限制查询耗尽资源。
 * 该接口为聚合页展示用，200 条足以覆盖实际场景。
 */
export declare function getProductsByProvider(req: Request, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=productController.d.ts.map