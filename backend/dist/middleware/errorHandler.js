"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * 统一错误处理中间件
 * 捕获所有异常，返回统一格式的 JSON 错误响应
 * 生产环境不暴露堆栈信息
 */
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || statusCode;
    const message = err.message || '服务器内部错误';
    // 生产环境不暴露堆栈信息
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error:', err.stack || err.message);
    }
    res.status(statusCode).json({
        code,
        message: statusCode === 500 && process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : message,
    });
}
//# sourceMappingURL=errorHandler.js.map