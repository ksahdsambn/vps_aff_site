import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function login(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function addProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function updateProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function deleteProduct(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function getAdminProducts(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function getAdminConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
export declare function updateConfig(req: AuthRequest, res: Response, _next: NextFunction): Promise<void>;
//# sourceMappingURL=adminController.d.ts.map