"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 分钟
    max: 100, // 每 IP 最多 100 次请求
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 429,
        message: '请求过于频繁，请稍后再试',
    },
});
/**
 * 登录专用限速器
 * 每 IP 每 15 分钟最多 5 次登录尝试
 */
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 5, // 每 IP 最多 5 次
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 1002,
        message: '登录失败次数过多，请稍后再试',
    },
});
//# sourceMappingURL=rateLimiter.js.map