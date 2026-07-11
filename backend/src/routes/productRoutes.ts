import { Router } from 'express';
import {
  getProducts,
  getProviders,
  getProductById,
  getAllProductIds,
  getProductsByProvider,
} from '../controllers/productController';

const router = Router();

// GET /api/products — 前端产品列表（分页/筛选/排序）
router.get('/products', getProducts);

// GET /api/products/all — 所有产品 ID 列表（generateStaticParams 用）
// 注意：必须在 /:id 路由之前定义，否则 "all" 会被当作 id 参数。
router.get('/products/all', getAllProductIds);

// GET /api/products/:id — 单个产品详情
router.get('/products/:id', getProductById);

// GET /api/providers — 服务商列表（去重）
router.get('/providers', getProviders);

// GET /api/providers/:name/products — 指定服务商的所有产品（聚合页用）
router.get('/providers/:name/products', getProductsByProvider);

export default router;
