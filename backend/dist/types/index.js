"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = void 0;
// ============================
// 业务错误码常量
// ============================
exports.ERROR_CODES = {
    // 通用错误
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
    // 业务错误
    LOGIN_FAILED: 1001, // 用户名或密码错误
    LOGIN_RATE_LIMIT: 1002, // 登录失败次数过多
    PRODUCT_NOT_FOUND: 2001, // 产品不存在
    CONFIG_NOT_FOUND: 3001, // 配置项不存在
    CONFIG_UPDATE_FAILED: 3002, // 配置更新失败
};
//# sourceMappingURL=index.js.map