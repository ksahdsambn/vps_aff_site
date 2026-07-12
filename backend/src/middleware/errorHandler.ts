import { Request, Response, NextFunction } from 'express';
import { logError } from '../utils/logError';

/**
 * 统一错误处理中间件
 * 捕获所有异常，返回统一格式的 JSON 错误响应
 * 生产环境不暴露堆栈信息
 */
export function errorHandler(
  err: Error & { statusCode?: number; code?: number | string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 仅信任有限的数值 statusCode，防止非数字值（如 Prisma 的字符串 code）污染 HTTP 状态。
  const statusCode =
    typeof err.statusCode === 'number' && Number.isFinite(err.statusCode)
      ? err.statusCode
      : 500;
  // Node/Prisma 错误的 err.code 可能是字符串（如 "P2002"、"ERR_..."），
  // 而响应信封要求 code: number。仅当 err.code 为有限数值时采用，否则回退到 statusCode。
  const code =
    typeof err.code === 'number' && Number.isFinite(err.code)
      ? err.code
      : statusCode;
  const message = err.message || '服务器内部错误';

  // 使用 logError 安全记录（仅 name/code/message，不含堆栈/SQL/参数）。
  logError('Unhandled error', err);

  res.status(statusCode).json({
    code,
    message: statusCode === 500 && process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : message,
  });
}

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

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
