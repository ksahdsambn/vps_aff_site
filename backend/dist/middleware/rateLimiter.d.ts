import type { Request } from 'express';
/**
 * 从 Express 已按 `trust proxy` 规则解析的 req.ip 获取客户端地址。
 *
 * 不手工读取 X-Forwarded-For：该头可由客户端伪造，必须由 Express 根据
 * 明确配置的可信代理跳数解析。生产环境缺失 TRUST_PROXY_HOPS 会在 app 启动时失败。
 */
export declare function getClientIp(req: Request): string;
/** 标准化 IPv6 子网，避免同一 IPv6 客户端通过地址轮换绕过限速。 */
export declare function getClientIpKey(req: Request): string;
/** 登录名统一限速 key，避免变换伪造 IP 后重置同一账号的失败计数。 */
export declare function getLoginUsernameKey(req: Request): string;
/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
export declare const globalLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * 登录专用限速器
 *
 * 按用户名限速。与 loginIpLimiter 组合使用，确保伪造或频繁变换 IP 时，
 * 同一管理员账号仍只允许 5 次失败尝试。
 */
export declare const loginUsernameLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** 登录来源限速，防止单一客户端枚举大量用户名。 */
export declare const loginIpLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map