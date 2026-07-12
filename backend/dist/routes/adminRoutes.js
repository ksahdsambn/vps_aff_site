"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// POST /api/admin/login — 同时按来源 IP 与用户名限速
router.post('/login', rateLimiter_1.loginIpLimiter, rateLimiter_1.loginUsernameLimiter, adminController_1.login);
// 以下路由均需 JWT 认证
// POST /api/admin/logout — 登出（服务端吊销当前 token）
router.post('/logout', auth_1.auth, adminController_1.logout);
// GET /api/admin/session — 前端路由守卫校验 HttpOnly 会话
router.get('/session', auth_1.auth, adminController_1.getSession);
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