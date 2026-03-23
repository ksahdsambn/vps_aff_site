"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const configRoutes_1 = __importDefault(require("./routes/configRoutes"));
const app = (0, express_1.default)();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowAnyOrigin = allowedOrigins.includes('*');
app.set('trust proxy', 1);
// 1. 安全头
app.use((0, helmet_1.default)());
// 2. 跨域配置
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin || allowAnyOrigin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));
// 3. gzip 压缩
app.use((0, compression_1.default)());
// 4. JSON 解析，限制 body 大小 10mb
app.use(express_1.default.json({ limit: '10mb' }));
// 5. 全局速率限制
app.use(rateLimiter_1.globalLimiter);
// 6. 路由挂载
// 前端 API 路由
app.use('/api', productRoutes_1.default);
app.use('/api', configRoutes_1.default);
// 后台管理 API 路由
app.use('/api/admin', adminRoutes_1.default);
// 7. 404 处理 — 未匹配的路由返回 JSON 格式的 404
app.use((_req, res) => {
    res.status(404).json({
        code: 404,
        message: '资源不存在',
    });
});
// 8. 统一错误处理中间件（放在最后）
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map