import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/secrets';
import { isTokenRevoked } from '../utils/tokenRevocation';
import { prisma } from '../utils/db';
import { getAdminSessionToken } from '../utils/sessionCookie';
import { logError } from '../utils/logError';

// 扩展 Request 接口以包含 admin 属性
export interface AuthRequest extends Request {
  admin?: {
    adminId: number;
    username: string;
    expiresAt: number;
    jti: string;
  };
}

/**
 * JWT 认证中间件
 * 从 HttpOnly session Cookie（或显式 Bearer token）提取并验证 Token
 * 验证成功将管理员信息挂载到 req.admin
 * 验证失败返回 401
 *
 * 校验流程：
 * 1. 提取会话 token
 * 2. jwt.verify 验证签名 + 过期（显式限定 HS256）
 * 3. 查询 RevokedToken 表，确认该 token 未被服务端吊销（logout / 强制下线）
 */
export async function auth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = getAdminSessionToken(req);
  if (!token) {
    res.status(401).json({
      code: 401,
      message: '未登录或Token缺失',
    });
    return;
  }

  let decoded: { adminId: number; username: string; jti?: string; exp?: number };
  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as {
      adminId: number;
      username: string;
      jti?: string;
      exp?: number;
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        code: 401,
        message: 'Token已过期，请重新登录',
      });
      return;
    }

    res.status(401).json({
      code: 401,
      message: 'Token无效',
    });
    return;
  }

  // 所有新会话必须带 jti/exp，缺失的旧 token 不能绕过服务端吊销机制。
  if (!decoded.jti || !decoded.exp) {
    res.status(401).json({ code: 401, message: 'Token无效' });
    return;
  }

  // 服务端吊销校验：依赖不可用时拒绝认证，绝不降级放行。
  try {
    if (await isTokenRevoked(decoded.jti)) {
      res.status(401).json({
        code: 401,
        message: '会话已失效，请重新登录',
      });
      return;
    }
  } catch (error) {
    logError('[security] Token revocation check failed', error);
    res.status(503).json({ code: 503, message: '认证服务暂不可用，请稍后再试' });
    return;
  }

  // 管理员存在性校验：确认 token 中的 adminId 仍对应一个有效账号。
  // 防止已删除/禁用的管理员凭旧 token 继续访问。
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      select: { id: true },
    });
    if (!admin) {
      res.status(401).json({
        code: 401,
        message: '账号不存在，请重新登录',
      });
      return;
    }
  } catch (error) {
    logError('[security] Admin account check failed', error);
    res.status(503).json({ code: 503, message: '认证服务暂不可用，请稍后再试' });
    return;
  }

  req.admin = {
    adminId: decoded.adminId,
    username: decoded.username,
    expiresAt: decoded.exp * 1000,
    jti: decoded.jti,
  };

  next();
}
