import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/secrets';
import { isTokenRevoked } from '../utils/tokenRevocation';
import { prisma } from '../utils/db';

// 扩展 Request 接口以包含 admin 属性
export interface AuthRequest extends Request {
  admin?: {
    adminId: number;
    username: string;
  };
}

/**
 * JWT 认证中间件
 * 从 Authorization: Bearer <token> 提取并验证 Token
 * 验证成功将管理员信息挂载到 req.admin
 * 验证失败返回 401
 *
 * 校验流程：
 * 1. 提取 Bearer token
 * 2. jwt.verify 验证签名 + 过期（显式限定 HS256）
 * 3. 查询 RevokedToken 表，确认该 token 未被服务端吊销（logout / 强制下线）
 */
export async function auth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未登录或Token缺失',
    });
    return;
  }

  const token = authHeader.substring(7); // 去掉 "Bearer " 前缀

  let decoded: { adminId: number; username: string; jti?: string };
  try {
    decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as {
      adminId: number;
      username: string;
      jti?: string;
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

  // 服务端吊销校验：若 jti 在 RevokedToken 表中，拒绝（即使签名有效）。
  if (decoded.jti && await isTokenRevoked(decoded.jti)) {
    res.status(401).json({
      code: 401,
      message: '会话已失效，请重新登录',
    });
    return;
  }

  // 管理员存在性校验：确认 token 中的 adminId 仍对应一个有效账号。
  // 防止已删除/禁用的管理员凭旧 token 继续访问。
  // 仅 select id，开销极小。
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
  } catch {
    // DB 不可达时不阻断认证（降级为仅校验签名），避免 DB 抖动锁死管理员。
  }

  req.admin = {
    adminId: decoded.adminId,
    username: decoded.username,
  };

  next();
}
