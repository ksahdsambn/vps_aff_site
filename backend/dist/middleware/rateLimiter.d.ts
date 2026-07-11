/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
export declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 登录专用限速器
 *
 * 组合计数策略：按 `IP + username` 作为限速 key。
 * - 即使攻击者伪造 X-Forwarded-For 绕过 IP 维度，同一用户名的爆破仍受 5 次/15 分钟限制。
 * - 正常用户即使与他人共享出口 IP（NAT），各自的用户名独立计数，不会互相误伤。
 *
 * 上限：每个 (IP, username) 组合每 15 分钟 5 次请求。
 */
export declare const loginLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map