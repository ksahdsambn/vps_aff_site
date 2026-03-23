/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
export declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 登录专用限速器
 * 每 IP 每 15 分钟最多 5 次登录尝试
 */
export declare const loginLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map