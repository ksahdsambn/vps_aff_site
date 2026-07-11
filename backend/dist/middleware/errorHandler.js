"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const logError_1 = require("../utils/logError");
/**
 * 统一错误处理中间件
 * 捕获所有异常，返回统一格式的 JSON 错误响应
 * 生产环境不暴露堆栈信息
 */
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || statusCode;
    const message = err.message || '服务器内部错误';
    // 使用 logError 安全记录（仅 name/code/message，不含堆栈/SQL/参数）。
    (0, logError_1.logError)('Unhandled error', err);
    res.status(statusCode).json({
        code,
        message: statusCode === 500 && process.env.NODE_ENV === 'production'
            ? '服务器内部错误'
            : message,
    });
}
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map