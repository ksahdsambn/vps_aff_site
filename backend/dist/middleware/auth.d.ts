import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    admin?: {
        adminId: number;
        username: string;
        expiresAt: number;
        jti: string;
    };
}
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
export declare function auth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map