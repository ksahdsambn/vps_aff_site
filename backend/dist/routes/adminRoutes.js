"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// POST /api/admin/login — 管理员登录（loginLimiter 保护）
router.post('/login', rateLimiter_1.loginLimiter, adminController_1.login);
// 以下路由均需 JWT 认证
// GET /api/admin/products — 后台产品列表
router.get('/products', auth_1.auth, adminController_1.getAdminProducts);
// POST /api/admin/products — 添加产品
router.post('/products', auth_1.auth, adminController_1.addProduct);
// PUT /api/admin/products/:id — 更新产品
router.put('/products/:id', auth_1.auth, adminController_1.updateProduct);
// DELETE /api/admin/products/:id — 删除产品
router.delete('/products/:id', auth_1.auth, adminController_1.deleteProduct);
// GET /api/admin/config — 获取配置
router.get('/config', auth_1.auth, adminController_1.getAdminConfig);
// PUT /api/admin/config — 更新配置
router.put('/config', auth_1.auth, adminController_1.updateConfig);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map