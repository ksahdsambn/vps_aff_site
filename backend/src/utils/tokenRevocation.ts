/**
 * JWT 服务端吊销机制。
 *
 * 解决的问题：原实现中 JWT 一旦签发，在有效期内（30 分钟）无法从服务端使其失效。
 * 攻击者若通过 XSS / 日志泄露获取有效 token，管理员无法通过"登出"或"改密码"强制下线。
 *
 * 方案：在 DB 中维护 `RevokedToken` 表，记录被吊销 token 的 jti（JWT Unique ID）。
 * auth 中间件在签名校验通过后，额外查询此表——若 jti 存在则拒绝。
 *
 * 实现说明：
 * - 通过 Prisma 的 `$queryRawUnsafe` / `$executeRawUnsafe` 访问，不依赖重新生成的客户端
 *   （RevokedToken 模型仅声明在 schema.prisma 中保持文档同步，但运行时不通过它访问）。
 * - 表不存在时（migration 未执行）自动降级为"不启用吊销"并打印一次警告，避免启动崩溃。
 * - 过期记录可由 revokeToken 在写入时顺带清理（轻量 GC）。
 */

import { prisma } from './db';
import { logError } from './logError';

interface RevokedTokenRow {
  jti: string;
}

let tableAvailable: boolean | null = null;

/**
 * 检测 RevokedToken 表是否存在。结果在进程生命周期内缓存。
 *
 * 检测失败（表不存在 / DB 不可达）时降级为 false，吊销功能静默关闭，
 * 应用仍可正常运行（退化为原有"无服务端失效"行为）。
 */
async function ensureTableAvailable(): Promise<boolean> {
  if (tableAvailable !== null) {
    return tableAvailable;
  }
  try {
    await prisma.$queryRawUnsafe(
      'SELECT 1 FROM `RevokedToken` LIMIT 1',
    );
    tableAvailable = true;
  } catch {
    console.warn(
      '[security] RevokedToken 表不存在或不可访问，JWT 吊销机制已降级关闭。请执行 migration 以启用。',
    );
    tableAvailable = false;
  }
  return tableAvailable;
}

/**
 * 生成一个 token 唯一标识（用于 JWT jti claim）。
 * 使用 crypto.randomUUID（Node 16+），格式如 `xxxxxxxx-xxxx-...`（36 字符）。
 */
export function generateJti(): string {
  return crypto.randomUUID();
}

/**
 * 吊销一个 token（记录其 jti）。
 *
 * @param jti       JWT 的 jti claim。
 * @param adminId   签发给的管理员 ID。
 * @param expiresAt token 的原始过期时间（过期后记录可被清理）。
 */
export async function revokeToken(
  jti: string,
  adminId: number,
  expiresAt: Date,
): Promise<void> {
  if (!(await ensureTableAvailable())) {
    return;
  }
  try {
    await prisma.$executeRawUnsafe(
      'INSERT IGNORE INTO `RevokedToken` (`jti`, `adminId`, `expiresAt`, `revokedAt`) VALUES (?, ?, ?, NOW(3))',
      jti,
      adminId,
      expiresAt,
    );
    // 顺带清理已过期的吊销记录（轻量 GC，每次吊销时执行）。
    await prisma.$executeRawUnsafe(
      'DELETE FROM `RevokedToken` WHERE `expiresAt` < NOW(3)',
    );
  } catch (error) {
    // 吊销写入失败不应阻断登出流程（客户端已清除 token），仅记录。
    logError('[security] Failed to record token revocation', error);
  }
}

/**
 * 判断一个 token 是否已被吊销。
 *
 * 表不可用时返回 false（降级），不阻断认证。
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!jti) {
    return false;
  }
  if (!(await ensureTableAvailable())) {
    return false;
  }
  try {
    const rows = await prisma.$queryRawUnsafe<RevokedTokenRow[]>(
      'SELECT `jti` FROM `RevokedToken` WHERE `jti` = ? LIMIT 1',
      jti,
    );
    return rows.length > 0;
  } catch {
    // 查询失败时降级为"未吊销"，避免 DB 抖动导致全员被锁。
    return false;
  }
}
