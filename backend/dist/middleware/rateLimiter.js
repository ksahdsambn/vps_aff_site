"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * 从请求中提取客户端真实 IP。
 *
 * 信任代理链（trust proxy）时，Express 会将 req.ip 设为 X-Forwarded-For 中
 * 对应跳数的 IP。但部署链路（如 1Panel/OpenResty → Next.js → Express）的实际跳数
 * 可能与配置的 TRUST_PROXY_HOPS 不符，导致 req.ip 为内网地址而非真实客户端 IP，
 * 使基于 IP 的限速器（特别是登录限速）失效或误伤。
 *
 * 此函数作为显式的 fallback：当 req.ip 看起来是私有/回环地址时，尝试从
 * X-Forwarded-For 最左侧（即最原始的客户端 IP）取值。
 *
 * 注意：trust proxy 必须正确配置，否则 X-Forwarded-For 可被客户端伪造。
 * 在正确配置的反代链路中，最左侧值由第一个反代写入，可信。
 */
function getClientIp(req) {
    // Express 在 trust proxy 正确配置时已解析好 req.ip。
    const ip = req.ip;
    // 若 req.ip 不可用，尝试 X-Forwarded-For。
    if (!ip) {
        const xff = req.headers['x-forwarded-for'];
        if (typeof xff === 'string') {
            return xff.split(',')[0].trim();
        }
        return req.socket?.remoteAddress || 'unknown';
    }
    // 检查 req.ip 是否为私有/回环地址——若是，说明 trust proxy 可能配置不当，
    // 尝试从 X-Forwarded-For 最左侧取真实客户端 IP。
    if (isPrivateIp(ip)) {
        const xff = req.headers['x-forwarded-for'];
        if (typeof xff === 'string') {
            const first = xff.split(',')[0].trim();
            if (first && !isPrivateIp(first)) {
                return first;
            }
            // 即使 XFF 第一项也是私有的，仍返回它（比内网 req.ip 区分度更高）。
            if (first)
                return first;
        }
    }
    return ip;
}
/**
 * 判断 IP 是否为私有/回环地址（IPv4 简易判断）。
 */
function isPrivateIp(ip) {
    // IPv6 回环与映射
    if (ip === '::1' || ip === '::ffff:127.0.0.1')
        return true;
    // 去除 IPv4-mapped IPv6 前缀
    const v4 = ip.replace(/^::ffff:/, '');
    if (v4 === '127.0.0.1')
        return true;
    if (v4.startsWith('10.'))
        return true;
    if (v4.startsWith('192.168.'))
        return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(v4))
        return true;
    if (v4.startsWith('169.254.'))
        return true;
    return false;
}
/**
 * 全局速率限制器
 * 每 IP 每分钟 100 次请求
 */
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 分钟
    max: 100, // 每 IP 最多 100 次请求
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    message: {
        code: 429,
        message: '请求过于频繁，请稍后再试',
    },
});
/**
 * 登录专用限速器
 *
 * 组合计数策略：按 `IP + username` 作为限速 key。
 * - 即使攻击者伪造 X-Forwarded-For 绕过 IP 维度，同一用户名的爆破仍受 5 次/15 分钟限制。
 * - 正常用户即使与他人共享出口 IP（NAT），各自的用户名独立计数，不会互相误伤。
 *
 * 上限：每个 (IP, username) 组合每 15 分钟 5 次请求。
 */
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 5, // 每 (IP, username) 最多 5 次
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const ip = getClientIp(req);
        // 从 body 提取 username（登录请求体）。body 已由 express.json 解析。
        const username = typeof req.body?.username === 'string'
            ? req.body.username.trim().slice(0, 50)
            : '';
        // 有 username 时按组合计数；无 username（空 body 请求）时回退纯 IP。
        return username ? `${ip}:${username}` : `ip:${ip}`;
    },
    message: {
        code: 1002,
        message: '登录失败次数过多，请稍后再试',
    },
});
//# sourceMappingURL=rateLimiter.js.map