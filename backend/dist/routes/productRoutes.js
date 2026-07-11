"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
// GET /api/products — 前端产品列表（分页/筛选/排序）
router.get('/products', productController_1.getProducts);
// GET /api/products/all — 所有产品 ID 列表（generateStaticParams 用）
// 注意：必须在 /:id 路由之前定义，否则 "all" 会被当作 id 参数。
router.get('/products/all', productController_1.getAllProductIds);
// GET /api/products/:id — 单个产品详情
router.get('/products/:id', productController_1.getProductById);
// GET /api/providers — 服务商列表（去重）
router.get('/providers', productController_1.getProviders);
// GET /api/providers/:name/products — 指定服务商的所有产品（聚合页用）
router.get('/providers/:name/products', productController_1.getProductsByProvider);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map