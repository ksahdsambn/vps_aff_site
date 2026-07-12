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
 * auth 已验证会话并附带 jti/exp；吊销写入成功后才清除 HttpOnly Cookie。
 */
export declare function logout(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
/** GET /api/admin/session — 验证 HttpOnly 会话 Cookie，供前端路由守卫使用。 */
export declare function getSession(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=adminController.d.ts.map