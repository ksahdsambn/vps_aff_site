"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
/**
 * 统一成功响应
 * @param res Express Response 对象
 * @param data 响应数据
 * @param statusCode HTTP 状态码，默认 200
 */
function successResponse(res, data, statusCode = 200) {
    res.status(statusCode).json({
        code: 0,
        data,
    });
}
/**
 * 统一错误响应
 * @param res Express Response 对象
 * @param code 业务错误码
 * @param message 错误消息
 * @param statusCode HTTP 状态码，默认 400
 */
function errorResponse(res, code, message, statusCode = 400) {
    res.status(statusCode).json({
        code,
        message,
    });
}
//# sourceMappingURL=response.js.map