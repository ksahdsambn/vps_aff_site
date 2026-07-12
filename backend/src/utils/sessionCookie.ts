import type { CookieOptions, Request } from 'express';

export const ADMIN_SESSION_COOKIE = 'admin_session';

const isProduction = process.env.NODE_ENV === 'production';

/** Cookie is scoped to the admin API and is never readable from browser JavaScript. */
export const adminSessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/api/admin',
};

export function getAdminSessionToken(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.substring(7);
  }
  return readAdminSessionCookie(req);
}

/**
 * 仅从 Cookie 中读取管理员会话 token，忽略 Authorization 头。
 *
 * `getAdminSessionToken` 优先 Bearer token（便于 API 客户端）；
 * CSRF 校验只需判断浏览器是否会自动携带的 Cookie，故单独提取此读取路径，
 * 不必构造合成请求来剥离 Authorization 头。
 */
export function readAdminSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookie = cookieHeader.split(';').find((item) => {
    const [key] = item.trim().split('=', 1);
    return key === ADMIN_SESSION_COOKIE;
  });
  if (!cookie) return null;

  const separator = cookie.indexOf('=');
  if (separator < 0) return null;
  try {
    return decodeURIComponent(cookie.slice(separator + 1)) || null;
  } catch {
    return null;
  }
}

/**
 * 是否存在管理员会话 Cookie（用于 CSRF 写操作校验）。
 *
 * Cookie 由浏览器随跨站/同站请求自动携带，是判断"是否需要 Origin 校验"的可靠信号。
 * 仅看 Cookie、忽略 Authorization，与 `getAdminSessionToken` 的优先级语义解耦。
 */
export function hasAdminSessionCookie(req: Request): boolean {
  return readAdminSessionCookie(req) !== null;
}
