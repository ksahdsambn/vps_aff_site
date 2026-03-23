import { Router } from 'express';
import { auth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimiter';
import {
  login,
  addProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  getAdminConfig,
  updateConfig,
} from '../controllers/adminController';

const router = Router();

// POST /api/admin/login — 管理员登录（loginLimiter 保护）
router.post('/login', loginLimiter, login);

// 以下路由均需 JWT 认证
// GET /api/admin/products — 后台产品列表
router.get('/products', auth, getAdminProducts);

// POST /api/admin/products — 添加产品
router.post('/products', auth, addProduct);

// PUT /api/admin/products/:id — 更新产品
router.put('/products/:id', auth, updateProduct);

// DELETE /api/admin/products/:id — 删除产品
router.delete('/products/:id', auth, deleteProduct);

// GET /api/admin/config — 获取配置
router.get('/config', auth, getAdminConfig);

// PUT /api/admin/config — 更新配置
router.put('/config', auth, updateConfig);

export default router;
