import { Request, Response, NextFunction } from 'express';
/**
 * 统一错误处理中间件
 * 捕获所有异常，返回统一格式的 JSON 错误响应
 * 生产环境不暴露堆栈信息
 */
export declare function errorHandler(err: Error & {
    statusCode?: number;
    code?: number;
}, _req: Request, res: Response, _next: NextFunction): void;
/**
 * async 路由处理器包装器。
 *
 * Express 5 已原生支持将 async handler 的 rejected promise 转发给 errorHandler，
 * 但为防止未来新增的 controller 遗漏 try/catch（或误用 Express 4 风格），
 * 此包装器确保任何未捕获的 rejection 都会被 next(error) 传递给错误中间件。
 *
 * 用法：
 *   router.get('/x', asyncHandler(async (req, res) => { ... }));
 */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function asyncHandler(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map