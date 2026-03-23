import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    admin?: {
        adminId: number;
        username: string;
    };
}
/**
 * JWT 认证中间件
 * 从 Authorization: Bearer <token> 提取并验证 Token
 * 验证成功将管理员信息挂载到 req.admin
 * 验证失败返回 401
 */
export declare function auth(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map