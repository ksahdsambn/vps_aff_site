import { Router } from 'express';
import { getProducts, getProviders } from '../controllers/productController';

const router = Router();

// GET /api/products — 前端产品列表
router.get('/products', getProducts);

// GET /api/providers — 服务商列表（去重）
router.get('/providers', getProviders);

export default router;
