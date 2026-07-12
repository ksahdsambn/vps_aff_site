"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../utils/secrets");
const tokenRevocation_1 = require("../utils/tokenRevocation");
const db_1 = require("../utils/db");
const sessionCookie_1 = require("../utils/sessionCookie");
const logError_1 = require("../utils/logError");
/**
 * JWT 认证中间件
 * 从 HttpOnly session Cookie（或显式 Bearer token）提取并验证 Token
 * 验证成功将管理员信息挂载到 req.admin
 * 验证失败返回 401
 *
 * 校验流程：
 * 1. 提取会话 token
 * 2. jwt.verify 验证签名 + 过期（显式限定 HS256）
 * 3. 查询 RevokedToken 表，确认该 token 未被服务端吊销（logout / 强制下线）
 */
async function auth(req, res, next) {
    const token = (0, sessionCookie_1.getAdminSessionToken)(req);
    if (!token) {
        res.status(401).json({
            code: 401,
            message: '未登录或Token缺失',
        });
        return;
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, (0, secrets_1.getJwtSecret)(), { algorithms: ['HS256'] });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                code: 401,
                message: 'Token已过期，请重新登录',
            });
            return;
        }
        res.status(401).json({
            code: 401,
            message: 'Token无效',
        });
        return;
    }
    // 所有新会话必须带 jti/exp，缺失的旧 token 不能绕过服务端吊销机制。
    if (!decoded.jti || !decoded.exp) {
        res.status(401).json({ code: 401, message: 'Token无效' });
        return;
    }
    // 服务端吊销校验：依赖不可用时拒绝认证，绝不降级放行。
    try {
        if (await (0, tokenRevocation_1.isTokenRevoked)(decoded.jti)) {
            res.status(401).json({
                code: 401,
                message: '会话已失效，请重新登录',
            });
            return;
        }
    }
    catch (error) {
        (0, logError_1.logError)('[security] Token revocation check failed', error);
        res.status(503).json({ code: 503, message: '认证服务暂不可用，请稍后再试' });
        return;
    }
    // 管理员存在性校验：确认 token 中的 adminId 仍对应一个有效账号。
    // 防止已删除/禁用的管理员凭旧 token 继续访问。
    try {
        const admin = await db_1.prisma.admin.findUnique({
            where: { id: decoded.adminId },
            select: { id: true },
        });
        if (!admin) {
            res.status(401).json({
                code: 401,
                message: '账号不存在，请重新登录',
            });
            return;
        }
    }
    catch (error) {
        (0, logError_1.logError)('[security] Admin account check failed', error);
        res.status(503).json({ code: 503, message: '认证服务暂不可用，请稍后再试' });
        return;
    }
    req.admin = {
        adminId: decoded.adminId,
        username: decoded.username,
        expiresAt: decoded.exp * 1000,
        jti: decoded.jti,
    };
    next();
}
//# sourceMappingURL=auth.js.map