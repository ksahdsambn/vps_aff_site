"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const configController_1 = require("../controllers/configController");
const router = (0, express_1.Router)();
// GET /api/config — 前端系统配置
router.get('/config', configController_1.getConfig);
exports.default = router;
//# sourceMappingURL=configRoutes.js.map