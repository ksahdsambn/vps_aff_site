import { Response } from 'express';

/**
 * 统一成功响应
 * @param res Express Response 对象
 * @param data 响应数据
 * @param statusCode HTTP 状态码，默认 200
 */
export function successResponse(res: Response, data: unknown, statusCode: number = 200): void {
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
export function errorResponse(res: Response, code: number, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({
    code,
    message,
  });
}
