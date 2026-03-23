"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = auth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * JWT 认证中间件
 * 从 Authorization: Bearer <token> 提取并验证 Token
 * 验证成功将管理员信息挂载到 req.admin
 * 验证失败返回 401
 */
function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            code: 401,
            message: '未登录或Token缺失',
        });
        return;
    }
    const token = authHeader.substring(7); // 去掉 "Bearer " 前缀
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.admin = {
            adminId: decoded.adminId,
            username: decoded.username,
        };
        next();
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
}
//# sourceMappingURL=auth.js.map