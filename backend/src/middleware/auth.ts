import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
 */
export function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未登录或Token缺失',
    });
    return;
  }

  const token = authHeader.substring(7); // 去掉 "Bearer " 前缀

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: number;
      username: string;
    };

    req.admin = {
      adminId: decoded.adminId,
      username: decoded.username,
    };

    next();
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
}
