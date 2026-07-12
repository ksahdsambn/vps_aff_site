"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginIpLimiter = exports.loginUsernameLimiter = exports.globalLimiter = void 0;
exports.getClientIp = getClientIp;
exports.getClientIpKey = getClientIpKey;
exports.getLoginUsernameKey = getLoginUsernameKey;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
/**
 * 从 Express 已按 `trust proxy` 规则解析的 req.ip 获取客户端地址。
 *
 * 不手工读取 X-Forwarded-For：该头可由客户端伪造，必须由 Express 根据
 * 明确配置的可信代理跳数解析。生产环境缺失 TRUST_PROXY_HOPS 会在 app 启动时失败。
 */
function getClientIp(req) {
    return req.ip || req.socket.remoteAddress || 'unknown';
}
/** 标准化 IPv6 子网，避免同一 IPv6 客户端通过地址轮换绕过限速。 */
function getClientIpKey(req) {
    return (0, express_rate_limit_1.ipKeyGenerator)(getClientIp(req));
}
/** 登录名统一限速 key，避免变换伪造 IP 后重置同一账号的失败计数。 */
function getLoginUsernameKey(req) {
    const username = typeof req.body?.username === 'string'
        ? req.body.username.trim().toLowerCase().slice(0, 50)
        : '';
    return username || 'anonymous';
}
/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 分钟
    max: 100, // 每 IP 最多 100 次请求
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIpKey,
    message: {
        code: 429,
        message: '请求过于频繁，请稍后再试',
    },
});
/**
 * 登录专用限速器
 *
 * 按用户名限速。与 loginIpLimiter 组合使用，确保伪造或频繁变换 IP 时，
 * 同一管理员账号仍只允许 5 次失败尝试。
 */
exports.loginUsernameLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 5, // 每用户名最多 5 次
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getLoginUsernameKey,
    skipSuccessfulRequests: true,
    message: {
        code: 1002,
        message: '登录失败次数过多，请稍后再试',
    },
});
/** 登录来源限速，防止单一客户端枚举大量用户名。 */
exports.loginIpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientIpKey,
    skipSuccessfulRequests: true,
    message: {
        code: 1002,
        message: '登录失败次数过多，请稍后再试',
    },
});
//# sourceMappingURL=rateLimiter.js.map