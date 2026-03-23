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
//# sourceMappingURL=errorHandler.d.ts.map