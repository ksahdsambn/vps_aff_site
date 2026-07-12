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
 * - 通过 Prisma 模型访问，避免手写 SQL。
 * - 吊销表不可用或数据库故障时抛出错误；认证层必须 fail-closed。
 * - 过期记录由 revokeToken 在写入时顺带清理（轻量 GC）。
 */

import { prisma } from './db';

interface RevokedTokenRow {
  jti: string;
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
  await prisma.$transaction([
    // Tagged SQL binds every value as a parameter; no untrusted value is interpolated into SQL text.
    prisma.$executeRaw`INSERT IGNORE INTO \`RevokedToken\` (\`jti\`, \`adminId\`, \`expiresAt\`, \`revokedAt\`) VALUES (${jti}, ${adminId}, ${expiresAt}, NOW(3))`,
    // 顺带清理已过期的吊销记录（轻量 GC，每次吊销时执行）。
    prisma.$executeRaw`DELETE FROM \`RevokedToken\` WHERE \`expiresAt\` < NOW(3)`,
  ]);
}

/**
 * 判断一个 token 是否已被吊销。
 *
 * 数据库或迁移不可用时抛出错误，由认证层返回 503 并拒绝请求。
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  if (!jti) {
    return false;
  }
  const rows = await prisma.$queryRaw<RevokedTokenRow[]>`
    SELECT \`jti\` FROM \`RevokedToken\` WHERE \`jti\` = ${jti} LIMIT 1
  `;
  return rows.length > 0;
}
