"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// GET /api/products — 前端产品列表
router.get('/products', productController_1.getProducts);
// GET /api/providers — 服务商列表（去重）
router.get('/providers', productController_1.getProviders);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map