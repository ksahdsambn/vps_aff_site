import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function login(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function addProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function updateProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function deleteProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function getAdminProducts(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function getAdminConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function updateConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
/**
 * POST /api/admin/logout — 登出当前会话（服务端吊销 token）。
 *
 * 从 Authorization 头解析当前 token 的 jti 与 exp，写入 RevokedToken 表。
 * 即使客户端未清除 localStorage，该 token 在后续请求中也会被 auth 中间件拒绝。
 */
export declare function logout(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=adminController.d.ts.map